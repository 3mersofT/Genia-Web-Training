'use client';

import { useEffect, useState } from 'react';
import { Download, X, RefreshCw, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si c'est iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // Vérifier si l'app est déjà installée
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone === true;
    };

    setIsIOS(checkIOS());
    setIsStandalone(checkStandalone());

    // Vérifier si déjà installé (localStorage)
    const installed = localStorage.getItem('genia-pwa-installed') === 'true';
    setIsInstalled(installed);

    // Gérer l'événement beforeinstallprompt pour Android/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Montrer la bannière seulement si pas déjà installé
      if (!installed && !checkStandalone()) {
        setTimeout(() => setShowInstallBanner(true), 3000); // Attendre 3 secondes
      }
    };

    // Gérer l'événement appinstalled
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      setIsInstalled(true);
      localStorage.setItem('genia-pwa-installed', 'true');
      
      // Afficher un message de succès
      showSuccessNotification();
    };

    // Écouter les événements
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Service Worker pour les mises à jour
    if ('serviceWorker' in navigator && (window as any).workbox !== undefined) {
      const wb = (window as any).workbox;
      
      const promptNewVersionAvailable = () => {
        setShowUpdateBanner(true);
      };

      wb.addEventListener('waiting', promptNewVersionAvailable);
      wb.addEventListener('externalwaiting', promptNewVersionAvailable);

      wb.register();
    }

    // iOS - Montrer les instructions si pas installé
    if (checkIOS() && !checkStandalone() && !installed) {
      setTimeout(() => setShowInstallBanner(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Pour iOS, montrer les instructions
      showIOSInstructions();
      return;
    }

    if (!deferredPrompt) {
      console.log('Prompt d\'installation non disponible');
      return;
    }

    // Afficher le prompt d'installation
    deferredPrompt.prompt();

    // Attendre le choix de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('Installation acceptée');
    } else {
      console.log('Installation refusée');
    }

    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleUpdateClick = () => {
    // Recharger pour appliquer la mise à jour
    if ('serviceWorker' in navigator && (window as any).workbox !== undefined) {
      const wb = (window as any).workbox;
      
      wb.addEventListener('controlling', () => {
        window.location.reload();
      });

      wb.messageSkipWaiting();
    }
  };

  const showSuccessNotification = () => {
    // Afficher une notification de succès
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('GENIA Training installé !', {
        body: 'L\'application est maintenant disponible hors ligne',
        icon: '/icons/192.png',
        badge: '/icons/72.png'
      });
    }
  };

  const showIOSInstructions = () => {
    // Créer un modal avec instructions iOS
    alert(`Pour installer GENIA Training sur iOS :
    
1. Tapez sur le bouton Partager en bas de Safari
2. Faites défiler et tapez sur "Sur l'écran d'accueil"
3. Tapez sur "Ajouter" en haut à droite
    
L'app sera disponible sur votre écran d'accueil !`);
  };

  // Ne rien afficher si l'app est standalone ou déjà installée
  if (isStandalone || (isInstalled && !showUpdateBanner)) {
    return null;
  }

  return (
    <>
      {/* Bannière d'installation */}
      <AnimatePresence>
        {showInstallBanner && !isInstalled && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
          >
            <div className="bg-card rounded-lg shadow-2xl p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Installer GENIA Training
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Accédez rapidement à vos formations, même hors ligne !
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleInstallClick}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Installer
                    </button>
                    <button
                      onClick={() => {
                        setShowInstallBanner(false);
                        localStorage.setItem('genia-pwa-dismissed', 'true');
                      }}
                      className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Plus tard
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="text-muted-foreground hover:text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bannière de mise à jour */}
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5" />
                  <span className="font-medium">
                    Une nouvelle version de GENIA Training est disponible !
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleUpdateClick}
                    className="px-4 py-1.5 bg-card text-green-600 dark:text-green-400 font-medium rounded-lg hover:bg-green-50 dark:bg-green-950/30 transition-colors"
                  >
                    Mettre à jour
                  </button>
                  <button
                    onClick={() => setShowUpdateBanner(false)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}