/**
 * API TEST SUITE
 * Test all major API endpoints to ensure backend connectivity
 *
 * Usage:
 * import { testAllEndpoints, testEndpoint } from '@/lib/api-test'
 *
 * // Test all endpoints
 * await testAllEndpoints()
 *
 * // Test specific endpoint
 * await testEndpoint('health')
 */

import { api, healthApi, dashboardApi, companiesApi, settingsApi, conversationsApi, appointmentsApi, servicesApi, statsApi, notificationsApi, petsApi, tutorsApi, whatsappApi } from './api'
import toast from 'react-hot-toast'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TestResult {
  endpoint: string
  method: string
  status: 'success' | 'error' | 'warning'
  message: string
  responseTime?: number
  data?: any
  error?: string
}

export interface TestSummary {
  total: number
  passed: number
  failed: number
  warnings: number
  duration: number
  results: TestResult[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Execute a test with timing and error handling
 */
async function executeTest(
  testName: string,
  method: string,
  testFn: () => Promise<any>
): Promise<TestResult> {
  const startTime = performance.now()

  try {
    const data = await testFn()
    const responseTime = Math.round(performance.now() - startTime)

    return {
      endpoint: testName,
      method,
      status: 'success',
      message: 'OK',
      responseTime,
      data,
    }
  } catch (error: any) {
    const responseTime = Math.round(performance.now() - startTime)

    return {
      endpoint: testName,
      method,
      status: 'error',
      message: error.message || 'Unknown error',
      responseTime,
      error: error.response?.data?.message || error.message,
    }
  }
}

/**
 * Log test result with colored output
 */
function logTestResult(result: TestResult) {
  const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
  const time = result.responseTime ? `(${result.responseTime}ms)` : ''

  console.log(
    `${icon} ${result.method.padEnd(6)} ${result.endpoint.padEnd(30)} ${result.message} ${time}`
  )

  if (result.error) {
    console.error(`   ↳ ${result.error}`)
  }
}

/**
 * Log test summary
 */
function logTestSummary(summary: TestSummary) {
  console.log('\n' + '='.repeat(80))
  console.log('TEST SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total Tests: ${summary.total}`)
  console.log(`✅ Passed: ${summary.passed}`)
  console.log(`❌ Failed: ${summary.failed}`)
  console.log(`⚠️  Warnings: ${summary.warnings}`)
  console.log(`⏱️  Duration: ${summary.duration}ms`)
  console.log(`📊 Success Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`)
  console.log('='.repeat(80) + '\n')
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

/**
 * Test health endpoint
 */
export async function testHealth(): Promise<TestResult> {
  return executeTest('health', 'GET', async () => {
    return await healthApi.check()
  })
}

/**
 * Test dashboard stats
 */
export async function testDashboardStats(): Promise<TestResult> {
  return executeTest('dashboard/stats', 'GET', async () => {
    return await dashboardApi.getStats()
  })
}

/**
 * Test dashboard impact
 */
export async function testDashboardImpact(): Promise<TestResult> {
  return executeTest('dashboard/impact', 'GET', async () => {
    return await dashboardApi.getImpact()
  })
}

/**
 * Test companies list
 */
export async function testCompaniesList(): Promise<TestResult> {
  return executeTest('companies', 'GET', async () => {
    return await companiesApi.list()
  })
}

/**
 * Test settings get
 */
export async function testSettingsGet(): Promise<TestResult> {
  return executeTest('settings', 'GET', async () => {
    return await settingsApi.get()
  })
}

/**
 * Test conversations list
 */
export async function testConversationsList(): Promise<TestResult> {
  return executeTest('conversations', 'GET', async () => {
    return await conversationsApi.list({ limit: 10 })
  })
}

/**
 * Test appointments list
 */
export async function testAppointmentsList(): Promise<TestResult> {
  return executeTest('appointments', 'GET', async () => {
    return await appointmentsApi.list()
  })
}

/**
 * Test services list
 */
export async function testServicesList(): Promise<TestResult> {
  return executeTest('services', 'GET', async () => {
    return await servicesApi.list()
  })
}

/**
 * Test stats dashboard
 */
export async function testStatsDashboard(): Promise<TestResult> {
  return executeTest('stats/dashboard', 'GET', async () => {
    return await statsApi.getDashboard()
  })
}

/**
 * Test notifications list
 */
export async function testNotificationsList(): Promise<TestResult> {
  return executeTest('notifications', 'GET', async () => {
    return await notificationsApi.list({ limit: 10 })
  })
}

/**
 * Test pets list
 */
export async function testPetsList(): Promise<TestResult> {
  return executeTest('pets', 'GET', async () => {
    return await petsApi.list({ limit: 10 })
  })
}

/**
 * Test tutors list
 */
export async function testTutorsList(): Promise<TestResult> {
  return executeTest('tutors', 'GET', async () => {
    return await tutorsApi.list({ limit: 10 })
  })
}

/**
 * Test WhatsApp sessions
 */
export async function testWhatsAppSessions(): Promise<TestResult> {
  return executeTest('whatsapp/sessions', 'GET', async () => {
    return await whatsappApi.getSessions()
  })
}

// ============================================================================
// MAIN TEST SUITE
// ============================================================================

/**
 * Test all endpoints
 * Returns a summary of all test results
 */
export async function testAllEndpoints(options?: {
  showToast?: boolean
  skipAuth?: boolean
}): Promise<TestSummary> {
  const { showToast = true, skipAuth = false } = options || {}

  console.log('\n' + '='.repeat(80))
  console.log('🧪 STARTING API ENDPOINT TESTS')
  console.log('='.repeat(80) + '\n')

  const startTime = performance.now()
  const results: TestResult[] = []

  // Core tests (no auth required)
  const coreTests = [
    testHealth,
  ]

  // Auth-required tests
  const authTests = skipAuth ? [] : [
    testDashboardStats,
    testDashboardImpact,
    testCompaniesList,
    testSettingsGet,
    testConversationsList,
    testAppointmentsList,
    testServicesList,
    testStatsDashboard,
    testNotificationsList,
    testPetsList,
    testTutorsList,
    testWhatsAppSessions,
  ]

  const allTests = [...coreTests, ...authTests]

  // Run tests sequentially to avoid rate limiting
  for (const test of allTests) {
    const result = await test()
    results.push(result)
    logTestResult(result)
  }

  const duration = Math.round(performance.now() - startTime)

  const summary: TestSummary = {
    total: results.length,
    passed: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    warnings: results.filter(r => r.status === 'warning').length,
    duration,
    results,
  }

  logTestSummary(summary)

  if (showToast) {
    if (summary.failed === 0) {
      toast.success(`Todos os ${summary.total} testes passaram!`)
    } else {
      toast.error(`${summary.failed} de ${summary.total} testes falharam`)
    }
  }

  return summary
}

/**
 * Test specific endpoint by name
 */
export async function testEndpoint(
  endpoint: string,
  options?: { showToast?: boolean }
): Promise<TestResult> {
  const { showToast = true } = options || {}

  const testMap: Record<string, () => Promise<TestResult>> = {
    health: testHealth,
    'dashboard/stats': testDashboardStats,
    'dashboard/impact': testDashboardImpact,
    companies: testCompaniesList,
    settings: testSettingsGet,
    conversations: testConversationsList,
    appointments: testAppointmentsList,
    services: testServicesList,
    'stats/dashboard': testStatsDashboard,
    notifications: testNotificationsList,
    pets: testPetsList,
    tutors: testTutorsList,
    'whatsapp/sessions': testWhatsAppSessions,
  }

  const testFn = testMap[endpoint]

  if (!testFn) {
    throw new Error(`Unknown endpoint: ${endpoint}`)
  }

  console.log(`\n🧪 Testing ${endpoint}...`)
  const result = await testFn()
  logTestResult(result)

  if (showToast) {
    if (result.status === 'success') {
      toast.success(`${endpoint} test passed`)
    } else {
      toast.error(`${endpoint} test failed: ${result.error}`)
    }
  }

  return result
}

// ============================================================================
// CONNECTIVITY TEST
// ============================================================================

/**
 * Quick connectivity test
 * Just checks if the backend is reachable
 */
export async function testConnectivity(): Promise<boolean> {
  try {
    console.log('🔍 Testing backend connectivity...')
    const result = await testHealth()

    if (result.status === 'success') {
      console.log('✅ Backend is reachable')
      toast.success('Backend conectado com sucesso!')
      return true
    } else {
      console.error('❌ Backend health check failed')
      toast.error('Backend não está respondendo')
      return false
    }
  } catch (error) {
    console.error('❌ Connectivity test failed:', error)
    toast.error('Erro ao conectar com o backend')
    return false
  }
}

// ============================================================================
// EXPORT TEST HELPERS
// ============================================================================

/**
 * Get available test endpoints
 */
export function getAvailableTests(): string[] {
  return [
    'health',
    'dashboard/stats',
    'dashboard/impact',
    'companies',
    'settings',
    'conversations',
    'appointments',
    'services',
    'stats/dashboard',
    'notifications',
    'pets',
    'tutors',
    'whatsapp/sessions',
  ]
}

/**
 * Check if backend is configured correctly
 */
export function checkBackendConfig(): { valid: boolean; url: string; issues: string[] } {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
  const issues: string[] = []

  // Check if URL is set
  if (!process.env.NEXT_PUBLIC_API_URL) {
    issues.push('NEXT_PUBLIC_API_URL not set, using default')
  }

  // Check if URL is valid
  try {
    new URL(url)
  } catch {
    issues.push('NEXT_PUBLIC_API_URL is not a valid URL')
  }

  // Check if URL is localhost in production
  if (process.env.NODE_ENV === 'production' && url.includes('localhost')) {
    issues.push('Using localhost URL in production environment')
  }

  return {
    valid: issues.length === 0,
    url,
    issues,
  }
}
