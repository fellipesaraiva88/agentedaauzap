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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ImageUploader } from '@/components/products/ImageUploader'
import { ArrowLeft, Save } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'

interface PageProps {
  params: Promise<{ tutorId: string; id: string }>
}

export default function EditPetPage({ params }: PageProps) {
  const { tutorId, id } = use(params)
  const router = useRouter()

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'cao' as 'cao' | 'gato' | 'coelho' | 'ave' | 'outro',
    raca: '',
    idade: '',
    data_nascimento: '',
    porte: 'medio' as 'pequeno' | 'medio' | 'grande' | 'gigante',
    peso: '',
    sexo: '' as '' | 'macho' | 'femea',
    castrado: false,
    chip_numero: '',
    foto_url: '',
    temperamento: '',
    condicoes_saude: '',
    alergias: '',
    medicamentos: '',
    veterinario_nome: '',
    veterinario_telefone: '',
    observacoes: ''
  })

  // Fetch pet
  const { data: petData, isLoading } = useQuery({
    queryKey: ['pet', id],
    queryFn: async () => {
      const response = await api.get(`/tutors/${tutorId}/pets/${id}`)
      return response.data
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch(`/tutors/${tutorId}/pets/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Pet atualizado com sucesso!')
      router.push(`/dashboard/clients/${tutorId}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar pet')
    }
  })

  useEffect(() => {
    if (petData?.data) {
      const pet = petData.data
      setFormData({
        nome: pet.nome || '',
        tipo: pet.tipo || 'cao',
        raca: pet.raca || '',
        idade: pet.idade?.toString() || '',
        data_nascimento: pet.data_nascimento ? new Date(pet.data_nascimento).toISOString().split('T')[0] : '',
        porte: pet.porte || 'medio',
        peso: pet.peso?.toString() || '',
        sexo: pet.sexo || '',
        castrado: pet.castrado || false,
        chip_numero: pet.chip_numero || '',
        foto_url: pet.foto_url || '',
        temperamento: pet.temperamento || '',
        condicoes_saude: pet.condicoes_saude || '',
        alergias: pet.alergias || '',
        medicamentos: pet.medicamentos || '',
        veterinario_nome: pet.veterinario_nome || '',
        veterinario_telefone: pet.veterinario_telefone || '',
        observacoes: pet.observacoes || ''
      })
    }
  }, [petData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome) {
      toast.error('Nome do pet é obrigatório')
      return
    }

    const payload = {
      ...formData,
      idade: formData.idade ? parseInt(formData.idade) : undefined,
      peso: formData.peso ? parseFloat(formData.peso) : undefined,
      data_nascimento: formData.data_nascimento || undefined,
      sexo: formData.sexo || undefined
    }

    updateMutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Pet</h1>
          <p className="text-muted-foreground">Atualize as informações do pet</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do pet"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cao">Cão</SelectItem>
                      <SelectItem value="gato">Gato</SelectItem>
                      <SelectItem value="coelho">Coelho</SelectItem>
                      <SelectItem value="ave">Ave</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="raca">Raça</Label>
                  <Input
                    id="raca"
                    value={formData.raca}
                    onChange={(e) => setFormData({ ...formData, raca: e.target.value })}
                    placeholder="Ex: Golden Retriever"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="porte">Porte</Label>
                  <Select value={formData.porte} onValueChange={(value: any) => setFormData({ ...formData, porte: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pequeno">Pequeno</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="grande">Grande</SelectItem>
                      <SelectItem value="gigante">Gigante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select value={formData.sexo} onValueChange={(value: any) => setFormData({ ...formData, sexo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="macho">Macho</SelectItem>
                      <SelectItem value="femea">Fêmea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idade">Idade (anos)</Label>
                  <Input
                    id="idade"
                    type="number"
                    value={formData.idade}
                    onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peso">Peso (kg)</Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chip_numero">Nº Microchip</Label>
                  <Input
                    id="chip_numero"
                    value={formData.chip_numero}
                    onChange={(e) => setFormData({ ...formData, chip_numero: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="castrado">Pet castrado?</Label>
                <Switch
                  id="castrado"
                  checked={formData.castrado}
                  onCheckedChange={(checked) => setFormData({ ...formData, castrado: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Photo */}
          <Card>
            <CardHeader>
              <CardTitle>Foto do Pet</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                value={formData.foto_url}
                onChange={(url) => setFormData({ ...formData, foto_url: url })}
                onRemove={() => setFormData({ ...formData, foto_url: '' })}
              />
            </CardContent>
          </Card>

          {/* Health */}
          <Card>
            <CardHeader>
              <CardTitle>Saúde</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="temperamento">Temperamento</Label>
                <Input
                  id="temperamento"
                  value={formData.temperamento}
                  onChange={(e) => setFormData({ ...formData, temperamento: e.target.value })}
                  placeholder="Ex: Dócil, Agitado, Tímido"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condicoes_saude">Condições de Saúde</Label>
                <Textarea
                  id="condicoes_saude"
                  value={formData.condicoes_saude}
                  onChange={(e) => setFormData({ ...formData, condicoes_saude: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alergias">Alergias</Label>
                <Textarea
                  id="alergias"
                  value={formData.alergias}
                  onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicamentos">Medicamentos</Label>
                <Textarea
                  id="medicamentos"
                  value={formData.medicamentos}
                  onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vet */}
          <Card>
            <CardHeader>
              <CardTitle>Veterinário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="veterinario_nome">Nome do Veterinário</Label>
                  <Input
                    id="veterinario_nome"
                    value={formData.veterinario_nome}
                    onChange={(e) => setFormData({ ...formData, veterinario_nome: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="veterinario_telefone">Telefone</Label>
                  <Input
                    id="veterinario_telefone"
                    value={formData.veterinario_telefone}
                    onChange={(e) => setFormData({ ...formData, veterinario_telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                placeholder="Observações adicionais sobre o pet..."
              />
            </CardContent>
          </Card>

          {/* Actions */}
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
