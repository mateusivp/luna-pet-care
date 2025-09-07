import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Inicializar Firebase Admin se ainda não foi inicializado
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()

interface AnalyticsData {
  users: {
    total: number
    active: number
    newThisMonth: number
    byRole: Record<string, number>
  }
  appointments: {
    total: number
    thisMonth: number
    byStatus: Record<string, number>
    byService: Record<string, number>
    revenue: number
  }
  taxiDog: {
    total: number
    thisMonth: number
    byStatus: Record<string, number>
    revenue: number
    averageRating: number
  }
  payments: {
    total: number
    thisMonth: number
    byMethod: Record<string, number>
    byStatus: Record<string, number>
    totalRevenue: number
    monthlyRevenue: number
  }
  pets: {
    total: number
    bySpecies: Record<string, number>
    bySize: Record<string, number>
  }
}

// Obter analytics gerais (apenas admin)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    // Verificar se é admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()
    
    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // dias
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Data do início do mês atual
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    // Buscar dados de usuários
    const usersSnapshot = await db.collection('users').get()
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    const activeUsers = users.filter(user => {
      const lastLogin = user.lastLoginAt?.toDate()
      return lastLogin && lastLogin >= startDate
    })

    const newUsersThisMonth = users.filter(user => {
      const createdAt = user.createdAt?.toDate()
      return createdAt && createdAt >= monthStart
    })

    const usersByRole = users.reduce((acc, user) => {
      acc[user.role || 'client'] = (acc[user.role || 'client'] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Buscar dados de agendamentos
    const appointmentsSnapshot = await db.collection('appointments').get()
    const appointments = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    const appointmentsThisMonth = appointments.filter(appointment => {
      const createdAt = appointment.createdAt?.toDate()
      return createdAt && createdAt >= monthStart
    })

    const appointmentsByStatus = appointments.reduce((acc, appointment) => {
      acc[appointment.status] = (acc[appointment.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const appointmentsByService = appointments.reduce((acc, appointment) => {
      const serviceName = appointment.service?.name || 'Não especificado'
      acc[serviceName] = (acc[serviceName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const appointmentRevenue = appointments
      .filter(appointment => appointment.status === 'completed')
      .reduce((total, appointment) => total + (appointment.service?.price || 0), 0)

    // Buscar dados de Taxi Dog
    const taxiDogSnapshot = await db.collection('taxi_dog_requests').get()
    const taxiDogRequests = taxiDogSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    const taxiDogThisMonth = taxiDogRequests.filter(request => {
      const createdAt = request.createdAt?.toDate()
      return createdAt && createdAt >= monthStart
    })

    const taxiDogByStatus = taxiDogRequests.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const taxiDogRevenue = taxiDogRequests
      .filter(request => request.status === 'completed')
      .reduce((total, request) => total + (request.price || 0), 0)

    const completedTaxiDog = taxiDogRequests.filter(request => 
      request.status === 'completed' && request.rating
    )
    const averageRating = completedTaxiDog.length > 0 
      ? completedTaxiDog.reduce((sum, request) => sum + request.rating, 0) / completedTaxiDog.length
      : 0

    // Buscar dados de pagamentos
    const paymentsSnapshot = await db.collection('payments').get()
    const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    const paymentsThisMonth = payments.filter(payment => {
      const createdAt = payment.createdAt?.toDate()
      return createdAt && createdAt >= monthStart
    })

    const paymentsByMethod = payments.reduce((acc, payment) => {
      acc[payment.method] = (acc[payment.method] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const paymentsByStatus = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalRevenue = payments
      .filter(payment => payment.status === 'approved')
      .reduce((total, payment) => total + (payment.amount || 0), 0)

    const monthlyRevenue = paymentsThisMonth
      .filter(payment => payment.status === 'approved')
      .reduce((total, payment) => total + (payment.amount || 0), 0)

    // Buscar dados de pets
    const petsSnapshot = await db.collection('pets').get()
    const pets = petsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    const petsBySpecies = pets.reduce((acc, pet) => {
      acc[pet.species || 'Não especificado'] = (acc[pet.species || 'Não especificado'] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const petsBySize = pets.reduce((acc, pet) => {
      acc[pet.size || 'Não especificado'] = (acc[pet.size || 'Não especificado'] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const analyticsData: AnalyticsData = {
      users: {
        total: users.length,
        active: activeUsers.length,
        newThisMonth: newUsersThisMonth.length,
        byRole: usersByRole,
      },
      appointments: {
        total: appointments.length,
        thisMonth: appointmentsThisMonth.length,
        byStatus: appointmentsByStatus,
        byService: appointmentsByService,
        revenue: appointmentRevenue,
      },
      taxiDog: {
        total: taxiDogRequests.length,
        thisMonth: taxiDogThisMonth.length,
        byStatus: taxiDogByStatus,
        revenue: taxiDogRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
      },
      payments: {
        total: payments.length,
        thisMonth: paymentsThisMonth.length,
        byMethod: paymentsByMethod,
        byStatus: paymentsByStatus,
        totalRevenue,
        monthlyRevenue,
      },
      pets: {
        total: pets.length,
        bySpecies: petsBySpecies,
        bySize: petsBySize,
      },
    }

    return NextResponse.json({
      analytics: analyticsData,
      period: parseInt(period),
      generatedAt: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('Erro ao buscar analytics:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

// Registrar evento de analytics
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    const { event, data, category } = await request.json()

    if (!event) {
      return NextResponse.json(
        { error: 'Nome do evento é obrigatório' },
        { status: 400 }
      )
    }

    // Registrar evento
    await db.collection('analytics_events').add({
      event,
      category: category || 'general',
      data: data || {},
      userId: decodedToken.uid,
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    })

    return NextResponse.json({
      message: 'Evento registrado com sucesso',
    })

  } catch (error: any) {
    console.error('Erro ao registrar evento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

// Obter relatório personalizado
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    // Verificar se é admin
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.data()
    
    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const { 
      collection, 
      startDate, 
      endDate, 
      filters, 
      groupBy, 
      metrics 
    } = await request.json()

    if (!collection) {
      return NextResponse.json(
        { error: 'Coleção é obrigatória' },
        { status: 400 }
      )
    }

    // Construir query
    let query = db.collection(collection)

    // Aplicar filtros de data
    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate))
    }
    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate))
    }

    // Aplicar filtros adicionais
    if (filters && Array.isArray(filters)) {
      filters.forEach(filter => {
        if (filter.field && filter.operator && filter.value !== undefined) {
          query = query.where(filter.field, filter.operator, filter.value)
        }
      })
    }

    const snapshot = await query.get()
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    // Processar dados baseado no groupBy
    let processedData = documents
    
    if (groupBy) {
      const grouped = documents.reduce((acc, doc) => {
        const key = doc[groupBy] || 'Não especificado'
        if (!acc[key]) acc[key] = []
        acc[key].push(doc)
        return acc
      }, {} as Record<string, any[]>)

      processedData = Object.entries(grouped).map(([key, items]) => ({
        group: key,
        count: items.length,
        items: metrics ? items.map(item => {
          const result: any = { id: item.id }
          metrics.forEach((metric: string) => {
            result[metric] = item[metric]
          })
          return result
        }) : items,
      }))
    }

    return NextResponse.json({
      data: processedData,
      total: documents.length,
      collection,
      filters: {
        startDate,
        endDate,
        filters,
        groupBy,
        metrics,
      },
      generatedAt: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}