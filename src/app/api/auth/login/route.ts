import { NextRequest, NextResponse } from 'next/server'
import { signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, idToken, type = 'email' } = body

    let firebaseUser: any
    let userRecord: any

    if (type === 'google' && idToken) {
      // Verificar token do Google
      const decodedToken = await adminAuth.verifyIdToken(idToken)
      userRecord = await adminAuth.getUser(decodedToken.uid)
      firebaseUser = {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL
      }
    } else if (type === 'email' && email && password) {
      // Login com email e senha
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      firebaseUser = userCredential.user
      userRecord = await adminAuth.getUser(firebaseUser.uid)
    } else {
      return NextResponse.json(
        { error: 'Dados de login inválidos' },
        { status: 400 }
      )
    }

    // Buscar dados do usuário no Firestore
    const userDoc = await adminDb.collection('users').doc(firebaseUser.uid).get()
    let userData = userDoc.data()

    // Se o usuário não existe no Firestore, criar
    if (!userData) {
      userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        role: 'client', // role padrão
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await adminDb.collection('users').doc(firebaseUser.uid).set(userData)
    }

    // Obter custom claims
    const customClaims = userRecord.customClaims || {}

    // Criar JWT token
    const token = await new SignJWT({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      role: userData.role,
      customClaims
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Configurar cookie
    const cookieStore = cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    })

    // Atualizar último login
    await adminDb.collection('users').doc(firebaseUser.uid).update({
      lastLoginAt: new Date(),
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: userData.name,
        photoURL: userData.photoURL,
        role: userData.role,
        status: userData.status
      },
      token
    })

  } catch (error: any) {
    console.error('Erro no login:', error)
    
    let errorMessage = 'Erro interno do servidor'
    let statusCode = 500

    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Email ou senha incorretos'
          statusCode = 401
          break
        case 'auth/user-disabled':
          errorMessage = 'Conta desabilitada'
          statusCode = 403
          break
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde'
          statusCode = 429
          break
        case 'auth/invalid-email':
          errorMessage = 'Email inválido'
          statusCode = 400
          break
        default:
          errorMessage = error.message
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}