import { NextRequest, NextResponse } from 'next/server'
import { validateWebhookSignature, getPaymentStatus } from '@/lib/mercadopago/config'
import { db } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const headers = request.headers

    // Obter headers necessários para validação
    const xSignature = headers.get('x-signature')
    const xRequestId = headers.get('x-request-id')
    const ts = headers.get('ts')

    console.log('Webhook Mercado Pago recebido:', {
      type: body.type,
      action: body.action,
      data: body.data,
    })

    // Validar webhook (opcional, dependendo da configuração)
    if (xSignature && xRequestId && ts && body.data?.id) {
      const isValid = validateWebhookSignature(
        xSignature,
        xRequestId,
        body.data.id,
        ts
      )

      if (!isValid) {
        console.error('Assinatura do webhook inválida')
        return NextResponse.json(
          { error: 'Assinatura inválida' },
          { status: 400 }
        )
      }
    }

    // Processar diferentes tipos de notificações
    switch (body.type) {
      case 'payment':
        await handlePaymentNotification(body.data.id, body.action)
        break

      case 'plan':
        await handlePlanNotification(body.data.id, body.action)
        break

      case 'subscription':
        await handleSubscriptionNotification(body.data.id, body.action)
        break

      case 'invoice':
        await handleInvoiceNotification(body.data.id, body.action)
        break

      case 'point_integration_wh':
        await handlePointIntegrationNotification(body.data.id, body.action)
        break

      default:
        console.log(`Tipo de notificação não tratado: ${body.type}`)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Erro no webhook Mercado Pago:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Processar notificação de pagamento
async function handlePaymentNotification(paymentId: string, action: string) {
  try {
    console.log(`Processando pagamento ${paymentId} - ação: ${action}`)

    // Buscar detalhes do pagamento
    const payment = await getPaymentStatus(paymentId)

    if (!payment || !payment.metadata) {
      console.error('Pagamento não encontrado ou sem metadados:', paymentId)
      return
    }

    const metadata = payment.metadata

    // Preparar dados do pagamento
    const paymentData = {
      id: payment.id?.toString() || paymentId,
      status: payment.status,
      statusDetail: payment.status_detail,
      amount: payment.amount || 0,
      currency: payment.currency || 'BRL',
      paymentMethod: payment.payment_method || 'mercadopago',
      paymentMethodId: payment.payment_method,
      metadata: {
        userId: metadata.user_id,
        petId: metadata.pet_id,
        appointmentId: metadata.appointment_id,
        taxiRequestId: metadata.taxi_request_id,
        serviceType: metadata.service_type,
        paymentType: metadata.payment_type,
      },
      dateCreated: payment.date_created,
      dateApproved: payment.date_approved,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Salvar/atualizar pagamento no Firestore
    await db.collection('payments').doc(paymentId).set(paymentData, { merge: true })

    // Processar baseado no status do pagamento
    switch (payment.status) {
      case 'approved':
        await handleApprovedPayment(paymentData)
        break

      case 'pending':
        await handlePendingPayment(paymentData)
        break

      case 'rejected':
        await handleRejectedPayment(paymentData)
        break

      case 'cancelled':
        await handleCancelledPayment(paymentData)
        break

      case 'refunded':
        await handleRefundedPayment(paymentData)
        break

      case 'charged_back':
        await handleChargedBackPayment(paymentData)
        break

      default:
        console.log(`Status de pagamento não tratado: ${payment.status}`)
    }

    console.log(`Pagamento ${paymentId} processado com sucesso`)
  } catch (error) {
    console.error('Erro ao processar notificação de pagamento:', error)
  }
}

// Processar pagamento aprovado
async function handleApprovedPayment(paymentData: any) {
  try {
    const { metadata } = paymentData

    // Atualizar status do documento relacionado
    await updateRelatedDocument(metadata, 'paid')

    // Enviar notificação de pagamento aprovado
    await sendPaymentNotification(metadata.userId, {
      type: 'payment_approved',
      title: 'Pagamento Aprovado',
      message: `Seu pagamento de ${formatCurrency(paymentData.amount)} foi aprovado com sucesso.`,
      data: {
        paymentId: paymentData.id,
        amount: paymentData.amount.toString(),
        paymentType: metadata.paymentType,
      },
    })

    console.log('Pagamento aprovado processado:', paymentData.id)
  } catch (error) {
    console.error('Erro ao processar pagamento aprovado:', error)
  }
}

// Processar pagamento pendente
async function handlePendingPayment(paymentData: any) {
  try {
    const { metadata } = paymentData

    // Atualizar status do documento relacionado
    await updateRelatedDocument(metadata, 'pending')

    // Enviar notificação de pagamento pendente
    await sendPaymentNotification(metadata.userId, {
      type: 'payment_pending',
      title: 'Pagamento Pendente',
      message: 'Seu pagamento está sendo processado. Você será notificado quando for aprovado.',
      data: {
        paymentId: paymentData.id,
        amount: paymentData.amount.toString(),
        paymentType: metadata.paymentType,
      },
    })

    console.log('Pagamento pendente processado:', paymentData.id)
  } catch (error) {
    console.error('Erro ao processar pagamento pendente:', error)
  }
}

// Processar pagamento rejeitado
async function handleRejectedPayment(paymentData: any) {
  try {
    const { metadata } = paymentData

    // Atualizar status do documento relacionado
    await updateRelatedDocument(metadata, 'payment_failed')

    // Enviar notificação de pagamento rejeitado
    await sendPaymentNotification(metadata.userId, {
      type: 'payment_rejected',
      title: 'Pagamento Rejeitado',
      message: 'Seu pagamento foi rejeitado. Tente novamente ou use outro método de pagamento.',
      data: {
        paymentId: paymentData.id,
        amount: paymentData.amount.toString(),
        paymentType: metadata.paymentType,
      },
    })

    console.log('Pagamento rejeitado processado:', paymentData.id)
  } catch (error) {
    console.error('Erro ao processar pagamento rejeitado:', error)
  }
}

// Processar pagamento cancelado
async function handleCancelledPayment(paymentData: any) {
  try {
    const { metadata } = paymentData

    // Atualizar status do documento relacionado
    await updateRelatedDocument(metadata, 'cancelled')

    console.log('Pagamento cancelado processado:', paymentData.id)
  } catch (error) {
    console.error('Erro ao processar pagamento cancelado:', error)
  }
}

// Processar pagamento reembolsado
async function handleRefundedPayment(paymentData: any) {
  try {
    const { metadata } = paymentData

    // Atualizar status do documento relacionado
    await updateRelatedDocument(metadata, 'refunded')

    // Enviar notificação de reembolso
    await sendPaymentNotification(metadata.userId, {
      type: 'payment_refunded',
      title: 'Pagamento Reembolsado',
      message: `Seu pagamento de ${formatCurrency(paymentData.amount)} foi reembolsado.`,
      data: {
        paymentId: paymentData.id,
        amount: paymentData.amount.toString(),
        paymentType: metadata.paymentType,
      },
    })

    console.log('Pagamento reembolsado processado:', paymentData.id)
  } catch (error) {
    console.error('Erro ao processar pagamento reembolsado:', error)
  }
}

// Processar estorno
async function handleChargedBackPayment(paymentData: any) {
  try {
    const { metadata } = paymentData

    // Registrar estorno
    await db.collection('chargebacks').doc(paymentData.id).set({
      paymentId: paymentData.id,
      amount: paymentData.amount,
      currency: paymentData.currency,
      userId: metadata.userId,
      createdAt: new Date(),
    })

    console.log('Estorno processado:', paymentData.id)
  } catch (error) {
    console.error('Erro ao processar estorno:', error)
  }
}

// Processar outras notificações (placeholder)
async function handlePlanNotification(planId: string, action: string) {
  console.log(`Notificação de plano: ${planId} - ${action}`)
}

async function handleSubscriptionNotification(subscriptionId: string, action: string) {
  console.log(`Notificação de assinatura: ${subscriptionId} - ${action}`)
}

async function handleInvoiceNotification(invoiceId: string, action: string) {
  console.log(`Notificação de fatura: ${invoiceId} - ${action}`)
}

async function handlePointIntegrationNotification(integrationId: string, action: string) {
  console.log(`Notificação de integração: ${integrationId} - ${action}`)
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
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}