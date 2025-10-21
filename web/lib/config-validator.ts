/**
 * CONFIGURATION VALIDATOR
 * Validates environment variables and runtime configuration
 *
 * Usage:
 * import { validateConfig, getConfig } from '@/lib/config-validator'
 *
 * // Validate on app startup
 * const validation = validateConfig()
 * if (!validation.valid) {
 *   console.error('Configuration errors:', validation.errors)
 * }
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  config: AppConfig
}

interface AppConfig {
  apiUrl: string
  appName: string
  companyId: string
  nodeEnv: string
  debug: boolean
  logApi: boolean
  enableToasts: boolean
}

// ============================================================================
// ENVIRONMENT VARIABLE VALIDATORS
// ============================================================================

/**
 * Validate API URL
 */
function validateApiUrl(url: string | undefined): { valid: boolean; error?: string; warning?: string } {
  // Check if URL is set
  if (!url) {
    return {
      valid: false,
      error: 'NEXT_PUBLIC_API_URL is not set'
    }
  }

  // Check if URL is valid
  try {
    const parsedUrl = new URL(url)

    // Check protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        valid: false,
        error: `Invalid protocol: ${parsedUrl.protocol}. Must be http: or https:`
      }
    }

    // Check if localhost in production
    if (process.env.NODE_ENV === 'production' && parsedUrl.hostname === 'localhost') {
      return {
        valid: true,
        warning: 'Using localhost URL in production environment'
      }
    }

    // Check if using http in production
    if (process.env.NODE_ENV === 'production' && parsedUrl.protocol === 'http:') {
      return {
        valid: true,
        warning: 'Using insecure HTTP in production. Consider using HTTPS.'
      }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: `Invalid URL format: ${url}`
    }
  }
}

/**
 * Validate environment name
 */
function validateNodeEnv(env: string | undefined): { valid: boolean; error?: string; warning?: string } {
  const validEnvs = ['development', 'production', 'test']

  if (!env) {
    return {
      valid: true,
      warning: 'NODE_ENV not set, defaulting to development'
    }
  }

  if (!validEnvs.includes(env)) {
    return {
      valid: true,
      warning: `NODE_ENV is "${env}". Expected: ${validEnvs.join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Validate boolean environment variable
 */
function validateBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (value === undefined) return defaultValue
  return value === 'true' || value === '1'
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate all configuration
 * Should be called on app startup
 */
export function validateConfig(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Get environment variables
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Agente Pet Shop'
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '1'
  const nodeEnv = process.env.NODE_ENV || 'development'
  const debug = validateBoolean(process.env.NEXT_PUBLIC_DEBUG, false)
  const logApi = validateBoolean(process.env.NEXT_PUBLIC_LOG_API, true)
  const enableToasts = validateBoolean(process.env.NEXT_PUBLIC_ENABLE_TOASTS, true)

  // Validate API URL
  const apiUrlValidation = validateApiUrl(apiUrl)
  if (!apiUrlValidation.valid) {
    errors.push(apiUrlValidation.error!)
  } else if (apiUrlValidation.warning) {
    warnings.push(apiUrlValidation.warning)
  }

  // Validate NODE_ENV
  const nodeEnvValidation = validateNodeEnv(nodeEnv)
  if (nodeEnvValidation.warning) {
    warnings.push(nodeEnvValidation.warning)
  }

  // Additional validations
  if (!appName) {
    warnings.push('NEXT_PUBLIC_APP_NAME not set')
  }

  if (!companyId) {
    warnings.push('NEXT_PUBLIC_COMPANY_ID not set')
  }

  // Build config object
  const config: AppConfig = {
    apiUrl: apiUrl || 'http://localhost:3000/api',
    appName,
    companyId,
    nodeEnv,
    debug,
    logApi,
    enableToasts,
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    config,
  }
}

/**
 * Get validated configuration
 * Throws error if configuration is invalid
 */
export function getConfig(): AppConfig {
  const validation = validateConfig()

  if (!validation.valid) {
    throw new Error(
      `Configuration errors:\n${validation.errors.join('\n')}`
    )
  }

  return validation.config
}

/**
 * Log configuration validation results
 */
export function logConfigValidation() {
  const validation = validateConfig()

  console.log('\n' + '='.repeat(80))
  console.log('CONFIGURATION VALIDATION')
  console.log('='.repeat(80))

  if (validation.valid) {
    console.log('✅ Configuration is valid')
  } else {
    console.error('❌ Configuration has errors:')
    validation.errors.forEach(error => console.error(`  - ${error}`))
  }

  if (validation.warnings.length > 0) {
    console.warn('\n⚠️  Warnings:')
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  console.log('\n📋 Current Configuration:')
  console.log(`  API URL: ${validation.config.apiUrl}`)
  console.log(`  App Name: ${validation.config.appName}`)
  console.log(`  Company ID: ${validation.config.companyId}`)
  console.log(`  Environment: ${validation.config.nodeEnv}`)
  console.log(`  Debug: ${validation.config.debug}`)
  console.log(`  Log API: ${validation.config.logApi}`)
  console.log(`  Enable Toasts: ${validation.config.enableToasts}`)
  console.log('='.repeat(80) + '\n')

  return validation
}

// ============================================================================
// RUNTIME CHECKS
// ============================================================================

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return validateBoolean(process.env.NEXT_PUBLIC_DEBUG, false)
}

/**
 * Check if API logging is enabled
 */
export function isApiLoggingEnabled(): boolean {
  return validateBoolean(process.env.NEXT_PUBLIC_LOG_API, true) && isDevelopment()
}

// ============================================================================
// BROWSER STORAGE CHECKS
// ============================================================================

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (!isBrowser()) return false

  try {
    const testKey = '__localStorage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Check if sessionStorage is available
 */
export function isSessionStorageAvailable(): boolean {
  if (!isBrowser()) return false

  try {
    const testKey = '__sessionStorage_test__'
    sessionStorage.setItem(testKey, 'test')
    sessionStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  const envVar = `NEXT_PUBLIC_FEATURE_${feature.toUpperCase()}`
  return validateBoolean(process.env[envVar], false)
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): string[] {
  const features: string[] = []

  Object.keys(process.env).forEach(key => {
    if (key.startsWith('NEXT_PUBLIC_FEATURE_') && validateBoolean(process.env[key])) {
      features.push(key.replace('NEXT_PUBLIC_FEATURE_', '').toLowerCase())
    }
  })

  return features
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export default {
  validateConfig,
  getConfig,
  logConfigValidation,
  isBrowser,
  isProduction,
  isDevelopment,
  isDebugEnabled,
  isApiLoggingEnabled,
  isLocalStorageAvailable,
  isSessionStorageAvailable,
  isFeatureEnabled,
  getEnabledFeatures,
}
