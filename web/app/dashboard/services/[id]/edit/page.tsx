'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditServicePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    duracaoMinutos: '',
    ativo: true,
    precos: {
      pequeno: '',
      medio: '',
      grande: '',
      gigante: ''
    }
  })

  // Fetch service
  const { data: serviceData, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const response = await api.get(`/services/${id}`)
      return response.data
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch(`/services/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Serviço atualizado com sucesso!')
      router.push('/dashboard/services')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar serviço')
    }
  })

  useEffect(() => {
    if (serviceData?.data) {
      const service = serviceData.data
      setFormData({
        nome: service.nome || '',
        descricao: service.descricao || '',
        categoria: service.categoria || '',
        duracaoMinutos: service.duracaoMinutos?.toString() || '',
        ativo: service.ativo ?? true,
        precos: {
          pequeno: service.precos?.pequeno?.toString() || '',
          medio: service.precos?.medio?.toString() || '',
          grande: service.precos?.grande?.toString() || '',
          gigante: service.precos?.gigante?.toString() || ''
        }
      })
    }
  }, [serviceData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome) {
      toast.error('Nome do serviço é obrigatório')
      return
    }

    if (!formData.duracaoMinutos || parseInt(formData.duracaoMinutos) <= 0) {
      toast.error('Duração é obrigatória')
      return
    }

    const payload = {
      nome: formData.nome,
      descricao: formData.descricao || undefined,
      categoria: formData.categoria || undefined,
      duracaoMinutos: parseInt(formData.duracaoMinutos),
      ativo: formData.ativo,
      precos: {
        pequeno: formData.precos.pequeno ? parseFloat(formData.precos.pequeno) : undefined,
        medio: formData.precos.medio ? parseFloat(formData.precos.medio) : undefined,
        grande: formData.precos.grande ? parseFloat(formData.precos.grande) : undefined,
        gigante: formData.precos.gigante ? parseFloat(formData.precos.gigante) : undefined
      }
    }

    const temPreco = Object.values(payload.precos).some(p => p !== undefined)
    if (!temPreco) {
      toast.error('Defina ao menos um preço')
      return
    }

    updateMutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Serviço</h1>
          <p className="text-muted-foreground">Atualize as informações do serviço</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Serviço *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Banho e Tosa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do serviço..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Estética, Saúde"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duracaoMinutos">Duração (minutos) *</Label>
                  <Input
                    id="duracaoMinutos"
                    type="number"
                    value={formData.duracaoMinutos}
                    onChange={(e) => setFormData({ ...formData, duracaoMinutos: e.target.value })}
                    placeholder="60"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preços por Porte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Defina os preços para cada porte de animal. Deixe em branco os portes que não se aplicam.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_pequeno">Porte Pequeno (R$)</Label>
                  <Input
                    id="preco_pequeno"
                    type="number"
                    step="0.01"
                    value={formData.precos.pequeno}
                    onChange={(e) => setFormData({
                      ...formData,
                      precos: { ...formData.precos, pequeno: e.target.value }
                    })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco_medio">Porte Médio (R$)</Label>
                  <Input
                    id="preco_medio"
                    type="number"
                    step="0.01"
                    value={formData.precos.medio}
                    onChange={(e) => setFormData({
                      ...formData,
                      precos: { ...formData.precos, medio: e.target.value }
                    })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco_grande">Porte Grande (R$)</Label>
                  <Input
                    id="preco_grande"
                    type="number"
                    step="0.01"
                    value={formData.precos.grande}
                    onChange={(e) => setFormData({
                      ...formData,
                      precos: { ...formData.precos, grande: e.target.value }
                    })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco_gigante">Porte Gigante (R$)</Label>
                  <Input
                    id="preco_gigante"
                    type="number"
                    step="0.01"
                    value={formData.precos.gigante}
                    onChange={(e) => setFormData({
                      ...formData,
                      precos: { ...formData.precos, gigante: e.target.value }
                    })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ativo">Serviço Ativo</Label>
                  <p className="text-sm text-muted-foreground">Disponível para agendamento</p>
                </div>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
