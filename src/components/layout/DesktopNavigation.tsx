'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import {
  Home, BookOpen, MessageSquare, User, Trophy,
  Settings, LogOut, ChevronDown, Bell, Sun, Moon, Monitor,
  Swords, Users, Network
} from 'lucide-react';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

export default function DesktopNavigation() {
  const t = useTranslations('nav');
  const tp = useTranslations('profile');
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const navItems: NavItem[] = [
    { icon: Home, label: t('dashboard'), href: '/dashboard' },
    { icon: BookOpen, label: t('modules'), href: '/dashboard#modules' },
    { icon: MessageSquare, label: t('chat'), href: '/dashboard' },
    { icon: Trophy, label: t('progress'), href: '/dashboard#progress' },
    { icon: Swords, label: t('tournaments'), href: '/tournaments' },
    { icon: Users, label: t('teams'), href: '/teams' },
    { icon: Network, label: t('skillTree'), href: '/skill-tree' }
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Ne pas afficher sur les pages d'auth ou admin
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/register') || 
      pathname.startsWith('/admin') ||
      pathname === '/') {
    return null;
  }

  return (
    <nav className="bg-card border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-foreground">GENIA Web Training</h1>
        </div>

        {/* Navigation principale */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Menu utilisateur */}
        <div className="flex items-center space-x-4">
          {/* Quick Profile button */}
          <button
            onClick={() => router.push('/profile')}
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:text-foreground hover:bg-accent rounded-lg"
            title="Mon profil"
          >
            <User className="w-4 h-4" />
            {t('profile')}
          </button>
          {/* Sélecteur de thème */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent"
            >
              {resolvedTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground rounded-lg shadow-lg border py-2 z-50">
                <button
                  onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-accent ${
                    theme === 'light' ? 'text-primary bg-primary/10' : 'text-foreground'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  {tp('theme.light')}
                </button>
                <button
                  onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-accent ${
                    theme === 'dark' ? 'text-primary bg-primary/10' : 'text-foreground'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  {tp('theme.dark')}
                </button>
                <button
                  onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-accent ${
                    theme === 'system' ? 'text-primary bg-primary/10' : 'text-foreground'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  {tp('theme.system')}
                </button>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications */}
          {user?.id && <NotificationCenter userId={user.id} />}

          {/* Menu utilisateur */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                {user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground">
                  {user?.user_metadata?.full_name || 'Utilisateur'}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-popover text-popover-foreground rounded-lg shadow-lg border py-2 z-50">
                <button
                  onClick={() => {
                    router.push('/profile');
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                >
                  <User className="w-4 h-4" />
                  {t('myProfile')}
                </button>
                <button
                  onClick={() => {
                    router.push('/profile?tab=preferences');
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-foreground hover:bg-accent"
                >
                  <Settings className="w-4 h-4" />
                  {t('settings')}
                </button>
                <div className="border-t border-border my-1"></div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                  {t('signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
