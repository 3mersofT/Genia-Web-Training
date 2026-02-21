'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Vérifier le statut initial
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setWasOffline(true);
      setShowNotification(true);
    }

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowNotification(true);
        // Masquer après 3 secondes
        setTimeout(() => {
          setShowNotification(false);
          setWasOffline(false);
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérification périodique (toutes les 30 secondes)
    const interval = setInterval(() => {
      const online = navigator.onLine;
      if (online !== isOnline) {
        setIsOnline(online);
        if (!online) {
          setWasOffline(true);
          setShowNotification(true);
        } else if (wasOffline) {
          setShowNotification(true);
          setTimeout(() => {
            setShowNotification(false);
            setWasOffline(false);
          }, 3000);
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline, wasOffline]);

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className={`fixed top-0 left-0 right-0 z-[100] ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-center gap-2 text-white">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Connexion rétablie
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Pas de connexion Internet
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* Barre de progression pour la connexion rétablie */}
          {isOnline && (
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 3, ease: 'linear' }}
              className="h-1 bg-green-600 origin-left"
            />
          )}
        </motion.div>
      )}

      {/* Indicateur permanent si hors ligne */}
      {!isOnline && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Mode hors ligne</span>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
