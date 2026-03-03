/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

// useAuth mock — default values are set per-test via mockUseAuth
const mockSignOut = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: (...args: any[]) => mockUseAuth(...args),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  })),
}));

jest.mock('@/lib/data', () => ({
  getAllModulesWithProgress: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

// Mock heavy child components
jest.mock('@/components/feedback/FeedbackButton', () =>
  function MockFeedback() {
    return <div data-testid="feedback-btn" />;
  },
);

jest.mock('@/components/certificates/CertificateButton', () =>
  function MockCert() {
    return <div data-testid="cert-btn" />;
  },
);

jest.mock('@/components/gamification/SkillTreeVisualization', () =>
  function MockSkillTree() {
    return <div data-testid="skill-tree" />;
  },
);

// Mock lucide-react icons used by the dashboard page
jest.mock('lucide-react', () => new Proxy({}, {
  get: (_, name) => (props: any) => <svg data-testid={`icon-${String(name)}`} {...props} />,
}));

// ── Import after mocks ─────────────────────────────────────────────────────
import DashboardPage from '@/app/(dashboard)/dashboard/page';

// ── Helpers ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('DashboardPage', () => {
  it('renders loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signOut: mockSignOut,
    });

    const { container } = render(<DashboardPage />);

    // The loading state renders a spinning div (animate-spin)
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders dashboard with user data after loading', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u1',
        email: 'alice@example.com',
        user_metadata: { full_name: 'Alice Dupont' },
      },
      loading: false,
      signOut: mockSignOut,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Bienvenue/)).toBeInTheDocument();
    });

    // Header title
    expect(screen.getByText('Prompt Engineering Academy')).toBeInTheDocument();

    // Sign out button
    expect(
      screen.getByRole('button', { name: /Déconnexion/i }),
    ).toBeInTheDocument();
  });

  it('displays stats grid (points, streak, capsules, progression)', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'u1',
        email: 'alice@example.com',
        user_metadata: { full_name: 'Alice' },
      },
      loading: false,
      signOut: mockSignOut,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Points totaux')).toBeInTheDocument();
    });

    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('Capsules terminées')).toBeInTheDocument();
    expect(screen.getByText('Progression')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signOut: mockSignOut,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
