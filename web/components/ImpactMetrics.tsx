'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from './ui/card'
import { Heading, Body } from './ui/typography'
import { Zap, DollarSign, TrendingUp, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { cn } from '@/lib/utils'
import { dashboardApi } from '@/lib/api'

interface ImpactData {
  hoursWorked: number
  economicValue: number
  salesClosed: number
  daysOfWorkSaved: number
}

async function getImpactMetrics(): Promise<ImpactData> {
  try {
    const response = await dashboardApi.getImpact()
    // Backend retorna { impact: {...} }
    return response.impact || response
  } catch (error) {
    console.error('Erro ao buscar métricas de impacto:', error)
    // Retorna dados zerados em caso de erro
    return {
      hoursWorked: 0,
      economicValue: 0,
      salesClosed: 0,
      daysOfWorkSaved: 0,
    }
  }
}

const impactMetrics = [
  {
    icon: Clock,
    label: 'Horas Trabalhadas',
    sublabel: 'pela IA este mês',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-900',
    key: 'hoursWorked' as const,
    suffix: 'h',
  },
  {
    icon: DollarSign,
    label: 'Valor Econômico',
    sublabel: 'gerado pela automação',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-900',
    key: 'economicValue' as const,
    prefix: 'R$ ',
  },
  {
    icon: TrendingUp,
    label: 'Vendas Fechadas',
    sublabel: 'pela IA',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200 dark:border-purple-900',
    key: 'salesClosed' as const,
  },
  {
    icon: Zap,
    label: 'Dias Economizados',
    sublabel: 'de trabalho manual',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-900',
    key: 'daysOfWorkSaved' as const,
  },
]

export function ImpactMetrics() {
  const { data: impact, isLoading } = useQuery({
    queryKey: ['impact-metrics'],
    queryFn: getImpactMetrics,
    refetchInterval: 60000, // 1 minute
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-6">
              <div className="h-24 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {impactMetrics.map((metric, index) => (
        <motion.div
          key={metric.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          whileHover={{ scale: 1.03, y: -5 }}
        >
          <Card
            className={cn(
              'border-2 transition-all duration-200 hover:shadow-lg',
              metric.bgColor,
              metric.borderColor
            )}
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className={cn('rounded-lg bg-background/50 p-3', metric.color)}>
                  <metric.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mb-1 text-3xl font-bold">
                {metric.prefix}
                <CountUp
                  end={impact?.[metric.key] || 0}
                  duration={2}
                  separator=","
                />
                {metric.suffix}
              </div>
              <Body weight="semibold" size="sm" className="mb-1">
                {metric.label}
              </Body>
              <Body variant="muted" size="sm">
                {metric.sublabel}
              </Body>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
