/**
 * Test setup file
 * Runs before all tests to configure the test environment
 */

import { jest } from '@jest/globals'

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.PORT = '3001'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-key'
process.env.CORS_ALLOWED_ORIGIN = '*'

// Increase test timeout for integration tests
jest.setTimeout(10000)
