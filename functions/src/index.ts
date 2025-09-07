import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import Stripe from 'stripe'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import twilio from 'twilio'
import nodemailer from 'nodemailer'
import * as crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'

// Inicializar Firebase Admin
admin.initializeApp()
const db = admin.firestore()
const auth = admin.auth()

// Configurações
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
})

const mercadopago = new MercadoPagoConfig({
  accessToken: functions.config().mercadopago.access_token,
})

const twilioClient = twilio(
  functions.config().twilio.account_sid,
  functions.config().twilio.auth_token
)

const emailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.password,
  },
})

// Rate Limiter
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req: any) => req.ip,
  points: 100, // Número de requests
  duration: 60, // Por minuto
})

// Express app para webhooks
const app = express()
app.use(helmet())
app.use(cors({ origin: true }))

// Middleware de rate limiting
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip)
    next()
  } catch {
    res.status(429).json({ error: 'Too many requests' })
  }
})

// ===== TRIGGERS DE FIRESTORE =====

// Trigger quando um usuário é criado
export const onUserCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data()
    const userId = context.params.userId

    try {
      // Definir custom claims baseado no role
      await auth.setCustomUserClaims(userId, {
        role: userData.role,
        createdAt: admin.firestore.Timestamp.now().toMillis(),
      })

      // Criar documento de configurações do usuário
      await db.collection('userSettings').doc(userId).set({
        notifications: {
          email: true,
          sms: true,
          push: true,
        },
        preferences: {
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          currency: 'BRL',
        },
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      })

      // Enviar email de boas-vindas
      await sendWelcomeEmail(userData.email, userData.name)

      // Log da criação
      await createLog({
        type: 'user_created',
        userId,
        data: { role: userData.role },
        timestamp: admin.firestore.Timestamp.now(),
      })

      console.log(`User created successfully: ${userId}`)
    } catch (error) {
      console.error('Error in onUserCreate:', error)
    }
  })

// Trigger quando um agendamento é criado
export const onAppointmentCreate = functions.firestore
  .document('appointments/{appointmentId}')
  .onCreate(async (snap, context) => {
    const appointmentData = snap.data()
    const appointmentId = context.params.appointmentId

    try {
      // Buscar dados do cliente
      const clientDoc = await db.collection('clients').doc(appointmentData.clientId).get()
      const clientData = clientDoc.data()

      if (!clientData) {
        throw new Error('Client not found')
      }

      // Enviar notificação para o cliente
      await sendNotification({
        userId: appointmentData.clientId,
        title: 'Agendamento Confirmado',
        message: `Seu agendamento foi confirmado para ${moment(appointmentData.scheduledDate.toDate()).format('DD/MM/YYYY HH:mm')}`,
        type: 'appointment_confirmed',
        data: { appointmentId },
      })

      // Enviar SMS se habilitado
      if (clientData.phone) {
        await sendSMS(
          clientData.phone,
          `Olá ${clientData.name}! Seu agendamento foi confirmado para ${moment(appointmentData.scheduledDate.toDate()).format('DD/MM/YYYY HH:mm')}. PetShop SaaS`
        )
      }

      // Criar lembrete para 1 dia antes
      const reminderDate = moment(appointmentData.scheduledDate.toDate()).subtract(1, 'day')
      await scheduleReminder(appointmentId, reminderDate.toDate())

      console.log(`Appointment notifications sent: ${appointmentId}`)
    } catch (error) {
      console.error('Error in onAppointmentCreate:', error)
    }
  })

// Trigger quando status do agendamento muda
export const onAppointmentUpdate = functions.firestore
  .document('appointments/{appointmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()
    const appointmentId = context.params.appointmentId

    // Verificar se o status mudou
    if (before.status !== after.status) {
      try {
        const clientDoc = await db.collection('clients').doc(after.clientId).get()
        const clientData = clientDoc.data()

        if (!clientData) return

        let title = ''
        let message = ''

        switch (after.status) {
          case 'confirmed':
            title = 'Agendamento Confirmado'
            message = 'Seu agendamento foi confirmado!'
            break
          case 'in_progress':
            title = 'Serviço Iniciado'
            message = 'O serviço do seu pet foi iniciado!'
            break
          case 'completed':
            title = 'Serviço Concluído'
            message = 'O serviço do seu pet foi concluído com sucesso!'
            break
          case 'cancelled':
            title = 'Agendamento Cancelado'
            message = 'Seu agendamento foi cancelado.'
            break
        }

        if (title && message) {
          await sendNotification({
            userId: after.clientId,
            title,
            message,
            type: 'appointment_status_changed',
            data: { appointmentId, status: after.status },
          })
        }

        console.log(`Appointment status notification sent: ${appointmentId}`)
      } catch (error) {
        console.error('Error in onAppointmentUpdate:', error)
      }
    }
  })

// ===== WEBHOOKS =====

// Webhook do Stripe
app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string
  const endpointSecret = functions.config().stripe.webhook_secret

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSuccess(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handleStripePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleStripeSubscriptionChange(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Error processing Stripe webhook:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Webhook do Mercado Pago
app.post('/mercadopago-webhook', express.json(), async (req, res) => {
  try {
    const { type, data } = req.body

    if (type === 'payment') {
      const payment = new Payment(mercadopago)
      const paymentData = await payment.get({ id: data.id })

      await handleMercadoPagoPayment(paymentData)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error processing MercadoPago webhook:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ===== FUNÇÕES AUXILIARES =====

// Enviar email de boas-vindas
async function sendWelcomeEmail(email: string, name: string) {
  const mailOptions = {
    from: functions.config().email.from,
    to: email,
    subject: 'Bem-vindo ao PetShop SaaS!',
    html: `
      <h1>Bem-vindo, ${name}!</h1>
      <p>Obrigado por se cadastrar no PetShop SaaS.</p>
      <p>Agora você pode gerenciar seus pets e agendar serviços de forma fácil e rápida.</p>
      <p>Se precisar de ajuda, entre em contato conosco.</p>
      <p>Equipe PetShop SaaS</p>
    `,
  }

  await emailTransporter.sendMail(mailOptions)
}

// Enviar notificação
async function sendNotification(notification: {
  userId: string
  title: string
  message: string
  type: string
  data?: any
}) {
  // Salvar no Firestore
  await db.collection('notifications').add({
    ...notification,
    isRead: false,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
  })

  // Enviar push notification se o usuário tiver token FCM
  const userDoc = await db.collection('users').doc(notification.userId).get()
  const userData = userDoc.data()

  if (userData?.fcmToken) {
    await admin.messaging().send({
      token: userData.fcmToken,
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: notification.data || {},
    })
  }
}

// Enviar SMS
async function sendSMS(phone: string, message: string) {
  await twilioClient.messages.create({
    body: message,
    from: functions.config().twilio.phone_number,
    to: phone,
  })
}

// Processar pagamento Stripe bem-sucedido
async function handleStripePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata.paymentId

  if (paymentId) {
    await db.collection('payments').doc(paymentId).update({
      status: 'completed',
      stripePaymentIntentId: paymentIntent.id,
      paidAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    })

    // Buscar dados do pagamento para notificar o cliente
    const paymentDoc = await db.collection('payments').doc(paymentId).get()
    const paymentData = paymentDoc.data()

    if (paymentData) {
      await sendNotification({
        userId: paymentData.clientId,
        title: 'Pagamento Confirmado',
        message: `Seu pagamento de ${paymentData.amount} foi confirmado!`,
        type: 'payment_confirmed',
        data: { paymentId },
      })
    }
  }
}

// Processar pagamento Stripe falhado
async function handleStripePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentId = paymentIntent.metadata.paymentId

  if (paymentId) {
    await db.collection('payments').doc(paymentId).update({
      status: 'failed',
      stripePaymentIntentId: paymentIntent.id,
      failureReason: paymentIntent.last_payment_error?.message,
      updatedAt: admin.firestore.Timestamp.now(),
    })
  }
}

// Processar mudança de assinatura Stripe
async function handleStripeSubscriptionChange(subscription: Stripe.Subscription) {
  // Implementar lógica de assinatura se necessário
  console.log('Subscription change:', subscription.id, subscription.status)
}

// Processar pagamento Mercado Pago
async function handleMercadoPagoPayment(payment: any) {
  const paymentId = payment.external_reference

  if (paymentId && payment.status === 'approved') {
    await db.collection('payments').doc(paymentId).update({
      status: 'completed',
      mercadoPagoPaymentId: payment.id,
      paidAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    })
  }
}

// Criar log de auditoria
async function createLog(logData: any) {
  await db.collection('logs').add({
    ...logData,
    id: uuidv4(),
    createdAt: admin.firestore.Timestamp.now(),
  })
}

// Agendar lembrete
async function scheduleReminder(appointmentId: string, reminderDate: Date) {
  // Implementar usando Cloud Tasks ou similar
  console.log(`Reminder scheduled for appointment ${appointmentId} at ${reminderDate}`)
}

// ===== FUNÇÕES HTTP =====

// Função para processar webhooks
export const webhooks = functions.https.onRequest(app)

// Função para enviar notificações manuais
export const sendManualNotification = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  // Verificar se é admin
  const userDoc = await db.collection('users').doc(context.auth.uid).get()
  const userData = userDoc.data()

  if (!userData || userData.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can send manual notifications')
  }

  try {
    await sendNotification(data)
    return { success: true }
  } catch (error) {
    console.error('Error sending manual notification:', error)
    throw new functions.https.HttpsError('internal', 'Failed to send notification')
  }
})

// Função para gerar relatórios
export const generateReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated')
  }

  const { reportType, startDate, endDate, userId } = data

  try {
    let reportData: any = {}

    switch (reportType) {
      case 'appointments':
        reportData = await generateAppointmentsReport(userId, startDate, endDate)
        break
      case 'revenue':
        reportData = await generateRevenueReport(userId, startDate, endDate)
        break
      case 'clients':
        reportData = await generateClientsReport(userId)
        break
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid report type')
    }

    return reportData
  } catch (error) {
    console.error('Error generating report:', error)
    throw new functions.https.HttpsError('internal', 'Failed to generate report')
  }
})

// Funções auxiliares para relatórios
async function generateAppointmentsReport(userId: string, startDate: string, endDate: string) {
  const start = admin.firestore.Timestamp.fromDate(new Date(startDate))
  const end = admin.firestore.Timestamp.fromDate(new Date(endDate))

  const appointmentsQuery = await db
    .collection('appointments')
    .where('userId', '==', userId)
    .where('scheduledDate', '>=', start)
    .where('scheduledDate', '<=', end)
    .get()

  const appointments = appointmentsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  return {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    revenue: appointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.totalAmount || 0), 0),
    appointments,
  }
}

async function generateRevenueReport(userId: string, startDate: string, endDate: string) {
  const start = admin.firestore.Timestamp.fromDate(new Date(startDate))
  const end = admin.firestore.Timestamp.fromDate(new Date(endDate))

  const paymentsQuery = await db
    .collection('payments')
    .where('userId', '==', userId)
    .where('paidAt', '>=', start)
    .where('paidAt', '<=', end)
    .where('status', '==', 'completed')
    .get()

  const payments = paymentsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  return {
    totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
    totalTransactions: payments.length,
    averageTransaction: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0,
    payments,
  }
}

async function generateClientsReport(userId: string) {
  const clientsQuery = await db.collection('clients').where('userId', '==', userId).get()
  const clients = clientsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  return {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.isActive !== false).length,
    newClientsThisMonth: clients.filter(c => {
      const createdAt = c.createdAt.toDate()
      const now = new Date()
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
    }).length,
    clients,
  }
}