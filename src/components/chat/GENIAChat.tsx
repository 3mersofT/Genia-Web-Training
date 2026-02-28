'use client'

import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Brain, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGENIA } from '@/components/providers/GENIAProvider';
import { useChat } from '@/hooks/useChat';
import { GENIA_METHOD } from '@/constants/geniaMethod';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';

// ============= TYPES =============
interface GENIAChatProps {
  context?: any;
  embedded?: boolean;
}

export default function GENIAChat({ context: propContext, embedded = false }: GENIAChatProps = {}) {
  const { currentContext } = useGENIA();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [showMethodIndicator] = useState(true);

  const { messages, isLoading, quota, currentModel, sendMessage, setCurrentModel, context } = useChat({
    initialContext: propContext || currentContext,
    autoLoadQuotas: true,
    enableEnhancedGENIA: false
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const suggestions = [
    "Montre-moi un exemple concret",
    "Comment améliorer ce prompt ?",
    "Donne-moi un exercice pratique",
    "Explique le raisonnement step-by-step"
  ];

  const SuggestionsBar = () => (
    <div className="px-4 py-2 bg-gray-50 border-t">
      <div className="flex gap-2 overflow-x-auto">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => setInputMessage(s)} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors whitespace-nowrap">
            {s}
          </button>
        ))}
      </div>
    </div>
  );

  const isExpert = currentModel === 'magistral-medium';
  const modelLabel = isExpert ? '🧠 Expert' : '⚡ Pratique';
  const quotaUsed = isExpert ? quota.magistralMedium.used : quota.mistralMedium3.used;
  const quotaDaily = isExpert ? quota.magistralMedium.daily : quota.mistralMedium3.daily;

  if (embedded) {
    return (
      <div className="w-full h-full flex flex-col">
        <ChatMessageList messages={messages} isLoading={isLoading} loadingText="GENIA réfléchit..." />
        <SuggestionsBar />
        <div className="p-4 border-t bg-white space-y-3">
          <ChatInput value={inputMessage} onChange={setInputMessage} onSend={handleSendMessage} disabled={isLoading} placeholder="Pose ta question..." aria-label="Poser une question à GENIA" />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Modèle : {modelLabel}</span>
            <span>{quotaUsed}/{quotaDaily}</span>
          </div>
        </div>
      </div>
    );
  }

  // Mode standalone : bouton flottant + popup
  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 right-6 z-50 w-[450px] h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">GENIA</h3>
                    <p className="text-xs text-white/80">Assistant Formateur IA</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {showMethodIndicator && (
                <div className="flex gap-1">
                  {Object.entries(GENIA_METHOD).map(([key, method]) => (
                    <div key={key} className="flex-1 bg-white/10 rounded px-2 py-1 text-center" title={method.description}>
                      <span className="text-xs">{method.icon}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info bar */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 border-b">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3 text-blue-600" />
                  <span className="text-gray-600">{context.currentCapsule.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Brain className="w-3 h-3 text-purple-600" />
                    <span className="text-gray-600">{quota.magistralMedium.used}/{quota.magistralMedium.daily}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-orange-600" />
                    <span className="text-gray-600">{quota.mistralMedium3.used}/{quota.mistralMedium3.daily}</span>
                  </div>
                </div>
              </div>
            </div>

            <ChatMessageList messages={messages} isLoading={isLoading} loadingText="GENIA réfléchit..." />
            <SuggestionsBar />

            <div className="p-4 border-t bg-white space-y-3">
              <ChatInput value={inputMessage} onChange={setInputMessage} onSend={handleSendMessage} disabled={isLoading} placeholder="Pose ta question..." aria-label="Poser une question à GENIA" />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span>Modèle :</span>
                  <button
                    onClick={() => setCurrentModel(isExpert ? 'mistral-medium-3' : 'magistral-medium')}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${isExpert ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}
                  >
                    {modelLabel}
                  </button>
                </div>
                <span>{quotaUsed}/{quotaDaily}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
