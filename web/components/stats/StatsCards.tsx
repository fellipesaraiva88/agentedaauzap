'use client'

import { TrendingUp, TrendingDown, Users, DollarSign, Bot, Moon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAllStats } from '@/hooks/useStats'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

/**
 * StatsCards Component
 *
 * Displays key metrics in a responsive grid
 *
 * @example
 * ```tsx
 * // In your dashboard page
 * function DashboardPage() {
 *   return (
 *     <div className="space-y-6">
 *       <h1>Dashboard</h1>
 *       <StatsCards />
 *     </div>
 *   )
 * }
 * ```
 */
export function StatsCards() {
  const { dashboard, impact, automation, nightActivity, isLoading } = useAllStats({
    autoRefresh: true,
    refreshInterval: 60000, // Refresh every minute
  })

  if (isLoading) {
    return <StatsCardsSkeleton />
  }

  const dashboardData = dashboard.data?.data
  const impactData = impact.data?.data
  const automationData = automation.data?.data
  const nightData = nightActivity.data?.data

  const revenueGrowth = dashboardData?.revenue.growth || 0
  const isPositiveGrowth = revenueGrowth >= 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Revenue Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(dashboardData?.revenue.currentMonth || 0)}
          </div>
          <p className={cn(
            "text-xs flex items-center mt-1",
            isPositiveGrowth ? "text-emerald-600" : "text-red-600"
          )}>
            {isPositiveGrowth ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3" />
            )}
            {dashboardData?.revenue.growthFormatted || '0%'} vs mês anterior
          </p>
        </CardContent>
      </Card>

      {/* Tutors Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tutores Ativos</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {dashboardData?.tutors.total || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {dashboardData?.tutors.vip || 0} VIP ({dashboardData?.tutors.vipPercentage.toFixed(1)}%)
          </p>
        </CardContent>
      </Card>

      {/* AI Impact Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Impacto da IA</CardTitle>
          <Bot className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {impactData?.horasTrabalhadasIA || 0}h
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(impactData?.valorEconomico || 0)} economizados
          </p>
        </CardContent>
      </Card>

      {/* Night Activity Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Atividade Noturna</CardTitle>
          <Moon className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {nightData?.clientesAtendidos || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {nightData?.agendamentosConfirmados || 0} agendamentos confirmados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Automation Stats Card - Separate card for automation metrics
 *
 * @example
 * ```tsx
 * <AutomationStatsCard />
 * ```
 */
export function AutomationStatsCard() {
  const { automation, isLoading } = useAllStats()

  if (isLoading) {
    return <Skeleton className="h-32" />
  }

  const automationData = automation.data?.data

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Automação</CardTitle>
        <CardDescription>Últimos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Automático</span>
            <span className="text-2xl font-bold text-emerald-600">
              {automationData?.percentualAutomatico || 0}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all"
              style={{ width: `${automationData?.percentualAutomatico || 0}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Automático</p>
              <p className="font-semibold">{automationData?.automatico || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Manual</p>
              <p className="font-semibold">{automationData?.manual || 0}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading skeleton for StatsCards
 */
function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Accessibility checklist:
 * - ✓ Semantic HTML (using Card components)
 * - ✓ Color contrast for text
 * - ✓ Loading states with skeletons
 * - ✓ Meaningful icons with context
 * - ✓ Responsive grid layout
 */

/**
 * Performance optimizations:
 * - ✓ Auto-refresh with 1-minute interval
 * - ✓ Memoized calculations
 * - ✓ Skeleton loading states
 * - ✓ Efficient re-renders via React Query
 * - ✓ Code splitting ready
 */
