import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  currency: 'brl',
  paymentMethods: ['card', 'pix'],
}

// Preços dos serviços (em centavos)
export const SERVICE_PRICES = {
  consultation: 8000, // R$ 80,00
  vaccination: 12000, // R$ 120,00
  grooming: 6000, // R$ 60,00
  surgery: 50000, // R$ 500,00
  emergency: 15000, // R$ 150,00
  taxi_dog_base: 1500, // R$ 15,00 (taxa base)
  taxi_dog_per_km: 250, // R$ 2,50 por km
}

// Tipos de pagamento
export type PaymentType = 'appointment' | 'taxi_dog' | 'product' | 'service'

export interface PaymentMetadata {
  userId: string
  petId?: string
  appointmentId?: string
  taxiRequestId?: string
  serviceType: string
  paymentType: PaymentType
}

// Função para criar sessão de checkout
export async function createCheckoutSession({
  amount,
  currency = 'brl',
  metadata,
  successUrl,
  cancelUrl,
  customerEmail,
}: {
  amount: number
  currency?: string
  metadata: PaymentMetadata
  successUrl: string
  cancelUrl: string
  customerEmail?: string
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: getProductName(metadata.serviceType, metadata.paymentType),
            description: getProductDescription(metadata),
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: {
      ...metadata,
      amount: amount.toString(),
    },
    expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutos
  })

  return session
}

// Função para criar Payment Intent (para pagamentos diretos)
export async function createPaymentIntent({
  amount,
  currency = 'brl',
  metadata,
  customerEmail,
}: {
  amount: number
  currency?: string
  metadata: PaymentMetadata
  customerEmail?: string
}) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: {
      ...metadata,
      amount: amount.toString(),
    },
    receipt_email: customerEmail,
    automatic_payment_methods: {
      enabled: true,
    },
  })

  return paymentIntent
}

// Função para verificar status do pagamento
export async function getPaymentStatus(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  return {
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    metadata: paymentIntent.metadata,
  }
}

// Função para processar reembolso
export async function createRefund({
  paymentIntentId,
  amount,
  reason = 'requested_by_customer',
}: {
  paymentIntentId: string
  amount?: number
  reason?: string
}) {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason,
  })

  return refund
}

// Funções auxiliares
function getProductName(serviceType: string, paymentType: PaymentType): string {
  switch (paymentType) {
    case 'appointment':
      return `Consulta Veterinária - ${serviceType}`
    case 'taxi_dog':
      return 'Taxi Dog - Transporte Pet'
    case 'service':
      return `Serviço Veterinário - ${serviceType}`
    case 'product':
      return `Produto - ${serviceType}`
    default:
      return 'Serviço Veterinário'
  }
}

function getProductDescription(metadata: PaymentMetadata): string {
  const descriptions = {
    appointment: 'Pagamento de consulta veterinária',
    taxi_dog: 'Pagamento de transporte para pets',
    service: 'Pagamento de serviço veterinário',
    product: 'Pagamento de produto veterinário',
  }

  return descriptions[metadata.paymentType] || 'Pagamento de serviço'
}

// Função para validar webhook
export function validateWebhookSignature(body: string, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret)
}

// Função para formatar valor em centavos para reais
export function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountInCents / 100)
}

// Função para converter reais para centavos
export function convertToCents(amountInReais: number): number {
  return Math.round(amountInReais * 100)
}