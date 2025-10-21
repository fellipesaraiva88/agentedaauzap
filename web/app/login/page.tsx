'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Display, Body } from '@/components/ui/typography'
import { Smartphone, Mail, Lock, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Implementar autenticação real
    setTimeout(() => {
      // Por enquanto, apenas redireciona
      router.push('/dashboard')
    }, 1000)
  }

  const handleDemoLogin = () => {
    setEmail('demo@agentedaauzap.com')
    setPassword('demo123')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-purple-50/50 p-4 dark:from-primary/10 dark:to-purple-950/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Display variant="gradient" className="mb-2 text-4xl">
            <Smartphone className="mr-3 inline h-10 w-10" />
            AuZap Agent
          </Display>
          <Body variant="muted" size="lg">
            Seu assistente de IA para WhatsApp
          </Body>
        </div>

        <Card className="border-2 shadow-2xl">
          <CardHeader>
            <CardTitle>Bem-vindo de volta!</CardTitle>
            <CardDescription>Entre com suas credenciais para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">
                  <Mail className="mr-2 inline h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">
                  <Lock className="mr-2 inline h-4 w-4" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Entrando...' : (
                  <>
                    Entrar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleDemoLogin}
              >
                🎭 Usar Conta Demo
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Body variant="muted" size="sm">
                Não tem uma conta?{' '}
                <button
                  onClick={() => router.push('/onboarding')}
                  className="font-medium text-primary hover:underline"
                >
                  Criar conta grátis
                </button>
              </Body>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Body variant="muted" size="sm">
            💡 <strong>Dica:</strong> Use a conta demo para testar o sistema
          </Body>
        </div>
      </motion.div>
    </div>
  )
}
