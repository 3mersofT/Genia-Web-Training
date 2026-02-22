'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageCircle, Send, X, Sparkles, Brain, Zap, 
  BookOpen, Trophy, Target, TrendingUp, HelpCircle,
  ChevronDown, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useGENIA } from '@/components/providers/GENIAProvider';
import { useEnhancedGENIA } from '@/hooks/useEnhancedGENIA';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ============= TYPES =============
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: 'magistral-medium' | 'mistral-medium-3';
  methodStep?: 'G' | 'E' | 'N' | 'I' | 'A';
  tokens?: number;
  reasoning?: string; // Pour CoT avec Magistral
}

interface ChatContext {
  currentCapsule: {
    id: string;
    title: string;
    concepts: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  completedCapsules: number;
  totalCapsules: number;
  lastExerciseScore?: number;
  streakDays: number;
}

interface QuotaInfo {
  magistralMedium: { used: number; daily: number; };
  mistralMedium3: { used: number; daily: number; };
}

// ============= MÉTHODE GENIA =============
const GENIA_METHOD = {
  G: {
    name: 'Guide progressif',
    color: 'from-blue-500 to-blue-600',
    icon: '📘',
    description: 'Apprentissage structuré étape par étape'
  },
  E: {
    name: 'Exemples concrets',
    color: 'from-green-500 to-green-600',
    icon: '🔍',
    description: 'Applications réelles et cas professionnels'
  },
  N: {
    name: 'Niveau adaptatif',
    color: 'from-purple-500 to-purple-600',
    icon: '📊',
    description: 'Contenu qui s\'ajuste à votre progression'
  },
  I: {
    name: 'Interaction pratique',
    color: 'from-orange-500 to-orange-600',
    icon: '⚡',
    description: 'Apprentissage actif avec exercices'
  },
  A: {
    name: 'Assessment continu',
    color: 'from-indigo-500 to-indigo-600',
    icon: '✅',
    description: 'Évaluation intelligente en temps réel'
  }
};

// ============= PERSONA GENIA =============
const GENIA_PERSONA = `
Tu es GENIA, formateur senior en Prompt Engineering utilisant la méthode pédagogique GENIA.
Tu appliques systématiquement les 5 piliers de la méthode :

G - Guide progressif : Structure chaque explication étape par étape
E - Exemples concrets : Utilise des cas réels du contexte français/européen
N - Niveau adaptatif : Adapte ton vocabulaire au niveau de l'apprenant
I - Interaction pratique : Propose toujours un exercice concret
A - Assessment continu : Évalue et encourage les progrès

Ton expertise :
- Maîtrise des modèles Mistral, GPT, Claude, DeepSeek
- Spécialiste du raisonnement step-by-step
- Défenseur de la souveraineté numérique européenne et du RGPD

Règles importantes :
1. TOUJOURS identifier quel pilier GENIA tu utilises dans ta réponse
2. JAMAIS de réponse directe avant 2 tentatives guidées
3. CÉLÉBRER chaque progrès, même petit
4. RESPECTER le RGPD dans tous les exemples
`;

// ============= COMPOSANT PRINCIPAL =============
interface GENIAChatProps {
  context?: any;
  embedded?: boolean; // Pour savoir si on est dans le bouton flottant
}

export default function GENIAChat({ context: propContext, embedded = false }: GENIAChatProps = {}) {
  const { user } = useAuth();
  const { currentContext } = useGENIA();
  
  // Utiliser le hook Enhanced GENIA pour la mémoire
  const {
    messages: enhancedMessages,
    sendMessage: enhancedSendMessage,
    isLoading: enhancedLoading,
    error: enhancedError,
    sessionMemory,
    learningInsights,
    isInitialized
  } = useEnhancedGENIA(
    propContext?.currentCapsule?.id ? 'module-1' : undefined,
    propContext?.currentCapsule?.id,
    true // enableMemory
  );
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: `Bonjour ! Je suis GENIA, ton assistant formateur en Prompt Engineering. 🎓
      
J'utilise la méthode GENIA pour t'accompagner :
• **G**uide progressif 📘
• **E**xemples concrets 🔍
• **N**iveau adaptatif 📊
• **I**nteraction pratique ⚡
• **A**ssessment continu ✅

Comment puis-je t'aider aujourd'hui ?`,
      timestamp: new Date(),
      methodStep: 'G'
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const actualLoading = enhancedLoading || isLoading;
  const [currentModel, setCurrentModel] = useState<'magistral-medium' | 'mistral-medium-3'>('mistral-medium-3');
  const [showMethodIndicator, setShowMethodIndicator] = useState(true);
  
  // Utiliser le contexte passé en props, du provider, ou un fallback
  const effectiveContext = propContext || currentContext;
  const context: ChatContext = {
    currentCapsule: effectiveContext.currentCapsule || {
      id: 'general',
      title: 'Formation GENIA',
      concepts: ['Prompt Engineering', 'Méthode GENIA'],
      difficulty: 'beginner'
    },
    userLevel: effectiveContext.userLevel || 'beginner',
    completedCapsules: effectiveContext.completedCapsules || 0,
    totalCapsules: effectiveContext.totalCapsules || 36,
    streakDays: 0
  };
  
  const [quota, setQuota] = useState<QuotaInfo>({
    magistralMedium: { used: 0, daily: 0 },
    mistralMedium3: { used: 0, daily: 0 }
  });
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger quotas réels au montage
  useEffect(() => {
    const loadQuotas = async () => {
      try {
        if (!user?.id) return;
        const res = await fetch(`/api/quotas?userId=${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setQuota({
          magistralMedium: {
            used: data.quotas['magistral-medium']?.used || 0,
            daily: data.quotas['magistral-medium']?.remaining || 0
          },
          mistralMedium3: {
            used: data.quotas['mistral-medium-3']?.used || 0,
            daily: data.quotas['mistral-medium-3']?.remaining || 0
          }
        });
      } catch (_) {
        // silencieux
      }
    };
    loadQuotas();
  }, [user?.id]);

  // Recharger quotas à l'ouverture du chat
  useEffect(() => {
    const refreshOnOpen = async () => {
      if (!isOpen || !user?.id) return;
      try {
        const res = await fetch(`/api/quotas?userId=${user.id}`);
        if (!res.ok) return;
        const data = await res.json();
        setQuota({
          magistralMedium: {
            used: data.quotas['magistral-medium']?.used || 0,
            daily: data.quotas['magistral-medium']?.remaining || 0
          },
          mistralMedium3: {
            used: data.quotas['mistral-medium-3']?.used || 0,
            daily: data.quotas['mistral-medium-3']?.remaining || 0
          }
        });
      } catch (_) {}
    };
    refreshOnOpen();
  }, [isOpen, user?.id]);
  
  // Détecte quel pilier GENIA utiliser selon la question
  const detectGENIAStep = (query: string): 'G' | 'E' | 'N' | 'I' | 'A' => {
    if (query.includes('exemple') || query.includes('montre')) return 'E';
    if (query.includes('exercice') || query.includes('pratique')) return 'I';
    if (query.includes('évalue') || query.includes('correct')) return 'A';
    if (query.includes('niveau') || query.includes('difficile')) return 'N';
    return 'G'; // Guide par défaut
  };
  
  // Détermine le modèle à utiliser
  const selectModel = (query: string): 'magistral-medium' | 'mistral-medium-3' => {
    const needsExpertModel = 
      query.includes('pourquoi') ||
      query.includes('explique en détail') ||
      query.includes('raisonnement') ||
      query.includes('complexe') ||
      context.userLevel === 'beginner' && query.includes('comprends pas');
    
    // Vérifier les quotas
    if (needsExpertModel && quota.magistralMedium.used < quota.magistralMedium.daily) {
      return 'magistral-medium';
    }
    
    return 'mistral-medium-3';
  };
  
  // Envoyer un message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || actualLoading) return;
    
    // Utiliser le hook Enhanced GENIA si disponible
    if (isInitialized && enhancedSendMessage) {
      try {
        await enhancedSendMessage(inputMessage);
        setInputMessage('');
        return;
      } catch (error) {
        console.error('Erreur Enhanced GENIA:', error);
        // Fallback vers l'ancienne méthode
      }
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Déterminer le modèle optimal
      const model = selectModel(inputMessage);
      
      // Préparer le contexte système GENIA
      const systemPrompt = `Tu es GENIA, formateur senior en Prompt Engineering utilisant la méthode GENIA.
      
Contexte actuel :
- Capsule : ${context.currentCapsule?.title || 'Formation GENIA'}
- Concepts : ${context.currentCapsule?.concepts?.join(', ') || 'Prompt Engineering'}
- Niveau : ${context.userLevel || 'beginner'}
- Progression : ${context.completedCapsules || 0}/${context.totalCapsules || 36} capsules

IMPORTANT: Identifie TOUJOURS quel pilier GENIA tu utilises dans ta réponse :
[G - Guide] [E - Exemple] [N - Niveau] [I - Interaction] [A - Assessment]

Applique la méthode GENIA et adapte ton niveau au contexte utilisateur.`;

      // Construire l'historique des messages
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-6).map(m => ({ // Garder les 6 derniers pour contexte
          role: m.role,
          content: m.content
        })),
        { role: 'user', content: inputMessage }
      ];
      
      // Appel à l'API Mistral via notre endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          userId: user?.id || 'anonymous-user', // ✅ Utilise l'ID utilisateur réel
          conversationId: conversationId || 'new',
          capsuleId: context.currentCapsule?.id,
          reasoning: model === 'magistral-medium' ? 'explicit' : 'implicit'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi du message');
      }

      const data = await response.json();

      // Sauvegarder conversationId si nouvelle conv
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Créer le message de réponse
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
        model: data.model || model,
        methodStep: data.methodStep || detectGENIAStep(data.content),
        reasoning: data.reasoning
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Mettre à jour les quotas basés sur la réponse réelle
      if (data.quotaUsed) {
        if (model === 'magistral-medium') {
          setQuota(prev => ({
            ...prev,
            magistralMedium: { 
              ...prev.magistralMedium, 
              used: data.quotaUsed.used 
            }
          }));
        } else {
          setQuota(prev => ({
            ...prev,
            mistralMedium3: { 
              ...prev.mistralMedium3, 
              used: data.quotaUsed.used 
            }
          }));
        }
      }

      // Recharger quotas depuis la source après envoi pour cohérence
      try {
        if (user?.id) {
          const res = await fetch(`/api/quotas?userId=${user.id}`);
          if (res.ok) {
            const data = await res.json();
            setQuota({
              magistralMedium: {
                used: data.quotas['magistral-medium']?.used || 0,
                daily: data.quotas['magistral-medium']?.limit || 0
              },
              mistralMedium3: {
                used: data.quotas['mistral-medium-3']?.used || 0,
                daily: data.quotas['mistral-medium-3']?.limit || 0
              }
            });
          }
        }
      } catch (_) {}
      
    } catch (error) {
      console.error('Erreur chat GENIA:', error);
      
      // Message d'erreur pour l'utilisateur
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Erreur temporaire**

Désolé, je rencontre une difficulté technique momentanée. 

**[I - Interaction]** En attendant que ce soit résolu, voici ce que vous pouvez faire :
• Vérifiez votre connexion internet
• Réessayez dans quelques instants  
• Si le problème persiste, contactez le support

Je serai bientôt de retour pour vous accompagner dans votre apprentissage ! 🚀`,
        timestamp: new Date(),
        methodStep: 'I'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Générer une réponse GENIA
  const generateGENIAResponse = (
    query: string, 
    step: 'G' | 'E' | 'N' | 'I' | 'A',
    model: string
  ): string => {
    const stepInfo = GENIA_METHOD[step];
    
    const responses = {
      G: `${stepInfo.icon} **[Guide Progressif]**

Excellente question ! Je vais te guider étape par étape.

**Étape 1** : Comprendre le contexte
D'abord, identifions ce que tu veux accomplir avec ton prompt.

**Étape 2** : Structurer avec RCTF
- **R**ôle : Qui est l'IA ?
- **C**ontexte : Quelle situation ?
- **T**âche : Que doit-elle faire ?
- **F**ormat : Comment présenter ?

**Étape 3** : Affiner et tester
On va itérer ensemble pour perfectionner.

💡 **Astuce** : Commence toujours par définir clairement ton objectif !`,

      E: `${stepInfo.icon} **[Exemples Concrets]**

Voici un exemple pratique adapté au contexte français :

**Exemple Basique** :
\`\`\`
❌ Mauvais : "Écris un email"
✅ Bon : "Tu es assistant commercial. Rédige un email professionnel pour relancer un client français après un devis, ton cordial mais persuasif."
\`\`\`

**Exemple Avancé** :
\`\`\`
[RÔLE] Tu es consultant RGPD certifié
[CONTEXTE] PME française de 50 employés, secteur e-commerce
[TÂCHE] Créer une checklist de conformité
[FORMAT] Liste numérotée avec priorités (urgent/important/secondaire)
\`\`\`

🎯 **Application** : Essaie de créer un prompt similaire pour ton cas !`,

      N: `${stepInfo.icon} **[Niveau Adaptatif]**

J'ai détecté que tu es niveau **${context.userLevel}**. J'adapte mon explication :

${context.userLevel === 'beginner' ? 
  `Je vais utiliser des mots simples et des analogies du quotidien. 
  Pas de jargon technique, on y va progressivement ! 🌱` :
  context.userLevel === 'intermediate' ?
  `On peut utiliser des termes techniques avec modération.
  Tu connais les bases, on approfondit ! 🚀` :
  `Mode expert activé ! Optimisations avancées, patterns complexes,
  et techniques de pointe. Let's go ! 💎`}

📊 **Ta progression** : ${context.completedCapsules}/${context.totalCapsules} capsules
Tu progresses bien, continue comme ça !`,

      I: `${stepInfo.icon} **[Interaction Pratique]**

C'est parti pour un exercice pratique ! 

**🎯 Mini-Défi (2 minutes)** :
Transforme ce prompt vague en version optimisée :
"Aide-moi avec mon CV"

**Indices progressifs** :
1. Pense au rôle (recruteur ? coach ?)
2. Quel type de poste vises-tu ?
3. Quel format de sortie ?

**Critères de réussite** :
- [ ] Rôle défini
- [ ] Contexte précis
- [ ] Tâche claire
- [ ] Format spécifié

Envoie-moi ta version, je te donnerai un feedback personnalisé ! 💪`,

      A: `${stepInfo.icon} **[Assessment Continu]**

Analysons ta progression :

**Points forts** ✅
- Tu structures mieux tes prompts
- Le contexte est plus précis
- Bon usage du format

**Axes d'amélioration** 📈
- Ajouter plus de contraintes spécifiques
- Préciser le ton souhaité
- Inclure des exemples dans tes prompts

**Score actuel** : 7/10 🌟

**Prochain objectif** : Maîtriser le few-shot learning
Tu es sur la bonne voie ! Chaque prompt est une opportunité d'apprendre.`
    };
    
    return responses[step] + `\n\n*[Modèle: ${model === 'magistral-medium' ? '🧠 Expert' : '⚡ Pratique'}]*`;
  };
  
  // Générer un Chain-of-Thought
  const generateCoT = (query: string): string => {
    return `[Raisonnement Step-by-Step]
1. Analyse de la question : Identifier les concepts clés
2. Contexte de l'apprenant : Niveau ${context.userLevel}, capsule "${context.currentCapsule.title}"
3. Méthode GENIA applicable : Déterminer le pilier le plus pertinent
4. Adaptation pédagogique : Ajuster complexité et vocabulaire
5. Exercice pratique : Concevoir une activité adaptée
6. Feedback constructif : Préparer encouragements et pistes d'amélioration`;
  };
  
  // Suggestions contextuelles
  const suggestions = [
    "Montre-moi un exemple concret",
    "Comment améliorer ce prompt ?",
    "Donne-moi un exercice pratique",
    "Explique le raisonnement step-by-step"
  ];
  
  // Si on est en mode embedded, on retourne juste le contenu du chat
  if (embedded) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : message.role === 'system'
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                {/* Method Step Indicator */}
                {message.methodStep && message.role === 'assistant' && (
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${GENIA_METHOD[message.methodStep].color} text-white text-xs mb-2`}>
                    <span>{GENIA_METHOD[message.methodStep].icon}</span>
                    <span>{GENIA_METHOD[message.methodStep].name}</span>
                  </div>
                )}
                
                {/* Message Content */}
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                
                {/* CoT Reasoning for Magistral */}
                {message.reasoning && (
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      Voir le raisonnement...
                    </summary>
                    <div className="mt-2 p-2 bg-gray-50 rounded text-gray-600 whitespace-pre-wrap">
                      {message.reasoning}
                    </div>
                  </details>
                )}
                
                {/* Timestamp */}
                <div className="text-xs opacity-50 mt-2">
                  {message.timestamp.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {actualLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-gray-500">GENIA réfléchit...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Suggestions */}
        <div className="px-4 py-2 bg-gray-50 border-t">
          <div className="flex gap-2 overflow-x-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(suggestion)}
                className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
        
        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Pose ta question..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || actualLoading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Model Indicator avec bascule */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Modèle actif :</span>
              <button
                onClick={() => setCurrentModel(currentModel === 'magistral-medium' ? 'mistral-medium-3' : 'magistral-medium')}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                  currentModel === 'magistral-medium' 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : 'bg-orange-100 text-orange-700 border border-orange-200'
                }`}
              >
                {currentModel === 'magistral-medium' ? '🧠 Expert' : '⚡ Pratique'}
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-400">
                {currentModel === 'magistral-medium' 
                  ? `${quota.magistralMedium.used}/${quota.magistralMedium.daily}`
                  : `${quota.mistralMedium3.used}/${quota.mistralMedium3.daily}`
                }
              </span>
              <span>Méthode GENIA</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mode standalone (bouton flottant + interface)
  return (
    <>
      {/* Bouton flottant GENIA */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-lg hidden group-hover:block animate-slideIn">
                GENIA
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Interface de chat */}
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
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Méthode GENIA Indicators */}
              {showMethodIndicator && (
                <div className="flex gap-1">
                  {Object.entries(GENIA_METHOD).map(([key, method]) => (
                    <div
                      key={key}
                      className="flex-1 bg-white/10 rounded px-2 py-1 text-center"
                      title={method.description}
                    >
                      <span className="text-xs">{method.icon}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Info Bar */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 border-b">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3 text-blue-600" />
                  <span className="text-gray-600">
                    {context.currentCapsule.title}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Brain className="w-3 h-3 text-purple-600" />
                    <span className="text-gray-600">
                      {quota.magistralMedium.used}/{quota.magistralMedium.daily}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-orange-600" />
                    <span className="text-gray-600">
                      {quota.mistralMedium3.used}/{quota.mistralMedium3.daily}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : message.role === 'system'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    {/* Method Step Indicator */}
                    {message.methodStep && message.role === 'assistant' && (
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${GENIA_METHOD[message.methodStep].color} text-white text-xs mb-2`}>
                        <span>{GENIA_METHOD[message.methodStep].icon}</span>
                        <span>{GENIA_METHOD[message.methodStep].name}</span>
                      </div>
                    )}
                    
                    {/* Message Content */}
                    <div className="prose prose-sm max-w-none"
                         dangerouslySetInnerHTML={{ 
                           __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                  .replace(/\n/g, '<br/>')
                         }} 
                    />
                    
                    {/* CoT Reasoning for Magistral */}
                    {message.reasoning && (
                      <details className="mt-3 text-xs">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                          Voir le raisonnement...
                        </summary>
                        <div className="mt-2 p-2 bg-gray-50 rounded text-gray-600 whitespace-pre-wrap">
                          {message.reasoning}
                        </div>
                      </details>
                    )}
                    
                    {/* Timestamp */}
                    <div className="text-xs opacity-50 mt-2">
                      {message.timestamp.toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {actualLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    <span className="text-gray-500">GENIA réfléchit...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Suggestions */}
            <div className="px-4 py-2 bg-gray-50 border-t">
              <div className="flex gap-2 overflow-x-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(suggestion)}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors whitespace-nowrap"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Pose ta question..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || actualLoading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              {/* Model Indicator avec bascule */}
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span>Modèle actif :</span>
                  <button
                    onClick={() => setCurrentModel(currentModel === 'magistral-medium' ? 'mistral-medium-3' : 'magistral-medium')}
                    className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                      currentModel === 'magistral-medium' 
                        ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                    }`}
                  >
                    {currentModel === 'magistral-medium' ? '🧠 Expert' : '⚡ Pratique'}
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400">
                    {currentModel === 'magistral-medium' 
                      ? `${quota.magistralMedium.used}/${quota.magistralMedium.daily}`
                      : `${quota.mistralMedium3.used}/${quota.mistralMedium3.daily}`
                    }
                  </span>
                  <span>Méthode GENIA</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
