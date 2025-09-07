import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession, PaymentMetadata } from '@/lib/stripe/config'
import { auth } from '@/lib/firebase/admin'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authorization.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Obter dados do corpo da requisição
    const body = await request.json()
    const {
      amount,
      currency = 'brl',
      serviceType,
      paymentType,
      petId,
      appointmentId,
      taxiRequestId,
      customerEmail,
      successUrl,
      cancelUrl,
    } = body

    // Validar dados obrigatórios
    if (!amount || !serviceType || !paymentType) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: amount, serviceType, paymentType' },
        { status: 400 }
      )
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'URLs de sucesso e cancelamento são obrigatórias' },
        { status: 400 }
      )
    }

    // Preparar metadados
    const metadata: PaymentMetadata = {
      userId,
      serviceType,
      paymentType,
      ...(petId && { petId }),
      ...(appointmentId && { appointmentId }),
      ...(taxiRequestId && { taxiRequestId }),
    }

    // Criar sessão de checkout
    const session = await createCheckoutSession({
      amount: Math.round(amount * 100), // Converter para centavos
      currency,
      metadata,
      successUrl,
      cancelUrl,
      customerEmail: customerEmail || decodedToken.email,
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      paymentIntentId: session.payment_intent,
    })
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Método GET para verificar status de uma sessão
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar autenticação
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authorization.split('Bearer ')[1]
    await auth.verifyIdToken(token)

    // Buscar sessão no Stripe
    const { stripe } = await import('@/lib/stripe/config')
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return NextResponse.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_email,
      metadata: session.metadata,
      payment_intent: session.payment_intent,
    })
  } catch (error) {
    console.error('Erro ao buscar sessão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}