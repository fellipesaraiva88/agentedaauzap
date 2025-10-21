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
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'

interface PageProps {
  params: Promise<{ clientId: string }>
}

export default function EditClientPage({ params }: PageProps) {
  const { clientId: id } = use(params)
  const router = useRouter()
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    data_nascimento: '',
    genero: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    is_vip: false,
    is_inativo: false,
    observacoes: '',
    notas_internas: '',
    como_conheceu: '',
    aceita_marketing: true
  })

  // Fetch tutor
  const { data: tutorData, isLoading } = useQuery({
    queryKey: ['tutor', id],
    queryFn: async () => {
      const response = await api.get(`/tutors/${id}`)
      return response.data
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch(`/tutors/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Cliente atualizado com sucesso!')
      router.push(`/dashboard/clients/${id}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar cliente')
    }
  })

  useEffect(() => {
    if (tutorData?.data) {
      const tutor = tutorData.data
      setFormData({
        nome: tutor.nome || '',
        telefone: tutor.telefone || '',
        email: tutor.email || '',
        cpf: tutor.cpf || '',
        data_nascimento: tutor.data_nascimento ? new Date(tutor.data_nascimento).toISOString().split('T')[0] : '',
        genero: tutor.genero || '',
        endereco: tutor.endereco || '',
        bairro: tutor.bairro || '',
        cidade: tutor.cidade || '',
        estado: tutor.estado || '',
        cep: tutor.cep || '',
        is_vip: tutor.is_vip || false,
        is_inativo: tutor.is_inativo || false,
        observacoes: tutor.observacoes || '',
        notas_internas: tutor.notas_internas || '',
        como_conheceu: tutor.como_conheceu || '',
        aceita_marketing: tutor.aceita_marketing ?? true
      })
      setTags(tutor.tags || [])
    }
  }, [tutorData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      ...formData,
      tags,
      data_nascimento: formData.data_nascimento || undefined
    }

    updateMutation.mutate(payload)
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Cliente</h1>
          <p className="text-muted-foreground">Atualize as informações do cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genero">Gênero</Label>
                  <Input
                    id="genero"
                    value={formData.genero}
                    onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
                    placeholder="Ex: Masculino, Feminino"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="como_conheceu">Como nos conheceu?</Label>
                  <Input
                    id="como_conheceu"
                    value={formData.como_conheceu}
                    onChange={(e) => setFormData({ ...formData, como_conheceu: e.target.value })}
                    placeholder="Ex: Instagram, Indicação"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="endereco">Logradouro</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    placeholder="Rua, Av, etc"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Adicionar tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button type="button" onClick={addTag}>
                  Adicionar
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      {tag}
                      <X
                        className="h-3 w-3 ml-2"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (Visível para o cliente)</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas_internas">Notas Internas (Privado)</Label>
                <Textarea
                  id="notas_internas"
                  value={formData.notas_internas}
                  onChange={(e) => setFormData({ ...formData, notas_internas: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_vip">Cliente VIP</Label>
                  <p className="text-sm text-muted-foreground">
                    Cliente com atendimento prioritário
                  </p>
                </div>
                <Switch
                  id="is_vip"
                  checked={formData.is_vip}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_vip: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_inativo">Cliente Inativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Marcar como inativo
                  </p>
                </div>
                <Switch
                  id="is_inativo"
                  checked={formData.is_inativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_inativo: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="aceita_marketing">Aceita Marketing</Label>
                  <p className="text-sm text-muted-foreground">
                    Pode receber campanhas de marketing
                  </p>
                </div>
                <Switch
                  id="aceita_marketing"
                  checked={formData.aceita_marketing}
                  onCheckedChange={(checked) => setFormData({ ...formData, aceita_marketing: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
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
