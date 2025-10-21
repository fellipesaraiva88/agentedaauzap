'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dog, Edit, Calendar, Heart } from 'lucide-react'
import Image from 'next/image'

export interface Pet {
  id: number
  nome: string
  tipo?: 'cao' | 'gato' | 'coelho' | 'ave' | 'outro'
  raca?: string
  idade?: number
  porte?: 'pequeno' | 'medio' | 'grande' | 'gigante'
  foto_url?: string
  temperamento?: string
  servicos_preferidos?: string[]
  proximo_banho?: string
}

interface PetCardProps {
  pet: Pet
  onEdit?: (id: number) => void
  compact?: boolean
}

const tipoIcons: Record<string, string> = {
  cao: '🐕',
  gato: '🐈',
  coelho: '🐰',
  ave: '🦜',
  outro: '🐾'
}

const porteLabels: Record<string, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
  gigante: 'Gigante'
}

export function PetCard({ pet, onEdit, compact = false }: PetCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Photo */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {pet.foto_url ? (
              <Image
                src={pet.foto_url}
                alt={pet.nome}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">
                {tipoIcons[pet.tipo || 'outro']}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-lg">{pet.nome}</h3>
                {pet.raca && (
                  <p className="text-sm text-muted-foreground">{pet.raca}</p>
                )}
              </div>
              {onEdit && !compact && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(pet.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-2">
              {pet.tipo && (
                <Badge variant="secondary">
                  {pet.tipo.charAt(0).toUpperCase() + pet.tipo.slice(1)}
                </Badge>
              )}
              {pet.porte && (
                <Badge variant="outline">
                  {porteLabels[pet.porte]}
                </Badge>
              )}
              {pet.idade && (
                <Badge variant="outline">
                  {pet.idade} {pet.idade === 1 ? 'ano' : 'anos'}
                </Badge>
              )}
            </div>

            {!compact && (
              <>
                {/* Temperamento */}
                {pet.temperamento && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Heart className="h-4 w-4" />
                    <span>{pet.temperamento}</span>
                  </div>
                )}

                {/* Próximo Banho */}
                {pet.proximo_banho && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>
                      Próximo banho: {new Date(pet.proximo_banho).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                {/* Serviços Preferidos */}
                {pet.servicos_preferidos && pet.servicos_preferidos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Serviços favoritos:</p>
                    <div className="flex flex-wrap gap-1">
                      {pet.servicos_preferidos.map((servico, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {servico}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
