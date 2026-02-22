'use client';

import { useState } from 'react';
import { usePWA, usePWACache, usePWANotifications } from '@/hooks/usePWA';
import { 
  Smartphone, Download, Bell, Wifi, WifiOff, RefreshCw, 
  CheckCircle, XCircle, AlertCircle, Info, Battery
} from 'lucide-react';

export default function PWATestPage() {
  const pwa = usePWA();
  const cache = usePWACache();
  const notifications = usePWANotifications();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()} - ${result}`]);
  };

  const testInstallation = async () => {
    addTestResult('🧪 Test installation PWA...');
    if (pwa.canInstall) {
      await pwa.installApp();
      addTestResult('✅ Prompt installation affiché');
    } else if (pwa.isInstalled) {
      addTestResult('ℹ️ PWA déjà installée');
    } else {
      addTestResult('❌ Installation non disponible');
    }
  };

  const testNotifications = async () => {
    addTestResult('🧪 Test notifications...');
    if (notifications.isSupported) {
      const result = await notifications.requestPermission();
      addTestResult(`📱 Permission: ${result}`);
      
      if (result === 'granted') {
        notifications.sendNotification('Test GENIA PWA', {
          body: 'Les notifications fonctionnent !',
          tag: 'test-notification'
        });
        addTestResult('✅ Notification envoyée');
      }
    } else {
      addTestResult('❌ Notifications non supportées');
    }
  };

  const testCache = async () => {
    addTestResult('🧪 Test cache Service Worker...');
    if (cache.cached) {
      addTestResult('✅ Cache actif');
      if (cache.updateAvailable) {
        addTestResult('🔄 Mise à jour disponible');
        await cache.updateCache();
      } else {
        addTestResult('ℹ️ Cache à jour');
      }
    } else {
      addTestResult('❌ Pas de cache détecté');
    }
  };

  const testVibration = () => {
    addTestResult('🧪 Test vibration...');
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
      addTestResult('✅ Vibration déclenchée');
    } else {
      addTestResult('❌ Vibration non supportée');
    }
  };

  const testBattery = async () => {
    addTestResult('🧪 Test Battery API...');
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      addTestResult(`🔋 Niveau: ${Math.round(battery.level * 100)}%`);
      addTestResult(`⚡ En charge: ${battery.charging ? 'Oui' : 'Non'}`);
    } else {
      addTestResult('❌ Battery API non supportée');
    }
  };

  const testShare = async () => {
    addTestResult('🧪 Test Web Share API...');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Test PWA GENIA',
          text: 'Découvrez GENIA Training !',
          url: window.location.href
        });
        addTestResult('✅ Partage réussi');
      } catch (err) {
        addTestResult('❌ Partage annulé');
      }
    } else {
      addTestResult('❌ Web Share API non supportée');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Test PWA - GENIA Training
          </h1>
          <p className="text-gray-600">
            Page de test pour vérifier toutes les fonctionnalités PWA
          </p>
        </div>

        {/* Statut Dispositif */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📱 Informations Dispositif</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatusCard
              label="Type"
              value={pwa.isMobile ? 'Mobile' : 'Desktop'}
              icon={<Smartphone className="w-4 h-4" />}
              status={pwa.isMobile}
            />
            
            <StatusCard
              label="OS"
              value={pwa.isIOS ? 'iOS' : pwa.isAndroid ? 'Android' : 'Autre'}
              icon={<Info className="w-4 h-4" />}
              status={true}
            />
            
            <StatusCard
              label="Installée"
              value={pwa.isInstalled ? 'Oui' : 'Non'}
              icon={<Download className="w-4 h-4" />}
              status={pwa.isInstalled}
            />
            
            <StatusCard
              label="Installable"
              value={pwa.isInstallable ? 'Oui' : 'Non'}
              icon={<Download className="w-4 h-4" />}
              status={pwa.isInstallable}
            />
            
            <StatusCard
              label="Standalone"
              value={pwa.isStandalone ? 'Oui' : 'Non'}
              icon={<CheckCircle className="w-4 h-4" />}
              status={pwa.isStandalone}
            />
            
            <StatusCard
              label="Connexion"
              value={pwa.isOffline ? 'Hors ligne' : 'En ligne'}
              icon={pwa.isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              status={!pwa.isOffline}
            />
            
            <StatusCard
              label="Cache"
              value={cache.cached ? 'Actif' : 'Inactif'}
              icon={<RefreshCw className="w-4 h-4" />}
              status={cache.cached}
            />
            
            <StatusCard
              label="Notifications"
              value={notifications.permission}
              icon={<Bell className="w-4 h-4" />}
              status={notifications.permission === 'granted'}
            />
            
            <StatusCard
              label="Vibration"
              value={typeof navigator !== 'undefined' && 'vibrate' in navigator ? 'Supportée' : 'Non'}
              icon={<AlertCircle className="w-4 h-4" />}
              status={typeof navigator !== 'undefined' && 'vibrate' in navigator}
            />
          </div>
        </div>

        {/* Boutons de Test */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Tests Fonctionnels</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <TestButton
              onClick={testInstallation}
              label="Installer PWA"
              icon={<Download className="w-4 h-4" />}
              disabled={!pwa.canInstall}
            />
            
            <TestButton
              onClick={testNotifications}
              label="Notifications"
              icon={<Bell className="w-4 h-4" />}
              disabled={!notifications.isSupported}
            />
            
            <TestButton
              onClick={testCache}
              label="Cache"
              icon={<RefreshCw className="w-4 h-4" />}
            />
            
            <TestButton
              onClick={testVibration}
              label="Vibration"
              icon={<AlertCircle className="w-4 h-4" />}
              disabled={typeof navigator === 'undefined' || !('vibrate' in navigator)}
            />
            
            <TestButton
              onClick={testBattery}
              label="Batterie"
              icon={<Battery className="w-4 h-4" />}
              disabled={typeof navigator === 'undefined' || !('getBattery' in navigator)}
            />
            
            <TestButton
              onClick={testShare}
              label="Partage"
              icon={<Info className="w-4 h-4" />}
              disabled={typeof navigator === 'undefined' || !navigator.share}
            />
          </div>
        </div>

        {/* Console de Test */}
        <div className="bg-gray-900 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            📋 Console de Test
          </h2>
          
          <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-gray-400">
                En attente des tests...
              </p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
          
          <button
            onClick={() => setTestResults([])}
            className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Effacer Console
          </button>
        </div>

        {/* Instructions iOS */}
        {pwa.isIOS && !pwa.isInstalled && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              📱 Installation sur iOS
            </h3>
            <p className="text-blue-700 mb-3">
              Pour installer l'application sur iOS :
            </p>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>Ouvrez cette page dans Safari</li>
              <li>Appuyez sur le bouton Partage ↑</li>
              <li>Sélectionnez "Sur l'écran d'accueil"</li>
              <li>Appuyez sur "Ajouter"</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant StatusCard
function StatusCard({ 
  label, 
  value, 
  icon, 
  status 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  status: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg border-2 ${
      status ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        {icon}
      </div>
      <p className={`font-semibold ${
        status ? 'text-green-700' : 'text-gray-700'
      }`}>
        {value}
      </p>
    </div>
  );
}

// Composant TestButton
function TestButton({ 
  onClick, 
  label, 
  icon, 
  disabled = false 
}: { 
  onClick: () => void; 
  label: string; 
  icon: React.ReactNode; 
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
        disabled 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg active:scale-95'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
