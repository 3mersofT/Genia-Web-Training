'use client'

import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Brain, Zap, Download, FileText, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGENIA } from '@/components/providers/GENIAProvider';
import { useChat } from '@/hooks/useChat';
import { GENIA_METHOD } from '@/constants/geniaMethod';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';

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
  const [showExportMenu, setShowExportMenu] = useState(false);

  const {
    messages, isLoading, quota, currentModel, suggestions,
    sendMessage, setCurrentModel, sendFeedback, exportChat,
    resetConversation, context
  } = useChat({
    initialContext: propContext || currentContext,
    autoLoadQuotas: true,
    enableEnhancedGENIA: false,
    enableStreaming: true,
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    await sendMessage(inputMessage);
    setInputMessage('');
  };

  // Use smart suggestions when available, else defaults
  const displaySuggestions = suggestions.length > 0
    ? suggestions
    : [
        { text: "Montre-moi un exemple concret", category: 'explore' as const, icon: '🔍' },
        { text: "Comment améliorer ce prompt ?", category: 'deepen' as const, icon: '⚙️' },
        { text: "Donne-moi un exercice pratique", category: 'practice' as const, icon: '⚡' },
        { text: "Explique le raisonnement step-by-step", category: 'explore' as const, icon: '🧠' },
      ];

  const SuggestionsBar = () => (
    <div className="px-4 py-2 bg-muted border-t">
      <div className="flex gap-2 overflow-x-auto">
        {displaySuggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => setInputMessage(s.text)}
            className="px-3 py-1 bg-card border border-border rounded-full text-xs text-muted-foreground hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors whitespace-nowrap flex items-center gap-1"
          >
            <span>{s.icon}</span>
            <span>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const ExportMenu = () => (
    <div className="absolute bottom-full right-0 mb-1 bg-card border border-border rounded-lg shadow-lg py-1 z-10">
      <button
        onClick={() => { exportChat('markdown'); setShowExportMenu(false); }}
        className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent w-full"
      >
        <FileText className="w-4 h-4" />
        Markdown (.md)
      </button>
      <button
        onClick={() => { exportChat('pdf'); setShowExportMenu(false); }}
        className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent w-full"
      >
        <Download className="w-4 h-4" />
        PDF (.pdf)
      </button>
    </div>
  );

  const isExpert = currentModel === 'magistral-medium';
  const modelLabel = isExpert ? '🧠 Expert' : '⚡ Pratique';
  const quotaUsed = isExpert ? quota.magistralMedium.used : quota.mistralMedium3.used;
  const quotaDaily = isExpert ? quota.magistralMedium.daily : quota.mistralMedium3.daily;

  if (embedded) {
    return (
      <div className="w-full h-full flex flex-col">
        <ChatMessageList messages={messages} isLoading={isLoading} loadingText="GENIA réfléchit..." onFeedback={sendFeedback} />
        <SuggestionsBar />
        <div className="p-4 border-t bg-card space-y-3">
          <ChatInput value={inputMessage} onChange={setInputMessage} onSend={handleSendMessage} disabled={isLoading} placeholder="Pose ta question..." aria-label="Poser une question à GENIA" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Modèle : {modelLabel}</span>
            <div className="flex items-center gap-2">
              <span>{quotaUsed}/{quotaDaily}</span>
              <div className="relative">
                <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-1 hover:bg-accent rounded" title="Exporter">
                  <Download className="w-3.5 h-3.5" />
                </button>
                {showExportMenu && <ExportMenu />}
              </div>
            </div>
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
            className="fixed bottom-6 right-6 z-50 w-[450px] h-[700px] bg-card rounded-2xl shadow-2xl flex flex-col overflow-hidden"
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={resetConversation}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Nouvelle conversation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
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
            <div className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] px-4 py-2 border-b">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3 text-blue-600" />
                  <span className="text-muted-foreground">{context.currentCapsule.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Brain className="w-3 h-3 text-purple-600" />
                    <span className="text-muted-foreground">{quota.magistralMedium.used}/{quota.magistralMedium.daily}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-orange-600" />
                    <span className="text-muted-foreground">{quota.mistralMedium3.used}/{quota.mistralMedium3.daily}</span>
                  </div>
                </div>
              </div>
            </div>

            <ChatMessageList messages={messages} isLoading={isLoading} loadingText="GENIA réfléchit..." onFeedback={sendFeedback} />
            <SuggestionsBar />

            <div className="p-4 border-t bg-card space-y-3">
              <ChatInput value={inputMessage} onChange={setInputMessage} onSend={handleSendMessage} disabled={isLoading} placeholder="Pose ta question..." aria-label="Poser une question à GENIA" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Modèle :</span>
                  <button
                    onClick={() => setCurrentModel(isExpert ? 'mistral-medium-3' : 'magistral-medium')}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${isExpert ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}
                  >
                    {modelLabel}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span>{quotaUsed}/{quotaDaily}</span>
                  <div className="relative">
                    <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-1 hover:bg-accent rounded" title="Exporter la conversation">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {showExportMenu && <ExportMenu />}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
