'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft, Download, MessageSquare, User, Clock, TrendingUp, Brain } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

interface Message {
  id: string
  sender: 'user' | 'ai'
  content: string
  timestamp: string
  metadata?: {
    emotion?: string
    intent?: string
    confidence?: number
  }
}

export default function ConversationDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  // Fetch conversation
  const { data: conversationData, isLoading } = useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const response = await api.get(`/conversations/${id}`)
      return response.data
    }
  })

  // Fetch messages
  const { data: messagesData } = useQuery({
    queryKey: ['messages', id],
    queryFn: async () => {
      const response = await api.get(`/conversations/${id}/messages`)
      return response.data
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const conversation = conversationData?.data
  const messages: Message[] = messagesData?.data || []

  if (!conversation) {
    return <div>Conversa não encontrada</div>
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    const text = messages.map(m =>
      `[${new Date(m.timestamp).toLocaleString('pt-BR')}] ${m.sender === 'ai' ? 'IA' : 'Cliente'}: ${m.content}`
    ).join('\n\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversa-${id}.txt`
    a.click()
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              Conversa
            </h1>
            <p className="text-muted-foreground">
              {conversation.tutor_nome} - {new Date(conversation.data_inicio).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversation.duracao_minutos || 0}min
            </div>
            <p className="text-xs text-muted-foreground">Tempo de conversa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">Trocadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentimento</CardTitle>
            <Brain className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {conversation.sentimento_predominante || 'Neutro'}
            </div>
            <p className="text-xs text-muted-foreground">Análise de IA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {conversation.converteu ? (
                <Badge className="bg-green-100 text-green-800">Converteu</Badge>
              ) : (
                <Badge variant="outline">Não converteu</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Timeline */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Messages */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Mensagens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma mensagem nesta conversa
                </p>
              ) : (
                messages.map((message, idx) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === 'ai' ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className={message.sender === 'ai' ? 'bg-purple-100' : 'bg-blue-100'}>
                        {message.sender === 'ai' ? '🤖' : conversation.tutor_nome?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Message Bubble */}
                    <div className={`flex-1 ${message.sender === 'ai' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div
                        className={`rounded-lg p-3 max-w-[80%] ${
                          message.sender === 'ai'
                            ? 'bg-purple-100 text-purple-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                        {/* Metadata */}
                        {message.metadata && (
                          <div className="mt-2 pt-2 border-t border-current/20 flex gap-2 flex-wrap text-xs opacity-70">
                            {message.metadata.emotion && (
                              <Badge variant="outline" className="text-xs">
                                😊 {message.metadata.emotion}
                              </Badge>
                            )}
                            {message.metadata.intent && (
                              <Badge variant="outline" className="text-xs">
                                🎯 {message.metadata.intent}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(message.timestamp), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analysis Sidebar */}
        <div className="space-y-4">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{conversation.tutor_nome}</span>
              </div>
              {conversation.tutor_telefone && (
                <p className="text-sm text-muted-foreground">{conversation.tutor_telefone}</p>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {conversation.resumo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resumo da IA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{conversation.resumo}</p>
              </CardContent>
            </Card>
          )}

          {/* Intent */}
          {conversation.intencao && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Intenção Identificada</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>{conversation.intencao}</Badge>
              </CardContent>
            </Card>
          )}

          {/* Actions Taken */}
          {conversation.acoes_ia && conversation.acoes_ia.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ações da IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {conversation.acoes_ia.map((acao: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{acao}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
