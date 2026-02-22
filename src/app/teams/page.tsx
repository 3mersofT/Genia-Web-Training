'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Trophy, Crown, UserPlus, Mail, Star, Award,
  TrendingUp, ChevronLeft, Target, Flame, Shield
} from 'lucide-react';
import Link from 'next/link';
import TeamManager from '@/components/gamification/TeamManager';
import TeamLeaderboard from '@/components/gamification/TeamLeaderboard';
import { Team, TeamMember, TeamInvitation, CreateTeamData, TeamLeaderboardEntry } from '@/types/teams.types';

export default function TeamsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-teams' | 'leaderboard' | 'discover'>('my-teams');
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [publicTeams, setPublicTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const [leaderboard, setLeaderboard] = useState<TeamLeaderboardEntry[]>([]);

  useEffect(() => {
    setMounted(true);
    // Load mock data for demonstration
    loadMockData();
    loadMockLeaderboard();
  }, []);

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
              level: 'Apprenti'
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
              level: 'Apprenti'
            }
          }
        ],
        captain: {
          full_name: 'Marie Dupont',
          avatar_url: ''
        }
      }
    ];

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
    ];

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
    ];

    setMyTeams(mockMyTeams);
    setPublicTeams(mockPublicTeams);
    setCurrentTeam(mockMyTeams[0]);
    setTeamMembers(mockMyTeams[0].members || []);
    setPendingInvitations(mockInvitations);
  };

  const loadMockLeaderboard = () => {
    // Mock leaderboard data
    const mockLeaderboard: TeamLeaderboardEntry[] = [
      {
        team_id: '1',
        rank: 1,
        total_score: 1250,
        challenges_completed: 15,
        tournaments_won: 3,
        average_score: 83.3,
        member_count: 3,
        weekly_score: 450,
        monthly_score: 1250,
        updated_at: '2024-02-20T15:30:00Z',
        team: {
          id: '1',
          name: 'Les Ninjas du Prompt',
          description: 'Équipe dédiée à la maîtrise des techniques avancées de prompt engineering',
          avatar_url: '',
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
          updated_at: '2024-02-20T15:30:00Z'
        }
      },
      {
        team_id: '3',
        rank: 2,
        total_score: 1100,
        challenges_completed: 12,
        tournaments_won: 2,
        average_score: 91.7,
        member_count: 2,
        weekly_score: 380,
        monthly_score: 1100,
        updated_at: '2024-02-20T15:30:00Z',
        team: {
          id: '3',
          name: 'AI Enthusiasts',
          description: 'Passionnés d\'IA et de prompt engineering - tous niveaux bienvenus',
          avatar_url: '',
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
          updated_at: '2024-02-20T15:30:00Z'
        }
      },
      {
        team_id: '4',
        rank: 3,
        total_score: 950,
        challenges_completed: 11,
        tournaments_won: 2,
        average_score: 86.4,
        member_count: 1,
        weekly_score: 320,
        monthly_score: 950,
        updated_at: '2024-02-20T15:30:00Z',
        team: {
          id: '4',
          name: 'Les Stratèges',
          description: 'Équipe orientée stratégie et optimisation',
          avatar_url: '',
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
          updated_at: '2024-02-20T15:30:00Z'
        }
      },
      {
        team_id: '2',
        rank: 4,
        total_score: 850,
        challenges_completed: 10,
        tournaments_won: 1,
        average_score: 85.0,
        member_count: 1,
        weekly_score: 280,
        monthly_score: 850,
        updated_at: '2024-02-20T15:30:00Z',
        team: {
          id: '2',
          name: 'Prompt Masters',
          description: 'Équipe pour débutants et intermédiaires qui veulent progresser ensemble',
          avatar_url: '',
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
          updated_at: '2024-02-20T15:30:00Z'
        }
      }
    ];
    setLeaderboard(mockLeaderboard);
  };

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
    };
    setMyTeams([...myTeams, newTeam]);
    setCurrentTeam(newTeam);
  };

  const handleJoinTeam = (teamId: string) => {
    // Mock implementation
    const team = publicTeams.find(t => t.id === teamId);
    if (team) {
      setMyTeams([...myTeams, team]);
      setCurrentTeam(team);
    }
  };

  const handleLeaveTeam = (teamId: string) => {
    // Mock implementation
    setMyTeams(myTeams.filter(t => t.id !== teamId));
    if (currentTeam?.id === teamId) {
      setCurrentTeam(myTeams[0] || null);
    }
  };

  const handleInviteMember = (teamId: string, email: string) => {
    // Mock implementation - show success message
    alert(`Invitation envoyée à ${email}`);
  };

  const handleAcceptInvitation = (invitationId: string) => {
    // Mock implementation
    const invitation = pendingInvitations.find(inv => inv.id === invitationId);
    if (invitation?.team) {
      setMyTeams([...myTeams, invitation.team]);
      setPendingInvitations(pendingInvitations.filter(inv => inv.id !== invitationId));
    }
  };

  const handleDeclineInvitation = (invitationId: string) => {
    // Mock implementation
    setPendingInvitations(pendingInvitations.filter(inv => inv.id !== invitationId));
  };

  const handleSelectTeam = (teamId: string) => {
    const team = myTeams.find(t => t.id === teamId);
    if (team) {
      setCurrentTeam(team);
      setTeamMembers(team.members || []);
    }
  };

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
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
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
            <div className="hidden md:flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-blue-500">
                  <Users className="w-5 h-5" />
                  <span className="text-2xl font-bold">{myTeams.length}</span>
                </div>
                <p className="text-xs text-gray-500">Mes équipes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Trophy className="w-5 h-5" />
                  <span className="text-2xl font-bold">
                    {myTeams.reduce((sum, team) => sum + team.tournaments_won, 0)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Victoires</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-green-500">
                  <Target className="w-5 h-5" />
                  <span className="text-2xl font-bold">
                    {myTeams.reduce((sum, team) => sum + team.challenges_completed, 0)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Défis complétés</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <button
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'my-teams'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('my-teams')}
            >
              Mes équipes
              {activeTab === 'my-teams' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'discover'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('discover')}
            >
              Découvrir
              {activeTab === 'discover' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'leaderboard'
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('leaderboard')}
            >
              Classement
              {activeTab === 'leaderboard' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'my-teams' && (
            <motion.div
              key="my-teams"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
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
          )}

          {activeTab === 'discover' && (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Équipes publiques</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publicTeams.map((team) => (
                    <div
                      key={team.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{team.name}</h3>
                          <p className="text-sm text-gray-600">{team.description}</p>
                        </div>
                        <div className="flex items-center gap-1 text-blue-500">
                          <Users className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {team.members?.length || 0}/{team.max_members}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {team.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-gray-600">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            <span>{team.total_score}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            <span>{team.tournaments_won}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="w-4 h-4" />
                            <span>{team.current_streak}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinTeam(team.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Rejoindre
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {publicTeams.length === 0 && (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Aucune équipe publique disponible pour le moment</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TeamLeaderboard
                leaderboard={leaderboard}
                isLoading={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
