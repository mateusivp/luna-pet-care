'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Car, MapPin, Clock, Phone, Star, Navigation, DollarSign, Calendar } from 'lucide-react'

interface Pet {
  id: string
  name: string
  species: string
  breed: string
  weight: number
}

interface Driver {
  id: string
  name: string
  rating: number
  vehicle: string
  plate: string
  phone: string
  photo?: string
  estimatedArrival: number // em minutos
}

interface TaxiRequest {
  id: string
  petId: string
  pickupAddress: string
  destinationAddress: string
  scheduledTime?: Date
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  driver?: Driver
  price: number
  createdAt: Date
}

export default function TaxiDogPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<string>('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isScheduled, setIsScheduled] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<TaxiRequest | null>(null)
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([])
  const [showDrivers, setShowDrivers] = useState(false)
  const [estimatedPrice, setEstimatedPrice] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Mock pets data
    const mockPets: Pet[] = [
      { id: '1', name: 'Luna', species: 'Cão', breed: 'Golden Retriever', weight: 25 },
      { id: '2', name: 'Max', species: 'Cão', breed: 'Bulldog Francês', weight: 12 },
      { id: '3', name: 'Mia', species: 'Gato', breed: 'Persa', weight: 4 }
    ]

    // Mock drivers data
    const mockDrivers: Driver[] = [
      {
        id: '1',
        name: 'Carlos Silva',
        rating: 4.8,
        vehicle: 'Honda Civic Branco',
        plate: 'ABC-1234',
        phone: '(11) 99999-1111',
        estimatedArrival: 5
      },
      {
        id: '2',
        name: 'Ana Santos',
        rating: 4.9,
        vehicle: 'Toyota Corolla Prata',
        plate: 'DEF-5678',
        phone: '(11) 99999-2222',
        estimatedArrival: 8
      },
      {
        id: '3',
        name: 'João Oliveira',
        rating: 4.7,
        vehicle: 'Volkswagen Polo Azul',
        plate: 'GHI-9012',
        phone: '(11) 99999-3333',
        estimatedArrival: 12
      }
    ]

    setPets(mockPets)
    setAvailableDrivers(mockDrivers)
  }, [user, loading, router])

  const calculatePrice = () => {
    // Simulação de cálculo de preço baseado na distância
    const basePrice = 15.00
    const pricePerKm = 2.50
    const estimatedDistance = Math.random() * 10 + 2 // 2-12 km
    const total = basePrice + (estimatedDistance * pricePerKm)
    setEstimatedPrice(total)
    return total
  }

  const handleRequestTaxi = () => {
    if (!selectedPet || !pickupAddress || !destinationAddress) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    const price = calculatePrice()
    setShowDrivers(true)
  }

  const selectDriver = (driver: Driver) => {
    const newRequest: TaxiRequest = {
      id: Date.now().toString(),
      petId: selectedPet,
      pickupAddress,
      destinationAddress,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      status: 'accepted',
      driver,
      price: estimatedPrice,
      createdAt: new Date()
    }

    setCurrentRequest(newRequest)
    setShowDrivers(false)
    
    // Simular progresso da viagem
    setTimeout(() => {
      setCurrentRequest(prev => prev ? { ...prev, status: 'in_progress' } : null)
    }, 3000)
  }

  const cancelRequest = () => {
    setCurrentRequest(null)
    setShowDrivers(false)
    setSelectedPet('')
    setPickupAddress('')
    setDestinationAddress('')
    setScheduledTime('')
    setIsScheduled(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

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
        <Car className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Taxi Dog</h1>
          <p className="text-muted-foreground">
            Transporte seguro e confortável para seu pet
          </p>
        </div>
      </div>

      {currentRequest ? (
        // Status da viagem atual
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Viagem em Andamento
            </CardTitle>
            <CardDescription>
              Acompanhe o status da sua solicitação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge 
                variant={currentRequest.status === 'accepted' ? 'default' : 'secondary'}
                className="text-sm"
              >
                {currentRequest.status === 'accepted' ? 'Motorista a Caminho' :
                 currentRequest.status === 'in_progress' ? 'Em Viagem' :
                 currentRequest.status === 'completed' ? 'Concluída' : 'Cancelada'}
              </Badge>
              <span className="text-lg font-semibold">
                {formatCurrency(currentRequest.price)}
              </span>
            </div>

            {currentRequest.driver && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Motorista</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{currentRequest.driver.name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{currentRequest.driver.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><strong>Veículo:</strong> {currentRequest.driver.vehicle}</p>
                      <p><strong>Placa:</strong> {currentRequest.driver.plate}</p>
                      <p><strong>Telefone:</strong> {currentRequest.driver.phone}</p>
                    </div>
                    <Button className="w-full" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Ligar para o Motorista
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detalhes da Viagem</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium">Origem</p>
                          <p className="text-sm text-muted-foreground">{currentRequest.pickupAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium">Destino</p>
                          <p className="text-sm text-muted-foreground">{currentRequest.destinationAddress}</p>
                        </div>
                      </div>
                      {currentRequest.scheduledTime && (
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-blue-600 mt-1" />
                          <div>
                            <p className="text-sm font-medium">Horário Agendado</p>
                            <p className="text-sm text-muted-foreground">
                              {currentRequest.scheduledTime.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={cancelRequest} 
                variant="destructive" 
                className="flex-1"
              >
                Cancelar Viagem
              </Button>
              <Button variant="outline" className="flex-1">
                <MapPin className="h-4 w-4 mr-2" />
                Ver no Mapa
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Formulário de solicitação
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitar Taxi Dog</CardTitle>
              <CardDescription>
                Preencha os dados para solicitar o transporte do seu pet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pet">Selecione o Pet</Label>
                <Select value={selectedPet} onValueChange={setSelectedPet}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map((pet) => (
                      <SelectItem key={pet.id} value={pet.id}>
                        {pet.name} - {pet.breed} ({pet.weight}kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickup">Endereço de Coleta</Label>
                <Input
                  id="pickup"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Digite o endereço de coleta"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Endereço de Destino</Label>
                <Input
                  id="destination"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  placeholder="Digite o endereço de destino"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="scheduled"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="scheduled">Agendar para depois</Label>
              </div>

              {isScheduled && (
                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Data e Hora</Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              )}

              <Button onClick={handleRequestTaxi} className="w-full">
                <Car className="h-4 w-4 mr-2" />
                Solicitar Taxi Dog
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mapa da Região</CardTitle>
              <CardDescription>
                Visualize a localização e motoristas disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    Mapa interativo será carregado aqui
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Integração com Google Maps
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog para seleção de motorista */}
      <Dialog open={showDrivers} onOpenChange={setShowDrivers}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Motoristas Disponíveis</DialogTitle>
            <DialogDescription>
              Escolha um motorista para sua viagem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-semibold">Preço Estimado</p>
                <p className="text-sm text-muted-foreground">Baseado na distância calculada</p>
              </div>
              <span className="text-2xl font-bold text-primary">
                {formatCurrency(estimatedPrice)}
              </span>
            </div>
            
            {availableDrivers.map((driver) => (
              <Card key={driver.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Car className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{driver.name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{driver.rating}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{driver.vehicle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{driver.estimatedArrival} min</p>
                      <Button 
                        onClick={() => selectDriver(driver)}
                        size="sm"
                        className="mt-2"
                      >
                        Escolher
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}