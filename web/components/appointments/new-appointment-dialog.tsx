'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { appointmentsApi, servicesApi, type Service } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface NewAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function NewAppointmentDialog({ open, onOpenChange, onSuccess }: NewAppointmentDialogProps) {
  const [formData, setFormData] = useState({
    chatId: '',
    tutorNome: '',
    tutorTelefone: '',
    petNome: '',
    petTipo: 'cachorro',
    petPorte: 'medio' as 'pequeno' | 'medio' | 'grande',
    serviceId: '',
    dataAgendamento: '',
    horaAgendamento: '',
    observacoes: '',
  })

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      appointmentsApi.create({
        tutorNome: formData.tutorNome,
        tutorTelefone: formData.tutorTelefone,
        petNome: formData.petNome,
        serviceId: Number(formData.serviceId),
        dataAgendamento: formData.dataAgendamento,
        horaAgendamento: formData.horaAgendamento,
        observacoes: formData.observacoes || undefined,
      } as any),
    onSuccess: () => {
      onSuccess()
      onOpenChange(false)
      setFormData({
        chatId: '',
        tutorNome: '',
        tutorTelefone: '',
        petNome: '',
        petTipo: 'cachorro',
        petPorte: 'medio',
        serviceId: '',
        dataAgendamento: '',
        horaAgendamento: '',
        observacoes: '',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate()
  }

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>Preencha os dados para criar um novo agendamento</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Tutor Info */}
            <div className="grid gap-2">
              <Label htmlFor="tutorNome">Nome do Tutor *</Label>
              <Input
                id="tutorNome"
                value={formData.tutorNome}
                onChange={(e) => updateField('tutorNome', e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tutorTelefone">Telefone</Label>
              <Input
                id="tutorTelefone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.tutorTelefone}
                onChange={(e) => updateField('tutorTelefone', e.target.value)}
              />
            </div>

            {/* Pet Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="petNome">Nome do Pet *</Label>
                <Input
                  id="petNome"
                  value={formData.petNome}
                  onChange={(e) => updateField('petNome', e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="petTipo">Tipo *</Label>
                <Select value={formData.petTipo} onValueChange={(value) => updateField('petTipo', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cachorro">Cachorro</SelectItem>
                    <SelectItem value="gato">Gato</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="petPorte">Porte *</Label>
              <Select
                value={formData.petPorte}
                onValueChange={(value: 'pequeno' | 'medio' | 'grande') => updateField('petPorte', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pequeno">Pequeno (até 10kg)</SelectItem>
                  <SelectItem value="medio">Médio (10-25kg)</SelectItem>
                  <SelectItem value="grande">Grande (acima de 25kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Service */}
            <div className="grid gap-2">
              <Label htmlFor="serviceId">Serviço *</Label>
              <Select value={formData.serviceId} onValueChange={(value) => updateField('serviceId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicesData?.data.map((service: Service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.nome} - R${' '}
                      {service.precos[formData.petPorte as 'pequeno' | 'medio' | 'grande']?.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dataAgendamento">Data *</Label>
                <Input
                  id="dataAgendamento"
                  type="date"
                  value={formData.dataAgendamento}
                  onChange={(e) => updateField('dataAgendamento', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="horaAgendamento">Horário *</Label>
                <Input
                  id="horaAgendamento"
                  type="time"
                  value={formData.horaAgendamento}
                  onChange={(e) => updateField('horaAgendamento', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Observations */}
            <div className="grid gap-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                placeholder="Informações adicionais..."
                value={formData.observacoes}
                onChange={(e) => updateField('observacoes', e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar Agendamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
