'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from './ui/card'
import { Heading, Body } from './ui/typography'
import { Moon, CheckCircle2, Calendar, DollarSign, Bell, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { cn } from '@/lib/utils'
import { dashboardApi } from '@/lib/api'

interface OvernightData {
  clientsServed: number
  bookingsConfirmed: number
  salesValue: number
  followupsSent: number
}

async function getOvernightActivity(): Promise<OvernightData> {
  try {
    const response = await dashboardApi.getOvernight()
    // Backend retorna { overnight: {...} }
    return response.overnight || response
  } catch (error) {
    console.error('Erro ao buscar atividade noturna:', error)
    return {
      clientsServed: 0,
      bookingsConfirmed: 0,
      salesValue: 0,
      followupsSent: 0,
    }
  }
}

const metrics = [
  {
    icon: CheckCircle2,
    label: 'Clientes',
    sublabel: 'atendidos',
    color: 'text-blue-600',
    bgColor: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
    borderColor: 'border-blue-500/20',
    key: 'clientsServed' as const,
  },
  {
    icon: Calendar,
    label: 'Agendamentos',
    sublabel: 'confirmados para hoje',
    color: 'text-green-600',
    bgColor: 'bg-gradient-to-br from-green-500/10 to-green-600/5',
    borderColor: 'border-green-500/20',
    key: 'bookingsConfirmed' as const,
  },
  {
    icon: DollarSign,
    label: 'Vendas',
    sublabel: 'fechadas',
    color: 'text-purple-600',
    bgColor: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5',
    borderColor: 'border-purple-500/20',
    key: 'salesValue' as const,
    prefix: 'R$ ',
  },
  {
    icon: Bell,
    label: 'Follow-ups',
    sublabel: 'enviados',
    color: 'text-orange-600',
    bgColor: 'bg-gradient-to-br from-orange-500/10 to-orange-600/5',
    borderColor: 'border-orange-500/20',
    key: 'followupsSent' as const,
  },
]

export function OvernightActivity() {
  const { data: overnight, isLoading } = useQuery({
    queryKey: ['overnight-activity'],
    queryFn: getOvernightActivity,
    refetchInterval: 300000, // 5 minutes
  })

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 md:p-8">
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/50 dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-pink-950/20">
        <CardContent className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg">
              <Moon className="h-6 w-6 text-white" />
            </div>
            <div>
              <Heading size="sm">🚀 Enquanto Você Dormia</Heading>
              <Body variant="muted" size="sm">
                Última noite (22h às 8h)
              </Body>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  'rounded-xl border p-4',
                  metric.bgColor,
                  metric.borderColor
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <metric.icon className={cn('h-4 w-4', metric.color)} />
                  <span className={cn('text-xs font-semibold uppercase', metric.color)}>
                    {metric.label}
                  </span>
                </div>
                <div className="mb-1 text-2xl font-bold">
                  {metric.prefix}
                  <CountUp
                    end={overnight?.[metric.key] || 0}
                    duration={1.5}
                    separator=","
                  />
                </div>
                <Body variant="muted" size="sm">
                  {metric.sublabel}
                </Body>
              </motion.div>
            ))}
          </div>

          {/* Fun Message */}
          <div className="mt-6 rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4">
            <Body weight="medium" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              💡 A IA não dorme. Você pode.
            </Body>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
