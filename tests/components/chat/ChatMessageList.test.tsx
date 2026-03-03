/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatMessageList from '@/components/chat/ChatMessageList';
import { Message } from '@/types/chat.types';

// Mock react-markdown and its plugins
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown">{children}</div>;
  };
});
jest.mock('remark-gfm', () => () => {});
jest.mock('rehype-sanitize', () => () => {});
jest.mock('@/constants/geniaMethod', () => ({
  GENIA_METHOD: {
    G: { name: 'Guide progressif', color: 'from-blue-500 to-blue-600', icon: '\u{1F4D8}', description: 'Guide' },
    E: { name: 'Exemples concrets', color: 'from-green-500 to-green-600', icon: '\u{1F50D}', description: 'Exemples' },
    N: { name: 'Niveau adaptatif', color: 'from-purple-500 to-purple-600', icon: '\u{1F4CA}', description: 'Niveau' },
    I: { name: 'Interaction pratique', color: 'from-orange-500 to-orange-600', icon: '\u26A1', description: 'Interaction' },
    A: { name: 'Assessment continu', color: 'from-indigo-500 to-indigo-600', icon: '\u2705', description: 'Assessment' },
  },
}));

// Mock scrollIntoView
const scrollIntoViewMock = jest.fn();
Element.prototype.scrollIntoView = scrollIntoViewMock;

describe('ChatMessageList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no messages', () => {
    const { container } = render(<ChatMessageList messages={[]} />);

    // The log container should be present but with no message bubbles
    const logContainer = container.querySelector('[role="log"]');
    expect(logContainer).toBeInTheDocument();

    // Only the auto-scroll anchor div should be present as a child (no message items)
    expect(screen.queryByText(/.+/)).not.toBeInTheDocument();
  });

  it('renders user messages correctly', () => {
    const messages: Message[] = [
      {
        id: '1',
        role: 'user',
        content: 'Hello GENIA, how are you?',
        timestamp: new Date('2024-06-15T10:30:00'),
      },
    ];

    render(<ChatMessageList messages={messages} />);

    expect(screen.getByText('Hello GENIA, how are you?')).toBeInTheDocument();
    expect(screen.getByText('10:30')).toBeInTheDocument();

    // User messages should be aligned right
    const messageWrapper = screen.getByText('Hello GENIA, how are you?').closest('.flex');
    expect(messageWrapper).toHaveClass('justify-end');
  });

  it('renders assistant messages with markdown', () => {
    const messages: Message[] = [
      {
        id: '2',
        role: 'assistant',
        content: '**Bold response** with details',
        timestamp: new Date('2024-06-15T10:31:00'),
      },
    ];

    render(<ChatMessageList messages={messages} />);

    // Content is rendered through the mocked ReactMarkdown
    const markdownEl = screen.getByTestId('markdown');
    expect(markdownEl).toBeInTheDocument();
    expect(markdownEl).toHaveTextContent('**Bold response** with details');

    // Assistant messages should be aligned left
    const messageWrapper = screen.getByTestId('markdown').closest('.flex.justify-start');
    expect(messageWrapper).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading=true', () => {
    render(<ChatMessageList messages={[]} isLoading={true} />);

    expect(screen.getByText('GENIA réfléchit...')).toBeInTheDocument();
  });

  it('does not show loading indicator when isLoading=false', () => {
    render(<ChatMessageList messages={[]} isLoading={false} />);

    expect(screen.queryByText('GENIA réfléchit...')).not.toBeInTheDocument();
  });

  it('auto-scrolls to bottom (mock scrollIntoView)', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'First', timestamp: new Date() },
    ];

    const { rerender } = render(<ChatMessageList messages={messages} />);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    const callCountAfterMount = scrollIntoViewMock.mock.calls.length;

    // Add a new message to trigger re-render and auto-scroll
    const updatedMessages: Message[] = [
      ...messages,
      { id: '2', role: 'assistant', content: 'Second', timestamp: new Date() },
    ];

    rerender(<ChatMessageList messages={updatedMessages} />);

    expect(scrollIntoViewMock.mock.calls.length).toBeGreaterThan(callCountAfterMount);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});
