'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, Heart, TrendingUp, MessageSquare } from 'lucide-react'

export interface EmotionalContext {
  arquetipo?: string
  emocao_primaria?: string
  emocao_secundaria?: string
  intensidade_emocional?: number
  sentimento_predominante?: string
  tom_conversacao?: string
  engagement_level?: 'baixo' | 'medio' | 'alto' | 'muito_alto'
  engagement_score?: number
  sinais_compra?: string[]
}

interface EmotionalAnalysisCardProps {
  context: EmotionalContext
}

const engagementColors = {
  baixo: 'bg-red-100 text-red-800',
  medio: 'bg-yellow-100 text-yellow-800',
  alto: 'bg-green-100 text-green-800',
  muito_alto: 'bg-blue-100 text-blue-800'
}

const engagementLabels = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
  muito_alto: 'Muito Alto'
}

export function EmotionalAnalysisCard({ context }: EmotionalAnalysisCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Análise Emocional (IA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Arquétipo */}
        {context.arquetipo && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-pink-600" />
              <span className="text-sm font-medium">Arquétipo</span>
            </div>
            <Badge className="bg-pink-100 text-pink-800">
              {context.arquetipo}
            </Badge>
          </div>
        )}

        {/* Emoções */}
        {(context.emocao_primaria || context.emocao_secundaria) && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Emoções</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {context.emocao_primaria && (
                <Badge variant="outline">
                  Primária: {context.emocao_primaria}
                </Badge>
              )}
              {context.emocao_secundaria && (
                <Badge variant="outline">
                  Secundária: {context.emocao_secundaria}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Intensidade Emocional */}
        {context.intensidade_emocional !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Intensidade Emocional</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(context.intensidade_emocional * 100)}%
              </span>
            </div>
            <Progress value={context.intensidade_emocional * 100} />
          </div>
        )}

        {/* Sentimento e Tom */}
        {(context.sentimento_predominante || context.tom_conversacao) && (
          <div className="grid grid-cols-2 gap-3">
            {context.sentimento_predominante && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sentimento</p>
                <p className="text-sm font-medium">{context.sentimento_predominante}</p>
              </div>
            )}
            {context.tom_conversacao && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tom</p>
                <p className="text-sm font-medium">{context.tom_conversacao}</p>
              </div>
            )}
          </div>
        )}

        {/* Engagement */}
        {context.engagement_level && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Engajamento</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={engagementColors[context.engagement_level]}>
                {engagementLabels[context.engagement_level]}
              </Badge>
              {context.engagement_score !== undefined && (
                <span className="text-sm text-muted-foreground">
                  ({Math.round(context.engagement_score * 100)}%)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Sinais de Compra */}
        {context.sinais_compra && context.sinais_compra.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Sinais de Compra Identificados:</p>
            <div className="space-y-1">
              {context.sinais_compra.map((sinal, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                  <span>{sinal}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
