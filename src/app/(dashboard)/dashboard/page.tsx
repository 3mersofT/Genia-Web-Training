'use client'

// Désactiver le prerendering pour éviter l'erreur Supabase sur Vercel
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Trophy, Flame, Target, Clock, ChevronRight, BarChart3, Award, Brain } from 'lucide-react'
import Link from 'next/link'
import { getAllModulesWithProgress, type Module } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import FeedbackButton from '@/components/feedback/FeedbackButton'
import CertificateButton from '@/components/certificates/CertificateButton'
import SkillTreeVisualization from '@/components/gamification/SkillTreeVisualization'
import AdaptiveLevelIndicator from '@/components/gamification/AdaptiveLevelIndicator'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [displayName, setDisplayName] = useState<string>('')
  const [modules, setModules] = useState<Module[]>([]) // État local pour les modules
  
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
      } catch (error) {
        logger.error('Failed to load profile data', {
          component: 'DashboardPage',
          action: 'loadProfile',
          userId: user?.id,
          error: error instanceof Error ? error.message : String(error)
        })
        // Keep default stats at 0
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


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">
            Prompt Engineering Academy
          </h1>
          <button
            onClick={signOut}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
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
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Bienvenue{displayName ? `, ${displayName}` : ''} ! 👋
              </h2>
              <p className="text-muted-foreground">
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

        {/* Adaptive Level Indicator */}
        <div className="mb-8">
          <AdaptiveLevelIndicator userId={user.id} />
        </div>

        {/* Spaced Repetition Widget */}
        <div className="mb-8">
          <Link href="/review" className="block bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Révisions espacées</h3>
                  <p className="text-muted-foreground">Consolidez vos connaissances avec l'algorithme SM-2</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </div>

        {/* Tournament Widget - empty state until real tournaments are fetched */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Tournois
          </h3>
          <div className="bg-gradient-to-br from-muted to-muted/80 border-2 border-border rounded-xl p-6 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Aucun tournoi disponible</p>
            <p className="text-sm text-muted-foreground mt-1">Les tournois seront bientôt disponibles</p>
          </div>
        </div>

        {/* Skill Progress Widget - empty state until real skill data is fetched */}
        <div className="mb-8">
          <SkillTreeVisualization
            nodes={[]}
            userProgress={{}}
            loading={false}
          />
        </div>

        {/* Team Widget - Coming Soon */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Équipes</h3>
                <p className="text-muted-foreground">Rejoignez ou créez une équipe pour collaborer</p>
              </div>
            </div>
            <div className="bg-card rounded-lg p-4 border">
              <p className="text-foreground mb-2">
                👥 <strong>Travail d'équipe</strong> : Créez ou rejoignez une équipe de 2 à 5 membres
              </p>
              <p className="text-sm text-muted-foreground mb-4">
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
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.totalPoints}</span>
            </div>
            <p className="text-muted-foreground">Points totaux</p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold">{stats.streakDays}j</span>
            </div>
            <p className="text-muted-foreground">Streak</p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold">{stats.completedCapsules}</span>
            </div>
            <p className="text-muted-foreground">Capsules terminées</p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold">{stats.progress}%</span>
            </div>
            <p className="text-muted-foreground">Progression</p>
          </div>
        </div>

        {/* Défis Quotidiens */}
        <div className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Défis Quotidiens</h3>
                <p className="text-muted-foreground">Relevez des challenges de Prompt Engineering</p>
              </div>
            </div>
            <Link
              href="/challenges"
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
            >
              Voir les défis
            </Link>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-foreground mb-3">
              🎯 <strong>Défis quotidiens</strong> : Améliorez vos compétences en Prompt Engineering avec des challenges adaptés à votre niveau.
            </p>
            <p className="text-sm text-muted-foreground">
              Gagnez des points, montez dans le classement et débloquez des badges !
            </p>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Analytiques d'Apprentissage</h3>
                <p className="text-muted-foreground">Visualisez votre progression détaillée</p>
              </div>
            </div>
            <Link
              href="/analytics"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              Voir les analytics
            </Link>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-foreground mb-3">
              📊 <strong>Tableau de bord analytique</strong> : Suivez vos performances, visualisez votre temps d'apprentissage et identifiez vos points forts.
            </p>
            <p className="text-sm text-muted-foreground">
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
              <div className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-xl p-6 shadow-sm mb-8 border-2 border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-1">
                        Certificat Master 🎓
                      </h3>
                      <p className="text-muted-foreground">
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
              <div className="bg-gradient-to-r from-muted to-[hsl(var(--gradient-end))] rounded-xl p-6 shadow-sm mb-8 border border-border">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-gray-400 to-indigo-400 rounded-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      Progression vers le Certificat Master
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      Complétez tous les modules pour débloquer votre certificat master.
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                          style={{ width: `${Math.round((completedModules / totalModules) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground whitespace-nowrap">
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
        <div id="modules" className="bg-card rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-bold text-foreground mb-4">Modules disponibles</h3>
          <div className="space-y-4">
            {modules.map((m) => (
              <Link key={m.id} href={`/modules/${m.slug}`}>
                <div className="border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{m.title}</h4>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500" />
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-full bg-gradient-to-r ${m.color} rounded-full`}
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{m.progress}% complété</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
