'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, Clock, Zap, Target, Users, TrendingUp, 
  ChevronRight, Award, Flame, Star, Timer, CheckCircle,
  AlertCircle, Send, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@supabase/auth-helpers-react';
import { createClient } from '@/lib/supabase/client';
import type { DailyChallenge, ChallengeParticipation, LeaderboardEntry } from '@/types/challenges.types';

interface ChallengeCardProps {
  challenge: DailyChallenge;
  participation: ChallengeParticipation | null;
  onParticipate: () => void;
}

export default function DailyChallengeCard({ 
  challenge, 
  participation,
  onParticipate 
}: ChallengeCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [submission, setSubmission] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  
  const user = useUser();
  const supabase = createClient();

  // Calculer le temps restant
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const diff = endOfDay.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Charger le leaderboard
  useEffect(() => {
    if (challenge?.id) {
      loadLeaderboard();
    }
  }, [challenge?.id]);

  const loadLeaderboard = async () => {
    if (!challenge?.id) return;

    try {
      const { data, error } = await supabase
        .from('challenge_leaderboard')
        .select(`
          *,
          user_profiles!inner(full_name, avatar_url)
        `)
        .eq('challenge_id', challenge.id)
        .order('rank', { ascending: true })
        .limit(5);

      if (!error && data) {
        setLeaderboard(data as LeaderboardEntry[]);
        
        // Trouver le rang de l'utilisateur
        if (user?.id) {
          const userEntry = data.find((entry: any) => entry.user_id === user.id);
          if (userEntry) {
            setUserRank(userEntry.rank);
          }
        }
      }
    } catch (err) {
      console.error('Erreur chargement leaderboard:', err);
    }
  };

  const handleSubmit = async () => {
    if (!submission.trim() || !user?.id || !challenge?.id) return;

    setIsSubmitting(true);
    try {
      // Enregistrer la participation
      const { data, error } = await supabase
        .from('challenge_participations')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          submission: submission.trim(),
          time_spent: Math.floor((Date.now() - startTime) / 1000),
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!error && data) {
        // Animation de succès
        onParticipate();
        setSubmission('');
        
        // Recharger le leaderboard
        await loadLeaderboard();
      }
    } catch (err) {
      console.error('Erreur soumission défi:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [startTime] = useState(Date.now());

  const getDifficultyColor = () => {
    switch (challenge?.difficulty) {
      case 'expert': return 'from-purple-500 to-pink-500';
      case 'advanced': return 'from-blue-500 to-purple-500';
      case 'intermediate': return 'from-green-500 to-blue-500';
      default: return 'from-cyan-500 to-blue-500';
    }
  };

  const getChallengeTypeIcon = () => {
    switch (challenge?.challenge_type) {
      case 'transform': return <RefreshCw className="w-5 h-5" />;
      case 'create': return <Zap className="w-5 h-5" />;
      case 'speed': return <Timer className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  if (!challenge) return null;

  const isCompleted = !!participation?.completed_at;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg overflow-hidden"
    >
      {/* Header avec gradient */}
      <div className={`bg-gradient-to-r ${getDifficultyColor()} p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getChallengeTypeIcon()}
              <span className="text-sm font-medium opacity-90">
                Défi du jour - {challenge.challenge_type}
              </span>
            </div>
            
            <h3 className="text-xl font-bold mb-1">
              {challenge.title}
            </h3>
            
            <p className="text-sm opacity-90 line-clamp-2">
              {challenge.description}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Timer */}
            <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{timeRemaining}</span>
            </div>
            
            {/* Status badge */}
            {isCompleted ? (
              <div className="bg-green-500 rounded-full px-3 py-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Complété</span>
              </div>
            ) : (
              <div className="bg-white/20 backdrop-blur rounded-full px-3 py-1">
                <span className="text-sm font-medium">En cours</span>
              </div>
            )}
          </div>
        </div>

        {/* Bouton d'expansion */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur rounded-lg py-2 hover:bg-white/30 transition-colors"
        >
          <span className="font-medium">
            {isExpanded ? 'Masquer' : 'Participer'}
          </span>
          <ChevronRight className={`w-4 h-4 transition-transform ${
            isExpanded ? 'rotate-90' : ''
          }`} />
        </button>
      </div>

      {/* Mini leaderboard toujours visible */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Top participants
          </h4>
          {userRank && (
            <span className="text-sm text-gray-600">
              Votre rang : #{userRank}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {leaderboard.slice(0, 3).map((entry, index) => (
            <div
              key={entry.user_id}
              className="flex items-center gap-2 bg-white rounded-lg px-2 py-1"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-yellow-100 text-yellow-600' :
                index === 1 ? 'bg-gray-100 text-gray-600' :
                'bg-orange-100 text-orange-600'
              }`}>
                {index + 1}
              </div>
              <span className="text-sm text-gray-700">
                {entry.user_profiles?.full_name || 'Anonyme'}
              </span>
              <span className="text-xs text-gray-500">
                {entry.score}pts
              </span>
            </div>
          ))}
          
          {leaderboard.length === 0 && (
            <span className="text-sm text-gray-500 italic">
              Soyez le premier à participer !
            </span>
          )}
        </div>
      </div>

      {/* Contenu étendu */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t"
          >
            <div className="p-6">
              {/* Instructions détaillées */}
              {challenge.base_prompt && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    📋 Instructions
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                    {challenge.base_prompt}
                  </div>
                </div>
              )}

              {/* Critères de succès */}
              {challenge.success_criteria && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    ✅ Critères de réussite
                  </h4>
                  <ul className="space-y-1">
                    {Object.entries(challenge.success_criteria as Record<string, any>).map(([key, value]) => (
                      <li key={key} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Zone de soumission */}
              {!isCompleted ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    💡 Votre réponse
                  </h4>
                  <textarea
                    value={submission}
                    onChange={(e) => setSubmission(e.target.value)}
                    placeholder="Écrivez votre prompt transformé ici..."
                    className="w-full h-32 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        {Math.floor((Date.now() - startTime) / 60000)} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {leaderboard.length} participants
                      </span>
                    </div>
                    
                    <button
                      onClick={handleSubmit}
                      disabled={!submission.trim() || isSubmitting}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Soumettre
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Défi complété !
                  </h4>
                  <p className="text-gray-600 mb-1">
                    Score : {participation?.score || 0} points
                  </p>
                  <p className="text-sm text-gray-500">
                    Temps : {participation?.time_spent ? Math.floor(participation.time_spent / 60) : 0} minutes
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
