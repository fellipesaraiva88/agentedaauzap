'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Clock, User } from 'lucide-react'

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conversas</h1>
        <p className="text-gray-500">Histórico de conversas com clientes</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Em breve</h3>
          <p className="text-gray-500 text-center max-w-md">
            Visualização de histórico de conversas do WhatsApp será implementada em breve.
            Por enquanto, você pode acompanhar as conversas diretamente pelo WhatsApp.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionalidades Planejadas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-gray-600">
              <li>• Histórico completo de mensagens</li>
              <li>• Busca por conversas</li>
              <li>• Filtros por período</li>
              <li>• Análise de sentimento</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integração WAHA</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-gray-600">
              <li>• Sincronização em tempo real</li>
              <li>• Webhook de mensagens</li>
              <li>• Status de leitura</li>
              <li>• Anexos e mídias</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analytics</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 text-gray-600">
              <li>• Tempo de resposta médio</li>
              <li>• Taxa de conversão</li>
              <li>• Tópicos mais frequentes</li>
              <li>• Satisfação do cliente</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
