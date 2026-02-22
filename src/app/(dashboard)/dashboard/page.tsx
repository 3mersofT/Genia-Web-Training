'use client'

// Désactiver le prerendering pour éviter l'erreur Supabase sur Vercel
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { BookOpen, Trophy, Flame, Target, Clock, ChevronRight, BarChart3, Award } from 'lucide-react'
import Link from 'next/link'
import { getAllModules, getAllModulesWithProgress } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import FeedbackButton from '@/components/feedback/FeedbackButton'
import CertificateButton from '@/components/certificates/CertificateButton'
import LevelBadge from '@/components/gamification/LevelBadge'
import TournamentCard from '@/components/gamification/TournamentCard'
import SkillTreeVisualization from '@/components/gamification/SkillTreeVisualization'
import { LevelProgress, LevelDefinition } from '@/types/levels.types'
import { Tournament } from '@/types/tournaments.types'
import { SkillNode, UserSkillProgress } from '@/types/skillTree.types'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [displayName, setDisplayName] = useState<string>('')
  const [modules, setModules] = useState(getAllModules()) // État local pour les modules
  
  const [stats, setStats] = useState({
    totalPoints: 0,
    streakDays: 0,
    completedCapsules: 0,
    progress: 0
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Charger le nom affiché et la vraie progression si dispo
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      // Nom à afficher
      const name = (user.user_metadata as any)?.full_name || user.email || 'Utilisateur'
      setDisplayName(name)

      try {
        // Charger les modules avec la vraie progression
        const modulesWithProgress = await getAllModulesWithProgress(user.id)
        setModules(modulesWithProgress)

        // Points et progression réels si existants
        const [{ data: profile }, { data: progress } ] = await Promise.all([
          supabase.from('user_profiles').select('display_name, user_id').eq('user_id', user.id).maybeSingle(),
          supabase.from('user_progress').select('status').eq('user_id', user.id)
        ])

        const completed = (progress || []).filter((p: { status?: string }) => p.status === 'completed').length
        const totalCaps = modules.reduce((sum, m) => sum + m.capsules.length, 0)
        const percent = totalCaps > 0 ? Math.round((completed / totalCaps) * 100) : 0

        setStats({
          totalPoints: completed * 10,
          streakDays: 0,
          completedCapsules: completed,
          progress: percent
        })

        if (profile?.display_name) {
          setDisplayName(profile.display_name)
        }
      } catch (_) {
        // silencieux: rester sur défauts à 0
      }
    }

    loadProfile()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  // Mock tournament data for demonstration
  const mockTournament: Tournament = {
    id: 'weekly-tournament-1',
    title: 'Tournoi Hebdomadaire - Prompt Masters',
    description: 'Affrontez les meilleurs prompt engineers de la communauté dans un tournoi éliminatoire passionnant!',
    tournament_type: 'weekly',
    status: 'registration',
    start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    registration_deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    max_participants: 32,
    min_participants: 8,
    bracket_type: 'single_elimination',
    difficulty: 'intermediate',
    prize_pool: { first: 1000, second: 500, third: 250 },
    xp_rewards: { first: 500, second: 300, third: 150, participant: 50 },
    participant_count: 18,
    current_round: 0,
    tags: ['Prompt Engineering', 'Technique Avancée', 'Compétition'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Mock skill tree data
  const mockSkillNodes: SkillNode[] = [
    {
      id: 'skill-1',
      category_id: 'cat-1',
      skill_key: 'basic_prompting',
      name: 'Basic Prompting',
      name_fr: 'Prompting de Base',
      tree_level: 0,
      display_order: 1,
      prerequisites: [],
      min_level_required: 1,
      xp_required: 0,
      description: 'Les fondamentaux du prompt engineering',
      unlock_type: 'automatic',
      icon_emoji: '🎯',
      difficulty: 'beginner',
      estimated_time: 30,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'skill-2',
      category_id: 'cat-1',
      skill_key: 'context_control',
      name: 'Context Control',
      name_fr: 'Contrôle du Contexte',
      tree_level: 1,
      display_order: 1,
      prerequisites: ['skill-1'],
      min_level_required: 2,
      xp_required: 500,
      description: 'Maîtriser le contrôle du contexte dans vos prompts',
      unlock_type: 'automatic',
      icon_emoji: '📝',
      difficulty: 'intermediate',
      estimated_time: 45,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'skill-3',
      category_id: 'cat-2',
      skill_key: 'advanced_techniques',
      name: 'Advanced Techniques',
      name_fr: 'Techniques Avancées',
      tree_level: 2,
      display_order: 1,
      prerequisites: ['skill-2'],
      min_level_required: 4,
      xp_required: 2000,
      description: 'Techniques avancées de prompt engineering',
      unlock_type: 'challenge',
      icon_emoji: '⚡',
      difficulty: 'advanced',
      estimated_time: 60,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  const mockUserProgress: Record<string, UserSkillProgress> = {
    'skill-1': {
      id: 'prog-1',
      user_id: user.id,
      skill_node_id: 'skill-1',
      status: 'completed',
      progress_percentage: 100,
      practice_count: 5,
      success_count: 5,
      unlocked_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    'skill-2': {
      id: 'prog-2',
      user_id: user.id,
      skill_node_id: 'skill-2',
      status: 'in_progress',
      progress_percentage: 60,
      practice_count: 3,
      success_count: 2,
      unlocked_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Prompt Engineering Academy
          </h1>
          <button
            onClick={signOut}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Bienvenue{displayName ? `, ${displayName}` : ''} ! 👋
              </h2>
              <p className="text-gray-600">
                Continuez votre parcours d'apprentissage
              </p>
            </div>
            
            {/* Feedback plateforme */}
            <FeedbackButton
              targetType="platform"
              targetId="platform"
              targetTitle="GENIA Web Training"
              variant="button"
              size="sm"
            />
          </div>
        </div>

        {/* Level Badge */}
        <div className="mb-8">
          <LevelBadge
            levelProgress={{
              current_level: {
                id: '2',
                level_rank: 2,
                level_name: 'Apprentice',
                level_name_fr: 'Apprenti',
                xp_required: 1000,
                xp_next_level: 5000,
                icon_emoji: '📚',
                color_hex: '#60A5FA',
                description: 'Vous progressez bien dans votre apprentissage!',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as LevelDefinition,
              next_level: {
                id: '3',
                level_rank: 3,
                level_name: 'Expert',
                level_name_fr: 'Expert',
                xp_required: 5000,
                xp_next_level: 15000,
                icon_emoji: '⚡',
                color_hex: '#F59E0B',
                description: 'Vous maîtrisez les bases',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as LevelDefinition,
              current_xp: 2500,
              total_xp: 3500,
              xp_to_next_level: 1500,
              progress_percentage: 62.5,
              level_rank: 2,
              level_name: 'Apprentice',
              level_name_fr: 'Apprenti'
            }}
            showDetails={true}
          />
        </div>

        {/* Tournament Widget */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Tournoi en cours
          </h3>
          <TournamentCard
            tournament={mockTournament}
            isRegistered={false}
            onViewDetails={(id) => router.push(`/tournaments/${id}`)}
          />
        </div>

        {/* Skill Progress Widget */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-500" />
            Arbre de Compétences
          </h3>
          <SkillTreeVisualization
            nodes={mockSkillNodes}
            userProgress={mockUserProgress}
            loading={false}
            onNodeClick={(node) => console.log('Node clicked:', node)}
          />
        </div>

        {/* Team Widget - Coming Soon */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 shadow-sm border border-blue-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Équipes</h3>
                <p className="text-gray-600">Rejoignez ou créez une équipe pour collaborer</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-300">
              <p className="text-gray-700 mb-2">
                👥 <strong>Travail d'équipe</strong> : Créez ou rejoignez une équipe de 2 à 5 membres
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Participez aux défis d'équipe, montez dans le classement et débloquez des achievements collectifs!
              </p>
              <button
                onClick={() => router.push('/teams')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-semibold"
              >
                Découvrir les équipes
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid - Progress Section */}
        <div id="progress" className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.totalPoints}</span>
            </div>
            <p className="text-gray-600">Points totaux</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold">{stats.streakDays}j</span>
            </div>
            <p className="text-gray-600">Streak</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold">{stats.completedCapsules}</span>
            </div>
            <p className="text-gray-600">Capsules terminées</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold">{stats.progress}%</span>
            </div>
            <p className="text-gray-600">Progression</p>
          </div>
        </div>

        {/* Défis Quotidiens */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Défis Quotidiens</h3>
                <p className="text-gray-600">Relevez des challenges de Prompt Engineering</p>
              </div>
            </div>
            <Link
              href="/challenges"
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
            >
              Voir les défis
            </Link>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <p className="text-gray-700 mb-3">
              🎯 <strong>Défis quotidiens</strong> : Améliorez vos compétences en Prompt Engineering avec des challenges adaptés à votre niveau.
            </p>
            <p className="text-sm text-gray-600">
              Gagnez des points, montez dans le classement et débloquez des badges !
            </p>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Analytiques d'Apprentissage</h3>
                <p className="text-gray-600">Visualisez votre progression détaillée</p>
              </div>
            </div>
            <Link
              href="/analytics"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              Voir les analytics
            </Link>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-gray-700 mb-3">
              📊 <strong>Tableau de bord analytique</strong> : Suivez vos performances, visualisez votre temps d'apprentissage et identifiez vos points forts.
            </p>
            <p className="text-sm text-gray-600">
              Obtenez des insights détaillés sur votre parcours d'apprentissage !
            </p>
          </div>
        </div>
        {/* Master Certificate Section */}
        {user && (() => {
          const allModulesCompleted = modules.length > 0 && modules.every(m => m.progress === 100);

          if (allModulesCompleted) {
            // Show master certificate button
            return (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 shadow-sm mb-8 border-2 border-indigo-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        Certificat Master 🎓
                      </h3>
                      <p className="text-gray-600">
                        Félicitations ! Vous avez terminé tous les modules. Obtenez votre certificat master.
                      </p>
                    </div>
                  </div>
                  <CertificateButton
                    moduleTitle="AI-Powered Prompt Engineering"
                    certificateType="master"
                    variant="button"
                    size="lg"
                  />
                </div>
              </div>
            );
          } else if (modules.length > 0) {
            // Show overall progress
            const completedModules = modules.filter(m => m.progress === 100).length;
            const totalModules = modules.length;

            return (
              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl p-6 shadow-sm mb-8 border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-gray-400 to-indigo-400 rounded-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Progression vers le Certificat Master
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Complétez tous les modules pour débloquer votre certificat master.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                          style={{ width: `${Math.round((completedModules / totalModules) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                        {completedModules}/{totalModules} modules
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })()}

        {/* Modules */}
        <div id="modules" className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Modules disponibles</h3>
          <div className="space-y-4">
            {modules.map((m) => (
              <Link key={m.id} href={`/modules/${m.slug}`}>
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{m.title}</h4>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-full bg-gradient-to-r ${m.color} rounded-full`}
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{m.progress}% complété</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
