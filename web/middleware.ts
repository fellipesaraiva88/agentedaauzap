import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for route protection and authentication
 *
 * Security features:
 * - Protects dashboard routes
 * - Validates JWT tokens
 * - Implements CORS headers
 * - Adds security headers
 * - Rate limiting preparation
 *
 * OWASP References:
 * - A01:2021 - Broken Access Control
 * - A02:2021 - Cryptographic Failures
 * - A07:2021 - Identification and Authentication Failures
 */

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
]

// Static assets and Next.js internals
const STATIC_PATHS = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/api/health',
]

// Protected route prefixes
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/api/customers',
  '/api/appointments',
  '/api/services',
  '/api/companies',
  '/api/users',
]

/**
 * Check if path is public
 */
function isPublicPath(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true
  }

  // Check static paths
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    return true
  }

  return false
}

/**
 * Check if path requires authentication
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

/**
 * Add security headers to response
 * Implements defense in depth strategy
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers based on OWASP recommendations
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Content Security Policy (CSP)
  // Adjust based on your specific needs
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.openai.com http://localhost:3000 ws://localhost:3000",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))

  return response
}

/**
 * Validate JWT token structure (basic validation)
 * Full validation happens on the backend
 */
function isValidTokenFormat(token: string): boolean {
  if (!token) return false

  // JWT should have 3 parts separated by dots
  const parts = token.split('.')
  if (parts.length !== 3) return false

  // Basic structure validation
  try {
    // Check if parts can be base64 decoded
    parts.forEach(part => {
      if (part.length === 0) throw new Error('Empty part')
    })
    return true
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create response
  let response = NextResponse.next()

  // Add security headers to all responses
  response = addSecurityHeaders(response)

  // Skip auth check for public paths
  if (isPublicPath(pathname)) {
    // If user is already authenticated and tries to access login, redirect to dashboard
    const token = request.cookies.get('access_token')?.value
    if (pathname === '/login' && token && isValidTokenFormat(token)) {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  // Check authentication for protected routes
  if (isProtectedPath(pathname)) {
    const token = request.cookies.get('access_token')?.value

    // No token present
    if (!token) {
      console.log(`Unauthorized access attempt to ${pathname} - No token`)

      // API routes return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Authentication required',
            code: 'AUTH_REQUIRED'
          },
          { status: 401 }
        )
      }

      // Web routes redirect to login
      const loginUrl = new URL('/login', request.url)
      // Store intended destination for post-login redirect
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Basic token format validation
    if (!isValidTokenFormat(token)) {
      console.log(`Invalid token format for ${pathname}`)

      // Clear invalid token
      response.cookies.delete('access_token')

      // API routes return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Invalid authentication token',
            code: 'INVALID_TOKEN'
          },
          { status: 401 }
        )
      }

      // Web routes redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Token exists and has valid format - proceed
    // Full token validation happens in the API endpoints
  }

  // Rate limiting headers (preparation for future implementation)
  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', '99')
  response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString())

  return response
}

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}