'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  PawPrint,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Filter
} from 'lucide-react'
import Link from 'next/link'

interface Appointment {
  id: string
  clientName: string
  petName: string
  service: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  price: number
  notes?: string
  employee?: string
}

export default function AppointmentsManagement() {
  const { user, isAuthenticated, isAdmin } = useAuthStore()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - será substituído por dados reais do Firebase
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      clientName: 'Maria Silva',
      petName: 'Rex',
      service: 'Banho e Tosa',
      date: '2024-01-25',
      time: '09:00',
      status: 'confirmed',
      price: 80,
      employee: 'Ana Santos',
      notes: 'Pet muito dócil'
    },
    {
      id: '2',
      clientName: 'João Santos',
      petName: 'Bella',
      service: 'Consulta Veterinária',
      date: '2024-01-25',
      time: '10:30',
      status: 'pending',
      price: 120,
      notes: 'Primeira consulta'
    },
    {
      id: '3',
      clientName: 'Ana Costa',
      petName: 'Max',
      service: 'Vacinação',
      date: '2024-01-24',
      time: '14:00',
      status: 'completed',
      price: 60,
      employee: 'Dr. Carlos'
    },
    {
      id: '4',
      clientName: 'Pedro Lima',
      petName: 'Luna',
      service: 'Banho e Tosa',
      date: '2024-01-26',
      time: '11:00',
      status: 'cancelled',
      price: 80,
      notes: 'Cliente cancelou'
    }
  ]

  useEffect(() => {
    if (!isAuthenticated || !isAdmin()) {
      router.push('/login')
      return
    }

    // Simular carregamento de dados
    setTimeout(() => {
      setAppointments(mockAppointments)
      setIsLoading(false)
    }, 1000)
  }, [isAuthenticated, isAdmin, router])

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: Appointment['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: AlertCircle, text: 'Pendente' },
      confirmed: { variant: 'default' as const, icon: CheckCircle, text: 'Confirmado' },
      completed: { variant: 'default' as const, icon: CheckCircle, text: 'Concluído' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, text: 'Cancelado' }
    }
    
    const config = variants[status]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  const handleStatusChange = (appointmentId: string, newStatus: Appointment['status']) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      )
    )
  }

  if (!isAuthenticated || !isAdmin()) {
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
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestão de Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie todos os agendamentos</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>
                Criar um novo agendamento para um cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maria">Maria Silva</SelectItem>
                  <SelectItem value="joao">João Santos</SelectItem>
                  <SelectItem value="ana">Ana Costa</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar pet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rex">Rex</SelectItem>
                  <SelectItem value="bella">Bella</SelectItem>
                  <SelectItem value="max">Max</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banho">Banho e Tosa</SelectItem>
                  <SelectItem value="consulta">Consulta Veterinária</SelectItem>
                  <SelectItem value="vacina">Vacinação</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" />
              <Input type="time" />
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Agendar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter(a => a.date === '2024-01-25').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter(a => a.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {appointments.filter(a => a.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {appointments
                .filter(a => a.date === '2024-01-25' && a.status === 'completed')
                .reduce((sum, a) => sum + a.price, 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Agendamentos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os agendamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, pet ou serviço..."
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
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando agendamentos...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente/Pet</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {appointment.clientName}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <PawPrint className="h-3 w-3 mr-1" />
                          {appointment.petName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{appointment.service}</TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(appointment.date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {appointment.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(appointment.status)}
                    </TableCell>
                    <TableCell>
                      {appointment.employee || (
                        <span className="text-muted-foreground">Não atribuído</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        R$ {appointment.price.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {appointment.status === 'pending' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          >
                            Confirmar
                          </Button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(appointment.id, 'completed')}
                          >
                            Concluir
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredAppointments.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum agendamento encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}