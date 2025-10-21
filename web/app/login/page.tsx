'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Display, Body } from '@/components/ui/typography'
import { Smartphone, Mail, Lock, ArrowRight, AlertCircle, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

// Componente que usa searchParams - precisa estar dentro de Suspense
function LoginRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      const from = searchParams.get('from') || '/dashboard'
      router.push(from)
    }
  }, [isAuthenticated, router, searchParams])

  return null
}

function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Security: Client-side validation
      if (!email || !password) {
        throw new Error('Por favor, preencha todos os campos')
      }

      // Security: Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Por favor, insira um email válido')
      }

      // Security: Password minimum length check
      if (password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres')
      }

      // Call login function from auth context
      await login(email, password)

      // Show success message
      toast.success('Login realizado com sucesso!', {
        icon: '🔐',
        duration: 3000,
      })

      // Redirect handled by AuthContext
    } catch (err: any) {
      // Security: Handle authentication errors
      const errorMessage = err.message || 'Falha ao fazer login'

      // Log security event (failed login attempt)
      console.error('Login failed:', {
        email: email.toLowerCase(),
        timestamp: new Date().toISOString(),
        error: errorMessage
      })

      setError(errorMessage)

      // Show error toast with specific messages
      if (err.response?.status === 401) {
        toast.error('Email ou senha inválidos', { icon: '❌' })
      } else if (err.response?.status === 403) {
        toast.error('Empresa inativa. Entre em contato com o suporte.', { icon: '🚫' })
      } else if (err.response?.status === 429) {
        toast.error('Muitas tentativas. Aguarde alguns minutos.', { icon: '⏰' })
      } else {
        toast.error(errorMessage, { icon: '⚠️' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setEmail('feee@saraiva.ai')
    setPassword('Sucesso2025$')
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
            {/* Security Notice */}
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
              <Shield className="h-4 w-4" />
              <span>Conexão segura com criptografia de ponta a ponta</span>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

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
                  autoComplete="email"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">
                  <Lock className="mr-2 inline h-4 w-4" />
                  Senha
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
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
                Preencher com Credenciais Demo
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

// Página principal com Suspense boundary
export default function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <LoginRedirect />
      </Suspense>
      <LoginForm />
    </>
  )
}
