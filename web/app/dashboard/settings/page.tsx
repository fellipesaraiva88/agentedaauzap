'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Settings, Bell, Palette, Database } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-500">Gerencie as configurações do sistema</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Informações da Empresa</CardTitle>
            </div>
            <CardDescription>Dados principais do seu negócio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input id="company-name" defaultValue="Pet Shop Exemplo" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agent-name">Nome do Agente</Label>
              <Input id="agent-name" defaultValue="Marina" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="opening-time">Horário de Abertura</Label>
                <Input id="opening-time" type="time" defaultValue="08:00" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="closing-time">Horário de Fechamento</Label>
                <Input id="closing-time" type="time" defaultValue="18:00" />
              </div>
            </div>
            <Button className="mt-4">Salvar Alterações</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Lembretes Automáticos</CardTitle>
            </div>
            <CardDescription>Configure os lembretes enviados aos clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembrete D-1</p>
                  <p className="text-sm text-gray-500">24 horas antes do agendamento</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">Ativo</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembrete 12h</p>
                  <p className="text-sm text-gray-500">12 horas antes do agendamento</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">Ativo</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembrete 4h</p>
                  <p className="text-sm text-gray-500">4 horas antes do agendamento</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">Ativo</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembrete 1h</p>
                  <p className="text-sm text-gray-500">1 hora antes do agendamento</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600">Ativo</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Capacidade de Atendimento</CardTitle>
            </div>
            <CardDescription>Configure a capacidade simultânea de atendimentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacidade Máxima Simultânea</Label>
              <Input id="capacity" type="number" defaultValue="2" min="1" max="10" />
              <p className="text-xs text-gray-500">
                Número máximo de agendamentos que podem ocorrer ao mesmo tempo
              </p>
            </div>
            <Button className="mt-4">Salvar Alterações</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Personalização</CardTitle>
            </div>
            <CardDescription>Personalize a aparência do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Tema</Label>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1">
                  Claro
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  Escuro (Em breve)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
