'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les erreurs SSR
const InstallPWA = dynamic(() => import('@/components/pwa/InstallPWA'), { 
  ssr: false 
});

const NetworkStatus = dynamic(() => import('@/components/pwa/NetworkStatus'), { 
  ssr: false 
});

const MobileNavigation = dynamic(() => import('@/components/pwa/MobileNavigation'), { 
  ssr: false 
});

interface PWAProviderProps {
  children: React.ReactNode;
}

export default function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Enregistrer le service worker (déjà géré par next-pwa, mais on peut ajouter des logs)
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            console.log('✅ Service Worker déjà enregistré:', registration.scope);
            
            // Vérifier les mises à jour
            registration.update().catch(error => {
              console.error('Erreur mise à jour SW:', error);
            });
          }
        });
      });
    }

    // Gérer les mises à jour du service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Nouveau service worker activé, rechargement...');
        window.location.reload();
      });
    }

    // Ajouter les classes pour safe areas iOS
    const addSafeAreaClasses = () => {
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (isIOS) {
        document.documentElement.classList.add('ios');
        
        // Ajouter les styles pour les safe areas
        const style = document.createElement('style');
        style.textContent = `
          .h-safe-area-bottom {
            height: env(safe-area-inset-bottom);
          }
          .pb-safe-area-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
          .mb-safe-area-bottom {
            margin-bottom: env(safe-area-inset-bottom);
          }
        `;
        document.head.appendChild(style);
      }
    };

    addSafeAreaClasses();

    // Désactiver le zoom sur double tap (iOS)
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', preventDoubleTapZoom, false);

    // Ajouter la classe pour identifier que c'est une PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      document.documentElement.classList.add('pwa-standalone');
    }

    // Gérer l'orientation
    const handleOrientationChange = () => {
      const orientation = window.screen.orientation?.type || 'portrait-primary';
      document.documentElement.setAttribute('data-orientation', orientation);
    };

    if (window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
      handleOrientationChange();
    }

    // Optimisations pour les performances mobiles
    const optimizeForMobile = () => {
      // Désactiver les animations si la batterie est faible
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          if (battery.level < 0.2 && !battery.charging) {
            document.documentElement.classList.add('reduce-motion');
          }

          battery.addEventListener('levelchange', () => {
            if (battery.level < 0.2 && !battery.charging) {
              document.documentElement.classList.add('reduce-motion');
            } else {
              document.documentElement.classList.remove('reduce-motion');
            }
          });
        });
      }

      // Détecter la connexion lente
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        
        const updateConnectionStatus = () => {
          if (connection.saveData || connection.effectiveType === '2g') {
            document.documentElement.classList.add('save-data');
          } else {
            document.documentElement.classList.remove('save-data');
          }
        };

        connection.addEventListener('change', updateConnectionStatus);
        updateConnectionStatus();
      }
    };

    optimizeForMobile();

    // Cleanup
    return () => {
      document.removeEventListener('touchend', preventDoubleTapZoom);
      if (window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleOrientationChange);
      }
    };
  }, []);

  return (
    <>
      {children}
      <InstallPWA />
      <NetworkStatus />
      <MobileNavigation />
    </>
  );
}
