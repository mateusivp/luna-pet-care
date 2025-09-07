'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Search, 
  Plus, 
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Filter,
  Scissors,
  Stethoscope,
  Car,
  X,
  Edit,
  Star,
  Phone,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'

interface Appointment {
  id: string
  petName: string
  petId: string
  petPhoto?: string
  service: string
  serviceType: 'grooming' | 'veterinary' | 'taxi' | 'boarding' | 'training'
  date: string
  time: string
  duration: number // em minutos
  price: number
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  location?: string
  professional?: {
    name: string
    photo?: string
    rating: number
  }
  notes?: string
  createdAt: string
  canCancel: boolean
  canReschedule: boolean
}

export default function ClientAppointments() {
  const { user, isAuthenticated, isClient } = useAuthStore()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - será substituído por dados reais do Firebase
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      petName: 'Rex',
      petId: '1',
      service: 'Banho e Tosa Completa',
      serviceType: 'grooming',
      date: '2024-01-25',
      time: '14:00',
      duration: 120,
      price: 80.00,
      status: 'confirmed',
      professional: {
        name: 'Ana Silva',
        rating: 4.8
      },
      notes: 'Pet muito dócil, gosta de carinho',
      createdAt: '2024-01-22T10:30:00Z',
      canCancel: true,
      canReschedule: true
    },
    {
      id: '2',
      petName: 'Bella',
      petId: '2',
      service: 'Consulta Veterinária',
      serviceType: 'veterinary',
      date: '2024-01-28',
      time: '10:30',
      duration: 60,
      price: 120.00,
      status: 'scheduled',
      location: 'Clínica Veterinária São Francisco',
      professional: {
        name: 'Dr. João Santos',
        rating: 4.9
      },
      notes: 'Consulta de rotina + vacinação',
      createdAt: '2024-01-20T15:00:00Z',
      canCancel: true,
      canReschedule: true
    },
    {
      id: '3',
      petName: 'Mimi',
      petId: '3',
      service: 'Taxi Dog - Ida ao Veterinário',
      serviceType: 'taxi',
      date: '2024-01-30',
      time: '09:00',
      duration: 30,
      price: 25.00,
      status: 'scheduled',
      location: 'Clínica Veterinária São Francisco',
      professional: {
        name: 'Carlos Lima',
        rating: 4.7
      },
      createdAt: '2024-01-21T09:00:00Z',
      canCancel: true,
      canReschedule: true
    },
    {
      id: '4',
      petName: 'Rex',
      petId: '1',
      service: 'Banho e Tosa',
      serviceType: 'grooming',
      date: '2024-01-20',
      time: '15:00',
      duration: 90,
      price: 60.00,
      status: 'completed',
      professional: {
        name: 'Maria Costa',
        rating: 4.6
      },
      notes: 'Serviço realizado com sucesso',
      createdAt: '2024-01-18T11:00:00Z',
      canCancel: false,
      canReschedule: false
    },
    {
      id: '5',
      petName: 'Bella',
      petId: '2',
      service: 'Consulta de Emergência',
      serviceType: 'veterinary',
      date: '2024-01-15',
      time: '16:30',
      duration: 45,
      price: 150.00,
      status: 'cancelled',
      location: 'Clínica 24h Pet Emergency',
      professional: {
        name: 'Dra. Paula Oliveira',
        rating: 4.8
      },
      notes: 'Cancelado - pet se recuperou',
      createdAt: '2024-01-15T14:00:00Z',
      canCancel: false,
      canReschedule: false
    }
  ]

  useEffect(() => {
    if (!isAuthenticated || !isClient()) {
      router.push('/login')
      return
    }

    // Simular carregamento de dados
    setTimeout(() => {
      setAppointments(mockAppointments)
      setIsLoading(false)
    }, 1000)
  }, [isAuthenticated, isClient, router])

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.professional?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

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

  const handleCancelAppointment = (appointmentId: string) => {
    // Implementar lógica de cancelamento
    console.log('Cancelar agendamento:', appointmentId)
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' as const, canCancel: false, canReschedule: false }
          : apt
      )
    )
  }

  const upcomingAppointments = appointments.filter(apt => 
    ['scheduled', 'confirmed'].includes(apt.status)
  ).length

  const completedAppointments = appointments.filter(apt => 
    apt.status === 'completed'
  ).length

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
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/client">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Meus Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie seus serviços agendados</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/client/appointments/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {appointments
                .filter(apt => apt.status === 'completed')
                .reduce((sum, apt) => sum + apt.price, 0)
                .toFixed(2)
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por pet, serviço ou profissional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="scheduled">Agendados</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p>Carregando agendamentos...</p>
        </div>
      ) : filteredAppointments.length > 0 ? (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Service Icon */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    {getServiceIcon(appointment.serviceType)}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{appointment.service}</h3>
                        <p className="text-muted-foreground">
                          {appointment.petName} • {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(appointment.status)}>
                          {getStatusText(appointment.status)}
                        </Badge>
                        <span className="font-semibold">R$ {appointment.price.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {/* Duration */}
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {appointment.duration >= 60 
                            ? `${Math.floor(appointment.duration / 60)}h ${appointment.duration % 60}min`
                            : `${appointment.duration}min`
                          }
                        </span>
                      </div>

                      {/* Location */}
                      {appointment.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{appointment.location}</span>
                        </div>
                      )}

                      {/* Professional */}
                      {appointment.professional && (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={appointment.professional.photo} />
                            <AvatarFallback className="text-xs">
                              {appointment.professional.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{appointment.professional.name}</span>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1">{appointment.professional.rating}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {appointment.notes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-2">
                      {appointment.status === 'scheduled' || appointment.status === 'confirmed' ? (
                        <>
                          {appointment.canReschedule && (
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Reagendar
                            </Button>
                          )}
                          
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Contato
                          </Button>
                          
                          {appointment.canCancel && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <X className="h-4 w-4 mr-2" />
                                  Cancelar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Não, manter</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Sim, cancelar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </>
                      ) : appointment.status === 'completed' ? (
                        <>
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-2" />
                            Avaliar
                          </Button>
                          <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4 mr-2" />
                            Reagendar
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhum agendamento encontrado' 
                : 'Nenhum agendamento ainda'
              }
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Faça seu primeiro agendamento para começar'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button asChild>
                <Link href="/client/appointments/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Fazer Primeiro Agendamento
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {appointments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" asChild>
            <Link href="/client/appointments/new">
              <CardHeader className="text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">Novo Agendamento</CardTitle>
                <CardDescription>Agende um novo serviço para seu pet</CardDescription>
              </CardHeader>
            </Link>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-shadow" asChild>
            <Link href="/client/taxi">
              <CardHeader className="text-center">
                <Car className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">Taxi Dog</CardTitle>
                <CardDescription>Transporte rápido e seguro</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      )}
    </div>
  )
}