import type { Page } from '@playwright/test';

/**
 * Shared E2E test helpers
 */

/** Wait for page to be fully loaded */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Setup console error tracking with filters for expected CI errors.
 * In CI, the app runs with a fake Supabase URL (test.supabase.co)
 * which causes network errors that are expected and should be ignored.
 */
export function setupConsoleErrorTracking(page: Page): string[] {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const text = message.text();
      const isExpectedTestError =
        // Network errors from fake Supabase
        text.includes('test.supabase.co') ||
        text.includes('ENOTFOUND') ||
        text.includes('fetch failed') ||
        // HTTP errors expected without real backend
        text.includes('Failed to load resource: the server responded with a status of 4') ||
        text.includes('Failed to load resource: the server responded with a status of 500') ||
        text.includes('Failed to load resource: net::ERR_') ||
        // Next.js dev/CI noise
        text.includes('chunk-') ||
        text.includes('Hydration') ||
        text.includes('Failed to fetch RSC payload') ||
        text.includes('Falling back to browser navigation') ||
        text.includes('Error: connect ECONNREFUSED') ||
        // React warnings emitted as errors
        text.startsWith('Warning:') ||
        text.includes('Encountered two children with the same key') ||
        text.includes('Keys should be unique') ||
        // Error boundaries catching Supabase failures
        text.includes('ErrorBoundary') ||
        text.includes('NotFoundErrorBoundary') ||
        text.includes('RedirectErrorBoundary') ||
        // Supabase auth errors without real credentials
        text.includes('AuthSessionMissingError') ||
        text.includes('invalid_credentials') ||
        text.includes('AuthApiError');

      if (!isExpectedTestError) {
        consoleErrors.push(text);
      }
    }
  });

  return consoleErrors;
}
