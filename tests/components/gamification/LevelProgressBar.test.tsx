/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LevelBadge from '@/components/gamification/LevelBadge';
import { LevelProgress } from '@/types/levels.types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Trophy: (props: any) => <svg data-testid="icon-trophy" {...props} />,
  Zap: (props: any) => <svg data-testid="icon-zap" {...props} />,
  TrendingUp: (props: any) => <svg data-testid="icon-trending-up" {...props} />,
}));

const createMockLevelProgress = (overrides: Partial<LevelProgress> = {}): LevelProgress => ({
  level_rank: 2,
  level_name: 'Apprentice',
  level_name_fr: 'Apprenti',
  current_level: {
    id: 'level-2',
    level_rank: 2,
    level_name: 'Apprentice',
    level_name_fr: 'Apprenti',
    xp_required: 1000,
    xp_next_level: 5000,
    icon_emoji: '📚',
    description: 'Level 2',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  next_level: {
    id: 'level-3',
    level_rank: 3,
    level_name: 'Expert',
    level_name_fr: 'Expert',
    xp_required: 5000,
    xp_next_level: 15000,
    icon_emoji: '⚡',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  total_xp: 2500,
  current_xp: 2500,
  xp_to_next_level: 2500,
  progress_percentage: 50,
  ...overrides,
});

describe('LevelBadge (LevelProgressBar)', () => {
  describe('Rendering', () => {
    it('renders with level progress data', () => {
      const levelProgress = createMockLevelProgress();
      render(<LevelBadge levelProgress={levelProgress} />);

      expect(screen.getByText('Apprenti')).toBeInTheDocument();
      expect(screen.getByText('Niveau 2')).toBeInTheDocument();
    });

    it('displays level name', () => {
      const levelProgress = createMockLevelProgress({
        level_name_fr: 'Maitre',
        level_rank: 4,
        current_level: {
          id: 'level-4',
          level_rank: 4,
          level_name: 'Master',
          level_name_fr: 'Maitre',
          xp_required: 15000,
          xp_next_level: 50000,
          icon_emoji: '🔥',
          description: 'Level 4',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        next_level: {
          id: 'level-5',
          level_rank: 5,
          level_name: 'Legend',
          level_name_fr: 'Legende',
          xp_required: 50000,
          xp_next_level: null,
          icon_emoji: '👑',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      });
      render(<LevelBadge levelProgress={levelProgress} />);

      expect(screen.getByText('Maitre')).toBeInTheDocument();
      expect(screen.getByText('Niveau 4')).toBeInTheDocument();
    });
  });

  describe('Progress display', () => {
    it('shows progress percentage', () => {
      const levelProgress = createMockLevelProgress({ progress_percentage: 50 });
      render(<LevelBadge levelProgress={levelProgress} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('displays XP information', () => {
      const levelProgress = createMockLevelProgress({
        total_xp: 2500,
        current_xp: 2500,
        xp_to_next_level: 2500,
      });
      render(<LevelBadge levelProgress={levelProgress} />);

      // XP Total label
      expect(screen.getByText('XP Total')).toBeInTheDocument();
      // XP Actuel label
      expect(screen.getByText('XP Actuel')).toBeInTheDocument();
      // XP to next level message (use regex to handle locale-specific number formatting: 2,500 or 2 500)
      expect(screen.getByText(/2[,.\s]?500 XP restants pour le prochain niveau/)).toBeInTheDocument();
    });

    it('shows progression label toward next level', () => {
      const levelProgress = createMockLevelProgress();
      render(<LevelBadge levelProgress={levelProgress} />);

      expect(screen.getByText('Progression vers Expert')).toBeInTheDocument();
    });
  });

  describe('Compact mode', () => {
    it('renders compact mode when compact=true', () => {
      const levelProgress = createMockLevelProgress();
      render(<LevelBadge levelProgress={levelProgress} compact={true} />);

      // In compact mode, the level name is shown
      expect(screen.getByText('Apprenti')).toBeInTheDocument();
      // In compact mode, total XP is shown as text (use regex for locale-specific formatting: 2,500 or 2 500)
      expect(screen.getByText(/2[,.\s]?500 XP/)).toBeInTheDocument();
      // Progress bar details should NOT be present in compact mode
      expect(screen.queryByText('Progression vers Expert')).not.toBeInTheDocument();
      expect(screen.queryByText('XP Total')).not.toBeInTheDocument();
    });
  });

  describe('Max level', () => {
    it('shows max level message when next_level is null', () => {
      const levelProgress = createMockLevelProgress({
        level_rank: 5,
        level_name: 'Legend',
        level_name_fr: 'Legende',
        next_level: null,
        progress_percentage: 100,
        xp_to_next_level: 0,
        total_xp: 50000,
        current_xp: 50000,
        current_level: {
          id: 'level-5',
          level_rank: 5,
          level_name: 'Legend',
          level_name_fr: 'Legende',
          xp_required: 50000,
          xp_next_level: null,
          icon_emoji: '👑',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      });
      render(<LevelBadge levelProgress={levelProgress} />);

      expect(screen.getByText('Legende')).toBeInTheDocument();
      expect(screen.getByText('MAX')).toBeInTheDocument();
      // The max level message text
      expect(screen.getByText(/Niveau Maximum Atteint/)).toBeInTheDocument();
      // Progress bar toward next level should NOT be shown
      expect(screen.queryByText(/Progression vers/)).not.toBeInTheDocument();
    });
  });
});
