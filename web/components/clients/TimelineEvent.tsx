'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Calendar,
  MessageCircle,
  DollarSign,
  UserPlus,
  Star,
  Package,
  TrendingUp
} from 'lucide-react'

export interface TimelineEvent {
  id: number
  tipo: 'agendamento' | 'conversa' | 'compra' | 'cadastro' | 'avaliacao' | 'produto' | 'milestone'
  titulo: string
  descricao?: string
  data: string
  metadata?: Record<string, any>
}

interface TimelineEventProps {
  event: TimelineEvent
  isLast?: boolean
}

const eventIcons = {
  agendamento: Calendar,
  conversa: MessageCircle,
  compra: DollarSign,
  cadastro: UserPlus,
  avaliacao: Star,
  produto: Package,
  milestone: TrendingUp
}

const eventColors = {
  agendamento: 'bg-blue-100 text-blue-600 border-blue-300',
  conversa: 'bg-purple-100 text-purple-600 border-purple-300',
  compra: 'bg-green-100 text-green-600 border-green-300',
  cadastro: 'bg-orange-100 text-orange-600 border-orange-300',
  avaliacao: 'bg-yellow-100 text-yellow-600 border-yellow-300',
  produto: 'bg-pink-100 text-pink-600 border-pink-300',
  milestone: 'bg-indigo-100 text-indigo-600 border-indigo-300'
}

export function TimelineEvent({ event, isLast = false }: TimelineEventProps) {
  const Icon = eventIcons[event.tipo]

  return (
    <div className="flex gap-4 pb-6 relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200" />
      )}

      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 z-10 bg-white ${eventColors[event.tipo]}`}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 pt-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-sm">{event.titulo}</h4>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(new Date(event.data), {
              addSuffix: true,
              locale: ptBR
            })}
          </span>
        </div>

        {event.descricao && (
          <p className="text-sm text-muted-foreground">
            {event.descricao}
          </p>
        )}

        {/* Metadata */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="mt-2 p-2 bg-muted rounded-md text-xs space-y-1">
            {Object.entries(event.metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground">{key}:</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
