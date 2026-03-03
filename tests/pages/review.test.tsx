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
  usePathname: () => '/review',
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

const mockUseAuth = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
  useAuth: (...args: any[]) => mockUseAuth(...args),
}));

jest.mock('@/components/review/ReviewDashboard', () =>
  function MockReviewDashboard(props: any) {
    return <div data-testid="review-dashboard" />;
  },
);

jest.mock('@/components/review/ReviewSession', () =>
  function MockReviewSession(props: any) {
    return <div data-testid="review-session" />;
  },
);

jest.mock('@/lib/data', () => ({
  getCapsuleById: jest.fn(),
  getCapsuleContent: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  ChevronLeft: (props: any) => <svg data-testid="icon-chevron-left" {...props} />,
  Brain: (props: any) => <svg data-testid="icon-brain" {...props} />,
}));

// Mock global.fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ── Import after mocks ──────────────────────────────────────────────────────
import ReviewPage from '@/app/(dashboard)/review/page';

// ── Helpers ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ stats: {}, cards: [] }),
  });
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('ReviewPage', () => {
  it('renders loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      loading: true,
    });

    const { container } = render(<ReviewPage />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders review dashboard when loaded', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      loading: false,
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId('review-dashboard')).toBeInTheDocument();
    });
  });

  it('redirects when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
