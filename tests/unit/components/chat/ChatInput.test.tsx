/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatInput from '@/components/chat/ChatInput';

describe('ChatInput', () => {
  const mockOnChange = jest.fn();
  const mockOnSend = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnSend.mockClear();
  });

  describe('Rendering', () => {
    it('should render textarea and send button', () => {
      render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /envoyer/i });

      expect(textarea).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    it('should display placeholder text', () => {
      render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
          placeholder="Type your message..."
        />
      );

      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    it('should use default placeholder when none provided', () => {
      render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      expect(screen.getByPlaceholderText('Pose ta question...')).toBeInTheDocument();
    });

    it('should display current value', () => {
      render(
        <ChatInput
          value="Hello GENIA"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Hello GENIA');
    });
  });

  describe('Text Input', () => {
    it('should call onChange when typing', () => {
      render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New message' } });

      expect(mockOnChange).toHaveBeenCalledWith('New message');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple character inputs', () => {
      render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');

      fireEvent.change(textarea, { target: { value: 'H' } });
      fireEvent.change(textarea, { target: { value: 'He' } });
      fireEvent.change(textarea, { target: { value: 'Hel' } });

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Keyboard Handling - Enter Key', () => {
    it('should send message on Enter key press', () => {
      render(
        <ChatInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });

      expect(mockOnSend).toHaveBeenCalledTimes(1);
    });

    it('should NOT send empty message on Enter', () => {
      render(
        <ChatInput
          value="   "
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should NOT send message on Shift+Enter', () => {
      render(
        <ChatInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should use onKeyDown event (not onKeyPress)', () => {
      const { container } = render(
        <ChatInput
          value="Test"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = container.querySelector('textarea');
      expect(textarea).toBeInTheDocument();

      // Verify onKeyDown is attached by checking if the event fires
      fireEvent.keyDown(textarea!, { key: 'Enter', shiftKey: false });
      expect(mockOnSend).toHaveBeenCalled();
    });

    it('should allow newline with Shift+Enter', () => {
      render(
        <ChatInput
          value="Line 1"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');

      // Shift+Enter should not prevent default, allowing newline
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        shiftKey: true,
        bubbles: true,
        cancelable: true
      });

      textarea.dispatchEvent(event);

      // Should NOT send message
      expect(mockOnSend).not.toHaveBeenCalled();
      // Default behavior (newline) should not be prevented
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('Send Button', () => {
    it('should send message when clicking send button', () => {
      render(
        <ChatInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByRole('button', { name: /envoyer/i });
      fireEvent.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledTimes(1);
    });

    it('should disable send button when value is empty', () => {
      render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByRole('button', { name: /envoyer/i });
      expect(sendButton).toBeDisabled();
    });

    it('should disable send button when value is only whitespace', () => {
      render(
        <ChatInput
          value="   "
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByRole('button', { name: /envoyer/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when value is not empty', () => {
      render(
        <ChatInput
          value="Message"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByRole('button', { name: /envoyer/i });
      expect(sendButton).not.toBeDisabled();
    });

    it('should NOT send when clicking disabled button', () => {
      render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByRole('button', { name: /envoyer/i });
      fireEvent.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should disable textarea when disabled prop is true', () => {
      render(
        <ChatInput
          value="Test"
          onChange={mockOnChange}
          onSend={mockOnSend}
          disabled={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
    });

    it('should disable send button when disabled prop is true', () => {
      render(
        <ChatInput
          value="Test"
          onChange={mockOnChange}
          onSend={mockOnSend}
          disabled={true}
        />
      );

      const sendButton = screen.getByRole('button', { name: /envoyer/i });
      expect(sendButton).toBeDisabled();
    });

    it('should NOT send message when disabled', () => {
      render(
        <ChatInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
          disabled={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should NOT send via button when disabled', () => {
      render(
        <ChatInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
          disabled={true}
        />
      );

      const sendButton = screen.getByRole('button', { name: /envoyer/i });
      fireEvent.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className to container', () => {
      const { container } = render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
          className="custom-input-class"
        />
      );

      const rootElement = container.querySelector('.custom-input-class');
      expect(rootElement).toBeInTheDocument();
    });

    it('should preserve default styles with custom className', () => {
      const { container } = render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
          className="custom-class"
        />
      );

      const rootElement = container.querySelector('.custom-class');
      expect(rootElement).toHaveClass('flex');
      expect(rootElement).toHaveClass('gap-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(1000);

      render(
        <ChatInput
          value={longMessage}
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(longMessage);
    });

    it('should handle special characters', () => {
      const specialMessage = "Test with émojis 🚀 and special chars: <>&\"'";

      render(
        <ChatInput
          value={specialMessage}
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(specialMessage);
    });

    it('should handle messages with newlines', () => {
      const multilineMessage = "Line 1\nLine 2\nLine 3";

      render(
        <ChatInput
          value={multilineMessage}
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue(multilineMessage);
    });

    it('should prevent sending on Enter with empty trimmed value', () => {
      // Create a string with actual newlines and spaces that trims to empty
      const whitespaceOnlyValue = '\n\n  \n';
      render(
        <ChatInput
          value={whitespaceOnlyValue}
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('Other Keyboard Keys', () => {
    it('should not interfere with other keys', () => {
      render(
        <ChatInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');

      // Try various keys that should not trigger send
      fireEvent.keyDown(textarea, { key: 'a', code: 'KeyA' });
      fireEvent.keyDown(textarea, { key: 'Space', code: 'Space' });
      fireEvent.keyDown(textarea, { key: 'Backspace', code: 'Backspace' });
      fireEvent.keyDown(textarea, { key: 'Tab', code: 'Tab' });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should not send on Ctrl+Enter', () => {
      render(
        <ChatInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', ctrlKey: true });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should not send on Alt+Enter', () => {
      render(
        <ChatInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', altKey: true });

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });
});
