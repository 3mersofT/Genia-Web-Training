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

const mockSignOut = jest.fn();
const mockUseAuth = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
  useAuth: (...args: any[]) => mockUseAuth(...args),
}));

jest.mock('@/lib/services/analyticsService', () => ({
  analyticsService: {
    getStudentAnalytics: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('@/hooks/useSeasonalLeaderboard', () => ({
  useSeasonalLeaderboard: () => ({
    currentSeason: null,
    leaderboard: [],
    userSeasonStats: null,
    historicalSeasons: [],
    isLoading: false,
    switchSeasonType: jest.fn(),
    switchSeason: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock all analytics components
jest.mock('@/components/analytics/ProgressOverview', () =>
  function MockProgressOverview() {
    return <div data-testid="progress-overview" />;
  },
);

jest.mock('@/components/analytics/SkillRadarChart', () =>
  function MockSkillRadarChart() {
    return <div data-testid="skill-radar-chart" />;
  },
);

jest.mock('@/components/analytics/ScoreTrendChart', () =>
  function MockScoreTrendChart() {
    return <div data-testid="score-trend-chart" />;
  },
);

jest.mock('@/components/analytics/StreakCalendar', () =>
  function MockStreakCalendar() {
    return <div data-testid="streak-calendar" />;
  },
);

jest.mock('@/components/analytics/BadgeShowcase', () =>
  function MockBadgeShowcase() {
    return <div data-testid="badge-showcase" />;
  },
);

jest.mock('@/components/analytics/TimeAnalytics', () =>
  function MockTimeAnalytics() {
    return <div data-testid="time-analytics" />;
  },
);

jest.mock('@/components/analytics/NextStepsRecommendations', () =>
  function MockNextSteps() {
    return <div data-testid="next-steps" />;
  },
);

jest.mock('@/components/gamification/SeasonalLeaderboard', () =>
  function MockSeasonalLeaderboard() {
    return <div data-testid="seasonal-leaderboard" />;
  },
);

jest.mock('@/components/gamification/SocialShareButton', () =>
  function MockSocialShareButton() {
    return <div data-testid="social-share-button" />;
  },
);

jest.mock('lucide-react', () => ({
  BarChart3: (props: any) => <svg data-testid="icon-barchart" {...props} />,
  RefreshCw: (props: any) => <svg data-testid="icon-refresh" {...props} />,
  TrendingUp: (props: any) => <svg data-testid="icon-trending" {...props} />,
  Trophy: (props: any) => <svg data-testid="icon-trophy" {...props} />,
  Brain: (props: any) => <svg data-testid="icon-brain" {...props} />,
}));

// ── Import after mocks ──────────────────────────────────────────────────────
import AnalyticsPage from '@/app/(dashboard)/analytics/page';

// ── Helpers ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('AnalyticsPage', () => {
  it('renders loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      signOut: mockSignOut,
    });

    const { container } = render(<AnalyticsPage />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders page header', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      loading: false,
      signOut: mockSignOut,
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Learning Analytics Dashboard')).toBeInTheDocument();
    });
  });

  it('shows performance tab by default', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1' },
      loading: false,
      signOut: mockSignOut,
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    });

    // The performance tab button should exist
    const performanceButton = screen.getByText('Performance Analytics');
    expect(performanceButton).toBeInTheDocument();

    // The seasonal tab button should also exist
    const seasonalButton = screen.getByText('Seasonal Leaderboard');
    expect(seasonalButton).toBeInTheDocument();
  });
});
