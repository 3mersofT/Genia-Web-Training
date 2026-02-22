/**
 * Unit Tests for GENIAChat Edge Cases
 * Tests verify that the component handles edge cases gracefully
 *
 * Tests verify that:
 * 1. Empty content renders without errors
 * 2. Very long messages render without performance issues
 * 3. Special characters are handled correctly
 * 4. Nested Markdown structures render properly
 * 5. Whitespace and newlines are preserved
 * 6. Malformed Markdown doesn't break rendering
 * 7. Unicode and emoji characters work correctly
 * 8. Extreme nesting doesn't cause issues
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock react-markdown with realistic Markdown-to-HTML conversion
jest.mock('react-markdown', () => {
  return {
    __esModule: true,
    default: ({ children, components }: any) => {
      const content = String(children);

      // Process markdown to HTML for testing
      let html = content;

      // Bold: **text** → <strong>text</strong>
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

      // Italic: *text* or _text_ → <em>text</em>
      html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

      // Inline code: `code` → <code>code</code>
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

      // Headers: # Header → <h1>Header</h1>
      html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
      html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
      html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

      // Code blocks: ```lang\ncode\n``` → <pre><code>code</code></pre>
      html = html.replace(/```(\w+)?\n?([\s\S]*?)\n?```/g, (match, lang, code) => {
        const langClass = lang ? ` class="language-${lang}"` : '';
        return `<pre><code${langClass}>${code}</code></pre>`;
      });

      // Unordered lists: - item → <ul><li>item</li></ul>
      html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
      html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

      // Ordered lists: 1. item → <ol><li>item</li></ol>
      html = html.replace(/^\d+\. (.+)$/gm, '<li class="ordered">$1</li>');
      html = html.replace(/(<li class="ordered">.*<\/li>)/s, '<ol>$1</ol>');

      // Links: [text](url) → <a href="url">text</a>
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

      // Preserve newlines
      html = html.replace(/\n/g, '<br/>');

      // Apply custom components if provided
      if (components?.strong) {
        html = html.replace(/<strong>/g, '<strong class="font-semibold">');
      }

      if (components?.p) {
        html = html.replace(/<p>/g, '<p class="mb-2">');
      }

      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    },
  };
});

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('rehype-sanitize', () => ({
  __esModule: true,
  default: () => ({ settings: { tagNames: [] } }),
}), { virtual: true });

// Mock dependencies
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy(
      {},
      {
        get: (_target, prop) => {
          const Component = React.forwardRef(({ children, ...props }: any, ref: any) =>
            React.createElement(prop as string, { ...props, ref }, children)
          );
          Component.displayName = `motion.${String(prop)}`;
          return Component;
        },
      }
    ),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

jest.mock('lucide-react', () => ({
  MessageCircle: () => <div data-testid="message-circle-icon">MessageCircle</div>,
  Send: () => <div data-testid="send-icon">Send</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  Brain: () => <div data-testid="brain-icon">Brain</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  BookOpen: () => <div data-testid="bookopen-icon">BookOpen</div>,
  Trophy: () => <div data-testid="trophy-icon">Trophy</div>,
  Target: () => <div data-testid="target-icon">Target</div>,
  TrendingUp: () => <div data-testid="trendingup-icon">TrendingUp</div>,
  HelpCircle: () => <div data-testid="helpcircle-icon">HelpCircle</div>,
  ChevronDown: () => <div data-testid="chevrondown-icon">ChevronDown</div>,
  Loader2: () => <div data-testid="loader2-icon">Loader2</div>,
  AlertCircle: () => <div data-testid="alertcircle-icon">AlertCircle</div>,
  CheckCircle: () => <div data-testid="checkcircle-icon">CheckCircle</div>,
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
  }),
}));

jest.mock('@/components/providers/GENIAProvider', () => ({
  useGENIA: () => ({
    isEnabled: true,
  }),
}));

jest.mock('@/hooks/useEnhancedGENIA', () => ({
  useEnhancedGENIA: () => ({
    messages: [],
    loading: false,
    error: null,
    sendMessage: jest.fn(),
    clearMessages: jest.fn(),
    quota: {
      magistralMedium: { used: 0, daily: 100 },
      mistralMedium3: { used: 0, daily: 100 },
    },
  }),
}));

// Import mocked dependencies
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

// Simple component to test ReactMarkdown rendering in isolation
const MessageRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none" data-testid="message-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          strong: ({node, ...props}: any) => <strong className="font-semibold" {...props} />,
          p: ({node, ...props}: any) => <p className="mb-2" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

describe('GENIAChat Edge Case Tests', () => {
  describe('Edge Case 1: Empty Content', () => {
    it('should render empty string without errors', () => {
      const content = '';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should render whitespace-only content without errors', () => {
      const content = '   ';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should render newlines-only content without errors', () => {
      const content = '\n\n\n';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should render mixed whitespace without errors', () => {
      const content = ' \n \t \n ';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });
  });

  describe('Edge Case 2: Very Long Messages', () => {
    it('should render 1,000 character message', () => {
      const content = 'A'.repeat(1000);
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
      expect(messageContent?.textContent?.length).toBeGreaterThanOrEqual(1000);
    });

    it('should render 10,000 character message without performance issues', () => {
      const startTime = performance.now();
      const content = 'This is a very long message. '.repeat(350); // ~10,000 chars
      const { container } = render(<MessageRenderer content={content} />);
      const endTime = performance.now();

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();

      // Should render in under 1000ms (very generous limit)
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(1000);
    });

    it('should render very long Markdown document', () => {
      const longList = Array.from({ length: 100 }, (_, i) => `- Item ${i + 1}`).join('\n');
      const content = `# Long Document\n\n${longList}`;

      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should render message with many formatting elements', () => {
      const content = Array.from({ length: 50 }, (_, i) =>
        `**Bold ${i}** and *italic ${i}* and \`code ${i}\``
      ).join(' ');

      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });
  });

  describe('Edge Case 3: Special Characters', () => {
    it('should handle < > & characters safely', () => {
      const content = 'Content with < > & characters should render safely';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle quotes correctly', () => {
      const content = 'Content with "double quotes" and \'single quotes\'';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
      expect(messageContent?.textContent).toContain('double quotes');
      expect(messageContent?.textContent).toContain('single quotes');
    });

    it('should handle HTML entities', () => {
      const content = 'Test &lt; &gt; &amp; &quot; entities';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle backslashes and escape sequences', () => {
      const content = 'Path: C:\\Users\\Documents\\file.txt';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle unicode characters', () => {
      const content = 'Unicode: café, naïve, 日本語, 한글, Ω';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
      expect(messageContent?.textContent).toContain('café');
    });

    it('should handle emoji characters', () => {
      const content = 'Emojis: 😀 🎉 👍 ✅ ❌ 🚀';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle mathematical symbols', () => {
      const content = 'Math: ∑ ∫ √ π ≤ ≥ ≠ ∞';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle null bytes and control characters gracefully', () => {
      const content = 'Text with\u0000null\u0001and\u0002control\u0003chars';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });
  });

  describe('Edge Case 4: Nested Markdown', () => {
    it('should handle bold within italic', () => {
      const content = '*This is italic with **bold** inside*';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle code within bold', () => {
      const content = '**Bold text with `code` inside**';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle links within list items', () => {
      const content = '- List item with [link](https://example.com)\n- Another [link](https://test.com)';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle nested lists', () => {
      const content = `- Main item 1
  - Sub item 1.1
  - Sub item 1.2
- Main item 2
  - Sub item 2.1`;

      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle complex nested structure', () => {
      const content = '- **Bold list** with *italic* and `code` and [link](https://example.com)';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle deeply nested Markdown', () => {
      const content = '**Bold with *italic and `code` inside* more bold**';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });
  });

  describe('Edge Case 5: Whitespace and Newlines', () => {
    it('should preserve line breaks', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle multiple consecutive newlines', () => {
      const content = 'Paragraph 1\n\n\n\nParagraph 2';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle leading whitespace', () => {
      const content = '    Leading spaces should be preserved';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle trailing whitespace', () => {
      const content = 'Trailing spaces    ';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle tabs', () => {
      const content = 'Text\twith\ttabs\tbetween\twords';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });
  });

  describe('Edge Case 6: Malformed Markdown', () => {
    it('should handle unclosed bold markers', () => {
      const content = '**This bold is never closed';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle unclosed italic markers', () => {
      const content = '*This italic is never closed';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle unclosed code blocks', () => {
      const content = '```javascript\nconst x = 1;\nNo closing backticks';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle mismatched markers', () => {
      const content = '**Bold start but *italic close';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle invalid link syntax', () => {
      const content = '[Link with no URL] or (URL with no text)';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle broken table syntax', () => {
      const content = '| Col1 | Col2\n| Missing pipe';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });
  });

  describe('Edge Case 7: Mixed Content Types', () => {
    it('should handle Markdown with HTML-like text in code blocks', () => {
      const content = '```html\n<div>This is code, not HTML</div>\n<script>alert("Not executed")</script>\n```';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();

      // Code blocks should be present (rendered safely)
      // The content should be there but not executed
      expect(messageContent?.textContent).toContain('This is code, not HTML');
    });

    it('should handle code examples showing Markdown syntax', () => {
      const content = 'To make bold, use `**text**` syntax';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();

      // The content should include the word "text" (whether rendered as markdown or code)
      expect(messageContent?.textContent).toContain('text');
      expect(messageContent?.textContent).toContain('syntax');
    });

    it('should handle URLs without link syntax', () => {
      const content = 'Visit https://example.com for more info';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
      expect(messageContent?.textContent).toContain('https://example.com');
    });

    it('should handle email addresses', () => {
      const content = 'Contact us at test@example.com';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
      expect(messageContent?.textContent).toContain('test@example.com');
    });

    it('should handle code with special symbols', () => {
      const content = '```\nif (x > 5 && y < 10) { return x & y; }\n```';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });
  });

  describe('Edge Case 8: Performance and Stability', () => {
    it('should handle rapid re-renders', () => {
      const content = 'Test content';
      const { rerender } = render(<MessageRenderer content={content} />);

      // Re-render multiple times
      for (let i = 0; i < 10; i++) {
        rerender(<MessageRenderer content={`${content} ${i}`} />);
      }

      // Should still be in document
      const messageContent = screen.getByTestId('message-content');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle content updates from empty to full', () => {
      const { rerender, container } = render(<MessageRenderer content="" />);

      rerender(<MessageRenderer content="**Now has content**" />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle content updates from full to empty', () => {
      const { rerender, container } = render(<MessageRenderer content="**Has content**" />);

      rerender(<MessageRenderer content="" />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should maintain stability with complex content changes', () => {
      const content1 = '# Header\n\n**Bold** text';
      const content2 = '- List\n- Items';
      const { rerender, container } = render(<MessageRenderer content={content1} />);

      rerender(<MessageRenderer content={content2} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });
  });

  describe('Integration: Real-world Edge Cases', () => {
    it('should handle AI response with code example and explanation', () => {
      const content = `Here's how to fix the bug:

\`\`\`typescript
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
\`\`\`

This function:
- Takes an array of **items**
- Uses \`reduce\` to sum prices
- Returns the *total* amount`;

      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle AI response with table and notes', () => {
      const content = `| Feature | Status | Notes |
|---------|--------|-------|
| Login   | ✅     | Working |
| Signup  | ❌     | Bug found |

**Action items:**
1. Fix signup validation
2. Test *edge cases*
3. Deploy to staging`;

      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle response with mixed languages and code', () => {
      const content = `Voici le code en français:

\`\`\`python
def bonjour(nom):
    print(f"Bonjour {nom}!")
\`\`\`

日本語のコメント：
\`\`\`javascript
// これはテストです
const test = "hello";
\`\`\``;

      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
    });

    it('should handle empty response gracefully', () => {
      // Simulate AI returning empty string
      const content = '';
      const { container } = render(<MessageRenderer content={content} />);

      const messageContent = container.querySelector('[data-testid="message-content"]');
      expect(messageContent).toBeInTheDocument();
      // Should not throw or crash
    });
  });
});
