/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CohortOverview from '@/components/analytics/CohortOverview';
import type { CohortOverviewData } from '@/lib/services/cohortAnalyticsService';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/',
  useParams: () => ({}),
}));

// Mock lucide-react
jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target: any, name: string) => {
    if (name === '__esModule') return true;
    return (props: any) => <span data-testid={`icon-${name}`} {...props} />;
  },
}));

const createMockOverviewData = (overrides: Partial<CohortOverviewData> = {}): CohortOverviewData => ({
  totalStudents: 150,
  activeStudents: 120,
  averageCompletion: 72,
  averageScore: 85,
  totalCapsuleCompletions: 450,
  averageTimePerCapsule: 1800,
  ...overrides,
});

describe('CohortOverview', () => {
  it('shows skeletons when loading', () => {
    const data = createMockOverviewData();
    const { container } = render(
      <CohortOverview data={data} isLoading={true} />
    );

    // Loading state renders 6 skeleton cards with animate-pulse
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBe(6);
  });

  it('renders all 6 stat cards', () => {
    const data = createMockOverviewData();
    render(<CohortOverview data={data} isLoading={false} />);

    // The component displays 6 stat labels
    expect(screen.getByText('Étudiants inscrits')).toBeInTheDocument();
    expect(screen.getByText('Actifs (7j)')).toBeInTheDocument();
    expect(screen.getByText('Taux complétion')).toBeInTheDocument();
    expect(screen.getByText('Score moyen')).toBeInTheDocument();
    expect(screen.getByText('Capsules terminées')).toBeInTheDocument();
    expect(screen.getByText('Temps/capsule')).toBeInTheDocument();
  });

  it('displays correct values for each stat', () => {
    const data = createMockOverviewData({
      totalStudents: 200,
      activeStudents: 180,
      averageCompletion: 65,
      averageScore: 78,
      totalCapsuleCompletions: 900,
      averageTimePerCapsule: 2400,
    });

    render(<CohortOverview data={data} isLoading={false} />);

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
    // 2400 seconds / 60 = 40min
    expect(screen.getByText('40min')).toBeInTheDocument();
  });

  it('shows percentage for completion rate', () => {
    const data = createMockOverviewData({ averageCompletion: 88 });
    render(<CohortOverview data={data} isLoading={false} />);

    // The completion rate is displayed with a % suffix
    expect(screen.getByText('88%')).toBeInTheDocument();

    // Verify it corresponds to the "Taux complétion" label
    const completionLabel = screen.getByText('Taux complétion');
    const card = completionLabel.closest('.rounded-xl');
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain('88%');
  });
});
