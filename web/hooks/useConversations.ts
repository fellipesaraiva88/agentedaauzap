'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsApi, type Conversation, type Message } from '@/lib/api'
import { toast } from 'sonner'

interface UseConversationsOptions {
  companyId?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useConversations(options: UseConversationsOptions = {}) {
  const {
    companyId = 1,
    autoRefresh = true,
    refreshInterval = 30000
  } = options

  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateRange: { start: '', end: '' },
    page: 1,
    limit: 20
  })

  const queryClient = useQueryClient()

  // Query para listar conversas
  const conversationsQuery = useQuery({
    queryKey: ['conversations', companyId, filters],
    queryFn: () => conversationsApi.list({
      status: filters.status === 'all' ? undefined : filters.status,
      search: filters.search || undefined,
      startDate: filters.dateRange.start || undefined,
      endDate: filters.dateRange.end || undefined,
      page: filters.page,
      limit: filters.limit
    }),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 10000
  })

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ chatId, status }: { chatId: string; status: 'new' | 'replied' | 'archived' }) =>
      conversationsApi.updateStatus(chatId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success('Status atualizado com sucesso')
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  })

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: (chatId: string) => conversationsApi.markAsRead(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (error) => {
      console.error('Erro ao marcar como lida:', error)
    }
  })

  // Funções auxiliares
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      status: 'all',
      search: '',
      dateRange: { start: '', end: '' },
      page: 1,
      limit: 20
    })
  }, [])

  const nextPage = useCallback(() => {
    setFilters(prev => ({ ...prev, page: prev.page + 1 }))
  }, [])

  const previousPage = useCallback(() => {
    setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))
  }, [])

  const goToPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  // Estatísticas calculadas
  const stats = {
    total: conversationsQuery.data?.pagination?.total || 0,
    new: conversationsQuery.data?.conversations?.filter((c: Conversation) => c.status === 'new').length || 0,
    replied: conversationsQuery.data?.conversations?.filter((c: Conversation) => c.status === 'replied').length || 0,
    archived: conversationsQuery.data?.conversations?.filter((c: Conversation) => c.status === 'archived').length || 0,
    unread: conversationsQuery.data?.conversations?.reduce((acc: number, c: Conversation) => acc + c.unreadCount, 0) || 0
  }

  return {
    // Dados
    conversations: conversationsQuery.data?.conversations || [],
    pagination: conversationsQuery.data?.pagination,
    stats,

    // Estados
    isLoading: conversationsQuery.isLoading,
    isError: conversationsQuery.isError,
    error: conversationsQuery.error,
    filters,

    // Ações
    refetch: conversationsQuery.refetch,
    updateFilters,
    resetFilters,
    nextPage,
    previousPage,
    goToPage,
    updateStatus: updateStatusMutation.mutate,
    markAsRead: markAsReadMutation.mutate,

    // Estados das mutations
    isUpdatingStatus: updateStatusMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending
  }
}

// Hook para mensagens de uma conversa específica
export function useConversationMessages(chatId: string | null) {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const messagesQuery = useQuery({
    queryKey: ['messages', chatId, page],
    queryFn: () => conversationsApi.getMessages(chatId!, { page, limit: 50 }),
    enabled: !!chatId,
    refetchInterval: 10000,
    staleTime: 5000
  })

  const loadMore = useCallback(() => {
    setPage(prev => prev + 1)
  }, [])

  const reset = useCallback(() => {
    setPage(1)
  }, [])

  // Reset página quando mudar de conversa
  useEffect(() => {
    reset()
  }, [chatId, reset])

  return {
    messages: messagesQuery.data?.messages || [],
    pagination: messagesQuery.data?.pagination,
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    error: messagesQuery.error,
    hasMore: messagesQuery.data?.pagination?.page < messagesQuery.data?.pagination?.totalPages,
    loadMore,
    reset,
    refetch: messagesQuery.refetch
  }
}