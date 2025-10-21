'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Settings, Bell, Palette, Database, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi, CompanySettings, SettingsUpdateData } from '@/lib/api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

// Zod Schema para validação
const settingsSchema = z.object({
  companyName: z.string()
    .min(1, 'Nome da empresa é obrigatório')
    .max(255, 'Nome muito longo (máximo 255 caracteres)'),

  agentName: z.string()
    .min(1, 'Nome do agente é obrigatório')
    .max(255, 'Nome muito longo (máximo 255 caracteres)'),

  openingTime: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, 'Formato inválido (HH:MM)'),

  closingTime: z.string()
    .regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, 'Formato inválido (HH:MM)'),

  maxConcurrentCapacity: z.number()
    .int('Deve ser um número inteiro')
    .min(1, 'Mínimo de 1 atendimento')
    .max(20, 'Máximo de 20 atendimentos'),

  reminderD1Active: z.boolean(),
  reminderH12Active: z.boolean(),
  reminderH4Active: z.boolean(),
  reminderH1Active: z.boolean(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const companyId = 1 // TODO: Pegar do contexto de autenticação

  // Buscar settings
  const { data: settings, isLoading, error } = useQuery<CompanySettings>({
    queryKey: ['settings', companyId],
    queryFn: () => settingsApi.get(companyId),
    retry: 1,
  })

  // Form com react-hook-form + zod
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: '',
      agentName: '',
      openingTime: '08:00',
      closingTime: '18:00',
      maxConcurrentCapacity: 2,
      reminderD1Active: true,
      reminderH12Active: true,
      reminderH4Active: true,
      reminderH1Active: true,
    },
  })

  // Atualizar form quando settings carregarem
  useEffect(() => {
    if (settings) {
      reset({
        companyName: settings.companyName,
        agentName: settings.agentName,
        openingTime: settings.openingTime.substring(0, 5), // Remove segundos
        closingTime: settings.closingTime.substring(0, 5),
        maxConcurrentCapacity: settings.maxConcurrentCapacity,
        reminderD1Active: settings.reminders.d1Active,
        reminderH12Active: settings.reminders.h12Active,
        reminderH4Active: settings.reminders.h4Active,
        reminderH1Active: settings.reminders.h1Active,
      })
    }
  }, [settings, reset])

  // Mutation para salvar
  const mutation = useMutation({
    mutationFn: (data: SettingsUpdateData) => settingsApi.update(companyId, data),
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(['settings', companyId], updatedSettings)
      toast.success('Configurações salvas com sucesso!')
      reset({
        companyName: updatedSettings.companyName,
        agentName: updatedSettings.agentName,
        openingTime: updatedSettings.openingTime.substring(0, 5),
        closingTime: updatedSettings.closingTime.substring(0, 5),
        maxConcurrentCapacity: updatedSettings.maxConcurrentCapacity,
        reminderD1Active: updatedSettings.reminders.d1Active,
        reminderH12Active: updatedSettings.reminders.h12Active,
        reminderH4Active: updatedSettings.reminders.h4Active,
        reminderH1Active: updatedSettings.reminders.h1Active,
      })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Erro ao salvar configurações'
      toast.error(errorMessage)
      console.error('Error saving settings:', error)
    },
  })

  // Submit handler
  const onSubmit = (data: SettingsFormData) => {
    const updateData: SettingsUpdateData = {
      company_name: data.companyName,
      agent_name: data.agentName,
      opening_time: data.openingTime,
      closing_time: data.closingTime,
      max_concurrent_capacity: data.maxConcurrentCapacity,
      reminder_d1_active: data.reminderD1Active,
      reminder_12h_active: data.reminderH12Active,
      reminder_4h_active: data.reminderH4Active,
      reminder_1h_active: data.reminderH1Active,
    }

    mutation.mutate(updateData)
  }

  // Handler para cancelar (reset para valores salvos)
  const handleCancel = () => {
    if (settings) {
      reset({
        companyName: settings.companyName,
        agentName: settings.agentName,
        openingTime: settings.openingTime.substring(0, 5),
        closingTime: settings.closingTime.substring(0, 5),
        maxConcurrentCapacity: settings.maxConcurrentCapacity,
        reminderD1Active: settings.reminders.d1Active,
        reminderH12Active: settings.reminders.h12Active,
        reminderH4Active: settings.reminders.h4Active,
        reminderH1Active: settings.reminders.h1Active,
      })
      toast.success('Alterações descartadas')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-gray-500">Gerencie as configurações do sistema</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <p className="text-lg font-semibold">Erro ao carregar configurações</p>
              <p className="text-sm mt-2">Tente novamente mais tarde</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-gray-500">Gerencie as configurações do sistema</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
        {/* Informações da Empresa */}
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
              <Label htmlFor="company-name">
                Nome da Empresa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company-name"
                {...register('companyName')}
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500">{errors.companyName.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="agent-name">
                Nome do Agente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="agent-name"
                {...register('agentName')}
                className={errors.agentName ? 'border-red-500' : ''}
              />
              {errors.agentName && (
                <p className="text-sm text-red-500">{errors.agentName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="opening-time">
                  Horário de Abertura <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="opening-time"
                  type="time"
                  {...register('openingTime')}
                  className={errors.openingTime ? 'border-red-500' : ''}
                />
                {errors.openingTime && (
                  <p className="text-sm text-red-500">{errors.openingTime.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="closing-time">
                  Horário de Fechamento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="closing-time"
                  type="time"
                  {...register('closingTime')}
                  className={errors.closingTime ? 'border-red-500' : ''}
                />
                {errors.closingTime && (
                  <p className="text-sm text-red-500">{errors.closingTime.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lembretes Automáticos */}
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
              {/* Lembrete D-1 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembrete D-1</p>
                  <p className="text-sm text-gray-500">24 horas antes do agendamento</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('reminderD1Active')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className={`text-sm ${watch('reminderD1Active') ? 'text-green-600' : 'text-gray-400'}`}>
                    {watch('reminderD1Active') ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <Separator />

              {/* Lembrete 12h */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembrete 12h</p>
                  <p className="text-sm text-gray-500">12 horas antes do agendamento</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('reminderH12Active')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className={`text-sm ${watch('reminderH12Active') ? 'text-green-600' : 'text-gray-400'}`}>
                    {watch('reminderH12Active') ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <Separator />

              {/* Lembrete 4h */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembrete 4h</p>
                  <p className="text-sm text-gray-500">4 horas antes do agendamento</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('reminderH4Active')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className={`text-sm ${watch('reminderH4Active') ? 'text-green-600' : 'text-gray-400'}`}>
                    {watch('reminderH4Active') ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <Separator />

              {/* Lembrete 1h */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembrete 1h</p>
                  <p className="text-sm text-gray-500">1 hora antes do agendamento</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('reminderH1Active')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className={`text-sm ${watch('reminderH1Active') ? 'text-green-600' : 'text-gray-400'}`}>
                    {watch('reminderH1Active') ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacidade de Atendimento */}
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
              <Label htmlFor="capacity">
                Capacidade Máxima Simultânea <span className="text-red-500">*</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="20"
                {...register('maxConcurrentCapacity', { valueAsNumber: true })}
                className={errors.maxConcurrentCapacity ? 'border-red-500' : ''}
              />
              {errors.maxConcurrentCapacity && (
                <p className="text-sm text-red-500">{errors.maxConcurrentCapacity.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Número máximo de agendamentos que podem ocorrer ao mesmo tempo (1-20)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Personalização */}
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
                <Button variant="outline" className="flex-1" type="button">
                  Claro
                </Button>
                <Button variant="outline" className="flex-1" disabled type="button">
                  Escuro (Em breve)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={!isDirty || mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
