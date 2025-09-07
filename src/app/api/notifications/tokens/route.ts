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

interface FCMTokenData {
  token: string
  deviceType: 'web' | 'android' | 'ios'
  deviceInfo?: {
    userAgent?: string
    platform?: string
    version?: string
  }
}

// Registrar/Atualizar token FCM
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
    
    const { token: fcmToken, deviceType, deviceInfo }: FCMTokenData = await request.json()

    // Validar dados obrigatórios
    if (!fcmToken || !deviceType) {
      return NextResponse.json(
        { error: 'Token FCM e tipo de dispositivo são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o token já existe
    const existingTokenQuery = await db
      .collection('fcm_tokens')
      .where('token', '==', fcmToken)
      .get()

    if (!existingTokenQuery.empty) {
      // Atualizar token existente
      const existingTokenDoc = existingTokenQuery.docs[0]
      await existingTokenDoc.ref.update({
        userId: decodedToken.uid,
        deviceType,
        deviceInfo: deviceInfo || {},
        lastUsed: new Date(),
        enabled: true,
        updatedAt: new Date(),
      })

      return NextResponse.json({
        message: 'Token FCM atualizado com sucesso',
        tokenId: existingTokenDoc.id,
      })
    }

    // Desabilitar tokens antigos do mesmo usuário e dispositivo
    const oldTokensQuery = await db
      .collection('fcm_tokens')
      .where('userId', '==', decodedToken.uid)
      .where('deviceType', '==', deviceType)
      .get()

    const batch = db.batch()
    oldTokensQuery.docs.forEach(doc => {
      batch.update(doc.ref, { enabled: false })
    })
    await batch.commit()

    // Criar novo token
    const newTokenRef = await db.collection('fcm_tokens').add({
      token: fcmToken,
      userId: decodedToken.uid,
      deviceType,
      deviceInfo: deviceInfo || {},
      enabled: true,
      createdAt: new Date(),
      lastUsed: new Date(),
    })

    return NextResponse.json({
      message: 'Token FCM registrado com sucesso',
      tokenId: newTokenRef.id,
    })

  } catch (error: any) {
    console.error('Erro ao registrar token FCM:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

// Listar tokens do usuário
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
    
    // Buscar tokens do usuário
    const tokensQuery = await db
      .collection('fcm_tokens')
      .where('userId', '==', decodedToken.uid)
      .orderBy('lastUsed', 'desc')
      .get()

    const tokens = tokensQuery.docs.map(doc => ({
      id: doc.id,
      deviceType: doc.data().deviceType,
      deviceInfo: doc.data().deviceInfo,
      enabled: doc.data().enabled,
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      lastUsed: doc.data().lastUsed?.toDate()?.toISOString(),
      // Não retornar o token real por segurança
      tokenPreview: doc.data().token?.substring(0, 20) + '...',
    }))

    return NextResponse.json({
      tokens,
      total: tokens.length,
      active: tokens.filter(t => t.enabled).length,
    })

  } catch (error: any) {
    console.error('Erro ao buscar tokens FCM:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

// Desabilitar token específico
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
    const tokenId = searchParams.get('tokenId')
    const fcmToken = searchParams.get('token')

    if (!tokenId && !fcmToken) {
      return NextResponse.json(
        { error: 'ID do token ou token FCM é obrigatório' },
        { status: 400 }
      )
    }

    let tokenDoc
    
    if (tokenId) {
      // Buscar por ID
      tokenDoc = await db.collection('fcm_tokens').doc(tokenId).get()
    } else if (fcmToken) {
      // Buscar por token FCM
      const tokenQuery = await db
        .collection('fcm_tokens')
        .where('token', '==', fcmToken)
        .get()
      
      if (!tokenQuery.empty) {
        tokenDoc = tokenQuery.docs[0]
      }
    }

    if (!tokenDoc || !tokenDoc.exists) {
      return NextResponse.json(
        { error: 'Token não encontrado' },
        { status: 404 }
      )
    }

    const tokenData = tokenDoc.data()
    
    // Verificar se o token pertence ao usuário (ou se é admin)
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()
    const isAdmin = userData?.role === 'admin'
    
    if (tokenData?.userId !== decodedToken.uid && !isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    // Desabilitar token
    await tokenDoc.ref.update({
      enabled: false,
      disabledAt: new Date(),
      disabledBy: decodedToken.uid,
    })

    return NextResponse.json({
      message: 'Token FCM desabilitado com sucesso',
    })

  } catch (error: any) {
    console.error('Erro ao desabilitar token FCM:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

// Atualizar configurações de notificação
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
    
    const { preferences } = await request.json()

    // Validar preferências
    const validTypes = ['appointment', 'payment', 'taxi_dog', 'general', 'promotion']
    const validatedPreferences: Record<string, boolean> = {}
    
    for (const [type, enabled] of Object.entries(preferences)) {
      if (validTypes.includes(type) && typeof enabled === 'boolean') {
        validatedPreferences[type] = enabled
      }
    }

    // Atualizar preferências do usuário
    await db.collection('users').doc(decodedToken.uid).update({
      notificationPreferences: validatedPreferences,
      updatedAt: new Date(),
    })

    // Atualizar tokens FCM do usuário com as novas preferências
    const tokensQuery = await db
      .collection('fcm_tokens')
      .where('userId', '==', decodedToken.uid)
      .where('enabled', '==', true)
      .get()

    const batch = db.batch()
    tokensQuery.docs.forEach(doc => {
      batch.update(doc.ref, {
        preferences: validatedPreferences,
        updatedAt: new Date(),
      })
    })
    await batch.commit()

    return NextResponse.json({
      message: 'Preferências de notificação atualizadas com sucesso',
      preferences: validatedPreferences,
    })

  } catch (error: any) {
    console.error('Erro ao atualizar preferências:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}