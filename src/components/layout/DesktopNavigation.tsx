'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Home, BookOpen, MessageSquare, User, Trophy,
  Settings, LogOut, ChevronDown, Bell, Sun, Moon, Monitor,
  Swords, Users, Network
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

export default function DesktopNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const navItems: NavItem[] = [
    { icon: Home, label: 'Accueil', href: '/dashboard' },
    { icon: BookOpen, label: 'Modules', href: '/dashboard#modules' },
    { icon: MessageSquare, label: 'GENIA', href: '/dashboard' },
    { icon: Trophy, label: 'Progrès', href: '/dashboard#progress' },
    { icon: Swords, label: 'Tournois', href: '/tournaments' },
    { icon: Users, label: 'Équipes', href: '/teams' },
    { icon: Network, label: 'Arbre de Compétences', href: '/skill-tree' }
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
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">GENIA Web Training</h1>
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
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
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
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
            title="Mon profil"
          >
            <User className="w-4 h-4" />
            Profil
          </button>
          {/* Sélecteur de thème */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
            >
              {resolvedTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 ${
                    theme === 'light' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Clair
                </button>
                <button
                  onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 ${
                    theme === 'dark' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Sombre
                </button>
                <button
                  onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 ${
                    theme === 'system' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  Système
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button 
            onClick={() => alert('Centre de notifications en cours de développement')}
            className="p-2 text-gray-400 hover:text-gray-600 relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Menu utilisateur */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                {user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.full_name || 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={() => {
                    router.push('/profile');
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  Mon Profil
                </button>
                <button
                  onClick={() => {
                    router.push('/profile?tab=preferences');
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  Préférences
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
