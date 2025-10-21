'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Clock,
  User,
  Archive,
  CheckCheck,
  Check,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/lib/api'

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  onStatusChange: (chatId: string, status: 'new' | 'replied' | 'archived') => void
  isLoading?: boolean
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  onStatusChange,
  isLoading = false
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // Filtrar conversas
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchTerm === '' ||
      conv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.clientPhone.includes(searchTerm) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !statusFilter || conv.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Função para formatar tempo relativo
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'agora'
    if (minutes < 60) return `há ${minutes}min`
    if (hours < 24) return `há ${hours}h`
    if (days < 7) return `há ${days}d`

    return date.toLocaleDateString('pt-BR')
  }

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default" className="bg-blue-500">Nova</Badge>
      case 'replied':
        return <Badge variant="secondary">Respondida</Badge>
      case 'archived':
        return <Badge variant="outline">Arquivada</Badge>
      default:
        return null
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full md:w-96 border-r bg-white">
        <div className="p-4 border-b">
          <div className="h-10 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2 p-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-3 flex gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:w-96 border-r bg-white flex flex-col h-full">
      {/* Header com busca e filtros */}
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>

        {/* Filtros de status */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
            className="text-xs"
          >
            Todas
          </Button>
          <Button
            variant={statusFilter === 'new' ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter('new')}
            className="text-xs"
          >
            Novas
          </Button>
          <Button
            variant={statusFilter === 'replied' ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter('replied')}
            className="text-xs"
          >
            Respondidas
          </Button>
          <Button
            variant={statusFilter === 'archived' ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter('archived')}
            className="text-xs"
          >
            Arquivadas
          </Button>
        </div>
      </div>

      {/* Lista de conversas */}
      <ScrollArea className="flex-1">
        <AnimatePresence>
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={cn(
                      "p-4 hover:bg-gray-50 cursor-pointer transition-colors relative",
                      selectedConversation?.id === conversation.id && "bg-blue-50 hover:bg-blue-50"
                    )}
                    onClick={() => onSelectConversation(conversation)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.clientName}`} />
                        <AvatarFallback>{getInitials(conversation.clientName)}</AvatarFallback>
                      </Avatar>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm truncate">
                            {conversation.clientName}
                          </h3>
                          <div className="flex items-center gap-1">
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-[20px] px-1">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onStatusChange(conversation.chatId, 'replied')
                                  }}
                                >
                                  <CheckCheck className="mr-2 h-4 w-4" />
                                  Marcar como respondida
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onStatusChange(conversation.chatId, 'archived')
                                  }}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Arquivar conversa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500 mb-1">{conversation.clientPhone}</p>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {conversation.lastMessage}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(conversation.status)}
                          </div>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  )
}