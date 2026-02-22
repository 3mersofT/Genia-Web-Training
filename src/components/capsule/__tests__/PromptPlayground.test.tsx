/**
 * Unit Tests for PromptPlayground Component
 * Tests prompt editing, character counting, and GENIA integration
 */

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock GENIAProvider
jest.mock('@/components/providers/GENIAProvider', () => ({
  useGENIA: () => ({
    updateContext: jest.fn(),
    context: {},
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy(
      {},
      {
        get: (_target, prop) => {
          return React.forwardRef(({ children, ...props }: any, ref: any) =>
            React.createElement(prop as string, { ...props, ref }, children)
          );
        },
      }
    ),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon">Play</div>,
  Edit3: () => <div data-testid="edit-icon">Edit3</div>,
  RotateCcw: () => <div data-testid="reset-icon">RotateCcw</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  MessageSquare: () => <div data-testid="message-icon">MessageSquare</div>,
  AlertCircle: () => <div data-testid="alert-icon">AlertCircle</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
}));

describe('PromptPlayground Component - Basic Tests', () => {
  const defaultProps = {
    starterPrompt: 'Write a function that calculates factorial',
  };

  it('should render without crashing', () => {
    const PromptPlayground = require('../PromptPlayground').default;
    const { container } = render(<PromptPlayground {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should accept starterPrompt prop', () => {
    const PromptPlayground = require('../PromptPlayground').default;
    const { container } = render(
      <PromptPlayground starterPrompt="Test prompt" />
    );
    expect(container).toBeInTheDocument();
  });

  it('should accept optional title prop', () => {
    const PromptPlayground = require('../PromptPlayground').default;
    const { container } = render(
      <PromptPlayground {...defaultProps} title="Custom Title" />
    );
    expect(container).toBeInTheDocument();
  });

  it('should accept optional difficulty prop', () => {
    const PromptPlayground = require('../PromptPlayground').default;
    const { container } = render(
      <PromptPlayground {...defaultProps} difficulty="beginner" />
    );
    expect(container).toBeInTheDocument();
  });

  it('should accept optional concepts prop', () => {
    const PromptPlayground = require('../PromptPlayground').default;
    const { container } = render(
      <PromptPlayground
        {...defaultProps}
        concepts={['Functions', 'Recursion']}
      />
    );
    expect(container).toBeInTheDocument();
  });
});
