'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Bell, Check, Clock, AlertCircle, Calendar, Heart, MapPin } from 'lucide-react'

interface Notification {
  id: string
  type: 'appointment' | 'reminder' | 'promotion' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'low' | 'medium' | 'high'
}

export default function NotificationsPage() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Mock notifications data
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'appointment',
        title: 'Consulta Agendada',
        message: 'Sua consulta com Dr. Silva está marcada para amanhã às 14:00',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        priority: 'high'
      },
      {
        id: '2',
        type: 'reminder',
        title: 'Lembrete de Vacinação',
        message: 'Luna precisa tomar a vacina antirrábica na próxima semana',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: false,
        priority: 'medium'
      },
      {
        id: '3',
        type: 'system',
        title: 'Taxi Dog a Caminho',
        message: 'Seu motorista chegará em 5 minutos. Placa: ABC-1234',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        read: true,
        priority: 'high'
      },
      {
        id: '4',
        type: 'promotion',
        title: 'Promoção Especial',
        message: '20% de desconto em banho e tosa até o final do mês!',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
        priority: 'low'
      },
      {
        id: '5',
        type: 'appointment',
        title: 'Consulta Concluída',
        message: 'A consulta do Max foi concluída. Relatório disponível.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        read: true,
        priority: 'medium'
      }
    ]

    setNotifications(mockNotifications)
  }, [user, loading, router])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-5 w-5" />
      case 'reminder':
        return <Clock className="h-5 w-5" />
      case 'promotion':
        return <Heart className="h-5 w-5" />
      case 'system':
        return <MapPin className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days} dia${days > 1 ? 's' : ''} atrás`
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`
    } else {
      return 'Agora mesmo'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
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
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Notificações</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 
                ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
                : 'Todas as notificações foram lidas'
              }
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <Check className="h-4 w-4 mr-2" />
            Marcar Todas como Lidas
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
              <p className="text-muted-foreground text-center">
                Você não tem notificações no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all hover:shadow-md ${
                !notification.read ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${
                    notification.type === 'appointment' ? 'bg-blue-100 text-blue-600' :
                    notification.type === 'reminder' ? 'bg-yellow-100 text-yellow-600' :
                    notification.type === 'promotion' ? 'bg-pink-100 text-pink-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{notification.title}</h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(notification.priority)}>
                          {notification.priority === 'high' ? 'Alta' :
                           notification.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground">{notification.message}</p>
                    
                    {!notification.read && (
                      <Button 
                        onClick={() => markAsRead(notification.id)}
                        variant="ghost" 
                        size="sm"
                        className="mt-2"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Marcar como Lida
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}