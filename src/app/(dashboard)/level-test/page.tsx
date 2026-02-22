'use client'

import LevelBadge from '@/components/gamification/LevelBadge'
import { LevelProgress, LevelDefinition } from '@/types/levels.types'

export default function LevelTestPage() {
  // Mock data for testing
  const mockLevelDefinition1: LevelDefinition = {
    id: '1',
    level_rank: 1,
    level_name: 'Novice',
    level_name_fr: 'Novice',
    xp_required: 0,
    xp_next_level: 1000,
    icon_emoji: '🌱',
    color_hex: '#94A3B8',
    description: 'Bienvenue dans votre parcours d\'apprentissage',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const mockLevelDefinition2: LevelDefinition = {
    id: '2',
    level_rank: 2,
    level_name: 'Apprentice',
    level_name_fr: 'Apprenti',
    xp_required: 1000,
    xp_next_level: 5000,
    icon_emoji: '📚',
    color_hex: '#60A5FA',
    description: 'Vous progressez bien!',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const mockLevelProgress1: LevelProgress = {
    current_level: mockLevelDefinition1,
    next_level: mockLevelDefinition2,
    current_xp: 350,
    total_xp: 350,
    xp_to_next_level: 650,
    progress_percentage: 35,
    level_rank: 1,
    level_name: 'Novice',
    level_name_fr: 'Novice'
  }

  const mockLevelDefinition3: LevelDefinition = {
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
  }

  const mockLevelProgress2: LevelProgress = {
    current_level: mockLevelDefinition2,
    next_level: mockLevelDefinition3,
    current_xp: 2500,
    total_xp: 3500,
    xp_to_next_level: 1500,
    progress_percentage: 62.5,
    level_rank: 2,
    level_name: 'Apprentice',
    level_name_fr: 'Apprenti'
  }

  const mockLevelDefinition5: LevelDefinition = {
    id: '5',
    level_rank: 5,
    level_name: 'Legend',
    level_name_fr: 'Légende',
    xp_required: 50000,
    xp_next_level: null,
    icon_emoji: '👑',
    color_hex: '#8B5CF6',
    description: 'Vous êtes une légende!',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const mockLevelProgress3: LevelProgress = {
    current_level: mockLevelDefinition5,
    next_level: null,
    current_xp: 25000,
    total_xp: 75000,
    xp_to_next_level: 0,
    progress_percentage: 100,
    level_rank: 5,
    level_name: 'Legend',
    level_name_fr: 'Légende'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          LevelBadge Component Test
        </h1>

        {/* Full Versions */}
        <div className="space-y-8 mb-12">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Novice Level (35% progress)
            </h2>
            <LevelBadge levelProgress={mockLevelProgress1} showDetails={true} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Apprenti Level (62.5% progress)
            </h2>
            <LevelBadge levelProgress={mockLevelProgress2} showDetails={true} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Légende Level (Max Level)
            </h2>
            <LevelBadge levelProgress={mockLevelProgress3} showDetails={true} />
          </div>
        </div>

        {/* Compact Versions */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Compact Versions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LevelBadge levelProgress={mockLevelProgress1} compact={true} />
            <LevelBadge levelProgress={mockLevelProgress2} compact={true} />
            <LevelBadge levelProgress={mockLevelProgress3} compact={true} />
          </div>
        </div>

        {/* Without Details */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Without Stats Details
          </h2>
          <LevelBadge levelProgress={mockLevelProgress2} showDetails={false} />
        </div>
      </div>
    </div>
  )
}
