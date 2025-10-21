'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Display, Heading, Body } from '@/components/ui/typography'
import { Home, ArrowLeft, Search } from 'lucide-react'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-8"
        >
          <Display className="text-9xl font-bold text-primary/20">404</Display>
        </motion.div>

        <Heading size="xl" className="mb-4">
          Ops! Página não encontrada
        </Heading>

        <Body variant="muted" size="lg" className="mb-8">
          A página que você está procurando não existe ou foi movida.
          <br />
          Vamos te levar de volta ao caminho certo!
        </Body>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-5 w-5" />
              Ir para Dashboard
            </Link>
          </Button>

          <Button size="lg" variant="outline" asChild>
            <Link href="/whatsapp">
              <Search className="mr-2 h-5 w-5" />
              Configurar WhatsApp
            </Link>
          </Button>
        </div>

        <div className="mt-12">
          <Body variant="muted" size="sm">
            Precisa de ajuda?{' '}
            <Link href="/dashboard" className="font-medium text-primary hover:underline">
              Voltar ao início
            </Link>
          </Body>
        </div>
      </motion.div>
    </div>
  )
}
