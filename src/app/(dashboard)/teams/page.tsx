'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import TeamManager from '@/components/gamification/TeamManager'
import { Team, TeamMember, TeamInvitation, CreateTeamData } from '@/types/teams.types'

export default function TeamsPage() {
  const [mounted, setMounted] = useState(false)
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [publicTeams, setPublicTeams] = useState<Team[]>([])
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([])

  useEffect(() => {
    setMounted(true)
    // Load mock data for demonstration
    loadMockData()
  }, [])

  const loadMockData = () => {
    // Mock teams data
    const mockMyTeams: Team[] = [
      {
        id: '1',
        name: 'Les Ninjas du Prompt',
        description: 'Équipe dédiée à la maîtrise des techniques avancées de prompt engineering',
        captain_id: 'user-1',
        max_members: 5,
        is_public: true,
        total_score: 1250,
        challenges_completed: 15,
        tournaments_won: 3,
        current_streak: 7,
        tags: ['avancé', 'compétitif', 'actif'],
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-02-20T15:30:00Z',
        members: [
          {
            id: 'm1',
            team_id: '1',
            user_id: 'user-1',
            role: 'captain',
            contributions: 45,
            challenges_completed: 8,
            status: 'active',
            joined_at: '2024-01-15T10:00:00Z',
            user_profiles: {
              full_name: 'Marie Dupont',
              avatar_url: '',
              level: 'Expert'
            }
          },
          {
            id: 'm2',
            team_id: '1',
            user_id: 'user-2',
            role: 'member',
            contributions: 30,
            challenges_completed: 5,
            status: 'active',
            joined_at: '2024-01-16T10:00:00Z',
            user_profiles: {
              full_name: 'Jean Martin',
              avatar_url: '',
              level: 'Intermédiaire'
            }
          },
          {
            id: 'm3',
            team_id: '1',
            user_id: 'user-3',
            role: 'member',
            contributions: 25,
            challenges_completed: 4,
            status: 'active',
            joined_at: '2024-01-17T10:00:00Z',
            user_profiles: {
              full_name: 'Sophie Bernard',
              avatar_url: '',
              level: 'Intermédiaire'
            }
          }
        ],
        captain: {
          full_name: 'Marie Dupont',
          avatar_url: ''
        }
      }
    ]

    const mockPublicTeams: Team[] = [
      {
        id: '2',
        name: 'Prompt Masters',
        description: 'Équipe pour débutants et intermédiaires qui veulent progresser ensemble',
        captain_id: 'user-4',
        max_members: 4,
        is_public: true,
        total_score: 850,
        challenges_completed: 10,
        tournaments_won: 1,
        current_streak: 3,
        tags: ['débutant', 'apprentissage', 'friendly'],
        status: 'active',
        created_at: '2024-02-01T10:00:00Z',
        updated_at: '2024-02-20T15:30:00Z',
        members: [
          {
            id: 'm4',
            team_id: '2',
            user_id: 'user-4',
            role: 'captain',
            contributions: 35,
            challenges_completed: 6,
            status: 'active',
            joined_at: '2024-02-01T10:00:00Z'
          }
        ],
        captain: {
          full_name: 'Pierre Leroux',
          avatar_url: ''
        }
      },
      {
        id: '3',
        name: 'AI Enthusiasts',
        description: 'Passionnés d\'IA et de prompt engineering - tous niveaux bienvenus',
        captain_id: 'user-5',
        max_members: 5,
        is_public: true,
        total_score: 1100,
        challenges_completed: 12,
        tournaments_won: 2,
        current_streak: 5,
        tags: ['IA', 'innovation', 'créatif'],
        status: 'active',
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-02-20T15:30:00Z',
        members: [
          {
            id: 'm5',
            team_id: '3',
            user_id: 'user-5',
            role: 'captain',
            contributions: 40,
            challenges_completed: 7,
            status: 'active',
            joined_at: '2024-01-20T10:00:00Z'
          },
          {
            id: 'm6',
            team_id: '3',
            user_id: 'user-6',
            role: 'member',
            contributions: 28,
            challenges_completed: 5,
            status: 'active',
            joined_at: '2024-01-21T10:00:00Z'
          }
        ],
        captain: {
          full_name: 'Claire Dubois',
          avatar_url: ''
        }
      }
    ]

    const mockInvitations: TeamInvitation[] = [
      {
        id: 'inv1',
        team_id: '4',
        inviter_id: 'user-7',
        invitee_id: 'user-1',
        message: 'Rejoins notre équipe ! On a besoin de ton expertise.',
        status: 'pending',
        expires_at: '2024-03-01T10:00:00Z',
        created_at: '2024-02-15T10:00:00Z',
        team: {
          id: '4',
          name: 'Les Stratèges',
          description: 'Équipe orientée stratégie et optimisation',
          captain_id: 'user-7',
          max_members: 5,
          is_public: true,
          total_score: 950,
          challenges_completed: 11,
          tournaments_won: 2,
          current_streak: 4,
          tags: ['stratégie', 'optimisation'],
          status: 'active',
          created_at: '2024-01-25T10:00:00Z',
          updated_at: '2024-02-20T15:30:00Z',
          members: [
            {
              id: 'm7',
              team_id: '4',
              user_id: 'user-7',
              role: 'captain',
              contributions: 38,
              challenges_completed: 6,
              status: 'active',
              joined_at: '2024-01-25T10:00:00Z'
            }
          ]
        },
        inviter: {
          full_name: 'Thomas Petit',
          avatar_url: ''
        }
      }
    ]

    setMyTeams(mockMyTeams)
    setPublicTeams(mockPublicTeams)
    setCurrentTeam(mockMyTeams[0])
    setTeamMembers(mockMyTeams[0].members || [])
    setPendingInvitations(mockInvitations)
  }

  const handleCreateTeam = (data: CreateTeamData) => {
    // Mock implementation
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: data.name,
      description: data.description,
      captain_id: 'user-1',
      max_members: data.max_members || 5,
      is_public: data.is_public ?? true,
      total_score: 0,
      challenges_completed: 0,
      tournaments_won: 0,
      current_streak: 0,
      tags: data.tags || [],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      members: [],
      captain: {
        full_name: 'Vous',
        avatar_url: ''
      }
    }
    setMyTeams([...myTeams, newTeam])
    setCurrentTeam(newTeam)
  }

  const handleJoinTeam = (teamId: string) => {
    // Mock implementation
    const team = publicTeams.find(t => t.id === teamId)
    if (team) {
      setMyTeams([...myTeams, team])
      setCurrentTeam(team)
    }
  }

  const handleLeaveTeam = (teamId: string) => {
    // Mock implementation
    setMyTeams(myTeams.filter(t => t.id !== teamId))
    if (currentTeam?.id === teamId) {
      setCurrentTeam(myTeams[0] || null)
    }
  }

  const handleInviteMember = (teamId: string, email: string) => {
    // Mock implementation - show success message
    alert(`Invitation envoyée à ${email}`)
  }

  const handleAcceptInvitation = (invitationId: string) => {
    // Mock implementation
    const invitation = pendingInvitations.find(inv => inv.id === invitationId)
    if (invitation?.team) {
      setMyTeams([...myTeams, invitation.team])
      setPendingInvitations(pendingInvitations.filter(inv => inv.id !== invitationId))
    }
  }

  const handleDeclineInvitation = (invitationId: string) => {
    // Mock implementation
    setPendingInvitations(pendingInvitations.filter(inv => inv.id !== invitationId))
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Équipes</h1>
              <p className="text-gray-600">Collaborez avec d&apos;autres apprenants et relevez des défis ensemble</p>
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
        </motion.div>
      </div>
    </div>
  )
}
