'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Calendar, 
  PawPrint, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Car,
  Settings
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalClients: number
  totalPets: number
  todayAppointments: number
  monthlyRevenue: number
  pendingAppointments: number
  activeTaxiRides: number
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isAdmin } = useAuthStore()
  const router = useRouter()

  // Mock data - será substituído por dados reais do Firebase
  const stats: DashboardStats = {
    totalClients: 156,
    totalPets: 234,
    todayAppointments: 12,
    monthlyRevenue: 15420,
    pendingAppointments: 8,
    activeTaxiRides: 3
  }

  useEffect(() => {
    if (!isAuthenticated || !isAdmin()) {
      router.push('/login')
    }
  }, [isAuthenticated, isAdmin, router])

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Bem-vindo, {user?.profile.name}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/settings">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pets</CardTitle>
            <PawPrint className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPets}</div>
            <p className="text-xs text-muted-foreground">
              +8% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingAppointments} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +15% em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendências</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Agendamentos aguardando confirmação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxi Dog Ativo</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTaxiRides}</div>
            <p className="text-xs text-muted-foreground">
              Corridas em andamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button asChild className="h-20">
          <Link href="/admin/clients" className="flex flex-col items-center justify-center">
            <Users className="h-6 w-6 mb-2" />
            Gerenciar Clientes
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-20">
          <Link href="/admin/appointments" className="flex flex-col items-center justify-center">
            <Calendar className="h-6 w-6 mb-2" />
            Agendamentos
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-20">
          <Link href="/admin/pets" className="flex flex-col items-center justify-center">
            <PawPrint className="h-6 w-6 mb-2" />
            Cadastro de Pets
          </Link>
        </Button>

        <Button asChild variant="outline" className="h-20">
          <Link href="/admin/taxi-dog" className="flex flex-col items-center justify-center">
            <Car className="h-6 w-6 mb-2" />
            Taxi Dog
          </Link>
        </Button>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>
            Últimas ações realizadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Novo agendamento criado</p>
                <p className="text-xs text-muted-foreground">Maria Silva - Banho e Tosa - há 5 min</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Cliente cadastrado</p>
                <p className="text-xs text-muted-foreground">João Santos - há 15 min</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Taxi Dog solicitado</p>
                <p className="text-xs text-muted-foreground">Pet: Rex - Destino: Clínica Veterinária - há 30 min</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}