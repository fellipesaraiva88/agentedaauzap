'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from './ui/card'
import { Heading, Body } from './ui/typography'
import { Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { dashboardApi } from '@/lib/api'

interface AutomationData {
  automated: number
  manual: number
  total: number
}

async function getAutomationData(): Promise<AutomationData> {
  try {
    const data = await dashboardApi.getAutomation(30)
    return data
  } catch (error) {
    console.error('Erro ao buscar dados de automação:', error)
    return {
      automated: 0,
      manual: 0,
      total: 0,
    }
  }
}

const COLORS = {
  automated: '#10b981', // green
  manual: '#ef4444', // red
}

export function WorkAutomationChart() {
  const { data: automation, isLoading } = useQuery({
    queryKey: ['automation-data'],
    queryFn: getAutomationData,
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

  const chartData = [
    { name: 'Automático', value: automation?.automated || 0 },
    { name: 'Manual', value: automation?.manual || 0 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <Heading size="sm">Taxa de Automação</Heading>
              <Body variant="muted" size="sm">
                {automation?.automated || 0}% dos atendimentos automatizados
              </Body>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? COLORS.automated : COLORS.manual}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm font-medium">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
              <Body weight="semibold" variant="success" size="sm">
                {automation?.automated || 0}%
              </Body>
              <Body variant="muted" size="sm">
                Automático
              </Body>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/20">
              <Body weight="semibold" variant="error" size="sm">
                {automation?.manual || 0}%
              </Body>
              <Body variant="muted" size="sm">
                Manual
              </Body>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
