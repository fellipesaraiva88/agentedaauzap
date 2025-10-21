'use client'

import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit,
  MessageSquare,
  CalendarPlus,
  Star
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PetCard } from '@/components/pets/PetCard'
import { TimelineEvent } from '@/components/clients/TimelineEvent'
import { EmotionalAnalysisCard } from '@/components/clients/EmotionalAnalysisCard'
import { JourneyStageIndicator } from '@/components/clients/JourneyStageIndicator'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'

interface PageProps {
  params: Promise<{ clientId: string }>
}

export default function ClientDetailPage({ params }: PageProps) {
  const { clientId: id } = use(params)
  const router = useRouter()

  // Fetch tutor data
  const { data: tutorData, isLoading: loadingTutor } = useQuery({
    queryKey: ['tutor', id],
    queryFn: async () => {
      const response = await api.get(`/tutors/${id}`)
      return response.data
    }
  })

  // Fetch pets
  const { data: petsData } = useQuery({
    queryKey: ['pets', id],
    queryFn: async () => {
      const response = await api.get(`/tutors/${id}/pets`)
      return response.data
    }
  })

  // Fetch appointments
  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments', id],
    queryFn: async () => {
      const response = await api.get(`/appointments?tutorId=${id}`)
      return response.data
    }
  })

  // Fetch conversations
  const { data: conversationsData } = useQuery({
    queryKey: ['conversations', id],
    queryFn: async () => {
      const response = await api.get(`/conversations?tutorId=${id}`)
      return response.data
    }
  })

  // Fetch emotional context
  const { data: emotionalData } = useQuery({
    queryKey: ['emotional', id],
    queryFn: async () => {
      const response = await api.get(`/tutors/${id}/emotional-context`)
      return response.data
    }
  })

  // Fetch journey
  const { data: journeyData } = useQuery({
    queryKey: ['journey', id],
    queryFn: async () => {
      const response = await api.get(`/tutors/${id}/journey`)
      return response.data
    }
  })

  if (loadingTutor) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const tutor = tutorData?.data
  if (!tutor) return <div>Cliente não encontrado</div>

  const pets = petsData?.data || []
  const appointments = appointmentsData?.data || []
  const conversations = conversationsData?.data || []

  // Build timeline events
  const timelineEvents: any[] = [
    ...appointments.map((apt: any) => ({
      id: `apt-${apt.id}`,
      tipo: 'agendamento',
      titulo: `Agendamento: ${apt.servicoNome}`,
      descricao: `${apt.petNome} - ${apt.status}`,
      data: apt.dataAgendamento,
      metadata: {
        Preço: formatCurrency(apt.preco),
        Status: apt.status
      }
    })),
    ...conversations.map((conv: any) => ({
      id: `conv-${conv.id}`,
      tipo: 'conversa',
      titulo: 'Conversa no WhatsApp',
      descricao: conv.resumo || 'Interação via WhatsApp',
      data: conv.data_inicio
    }))
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {tutor.nome || 'Cliente'}
            {tutor.is_vip && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Star className="h-3 w-3 mr-1" />
                VIP
              </Badge>
            )}
            {tutor.is_inativo && (
              <Badge variant="outline" className="bg-gray-100">
                Inativo
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Cliente desde {new Date(tutor.cliente_desde).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/clients/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button>
            <MessageSquare className="h-4 w-4 mr-2" />
            Enviar Mensagem
          </Button>
          <Button>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Agendar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(tutor.valor_total_gasto || 0)}</div>
            <p className="text-xs text-muted-foreground">LTV do cliente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tutor.total_servicos || 0}</div>
            <p className="text-xs text-muted-foreground">Agendamentos realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round((tutor.taxa_conversao || 0) * 100)}%</div>
            <p className="text-xs text-muted-foreground">Conversões {tutor.conversoes || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(tutor.ticket_medio || 0)}</div>
            <p className="text-xs text-muted-foreground">Por serviço</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Info */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tutor.telefone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{tutor.telefone}</span>
                </div>
              )}
              {tutor.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{tutor.email}</span>
                </div>
              )}
              {tutor.endereco && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{tutor.endereco}</p>
                    {tutor.bairro && <p className="text-muted-foreground">{tutor.bairro}</p>}
                    {tutor.cidade && tutor.estado && (
                      <p className="text-muted-foreground">
                        {tutor.cidade} - {tutor.estado}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags & Notes */}
          {(tutor.tags || tutor.observacoes) && (
            <Card>
              <CardHeader>
                <CardTitle>Tags e Observações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tutor.tags && tutor.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {tutor.tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {tutor.observacoes && (
                  <div>
                    <p className="text-sm font-medium mb-2">Observações</p>
                    <p className="text-sm text-muted-foreground">{tutor.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Journey */}
          {journeyData?.data && (
            <JourneyStageIndicator journey={journeyData.data} />
          )}

          {/* Emotional Analysis */}
          {emotionalData?.data && (
            <EmotionalAnalysisCard context={emotionalData.data} />
          )}
        </div>

        {/* Right Column - Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="pets" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pets">Pets ({pets.length})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline ({timelineEvents.length})</TabsTrigger>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="pets" className="space-y-4">
              {pets.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum pet cadastrado
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pets.map((pet: any) => (
                    <PetCard
                      key={pet.id}
                      pet={pet}
                      onEdit={(petId) => router.push(`/dashboard/clients/${id}/pets/${petId}/edit`)}
                    />
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/dashboard/clients/${id}/pets/new`)}
              >
                Adicionar Pet
              </Button>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Interações</CardTitle>
                </CardHeader>
                <CardContent>
                  {timelineEvents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma interação registrada
                    </p>
                  ) : (
                    <div className="space-y-0">
                      {timelineEvents.map((event, idx) => (
                        <TimelineEvent
                          key={event.id}
                          event={event}
                          isLast={idx === timelineEvents.length - 1}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas Detalhadas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Score de Fidelidade</p>
                      <p className="text-2xl font-bold">{tutor.score_fidelidade || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Última Interação</p>
                      <p className="text-sm font-medium">
                        {new Date(tutor.ultima_interacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {tutor.ultima_compra && (
                      <div>
                        <p className="text-sm text-muted-foreground">Última Compra</p>
                        <p className="text-sm font-medium">
                          {new Date(tutor.ultima_compra).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {tutor.como_conheceu && (
                      <div>
                        <p className="text-sm text-muted-foreground">Como Conheceu</p>
                        <p className="text-sm font-medium">{tutor.como_conheceu}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium mb-2">Preferências</p>
                    {tutor.preferencias && Object.keys(tutor.preferencias).length > 0 ? (
                      <div className="space-y-1">
                        {Object.entries(tutor.preferencias).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma preferência registrada</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
