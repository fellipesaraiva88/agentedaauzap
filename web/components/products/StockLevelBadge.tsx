'use client'

import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface StockLevelBadgeProps {
  current: number
  minimum: number
}

export function StockLevelBadge({ current, minimum }: StockLevelBadgeProps) {
  if (current === 0) {
    return (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Sem estoque
      </Badge>
    )
  }

  if (current <= minimum) {
    return (
      <Badge className="bg-orange-100 text-orange-800">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Baixo
      </Badge>
    )
  }

  return (
    <Badge className="bg-green-100 text-green-800">
      <CheckCircle className="h-3 w-3 mr-1" />
      OK
    </Badge>
  )
}
