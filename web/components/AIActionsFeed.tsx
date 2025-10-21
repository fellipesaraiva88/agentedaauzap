'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from './ui/card'
import { Heading, Body } from './ui/typography'
import { Bot, Sparkles, Calendar, MessageSquare, UserPlus, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface AIAction {
  id: string
  type: 'booking' | 'message' | 'client' | 'sale'
  title: string
  subtitle: string
  highlight: string
  created_at: string
}

async function getAIActions(): Promise<AIAction[]> {
  // TODO: Conectar com API real
  const response = await fetch('/api/dashboard/actions')
  if (!response.ok) {
    // Mock data para desenvolvimento
    return [
      {
        id: '1',
        type: 'booking',
        title: 'Agendamento Confirmado',
        subtitle: 'Banho e Tosa - Rex',
        highlight: 'R$ 120,00',
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        type: 'message',
        title: 'Mensagem Respondida',
        subtitle: 'Dúvida sobre vacinação',
        highlight: 'Automático',
        created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        type: 'client',
        title: 'Cliente Cadastrado',
        subtitle: 'Maria Silva - Thor',
        highlight: 'Novo',
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        type: 'sale',
        title: 'Venda Fechada',
        subtitle: 'Pacote 3 banhos',
        highlight: 'R$ 270,00',
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      },
    ]
  }
  return response.json()
}

const actionConfig = {
  booking: {
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-950/50',
    borderColor: 'border-blue-200 dark:border-blue-900',
  },
  message: {
    icon: MessageSquare,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-950/50',
    borderColor: 'border-purple-200 dark:border-purple-900',
  },
  client: {
    icon: UserPlus,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-950/50',
    borderColor: 'border-green-200 dark:border-green-900',
  },
  sale: {
    icon: CheckCircle2,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-950/50',
    borderColor: 'border-orange-200 dark:border-orange-900',
  },
}

export function AIActionsFeed() {
  const { data: actions, isLoading } = useQuery({
    queryKey: ['ai-actions'],
    queryFn: getAIActions,
    refetchInterval: 30000, // 30 seconds
  })

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="h-96 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <Heading size="sm">Ações da IA</Heading>
            <Body variant="muted" size="sm">
              Últimas atividades em tempo real
            </Body>
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {actions?.slice(0, 10).map((action, index) => {
              const config = actionConfig[action.type]
              const Icon = config.icon

              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 transition-all hover:shadow-md',
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  <div className={cn('mt-0.5 rounded-md bg-background/50 p-2', config.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Body weight="semibold" size="sm" className="mb-0.5">
                      {action.title}
                    </Body>
                    <Body variant="muted" size="sm" className="truncate">
                      {action.subtitle}
                    </Body>
                  </div>
                  <div className="text-right">
                    <Body weight="semibold" size="sm" className={config.color}>
                      {action.highlight}
                    </Body>
                    <Body variant="muted" size="sm">
                      {formatDistanceToNow(new Date(action.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </Body>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {(!actions || actions.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <Heading size="sm" variant="muted">
                Aguardando ações
              </Heading>
              <Body variant="muted" size="sm">
                A IA começará a trabalhar em breve
              </Body>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
