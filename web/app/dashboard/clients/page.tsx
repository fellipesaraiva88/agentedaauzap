'use client'

import { useQuery } from '@tanstack/react-query'
import { appointmentsApi, type Appointment } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Users, Dog, DollarSign } from 'lucide-react'

interface ClientData {
  tutorNome: string
  tutorTelefone?: string
  totalAgendamentos: number
  pets: Set<string>
  valorTotal: number
  ultimoAgendamento: string
}

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.list(),
  })

  const clientsMap = new Map<string, ClientData>()

  appointmentsData?.data.forEach((appointment: Appointment) => {
    const existing = clientsMap.get(appointment.tutorNome) || {
      tutorNome: appointment.tutorNome,
      tutorTelefone: appointment.tutorTelefone,
      totalAgendamentos: 0,
      pets: new Set<string>(),
      valorTotal: 0,
      ultimoAgendamento: appointment.dataAgendamento,
    }

    existing.totalAgendamentos += 1
    existing.pets.add(appointment.petNome)
    existing.valorTotal += appointment.preco
    if (appointment.dataAgendamento > existing.ultimoAgendamento) {
      existing.ultimoAgendamento = appointment.dataAgendamento
    }

    clientsMap.set(appointment.tutorNome, existing)
  })

  const clients = Array.from(clientsMap.values()).filter((client) =>
    client.tutorNome.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalClientes = clients.length
  const totalPets = clients.reduce((acc, client) => acc + client.pets.size, 0)
  const receitaTotal = clients.reduce((acc, client) => acc + client.valorTotal, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-gray-500">CRM e gestão de clientes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientes}</div>
            <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pets</CardTitle>
            <Dog className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPets}</div>
            <p className="text-xs text-muted-foreground">Pets cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(receitaTotal)}</div>
            <p className="text-xs text-muted-foreground">Todos os agendamentos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>Gerencie os clientes e seus pets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Pets</TableHead>
                  <TableHead>Agendamentos</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Último Agendamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Nenhum cliente encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.tutorNome}>
                      <TableCell className="font-medium">{client.tutorNome}</TableCell>
                      <TableCell>{client.tutorTelefone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {Array.from(client.pets).map((pet) => (
                            <Badge key={pet} variant="outline">
                              {pet}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{client.totalAgendamentos}</TableCell>
                      <TableCell>{formatCurrency(client.valorTotal)}</TableCell>
                      <TableCell>{new Date(client.ultimoAgendamento).toLocaleDateString('pt-BR')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Mostrando {clients.length} cliente(s)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
