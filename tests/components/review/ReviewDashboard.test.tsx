/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewDashboard from '@/components/review/ReviewDashboard';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react
jest.mock('lucide-react', () => new Proxy({}, {
  get: (_: any, name: string) => (props: any) => <span data-testid={`icon-${String(name)}`} {...props} />,
}));

const createStats = (overrides: Partial<{
  totalCards: number;
  cardsDueToday: number;
  totalReviews: number;
  averageEasiness: number;
  retentionRate: number;
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: string | null;
}> = {}) => ({
  totalCards: 12,
  cardsDueToday: 3,
  totalReviews: 48,
  averageEasiness: 2.5,
  retentionRate: 85,
  currentStreak: 5,
  longestStreak: 10,
  lastReviewDate: '2025-01-15',
  ...overrides,
});

describe('ReviewDashboard', () => {
  const onStartReview = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders stats (total cards, reviews, retention, easiness)', () => {
    const stats = createStats();
    render(
      <ReviewDashboard stats={stats} dueCount={3} onStartReview={onStartReview} />
    );

    // Total cards
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Cartes totales')).toBeInTheDocument();

    // Total reviews
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText('Révisions')).toBeInTheDocument();

    // Retention rate
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Rétention')).toBeInTheDocument();

    // Average easiness
    expect(screen.getByText('2.5')).toBeInTheDocument();
    expect(screen.getByText('Facilité moy.')).toBeInTheDocument();
  });

  it('shows "Commencer" button when dueCount > 0', () => {
    const stats = createStats();
    render(
      <ReviewDashboard stats={stats} dueCount={5} onStartReview={onStartReview} />
    );

    const startButton = screen.getByText('Commencer la session');
    expect(startButton).toBeInTheDocument();

    fireEvent.click(startButton);
    expect(onStartReview).toHaveBeenCalledTimes(1);
  });

  it('hides "Commencer" button when dueCount = 0', () => {
    const stats = createStats();
    render(
      <ReviewDashboard stats={stats} dueCount={0} onStartReview={onStartReview} />
    );

    expect(screen.queryByText('Commencer la session')).not.toBeInTheDocument();
    expect(screen.getByText(/Aucune révision prévue/)).toBeInTheDocument();
  });

  it('shows info section when totalCards = 0', () => {
    const stats = createStats({ totalCards: 0 });
    render(
      <ReviewDashboard stats={stats} dueCount={0} onStartReview={onStartReview} />
    );

    expect(screen.getByText('Comment ça marche ?')).toBeInTheDocument();
    expect(screen.getByText(/Complétez des capsules/)).toBeInTheDocument();
    expect(screen.getByText(/algorithme SM-2/)).toBeInTheDocument();
  });
});
