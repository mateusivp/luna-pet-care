import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Token não encontrado', authenticated: false },
        { status: 401 }
      )
    }

    // Verificar e decodificar o token JWT
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const uid = payload.uid as string

    // Verificar se o token não expirou
    if (payload.exp && payload.exp < Date.now() / 1000) {
      cookieStore.delete('auth-token')
      return NextResponse.json(
        { error: 'Token expirado', authenticated: false },
        { status: 401 }
      )
    }

    // Buscar dados atualizados do usuário no Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get()
    
    if (!userDoc.exists) {
      cookieStore.delete('auth-token')
      return NextResponse.json(
        { error: 'Usuário não encontrado', authenticated: false },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    
    // Verificar se o usuário está ativo
    if (userData?.status !== 'active') {
      cookieStore.delete('auth-token')
      return NextResponse.json(
        { error: 'Conta desabilitada', authenticated: false },
        { status: 403 }
      )
    }

    // Obter custom claims atualizados do Firebase Auth
    const userRecord = await adminAuth.getUser(uid)
    const customClaims = userRecord.customClaims || {}

    return NextResponse.json({
      authenticated: true,
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        photoURL: userData.photoURL,
        role: userData.role,
        status: userData.status,
        customClaims,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt
      }
    })

  } catch (error: any) {
    console.error('Erro ao verificar autenticação:', error)
    
    // Se o token é inválido, remover cookie
    const cookieStore = cookies()
    cookieStore.delete('auth-token')

    return NextResponse.json(
      { error: 'Token inválido', authenticated: false },
      { status: 401 }
    )
  }
}

// Método POST para refresh do token (opcional)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Token não encontrado' },
        { status: 401 }
      )
    }

    // Verificar token atual
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const uid = payload.uid as string

    // Buscar dados atualizados
    const userDoc = await adminDb.collection('users').doc(uid).get()
    const userData = userDoc.data()
    
    if (!userData || userData.status !== 'active') {
      cookieStore.delete('auth-token')
      return NextResponse.json(
        { error: 'Usuário inválido' },
        { status: 403 }
      )
    }

    // Obter custom claims atualizados
    const userRecord = await adminAuth.getUser(uid)
    const customClaims = userRecord.customClaims || {}

    // Criar novo token com dados atualizados
    const { SignJWT } = await import('jose')
    const newToken = await new SignJWT({
      uid: userData.uid,
      email: userData.email,
      role: userData.role,
      customClaims
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Atualizar cookie
    cookieStore.set('auth-token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    })

    return NextResponse.json({
      success: true,
      token: newToken,
      user: {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        photoURL: userData.photoURL,
        role: userData.role,
        status: userData.status,
        customClaims
      }
    })

  } catch (error: any) {
    console.error('Erro ao renovar token:', error)
    
    const cookieStore = cookies()
    cookieStore.delete('auth-token')

    return NextResponse.json(
      { error: 'Erro ao renovar token' },
      { status: 500 }
    )
  }
}