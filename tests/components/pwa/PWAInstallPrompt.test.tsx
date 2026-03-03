/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import InstallPWA from '@/components/pwa/InstallPWA';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('lucide-react', () => ({
  X: (props: any) => <span {...props} />,
  Download: (props: any) => <span {...props} />,
  Smartphone: (props: any) => <span {...props} />,
  Monitor: (props: any) => <span {...props} />,
  Share: (props: any) => <span {...props} />,
}));

// Helper to create a mock matchMedia implementation
function createMatchMedia(standaloneMatch: boolean) {
  return (query: string) => ({
    matches: query.includes('standalone') ? standaloneMatch : false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
}

describe('InstallPWA', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    originalMatchMedia = window.matchMedia;
    originalLocalStorage = window.localStorage;

    // Default: not standalone, not iOS
    window.matchMedia = createMatchMedia(false) as any;

    // Clear any previous localStorage values
    localStorage.removeItem('pwa-install-declined');
    localStorage.removeItem('pwa-install-shown');

    // Set a non-iOS user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    window.matchMedia = originalMatchMedia;
  });

  it('does not render if PWA is already installed (standalone mode)', () => {
    // Mock matchMedia to return true for standalone
    window.matchMedia = createMatchMedia(true) as any;

    const { container } = render(<InstallPWA />);

    // Component returns null when isInstalled is true
    expect(container.innerHTML).toBe('');
  });

  it('does not render install prompt initially (shows after delay)', () => {
    render(<InstallPWA />);

    // The install button should NOT be visible initially (it waits 30 seconds after beforeinstallprompt)
    expect(screen.queryByText('Installer')).not.toBeInTheDocument();
  });

  it('renders install button when beforeinstallprompt fires', async () => {
    render(<InstallPWA />);

    // Simulate the browser's beforeinstallprompt event
    const promptEvent = new Event('beforeinstallprompt', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(promptEvent, 'prompt', { value: jest.fn() });
    Object.defineProperty(promptEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'dismissed' }),
    });

    act(() => {
      window.dispatchEvent(promptEvent);
    });

    // The prompt appears after 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Now the install button should be visible
    expect(screen.getByText('Installer')).toBeInTheDocument();
    expect(screen.getByText('Installer GENIA Training')).toBeInTheDocument();
  });
});
