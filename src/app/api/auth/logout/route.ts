import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
)

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value

    if (token) {
      try {
        // Verificar e decodificar o token para obter o UID
        const { payload } = await jwtVerify(token, JWT_SECRET)
        const uid = payload.uid as string

        // Atualizar último logout no Firestore
        if (uid) {
          await adminDb.collection('users').doc(uid).update({
            lastLogoutAt: new Date(),
            updatedAt: new Date()
          })
        }

        // Revogar tokens do Firebase (opcional)
        await adminAuth.revokeRefreshTokens(uid)
      } catch (error) {
        console.error('Erro ao processar logout:', error)
        // Continuar com o logout mesmo se houver erro
      }
    }

    // Remover cookie de autenticação
    cookieStore.delete('auth-token')

    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    })

  } catch (error: any) {
    console.error('Erro no logout:', error)
    
    // Mesmo com erro, remover o cookie
    const cookieStore = cookies()
    cookieStore.delete('auth-token')

    return NextResponse.json(
      { error: 'Erro ao fazer logout', success: false },
      { status: 500 }
    )
  }
}

// Método GET para logout via URL (opcional)
export async function GET(request: NextRequest) {
  return POST(request)
}