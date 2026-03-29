'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0, 0, 0.58, 1] }}
        >
          {children}
        </motion.main>
      </div>
    </PWAProvider>
  );
}
