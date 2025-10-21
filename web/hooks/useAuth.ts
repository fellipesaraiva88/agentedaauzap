'use client'

import { useContext } from 'react'
import { AuthContext } from '@/contexts/AuthContext'

/**
 * Custom hook to access authentication context
 *
 * Security considerations:
 * - Must be used within AuthProvider
 * - Provides type-safe access to auth state and methods
 * - Implements proper error boundaries
 *
 * Usage:
 * ```tsx
 * const { user, login, logout, isAuthenticated } = useAuth()
 * ```
 *
 * @returns AuthContextType with user state and auth methods
 * @throws Error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)

  // Security: Ensure hook is used within provider
  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Wrap your app with <AuthProvider> in the root layout.'
    )
  }

  return context
}

/**
 * Hook to check if user has specific role permissions
 *
 * @param allowedRoles - Array of roles that are allowed
 * @returns boolean indicating if user has permission
 */
export function usePermission(allowedRoles: string[]) {
  const { user } = useAuth()

  if (!user) return false

  return allowedRoles.includes(user.role)
}

/**
 * Hook to check if user is authenticated
 * Useful for conditional rendering
 *
 * @returns boolean indicating authentication status
 */
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

/**
 * Hook to get current user data
 *
 * @returns User object or null
 */
export function useCurrentUser() {
  const { user } = useAuth()
  return user
}

// Role-based permission helpers
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  AGENT: 'agent',
  VIEWER: 'viewer'
} as const

/**
 * Check if user is owner or admin
 */
export function useIsAdmin() {
  return usePermission([ROLES.OWNER, ROLES.ADMIN])
}

/**
 * Check if user is owner
 */
export function useIsOwner() {
  return usePermission([ROLES.OWNER])
}