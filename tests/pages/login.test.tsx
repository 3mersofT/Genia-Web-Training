/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

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

const mockSignInWithPassword = jest.fn();
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

// ── Import after mocks ─────────────────────────────────────────────────────
import LoginPage from '@/app/(auth)/login/page';

// ── Helpers ─────────────────────────────────────────────────────────────────

// Stub the resolve-identifier fetch for email logins (value already contains @)
beforeEach(() => {
  jest.clearAllMocks();
  // Default: signIn succeeds, getUser returns a regular user
  mockSignInWithPassword.mockResolvedValue({ error: null });
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
  mockFrom.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { role: 'student' }, error: null }),
      }),
    }),
  });
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  it('renders login form with identifier and password fields', () => {
    render(<LoginPage />);

    expect(
      screen.getByLabelText(/Email ou Nom d'utilisateur/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Se connecter/i }),
    ).toBeInTheDocument();
  });

  it('shows validation error for empty identifier on blur', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const identifierInput = screen.getByLabelText(/Email ou Nom d'utilisateur/i);
    // Focus and blur without typing to trigger onBlur validation
    await user.click(identifierInput);
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText("L'email ou le nom d'utilisateur est requis"),
      ).toBeInTheDocument();
    });
  });

  it('shows validation error for empty password on blur', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    await user.click(passwordInput);
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText('Le mot de passe est requis'),
      ).toBeInTheDocument();
    });
  });

  it('calls signInWithPassword on form submit with valid email data', async () => {
    const user = userEvent.setup();

    // Mock the resolve-identifier fetch: not needed when identifier contains @
    // (resolveIdentifierToEmail returns the value directly if it includes @)
    render(<LoginPage />);

    const identifierInput = screen.getByLabelText(/Email ou Nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /Se connecter/i });

    await user.type(identifierInput, 'user@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });
  });

  it('displays error message on login failure', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    const identifierInput = screen.getByLabelText(/Email ou Nom d'utilisateur/i);
    const passwordInput = screen.getByLabelText(/Mot de passe/i);
    const submitButton = screen.getByRole('button', { name: /Se connecter/i });

    await user.type(identifierInput, 'bad@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Invalid login credentials',
      );
    });
  });
});
