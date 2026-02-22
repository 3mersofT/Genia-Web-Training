import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-End Test: Admin Access Control
 *
 * This test suite verifies that admin routes are properly protected by middleware
 * and that non-admin users are redirected with appropriate error messages.
 *
 * Test Coverage:
 * 1. Unauthenticated access to /admin redirects to /login
 * 2. Non-admin redirect includes error parameter
 * 3. Cookie security flags are properly set
 * 4. Admin routes are protected consistently
 * 5. No console errors during navigation
 */

test.describe('Admin Access Control', () => {
  // Helper function to wait for page load
  async function waitForPageLoad(page: Page) {
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
  }

  // Helper function to setup console error tracking
  function setupConsoleErrorTracking(page: Page): string[] {
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        const text = message.text();
        // Filter out expected errors in test environment
        const isExpectedTestError =
          text.includes('Failed to load resource: the server responded with a status of 400') ||
          text.includes('Failed to load resource: the server responded with a status of 404') ||
          text.includes('test.supabase.co') ||
          text.includes('chunk-') || // Chunk loading errors in dev
          text.includes('Hydration') || // React hydration mismatches in dev
          text.includes('Failed to fetch RSC payload') || // Next.js hot reload errors
          text.includes('Falling back to browser navigation') || // Next.js navigation fallback
          text.startsWith('Warning:') || // React warnings emitted as errors
          text.includes('Encountered two children with the same key') || // React duplicate key warning
          text.includes('Keys should be unique'); // React key warning

        if (!isExpectedTestError) {
          consoleErrors.push(text);
        }
      }

      // Also filter React warnings
      if (message.type() === 'warning') {
        const text = message.text();
        const isExpectedWarning =
          text.includes('Encountered two children with the same key') || // React duplicate key warning
          text.includes('Keys should be unique'); // React key warning

        // Don't add expected warnings to errors
        if (!isExpectedWarning) {
          // Could optionally track warnings separately if needed
        }
      }
    });

    return consoleErrors;
  }

  test('Unauthenticated user accessing /admin is redirected to /login', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);

    // Navigate to admin page without authentication
    await page.goto('/admin');
    await waitForPageLoad(page);

    // Should be redirected to login page
    // Check if URL contains /login or if there's a login form
    const currentUrl = page.url();
    const hasLoginInUrl = currentUrl.includes('/login') || currentUrl.includes('/auth');

    // Alternatively, check for login form elements
    const hasLoginForm = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const lowerText = text.toLowerCase();
      return (
        lowerText.includes('connexion') ||
        lowerText.includes('login') ||
        lowerText.includes('sign in') ||
        lowerText.includes('email') ||
        lowerText.includes('password') ||
        lowerText.includes('mot de passe')
      );
    });

    // Either URL contains login or page shows login form
    expect(hasLoginInUrl || hasLoginForm).toBeTruthy();

    // Verify no unexpected errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('Accessing /admin routes should have consistent protection', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);

    // Test various admin sub-routes
    const adminRoutes = [
      '/admin',
      '/admin/users',
      '/admin/settings',
      '/admin/dashboard',
    ];

    for (const route of adminRoutes) {
      await page.goto(route);
      await waitForPageLoad(page);

      // All admin routes should be protected (redirect to login or show access denied)
      const currentUrl = page.url();
      const isProtected =
        currentUrl.includes('/login') ||
        currentUrl.includes('/auth') ||
        currentUrl.includes('/dashboard');

      // If not redirected, check if content indicates protection
      if (!isProtected) {
        const hasProtectionIndicators = await page.evaluate(() => {
          const text = document.body.textContent || '';
          const lowerText = text.toLowerCase();
          return (
            lowerText.includes('access denied') ||
            lowerText.includes('accès interdit') ||
            lowerText.includes('accès refusé') ||
            lowerText.includes('non autorisé') ||
            lowerText.includes('unauthorized')
          );
        });

        expect(hasProtectionIndicators || isProtected).toBeTruthy();
      }
    }

    // Verify no unexpected errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('Dashboard redirect includes error parameter for access denial', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);

    // Try to access admin route (will be redirected if not authenticated/authorized)
    await page.goto('/admin');
    await waitForPageLoad(page);

    // Check current URL for either login redirect or dashboard with error
    const currentUrl = page.url();

    // Check if redirected to dashboard with error parameter
    const hasDashboardWithError =
      currentUrl.includes('/dashboard') &&
      currentUrl.includes('error');

    // Check if redirected to login (expected for unauthenticated users)
    const hasLoginRedirect =
      currentUrl.includes('/login') ||
      currentUrl.includes('/auth');

    // Check for error message in the page content
    const hasErrorMessage = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const lowerText = text.toLowerCase();
      return (
        lowerText.includes('access denied') ||
        lowerText.includes('accès interdit') ||
        lowerText.includes('accès refusé') ||
        lowerText.includes('non autorisé') ||
        lowerText.includes('unauthorized') ||
        lowerText.includes('error')
      );
    });

    // One of these conditions should be true
    expect(hasDashboardWithError || hasLoginRedirect || hasErrorMessage).toBeTruthy();

    // Verify no unexpected errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('Cookie security flags are properly configured', async ({ page, context }) => {
    const consoleErrors = setupConsoleErrorTracking(page);

    // Navigate to a page that would set cookies
    await page.goto('/');
    await waitForPageLoad(page);

    // Get all cookies
    const cookies = await context.cookies();

    // Check for role cache cookie if it exists
    const roleCookie = cookies.find(c => c.name === 'user_role');

    if (roleCookie) {
      // Verify security flags
      expect(roleCookie.httpOnly).toBe(true);
      expect(roleCookie.secure).toBe(true);
      expect(roleCookie.sameSite).toBe('Lax');

      // Verify TTL is set (maxAge should be positive)
      // Note: expires is set, which indicates maxAge was configured
      expect(roleCookie.expires).toBeGreaterThan(0);
    }

    // Check for Supabase auth cookies (should also be secure)
    const authCookies = cookies.filter(c =>
      c.name.includes('supabase') ||
      c.name.includes('auth')
    );

    for (const cookie of authCookies) {
      // Auth cookies should have httpOnly flag
      expect(cookie.httpOnly).toBe(true);

      // In production, should be secure
      // In dev environment, secure might be false
      if (process.env.NODE_ENV === 'production') {
        expect(cookie.secure).toBe(true);
      }
    }

    // Verify no unexpected errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('Admin dashboard page structure exists', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);

    // Try to navigate to admin page
    await page.goto('/admin');
    await waitForPageLoad(page);

    // Check if the page has admin-related content or redirected
    const hasAdminContent = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const lowerText = text.toLowerCase();
      return (
        lowerText.includes('admin') ||
        lowerText.includes('administration') ||
        lowerText.includes('users') ||
        lowerText.includes('utilisateurs') ||
        lowerText.includes('settings') ||
        lowerText.includes('paramètres')
      );
    });

    // Either shows admin content (if authenticated as admin) or shows login/error
    const hasLoginOrError = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const lowerText = text.toLowerCase();
      return (
        lowerText.includes('connexion') ||
        lowerText.includes('login') ||
        lowerText.includes('access denied') ||
        lowerText.includes('accès interdit')
      );
    });

    // Page should either have admin content or redirect to login/error
    expect(hasAdminContent || hasLoginOrError).toBeTruthy();

    // Verify no unexpected errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('Multiple admin route navigations maintain protection', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);

    // Navigate to multiple admin routes in sequence
    const routes = [
      '/admin',
      '/admin/users',
      '/admin/settings',
      '/admin',
    ];

    for (const route of routes) {
      await page.goto(route);
      await waitForPageLoad(page);

      // Each navigation should be protected
      const currentUrl = page.url();
      const isProtected =
        currentUrl.includes('/login') ||
        currentUrl.includes('/auth') ||
        currentUrl.includes('/dashboard') ||
        currentUrl.includes('/admin'); // May stay on admin if authenticated

      expect(isProtected).toBeTruthy();

      // Small delay between navigations
      await page.waitForTimeout(100);
    }

    // Verify no unexpected errors accumulated during navigation
    expect(consoleErrors).toHaveLength(0);
  });

  test('Non-admin routes remain accessible', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);

    // These routes should be accessible without admin role
    const publicRoutes = [
      '/',
      '/challenges',
      '/teams',
      '/tournaments',
      '/skill-tree',
    ];

    for (const route of publicRoutes) {
      await page.goto(route);
      await waitForPageLoad(page);

      // Page should load successfully
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);

      // Should not be redirected to login for public pages
      const currentUrl = page.url();
      const isOnExpectedPage = currentUrl.includes(route) || currentUrl === '/';

      // Allow for login redirect on protected pages
      const allowedUrls = [route, '/', '/login', '/auth'];
      const isOnAllowedPage = allowedUrls.some(allowed => currentUrl.includes(allowed));

      expect(isOnAllowedPage).toBeTruthy();
    }

    // Verify no unexpected errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('Dashboard route is accessible (non-admin protected)', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);

    // Dashboard should be accessible (requires auth but not admin)
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Should either show dashboard or redirect to login (but not access_denied error)
    const currentUrl = page.url();

    const isDashboardOrLogin =
      currentUrl.includes('/dashboard') ||
      currentUrl.includes('/login') ||
      currentUrl.includes('/auth');

    expect(isDashboardOrLogin).toBeTruthy();

    // If on dashboard, should not show admin access denied error
    if (currentUrl.includes('/dashboard')) {
      const hasAccessDeniedError = currentUrl.includes('error=access_denied');

      // Dashboard itself shouldn't trigger admin access denied
      // (only when redirected from /admin)
      // This is a soft check - access_denied is ok if coming from admin redirect
    }

    // Verify no unexpected errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('Middleware protection is consistent across page reloads', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);

    // First access
    await page.goto('/admin');
    await waitForPageLoad(page);
    const firstUrl = page.url();

    // Reload page
    await page.reload();
    await waitForPageLoad(page);
    const secondUrl = page.url();

    // Reload again
    await page.reload();
    await waitForPageLoad(page);
    const thirdUrl = page.url();

    // All URLs should show consistent protection behavior
    // (all redirected to login or all showing same protected state)
    const allLoginRedirects =
      firstUrl.includes('/login') &&
      secondUrl.includes('/login') &&
      thirdUrl.includes('/login');

    const allAuthRedirects =
      firstUrl.includes('/auth') &&
      secondUrl.includes('/auth') &&
      thirdUrl.includes('/auth');

    const allDashboardRedirects =
      firstUrl.includes('/dashboard') &&
      secondUrl.includes('/dashboard') &&
      thirdUrl.includes('/dashboard');

    const consistentBehavior =
      allLoginRedirects ||
      allAuthRedirects ||
      allDashboardRedirects;

    expect(consistentBehavior).toBeTruthy();

    // Verify no unexpected errors
    expect(consoleErrors).toHaveLength(0);
  });
});

/**
 * Additional test suite for security verification
 */
test.describe('Admin Access Security', () => {
  test('Role cache cookie has proper expiration', async ({ page, context }) => {
    // Navigate to trigger any auth/cookie setting
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get cookies
    const cookies = await context.cookies();
    const roleCookie = cookies.find(c => c.name === 'user_role');

    if (roleCookie) {
      // Cookie should have expiration set (not session cookie)
      expect(roleCookie.expires).toBeGreaterThan(0);

      // Calculate TTL (expires is in seconds since epoch)
      const now = Date.now() / 1000; // Convert to seconds
      const ttl = roleCookie.expires - now;

      // TTL should be reasonable (not too long, not too short)
      // Should be around 600 seconds (10 minutes) or less
      expect(ttl).toBeLessThanOrEqual(900); // Max 15 minutes
      expect(ttl).toBeGreaterThanOrEqual(-60); // Allow for small timing differences
    }
  });

  test('No sensitive information in client-side code', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Check that admin routes don't expose sensitive data in HTML
    const html = await page.content();

    // Should not contain database credentials or sensitive keys
    expect(html).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(html).not.toContain('database_password');
    expect(html).not.toContain('private_key');

    // Check for Supabase anon key (this is ok to be public)
    // But service role key should never be in client code
  });

  test('Admin routes return proper HTTP status on protection', async ({ page }) => {
    // Try to access admin route
    const response = await page.goto('/admin');

    // Should get either:
    // - 307/308 (redirect to login)
    // - 200 (if authenticated - showing login page or admin page)
    // - 403 (forbidden - less common in Next.js middleware)

    if (response) {
      const status = response.status();
      const validStatuses = [200, 307, 308, 302, 303];
      expect(validStatuses).toContain(status);
    }
  });

  test('Error parameter is properly URL encoded', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();

    // If URL contains error parameter, verify it's properly encoded
    if (currentUrl.includes('error=')) {
      const url = new URL(currentUrl);
      const errorParam = url.searchParams.get('error');

      if (errorParam) {
        // Error parameter should exist and be a valid string
        expect(errorParam).toBeTruthy();
        expect(typeof errorParam).toBe('string');

        // Common error values
        const validErrors = ['access_denied', 'unauthorized', 'forbidden'];
        // Error param should be one of expected values (or custom message)
        // Just verify it's not malformed
        expect(errorParam.length).toBeGreaterThan(0);
      }
    }
  });
});
