'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Body, Heading } from './ui/typography'
import { MessageCircle, Wifi, WifiOff, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { whatsappApi } from '@/lib/api'

interface WhatsAppStatusData {
  connected: boolean
  session: string
  qrCode?: string
  phone?: string
}

async function getWhatsAppStatus(): Promise<WhatsAppStatusData> {
  try {
    const sessions = await whatsappApi.getSessions()

    // Busca primeira sessão ativa
    const activeSession = sessions.find((s: any) => s.status === 'WORKING' || s.status === 'connected')

    if (activeSession) {
      return {
        connected: true,
        session: activeSession.name,
        phone: activeSession.me?.id || activeSession.name
      }
    }

    // Se tem sessão mas não está conectada
    if (sessions.length > 0) {
      return {
        connected: false,
        session: sessions[0].name,
      }
    }

    // Nenhuma sessão configurada
    return {
      connected: false,
      session: 'Não configurado',
    }
  } catch (error) {
    console.error('Erro ao buscar status do WhatsApp:', error)
    return {
      connected: false,
      session: 'Erro ao conectar',
    }
  }
}

export function WhatsAppStatusCard() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: getWhatsAppStatus,
    refetchInterval: 30000, // Refetch a cada 30s
  })

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'border-2 transition-all duration-300',
          status?.connected
            ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-900 dark:from-green-950 dark:to-emerald-950'
            : 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:border-red-900 dark:from-red-950 dark:to-orange-950'
        )}
      >
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              {/* Icon with pulse animation */}
              <div className="relative">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    status?.connected
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                  )}
                >
                  <MessageCircle className="h-6 w-6" />
                </div>
                {status?.connected && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500"></span>
                  </span>
                )}
              </div>

              {/* Status Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Heading size="sm">WhatsApp</Heading>
                  <Badge
                    variant={status?.connected ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {status?.connected ? (
                      <><Wifi className="mr-1 h-3 w-3" /> Conectado</>
                    ) : (
                      <><WifiOff className="mr-1 h-3 w-3" /> Desconectado</>
                    )}
                  </Badge>
                </div>
                <Body variant="muted" size="sm">
                  {status?.connected
                    ? `Sessão ativa: ${status.phone || status.session}`
                    : 'Configure o WhatsApp para começar a atender'}
                </Body>
              </div>
            </div>

            {/* Action Button */}
            <Button
              variant={status?.connected ? 'outline' : 'default'}
              size="sm"
              asChild
            >
              <Link href="/dashboard/settings/whatsapp">
                <Settings className="mr-2 h-4 w-4" />
                {status?.connected ? 'Gerenciar' : 'Configurar'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function WhatsAppHeroCard() {
  const { data: status } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: getWhatsAppStatus,
  })

  if (status?.connected) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4"
    >
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-50 dark:to-purple-950">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <Heading size="default" className="mb-2">
                Configure seu WhatsApp
              </Heading>
              <Body variant="muted">
                Conecte sua conta do WhatsApp para começar a automatizar atendimentos e
                gerenciar agendamentos via IA
              </Body>
            </div>
            <Button size="lg" asChild>
              <Link href="/dashboard/settings/whatsapp">
                Começar Agora
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
