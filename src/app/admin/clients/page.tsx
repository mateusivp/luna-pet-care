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
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  PawPrint,
  Calendar,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  registrationDate: string
  status: 'active' | 'inactive'
  totalPets: number
  totalAppointments: number
  lastAppointment?: string
}

export default function ClientsManagement() {
  const { user, isAuthenticated, isAdmin } = useAuthStore()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - será substituído por dados reais do Firebase
  const mockClients: Client[] = [
    {
      id: '1',
      name: 'Maria Silva',
      email: 'maria.silva@email.com',
      phone: '(11) 99999-9999',
      address: 'Rua das Flores, 123 - São Paulo, SP',
      registrationDate: '2024-01-15',
      status: 'active',
      totalPets: 2,
      totalAppointments: 15,
      lastAppointment: '2024-01-20'
    },
    {
      id: '2',
      name: 'João Santos',
      email: 'joao.santos@email.com',
      phone: '(11) 88888-8888',
      address: 'Av. Paulista, 456 - São Paulo, SP',
      registrationDate: '2024-01-10',
      status: 'active',
      totalPets: 1,
      totalAppointments: 8,
      lastAppointment: '2024-01-18'
    },
    {
      id: '3',
      name: 'Ana Costa',
      email: 'ana.costa@email.com',
      phone: '(11) 77777-7777',
      address: 'Rua Augusta, 789 - São Paulo, SP',
      registrationDate: '2023-12-20',
      status: 'inactive',
      totalPets: 3,
      totalAppointments: 25,
      lastAppointment: '2023-12-30'
    }
  ]

  useEffect(() => {
    if (!isAuthenticated || !isAdmin()) {
      router.push('/login')
      return
    }

    // Simular carregamento de dados
    setTimeout(() => {
      setClients(mockClients)
      setIsLoading(false)
    }, 1000)
  }, [isAuthenticated, isAdmin, router])

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  )

  const handleDeleteClient = (clientId: string) => {
    // Implementar lógica de exclusão
    console.log('Excluir cliente:', clientId)
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
            <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
            <p className="text-muted-foreground">Gerencie todos os clientes cadastrados</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nome completo" />
              <Input placeholder="Email" type="email" />
              <Input placeholder="Telefone" />
              <Input placeholder="Endereço" />
              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancelar</Button>
                <Button>Cadastrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Retenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os clientes cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando clientes...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pets</TableHead>
                  <TableHead>Agendamentos</TableHead>
                  <TableHead>Último Atendimento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {client.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {client.email}
                        </div>
                        <div className="text-sm flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {client.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <PawPrint className="h-4 w-4 mr-1" />
                        {client.totalPets}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {client.totalAppointments}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.lastAppointment ? (
                        new Date(client.lastAppointment).toLocaleDateString('pt-BR')
                      ) : (
                        <span className="text-muted-foreground">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredClients.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}