'use client';

import React from 'react';
import PWAProvider from '@/components/providers/PWAProvider';
import { ToastProvider } from '@/components/ui/Toast';
import DesktopNavigation from '@/components/layout/DesktopNavigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PWAProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
          <DesktopNavigation />
          <main>
            {children}
          </main>
        </div>
      </ToastProvider>
    </PWAProvider>
  );
}
