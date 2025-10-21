'use client'

/**
 * API TESTER COMPONENT
 * Visual interface to test API endpoints
 *
 * Usage:
 * import ApiTester from '@/components/dev/ApiTester'
 *
 * <ApiTester />
 */

import React, { useState } from 'react'
import { testAllEndpoints, testEndpoint, testConnectivity, getAvailableTests, checkBackendConfig } from '@/lib/api-test'
import { logConfigValidation } from '@/lib/config-validator'
import type { TestResult } from '@/lib/api-test'

interface TestResultDisplay extends TestResult {
  timestamp: string
}

export default function ApiTester() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResultDisplay[]>([])
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('')
  const [showConfig, setShowConfig] = useState(false)

  const availableTests = getAvailableTests()
  const backendConfig = checkBackendConfig()

  // Test all endpoints
  const handleTestAll = async () => {
    setTesting(true)
    setResults([])

    try {
      const summary = await testAllEndpoints({ showToast: true })

      const resultsWithTimestamp = summary.results.map(r => ({
        ...r,
        timestamp: new Date().toLocaleTimeString()
      }))

      setResults(resultsWithTimestamp)
    } catch (error) {
      console.error('Test all failed:', error)
    } finally {
      setTesting(false)
    }
  }

  // Test specific endpoint
  const handleTestEndpoint = async (endpoint: string) => {
    if (!endpoint) return

    setTesting(true)

    try {
      const result = await testEndpoint(endpoint, { showToast: true })

      setResults(prev => [
        {
          ...result,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev
      ])
    } catch (error) {
      console.error('Test endpoint failed:', error)
    } finally {
      setTesting(false)
    }
  }

  // Test connectivity
  const handleTestConnectivity = async () => {
    setTesting(true)

    try {
      await testConnectivity()
    } catch (error) {
      console.error('Connectivity test failed:', error)
    } finally {
      setTesting(false)
    }
  }

  // Show config validation
  const handleShowConfig = () => {
    logConfigValidation()
    setShowConfig(!showConfig)
  }

  // Clear results
  const handleClearResults = () => {
    setResults([])
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">API Tester</h1>
        <p className="text-gray-600">
          Test backend connectivity and API endpoints
        </p>
      </div>

      {/* Backend Config Status */}
      <div className={`rounded-lg shadow-sm p-6 ${backendConfig.valid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Backend Configuration
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${backendConfig.valid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {backendConfig.valid ? 'Valid' : 'Has Issues'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">API URL:</span>
            <code className="px-2 py-1 bg-gray-100 rounded text-sm">{backendConfig.url}</code>
          </div>

          {backendConfig.issues.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">Issues:</p>
              <ul className="space-y-1">
                {backendConfig.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-yellow-700 flex items-center space-x-2">
                    <span>⚠️</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={handleShowConfig}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showConfig ? 'Hide' : 'Show'} Full Config
        </button>
      </div>

      {/* Test Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Actions</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Connectivity Test */}
          <button
            onClick={handleTestConnectivity}
            disabled={testing}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {testing ? 'Testing...' : 'Test Connectivity'}
          </button>

          {/* Test All Endpoints */}
          <button
            onClick={handleTestAll}
            disabled={testing}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {testing ? 'Testing...' : 'Test All Endpoints'}
          </button>

          {/* Clear Results */}
          <button
            onClick={handleClearResults}
            disabled={testing || results.length === 0}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Clear Results
          </button>
        </div>

        {/* Test Specific Endpoint */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Specific Endpoint
          </label>
          <div className="flex space-x-2">
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an endpoint...</option>
              {availableTests.map((test) => (
                <option key={test} value={test}>
                  {test}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleTestEndpoint(selectedEndpoint)}
              disabled={testing || !selectedEndpoint}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Test
            </button>
          </div>
        </div>
      </div>

      {/* Test Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Test Results ({results.length})
          </h2>

          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : result.status === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {result.method} {result.endpoint}
                      </p>
                      <p className="text-sm text-gray-600">
                        {result.timestamp}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : result.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.message}
                    </span>
                    {result.responseTime && (
                      <p className="text-sm text-gray-600 mt-1">
                        {result.responseTime}ms
                      </p>
                    )}
                  </div>
                </div>

                {result.error && (
                  <div className="mt-2 p-3 bg-white rounded border border-red-200">
                    <p className="text-sm text-red-700 font-mono">
                      {result.error}
                    </p>
                  </div>
                )}

                {result.data && process.env.NODE_ENV === 'development' && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      Show response data
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Usage Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Test Connectivity:</strong> Quick check if backend is reachable</li>
          <li>• <strong>Test All Endpoints:</strong> Run tests on all available API endpoints</li>
          <li>• <strong>Test Specific Endpoint:</strong> Test a single endpoint individually</li>
          <li>• Results show status, response time, and error messages</li>
          <li>• Open browser console to see detailed logs</li>
        </ul>
      </div>
    </div>
  )
}
