'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import TeamManager from '@/components/gamification/TeamManager'
import TeamLeaderboard from '@/components/gamification/TeamLeaderboard'
import { useTranslations } from 'next-intl'
import { Team, TeamMember, TeamInvitation, CreateTeamData, TeamLeaderboardEntry } from '@/types/teams.types'

export default function TeamsPage() {
  const [mounted, setMounted] = useState(false)
  const t = useTranslations('teams')
  const tc = useTranslations('common')
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [publicTeams, setPublicTeams] = useState<Team[]>([])
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([])
  const [leaderboard, setLeaderboard] = useState<TeamLeaderboardEntry[]>([])

  useEffect(() => {
    setMounted(true)
    // TODO: Fetch teams and leaderboard from API
  }, [])

  const handleCreateTeam = (_data: CreateTeamData) => {
    // TODO: Implement team creation via API
    console.log('Create team - not yet implemented')
  }

  const handleJoinTeam = (_teamId: string) => {
    // TODO: Implement join team via API
    console.log('Join team - not yet implemented')
  }

  const handleLeaveTeam = (_teamId: string) => {
    // TODO: Implement leave team via API
    console.log('Leave team - not yet implemented')
  }

  const handleInviteMember = (_teamId: string, _email: string) => {
    // TODO: Implement invite member via API
    console.log('Invite member - not yet implemented')
  }

  const handleAcceptInvitation = (_invitationId: string) => {
    // TODO: Implement accept invitation via API
    console.log('Accept invitation - not yet implemented')
  }

  const handleDeclineInvitation = (_invitationId: string) => {
    // TODO: Implement decline invitation via API
    console.log('Decline invitation - not yet implemented')
  }

  const handleSelectTeam = (teamId: string) => {
    const team = myTeams.find(t => t.id === teamId)
    if (team) {
      setCurrentTeam(team)
      setTeamMembers(team.members || [])
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--gradient-start))] via-background to-[hsl(var(--gradient-end))]">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
            <p className="text-muted-foreground">{tc('loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--gradient-start))] via-background to-[hsl(var(--gradient-end))]">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
              <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          <TeamManager
            myTeams={myTeams}
            publicTeams={publicTeams}
            currentTeam={currentTeam}
            teamMembers={teamMembers}
            pendingInvitations={pendingInvitations}
            onCreateTeam={handleCreateTeam}
            onJoinTeam={handleJoinTeam}
            onLeaveTeam={handleLeaveTeam}
            onInviteMember={handleInviteMember}
            onAcceptInvitation={handleAcceptInvitation}
            onDeclineInvitation={handleDeclineInvitation}
            onSelectTeam={handleSelectTeam}
          />

          {/* Team Leaderboard */}
          <TeamLeaderboard
            leaderboard={leaderboard}
            isLoading={false}
          />
        </motion.div>
      </div>
    </div>
  )
}
