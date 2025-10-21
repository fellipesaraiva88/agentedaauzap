'use client'

import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Heading, Body } from './ui/typography'
import { Smartphone, QrCode, Hash, Play, Square, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface Session {
  id: number
  session_name: string
  status: 'disconnected' | 'connecting' | 'connected' | 'failed'
  phone_number?: string
  last_connected?: string
}

interface Props {
  session: Session
  onStartQR: () => void
  onStartPairing: () => void
  onStop: () => void
  onDelete: () => void
}

const STATUS_CONFIG = {
  connected: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950/20',
    label: 'Conectado',
  },
  connecting: {
    icon: Loader2,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    label: 'Conectando...',
  },
  disconnected: {
    icon: AlertCircle,
    color: 'text-gray-600',
    bg: 'bg-gray-50 dark:bg-gray-950/20',
    label: 'Desconectado',
  },
  failed: {
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950/20',
    label: 'Falhou',
  },
}

export function WhatsAppSessionCard({ session, onStartQR, onStartPairing, onStop, onDelete }: Props) {
  const config = STATUS_CONFIG[session.status]
  const StatusIcon = config.icon

  return (
    <Card className="overflow-hidden border-border/50 transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-700">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <Heading size="sm">{session.session_name}</Heading>
              <Body variant="muted" size="sm">
                {session.phone_number || 'Não conectado'}
              </Body>
            </div>
          </div>
        </div>

        <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 ${config.bg}`}>
          <StatusIcon className={`h-5 w-5 ${config.color} ${session.status === 'connecting' ? 'animate-spin' : ''}`} />
          <Body weight="medium" className={config.color}>
            {config.label}
          </Body>
        </div>

        {session.status === 'disconnected' || session.status === 'failed' ? (
          <div className="space-y-2">
            <Button size="sm" className="w-full" onClick={onStartQR}>
              <QrCode className="mr-2 h-4 w-4" />
              Conectar com QR Code
            </Button>
            <Button size="sm" variant="outline" className="w-full" onClick={onStartPairing}>
              <Hash className="mr-2 h-4 w-4" />
              Conectar com Código
            </Button>
          </div>
        ) : session.status === 'connected' ? (
          <div className="space-y-2">
            <Button size="sm" variant="destructive" className="w-full" onClick={onStop}>
              <Square className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="w-full" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Aguardando conexão...
          </Button>
        )}

        <div className="mt-4 border-t pt-4">
          <Button size="sm" variant="ghost" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar Sessão
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
