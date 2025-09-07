'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  Edit, 
  Trash2, 
  Scissors,
  Bath,
  Stethoscope,
  Car,
  ArrowLeft,
  Filter,
  Clock,
  DollarSign,
  Star,
  Users
} from 'lucide-react'
import Link from 'next/link'

interface Service {
  id: string
  name: string
  category: 'grooming' | 'veterinary' | 'taxi' | 'boarding' | 'training'
  description: string
  duration: number // em minutos
  price: number
  isActive: boolean
  popularity: number // número de agendamentos
  rating: number
  requirements?: string[]
  availableFor: ('dog' | 'cat' | 'bird' | 'other')[]
  createdAt: string
  updatedAt: string
}

export default function ServicesManagement() {
  const { user, isAuthenticated, isAdmin } = useAuthStore()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - será substituído por dados reais do Firebase
  const mockServices: Service[] = [
    {
      id: '1',
      name: 'Banho e Tosa Completa',
      category: 'grooming',
      description: 'Banho completo com shampoo especial, tosa higiênica, corte de unhas e limpeza de ouvidos',
      duration: 120,
      price: 80.00,
      isActive: true,
      popularity: 45,
      rating: 4.8,
      requirements: ['Pet vacinado', 'Sem pulgas'],
      availableFor: ['dog', 'cat'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Consulta Veterinária',
      category: 'veterinary',
      description: 'Consulta completa com veterinário especializado, exame físico e orientações',
      duration: 60,
      price: 120.00,
      isActive: true,
      popularity: 32,
      rating: 4.9,
      requirements: ['Carteira de vacinação'],
      availableFor: ['dog', 'cat', 'bird', 'other'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-10'
    },
    {
      id: '3',
      name: 'Taxi Dog - Transporte',
      category: 'taxi',
      description: 'Transporte seguro para seu pet com motorista especializado e veículo adaptado',
      duration: 30,
      price: 25.00,
      isActive: true,
      popularity: 28,
      rating: 4.7,
      requirements: ['Pet socializado'],
      availableFor: ['dog', 'cat'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-20'
    },
    {
      id: '4',
      name: 'Hotel para Pets',
      category: 'boarding',
      description: 'Hospedagem completa com cuidados 24h, alimentação e recreação',
      duration: 1440, // 24 horas
      price: 150.00,
      isActive: true,
      popularity: 18,
      rating: 4.6,
      requirements: ['Vacinação em dia', 'Exame parasitológico'],
      availableFor: ['dog', 'cat'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-12'
    },
    {
      id: '5',
      name: 'Adestramento Básico',
      category: 'training',
      description: 'Treinamento básico de obediência e socialização para cães',
      duration: 90,
      price: 100.00,
      isActive: false,
      popularity: 12,
      rating: 4.5,
      requirements: ['Cão acima de 3 meses'],
      availableFor: ['dog'],
      createdAt: '2023-12-15',
      updatedAt: '2024-01-05'
    }
  ]

  useEffect(() => {
    if (!isAuthenticated || !isAdmin()) {
      router.push('/login')
      return
    }

    // Simular carregamento de dados
    setTimeout(() => {
      setServices(mockServices)
      setIsLoading(false)
    }, 1000)
  }, [isAuthenticated, isAdmin, router])

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const getCategoryIcon = (category: Service['category']) => {
    switch (category) {
      case 'grooming':
        return <Scissors className="h-4 w-4" />
      case 'veterinary':
        return <Stethoscope className="h-4 w-4" />
      case 'taxi':
        return <Car className="h-4 w-4" />
      case 'boarding':
        return <Bath className="h-4 w-4" />
      case 'training':
        return <Users className="h-4 w-4" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  const getCategoryName = (category: Service['category']) => {
    switch (category) {
      case 'grooming':
        return 'Estética'
      case 'veterinary':
        return 'Veterinário'
      case 'taxi':
        return 'Transporte'
      case 'boarding':
        return 'Hospedagem'
      case 'training':
        return 'Adestramento'
      default:
        return 'Outro'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes >= 1440) {
      return `${Math.floor(minutes / 1440)} dia(s)`
    } else if (minutes >= 60) {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}min`
    } else {
      return `${minutes}min`
    }
  }

  const handleDeleteService = (serviceId: string) => {
    // Implementar lógica de exclusão
    console.log('Excluir serviço:', serviceId)
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
            <h1 className="text-3xl font-bold">Gestão de Serviços</h1>
            <p className="text-muted-foreground">Gerencie todos os serviços oferecidos</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Serviço</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo serviço
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Input placeholder="Nome do serviço" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grooming">Estética</SelectItem>
                    <SelectItem value="veterinary">Veterinário</SelectItem>
                    <SelectItem value="taxi">Transporte</SelectItem>
                    <SelectItem value="boarding">Hospedagem</SelectItem>
                    <SelectItem value="training">Adestramento</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Duração (minutos)" type="number" />
                <Input placeholder="Preço (R$)" type="number" step="0.01" />
              </div>
              <div className="space-y-4">
                <Textarea placeholder="Descrição do serviço" className="h-32" />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Disponível para:</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Cães</Badge>
                    <Badge variant="outline">Gatos</Badge>
                    <Badge variant="outline">Aves</Badge>
                    <Badge variant="outline">Outros</Badge>
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <Textarea placeholder="Requisitos (opcional)" />
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline">Cancelar</Button>
                  <Button>Cadastrar</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.filter(s => s.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mais Popular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {services.sort((a, b) => b.popularity - a.popularity)[0]?.name || 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.length > 0 
                ? (services.reduce((acc, s) => acc + s.rating, 0) / services.length).toFixed(1)
                : '0.0'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os serviços oferecidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="grooming">Estética</SelectItem>
                <SelectItem value="veterinary">Veterinário</SelectItem>
                <SelectItem value="taxi">Transporte</SelectItem>
                <SelectItem value="boarding">Hospedagem</SelectItem>
                <SelectItem value="training">Adestramento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando serviços...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Popularidade</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {service.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(service.category)}
                        <span>{getCategoryName(service.category)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDuration(service.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center font-medium">
                        <DollarSign className="h-4 w-4 mr-1" />
                        R$ {service.price.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{service.popularity}</div>
                        <div className="text-xs text-muted-foreground">agendamentos</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{service.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? 'default' : 'secondary'}>
                        {service.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteService(service.id)}
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

          {filteredServices.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum serviço encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}