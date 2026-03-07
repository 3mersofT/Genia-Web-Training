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

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'welcomeBack': 'Bienvenue',
      'title': 'Prompt Engineering Academy',
      'signOut': 'Déconnexion',
      'stats.totalPoints': 'Points totaux',
      'stats.capsulesDone': 'Capsules terminées',
      'stats.progress': 'Progression',
    };
    return translations[key] || key;
  },
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          order: jest.fn(() => ({
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
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

jest.mock('@/config/branding', () => ({
  BRAND_FULL_NAME: 'Prompt Engineering Academy',
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

jest.mock('@/hooks/useOnboarding', () => ({
  useOnboarding: () => ({
    showFullOnboarding: false,
    showLiteOnboarding: false,
    completeOnboarding: jest.fn(),
    dismissLiteOnboarding: jest.fn(),
    startFullTourFromLite: jest.fn(),
  }),
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

jest.mock('@/components/gamification/AdaptiveLevelIndicator', () =>
  function MockAdaptiveLevel() {
    return <div data-testid="adaptive-level" />;
  },
);

jest.mock('@/components/onboarding/GENIAOnboarding', () =>
  function MockOnboarding() {
    return null;
  },
);

jest.mock('@/components/onboarding/FeatureDiscoveryButton', () =>
  function MockFeatureDiscovery() {
    return null;
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

    render(<DashboardPage />);

    // The loading state renders Skeleton placeholders
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
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
