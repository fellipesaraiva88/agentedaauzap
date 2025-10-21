'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from './ui/card'
import { Heading, Body } from './ui/typography'
import { DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenueDataPoint {
  time: string
  value: number
}

async function getRevenueTimeline(): Promise<RevenueDataPoint[]> {
  // TODO: Conectar com API real
  const response = await fetch('/api/dashboard/revenue-timeline')
  if (!response.ok) {
    // Mock data para desenvolvimento
    return [
      { time: '08:00', value: 150 },
      { time: '10:00', value: 420 },
      { time: '12:00', value: 680 },
      { time: '14:00', value: 920 },
      { time: '16:00', value: 1250 },
      { time: '18:00', value: 1450 },
    ]
  }
  return response.json()
}

export function RevenueChart() {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ['revenue-timeline'],
    queryFn: getRevenueTimeline,
    refetchInterval: 60000, // 1 minute
  })

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="h-80 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  const totalRevenue = timeline?.reduce((sum, point) => sum + point.value, 0) || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <Heading size="sm">Receita ao Longo do Dia</Heading>
                <Body variant="muted" size="sm">
                  Total: R$ {totalRevenue.toLocaleString('pt-BR')}
                </Body>
              </div>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeline}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="time"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
