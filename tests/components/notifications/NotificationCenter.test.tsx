/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { studentNotificationService } from '@/lib/services/studentNotificationService';

jest.mock('@/lib/services/studentNotificationService', () => ({
  studentNotificationService: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    cleanupOldNotifications: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
  },
}));

jest.mock('lucide-react', () => ({
  Bell: (props: any) => <span data-testid="bell-icon" {...props} />,
  Check: (props: any) => <span {...props} />,
  CheckCheck: (props: any) => <span {...props} />,
  Trash2: (props: any) => <span {...props} />,
  Settings: (props: any) => <span {...props} />,
  Filter: (props: any) => <span {...props} />,
  Trophy: (props: any) => <span {...props} />,
  Flame: (props: any) => <span {...props} />,
  Award: (props: any) => <span {...props} />,
  MessageSquare: (props: any) => <span {...props} />,
  BookOpen: (props: any) => <span {...props} />,
  Brain: (props: any) => <span {...props} />,
  X: (props: any) => <span {...props} />,
  AlertTriangle: (props: any) => <span {...props} />,
  Info: (props: any) => <span {...props} />,
  CheckCircle: (props: any) => <span {...props} />,
  XCircle: (props: any) => <span {...props} />,
  Target: (props: any) => <span {...props} />,
  Users: (props: any) => <span {...props} />,
  Lightbulb: (props: any) => <span {...props} />,
}));

const mockGetNotifications = studentNotificationService.getNotifications as jest.Mock;
const mockMarkAsRead = studentNotificationService.markAsRead as jest.Mock;
const mockSubscribe = studentNotificationService.subscribe as jest.Mock;

const sampleNotifications = [
  {
    id: 'notif-1',
    user_id: 'user-1',
    type: 'badge_earned' as const,
    title: 'Nouveau badge obtenu',
    message: 'Vous avez obtenu le badge Explorer!',
    is_read: false,
    created_at: new Date().toISOString(),
    data: {},
  },
  {
    id: 'notif-2',
    user_id: 'user-1',
    type: 'daily_challenge' as const,
    title: 'Defi quotidien disponible',
    message: 'Un nouveau defi vous attend.',
    is_read: true,
    created_at: new Date().toISOString(),
    data: {},
  },
];

describe('NotificationCenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNotifications.mockResolvedValue([]);
    mockSubscribe.mockReturnValue(jest.fn());
  });

  it('renders bell icon', async () => {
    await act(async () => {
      render(<NotificationCenter userId="user-1" />);
    });

    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
  });

  it('shows unread count badge when notifications exist', async () => {
    mockGetNotifications.mockResolvedValue(sampleNotifications);

    await act(async () => {
      render(<NotificationCenter userId="user-1" />);
    });

    // 1 unread notification out of 2
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('renders notification list when opened', async () => {
    mockGetNotifications.mockResolvedValue(sampleNotifications);

    await act(async () => {
      render(<NotificationCenter userId="user-1" />);
    });

    // Wait for notifications to load
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Click the bell button to open the panel
    const bellButton = screen.getByTestId('bell-icon').closest('button')!;
    await act(async () => {
      fireEvent.click(bellButton);
    });

    // The panel should now show the notification titles
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Nouveau badge obtenu')).toBeInTheDocument();
    expect(screen.getByText('Defi quotidien disponible')).toBeInTheDocument();
  });

  it('marks notification as read when clicking an unread notification', async () => {
    mockGetNotifications.mockResolvedValue(sampleNotifications);
    mockMarkAsRead.mockResolvedValue(true);

    await act(async () => {
      render(<NotificationCenter userId="user-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Open the notification panel
    const bellButton = screen.getByTestId('bell-icon').closest('button')!;
    await act(async () => {
      fireEvent.click(bellButton);
    });

    // Click the unread notification
    const unreadNotification = screen.getByText('Nouveau badge obtenu').closest('div[class*="cursor-pointer"]')!;
    await act(async () => {
      fireEvent.click(unreadNotification);
    });

    expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
  });
});
