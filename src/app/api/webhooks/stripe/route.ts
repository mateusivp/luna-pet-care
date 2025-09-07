import { NextRequest, NextResponse } from 'next/server'
import { validateWebhookSignature } from '@/lib/stripe/config'
import { db } from '@/lib/firebase/admin'
import Stripe from 'stripe'

// Configurar para receber raw body
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('Assinatura do webhook ausente')
      return NextResponse.json(
        { error: 'Assinatura do webhook ausente' },
        { status: 400 }
      )
    }

    // Validar webhook
    let event: Stripe.Event
    try {
      event = validateWebhookSignature(body, signature)
    } catch (error) {
      console.error('Erro na validação do webhook:', error)
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 400 }
      )
    }

    console.log('Evento Stripe recebido:', event.type, event.id)

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object as Stripe.Dispute)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook Stripe:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Processar checkout completado
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const metadata = session.metadata
    if (!metadata) return

    const paymentData = {
      id: session.id,
      paymentIntentId: session.payment_intent as string,
      status: 'completed',
      amount: session.amount_total || 0,
      currency: session.currency || 'brl',
      customerEmail: session.customer_email,
      paymentMethod: 'stripe',
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Salvar pagamento no Firestore
    await db.collection('payments').doc(session.id).set(paymentData)

    // Atualizar status do agendamento/serviço
    await updateRelatedDocument(metadata, 'paid')

    // Enviar notificação de pagamento aprovado
    await sendPaymentNotification(metadata.userId, {
      type: 'payment_approved',
      title: 'Pagamento Aprovado',
      message: `Seu pagamento de ${formatCurrency(session.amount_total || 0)} foi aprovado com sucesso.`,
      data: {
        paymentId: session.id,
        amount: session.amount_total?.toString() || '0',
        paymentType: metadata.paymentType,
      },
    })

    console.log('Checkout completado processado:', session.id)
  } catch (error) {
    console.error('Erro ao processar checkout completado:', error)
  }
}

// Processar pagamento bem-sucedido
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const metadata = paymentIntent.metadata
    if (!metadata) return

    // Atualizar documento de pagamento
    await db.collection('payments').doc(paymentIntent.id).update({
      status: 'succeeded',
      updatedAt: new Date(),
    })

    console.log('Pagamento bem-sucedido processado:', paymentIntent.id)
  } catch (error) {
    console.error('Erro ao processar pagamento bem-sucedido:', error)
  }
}

// Processar falha no pagamento
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const metadata = paymentIntent.metadata
    if (!metadata) return

    // Atualizar documento de pagamento
    await db.collection('payments').doc(paymentIntent.id).update({
      status: 'failed',
      failureReason: paymentIntent.last_payment_error?.message || 'Erro desconhecido',
      updatedAt: new Date(),
    })

    // Atualizar status do agendamento/serviço
    await updateRelatedDocument(metadata, 'payment_failed')

    // Enviar notificação de pagamento rejeitado
    await sendPaymentNotification(metadata.userId, {
      type: 'payment_failed',
      title: 'Pagamento Rejeitado',
      message: 'Seu pagamento foi rejeitado. Tente novamente ou use outro método de pagamento.',
      data: {
        paymentId: paymentIntent.id,
        amount: paymentIntent.amount.toString(),
        paymentType: metadata.paymentType,
      },
    })

    console.log('Falha no pagamento processada:', paymentIntent.id)
  } catch (error) {
    console.error('Erro ao processar falha no pagamento:', error)
  }
}

// Processar disputa de cobrança
async function handleChargeDispute(dispute: Stripe.Dispute) {
  try {
    // Registrar disputa
    await db.collection('disputes').doc(dispute.id).set({
      id: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount,
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      createdAt: new Date(dispute.created * 1000),
      updatedAt: new Date(),
    })

    console.log('Disputa registrada:', dispute.id)
  } catch (error) {
    console.error('Erro ao processar disputa:', error)
  }
}

// Processar pagamento de fatura bem-sucedido
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Pagamento de fatura bem-sucedido:', invoice.id)
  } catch (error) {
    console.error('Erro ao processar pagamento de fatura:', error)
  }
}

// Atualizar documento relacionado (agendamento, taxi, etc.)
async function updateRelatedDocument(metadata: any, status: string) {
  try {
    const { paymentType, appointmentId, taxiRequestId } = metadata

    if (paymentType === 'appointment' && appointmentId) {
      await db.collection('appointments').doc(appointmentId).update({
        paymentStatus: status,
        updatedAt: new Date(),
      })
    } else if (paymentType === 'taxi_dog' && taxiRequestId) {
      await db.collection('taxiRequests').doc(taxiRequestId).update({
        paymentStatus: status,
        updatedAt: new Date(),
      })
    }
  } catch (error) {
    console.error('Erro ao atualizar documento relacionado:', error)
  }
}

// Enviar notificação de pagamento
async function sendPaymentNotification(userId: string, notification: any) {
  try {
    await db.collection('notifications').add({
      userId,
      ...notification,
      read: false,
      createdAt: new Date(),
    })

    // Aqui você pode integrar com FCM para push notifications
    // await sendPushNotification(userId, notification)
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
  }
}

// Formatar moeda
function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountInCents / 100)
}