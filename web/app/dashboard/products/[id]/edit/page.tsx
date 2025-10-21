'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tantml:query'
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
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    categoria: '',
    marca: '',
    preco_custo: '',
    preco_venda: '',
    preco_promocional: '',
    estoque_atual: '',
    estoque_minimo: '',
    estoque_maximo: '',
    unidade_medida: 'un',
    ativo: true,
    venda_online: true,
    destaque: false,
    imagem_url: ''
  })

  // Fetch product
  const { data: productData, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`)
      return response.data
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.patch(`/products/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      toast.success('Produto atualizado com sucesso!')
      router.push('/dashboard/products')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar produto')
    }
  })

  useEffect(() => {
    if (productData?.data) {
      const product = productData.data
      setFormData({
        codigo: product.codigo || '',
        nome: product.nome || '',
        descricao: product.descricao || '',
        categoria: product.categoria || '',
        marca: product.marca || '',
        preco_custo: product.preco_custo?.toString() || '',
        preco_venda: product.preco_venda?.toString() || '',
        preco_promocional: product.preco_promocional?.toString() || '',
        estoque_atual: product.estoque_atual?.toString() || '',
        estoque_minimo: product.estoque_minimo?.toString() || '',
        estoque_maximo: product.estoque_maximo?.toString() || '',
        unidade_medida: product.unidade_medida || 'un',
        ativo: product.ativo ?? true,
        venda_online: product.venda_online ?? true,
        destaque: product.destaque ?? false,
        imagem_url: product.imagem_url || ''
      })
    }
  }, [productData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome) {
      toast.error('Nome é obrigatório')
      return
    }

    if (!formData.preco_venda || parseFloat(formData.preco_venda) <= 0) {
      toast.error('Preço de venda é obrigatório')
      return
    }

    const payload = {
      ...formData,
      preco_custo: formData.preco_custo ? parseFloat(formData.preco_custo) : undefined,
      preco_venda: parseFloat(formData.preco_venda),
      preco_promocional: formData.preco_promocional ? parseFloat(formData.preco_promocional) : undefined,
      estoque_atual: formData.estoque_atual ? parseInt(formData.estoque_atual) : 0,
      estoque_minimo: formData.estoque_minimo ? parseInt(formData.estoque_minimo) : 0,
      estoque_maximo: formData.estoque_maximo ? parseInt(formData.estoque_maximo) : undefined,
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
          <h1 className="text-3xl font-bold">Editar Produto</h1>
          <p className="text-muted-foreground">Atualize as informações do produto</p>
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
                  <Label htmlFor="codigo">Código (SKU)</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: PROD001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do produto"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição detalhada do produto"
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
                    placeholder="Ex: Ração, Brinquedos"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Marca do produto"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Preços</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_custo">Preço de Custo</Label>
                  <Input
                    id="preco_custo"
                    type="number"
                    step="0.01"
                    value={formData.preco_custo}
                    onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco_venda">Preço de Venda *</Label>
                  <Input
                    id="preco_venda"
                    type="number"
                    step="0.01"
                    value={formData.preco_venda}
                    onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco_promocional">Preço Promocional</Label>
                  <Input
                    id="preco_promocional"
                    type="number"
                    step="0.01"
                    value={formData.preco_promocional}
                    onChange={(e) => setFormData({ ...formData, preco_promocional: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estoque_atual">Quantidade Atual</Label>
                  <Input
                    id="estoque_atual"
                    type="number"
                    value={formData.estoque_atual}
                    onChange={(e) => setFormData({ ...formData, estoque_atual: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                  <Input
                    id="estoque_minimo"
                    type="number"
                    value={formData.estoque_minimo}
                    onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estoque_maximo">Estoque Máximo</Label>
                  <Input
                    id="estoque_maximo"
                    type="number"
                    value={formData.estoque_maximo}
                    onChange={(e) => setFormData({ ...formData, estoque_maximo: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidade_medida">Unidade</Label>
                  <Select
                    value={formData.unidade_medida}
                    onValueChange={(value) => setFormData({ ...formData, unidade_medida: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">Unidade</SelectItem>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="g">Gramas</SelectItem>
                      <SelectItem value="l">Litros</SelectItem>
                      <SelectItem value="ml">ML</SelectItem>
                      <SelectItem value="cx">Caixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image */}
          <Card>
            <CardHeader>
              <CardTitle>Imagem do Produto</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUploader
                value={formData.imagem_url}
                onChange={(url) => setFormData({ ...formData, imagem_url: url })}
                onRemove={() => setFormData({ ...formData, imagem_url: '' })}
              />
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
                  <Label htmlFor="ativo">Produto Ativo</Label>
                  <p className="text-sm text-muted-foreground">Disponível para venda</p>
                </div>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="venda_online">Venda Online</Label>
                  <p className="text-sm text-muted-foreground">Disponível para venda online</p>
                </div>
                <Switch
                  id="venda_online"
                  checked={formData.venda_online}
                  onCheckedChange={(checked) => setFormData({ ...formData, venda_online: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="destaque">Produto em Destaque</Label>
                  <p className="text-sm text-muted-foreground">Será exibido em destaque</p>
                </div>
                <Switch
                  id="destaque"
                  checked={formData.destaque}
                  onCheckedChange={(checked) => setFormData({ ...formData, destaque: checked })}
                />
              </div>
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
