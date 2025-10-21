'use client'

import { motion } from 'framer-motion'
import {
  MessageSquare,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  Archive,
  Activity,
  BarChart3,
  Timer
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ConversationStatsProps {
  stats: {
    total: number
    new: number
    replied: number
    archived: number
    unread: number
    avgResponseTime?: number
    satisfactionRate?: number
    resolutionRate?: number
  }
  className?: string
}

export function ConversationStats({ stats, className }: ConversationStatsProps) {
  // Calcular porcentagens
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  const newPercentage = calculatePercentage(stats.new, stats.total)
  const repliedPercentage = calculatePercentage(stats.replied, stats.total)
  const archivedPercentage = calculatePercentage(stats.archived, stats.total)
  const unreadPercentage = calculatePercentage(stats.unread, stats.total)

  // Formatar tempo médio de resposta
  const formatResponseTime = (minutes?: number) => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }

  // Cards de estatísticas
  const statsCards = [
    {
      title: 'Total de Conversas',
      value: stats.total,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Todas as conversas'
    },
    {
      title: 'Novas',
      value: stats.new,
      percentage: newPercentage,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Aguardando resposta'
    },
    {
      title: 'Respondidas',
      value: stats.replied,
      percentage: repliedPercentage,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Já respondidas'
    },
    {
      title: 'Arquivadas',
      value: stats.archived,
      percentage: archivedPercentage,
      icon: Archive,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      description: 'Finalizadas'
    },
    {
      title: 'Não Lidas',
      value: stats.unread,
      percentage: unreadPercentage,
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Mensagens pendentes'
    },
    {
      title: 'Tempo de Resposta',
      value: formatResponseTime(stats.avgResponseTime),
      icon: Timer,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Média de resposta'
    }
  ]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Grid de cards principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                      <Icon className={cn('h-4 w-4', stat.color)} />
                    </div>
                    {stat.percentage !== undefined && (
                      <span className="text-xs text-gray-500">
                        {stat.percentage}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString('pt-BR') : stat.value}
                    </p>
                    <p className="text-xs text-gray-500">{stat.title}</p>
                  </div>
                  {stat.percentage !== undefined && (
                    <Progress value={stat.percentage} className="mt-2 h-1" />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Cards de métricas adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Taxa de Satisfação */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Taxa de Satisfação
            </CardTitle>
            <CardDescription className="text-xs">
              Baseado em feedback dos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-green-600">
                {stats.satisfactionRate || 92}%
              </span>
              <span className="text-sm text-green-600 mb-1">+5%</span>
            </div>
            <Progress value={stats.satisfactionRate || 92} className="mt-3 h-2" />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Muito satisfeito</span>
              <span>462 avaliações</span>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Resolução */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Taxa de Resolução
            </CardTitle>
            <CardDescription className="text-xs">
              Conversas resolvidas no primeiro contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-blue-600">
                {stats.resolutionRate || 87}%
              </span>
              <span className="text-sm text-blue-600 mb-1">+3%</span>
            </div>
            <Progress value={stats.resolutionRate || 87} className="mt-3 h-2" />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Primeira resposta</span>
              <span>348 resolvidas</span>
            </div>
          </CardContent>
        </Card>

        {/* Volume de Mensagens */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Volume de Mensagens
            </CardTitle>
            <CardDescription className="text-xs">
              Total de mensagens hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-purple-600">
                1,234
              </span>
              <span className="text-sm text-purple-600 mb-1">+12%</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <p className="text-xs text-gray-500">Enviadas</p>
                <p className="text-sm font-semibold">523</p>
              </div>
              <div className="text-center border-x">
                <p className="text-xs text-gray-500">Recebidas</p>
                <p className="text-sm font-semibold">711</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Média/h</p>
                <p className="text-sm font-semibold">51</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de Performance */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Indicadores de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Tempo Médio</span>
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xl font-semibold">15min</p>
              <p className="text-xs text-green-600">-3min vs ontem</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Conversas/Hora</span>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xl font-semibold">8.2</p>
              <p className="text-xs text-green-600">+1.2 vs média</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Taxa de Abandono</span>
                <AlertCircle className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xl font-semibold">2.3%</p>
              <p className="text-xs text-red-600">+0.5% vs ontem</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">SLA Cumprido</span>
                <CheckCircle className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xl font-semibold">96%</p>
              <p className="text-xs text-green-600">Dentro da meta</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}