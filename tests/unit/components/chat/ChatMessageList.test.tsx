/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatMessageList from '@/components/chat/ChatMessageList';
import { Message } from '@/types/chat.types';

// Mock pour scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock react-markdown et ses plugins
jest.mock('react-markdown', () => {
  return ({ children }: { children: string }) => <div>{children}</div>;
});

jest.mock('remark-gfm', () => {
  return () => {};
});

jest.mock('rehype-sanitize', () => {
  return () => {};
});

describe('ChatMessageList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render empty list when no messages', () => {
      const { container } = render(<ChatMessageList messages={[]} />);
      const messagesContainer = container.querySelector('.space-y-4');
      expect(messagesContainer).toBeInTheDocument();
      expect(messagesContainer?.children.length).toBe(1); // Only the scroll anchor
    });

    it('should render multiple messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date('2024-01-01T10:00:00')
        },
        {
          id: '2',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date('2024-01-01T10:00:05')
        }
      ];

      render(<ChatMessageList messages={messages} />);

      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    it('should render timestamps', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test message',
          timestamp: new Date('2024-01-01T14:30:00')
        }
      ];

      render(<ChatMessageList messages={messages} />);

      // Le timestamp devrait être formaté en HH:MM
      expect(screen.getByText('14:30')).toBeInTheDocument();
    });
  });

  describe('Message Roles', () => {
    it('should apply correct styling for user messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'User message',
          timestamp: new Date()
        }
      ];

      const { container } = render(<ChatMessageList messages={messages} />);
      const messageDiv = screen.getByText('User message').closest('.rounded-2xl');

      expect(messageDiv).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'text-white');
    });

    it('should apply correct styling for assistant messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Assistant message',
          timestamp: new Date()
        }
      ];

      const { container } = render(<ChatMessageList messages={messages} />);
      const messageDiv = screen.getByText('Assistant message').closest('.rounded-2xl');

      expect(messageDiv).toHaveClass('bg-card', 'border', 'border-border', 'text-foreground');
    });

    it('should apply correct styling for system messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'system',
          content: 'System message',
          timestamp: new Date()
        }
      ];

      const { container } = render(<ChatMessageList messages={messages} />);
      const messageDiv = screen.getByText('System message').closest('.rounded-2xl');

      expect(messageDiv).toHaveClass('bg-muted', 'text-foreground');
    });

    it('should align user messages to the right', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'User message',
          timestamp: new Date()
        }
      ];

      const { container } = render(<ChatMessageList messages={messages} />);
      const messageContainer = screen.getByText('User message').closest('.flex');

      expect(messageContainer).toHaveClass('justify-end');
    });

    it('should align assistant messages to the left', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Assistant message',
          timestamp: new Date()
        }
      ];

      const { container } = render(<ChatMessageList messages={messages} />);
      const messageContainer = screen.getByText('Assistant message').closest('.flex');

      expect(messageContainer).toHaveClass('justify-start');
    });
  });

  describe('GENIA Method Indicators', () => {
    it('should display method indicator for assistant messages with methodStep', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Learning guide',
          timestamp: new Date(),
          methodStep: 'G'
        }
      ];

      render(<ChatMessageList messages={messages} />);

      expect(screen.getByText('📘')).toBeInTheDocument();
      expect(screen.getByText('Guide progressif')).toBeInTheDocument();
    });

    it('should display correct indicators for all GENIA steps', () => {
      const messages: Message[] = [
        { id: '1', role: 'assistant', content: 'Guide', timestamp: new Date(), methodStep: 'G' },
        { id: '2', role: 'assistant', content: 'Example', timestamp: new Date(), methodStep: 'E' },
        { id: '3', role: 'assistant', content: 'Niveau', timestamp: new Date(), methodStep: 'N' },
        { id: '4', role: 'assistant', content: 'Interaction', timestamp: new Date(), methodStep: 'I' },
        { id: '5', role: 'assistant', content: 'Assessment', timestamp: new Date(), methodStep: 'A' }
      ];

      render(<ChatMessageList messages={messages} />);

      expect(screen.getByText('📘')).toBeInTheDocument(); // G
      expect(screen.getByText('🔍')).toBeInTheDocument(); // E
      expect(screen.getByText('📊')).toBeInTheDocument(); // N
      expect(screen.getByText('⚡')).toBeInTheDocument(); // I
      expect(screen.getByText('✅')).toBeInTheDocument(); // A
    });

    it('should not display method indicator for user messages', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'User message',
          timestamp: new Date(),
          methodStep: 'G'
        }
      ];

      render(<ChatMessageList messages={messages} />);

      expect(screen.queryByText('Guide progressif')).not.toBeInTheDocument();
    });

    it('should not display method indicator when methodStep is undefined', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Assistant message',
          timestamp: new Date()
        }
      ];

      render(<ChatMessageList messages={messages} />);

      expect(screen.queryByText('Guide progressif')).not.toBeInTheDocument();
      expect(screen.queryByText('📘')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when isLoading is true', () => {
      render(<ChatMessageList messages={[]} isLoading={true} />);

      expect(screen.getByText('GENIA réfléchit...')).toBeInTheDocument();
    });

    it('should not display loading indicator when isLoading is false', () => {
      render(<ChatMessageList messages={[]} isLoading={false} />);

      expect(screen.queryByText('GENIA réfléchit...')).not.toBeInTheDocument();
    });

    it('should display custom loading text when provided', () => {
      render(
        <ChatMessageList
          messages={[]}
          isLoading={true}
          loadingText="Processing..."
        />
      );

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.queryByText('GENIA réfléchit...')).not.toBeInTheDocument();
    });

    it('should display loading indicator with spinner icon', () => {
      const { container } = render(<ChatMessageList messages={[]} isLoading={true} />);
      const loadingDiv = screen.getByText('GENIA réfléchit...').parentElement;

      expect(loadingDiv).toHaveClass('bg-muted', 'rounded-2xl');
      // Vérifier la présence de la classe animate-spin pour le spinner
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Auto-Scroll', () => {
    it('should trigger scroll when messages change', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'First message',
          timestamp: new Date()
        }
      ];

      const { rerender } = render(<ChatMessageList messages={messages} />);

      // Vérifier que scrollIntoView n'a pas encore été appelé
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);

      // Ajouter un nouveau message
      const updatedMessages = [
        ...messages,
        {
          id: '2',
          role: 'assistant',
          content: 'Second message',
          timestamp: new Date()
        }
      ];

      rerender(<ChatMessageList messages={updatedMessages} />);

      // scrollIntoView devrait être appelé à nouveau
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(2);
    });

    it('should use smooth scroll behavior', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Message',
          timestamp: new Date()
        }
      ];

      render(<ChatMessageList messages={messages} />);

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });

  describe('Markdown Rendering', () => {
    it('should render markdown content', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: '**Bold text**',
          timestamp: new Date()
        }
      ];

      render(<ChatMessageList messages={messages} />);

      // Avec le mock, le contenu est rendu tel quel
      expect(screen.getByText('**Bold text**')).toBeInTheDocument();
    });

    it('should render markdown lists content', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: '- Item 1\n- Item 2',
          timestamp: new Date()
        }
      ];

      const { container } = render(<ChatMessageList messages={messages} />);

      // Avec le mock, le contenu est rendu tel quel (les \n sont préservés dans le DOM)
      expect(screen.getByText(/Item 1/)).toBeInTheDocument();
      expect(screen.getByText(/Item 2/)).toBeInTheDocument();
    });

    it('should render markdown code blocks content', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: '```js\nconst x = 1;\n```',
          timestamp: new Date()
        }
      ];

      const { container } = render(<ChatMessageList messages={messages} />);

      // Avec le mock, le contenu est rendu tel quel
      expect(screen.getByText(/const x = 1;/)).toBeInTheDocument();
    });
  });

  describe('Chain of Thought (CoT) Reasoning', () => {
    it('should display reasoning details when provided', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Answer',
          timestamp: new Date(),
          reasoning: 'Step 1: Analyze\nStep 2: Conclude'
        }
      ];

      render(<ChatMessageList messages={messages} />);

      expect(screen.getByText('Voir le raisonnement...')).toBeInTheDocument();
      expect(screen.getByText(/Step 1: Analyze/)).toBeInTheDocument();
    });

    it('should not display reasoning when not provided', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Answer',
          timestamp: new Date()
        }
      ];

      render(<ChatMessageList messages={messages} />);

      expect(screen.queryByText('Voir le raisonnement...')).not.toBeInTheDocument();
    });

    it('should render reasoning in a details element', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Answer',
          timestamp: new Date(),
          reasoning: 'Detailed reasoning'
        }
      ];

      const { container } = render(<ChatMessageList messages={messages} />);

      const details = container.querySelector('details');
      expect(details).toBeInTheDocument();

      const summary = container.querySelector('summary');
      expect(summary).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages with very long content', () => {
      const longContent = 'Lorem ipsum '.repeat(100);
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: longContent,
          timestamp: new Date()
        }
      ];

      const { container } = render(<ChatMessageList messages={messages} />);

      // Vérifier que le contenu long est présent
      const proseDiv = container.querySelector('.prose');
      expect(proseDiv?.textContent).toContain('Lorem ipsum');
    });

    it('should handle multiple messages from same role', () => {
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Message 1', timestamp: new Date() },
        { id: '2', role: 'user', content: 'Message 2', timestamp: new Date() },
        { id: '3', role: 'user', content: 'Message 3', timestamp: new Date() }
      ];

      render(<ChatMessageList messages={messages} />);

      expect(screen.getByText('Message 1')).toBeInTheDocument();
      expect(screen.getByText('Message 2')).toBeInTheDocument();
      expect(screen.getByText('Message 3')).toBeInTheDocument();
    });

    it('should handle messages with special characters', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Special chars: <>&"\'',
          timestamp: new Date()
        }
      ];

      render(<ChatMessageList messages={messages} />);

      // ReactMarkdown avec rehype-sanitize devrait gérer les caractères spéciaux
      expect(screen.getByText(/Special chars:/)).toBeInTheDocument();
    });

    it('should handle messages with empty content', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: '',
          timestamp: new Date()
        }
      ];

      const { container } = render(<ChatMessageList messages={messages} />);

      // Le message devrait quand même être rendu
      const messageContainers = container.querySelectorAll('.rounded-2xl');
      expect(messageContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should render messages in semantic HTML structure', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: 'Test message',
          timestamp: new Date()
        }
      ];

      const { container } = render(<ChatMessageList messages={messages} />);

      const messageContainer = container.querySelector('.flex-1');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should maintain proper visual hierarchy', () => {
      const messages: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Test message',
          timestamp: new Date(),
          methodStep: 'G'
        }
      ];

      const { container } = render(<ChatMessageList messages={messages} />);

      // Vérifier que les indicateurs de méthode ont la bonne taille de police
      const methodIndicator = screen.getByText('Guide progressif').parentElement;
      expect(methodIndicator).toHaveClass('text-xs');
    });
  });
});
