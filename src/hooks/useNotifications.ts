'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  body: string
  type: 'appointment' | 'payment' | 'taxi_dog' | 'general' | 'promotion'
  priority: 'high' | 'normal' | 'low'
  read: boolean
  imageUrl?: string
  actionUrl?: string
  data: Record<string, any>
  createdAt: string
  readAt?: string
}

interface NotificationStats {
  total: number
  unread: number
  read: number
}

interface NotificationPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface UseNotificationsReturn {
  notifications: Notification[]
  stats: NotificationStats
  pagination: NotificationPagination | null
  loading: boolean
  error: string | null
  // Funções
  fetchNotifications: (options?: FetchOptions) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markMultipleAsRead: (notificationIds: string[]) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  deleteAllRead: () => Promise<void>
  deleteAll: () => Promise<void>
  sendNotification: (data: SendNotificationData) => Promise<void>
  registerFCMToken: (token: string, deviceType: 'web' | 'android' | 'ios') => Promise<void>
  updatePreferences: (preferences: Record<string, boolean>) => Promise<void>
  // Estados
  refreshNotifications: () => void
}

interface FetchOptions {
  page?: number
  limit?: number
  type?: string
  unreadOnly?: boolean
  priority?: string
}

interface SendNotificationData {
  title: string
  body: string
  userId?: string
  userIds?: string[]
  role?: 'admin' | 'client'
  type: 'appointment' | 'payment' | 'taxi_dog' | 'general' | 'promotion'
  data?: Record<string, string>
  imageUrl?: string
  actionUrl?: string
  priority?: 'high' | 'normal' | 'low'
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
  })
  const [pagination, setPagination] = useState<NotificationPagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função para fazer requisições autenticadas
  const makeAuthenticatedRequest = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ) => {
    if (!user) throw new Error('Usuário não autenticado')
    
    const token = await user.getIdToken()
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
  }, [user])

  // Buscar notificações
  const fetchNotifications = useCallback(async (options: FetchOptions = {}) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.page) params.append('page', options.page.toString())
      if (options.limit) params.append('limit', options.limit.toString())
      if (options.type) params.append('type', options.type)
      if (options.unreadOnly) params.append('unread', 'true')
      if (options.priority) params.append('priority', options.priority)

      const response = await makeAuthenticatedRequest(
        `/api/notifications?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error('Erro ao buscar notificações')
      }

      const data = await response.json()
      setNotifications(data.notifications)
      setStats(data.stats)
      setPagination(data.pagination)
    } catch (err: any) {
      setError(err.message)
      toast.error('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }, [user, makeAuthenticatedRequest])

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return

    try {
      const response = await makeAuthenticatedRequest('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ notificationId }),
      })

      if (!response.ok) {
        throw new Error('Erro ao marcar notificação como lida')
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        )
      )

      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
        read: prev.read + 1,
      }))
    } catch (err: any) {
      toast.error('Erro ao marcar notificação como lida')
    }
  }, [user, makeAuthenticatedRequest])

  // Marcar múltiplas notificações como lidas
  const markMultipleAsRead = useCallback(async (notificationIds: string[]) => {
    if (!user) return

    try {
      const response = await makeAuthenticatedRequest('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ notificationIds }),
      })

      if (!response.ok) {
        throw new Error('Erro ao marcar notificações como lidas')
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        )
      )

      const unreadCount = notifications.filter(n => 
        notificationIds.includes(n.id) && !n.read
      ).length

      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - unreadCount),
        read: prev.read + unreadCount,
      }))

      toast.success(`${notificationIds.length} notificações marcadas como lidas`)
    } catch (err: any) {
      toast.error('Erro ao marcar notificações como lidas')
    }
  }, [user, makeAuthenticatedRequest, notifications])

  // Marcar todas as notificações como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      const response = await makeAuthenticatedRequest('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ markAllAsRead: true }),
      })

      if (!response.ok) {
        throw new Error('Erro ao marcar todas as notificações como lidas')
      }

      const data = await response.json()

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          read: true,
          readAt: new Date().toISOString(),
        }))
      )

      setStats(prev => ({
        ...prev,
        unread: 0,
        read: prev.total,
      }))

      toast.success(`${data.count} notificações marcadas como lidas`)
    } catch (err: any) {
      toast.error('Erro ao marcar todas as notificações como lidas')
    }
  }, [user, makeAuthenticatedRequest])

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return

    try {
      const response = await makeAuthenticatedRequest(
        `/api/notifications?id=${notificationId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Erro ao deletar notificação')
      }

      // Atualizar estado local
      const deletedNotification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      setStats(prev => ({
        total: prev.total - 1,
        unread: deletedNotification?.read ? prev.unread : Math.max(0, prev.unread - 1),
        read: deletedNotification?.read ? Math.max(0, prev.read - 1) : prev.read,
      }))

      toast.success('Notificação deletada')
    } catch (err: any) {
      toast.error('Erro ao deletar notificação')
    }
  }, [user, makeAuthenticatedRequest, notifications])

  // Deletar todas as notificações lidas
  const deleteAllRead = useCallback(async () => {
    if (!user) return

    try {
      const response = await makeAuthenticatedRequest(
        '/api/notifications?read=true',
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Erro ao deletar notificações lidas')
      }

      const data = await response.json()

      // Atualizar estado local
      setNotifications(prev => prev.filter(n => !n.read))
      setStats(prev => ({
        total: prev.unread,
        unread: prev.unread,
        read: 0,
      }))

      toast.success(`${data.count} notificações lidas deletadas`)
    } catch (err: any) {
      toast.error('Erro ao deletar notificações lidas')
    }
  }, [user, makeAuthenticatedRequest])

  // Deletar todas as notificações
  const deleteAll = useCallback(async () => {
    if (!user) return

    try {
      const response = await makeAuthenticatedRequest(
        '/api/notifications?all=true',
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('Erro ao deletar todas as notificações')
      }

      const data = await response.json()

      // Atualizar estado local
      setNotifications([])
      setStats({ total: 0, unread: 0, read: 0 })

      toast.success(`${data.count} notificações deletadas`)
    } catch (err: any) {
      toast.error('Erro ao deletar todas as notificações')
    }
  }, [user, makeAuthenticatedRequest])

  // Enviar notificação (apenas admin)
  const sendNotification = useCallback(async (data: SendNotificationData) => {
    if (!user) return

    try {
      const response = await makeAuthenticatedRequest('/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar notificação')
      }

      const result = await response.json()
      toast.success(`Notificação enviada para ${result.stats.successful} usuários`)
    } catch (err: any) {
      toast.error('Erro ao enviar notificação')
    }
  }, [user, makeAuthenticatedRequest])

  // Registrar token FCM
  const registerFCMToken = useCallback(async (
    token: string, 
    deviceType: 'web' | 'android' | 'ios'
  ) => {
    if (!user) return

    try {
      const response = await makeAuthenticatedRequest('/api/notifications/tokens', {
        method: 'POST',
        body: JSON.stringify({ 
          token, 
          deviceType,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao registrar token FCM')
      }

      console.log('Token FCM registrado com sucesso')
    } catch (err: any) {
      console.error('Erro ao registrar token FCM:', err)
    }
  }, [user, makeAuthenticatedRequest])

  // Atualizar preferências de notificação
  const updatePreferences = useCallback(async (preferences: Record<string, boolean>) => {
    if (!user) return

    try {
      const response = await makeAuthenticatedRequest('/api/notifications/tokens', {
        method: 'PUT',
        body: JSON.stringify({ preferences }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar preferências')
      }

      toast.success('Preferências de notificação atualizadas')
    } catch (err: any) {
      toast.error('Erro ao atualizar preferências')
    }
  }, [user, makeAuthenticatedRequest])

  // Função para atualizar notificações
  const refreshNotifications = useCallback(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Carregar notificações iniciais
  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, fetchNotifications])

  return {
    notifications,
    stats,
    pagination,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    deleteAll,
    sendNotification,
    registerFCMToken,
    updatePreferences,
    refreshNotifications,
  }
}