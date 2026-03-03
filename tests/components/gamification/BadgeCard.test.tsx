/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AchievementCelebration from '@/components/gamification/AchievementCelebration';
import { Badge } from '@/types/analytics.types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Trophy: (props: any) => <svg data-testid="icon-trophy" {...props} />,
  Award: (props: any) => <svg data-testid="icon-award" {...props} />,
  Medal: (props: any) => <svg data-testid="icon-medal" {...props} />,
  Star: (props: any) => <svg data-testid="icon-star" {...props} />,
  Crown: (props: any) => <svg data-testid="icon-crown" {...props} />,
  Sparkles: (props: any) => <svg data-testid="icon-sparkles" {...props} />,
  X: (props: any) => <svg data-testid="icon-x" {...props} />,
}));

// Mock SocialShareButton
jest.mock('@/components/gamification/SocialShareButton', () => {
  return function MockSocialShareButton() {
    return <div data-testid="social-share-button">Share</div>;
  };
});

const createMockBadge = (overrides: Partial<Badge> = {}): Badge => ({
  id: 'badge-1',
  name: 'First Steps',
  description: 'Complete your first capsule',
  icon: 'trophy',
  category: 'completion',
  rarity: 'common',
  criteria: { capsules_completed: 1 },
  points: 100,
  ...overrides,
});

describe('AchievementCelebration (BadgeCard)', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Visibility', () => {
    it('renders with a badge when show=true', () => {
      const badge = createMockBadge();
      render(
        <AchievementCelebration badge={badge} onClose={mockOnClose} show={true} />
      );

      expect(screen.getByText('First Steps')).toBeInTheDocument();
    });

    it('does not render when show=false', () => {
      const badge = createMockBadge();
      const { container } = render(
        <AchievementCelebration badge={badge} onClose={mockOnClose} show={false} />
      );

      expect(screen.queryByText('First Steps')).not.toBeInTheDocument();
      expect(container.innerHTML).toBe('');
    });
  });

  describe('Badge content', () => {
    it('displays badge name and description', () => {
      const badge = createMockBadge({
        name: 'Speed Demon',
        description: 'Complete 5 exercises in under 10 minutes',
      });
      render(
        <AchievementCelebration badge={badge} onClose={mockOnClose} show={true} />
      );

      expect(screen.getByText('Speed Demon')).toBeInTheDocument();
      expect(screen.getByText('Complete 5 exercises in under 10 minutes')).toBeInTheDocument();
    });

    it('shows correct rarity label for common badge', () => {
      const badge = createMockBadge({ rarity: 'common' });
      render(
        <AchievementCelebration badge={badge} onClose={mockOnClose} show={true} />
      );

      expect(screen.getByText('common')).toBeInTheDocument();
    });

    it('shows correct rarity label for rare badge', () => {
      const badge = createMockBadge({ rarity: 'rare' });
      render(
        <AchievementCelebration badge={badge} onClose={mockOnClose} show={true} />
      );

      expect(screen.getByText('rare')).toBeInTheDocument();
    });

    it('shows correct rarity label for epic badge', () => {
      const badge = createMockBadge({ rarity: 'epic' });
      render(
        <AchievementCelebration badge={badge} onClose={mockOnClose} show={true} />
      );

      expect(screen.getByText('epic')).toBeInTheDocument();
    });

    it('shows correct rarity label for legendary badge', () => {
      const badge = createMockBadge({ rarity: 'legendary' });
      render(
        <AchievementCelebration badge={badge} onClose={mockOnClose} show={true} />
      );

      expect(screen.getByText('legendary')).toBeInTheDocument();
    });

    it('displays points awarded', () => {
      const badge = createMockBadge({ points: 250 });
      render(
        <AchievementCelebration badge={badge} onClose={mockOnClose} show={true} />
      );

      expect(screen.getByText('+250 Points')).toBeInTheDocument();
    });
  });

  describe('Close behavior', () => {
    it('calls onClose when close button is clicked', () => {
      const badge = createMockBadge();
      render(
        <AchievementCelebration badge={badge} onClose={mockOnClose} show={true} />
      );

      const closeButton = screen.getByLabelText('Close celebration');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Continue Learning button is clicked', () => {
      const badge = createMockBadge();
      render(
        <AchievementCelebration badge={badge} onClose={mockOnClose} show={true} />
      );

      const continueButton = screen.getByText('Continue Learning');
      fireEvent.click(continueButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
