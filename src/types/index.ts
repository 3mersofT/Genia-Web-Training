import type { MultimediaBlock } from './multimedia.types'

export type UserRole = 'student' | 'admin'

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'

export type BadgeType = 'completion' | 'streak' | 'perfection' | 'milestone'

export interface User {
  id: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface UserProfile {
  id: string
  userId: string
  displayName?: string
  avatarUrl?: string
  preferences: Record<string, any>
  onboardingCompleted: boolean
}

export interface Module {
  id: string
  orderIndex: number
  title: string
  description?: string
  metadata: Record<string, any>
  icon?: string
  color?: string
  durationMinutes?: number
  isPublished: boolean
}

export interface Capsule {
  id: string
  moduleId: string
  orderIndex: number
  title: string
  durationMinutes: number
  content: Record<string, any>
  multimedia?: MultimediaBlock[]
  exerciseData?: Record<string, any>
  prerequisites?: string[]
  isPublished: boolean
}

export interface UserProgress {
  id: string
  userId: string
  capsuleId: string
  status: ProgressStatus
  startedAt?: Date
  completedAt?: Date
  timeSpentSeconds: number
  exerciseScore?: number
  exerciseAttempts: number
  notes?: string
}

export interface GameState {
  totalPoints: number
  weeklyPoints: number
  monthlyPoints: number
  streakDays: number
  lastActivityDate?: Date
  longestStreak: number
}

export interface Badge {
  id: string
  name: string
  description?: string
  iconUrl?: string
  badgeType: BadgeType
  criteria: Record<string, any>
  pointsValue: number
  orderIndex?: number
  isActive: boolean
}
