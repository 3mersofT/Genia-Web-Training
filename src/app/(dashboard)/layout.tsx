'use client';

import React from 'react';
import PWAProvider from '@/components/providers/PWAProvider';
import DesktopNavigation from '@/components/layout/DesktopNavigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PWAProvider>
      <div className="min-h-screen bg-background">
        <DesktopNavigation />
        <main>
          {children}
        </main>
      </div>
    </PWAProvider>
  );
}
