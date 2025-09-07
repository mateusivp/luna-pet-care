'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Car, MapPin, Clock, Star, Search, Filter, Calendar, DollarSign, Phone, Navigation } from 'lucide-react'

interface TripHistory {
  id: string
  petName: string
  petSpecies: string
  pickupAddress: string
  destinationAddress: string
  driverName: string
  driverRating: number
  vehicle: string
  plate: string
  status: 'completed' | 'cancelled'
  price: number
  distance: number
  duration: number // em minutos
  date: Date
  rating?: number
  feedback?: string
}

export default function TaxiDogHistoryPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [trips, setTrips] = useState<TripHistory[]>([])
  const [filteredTrips, setFilteredTrips] = useState<TripHistory[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTrip, setSelectedTrip] = useState<TripHistory | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Mock trip history data
    const mockTrips: TripHistory[] = [
      {
        id: '1',
        petName: 'Luna',
        petSpecies: 'Cão',
        pickupAddress: 'Rua das Flores, 123 - Vila Madalena',
        destinationAddress: 'Clínica VetCare - Rua Augusta, 456',
        driverName: 'Carlos Silva',
        driverRating: 4.8,
        vehicle: 'Honda Civic Branco',
        plate: 'ABC-1234',
        status: 'completed',
        price: 32.50,
        distance: 8.5,
        duration: 25,
        date: new Date('2024-01-15T14:30:00'),
        rating: 5,
        feedback: 'Excelente motorista, muito cuidadoso com a Luna!'
      },
      {
        id: '2',
        petName: 'Max',
        petSpecies: 'Cão',
        pickupAddress: 'Av. Paulista, 789 - Bela Vista',
        destinationAddress: 'PetShop Amigo Fiel - Rua Oscar Freire, 321',
        driverName: 'Ana Santos',
        driverRating: 4.9,
        vehicle: 'Toyota Corolla Prata',
        plate: 'DEF-5678',
        status: 'completed',
        price: 28.00,
        distance: 6.2,
        duration: 18,
        date: new Date('2024-01-12T10:15:00'),
        rating: 4
      },
      {
        id: '3',
        petName: 'Mia',
        petSpecies: 'Gato',
        pickupAddress: 'Rua da Consolação, 555 - Consolação',
        destinationAddress: 'Hospital Veterinário 24h - Rua Haddock Lobo, 888',
        driverName: 'João Oliveira',
        driverRating: 4.7,
        vehicle: 'Volkswagen Polo Azul',
        plate: 'GHI-9012',
        status: 'completed',
        price: 45.75,
        distance: 12.3,
        duration: 35,
        date: new Date('2024-01-08T16:45:00'),
        rating: 5,
        feedback: 'Muito atencioso, a Mia ficou calma durante toda a viagem.'
      },
      {
        id: '4',
        petName: 'Luna',
        petSpecies: 'Cão',
        pickupAddress: 'Rua das Flores, 123 - Vila Madalena',
        destinationAddress: 'Parque Ibirapuera - Portão 3',
        driverName: 'Maria Costa',
        driverRating: 4.6,
        vehicle: 'Chevrolet Onix Vermelho',
        plate: 'JKL-3456',
        status: 'cancelled',
        price: 0,
        distance: 0,
        duration: 0,
        date: new Date('2024-01-05T09:00:00')
      },
      {
        id: '5',
        petName: 'Max',
        petSpecies: 'Cão',
        pickupAddress: 'Av. Paulista, 789 - Bela Vista',
        destinationAddress: 'Clínica VetLife - Rua Estados Unidos, 654',
        driverName: 'Pedro Almeida',
        driverRating: 4.8,
        vehicle: 'Hyundai HB20 Preto',
        plate: 'MNO-7890',
        status: 'completed',
        price: 38.25,
        distance: 9.8,
        duration: 28,
        date: new Date('2024-01-03T13:20:00'),
        rating: 4,
        feedback: 'Pontual e educado.'
      }
    ]

    setTrips(mockTrips)
    setFilteredTrips(mockTrips)
  }, [user, loading, router])

  useEffect(() => {
    let filtered = trips

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(trip => 
        trip.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destinationAddress.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter)
    }

    setFilteredTrips(filtered)
  }, [trips, searchTerm, statusFilter])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Concluída</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  const totalTrips = trips.filter(t => t.status === 'completed').length
  const totalSpent = trips.filter(t => t.status === 'completed').reduce((sum, trip) => sum + trip.price, 0)
  const averageRating = trips.filter(t => t.rating).reduce((sum, trip) => sum + (trip.rating || 0), 0) / trips.filter(t => t.rating).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Histórico de Viagens</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as suas viagens do Taxi Dog
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTrips}</p>
                <p className="text-sm text-muted-foreground">Viagens Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
                <p className="text-sm text-muted-foreground">Total Gasto</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por pet, motorista ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trip History */}
      <div className="space-y-4">
        {filteredTrips.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Car className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma viagem encontrada</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Você ainda não fez nenhuma viagem com o Taxi Dog.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTrips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {trip.petName} ({trip.petSpecies})
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(trip.date)}
                        </p>
                      </div>
                      {getStatusBadge(trip.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-green-600 mt-1" />
                          <div>
                            <p className="text-sm font-medium">Origem</p>
                            <p className="text-sm text-muted-foreground">{trip.pickupAddress}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-red-600 mt-1" />
                          <div>
                            <p className="text-sm font-medium">Destino</p>
                            <p className="text-sm text-muted-foreground">{trip.destinationAddress}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium">Motorista</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{trip.driverName}</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{trip.driverRating}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {trip.vehicle} - {trip.plate}
                          </p>
                        </div>
                        
                        {trip.status === 'completed' && (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Preço</p>
                              <p className="text-lg font-bold text-primary">
                                {formatCurrency(trip.price)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {trip.distance}km • {trip.duration}min
                              </p>
                              {trip.rating && (
                                <div className="flex items-center gap-1 mt-1">
                                  {renderStars(trip.rating)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTrip(trip)
                      setShowDetails(true)
                    }}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Trip Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Viagem</DialogTitle>
            <DialogDescription>
              Informações completas sobre a viagem selecionada
            </DialogDescription>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pet</p>
                  <p className="font-semibold">{selectedTrip.petName} ({selectedTrip.petSpecies})</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data e Hora</p>
                  <p className="font-semibold">{formatDate(selectedTrip.date)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(selectedTrip.status)}
                </div>
                {selectedTrip.status === 'completed' && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Preço</p>
                    <p className="font-semibold text-primary">{formatCurrency(selectedTrip.price)}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Trajeto</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Origem</p>
                      <p className="text-sm text-muted-foreground">{selectedTrip.pickupAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-red-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium">Destino</p>
                      <p className="text-sm text-muted-foreground">{selectedTrip.destinationAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Motorista</h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{selectedTrip.driverName}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{selectedTrip.driverRating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedTrip.vehicle} - {selectedTrip.plate}
                    </p>
                  </div>
                </div>
              </div>

              {selectedTrip.rating && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Sua Avaliação</h4>
                  <div className="flex items-center gap-2">
                    {renderStars(selectedTrip.rating)}
                    <span className="text-sm font-medium">({selectedTrip.rating}/5)</span>
                  </div>
                  {selectedTrip.feedback && (
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                      "{selectedTrip.feedback}"
                    </p>
                  )}
                </div>
              )}

              {selectedTrip.status === 'completed' && (
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Navigation className="h-4 w-4 mr-2" />
                    Repetir Viagem
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Phone className="h-4 w-4 mr-2" />
                    Contatar Motorista
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}