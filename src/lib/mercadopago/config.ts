import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN is not defined in environment variables')
}

// Configuração do Mercado Pago
export const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc',
  }
})

export const MERCADOPAGO_CONFIG = {
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!,
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET!,
  notificationUrl: process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/mercadopago',
}

// Instâncias dos serviços
export const paymentService = new Payment(mercadopago)
export const preferenceService = new Preference(mercadopago)

// Tipos de pagamento aceitos
export const PAYMENT_METHODS = {
  credit_card: 'credit_card',
  debit_card: 'debit_card',
  pix: 'pix',
  boleto: 'bolbradesco',
}

// Interface para metadados do pagamento
export interface MercadoPagoMetadata {
  userId: string
  petId?: string
  appointmentId?: string
  taxiRequestId?: string
  serviceType: string
  paymentType: 'appointment' | 'taxi_dog' | 'product' | 'service'
}

// Função para criar preferência de pagamento
export async function createPaymentPreference({
  title,
  description,
  price,
  quantity = 1,
  metadata,
  payerEmail,
  successUrl,
  failureUrl,
  pendingUrl,
}: {
  title: string
  description: string
  price: number
  quantity?: number
  metadata: MercadoPagoMetadata
  payerEmail?: string
  successUrl: string
  failureUrl: string
  pendingUrl: string
}) {
  const preference = await preferenceService.create({
    body: {
      items: [
        {
          id: `${metadata.paymentType}_${Date.now()}`,
          title,
          description,
          category_id: 'services',
          quantity,
          currency_id: 'BRL',
          unit_price: price,
        },
      ],
      payer: {
        email: payerEmail,
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: 'approved',
      notification_url: MERCADOPAGO_CONFIG.notificationUrl,
      metadata: {
        user_id: metadata.userId,
        pet_id: metadata.petId || '',
        appointment_id: metadata.appointmentId || '',
        taxi_request_id: metadata.taxiRequestId || '',
        service_type: metadata.serviceType,
        payment_type: metadata.paymentType,
      },
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [],
        installments: 12,
      },
    },
  })

  return preference
}

// Função para criar pagamento PIX
export async function createPixPayment({
  amount,
  description,
  payerEmail,
  metadata,
}: {
  amount: number
  description: string
  payerEmail: string
  metadata: MercadoPagoMetadata
}) {
  const payment = await paymentService.create({
    body: {
      transaction_amount: amount,
      description,
      payment_method_id: 'pix',
      payer: {
        email: payerEmail,
      },
      metadata: {
        user_id: metadata.userId,
        pet_id: metadata.petId || '',
        appointment_id: metadata.appointmentId || '',
        taxi_request_id: metadata.taxiRequestId || '',
        service_type: metadata.serviceType,
        payment_type: metadata.paymentType,
      },
      notification_url: MERCADOPAGO_CONFIG.notificationUrl,
    },
  })

  return payment
}

// Função para verificar status do pagamento
export async function getPaymentStatus(paymentId: string) {
  const payment = await paymentService.get({ id: paymentId })
  return {
    id: payment.id,
    status: payment.status,
    status_detail: payment.status_detail,
    amount: payment.transaction_amount,
    currency: payment.currency_id,
    payment_method: payment.payment_method_id,
    metadata: payment.metadata,
    date_created: payment.date_created,
    date_approved: payment.date_approved,
  }
}

// Função para processar reembolso
export async function createRefund({
  paymentId,
  amount,
}: {
  paymentId: string
  amount?: number
}) {
  const refund = await paymentService.refund({
    id: paymentId,
    body: {
      amount,
    },
  })

  return refund
}

// Função para validar webhook do Mercado Pago
export function validateWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  ts: string
): boolean {
  const crypto = require('crypto')
  const secret = MERCADOPAGO_CONFIG.webhookSecret
  
  // Criar string para assinar
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  
  // Criar HMAC
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(manifest)
  const sha = hmac.digest('hex')
  
  // Comparar assinaturas
  const parts = xSignature.split(',')
  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key && key.trim() === 'v1' && value && value.trim() === sha) {
      return true
    }
  }
  
  return false
}

// Função para formatar valor para exibição
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)
}

// Função para obter método de pagamento em português
export function getPaymentMethodName(paymentMethodId: string): string {
  const methods: Record<string, string> = {
    'pix': 'PIX',
    'bolbradesco': 'Boleto Bancário',
    'visa': 'Visa',
    'master': 'Mastercard',
    'amex': 'American Express',
    'elo': 'Elo',
    'hipercard': 'Hipercard',
  }
  
  return methods[paymentMethodId] || paymentMethodId.toUpperCase()
}

// Função para obter status em português
export function getPaymentStatusName(status: string): string {
  const statuses: Record<string, string> = {
    'pending': 'Pendente',
    'approved': 'Aprovado',
    'authorized': 'Autorizado',
    'in_process': 'Em processamento',
    'in_mediation': 'Em mediação',
    'rejected': 'Rejeitado',
    'cancelled': 'Cancelado',
    'refunded': 'Reembolsado',
    'charged_back': 'Estornado',
  }
  
  return statuses[status] || status
}