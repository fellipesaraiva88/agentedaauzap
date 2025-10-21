'use client'

import { useQuery } from '@tanstack/react-query'
import { appointmentsApi } from '@/lib/api'
import { Display, Body, Heading } from '@/components/ui/typography'
import { MetricCard, MetricGrid } from '@/components/ui/metric-card'
import { Card, CardContent } from '@/components/ui/card'
import { WhatsAppStatusCard, WhatsAppHeroCard } from '@/components/WhatsAppStatus'
import { OnboardingBanner } from '@/components/OnboardingBanner'
import { Button } from '@/components/ui/button'
import {
  CalendarDays,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { fadeInUp, fadeInDown, staggerContainer, staggerItem } from '@/lib/animations'
import { formatCurrency, formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => appointmentsApi.getStats(),
  })

  const { data: todayAppointments, isLoading: todayLoading } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: () => appointmentsApi.getToday(),
  })

  const userName = 'Usuário' // TODO: Pegar do contexto de autenticação

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background">
      <div className="container mx-auto p-3 md:p-4 lg:p-6 max-w-7xl space-y-4 md:space-y-6">

        {/* Onboarding Banner */}
        <OnboardingBanner />

        {/* Header Section */}
        <motion.header
          variants={fadeInDown}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <Display variant="gradient" className="mb-2">
                  Oi {userName}! 👋
                </Display>
                <Body variant="muted" className="text-sm md:text-base lg:text-lg">
                  Você tem{' '}
                  <Body as="span" variant="primary" weight="bold" className="inline">
                    {todayAppointments?.data.length || 0} agendamentos
                  </Body>{' '}
                  para hoje
                </Body>
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <Button asChild>
                  <Link href="/dashboard/appointments">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Agendamento
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/clients">
                    <Users className="mr-2 h-4 w-4" />
                    Ver Clientes
                  </Link>
                </Button>
              </div>
            </div>

            {/* WhatsApp Hero Card */}
            <WhatsAppHeroCard />
          </div>
        </motion.header>

        {/* WhatsApp Status */}
        <WhatsAppStatusCard />

        {/* Metrics Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <MetricGrid>
            <motion.div variants={staggerItem}>
              <MetricCard
                title="Total de Agendamentos"
                value={stats?.data.total || 0}
                changeLabel="Todos os períodos"
                icon={CalendarDays}
                variant="primary"
                isLoading={statsLoading}
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <MetricCard
                title="Agendamentos Concluídos"
                value={stats?.data.concluidos || 0}
                change={stats?.data.total ? Math.round((stats.data.concluidos / stats.data.total) * 100) : 0}
                changeLabel="taxa de conclusão"
                icon={CheckCircle2}
                variant="success"
                isLoading={statsLoading}
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <MetricCard
                title="Receita Total"
                value={stats?.data.receitaTotal || 0}
                prefix="R$ "
                decimals={2}
                icon={DollarSign}
                variant="default"
                isLoading={statsLoading}
              />
            </motion.div>

            <motion.div variants={staggerItem}>
              <MetricCard
                title="Ticket Médio"
                value={stats?.data.valorMedio || 0}
                prefix="R$ "
                decimals={2}
                changeLabel="por agendamento"
                icon={TrendingUp}
                variant="default"
                isLoading={statsLoading}
              />
            </motion.div>
          </MetricGrid>
        </motion.div>

        {/* Today's Appointments & Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Today's Appointments */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-4"
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <Heading size="sm" className="mb-1">
                      Agendamentos de Hoje
                    </Heading>
                    <Body variant="muted" size="sm">
                      {todayAppointments?.data.length || 0} agendamento(s) para hoje
                    </Body>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/appointments">
                      <Clock className="mr-2 h-4 w-4" />
                      Ver Todos
                    </Link>
                  </Button>
                </div>

                {todayLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 border-b border-border/50 pb-4">
                        <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : todayAppointments?.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Heading size="sm" variant="muted" className="mb-2">
                      Nenhum agendamento para hoje
                    </Heading>
                    <Body variant="muted" size="sm" className="mb-4">
                      Aproveite para organizar ou criar novos agendamentos
                    </Body>
                    <Button size="sm" asChild>
                      <Link href="/dashboard/appointments">
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Agendamento
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayAppointments?.data.slice(0, 5).map((appointment) => (
                      <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <CalendarDays className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <Body weight="semibold">{appointment.petNome}</Body>
                            <Body variant="muted" size="sm">
                              {appointment.serviceName} • {formatTime(appointment.horaAgendamento)}
                            </Body>
                          </div>
                        </div>
                        <div className="text-right">
                          <Body weight="semibold">{formatCurrency(appointment.preco)}</Body>
                          <Body variant="muted" size="sm">
                            {appointment.tutorNome}
                          </Body>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary Stats */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <Heading size="sm" className="mb-4">
                  Resumo Geral
                </Heading>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Body variant="muted" size="sm">
                      Pendentes
                    </Body>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-yellow-500"
                          style={{
                            width: `${stats?.data.total ? (stats.data.pendentes / stats.data.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <Body weight="semibold">{stats?.data.pendentes || 0}</Body>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Body variant="muted" size="sm">
                      Cancelados
                    </Body>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-red-500"
                          style={{
                            width: `${stats?.data.total ? (stats.data.cancelados / stats.data.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <Body weight="semibold">{stats?.data.cancelados || 0}</Body>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Body variant="muted" size="sm">
                      Taxa de Conclusão
                    </Body>
                    <Body weight="semibold" variant="success">
                      {stats?.data.total
                        ? Math.round((stats.data.concluidos / stats.data.total) * 100)
                        : 0}
                      %
                    </Body>
                  </div>

                  <div className="mt-6 rounded-lg bg-primary/5 p-4">
                    <Body variant="primary" weight="semibold" size="sm" className="mb-1">
                      Dica do Dia 💡
                    </Body>
                    <Body variant="muted" size="sm">
                      Os lembretes automáticos reduzem até 60% das faltas. Configure agora!
                    </Body>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
