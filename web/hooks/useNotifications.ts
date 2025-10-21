'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi, type NotificationFilters, type CreateNotificationData } from '@/lib/api'
import { toast } from 'sonner'

interface UseNotificationsOptions {
  filters?: NotificationFilters
  autoRefresh?: boolean
  refreshInterval?: number
}

/**
 * Hook for managing notifications
 *
 * @example
 * ```tsx
 * function NotificationCenter() {
 *   const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({
 *     filters: { lida: false },
 *     autoRefresh: true
 *   })
 *
 *   return (
 *     <div>
 *       <h2>Notificações ({unreadCount})</h2>
 *       {notifications.map(n => (
 *         <div key={n.id} onClick={() => markAsRead(n.id)}>
 *           {n.titulo}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    filters,
    autoRefresh = false,
    refreshInterval = 30000
  } = options

  const queryClient = useQueryClient()

  // List notifications
  const notificationsQuery = useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => notificationsApi.list(filters),
    refetchInterval: autoRefresh ? refreshInterval : false,
  })

  // Unread count
  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: () => notificationsApi.getCount(),
    refetchInterval: autoRefresh ? refreshInterval : false,
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notificação marcada como lida')
    },
    onError: () => {
      toast.error('Erro ao marcar notificação como lida')
    }
  })

  // Mark as unread mutation
  const markAsUnreadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notificação marcada como não lida')
    },
    onError: () => {
      toast.error('Erro ao marcar notificação como não lida')
    }
  })

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notificação arquivada')
    },
    onError: () => {
      toast.error('Erro ao arquivar notificação')
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Todas as notificações marcadas como lidas')
    },
    onError: () => {
      toast.error('Erro ao marcar todas como lidas')
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notificação deletada')
    },
    onError: () => {
      toast.error('Erro ao deletar notificação')
    }
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateNotificationData) => notificationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notificação criada')
    },
    onError: () => {
      toast.error('Erro ao criar notificação')
    }
  })

  return {
    // Data
    notifications: notificationsQuery.data?.data || [],
    pagination: notificationsQuery.data?.pagination,
    unreadCount: unreadCountQuery.data?.count || 0,

    // States
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    error: notificationsQuery.error,

    // Actions
    markAsRead: markAsReadMutation.mutate,
    markAsUnread: markAsUnreadMutation.mutate,
    archive: archiveMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    createNotification: createMutation.mutate,
    refetch: notificationsQuery.refetch,

    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isCreating: createMutation.isPending,
  }
}

/**
 * Hook for getting unread notifications only
 */
export function useUnreadNotifications(autoRefresh: boolean = true) {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.getUnread(),
    refetchInterval: autoRefresh ? 10000 : false, // Poll every 10s for unread
  })
}
