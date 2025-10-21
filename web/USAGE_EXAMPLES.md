# Frontend API - Exemplos de Uso

Exemplos práticos de como usar o sistema de API otimizado.

---

## 📚 Índice

1. [Testar Conectividade](#1-testar-conectividade)
2. [Fazer Requisições](#2-fazer-requisições)
3. [Usar Sistema de Testes](#3-usar-sistema-de-testes)
4. [Validar Configuração](#4-validar-configuração)
5. [Tratamento de Erros](#5-tratamento-de-erros)
6. [Componente Visual](#6-componente-visual)

---

## 1. Testar Conectividade

### Teste Simples ao Carregar Página

```tsx
// app/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { testConnectivity } from '@/lib/api-test'

export default function DashboardPage() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await testConnectivity()
      setIsConnected(connected)
    }

    checkConnection()
  }, [])

  if (isConnected === null) {
    return <div>Verificando conexão...</div>
  }

  if (!isConnected) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        ❌ Backend desconectado. Verifique se o servidor está rodando.
      </div>
    )
  }

  return <div>✅ Dashboard carregado com sucesso!</div>
}
```

---

## 2. Fazer Requisições

### Buscar Dados do Dashboard

```tsx
'use client'

import { useEffect, useState } from 'react'
import { dashboardApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function StatsCard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await dashboardApi.getStats()
        setStats(data)
      } catch (error) {
        console.error('Error fetching stats:', error)
        toast.error('Erro ao carregar estatísticas')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return <div>Carregando...</div>

  return (
    <div>
      <h2>Estatísticas</h2>
      <p>Total de agendamentos: {stats?.appointments?.total || 0}</p>
    </div>
  )
}
```

### Criar Novo Agendamento

```tsx
'use client'

import { useState } from 'react'
import { appointmentsApi, type Appointment } from '@/lib/api'
import toast from 'react-hot-toast'

export default function CreateAppointmentForm() {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)

      const newAppointment: Partial<Appointment> = {
        petNome: formData.get('petNome') as string,
        tutorNome: formData.get('tutorNome') as string,
        dataAgendamento: formData.get('date') as string,
        horaAgendamento: formData.get('time') as string,
        serviceId: parseInt(formData.get('serviceId') as string),
      }

      const result = await appointmentsApi.create(newAppointment)

      toast.success('Agendamento criado com sucesso!')
      console.log('Criado:', result)

      // Reset form
      e.currentTarget.reset()
    } catch (error: any) {
      console.error('Error creating appointment:', error)
      toast.error(error.response?.data?.message || 'Erro ao criar agendamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="petNome" placeholder="Nome do Pet" required />
      <input name="tutorNome" placeholder="Nome do Tutor" required />
      <input name="date" type="date" required />
      <input name="time" type="time" required />
      <input name="serviceId" type="number" placeholder="ID do Serviço" required />

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
      >
        {loading ? 'Criando...' : 'Criar Agendamento'}
      </button>
    </form>
  )
}
```

---

## 3. Usar Sistema de Testes

### Testar Todos os Endpoints

```tsx
'use client'

import { useState } from 'react'
import { testAllEndpoints, type TestSummary } from '@/lib/api-test'

export default function TestAllButton() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestSummary | null>(null)

  const runTests = async () => {
    setTesting(true)

    try {
      const summary = await testAllEndpoints({
        showToast: true,
        skipAuth: false,
      })

      setResults(summary)

      console.log('Testes concluídos:', summary)
    } catch (error) {
      console.error('Erro nos testes:', error)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div>
      <button
        onClick={runTests}
        disabled={testing}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        {testing ? 'Testando...' : 'Testar Todos os Endpoints'}
      </button>

      {results && (
        <div className="mt-4 p-4 bg-white rounded shadow">
          <h3 className="font-bold mb-2">Resultados:</h3>
          <p>✅ Passou: {results.passed}</p>
          <p>❌ Falhou: {results.failed}</p>
          <p>⏱️ Duração: {results.duration}ms</p>
          <p>📊 Taxa de sucesso: {((results.passed / results.total) * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  )
}
```

### Testar Endpoint Específico

```tsx
'use client'

import { testEndpoint } from '@/lib/api-test'

export default function QuickHealthCheck() {
  const checkHealth = async () => {
    const result = await testEndpoint('health', { showToast: true })

    if (result.status === 'success') {
      console.log(`✅ Backend OK! (${result.responseTime}ms)`)
    } else {
      console.error('❌ Backend com problemas:', result.error)
    }
  }

  return (
    <button
      onClick={checkHealth}
      className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
    >
      Check Health
    </button>
  )
}
```

---

## 4. Validar Configuração

### Verificar .env.local ao Iniciar

```tsx
// app/layout.tsx
'use client'

import { useEffect } from 'react'
import { logConfigValidation, validateConfig } from '@/lib/config-validator'

export default function RootLayout({ children }) {
  useEffect(() => {
    // Log validação no console (apenas em dev)
    if (process.env.NODE_ENV === 'development') {
      logConfigValidation()
    }

    // Verificar se configuração é válida
    const validation = validateConfig()

    if (!validation.valid) {
      console.error('❌ Configuração inválida:', validation.errors)
      // Opcional: mostrar modal de erro
    } else if (validation.warnings.length > 0) {
      console.warn('⚠️ Avisos de configuração:', validation.warnings)
    }
  }, [])

  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

### Mostrar Status de Configuração

```tsx
'use client'

import { checkBackendConfig } from '@/lib/config-validator'

export default function ConfigStatus() {
  const config = checkBackendConfig()

  return (
    <div className={`p-4 rounded border ${config.valid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Backend Config</h3>
        <span className={`px-2 py-1 rounded text-sm ${config.valid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {config.valid ? 'Valid' : 'Has Issues'}
        </span>
      </div>

      <p className="text-sm text-gray-600">URL: {config.url}</p>

      {config.issues.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium text-yellow-800">Issues:</p>
          <ul className="text-sm text-yellow-700 list-disc pl-5">
            {config.issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

---

## 5. Tratamento de Erros

### Tratamento Básico com Try/Catch

```tsx
'use client'

import { appointmentsApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function DeleteAppointment({ id }: { id: number }) {
  const handleDelete = async () => {
    try {
      await appointmentsApi.delete(id)
      toast.success('Agendamento excluído com sucesso!')
    } catch (error: any) {
      // Error já foi tratado pelo interceptor
      // Mas você pode adicionar lógica específica aqui

      if (error.response?.status === 404) {
        toast.error('Agendamento não encontrado')
      } else if (error.response?.status === 403) {
        toast.error('Você não tem permissão para excluir')
      } else {
        toast.error('Erro ao excluir agendamento')
      }
    }
  }

  return (
    <button onClick={handleDelete} className="text-red-600 hover:text-red-800">
      Excluir
    </button>
  )
}
```

### Tratamento com React Query

```tsx
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AppointmentsList() {
  const queryClient = useQueryClient()

  // Fetch appointments
  const { data, isLoading, error } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.list(),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => appointmentsApi.delete(id),
    onSuccess: () => {
      // Invalidar cache para recarregar lista
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Agendamento excluído!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir')
    },
  })

  if (isLoading) return <div>Carregando...</div>
  if (error) return <div>Erro ao carregar agendamentos</div>

  return (
    <div>
      {data?.appointments?.map((apt: any) => (
        <div key={apt.id} className="flex items-center justify-between p-4 border-b">
          <div>
            <p className="font-medium">{apt.petNome}</p>
            <p className="text-sm text-gray-600">{apt.dataAgendamento}</p>
          </div>

          <button
            onClick={() => deleteMutation.mutate(apt.id)}
            disabled={deleteMutation.isPending}
            className="text-red-600 hover:text-red-800"
          >
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## 6. Componente Visual

### Usar ApiTester em Página de Dev

```tsx
// app/dashboard/dev/page.tsx
import ApiTester from '@/components/dev/ApiTester'

export default function DevToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Developer Tools</h1>
          <p className="text-gray-600 mt-2">
            Test API endpoints and monitor backend connectivity
          </p>
        </div>

        <ApiTester />
      </div>
    </div>
  )
}
```

### Badge de Status da API

```tsx
'use client'

import { useEffect, useState } from 'react'
import { testConnectivity } from '@/lib/api-test'

export default function ApiStatusBadge() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    const check = async () => {
      const connected = await testConnectivity()
      setStatus(connected ? 'connected' : 'error')
    }

    check()

    // Verificar a cada 5 minutos
    const interval = setInterval(check, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusConfig = () => {
    switch (status) {
      case 'checking':
        return { icon: '🔄', text: 'Checking...', color: 'bg-gray-100 text-gray-800' }
      case 'connected':
        return { icon: '✅', text: 'API Online', color: 'bg-green-100 text-green-800' }
      case 'error':
        return { icon: '❌', text: 'API Offline', color: 'bg-red-100 text-red-800' }
    }
  }

  const config = getStatusConfig()

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.icon} {config.text}
    </div>
  )
}
```

---

## 🎯 Boas Práticas

### 1. Sempre Usar Try/Catch

```tsx
// ✅ Bom
try {
  const data = await api.get('/endpoint')
  // processar data
} catch (error) {
  // tratar erro
}

// ❌ Ruim
const data = await api.get('/endpoint') // Sem tratamento
```

### 2. Invalidar Cache após Mutações

```tsx
// ✅ Bom - Com React Query
const mutation = useMutation({
  mutationFn: createAppointment,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
  },
})

// ❌ Ruim - Sem invalidar cache
const mutation = useMutation({
  mutationFn: createAppointment,
  // Cache fica desatualizado
})
```

### 3. Mostrar Loading States

```tsx
// ✅ Bom
if (isLoading) return <div>Carregando...</div>
if (error) return <div>Erro: {error.message}</div>
return <div>{data}</div>

// ❌ Ruim
return <div>{data}</div> // Sem loading/error states
```

### 4. Testar Conectividade antes de Operações Críticas

```tsx
// ✅ Bom
const handleCriticalOperation = async () => {
  const connected = await testConnectivity()

  if (!connected) {
    toast.error('Backend desconectado. Tente novamente.')
    return
  }

  // Continuar com operação
}
```

---

## 🔗 Links Relacionados

- **Relatório Completo:** `/FRONTEND_API_OPTIMIZATION_REPORT.md`
- **Sumário:** `/FRONTEND_SUMMARY.md`
- **Guia de Testes:** `/web/lib/README_API_TESTING.md`

---

**Última atualização:** 21 de Outubro de 2025
