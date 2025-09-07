'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Camera } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  birthDate: string
  emergencyContact: string
  emergencyPhone: string
  notes: string
  avatar?: string
  memberSince: Date
  totalAppointments: number
  totalSpent: number
}

export default function ProfilePage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Mock profile data
    const mockProfile: UserProfile = {
      id: '1',
      name: 'Maria Silva',
      email: 'maria.silva@email.com',
      phone: '(11) 99999-9999',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      birthDate: '1985-03-15',
      emergencyContact: 'João Silva',
      emergencyPhone: '(11) 88888-8888',
      notes: 'Prefere horários pela manhã. Tem alergia a alguns medicamentos.',
      memberSince: new Date('2023-01-15'),
      totalAppointments: 24,
      totalSpent: 1250.00
    }

    setProfile(mockProfile)
    setEditedProfile(mockProfile)
  }, [user, loading, router])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editedProfile) {
      setProfile(editedProfile)
      setIsEditing(false)
      // Aqui você salvaria no Firebase
    }
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (editedProfile) {
      setEditedProfile({
        ...editedProfile,
        [field]: value
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(date)
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais
            </p>
          </div>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button onClick={handleCancel} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="text-2xl">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold">{profile.name}</h3>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{profile.totalAppointments}</p>
                <p className="text-sm text-muted-foreground">Consultas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{formatCurrency(profile.totalSpent)}</p>
                <p className="text-sm text-muted-foreground">Gasto Total</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Cliente desde {formatDate(profile.memberSince)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Mantenha suas informações atualizadas para um melhor atendimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={editedProfile?.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                ) : (
                  <p className="p-2 bg-muted rounded">{profile.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editedProfile?.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                ) : (
                  <p className="p-2 bg-muted rounded">{profile.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editedProfile?.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                ) : (
                  <p className="p-2 bg-muted rounded">{profile.phone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                {isEditing ? (
                  <Input
                    id="birthDate"
                    type="date"
                    value={editedProfile?.birthDate || ''}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  />
                ) : (
                  <p className="p-2 bg-muted rounded">
                    {new Date(profile.birthDate).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      value={editedProfile?.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{profile.address}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  {isEditing ? (
                    <Input
                      id="city"
                      value={editedProfile?.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{profile.city}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  {isEditing ? (
                    <Input
                      id="state"
                      value={editedProfile?.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{profile.state}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  {isEditing ? (
                    <Input
                      id="zipCode"
                      value={editedProfile?.zipCode || ''}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{profile.zipCode}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contato de Emergência
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Nome</Label>
                  {isEditing ? (
                    <Input
                      id="emergencyContact"
                      value={editedProfile?.emergencyContact || ''}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{profile.emergencyContact}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Telefone</Label>
                  {isEditing ? (
                    <Input
                      id="emergencyPhone"
                      value={editedProfile?.emergencyPhone || ''}
                      onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{profile.emergencyPhone}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              {isEditing ? (
                <Textarea
                  id="notes"
                  value={editedProfile?.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Adicione observações importantes sobre você ou seus pets..."
                  rows={3}
                />
              ) : (
                <p className="p-2 bg-muted rounded min-h-[80px]">
                  {profile.notes || 'Nenhuma observação adicionada.'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}