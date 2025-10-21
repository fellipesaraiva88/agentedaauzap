'use client'

import { useState, useEffect } from 'react'
import { Display, Body } from '@/components/ui/typography'
import { WhatsAppStatusCard, WhatsAppHeroCard } from '@/components/WhatsAppStatus'
import { OnboardingBanner } from '@/components/OnboardingBanner'
import { QuickActions } from '@/components/QuickActions'
import { OvernightActivity } from '@/components/OvernightActivity'
import { ImpactMetrics } from '@/components/ImpactMetrics'
import { AIActionsFeed } from '@/components/AIActionsFeed'
import { RevenueChart } from '@/components/RevenueChart'
import { WorkAutomationChart } from '@/components/WorkAutomationChart'
import { CelebrationModal } from '@/components/CelebrationModal'
import { motion } from 'framer-motion'
import { fadeInDown, staggerContainer, staggerItem } from '@/lib/animations'

export default function DashboardPageAuZap() {
  const [showCelebration, setShowCelebration] = useState(false)
  const userName = 'Usuário' // TODO: Pegar do contexto de autenticação

  useEffect(() => {
    // Check if it's the first visit
    const hasVisited = localStorage.getItem('dashboard-visited')
    if (!hasVisited) {
      setShowCelebration(true)
    }
  }, [])

  const handleCloseCelebration = () => {
    setShowCelebration(false)
    localStorage.setItem('dashboard-visited', 'true')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background">
      <div className="container mx-auto p-3 md:p-4 lg:p-6 max-w-7xl space-y-4 md:space-y-6">

        {/* Celebration Modal */}
        <CelebrationModal
          open={showCelebration}
          onClose={handleCloseCelebration}
          onStartTour={() => {
            handleCloseCelebration()
            // TODO: Integrate with tour system
          }}
        />

        {/* Onboarding Banner */}
        <OnboardingBanner />

        {/* Header Section */}
        <motion.header
          variants={fadeInDown}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <Display variant="gradient" className="mb-2">
                  Oi {userName}! 👋
                </Display>
                <Body variant="muted" className="text-sm md:text-base lg:text-lg">
                  A IA está trabalhando agora e gerando resultados
                </Body>
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <QuickActions />
              </div>
            </div>

            {/* WhatsApp Hero Card */}
            <WhatsAppHeroCard />
          </div>
        </motion.header>

        {/* WhatsApp Status */}
        <WhatsAppStatusCard />

        {/* Overnight Activity - "Enquanto Você Dormia" */}
        <OvernightActivity />

        {/* Impact Metrics Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <ImpactMetrics />
        </motion.div>

        {/* Charts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <RevenueChart />
          <WorkAutomationChart />
        </div>

        {/* AI Actions Feed */}
        <AIActionsFeed />

      </div>
    </div>
  )
}
