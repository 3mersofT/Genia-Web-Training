/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewCard from '@/components/review/ReviewCard';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react
jest.mock('lucide-react', () => new Proxy({}, {
  get: (_: any, name: string) => (props: any) => <span data-testid={`icon-${String(name)}`} {...props} />,
}));

// Mock spacedRepetitionService
jest.mock('@/lib/services/spacedRepetitionService', () => ({
  getQualityLabel: (q: number) => ['Aucun', 'Très difficile', 'Difficile', 'Correct', 'Facile', 'Parfait'][q],
  getQualityColor: (q: number) => `bg-color-${q}`,
}));

const defaultProps = {
  capsuleTitle: 'Introduction à React',
  capsuleId: 'cap-1',
  moduleTitle: 'Module Frontend',
  sections: {
    hook: { text: 'Un indice pour React' },
    recap: { keyPoint: 'React utilise un DOM virtuel' },
    concept: { content: 'React est une bibliothèque JavaScript pour construire des interfaces utilisateur.' },
  },
  onRate: jest.fn(),
  isSubmitting: false,
};

describe('ReviewCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the capsule title', () => {
    render(<ReviewCard {...defaultProps} />);

    expect(screen.getByText('Introduction à React')).toBeInTheDocument();
  });

  it('renders the module title', () => {
    render(<ReviewCard {...defaultProps} />);

    expect(screen.getByText('Module Frontend')).toBeInTheDocument();
  });

  it('shows the "Révéler la réponse" button', () => {
    render(<ReviewCard {...defaultProps} />);

    expect(screen.getByText('Révéler la réponse')).toBeInTheDocument();
  });

  it('clicking reveal shows 6 rating buttons (qualities 0-5)', () => {
    render(<ReviewCard {...defaultProps} />);

    const revealButton = screen.getByText('Révéler la réponse');
    fireEvent.click(revealButton);

    // After reveal, 6 rating buttons should appear with labels
    expect(screen.getByText('Aucun souvenir')).toBeInTheDocument();
    expect(screen.getByText('Très difficile')).toBeInTheDocument();
    expect(screen.getByText('Difficile')).toBeInTheDocument();
    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText('Facile')).toBeInTheDocument();
    expect(screen.getByText('Parfait')).toBeInTheDocument();
  });

  it('clicking a rating calls onRate with the correct quality', () => {
    const onRate = jest.fn();
    render(<ReviewCard {...defaultProps} onRate={onRate} />);

    // Reveal the answer first
    fireEvent.click(screen.getByText('Révéler la réponse'));

    // Click on quality 3 ("Correct")
    fireEvent.click(screen.getByText('Correct'));

    expect(onRate).toHaveBeenCalledTimes(1);
    expect(onRate).toHaveBeenCalledWith(3);
  });
});
