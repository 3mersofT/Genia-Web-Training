import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StudentNotification } from '@/types/notifications.types';

interface UseStudentNotificationsReturn {
  notifications: StudentNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
}

export function useStudentNotifications(userId: string | undefined): UseStudentNotificationsReturn {
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('student_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setNotifications(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur chargement notifications';
      setError(errorMessage);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    if (!userId) return;

    loadNotifications();

    // S'abonner aux notifications temps réel
    const subscription = supabase
      .channel('student-notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'student_notifications',
        filter: `user_id=eq.${userId}`
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, loadNotifications, supabase]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('student_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (updateError) throw updateError;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );

      return true;
    } catch (err) {
      return false;
    }
  }, [supabase]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error: updateError } = await supabase
        .from('student_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (updateError) throw updateError;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );

      return true;
    } catch (err) {
      return false;
    }
  }, [userId, supabase]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications: loadNotifications
  };
}
