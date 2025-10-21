'use client'

import { useQuery } from '@tanstack/react-query'
import { appointmentsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Users, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => appointmentsApi.getStats(),
  })

  const { data: todayAppointments } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => appointmentsApi.getToday(),
  })

  const statsData = [
    {
      title: 'Total de Agendamentos',
      value: stats?.data.total || 0,
      icon: CalendarDays,
      description: 'Total de agendamentos no período',
      color: 'text-blue-600',
    },
    {
      title: 'Concluídos',
      value: stats?.data.concluidos || 0,
      icon: Users,
      description: `${stats?.data.concluidos || 0} agendamentos finalizados`,
      color: 'text-green-600',
    },
    {
      title: 'Receita Total',
      value: formatCurrency(stats?.data.receitaTotal || 0),
      icon: DollarSign,
      description: 'Receita do período',
      color: 'text-emerald-600',
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(stats?.data.valorMedio || 0),
      icon: TrendingUp,
      description: 'Valor médio por agendamento',
      color: 'text-purple-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Visão geral do seu negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Agendamentos de Hoje</CardTitle>
            <CardDescription>
              {todayAppointments?.data.length || 0} agendamento(s) para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayAppointments?.data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum agendamento para hoje
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments?.data.slice(0, 5).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{appointment.petNome}</p>
                      <p className="text-sm text-gray-500">
                        {appointment.serviceName} - {appointment.horaAgendamento.substring(0, 5)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(appointment.preco)}</p>
                      <p className="text-sm text-gray-500">{appointment.tutorNome}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Estatísticas do período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pendentes</span>
                <span className="font-semibold">{stats?.data.pendentes || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cancelados</span>
                <span className="font-semibold">{stats?.data.cancelados || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Taxa de Conclusão</span>
                <span className="font-semibold">
                  {stats?.data.total
                    ? Math.round((stats.data.concluidos / stats.data.total) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
