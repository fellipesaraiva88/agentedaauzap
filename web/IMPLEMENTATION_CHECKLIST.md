# 📋 Implementation Checklist

Use este checklist para implementar a integração frontend passo a passo.

---

## 🎯 Fase 1: Setup Inicial (15 min)

### 1.1 Verificar Dependências
```bash
cd web
npm list @tanstack/react-query axios lucide-react sonner
```

- [ ] @tanstack/react-query instalado
- [ ] axios instalado
- [ ] lucide-react instalado
- [ ] sonner instalado

Se faltar alguma:
```bash
npm install @tanstack/react-query axios lucide-react sonner
```

### 1.2 Verificar Providers
Arquivo: `app/providers.tsx`

- [ ] QueryClientProvider configurado
- [ ] Toaster (sonner) adicionado

Código esperado:
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'

const queryClient = new QueryClient()

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}
```

### 1.3 Verificar Layout Root
Arquivo: `app/layout.tsx`

- [ ] Providers envolvendo children

Código esperado:
```tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

## 🔔 Fase 2: Implementar Notificações (30 min)

### 2.1 Adicionar ao Header
Arquivo: `components/Header.tsx` ou `app/dashboard/layout.tsx`

```tsx
import { NotificationCenter } from '@/components/notifications/NotificationCenter'

// No seu header/nav
<NotificationCenter />
```

- [ ] NotificationCenter importado
- [ ] Componente adicionado ao header
- [ ] Badge de contador visível
- [ ] Dropdown funcionando

### 2.2 Testar Funcionalidades
Abra o navegador e teste:

- [ ] Badge mostra quantidade de não lidas
- [ ] Clique abre dropdown
- [ ] Notificações aparecem na lista
- [ ] Botão "Marcar como lida" funciona
- [ ] Botão "Arquivar" funciona
- [ ] Botão "Deletar" funciona
- [ ] Toast aparece nas ações
- [ ] Auto-refresh funciona (aguarde 10s)

### 2.3 Criar Página de Notificações (Opcional)
Arquivo: `app/dashboard/notifications/page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all')

  const { notifications, markAsRead, archive, deleteNotification } = useNotifications({
    filters: {
      lida: filter === 'unread' ? false : undefined,
      arquivada: filter === 'archived' ? true : undefined
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Notificações</h1>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unread">Não lidas</TabsTrigger>
          <TabsTrigger value="archived">Arquivadas</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {notifications.map(notification => (
            <Card key={notification.id} className="p-4">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold">{notification.titulo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {notification.mensagem}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!notification.lida && (
                    <Button size="sm" onClick={() => markAsRead(notification.id)}>
                      Marcar como lida
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => archive(notification.id)}>
                    Arquivar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteNotification(notification.id)}>
                    Deletar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] Página criada
- [ ] Tabs funcionando
- [ ] Filtros aplicando
- [ ] Ações funcionando

---

## 📊 Fase 3: Implementar Dashboard Stats (45 min)

### 3.1 Atualizar Dashboard Principal
Arquivo: `app/dashboard/page.tsx`

```tsx
import { StatsCards } from '@/components/stats/StatsCards'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <StatsCards />
      {/* Outros componentes existentes */}
    </div>
  )
}
```

- [ ] StatsCards importado
- [ ] Componente renderizando
- [ ] 4 cards aparecendo
- [ ] Dados carregando
- [ ] Loading skeleton funcionando

### 3.2 Atualizar Página de Stats
Arquivo: `app/dashboard/stats/page.tsx`

Substituir conteúdo existente por:

```tsx
'use client'

import { StatsCards, AutomationStatsCard } from '@/components/stats/StatsCards'
import { useRevenueStats, useClientStats } from '@/hooks/useStats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export default function StatsPage() {
  const { data: revenueData } = useRevenueStats({ period: 'month', groupBy: 'day' })
  const { data: clientsData } = useClientStats()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Estatísticas</h1>

      {/* Overview */}
      <StatsCards />

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <AutomationStatsCard />

        <Card>
          <CardHeader>
            <CardTitle>Top Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientsData?.data.topClients.slice(0, 5).map(client => (
                <div key={client.telefone} className="flex justify-between">
                  <div>
                    <p className="font-medium">{client.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.totalAgendamentos} agendamentos
                    </p>
                  </div>
                  <p className="font-bold">
                    {formatCurrency(client.valorTotalGasto)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Receita Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {revenueData?.data.timeline.map(item => (
              <div key={item.periodo} className="flex justify-between">
                <span>{item.periodo}</span>
                <span className="font-semibold">
                  {formatCurrency(item.receita)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] Página atualizada
- [ ] Stats cards renderizando
- [ ] Top clientes aparecendo
- [ ] Timeline de receita exibida
- [ ] Auto-refresh funcionando

### 3.3 Testar Auto-refresh
- [ ] Aguarde 1 minuto
- [ ] Verifique se dados atualizam
- [ ] Console não mostra erros

---

## 🧪 Fase 4: Testes Funcionais (30 min)

### 4.1 Testar Notifications API

Abra o console do navegador e execute:

```javascript
// Criar notificação de teste
const { notificationsApi } = await import('/lib/api')

await notificationsApi.create({
  tipo: 'info',
  titulo: 'Teste de Notificação',
  mensagem: 'Esta é uma notificação de teste',
  nivel: 'medium'
})
```

- [ ] Notificação criada
- [ ] Badge atualiza contador
- [ ] Notificação aparece no dropdown
- [ ] Toast aparece

### 4.2 Testar Stats API

```javascript
const { statsApi } = await import('/lib/api')

// Testar dashboard
const dashboard = await statsApi.getDashboard()
console.log('Dashboard:', dashboard)

// Testar appointments
const appointments = await statsApi.getAppointments({ period: 'month' })
console.log('Appointments:', appointments)

// Testar impact
const impact = await statsApi.getImpact()
console.log('Impact:', impact)
```

- [ ] Dashboard stats retornam
- [ ] Appointments stats retornam
- [ ] Impact stats retornam
- [ ] Dados formatados corretamente

### 4.3 Testar Hooks

Em qualquer componente:

```tsx
import { useNotifications, useDashboardStats } from '@/hooks/...'

function TestComponent() {
  const { notifications, unreadCount } = useNotifications()
  const { data: stats } = useDashboardStats()

  console.log('Notifications:', notifications, 'Unread:', unreadCount)
  console.log('Stats:', stats)

  return null
}
```

- [ ] Hooks retornam dados
- [ ] Loading states funcionam
- [ ] Cache funciona (verifique DevTools)
- [ ] Auto-refresh funciona

---

## 🔍 Fase 5: Verificação de Qualidade (20 min)

### 5.1 TypeScript
```bash
npm run type-check
# ou
npx tsc --noEmit
```

- [ ] Sem erros TypeScript
- [ ] Autocomplete funcionando no VS Code

### 5.2 Build
```bash
npm run build
```

- [ ] Build sucesso
- [ ] Sem warnings críticos

### 5.3 Acessibilidade
Teste com teclado:

- [ ] Tab navega pelos elementos
- [ ] Enter abre dropdown
- [ ] Escape fecha dropdown
- [ ] Setas navegam nas notificações

### 5.4 Responsividade
Teste nos breakpoints:

- [ ] Mobile (< 640px): 1 coluna
- [ ] Tablet (640-1024px): 2 colunas
- [ ] Desktop (> 1024px): 4 colunas

### 5.5 Performance
Abra DevTools > Performance:

- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Sem re-renders desnecessários

---

## 🚀 Fase 6: Otimizações (Opcional)

### 6.1 Adicionar React Query DevTools

Arquivo: `app/providers.tsx`

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

- [ ] DevTools instalado
- [ ] Botão aparece no canto inferior
- [ ] Cache visível

### 6.2 Configurar Stale Times

Arquivo: `app/providers.tsx`

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 segundos
      refetchOnWindowFocus: false,
    },
  },
})
```

- [ ] Stale time configurado
- [ ] Refetch on focus desabilitado (se desejado)

### 6.3 Lazy Loading

```tsx
import { lazy, Suspense } from 'react'

const NotificationCenter = lazy(() =>
  import('@/components/notifications/NotificationCenter')
)

// Uso
<Suspense fallback={<Skeleton />}>
  <NotificationCenter />
</Suspense>
```

- [ ] Lazy loading configurado
- [ ] Suspense boundary adicionado

---

## 📱 Fase 7: Mobile Testing (15 min)

### 7.1 Testar em Dispositivos
Use Chrome DevTools > Toggle Device Toolbar:

**iPhone 12 (390x844)**
- [ ] Layout responsivo
- [ ] Dropdown funciona
- [ ] Cards empilham (1 coluna)
- [ ] Touch funciona

**iPad (768x1024)**
- [ ] 2 colunas de cards
- [ ] Notificações legíveis
- [ ] Navegação fluida

**Desktop (1920x1080)**
- [ ] 4 colunas de cards
- [ ] Todos os elementos visíveis
- [ ] Não há overflow

### 7.2 Testar Gestos
- [ ] Swipe funciona (se implementado)
- [ ] Tap funciona em todos os botões
- [ ] Long press não causa problemas

---

## ✅ Checklist Final

### Funcionalidades Core
- [ ] Notificações carregam
- [ ] Badge mostra contador correto
- [ ] Marcar como lida funciona
- [ ] Arquivar funciona
- [ ] Deletar funciona
- [ ] Stats carregam
- [ ] Dashboard stats renderizam
- [ ] Auto-refresh funciona

### Qualidade de Código
- [ ] Sem erros TypeScript
- [ ] Build sucesso
- [ ] Sem console errors
- [ ] Sem warnings importantes

### Performance
- [ ] Loading rápido (< 3s)
- [ ] Sem re-renders desnecessários
- [ ] Cache funcionando
- [ ] Auto-refresh não sobrecarrega

### UX/UI
- [ ] Responsivo em todos os tamanhos
- [ ] Acessível via teclado
- [ ] Loading states claros
- [ ] Feedback visual adequado

### Documentação
- [ ] Código comentado
- [ ] README atualizado
- [ ] Tipos documentados

---

## 🐛 Troubleshooting

### Problema: Notificações não carregam
```typescript
// Verifique a autenticação
const token = localStorage.getItem('token')
console.log('Token:', token)

// Verifique companyId
const companyId = localStorage.getItem('selectedCompanyId')
console.log('CompanyId:', companyId)

// Verifique endpoint
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
```

### Problema: Stats não aparecem
```typescript
// Verifique se backend está rodando
fetch('http://localhost:3000/api/stats/dashboard')
  .then(r => r.json())
  .then(console.log)

// Verifique cache
import { useQueryClient } from '@tanstack/react-query'
const queryClient = useQueryClient()
console.log(queryClient.getQueryCache())
```

### Problema: TypeScript errors
```bash
# Limpar cache
rm -rf .next
rm -rf node_modules/.cache

# Reinstalar
npm install

# Rebuild
npm run build
```

### Problema: Auto-refresh não funciona
```typescript
// Verifique configuração do hook
useNotifications({
  autoRefresh: true, // Deve ser true
  refreshInterval: 10000 // Em milissegundos
})

// Verifique React Query config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false, // Não deve bloquear
    },
  },
})
```

---

## 📊 Métricas de Sucesso

Ao final da implementação, você deve ter:

- ✅ 0 erros TypeScript
- ✅ 0 erros de build
- ✅ < 3s tempo de carregamento
- ✅ 100% funcionalidades testadas
- ✅ Responsivo em 3+ dispositivos
- ✅ Acessível (WCAG AA)

---

## 🎉 Conclusão

Parabéns! Se todos os checkboxes estão marcados, a integração está completa.

### Próximos passos:
1. Deploy para staging
2. Testes com usuários reais
3. Coletar feedback
4. Iterar melhorias

### Recursos adicionais:
- [FRONTEND_INTEGRATION_REPORT.md](/FRONTEND_INTEGRATION_REPORT.md) - Documentação completa
- [INTEGRATION_QUICK_REFERENCE.md](/web/INTEGRATION_QUICK_REFERENCE.md) - Referência rápida
- [React Query Docs](https://tanstack.com/query/latest)

---

**Checklist criado em:** ${new Date().toLocaleDateString('pt-BR')}
**Tempo estimado total:** ~3 horas
**Dificuldade:** Intermediário
