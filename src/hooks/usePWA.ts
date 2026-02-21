import { useState, useEffect, useCallback } from 'react';

interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAReturn {
  isInstalled: boolean;
  isInstallable: boolean;
  isOffline: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  installApp: () => Promise<void>;
  showIOSInstructions: boolean;
  setShowIOSInstructions: (show: boolean) => void;
  deferredPrompt: PWAInstallPrompt | null;
  canInstall: boolean;
}

export function usePWA(): UsePWAReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    isStandalone: false
  });

  useEffect(() => {
    // Détection du dispositif
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /Android/i.test(userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;

    setDeviceInfo({
      isIOS,
      isAndroid,
      isMobile,
      isStandalone
    });

    // Vérifier si déjà installé
    if (isStandalone) {
      setIsInstalled(true);
      setIsInstallable(false);
      return;
    }

    // Vérifier le statut offline
    setIsOffline(!navigator.onLine);

    // Gérer l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as PWAInstallPrompt;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      
      // Logger pour debug
      console.log('📱 PWA installable détectée');
    };

    // Gérer l'événement appinstalled
    const handleAppInstalled = () => {
      console.log('✅ PWA installée avec succès');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      
      // Tracker l'installation
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'pwa_installed', {
          event_category: 'engagement',
          event_label: 'pwa'
        });
      }
    };

    // Gérer les changements de connexion
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Ajouter les event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier si sur iOS et non installé pour montrer les instructions
    if (isIOS && !isStandalone) {
      setIsInstallable(true); // Sur iOS, on peut toujours installer manuellement
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (deviceInfo.isIOS) {
      // Sur iOS, afficher les instructions
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      console.log('❌ Pas de prompt d\'installation disponible');
      return;
    }

    try {
      // Afficher le prompt d'installation
      await deferredPrompt.prompt();
      
      // Attendre le choix de l'utilisateur
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`👤 Choix utilisateur: ${outcome}`);
      
      if (outcome === 'accepted') {
        // Tracker l'acceptation
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'pwa_install_accepted', {
            event_category: 'engagement',
            event_label: 'pwa'
          });
        }
      } else {
        // Tracker le refus
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'pwa_install_declined', {
            event_category: 'engagement',
            event_label: 'pwa'
          });
        }
        
        // Sauvegarder le refus pour ne pas redemander trop souvent
        localStorage.setItem('pwa-install-declined', new Date().toISOString());
      }
      
      // Réinitialiser le prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('❌ Erreur lors de l\'installation:', error);
    }
  }, [deferredPrompt, deviceInfo.isIOS]);

  return {
    isInstalled,
    isInstallable,
    isOffline,
    isIOS: deviceInfo.isIOS,
    isAndroid: deviceInfo.isAndroid,
    isMobile: deviceInfo.isMobile,
    isStandalone: deviceInfo.isStandalone,
    installApp,
    showIOSInstructions,
    setShowIOSInstructions,
    deferredPrompt,
    canInstall: isInstallable && !isInstalled
  };
}

// Hook pour les fonctionnalités de cache
export function usePWACache() {
  const [cacheStatus, setCacheStatus] = useState<{
    cached: boolean;
    updateAvailable: boolean;
    updating: boolean;
  }>({
    cached: false,
    updateAvailable: false,
    updating: false
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkCache = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          setCacheStatus(prev => ({ ...prev, cached: true }));
          
          // Vérifier les mises à jour
          registration.addEventListener('updatefound', () => {
            setCacheStatus(prev => ({ ...prev, updateAvailable: true }));
          });
        }
      } catch (error) {
        console.error('Erreur vérification cache:', error);
      }
    };

    checkCache();
  }, []);

  const updateCache = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    setCacheStatus(prev => ({ ...prev, updating: true }));
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        // Recharger la page après mise à jour
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur mise à jour cache:', error);
    } finally {
      setCacheStatus(prev => ({ ...prev, updating: false }));
    }
  }, []);

  return {
    ...cacheStatus,
    updateCache
  };
}

// Hook pour la gestion des notifications (préparation future)
export function usePWANotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied';

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      // Tracker la permission
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'notification_permission', {
          event_category: 'engagement',
          event_label: result
        });
      }
      
      return result;
    } catch (error) {
      console.error('Erreur demande permission notifications:', error);
      return 'denied';
    }
  }, [isSupported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.log('Notifications non autorisées');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/192.png',
        badge: '/icons/96.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      return null;
    }
  }, [isSupported, permission]);

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification
  };
}
