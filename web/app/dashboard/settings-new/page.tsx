'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  Building2,
  Bot,
  Clock,
  MessageSquare,
  Webhook,
  Users,
  Save,
  Palette
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'

export default function SettingsExpandedPage() {
  const queryClient = useQueryClient()

  const [companyData, setCompanyData] = useState({
    nome: '',
    slug: '',
    whatsapp: '',
    email: '',
    telefone: '',
    endereco_rua: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_estado: '',
    endereco_cep: '',
    logo_url: '',
    cor_primaria: '#0066FF',
    cor_secundaria: '#00CC99'
  })

  const [agentData, setAgentData] = useState({
    agente_nome: '',
    agente_persona: ''
  })

  const [scheduleData, setScheduleData] = useState({
    horario_funcionamento: {
      segunda: '',
      terca: '',
      quarta: '',
      quinta: '',
      sexta: '',
      sabado: '',
      domingo: ''
    },
    max_agendamentos_dia: 10,
    tempo_medio_servico: 60,
    antecedencia_minima_horas: 2,
    antecedencia_maxima_dias: 30,
    permite_cancelamento: true,
    horas_antecedencia_cancelamento: 24
  })

  const [messagesData, setMessagesData] = useState({
    mensagem_boas_vindas: '',
    mensagem_confirmacao: '',
    mensagem_lembrete: '',
    enviar_lembrete_horas_antes: 24
  })

  const [integrationData, setIntegrationData] = useState({
    webhook_url: '',
    api_key: ''
  })

  // Fetch company settings
  const { data: companySettings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const response = await api.get('/companies/current')
      return response.data
    }
  })

  // Update mutations
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch('/companies/current', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] })
      toast.success('Configurações da empresa atualizadas!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar')
    }
  })

  useEffect(() => {
    if (companySettings?.data) {
      const company = companySettings.data
      setCompanyData({
        nome: company.nome || '',
        slug: company.slug || '',
        whatsapp: company.whatsapp || '',
        email: company.email || '',
        telefone: company.telefone || '',
        endereco_rua: company.endereco_rua || '',
        endereco_numero: company.endereco_numero || '',
        endereco_bairro: company.endereco_bairro || '',
        endereco_cidade: company.endereco_cidade || '',
        endereco_estado: company.endereco_estado || '',
        endereco_cep: company.endereco_cep || '',
        logo_url: company.logo_url || '',
        cor_primaria: company.cor_primaria || '#0066FF',
        cor_secundaria: company.cor_secundaria || '#00CC99'
      })

      setAgentData({
        agente_nome: company.agente_nome || '',
        agente_persona: company.agente_persona || ''
      })

      setScheduleData({
        horario_funcionamento: company.horario_funcionamento || {},
        max_agendamentos_dia: company.max_agendamentos_dia || 10,
        tempo_medio_servico: company.tempo_medio_servico || 60,
        antecedencia_minima_horas: company.antecedencia_minima_horas || 2,
        antecedencia_maxima_dias: company.antecedencia_maxima_dias || 30,
        permite_cancelamento: company.permite_cancelamento ?? true,
        horas_antecedencia_cancelamento: company.horas_antecedencia_cancelamento || 24
      })

      setMessagesData({
        mensagem_boas_vindas: company.mensagem_boas_vindas || '',
        mensagem_confirmacao: company.mensagem_confirmacao || '',
        mensagem_lembrete: company.mensagem_lembrete || '',
        enviar_lembrete_horas_antes: company.enviar_lembrete_horas_antes || 24
      })

      setIntegrationData({
        webhook_url: company.webhook_url || '',
        api_key: company.api_key || ''
      })
    }
  }, [companySettings])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configurações Completas
        </h1>
        <p className="text-muted-foreground">Gerencie todas as configurações do sistema</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4 mr-2" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="agent">
            <Bot className="h-4 w-4 mr-2" />
            Agente IA
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Clock className="h-4 w-4 mr-2" />
            Horários
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="integration">
            <Webhook className="h-4 w-4 mr-2" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="h-4 w-4 mr-2" />
            Tema
          </TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>Dados principais do seu negócio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa *</Label>
                  <Input
                    value={companyData.nome}
                    onChange={(e) => setCompanyData({ ...companyData, nome: e.target.value })}
                    placeholder="Pet Shop Exemplo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={companyData.slug}
                    onChange={(e) => setCompanyData({ ...companyData, slug: e.target.value })}
                    placeholder="petshop-exemplo"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={companyData.whatsapp}
                    onChange={(e) => setCompanyData({ ...companyData, whatsapp: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    placeholder="contato@petshop.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={companyData.telefone}
                    onChange={(e) => setCompanyData({ ...companyData, telefone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Endereço</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Logradouro</Label>
                    <Input
                      value={companyData.endereco_rua}
                      onChange={(e) => setCompanyData({ ...companyData, endereco_rua: e.target.value })}
                      placeholder="Rua, Avenida..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input
                      value={companyData.endereco_numero}
                      onChange={(e) => setCompanyData({ ...companyData, endereco_numero: e.target.value })}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input
                      value={companyData.endereco_bairro}
                      onChange={(e) => setCompanyData({ ...companyData, endereco_bairro: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={companyData.endereco_cidade}
                      onChange={(e) => setCompanyData({ ...companyData, endereco_cidade: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input
                      value={companyData.endereco_estado}
                      onChange={(e) => setCompanyData({ ...companyData, endereco_estado: e.target.value })}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input
                      value={companyData.endereco_cep}
                      onChange={(e) => setCompanyData({ ...companyData, endereco_cep: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateCompanyMutation.mutate(companyData)}
                  disabled={updateCompanyMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Empresa
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agent Tab */}
        <TabsContent value="agent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Agente IA</CardTitle>
              <CardDescription>Personalize o comportamento da IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Agente</Label>
                <Input
                  value={agentData.agente_nome}
                  onChange={(e) => setAgentData({ ...agentData, agente_nome: e.target.value })}
                  placeholder="Ex: Luna, Max, Bella"
                />
              </div>

              <div className="space-y-2">
                <Label>Persona do Agente</Label>
                <Textarea
                  value={agentData.agente_persona}
                  onChange={(e) => setAgentData({ ...agentData, agente_persona: e.target.value })}
                  rows={8}
                  placeholder="Descreva como o agente deve se comportar, seu tom de voz, estilo de atendimento..."
                />
                <p className="text-xs text-muted-foreground">
                  Exemplo: "Você é um atendente amigável e carinhoso de pet shop. Sempre demonstre amor pelos animais e seja empático com os tutores."
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateCompanyMutation.mutate(agentData)}
                  disabled={updateCompanyMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Agente
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Automáticas</CardTitle>
              <CardDescription>Configure as mensagens enviadas automaticamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem de Boas-Vindas</Label>
                <Textarea
                  value={messagesData.mensagem_boas_vindas}
                  onChange={(e) => setMessagesData({ ...messagesData, mensagem_boas_vindas: e.target.value })}
                  rows={3}
                  placeholder="Olá! Seja bem-vindo(a) ao nosso pet shop..."
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Confirmação</Label>
                <Textarea
                  value={messagesData.mensagem_confirmacao}
                  onChange={(e) => setMessagesData({ ...messagesData, mensagem_confirmacao: e.target.value })}
                  rows={3}
                  placeholder="Seu agendamento foi confirmado com sucesso!"
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Lembrete</Label>
                <Textarea
                  value={messagesData.mensagem_lembrete}
                  onChange={(e) => setMessagesData({ ...messagesData, mensagem_lembrete: e.target.value })}
                  rows={3}
                  placeholder="Olá! Lembrando que você tem um agendamento..."
                />
              </div>

              <div className="space-y-2">
                <Label>Enviar lembrete (horas antes)</Label>
                <Input
                  type="number"
                  value={messagesData.enviar_lembrete_horas_antes}
                  onChange={(e) => setMessagesData({ ...messagesData, enviar_lembrete_horas_antes: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateCompanyMutation.mutate(messagesData)}
                  disabled={updateCompanyMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Mensagens
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks e API</CardTitle>
              <CardDescription>Configure integrações externas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={integrationData.webhook_url}
                  onChange={(e) => setIntegrationData({ ...integrationData, webhook_url: e.target.value })}
                  placeholder="https://seu-webhook.com/endpoint"
                />
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={integrationData.api_key}
                  onChange={(e) => setIntegrationData({ ...integrationData, api_key: e.target.value })}
                  placeholder="Sua chave de API"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateCompanyMutation.mutate(integrationData)}
                  disabled={updateCompanyMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Integrações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personalização Visual</CardTitle>
              <CardDescription>Cores e logo da empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={companyData.cor_primaria}
                      onChange={(e) => setCompanyData({ ...companyData, cor_primaria: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={companyData.cor_primaria}
                      onChange={(e) => setCompanyData({ ...companyData, cor_primaria: e.target.value })}
                      placeholder="#0066FF"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={companyData.cor_secundaria}
                      onChange={(e) => setCompanyData({ ...companyData, cor_secundaria: e.target.value })}
                      className="w-20"
                    />
                    <Input
                      value={companyData.cor_secundaria}
                      onChange={(e) => setCompanyData({ ...companyData, cor_secundaria: e.target.value })}
                      placeholder="#00CC99"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateCompanyMutation.mutate({
                    cor_primaria: companyData.cor_primaria,
                    cor_secundaria: companyData.cor_secundaria
                  })}
                  disabled={updateCompanyMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Tema
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
