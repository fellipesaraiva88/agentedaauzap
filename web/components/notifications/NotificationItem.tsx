'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle, AlertTriangle, XCircle, Info, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface Notification {
  id: number
  tipo: string
  titulo: string
  mensagem: string
  nivel: 'info' | 'warning' | 'error' | 'success'
  lida: boolean
  link_acao?: string
  created_at: string
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: number) => void
  onClick?: (notification: Notification) => void
}

const levelIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle
}

const levelColors = {
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-orange-50 text-orange-800 border-orange-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  success: 'bg-green-50 text-green-800 border-green-200'
}

const levelBadgeColors = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-orange-100 text-orange-800',
  error: 'bg-red-100 text-red-800',
  success: 'bg-green-100 text-green-800'
}

export function NotificationItem({ notification, onMarkAsRead, onClick }: NotificationItemProps) {
  const Icon = levelIcons[notification.nivel]

  return (
    <Card
      className={`p-4 transition-all cursor-pointer hover:shadow-md ${
        !notification.lida ? 'border-l-4 border-l-blue-500' : ''
      }`}
      onClick={() => onClick?.(notification)}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${levelColors[notification.nivel]}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm">{notification.titulo}</h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!notification.lida && (
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
              <Badge variant="outline" className={levelBadgeColors[notification.nivel]}>
                {notification.tipo}
              </Badge>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-2">
            {notification.mensagem}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </span>

            <div className="flex gap-2">
              {notification.link_acao && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = notification.link_acao!
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              )}

              {!notification.lida && onMarkAsRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkAsRead(notification.id)
                  }}
                >
                  Marcar como lida
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
