/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RetentionChart from '@/components/analytics/RetentionChart';
import type { RetentionData } from '@/lib/services/cohortAnalyticsService';

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

const createMockRetention = (overrides: Partial<RetentionData> = {}): RetentionData => ({
  week: 1,
  weekLabel: 'S1',
  totalUsers: 100,
  activeUsers: 80,
  retentionRate: 80,
  ...overrides,
});

describe('RetentionChart', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(
      <RetentionChart data={[]} isLoading={true} />
    );

    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('shows empty message when data is empty', () => {
    render(<RetentionChart data={[]} isLoading={false} />);

    expect(
      screen.getByText(/pas encore assez de donn/i)
    ).toBeInTheDocument();
  });

  it('renders retention bars with percentage values', () => {
    const data: RetentionData[] = [
      createMockRetention({ week: 1, weekLabel: 'S1', retentionRate: 90 }),
      createMockRetention({ week: 2, weekLabel: 'S2', retentionRate: 70 }),
      createMockRetention({ week: 3, weekLabel: 'S3', retentionRate: 45 }),
    ];

    render(<RetentionChart data={data} isLoading={false} />);

    // Each bar shows its retention rate as text
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('shows week labels beneath bars', () => {
    const data: RetentionData[] = [
      createMockRetention({ week: 1, weekLabel: 'S1' }),
      createMockRetention({ week: 2, weekLabel: 'S2' }),
      createMockRetention({ week: 3, weekLabel: 'S3' }),
      createMockRetention({ week: 4, weekLabel: 'S4' }),
    ];

    render(<RetentionChart data={data} isLoading={false} />);

    expect(screen.getByText('S1')).toBeInTheDocument();
    expect(screen.getByText('S2')).toBeInTheDocument();
    expect(screen.getByText('S3')).toBeInTheDocument();
    expect(screen.getByText('S4')).toBeInTheDocument();
  });
});
