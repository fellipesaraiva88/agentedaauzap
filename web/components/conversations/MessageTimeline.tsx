'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Paperclip,
  Image,
  File,
  Download,
  Check,
  CheckCheck,
  Clock,
  MoreVertical,
  Reply,
  Copy,
  Trash2,
  User,
  Bot
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Message, Conversation } from '@/lib/api'

interface MessageTimelineProps {
  conversation: Conversation | null
  messages: Message[]
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

export function MessageTimeline({
  conversation,
  messages,
  isLoading = false,
  onLoadMore,
  hasMore = false
}: MessageTimelineProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  // Auto scroll para última mensagem quando novas mensagens chegam
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, autoScroll])

  // Formatar timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isYesterday) {
      return `Ontem às ${date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })}`
    }

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Agrupar mensagens por data
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}

    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })

    return groups
  }

  // Copiar mensagem
  const handleCopyMessage = (message: Message) => {
    navigator.clipboard.writeText(message.body)
    setCopiedMessageId(message.id)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  // Renderizar ícone de status da mensagem
  const renderMessageStatus = (ack: number) => {
    switch (ack) {
      case 0: // Enviando
        return <Clock className="h-3 w-3 text-gray-400" />
      case 1: // Enviado
        return <Check className="h-3 w-3 text-gray-400" />
      case 2: // Entregue
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case 3: // Lido
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  // Loading skeleton
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 bg-gray-50 p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
              <div className="flex gap-2 max-w-[70%]">
                {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
                <div className="space-y-2">
                  <Skeleton className="h-16 w-60 rounded-lg" />
                  <Skeleton className="h-3 w-20" />
                </div>
                {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (!conversation) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">Selecione uma conversa</h3>
          <p className="text-sm text-gray-500 mt-1">
            Escolha uma conversa da lista para ver as mensagens
          </p>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex-1 bg-gray-50 flex flex-col">
      {/* Header da conversa */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.clientName}`} />
            <AvatarFallback>
              {conversation.clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{conversation.clientName}</h3>
            <p className="text-xs text-gray-500">{conversation.clientPhone}</p>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        {hasMore && (
          <div className="text-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              className="text-xs"
            >
              Carregar mensagens anteriores
            </Button>
          </div>
        )}

        <AnimatePresence>
          {Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Separador de data */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {new Date(date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>

              {/* Mensagens do dia */}
              {dateMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={cn(
                    "flex mb-4",
                    message.fromMe ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "flex gap-2 max-w-[70%]",
                    message.fromMe && "flex-row-reverse"
                  )}>
                    {/* Avatar */}
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {message.fromMe ? (
                        <>
                          <AvatarImage src="/bot-avatar.png" />
                          <AvatarFallback className="bg-blue-100">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.clientName}`} />
                          <AvatarFallback>
                            {conversation.clientName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>

                    {/* Bubble da mensagem */}
                    <div className="group relative">
                      <div
                        className={cn(
                          "px-4 py-2 rounded-lg shadow-sm",
                          message.fromMe
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-900"
                        )}
                      >
                        {/* Conteúdo da mensagem */}
                        {message.hasMedia ? (
                          <div className="space-y-2">
                            {message.mediaUrl && (
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4" />
                                <span className="text-sm underline">
                                  Mídia anexada
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  asChild
                                >
                                  <a href={message.mediaUrl} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-3 w-3" />
                                  </a>
                                </Button>
                              </div>
                            )}
                            {message.body && <p className="text-sm whitespace-pre-wrap">{message.body}</p>}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                        )}

                        {/* Timestamp e status */}
                        <div className={cn(
                          "flex items-center gap-1 mt-1",
                          message.fromMe ? "justify-end" : "justify-start"
                        )}>
                          <span className={cn(
                            "text-xs",
                            message.fromMe ? "text-blue-100" : "text-gray-400"
                          )}>
                            {formatTimestamp(message.timestamp)}
                          </span>
                          {message.fromMe && renderMessageStatus(message.ack)}
                        </div>
                      </div>

                      {/* Menu de ações */}
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCopyMessage(message)}>
                              <Copy className="mr-2 h-4 w-4" />
                              {copiedMessageId === message.id ? 'Copiado!' : 'Copiar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Reply className="mr-2 h-4 w-4" />
                              Responder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </AnimatePresence>

        {isLoading && messages.length > 0 && (
          <div className="flex justify-center py-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}