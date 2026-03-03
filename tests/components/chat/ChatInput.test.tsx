/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from '@/components/chat/ChatInput';

describe('ChatInput', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    onSend: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<ChatInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', 'Pose ta question...');

    const sendButton = screen.getByRole('button', { name: /envoyer le message/i });
    expect(sendButton).toBeInTheDocument();
  });

  it('accepts text input and calls onChange', () => {
    const onChange = jest.fn();
    render(<ChatInput {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Hello GENIA' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('Hello GENIA');
  });

  it('submit button is disabled when input is empty', () => {
    render(<ChatInput {...defaultProps} value="" />);

    const sendButton = screen.getByRole('button', { name: /envoyer le message/i });
    expect(sendButton).toBeDisabled();
  });

  it('submit button is disabled when disabled=true', () => {
    render(<ChatInput {...defaultProps} value="Some text" disabled={true} />);

    const sendButton = screen.getByRole('button', { name: /envoyer le message/i });
    expect(sendButton).toBeDisabled();
  });

  it('calls onSend when clicking send button with non-empty input', () => {
    const onSend = jest.fn();
    render(<ChatInput {...defaultProps} value="Test message" onSend={onSend} />);

    const sendButton = screen.getByRole('button', { name: /envoyer le message/i });
    fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('calls onSend on Enter key press (without shift)', () => {
    const onSend = jest.fn();
    render(<ChatInput {...defaultProps} value="Test message" onSend={onSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('does not call onSend on Shift+Enter (adds newline)', () => {
    const onSend = jest.fn();
    render(<ChatInput {...defaultProps} value="Test message" onSend={onSend} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('uses custom placeholder text', () => {
    render(<ChatInput {...defaultProps} placeholder="Ask anything..." />);

    const textarea = screen.getByPlaceholderText('Ask anything...');
    expect(textarea).toBeInTheDocument();
  });

  it('has proper aria-label', () => {
    render(<ChatInput {...defaultProps} aria-label="Chat input field" />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-label', 'Chat input field');
  });
});
