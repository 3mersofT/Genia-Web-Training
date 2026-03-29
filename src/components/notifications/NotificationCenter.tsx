'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle,
  Settings, Trash2, Filter, Trophy, Target, Flame, Users, BookOpen, Lightbulb
} from 'lucide-react';
import { studentNotificationService } from '@/lib/services/studentNotificationService';
import type { StudentNotification, NotificationType } from '@/types/notifications.types';

interface NotificationCenterProps {
  userId: string;
  className?: string;
}

export default function NotificationCenter({ userId, className = '' }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<StudentNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  useEffect(() => {
    loadNotifications();

    // S'abonner aux notifications temps réel
    const unsubscribe = studentNotificationService.subscribe(userId, (newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, [userId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await studentNotificationService.getNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await studentNotificationService.markAsRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await studentNotificationService.markAllAsRead(userId);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'daily_challenge': return <Target className="w-5 h-5 text-blue-500" />;
      case 'streak_reminder': return <Flame className="w-5 h-5 text-orange-500" />;
      case 'badge_earned': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'peer_review': return <Users className="w-5 h-5 text-purple-500" />;
      case 'new_module': return <BookOpen className="w-5 h-5 text-green-500" />;
      case 'ai_nudge': return <Lightbulb className="w-5 h-5 text-indigo-500" />;
      default: return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationLabel = (type: NotificationType) => {
    switch (type) {
      case 'daily_challenge': return 'Défis quotidiens';
      case 'streak_reminder': return 'Rappels de série';
      case 'badge_earned': return 'Badges';
      case 'peer_review': return 'Reviews';
      case 'new_module': return 'Nouveaux modules';
      case 'ai_nudge': return 'Suggestions IA';
      default: return 'Autres';
    }
  };

  const filteredNotifications = notifications.filter(n =>
    filter === 'all' || n.type === filter
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}j`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel notifications */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-card rounded-xl shadow-2xl border border-border z-50">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-xs font-medium">
                  {unreadCount} nouvelles
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary hover:text-primary/80"
                  title="Marquer toutes comme lues"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-1 p-3 bg-muted border-b overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-card text-muted-foreground hover:bg-accent'
              }`}
            >
              Toutes {notifications.length > 0 && `(${notifications.length})`}
            </button>
            {(['daily_challenge', 'streak_reminder', 'badge_earned', 'peer_review', 'new_module', 'ai_nudge'] as NotificationType[]).map((type) => {
              const count = notifications.filter(n => n.type === type).length;
              if (count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap ${
                    filter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-card text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {getNotificationLabel(type)} ({count})
                </button>
              );
            })}
          </div>

          {/* Liste notifications */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                Chargement...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Bell className="w-8 h-8 text-primary/60" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Aucune notification</p>
                <p className="text-xs text-muted-foreground">Tu es a jour !</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-accent transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium text-foreground ${
                            !notification.is_read ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.data && Object.keys(notification.data).length > 0 && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
                            {Object.entries(notification.data)
                              .filter(([key]) => !['event'].includes(key))
                              .map(([key, value]) => (
                                <div key={key} className="truncate">
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-muted border-t">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {/* Ouvrir page de paramètres notifications */}}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                Paramètres
              </button>
              <button
                onClick={() => studentNotificationService.cleanupOldNotifications(userId)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Nettoyer anciennes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
