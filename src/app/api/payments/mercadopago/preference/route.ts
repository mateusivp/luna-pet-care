import { NextRequest, NextResponse } from 'next/server'
import { createPaymentPreference, createPixPayment, MercadoPagoMetadata } from '@/lib/mercadopago/config'
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
      title,
      description,
      price,
      quantity = 1,
      serviceType,
      paymentType,
      paymentMethod = 'preference', // 'preference' ou 'pix'
      petId,
      appointmentId,
      taxiRequestId,
      payerEmail,
      successUrl,
      failureUrl,
      pendingUrl,
    } = body

    // Validar dados obrigatórios
    if (!title || !description || !price || !serviceType || !paymentType) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: title, description, price, serviceType, paymentType' },
        { status: 400 }
      )
    }

    if (!successUrl || !failureUrl || !pendingUrl) {
      return NextResponse.json(
        { error: 'URLs de sucesso, falha e pendente são obrigatórias' },
        { status: 400 }
      )
    }

    // Preparar metadados
    const metadata: MercadoPagoMetadata = {
      userId,
      serviceType,
      paymentType,
      ...(petId && { petId }),
      ...(appointmentId && { appointmentId }),
      ...(taxiRequestId && { taxiRequestId }),
    }

    // Criar pagamento baseado no método escolhido
    if (paymentMethod === 'pix') {
      // Criar pagamento PIX
      const payment = await createPixPayment({
        amount: price,
        description: `${title} - ${description}`,
        payerEmail: payerEmail || decodedToken.email || '',
        metadata,
      })

      return NextResponse.json({
        id: payment.id,
        status: payment.status,
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: payment.point_of_interaction?.transaction_data?.ticket_url,
        payment_method_id: payment.payment_method_id,
        transaction_amount: payment.transaction_amount,
        currency_id: payment.currency_id,
        date_created: payment.date_created,
        date_of_expiration: payment.date_of_expiration,
      })
    } else {
      // Criar preferência de pagamento
      const preference = await createPaymentPreference({
        title,
        description,
        price,
        quantity,
        metadata,
        payerEmail: payerEmail || decodedToken.email,
        successUrl,
        failureUrl,
        pendingUrl,
      })

      return NextResponse.json({
        id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        client_id: preference.client_id,
        collector_id: preference.collector_id,
        operation_type: preference.operation_type,
        items: preference.items,
        date_created: preference.date_created,
        expires: preference.expires,
        expiration_date_from: preference.expiration_date_from,
        expiration_date_to: preference.expiration_date_to,
      })
    }
  } catch (error) {
    console.error('Erro ao criar preferência/pagamento Mercado Pago:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Método GET para verificar status de um pagamento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')
    const preferenceId = searchParams.get('preference_id')

    if (!paymentId && !preferenceId) {
      return NextResponse.json(
        { error: 'Payment ID ou Preference ID é obrigatório' },
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

    if (paymentId) {
      // Buscar pagamento no Mercado Pago
      const { getPaymentStatus } = await import('@/lib/mercadopago/config')
      const payment = await getPaymentStatus(paymentId)

      return NextResponse.json(payment)
    } else if (preferenceId) {
      // Buscar preferência no Mercado Pago
      const { preferenceService } = await import('@/lib/mercadopago/config')
      const preference = await preferenceService.get({ preferenceId })

      return NextResponse.json({
        id: preference.id,
        status: preference.status,
        items: preference.items,
        payer: preference.payer,
        back_urls: preference.back_urls,
        date_created: preference.date_created,
        expires: preference.expires,
        expiration_date_from: preference.expiration_date_from,
        expiration_date_to: preference.expiration_date_to,
      })
    }
  } catch (error) {
    console.error('Erro ao buscar pagamento/preferência:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}