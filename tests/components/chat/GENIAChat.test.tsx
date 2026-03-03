/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    button: React.forwardRef(({ children, ...props }: any, ref: any) => <button ref={ref} {...props}>{children}</button>),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useChat hook
const mockSendMessage = jest.fn();
const mockSetCurrentModel = jest.fn();

jest.mock('@/hooks/useChat', () => ({
  useChat: jest.fn(() => ({
    messages: [],
    isLoading: false,
    quota: {
      magistralMedium: { used: 2, daily: 10 },
      mistralMedium3: { used: 5, daily: 50 },
    },
    currentModel: 'mistral-medium-3',
    suggestions: [],
    sendMessage: mockSendMessage,
    setCurrentModel: mockSetCurrentModel,
    sendFeedback: jest.fn(),
    exportChat: jest.fn(),
    resetConversation: jest.fn(),
    context: {
      currentCapsule: { id: 'general', title: 'Formation GENIA', concepts: [], difficulty: 'beginner' },
      userLevel: 'beginner',
      completedCapsules: 0,
      totalCapsules: 36,
      streakDays: 0,
    },
  })),
}));

// Mock GENIAProvider
jest.mock('@/components/providers/GENIAProvider', () => ({
  useGENIA: jest.fn(() => ({ currentContext: null })),
}));

// Mock child components
jest.mock('@/components/chat/ChatMessageList', () => {
  return function MockChatMessageList() {
    return <div data-testid="message-list" />;
  };
});

jest.mock('@/components/chat/ChatInput', () => {
  return function MockChatInput() {
    return <div data-testid="chat-input" />;
  };
});

jest.mock('@/components/chat/ModelSelector', () => {
  return function MockModelSelector() {
    return <div data-testid="model-selector" />;
  };
});

// Mock GENIA_METHOD constant
jest.mock('@/constants/geniaMethod', () => ({
  GENIA_METHOD: {
    G: { name: 'Guide progressif', color: 'from-blue-500 to-blue-600', icon: '\u{1F4D8}', description: 'Guide' },
    E: { name: 'Exemples concrets', color: 'from-green-500 to-green-600', icon: '\u{1F50D}', description: 'Exemples' },
    N: { name: 'Niveau adaptatif', color: 'from-purple-500 to-purple-600', icon: '\u{1F4CA}', description: 'Niveau' },
    I: { name: 'Interaction pratique', color: 'from-orange-500 to-orange-600', icon: '\u26A1', description: 'Interaction' },
    A: { name: 'Assessment continu', color: 'from-indigo-500 to-indigo-600', icon: '\u2705', description: 'Assessment' },
  },
}));

// Import after mocks
import GENIAChat from '@/components/chat/GENIAChat';

describe('GENIAChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders in embedded mode', () => {
    render(<GENIAChat embedded={true} />);

    // In embedded mode, the message list and chat input should be present
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('renders floating button in standalone mode', () => {
    render(<GENIAChat embedded={false} />);

    // In standalone mode (not open), a floating button should be rendered
    // The floating button does not render the message-list or chat-input yet
    // It should show the sparkle icon button
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // The message-list should NOT be visible until the popup is opened
    // (AnimatePresence renders both branches since we mocked it to pass-through children,
    //  but the !isOpen condition means only the button branch renders)
    expect(screen.queryByTestId('message-list')).not.toBeInTheDocument();
  });

  it('shows model selector label', () => {
    render(<GENIAChat embedded={true} />);

    // In embedded mode, the model label is displayed
    // The default model is 'mistral-medium-3' so the label should be 'Pratique'
    expect(screen.getByText(/Pratique/)).toBeInTheDocument();
  });

  it('displays initial suggestions when no messages', () => {
    render(<GENIAChat embedded={true} />);

    // The SuggestionsBar should be rendered with default suggestions
    expect(screen.getByText('Montre-moi un exemple concret')).toBeInTheDocument();
    expect(screen.getByText('Comment améliorer ce prompt ?')).toBeInTheDocument();
    expect(screen.getByText('Donne-moi un exercice pratique')).toBeInTheDocument();
    expect(screen.getByText('Explique le raisonnement step-by-step')).toBeInTheDocument();
  });
});
