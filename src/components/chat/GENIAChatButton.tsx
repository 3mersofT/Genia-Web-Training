'use client';

import React, { useState } from 'react';
import { MessageCircle, X, Bot } from 'lucide-react';
import GENIAChat from './GENIAChat';

interface GENIAChatButtonProps {
  /** Position du bouton flottant */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Personnalisation du contexte pour GENIA */
  context?: {
    currentCapsule?: {
      id: string;
      title: string;
      concepts: string[];
    };
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    completedCapsules?: number;
    totalCapsules?: number;
  };
}

export default function GENIAChatButton({ 
  position = 'bottom-right',
  context 
}: GENIAChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Classes CSS pour positionner le bouton
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6', 
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <>
      {/* Bouton flottant GENIA */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${positionClasses[position]} z-50 group transition-all duration-300 ease-in-out transform hover:scale-110 ${
          isOpen ? 'rotate-180' : ''
        }`}
        aria-label="Ouvrir l'assistant GENIA"
      >
        <div className="relative">
          {/* Bouton principal avec gradient GENIA */}
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300">
            {isOpen ? (
              <X className="w-8 h-8 text-white" />
            ) : (
              <Bot className="w-8 h-8 text-white" />
            )}
          </div>
          
          {/* Indicateur de notification (optionnel) */}
          
          {/* Effet de pulsation */}
          <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-ping opacity-20"></div>
        </div>

        {/* Tooltip au hover */}
        <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-md border border-border">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span>Assistant GENIA</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Cliquez pour obtenir de l'aide !
            </div>
            {/* Flèche du tooltip */}
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-popover"></div>
          </div>
        </div>
      </button>

      {/* Interface de chat (modal overlay) */}
      {isOpen && (
        <>
          {/* Overlay sombre */}
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Conteneur du chat */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 bottom-20 right-4 left-4 sm:left-auto sm:w-full sm:max-w-lg h-[700px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden transform transition-all duration-300 ease-out"
          >
            {/* Header du chat modal */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">GENIA</h3>
                    <p className="text-sm text-blue-100">Votre assistant formateur</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Indicateur de contexte */}
              {context?.currentCapsule && (
                <div className="mt-3 text-sm text-blue-100 bg-white bg-opacity-10 rounded-lg p-2">
                  <span className="font-medium">Capsule actuelle:</span> {context.currentCapsule.title}
                </div>
              )}
            </div>

            {/* Chat intégré */}
            <div className="flex-1 h-full overflow-y-auto">
              <GENIAChat context={context} embedded={true} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
