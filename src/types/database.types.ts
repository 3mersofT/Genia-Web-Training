export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'student' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'student' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'student' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          bio: string | null
          role: 'student' | 'admin'
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          bio?: string | null
          role?: 'student' | 'admin'
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          bio?: string | null
          role?: 'student' | 'admin'
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          order_index: number
          title: string
          description: string | null
          metadata: Json | null
          icon: string | null
          color: string | null
          duration_minutes: number | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_index: number
          title: string
          description?: string | null
          metadata?: Json | null
          icon?: string | null
          color?: string | null
          duration_minutes?: number | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_index?: number
          title?: string
          description?: string | null
          metadata?: Json | null
          icon?: string | null
          color?: string | null
          duration_minutes?: number | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      capsules: {
        Row: {
          id: string
          module_id: string
          order_index: number
          title: string
          duration_minutes: number
          content: Json
          exercise_data: Json | null
          prerequisites: string[] | null
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          order_index: number
          title: string
          duration_minutes: number
          content: Json
          exercise_data?: Json | null
          prerequisites?: string[] | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          order_index?: number
          title?: string
          duration_minutes?: number
          content?: Json
          exercise_data?: Json | null
          prerequisites?: string[] | null
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          capsule_id: string
          status: 'not_started' | 'in_progress' | 'completed'
          started_at: string | null
          completed_at: string | null
          time_spent_seconds: number
          exercise_score: number | null
          exercise_attempts: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          capsule_id: string
          status?: 'not_started' | 'in_progress' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          time_spent_seconds?: number
          exercise_score?: number | null
          exercise_attempts?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          capsule_id?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          started_at?: string | null
          completed_at?: string | null
          time_spent_seconds?: number
          exercise_score?: number | null
          exercise_attempts?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_conversations: {
        Row: {
          id: string
          user_id: string
          capsule_id: string | null
          model: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          capsule_id?: string | null
          model: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          capsule_id?: string | null
          model?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant'
          content?: string
          created_at?: string
        }
      }
      llm_usage: {
        Row: {
          id: string
          user_id: string
          model: string
          date: string
          request_count: number
          total_tokens: number
          total_cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          model: string
          date: string
          request_count?: number
          total_tokens?: number
          total_cost?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          model?: string
          date?: string
          request_count?: number
          total_tokens?: number
          total_cost?: number
          created_at?: string
          updated_at?: string
        }
      }
      generated_exercises: {
        Row: {
          id: string
          user_id: string
          capsule_id: string
          prompt: string
          exercise_data: Json
          user_response: string | null
          feedback: string | null
          score: number | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          capsule_id: string
          prompt: string
          exercise_data: Json
          user_response?: string | null
          feedback?: string | null
          score?: number | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          capsule_id?: string
          prompt?: string
          exercise_data?: Json
          user_response?: string | null
          feedback?: string | null
          score?: number | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
