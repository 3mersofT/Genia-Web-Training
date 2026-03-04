'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Download, Smartphone, Monitor, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const t = useTranslations('pwa');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [device, setDevice] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    // Détection du dispositif
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setDevice(isMobile ? 'mobile' : 'desktop');

    // Détection iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Vérifier si l'utilisateur a déjà refusé
    const hasDeclined = localStorage.getItem('pwa-install-declined');
    const declineDate = hasDeclined ? new Date(hasDeclined) : null;
    const daysSinceDecline = declineDate 
      ? (Date.now() - declineDate.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    // Ne pas afficher si refusé il y a moins de 7 jours
    if (daysSinceDecline < 7) {
      return;
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Afficher après 30 secondes sur la page
      setTimeout(() => {
        const hasShownBefore = localStorage.getItem('pwa-install-shown');
        if (!hasShownBefore || daysSinceDecline > 7) {
          setShowInstallPrompt(true);
          localStorage.setItem('pwa-install-shown', new Date().toISOString());
        }
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Si iOS, afficher les instructions
      if (isIOS) {
        setShowIOSInstructions(true);
      }
      return;
    }

    try {
      // Afficher le prompt d'installation
      await deferredPrompt.prompt();
      
      // Attendre le choix de l'utilisateur
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installée avec succès');
        setIsInstalled(true);
      } else {
        console.log('Installation PWA refusée');
        localStorage.setItem('pwa-install-declined', new Date().toISOString());
      }
      
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-declined', new Date().toISOString());
  };

  const handleIOSClose = () => {
    setShowIOSInstructions(false);
    localStorage.setItem('pwa-install-declined', new Date().toISOString());
  };

  // Ne rien afficher si déjà installé
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Bannière d'installation */}
      <AnimatePresence>
        {showInstallPrompt && !showIOSInstructions && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
          >
            <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
              {/* Header avec gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                      {device === 'mobile' ? (
                        <Smartphone className="w-5 h-5 text-white" />
                      ) : (
                        <Monitor className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">
                        {t('installTitle')}
                      </h3>
                      <p className="text-blue-100 text-xs">
                        {t('quickAccess', { device: device === 'mobile' ? t('deviceMobile') : t('deviceDesktop') })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDismiss}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span>⚡</span>
                    </div>
                    <span className="text-foreground">{t('ultraFastLaunch')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span>📱</span>
                    </div>
                    <span className="text-foreground">
                      {device === 'mobile' ? t('experienceMobile') : t('experienceDesktop')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span>🔔</span>
                    </div>
                    <span className="text-foreground">{t('newChallengeNotifications')}</span>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-2.5 px-4 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {t('installButton')}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2.5 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                  >
                    {t('later')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions iOS */}
      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
            >
              {/* Header iOS */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">{t('iosInstallTitle')}</h3>
                  <button
                    onClick={handleIOSClose}
                    className="text-white/80 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-blue-100 text-sm">
                  {t('iosInstallDescription')}
                </p>
              </div>

              {/* Étapes */}
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {t('iosStep1Title')}
                    </p>
                    <div className="flex items-center gap-2">
                      <Share className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-muted-foreground">
                        {t('iosStep1Description')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {t('iosStep2Title')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('iosStep2Description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      {t('iosStep3Title')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('iosStep3Description')}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {t('iosTip')}
                  </p>
                </div>

                <button
                  onClick={handleIOSClose}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 rounded-lg hover:shadow-lg transition-all"
                >
                  {t('iosUnderstood')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
