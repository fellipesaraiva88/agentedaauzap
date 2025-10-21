'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, ArrowRight } from 'lucide-react'

export interface JourneyTracking {
  estagio_atual?: 'descoberta' | 'interesse' | 'consideracao' | 'decisao' | 'pos_venda' | 'fidelizado' | 'churn_risk'
  estagio_anterior?: string
  proximo_estagio_esperado?: string
  acao_recomendada?: string
  pronto_avancar: boolean
}

interface JourneyStageIndicatorProps {
  journey: JourneyTracking
}

const stages = [
  { id: 'descoberta', label: 'Descoberta', color: 'bg-gray-200' },
  { id: 'interesse', label: 'Interesse', color: 'bg-blue-200' },
  { id: 'consideracao', label: 'Consideração', color: 'bg-purple-200' },
  { id: 'decisao', label: 'Decisão', color: 'bg-orange-200' },
  { id: 'pos_venda', label: 'Pós-Venda', color: 'bg-green-200' },
  { id: 'fidelizado', label: 'Fidelizado', color: 'bg-emerald-200' },
] as const

const stageColors = {
  descoberta: 'bg-gray-100 text-gray-800 border-gray-300',
  interesse: 'bg-blue-100 text-blue-800 border-blue-300',
  consideracao: 'bg-purple-100 text-purple-800 border-purple-300',
  decisao: 'bg-orange-100 text-orange-800 border-orange-300',
  pos_venda: 'bg-green-100 text-green-800 border-green-300',
  fidelizado: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  churn_risk: 'bg-red-100 text-red-800 border-red-300',
}

export function JourneyStageIndicator({ journey }: JourneyStageIndicatorProps) {
  const currentStageIndex = stages.findIndex(s => s.id === journey.estagio_atual)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Jornada do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visual Journey Path */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {stages.map((stage, index) => {
            const isActive = stage.id === journey.estagio_atual
            const isPast = currentStageIndex > -1 && index < currentStageIndex
            const isFuture = currentStageIndex > -1 && index > currentStageIndex

            return (
              <div key={stage.id} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? `${stage.color} border-2 border-blue-600 scale-105`
                      : isPast
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  {stage.label}
                </div>
                {index < stages.length - 1 && (
                  <ArrowRight className={`h-4 w-4 ${isPast ? 'text-gray-400' : 'text-gray-300'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Churn Risk Warning */}
        {journey.estagio_atual === 'churn_risk' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-semibold text-red-800">
              ⚠️ Cliente em risco de abandono
            </p>
          </div>
        )}

        {/* Current Stage */}
        {journey.estagio_atual && journey.estagio_atual !== 'churn_risk' && (
          <div>
            <p className="text-sm font-medium mb-2">Estágio Atual</p>
            <Badge className={stageColors[journey.estagio_atual]}>
              {stages.find(s => s.id === journey.estagio_atual)?.label || journey.estagio_atual}
            </Badge>
          </div>
        )}

        {/* Next Steps */}
        {journey.proximo_estagio_esperado && (
          <div>
            <p className="text-sm font-medium mb-2">Próximo Estágio Esperado</p>
            <p className="text-sm text-muted-foreground">{journey.proximo_estagio_esperado}</p>
          </div>
        )}

        {/* Recommended Action */}
        {journey.acao_recomendada && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs font-medium text-blue-800 mb-1">Ação Recomendada pela IA:</p>
            <p className="text-sm text-blue-900">{journey.acao_recomendada}</p>
          </div>
        )}

        {/* Ready to Advance */}
        {journey.pronto_avancar && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
            <span className="font-medium">Cliente pronto para avançar</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
