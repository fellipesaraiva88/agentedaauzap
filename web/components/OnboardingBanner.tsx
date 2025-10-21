'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Body, Heading } from './ui/typography'
import { Progress } from './ui/progress'
import { CheckCircle2, Circle, X, Rocket } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface OnboardingStep {
  id: string
  title: string
  description: string
  href: string
  completed: boolean
}

export function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'whatsapp',
      title: 'Conectar WhatsApp',
      description: 'Configure sua conta para automatizar atendimentos',
      href: '/dashboard/settings/whatsapp',
      completed: false,
    },
    {
      id: 'services',
      title: 'Configurar Serviços',
      description: 'Adicione os serviços e preços do seu pet shop',
      href: '/dashboard/services',
      completed: false,
    },
    {
      id: 'business-hours',
      title: 'Horário de Funcionamento',
      description: 'Defina quando seu estabelecimento atende',
      href: '/dashboard/settings',
      completed: false,
    },
  ])

  // Load completion state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('onboarding-progress')
    if (saved) {
      try {
        const savedSteps = JSON.parse(saved)
        setSteps(savedSteps)
      } catch (e) {
        console.error('Failed to load onboarding progress', e)
      }
    }

    const dismissed = localStorage.getItem('onboarding-dismissed')
    if (dismissed === 'true') {
      setDismissed(true)
    }
  }, [])

  const completedCount = steps.filter(s => s.completed).length
  const progress = (completedCount / steps.length) * 100
  const isComplete = completedCount === steps.length

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('onboarding-dismissed', 'true')
  }

  // Don't show if dismissed or complete
  if (dismissed || isComplete) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-50/50 to-pink-50/50 dark:from-primary/10 dark:via-purple-950/50 dark:to-pink-950/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Rocket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Heading size="sm">Bem-vindo ao Agente Pet Shop! 🎉</Heading>
                    <Body variant="muted" size="sm">
                      Complete a configuração inicial para começar ({completedCount}/{steps.length})
                    </Body>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Steps */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {steps.map((step) => (
                    <Link
                      key={step.id}
                      href={step.href}
                      className="block rounded-lg border border-border/50 bg-background/50 p-3 transition-all hover:border-primary/50 hover:bg-background hover:shadow-md"
                    >
                      <div className="flex items-start gap-2">
                        {step.completed ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0 flex-1">
                          <Body
                            weight="semibold"
                            size="sm"
                            className={step.completed ? 'line-through opacity-60' : ''}
                          >
                            {step.title}
                          </Body>
                          <Body
                            variant="muted"
                            size="sm"
                            className="mt-0.5 truncate"
                          >
                            {step.description}
                          </Body>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Dismiss Button */}
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
