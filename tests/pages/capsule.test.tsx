/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'cap-1-1' }),
}));

jest.mock('next/link', () =>
  function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
);

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
  }),
}));

jest.mock('@/lib/data', () => ({
  getCapsuleById: jest.fn().mockResolvedValue({
    id: 'cap-1-1',
    title: 'Test Capsule',
    order: 1,
    duration: 5,
    difficulty: 'beginner',
    moduleId: 'mod-1',
  }),
  getCapsuleContent: jest.fn().mockResolvedValue({
    sections: {
      hook: { text: 'Hook text' },
      concept: { content: 'Concept content' },
    },
  }),
  getNextCapsule: jest.fn().mockResolvedValue(null),
  getPreviousCapsule: jest.fn().mockResolvedValue(null),
  getModuleBySlug: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

// Mock child components
jest.mock('@/components/feedback/FeedbackButton', () =>
  function MockFeedbackButton() {
    return <div data-testid="feedback-button" />;
  },
);

jest.mock('@/components/feedback/FeedbackStats', () =>
  function MockFeedbackStats() {
    return <div data-testid="feedback-stats" />;
  },
);

jest.mock('@/components/capsule/RichContentRenderer', () =>
  function MockRichContentRenderer() {
    return <div data-testid="rich-content-renderer" />;
  },
);

jest.mock('@/components/capsule/CodeBlock', () =>
  function MockCodeBlock() {
    return <div data-testid="code-block" />;
  },
);

jest.mock('@/components/pwa/OfflineToggle', () =>
  function MockOfflineToggle() {
    return <div data-testid="offline-toggle" />;
  },
);

jest.mock('react-markdown', () =>
  function MockReactMarkdown(props: any) {
    return <div data-testid="react-markdown">{props.children}</div>;
  },
);

jest.mock('remark-gfm', () => () => {});
jest.mock('rehype-sanitize', () => () => {});

jest.mock('lucide-react', () => ({
  ArrowLeft: (props: any) => <svg data-testid="icon-arrow-left" {...props} />,
  ArrowRight: (props: any) => <svg data-testid="icon-arrow-right" {...props} />,
  Play: (props: any) => <svg data-testid="icon-play" {...props} />,
  CheckCircle: (props: any) => <svg data-testid="icon-check-circle" {...props} />,
  Clock: (props: any) => <svg data-testid="icon-clock" {...props} />,
  BookOpen: (props: any) => <svg data-testid="icon-book-open" {...props} />,
  Target: (props: any) => <svg data-testid="icon-target" {...props} />,
  Lightbulb: (props: any) => <svg data-testid="icon-lightbulb" {...props} />,
  Trophy: (props: any) => <svg data-testid="icon-trophy" {...props} />,
  ChevronLeft: (props: any) => <svg data-testid="icon-chevron-left" {...props} />,
  ChevronRight: (props: any) => <svg data-testid="icon-chevron-right" {...props} />,
}));

// ── Import after mocks ──────────────────────────────────────────────────────
import CapsulePage from '@/app/capsules/[id]/page';

// ── Helpers ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────────────────────

const mockData = require('@/lib/data');

describe('CapsulePage', () => {
  it('renders loading state initially', () => {
    // Override to delay resolution so loading state is visible
    mockData.getCapsuleById.mockReturnValueOnce(new Promise(() => {}));

    const { container } = render(<CapsulePage />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders capsule title after load', async () => {
    // Restore default resolved values after the loading test override
    mockData.getCapsuleById.mockResolvedValue({
      id: 'cap-1-1',
      title: 'Test Capsule',
      order: 1,
      duration: 5,
      difficulty: 'beginner',
      moduleId: 'mod-1',
    });
    mockData.getCapsuleContent.mockResolvedValue({
      sections: {
        hook: { text: 'Hook text' },
        concept: { content: 'Concept content' },
      },
    });
    mockData.getNextCapsule.mockResolvedValue(null);
    mockData.getPreviousCapsule.mockResolvedValue(null);
    mockData.getModuleBySlug.mockResolvedValue(null);

    render(<CapsulePage />);

    await waitFor(() => {
      expect(screen.getByText('Test Capsule')).toBeInTheDocument();
    });
  });

  it('renders section navigation', async () => {
    mockData.getCapsuleById.mockResolvedValue({
      id: 'cap-1-1',
      title: 'Test Capsule',
      order: 1,
      duration: 5,
      difficulty: 'beginner',
      moduleId: 'mod-1',
    });
    mockData.getCapsuleContent.mockResolvedValue({
      sections: {
        hook: { text: 'Hook text' },
        concept: { content: 'Concept content' },
      },
    });
    mockData.getNextCapsule.mockResolvedValue(null);
    mockData.getPreviousCapsule.mockResolvedValue(null);
    mockData.getModuleBySlug.mockResolvedValue(null);

    render(<CapsulePage />);

    await waitFor(() => {
      expect(screen.getByText('Navigation')).toBeInTheDocument();
    });

    // The section navigation should include section buttons based on available sections
    expect(screen.getByText('Accroche')).toBeInTheDocument();
    expect(screen.getByText('Concept')).toBeInTheDocument();
  });
});
