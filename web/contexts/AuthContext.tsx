'use client'

import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import axios, { AxiosError } from 'axios'
import Cookies from 'js-cookie'

// Security: Interface definitions with strict typing
interface User {
  id: number
  email: string
  name: string
  companyId: number
  companyName?: string
  role: 'owner' | 'admin' | 'agent' | 'viewer'
  phone?: string
  createdAt?: string
}

interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

interface LoginResponse {
  user: User
  tokens: AuthTokens
  message: string
}

interface ErrorResponse {
  error: string
  message: string
}

// Create Auth Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Security Headers Configuration
const SECURITY_HEADERS = {
  'X-Requested-With': 'XMLHttpRequest',
  'X-Content-Type-Options': 'nosniff',
}

// Token Management Constants
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const TOKEN_EXPIRY_KEY = 'token_expiry'

// Security: Configure axios instance with security best practices
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 30000,
  headers: SECURITY_HEADERS,
  withCredentials: true, // Enable CORS with credentials
})

// Security: Request interceptor for JWT authentication
api.interceptors.request.use(
  (config) => {
    // Add Authorization header if token exists
    const token = Cookies.get(ACCESS_TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Security: Add CSRF protection for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
      // In production, implement proper CSRF token mechanism
      config.headers['X-CSRF-Token'] = 'csrf-token-placeholder'
    }

    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Security: Response interceptor for token refresh and error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as any

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = Cookies.get(REFRESH_TOKEN_KEY)
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken
          })

          const { accessToken, expiresIn } = response.data.tokens

          // Security: Store tokens securely
          Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
            expires: expiresIn / 86400, // Convert seconds to days
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        // Redirect to login on refresh failure
        window.location.href = '/login'
      }
    }

    // Security: Log security-related errors
    if (error.response?.status === 403) {
      console.error('Security: Forbidden access attempt', {
        url: originalRequest?.url,
        method: originalRequest?.method,
      })
    }

    return Promise.reject(error)
  }
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Security: Secure token storage with httpOnly-like behavior
  const storeTokens = useCallback((tokens: AuthTokens) => {
    // Store access token with security flags
    Cookies.set(ACCESS_TOKEN_KEY, tokens.accessToken, {
      expires: tokens.expiresIn / 86400, // Convert seconds to days
      sameSite: 'lax', // CSRF protection
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    })

    // Store refresh token with longer expiry
    Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, {
      expires: 30, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    // Store token expiry time for client-side validation
    const expiryTime = Date.now() + (tokens.expiresIn * 1000)
    Cookies.set(TOKEN_EXPIRY_KEY, expiryTime.toString(), {
      expires: tokens.expiresIn / 86400,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }, [])

  // Security: Clear all auth-related data
  const clearAuthData = useCallback(() => {
    Cookies.remove(ACCESS_TOKEN_KEY)
    Cookies.remove(REFRESH_TOKEN_KEY)
    Cookies.remove(TOKEN_EXPIRY_KEY)
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  // Login function with input validation
  const login = useCallback(async (email: string, password: string) => {
    try {
      // Security: Input validation
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      // Security: Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format')
      }

      // Security: Password minimum length
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      setLoading(true)

      // Make login request
      const response = await api.post<LoginResponse>('/api/auth/login', {
        email: email.toLowerCase().trim(),
        password,
      })

      const { user: userData, tokens } = response.data

      // Security: Validate response data
      if (!userData?.id || !tokens?.accessToken) {
        throw new Error('Invalid server response')
      }

      // Store tokens securely
      storeTokens(tokens)

      // Update state
      setUser(userData)
      setIsAuthenticated(true)

      // Security: Log successful login (without sensitive data)
      console.log('Login successful for user:', userData.email)

      // Redirect to dashboard or intended route
      const intendedRoute = sessionStorage.getItem('intendedRoute') || '/dashboard'
      sessionStorage.removeItem('intendedRoute')
      router.push(intendedRoute)

    } catch (error) {
      // Security: Handle errors without exposing sensitive information
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Login failed'

        // Security: Log failed login attempts
        console.error('Login failed:', {
          email: email.toLowerCase(),
          error: errorMessage,
          timestamp: new Date().toISOString(),
        })

        throw new Error(errorMessage)
      } else {
        throw error
      }
    } finally {
      setLoading(false)
    }
  }, [router, storeTokens])

  // Logout function with cleanup
  const logout = useCallback(async () => {
    try {
      setLoading(true)

      // Call logout endpoint to invalidate server-side session
      await api.post('/api/auth/logout').catch((error) => {
        // Log error but continue with client-side logout
        console.error('Server logout error:', error)
      })

      // Clear all auth data
      clearAuthData()

      // Security: Clear any sensitive data from sessionStorage/localStorage
      sessionStorage.clear()

      // Redirect to login
      router.push('/login')

      console.log('Logout successful')

    } catch (error) {
      console.error('Logout error:', error)
      // Even on error, clear client-side auth data
      clearAuthData()
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router, clearAuthData])

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)

      const accessToken = Cookies.get(ACCESS_TOKEN_KEY)
      const tokenExpiry = Cookies.get(TOKEN_EXPIRY_KEY)

      // Check if token exists
      if (!accessToken) {
        setIsAuthenticated(false)
        return
      }

      // Security: Check token expiry client-side
      if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
        console.log('Token expired, attempting refresh...')
        const refreshSuccess = await refreshToken()
        if (!refreshSuccess) {
          clearAuthData()
          return
        }
      }

      // Fetch user data from server
      const response = await api.get<{ user: User }>('/api/auth/me')

      if (response.data?.user) {
        setUser(response.data.user)
        setIsAuthenticated(true)

        // Security: Validate user role and permissions
        if (!['owner', 'admin', 'agent', 'viewer'].includes(response.data.user.role)) {
          console.error('Invalid user role detected')
          clearAuthData()
        }
      } else {
        clearAuthData()
      }

    } catch (error) {
      console.error('Auth check failed:', error)
      clearAuthData()

      // Redirect to login if on protected route
      if (pathname?.startsWith('/dashboard')) {
        sessionStorage.setItem('intendedRoute', pathname)
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [pathname, router, clearAuthData])

  // Refresh access token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshTokenValue = Cookies.get(REFRESH_TOKEN_KEY)

      if (!refreshTokenValue) {
        return false
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/auth/refresh`,
        { refreshToken: refreshTokenValue }
      )

      if (response.data?.tokens) {
        const { accessToken, expiresIn } = response.data.tokens

        // Store new access token
        Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
          expires: expiresIn / 86400,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })

        // Update expiry time
        const expiryTime = Date.now() + (expiresIn * 1000)
        Cookies.set(TOKEN_EXPIRY_KEY, expiryTime.toString(), {
          expires: expiresIn / 86400,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })

        return true
      }

      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }, [])

  // Check auth on mount and pathname change
  useEffect(() => {
    checkAuth()
  }, []) // Only run on mount, not on every pathname change to avoid loops

  // Security: Implement token refresh interval
  useEffect(() => {
    if (!isAuthenticated) return

    // Check token expiry every minute
    const interval = setInterval(async () => {
      const tokenExpiry = Cookies.get(TOKEN_EXPIRY_KEY)
      if (tokenExpiry) {
        const timeUntilExpiry = parseInt(tokenExpiry) - Date.now()

        // Refresh token if expiring in less than 5 minutes
        if (timeUntilExpiry < 5 * 60 * 1000) {
          console.log('Token expiring soon, refreshing...')
          await refreshToken()
        }
      }
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [isAuthenticated, refreshToken])

  // Security: Clear auth on window focus if token expired
  useEffect(() => {
    const handleFocus = () => {
      const tokenExpiry = Cookies.get(TOKEN_EXPIRY_KEY)
      if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
        checkAuth()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [checkAuth])

  const contextValue: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}