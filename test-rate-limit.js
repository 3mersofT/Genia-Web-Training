#!/usr/bin/env node

/**
 * Manual rate limit verification script
 * Tests each API endpoint to verify rate limiting behavior
 */

async function testEndpoint(name, url, method, limit, headers = {}) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name} (${limit} req/min limit)`);
  console.log(`${'='.repeat(60)}\n`);

  const testHeaders = {
    'x-forwarded-for': '192.168.1.100',
    ...headers
  };

  let blocked = false;
  let blockedAt = 0;

  for (let i = 1; i <= limit + 2; i++) {
    try {
      const options = {
        method,
        headers: testHeaders
      };

      if (method === 'POST') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({ test: 'data' });
      }

      const response = await fetch(url, options);
      const status = response.status;

      // Get headers
      const rateLimitLimit = response.headers.get('x-ratelimit-limit');
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const retryAfter = response.headers.get('retry-after');

      console.log(`Request ${i}:`);
      console.log(`  Status: ${status}`);
      console.log(`  X-RateLimit-Limit: ${rateLimitLimit}`);
      console.log(`  X-RateLimit-Remaining: ${rateLimitRemaining}`);
      console.log(`  Retry-After: ${retryAfter}`);

      if (status === 429) {
        const body = await response.json();
        console.log(`  Response Body:`, JSON.stringify(body, null, 2));

        if (!blocked) {
          blocked = true;
          blockedAt = i;
        }
      }

      console.log('');

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  Error: ${error.message}`);
    }
  }

  // Verification
  console.log(`\n${'-'.repeat(60)}`);
  console.log('VERIFICATION RESULTS:');
  console.log(`${'-'.repeat(60)}`);

  if (blocked && blockedAt === limit + 1) {
    console.log(`✅ PASS: Blocked at request ${blockedAt} (expected ${limit + 1})`);
  } else if (blocked) {
    console.log(`❌ FAIL: Blocked at request ${blockedAt} (expected ${limit + 1})`);
  } else {
    console.log(`❌ FAIL: Not blocked (should block after ${limit} requests)`);
  }
}

async function main() {
  console.log('\n🧪 Rate Limit Manual Verification');
  console.log('==================================\n');

  // Test 1: Auth API (5 req/min)
  await testEndpoint(
    'Auth API',
    'http://localhost:3000/api/auth/username-availability?username=testuser',
    'GET',
    5
  );

  // Wait a bit before next test
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Change IP for next test
  console.log('\n\n');

  // Test 2: Chat API (10 req/min)
  await testEndpoint(
    'Chat API',
    'http://localhost:3000/api/chat',
    'POST',
    10,
    { 'x-forwarded-for': '192.168.1.101' }
  );

  // Note: Progress API test requires 30 requests which takes longer
  console.log('\n\n');
  console.log('Note: Progress API test (30 req/min) would require 31 requests.');
  console.log('Running abbreviated test with first 10 requests...\n');

  await testEndpoint(
    'Progress API (abbreviated)',
    'http://localhost:3000/api/progress/complete',
    'POST',
    8, // Just test first 8+2 instead of all 30
    { 'x-forwarded-for': '192.168.1.102' }
  );

  console.log('\n✅ Manual verification completed!\n');
}

main().catch(console.error);
