'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { appointmentsApi, servicesApi, type Appointment, type Service } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Plus, Calendar, Filter } from 'lucide-react'
import { formatDate, formatTime, getStatusColor, getStatusLabel, formatCurrency } from '@/lib/utils'
import { AppointmentActions } from '@/components/appointments/appointment-actions'
import { NewAppointmentDialog } from '@/components/appointments/new-appointment-dialog'

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false)

  const { data: appointmentsData, refetch } = useQuery({
    queryKey: ['appointments', statusFilter, serviceFilter],
    queryFn: () =>
      appointmentsApi.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
        serviceId: serviceFilter === 'all' ? undefined : Number(serviceFilter),
      }),
  })

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.list(),
  })

  const filteredAppointments = appointmentsData?.data.filter((appointment: Appointment) => {
    const matchesSearch =
      appointment.petNome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.tutorNome.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-gray-500">Gerencie todos os agendamentos</p>
        </div>
        <Button onClick={() => setIsNewDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Agendamentos</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Filtros</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Buscar por pet ou tutor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="nao_compareceu">Não Compareceu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
                {servicesData?.data.map((service: Service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pet</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhum agendamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments?.map((appointment: Appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.petNome}</TableCell>
                      <TableCell>{appointment.tutorNome}</TableCell>
                      <TableCell>{appointment.serviceName}</TableCell>
                      <TableCell>{formatDate(appointment.dataAgendamento)}</TableCell>
                      <TableCell>{formatTime(appointment.horaAgendamento)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(appointment.status)} variant="outline">
                          {getStatusLabel(appointment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(appointment.preco)}</TableCell>
                      <TableCell className="text-right">
                        <AppointmentActions appointment={appointment} onUpdate={refetch} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Mostrando {filteredAppointments?.length || 0} de {appointmentsData?.total || 0}{' '}
            agendamentos
          </div>
        </CardContent>
      </Card>

      <NewAppointmentDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onSuccess={refetch}
      />
    </div>
  )
}
