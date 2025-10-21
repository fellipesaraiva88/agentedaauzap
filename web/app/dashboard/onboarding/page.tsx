'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressStepper } from '@/components/onboarding/ProgressStepper'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { onboardingService, type OnboardingProgress } from '@/services/onboarding.service'
import { Loader2, ArrowRight, ArrowLeft, AlertCircle, Save } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// Step Components
import { WelcomeStep } from '@/components/onboarding/steps/WelcomeStep'
import { BusinessInfoStep } from '@/components/onboarding/steps/BusinessInfoStep'
import { DifferentiationStep } from '@/components/onboarding/steps/DifferentiationStep'
import { ProductsServicesStep } from '@/components/onboarding/steps/ProductsServicesStep'
import { AIPersonalityStep } from '@/components/onboarding/steps/AIPersonalityStep'
import { BipeConfigStep } from '@/components/onboarding/steps/BipeConfigStep'
import { AuroraConfigStep } from '@/components/onboarding/steps/AuroraConfigStep'
import { WhatsAppStepModern } from '@/components/onboarding/steps/WhatsAppStepModern'
import { ReviewStep } from '@/components/onboarding/steps/ReviewStep'

const STEPS = [
  { number: 1, title: 'Bem-vindo' },
  { number: 2, title: 'Negócio' },
  { number: 3, title: 'Diferencial' },
  { number: 4, title: 'Serviços' },
  { number: 5, title: 'IA' },
  { number: 6, title: 'BIPE' },
  { number: 7, title: 'Aurora' },
  { number: 8, title: 'WhatsApp' },
  { number: 9, title: 'Revisar' }
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)

  // Load progress on mount
  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      setLoading(true)
      const data = await onboardingService.getProgress()
      setProgress(data)
      setCurrentStep(data.currentStep)
    } catch (error) {
      console.error('Failed to load onboarding progress:', error)
      toast.error('Erro ao carregar progresso')
      // Em caso de erro, iniciar do zero
      setProgress({
        currentStep: 1,
        completed: false,
        data: {}
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNext = useCallback(async () => {
    if (currentStep < STEPS.length) {
      try {
        setSaving(true)
        const updatedProgress = await onboardingService.goToNextStep(currentStep)
        setProgress(updatedProgress)
        setCurrentStep(updatedProgress.currentStep)
      } catch (error) {
        console.error('Failed to advance step:', error)
        toast.error('Erro ao avançar')
      } finally {
        setSaving(false)
      }
    }
  }, [currentStep])

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleComplete = async () => {
    try {
      setSaving(true)
      await onboardingService.complete()
      toast.success('Onboarding concluído com sucesso! 🎉')
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      toast.error('Erro ao concluir onboarding')
    } finally {
      setSaving(false)
    }
  }

  const renderStep = () => {
    const stepProps = {
      onNext: handleNext,
      onPrevious: handlePrevious,
      data: progress?.data || {}
    }

    switch (currentStep) {
      case 1: return <WelcomeStep {...stepProps} />
      case 2: return <BusinessInfoStep {...stepProps} />
      case 3: return <DifferentiationStep {...stepProps} />
      case 4: return <ProductsServicesStep {...stepProps} />
      case 5: return <AIPersonalityStep {...stepProps} />
      case 6: return <BipeConfigStep {...stepProps} />
      case 7: return <AuroraConfigStep {...stepProps} />
      case 8: return <WhatsAppStepModern {...stepProps} />
      case 9: return <ReviewStep {...stepProps} onComplete={handleComplete} />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configure seu Agente IA
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Passo {currentStep} de {STEPS.length}
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="mb-8">
          <ProgressStepper steps={STEPS} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <Card className="p-6 shadow-xl">
          {renderStep()}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <Button
            onClick={() => setShowExitDialog(true)}
            variant="ghost"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar e Sair
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Concluir
            </Button>
          )}
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar e Sair?</AlertDialogTitle>
            <AlertDialogDescription>
              Seu progresso será salvo e você poderá continuar depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => router.push('/dashboard')}>
              Salvar e Sair
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
