'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2, Lock } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  fallback?: React.ReactNode
}

/**
 * Protected Route Component
 *
 * Security features:
 * - Authentication check
 * - Role-based access control (RBAC)
 * - Loading states
 * - Secure redirect with intended route preservation
 *
 * OWASP References:
 * - A01:2021 - Broken Access Control
 * - A07:2021 - Identification and Authentication Failures
 */
export function ProtectedRoute({
  children,
  requiredRoles = [],
  fallback
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, isAuthenticated, checkAuth } = useAuth()

  useEffect(() => {
    // Check authentication status
    if (!loading && !isAuthenticated) {
      // Store intended route for post-login redirect
      if (pathname) {
        sessionStorage.setItem('intendedRoute', pathname)
      }

      // Redirect to login
      router.push('/login')
    }
  }, [loading, isAuthenticated, pathname, router])

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Você precisa estar autenticado para acessar esta página
          </p>
        </div>
      </div>
    )
  }

  // Role-based access control
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    console.error('Access denied - insufficient permissions', {
      userRole: user.role,
      requiredRoles,
      path: pathname,
      timestamp: new Date().toISOString()
    })

    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Lock className="mx-auto h-8 w-8 text-red-500" />
          <h2 className="mt-4 text-lg font-semibold">Acesso Negado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Você não tem permissão para acessar esta página
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  // User is authenticated and has required role
  return <>{children}</>
}

/**
 * HOC for protecting pages
 *
 * Usage:
 * ```tsx
 * export default withAuth(MyPage, { requiredRoles: ['admin'] })
 * ```
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRoles?: string[]
    fallback?: React.ReactNode
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute
        requiredRoles={options?.requiredRoles}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}