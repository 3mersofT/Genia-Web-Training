/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActivityHeatmap from '@/components/analytics/ActivityHeatmap';
import type { ActivityHeatmapData } from '@/lib/services/cohortAnalyticsService';

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

const createMockHeatmapData = (day: number, hour: number, count: number): ActivityHeatmapData => ({
  day,
  hour,
  count,
});

describe('ActivityHeatmap', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(
      <ActivityHeatmap data={[]} isLoading={true} />
    );

    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('shows empty message when data is empty', () => {
    render(<ActivityHeatmap data={[]} isLoading={false} />);

    expect(
      screen.getByText(/pas encore de donn/i)
    ).toBeInTheDocument();
  });

  it('renders 7 day rows', () => {
    const data: ActivityHeatmapData[] = [
      createMockHeatmapData(0, 10, 5),
      createMockHeatmapData(1, 14, 12),
    ];

    render(<ActivityHeatmap data={data} isLoading={false} />);

    // Component uses French day labels: Dim, Lun, Mar, Mer, Jeu, Ven, Sam
    const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    dayLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders 24 hour columns per row', () => {
    const data: ActivityHeatmapData[] = [
      createMockHeatmapData(1, 9, 10),
    ];

    const { container } = render(
      <ActivityHeatmap data={data} isLoading={false} />
    );

    // Each day row has 24 cells (hour slots). There are 7 day rows.
    // The hour labels row shows selected hour markers: 0h, 3h, 6h, 9h, 12h, 15h, 18h, 21h
    expect(screen.getByText('0h')).toBeInTheDocument();
    expect(screen.getByText('9h')).toBeInTheDocument();
    expect(screen.getByText('12h')).toBeInTheDocument();
    expect(screen.getByText('21h')).toBeInTheDocument();

    // Each day row should contain 24 cells (the colored squares).
    // The grid rows are identified by their day label.
    // We look for the Lun row and count its cell children.
    const lunLabel = screen.getByText('Lun');
    const lunRow = lunLabel.closest('.flex.items-center');
    expect(lunRow).not.toBeNull();
    // The flex container next to the label holds the 24 hour cells
    const cellContainer = lunRow!.querySelector('.flex-1.flex');
    expect(cellContainer).not.toBeNull();
    const cells = cellContainer!.children;
    expect(cells.length).toBe(24);
  });
});
