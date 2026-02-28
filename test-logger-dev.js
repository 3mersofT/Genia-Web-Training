/**
 * Manual test script for logger in development mode
 *
 * This script verifies that the logger:
 * 1. Outputs to console.error/warn/info/debug in development mode
 * 2. Includes structured metadata in the output
 * 3. Sanitizes sensitive data
 * 4. Formats messages with timestamps and log levels
 */

// Mock process.env.NODE_ENV to development
process.env.NODE_ENV = 'development'

// Import the logger (using require for .js script compatibility)
const { logger } = require('./src/lib/logger.ts')

console.log('='.repeat(80))
console.log('LOGGER DEVELOPMENT MODE TEST')
console.log('='.repeat(80))
console.log('\nNODE_ENV:', process.env.NODE_ENV)
console.log('\n' + '='.repeat(80))

// Test 1: Error logging with structured metadata
console.log('\n--- Test 1: logger.error() with component/action metadata ---')
logger.error('Failed to load profile data', {
  component: 'DashboardPage',
  action: 'loadProfile',
  userId: 'test-user-123',
  error: 'Supabase connection timeout'
})

// Test 2: Warning logging
console.log('\n--- Test 2: logger.warn() ---')
logger.warn('API quota approaching limit', {
  component: 'GENIAChat',
  action: 'checkQuota',
  remaining: 5,
  total: 100
})

// Test 3: Info logging
console.log('\n--- Test 3: logger.info() ---')
logger.info('User completed capsule', {
  component: 'CapsulePage',
  action: 'markComplete',
  capsuleId: 'capsule-456'
})

// Test 4: Debug logging
console.log('\n--- Test 4: logger.debug() ---')
logger.debug('Cache hit for user profile', {
  component: 'ProfileCache',
  action: 'get',
  cacheKey: 'profile:test-user-123'
})

// Test 5: Sensitive data sanitization
console.log('\n--- Test 5: Sensitive data sanitization ---')
logger.error('Authentication failed', {
  component: 'AuthService',
  action: 'login',
  password: 'super-secret-password',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  email: 'user@example.com',
  apiKey: 'sk-1234567890',
  userId: 'user-123' // This should NOT be redacted
})

console.log('\n' + '='.repeat(80))
console.log('VERIFICATION CHECKLIST:')
console.log('='.repeat(80))
console.log('✓ Each log should show timestamp in ISO format')
console.log('✓ Each log should show log level (ERROR/WARN/INFO/DEBUG)')
console.log('✓ Each log should show the message')
console.log('✓ Each log should show structured metadata (component, action, etc.)')
console.log('✓ Sensitive fields (password, token, email, apiKey) should show [REDACTED]')
console.log('✓ Non-sensitive fields (userId, capsuleId) should show actual values')
console.log('='.repeat(80))
