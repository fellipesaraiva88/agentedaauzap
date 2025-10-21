'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Filter,
  Calendar,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { ConversationList } from '@/components/conversations/ConversationList'
import { MessageTimeline } from '@/components/conversations/MessageTimeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { conversationsApi, type Conversation, type Message } from '@/lib/api'

export default function ConversationsPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [messagesPage, setMessagesPage] = useState(1)

  const queryClient = useQueryClient()

  // Buscar conversas
  const { data: conversationsData, isLoading: isLoadingConversations, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', statusFilter, searchTerm, dateRange, currentPage],
    queryFn: () => conversationsApi.list(1, {
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchTerm || undefined,
      startDate: dateRange.start || undefined,
      endDate: dateRange.end || undefined,
      page: currentPage,
      limit: 20
    }),
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  })

  // Buscar mensagens da conversa selecionada
  const { data: messagesData, isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.chatId, messagesPage],
    queryFn: () => conversationsApi.getMessages(selectedConversation!.chatId, {
      page: messagesPage,
      limit: 50
    }),
    enabled: !!selectedConversation,
    refetchInterval: 10000 // Atualizar a cada 10 segundos
  })

  // Mutation para atualizar status da conversa
  const updateStatusMutation = useMutation({
    mutationFn: ({ chatId, status }: { chatId: string; status: 'new' | 'replied' | 'archived' }) =>
      conversationsApi.updateStatus(chatId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success('Status atualizado com sucesso')
    },
    onError: () => {
      toast.error('Erro ao atualizar status')
    }
  })

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: (chatId: string) => conversationsApi.markAsRead(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  })

  // Marcar conversa como lida ao selecionar
  useEffect(() => {
    if (selectedConversation && selectedConversation.unreadCount > 0) {
      markAsReadMutation.mutate(selectedConversation.chatId)
    }
  }, [selectedConversation])

  // Estatísticas
  const stats = {
    total: conversationsData?.pagination?.total || 0,
    new: conversationsData?.conversations?.filter((c: Conversation) => c.status === 'new').length || 0,
    replied: conversationsData?.conversations?.filter((c: Conversation) => c.status === 'replied').length || 0,
    archived: conversationsData?.conversations?.filter((c: Conversation) => c.status === 'archived').length || 0,
    unread: conversationsData?.conversations?.reduce((acc: number, c: Conversation) => acc + c.unreadCount, 0) || 0
  }

  // Handlers
  const handleStatusChange = (chatId: string, status: 'new' | 'replied' | 'archived') => {
    updateStatusMutation.mutate({ chatId, status })
  }

  const handleLoadMoreMessages = () => {
    setMessagesPage(prev => prev + 1)
  }

  const handleExport = () => {
    // Implementar exportação de conversas
    toast.info('Funcionalidade de exportação em desenvolvimento')
  }

  const handleRefresh = () => {
    refetchConversations()
    if (selectedConversation) {
      refetchMessages()
    }
    toast.success('Conversas atualizadas')
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Conversas</h1>
            <p className="text-sm text-gray-500">
              Gerencie e acompanhe todas as conversas com seus clientes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros Avançados</SheetTitle>
                  <SheetDescription>
                    Filtre as conversas por período, status e outros critérios
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 mt-6">
                  <div>
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="new">Novas</SelectItem>
                        <SelectItem value="replied">Respondidas</SelectItem>
                        <SelectItem value="archived">Arquivadas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Período</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      />
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Buscar</Label>
                    <Input
                      placeholder="Nome, telefone ou mensagem..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      setStatusFilter('all')
                      setDateRange({ start: '', end: '' })
                      setSearchTerm('')
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-gray-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Novas</p>
                  <p className="text-xl font-bold text-blue-600">{stats.new}</p>
                </div>
                <Badge variant="default" className="bg-blue-500">Nova</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Respondidas</p>
                  <p className="text-xl font-bold text-green-600">{stats.replied}</p>
                </div>
                <Badge variant="secondary">OK</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Arquivadas</p>
                  <p className="text-xl font-bold text-gray-600">{stats.archived}</p>
                </div>
                <Badge variant="outline">Arquivo</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Não lidas</p>
                  <p className="text-xl font-bold text-red-600">{stats.unread}</p>
                </div>
                <Badge variant="destructive">{stats.unread}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Área principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lista de conversas */}
        <ConversationList
          conversations={conversationsData?.conversations || []}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          onStatusChange={handleStatusChange}
          isLoading={isLoadingConversations}
        />

        {/* Timeline de mensagens */}
        <div className="flex-1 flex flex-col">
          <MessageTimeline
            conversation={selectedConversation}
            messages={messagesData?.messages || []}
            isLoading={isLoadingMessages}
            onLoadMore={handleLoadMoreMessages}
            hasMore={messagesData?.pagination?.page < messagesData?.pagination?.totalPages}
          />

          {/* Paginação */}
          {conversationsData?.pagination && conversationsData.pagination.totalPages > 1 && (
            <div className="bg-white border-t px-4 py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Página {currentPage} de {conversationsData.pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage === conversationsData.pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}