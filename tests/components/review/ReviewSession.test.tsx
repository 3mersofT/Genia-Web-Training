/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewSession from '@/components/review/ReviewSession';

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

// Mock spacedRepetitionService (used by ReviewCard child)
jest.mock('@/lib/services/spacedRepetitionService', () => ({
  getQualityLabel: (q: number) => ['Aucun', 'Très difficile', 'Difficile', 'Correct', 'Facile', 'Parfait'][q],
  getQualityColor: (q: number) => `bg-color-${q}`,
}));

const createCards = () => [
  {
    id: 'card-1',
    capsuleId: 'cap-1',
    capsuleTitle: 'Capsule React',
    moduleTitle: 'Module Frontend',
    sections: {
      hook: { text: 'Hook text' },
      recap: { keyPoint: 'Key point' },
    },
  },
  {
    id: 'card-2',
    capsuleId: 'cap-2',
    capsuleTitle: 'Capsule Node',
    moduleTitle: 'Module Backend',
    sections: {},
  },
];

describe('ReviewSession', () => {
  const onRate = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the current card', () => {
    render(
      <ReviewSession cards={createCards()} onRate={onRate} onClose={onClose} />
    );

    // First card should be displayed
    expect(screen.getByText('Capsule React')).toBeInTheDocument();
    expect(screen.getByText('Module Frontend')).toBeInTheDocument();
  });

  it('shows progress indicator', () => {
    render(
      <ReviewSession cards={createCards()} onRate={onRate} onClose={onClose} />
    );

    // Progress text "1 / 2"
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('shows close button', () => {
    render(
      <ReviewSession cards={createCards()} onRate={onRate} onClose={onClose} />
    );

    // The close button uses the X icon
    const closeIcon = screen.getByTestId('icon-X');
    expect(closeIcon).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ReviewSession cards={createCards()} onRate={onRate} onClose={onClose} />
    );

    // The close button wraps the X icon
    const closeIcon = screen.getByTestId('icon-X');
    const closeButton = closeIcon.closest('button');
    expect(closeButton).not.toBeNull();

    fireEvent.click(closeButton!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
