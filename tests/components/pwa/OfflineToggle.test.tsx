/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OfflineToggle from '@/components/pwa/OfflineToggle';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react
jest.mock('lucide-react', () => new Proxy({}, {
  get: (_: any, name: string) => (props: any) => <span data-testid={`icon-${String(name)}`} {...props} />,
}));

// Mock useOffline hook
jest.mock('@/hooks/useOffline', () => ({
  useOffline: () => ({
    isCapsuleCached: jest.fn().mockReturnValue(false),
    cacheCapsule: jest.fn().mockResolvedValue(true),
    removeCapsule: jest.fn().mockResolvedValue(true),
    isCaching: false,
  }),
}));

const defaultCapsule = {
  id: 'cap-1',
  moduleId: 'mod-1',
  order: 1,
  title: 'Test',
  duration: 5,
  difficulty: 'beginner',
};

const defaultProps = {
  capsule: defaultCapsule,
  content: {},
  moduleTitle: 'Module 1',
};

describe('OfflineToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders download button when not cached (default variant)', () => {
    render(<OfflineToggle {...defaultProps} />);

    // Default variant shows "Disponible hors ligne" text when not cached
    expect(screen.getByText('Disponible hors ligne')).toBeInTheDocument();

    // The HardDrive icon is shown for the default uncached state
    expect(screen.getByTestId('icon-HardDrive')).toBeInTheDocument();
  });

  it('renders icon variant', () => {
    render(<OfflineToggle {...defaultProps} variant="icon" />);

    // Icon variant renders a button with the Download icon (not cached)
    const downloadIcon = screen.getByTestId('icon-Download');
    expect(downloadIcon).toBeInTheDocument();

    // Should have a title attribute for accessibility
    const button = downloadIcon.closest('button');
    expect(button).not.toBeNull();
    expect(button).toHaveAttribute('title', 'Rendre disponible hors ligne');
  });

  it('renders compact variant', () => {
    render(<OfflineToggle {...defaultProps} variant="compact" />);

    // Compact variant shows "Sauvegarder" text when not cached
    expect(screen.getByText('Sauvegarder')).toBeInTheDocument();

    // Download icon is also present
    expect(screen.getByTestId('icon-Download')).toBeInTheDocument();
  });
});
