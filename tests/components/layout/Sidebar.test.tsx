/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DesktopNavigation from '@/components/layout/DesktopNavigation';

const mockPush = jest.fn();
const mockSignOut = jest.fn();
const mockSetTheme = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      user_metadata: { display_name: 'Test User', full_name: 'Test User' },
    },
    signOut: mockSignOut,
  })),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    setTheme: mockSetTheme,
    resolvedTheme: 'light',
  })),
}));

jest.mock('@/components/notifications/NotificationCenter', () => {
  return function MockNotifCenter() {
    return <div data-testid="notif-center" />;
  };
});

jest.mock('@/components/ui/LanguageSwitcher', () => {
  return function MockLanguageSwitcher() {
    return <div data-testid="language-switcher" />;
  };
});

jest.mock('lucide-react', () => ({
  Home: (props: any) => <span data-testid="icon-home" {...props} />,
  BookOpen: (props: any) => <span {...props} />,
  MessageSquare: (props: any) => <span {...props} />,
  User: (props: any) => <span {...props} />,
  Trophy: (props: any) => <span {...props} />,
  Settings: (props: any) => <span {...props} />,
  LogOut: (props: any) => <span {...props} />,
  ChevronDown: (props: any) => <span {...props} />,
  Bell: (props: any) => <span {...props} />,
  Sun: (props: any) => <span {...props} />,
  Moon: (props: any) => <span {...props} />,
  Monitor: (props: any) => <span {...props} />,
  Swords: (props: any) => <span {...props} />,
  Users: (props: any) => <span {...props} />,
  Network: (props: any) => <span {...props} />,
  Menu: (props: any) => <span {...props} />,
  X: (props: any) => <span {...props} />,
  Flame: (props: any) => <span {...props} />,
}));

jest.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target: any, prop: string) => {
      return React.forwardRef((props: any, ref: any) => {
        const { initial, animate, exit, variants, whileHover, whileTap, transition, layout, layoutId, ...rest } = props;
        return React.createElement(prop, { ...rest, ref });
      });
    }
  }),
  AnimatePresence: ({ children }: any) => children,
  useInView: () => true,
}));

// Get references to mocked modules for per-test overrides
const { usePathname } = jest.requireMock('next/navigation') as { usePathname: jest.Mock };

describe('DesktopNavigation (Sidebar)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePathname.mockReturnValue('/dashboard');
  });

  it('renders navigation links', () => {
    render(<DesktopNavigation />);

    // Navigation labels come from t('key') mock which returns the key
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.getByText('modules')).toBeInTheDocument();
    expect(screen.getByText('chat')).toBeInTheDocument();
    expect(screen.getByText('tournaments')).toBeInTheDocument();
  });

  it('highlights active link based on current pathname', () => {
    render(<DesktopNavigation />);

    // The dashboard button should be active since pathname is /dashboard
    const dashboardButton = screen.getByText('dashboard').closest('button')!;
    expect(dashboardButton).toHaveClass('text-primary');
    expect(dashboardButton).toHaveClass('bg-primary/10');
  });

  it('shows user menu with profile info', () => {
    render(<DesktopNavigation />);

    // The user email should be visible
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    // The user display name should be shown (uses full_name from user_metadata)
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('does not render on auth pages', () => {
    usePathname.mockReturnValue('/login');

    const { container } = render(<DesktopNavigation />);

    // The component returns null on /login, so the container should be empty
    expect(container.innerHTML).toBe('');
  });
});
