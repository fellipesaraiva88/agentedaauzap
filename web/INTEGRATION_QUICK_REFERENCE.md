# Frontend Integration - Quick Reference

## 🚀 Quick Start

### 1. Import Types
```typescript
import type { Notification, DashboardStats, Pet, Tutor } from '@/lib/api'
```

### 2. Use API Client
```typescript
import { notificationsApi, statsApi, petsApi, tutorsApi } from '@/lib/api'

// Get notifications
const { data } = await notificationsApi.list({ lida: false })

// Get dashboard stats
const { data } = await statsApi.getDashboard()
```

### 3. Use Hooks
```typescript
import { useNotifications, useDashboardStats } from '@/hooks/useNotifications'

function MyComponent() {
  const { notifications, markAsRead } = useNotifications()
  const { data: stats } = useDashboardStats({ autoRefresh: true })
}
```

---

## 📚 API Reference

### Notifications API

```typescript
// List with filters
notificationsApi.list({ lida: false, tipo: 'warning', nivel: 'high' })

// Get unread only
notificationsApi.getUnread()

// Get unread count
notificationsApi.getCount()

// Get single notification
notificationsApi.get(id)

// Create notification
notificationsApi.create({
  tipo: 'info',
  titulo: 'Título',
  mensagem: 'Mensagem',
  nivel: 'medium'
})

// Mark as read
notificationsApi.markAsRead(id)

// Mark as unread
notificationsApi.markAsUnread(id)

// Archive
notificationsApi.archive(id)

// Mark all as read
notificationsApi.markAllAsRead()

// Delete
notificationsApi.delete(id)

// Cleanup old (30 days)
notificationsApi.cleanup(30)
```

### Stats API

```typescript
// Dashboard overview
statsApi.getDashboard()

// Appointments stats
statsApi.getAppointments({ period: 'month', startDate: '2025-01-01', endDate: '2025-12-31' })

// Revenue stats
statsApi.getRevenue({ period: 'month', groupBy: 'day' })

// Client stats
statsApi.getClients()

// Service stats
statsApi.getServices()

// Conversation stats
statsApi.getConversations()

// Night activity (22h-8h)
statsApi.getNightActivity()

// AI impact metrics
statsApi.getImpact()

// Revenue timeline by hour
statsApi.getRevenueTimeline()

// Automation stats
statsApi.getAutomation()
```

### Pets API

```typescript
// List all pets
petsApi.list({ tutor_id: 1, limit: 50, offset: 0 })

// Get single pet
petsApi.get(id)

// Create pet
petsApi.create({
  tutor_id: 1,
  nome: 'Rex',
  especie: 'Cachorro',
  raca: 'Labrador',
  porte: 'grande',
  peso: 30,
  sexo: 'macho'
})

// Update pet
petsApi.update(id, { peso: 32 })

// Delete pet
petsApi.delete(id)
```

### Tutors API

```typescript
// List tutors
tutorsApi.list({ search: 'João', is_vip: true, limit: 50 })

// Get single tutor
tutorsApi.get(id)

// Get by phone
tutorsApi.getByPhone('5511999999999')

// Create tutor
tutorsApi.create({
  nome: 'João Silva',
  telefone: '5511999999999',
  email: 'joao@example.com',
  is_vip: false
})

// Update tutor
tutorsApi.update(id, { email: 'novoemail@example.com' })

// Toggle VIP
tutorsApi.toggleVip(id)

// Toggle inactive
tutorsApi.toggleInactive(id)

// Delete tutor
tutorsApi.delete(id)
```

---

## 🎣 Hooks Reference

### useNotifications

```typescript
const {
  notifications,           // Array de notificações
  pagination,             // Metadados de paginação
  unreadCount,            // Contador de não lidas
  isLoading,              // Estado de loading
  isError,                // Estado de erro
  error,                  // Objeto de erro
  markAsRead,             // Função: (id) => void
  markAsUnread,           // Função: (id) => void
  archive,                // Função: (id) => void
  markAllAsRead,          // Função: () => void
  deleteNotification,     // Função: (id) => void
  createNotification,     // Função: (data) => void
  refetch,                // Função: () => void
  isMarkingAsRead,        // Estado da mutation
  isArchiving,            // Estado da mutation
  isDeleting,             // Estado da mutation
  isCreating,             // Estado da mutation
} = useNotifications({
  filters: { lida: false, tipo: 'warning' },
  autoRefresh: true,
  refreshInterval: 10000
})
```

### useDashboardStats

```typescript
const {
  data,         // DashboardStats | undefined
  isLoading,    // boolean
  isError,      // boolean
  error,        // Error | null
  refetch,      // () => void
} = useDashboardStats({
  autoRefresh: true,
  refreshInterval: 60000
})
```

### useAppointmentStats

```typescript
const { data, isLoading } = useAppointmentStats(
  { period: 'month', startDate: '2025-01-01', endDate: '2025-12-31' },
  { autoRefresh: true }
)
```

### useRevenueStats

```typescript
const { data } = useRevenueStats(
  { period: 'month', groupBy: 'day' },
  { autoRefresh: false }
)
```

### useClientStats

```typescript
const { data } = useClientStats({ autoRefresh: true })
```

### useServiceStats

```typescript
const { data } = useServiceStats()
```

### useConversationStats

```typescript
const { data } = useConversationStats()
```

### useNightActivityStats

```typescript
const { data } = useNightActivityStats({ autoRefresh: true })
```

### useImpactStats

```typescript
const { data } = useImpactStats()
```

### useRevenueTimeline

```typescript
const { data } = useRevenueTimeline({ autoRefresh: true })
```

### useAutomationStats

```typescript
const { data } = useAutomationStats()
```

### useAllStats (Composite)

```typescript
const {
  dashboard,      // Hook result
  impact,         // Hook result
  automation,     // Hook result
  nightActivity,  // Hook result
  isLoading,      // Combined loading state
  isError,        // Combined error state
} = useAllStats({ autoRefresh: true })
```

---

## 🧩 Components Reference

### NotificationCenter

```tsx
import { NotificationCenter } from '@/components/notifications/NotificationCenter'

// In your header/layout
<NotificationCenter />
```

### StatsCards

```tsx
import { StatsCards } from '@/components/stats/StatsCards'

// In your dashboard
<StatsCards />
```

### AutomationStatsCard

```tsx
import { AutomationStatsCard } from '@/components/stats/StatsCards'

<AutomationStatsCard />
```

---

## 💡 Common Patterns

### Pattern 1: Dashboard Overview

```tsx
'use client'

import { StatsCards } from '@/components/stats/StatsCards'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <NotificationCenter />
      </div>

      <StatsCards />

      {/* Outros componentes */}
    </div>
  )
}
```

### Pattern 2: Stats with Chart

```tsx
'use client'

import { useRevenueStats } from '@/hooks/useStats'
import { LineChart, Line, XAxis, YAxis } from 'recharts'

export function RevenueChart() {
  const { data, isLoading } = useRevenueStats({
    period: 'month',
    groupBy: 'day'
  })

  if (isLoading) return <Skeleton />

  return (
    <LineChart width={600} height={300} data={data?.data.timeline}>
      <XAxis dataKey="periodo" />
      <YAxis />
      <Line type="monotone" dataKey="receita" stroke="#10b981" />
    </LineChart>
  )
}
```

### Pattern 3: Notifications List

```tsx
'use client'

import { useNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'

export function NotificationsList() {
  const { notifications, markAsRead, archive } = useNotifications({
    filters: { arquivada: false }
  })

  return (
    <div className="space-y-4">
      {notifications.map(n => (
        <div key={n.id} className="p-4 border rounded-lg">
          <h3 className="font-semibold">{n.titulo}</h3>
          <p className="text-sm text-muted-foreground">{n.mensagem}</p>

          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => markAsRead(n.id)}>
              Marcar como lida
            </Button>
            <Button size="sm" variant="outline" onClick={() => archive(n.id)}>
              Arquivar
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### Pattern 4: Real-time Stats

```tsx
'use client'

import { useAllStats } from '@/hooks/useStats'
import { Card } from '@/components/ui/card'

export function RealtimeStats() {
  const { dashboard, impact, automation } = useAllStats({
    autoRefresh: true,
    refreshInterval: 30000 // Refresh every 30s
  })

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <h3>Receita do Mês</h3>
        <p className="text-3xl font-bold">
          R$ {dashboard.data?.data.revenue.currentMonth}
        </p>
      </Card>

      <Card>
        <h3>Horas IA</h3>
        <p className="text-3xl font-bold">
          {impact.data?.data.horasTrabalhadasIA}h
        </p>
      </Card>

      <Card>
        <h3>Automação</h3>
        <p className="text-3xl font-bold">
          {automation.data?.data.taxaAutomacao}%
        </p>
      </Card>
    </div>
  )
}
```

### Pattern 5: Filtered Notifications

```tsx
'use client'

import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function FilteredNotifications() {
  const [tipo, setTipo] = useState<'all' | 'info' | 'warning' | 'error'>('all')

  const { notifications } = useNotifications({
    filters: { tipo: tipo === 'all' ? undefined : tipo }
  })

  return (
    <Tabs value={tipo} onValueChange={setTipo}>
      <TabsList>
        <TabsTrigger value="all">Todas</TabsTrigger>
        <TabsTrigger value="info">Info</TabsTrigger>
        <TabsTrigger value="warning">Avisos</TabsTrigger>
        <TabsTrigger value="error">Erros</TabsTrigger>
      </TabsList>

      <TabsContent value={tipo}>
        {notifications.map(n => (
          <div key={n.id}>{n.titulo}</div>
        ))}
      </TabsContent>
    </Tabs>
  )
}
```

---

## 🎨 Styling Guide

### Color Scheme

```typescript
// Notification types
info: 'text-blue-500'
warning: 'text-yellow-500'
error: 'text-red-500'
success: 'text-green-500'

// Notification levels
low: 'bg-blue-100 text-blue-800'
medium: 'bg-yellow-100 text-yellow-800'
high: 'bg-orange-100 text-orange-800'
critical: 'bg-red-100 text-red-800'

// Trends
positive: 'text-emerald-600'
negative: 'text-red-600'
```

### Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Grid Patterns

```tsx
// 4 columns on desktop, 2 on tablet, 1 on mobile
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

// 3 columns on desktop, 1 on mobile
<div className="grid gap-4 lg:grid-cols-3">

// 2 columns on desktop, 1 on mobile
<div className="grid gap-4 md:grid-cols-2">
```

---

## ⚡ Performance Tips

### 1. Disable Auto-refresh when not needed
```typescript
useNotifications({ autoRefresh: false })
```

### 2. Increase refresh interval for heavy data
```typescript
useDashboardStats({ refreshInterval: 300000 }) // 5 minutes
```

### 3. Use staleTime to reduce requests
```typescript
// In hook configuration
staleTime: 60000 // 1 minute
```

### 4. Lazy load components
```typescript
const NotificationCenter = lazy(() =>
  import('@/components/notifications/NotificationCenter')
)
```

### 5. Memoize expensive calculations
```typescript
const sortedNotifications = useMemo(
  () => notifications.sort((a, b) => b.created_at - a.created_at),
  [notifications]
)
```

---

## 🐛 Debugging

### Enable React Query DevTools

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Log API calls

```typescript
api.interceptors.request.use(config => {
  console.log('API Request:', config.method, config.url)
  return config
})
```

### Check cache

```typescript
const queryClient = useQueryClient()
const cachedData = queryClient.getQueryData(['notifications'])
console.log('Cached notifications:', cachedData)
```

---

## 📝 Type Checking

### Enable strict mode in tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Import types explicitly

```typescript
import type { Notification } from '@/lib/api'

// Instead of
import { Notification } from '@/lib/api'
```

---

## 🚨 Error Handling

### Handle API errors

```typescript
const { error } = useNotifications()

if (error) {
  return <div>Erro: {error.message}</div>
}
```

### Use error boundaries

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <NotificationCenter />
</ErrorBoundary>
```

### Toast for mutations

```typescript
markAsRead(id, {
  onSuccess: () => toast.success('Marcada como lida'),
  onError: () => toast.error('Erro ao marcar como lida')
})
```

---

## 📚 Further Reading

- [React Query Docs](https://tanstack.com/query/latest)
- [Axios Docs](https://axios-http.com)
- [Shadcn UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

---

**Last updated:** ${new Date().toISOString().split('T')[0]}
