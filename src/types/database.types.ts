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
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          display_name: string | null
          username: string | null
          bio: string | null
          role: 'student' | 'admin' | 'teacher'
          onboarding_completed: boolean
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          display_name?: string | null
          username?: string | null
          bio?: string | null
          role?: 'student' | 'admin' | 'teacher'
          onboarding_completed?: boolean
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          display_name?: string | null
          username?: string | null
          bio?: string | null
          role?: 'student' | 'admin' | 'teacher'
          onboarding_completed?: boolean
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "capsules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      feedbacks: {
        Row: {
          id: string
          user_id: string | null
          feedback_type: string
          target_id: string | null
          rating: number | null
          comment: string | null
          categories: Json | null
          is_anonymous: boolean
          user_name: string | null
          user_email: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          feedback_type: string
          target_id?: string | null
          rating?: number | null
          comment?: string | null
          categories?: Json | null
          is_anonymous?: boolean
          user_name?: string | null
          user_email?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          feedback_type?: string
          target_id?: string | null
          rating?: number | null
          comment?: string | null
          categories?: Json | null
          is_anonymous?: boolean
          user_name?: string | null
          user_email?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
