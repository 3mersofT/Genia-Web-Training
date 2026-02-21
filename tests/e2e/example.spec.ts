import { test, expect } from '@playwright/test';

/**
 * Example E2E test suite for homepage
 * This test verifies basic functionality of the application
 */
test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify the page loaded successfully
    expect(await page.title()).toBeTruthy();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check for viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (message) => {
      if (message.type() === 'error') {
        const text = message.text();
        // Filter out expected errors in test environment with mock credentials
        const isExpectedTestError =
          text.includes('Failed to load resource: the server responded with a status of 400') ||
          text.includes('Failed to load resource: the server responded with a status of 404') ||
          text.includes('test.supabase.co'); // Mock Supabase URL errors

        if (!isExpectedTestError) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify no unexpected console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });
});
