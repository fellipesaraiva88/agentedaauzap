'use client'

import { Dialog, DialogContent } from './ui/dialog'
import { Button } from './ui/button'
import { Display, Heading, Body } from './ui/typography'
import { Sparkles, Rocket, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

interface CelebrationModalProps {
  open: boolean
  onClose: () => void
  onStartTour?: () => void
}

export function CelebrationModal({ open, onClose, onStartTour }: CelebrationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-50/50 to-pink-50/50 dark:from-primary/10 dark:via-purple-950/50 dark:to-pink-950/50">
        <div className="space-y-6 p-6">
          {/* Animated Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-2xl">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-full bg-primary/20"
              />
            </div>
          </motion.div>

          {/* Title */}
          <div className="space-y-2 text-center">
            <Display variant="gradient" className="text-4xl">
              🎉 Bem-vindo ao Futuro!
            </Display>
            <Heading size="default" variant="muted">
              Seu Assistente de IA Está Pronto
            </Heading>
          </div>

          {/* Features Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <Heading size="sm" className="mb-1">
                Automação Total
              </Heading>
              <Body variant="muted" size="sm">
                IA atende clientes 24/7, mesmo quando você está dormindo
              </Body>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <Heading size="sm" className="mb-1">
                Agendamentos Inteligentes
              </Heading>
              <Body variant="muted" size="sm">
                Confirmação automática, lembretes e recovery de cancelamentos
              </Body>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/20"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <Heading size="sm" className="mb-1">
                Analytics em Tempo Real
              </Heading>
              <Body variant="muted" size="sm">
                Acompanhe métricas, receita e performance ao vivo
              </Body>
            </motion.div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                onStartTour?.()
                onClose()
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Fazer Tour Guiado
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Explorar Sozinho
            </Button>
          </div>

          {/* Fun Fact */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
            <Body size="sm" weight="medium" variant="primary">
              💡 Dica: A IA já pode começar a trabalhar imediatamente após conectar o WhatsApp!
            </Body>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
