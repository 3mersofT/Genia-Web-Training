'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Trophy,
  Crown,
  UserPlus,
  Mail,
  Search,
  Star,
  Award,
  Shield,
  Plus,
  X,
  Check,
  ChevronRight,
  Lock,
  Unlock,
  Settings,
  LogOut,
  UserMinus,
  Target
} from 'lucide-react'
import { Team, TeamMember, TeamInvitation, CreateTeamData } from '@/types/teams.types'

interface TeamManagerProps {
  myTeams?: Team[]
  publicTeams?: Team[]
  currentTeam?: Team | null
  teamMembers?: TeamMember[]
  pendingInvitations?: TeamInvitation[]
  onCreateTeam?: (data: CreateTeamData) => void
  onJoinTeam?: (teamId: string) => void
  onLeaveTeam?: (teamId: string) => void
  onInviteMember?: (teamId: string, email: string) => void
  onAcceptInvitation?: (invitationId: string) => void
  onDeclineInvitation?: (invitationId: string) => void
  onSelectTeam?: (teamId: string) => void
}

export default function TeamManager({
  myTeams = [],
  publicTeams = [],
  currentTeam = null,
  teamMembers = [],
  pendingInvitations = [],
  onCreateTeam,
  onJoinTeam,
  onLeaveTeam,
  onInviteMember,
  onAcceptInvitation,
  onDeclineInvitation,
  onSelectTeam
}: TeamManagerProps) {
  const [activeTab, setActiveTab] = useState<'myTeams' | 'discover' | 'invitations'>('myTeams')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [createFormData, setCreateFormData] = useState<CreateTeamData>({
    name: '',
    description: '',
    is_public: true,
    max_members: 5,
    tags: []
  })
  const [inviteEmail, setInviteEmail] = useState('')

  // Filter public teams by search query
  const filteredPublicTeams = publicTeams.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'captain':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'co_captain':
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  // Get role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'captain':
        return 'Capitaine'
      case 'co_captain':
        return 'Co-capitaine'
      case 'member':
        return 'Membre'
      default:
        return role
    }
  }

  // Handle create team
  const handleCreateTeam = () => {
    if (onCreateTeam && createFormData.name.trim()) {
      onCreateTeam(createFormData)
      setShowCreateModal(false)
      setCreateFormData({
        name: '',
        description: '',
        is_public: true,
        max_members: 5,
        tags: []
      })
    }
  }

  // Handle invite member
  const handleInviteMember = () => {
    if (onInviteMember && currentTeam && inviteEmail.trim()) {
      onInviteMember(currentTeam.id, inviteEmail)
      setShowInviteModal(false)
      setInviteEmail('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gestion d&apos;équipes</h2>
              <p className="text-sm text-gray-600">
                Rejoignez une équipe ou créez la vôtre pour collaborer
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Créer une équipe
          </button>
        </div>

        {/* Current Team Summary */}
        {currentTeam && (
          <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Équipe actuelle</p>
                  <p className="text-lg font-bold text-gray-900">{currentTeam.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{currentTeam.total_score}</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{currentTeam.members?.length || 0}</p>
                  <p className="text-xs text-gray-500">Membres</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('myTeams')}
            className={`flex-1 px-6 py-3 font-medium transition-all relative ${
              activeTab === 'myTeams'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              Mes équipes ({myTeams.length})
            </span>
            {activeTab === 'myTeams' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 px-6 py-3 font-medium transition-all relative ${
              activeTab === 'discover'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              Découvrir
            </span>
            {activeTab === 'discover' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`flex-1 px-6 py-3 font-medium transition-all relative ${
              activeTab === 'invitations'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              Invitations
              {pendingInvitations.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {pendingInvitations.length}
                </span>
              )}
            </span>
            {activeTab === 'invitations' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* My Teams Tab */}
            {activeTab === 'myTeams' && (
              <motion.div
                key="myTeams"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {myTeams.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucune équipe
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Vous ne faites partie d&apos;aucune équipe pour le moment
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      Créer votre première équipe
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myTeams.map((team) => (
                      <motion.div
                        key={team.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`border-2 rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                          currentTeam?.id === team.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                        onClick={() => onSelectTeam?.(team.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                              {team.is_public ? (
                                <Unlock className="w-4 h-4 text-green-500" />
                              ) : (
                                <Lock className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            {team.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {team.description}
                              </p>
                            )}
                          </div>
                          {currentTeam?.id === team.id && (
                            <div className="ml-2">
                              <span className="px-2 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full">
                                Actif
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Team Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <Trophy className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-gray-900">{team.total_score}</p>
                            <p className="text-xs text-gray-500">Score</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <Target className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-gray-900">{team.challenges_completed}</p>
                            <p className="text-xs text-gray-500">Défis</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <Award className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                            <p className="text-lg font-bold text-gray-900">{team.tournaments_won}</p>
                            <p className="text-xs text-gray-500">Victoires</p>
                          </div>
                        </div>

                        {/* Members */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {team.members?.length || 0} / {team.max_members} membres
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {currentTeam?.id === team.id && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowInviteModal(true)
                                  }}
                                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                                  title="Inviter un membre"
                                >
                                  <UserPlus className="w-4 h-4 text-blue-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onLeaveTeam?.(team.id)
                                  }}
                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                  title="Quitter l'équipe"
                                >
                                  <LogOut className="w-4 h-4 text-red-600" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Tags */}
                        {team.tags && team.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {team.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 text-xs font-medium bg-white text-gray-700 border border-gray-300 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {team.tags.length > 3 && (
                              <span className="px-2 py-0.5 text-xs font-medium text-gray-500">
                                +{team.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Team Members Section (for current team) */}
                {currentTeam && teamMembers.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      Membres de l&apos;équipe ({teamMembers.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {member.user_profiles?.full_name?.charAt(0) || '?'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              {getRoleIcon(member.role)}
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {member.user_profiles?.full_name || 'Membre'}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {getRoleLabel(member.role)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs text-gray-600">
                                {member.contributions} contributions
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Discover Teams Tab */}
            {activeTab === 'discover' && (
              <motion.div
                key="discover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher une équipe par nom, description ou tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Public Teams List */}
                {filteredPublicTeams.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucune équipe trouvée
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery
                        ? 'Essayez avec d\'autres mots-clés'
                        : 'Aucune équipe publique disponible pour le moment'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPublicTeams.map((team) => (
                      <motion.div
                        key={team.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {team.name}
                            </h3>
                            {team.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {team.description}
                              </p>
                            )}
                          </div>
                          <Unlock className="w-5 h-5 text-green-500 ml-2" />
                        </div>

                        {/* Team Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center p-2 bg-yellow-50 rounded">
                            <Trophy className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
                            <p className="text-sm font-bold text-gray-900">{team.total_score}</p>
                            <p className="text-xs text-gray-500">Score</p>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                            <p className="text-sm font-bold text-gray-900">
                              {team.members?.length || 0}/{team.max_members}
                            </p>
                            <p className="text-xs text-gray-500">Membres</p>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <Award className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                            <p className="text-sm font-bold text-gray-900">{team.tournaments_won}</p>
                            <p className="text-xs text-gray-500">Victoires</p>
                          </div>
                        </div>

                        {/* Captain Info */}
                        {team.captain && (
                          <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-gray-600">
                              Capitaine: <span className="font-semibold">{team.captain.full_name}</span>
                            </span>
                          </div>
                        )}

                        {/* Tags */}
                        {team.tags && team.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {team.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Join Button */}
                        <button
                          onClick={() => onJoinTeam?.(team.id)}
                          disabled={(team.members?.length || 0) >= team.max_members}
                          className={`w-full py-2 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            (team.members?.length || 0) >= team.max_members
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                          }`}
                        >
                          {(team.members?.length || 0) >= team.max_members ? (
                            <>
                              <Lock className="w-4 h-4" />
                              Équipe complète
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Rejoindre
                            </>
                          )}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Invitations Tab */}
            {activeTab === 'invitations' && (
              <motion.div
                key="invitations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {pendingInvitations.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucune invitation
                    </h3>
                    <p className="text-gray-600">
                      Vous n&apos;avez pas d&apos;invitation en attente
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingInvitations.map((invitation) => (
                      <motion.div
                        key={invitation.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              Invitation à rejoindre {invitation.team?.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>
                                Invité par <span className="font-semibold">{invitation.inviter?.full_name}</span>
                              </span>
                            </div>
                            {invitation.message && (
                              <p className="text-sm text-gray-700 mt-2 p-2 bg-white rounded border border-gray-200">
                                &quot;{invitation.message}&quot;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Team Info */}
                        {invitation.team && (
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center p-2 bg-white rounded border border-gray-200">
                              <Trophy className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                              <p className="text-sm font-bold text-gray-900">{invitation.team.total_score}</p>
                              <p className="text-xs text-gray-500">Score</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded border border-gray-200">
                              <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                              <p className="text-sm font-bold text-gray-900">
                                {invitation.team.members?.length || 0}
                              </p>
                              <p className="text-xs text-gray-500">Membres</p>
                            </div>
                            <div className="text-center p-2 bg-white rounded border border-gray-200">
                              <Award className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                              <p className="text-sm font-bold text-gray-900">
                                {invitation.team.tournaments_won}
                              </p>
                              <p className="text-xs text-gray-500">Victoires</p>
                            </div>
                          </div>
                        )}

                        {/* Expiration */}
                        <p className="text-xs text-gray-500 mb-3">
                          Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => onAcceptInvitation?.(invitation.id)}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Accepter
                          </button>
                          <button
                            onClick={() => onDeclineInvitation?.(invitation.id)}
                            className="flex-1 bg-white border-2 border-red-300 text-red-700 py-2 px-4 rounded-lg font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Refuser
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Créer une équipe</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l&apos;équipe *
                </label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  placeholder="Les Ninjas du Prompt"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  placeholder="Une courte description de votre équipe..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre maximum de membres
                </label>
                <select
                  value={createFormData.max_members}
                  onChange={(e) => setCreateFormData({ ...createFormData, max_members: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={2}>2 membres</option>
                  <option value={3}>3 membres</option>
                  <option value={4}>4 membres</option>
                  <option value={5}>5 membres</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={createFormData.is_public}
                  onChange={(e) => setCreateFormData({ ...createFormData, is_public: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_public" className="text-sm text-gray-700 flex items-center gap-2">
                  <Unlock className="w-4 h-4 text-green-500" />
                  Équipe publique (visible par tous)
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={!createFormData.name.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    createFormData.name.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Créer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && currentTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Inviter un membre</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                Équipe: <span className="font-semibold">{currentTeam.name}</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {currentTeam.members?.length || 0} / {currentTeam.max_members} membres
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email du membre *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="membre@exemple.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleInviteMember}
                  disabled={!inviteEmail.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                    inviteEmail.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Envoyer l&apos;invitation
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
