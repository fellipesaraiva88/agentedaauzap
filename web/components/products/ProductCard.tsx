'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Package, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { StockLevelBadge } from './StockLevelBadge'
import Image from 'next/image'

export interface Product {
  id: number
  nome: string
  descricao?: string
  categoria?: string
  preco_venda: number
  preco_promocional?: number
  estoque_atual: number
  estoque_minimo: number
  ativo: boolean
  imagem_url?: string
}

interface ProductCardProps {
  product: Product
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const isLowStock = product.estoque_atual <= product.estoque_minimo
  const hasPromotion = product.preco_promocional && product.preco_promocional < product.preco_venda

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
            {product.imagem_url ? (
              <Image
                src={product.imagem_url}
                alt={product.nome}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg truncate">{product.nome}</CardTitle>
              <div className="flex gap-1 flex-shrink-0">
                {product.ativo ? (
                  <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                ) : (
                  <Badge variant="outline">Inativo</Badge>
                )}
              </div>
            </div>

            {product.categoria && (
              <Badge variant="secondary" className="mt-1">
                {product.categoria}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        {/* Description */}
        {product.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.descricao}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {hasPromotion ? (
            <>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(product.preco_promocional!)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.preco_venda)}
              </span>
              <Badge className="bg-red-100 text-red-800">Promoção</Badge>
            </>
          ) : (
            <span className="text-2xl font-bold">
              {formatCurrency(product.preco_venda)}
            </span>
          )}
        </div>

        {/* Stock */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Estoque:</span>
            <span className="font-semibold">{product.estoque_atual}</span>
            <StockLevelBadge
              current={product.estoque_atual}
              minimum={product.estoque_minimo}
            />
          </div>
        </div>

        {/* Low Stock Warning */}
        {isLowStock && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded text-orange-800 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Estoque baixo! Mínimo: {product.estoque_minimo}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(product.id)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(product.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
