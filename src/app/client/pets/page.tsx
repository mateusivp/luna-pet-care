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
  Calendar,
  Weight,
  Heart,
  ArrowLeft,
  Camera,
  MapPin,
  Phone,
  Clock,
  Stethoscope
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
  registrationDate: string
  photo?: string
  medicalNotes?: string
  vaccinations: string[]
  lastVaccination?: string
  nextVaccination?: string
  emergencyContact?: string
  veterinarian?: {
    name: string
    clinic: string
    phone: string
  }
  appointments: {
    total: number
    upcoming: number
    lastService?: {
      service: string
      date: string
    }
  }
}

export default function ClientPets() {
  const { user, isAuthenticated, isClient } = useAuthStore()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
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
      registrationDate: '2024-01-15',
      vaccinations: ['V8', 'V10', 'Antirrábica'],
      lastVaccination: '2023-12-15',
      nextVaccination: '2024-12-15',
      medicalNotes: 'Pet muito dócil, sem alergias conhecidas',
      emergencyContact: '(11) 99999-9999',
      veterinarian: {
        name: 'Dr. João Silva',
        clinic: 'Clínica Veterinária São Francisco',
        phone: '(11) 3333-3333'
      },
      appointments: {
        total: 15,
        upcoming: 1,
        lastService: {
          service: 'Banho e Tosa',
          date: '2024-01-20'
        }
      }
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
      registrationDate: '2024-01-10',
      vaccinations: ['V8', 'Antirrábica'],
      lastVaccination: '2023-11-10',
      nextVaccination: '2024-11-10',
      medicalNotes: 'Alergia a frango',
      emergencyContact: '(11) 88888-8888',
      veterinarian: {
        name: 'Dra. Maria Santos',
        clinic: 'Pet Care Veterinária',
        phone: '(11) 4444-4444'
      },
      appointments: {
        total: 8,
        upcoming: 0,
        lastService: {
          service: 'Consulta Veterinária',
          date: '2024-01-18'
        }
      }
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
      registrationDate: '2023-12-20',
      vaccinations: ['Tríplice Felina', 'Antirrábica'],
      lastVaccination: '2023-10-20',
      nextVaccination: '2024-10-20',
      medicalNotes: 'Gata muito calma, precisa de escovação regular',
      emergencyContact: '(11) 77777-7777',
      veterinarian: {
        name: 'Dr. Pedro Costa',
        clinic: 'Clínica Felina Especializada',
        phone: '(11) 5555-5555'
      },
      appointments: {
        total: 12,
        upcoming: 0,
        lastService: {
          service: 'Tosa Higiênica',
          date: '2023-12-30'
        }
      }
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
      setIsLoading(false)
    }, 1000)
  }, [isAuthenticated, isClient, router])

  const filteredPets = pets.filter(pet => 
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.breed.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const isVaccinationDue = (nextVaccination?: string) => {
    if (!nextVaccination) return false
    const nextDate = new Date(nextVaccination)
    const today = new Date()
    const diffTime = nextDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 30 && diffDays >= 0
  }

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
            <h1 className="text-3xl font-bold">Meus Pets</h1>
            <p className="text-muted-foreground">Gerencie seus companheiros</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/client/pets/new">
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Pet
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou raça..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pets Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <p>Carregando pets...</p>
        </div>
      ) : filteredPets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPets.map((pet) => (
            <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={pet.photo} />
                    <AvatarFallback className="text-2xl">
                      {getSpeciesIcon(pet.species)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{pet.name}</CardTitle>
                    <CardDescription>
                      {getSpeciesName(pet.species)} • {pet.breed}
                    </CardDescription>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">
                        {pet.age} {pet.age === 1 ? 'ano' : 'anos'}
                      </Badge>
                      <Badge variant="outline">
                        {pet.gender === 'male' ? 'Macho' : 'Fêmea'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Características */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Weight className="h-3 w-3 mr-1" />
                    <span>{pet.weight}kg</span>
                  </div>
                  <div className="flex items-center">
                    <Heart className="h-3 w-3 mr-1" />
                    <span>{pet.color}</span>
                  </div>
                </div>

                {/* Agendamentos */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Agendamentos</span>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-1 font-medium">{pet.appointments.total}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Próximos:</span>
                      <span className="ml-1 font-medium">{pet.appointments.upcoming}</span>
                    </div>
                  </div>
                  {pet.appointments.lastService && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Último: {pet.appointments.lastService.service} em {' '}
                      {new Date(pet.appointments.lastService.date).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>

                {/* Vacinação */}
                {pet.nextVaccination && (
                  <div className={`p-3 rounded-lg ${
                    isVaccinationDue(pet.nextVaccination) 
                      ? 'bg-yellow-50 border border-yellow-200' 
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Vacinação</span>
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-xs">
                      <div className="text-muted-foreground">
                        Próxima: {new Date(pet.nextVaccination).toLocaleDateString('pt-BR')}
                      </div>
                      {isVaccinationDue(pet.nextVaccination) && (
                        <Badge variant="destructive" className="mt-1 text-xs">
                          Vencendo em breve!
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Veterinário */}
                {pet.veterinarian && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Veterinário</span>
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="font-medium">{pet.veterinarian.name}</div>
                      <div className="text-muted-foreground">{pet.veterinarian.clinic}</div>
                      <div className="flex items-center text-muted-foreground">
                        <Phone className="h-3 w-3 mr-1" />
                        {pet.veterinarian.phone}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/client/pets/${pet.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/client/appointments/new?petId=${pet.id}`}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🐾</div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhum pet encontrado' : 'Nenhum pet cadastrado'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? 'Tente buscar com outros termos' 
                : 'Cadastre seu primeiro companheiro para começar'
              }
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link href="/client/pets/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Pet
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {pets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Link href="/client/pets/new">
              <CardHeader className="text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">Cadastrar Novo Pet</CardTitle>
                <CardDescription>Adicione mais um companheiro</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>
      )}
    </div>
  )
}