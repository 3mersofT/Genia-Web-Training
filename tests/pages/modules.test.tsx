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
  useParams: () => ({ slug: 'fondamentaux' }),
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

const mockUseAuth = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
  useAuth: (...args: any[]) => mockUseAuth(...args),
}));

jest.mock('@/lib/data', () => ({
  getModuleBySlug: jest.fn().mockResolvedValue({
    slug: 'fondamentaux',
    title: 'Les Fondamentaux',
    description: 'Apprenez les bases du prompt engineering',
    color: 'from-blue-500 to-cyan-500',
    progress: 50,
    capsules: [
      {
        id: 'cap-1-1',
        title: 'Introduction au Prompt Engineering',
        order: 1,
        duration: 5,
        difficulty: 'beginner',
        completed: true,
        available: true,
        keyTakeaway: 'Comprendre les bases',
      },
      {
        id: 'cap-1-2',
        title: 'Structurer un prompt',
        order: 2,
        duration: 7,
        difficulty: 'beginner',
        completed: false,
        available: true,
        keyTakeaway: null,
      },
    ],
  }),
  getAllModulesWithProgress: jest.fn().mockResolvedValue([
    {
      slug: 'fondamentaux',
      title: 'Les Fondamentaux',
      description: 'Apprenez les bases du prompt engineering',
      color: 'from-blue-500 to-cyan-500',
      progress: 50,
      capsules: [
        {
          id: 'cap-1-1',
          title: 'Introduction au Prompt Engineering',
          order: 1,
          duration: 5,
          difficulty: 'beginner',
          completed: true,
          available: true,
        },
        {
          id: 'cap-1-2',
          title: 'Structurer un prompt',
          order: 2,
          duration: 7,
          difficulty: 'beginner',
          completed: false,
          available: true,
        },
      ],
    },
  ]),
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

jest.mock('@/components/certificates/CertificateButton', () =>
  function MockCertificateButton() {
    return <div data-testid="certificate-button" />;
  },
);

jest.mock('lucide-react', () => ({
  ArrowLeft: (props: any) => <svg data-testid="icon-arrow-left" {...props} />,
  Play: (props: any) => <svg data-testid="icon-play" {...props} />,
  Lock: (props: any) => <svg data-testid="icon-lock" {...props} />,
  CheckCircle: (props: any) => <svg data-testid="icon-check-circle" {...props} />,
  Clock: (props: any) => <svg data-testid="icon-clock" {...props} />,
  BookOpen: (props: any) => <svg data-testid="icon-book-open" {...props} />,
}));

// ── Import after mocks ──────────────────────────────────────────────────────
import ModulePage from '@/app/modules/[slug]/page';

// ── Helpers ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────────────────────

const mockData = require('@/lib/data');

const defaultModuleData = {
  slug: 'fondamentaux',
  title: 'Les Fondamentaux',
  description: 'Apprenez les bases du prompt engineering',
  color: 'from-blue-500 to-cyan-500',
  progress: 50,
  capsules: [
    {
      id: 'cap-1-1',
      title: 'Introduction au Prompt Engineering',
      order: 1,
      duration: 5,
      difficulty: 'beginner',
      completed: true,
      available: true,
      keyTakeaway: 'Comprendre les bases',
    },
    {
      id: 'cap-1-2',
      title: 'Structurer un prompt',
      order: 2,
      duration: 7,
      difficulty: 'beginner',
      completed: false,
      available: true,
      keyTakeaway: null,
    },
  ],
};

describe('ModulePage', () => {
  it('renders loading state', () => {
    // Override mock to never resolve so loading state stays
    mockData.getModuleBySlug.mockReturnValueOnce(new Promise(() => {}));
    mockUseAuth.mockReturnValue({ user: null });

    const { container } = render(<ModulePage />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders module content', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    mockData.getModuleBySlug.mockResolvedValue(defaultModuleData);

    render(<ModulePage />);

    await waitFor(() => {
      expect(screen.getByText('Plan du module')).toBeInTheDocument();
    });

    // Module description
    expect(
      screen.getByText('Apprenez les bases du prompt engineering'),
    ).toBeInTheDocument();

    // Capsule titles
    expect(
      screen.getByText(/Introduction au Prompt Engineering/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Structurer un prompt/)).toBeInTheDocument();
  });

  it('navigation works', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    mockData.getModuleBySlug.mockResolvedValue(defaultModuleData);
    mockData.getAllModulesWithProgress.mockResolvedValue([defaultModuleData]);

    render(<ModulePage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    // Dashboard link should be present
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');

    // Capsule link (Commencer button for available, non-completed capsule)
    const startButton = screen.getByText('Commencer');
    expect(startButton).toBeInTheDocument();
    expect(startButton.closest('a')).toHaveAttribute('href', '/capsules/cap-1-2');
  });
});
