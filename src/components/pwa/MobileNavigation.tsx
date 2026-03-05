'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, MessageSquare, User, Trophy } from 'lucide-react';
import { BRAND_NAME } from '@/config/branding';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

export default function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  const navItems: NavItem[] = [
    { icon: Home, label: 'Accueil', href: '/dashboard' },
    { icon: BookOpen, label: 'Modules', href: '/dashboard#modules' },
    { icon: MessageSquare, label: BRAND_NAME, href: '/dashboard' },
    { icon: Trophy, label: 'Progrès', href: '/dashboard#progress' },
    { icon: User, label: 'Profil', href: '/profile' }
  ];

  useEffect(() => {
    // Déterminer l'index actif basé sur le pathname
    const currentIndex = navItems.findIndex(item => 
      pathname.startsWith(item.href)
    );
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [pathname]);

  // Configuration des gestes de swipe
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (activeIndex < navItems.length - 1) {
        const nextIndex = activeIndex + 1;
        setActiveIndex(nextIndex);
        router.push(navItems[nextIndex].href);
      }
    },
    onSwipedRight: () => {
      if (activeIndex > 0) {
        const prevIndex = activeIndex - 1;
        setActiveIndex(prevIndex);
        router.push(navItems[prevIndex].href);
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  const handleNavClick = (index: number, href: string) => {
    setActiveIndex(index);
    
    // Vibration API (si supportée)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    router.push(href);
  };

  // Ne pas afficher sur les pages d'auth ou admin
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/register') || 
      pathname.startsWith('/admin') ||
      pathname === '/') {
    return null;
  }

  return (
    <>
      {/* Zone de swipe invisible en haut pour les gestes */}
      <div 
        {...swipeHandlers} 
        className="fixed top-0 left-0 right-0 h-20 z-40 md:hidden"
        style={{ touchAction: 'pan-y' }}
      />

      {/* Navigation mobile en bas */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-white/95 dark:bg-card/95 backdrop-blur-lg border-t border-border">
          {/* Indicateur de swipe */}
          <div className="h-1 bg-muted relative overflow-hidden">
            <motion.div
              className="absolute h-full bg-gradient-to-r from-blue-600 to-purple-600"
              initial={false}
              animate={{
                left: `${(activeIndex / navItems.length) * 100}%`,
                width: `${100 / navItems.length}%`
              }}
              transition={{ type: 'spring', damping: 30 }}
            />
          </div>

          <nav className="flex items-center justify-around py-2 px-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeIndex === index;
              
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(index, item.href)}
                  className="relative flex flex-col items-center justify-center py-2 px-3 flex-1 group"
                >
                  {/* Ripple effect on tap */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-gradient-to-r from-blue-100 dark:from-blue-900/30 to-purple-100 dark:to-purple-900/30 rounded-lg"
                      transition={{ type: 'spring', damping: 30 }}
                    />
                  )}

                  {/* Icon container */}
                  <div className="relative">
                    <Icon 
                      className={`w-6 h-6 transition-all duration-200 relative z-10 ${
                        isActive 
                          ? 'text-blue-600 scale-110' 
                          : 'text-muted-foreground group-active:scale-95'
                      }`}
                    />
                    
                    {/* Badge */}
                    {item.badge && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                      >
                        {item.badge}
                      </motion.div>
                    )}
                  </div>

                  {/* Label */}
                  <span 
                    className={`text-[10px] mt-1 transition-all duration-200 relative z-10 ${
                      isActive 
                        ? 'text-blue-600 font-medium' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Active dot indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"
                      />
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Safe area for iPhone notch */}
        <div className="h-safe-area-bottom bg-card" />
      </div>

      {/* Indicateur de geste (affiché brièvement au premier chargement) */}
      <AnimatePresence>
        {showBadge && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 md:hidden"
          >
            <div className="bg-black/80 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <span>👆</span>
              <span>Swipez pour naviguer</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
