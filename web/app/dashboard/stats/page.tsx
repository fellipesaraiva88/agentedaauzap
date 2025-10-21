'use client'

import { useQuery } from '@tanstack/react-query'
import { appointmentsApi, dashboardApi, type Appointment } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Calendar, Users, AlertCircle } from 'lucide-react'

export default function StatsPage() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => dashboardApi.getStats(),
  })

  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.list(),
  })

  const taxaConclusao = stats?.data.total
    ? Math.round((stats.data.concluidos / stats.data.total) * 100)
    : 0

  const taxaCancelamento = stats?.data.total
    ? Math.round((stats.data.cancelados / stats.data.total) * 100)
    : 0

  const servicosMaisPopulares = appointmentsData?.data.reduce((acc: Record<string, number>, appointment: Appointment) => {
    acc[appointment.serviceName] = (acc[appointment.serviceName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const servicosOrdenados = Object.entries(servicosMaisPopulares || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Estatísticas</h1>
        <p className="text-gray-500">Análise de desempenho do negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.data.receitaTotal || 0)}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-emerald-600" />
              Todos os períodos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.data.valorMedio || 0)}</div>
            <p className="text-xs text-muted-foreground">Por agendamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaConclusao}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.data.concluidos} de {stats?.data.total} agendamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cancelamento</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaCancelamento}%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {taxaCancelamento > 20 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-red-600" />
                  Acima da meta
                </>
              ) : (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-green-600" />
                  Dentro da meta
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Status dos agendamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Pendentes</span>
                </div>
                <span className="text-sm font-semibold">{stats?.data.pendentes || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Concluídos</span>
                </div>
                <span className="text-sm font-semibold">{stats?.data.concluidos || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Cancelados</span>
                </div>
                <span className="text-sm font-semibold">{stats?.data.cancelados || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Serviços Mais Populares</CardTitle>
            <CardDescription>Top 5 serviços mais agendados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {servicosOrdenados.map(([servico, quantidade], index) => (
                <div key={servico} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </div>
                    <span className="text-sm">{servico}</span>
                  </div>
                  <span className="text-sm font-semibold">{quantidade}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
