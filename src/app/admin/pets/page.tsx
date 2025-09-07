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
  User, 
  PawPrint,
  Calendar,
  Weight,
  Ruler,
  Heart,
  ArrowLeft,
  Filter,
  Camera
} from 'lucide-react'
import Link from 'next/link'

interface Pet {
  id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'other'
  breed: string
  age: number
  weight: number
  color: string
  gender: 'male' | 'female'
  ownerName: string
  ownerId: string
  registrationDate: string
  lastVisit?: string
  totalVisits: number
  isActive: boolean
  photo?: string
  medicalNotes?: string
  vaccinations: string[]
}

export default function PetsManagement() {
  const { user, isAuthenticated, isAdmin } = useAuthStore()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState<string>('all')
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - será substituído por dados reais do Firebase
  const mockPets: Pet[] = [
    {
      id: '1',
      name: 'Rex',
      species: 'dog',
      breed: 'Golden Retriever',
      age: 3,
      weight: 28.5,
      color: 'Dourado',
      gender: 'male',
      ownerName: 'Maria Silva',
      ownerId: '1',
      registrationDate: '2024-01-15',
      lastVisit: '2024-01-20',
      totalVisits: 15,
      isActive: true,
      vaccinations: ['V8', 'V10', 'Antirrábica'],
      medicalNotes: 'Pet muito dócil, sem alergias conhecidas'
    },
    {
      id: '2',
      name: 'Bella',
      species: 'dog',
      breed: 'Poodle',
      age: 2,
      weight: 8.2,
      color: 'Branco',
      gender: 'female',
      ownerName: 'João Santos',
      ownerId: '2',
      registrationDate: '2024-01-10',
      lastVisit: '2024-01-18',
      totalVisits: 8,
      isActive: true,
      vaccinations: ['V8', 'Antirrábica'],
      medicalNotes: 'Alergia a frango'
    },
    {
      id: '3',
      name: 'Mimi',
      species: 'cat',
      breed: 'Persa',
      age: 5,
      weight: 4.1,
      color: 'Cinza',
      gender: 'female',
      ownerName: 'Ana Costa',
      ownerId: '3',
      registrationDate: '2023-12-20',
      lastVisit: '2023-12-30',
      totalVisits: 12,
      isActive: true,
      vaccinations: ['Tríplice Felina', 'Antirrábica'],
      medicalNotes: 'Gata muito calma, precisa de escovação regular'
    },
    {
      id: '4',
      name: 'Thor',
      species: 'dog',
      breed: 'Rottweiler',
      age: 4,
      weight: 45.0,
      color: 'Preto e Marrom',
      gender: 'male',
      ownerName: 'Pedro Lima',
      ownerId: '4',
      registrationDate: '2023-11-15',
      totalVisits: 6,
      isActive: false,
      vaccinations: ['V10', 'Antirrábica'],
      medicalNotes: 'Cão grande, precisa de contenção adequada'
    }
  ]

  useEffect(() => {
    if (!isAuthenticated || !isAdmin()) {
      router.push('/login')
      return
    }

    // Simular carregamento de dados
    setTimeout(() => {
      setPets(mockPets)
      setIsLoading(false)
    }, 1000)
  }, [isAuthenticated, isAdmin, router])

  const filteredPets = pets.filter(pet => {
    const matchesSearch = 
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSpecies = speciesFilter === 'all' || pet.species === speciesFilter
    
    return matchesSearch && matchesSpecies
  })

  const getSpeciesIcon = (species: Pet['species']) => {
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

  const getSpeciesName = (species: Pet['species']) => {
    switch (species) {
      case 'dog':
        return 'Cão'
      case 'cat':
        return 'Gato'
      case 'bird':
        return 'Ave'
      default:
        return 'Outro'
    }
  }

  const handleDeletePet = (petId: string) => {
    // Implementar lógica de exclusão
    console.log('Excluir pet:', petId)
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
            <h1 className="text-3xl font-bold">Gestão de Pets</h1>
            <p className="text-muted-foreground">Gerencie todos os pets cadastrados</p>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Pet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Pet</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo pet
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Input placeholder="Nome do pet" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Espécie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Cão</SelectItem>
                    <SelectItem value="cat">Gato</SelectItem>
                    <SelectItem value="bird">Ave</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Raça" />
                <Input placeholder="Idade (anos)" type="number" />
                <Input placeholder="Peso (kg)" type="number" step="0.1" />
              </div>
              <div className="space-y-4">
                <Input placeholder="Cor" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Macho</SelectItem>
                    <SelectItem value="female">Fêmea</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Proprietário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maria">Maria Silva</SelectItem>
                    <SelectItem value="joao">João Santos</SelectItem>
                    <SelectItem value="ana">Ana Costa</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Adicionar Foto
                  </Button>
                </div>
              </div>
              <div className="col-span-2">
                <Input placeholder="Observações médicas" />
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
            <CardTitle className="text-sm font-medium">Total de Pets</CardTitle>
            <PawPrint className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cães</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pets.filter(p => p.species === 'dog').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gatos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pets.filter(p => p.species === 'cat').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pets Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pets.filter(p => p.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pets List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pets</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os pets cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, raça ou proprietário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="dog">Cães</SelectItem>
                <SelectItem value="cat">Gatos</SelectItem>
                <SelectItem value="bird">Aves</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p>Carregando pets...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pet</TableHead>
                  <TableHead>Espécie/Raça</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Características</TableHead>
                  <TableHead>Visitas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPets.map((pet) => (
                  <TableRow key={pet.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={pet.photo} />
                          <AvatarFallback>
                            {getSpeciesIcon(pet.species)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{pet.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {pet.age} {pet.age === 1 ? 'ano' : 'anos'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getSpeciesName(pet.species)}</div>
                        <div className="text-sm text-muted-foreground">{pet.breed}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {pet.ownerName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center">
                          <Weight className="h-3 w-3 mr-1" />
                          {pet.weight}kg
                        </div>
                        <div className="text-sm flex items-center">
                          <Heart className="h-3 w-3 mr-1" />
                          {pet.gender === 'male' ? 'Macho' : 'Fêmea'}
                        </div>
                        <div className="text-sm">{pet.color}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pet.totalVisits}</div>
                        {pet.lastVisit && (
                          <div className="text-sm text-muted-foreground">
                            Última: {new Date(pet.lastVisit).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pet.isActive ? 'default' : 'secondary'}>
                        {pet.isActive ? 'Ativo' : 'Inativo'}
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
                          onClick={() => handleDeletePet(pet.id)}
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

          {filteredPets.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum pet encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}