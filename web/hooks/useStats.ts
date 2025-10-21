'use client'

import { useQuery } from '@tanstack/react-query'
import { statsApi, type AppointmentStatsParams, type RevenueStatsParams } from '@/lib/api'

interface UseStatsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

/**
 * Hook for dashboard statistics
 *
 * @example
 * ```tsx
 * function DashboardStats() {
 *   const { stats, isLoading } = useDashboardStats({ autoRefresh: true })
 *
 *   if (isLoading) return <Skeleton />
 *
 *   return (
 *     <div>
 *       <h2>Total de Tutores: {stats.tutors.total}</h2>
 *       <h2>Receita do Mês: R$ {stats.revenue.currentMonth}</h2>
 *     </div>
 *   )
 * }
 * ```
 */
export function useDashboardStats(options: UseStatsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options

  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => statsApi.getDashboard(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000, // Cache for 30 seconds
  })
}

/**
 * Hook for appointment statistics
 *
 * @example
 * ```tsx
 * function AppointmentAnalytics() {
 *   const { data, isLoading } = useAppointmentStats({
 *     params: { period: 'month' }
 *   })
 *
 *   return (
 *     <div>
 *       <h2>Agendamentos do Mês</h2>
 *       <p>Total: {data?.summary.total}</p>
 *       <p>Concluídos: {data?.summary.concluido}</p>
 *       <p>Taxa de Cancelamento: {data?.summary.taxaCancelamento}%</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAppointmentStats(params?: AppointmentStatsParams, options: UseStatsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options

  return useQuery({
    queryKey: ['stats', 'appointments', params],
    queryFn: () => statsApi.getAppointments(params),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  })
}

/**
 * Hook for revenue statistics
 *
 * @example
 * ```tsx
 * function RevenueChart() {
 *   const { data } = useRevenueStats({
 *     params: { period: 'month', groupBy: 'day' }
 *   })
 *
 *   return (
 *     <LineChart data={data?.timeline} />
 *   )
 * }
 * ```
 */
export function useRevenueStats(params?: RevenueStatsParams, options: UseStatsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options

  return useQuery({
    queryKey: ['stats', 'revenue', params],
    queryFn: () => statsApi.getRevenue(params),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  })
}

/**
 * Hook for client/tutor statistics
 */
export function useClientStats(options: UseStatsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options

  return useQuery({
    queryKey: ['stats', 'clients'],
    queryFn: () => statsApi.getClients(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  })
}

/**
 * Hook for service performance statistics
 */
export function useServiceStats(options: UseStatsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options

  return useQuery({
    queryKey: ['stats', 'services'],
    queryFn: () => statsApi.getServices(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  })
}

/**
 * Hook for conversation statistics
 */
export function useConversationStats(options: UseStatsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options

  return useQuery({
    queryKey: ['stats', 'conversations'],
    queryFn: () => statsApi.getConversations(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  })
}

/**
 * Hook for night activity stats (22h-8h)
 *
 * @example
 * ```tsx
 * function NightActivityCard() {
 *   const { data } = useNightActivityStats({ autoRefresh: true })
 *
 *   return (
 *     <Card>
 *       <h3>Atividade Noturna</h3>
 *       <p>Clientes atendidos: {data?.clientesAtendidos}</p>
 *       <p>Vendas fechadas: R$ {data?.vendasFechadas}</p>
 *     </Card>
 *   )
 * }
 * ```
 */
export function useNightActivityStats(options: UseStatsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options

  return useQuery({
    queryKey: ['stats', 'night-activity'],
    queryFn: () => statsApi.getNightActivity(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  })
}

/**
 * Hook for AI impact metrics
 *
 * @example
 * ```tsx
 * function AIImpactDashboard() {
 *   const { data } = useImpactStats()
 *
 *   return (
 *     <div>
 *       <h2>Impacto da IA</h2>
 *       <p>Horas trabalhadas: {data?.horasTrabalhadasIA}h</p>
 *       <p>Valor econômico: R$ {data?.valorEconomico}</p>
 *       <p>Dias economizados: {data?.diasEconomizados}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useImpactStats(options: UseStatsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options

  return useQuery({
    queryKey: ['stats', 'impact'],
    queryFn: () => statsApi.getImpact(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  })
}

/**
 * Hook for revenue timeline by hour
 */
export function useRevenueTimeline(options: UseStatsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 300000 } = options // 5 min

  return useQuery({
    queryKey: ['stats', 'revenue-timeline'],
    queryFn: () => statsApi.getRevenueTimeline(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 60000,
  })
}

/**
 * Hook for automation statistics
 *
 * @example
 * ```tsx
 * function AutomationMetrics() {
 *   const { data } = useAutomationStats()
 *
 *   return (
 *     <Card>
 *       <h3>Taxa de Automação</h3>
 *       <Progress value={data?.taxaAutomacao} />
 *       <p>{data?.automatico} automáticos / {data?.totalAtendimentos} total</p>
 *     </Card>
 *   )
 * }
 * ```
 */
export function useAutomationStats(options: UseStatsOptions = {}) {
  const { autoRefresh = false, refreshInterval = 60000 } = options

  return useQuery({
    queryKey: ['stats', 'automation'],
    queryFn: () => statsApi.getAutomation(),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30000,
  })
}

/**
 * Composite hook that fetches all dashboard stats at once
 * Use this for overview pages that need multiple stats
 *
 * @example
 * ```tsx
 * function DashboardOverview() {
 *   const stats = useAllStats({ autoRefresh: true })
 *
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       <StatsCard title="Dashboard" data={stats.dashboard.data} />
 *       <StatsCard title="Impacto IA" data={stats.impact.data} />
 *       <StatsCard title="Automação" data={stats.automation.data} />
 *     </div>
 *   )
 * }
 * ```
 */
export function useAllStats(options: UseStatsOptions = {}) {
  const dashboard = useDashboardStats(options)
  const impact = useImpactStats(options)
  const automation = useAutomationStats(options)
  const nightActivity = useNightActivityStats(options)

  return {
    dashboard,
    impact,
    automation,
    nightActivity,
    isLoading: dashboard.isLoading || impact.isLoading || automation.isLoading,
    isError: dashboard.isError || impact.isError || automation.isError,
  }
}
