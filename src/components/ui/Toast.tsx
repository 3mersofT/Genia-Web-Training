"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  durationMs?: number;
}

interface ToastContextValue {
  showSuccess: (message: string, title?: string, durationMs?: number) => void;
  showError: (message: string, title?: string, durationMs?: number) => void;
  showInfo: (message: string, title?: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within <ToastProvider>');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const timers = toasts.map(t => {
      const timeout = setTimeout(() => removeToast(t.id), t.durationMs ?? 2500);
      return () => clearTimeout(timeout);
    });
    return () => { timers.forEach(clear => clear()); };
  }, [toasts, removeToast]);

  const push = useCallback((type: ToastMessage['type'], message: string, title?: string, durationMs?: number) => {
    setToasts(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        type,
        title,
        message,
        durationMs
      }
    ]);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    showSuccess: (message, title, durationMs) => push('success', message, title, durationMs),
    showError: (message, title, durationMs) => push('error', message, title, durationMs),
    showInfo: (message, title, durationMs) => push('info', message, title, durationMs),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[100] space-y-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`min-w-[260px] max-w-[380px] rounded-lg shadow-lg border px-4 py-3 text-sm bg-white flex items-start gap-3 ${
              t.type === 'success' ? 'border-green-200' : t.type === 'error' ? 'border-red-200' : 'border-blue-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 ${
              t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`} />
            <div className="flex-1">
              {t.title && <div className="font-medium text-gray-800 mb-0.5">{t.title}</div>}
              <div className="text-gray-700">{t.message}</div>
            </div>
            <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
