'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import GENIAChatButton from '@/components/chat/GENIAChatButton';
import { useAuth } from '@/hooks/useAuth';
import { getCapsuleById, getModuleBySlug } from '@/lib/data';

// Contexte pour gérer l'état global de GENIA
interface GENIAContextType {
  isAvailable: boolean;
  currentContext: {
    currentCapsule?: {
      id: string;
      title: string;
      concepts: string[];
    };
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    completedCapsules?: number;
    totalCapsules?: number;
  };
  updateContext: (context: any) => void;
}

const GENIAContext = createContext<GENIAContextType | undefined>(undefined);

export const useGENIA = () => {
  const context = useContext(GENIAContext);
  if (context === undefined) {
    throw new Error('useGENIA must be used within a GENIAProvider');
  }
  return context;
};

// Provider qui gère GENIA à travers toute l'application
export default function GENIAProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [currentContext, setCurrentContext] = useState({});

  // Déterminer si GENIA doit être disponible sur cette page
  const shouldShowGENIA = () => {
    if (!user) return false;
    
    // Ne pas afficher GENIA sur les pages admin
    if (pathname.startsWith('/admin')) return false;
    
    // Ne pas afficher sur les pages d'auth
    if (pathname.includes('/login') || pathname.includes('/register')) return false;
    
    // Ne pas afficher sur la home page
    if (pathname === '/') return false;
    
    // Afficher sur dashboard, capsules, modules
    return pathname.startsWith('/dashboard') || 
           pathname.startsWith('/capsules') || 
           pathname.startsWith('/modules');
  };

  // Mettre à jour le contexte automatiquement selon la page
  useEffect(() => {
    const loadCapsuleContext = async () => {
      if (pathname.startsWith('/capsules/')) {
        // Extraire l'ID de la capsule depuis l'URL
        const capsuleId = pathname.split('/').pop();
        if (capsuleId) {
          try {
            const capsule = await getCapsuleById(capsuleId);
            if (capsule) {
              setCurrentContext({
                currentCapsule: {
                  id: capsule.id,
                  title: capsule.title,
                  concepts: ['Prompt Engineering', 'Méthode GENIA'] // Fallback car pas de tags dans le type Capsule
                },
                userLevel: 'beginner', // TODO: Récupérer depuis le profil utilisateur
                completedCapsules: 2,   // TODO: Calculer depuis les données
                totalCapsules: 36
              });
            } else {
              // Fallback si la capsule n'est pas trouvée
              setCurrentContext({
                currentCapsule: {
                  id: capsuleId,
                  title: 'Capsule en cours',
                  concepts: ['Prompt Engineering']
                },
                userLevel: 'beginner',
                completedCapsules: 2,
                totalCapsules: 36
              });
            }
          } catch (error) {
            console.error('Erreur lors du chargement de la capsule:', error);
            setCurrentContext({
            currentCapsule: {
              id: capsuleId,
              title: 'Capsule en cours',
              concepts: ['Prompt Engineering']
            },
            userLevel: 'beginner',
            completedCapsules: 2,
            totalCapsules: 36
          });
        }
        }
      } else if (pathname.startsWith('/modules/')) {
        // Pour les pages de modules
        const moduleSlug = pathname.split('/').pop();
        if (moduleSlug) {
          try {
            const module = await getModuleBySlug(moduleSlug);
            if (module) {
              setCurrentContext({
                currentModule: {
                  id: module.id,
                  title: module.title,
                  difficulty: module.difficulty
                },
                userLevel: 'beginner',
                completedCapsules: 2,
                totalCapsules: 36
              });
            }
          } catch (error) {
            console.error('Erreur lors du chargement du module:', error);
          }
        }
      } else if (pathname.startsWith('/dashboard')) {
        setCurrentContext({
          userLevel: 'beginner',
          completedCapsules: 2,
          totalCapsules: 36
        });
      } else {
        setCurrentContext({});
      }
    };

    loadCapsuleContext();
  }, [pathname]);

  const updateContext = (newContext: any) => {
    setCurrentContext(prev => ({ ...prev, ...newContext }));
  };

  const contextValue: GENIAContextType = {
    isAvailable: shouldShowGENIA(),
    currentContext,
    updateContext
  };

  return (
    <GENIAContext.Provider value={contextValue}>
      {children}
      
      {/* Bouton flottant GENIA global */}
      {shouldShowGENIA() && (
        <GENIAChatButton 
          position="bottom-right"
          context={currentContext}
        />
      )}
    </GENIAContext.Provider>
  );
}
