/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('next-intl', () => {
  const frMessages = require('../../messages/fr.json');
  return {
    useTranslations: (namespace: string) => {
      const parts = namespace.split('.');
      let section: any = frMessages;
      for (const p of parts) {
        section = section?.[p];
      }
      return (key: string) => {
        const keyParts = key.split('.');
        let val: any = section;
        for (const k of keyParts) {
          val = val?.[k];
        }
        return val ?? key;
      };
    },
    useLocale: () => 'fr',
  };
});

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('next/link', () =>
  function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
);

const mockSignUp = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: mockSignUp,
    },
  })),
}));

// Mock lucide-react icons used by the register page
jest.mock('lucide-react', () => ({
  Sparkles: (props: any) => <svg data-testid="icon-sparkles" {...props} />,
  Mail: (props: any) => <svg data-testid="icon-mail" {...props} />,
  Lock: (props: any) => <svg data-testid="icon-lock" {...props} />,
  User: (props: any) => <svg data-testid="icon-user" {...props} />,
  ArrowRight: (props: any) => <svg data-testid="icon-arrow-right" {...props} />,
  AlertCircle: (props: any) => <svg data-testid="icon-alert-circle" {...props} />,
  AtSign: (props: any) => <svg data-testid="icon-at-sign" {...props} />,
  CheckCircle2: (props: any) => <svg data-testid="icon-check-circle" {...props} />,
  XCircle: (props: any) => <svg data-testid="icon-x-circle" {...props} />,
}));

// ── Import after mocks ─────────────────────────────────────────────────────
import RegisterPage from '@/app/(auth)/register/page';

// ── Helpers ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockSignUp.mockResolvedValue({
    data: { session: { user: { id: 'u1' } } },
    error: null,
  });

  // Default: username availability check succeeds
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ available: true }),
  }) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('RegisterPage', () => {
  it('renders registration form with all fields (fullName, username, email, password)', () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/Nom complet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Créer mon compte/i }),
    ).toBeInTheDocument();
  });

  it('shows validation error for short password on blur', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/Mot de passe/i);

    await user.click(passwordInput);
    await user.type(passwordInput, 'ab');
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText('Le mot de passe doit contenir au moins 6 caractères'),
      ).toBeInTheDocument();
    });
  });

  it('checks username availability via API', async () => {
    const user = userEvent.setup();

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ available: true }),
    });
    global.fetch = fetchMock;

    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/Nom d'utilisateur/i);
    await user.type(usernameInput, 'testuser');

    // The component debounces 300ms then calls the API
    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/api/auth/username-availability?username=testuser'),
        );
      },
      { timeout: 2000 },
    );
  });
});
