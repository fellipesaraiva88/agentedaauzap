'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import { Bell, CheckCheck, Archive, Trash2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState('all')

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications')
      return response.data
    }
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/notifications/${id}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notificação marcada como lida')
    }
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Todas as notificações foram marcadas como lidas')
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/notifications/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('Notificação excluída')
    }
  })

  const notifications = notificationsData?.data || []

  // Filter notifications
  const unreadNotifications = notifications.filter((n: any) => !n.lida)
  const readNotifications = notifications.filter((n: any) => n.lida)

  const filteredNotifications = selectedTab === 'all'
    ? notifications
    : selectedTab === 'unread'
    ? unreadNotifications
    : readNotifications

  // Group by date
  const groupedNotifications = filteredNotifications.reduce((groups: any, notification: any) => {
    const date = new Date(notification.created_at).toLocaleDateString('pt-BR')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(notification)
    return groups
  }, {})

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notificações
          </h1>
          <p className="text-muted-foreground">
            {unreadNotifications.length} não lida{unreadNotifications.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-2">
          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">Notificações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lidas</CardTitle>
            <CheckCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readNotifications.length}</div>
            <p className="text-xs text-muted-foreground">Já visualizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all">
            Todas ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Não Lidas ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Lidas ({readNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-6 mt-6">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {selectedTab === 'unread'
                    ? 'Nenhuma notificação não lida'
                    : selectedTab === 'read'
                    ? 'Nenhuma notificação lida'
                    : 'Nenhuma notificação'}
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedNotifications).map(([date, dateNotifications]: [string, any]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                  {date}
                </h3>
                <div className="space-y-3">
                  {dateNotifications.map((notification: any) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                      onClick={(n) => {
                        if (!n.lida) {
                          markAsReadMutation.mutate(n.id)
                        }
                        if (n.link_acao) {
                          window.location.href = n.link_acao
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
