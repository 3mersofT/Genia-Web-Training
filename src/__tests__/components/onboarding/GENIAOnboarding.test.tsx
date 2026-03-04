/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GENIAOnboarding from '@/components/onboarding/GENIAOnboarding';

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

// Mock shadcn Dialog
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogTitle: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
}));

// Mock shadcn Progress
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
}));

// Mock SpotlightOverlay
jest.mock('@/components/onboarding/SpotlightOverlay', () => {
  return function MockSpotlight({ title, onNext, onSkip, step }: any) {
    return (
      <div data-testid={`spotlight-step-${step}`}>
        <p>{title}</p>
        <button onClick={onNext}>Next</button>
        <button onClick={onSkip}>Skip</button>
      </div>
    );
  };
});

describe('GENIAOnboarding', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders step 1 welcome modal on initial load', () => {
    render(<GENIAOnboarding userId="user-1" onComplete={mockOnComplete} />);

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Bienvenue !')).toBeInTheDocument();
    expect(screen.getByText("C'est parti !")).toBeInTheDocument();
    expect(screen.getByText('Passer le tour')).toBeInTheDocument();
  });

  it('navigates to step 2 (spotlight) when clicking CTA', () => {
    render(<GENIAOnboarding userId="user-1" onComplete={mockOnComplete} />);

    fireEvent.click(screen.getByText("C'est parti !"));

    expect(screen.getByTestId('spotlight-step-2')).toBeInTheDocument();
    expect(screen.getByText('Ton niveau adaptatif')).toBeInTheDocument();
  });

  it('navigates through spotlight steps 2-5', () => {
    render(<GENIAOnboarding userId="user-1" onComplete={mockOnComplete} />);

    // Step 1 → 2
    fireEvent.click(screen.getByText("C'est parti !"));
    expect(screen.getByTestId('spotlight-step-2')).toBeInTheDocument();

    // Step 2 → 3
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByTestId('spotlight-step-3')).toBeInTheDocument();

    // Step 3 → 4
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByTestId('spotlight-step-4')).toBeInTheDocument();

    // Step 4 → 5
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByTestId('spotlight-step-5')).toBeInTheDocument();
  });

  it('shows step 6 completion modal after step 5', () => {
    render(<GENIAOnboarding userId="user-1" onComplete={mockOnComplete} />);

    // Navigate to step 6
    fireEvent.click(screen.getByText("C'est parti !"));
    fireEvent.click(screen.getByText('Next')); // 2→3
    fireEvent.click(screen.getByText('Next')); // 3→4
    fireEvent.click(screen.getByText('Next')); // 4→5
    fireEvent.click(screen.getByText('Next')); // 5→6

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Tu es prêt(e) ! 🚀')).toBeInTheDocument();
    expect(screen.getByText('Commencer ma formation !')).toBeInTheDocument();
  });

  it('calls onComplete when finishing step 6', () => {
    render(<GENIAOnboarding userId="user-1" onComplete={mockOnComplete} />);

    // Navigate to step 6
    fireEvent.click(screen.getByText("C'est parti !"));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));

    // Complete
    fireEvent.click(screen.getByText('Commencer ma formation !'));
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when skipping from step 1', () => {
    render(<GENIAOnboarding userId="user-1" onComplete={mockOnComplete} />);

    fireEvent.click(screen.getByText('Passer le tour'));
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when skipping from a spotlight step', () => {
    render(<GENIAOnboarding userId="user-1" onComplete={mockOnComplete} />);

    fireEvent.click(screen.getByText("C'est parti !"));
    fireEvent.click(screen.getByText('Skip'));
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('shows progress bar with correct value', () => {
    render(<GENIAOnboarding userId="user-1" onComplete={mockOnComplete} />);

    const progress = screen.getByTestId('progress');
    // Step 1 of 6 = ~16.67%
    expect(Number(progress.dataset.value)).toBeCloseTo(16.67, 0);
  });
});
