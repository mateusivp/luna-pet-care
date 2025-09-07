"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/store/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso"
      })
      router.push('/login')
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout",
        variant: "destructive"
      })
    }
  }

  const getRoleDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin'
      case 'client':
        return '/client'
      case 'driver':
        return '/driver'
      case 'employee':
        return '/admin/appointments'
      default:
        return '/dashboard'
    }
  }

  const handleGoToRoleDashboard = () => {
    const roleDashboard = getRoleDashboard()
    if (roleDashboard !== '/dashboard') {
      router.push(roleDashboard)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bem-vindo, {user.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Dashboard Principal - App Luna
              </p>
            </div>
            <div className="flex gap-2">
              {getRoleDashboard() !== '/dashboard' && (
                <Button 
                  onClick={handleGoToRoleDashboard}
                  variant="outline"
                >
                  Ir para {user.role === 'admin' ? 'Painel Admin' : 
                           user.role === 'client' ? 'Painel Cliente' :
                           user.role === 'driver' ? 'Painel Motorista' :
                           'Meu Painel'}
                </Button>
              )}
              <Button 
                onClick={handleLogout}
                variant="outline"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Usuário</CardTitle>
              <CardDescription>
                Seus dados de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Nome:</span> {user.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {user.email}
                </div>
                <div>
                  <span className="font-medium">Role:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800' :
                    user.role === 'employee' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'client' ? 'bg-green-100 text-green-800' :
                    user.role === 'driver' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'admin' ? 'Administrador' :
                     user.role === 'employee' ? 'Funcionário' :
                     user.role === 'client' ? 'Cliente' :
                     user.role === 'driver' ? 'Motorista' :
                     user.role}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acesso Rápido</CardTitle>
              <CardDescription>
                Navegue para as principais seções
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.role === 'admin' && (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => router.push('/admin')}
                    >
                      🏢 Painel Administrativo
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => router.push('/admin/clients')}
                    >
                      👥 Gerenciar Clientes
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => router.push('/admin/appointments')}
                    >
                      📅 Agendamentos
                    </Button>
                  </>
                )}
                
                {user.role === 'client' && (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => router.push('/client')}
                    >
                      🏠 Meu Painel
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => router.push('/pets')}
                    >
                      🐕 Meus Pets
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => router.push('/appointments')}
                    >
                      📅 Meus Agendamentos
                    </Button>
                  </>
                )}
                
                {user.role === 'driver' && (
                  <>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => router.push('/driver')}
                    >
                      🚗 Painel Motorista
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start"
                      onClick={() => router.push('/taxi-dog')}
                    >
                      🐕‍🦺 Taxi Dog
                    </Button>
                  </>
                )}
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => router.push('/profile')}
                >
                  ⚙️ Configurações
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sistema</CardTitle>
              <CardDescription>
                Informações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Versão:</span> 1.0.0
                </div>
                <div>
                  <span className="font-medium">Ambiente:</span> {process.env.NODE_ENV}
                </div>
                <div>
                  <span className="font-medium">Última atualização:</span> {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-gray-600">Em desenvolvimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Agendamentos Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-gray-600">Em desenvolvimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Receita Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ -</div>
              <p className="text-xs text-gray-600">Em desenvolvimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pets Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-gray-600">Em desenvolvimento</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}