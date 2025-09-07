'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Calendar, 
  PawPrint, 
  Clock, 
  MapPin,
  Bell,
  Plus,
  ArrowRight,
  Heart,
  Star,
  Car,
  Scissors,
  Stethoscope
} from 'lucide-react'
import Link from 'next/link'

interface Pet {
  id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'other'
  breed: string
  age: number
  photo?: string
  nextAppointment?: {
    id: string
    service: string
    date: string
    time: string
  }
}

interface Appointment {
  id: string
  petName: string
  petId: string
  service: string
  serviceType: 'grooming' | 'veterinary' | 'taxi' | 'boarding'
  date: string
  time: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  location?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'appointment' | 'reminder' | 'promotion' | 'system'
  isRead: boolean
  createdAt: string
}

export default function ClientDashboard() {
  const { user, isAuthenticated, isClient } = useAuthStore()
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - será substituído por dados reais do Firebase
  const mockPets: Pet[] = [
    {
      id: '1',
      name: 'Rex',
      species: 'dog',
      breed: 'Golden Retriever',
      age: 3,
      nextAppointment: {
        id: '1',
        service: 'Banho e Tosa',
        date: '2024-01-25',
        time: '14:00'
      }
    },
    {
      id: '2',
      name: 'Bella',
      species: 'dog',
      breed: 'Poodle',
      age: 2
    },
    {
      id: '3',
      name: 'Mimi',
      species: 'cat',
      breed: 'Persa',
      age: 5
    }
  ]

  const mockAppointments: Appointment[] = [
    {
      id: '1',
      petName: 'Rex',
      petId: '1',
      service: 'Banho e Tosa Completa',
      serviceType: 'grooming',
      date: '2024-01-25',
      time: '14:00',
      status: 'confirmed'
    },
    {
      id: '2',
      petName: 'Bella',
      petId: '2',
      service: 'Consulta Veterinária',
      serviceType: 'veterinary',
      date: '2024-01-28',
      time: '10:30',
      status: 'scheduled'
    },
    {
      id: '3',
      petName: 'Mimi',
      petId: '3',
      service: 'Taxi Dog - Ida ao Veterinário',
      serviceType: 'taxi',
      date: '2024-01-30',
      time: '09:00',
      status: 'scheduled',
      location: 'Clínica Veterinária São Francisco'
    }
  ]

  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Agendamento Confirmado',
      message: 'Seu agendamento para Rex (Banho e Tosa) foi confirmado para 25/01 às 14:00',
      type: 'appointment',
      isRead: false,
      createdAt: '2024-01-22T10:30:00Z'
    },
    {
      id: '2',
      title: 'Lembrete de Vacinação',
      message: 'Bella precisa renovar a vacina V10. Agende uma consulta veterinária.',
      type: 'reminder',
      isRead: false,
      createdAt: '2024-01-21T15:00:00Z'
    },
    {
      id: '3',
      title: 'Promoção Especial',
      message: '20% de desconto em banho e tosa durante o mês de janeiro!',
      type: 'promotion',
      isRead: true,
      createdAt: '2024-01-20T09:00:00Z'
    }
  ]

  useEffect(() => {
    if (!isAuthenticated || !isClient()) {
      router.push('/login')
      return
    }

    // Simular carregamento de dados
    setTimeout(() => {
      setPets(mockPets)
      setUpcomingAppointments(mockAppointments)
      setNotifications(mockNotifications)
      setIsLoading(false)
    }, 1000)
  }, [isAuthenticated, isClient, router])

  const getServiceIcon = (serviceType: Appointment['serviceType']) => {
    switch (serviceType) {
      case 'grooming':
        return <Scissors className="h-4 w-4" />
      case 'veterinary':
        return <Stethoscope className="h-4 w-4" />
      case 'taxi':
        return <Car className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'default'
      case 'scheduled':
        return 'secondary'
      case 'in_progress':
        return 'destructive'
      case 'completed':
        return 'outline'
      case 'cancelled':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado'
      case 'scheduled':
        return 'Agendado'
      case 'in_progress':
        return 'Em Andamento'
      case 'completed':
        return 'Concluído'
      case 'cancelled':
        return 'Cancelado'
      default:
        return 'Agendado'
    }
  }

  const getSpeciesEmoji = (species: Pet['species']) => {
    switch (species) {
      case 'dog':
        return '🐕'
      case 'cat':
        return '🐱'
      case 'bird':
        return '🐦'
      default:
        return '🐾'
    }
  }

  const unreadNotifications = notifications.filter(n => !n.isRead).length

  if (!isAuthenticated || !isClient()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p className="text-muted-foreground mb-4">Você não tem permissão para acessar esta página.</p>
          <Button asChild>
            <Link href="/login">Fazer Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Olá, {user?.displayName || 'Cliente'}! 👋</h1>
          <p className="text-muted-foreground">Bem-vindo ao seu painel de controle</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/client/notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meus Pets</CardTitle>
            <PawPrint className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pets.length}</div>
            <p className="text-xs text-muted-foreground">
              {pets.filter(p => p.nextAppointment).length} com agendamentos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingAppointments.filter(a => a.status === 'confirmed').length} confirmados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications}</div>
            <p className="text-xs text-muted-foreground">não lidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              4.8
              <Star className="h-4 w-4 ml-1 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">média dos serviços</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meus Pets */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Meus Pets</CardTitle>
              <CardDescription>Gerencie seus companheiros</CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link href="/client/pets/new">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Carregando pets...</p>
              </div>
            ) : pets.length > 0 ? (
              pets.map((pet) => (
                <div key={pet.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                  <Avatar>
                    <AvatarImage src={pet.photo} />
                    <AvatarFallback>
                      {getSpeciesEmoji(pet.species)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{pet.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {pet.breed} • {pet.age} {pet.age === 1 ? 'ano' : 'anos'}
                    </div>
                    {pet.nextAppointment && (
                      <div className="text-xs text-blue-600 mt-1">
                        Próximo: {pet.nextAppointment.service}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/client/pets/${pet.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <PawPrint className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">Nenhum pet cadastrado</p>
                <Button size="sm" asChild>
                  <Link href="/client/pets/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Pet
                  </Link>
                </Button>
              </div>
            )}
            
            {pets.length > 0 && (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/client/pets">
                  Ver Todos os Pets
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Próximos Agendamentos */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Próximos Agendamentos</CardTitle>
              <CardDescription>Seus serviços agendados</CardDescription>
            </div>
            <Button size="sm" asChild>
              <Link href="/client/appointments/new">
                <Plus className="h-4 w-4 mr-2" />
                Agendar
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Carregando agendamentos...</p>
              </div>
            ) : upcomingAppointments.length > 0 ? (
              upcomingAppointments.slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="flex items-center space-x-4 p-4 rounded-lg border">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    {getServiceIcon(appointment.serviceType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{appointment.service}</span>
                      <Badge variant={getStatusColor(appointment.status)}>
                        {getStatusText(appointment.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.petName} • {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                    </div>
                    {appointment.location && (
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {appointment.location}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Clock className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/client/appointments/${appointment.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">Nenhum agendamento próximo</p>
                <Button size="sm" asChild>
                  <Link href="/client/appointments/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Fazer Agendamento
                  </Link>
                </Button>
              </div>
            )}
            
            {upcomingAppointments.length > 3 && (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/client/appointments">
                  Ver Todos os Agendamentos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notificações Recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Notificações Recentes</CardTitle>
            <CardDescription>Fique por dentro das novidades</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/client/notifications">
              Ver Todas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Carregando notificações...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${
                    !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    !notification.isRead ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{notification.title}</div>
                    <div className="text-sm text-muted-foreground">{notification.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" asChild>
          <Link href="/client/appointments/new">
            <CardHeader className="text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Agendar Serviço</CardTitle>
              <CardDescription>Marque banho, tosa, consulta ou transporte</CardDescription>
            </CardHeader>
          </Link>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" asChild>
          <Link href="/client/taxi">
            <CardHeader className="text-center">
              <Car className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Taxi Dog</CardTitle>
              <CardDescription>Transporte seguro para seu pet</CardDescription>
            </CardHeader>
          </Link>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" asChild>
          <Link href="/client/pets/new">
            <CardHeader className="text-center">
              <PawPrint className="h-8 w-8 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Cadastrar Pet</CardTitle>
              <CardDescription>Adicione um novo companheiro</CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  )
}