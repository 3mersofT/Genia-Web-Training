/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FeedbackButton from '@/components/feedback/FeedbackButton';

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

// Mock FeedbackModal to avoid rendering the full modal implementation
jest.mock('@/components/feedback/FeedbackModal', () => {
  return function MockFeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;
    return (
      <div data-testid="feedback-modal">
        <span>Feedback Modal</span>
        <button onClick={onClose}>Close Modal</button>
      </div>
    );
  };
});

const defaultProps = {
  targetType: 'module' as const,
  targetId: 'mod-1',
  targetTitle: 'Module Test',
};

describe('FeedbackButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the feedback button with correct text', () => {
    render(<FeedbackButton {...defaultProps} />);

    // For targetType 'module', button text should be "Évaluer ce module"
    expect(screen.getByText('Évaluer ce module')).toBeInTheDocument();
  });

  it('shows modal dialog on click', () => {
    render(<FeedbackButton {...defaultProps} />);

    // Modal should not be visible initially
    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();

    // Click the feedback button
    fireEvent.click(screen.getByText('Évaluer ce module'));

    // Modal should now be visible
    expect(screen.getByTestId('feedback-modal')).toBeInTheDocument();
    expect(screen.getByText('Feedback Modal')).toBeInTheDocument();
  });

  it('renders different variants correctly', () => {
    // Test 'button' variant (default) for module type
    const { unmount: unmount1 } = render(
      <FeedbackButton {...defaultProps} variant="button" />
    );
    expect(screen.getByText('Évaluer ce module')).toBeInTheDocument();
    unmount1();

    // Test 'inline' variant for capsule type
    const { unmount: unmount2 } = render(
      <FeedbackButton targetType="capsule" targetId="cap-1" targetTitle="Capsule Test" variant="inline" />
    );
    expect(screen.getByText('Évaluer cette capsule')).toBeInTheDocument();
    unmount2();

    // Test 'icon' variant for platform type
    render(
      <FeedbackButton targetType="platform" targetId="platform" targetTitle="Platform" variant="icon" />
    );
    // Icon variant renders only an icon, with a title attribute
    const iconButton = screen.getByTitle('Feedback plateforme');
    expect(iconButton).toBeInTheDocument();
  });
});
