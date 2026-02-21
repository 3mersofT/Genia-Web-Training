'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, X, Check, AlertTriangle, Info, CheckCircle, XCircle,
  Settings, Trash2, Filter
} from 'lucide-react';
import { notificationService, AdminNotification, NotificationType } from '@/lib/services/notificationService';

interface NotificationCenterProps {
  adminId: string;
  className?: string;
}

export default function NotificationCenter({ adminId, className = '' }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  useEffect(() => {
    loadNotifications();
    
    // S'abonner aux notifications temps réel
    const unsubscribe = notificationService.subscribe(adminId, (newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, [adminId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(adminId);
      setNotifications(data);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const success = await notificationService.markAsRead(notificationId);
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await notificationService.markAllAsRead(adminId);
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type: NotificationType, isRead: boolean) => {
    const opacity = isRead ? '50' : '100';
    switch (type) {
      case 'error': return `bg-red-${opacity}`;
      case 'warning': return `bg-yellow-${opacity}`;
      case 'success': return `bg-green-${opacity}`;
      default: return `bg-blue-${opacity}`;
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
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
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
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  {unreadCount} nouvelles
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700"
                  title="Marquer toutes comme lues"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-1 p-3 bg-gray-50 border-b">
            {[
              { key: 'all', label: 'Toutes', count: notifications.length },
              { key: 'error', label: 'Erreurs', count: notifications.filter(n => n.type === 'error').length },
              { key: 'warning', label: 'Alertes', count: notifications.filter(n => n.type === 'warning').length },
              { key: 'info', label: 'Infos', count: notifications.filter(n => n.type === 'info').length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  filter === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label} {count > 0 && `(${count})`}
              </button>
            ))}
          </div>

          {/* Liste notifications */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                Chargement...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium text-gray-900 ${
                            !notification.is_read ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.data && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                            {Object.entries(notification.data).map(([key, value]) => (
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
          <div className="p-3 bg-gray-50 border-t">
            <div className="flex justify-between items-center">
              <button
                onClick={() => {/* Ouvrir page de paramètres notifications */}}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                Paramètres
              </button>
              <button
                onClick={() => notificationService.cleanupOldNotifications(adminId)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
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
