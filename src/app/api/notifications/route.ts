import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Inicializar Firebase Admin se ainda não foi inicializado
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

// Buscar notificações do usuário
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const type = searchParams.get('type')
    const unreadOnly = searchParams.get('unread') === 'true'
    const priority = searchParams.get('priority')

    // Construir query base
    let query = db
      .collection('notifications')
      .where('userId', '==', decodedToken.uid)

    // Aplicar filtros
    if (type) {
      query = query.where('type', '==', type)
    }

    if (unreadOnly) {
      query = query.where('read', '==', false)
    }

    if (priority) {
      query = query.where('priority', '==', priority)
    }

    // Ordenar por data de criação (mais recentes primeiro)
    query = query.orderBy('createdAt', 'desc')

    // Aplicar paginação
    const offset = (page - 1) * limit
    if (offset > 0) {
      const offsetQuery = await query.limit(offset).get()
      if (!offsetQuery.empty) {
        const lastDoc = offsetQuery.docs[offsetQuery.docs.length - 1]
        query = query.startAfter(lastDoc)
      }
    }

    const notificationsSnapshot = await query.limit(limit).get()

    // Buscar contagem total (para paginação)
    const countQuery = db
      .collection('notifications')
      .where('userId', '==', decodedToken.uid)
    
    let totalQuery = countQuery
    if (type) totalQuery = totalQuery.where('type', '==', type)
    if (unreadOnly) totalQuery = totalQuery.where('read', '==', false)
    if (priority) totalQuery = totalQuery.where('priority', '==', priority)
    
    const totalSnapshot = await totalQuery.get()
    const total = totalSnapshot.size

    // Formatar notificações
    const notifications = notificationsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        body: data.body,
        type: data.type,
        priority: data.priority || 'normal',
        read: data.read || false,
        imageUrl: data.imageUrl,
        actionUrl: data.actionUrl,
        data: data.data || {},
        createdAt: data.createdAt?.toDate()?.toISOString(),
        readAt: data.readAt?.toDate()?.toISOString(),
      }
    })

    // Estatísticas
    const unreadCount = await db
      .collection('notifications')
      .where('userId', '==', decodedToken.uid)
      .where('read', '==', false)
      .get()
      .then(snapshot => snapshot.size)

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      stats: {
        total,
        unread: unreadCount,
        read: total - unreadCount,
      },
    })

  } catch (error: any) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

// Marcar notificação como lida
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    const { notificationId, notificationIds, markAllAsRead } = await request.json()

    if (markAllAsRead) {
      // Marcar todas as notificações como lidas
      const unreadNotifications = await db
        .collection('notifications')
        .where('userId', '==', decodedToken.uid)
        .where('read', '==', false)
        .get()

      const batch = db.batch()
      unreadNotifications.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: new Date(),
        })
      })
      await batch.commit()

      return NextResponse.json({
        message: `${unreadNotifications.size} notificações marcadas como lidas`,
        count: unreadNotifications.size,
      })
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      // Marcar múltiplas notificações como lidas
      const batch = db.batch()
      
      for (const id of notificationIds) {
        const notificationRef = db.collection('notifications').doc(id)
        const notificationDoc = await notificationRef.get()
        
        if (notificationDoc.exists && notificationDoc.data()?.userId === decodedToken.uid) {
          batch.update(notificationRef, {
            read: true,
            readAt: new Date(),
          })
        }
      }
      
      await batch.commit()

      return NextResponse.json({
        message: `${notificationIds.length} notificações processadas`,
        count: notificationIds.length,
      })
    }

    if (notificationId) {
      // Marcar notificação específica como lida
      const notificationRef = db.collection('notifications').doc(notificationId)
      const notificationDoc = await notificationRef.get()

      if (!notificationDoc.exists) {
        return NextResponse.json(
          { error: 'Notificação não encontrada' },
          { status: 404 }
        )
      }

      const notificationData = notificationDoc.data()
      if (notificationData?.userId !== decodedToken.uid) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        )
      }

      await notificationRef.update({
        read: true,
        readAt: new Date(),
      })

      return NextResponse.json({
        message: 'Notificação marcada como lida',
        notificationId,
      })
    }

    return NextResponse.json(
      { error: 'ID da notificação é obrigatório' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Erro ao marcar notificação como lida:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

// Deletar notificação
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')
    const deleteAll = searchParams.get('all') === 'true'
    const deleteRead = searchParams.get('read') === 'true'

    if (deleteAll) {
      // Deletar todas as notificações do usuário
      const userNotifications = await db
        .collection('notifications')
        .where('userId', '==', decodedToken.uid)
        .get()

      const batch = db.batch()
      userNotifications.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      await batch.commit()

      return NextResponse.json({
        message: `${userNotifications.size} notificações deletadas`,
        count: userNotifications.size,
      })
    }

    if (deleteRead) {
      // Deletar apenas notificações lidas
      const readNotifications = await db
        .collection('notifications')
        .where('userId', '==', decodedToken.uid)
        .where('read', '==', true)
        .get()

      const batch = db.batch()
      readNotifications.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      await batch.commit()

      return NextResponse.json({
        message: `${readNotifications.size} notificações lidas deletadas`,
        count: readNotifications.size,
      })
    }

    if (notificationId) {
      // Deletar notificação específica
      const notificationRef = db.collection('notifications').doc(notificationId)
      const notificationDoc = await notificationRef.get()

      if (!notificationDoc.exists) {
        return NextResponse.json(
          { error: 'Notificação não encontrada' },
          { status: 404 }
        )
      }

      const notificationData = notificationDoc.data()
      if (notificationData?.userId !== decodedToken.uid) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        )
      }

      await notificationRef.delete()

      return NextResponse.json({
        message: 'Notificação deletada com sucesso',
        notificationId,
      })
    }

    return NextResponse.json(
      { error: 'Parâmetro de deleção é obrigatório' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Erro ao deletar notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}