'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const {
    notifications,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)

  // Atualizar notificações periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        refreshNotifications()
      }
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [isOpen, refreshNotifications])

  const getNotificationIcon = (type: string) => {
    const icons = {
      appointment: '📅',
      payment: '💳',
      taxi_dog: '🚗',
      general: '📢',
      promotion: '🎉',
    }
    return icons[type as keyof typeof icons] || '📢'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'text-red-600',
      normal: 'text-blue-600',
      low: 'text-gray-600',
    }
    return colors[priority as keyof typeof colors] || 'text-gray-600'
  }

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    
    if (notification.actionUrl) {
      setIsOpen(false)
      // Navegar para a URL da ação
      window.location.href = notification.actionUrl
    }
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "relative p-2 hover:bg-accent",
            className
          )}
        >
          <Bell className="h-5 w-5" />
          {stats.unread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {stats.unread > 99 ? '99+' : stats.unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          <div className="flex items-center space-x-2">
            {stats.unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-6 px-2 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
            <Link href="/client/notifications">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-3 w-3 mr-1" />
                Ver todas
              </Button>
            </Link>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="space-y-1">
              {recentNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      "flex items-start space-x-3 p-3 hover:bg-accent cursor-pointer transition-colors",
                      !notification.read && "bg-blue-50 border-l-2 border-l-blue-500"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex-shrink-0 text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={cn(
                          "text-sm font-medium truncate",
                          !notification.read && "font-semibold"
                        )}>
                          {notification.title}
                        </h4>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                          >
                            <X className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.body}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs px-1 py-0",
                            getPriorityColor(notification.priority)
                          )}
                        >
                          {notification.priority === 'high' ? 'Alta' :
                           notification.priority === 'low' ? 'Baixa' : 'Normal'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {index < recentNotifications.length - 1 && (
                    <Separator className="mx-3" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {recentNotifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link href="/client/notifications">
                <Button 
                  variant="outline" 
                  className="w-full text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Ver todas as notificações
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Componente para notificações em tempo real (usando Service Worker)
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { registerFCMToken } = useNotifications()

  useEffect(() => {
    // Registrar Service Worker para notificações
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration)
          
          // Solicitar permissão para notificações
          return Notification.requestPermission()
        })
        .then((permission) => {
          if (permission === 'granted') {
            console.log('Permissão para notificações concedida')
            
            // Aqui você pode integrar com Firebase Cloud Messaging
            // para obter o token FCM e registrá-lo
            // registerFCMToken(token, 'web')
          }
        })
        .catch((error) => {
          console.error('Erro ao registrar Service Worker:', error)
        })
    }
  }, [registerFCMToken])

  return <>{children}</>
}