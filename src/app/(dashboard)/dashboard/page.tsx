'use client'

// Désactiver le prerendering pour éviter l'erreur Supabase sur Vercel
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer, staggerItem, hoverLift, fadeInUp, duration } from '@/lib/animation-presets'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Trophy, Flame, Target, Clock, ChevronRight, BarChart3, Award, Brain, BookOpen, MessageSquare, Play, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { getAllModulesWithProgress, type Module } from '@/lib/data'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { useTranslations } from 'next-intl'
import FeedbackButton from '@/components/feedback/FeedbackButton'
import { BRAND_FULL_NAME } from '@/config/branding'
import { Skeleton } from '@/components/ui/skeleton'
import GENIAOnboarding from '@/components/onboarding/GENIAOnboarding'
import FeatureDiscoveryButton from '@/components/onboarding/FeatureDiscoveryButton'
import { useOnboarding } from '@/hooks/useOnboarding'
import CertificateButton from '@/components/certificates/CertificateButton'
import SkillTreeVisualization from '@/components/gamification/SkillTreeVisualization'
import AdaptiveLevelIndicator from '@/components/gamification/AdaptiveLevelIndicator'

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')
  const { showFullOnboarding, showLiteOnboarding, completeOnboarding, dismissLiteOnboarding, startFullTourFromLite } = useOnboarding(user?.id)
  const [displayName, setDisplayName] = useState<string>('')
  const [modules, setModules] = useState<Module[]>([]) // État local pour les modules
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  
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
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="container mx-auto p-4 md:p-8 space-y-6">
          <div>
            <Skeleton className="h-10 w-72 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-6 border border-border">
                <Skeleton className="h-6 w-48 mb-3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null


  return (
    <div className="min-h-screen bg-background">
      {/* Full onboarding tour (new accounts) */}
      {showFullOnboarding && user && (
        <GENIAOnboarding userId={user.id} onComplete={completeOnboarding} />
      )}

      {/* Feature discovery button (existing accounts) */}
      {showLiteOnboarding && user && (
        <FeatureDiscoveryButton
          onDismiss={dismissLiteOnboarding}
          onStartFullTour={startFullTourFromLite}
        />
      )}

      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">
            {t('title')}
          </h1>
          <button
            onClick={signOut}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t('signOut')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-4 md:mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold font-display text-foreground mb-2">
                {t('welcomeBack')}{displayName ? `, ${displayName}` : ''} ! 👋
              </h2>
              <p className="text-muted-foreground">
                {t('subtitle')}
              </p>
            </div>
            
            {/* Feedback plateforme */}
            <FeedbackButton
              targetType="platform"
              targetId="platform"
              targetTitle={BRAND_FULL_NAME}
              variant="button"
              size="sm"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="mb-4 md:mb-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="brand" className="h-auto py-3 flex-col gap-1" onClick={() => {
              const firstModule = modules[0]
              if (firstModule) router.push(`/modules/${firstModule.slug}`)
              else router.push('/dashboard#modules')
            }}>
              <Play className="w-5 h-5" />
              <span className="text-xs">{/* TODO: i18n */}Continuer</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => router.push('/review')}>
              <Brain className="w-5 h-5" />
              <span className="text-xs">{/* TODO: i18n */}Reviser</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => {
              window.dispatchEvent(new CustomEvent('genia:openChat'))
            }}>
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs">{/* TODO: i18n */}Parler a GENIA</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => router.push('/skill-tree')}>
              <Award className="w-5 h-5" />
              <span className="text-xs">{/* TODO: i18n */}Mes badges</span>
            </Button>
          </div>
        </motion.div>

        {/* Adaptive Level Indicator */}
        <div className="mb-4 md:mb-8" data-onboarding="adaptive-level">
          <AdaptiveLevelIndicator userId={user.id} />
        </div>

        {/* Spaced Repetition Widget */}
        <div className="mb-4 md:mb-8" data-onboarding="spaced-repetition">
          <Link href="/review" className="block bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{t('spacedRepetition.title')}</h3>
                  <p className="text-muted-foreground">{t('spacedRepetition.description')}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        </div>

        {/* Secondary sections — collapsible */}
        <div className="mb-4 md:mb-8">
          <button
            onClick={() => setCollapsedSections(prev => ({ ...prev, extras: !prev.extras }))}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <motion.div animate={{ rotate: collapsedSections.extras ? -90 : 0 }} transition={{ duration: duration.fast }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
            <span className="text-sm font-medium">{/* TODO: i18n */}Tournois, Equipes & Competences</span>
          </button>
          <AnimatePresence initial={false}>
            {!collapsedSections.extras && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: duration.normal }}
                className="overflow-hidden space-y-4"
              >
                {/* Tournament Widget */}
                <div className="bg-card rounded-xl shadow-sm border border-border">
                  <EmptyState
                    icon={Trophy}
                    title={t('tournaments.noTournaments')}
                    description={t('tournaments.comingSoon')}
                    action={{ label: t('tournaments.title'), onClick: () => router.push('/tournaments') }}
                  />
                </div>

                {/* Team Widget */}
                <div className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-xl p-6 shadow-sm border border-border">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-r from-[hsl(228,80%,66%)] to-[hsl(271,37%,46%)] rounded-lg">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{t('teams.title')}</h3>
                      <p className="text-muted-foreground">{t('teams.description')}</p>
                    </div>
                  </div>
                  <div className="bg-card rounded-lg p-4 border">
                    <Button variant="brand" className="w-full" onClick={() => router.push('/teams')}>
                      {t('teams.discover')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats Grid - Progress Section */}
        <motion.div
          id="progress"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-4 md:mb-8"
        >
          {[
            { icon: Trophy, color: 'text-yellow-500', value: stats.totalPoints, label: t('stats.totalPoints'), suffix: '' },
            { icon: Flame, color: 'text-orange-500', value: stats.streakDays, label: 'Streak', suffix: 'j' },
            { icon: Target, color: 'text-green-500', value: stats.completedCapsules, label: t('stats.capsulesDone'), suffix: '' },
            { icon: Clock, color: 'text-blue-500', value: stats.progress, label: t('stats.progress'), suffix: '%' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={i} variants={staggerItem} {...hoverLift} className="bg-card rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} className="text-2xl font-bold" />
                </div>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Défis Quotidiens */}
        <div className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-xl p-6 shadow-sm mb-4 md:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{t('challenges.title')}</h3>
                <p className="text-muted-foreground">{t('challenges.description')}</p>
              </div>
            </div>
            <Link
              href="/challenges"
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t('challenges.viewChallenges')}
            </Link>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-foreground mb-3">
              🎯 <strong>{t('challenges.info')}</strong> : {t('challenges.infoDescription')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('challenges.infoSubtitle')}
            </p>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-xl p-6 shadow-sm mb-4 md:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{t('analytics.title')}</h3>
                <p className="text-muted-foreground">{t('analytics.description')}</p>
              </div>
            </div>
            <Link
              href="/analytics"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {t('analytics.viewAnalytics')}
            </Link>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-foreground mb-3">
              📊 <strong>{t('analytics.info')}</strong> : {t('analytics.infoDescription')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('analytics.infoSubtitle')}
            </p>
          </div>
        </div>
        {/* Master Certificate Section */}
        {user && (() => {
          const allModulesCompleted = modules.length > 0 && modules.every(m => m.progress === 100);

          if (allModulesCompleted) {
            // Show master certificate button
            return (
              <div className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))] rounded-xl p-6 shadow-sm mb-4 md:mb-8 border-2 border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-1">
                        {t('certificate.masterTitle')} 🎓
                      </h3>
                      <p className="text-muted-foreground">
                        {t('certificate.masterDescription')}
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
              <div className="bg-gradient-to-r from-muted to-[hsl(var(--gradient-end))] rounded-xl p-6 shadow-sm mb-4 md:mb-8 border border-border">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-gray-400 to-indigo-400 rounded-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {t('certificate.progressTitle')}
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      {t('certificate.progressDescription')}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                          style={{ width: `${Math.round((completedModules / totalModules) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                        {completedModules}/{totalModules} {t('certificate.modules')}
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
        <motion.div
          id="modules"
          data-onboarding="modules"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-card rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-xl font-bold font-display text-foreground mb-4">{t('modules.title')}</h3>
          {modules.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Aucun module commence"
              description="Commence ta formation au Prompt Engineering"
              action={{ label: "Explorer les modules", onClick: () => router.push('/dashboard#modules') }}
            />
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              {modules.map((m) => (
                <motion.div key={m.id} variants={staggerItem}>
                <Link href={`/modules/${m.slug}`}>
                  <div className="border border-border rounded-lg p-4 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all cursor-pointer">
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
                    <p className="text-sm text-muted-foreground mt-2">{m.progress}% {t('modules.completed')}</p>
                  </div>
                </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
