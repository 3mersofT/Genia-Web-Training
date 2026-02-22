'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { useStudentNotifications } from '@/hooks/useStudentNotifications';

interface NotificationBellProps {
  userId: string | undefined;
  onClick?: () => void;
  className?: string;
}

export default function NotificationBell({ userId, onClick, className = '' }: NotificationBellProps) {
  const { unreadCount, loading } = useStudentNotifications(userId);

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 hover:text-gray-800 transition-colors ${className}`}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ''}`}
      disabled={loading}
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
