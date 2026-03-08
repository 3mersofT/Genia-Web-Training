import { test, expect } from '@playwright/test';
import { setupConsoleErrorTracking } from './helpers';

/**
 * Example E2E test suite for homepage
 * This test verifies basic functionality of the application
 */
test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(await page.title()).toBeTruthy();
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    const viewport = await page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(consoleErrors).toHaveLength(0);
  });
});
