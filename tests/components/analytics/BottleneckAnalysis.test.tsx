/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BottleneckAnalysis from '@/components/analytics/BottleneckAnalysis';
import type { BottleneckData } from '@/lib/services/cohortAnalyticsService';

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

const createMockBottleneck = (overrides: Partial<BottleneckData> = {}): BottleneckData => ({
  capsuleId: 'capsule-1',
  capsuleTitle: 'Introduction to React',
  moduleTitle: 'Frontend Module',
  dropOffRate: 25,
  averageScore: 60,
  averageAttempts: 3,
  averageTime: 1800,
  totalAttempts: 50,
  completions: 30,
  ...overrides,
});

describe('BottleneckAnalysis', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(
      <BottleneckAnalysis data={[]} isLoading={true} />
    );

    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('shows empty message when data is empty', () => {
    render(<BottleneckAnalysis data={[]} isLoading={false} />);

    expect(
      screen.getByText(/pas encore assez de donn/i)
    ).toBeInTheDocument();
  });

  it('renders bottleneck items with titles', () => {
    const data: BottleneckData[] = [
      createMockBottleneck({ capsuleId: 'c1', capsuleTitle: 'Capsule Alpha', moduleTitle: 'Module A' }),
      createMockBottleneck({ capsuleId: 'c2', capsuleTitle: 'Capsule Beta', moduleTitle: 'Module B' }),
      createMockBottleneck({ capsuleId: 'c3', capsuleTitle: 'Capsule Gamma', moduleTitle: 'Module C' }),
    ];

    render(<BottleneckAnalysis data={data} isLoading={false} />);

    expect(screen.getByText('Capsule Alpha')).toBeInTheDocument();
    expect(screen.getByText('Capsule Beta')).toBeInTheDocument();
    expect(screen.getByText('Capsule Gamma')).toBeInTheDocument();
    expect(screen.getByText('Module A')).toBeInTheDocument();
    expect(screen.getByText('Module B')).toBeInTheDocument();
    expect(screen.getByText('Module C')).toBeInTheDocument();
  });

  it('shows red color for drop-off rate >= 50%', () => {
    const data: BottleneckData[] = [
      createMockBottleneck({ capsuleId: 'c-high', capsuleTitle: 'Hard Capsule', dropOffRate: 65 }),
      createMockBottleneck({ capsuleId: 'c-low', capsuleTitle: 'Easy Capsule', dropOffRate: 20 }),
    ];

    render(<BottleneckAnalysis data={data} isLoading={false} />);

    // The high drop-off item should show its rate with red styling
    const rateText65 = screen.getByText('65%');
    expect(rateText65).toBeInTheDocument();
    expect(rateText65).toHaveClass('text-red-600');

    // The low drop-off item should show its rate with orange styling
    const rateText20 = screen.getByText('20%');
    expect(rateText20).toBeInTheDocument();
    expect(rateText20).toHaveClass('text-orange-600');
  });
});
