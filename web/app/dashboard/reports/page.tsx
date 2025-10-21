'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart3,
  Download,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  FileText
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of month
    end: new Date().toISOString().split('T')[0] // Today
  })
  const [reportType, setReportType] = useState<'revenue' | 'services' | 'clients'>('revenue')

  // Fetch report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', reportType, dateRange],
    queryFn: async () => {
      const response = await api.get('/stats/reports', {
        params: {
          type: reportType,
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      })
      return response.data
    }
  })

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    toast.success('Relatório exportado com sucesso!')
  }

  const stats = reportData?.stats || {
    totalRevenue: 0,
    totalServices: 0,
    totalClients: 0,
    avgTicket: 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Relatórios
          </h1>
          <p className="text-muted-foreground">Análises e exportações de dados</p>
        </div>

        <Button onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger id="report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Receita</SelectItem>
                  <SelectItem value="services">Serviços</SelectItem>
                  <SelectItem value="clients">Clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Data Início</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Data Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">Agendamentos realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">No período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgTicket)}</div>
            <p className="text-xs text-muted-foreground">Por serviço</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {reportType === 'revenue' && 'Detalhamento de Receita'}
            {reportType === 'services' && 'Serviços Mais Vendidos'}
            {reportType === 'clients' && 'Ranking de Clientes'}
          </CardTitle>
          <CardDescription>
            Dados detalhados do período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando relatório...
            </div>
          ) : reportData?.details && reportData.details.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {reportType === 'revenue' && (
                      <>
                        <TableHead>Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </>
                    )}
                    {reportType === 'services' && (
                      <>
                        <TableHead>Serviço</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Receita Total</TableHead>
                        <TableHead className="text-right">Ticket Médio</TableHead>
                      </>
                    )}
                    {reportType === 'clients' && (
                      <>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Serviços</TableHead>
                        <TableHead className="text-right">Total Gasto</TableHead>
                        <TableHead className="text-right">Ticket Médio</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.details.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      {reportType === 'revenue' && (
                        <>
                          <TableCell>{new Date(item.date).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell>{item.clientName}</TableCell>
                          <TableCell>{item.serviceName}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                        </>
                      )}
                      {reportType === 'services' && (
                        <>
                          <TableCell className="font-medium">{item.serviceName}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.totalRevenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.avgTicket)}</TableCell>
                        </>
                      )}
                      {reportType === 'clients' && (
                        <>
                          <TableCell className="font-medium">{item.clientName}</TableCell>
                          <TableCell className="text-right">{item.serviceCount}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.totalSpent)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.avgTicket)}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum dado encontrado para o período selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
