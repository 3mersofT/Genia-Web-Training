/**
 * Unit Tests for chat-export module
 *
 * Tests verify:
 * 1. exportToMarkdown generates valid markdown with metadata
 * 2. exportToMarkdown includes all message types correctly
 */

import type { Message, ChatContext } from '@/types/chat.types';

// Capture the blob content passed to URL.createObjectURL
let capturedBlobContent = '';
const mockClick = jest.fn();

beforeAll(() => {
  global.URL.createObjectURL = jest.fn((blob: Blob) => {
    // Read blob synchronously via FileReaderSync not available, so store for later
    return 'blob:test';
  });
  global.URL.revokeObjectURL = jest.fn();

  jest.spyOn(document, 'createElement').mockReturnValue({
    href: '',
    download: '',
    click: mockClick,
  } as any);
});

// Instead of trying to read the blob, we'll test the function indirectly
// by verifying it calls the right browser APIs and doesn't throw.

const mockContext: ChatContext = {
  currentCapsule: {
    id: 'test-capsule',
    title: 'Test Capsule',
    concepts: ['Concept A', 'Concept B'],
    difficulty: 'beginner',
  },
  userLevel: 'beginner',
  completedCapsules: 5,
  totalCapsules: 36,
  streakDays: 3,
};

const mockMessages: Message[] = [
  {
    id: '1',
    role: 'system',
    content: 'Bienvenue sur GENIA!',
    timestamp: new Date('2024-01-15T10:00:00'),
  },
  {
    id: '2',
    role: 'user',
    content: 'Bonjour, aide-moi avec le prompting',
    timestamp: new Date('2024-01-15T10:01:00'),
  },
  {
    id: '3',
    role: 'assistant',
    content: '**Voici** une explication du prompting.',
    timestamp: new Date('2024-01-15T10:02:00'),
    methodStep: 'G',
  },
  {
    id: '4',
    role: 'assistant',
    content: 'Réponse avec raisonnement.',
    timestamp: new Date('2024-01-15T10:03:00'),
    reasoning: 'Analyse: étape 1, étape 2',
    methodStep: 'E',
  },
];

describe('exportToMarkdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a downloadable markdown file', () => {
    const { exportToMarkdown } = require('@/lib/chat-export');
    exportToMarkdown(mockMessages, mockContext);

    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('should create a Blob with text/markdown type', () => {
    const { exportToMarkdown } = require('@/lib/chat-export');
    exportToMarkdown(mockMessages, mockContext);

    const blobArg = (global.URL.createObjectURL as jest.Mock).mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe('text/markdown;charset=utf-8');
  });

  it('should set correct download filename', () => {
    const { exportToMarkdown } = require('@/lib/chat-export');
    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
    };
    (document.createElement as jest.Mock).mockReturnValue(mockLink);

    exportToMarkdown(mockMessages, mockContext);

    expect(mockLink.download).toMatch(/^genia-chat-\d{4}-\d{2}-\d{2}\.md$/);
  });

  it('should handle empty messages array without error', () => {
    const { exportToMarkdown } = require('@/lib/chat-export');
    expect(() => exportToMarkdown([], mockContext)).not.toThrow();
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('should handle messages without method step', () => {
    const { exportToMarkdown } = require('@/lib/chat-export');
    const msgs: Message[] = [
      {
        id: '1',
        role: 'assistant',
        content: 'Plain response',
        timestamp: new Date(),
      },
    ];
    expect(() => exportToMarkdown(msgs, mockContext)).not.toThrow();
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('should include markdown content in the blob', (done) => {
    const { exportToMarkdown } = require('@/lib/chat-export');
    exportToMarkdown(mockMessages, mockContext);

    const blob = (global.URL.createObjectURL as jest.Mock).mock.calls[0][0] as Blob;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      expect(content).toContain('# Conversation GENIA');
      expect(content).toContain('Test Capsule');
      expect(content).toContain('beginner');
      expect(content).toContain('### Vous');
      expect(content).toContain('### GENIA [G]');
      expect(content).toContain('### GENIA [E]');
      expect(content).toContain('Analyse');
      expect(content).toContain('Bienvenue sur GENIA!');
      done();
    };
    reader.readAsText(blob);
  });
});
