'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  MessageSquare,
  FileText,
  Tag,
  Archive,
  MoreVertical,
  ChevronRight,
  History,
  Star,
  Ban,
  Download
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Conversation } from '@/lib/api'

interface ConversationDetailsProps {
  conversation: Conversation
  onClose?: () => void
  onArchive?: (chatId: string) => void
  onBlock?: (chatId: string) => void
  onExport?: (chatId: string) => void
}

export function ConversationDetails({
  conversation,
  onClose,
  onArchive,
  onBlock,
  onExport
}: ConversationDetailsProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Função para obter iniciais
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calcular duração da conversa
  const calculateDuration = () => {
    const start = new Date(conversation.createdAt)
    const end = new Date(conversation.updatedAt)
    const diff = end.getTime() - start.getTime()

    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)

    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  // Mock de tags e notas (você pode expandir isso com dados reais)
  const tags = ['Cliente VIP', 'Preferencial', 'Recorrente']
  const notes = [
    {
      id: 1,
      text: 'Cliente prefere atendimento pela manhã',
      date: '2024-01-15',
      author: 'Sistema'
    },
    {
      id: 2,
      text: 'Tem 3 pets: Max, Luna e Bob',
      date: '2024-01-10',
      author: 'Atendente'
    }
  ]

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          Detalhes
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Detalhes da Conversa</SheetTitle>
          <SheetDescription>
            Informações completas sobre o cliente e a conversa
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div className="space-y-6">
            {/* Informações do Cliente */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.clientName}`} />
                      <AvatarFallback>{getInitials(conversation.clientName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{conversation.clientName}</h3>
                      <p className="text-sm text-gray-500">{conversation.clientPhone}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onArchive?.(conversation.chatId)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Arquivar conversa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onBlock?.(conversation.chatId)}>
                        <Ban className="mr-2 h-4 w-4" />
                        Bloquear contato
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onExport?.(conversation.chatId)}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar conversa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{conversation.clientPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span>{conversation.unreadCount} mensagens não lidas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Cliente desde {formatDate(conversation.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Status da Conversa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status da Conversa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status atual</span>
                  <Badge
                    variant={
                      conversation.status === 'new' ? 'default' :
                      conversation.status === 'replied' ? 'secondary' :
                      'outline'
                    }
                  >
                    {conversation.status === 'new' ? 'Nova' :
                     conversation.status === 'replied' ? 'Respondida' :
                     'Arquivada'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Última mensagem</span>
                  <span className="text-sm">{formatDate(conversation.lastMessageAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Duração</span>
                  <span className="text-sm">{calculateDuration()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    + Adicionar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button className="ml-1 hover:text-red-500">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notas
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    + Adicionar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="border-l-2 border-gray-200 pl-3 py-1">
                      <p className="text-sm">{note.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{note.author}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">
                          {new Date(note.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Histórico */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Histórico de Atendimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    <span className="text-sm">Ver histórico completo</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="text-center text-sm text-gray-500">
                    5 atendimentos anteriores
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}