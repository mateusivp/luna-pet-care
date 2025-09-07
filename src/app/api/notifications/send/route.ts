import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
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
const messaging = getMessaging()

interface NotificationData {
  title: string
  body: string
  userId?: string
  userIds?: string[]
  role?: 'admin' | 'client'
  type: 'appointment' | 'payment' | 'taxi_dog' | 'general' | 'promotion'
  data?: Record<string, string>
  imageUrl?: string
  actionUrl?: string
  priority?: 'high' | 'normal' | 'low'
  scheduledTime?: string // ISO string
}

interface FCMToken {
  token: string
  userId: string
  deviceType: 'web' | 'android' | 'ios'
  lastUsed: Date
  enabled: boolean
}

export async function POST(request: NextRequest) {
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
    
    // Verificar se é admin para notificações em massa
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()
    const isAdmin = userData?.role === 'admin'

    const notificationData: NotificationData = await request.json()

    // Validar dados obrigatórios
    if (!notificationData.title || !notificationData.body || !notificationData.type) {
      return NextResponse.json(
        { error: 'Título, corpo e tipo da notificação são obrigatórios' },
        { status: 400 }
      )
    }

    // Determinar destinatários
    let targetUserIds: string[] = []
    
    if (notificationData.userId) {
      // Notificação para usuário específico
      targetUserIds = [notificationData.userId]
    } else if (notificationData.userIds) {
      // Notificação para múltiplos usuários
      targetUserIds = notificationData.userIds
    } else if (notificationData.role && isAdmin) {
      // Notificação para todos os usuários de um role (apenas admin)
      const usersQuery = await db
        .collection('users')
        .where('role', '==', notificationData.role)
        .get()
      
      targetUserIds = usersQuery.docs.map(doc => doc.id)
    } else if (isAdmin) {
      // Notificação para todos os usuários (apenas admin)
      const usersQuery = await db.collection('users').get()
      targetUserIds = usersQuery.docs.map(doc => doc.id)
    } else {
      // Usuários não-admin só podem enviar para si mesmos
      targetUserIds = [decodedToken.uid]
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum destinatário encontrado' },
        { status: 400 }
      )
    }

    // Buscar tokens FCM dos usuários
    const fcmTokensQuery = await db
      .collection('fcm_tokens')
      .where('userId', 'in', targetUserIds.slice(0, 10)) // Firestore limit
      .where('enabled', '==', true)
      .get()

    const fcmTokens: FCMToken[] = fcmTokensQuery.docs.map(doc => ({
      token: doc.data().token,
      userId: doc.data().userId,
      deviceType: doc.data().deviceType,
      lastUsed: doc.data().lastUsed?.toDate(),
      enabled: doc.data().enabled,
    }))

    if (fcmTokens.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum token FCM ativo encontrado para os destinatários' },
        { status: 400 }
      )
    }

    // Preparar mensagem FCM
    const fcmMessage = {
      notification: {
        title: notificationData.title,
        body: notificationData.body,
        ...(notificationData.imageUrl && { imageUrl: notificationData.imageUrl }),
      },
      data: {
        type: notificationData.type,
        ...(notificationData.actionUrl && { actionUrl: notificationData.actionUrl }),
        ...(notificationData.data || {}),
      },
      android: {
        priority: notificationData.priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: `luna_${notificationData.type}`,
          priority: notificationData.priority === 'high' ? 'high' : 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notificationData.title,
              body: notificationData.body,
            },
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          title: notificationData.title,
          body: notificationData.body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...(notificationData.imageUrl && { image: notificationData.imageUrl }),
          requireInteraction: notificationData.priority === 'high',
          actions: notificationData.actionUrl ? [
            {
              action: 'open',
              title: 'Abrir',
            },
          ] : undefined,
        },
        fcmOptions: {
          link: notificationData.actionUrl,
        },
      },
    }

    // Enviar notificações
    const results = await Promise.allSettled(
      fcmTokens.map(async (fcmToken) => {
        try {
          const result = await messaging.send({
            ...fcmMessage,
            token: fcmToken.token,
          })

          // Salvar notificação no Firestore
          await db.collection('notifications').add({
            userId: fcmToken.userId,
            title: notificationData.title,
            body: notificationData.body,
            type: notificationData.type,
            data: notificationData.data || {},
            imageUrl: notificationData.imageUrl,
            actionUrl: notificationData.actionUrl,
            priority: notificationData.priority || 'normal',
            read: false,
            fcmMessageId: result,
            createdAt: new Date(),
            createdBy: decodedToken.uid,
          })

          return { success: true, userId: fcmToken.userId, messageId: result }
        } catch (error: any) {
          // Se o token é inválido, desabilitar
          if (error.code === 'messaging/registration-token-not-registered' ||
              error.code === 'messaging/invalid-registration-token') {
            await db
              .collection('fcm_tokens')
              .where('token', '==', fcmToken.token)
              .get()
              .then(snapshot => {
                snapshot.docs.forEach(doc => {
                  doc.ref.update({ enabled: false })
                })
              })
          }

          return { 
            success: false, 
            userId: fcmToken.userId, 
            error: error.message 
          }
        }
      })
    )

    // Processar resultados
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length
    
    const failed = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && !result.value.success)
    ).length

    // Log da operação
    await db.collection('notification_logs').add({
      sentBy: decodedToken.uid,
      title: notificationData.title,
      type: notificationData.type,
      targetUserIds,
      tokensFound: fcmTokens.length,
      successful,
      failed,
      timestamp: new Date(),
    })

    return NextResponse.json({
      message: 'Notificações processadas',
      stats: {
        targetUsers: targetUserIds.length,
        tokensFound: fcmTokens.length,
        successful,
        failed,
      },
      results: results.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: 'Promise rejected' }
      ),
    })

  } catch (error: any) {
    console.error('Erro ao enviar notificações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

// Endpoint para agendar notificações
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    // Verificar se é admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()
    
    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const notificationData: NotificationData = await request.json()

    if (!notificationData.scheduledTime) {
      return NextResponse.json(
        { error: 'Hora agendada é obrigatória' },
        { status: 400 }
      )
    }

    // Salvar notificação agendada
    const scheduledNotification = await db.collection('scheduled_notifications').add({
      ...notificationData,
      scheduledTime: new Date(notificationData.scheduledTime),
      createdBy: decodedToken.uid,
      createdAt: new Date(),
      status: 'pending',
    })

    return NextResponse.json({
      message: 'Notificação agendada com sucesso',
      id: scheduledNotification.id,
    })

  } catch (error: any) {
    console.error('Erro ao agendar notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}