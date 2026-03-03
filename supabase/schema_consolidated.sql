-- ===========================================================
-- GENIA Web Training — Consolidated Database Schema
-- Generated: 2026-03-03T10:17:36Z
-- Source: 32 migration files (001–032)
-- Usage: Run once on a fresh Supabase project
-- ===========================================================


-- -----------------------------------------------------------
-- Migration: 001_initial_schema.sql
-- -----------------------------------------------------------

-- ========================================
-- MIGRATION COMPLÈTE - E-LEARNING PLATFORM
-- VERSION CORRIGÉE
-- ========================================

-- Cleanup (if needed for fresh start)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- ========================================
-- ENUMS
-- ========================================

CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE badge_type AS ENUM ('completion', 'streak', 'perfection', 'milestone');
CREATE TYPE exercise_type AS ENUM ('quiz', 'code', 'transform', 'create');

-- ========================================
-- TABLES
-- ========================================

-- User profiles (directement lié à auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role user_role DEFAULT 'student' NOT NULL,
    preferences JSONB DEFAULT '{"theme": "light", "notifications": true, "language": "fr"}'::jsonb,
    onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Modules
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_index INT NOT NULL,
    title TEXT NOT NULL,
    short_title TEXT,
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    icon TEXT,
    color TEXT,
    duration_minutes INT DEFAULT 60,
    difficulty TEXT DEFAULT 'beginner',
    prerequisites TEXT[],
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(order_index)
);

-- Capsules
CREATE TABLE capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
    order_index INT NOT NULL,
    title TEXT NOT NULL,
    duration_minutes INT DEFAULT 5 NOT NULL,
    content JSONB NOT NULL,
    exercise_data JSONB,
    prerequisites UUID[],
    tags TEXT[],
    difficulty TEXT DEFAULT 'beginner',
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(module_id, order_index)
);

-- User progress (référence directement auth.users)
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    capsule_id UUID REFERENCES capsules(id) ON DELETE CASCADE NOT NULL,
    status progress_status DEFAULT 'not_started' NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    time_spent_seconds INT DEFAULT 0 NOT NULL,
    exercise_score DECIMAL(5,2),
    exercise_attempts INT DEFAULT 0 NOT NULL,
    notes TEXT,
    bookmarked BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, capsule_id)
);

-- Points system (référence directement auth.users)
CREATE TABLE user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_points INT DEFAULT 0 NOT NULL,
    weekly_points INT DEFAULT 0 NOT NULL,
    monthly_points INT DEFAULT 0 NOT NULL,
    yearly_points INT DEFAULT 0 NOT NULL,
    streak_days INT DEFAULT 0 NOT NULL,
    last_activity_date DATE,
    longest_streak INT DEFAULT 0 NOT NULL,
    level INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Badges
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    badge_type badge_type NOT NULL,
    criteria JSONB NOT NULL,
    points_value INT DEFAULT 0 NOT NULL,
    order_index INT,
    rarity TEXT DEFAULT 'common',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User badges (référence directement auth.users)
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    seen_at TIMESTAMPTZ,
    shared BOOLEAN DEFAULT FALSE NOT NULL,
    UNIQUE(user_id, badge_id)
);

-- ========================================
-- FONCTION ET TRIGGER POUR CRÉER AUTOMATIQUEMENT LES PROFILS
-- ========================================

-- Fonction qui crée automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id,
        email,
        display_name,
        role,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        'student', -- Par défaut, tout le monde est étudiant
        NOW(),
        NOW()
    );
    
    -- Créer aussi les entrées dans user_points et user_progress_genia
    INSERT INTO public.user_points (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger qui s'exécute à chaque nouvel utilisateur
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- FONCTION POUR UPDATE AUTOMATIQUE
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON user_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour permettre aux admins de voir tous les profils
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- RLS Policies pour user_progress
CREATE POLICY "Users can view own progress" ON user_progress
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies pour user_points
CREATE POLICY "Users can view own points" ON user_points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points" ON user_points
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies pour user_badges
CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

-- Public policies
CREATE POLICY "Public can view modules" ON modules
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view capsules" ON capsules
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view badges" ON badges
    FOR SELECT USING (is_active = true);

-- ========================================
-- INDEXES POUR PERFORMANCE
-- ========================================

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_capsule_id ON user_progress(capsule_id);
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

-- ========================================
-- COMMENTAIRES
-- ========================================

COMMENT ON TABLE user_profiles IS 'Profils utilisateurs avec informations étendues et rôles';
COMMENT ON TABLE modules IS 'Modules de formation';
COMMENT ON TABLE capsules IS 'Capsules de contenu dans les modules';
COMMENT ON TABLE user_progress IS 'Progression des utilisateurs dans les capsules';
COMMENT ON TABLE user_points IS 'Système de points et gamification';
COMMENT ON TABLE badges IS 'Badges disponibles';
COMMENT ON TABLE user_badges IS 'Badges obtenus par les utilisateurs';

-- Fin de la migration

-- -----------------------------------------------------------
-- Migration: 001_initial_schema.sql
-- -----------------------------------------------------------

-- ========================================
-- MIGRATION COMPLÈTE - E-LEARNING PLATFORM
-- VERSION CORRIGÉE
-- ========================================

-- Cleanup (if needed for fresh start)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- ========================================
-- ENUMS
-- ========================================

CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE badge_type AS ENUM ('completion', 'streak', 'perfection', 'milestone');
CREATE TYPE exercise_type AS ENUM ('quiz', 'code', 'transform', 'create');

-- ========================================
-- TABLES
-- ========================================

-- User profiles (directement lié à auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    role user_role DEFAULT 'student' NOT NULL,
    preferences JSONB DEFAULT '{"theme": "light", "notifications": true, "language": "fr"}'::jsonb,
    onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Modules
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_index INT NOT NULL,
    title TEXT NOT NULL,
    short_title TEXT,
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    icon TEXT,
    color TEXT,
    duration_minutes INT DEFAULT 60,
    difficulty TEXT DEFAULT 'beginner',
    prerequisites TEXT[],
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(order_index)
);

-- Capsules
CREATE TABLE capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
    order_index INT NOT NULL,
    title TEXT NOT NULL,
    duration_minutes INT DEFAULT 5 NOT NULL,
    content JSONB NOT NULL,
    exercise_data JSONB,
    prerequisites UUID[],
    tags TEXT[],
    difficulty TEXT DEFAULT 'beginner',
    is_published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(module_id, order_index)
);

-- User progress (référence directement auth.users)
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    capsule_id UUID REFERENCES capsules(id) ON DELETE CASCADE NOT NULL,
    status progress_status DEFAULT 'not_started' NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    time_spent_seconds INT DEFAULT 0 NOT NULL,
    exercise_score DECIMAL(5,2),
    exercise_attempts INT DEFAULT 0 NOT NULL,
    notes TEXT,
    bookmarked BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, capsule_id)
);

-- Points system (référence directement auth.users)
CREATE TABLE user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    total_points INT DEFAULT 0 NOT NULL,
    weekly_points INT DEFAULT 0 NOT NULL,
    monthly_points INT DEFAULT 0 NOT NULL,
    yearly_points INT DEFAULT 0 NOT NULL,
    streak_days INT DEFAULT 0 NOT NULL,
    last_activity_date DATE,
    longest_streak INT DEFAULT 0 NOT NULL,
    level INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Badges
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    badge_type badge_type NOT NULL,
    criteria JSONB NOT NULL,
    points_value INT DEFAULT 0 NOT NULL,
    order_index INT,
    rarity TEXT DEFAULT 'common',
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User badges (référence directement auth.users)
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    seen_at TIMESTAMPTZ,
    shared BOOLEAN DEFAULT FALSE NOT NULL,
    UNIQUE(user_id, badge_id)
);

-- ========================================
-- FONCTION ET TRIGGER POUR CRÉER AUTOMATIQUEMENT LES PROFILS
-- ========================================

-- Fonction qui crée automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id,
        email,
        display_name,
        role,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        'student', -- Par défaut, tout le monde est étudiant
        NOW(),
        NOW()
    );
    
    -- Créer aussi les entrées dans user_points et user_progress_genia
    INSERT INTO public.user_points (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger qui s'exécute à chaque nouvel utilisateur
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- FONCTION POUR UPDATE AUTOMATIQUE
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at BEFORE UPDATE ON user_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour permettre aux admins de voir tous les profils
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- RLS Policies pour user_progress
CREATE POLICY "Users can view own progress" ON user_progress
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies pour user_points
CREATE POLICY "Users can view own points" ON user_points
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points" ON user_points
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies pour user_badges
CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

-- Public policies
CREATE POLICY "Public can view modules" ON modules
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view capsules" ON capsules
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view badges" ON badges
    FOR SELECT USING (is_active = true);

-- ========================================
-- INDEXES POUR PERFORMANCE
-- ========================================

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_capsule_id ON user_progress(capsule_id);
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

-- ========================================
-- COMMENTAIRES
-- ========================================

COMMENT ON TABLE user_profiles IS 'Profils utilisateurs avec informations étendues et rôles';
COMMENT ON TABLE modules IS 'Modules de formation';
COMMENT ON TABLE capsules IS 'Capsules de contenu dans les modules';
COMMENT ON TABLE user_progress IS 'Progression des utilisateurs dans les capsules';
COMMENT ON TABLE user_points IS 'Système de points et gamification';
COMMENT ON TABLE badges IS 'Badges disponibles';
COMMENT ON TABLE user_badges IS 'Badges obtenus par les utilisateurs';

-- Fin de la migration

-- -----------------------------------------------------------
-- Migration: 002_genia_chat_tables.sql
-- -----------------------------------------------------------

-- Migration: 003_genia_chat_tables.sql
-- Description: Tables pour le système de chat GENIA avec Mistral AI

-- ============================================
-- TABLE: llm_usage
-- Tracking de l'utilisation des modèles LLM
-- ============================================
CREATE TABLE IF NOT EXISTS llm_usage (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    model TEXT NOT NULL CHECK (model IN ('magistral-medium', 'mistral-medium-3', 'mistral-small')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INT DEFAULT 0 NOT NULL,
    total_tokens INT DEFAULT 0 NOT NULL,
    total_cost DECIMAL(10, 4) DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, model, date)
);

-- ============================================
-- TABLE: chat_conversations
-- Conversations entre utilisateurs et GENIA
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    capsule_id UUID,
    model TEXT,
    title TEXT,
    context JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TABLE: chat_messages
-- Messages dans les conversations
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model TEXT,
    method_step TEXT CHECK (method_step IN ('G', 'E', 'N', 'I', 'A') OR method_step IS NULL),
    tokens_used INT,
    reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TABLE: generated_exercises
-- Exercices générés par GENIA
-- ============================================
CREATE TABLE IF NOT EXISTS generated_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    capsule_id UUID,
    exercise_prompt TEXT NOT NULL,
    user_response TEXT,
    feedback TEXT,
    score INT CHECK (score >= 0 AND score <= 100),
    attempts INT DEFAULT 0 NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TABLE: user_progress_genia
-- Progression spécifique à la méthode GENIA
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress_genia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    current_level TEXT DEFAULT 'beginner' CHECK (current_level IN ('beginner', 'intermediate', 'advanced')),
    total_messages INT DEFAULT 0 NOT NULL,
    exercises_completed INT DEFAULT 0 NOT NULL,
    exercises_succeeded INT DEFAULT 0 NOT NULL,
    average_score DECIMAL(5, 2) DEFAULT 0,
    streak_days INT DEFAULT 0 NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    genia_stats JSONB DEFAULT '{"G": 0, "E": 0, "N": 0, "I": 0, "A": 0}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES pour performance
-- ============================================
CREATE INDEX idx_llm_usage_user_date ON llm_usage(user_id, date);
CREATE INDEX idx_llm_usage_date ON llm_usage(date);
CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_capsule ON chat_conversations(capsule_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX idx_generated_exercises_user ON generated_exercises(user_id);
CREATE INDEX idx_generated_exercises_capsule ON generated_exercises(capsule_id);
CREATE INDEX idx_user_progress_genia_user ON user_progress_genia(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- llm_usage
ALTER TABLE llm_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own LLM usage" ON llm_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert LLM usage" ON llm_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update LLM usage" ON llm_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- chat_conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON chat_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND chat_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own conversations" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND chat_conversations.user_id = auth.uid()
        )
    );

-- generated_exercises
ALTER TABLE generated_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exercises" ON generated_exercises
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exercises" ON generated_exercises
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises" ON generated_exercises
    FOR UPDATE USING (auth.uid() = user_id);

-- user_progress_genia
ALTER TABLE user_progress_genia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON user_progress_genia
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress_genia
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_llm_usage_updated_at BEFORE UPDATE ON llm_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_exercises_updated_at BEFORE UPDATE ON generated_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_genia_updated_at BEFORE UPDATE ON user_progress_genia
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FONCTION: Calculer les quotas restants
-- ============================================
CREATE OR REPLACE FUNCTION get_user_quota_status(p_user_id UUID)
RETURNS TABLE(
    model TEXT,
    used INT,
    daily_limit INT,
    remaining INT
) AS $$
BEGIN
    RETURN QUERY
    WITH model_limits AS (
        SELECT 
            'magistral-medium'::TEXT as model,
            60 as daily_limit -- Doublé avec nouveau budget
        UNION ALL
        SELECT 
            'mistral-medium-3'::TEXT,
            300 -- Doublé avec nouveau budget
        UNION ALL
        SELECT 
            'mistral-small'::TEXT,
            1000 -- Doublé avec nouveau budget
    ),
    today_usage AS (
        SELECT 
            u.model,
            COALESCE(u.request_count, 0) as used
        FROM llm_usage u
        WHERE u.user_id = p_user_id
        AND u.date = CURRENT_DATE
    )
    SELECT 
        ml.model,
        COALESCE(tu.used, 0)::INT as used,
        ml.daily_limit,
        (ml.daily_limit - COALESCE(tu.used, 0))::INT as remaining
    FROM model_limits ml
    LEFT JOIN today_usage tu ON ml.model = tu.model
    ORDER BY ml.model;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION: Mettre à jour les stats GENIA
-- ============================================
CREATE OR REPLACE FUNCTION update_genia_stats(
    p_user_id UUID,
    p_method_step TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Créer l'entrée si elle n'existe pas
    INSERT INTO user_progress_genia (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Mettre à jour les stats
    IF p_method_step IN ('G', 'E', 'N', 'I', 'A') THEN
        UPDATE user_progress_genia
        SET 
            genia_stats = jsonb_set(
                genia_stats,
                ARRAY[p_method_step],
                to_jsonb((genia_stats->p_method_step)::INT + 1)
            ),
            total_messages = total_messages + 1,
            last_activity = NOW()
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue pour le dashboard des quotas
CREATE OR REPLACE VIEW v_user_quotas AS
SELECT 
    u.user_id,
    u.model,
    u.date,
    u.request_count as used,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 60
        WHEN u.model = 'mistral-medium-3' THEN 300
        WHEN u.model = 'mistral-small' THEN 1000
    END as daily_limit,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 60 - u.request_count
        WHEN u.model = 'mistral-medium-3' THEN 300 - u.request_count
        WHEN u.model = 'mistral-small' THEN 1000 - u.request_count
    END as remaining,
    u.total_tokens,
    u.total_cost
FROM llm_usage u
WHERE u.date = CURRENT_DATE;

-- Vue pour les statistiques utilisateur
CREATE OR REPLACE VIEW v_user_genia_stats AS
SELECT 
    upg.user_id,
    upg.current_level,
    upg.total_messages,
    upg.exercises_completed,
    upg.exercises_succeeded,
    upg.average_score,
    upg.streak_days,
    upg.last_activity,
    upg.genia_stats,
    CASE 
        WHEN upg.exercises_completed > 0 
        THEN ROUND((upg.exercises_succeeded::DECIMAL / upg.exercises_completed) * 100, 2)
        ELSE 0
    END as success_rate
FROM user_progress_genia upg;

-- ============================================
-- DONNÉES INITIALES (optionnel)
-- ============================================

-- Insérer des limites par défaut si nécessaire
-- Ces valeurs peuvent être ajustées selon vos besoins

COMMENT ON TABLE llm_usage IS 'Tracking de l''utilisation quotidienne des modèles LLM par utilisateur';
COMMENT ON TABLE chat_conversations IS 'Conversations entre les utilisateurs et GENIA';
COMMENT ON TABLE chat_messages IS 'Messages échangés dans les conversations';
COMMENT ON TABLE generated_exercises IS 'Exercices générés par GENIA et réponses des utilisateurs';
COMMENT ON TABLE user_progress_genia IS 'Progression et statistiques spécifiques à la méthode GENIA';

-- Fin de la migration

-- -----------------------------------------------------------
-- Migration: 002_genia_chat_tables.sql
-- -----------------------------------------------------------

-- Migration: 003_genia_chat_tables.sql
-- Description: Tables pour le système de chat GENIA avec Mistral AI

-- ============================================
-- TABLE: llm_usage
-- Tracking de l'utilisation des modèles LLM
-- ============================================
CREATE TABLE IF NOT EXISTS llm_usage (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    model TEXT NOT NULL CHECK (model IN ('magistral-medium', 'mistral-medium-3', 'mistral-small')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INT DEFAULT 0 NOT NULL,
    total_tokens INT DEFAULT 0 NOT NULL,
    total_cost DECIMAL(10, 4) DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, model, date)
);

-- ============================================
-- TABLE: chat_conversations
-- Conversations entre utilisateurs et GENIA
-- ============================================
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    capsule_id UUID,
    model TEXT,
    title TEXT,
    context JSONB DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TABLE: chat_messages
-- Messages dans les conversations
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model TEXT,
    method_step TEXT CHECK (method_step IN ('G', 'E', 'N', 'I', 'A') OR method_step IS NULL),
    tokens_used INT,
    reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TABLE: generated_exercises
-- Exercices générés par GENIA
-- ============================================
CREATE TABLE IF NOT EXISTS generated_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    capsule_id UUID,
    exercise_prompt TEXT NOT NULL,
    user_response TEXT,
    feedback TEXT,
    score INT CHECK (score >= 0 AND score <= 100),
    attempts INT DEFAULT 0 NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TABLE: user_progress_genia
-- Progression spécifique à la méthode GENIA
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress_genia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    current_level TEXT DEFAULT 'beginner' CHECK (current_level IN ('beginner', 'intermediate', 'advanced')),
    total_messages INT DEFAULT 0 NOT NULL,
    exercises_completed INT DEFAULT 0 NOT NULL,
    exercises_succeeded INT DEFAULT 0 NOT NULL,
    average_score DECIMAL(5, 2) DEFAULT 0,
    streak_days INT DEFAULT 0 NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    genia_stats JSONB DEFAULT '{"G": 0, "E": 0, "N": 0, "I": 0, "A": 0}' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES pour performance
-- ============================================
CREATE INDEX idx_llm_usage_user_date ON llm_usage(user_id, date);
CREATE INDEX idx_llm_usage_date ON llm_usage(date);
CREATE INDEX idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_capsule ON chat_conversations(capsule_id);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX idx_generated_exercises_user ON generated_exercises(user_id);
CREATE INDEX idx_generated_exercises_capsule ON generated_exercises(capsule_id);
CREATE INDEX idx_user_progress_genia_user ON user_progress_genia(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- llm_usage
ALTER TABLE llm_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own LLM usage" ON llm_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert LLM usage" ON llm_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update LLM usage" ON llm_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- chat_conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON chat_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND chat_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own conversations" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE chat_conversations.id = chat_messages.conversation_id
            AND chat_conversations.user_id = auth.uid()
        )
    );

-- generated_exercises
ALTER TABLE generated_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exercises" ON generated_exercises
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exercises" ON generated_exercises
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises" ON generated_exercises
    FOR UPDATE USING (auth.uid() = user_id);

-- user_progress_genia
ALTER TABLE user_progress_genia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON user_progress_genia
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress_genia
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_llm_usage_updated_at BEFORE UPDATE ON llm_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_exercises_updated_at BEFORE UPDATE ON generated_exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_genia_updated_at BEFORE UPDATE ON user_progress_genia
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FONCTION: Calculer les quotas restants
-- ============================================
CREATE OR REPLACE FUNCTION get_user_quota_status(p_user_id UUID)
RETURNS TABLE(
    model TEXT,
    used INT,
    daily_limit INT,
    remaining INT
) AS $$
BEGIN
    RETURN QUERY
    WITH model_limits AS (
        SELECT 
            'magistral-medium'::TEXT as model,
            60 as daily_limit -- Doublé avec nouveau budget
        UNION ALL
        SELECT 
            'mistral-medium-3'::TEXT,
            300 -- Doublé avec nouveau budget
        UNION ALL
        SELECT 
            'mistral-small'::TEXT,
            1000 -- Doublé avec nouveau budget
    ),
    today_usage AS (
        SELECT 
            u.model,
            COALESCE(u.request_count, 0) as used
        FROM llm_usage u
        WHERE u.user_id = p_user_id
        AND u.date = CURRENT_DATE
    )
    SELECT 
        ml.model,
        COALESCE(tu.used, 0)::INT as used,
        ml.daily_limit,
        (ml.daily_limit - COALESCE(tu.used, 0))::INT as remaining
    FROM model_limits ml
    LEFT JOIN today_usage tu ON ml.model = tu.model
    ORDER BY ml.model;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FONCTION: Mettre à jour les stats GENIA
-- ============================================
CREATE OR REPLACE FUNCTION update_genia_stats(
    p_user_id UUID,
    p_method_step TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Créer l'entrée si elle n'existe pas
    INSERT INTO user_progress_genia (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Mettre à jour les stats
    IF p_method_step IN ('G', 'E', 'N', 'I', 'A') THEN
        UPDATE user_progress_genia
        SET 
            genia_stats = jsonb_set(
                genia_stats,
                ARRAY[p_method_step],
                to_jsonb((genia_stats->p_method_step)::INT + 1)
            ),
            total_messages = total_messages + 1,
            last_activity = NOW()
        WHERE user_id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue pour le dashboard des quotas
CREATE OR REPLACE VIEW v_user_quotas AS
SELECT 
    u.user_id,
    u.model,
    u.date,
    u.request_count as used,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 60
        WHEN u.model = 'mistral-medium-3' THEN 300
        WHEN u.model = 'mistral-small' THEN 1000
    END as daily_limit,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 60 - u.request_count
        WHEN u.model = 'mistral-medium-3' THEN 300 - u.request_count
        WHEN u.model = 'mistral-small' THEN 1000 - u.request_count
    END as remaining,
    u.total_tokens,
    u.total_cost
FROM llm_usage u
WHERE u.date = CURRENT_DATE;

-- Vue pour les statistiques utilisateur
CREATE OR REPLACE VIEW v_user_genia_stats AS
SELECT 
    upg.user_id,
    upg.current_level,
    upg.total_messages,
    upg.exercises_completed,
    upg.exercises_succeeded,
    upg.average_score,
    upg.streak_days,
    upg.last_activity,
    upg.genia_stats,
    CASE 
        WHEN upg.exercises_completed > 0 
        THEN ROUND((upg.exercises_succeeded::DECIMAL / upg.exercises_completed) * 100, 2)
        ELSE 0
    END as success_rate
FROM user_progress_genia upg;

-- ============================================
-- DONNÉES INITIALES (optionnel)
-- ============================================

-- Insérer des limites par défaut si nécessaire
-- Ces valeurs peuvent être ajustées selon vos besoins

COMMENT ON TABLE llm_usage IS 'Tracking de l''utilisation quotidienne des modèles LLM par utilisateur';
COMMENT ON TABLE chat_conversations IS 'Conversations entre les utilisateurs et GENIA';
COMMENT ON TABLE chat_messages IS 'Messages échangés dans les conversations';
COMMENT ON TABLE generated_exercises IS 'Exercices générés par GENIA et réponses des utilisateurs';
COMMENT ON TABLE user_progress_genia IS 'Progression et statistiques spécifiques à la méthode GENIA';

-- Fin de la migration

-- -----------------------------------------------------------
-- Migration: 003_init_demo_accounts.sql
-- -----------------------------------------------------------

-- DÉSACTIVÉ : Les comptes démo ne doivent pas être créés en production
-- =================================================================
-- MIGRATION 004: Demo Accounts Initialization (ARCHIVED)
-- Version: 1.1 (Updated with environment warnings)
-- Description: Creates setup_demo_accounts() function for initializing
--              demo/test user accounts with sample data
--
-- ⚠️  WARNING: DEVELOPMENT/STAGING ENVIRONMENTS ONLY
-- =================================================================
-- This migration creates demo accounts that should NEVER be used in
-- production environments. The setup_demo_accounts() function should
-- ONLY be called in development or staging environments.
--
-- Environment enforcement is handled at the application layer via
-- the ENABLE_DEMO_ACCOUNTS environment variable (see .env.example).
--
-- DO NOT manually call setup_demo_accounts() in production databases!
-- =================================================================

-- Cette fonction configure les comptes après leur création dans Supabase Auth
-- ⚠️  DEV/STAGING ONLY: This function should only be executed in non-production environments
-- CREATE OR REPLACE FUNCTION setup_demo_accounts()
-- RETURNS void AS $$
-- DECLARE
--     v_admin_id UUID;
--     v_student_id UUID;
--     v_demo_id UUID;
-- BEGIN
--     -- Récupérer les IDs des utilisateurs
--     SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@geniawebtraining.com';
--     SELECT id INTO v_student_id FROM auth.users WHERE email = 'student@geniawebtraining.com';
--     SELECT id INTO v_demo_id FROM auth.users WHERE email = 'demo@geniawebtraining.com';
--
--     -- Si les comptes n'existent pas, afficher un message
--     IF v_admin_id IS NULL OR v_student_id IS NULL OR v_demo_id IS NULL THEN
--         RAISE NOTICE 'Créez d''abord les comptes dans Supabase Auth avec ces emails:';
--         RAISE NOTICE '- admin@example.com (Password: [MOT_DE_PASSE_SUPPRIME])';
--         RAISE NOTICE '- student@example.com (Password: [MOT_DE_PASSE_SUPPRIME])';
--         RAISE NOTICE '- demo@example.com (Password: [MOT_DE_PASSE_SUPPRIME])';
--         RETURN;
--     END IF;
--
--     -- Configurer le compte admin
--     IF v_admin_id IS NOT NULL THEN
--         -- Mettre à jour le rôle dans user_profiles
--         UPDATE user_profiles
--         SET
--             role = 'admin',
--             display_name = 'Administrateur GENIA',
--             bio = 'Administrateur de la plateforme GENIA Web Training',
--             onboarding_completed = true,
--             updated_at = NOW()
--         WHERE user_id = v_admin_id;
--
--         -- Mettre à jour les points
--         UPDATE user_points
--         SET
--             total_points = 1000,
--             level = 10,
--             updated_at = NOW()
--         WHERE user_id = v_admin_id;
--
--         -- Initialiser la progression GENIA
--         INSERT INTO user_progress_genia (
--             user_id,
--             current_level,
--             total_messages,
--             exercises_completed,
--             exercises_succeeded,
--             average_score
--         )
--         VALUES (v_admin_id, 'advanced', 100, 50, 45, 90.0)
--         ON CONFLICT (user_id) DO UPDATE
--         SET
--             current_level = EXCLUDED.current_level,
--             total_messages = EXCLUDED.total_messages,
--             exercises_completed = EXCLUDED.exercises_completed,
--             exercises_succeeded = EXCLUDED.exercises_succeeded,
--             average_score = EXCLUDED.average_score,
--             updated_at = NOW();
--
--         RAISE NOTICE 'Compte admin configuré: %', v_admin_id;
--     END IF;
--
--     -- Configurer le compte étudiant test
--     IF v_student_id IS NOT NULL THEN
--         UPDATE user_profiles
--         SET
--             display_name = 'Étudiant Test',
--             bio = 'Compte test pour les étudiants',
--             onboarding_completed = false,
--             updated_at = NOW()
--         WHERE user_id = v_student_id;
--
--         -- Initialiser la progression GENIA
--         INSERT INTO user_progress_genia (user_id)
--         VALUES (v_student_id)
--         ON CONFLICT (user_id) DO NOTHING;
--
--         RAISE NOTICE 'Compte étudiant configuré: %', v_student_id;
--     END IF;
--
--     -- Configurer le compte démo avec des données
--     IF v_demo_id IS NOT NULL THEN
--         UPDATE user_profiles
--         SET
--             display_name = 'Compte Démo',
--             bio = 'Compte de démonstration avec données exemples',
--             onboarding_completed = true,
--             updated_at = NOW()
--         WHERE user_id = v_demo_id;
--
--         UPDATE user_points
--         SET
--             total_points = 250,
--             level = 3,
--             streak_days = 7,
--             updated_at = NOW()
--         WHERE user_id = v_demo_id;
--
--         INSERT INTO user_progress_genia (
--             user_id,
--             current_level,
--             total_messages,
--             exercises_completed,
--             exercises_succeeded,
--             average_score,
--             streak_days
--         )
--         VALUES (v_demo_id, 'intermediate', 25, 10, 8, 80.0, 7)
--         ON CONFLICT (user_id) DO UPDATE
--         SET
--             current_level = EXCLUDED.current_level,
--             total_messages = EXCLUDED.total_messages,
--             exercises_completed = EXCLUDED.exercises_completed,
--             exercises_succeeded = EXCLUDED.exercises_succeeded,
--             average_score = EXCLUDED.average_score,
--             streak_days = EXCLUDED.streak_days,
--             updated_at = NOW();
--
--         RAISE NOTICE 'Compte démo configuré: %', v_demo_id;
--     END IF;
--
--     RAISE NOTICE 'Configuration terminée !';
-- END;
-- $$ LANGUAGE plpgsql;

-- =================================================================
-- ⚠️  CRITICAL: DO NOT EXECUTE IN PRODUCTION
-- =================================================================
-- This function should ONLY be called in development/staging environments.
--
-- To use this function:
-- 1. Ensure ENABLE_DEMO_ACCOUNTS=true in your .env file (dev/staging only)
-- 2. Create the demo accounts manually in Supabase Auth first
-- 3. Then call: SELECT setup_demo_accounts();
--
-- PRODUCTION SAFETY:
-- - Set ENABLE_DEMO_ACCOUNTS=false (or omit) in production .env
-- - Never manually call this function in production databases
-- - Demo accounts should not exist in production environments
-- =================================================================

-- Pour vérifier les comptes après configuration :
-- SELECT
--     au.email,
--     up.role,
--     up.display_name,
--     upg.current_level,
--     upo.total_points,
--     upo.level as user_level
-- FROM auth.users au
-- LEFT JOIN user_profiles up ON au.id = up.user_id
-- LEFT JOIN user_progress_genia upg ON au.id = upg.user_id
-- LEFT JOIN user_points upo ON au.id = upo.user_id
-- WHERE au.email IN (
--     'admin@example.com',
--     'student@example.com',
--     'demo@example.com'
-- );


-- -----------------------------------------------------------
-- Migration: 003_init_demo_accounts.sql
-- -----------------------------------------------------------

-- DÉSACTIVÉ : Les comptes démo ne doivent pas être créés en production
-- =================================================================
-- MIGRATION 004: Demo Accounts Initialization (ARCHIVED)
-- Version: 1.1 (Updated with environment warnings)
-- Description: Creates setup_demo_accounts() function for initializing
--              demo/test user accounts with sample data
--
-- ⚠️  WARNING: DEVELOPMENT/STAGING ENVIRONMENTS ONLY
-- =================================================================
-- This migration creates demo accounts that should NEVER be used in
-- production environments. The setup_demo_accounts() function should
-- ONLY be called in development or staging environments.
--
-- Environment enforcement is handled at the application layer via
-- the ENABLE_DEMO_ACCOUNTS environment variable (see .env.example).
--
-- DO NOT manually call setup_demo_accounts() in production databases!
-- =================================================================

-- Cette fonction configure les comptes après leur création dans Supabase Auth
-- ⚠️  DEV/STAGING ONLY: This function should only be executed in non-production environments
-- CREATE OR REPLACE FUNCTION setup_demo_accounts()
-- RETURNS void AS $$
-- DECLARE
--     v_admin_id UUID;
--     v_student_id UUID;
--     v_demo_id UUID;
-- BEGIN
--     -- Récupérer les IDs des utilisateurs
--     SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@geniawebtraining.com';
--     SELECT id INTO v_student_id FROM auth.users WHERE email = 'student@geniawebtraining.com';
--     SELECT id INTO v_demo_id FROM auth.users WHERE email = 'demo@geniawebtraining.com';
--
--     -- Si les comptes n'existent pas, afficher un message
--     IF v_admin_id IS NULL OR v_student_id IS NULL OR v_demo_id IS NULL THEN
--         RAISE NOTICE 'Créez d''abord les comptes dans Supabase Auth avec ces emails:';
--         RAISE NOTICE '- admin@example.com (Password: [MOT_DE_PASSE_SUPPRIME])';
--         RAISE NOTICE '- student@example.com (Password: [MOT_DE_PASSE_SUPPRIME])';
--         RAISE NOTICE '- demo@example.com (Password: [MOT_DE_PASSE_SUPPRIME])';
--         RETURN;
--     END IF;
--
--     -- Configurer le compte admin
--     IF v_admin_id IS NOT NULL THEN
--         -- Mettre à jour le rôle dans user_profiles
--         UPDATE user_profiles
--         SET
--             role = 'admin',
--             display_name = 'Administrateur GENIA',
--             bio = 'Administrateur de la plateforme GENIA Web Training',
--             onboarding_completed = true,
--             updated_at = NOW()
--         WHERE user_id = v_admin_id;
--
--         -- Mettre à jour les points
--         UPDATE user_points
--         SET
--             total_points = 1000,
--             level = 10,
--             updated_at = NOW()
--         WHERE user_id = v_admin_id;
--
--         -- Initialiser la progression GENIA
--         INSERT INTO user_progress_genia (
--             user_id,
--             current_level,
--             total_messages,
--             exercises_completed,
--             exercises_succeeded,
--             average_score
--         )
--         VALUES (v_admin_id, 'advanced', 100, 50, 45, 90.0)
--         ON CONFLICT (user_id) DO UPDATE
--         SET
--             current_level = EXCLUDED.current_level,
--             total_messages = EXCLUDED.total_messages,
--             exercises_completed = EXCLUDED.exercises_completed,
--             exercises_succeeded = EXCLUDED.exercises_succeeded,
--             average_score = EXCLUDED.average_score,
--             updated_at = NOW();
--
--         RAISE NOTICE 'Compte admin configuré: %', v_admin_id;
--     END IF;
--
--     -- Configurer le compte étudiant test
--     IF v_student_id IS NOT NULL THEN
--         UPDATE user_profiles
--         SET
--             display_name = 'Étudiant Test',
--             bio = 'Compte test pour les étudiants',
--             onboarding_completed = false,
--             updated_at = NOW()
--         WHERE user_id = v_student_id;
--
--         -- Initialiser la progression GENIA
--         INSERT INTO user_progress_genia (user_id)
--         VALUES (v_student_id)
--         ON CONFLICT (user_id) DO NOTHING;
--
--         RAISE NOTICE 'Compte étudiant configuré: %', v_student_id;
--     END IF;
--
--     -- Configurer le compte démo avec des données
--     IF v_demo_id IS NOT NULL THEN
--         UPDATE user_profiles
--         SET
--             display_name = 'Compte Démo',
--             bio = 'Compte de démonstration avec données exemples',
--             onboarding_completed = true,
--             updated_at = NOW()
--         WHERE user_id = v_demo_id;
--
--         UPDATE user_points
--         SET
--             total_points = 250,
--             level = 3,
--             streak_days = 7,
--             updated_at = NOW()
--         WHERE user_id = v_demo_id;
--
--         INSERT INTO user_progress_genia (
--             user_id,
--             current_level,
--             total_messages,
--             exercises_completed,
--             exercises_succeeded,
--             average_score,
--             streak_days
--         )
--         VALUES (v_demo_id, 'intermediate', 25, 10, 8, 80.0, 7)
--         ON CONFLICT (user_id) DO UPDATE
--         SET
--             current_level = EXCLUDED.current_level,
--             total_messages = EXCLUDED.total_messages,
--             exercises_completed = EXCLUDED.exercises_completed,
--             exercises_succeeded = EXCLUDED.exercises_succeeded,
--             average_score = EXCLUDED.average_score,
--             streak_days = EXCLUDED.streak_days,
--             updated_at = NOW();
--
--         RAISE NOTICE 'Compte démo configuré: %', v_demo_id;
--     END IF;
--
--     RAISE NOTICE 'Configuration terminée !';
-- END;
-- $$ LANGUAGE plpgsql;

-- =================================================================
-- ⚠️  CRITICAL: DO NOT EXECUTE IN PRODUCTION
-- =================================================================
-- This function should ONLY be called in development/staging environments.
--
-- To use this function:
-- 1. Ensure ENABLE_DEMO_ACCOUNTS=true in your .env file (dev/staging only)
-- 2. Create the demo accounts manually in Supabase Auth first
-- 3. Then call: SELECT setup_demo_accounts();
--
-- PRODUCTION SAFETY:
-- - Set ENABLE_DEMO_ACCOUNTS=false (or omit) in production .env
-- - Never manually call this function in production databases
-- - Demo accounts should not exist in production environments
-- =================================================================

-- Pour vérifier les comptes après configuration :
-- SELECT
--     au.email,
--     up.role,
--     up.display_name,
--     upg.current_level,
--     upo.total_points,
--     upo.level as user_level
-- FROM auth.users au
-- LEFT JOIN user_profiles up ON au.id = up.user_id
-- LEFT JOIN user_progress_genia upg ON au.id = upg.user_id
-- LEFT JOIN user_points upo ON au.id = upo.user_id
-- WHERE au.email IN (
--     'admin@example.com',
--     'student@example.com',
--     'demo@example.com'
-- );


-- -----------------------------------------------------------
-- Migration: 004_update_rate_limits.sql
-- -----------------------------------------------------------

-- Migration: 005_update_rate_limits.sql
-- Description: Mise à jour des rate limits avec nouveau budget 100€
-- Date: 13/09/2025

-- ============================================
-- MISE À JOUR DES VUES POUR LES NOUVEAUX QUOTAS
-- ============================================

-- Supprimer l'ancienne vue
DROP VIEW IF EXISTS v_user_quotas;

-- Recréer avec les nouveaux quotas doublés
CREATE OR REPLACE VIEW v_user_quotas AS
SELECT 
    u.user_id,
    u.model,
    u.date,
    u.request_count as used,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 60    -- Doublé : 30 → 60
        WHEN u.model = 'mistral-medium-3' THEN 300   -- Doublé : 150 → 300
        WHEN u.model = 'mistral-small' THEN 1000     -- Doublé : 500 → 1000
    END as daily_limit,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 60 - u.request_count
        WHEN u.model = 'mistral-medium-3' THEN 300 - u.request_count
        WHEN u.model = 'mistral-small' THEN 1000 - u.request_count
    END as remaining,
    u.total_tokens,
    u.total_cost
FROM llm_usage u
WHERE u.date = CURRENT_DATE;

-- ============================================
-- MISE À JOUR DE LA FONCTION DE QUOTAS
-- ============================================

CREATE OR REPLACE FUNCTION get_user_quota_status(p_user_id UUID)
RETURNS TABLE(
    model TEXT,
    used INT,
    daily_limit INT,
    remaining INT
) AS $$
BEGIN
    RETURN QUERY
    WITH model_limits AS (
        SELECT 
            'magistral-medium'::TEXT as model,
            60 as daily_limit -- Doublé avec nouveau budget
        UNION ALL
        SELECT 
            'mistral-medium-3'::TEXT,
            300 -- Doublé avec nouveau budget
        UNION ALL
        SELECT 
            'mistral-small'::TEXT,
            1000 -- Doublé avec nouveau budget
    ),
    today_usage AS (
        SELECT 
            u.model,
            COALESCE(u.request_count, 0) as used
        FROM llm_usage u
        WHERE u.user_id = p_user_id
        AND u.date = CURRENT_DATE
    )
    SELECT 
        ml.model,
        COALESCE(tu.used, 0)::INT as used,
        ml.daily_limit,
        (ml.daily_limit - COALESCE(tu.used, 0))::INT as remaining
    FROM model_limits ml
    LEFT JOIN today_usage tu ON ml.model = tu.model
    ORDER BY ml.model;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTAIRES DE DOCUMENTATION
-- ============================================

COMMENT ON VIEW v_user_quotas IS 'Vue des quotas utilisateurs avec limites doublées (budget 100€/mois)';
COMMENT ON FUNCTION get_user_quota_status IS 'Fonction pour obtenir le statut des quotas avec les nouvelles limites (budget 100€/mois)';

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Afficher les nouvelles limites pour vérification
SELECT 
    'magistral-medium' as model, 
    60 as daily_limit,
    '10k → 20k tokens/jour' as description
UNION ALL
SELECT 
    'mistral-medium-3', 
    300,
    '50k → 100k tokens/jour'
UNION ALL
SELECT 
    'mistral-small', 
    1000,
    '200k → 400k tokens/jour';


-- -----------------------------------------------------------
-- Migration: 004_update_rate_limits.sql
-- -----------------------------------------------------------

-- Migration: 005_update_rate_limits.sql
-- Description: Mise à jour des rate limits avec nouveau budget 100€
-- Date: 13/09/2025

-- ============================================
-- MISE À JOUR DES VUES POUR LES NOUVEAUX QUOTAS
-- ============================================

-- Supprimer l'ancienne vue
DROP VIEW IF EXISTS v_user_quotas;

-- Recréer avec les nouveaux quotas doublés
CREATE OR REPLACE VIEW v_user_quotas AS
SELECT 
    u.user_id,
    u.model,
    u.date,
    u.request_count as used,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 60    -- Doublé : 30 → 60
        WHEN u.model = 'mistral-medium-3' THEN 300   -- Doublé : 150 → 300
        WHEN u.model = 'mistral-small' THEN 1000     -- Doublé : 500 → 1000
    END as daily_limit,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 60 - u.request_count
        WHEN u.model = 'mistral-medium-3' THEN 300 - u.request_count
        WHEN u.model = 'mistral-small' THEN 1000 - u.request_count
    END as remaining,
    u.total_tokens,
    u.total_cost
FROM llm_usage u
WHERE u.date = CURRENT_DATE;

-- ============================================
-- MISE À JOUR DE LA FONCTION DE QUOTAS
-- ============================================

CREATE OR REPLACE FUNCTION get_user_quota_status(p_user_id UUID)
RETURNS TABLE(
    model TEXT,
    used INT,
    daily_limit INT,
    remaining INT
) AS $$
BEGIN
    RETURN QUERY
    WITH model_limits AS (
        SELECT 
            'magistral-medium'::TEXT as model,
            60 as daily_limit -- Doublé avec nouveau budget
        UNION ALL
        SELECT 
            'mistral-medium-3'::TEXT,
            300 -- Doublé avec nouveau budget
        UNION ALL
        SELECT 
            'mistral-small'::TEXT,
            1000 -- Doublé avec nouveau budget
    ),
    today_usage AS (
        SELECT 
            u.model,
            COALESCE(u.request_count, 0) as used
        FROM llm_usage u
        WHERE u.user_id = p_user_id
        AND u.date = CURRENT_DATE
    )
    SELECT 
        ml.model,
        COALESCE(tu.used, 0)::INT as used,
        ml.daily_limit,
        (ml.daily_limit - COALESCE(tu.used, 0))::INT as remaining
    FROM model_limits ml
    LEFT JOIN today_usage tu ON ml.model = tu.model
    ORDER BY ml.model;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTAIRES DE DOCUMENTATION
-- ============================================

COMMENT ON VIEW v_user_quotas IS 'Vue des quotas utilisateurs avec limites doublées (budget 100€/mois)';
COMMENT ON FUNCTION get_user_quota_status IS 'Fonction pour obtenir le statut des quotas avec les nouvelles limites (budget 100€/mois)';

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Afficher les nouvelles limites pour vérification
SELECT 
    'magistral-medium' as model, 
    60 as daily_limit,
    '10k → 20k tokens/jour' as description
UNION ALL
SELECT 
    'mistral-medium-3', 
    300,
    '50k → 100k tokens/jour'
UNION ALL
SELECT 
    'mistral-small', 
    1000,
    '200k → 400k tokens/jour';


-- -----------------------------------------------------------
-- Migration: 005_hybrid_content_system.sql
-- -----------------------------------------------------------

-- Migration pour l'architecture hybride JSON + Supabase
-- Création des tables pour la gestion de contenu hybride

-- Table de configuration des modules (métadonnées dynamiques)
CREATE TABLE IF NOT EXISTS public.content_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id TEXT UNIQUE NOT NULL,
  is_published BOOLEAN DEFAULT true,
  custom_order INTEGER,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  modified_by UUID REFERENCES auth.users(id)
);

-- Table de configuration système
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table d'audit pour tracer les actions admin
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'module', 'user', 'system', etc.
  target_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table de notifications pour les admins
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'info', 'warning', 'error', 'success'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table de métriques système pour monitoring
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL,
  metric_unit TEXT,
  tags JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_content_config_module_id ON public.content_config(module_id);
CREATE INDEX IF NOT EXISTS idx_content_config_published ON public.content_config(is_published);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON public.system_config(key);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_admin_id ON public.admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON public.system_metrics(metric_name, recorded_at);

-- RLS (Row Level Security) pour la sécurité
ALTER TABLE public.content_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins seulement
CREATE POLICY "Admins can manage content config" ON public.content_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage system config" ON public.system_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view audit log" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage notifications" ON public.admin_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view metrics" ON public.system_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Fonction pour mettre à jour automatically last_modified
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour content_config
CREATE TRIGGER update_content_config_last_modified
  BEFORE UPDATE ON public.content_config
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified();

-- Fonction pour logger automatiquement les actions admin
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement pour les admins
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  ) THEN
    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_type,
      target_id,
      details
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      CASE 
        WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
        ELSE row_to_json(NEW)
      END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers d'audit pour les tables importantes
CREATE TRIGGER audit_content_config
  AFTER INSERT OR UPDATE OR DELETE ON public.content_config
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- Insérer quelques configurations système par défaut
INSERT INTO public.system_config (key, value, description) VALUES 
  ('maintenance_mode', 'false', 'Mode maintenance de la plateforme'),
  ('last_content_sync', NULL, 'Dernière synchronisation du contenu JSON'),
  ('max_file_upload', '10485760', 'Taille max des fichiers uploadés (10MB)'),
  ('session_timeout', '3600', 'Timeout des sessions en secondes'),
  ('backup_frequency', 'daily', 'Fréquence des backups automatiques')
ON CONFLICT (key) DO NOTHING;


-- -----------------------------------------------------------
-- Migration: 005_hybrid_content_system.sql
-- -----------------------------------------------------------

-- Migration pour l'architecture hybride JSON + Supabase
-- Création des tables pour la gestion de contenu hybride

-- Table de configuration des modules (métadonnées dynamiques)
CREATE TABLE IF NOT EXISTS public.content_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id TEXT UNIQUE NOT NULL,
  is_published BOOLEAN DEFAULT true,
  custom_order INTEGER,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  modified_by UUID REFERENCES auth.users(id)
);

-- Table de configuration système
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table d'audit pour tracer les actions admin
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'module', 'user', 'system', etc.
  target_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table de notifications pour les admins
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'info', 'warning', 'error', 'success'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table de métriques système pour monitoring
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL,
  metric_unit TEXT,
  tags JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_content_config_module_id ON public.content_config(module_id);
CREATE INDEX IF NOT EXISTS idx_content_config_published ON public.content_config(is_published);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON public.system_config(key);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_admin_id ON public.admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON public.system_metrics(metric_name, recorded_at);

-- RLS (Row Level Security) pour la sécurité
ALTER TABLE public.content_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins seulement
CREATE POLICY "Admins can manage content config" ON public.content_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage system config" ON public.system_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view audit log" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage notifications" ON public.admin_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view metrics" ON public.system_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Fonction pour mettre à jour automatically last_modified
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour content_config
CREATE TRIGGER update_content_config_last_modified
  BEFORE UPDATE ON public.content_config
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified();

-- Fonction pour logger automatiquement les actions admin
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement pour les admins
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  ) THEN
    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_type,
      target_id,
      details
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      CASE 
        WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
        ELSE row_to_json(NEW)
      END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers d'audit pour les tables importantes
CREATE TRIGGER audit_content_config
  AFTER INSERT OR UPDATE OR DELETE ON public.content_config
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- Insérer quelques configurations système par défaut
INSERT INTO public.system_config (key, value, description) VALUES 
  ('maintenance_mode', 'false', 'Mode maintenance de la plateforme'),
  ('last_content_sync', NULL, 'Dernière synchronisation du contenu JSON'),
  ('max_file_upload', '10485760', 'Taille max des fichiers uploadés (10MB)'),
  ('session_timeout', '3600', 'Timeout des sessions en secondes'),
  ('backup_frequency', 'daily', 'Fréquence des backups automatiques')
ON CONFLICT (key) DO NOTHING;


-- -----------------------------------------------------------
-- Migration: 006_feedback_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de feedback
-- Version: 2.0.0
-- Date: 2024-12-19

-- Table des feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('module', 'capsule', 'platform')),
  target_id VARCHAR(100) NOT NULL, -- ID du module/capsule ou 'platform'
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  categories TEXT[] DEFAULT '{}', -- ['contenu', 'pedagogie', 'technique', 'ux']
  is_anonymous BOOLEAN DEFAULT false,
  user_name VARCHAR(100), -- Nom affiché si pas anonyme
  user_email VARCHAR(255), -- Email si pas anonyme
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  admin_notes TEXT, -- Notes de l'admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_feedbacks_type_target ON feedbacks(feedback_type, target_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);

-- Table des statistiques de feedback (pour cache)
CREATE TABLE IF NOT EXISTS feedback_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  total_feedbacks INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  rating_distribution JSONB DEFAULT '{}', -- {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
  category_stats JSONB DEFAULT '{}', -- Stats par catégorie
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(target_type, target_id)
);

-- Fonction pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_feedback_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les stats pour le feedback modifié
  INSERT INTO feedback_stats (target_type, target_id, total_feedbacks, average_rating, rating_distribution, category_stats, last_updated)
  SELECT 
    feedback_type,
    target_id,
    COUNT(*) as total_feedbacks,
    ROUND(AVG(rating), 2) as average_rating,
    jsonb_build_object(
      '1', COUNT(*) FILTER (WHERE rating = 1),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '5', COUNT(*) FILTER (WHERE rating = 5)
    ) as rating_distribution,
    jsonb_build_object(
      'contenu', COUNT(*) FILTER (WHERE 'contenu' = ANY(categories)),
      'pedagogie', COUNT(*) FILTER (WHERE 'pedagogie' = ANY(categories)),
      'technique', COUNT(*) FILTER (WHERE 'technique' = ANY(categories)),
      'ux', COUNT(*) FILTER (WHERE 'ux' = ANY(categories))
    ) as category_stats,
    NOW() as last_updated
  FROM feedbacks 
  WHERE feedback_type = COALESCE(NEW.feedback_type, OLD.feedback_type)
    AND target_id = COALESCE(NEW.target_id, OLD.target_id)
    AND status = 'approved'
  GROUP BY feedback_type, target_id
  ON CONFLICT (target_type, target_id) 
  DO UPDATE SET
    total_feedbacks = EXCLUDED.total_feedbacks,
    average_rating = EXCLUDED.average_rating,
    rating_distribution = EXCLUDED.rating_distribution,
    category_stats = EXCLUDED.category_stats,
    last_updated = EXCLUDED.last_updated;
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour les stats automatiquement
CREATE TRIGGER trigger_update_feedback_stats_insert
  AFTER INSERT ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_stats();

CREATE TRIGGER trigger_update_feedback_stats_update
  AFTER UPDATE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_stats();

CREATE TRIGGER trigger_update_feedback_stats_delete
  AFTER DELETE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_stats();

-- RLS (Row Level Security)
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_stats ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour feedbacks
CREATE POLICY "Users can view their own feedbacks" ON feedbacks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedbacks" ON feedbacks
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own feedbacks" ON feedbacks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedbacks" ON feedbacks
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour les admins
CREATE POLICY "Admins can view all feedbacks" ON feedbacks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Politiques pour feedback_stats (lecture seule pour tous)
CREATE POLICY "Anyone can view feedback stats" ON feedback_stats
  FOR SELECT USING (true);

-- Fonction pour obtenir les stats d'un module/capsule
CREATE OR REPLACE FUNCTION get_feedback_stats(target_type_param VARCHAR, target_id_param VARCHAR)
RETURNS TABLE (
  total_feedbacks INTEGER,
  average_rating DECIMAL,
  rating_distribution JSONB,
  category_stats JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(fs.total_feedbacks, 0)::INTEGER,
    COALESCE(fs.average_rating, 0.00)::DECIMAL,
    COALESCE(fs.rating_distribution, '{}'::jsonb),
    COALESCE(fs.category_stats, '{}'::jsonb)
  FROM feedback_stats fs
  WHERE fs.target_type = target_type_param 
    AND fs.target_id = target_id_param;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les feedbacks récents
CREATE OR REPLACE FUNCTION get_recent_feedbacks(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  feedback_type VARCHAR,
  target_id VARCHAR,
  rating INTEGER,
  comment TEXT,
  categories TEXT[],
  is_anonymous BOOLEAN,
  user_name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.feedback_type,
    f.target_id,
    f.rating,
    f.comment,
    f.categories,
    f.is_anonymous,
    f.user_name,
    f.created_at
  FROM feedbacks f
  WHERE f.status = 'approved'
  ORDER BY f.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insertion de données de test
INSERT INTO feedbacks (user_id, feedback_type, target_id, rating, comment, categories, is_anonymous, user_name, status) VALUES
  (NULL, 'platform', 'platform', 5, 'Excellente plateforme, très intuitive !', ARRAY['ux', 'technique'], true, 'Utilisateur anonyme', 'approved'),
  (NULL, 'module', 'fondamentaux', 4, 'Contenu très bien structuré, j''ai appris beaucoup', ARRAY['contenu', 'pedagogie'], true, 'Étudiant', 'approved'),
  (NULL, 'capsule', 'cap-1-3', 5, 'Capsule parfaite, les exemples sont très clairs', ARRAY['pedagogie'], false, 'Marie Dupont', 'approved'),
  (NULL, 'platform', 'platform', 3, 'Bien mais pourrait être plus rapide', ARRAY['technique'], true, 'Utilisateur', 'approved'),
  (NULL, 'module', 'techniques', 4, 'Très utile pour mon travail', ARRAY['contenu'], false, 'Jean Martin', 'approved');

-- Mise à jour des stats initiales (via trigger automatique)
-- Les stats seront mises à jour automatiquement par les triggers


-- -----------------------------------------------------------
-- Migration: 006_feedback_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de feedback
-- Version: 2.0.0
-- Date: 2024-12-19

-- Table des feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('module', 'capsule', 'platform')),
  target_id VARCHAR(100) NOT NULL, -- ID du module/capsule ou 'platform'
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  categories TEXT[] DEFAULT '{}', -- ['contenu', 'pedagogie', 'technique', 'ux']
  is_anonymous BOOLEAN DEFAULT false,
  user_name VARCHAR(100), -- Nom affiché si pas anonyme
  user_email VARCHAR(255), -- Email si pas anonyme
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  admin_notes TEXT, -- Notes de l'admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_feedbacks_type_target ON feedbacks(feedback_type, target_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);

-- Table des statistiques de feedback (pour cache)
CREATE TABLE IF NOT EXISTS feedback_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  total_feedbacks INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  rating_distribution JSONB DEFAULT '{}', -- {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
  category_stats JSONB DEFAULT '{}', -- Stats par catégorie
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(target_type, target_id)
);

-- Fonction pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_feedback_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les stats pour le feedback modifié
  INSERT INTO feedback_stats (target_type, target_id, total_feedbacks, average_rating, rating_distribution, category_stats, last_updated)
  SELECT 
    feedback_type,
    target_id,
    COUNT(*) as total_feedbacks,
    ROUND(AVG(rating), 2) as average_rating,
    jsonb_build_object(
      '1', COUNT(*) FILTER (WHERE rating = 1),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '5', COUNT(*) FILTER (WHERE rating = 5)
    ) as rating_distribution,
    jsonb_build_object(
      'contenu', COUNT(*) FILTER (WHERE 'contenu' = ANY(categories)),
      'pedagogie', COUNT(*) FILTER (WHERE 'pedagogie' = ANY(categories)),
      'technique', COUNT(*) FILTER (WHERE 'technique' = ANY(categories)),
      'ux', COUNT(*) FILTER (WHERE 'ux' = ANY(categories))
    ) as category_stats,
    NOW() as last_updated
  FROM feedbacks 
  WHERE feedback_type = COALESCE(NEW.feedback_type, OLD.feedback_type)
    AND target_id = COALESCE(NEW.target_id, OLD.target_id)
    AND status = 'approved'
  GROUP BY feedback_type, target_id
  ON CONFLICT (target_type, target_id) 
  DO UPDATE SET
    total_feedbacks = EXCLUDED.total_feedbacks,
    average_rating = EXCLUDED.average_rating,
    rating_distribution = EXCLUDED.rating_distribution,
    category_stats = EXCLUDED.category_stats,
    last_updated = EXCLUDED.last_updated;
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour les stats automatiquement
CREATE TRIGGER trigger_update_feedback_stats_insert
  AFTER INSERT ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_stats();

CREATE TRIGGER trigger_update_feedback_stats_update
  AFTER UPDATE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_stats();

CREATE TRIGGER trigger_update_feedback_stats_delete
  AFTER DELETE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_stats();

-- RLS (Row Level Security)
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_stats ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour feedbacks
CREATE POLICY "Users can view their own feedbacks" ON feedbacks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedbacks" ON feedbacks
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own feedbacks" ON feedbacks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedbacks" ON feedbacks
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour les admins
CREATE POLICY "Admins can view all feedbacks" ON feedbacks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Politiques pour feedback_stats (lecture seule pour tous)
CREATE POLICY "Anyone can view feedback stats" ON feedback_stats
  FOR SELECT USING (true);

-- Fonction pour obtenir les stats d'un module/capsule
CREATE OR REPLACE FUNCTION get_feedback_stats(target_type_param VARCHAR, target_id_param VARCHAR)
RETURNS TABLE (
  total_feedbacks INTEGER,
  average_rating DECIMAL,
  rating_distribution JSONB,
  category_stats JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(fs.total_feedbacks, 0)::INTEGER,
    COALESCE(fs.average_rating, 0.00)::DECIMAL,
    COALESCE(fs.rating_distribution, '{}'::jsonb),
    COALESCE(fs.category_stats, '{}'::jsonb)
  FROM feedback_stats fs
  WHERE fs.target_type = target_type_param 
    AND fs.target_id = target_id_param;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les feedbacks récents
CREATE OR REPLACE FUNCTION get_recent_feedbacks(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  feedback_type VARCHAR,
  target_id VARCHAR,
  rating INTEGER,
  comment TEXT,
  categories TEXT[],
  is_anonymous BOOLEAN,
  user_name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.feedback_type,
    f.target_id,
    f.rating,
    f.comment,
    f.categories,
    f.is_anonymous,
    f.user_name,
    f.created_at
  FROM feedbacks f
  WHERE f.status = 'approved'
  ORDER BY f.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insertion de données de test
INSERT INTO feedbacks (user_id, feedback_type, target_id, rating, comment, categories, is_anonymous, user_name, status) VALUES
  (NULL, 'platform', 'platform', 5, 'Excellente plateforme, très intuitive !', ARRAY['ux', 'technique'], true, 'Utilisateur anonyme', 'approved'),
  (NULL, 'module', 'fondamentaux', 4, 'Contenu très bien structuré, j''ai appris beaucoup', ARRAY['contenu', 'pedagogie'], true, 'Étudiant', 'approved'),
  (NULL, 'capsule', 'cap-1-3', 5, 'Capsule parfaite, les exemples sont très clairs', ARRAY['pedagogie'], false, 'Marie Dupont', 'approved'),
  (NULL, 'platform', 'platform', 3, 'Bien mais pourrait être plus rapide', ARRAY['technique'], true, 'Utilisateur', 'approved'),
  (NULL, 'module', 'techniques', 4, 'Très utile pour mon travail', ARRAY['contenu'], false, 'Jean Martin', 'approved');

-- Mise à jour des stats initiales (via trigger automatique)
-- Les stats seront mises à jour automatiquement par les triggers


-- -----------------------------------------------------------
-- Migration: 007_genia_memory_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de mémoire GENIA augmentée
-- Version: 2.2.0
-- Date: 2024-12-19
-- Description: Ajoute la mémoire de session et l'analyse d'apprentissage pour GENIA

-- ============================================
-- TABLE: genia_session_memory
-- Stocke la mémoire contextuelle de chaque session
-- ============================================
CREATE TABLE IF NOT EXISTS genia_session_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL,
  module_id VARCHAR(100),
  capsule_id VARCHAR(100),
  
  -- Analyse de l'apprentissage
  difficulty_points TEXT[] DEFAULT '{}', -- Points où l'utilisateur a eu des difficultés
  successful_patterns TEXT[] DEFAULT '{}', -- Patterns qui fonctionnent bien pour cet utilisateur
  common_mistakes TEXT[] DEFAULT '{}', -- Erreurs récurrentes détectées
  
  -- Style d'apprentissage détecté
  learning_style VARCHAR(50) CHECK (learning_style IN ('visual', 'textual', 'practical', 'mixed')),
  preferred_explanation_length VARCHAR(20) CHECK (preferred_explanation_length IN ('concise', 'detailed', 'very_detailed')),
  
  -- Contexte enrichi
  context_summary TEXT, -- Résumé généré par l'IA du contexte global
  topics_covered TEXT[] DEFAULT '{}', -- Sujets abordés dans la session
  skill_level VARCHAR(20) DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  
  -- Métriques de session
  interactions_count INTEGER DEFAULT 0,
  successful_exercises INTEGER DEFAULT 0,
  failed_exercises INTEGER DEFAULT 0,
  average_response_time INTEGER, -- En secondes
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_session_memory_user_session ON genia_session_memory(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_session_memory_user_module ON genia_session_memory(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_session_memory_last_interaction ON genia_session_memory(last_interaction_at);

-- ============================================
-- TABLE: genia_learning_insights
-- Analyse globale du profil d'apprentissage
-- ============================================
CREATE TABLE IF NOT EXISTS genia_learning_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Analyse des forces et faiblesses
  weakness_areas JSONB DEFAULT '{}', -- {"structure_rctf": 0.6, "personas": 0.8, "formats": 0.4}
  strength_areas JSONB DEFAULT '{}', -- {"contexte": 0.9, "exemples": 0.85}
  improvement_velocity JSONB DEFAULT '{}', -- Vitesse d'amélioration par domaine
  
  -- Recommandations personnalisées
  recommended_focus TEXT[] DEFAULT '{}', -- Domaines à travailler en priorité
  recommended_exercises TEXT[] DEFAULT '{}', -- Types d'exercices suggérés
  recommended_capsules TEXT[] DEFAULT '{}', -- Capsules suggérées basées sur le profil
  
  -- Préférences d'apprentissage
  preferred_time_of_day VARCHAR(20), -- morning, afternoon, evening, night
  average_session_duration INTEGER, -- En minutes
  optimal_difficulty_level DECIMAL(3,2), -- 0.0 à 1.0
  prefers_examples BOOLEAN DEFAULT true,
  prefers_theory BOOLEAN DEFAULT false,
  prefers_practice BOOLEAN DEFAULT true,
  
  -- Historique de progression
  total_sessions INTEGER DEFAULT 0,
  total_learning_time INTEGER DEFAULT 0, -- En minutes
  streak_days INTEGER DEFAULT 0,
  best_streak_days INTEGER DEFAULT 0,
  
  -- Métriques de performance
  overall_progress DECIMAL(5,2) DEFAULT 0.00, -- Pourcentage global
  average_success_rate DECIMAL(5,2) DEFAULT 0.00,
  consistency_score DECIMAL(5,2) DEFAULT 0.00, -- Régularité d'apprentissage
  
  -- IA Insights
  ai_generated_profile TEXT, -- Profil textuel généré par l'IA
  ai_learning_recommendations TEXT, -- Recommandations détaillées
  ai_motivational_message TEXT, -- Message personnalisé de motivation
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: genia_prompt_patterns
-- Bibliothèque de patterns de prompts réussis
-- ============================================
CREATE TABLE IF NOT EXISTS genia_prompt_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pattern details
  pattern_type VARCHAR(50) NOT NULL, -- transformation, creation, analysis, etc.
  pattern_template TEXT NOT NULL,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  usage_count INTEGER DEFAULT 0,
  
  -- Context
  applicable_modules TEXT[] DEFAULT '{}',
  applicable_capsules TEXT[] DEFAULT '{}',
  difficulty_level VARCHAR(20),
  
  -- Sharing
  is_public BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false, -- Vérifié par l'équipe
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour patterns
CREATE INDEX IF NOT EXISTS idx_prompt_patterns_user ON genia_prompt_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_patterns_public ON genia_prompt_patterns(is_public) WHERE is_public = true;

-- ============================================
-- TABLE: genia_messages
-- Messages de chat GENIA pour référence dans les logs
-- ============================================
CREATE TABLE IF NOT EXISTS genia_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour genia_messages
CREATE INDEX IF NOT EXISTS idx_genia_messages_user_session ON genia_messages(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_genia_messages_created ON genia_messages(created_at);

-- ============================================
-- TABLE: genia_interaction_logs
-- Logs détaillés pour analyse ML future
-- ============================================
CREATE TABLE IF NOT EXISTS genia_interaction_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL,
  message_id UUID REFERENCES genia_messages(id) ON DELETE SET NULL,
  
  -- Interaction details
  interaction_type VARCHAR(50) NOT NULL, -- question, exercise, feedback, hint, correction
  user_input TEXT,
  ai_response TEXT,
  
  -- Quality metrics
  response_quality_score DECIMAL(3,2), -- 0.0 à 1.0, auto-évalué
  user_satisfaction_score INTEGER, -- 1 à 5, si fourni
  was_helpful BOOLEAN,
  
  -- Context
  module_context VARCHAR(100),
  capsule_context VARCHAR(100),
  exercise_id VARCHAR(100),
  
  -- Performance
  response_time_ms INTEGER,
  tokens_used INTEGER,
  model_used VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour logs
CREATE INDEX IF NOT EXISTS idx_interaction_logs_user_session ON genia_interaction_logs(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_created ON genia_interaction_logs(created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour mettre à jour la mémoire de session
CREATE OR REPLACE FUNCTION update_session_memory(
  p_user_id UUID,
  p_session_id UUID,
  p_difficulty_point TEXT DEFAULT NULL,
  p_successful_pattern TEXT DEFAULT NULL,
  p_mistake TEXT DEFAULT NULL,
  p_topic TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_memory_id UUID;
BEGIN
  -- Récupérer ou créer la mémoire de session
  SELECT id INTO v_memory_id 
  FROM genia_session_memory 
  WHERE user_id = p_user_id AND session_id = p_session_id
  LIMIT 1;
  
  IF v_memory_id IS NULL THEN
    INSERT INTO genia_session_memory (user_id, session_id)
    VALUES (p_user_id, p_session_id)
    RETURNING id INTO v_memory_id;
  END IF;
  
  -- Mettre à jour les arrays selon les paramètres
  UPDATE genia_session_memory
  SET
    difficulty_points = CASE 
      WHEN p_difficulty_point IS NOT NULL 
      THEN array_append(difficulty_points, p_difficulty_point)
      ELSE difficulty_points
    END,
    successful_patterns = CASE 
      WHEN p_successful_pattern IS NOT NULL 
      THEN array_append(successful_patterns, p_successful_pattern)
      ELSE successful_patterns
    END,
    common_mistakes = CASE 
      WHEN p_mistake IS NOT NULL 
      THEN array_append(common_mistakes, p_mistake)
      ELSE common_mistakes
    END,
    topics_covered = CASE 
      WHEN p_topic IS NOT NULL 
      THEN array_append(topics_covered, p_topic)
      ELSE topics_covered
    END,
    interactions_count = interactions_count + 1,
    last_interaction_at = NOW(),
    updated_at = NOW()
  WHERE id = v_memory_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour analyser le style d'apprentissage
CREATE OR REPLACE FUNCTION analyze_learning_style(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_total_interactions INTEGER;
  v_avg_response_time INTEGER;
  v_success_rate DECIMAL;
  v_learning_style VARCHAR(50);
BEGIN
  -- Calculer les métriques
  SELECT 
    SUM(interactions_count),
    AVG(average_response_time),
    CASE 
      WHEN SUM(successful_exercises + failed_exercises) > 0 
      THEN SUM(successful_exercises)::DECIMAL / SUM(successful_exercises + failed_exercises)
      ELSE 0
    END
  INTO v_total_interactions, v_avg_response_time, v_success_rate
  FROM genia_session_memory
  WHERE user_id = p_user_id;
  
  -- Déterminer le style basé sur les patterns
  -- (Logique simplifiée - à enrichir avec ML)
  IF v_avg_response_time < 30 THEN
    v_learning_style := 'practical';
  ELSIF v_success_rate > 0.8 THEN
    v_learning_style := 'visual';
  ELSE
    v_learning_style := 'mixed';
  END IF;
  
  -- Mettre à jour ou créer les insights
  INSERT INTO genia_learning_insights (user_id, total_sessions, average_success_rate)
  VALUES (p_user_id, COALESCE(v_total_interactions, 0), COALESCE(v_success_rate, 0))
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_sessions = COALESCE(v_total_interactions, 0),
    average_success_rate = COALESCE(v_success_rate, 0),
    updated_at = NOW(),
    last_analyzed = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour auto-update des timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_memory_timestamp
  BEFORE UPDATE ON genia_session_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_learning_insights_timestamp
  BEFORE UPDATE ON genia_learning_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Session Memory
ALTER TABLE genia_session_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own session memory" ON genia_session_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own session memory" ON genia_session_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session memory" ON genia_session_memory
  FOR UPDATE USING (auth.uid() = user_id);

-- Learning Insights
ALTER TABLE genia_learning_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights" ON genia_learning_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own insights" ON genia_learning_insights
  FOR ALL USING (auth.uid() = user_id);

-- Prompt Patterns
ALTER TABLE genia_prompt_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own patterns" ON genia_prompt_patterns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view public patterns" ON genia_prompt_patterns
  FOR SELECT USING (is_public = true);

-- Genia Messages
ALTER TABLE genia_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON genia_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages" ON genia_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON genia_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Interaction Logs
ALTER TABLE genia_interaction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs" ON genia_interaction_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert logs" ON genia_interaction_logs
  FOR INSERT WITH CHECK (true);

-- Admins ont accès à tout
CREATE POLICY "Admins can manage all memory data" ON genia_session_memory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all messages" ON genia_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all interaction logs" ON genia_interaction_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- SEED DATA (Optionnel)
-- ============================================

-- Insérer quelques patterns de prompts vérifiés
INSERT INTO genia_prompt_patterns (pattern_type, pattern_template, success_rate, is_public, is_verified)
VALUES 
  ('transformation', 'Transforme ce prompt vague en version RCTF : [PROMPT]', 0.92, true, true),
  ('creation', 'Crée un persona expert en [DOMAINE] avec la méthode ACTEUR', 0.88, true, true),
  ('analysis', 'Analyse ce prompt et identifie les éléments CCFC manquants', 0.85, true, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- INDEXES ADDITIONNELS POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_session_memory_module_capsule 
  ON genia_session_memory(module_id, capsule_id) 
  WHERE module_id IS NOT NULL AND capsule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interaction_logs_quality 
  ON genia_interaction_logs(response_quality_score) 
  WHERE response_quality_score IS NOT NULL;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE genia_messages IS 'Messages de chat GENIA pour référence dans les logs et analyse';
COMMENT ON TABLE genia_session_memory IS 'Stocke la mémoire contextuelle de chaque session utilisateur avec GENIA';
COMMENT ON TABLE genia_learning_insights IS 'Analyse globale du profil d apprentissage de chaque utilisateur';
COMMENT ON TABLE genia_prompt_patterns IS 'Bibliothèque de patterns de prompts réussis partageables';
COMMENT ON TABLE genia_interaction_logs IS 'Logs détaillés des interactions pour analyse ML et amélioration continue';

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 007_genia_memory_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de mémoire GENIA augmentée
-- Version: 2.2.0
-- Date: 2024-12-19
-- Description: Ajoute la mémoire de session et l'analyse d'apprentissage pour GENIA

-- ============================================
-- TABLE: genia_session_memory
-- Stocke la mémoire contextuelle de chaque session
-- ============================================
CREATE TABLE IF NOT EXISTS genia_session_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL,
  module_id VARCHAR(100),
  capsule_id VARCHAR(100),
  
  -- Analyse de l'apprentissage
  difficulty_points TEXT[] DEFAULT '{}', -- Points où l'utilisateur a eu des difficultés
  successful_patterns TEXT[] DEFAULT '{}', -- Patterns qui fonctionnent bien pour cet utilisateur
  common_mistakes TEXT[] DEFAULT '{}', -- Erreurs récurrentes détectées
  
  -- Style d'apprentissage détecté
  learning_style VARCHAR(50) CHECK (learning_style IN ('visual', 'textual', 'practical', 'mixed')),
  preferred_explanation_length VARCHAR(20) CHECK (preferred_explanation_length IN ('concise', 'detailed', 'very_detailed')),
  
  -- Contexte enrichi
  context_summary TEXT, -- Résumé généré par l'IA du contexte global
  topics_covered TEXT[] DEFAULT '{}', -- Sujets abordés dans la session
  skill_level VARCHAR(20) DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  
  -- Métriques de session
  interactions_count INTEGER DEFAULT 0,
  successful_exercises INTEGER DEFAULT 0,
  failed_exercises INTEGER DEFAULT 0,
  average_response_time INTEGER, -- En secondes
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_session_memory_user_session ON genia_session_memory(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_session_memory_user_module ON genia_session_memory(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_session_memory_last_interaction ON genia_session_memory(last_interaction_at);

-- ============================================
-- TABLE: genia_learning_insights
-- Analyse globale du profil d'apprentissage
-- ============================================
CREATE TABLE IF NOT EXISTS genia_learning_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Analyse des forces et faiblesses
  weakness_areas JSONB DEFAULT '{}', -- {"structure_rctf": 0.6, "personas": 0.8, "formats": 0.4}
  strength_areas JSONB DEFAULT '{}', -- {"contexte": 0.9, "exemples": 0.85}
  improvement_velocity JSONB DEFAULT '{}', -- Vitesse d'amélioration par domaine
  
  -- Recommandations personnalisées
  recommended_focus TEXT[] DEFAULT '{}', -- Domaines à travailler en priorité
  recommended_exercises TEXT[] DEFAULT '{}', -- Types d'exercices suggérés
  recommended_capsules TEXT[] DEFAULT '{}', -- Capsules suggérées basées sur le profil
  
  -- Préférences d'apprentissage
  preferred_time_of_day VARCHAR(20), -- morning, afternoon, evening, night
  average_session_duration INTEGER, -- En minutes
  optimal_difficulty_level DECIMAL(3,2), -- 0.0 à 1.0
  prefers_examples BOOLEAN DEFAULT true,
  prefers_theory BOOLEAN DEFAULT false,
  prefers_practice BOOLEAN DEFAULT true,
  
  -- Historique de progression
  total_sessions INTEGER DEFAULT 0,
  total_learning_time INTEGER DEFAULT 0, -- En minutes
  streak_days INTEGER DEFAULT 0,
  best_streak_days INTEGER DEFAULT 0,
  
  -- Métriques de performance
  overall_progress DECIMAL(5,2) DEFAULT 0.00, -- Pourcentage global
  average_success_rate DECIMAL(5,2) DEFAULT 0.00,
  consistency_score DECIMAL(5,2) DEFAULT 0.00, -- Régularité d'apprentissage
  
  -- IA Insights
  ai_generated_profile TEXT, -- Profil textuel généré par l'IA
  ai_learning_recommendations TEXT, -- Recommandations détaillées
  ai_motivational_message TEXT, -- Message personnalisé de motivation
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE: genia_prompt_patterns
-- Bibliothèque de patterns de prompts réussis
-- ============================================
CREATE TABLE IF NOT EXISTS genia_prompt_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pattern details
  pattern_type VARCHAR(50) NOT NULL, -- transformation, creation, analysis, etc.
  pattern_template TEXT NOT NULL,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  usage_count INTEGER DEFAULT 0,
  
  -- Context
  applicable_modules TEXT[] DEFAULT '{}',
  applicable_capsules TEXT[] DEFAULT '{}',
  difficulty_level VARCHAR(20),
  
  -- Sharing
  is_public BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false, -- Vérifié par l'équipe
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour patterns
CREATE INDEX IF NOT EXISTS idx_prompt_patterns_user ON genia_prompt_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_patterns_public ON genia_prompt_patterns(is_public) WHERE is_public = true;

-- ============================================
-- TABLE: genia_messages
-- Messages de chat GENIA pour référence dans les logs
-- ============================================
CREATE TABLE IF NOT EXISTS genia_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour genia_messages
CREATE INDEX IF NOT EXISTS idx_genia_messages_user_session ON genia_messages(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_genia_messages_created ON genia_messages(created_at);

-- ============================================
-- TABLE: genia_interaction_logs
-- Logs détaillés pour analyse ML future
-- ============================================
CREATE TABLE IF NOT EXISTS genia_interaction_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID NOT NULL,
  message_id UUID REFERENCES genia_messages(id) ON DELETE SET NULL,
  
  -- Interaction details
  interaction_type VARCHAR(50) NOT NULL, -- question, exercise, feedback, hint, correction
  user_input TEXT,
  ai_response TEXT,
  
  -- Quality metrics
  response_quality_score DECIMAL(3,2), -- 0.0 à 1.0, auto-évalué
  user_satisfaction_score INTEGER, -- 1 à 5, si fourni
  was_helpful BOOLEAN,
  
  -- Context
  module_context VARCHAR(100),
  capsule_context VARCHAR(100),
  exercise_id VARCHAR(100),
  
  -- Performance
  response_time_ms INTEGER,
  tokens_used INTEGER,
  model_used VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour logs
CREATE INDEX IF NOT EXISTS idx_interaction_logs_user_session ON genia_interaction_logs(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_created ON genia_interaction_logs(created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour mettre à jour la mémoire de session
CREATE OR REPLACE FUNCTION update_session_memory(
  p_user_id UUID,
  p_session_id UUID,
  p_difficulty_point TEXT DEFAULT NULL,
  p_successful_pattern TEXT DEFAULT NULL,
  p_mistake TEXT DEFAULT NULL,
  p_topic TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_memory_id UUID;
BEGIN
  -- Récupérer ou créer la mémoire de session
  SELECT id INTO v_memory_id 
  FROM genia_session_memory 
  WHERE user_id = p_user_id AND session_id = p_session_id
  LIMIT 1;
  
  IF v_memory_id IS NULL THEN
    INSERT INTO genia_session_memory (user_id, session_id)
    VALUES (p_user_id, p_session_id)
    RETURNING id INTO v_memory_id;
  END IF;
  
  -- Mettre à jour les arrays selon les paramètres
  UPDATE genia_session_memory
  SET
    difficulty_points = CASE 
      WHEN p_difficulty_point IS NOT NULL 
      THEN array_append(difficulty_points, p_difficulty_point)
      ELSE difficulty_points
    END,
    successful_patterns = CASE 
      WHEN p_successful_pattern IS NOT NULL 
      THEN array_append(successful_patterns, p_successful_pattern)
      ELSE successful_patterns
    END,
    common_mistakes = CASE 
      WHEN p_mistake IS NOT NULL 
      THEN array_append(common_mistakes, p_mistake)
      ELSE common_mistakes
    END,
    topics_covered = CASE 
      WHEN p_topic IS NOT NULL 
      THEN array_append(topics_covered, p_topic)
      ELSE topics_covered
    END,
    interactions_count = interactions_count + 1,
    last_interaction_at = NOW(),
    updated_at = NOW()
  WHERE id = v_memory_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour analyser le style d'apprentissage
CREATE OR REPLACE FUNCTION analyze_learning_style(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_total_interactions INTEGER;
  v_avg_response_time INTEGER;
  v_success_rate DECIMAL;
  v_learning_style VARCHAR(50);
BEGIN
  -- Calculer les métriques
  SELECT 
    SUM(interactions_count),
    AVG(average_response_time),
    CASE 
      WHEN SUM(successful_exercises + failed_exercises) > 0 
      THEN SUM(successful_exercises)::DECIMAL / SUM(successful_exercises + failed_exercises)
      ELSE 0
    END
  INTO v_total_interactions, v_avg_response_time, v_success_rate
  FROM genia_session_memory
  WHERE user_id = p_user_id;
  
  -- Déterminer le style basé sur les patterns
  -- (Logique simplifiée - à enrichir avec ML)
  IF v_avg_response_time < 30 THEN
    v_learning_style := 'practical';
  ELSIF v_success_rate > 0.8 THEN
    v_learning_style := 'visual';
  ELSE
    v_learning_style := 'mixed';
  END IF;
  
  -- Mettre à jour ou créer les insights
  INSERT INTO genia_learning_insights (user_id, total_sessions, average_success_rate)
  VALUES (p_user_id, COALESCE(v_total_interactions, 0), COALESCE(v_success_rate, 0))
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_sessions = COALESCE(v_total_interactions, 0),
    average_success_rate = COALESCE(v_success_rate, 0),
    updated_at = NOW(),
    last_analyzed = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour auto-update des timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_memory_timestamp
  BEFORE UPDATE ON genia_session_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_update_learning_insights_timestamp
  BEFORE UPDATE ON genia_learning_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Session Memory
ALTER TABLE genia_session_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own session memory" ON genia_session_memory
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own session memory" ON genia_session_memory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session memory" ON genia_session_memory
  FOR UPDATE USING (auth.uid() = user_id);

-- Learning Insights
ALTER TABLE genia_learning_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights" ON genia_learning_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own insights" ON genia_learning_insights
  FOR ALL USING (auth.uid() = user_id);

-- Prompt Patterns
ALTER TABLE genia_prompt_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own patterns" ON genia_prompt_patterns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view public patterns" ON genia_prompt_patterns
  FOR SELECT USING (is_public = true);

-- Genia Messages
ALTER TABLE genia_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON genia_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages" ON genia_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON genia_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Interaction Logs
ALTER TABLE genia_interaction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs" ON genia_interaction_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert logs" ON genia_interaction_logs
  FOR INSERT WITH CHECK (true);

-- Admins ont accès à tout
CREATE POLICY "Admins can manage all memory data" ON genia_session_memory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all messages" ON genia_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all interaction logs" ON genia_interaction_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- SEED DATA (Optionnel)
-- ============================================

-- Insérer quelques patterns de prompts vérifiés
INSERT INTO genia_prompt_patterns (pattern_type, pattern_template, success_rate, is_public, is_verified)
VALUES 
  ('transformation', 'Transforme ce prompt vague en version RCTF : [PROMPT]', 0.92, true, true),
  ('creation', 'Crée un persona expert en [DOMAINE] avec la méthode ACTEUR', 0.88, true, true),
  ('analysis', 'Analyse ce prompt et identifie les éléments CCFC manquants', 0.85, true, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- INDEXES ADDITIONNELS POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_session_memory_module_capsule 
  ON genia_session_memory(module_id, capsule_id) 
  WHERE module_id IS NOT NULL AND capsule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interaction_logs_quality 
  ON genia_interaction_logs(response_quality_score) 
  WHERE response_quality_score IS NOT NULL;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE genia_messages IS 'Messages de chat GENIA pour référence dans les logs et analyse';
COMMENT ON TABLE genia_session_memory IS 'Stocke la mémoire contextuelle de chaque session utilisateur avec GENIA';
COMMENT ON TABLE genia_learning_insights IS 'Analyse globale du profil d apprentissage de chaque utilisateur';
COMMENT ON TABLE genia_prompt_patterns IS 'Bibliothèque de patterns de prompts réussis partageables';
COMMENT ON TABLE genia_interaction_logs IS 'Logs détaillés des interactions pour analyse ML et amélioration continue';

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 008_daily_challenges_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de défis quotidiens
-- Version: 2.2.0  
-- Date: 2024-12-19
-- Description: Tables pour les défis quotidiens, participations et leaderboard

-- ============================================
-- TABLE: daily_challenges
-- Défis quotidiens générés automatiquement
-- ============================================
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date DATE UNIQUE NOT NULL,
  challenge_type VARCHAR(20) NOT NULL CHECK (challenge_type IN ('transform', 'create', 'speed', 'analysis', 'creative')),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  
  -- Contenu du défi
  base_prompt TEXT, -- Pour les défis de transformation
  success_criteria JSONB NOT NULL DEFAULT '{}',
  hints TEXT[] DEFAULT '{}',
  resources TEXT[] DEFAULT '{}',
  
  -- Scoring
  max_score INTEGER DEFAULT 100,
  time_limit INTEGER, -- En secondes (pour défis speed)
  
  -- Métadonnées
  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_active ON daily_challenges(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_daily_challenges_type ON daily_challenges(challenge_type);

-- ============================================
-- TABLE: challenge_participations
-- Participations des utilisateurs aux défis
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_participations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE NOT NULL,
  
  -- Soumission
  submission TEXT NOT NULL,
  time_spent INTEGER NOT NULL, -- En secondes
  hints_used INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 1,
  
  -- Évaluation
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  ai_evaluation JSONB, -- Évaluation détaillée par l'IA
  final_score INTEGER, -- Score après peer review
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unicité (un seul défi par jour par utilisateur)
  UNIQUE(user_id, challenge_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_participations_user ON challenge_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_participations_challenge ON challenge_participations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_participations_completed ON challenge_participations(completed_at);
CREATE INDEX IF NOT EXISTS idx_participations_score ON challenge_participations(score DESC);

-- ============================================
-- TABLE: peer_reviews
-- Évaluations par les pairs
-- ============================================
CREATE TABLE IF NOT EXISTS peer_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participation_id UUID REFERENCES challenge_participations(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_vote BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un reviewer ne peut évaluer qu'une fois
  UNIQUE(participation_id, reviewer_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_peer_reviews_participation ON peer_reviews(participation_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_reviewer ON peer_reviews(reviewer_id);

-- ============================================
-- TABLE: challenge_leaderboard
-- Classement des défis (vue matérialisée pour performance)
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_leaderboard (
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  time_spent INTEGER NOT NULL,
  
  -- Métadonnées
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (challenge_id, user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_leaderboard_challenge_rank ON challenge_leaderboard(challenge_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON challenge_leaderboard(user_id);

-- ============================================
-- TABLE: challenge_achievements
-- Achievements débloqués par les utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  achievement_type VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(100) NOT NULL,
  achievement_description TEXT,
  icon_emoji VARCHAR(10),
  rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  
  progress INTEGER DEFAULT 0,
  max_progress INTEGER,
  
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_achievements_user ON challenge_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked ON challenge_achievements(unlocked_at);

-- ============================================
-- TABLE: challenge_notifications
-- Notifications liées aux défis
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON challenge_notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON challenge_notifications(created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour mettre à jour le leaderboard après participation
CREATE OR REPLACE FUNCTION update_challenge_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les rangs pour ce défi
  WITH ranked_participations AS (
    SELECT 
      challenge_id,
      user_id,
      score,
      time_spent,
      RANK() OVER (PARTITION BY challenge_id ORDER BY score DESC, time_spent ASC) as new_rank
    FROM challenge_participations
    WHERE challenge_id = NEW.challenge_id
      AND score IS NOT NULL
  )
  INSERT INTO challenge_leaderboard (challenge_id, user_id, rank, score, time_spent)
  SELECT challenge_id, user_id, new_rank, score, time_spent
  FROM ranked_participations
  ON CONFLICT (challenge_id, user_id)
  DO UPDATE SET
    rank = EXCLUDED.rank,
    score = EXCLUDED.score,
    time_spent = EXCLUDED.time_spent,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier et attribuer les achievements
CREATE OR REPLACE FUNCTION check_challenge_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_total_participations INTEGER;
  v_current_streak INTEGER;
  v_total_wins INTEGER;
BEGIN
  -- Compter les participations totales
  SELECT COUNT(*) INTO v_total_participations
  FROM challenge_participations
  WHERE user_id = NEW.user_id;
  
  -- Achievement : Première participation
  IF v_total_participations = 1 THEN
    INSERT INTO challenge_achievements (
      user_id, 
      achievement_type, 
      achievement_name,
      achievement_description,
      icon_emoji,
      rarity
    ) VALUES (
      NEW.user_id,
      'first_challenge',
      'Premier Pas',
      'Participer à votre premier défi',
      '🎯',
      'common'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- Achievement : 10 participations
  IF v_total_participations = 10 THEN
    INSERT INTO challenge_achievements (
      user_id,
      achievement_type,
      achievement_name,
      achievement_description,
      icon_emoji,
      rarity
    ) VALUES (
      NEW.user_id,
      'ten_challenges',
      'Habitué',
      'Participer à 10 défis',
      '💪',
      'rare'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- Achievement : 100 participations
  IF v_total_participations = 100 THEN
    INSERT INTO challenge_achievements (
      user_id,
      achievement_type,
      achievement_name,
      achievement_description,
      icon_emoji,
      rarity
    ) VALUES (
      NEW.user_id,
      'hundred_challenges',
      'Vétéran',
      'Participer à 100 défis',
      '🏆',
      'legendary'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- Achievement : Score parfait
  IF NEW.score = 100 THEN
    INSERT INTO challenge_achievements (
      user_id,
      achievement_type,
      achievement_name,
      achievement_description,
      icon_emoji,
      rarity,
      progress,
      max_progress
    ) VALUES (
      NEW.user_id,
      'perfect_score',
      'Perfectionniste',
      'Obtenir un score parfait',
      '⭐',
      'epic',
      1,
      1
    ) ON CONFLICT (user_id, achievement_type)
    DO UPDATE SET
      progress = challenge_achievements.progress + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le streak
CREATE OR REPLACE FUNCTION calculate_challenge_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_previous_date DATE := CURRENT_DATE;
  r RECORD;
BEGIN
  FOR r IN 
    SELECT DISTINCT DATE(completed_at) as challenge_date
    FROM challenge_participations
    WHERE user_id = p_user_id
    ORDER BY challenge_date DESC
  LOOP
    IF r.challenge_date = v_previous_date OR 
       r.challenge_date = v_previous_date - INTERVAL '1 day' THEN
      v_streak := v_streak + 1;
      v_previous_date := r.challenge_date;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTIONS ADDITIONNELLES
-- ============================================

-- Fonction pour mettre à jour les timestamps (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour mettre à jour le leaderboard
CREATE TRIGGER trigger_update_leaderboard
  AFTER INSERT OR UPDATE OF score ON challenge_participations
  FOR EACH ROW
  WHEN (NEW.score IS NOT NULL)
  EXECUTE FUNCTION update_challenge_leaderboard();

-- Trigger pour vérifier les achievements
CREATE TRIGGER trigger_check_achievements
  AFTER INSERT ON challenge_participations
  FOR EACH ROW
  EXECUTE FUNCTION check_challenge_achievements();

-- Trigger pour mettre à jour les timestamps
CREATE TRIGGER trigger_update_challenge_timestamp
  BEFORE UPDATE ON daily_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Daily Challenges (lecture pour tous)
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges" ON daily_challenges
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage challenges" ON daily_challenges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Participations
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own participations" ON challenge_participations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own participations" ON challenge_participations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participations" ON challenge_participations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' participations for leaderboard" ON challenge_participations
  FOR SELECT USING (score IS NOT NULL);

-- Peer Reviews
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews" ON peer_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON peer_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users cannot review their own submissions" ON peer_reviews
  FOR INSERT WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM challenge_participations
      WHERE challenge_participations.id = participation_id
      AND challenge_participations.user_id = auth.uid()
    )
  );

-- Leaderboard (lecture pour tous)
ALTER TABLE challenge_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard" ON challenge_leaderboard
  FOR SELECT USING (true);

-- Achievements
ALTER TABLE challenge_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON challenge_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public achievements visible to all" ON challenge_achievements
  FOR SELECT USING (true);

-- Notifications
ALTER TABLE challenge_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON challenge_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON challenge_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA - Défis d'exemple (DÉSACTIVÉ en production)
-- ============================================

-- -- Insérer un défi d'exemple pour aujourd'hui
-- INSERT INTO daily_challenges (
--   challenge_date,
--   challenge_type,
--   title,
--   description,
--   difficulty,
--   base_prompt,
--   success_criteria,
--   hints,
--   max_score,
--   active
-- ) VALUES (
--   CURRENT_DATE,
--   'transform',
--   'Transformez ce prompt vague en version RCTF',
--   'Prenez ce prompt simple : "Écris-moi un article" et transformez-le en utilisant la structure RCTF complète.',
--   'beginner',
--   'Écris-moi un article',
--   jsonb_build_object(
--     'has_role', 'Contient un rôle défini',
--     'has_context', 'Inclut le contexte nécessaire',
--     'has_task', 'Tâche claire et précise',
--     'has_format', 'Format de sortie spécifié'
--   ),
--   ARRAY[
--     'Pensez à définir QUI doit écrire (Rôle)',
--     'Ajoutez le contexte : pour qui, pourquoi, où ?',
--     'Précisez exactement ce qui est attendu',
--     'Spécifiez le format : longueur, structure, ton'
--   ],
--   100,
--   true
-- ) ON CONFLICT (challenge_date) DO NOTHING;

-- ============================================
-- INDEXES ADDITIONNELS POUR PERFORMANCE
-- ============================================

-- Index sur completed_at et user_id (sans fonction DATE pour éviter l'erreur IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_participations_completed_user 
  ON challenge_participations(completed_at, user_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score 
  ON challenge_leaderboard(score DESC);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE daily_challenges IS 'Défis quotidiens de prompt engineering';
COMMENT ON TABLE challenge_participations IS 'Participations des utilisateurs aux défis';
COMMENT ON TABLE peer_reviews IS 'Évaluations par les pairs des soumissions';
COMMENT ON TABLE challenge_leaderboard IS 'Classement en temps réel des défis';
COMMENT ON TABLE challenge_achievements IS 'Achievements débloqués par les utilisateurs';
COMMENT ON TABLE challenge_notifications IS 'Notifications liées aux défis';

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 008_daily_challenges_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de défis quotidiens
-- Version: 2.2.0  
-- Date: 2024-12-19
-- Description: Tables pour les défis quotidiens, participations et leaderboard

-- ============================================
-- TABLE: daily_challenges
-- Défis quotidiens générés automatiquement
-- ============================================
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_date DATE UNIQUE NOT NULL,
  challenge_type VARCHAR(20) NOT NULL CHECK (challenge_type IN ('transform', 'create', 'speed', 'analysis', 'creative')),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  
  -- Contenu du défi
  base_prompt TEXT, -- Pour les défis de transformation
  success_criteria JSONB NOT NULL DEFAULT '{}',
  hints TEXT[] DEFAULT '{}',
  resources TEXT[] DEFAULT '{}',
  
  -- Scoring
  max_score INTEGER DEFAULT 100,
  time_limit INTEGER, -- En secondes (pour défis speed)
  
  -- Métadonnées
  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_active ON daily_challenges(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_daily_challenges_type ON daily_challenges(challenge_type);

-- ============================================
-- TABLE: challenge_participations
-- Participations des utilisateurs aux défis
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_participations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE NOT NULL,
  
  -- Soumission
  submission TEXT NOT NULL,
  time_spent INTEGER NOT NULL, -- En secondes
  hints_used INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 1,
  
  -- Évaluation
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  ai_evaluation JSONB, -- Évaluation détaillée par l'IA
  final_score INTEGER, -- Score après peer review
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unicité (un seul défi par jour par utilisateur)
  UNIQUE(user_id, challenge_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_participations_user ON challenge_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_participations_challenge ON challenge_participations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_participations_completed ON challenge_participations(completed_at);
CREATE INDEX IF NOT EXISTS idx_participations_score ON challenge_participations(score DESC);

-- ============================================
-- TABLE: peer_reviews
-- Évaluations par les pairs
-- ============================================
CREATE TABLE IF NOT EXISTS peer_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participation_id UUID REFERENCES challenge_participations(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_vote BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un reviewer ne peut évaluer qu'une fois
  UNIQUE(participation_id, reviewer_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_peer_reviews_participation ON peer_reviews(participation_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_reviewer ON peer_reviews(reviewer_id);

-- ============================================
-- TABLE: challenge_leaderboard
-- Classement des défis (vue matérialisée pour performance)
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_leaderboard (
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rank INTEGER NOT NULL,
  score INTEGER NOT NULL,
  time_spent INTEGER NOT NULL,
  
  -- Métadonnées
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (challenge_id, user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_leaderboard_challenge_rank ON challenge_leaderboard(challenge_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON challenge_leaderboard(user_id);

-- ============================================
-- TABLE: challenge_achievements
-- Achievements débloqués par les utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  achievement_type VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(100) NOT NULL,
  achievement_description TEXT,
  icon_emoji VARCHAR(10),
  rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  
  progress INTEGER DEFAULT 0,
  max_progress INTEGER,
  
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_achievements_user ON challenge_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked ON challenge_achievements(unlocked_at);

-- ============================================
-- TABLE: challenge_notifications
-- Notifications liées aux défis
-- ============================================
CREATE TABLE IF NOT EXISTS challenge_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON challenge_notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON challenge_notifications(created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour mettre à jour le leaderboard après participation
CREATE OR REPLACE FUNCTION update_challenge_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les rangs pour ce défi
  WITH ranked_participations AS (
    SELECT 
      challenge_id,
      user_id,
      score,
      time_spent,
      RANK() OVER (PARTITION BY challenge_id ORDER BY score DESC, time_spent ASC) as new_rank
    FROM challenge_participations
    WHERE challenge_id = NEW.challenge_id
      AND score IS NOT NULL
  )
  INSERT INTO challenge_leaderboard (challenge_id, user_id, rank, score, time_spent)
  SELECT challenge_id, user_id, new_rank, score, time_spent
  FROM ranked_participations
  ON CONFLICT (challenge_id, user_id)
  DO UPDATE SET
    rank = EXCLUDED.rank,
    score = EXCLUDED.score,
    time_spent = EXCLUDED.time_spent,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier et attribuer les achievements
CREATE OR REPLACE FUNCTION check_challenge_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_total_participations INTEGER;
  v_current_streak INTEGER;
  v_total_wins INTEGER;
BEGIN
  -- Compter les participations totales
  SELECT COUNT(*) INTO v_total_participations
  FROM challenge_participations
  WHERE user_id = NEW.user_id;
  
  -- Achievement : Première participation
  IF v_total_participations = 1 THEN
    INSERT INTO challenge_achievements (
      user_id, 
      achievement_type, 
      achievement_name,
      achievement_description,
      icon_emoji,
      rarity
    ) VALUES (
      NEW.user_id,
      'first_challenge',
      'Premier Pas',
      'Participer à votre premier défi',
      '🎯',
      'common'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- Achievement : 10 participations
  IF v_total_participations = 10 THEN
    INSERT INTO challenge_achievements (
      user_id,
      achievement_type,
      achievement_name,
      achievement_description,
      icon_emoji,
      rarity
    ) VALUES (
      NEW.user_id,
      'ten_challenges',
      'Habitué',
      'Participer à 10 défis',
      '💪',
      'rare'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- Achievement : 100 participations
  IF v_total_participations = 100 THEN
    INSERT INTO challenge_achievements (
      user_id,
      achievement_type,
      achievement_name,
      achievement_description,
      icon_emoji,
      rarity
    ) VALUES (
      NEW.user_id,
      'hundred_challenges',
      'Vétéran',
      'Participer à 100 défis',
      '🏆',
      'legendary'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- Achievement : Score parfait
  IF NEW.score = 100 THEN
    INSERT INTO challenge_achievements (
      user_id,
      achievement_type,
      achievement_name,
      achievement_description,
      icon_emoji,
      rarity,
      progress,
      max_progress
    ) VALUES (
      NEW.user_id,
      'perfect_score',
      'Perfectionniste',
      'Obtenir un score parfait',
      '⭐',
      'epic',
      1,
      1
    ) ON CONFLICT (user_id, achievement_type)
    DO UPDATE SET
      progress = challenge_achievements.progress + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le streak
CREATE OR REPLACE FUNCTION calculate_challenge_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_previous_date DATE := CURRENT_DATE;
  r RECORD;
BEGIN
  FOR r IN 
    SELECT DISTINCT DATE(completed_at) as challenge_date
    FROM challenge_participations
    WHERE user_id = p_user_id
    ORDER BY challenge_date DESC
  LOOP
    IF r.challenge_date = v_previous_date OR 
       r.challenge_date = v_previous_date - INTERVAL '1 day' THEN
      v_streak := v_streak + 1;
      v_previous_date := r.challenge_date;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTIONS ADDITIONNELLES
-- ============================================

-- Fonction pour mettre à jour les timestamps (si elle n'existe pas déjà)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour mettre à jour le leaderboard
CREATE TRIGGER trigger_update_leaderboard
  AFTER INSERT OR UPDATE OF score ON challenge_participations
  FOR EACH ROW
  WHEN (NEW.score IS NOT NULL)
  EXECUTE FUNCTION update_challenge_leaderboard();

-- Trigger pour vérifier les achievements
CREATE TRIGGER trigger_check_achievements
  AFTER INSERT ON challenge_participations
  FOR EACH ROW
  EXECUTE FUNCTION check_challenge_achievements();

-- Trigger pour mettre à jour les timestamps
CREATE TRIGGER trigger_update_challenge_timestamp
  BEFORE UPDATE ON daily_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Daily Challenges (lecture pour tous)
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges" ON daily_challenges
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage challenges" ON daily_challenges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Participations
ALTER TABLE challenge_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own participations" ON challenge_participations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own participations" ON challenge_participations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participations" ON challenge_participations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' participations for leaderboard" ON challenge_participations
  FOR SELECT USING (score IS NOT NULL);

-- Peer Reviews
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews" ON peer_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON peer_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users cannot review their own submissions" ON peer_reviews
  FOR INSERT WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM challenge_participations
      WHERE challenge_participations.id = participation_id
      AND challenge_participations.user_id = auth.uid()
    )
  );

-- Leaderboard (lecture pour tous)
ALTER TABLE challenge_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard" ON challenge_leaderboard
  FOR SELECT USING (true);

-- Achievements
ALTER TABLE challenge_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON challenge_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public achievements visible to all" ON challenge_achievements
  FOR SELECT USING (true);

-- Notifications
ALTER TABLE challenge_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON challenge_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON challenge_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA - Défis d'exemple (DÉSACTIVÉ en production)
-- ============================================

-- -- Insérer un défi d'exemple pour aujourd'hui
-- INSERT INTO daily_challenges (
--   challenge_date,
--   challenge_type,
--   title,
--   description,
--   difficulty,
--   base_prompt,
--   success_criteria,
--   hints,
--   max_score,
--   active
-- ) VALUES (
--   CURRENT_DATE,
--   'transform',
--   'Transformez ce prompt vague en version RCTF',
--   'Prenez ce prompt simple : "Écris-moi un article" et transformez-le en utilisant la structure RCTF complète.',
--   'beginner',
--   'Écris-moi un article',
--   jsonb_build_object(
--     'has_role', 'Contient un rôle défini',
--     'has_context', 'Inclut le contexte nécessaire',
--     'has_task', 'Tâche claire et précise',
--     'has_format', 'Format de sortie spécifié'
--   ),
--   ARRAY[
--     'Pensez à définir QUI doit écrire (Rôle)',
--     'Ajoutez le contexte : pour qui, pourquoi, où ?',
--     'Précisez exactement ce qui est attendu',
--     'Spécifiez le format : longueur, structure, ton'
--   ],
--   100,
--   true
-- ) ON CONFLICT (challenge_date) DO NOTHING;

-- ============================================
-- INDEXES ADDITIONNELS POUR PERFORMANCE
-- ============================================

-- Index sur completed_at et user_id (sans fonction DATE pour éviter l'erreur IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_participations_completed_user 
  ON challenge_participations(completed_at, user_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score 
  ON challenge_leaderboard(score DESC);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE daily_challenges IS 'Défis quotidiens de prompt engineering';
COMMENT ON TABLE challenge_participations IS 'Participations des utilisateurs aux défis';
COMMENT ON TABLE peer_reviews IS 'Évaluations par les pairs des soumissions';
COMMENT ON TABLE challenge_leaderboard IS 'Classement en temps réel des défis';
COMMENT ON TABLE challenge_achievements IS 'Achievements débloqués par les utilisateurs';
COMMENT ON TABLE challenge_notifications IS 'Notifications liées aux défis';

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 009_fix_rls_policies_with_function.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION DE CORRECTION RLS
-- Version: 1.0
-- Description: Corrige les politiques RLS récursives en utilisant
--              une fonction SQL pour vérifier le rôle de l'utilisateur.
-- =================================================================

-- 1. Créer une fonction pour obtenir le rôle de l'utilisateur de manière sécurisée
--    SECURITY DEFINER permet à la fonction de s'exécuter avec les droits du créateur,
--    contournant temporairement RLS pour lire le rôle dans user_profiles.
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role
  FROM public.user_profiles
  WHERE user_id = p_user_id;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Supprimer les anciennes politiques RLS problématiques
--    (USER_PROFILES)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

--    (DAILY_CHALLENGES)
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.daily_challenges;
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.daily_challenges;

-- 3. Recréer des politiques RLS saines pour user_profiles
--    - Tout utilisateur authentifié peut voir tous les profils (comportement commun pour une app sociale).
--    - Un utilisateur ne peut modifier que son propre profil.
--    - Les administrateurs peuvent tout faire (gérer tous les profils).
CREATE POLICY "Allow authenticated users to read all profiles" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow admins full access" ON public.user_profiles
  FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 4. Recréer des politiques RLS saines pour daily_challenges
--    - Tout le monde peut voir les défis actifs.
--    - Seuls les administrateurs peuvent créer, modifier ou supprimer des défis.
CREATE POLICY "Anyone can view active challenges" ON public.daily_challenges
  FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage challenges" ON public.daily_challenges
  FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 009_fix_rls_policies_with_function.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION DE CORRECTION RLS
-- Version: 1.0
-- Description: Corrige les politiques RLS récursives en utilisant
--              une fonction SQL pour vérifier le rôle de l'utilisateur.
-- =================================================================

-- 1. Créer une fonction pour obtenir le rôle de l'utilisateur de manière sécurisée
--    SECURITY DEFINER permet à la fonction de s'exécuter avec les droits du créateur,
--    contournant temporairement RLS pour lire le rôle dans user_profiles.
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role
  FROM public.user_profiles
  WHERE user_id = p_user_id;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Supprimer les anciennes politiques RLS problématiques
--    (USER_PROFILES)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

--    (DAILY_CHALLENGES)
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.daily_challenges;
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.daily_challenges;

-- 3. Recréer des politiques RLS saines pour user_profiles
--    - Tout utilisateur authentifié peut voir tous les profils (comportement commun pour une app sociale).
--    - Un utilisateur ne peut modifier que son propre profil.
--    - Les administrateurs peuvent tout faire (gérer tous les profils).
CREATE POLICY "Allow authenticated users to read all profiles" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow admins full access" ON public.user_profiles
  FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- 4. Recréer des politiques RLS saines pour daily_challenges
--    - Tout le monde peut voir les défis actifs.
--    - Seuls les administrateurs peuvent créer, modifier ou supprimer des défis.
CREATE POLICY "Anyone can view active challenges" ON public.daily_challenges
  FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage challenges" ON public.daily_challenges
  FOR ALL
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 010_backfill_profiles_and_set_admin.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION DE SYNCHRONISATION DES PROFILS UTILISATEURS
-- Version: 1.0
-- Description: Remplit les profils manquants depuis auth.users et
--              définit le rôle de l'administrateur.
-- =================================================================

-- 1. Désactiver temporairement RLS pour effectuer la maintenance
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remplir les profils manquants depuis auth.users
--    Cela garantit que les utilisateurs existants ont bien un profil.
INSERT INTO public.user_profiles (user_id, email, display_name, role)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'display_name', u.email),
    'student' -- Le rôle par défaut est 'student'
FROM
    auth.users u
WHERE
    NOT EXISTS (
        SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id
    );

-- 3. Remplir aussi les points pour les utilisateurs manquants
INSERT INTO public.user_points (user_id)
SELECT
    u.id
FROM
    auth.users u
WHERE
    NOT EXISTS (
        SELECT 1 FROM public.user_points up WHERE up.user_id = u.id
    );

-- 4. Définir le rôle 'admin' pour l'utilisateur administrateur
--    C'est l'étape cruciale pour débloquer l'accès admin.
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'admin@geniawebtraining.com';

-- 5. Réactiver RLS une fois la maintenance terminée
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 010_backfill_profiles_and_set_admin.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION DE SYNCHRONISATION DES PROFILS UTILISATEURS
-- Version: 1.0
-- Description: Remplit les profils manquants depuis auth.users et
--              définit le rôle de l'administrateur.
-- =================================================================

-- 1. Désactiver temporairement RLS pour effectuer la maintenance
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remplir les profils manquants depuis auth.users
--    Cela garantit que les utilisateurs existants ont bien un profil.
INSERT INTO public.user_profiles (user_id, email, display_name, role)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'display_name', u.email),
    'student' -- Le rôle par défaut est 'student'
FROM
    auth.users u
WHERE
    NOT EXISTS (
        SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id
    );

-- 3. Remplir aussi les points pour les utilisateurs manquants
INSERT INTO public.user_points (user_id)
SELECT
    u.id
FROM
    auth.users u
WHERE
    NOT EXISTS (
        SELECT 1 FROM public.user_points up WHERE up.user_id = u.id
    );

-- 4. Définir le rôle 'admin' pour l'utilisateur administrateur
--    C'est l'étape cruciale pour débloquer l'accès admin.
UPDATE public.user_profiles
SET role = 'admin'
WHERE email = 'admin@geniawebtraining.com';

-- 5. Réactiver RLS une fois la maintenance terminée
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 011_fix_rls_with_jwt_claim.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION FINALE DE CORRECTION RLS
-- Version: 2.0
-- Description: Corrige la récursion RLS en lisant le rôle admin
--              directement depuis les métadonnées du JWT.
-- =================================================================

-- 1. Créer une fonction pour obtenir le rôle depuis les métadonnées de l'utilisateur (JWT)
CREATE OR REPLACE FUNCTION public.get_role_from_jwt()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- La fonction auth.jwt() donne accès aux claims du JWT actuel
  -- Nous regardons dans raw_app_meta_data, là où le rôle est stocké.
  SELECT COALESCE(auth.jwt()->'raw_app_meta_data'->>'role', 'authenticated')
  INTO v_role;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE;


-- 2. Supprimer les anciennes politiques RLS qui utilisaient la fonction récursive
--    (USER_PROFILES)
DROP POLICY IF EXISTS "Allow admins full access" ON public.user_profiles;
--    (DAILY_CHALLENGES)
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.daily_challenges;
--    (On supprime aussi l'ancienne fonction devenue inutile)
DROP FUNCTION IF EXISTS public.get_user_role(p_user_id UUID);


-- 3. Recréer la politique admin pour user_profiles en utilisant la nouvelle fonction JWT
CREATE POLICY "Allow admins full access" ON public.user_profiles
  FOR ALL
  USING (public.get_role_from_jwt() = 'admin')
  WITH CHECK (public.get_role_from_jwt() = 'admin');


-- 4. Recréer la politique admin pour daily_challenges en utilisant la nouvelle fonction JWT
CREATE POLICY "Admins can manage challenges" ON public.daily_challenges
  FOR ALL
  USING (public.get_role_from_jwt() = 'admin')
  WITH CHECK (public.get_role_from_jwt() = 'admin');

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 011_fix_rls_with_jwt_claim.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION FINALE DE CORRECTION RLS
-- Version: 2.0
-- Description: Corrige la récursion RLS en lisant le rôle admin
--              directement depuis les métadonnées du JWT.
-- =================================================================

-- 1. Créer une fonction pour obtenir le rôle depuis les métadonnées de l'utilisateur (JWT)
CREATE OR REPLACE FUNCTION public.get_role_from_jwt()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- La fonction auth.jwt() donne accès aux claims du JWT actuel
  -- Nous regardons dans raw_app_meta_data, là où le rôle est stocké.
  SELECT COALESCE(auth.jwt()->'raw_app_meta_data'->>'role', 'authenticated')
  INTO v_role;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE;


-- 2. Supprimer les anciennes politiques RLS qui utilisaient la fonction récursive
--    (USER_PROFILES)
DROP POLICY IF EXISTS "Allow admins full access" ON public.user_profiles;
--    (DAILY_CHALLENGES)
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.daily_challenges;
--    (On supprime aussi l'ancienne fonction devenue inutile)
DROP FUNCTION IF EXISTS public.get_user_role(p_user_id UUID);


-- 3. Recréer la politique admin pour user_profiles en utilisant la nouvelle fonction JWT
CREATE POLICY "Allow admins full access" ON public.user_profiles
  FOR ALL
  USING (public.get_role_from_jwt() = 'admin')
  WITH CHECK (public.get_role_from_jwt() = 'admin');


-- 4. Recréer la politique admin pour daily_challenges en utilisant la nouvelle fonction JWT
CREATE POLICY "Admins can manage challenges" ON public.daily_challenges
  FOR ALL
  USING (public.get_role_from_jwt() = 'admin')
  WITH CHECK (public.get_role_from_jwt() = 'admin');

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 012_fix_jwt_claim_path.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION DE CORRECTION DE LA FONCTION JWT
-- Version: 2.1
-- Description: Corrige le chemin d'accès au claim 'role' dans le JWT.
-- =================================================================

-- 1. Remplacer la fonction existante par la version corrigée
--    Le chemin correct est 'app_metadata', et non 'raw_app_meta_data'.
CREATE OR REPLACE FUNCTION public.get_role_from_jwt()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT COALESCE(auth.jwt()->'app_metadata'->>'role', 'authenticated')
  INTO v_role;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 012_fix_jwt_claim_path.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION DE CORRECTION DE LA FONCTION JWT
-- Version: 2.1
-- Description: Corrige le chemin d'accès au claim 'role' dans le JWT.
-- =================================================================

-- 1. Remplacer la fonction existante par la version corrigée
--    Le chemin correct est 'app_metadata', et non 'raw_app_meta_data'.
CREATE OR REPLACE FUNCTION public.get_role_from_jwt()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT COALESCE(auth.jwt()->'app_metadata'->>'role', 'authenticated')
  INTO v_role;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 013_fix_jwt_role_lookup.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION DE CORRECTION FINALE DE LA FONCTION JWT
-- Version: 2.2
-- Description: Corrige la fonction pour lire le rôle dans app_metadata.
-- =================================================================

-- 1. Remplacer la fonction existante par la version corrigée
--    Le chemin correct est auth.jwt()->'app_metadata'->>'role'.
CREATE OR REPLACE FUNCTION public.get_role_from_jwt()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT
    COALESCE(auth.jwt()->'app_metadata'->>'role', auth.jwt()->>'role', 'authenticated')
  INTO v_role;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Supprimer la fonction de débogage
DROP FUNCTION IF EXISTS public.debug_jwt();

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 013_fix_jwt_role_lookup.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION DE CORRECTION FINALE DE LA FONCTION JWT
-- Version: 2.2
-- Description: Corrige la fonction pour lire le rôle dans app_metadata.
-- =================================================================

-- 1. Remplacer la fonction existante par la version corrigée
--    Le chemin correct est auth.jwt()->'app_metadata'->>'role'.
CREATE OR REPLACE FUNCTION public.get_role_from_jwt()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT
    COALESCE(auth.jwt()->'app_metadata'->>'role', auth.jwt()->>'role', 'authenticated')
  INTO v_role;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Supprimer la fonction de débogage
DROP FUNCTION IF EXISTS public.debug_jwt();

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 014_restore_permissions_and_rls.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION FINALE DE RESTAURATION DES PERMISSIONS
-- Version: 1.0
-- Description: Restaure les permissions de base sur la table
--              user_profiles et réactive les politiques RLS propres.
-- =================================================================

-- 1. Redonner la permission de LECTURE de base au rôle 'authenticated'
--    C'est l'étape la plus importante qui manquait. Sans cela,
--    les politiques RLS ne sont même pas évaluées.
GRANT SELECT ON TABLE public.user_profiles TO authenticated;

-- 2. Supprimer la politique de débogage temporaire
DROP POLICY IF EXISTS "TEMP_DEBUG_ALLOW_ANY_READ" ON public.user_profiles;

-- 3. Ré-activer les politiques de sécurité finales et propres
--    (On les recrée pour être sûr qu'elles sont dans le bon état)

-- 3a. Les utilisateurs peuvent lire tous les profils (comportement normal)
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.user_profiles;
CREATE POLICY "Allow authenticated users to read all profiles" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 3b. Les utilisateurs ne peuvent modifier que leur propre profil
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
CREATE POLICY "Allow users to update their own profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3c. Les admins (vérifiés via JWT) ont tous les droits
DROP POLICY IF EXISTS "Allow admins full access" ON public.user_profiles;
CREATE POLICY "Allow admins full access" ON public.user_profiles
  FOR ALL
  USING (public.get_role_from_jwt() = 'admin')
  WITH CHECK (public.get_role_from_jwt() = 'admin');

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 014_restore_permissions_and_rls.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION FINALE DE RESTAURATION DES PERMISSIONS
-- Version: 1.0
-- Description: Restaure les permissions de base sur la table
--              user_profiles et réactive les politiques RLS propres.
-- =================================================================

-- 1. Redonner la permission de LECTURE de base au rôle 'authenticated'
--    C'est l'étape la plus importante qui manquait. Sans cela,
--    les politiques RLS ne sont même pas évaluées.
GRANT SELECT ON TABLE public.user_profiles TO authenticated;

-- 2. Supprimer la politique de débogage temporaire
DROP POLICY IF EXISTS "TEMP_DEBUG_ALLOW_ANY_READ" ON public.user_profiles;

-- 3. Ré-activer les politiques de sécurité finales et propres
--    (On les recrée pour être sûr qu'elles sont dans le bon état)

-- 3a. Les utilisateurs peuvent lire tous les profils (comportement normal)
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.user_profiles;
CREATE POLICY "Allow authenticated users to read all profiles" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- 3b. Les utilisateurs ne peuvent modifier que leur propre profil
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
CREATE POLICY "Allow users to update their own profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3c. Les admins (vérifiés via JWT) ont tous les droits
DROP POLICY IF EXISTS "Allow admins full access" ON public.user_profiles;
CREATE POLICY "Allow admins full access" ON public.user_profiles
  FOR ALL
  USING (public.get_role_from_jwt() = 'admin')
  WITH CHECK (public.get_role_from_jwt() = 'admin');

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 015_certificate_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de certificats
-- Version: 1.0.0
-- Date: 2026-02-22

-- Type de certificat
CREATE TYPE certificate_type AS ENUM ('module', 'master');
CREATE TYPE certificate_status AS ENUM ('issued', 'revoked', 'expired');

-- Table des certificats
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  certificate_type certificate_type NOT NULL DEFAULT 'module',
  student_name VARCHAR(255) NOT NULL,
  completion_date TIMESTAMP WITH TIME ZONE NOT NULL,
  score DECIMAL(5,2), -- Score ou moyenne pour le module/curriculum
  verification_code VARCHAR(64) NOT NULL UNIQUE, -- Code unique pour vérification
  status certificate_status DEFAULT 'issued' NOT NULL,
  metadata JSONB DEFAULT '{}', -- Données additionnelles (modules complétés pour master cert, etc.)
  shared_on_linkedin BOOLEAN DEFAULT false,
  linkedin_shared_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0 NOT NULL,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_module_cert CHECK (
    (certificate_type = 'module' AND module_id IS NOT NULL) OR
    (certificate_type = 'master' AND module_id IS NULL)
  )
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_module_id ON certificates(module_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);

-- Table des statistiques de certificats (pour analytics)
CREATE TABLE IF NOT EXISTS certificate_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_issued INTEGER DEFAULT 0,
  total_module_certs INTEGER DEFAULT 0,
  total_master_certs INTEGER DEFAULT 0,
  total_shared_linkedin INTEGER DEFAULT 0,
  total_verifications INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialiser les stats
INSERT INTO certificate_stats (total_issued, last_updated) VALUES (0, NOW());

-- Fonction pour générer un code de vérification unique
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Évite les caractères ambigus (0, O, I, 1)
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..16 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Formater le code (XXXX-XXXX-XXXX-XXXX)
    result := substr(result, 1, 4) || '-' ||
              substr(result, 5, 4) || '-' ||
              substr(result, 9, 4) || '-' ||
              substr(result, 13, 4);

    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM certificates WHERE verification_code = result) INTO code_exists;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_certificate_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE certificate_stats
  SET
    total_issued = (SELECT COUNT(*) FROM certificates WHERE status = 'issued'),
    total_module_certs = (SELECT COUNT(*) FROM certificates WHERE certificate_type = 'module' AND status = 'issued'),
    total_master_certs = (SELECT COUNT(*) FROM certificates WHERE certificate_type = 'master' AND status = 'issued'),
    total_shared_linkedin = (SELECT COUNT(*) FROM certificates WHERE shared_on_linkedin = true),
    last_updated = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour les stats automatiquement
CREATE TRIGGER trigger_update_certificate_stats_insert
  AFTER INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_stats();

CREATE TRIGGER trigger_update_certificate_stats_update
  AFTER UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_stats();

CREATE TRIGGER trigger_update_certificate_stats_delete
  AFTER DELETE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_stats();

-- Trigger pour auto-générer le code de vérification
CREATE OR REPLACE FUNCTION set_verification_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_code IS NULL OR NEW.verification_code = '' THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_verification_code
  BEFORE INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION set_verification_code();

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificates_updated_at();

-- RLS (Row Level Security)
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_stats ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour certificates
-- Les utilisateurs peuvent voir leurs propres certificats
CREATE POLICY "Users can view their own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres certificats
CREATE POLICY "Users can create their own certificates" ON certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres certificats (partage LinkedIn, téléchargements)
CREATE POLICY "Users can update their own certificates" ON certificates
  FOR UPDATE USING (auth.uid() = user_id);

-- Les admins peuvent voir et gérer tous les certificats
CREATE POLICY "Admins can manage all certificates" ON certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Politique pour la vérification publique (par code uniquement)
-- Note: La fonction verify_certificate ci-dessous est SECURITY DEFINER pour permettre l'accès public

-- Politiques pour certificate_stats (lecture seule pour admins)
CREATE POLICY "Admins can view certificate stats" ON certificate_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Fonction publique pour vérifier un certificat par code (SECURITY DEFINER pour accès public)
CREATE OR REPLACE FUNCTION verify_certificate(verification_code_param VARCHAR)
RETURNS TABLE (
  valid BOOLEAN,
  certificate_id UUID,
  student_name VARCHAR,
  module_title TEXT,
  certificate_type certificate_type,
  completion_date TIMESTAMP WITH TIME ZONE,
  issued_at TIMESTAMP WITH TIME ZONE,
  status certificate_status,
  score DECIMAL
)
SECURITY DEFINER
AS $$
BEGIN
  -- Incrémenter le compteur de vérifications
  UPDATE certificate_stats
  SET total_verifications = total_verifications + 1;

  RETURN QUERY
  SELECT
    (c.id IS NOT NULL AND c.status = 'issued')::BOOLEAN as valid,
    c.id,
    c.student_name,
    COALESCE(m.title, 'Master Certificate - All Modules')::TEXT as module_title,
    c.certificate_type,
    c.completion_date,
    c.issued_at,
    c.status,
    c.score
  FROM certificates c
  LEFT JOIN modules m ON c.module_id = m.id
  WHERE c.verification_code = verification_code_param;

  -- Si aucun résultat, retourner une ligne avec valid = false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::UUID, NULL::VARCHAR, NULL::TEXT,
                        NULL::certificate_type, NULL::TIMESTAMP WITH TIME ZONE,
                        NULL::TIMESTAMP WITH TIME ZONE, NULL::certificate_status, NULL::DECIMAL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les certificats d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_certificates(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  certificate_type certificate_type,
  module_title TEXT,
  student_name VARCHAR,
  completion_date TIMESTAMP WITH TIME ZONE,
  score DECIMAL,
  verification_code VARCHAR,
  issued_at TIMESTAMP WITH TIME ZONE,
  shared_on_linkedin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.certificate_type,
    COALESCE(m.title, 'Master Certificate - All Modules')::TEXT as module_title,
    c.student_name,
    c.completion_date,
    c.score,
    c.verification_code,
    c.issued_at,
    c.shared_on_linkedin
  FROM certificates c
  LEFT JOIN modules m ON c.module_id = m.id
  WHERE c.user_id = user_id_param
    AND c.status = 'issued'
  ORDER BY c.issued_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur a déjà un certificat pour un module
CREATE OR REPLACE FUNCTION has_certificate_for_module(user_id_param UUID, module_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM certificates
    WHERE user_id = user_id_param
      AND module_id = module_id_param
      AND certificate_type = 'module'
      AND status = 'issued'
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un utilisateur a le master certificate
CREATE OR REPLACE FUNCTION has_master_certificate(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM certificates
    WHERE user_id = user_id_param
      AND certificate_type = 'master'
      AND status = 'issued'
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer un certificat comme partagé sur LinkedIn
CREATE OR REPLACE FUNCTION mark_shared_on_linkedin(certificate_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE certificates
  SET
    shared_on_linkedin = true,
    linkedin_shared_at = NOW(),
    updated_at = NOW()
  WHERE id = certificate_id_param
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter le compteur de téléchargements
CREATE OR REPLACE FUNCTION increment_download_count(certificate_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE certificates
  SET
    download_count = download_count + 1,
    last_downloaded_at = NOW(),
    updated_at = NOW()
  WHERE id = certificate_id_param
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- -----------------------------------------------------------
-- Migration: 015_certificate_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de certificats
-- Version: 1.0.0
-- Date: 2026-02-22

-- Type de certificat
CREATE TYPE certificate_type AS ENUM ('module', 'master');
CREATE TYPE certificate_status AS ENUM ('issued', 'revoked', 'expired');

-- Table des certificats
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  certificate_type certificate_type NOT NULL DEFAULT 'module',
  student_name VARCHAR(255) NOT NULL,
  completion_date TIMESTAMP WITH TIME ZONE NOT NULL,
  score DECIMAL(5,2), -- Score ou moyenne pour le module/curriculum
  verification_code VARCHAR(64) NOT NULL UNIQUE, -- Code unique pour vérification
  status certificate_status DEFAULT 'issued' NOT NULL,
  metadata JSONB DEFAULT '{}', -- Données additionnelles (modules complétés pour master cert, etc.)
  shared_on_linkedin BOOLEAN DEFAULT false,
  linkedin_shared_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0 NOT NULL,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_module_cert CHECK (
    (certificate_type = 'module' AND module_id IS NOT NULL) OR
    (certificate_type = 'master' AND module_id IS NULL)
  )
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_module_id ON certificates(module_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);

-- Table des statistiques de certificats (pour analytics)
CREATE TABLE IF NOT EXISTS certificate_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_issued INTEGER DEFAULT 0,
  total_module_certs INTEGER DEFAULT 0,
  total_master_certs INTEGER DEFAULT 0,
  total_shared_linkedin INTEGER DEFAULT 0,
  total_verifications INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialiser les stats
INSERT INTO certificate_stats (total_issued, last_updated) VALUES (0, NOW());

-- Fonction pour générer un code de vérification unique
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Évite les caractères ambigus (0, O, I, 1)
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..16 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Formater le code (XXXX-XXXX-XXXX-XXXX)
    result := substr(result, 1, 4) || '-' ||
              substr(result, 5, 4) || '-' ||
              substr(result, 9, 4) || '-' ||
              substr(result, 13, 4);

    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM certificates WHERE verification_code = result) INTO code_exists;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_certificate_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE certificate_stats
  SET
    total_issued = (SELECT COUNT(*) FROM certificates WHERE status = 'issued'),
    total_module_certs = (SELECT COUNT(*) FROM certificates WHERE certificate_type = 'module' AND status = 'issued'),
    total_master_certs = (SELECT COUNT(*) FROM certificates WHERE certificate_type = 'master' AND status = 'issued'),
    total_shared_linkedin = (SELECT COUNT(*) FROM certificates WHERE shared_on_linkedin = true),
    last_updated = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour les stats automatiquement
CREATE TRIGGER trigger_update_certificate_stats_insert
  AFTER INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_stats();

CREATE TRIGGER trigger_update_certificate_stats_update
  AFTER UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_stats();

CREATE TRIGGER trigger_update_certificate_stats_delete
  AFTER DELETE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_stats();

-- Trigger pour auto-générer le code de vérification
CREATE OR REPLACE FUNCTION set_verification_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_code IS NULL OR NEW.verification_code = '' THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_verification_code
  BEFORE INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION set_verification_code();

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificates_updated_at();

-- RLS (Row Level Security)
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_stats ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour certificates
-- Les utilisateurs peuvent voir leurs propres certificats
CREATE POLICY "Users can view their own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres certificats
CREATE POLICY "Users can create their own certificates" ON certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres certificats (partage LinkedIn, téléchargements)
CREATE POLICY "Users can update their own certificates" ON certificates
  FOR UPDATE USING (auth.uid() = user_id);

-- Les admins peuvent voir et gérer tous les certificats
CREATE POLICY "Admins can manage all certificates" ON certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Politique pour la vérification publique (par code uniquement)
-- Note: La fonction verify_certificate ci-dessous est SECURITY DEFINER pour permettre l'accès public

-- Politiques pour certificate_stats (lecture seule pour admins)
CREATE POLICY "Admins can view certificate stats" ON certificate_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Fonction publique pour vérifier un certificat par code (SECURITY DEFINER pour accès public)
CREATE OR REPLACE FUNCTION verify_certificate(verification_code_param VARCHAR)
RETURNS TABLE (
  valid BOOLEAN,
  certificate_id UUID,
  student_name VARCHAR,
  module_title TEXT,
  certificate_type certificate_type,
  completion_date TIMESTAMP WITH TIME ZONE,
  issued_at TIMESTAMP WITH TIME ZONE,
  status certificate_status,
  score DECIMAL
)
SECURITY DEFINER
AS $$
BEGIN
  -- Incrémenter le compteur de vérifications
  UPDATE certificate_stats
  SET total_verifications = total_verifications + 1;

  RETURN QUERY
  SELECT
    (c.id IS NOT NULL AND c.status = 'issued')::BOOLEAN as valid,
    c.id,
    c.student_name,
    COALESCE(m.title, 'Master Certificate - All Modules')::TEXT as module_title,
    c.certificate_type,
    c.completion_date,
    c.issued_at,
    c.status,
    c.score
  FROM certificates c
  LEFT JOIN modules m ON c.module_id = m.id
  WHERE c.verification_code = verification_code_param;

  -- Si aucun résultat, retourner une ligne avec valid = false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::UUID, NULL::VARCHAR, NULL::TEXT,
                        NULL::certificate_type, NULL::TIMESTAMP WITH TIME ZONE,
                        NULL::TIMESTAMP WITH TIME ZONE, NULL::certificate_status, NULL::DECIMAL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les certificats d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_certificates(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  certificate_type certificate_type,
  module_title TEXT,
  student_name VARCHAR,
  completion_date TIMESTAMP WITH TIME ZONE,
  score DECIMAL,
  verification_code VARCHAR,
  issued_at TIMESTAMP WITH TIME ZONE,
  shared_on_linkedin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.certificate_type,
    COALESCE(m.title, 'Master Certificate - All Modules')::TEXT as module_title,
    c.student_name,
    c.completion_date,
    c.score,
    c.verification_code,
    c.issued_at,
    c.shared_on_linkedin
  FROM certificates c
  LEFT JOIN modules m ON c.module_id = m.id
  WHERE c.user_id = user_id_param
    AND c.status = 'issued'
  ORDER BY c.issued_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur a déjà un certificat pour un module
CREATE OR REPLACE FUNCTION has_certificate_for_module(user_id_param UUID, module_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM certificates
    WHERE user_id = user_id_param
      AND module_id = module_id_param
      AND certificate_type = 'module'
      AND status = 'issued'
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un utilisateur a le master certificate
CREATE OR REPLACE FUNCTION has_master_certificate(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM certificates
    WHERE user_id = user_id_param
      AND certificate_type = 'master'
      AND status = 'issued'
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer un certificat comme partagé sur LinkedIn
CREATE OR REPLACE FUNCTION mark_shared_on_linkedin(certificate_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE certificates
  SET
    shared_on_linkedin = true,
    linkedin_shared_at = NOW(),
    updated_at = NOW()
  WHERE id = certificate_id_param
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter le compteur de téléchargements
CREATE OR REPLACE FUNCTION increment_download_count(certificate_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE certificates
  SET
    download_count = download_count + 1,
    last_downloaded_at = NOW(),
    updated_at = NOW()
  WHERE id = certificate_id_param
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- -----------------------------------------------------------
-- Migration: 016_grant_execute_permission.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION DE PERMISSION D'EXÉCUTION
-- Version: 1.0
-- Description: Accorde la permission d'EXÉCUTER la fonction
--              get_role_from_jwt au rôle 'authenticated'.
-- =================================================================

-- Donne la permission d'exécuter la fonction get_role_from_jwt
-- au groupe de tous les utilisateurs connectés ('authenticated').
-- Sans cela, l'API Route ne peut pas vérifier le rôle et retourne une erreur.
GRANT EXECUTE ON FUNCTION public.get_role_from_jwt() TO authenticated;

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 016_grant_execute_permission.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION DE PERMISSION D'EXÉCUTION
-- Version: 1.0
-- Description: Accorde la permission d'EXÉCUTER la fonction
--              get_role_from_jwt au rôle 'authenticated'.
-- =================================================================

-- Donne la permission d'exécuter la fonction get_role_from_jwt
-- au groupe de tous les utilisateurs connectés ('authenticated').
-- Sans cela, l'API Route ne peut pas vérifier le rôle et retourne une erreur.
GRANT EXECUTE ON FUNCTION public.get_role_from_jwt() TO authenticated;

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 017_tournaments_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de tournois
-- Version: 2.3.0
-- Date: 2024-12-22
-- Description: Tables pour tournois hebdomadaires, participations, brackets, rounds, et résultats

-- ============================================
-- TABLE: tournaments
-- Tournois hebdomadaires avec système d'élimination
-- ============================================
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,

  -- Planification
  tournament_type VARCHAR(20) NOT NULL CHECK (tournament_type IN ('weekly', 'special', 'seasonal')),
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration', 'active', 'completed', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Configuration
  max_participants INTEGER DEFAULT 64 CHECK (max_participants > 0 AND max_participants <= 256),
  min_participants INTEGER DEFAULT 8 CHECK (min_participants >= 2),
  bracket_type VARCHAR(20) DEFAULT 'single_elimination' CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin')),

  -- Règles du tournoi
  challenge_type VARCHAR(20) CHECK (challenge_type IN ('transform', 'create', 'speed', 'analysis', 'creative', 'mixed')),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert', 'mixed')),
  time_limit INTEGER, -- En secondes par match

  -- Récompenses
  prize_pool JSONB DEFAULT '{"first": 1000, "second": 500, "third": 250}'::JSONB,
  xp_rewards JSONB DEFAULT '{"first": 500, "second": 300, "third": 150, "participant": 50}'::JSONB,

  -- Métadonnées
  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  banner_image_url TEXT,
  rules TEXT,

  -- Statistiques
  participant_count INTEGER DEFAULT 0,
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  CHECK (end_date > start_date),
  CHECK (registration_deadline <= start_date),
  CHECK (max_participants >= min_participants)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_type ON tournaments(tournament_type);
CREATE INDEX IF NOT EXISTS idx_tournaments_active ON tournaments(status) WHERE status IN ('registration', 'active');

-- ============================================
-- TABLE: tournament_participants
-- Inscriptions des utilisateurs aux tournois
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID, -- NULL pour tournoi individuel, référence team pour tournoi d'équipe

  -- Statut
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'eliminated', 'winner', 'disqualified', 'withdrew')),
  seed_position INTEGER, -- Position de tête de série

  -- Statistiques
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,

  -- Timestamps
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  eliminated_at TIMESTAMP WITH TIME ZONE,

  -- Contrainte unicité (un utilisateur par tournoi individuel)
  UNIQUE(tournament_id, user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_status ON tournament_participants(status);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_team ON tournament_participants(team_id) WHERE team_id IS NOT NULL;

-- ============================================
-- TABLE: tournament_rounds
-- Rounds d'un tournoi (quarts, demi-finales, finale, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,

  round_number INTEGER NOT NULL CHECK (round_number > 0),
  round_name VARCHAR(50) NOT NULL, -- 'Round of 64', 'Round of 32', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Finals'

  -- Statut
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),

  -- Configuration
  matches_count INTEGER NOT NULL CHECK (matches_count > 0),
  best_of INTEGER DEFAULT 1 CHECK (best_of IN (1, 3, 5)), -- Best of 1, 3, ou 5

  -- Timestamps
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unicité
  UNIQUE(tournament_id, round_number)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_tournament ON tournament_rounds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_status ON tournament_rounds(status);
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_number ON tournament_rounds(tournament_id, round_number);

-- ============================================
-- TABLE: tournament_matches
-- Matches individuels dans les tournois
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES tournament_rounds(id) ON DELETE CASCADE NOT NULL,

  -- Participants
  participant1_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
  participant2_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,

  -- Configuration
  match_number INTEGER NOT NULL,
  bracket_position VARCHAR(20), -- Pour affichage visuel du bracket

  -- Statut
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'forfeit', 'cancelled')),

  -- Challenge
  challenge_prompt TEXT,
  challenge_criteria JSONB,

  -- Scores
  participant1_score INTEGER DEFAULT 0,
  participant2_score INTEGER DEFAULT 0,
  participant1_submission TEXT,
  participant2_submission TEXT,
  participant1_time INTEGER, -- Temps en secondes
  participant2_time INTEGER,

  -- Évaluation
  evaluation_method VARCHAR(20) DEFAULT 'ai' CHECK (evaluation_method IN ('ai', 'peer', 'judge', 'auto')),
  evaluation_details JSONB,

  -- Métadonnées
  next_match_id UUID, -- Match suivant en cas de victoire

  -- Timestamps
  scheduled_time TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  CHECK (participant1_id != participant2_id),
  CHECK (winner_id IS NULL OR winner_id IN (participant1_id, participant2_id))
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(round_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_participants ON tournament_matches(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_winner ON tournament_matches(winner_id) WHERE winner_id IS NOT NULL;

-- ============================================
-- TABLE: tournament_results
-- Classement final et statistiques des tournois
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES tournament_participants(id) ON DELETE CASCADE NOT NULL,

  -- Classement
  final_rank INTEGER NOT NULL CHECK (final_rank > 0),
  placement_name VARCHAR(50), -- 'Champion', 'Runner-up', 'Semi-finalist', etc.

  -- Statistiques
  total_matches INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  total_time INTEGER, -- Temps total en secondes

  -- Récompenses
  xp_earned INTEGER DEFAULT 0,
  prize_amount INTEGER DEFAULT 0,
  badges_earned TEXT[] DEFAULT '{}',
  achievements_unlocked TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unicité
  UNIQUE(tournament_id, participant_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament ON tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_participant ON tournament_results(participant_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_rank ON tournament_results(tournament_id, final_rank);

-- ============================================
-- TABLE: tournament_notifications
-- Notifications liées aux tournois
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,

  type VARCHAR(50) NOT NULL CHECK (type IN ('registration_open', 'registration_closing', 'tournament_starting', 'match_ready', 'match_result', 'round_advance', 'tournament_complete', 'prize_awarded')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,

  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index
CREATE INDEX IF NOT EXISTS idx_tournament_notifications_user_unread ON tournament_notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_tournament_notifications_tournament ON tournament_notifications(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_notifications_created ON tournament_notifications(created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour mettre à jour le nombre de participants
CREATE OR REPLACE FUNCTION update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tournaments
    SET participant_count = participant_count + 1
    WHERE id = NEW.tournament_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tournaments
    SET participant_count = GREATEST(0, participant_count - 1)
    WHERE id = OLD.tournament_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le compteur de participants
DROP TRIGGER IF EXISTS trg_update_tournament_participant_count ON tournament_participants;
CREATE TRIGGER trg_update_tournament_participant_count
AFTER INSERT OR DELETE ON tournament_participants
FOR EACH ROW
EXECUTE FUNCTION update_tournament_participant_count();

-- Fonction pour mettre à jour les statistiques d'un participant après un match
CREATE OR REPLACE FUNCTION update_participant_stats_after_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les stats pour participant1
  IF NEW.participant1_id IS NOT NULL THEN
    UPDATE tournament_participants
    SET
      matches_played = matches_played + 1,
      matches_won = matches_won + CASE WHEN NEW.winner_id = NEW.participant1_id THEN 1 ELSE 0 END,
      matches_lost = matches_lost + CASE WHEN NEW.winner_id = NEW.participant2_id THEN 1 ELSE 0 END,
      total_score = total_score + COALESCE(NEW.participant1_score, 0),
      status = CASE
        WHEN NEW.winner_id = NEW.participant2_id AND NOT EXISTS (
          SELECT 1 FROM tournament_matches
          WHERE tournament_id = NEW.tournament_id
          AND status IN ('scheduled', 'in_progress')
          AND (participant1_id = NEW.participant1_id OR participant2_id = NEW.participant1_id)
        ) THEN 'eliminated'
        ELSE status
      END
    WHERE id = NEW.participant1_id;
  END IF;

  -- Mettre à jour les stats pour participant2
  IF NEW.participant2_id IS NOT NULL THEN
    UPDATE tournament_participants
    SET
      matches_played = matches_played + 1,
      matches_won = matches_won + CASE WHEN NEW.winner_id = NEW.participant2_id THEN 1 ELSE 0 END,
      matches_lost = matches_lost + CASE WHEN NEW.winner_id = NEW.participant1_id THEN 1 ELSE 0 END,
      total_score = total_score + COALESCE(NEW.participant2_score, 0),
      status = CASE
        WHEN NEW.winner_id = NEW.participant1_id AND NOT EXISTS (
          SELECT 1 FROM tournament_matches
          WHERE tournament_id = NEW.tournament_id
          AND status IN ('scheduled', 'in_progress')
          AND (participant1_id = NEW.participant2_id OR participant2_id = NEW.participant2_id)
        ) THEN 'eliminated'
        ELSE status
      END
    WHERE id = NEW.participant2_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les stats après un match complété
DROP TRIGGER IF EXISTS trg_update_participant_stats ON tournament_matches;
CREATE TRIGGER trg_update_participant_stats
AFTER UPDATE OF status ON tournament_matches
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION update_participant_stats_after_match();

-- Fonction pour générer automatiquement les rounds d'un tournoi
CREATE OR REPLACE FUNCTION generate_tournament_rounds(p_tournament_id UUID, p_participant_count INTEGER)
RETURNS VOID AS $$
DECLARE
  v_rounds INTEGER;
  v_current_round INTEGER;
  v_round_name VARCHAR(50);
  v_matches_count INTEGER;
BEGIN
  -- Calculer le nombre de rounds nécessaires (log2 des participants)
  v_rounds := CEIL(LOG(2, p_participant_count))::INTEGER;

  -- Mettre à jour le tournoi
  UPDATE tournaments
  SET total_rounds = v_rounds
  WHERE id = p_tournament_id;

  -- Générer les rounds
  FOR v_current_round IN 1..v_rounds LOOP
    v_matches_count := POWER(2, v_rounds - v_current_round)::INTEGER;

    -- Déterminer le nom du round
    v_round_name := CASE
      WHEN v_matches_count = 1 THEN 'Finals'
      WHEN v_matches_count = 2 THEN 'Semi Finals'
      WHEN v_matches_count = 4 THEN 'Quarter Finals'
      WHEN v_matches_count = 8 THEN 'Round of 16'
      WHEN v_matches_count = 16 THEN 'Round of 32'
      WHEN v_matches_count = 32 THEN 'Round of 64'
      WHEN v_matches_count = 64 THEN 'Round of 128'
      ELSE 'Round ' || v_current_round
    END;

    INSERT INTO tournament_rounds (tournament_id, round_number, round_name, matches_count)
    VALUES (p_tournament_id, v_current_round, v_round_name, v_matches_count);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer le bracket initial (premier round)
CREATE OR REPLACE FUNCTION generate_initial_bracket(p_tournament_id UUID)
RETURNS VOID AS $$
DECLARE
  v_round_id UUID;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_match_number INTEGER := 1;
  i INTEGER;
BEGIN
  -- Récupérer le premier round
  SELECT id INTO v_round_id
  FROM tournament_rounds
  WHERE tournament_id = p_tournament_id AND round_number = 1
  LIMIT 1;

  IF v_round_id IS NULL THEN
    RAISE EXCEPTION 'No rounds found for tournament %', p_tournament_id;
  END IF;

  -- Récupérer tous les participants (ordonnés par seed_position si disponible)
  SELECT ARRAY_AGG(id ORDER BY COALESCE(seed_position, 999), registered_at), COUNT(*)
  INTO v_participants, v_participant_count
  FROM tournament_participants
  WHERE tournament_id = p_tournament_id AND status = 'registered';

  -- Créer les matches du premier round
  FOR i IN 1..v_participant_count BY 2 LOOP
    INSERT INTO tournament_matches (
      tournament_id,
      round_id,
      match_number,
      participant1_id,
      participant2_id,
      status
    ) VALUES (
      p_tournament_id,
      v_round_id,
      v_match_number,
      v_participants[i],
      CASE WHEN i + 1 <= v_participant_count THEN v_participants[i + 1] ELSE NULL END,
      'scheduled'
    );

    v_match_number := v_match_number + 1;
  END LOOP;

  -- Marquer le tournoi comme actif
  UPDATE tournaments
  SET status = 'active', current_round = 1
  WHERE id = p_tournament_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour faire avancer le bracket au round suivant
CREATE OR REPLACE FUNCTION advance_to_next_round(p_tournament_id UUID, p_current_round INTEGER)
RETURNS VOID AS $$
DECLARE
  v_next_round_id UUID;
  v_winners UUID[];
  v_match_number INTEGER := 1;
  i INTEGER;
BEGIN
  -- Vérifier que tous les matches du round actuel sont complétés
  IF EXISTS (
    SELECT 1 FROM tournament_matches tm
    JOIN tournament_rounds tr ON tm.round_id = tr.id
    WHERE tr.tournament_id = p_tournament_id
    AND tr.round_number = p_current_round
    AND tm.status != 'completed'
  ) THEN
    RAISE EXCEPTION 'All matches in round % must be completed before advancing', p_current_round;
  END IF;

  -- Récupérer le round suivant
  SELECT id INTO v_next_round_id
  FROM tournament_rounds
  WHERE tournament_id = p_tournament_id AND round_number = p_current_round + 1
  LIMIT 1;

  IF v_next_round_id IS NULL THEN
    -- C'était le dernier round, marquer le tournoi comme complété
    UPDATE tournaments
    SET status = 'completed'
    WHERE id = p_tournament_id;
    RETURN;
  END IF;

  -- Récupérer les gagnants du round actuel
  SELECT ARRAY_AGG(winner_id ORDER BY match_number)
  INTO v_winners
  FROM tournament_matches tm
  JOIN tournament_rounds tr ON tm.round_id = tr.id
  WHERE tr.tournament_id = p_tournament_id AND tr.round_number = p_current_round;

  -- Créer les matches du round suivant
  FOR i IN 1..ARRAY_LENGTH(v_winners, 1) BY 2 LOOP
    INSERT INTO tournament_matches (
      tournament_id,
      round_id,
      match_number,
      participant1_id,
      participant2_id,
      status
    ) VALUES (
      p_tournament_id,
      v_next_round_id,
      v_match_number,
      v_winners[i],
      CASE WHEN i + 1 <= ARRAY_LENGTH(v_winners, 1) THEN v_winners[i + 1] ELSE NULL END,
      'scheduled'
    );

    v_match_number := v_match_number + 1;
  END LOOP;

  -- Mettre à jour le round actuel
  UPDATE tournaments
  SET current_round = p_current_round + 1
  WHERE id = p_tournament_id;

  -- Marquer le round actuel comme complété
  UPDATE tournament_rounds
  SET status = 'completed', end_time = NOW()
  WHERE tournament_id = p_tournament_id AND round_number = p_current_round;

  -- Marquer le round suivant comme actif
  UPDATE tournament_rounds
  SET status = 'active', start_time = NOW()
  WHERE id = v_next_round_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les résultats finaux d'un tournoi
CREATE OR REPLACE FUNCTION finalize_tournament_results(p_tournament_id UUID)
RETURNS VOID AS $$
DECLARE
  v_participant RECORD;
  v_rank INTEGER := 1;
  v_placement_name VARCHAR(50);
  v_xp_rewards JSONB;
BEGIN
  -- Récupérer les XP rewards du tournoi
  SELECT xp_rewards INTO v_xp_rewards
  FROM tournaments
  WHERE id = p_tournament_id;

  -- Calculer les résultats pour chaque participant (ordonnés par performance)
  FOR v_participant IN
    SELECT
      tp.id,
      tp.user_id,
      tp.matches_won,
      tp.matches_played,
      tp.total_score,
      CASE WHEN tp.matches_played > 0 THEN tp.total_score::DECIMAL / tp.matches_played ELSE 0 END as avg_score
    FROM tournament_participants tp
    WHERE tp.tournament_id = p_tournament_id
    ORDER BY tp.status = 'winner' DESC, tp.matches_won DESC, tp.total_score DESC, tp.matches_played ASC
  LOOP
    -- Déterminer le placement
    v_placement_name := CASE v_rank
      WHEN 1 THEN 'Champion'
      WHEN 2 THEN 'Runner-up'
      WHEN 3 THEN 'Third Place'
      WHEN 4 THEN 'Fourth Place'
      ELSE 'Participant'
    END;

    -- Insérer les résultats
    INSERT INTO tournament_results (
      tournament_id,
      participant_id,
      final_rank,
      placement_name,
      total_matches,
      matches_won,
      matches_lost,
      total_score,
      average_score,
      xp_earned
    ) VALUES (
      p_tournament_id,
      v_participant.id,
      v_rank,
      v_placement_name,
      v_participant.matches_played,
      v_participant.matches_won,
      v_participant.matches_played - v_participant.matches_won,
      v_participant.total_score,
      v_participant.avg_score,
      CASE v_rank
        WHEN 1 THEN (v_xp_rewards->>'first')::INTEGER
        WHEN 2 THEN (v_xp_rewards->>'second')::INTEGER
        WHEN 3 THEN (v_xp_rewards->>'third')::INTEGER
        ELSE (v_xp_rewards->>'participant')::INTEGER
      END
    ) ON CONFLICT (tournament_id, participant_id) DO UPDATE
    SET
      final_rank = EXCLUDED.final_rank,
      placement_name = EXCLUDED.placement_name,
      total_matches = EXCLUDED.total_matches,
      matches_won = EXCLUDED.matches_won,
      matches_lost = EXCLUDED.matches_lost,
      total_score = EXCLUDED.total_score,
      average_score = EXCLUDED.average_score,
      xp_earned = EXCLUDED.xp_earned;

    v_rank := v_rank + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour finaliser les résultats quand un tournoi est complété
CREATE OR REPLACE FUNCTION auto_finalize_tournament()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM finalize_tournament_results(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_finalize_tournament ON tournaments;
CREATE TRIGGER trg_auto_finalize_tournament
AFTER UPDATE OF status ON tournaments
FOR EACH ROW
EXECUTE FUNCTION auto_finalize_tournament();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour tournaments
CREATE POLICY "Tournaments are viewable by everyone"
  ON tournaments FOR SELECT
  USING (true);

CREATE POLICY "Tournaments can be created by admins"
  ON tournaments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Tournaments can be updated by admins"
  ON tournaments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies pour tournament_participants
CREATE POLICY "Participants are viewable by everyone"
  ON tournament_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can register themselves for tournaments"
  ON tournament_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tournaments
      WHERE id = tournament_id
      AND status = 'registration'
      AND registration_deadline > NOW()
    )
  );

CREATE POLICY "Users can update their own participation"
  ON tournament_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can withdraw from tournaments"
  ON tournament_participants FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tournaments
      WHERE id = tournament_id
      AND status IN ('upcoming', 'registration')
    )
  );

-- Policies pour tournament_rounds
CREATE POLICY "Rounds are viewable by everyone"
  ON tournament_rounds FOR SELECT
  USING (true);

CREATE POLICY "Rounds can be managed by admins"
  ON tournament_rounds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies pour tournament_matches
CREATE POLICY "Matches are viewable by everyone"
  ON tournament_matches FOR SELECT
  USING (true);

CREATE POLICY "Participants can submit to their own matches"
  ON tournament_matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tournament_participants
      WHERE id IN (participant1_id, participant2_id)
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Matches can be managed by admins"
  ON tournament_matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies pour tournament_results
CREATE POLICY "Results are viewable by everyone"
  ON tournament_results FOR SELECT
  USING (true);

CREATE POLICY "Results can be managed by admins"
  ON tournament_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies pour tournament_notifications
CREATE POLICY "Users can view their own notifications"
  ON tournament_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON tournament_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON tournament_notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- HELPER VIEWS
-- ============================================

-- Vue pour afficher l'état actuel du bracket
CREATE OR REPLACE VIEW tournament_bracket_view AS
SELECT
  t.id as tournament_id,
  t.title as tournament_title,
  tr.round_number,
  tr.round_name,
  tm.match_number,
  tm.id as match_id,
  tm.status as match_status,
  p1.user_id as participant1_user_id,
  p2.user_id as participant2_user_id,
  tm.participant1_score,
  tm.participant2_score,
  w.user_id as winner_user_id,
  tm.scheduled_time,
  tm.completed_at
FROM tournaments t
JOIN tournament_rounds tr ON tr.tournament_id = t.id
JOIN tournament_matches tm ON tm.round_id = tr.id
LEFT JOIN tournament_participants p1 ON tm.participant1_id = p1.id
LEFT JOIN tournament_participants p2 ON tm.participant2_id = p2.id
LEFT JOIN tournament_participants w ON tm.winner_id = w.id
ORDER BY t.id, tr.round_number, tm.match_number;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE tournaments IS 'Tournois hebdomadaires avec système d''élimination et brackets';
COMMENT ON TABLE tournament_participants IS 'Inscriptions et participations des utilisateurs aux tournois';
COMMENT ON TABLE tournament_rounds IS 'Rounds d''un tournoi (quarts, demi-finales, finale)';
COMMENT ON TABLE tournament_matches IS 'Matches individuels dans les tournois avec scores et évaluations';
COMMENT ON TABLE tournament_results IS 'Résultats finaux et classement des tournois';
COMMENT ON TABLE tournament_notifications IS 'Notifications liées aux événements de tournois';

COMMENT ON FUNCTION generate_tournament_rounds IS 'Génère automatiquement les rounds d''un tournoi basé sur le nombre de participants';
COMMENT ON FUNCTION generate_initial_bracket IS 'Crée le bracket initial (premier round) avec tous les participants';
COMMENT ON FUNCTION advance_to_next_round IS 'Fait avancer le tournoi au round suivant en créant les matches avec les gagnants';
COMMENT ON FUNCTION finalize_tournament_results IS 'Calcule et enregistre les résultats finaux d''un tournoi complété';


-- -----------------------------------------------------------
-- Migration: 017_tournaments_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de tournois
-- Version: 2.3.0
-- Date: 2024-12-22
-- Description: Tables pour tournois hebdomadaires, participations, brackets, rounds, et résultats

-- ============================================
-- TABLE: tournaments
-- Tournois hebdomadaires avec système d'élimination
-- ============================================
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,

  -- Planification
  tournament_type VARCHAR(20) NOT NULL CHECK (tournament_type IN ('weekly', 'special', 'seasonal')),
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'registration', 'active', 'completed', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Configuration
  max_participants INTEGER DEFAULT 64 CHECK (max_participants > 0 AND max_participants <= 256),
  min_participants INTEGER DEFAULT 8 CHECK (min_participants >= 2),
  bracket_type VARCHAR(20) DEFAULT 'single_elimination' CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin')),

  -- Règles du tournoi
  challenge_type VARCHAR(20) CHECK (challenge_type IN ('transform', 'create', 'speed', 'analysis', 'creative', 'mixed')),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert', 'mixed')),
  time_limit INTEGER, -- En secondes par match

  -- Récompenses
  prize_pool JSONB DEFAULT '{"first": 1000, "second": 500, "third": 250}'::JSONB,
  xp_rewards JSONB DEFAULT '{"first": 500, "second": 300, "third": 150, "participant": 50}'::JSONB,

  -- Métadonnées
  category VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  banner_image_url TEXT,
  rules TEXT,

  -- Statistiques
  participant_count INTEGER DEFAULT 0,
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  CHECK (end_date > start_date),
  CHECK (registration_deadline <= start_date),
  CHECK (max_participants >= min_participants)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_type ON tournaments(tournament_type);
CREATE INDEX IF NOT EXISTS idx_tournaments_active ON tournaments(status) WHERE status IN ('registration', 'active');

-- ============================================
-- TABLE: tournament_participants
-- Inscriptions des utilisateurs aux tournois
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID, -- NULL pour tournoi individuel, référence team pour tournoi d'équipe

  -- Statut
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'active', 'eliminated', 'winner', 'disqualified', 'withdrew')),
  seed_position INTEGER, -- Position de tête de série

  -- Statistiques
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,

  -- Timestamps
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  eliminated_at TIMESTAMP WITH TIME ZONE,

  -- Contrainte unicité (un utilisateur par tournoi individuel)
  UNIQUE(tournament_id, user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_status ON tournament_participants(status);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_team ON tournament_participants(team_id) WHERE team_id IS NOT NULL;

-- ============================================
-- TABLE: tournament_rounds
-- Rounds d'un tournoi (quarts, demi-finales, finale, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_rounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,

  round_number INTEGER NOT NULL CHECK (round_number > 0),
  round_name VARCHAR(50) NOT NULL, -- 'Round of 64', 'Round of 32', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Finals'

  -- Statut
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),

  -- Configuration
  matches_count INTEGER NOT NULL CHECK (matches_count > 0),
  best_of INTEGER DEFAULT 1 CHECK (best_of IN (1, 3, 5)), -- Best of 1, 3, ou 5

  -- Timestamps
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unicité
  UNIQUE(tournament_id, round_number)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_tournament ON tournament_rounds(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_status ON tournament_rounds(status);
CREATE INDEX IF NOT EXISTS idx_tournament_rounds_number ON tournament_rounds(tournament_id, round_number);

-- ============================================
-- TABLE: tournament_matches
-- Matches individuels dans les tournois
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  round_id UUID REFERENCES tournament_rounds(id) ON DELETE CASCADE NOT NULL,

  -- Participants
  participant1_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
  participant2_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,

  -- Configuration
  match_number INTEGER NOT NULL,
  bracket_position VARCHAR(20), -- Pour affichage visuel du bracket

  -- Statut
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'forfeit', 'cancelled')),

  -- Challenge
  challenge_prompt TEXT,
  challenge_criteria JSONB,

  -- Scores
  participant1_score INTEGER DEFAULT 0,
  participant2_score INTEGER DEFAULT 0,
  participant1_submission TEXT,
  participant2_submission TEXT,
  participant1_time INTEGER, -- Temps en secondes
  participant2_time INTEGER,

  -- Évaluation
  evaluation_method VARCHAR(20) DEFAULT 'ai' CHECK (evaluation_method IN ('ai', 'peer', 'judge', 'auto')),
  evaluation_details JSONB,

  -- Métadonnées
  next_match_id UUID, -- Match suivant en cas de victoire

  -- Timestamps
  scheduled_time TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  CHECK (participant1_id != participant2_id),
  CHECK (winner_id IS NULL OR winner_id IN (participant1_id, participant2_id))
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON tournament_matches(round_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_participants ON tournament_matches(participant1_id, participant2_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_winner ON tournament_matches(winner_id) WHERE winner_id IS NOT NULL;

-- ============================================
-- TABLE: tournament_results
-- Classement final et statistiques des tournois
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES tournament_participants(id) ON DELETE CASCADE NOT NULL,

  -- Classement
  final_rank INTEGER NOT NULL CHECK (final_rank > 0),
  placement_name VARCHAR(50), -- 'Champion', 'Runner-up', 'Semi-finalist', etc.

  -- Statistiques
  total_matches INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  total_time INTEGER, -- Temps total en secondes

  -- Récompenses
  xp_earned INTEGER DEFAULT 0,
  prize_amount INTEGER DEFAULT 0,
  badges_earned TEXT[] DEFAULT '{}',
  achievements_unlocked TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unicité
  UNIQUE(tournament_id, participant_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tournament_results_tournament ON tournament_results(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_participant ON tournament_results(participant_id);
CREATE INDEX IF NOT EXISTS idx_tournament_results_rank ON tournament_results(tournament_id, final_rank);

-- ============================================
-- TABLE: tournament_notifications
-- Notifications liées aux tournois
-- ============================================
CREATE TABLE IF NOT EXISTS tournament_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,

  type VARCHAR(50) NOT NULL CHECK (type IN ('registration_open', 'registration_closing', 'tournament_starting', 'match_ready', 'match_result', 'round_advance', 'tournament_complete', 'prize_awarded')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,

  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index
CREATE INDEX IF NOT EXISTS idx_tournament_notifications_user_unread ON tournament_notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_tournament_notifications_tournament ON tournament_notifications(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_notifications_created ON tournament_notifications(created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour mettre à jour le nombre de participants
CREATE OR REPLACE FUNCTION update_tournament_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tournaments
    SET participant_count = participant_count + 1
    WHERE id = NEW.tournament_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tournaments
    SET participant_count = GREATEST(0, participant_count - 1)
    WHERE id = OLD.tournament_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le compteur de participants
DROP TRIGGER IF EXISTS trg_update_tournament_participant_count ON tournament_participants;
CREATE TRIGGER trg_update_tournament_participant_count
AFTER INSERT OR DELETE ON tournament_participants
FOR EACH ROW
EXECUTE FUNCTION update_tournament_participant_count();

-- Fonction pour mettre à jour les statistiques d'un participant après un match
CREATE OR REPLACE FUNCTION update_participant_stats_after_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les stats pour participant1
  IF NEW.participant1_id IS NOT NULL THEN
    UPDATE tournament_participants
    SET
      matches_played = matches_played + 1,
      matches_won = matches_won + CASE WHEN NEW.winner_id = NEW.participant1_id THEN 1 ELSE 0 END,
      matches_lost = matches_lost + CASE WHEN NEW.winner_id = NEW.participant2_id THEN 1 ELSE 0 END,
      total_score = total_score + COALESCE(NEW.participant1_score, 0),
      status = CASE
        WHEN NEW.winner_id = NEW.participant2_id AND NOT EXISTS (
          SELECT 1 FROM tournament_matches
          WHERE tournament_id = NEW.tournament_id
          AND status IN ('scheduled', 'in_progress')
          AND (participant1_id = NEW.participant1_id OR participant2_id = NEW.participant1_id)
        ) THEN 'eliminated'
        ELSE status
      END
    WHERE id = NEW.participant1_id;
  END IF;

  -- Mettre à jour les stats pour participant2
  IF NEW.participant2_id IS NOT NULL THEN
    UPDATE tournament_participants
    SET
      matches_played = matches_played + 1,
      matches_won = matches_won + CASE WHEN NEW.winner_id = NEW.participant2_id THEN 1 ELSE 0 END,
      matches_lost = matches_lost + CASE WHEN NEW.winner_id = NEW.participant1_id THEN 1 ELSE 0 END,
      total_score = total_score + COALESCE(NEW.participant2_score, 0),
      status = CASE
        WHEN NEW.winner_id = NEW.participant1_id AND NOT EXISTS (
          SELECT 1 FROM tournament_matches
          WHERE tournament_id = NEW.tournament_id
          AND status IN ('scheduled', 'in_progress')
          AND (participant1_id = NEW.participant2_id OR participant2_id = NEW.participant2_id)
        ) THEN 'eliminated'
        ELSE status
      END
    WHERE id = NEW.participant2_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les stats après un match complété
DROP TRIGGER IF EXISTS trg_update_participant_stats ON tournament_matches;
CREATE TRIGGER trg_update_participant_stats
AFTER UPDATE OF status ON tournament_matches
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION update_participant_stats_after_match();

-- Fonction pour générer automatiquement les rounds d'un tournoi
CREATE OR REPLACE FUNCTION generate_tournament_rounds(p_tournament_id UUID, p_participant_count INTEGER)
RETURNS VOID AS $$
DECLARE
  v_rounds INTEGER;
  v_current_round INTEGER;
  v_round_name VARCHAR(50);
  v_matches_count INTEGER;
BEGIN
  -- Calculer le nombre de rounds nécessaires (log2 des participants)
  v_rounds := CEIL(LOG(2, p_participant_count))::INTEGER;

  -- Mettre à jour le tournoi
  UPDATE tournaments
  SET total_rounds = v_rounds
  WHERE id = p_tournament_id;

  -- Générer les rounds
  FOR v_current_round IN 1..v_rounds LOOP
    v_matches_count := POWER(2, v_rounds - v_current_round)::INTEGER;

    -- Déterminer le nom du round
    v_round_name := CASE
      WHEN v_matches_count = 1 THEN 'Finals'
      WHEN v_matches_count = 2 THEN 'Semi Finals'
      WHEN v_matches_count = 4 THEN 'Quarter Finals'
      WHEN v_matches_count = 8 THEN 'Round of 16'
      WHEN v_matches_count = 16 THEN 'Round of 32'
      WHEN v_matches_count = 32 THEN 'Round of 64'
      WHEN v_matches_count = 64 THEN 'Round of 128'
      ELSE 'Round ' || v_current_round
    END;

    INSERT INTO tournament_rounds (tournament_id, round_number, round_name, matches_count)
    VALUES (p_tournament_id, v_current_round, v_round_name, v_matches_count);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer le bracket initial (premier round)
CREATE OR REPLACE FUNCTION generate_initial_bracket(p_tournament_id UUID)
RETURNS VOID AS $$
DECLARE
  v_round_id UUID;
  v_participants UUID[];
  v_participant_count INTEGER;
  v_match_number INTEGER := 1;
  i INTEGER;
BEGIN
  -- Récupérer le premier round
  SELECT id INTO v_round_id
  FROM tournament_rounds
  WHERE tournament_id = p_tournament_id AND round_number = 1
  LIMIT 1;

  IF v_round_id IS NULL THEN
    RAISE EXCEPTION 'No rounds found for tournament %', p_tournament_id;
  END IF;

  -- Récupérer tous les participants (ordonnés par seed_position si disponible)
  SELECT ARRAY_AGG(id ORDER BY COALESCE(seed_position, 999), registered_at), COUNT(*)
  INTO v_participants, v_participant_count
  FROM tournament_participants
  WHERE tournament_id = p_tournament_id AND status = 'registered';

  -- Créer les matches du premier round
  FOR i IN 1..v_participant_count BY 2 LOOP
    INSERT INTO tournament_matches (
      tournament_id,
      round_id,
      match_number,
      participant1_id,
      participant2_id,
      status
    ) VALUES (
      p_tournament_id,
      v_round_id,
      v_match_number,
      v_participants[i],
      CASE WHEN i + 1 <= v_participant_count THEN v_participants[i + 1] ELSE NULL END,
      'scheduled'
    );

    v_match_number := v_match_number + 1;
  END LOOP;

  -- Marquer le tournoi comme actif
  UPDATE tournaments
  SET status = 'active', current_round = 1
  WHERE id = p_tournament_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour faire avancer le bracket au round suivant
CREATE OR REPLACE FUNCTION advance_to_next_round(p_tournament_id UUID, p_current_round INTEGER)
RETURNS VOID AS $$
DECLARE
  v_next_round_id UUID;
  v_winners UUID[];
  v_match_number INTEGER := 1;
  i INTEGER;
BEGIN
  -- Vérifier que tous les matches du round actuel sont complétés
  IF EXISTS (
    SELECT 1 FROM tournament_matches tm
    JOIN tournament_rounds tr ON tm.round_id = tr.id
    WHERE tr.tournament_id = p_tournament_id
    AND tr.round_number = p_current_round
    AND tm.status != 'completed'
  ) THEN
    RAISE EXCEPTION 'All matches in round % must be completed before advancing', p_current_round;
  END IF;

  -- Récupérer le round suivant
  SELECT id INTO v_next_round_id
  FROM tournament_rounds
  WHERE tournament_id = p_tournament_id AND round_number = p_current_round + 1
  LIMIT 1;

  IF v_next_round_id IS NULL THEN
    -- C'était le dernier round, marquer le tournoi comme complété
    UPDATE tournaments
    SET status = 'completed'
    WHERE id = p_tournament_id;
    RETURN;
  END IF;

  -- Récupérer les gagnants du round actuel
  SELECT ARRAY_AGG(winner_id ORDER BY match_number)
  INTO v_winners
  FROM tournament_matches tm
  JOIN tournament_rounds tr ON tm.round_id = tr.id
  WHERE tr.tournament_id = p_tournament_id AND tr.round_number = p_current_round;

  -- Créer les matches du round suivant
  FOR i IN 1..ARRAY_LENGTH(v_winners, 1) BY 2 LOOP
    INSERT INTO tournament_matches (
      tournament_id,
      round_id,
      match_number,
      participant1_id,
      participant2_id,
      status
    ) VALUES (
      p_tournament_id,
      v_next_round_id,
      v_match_number,
      v_winners[i],
      CASE WHEN i + 1 <= ARRAY_LENGTH(v_winners, 1) THEN v_winners[i + 1] ELSE NULL END,
      'scheduled'
    );

    v_match_number := v_match_number + 1;
  END LOOP;

  -- Mettre à jour le round actuel
  UPDATE tournaments
  SET current_round = p_current_round + 1
  WHERE id = p_tournament_id;

  -- Marquer le round actuel comme complété
  UPDATE tournament_rounds
  SET status = 'completed', end_time = NOW()
  WHERE tournament_id = p_tournament_id AND round_number = p_current_round;

  -- Marquer le round suivant comme actif
  UPDATE tournament_rounds
  SET status = 'active', start_time = NOW()
  WHERE id = v_next_round_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les résultats finaux d'un tournoi
CREATE OR REPLACE FUNCTION finalize_tournament_results(p_tournament_id UUID)
RETURNS VOID AS $$
DECLARE
  v_participant RECORD;
  v_rank INTEGER := 1;
  v_placement_name VARCHAR(50);
  v_xp_rewards JSONB;
BEGIN
  -- Récupérer les XP rewards du tournoi
  SELECT xp_rewards INTO v_xp_rewards
  FROM tournaments
  WHERE id = p_tournament_id;

  -- Calculer les résultats pour chaque participant (ordonnés par performance)
  FOR v_participant IN
    SELECT
      tp.id,
      tp.user_id,
      tp.matches_won,
      tp.matches_played,
      tp.total_score,
      CASE WHEN tp.matches_played > 0 THEN tp.total_score::DECIMAL / tp.matches_played ELSE 0 END as avg_score
    FROM tournament_participants tp
    WHERE tp.tournament_id = p_tournament_id
    ORDER BY tp.status = 'winner' DESC, tp.matches_won DESC, tp.total_score DESC, tp.matches_played ASC
  LOOP
    -- Déterminer le placement
    v_placement_name := CASE v_rank
      WHEN 1 THEN 'Champion'
      WHEN 2 THEN 'Runner-up'
      WHEN 3 THEN 'Third Place'
      WHEN 4 THEN 'Fourth Place'
      ELSE 'Participant'
    END;

    -- Insérer les résultats
    INSERT INTO tournament_results (
      tournament_id,
      participant_id,
      final_rank,
      placement_name,
      total_matches,
      matches_won,
      matches_lost,
      total_score,
      average_score,
      xp_earned
    ) VALUES (
      p_tournament_id,
      v_participant.id,
      v_rank,
      v_placement_name,
      v_participant.matches_played,
      v_participant.matches_won,
      v_participant.matches_played - v_participant.matches_won,
      v_participant.total_score,
      v_participant.avg_score,
      CASE v_rank
        WHEN 1 THEN (v_xp_rewards->>'first')::INTEGER
        WHEN 2 THEN (v_xp_rewards->>'second')::INTEGER
        WHEN 3 THEN (v_xp_rewards->>'third')::INTEGER
        ELSE (v_xp_rewards->>'participant')::INTEGER
      END
    ) ON CONFLICT (tournament_id, participant_id) DO UPDATE
    SET
      final_rank = EXCLUDED.final_rank,
      placement_name = EXCLUDED.placement_name,
      total_matches = EXCLUDED.total_matches,
      matches_won = EXCLUDED.matches_won,
      matches_lost = EXCLUDED.matches_lost,
      total_score = EXCLUDED.total_score,
      average_score = EXCLUDED.average_score,
      xp_earned = EXCLUDED.xp_earned;

    v_rank := v_rank + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour finaliser les résultats quand un tournoi est complété
CREATE OR REPLACE FUNCTION auto_finalize_tournament()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM finalize_tournament_results(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_finalize_tournament ON tournaments;
CREATE TRIGGER trg_auto_finalize_tournament
AFTER UPDATE OF status ON tournaments
FOR EACH ROW
EXECUTE FUNCTION auto_finalize_tournament();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour tournaments
CREATE POLICY "Tournaments are viewable by everyone"
  ON tournaments FOR SELECT
  USING (true);

CREATE POLICY "Tournaments can be created by admins"
  ON tournaments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Tournaments can be updated by admins"
  ON tournaments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies pour tournament_participants
CREATE POLICY "Participants are viewable by everyone"
  ON tournament_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can register themselves for tournaments"
  ON tournament_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tournaments
      WHERE id = tournament_id
      AND status = 'registration'
      AND registration_deadline > NOW()
    )
  );

CREATE POLICY "Users can update their own participation"
  ON tournament_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can withdraw from tournaments"
  ON tournament_participants FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tournaments
      WHERE id = tournament_id
      AND status IN ('upcoming', 'registration')
    )
  );

-- Policies pour tournament_rounds
CREATE POLICY "Rounds are viewable by everyone"
  ON tournament_rounds FOR SELECT
  USING (true);

CREATE POLICY "Rounds can be managed by admins"
  ON tournament_rounds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies pour tournament_matches
CREATE POLICY "Matches are viewable by everyone"
  ON tournament_matches FOR SELECT
  USING (true);

CREATE POLICY "Participants can submit to their own matches"
  ON tournament_matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tournament_participants
      WHERE id IN (participant1_id, participant2_id)
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Matches can be managed by admins"
  ON tournament_matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies pour tournament_results
CREATE POLICY "Results are viewable by everyone"
  ON tournament_results FOR SELECT
  USING (true);

CREATE POLICY "Results can be managed by admins"
  ON tournament_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policies pour tournament_notifications
CREATE POLICY "Users can view their own notifications"
  ON tournament_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON tournament_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON tournament_notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- HELPER VIEWS
-- ============================================

-- Vue pour afficher l'état actuel du bracket
CREATE OR REPLACE VIEW tournament_bracket_view AS
SELECT
  t.id as tournament_id,
  t.title as tournament_title,
  tr.round_number,
  tr.round_name,
  tm.match_number,
  tm.id as match_id,
  tm.status as match_status,
  p1.user_id as participant1_user_id,
  p2.user_id as participant2_user_id,
  tm.participant1_score,
  tm.participant2_score,
  w.user_id as winner_user_id,
  tm.scheduled_time,
  tm.completed_at
FROM tournaments t
JOIN tournament_rounds tr ON tr.tournament_id = t.id
JOIN tournament_matches tm ON tm.round_id = tr.id
LEFT JOIN tournament_participants p1 ON tm.participant1_id = p1.id
LEFT JOIN tournament_participants p2 ON tm.participant2_id = p2.id
LEFT JOIN tournament_participants w ON tm.winner_id = w.id
ORDER BY t.id, tr.round_number, tm.match_number;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE tournaments IS 'Tournois hebdomadaires avec système d''élimination et brackets';
COMMENT ON TABLE tournament_participants IS 'Inscriptions et participations des utilisateurs aux tournois';
COMMENT ON TABLE tournament_rounds IS 'Rounds d''un tournoi (quarts, demi-finales, finale)';
COMMENT ON TABLE tournament_matches IS 'Matches individuels dans les tournois avec scores et évaluations';
COMMENT ON TABLE tournament_results IS 'Résultats finaux et classement des tournois';
COMMENT ON TABLE tournament_notifications IS 'Notifications liées aux événements de tournois';

COMMENT ON FUNCTION generate_tournament_rounds IS 'Génère automatiquement les rounds d''un tournoi basé sur le nombre de participants';
COMMENT ON FUNCTION generate_initial_bracket IS 'Crée le bracket initial (premier round) avec tous les participants';
COMMENT ON FUNCTION advance_to_next_round IS 'Fait avancer le tournoi au round suivant en créant les matches avec les gagnants';
COMMENT ON FUNCTION finalize_tournament_results IS 'Calcule et enregistre les résultats finaux d''un tournoi complété';


-- -----------------------------------------------------------
-- Migration: 018_add_username_support.sql
-- -----------------------------------------------------------

-- =============================================
-- Add username support alongside email login
-- =============================================

-- 1) Add column (nullable first for safe backfill)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

-- 2) Backfill from email prefix (lowercased), ensuring uniqueness with suffixes
DO $$
DECLARE
  rec RECORD;
  base TEXT;
  candidate TEXT;
  suffix INT;
BEGIN
  FOR rec IN
    SELECT user_id, email FROM public.user_profiles WHERE (username IS NULL OR username = '') AND email IS NOT NULL
  LOOP
    base := LOWER(SPLIT_PART(rec.email, '@', 1));
    candidate := base;
    suffix := 1;
    -- ensure uniqueness case-insensitively
    WHILE EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE LOWER(username) = LOWER(candidate)
    ) LOOP
      candidate := base || '_' || suffix::TEXT;
      suffix := suffix + 1;
    END LOOP;

    UPDATE public.user_profiles
      SET username = candidate
      WHERE user_id = rec.user_id;
  END LOOP;
END $$;

-- 3) Create case-insensitive unique index
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'user_profiles_username_ci'
  ) THEN
    CREATE UNIQUE INDEX user_profiles_username_ci ON public.user_profiles (LOWER(username));
  END IF;
END $$;

-- 4) Make column NOT NULL (after backfill)
ALTER TABLE public.user_profiles
  ALTER COLUMN username SET NOT NULL;

-- 5) Optional: simple check constraint for allowed chars (letters, digits, underscore, dash), length 3–20
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_username_format_chk'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_username_format_chk
      CHECK (
        username ~ '^[a-z0-9_-]{3,20}$'
      );
  END IF;
END $$;

-- 6) RLS: allow user to update only their own username (keep existing read policies)
DROP POLICY IF EXISTS "Allow users to update their own username" ON public.user_profiles;
CREATE POLICY "Allow users to update their own username" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- End of migration


-- -----------------------------------------------------------
-- Migration: 018_add_username_support.sql
-- -----------------------------------------------------------

-- =============================================
-- Add username support alongside email login
-- =============================================

-- 1) Add column (nullable first for safe backfill)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

-- 2) Backfill from email prefix (lowercased), ensuring uniqueness with suffixes
DO $$
DECLARE
  rec RECORD;
  base TEXT;
  candidate TEXT;
  suffix INT;
BEGIN
  FOR rec IN
    SELECT user_id, email FROM public.user_profiles WHERE (username IS NULL OR username = '') AND email IS NOT NULL
  LOOP
    base := LOWER(SPLIT_PART(rec.email, '@', 1));
    candidate := base;
    suffix := 1;
    -- ensure uniqueness case-insensitively
    WHILE EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE LOWER(username) = LOWER(candidate)
    ) LOOP
      candidate := base || '_' || suffix::TEXT;
      suffix := suffix + 1;
    END LOOP;

    UPDATE public.user_profiles
      SET username = candidate
      WHERE user_id = rec.user_id;
  END LOOP;
END $$;

-- 3) Create case-insensitive unique index
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'user_profiles_username_ci'
  ) THEN
    CREATE UNIQUE INDEX user_profiles_username_ci ON public.user_profiles (LOWER(username));
  END IF;
END $$;

-- 4) Make column NOT NULL (after backfill)
ALTER TABLE public.user_profiles
  ALTER COLUMN username SET NOT NULL;

-- 5) Optional: simple check constraint for allowed chars (letters, digits, underscore, dash), length 3–20
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_username_format_chk'
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_username_format_chk
      CHECK (
        username ~ '^[a-z0-9_-]{3,20}$'
      );
  END IF;
END $$;

-- 6) RLS: allow user to update only their own username (keep existing read policies)
DROP POLICY IF EXISTS "Allow users to update their own username" ON public.user_profiles;
CREATE POLICY "Allow users to update their own username" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- End of migration


-- -----------------------------------------------------------
-- Migration: 019_update_trigger_username.sql
-- -----------------------------------------------------------

-- =============================================
-- Update new-user trigger to set username
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- Prefer username from auth metadata; fallback to email prefix (lowercased)
  v_username := COALESCE(LOWER(NEW.raw_user_meta_data->>'username'), LOWER(SPLIT_PART(NEW.email, '@', 1)));

  INSERT INTO public.user_profiles (
      user_id,
      email,
      display_name,
      role,
      username,
      created_at,
      updated_at
  )
  VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'student',
      v_username,
      NOW(),
      NOW()
  );

  -- Initialize points row as before
  INSERT INTO public.user_points (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (noop if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- -----------------------------------------------------------
-- Migration: 019_update_trigger_username.sql
-- -----------------------------------------------------------

-- =============================================
-- Update new-user trigger to set username
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- Prefer username from auth metadata; fallback to email prefix (lowercased)
  v_username := COALESCE(LOWER(NEW.raw_user_meta_data->>'username'), LOWER(SPLIT_PART(NEW.email, '@', 1)));

  INSERT INTO public.user_profiles (
      user_id,
      email,
      display_name,
      role,
      username,
      created_at,
      updated_at
  )
  VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      'student',
      v_username,
      NOW(),
      NOW()
  );

  -- Initialize points row as before
  INSERT INTO public.user_points (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (noop if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- -----------------------------------------------------------
-- Migration: 020_fix_user_progress_rls.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION: Fix user_progress RLS policies
-- Version: 1.0
-- Description: Fix RLS policies for user_progress to allow proper API access
-- =================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;

-- Create more permissive policies for user_progress
-- Users can read all progress (needed for module completion display)
CREATE POLICY "Allow authenticated users to read progress" ON user_progress
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own progress
CREATE POLICY "Allow users to insert own progress" ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Allow users to update own progress" ON user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON TABLE user_progress TO authenticated;

-- Also grant permissions for service role (for admin operations)
GRANT ALL ON TABLE user_progress TO service_role;


-- -----------------------------------------------------------
-- Migration: 020_fix_user_progress_rls.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION: Fix user_progress RLS policies
-- Version: 1.0
-- Description: Fix RLS policies for user_progress to allow proper API access
-- =================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;

-- Create more permissive policies for user_progress
-- Users can read all progress (needed for module completion display)
CREATE POLICY "Allow authenticated users to read progress" ON user_progress
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own progress
CREATE POLICY "Allow users to insert own progress" ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Allow users to update own progress" ON user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON TABLE user_progress TO authenticated;

-- Also grant permissions for service role (for admin operations)
GRANT ALL ON TABLE user_progress TO service_role;


-- -----------------------------------------------------------
-- Migration: 021_change_capsule_id_to_text.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION: Change capsule_id from UUID to TEXT
-- Version: 1.0
-- Description: Change capsule_id columns to accept string IDs like "cap-1-1"
-- =================================================================

-- First, drop the foreign key constraints
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_capsule_id_fkey;
ALTER TABLE generated_exercises DROP CONSTRAINT IF EXISTS generated_exercises_capsule_id_fkey;
ALTER TABLE feedback_stats DROP CONSTRAINT IF EXISTS feedback_stats_target_id_fkey;

-- Change the column types from UUID to TEXT
ALTER TABLE user_progress ALTER COLUMN capsule_id TYPE TEXT;
ALTER TABLE generated_exercises ALTER COLUMN capsule_id TYPE TEXT;
ALTER TABLE feedback_stats ALTER COLUMN target_id TYPE TEXT;

-- Change the capsules table id to TEXT as well
ALTER TABLE capsules ALTER COLUMN id TYPE TEXT;

-- Update the primary key constraint
ALTER TABLE capsules DROP CONSTRAINT IF EXISTS capsules_pkey;
ALTER TABLE capsules ADD PRIMARY KEY (id);

-- Recreate the foreign key constraints
ALTER TABLE user_progress ADD CONSTRAINT user_progress_capsule_id_fkey 
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE;

ALTER TABLE generated_exercises ADD CONSTRAINT generated_exercises_capsule_id_fkey 
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE;

-- For feedback_stats, we'll make it more flexible since it can reference different types
-- ALTER TABLE feedback_stats ADD CONSTRAINT feedback_stats_target_id_fkey 
--   FOREIGN KEY (target_id) REFERENCES capsules(id) ON DELETE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS idx_user_progress_capsule_id;
CREATE INDEX idx_user_progress_capsule_id ON user_progress(capsule_id);

DROP INDEX IF EXISTS idx_generated_exercises_capsule;
CREATE INDEX idx_generated_exercises_capsule ON generated_exercises(capsule_id);


-- -----------------------------------------------------------
-- Migration: 021_change_capsule_id_to_text.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION: Change capsule_id from UUID to TEXT
-- Version: 1.0
-- Description: Change capsule_id columns to accept string IDs like "cap-1-1"
-- =================================================================

-- First, drop the foreign key constraints
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_capsule_id_fkey;
ALTER TABLE generated_exercises DROP CONSTRAINT IF EXISTS generated_exercises_capsule_id_fkey;
ALTER TABLE feedback_stats DROP CONSTRAINT IF EXISTS feedback_stats_target_id_fkey;

-- Change the column types from UUID to TEXT
ALTER TABLE user_progress ALTER COLUMN capsule_id TYPE TEXT;
ALTER TABLE generated_exercises ALTER COLUMN capsule_id TYPE TEXT;
ALTER TABLE feedback_stats ALTER COLUMN target_id TYPE TEXT;

-- Change the capsules table id to TEXT as well
ALTER TABLE capsules ALTER COLUMN id TYPE TEXT;

-- Update the primary key constraint
ALTER TABLE capsules DROP CONSTRAINT IF EXISTS capsules_pkey;
ALTER TABLE capsules ADD PRIMARY KEY (id);

-- Recreate the foreign key constraints
ALTER TABLE user_progress ADD CONSTRAINT user_progress_capsule_id_fkey 
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE;

ALTER TABLE generated_exercises ADD CONSTRAINT generated_exercises_capsule_id_fkey 
  FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE;

-- For feedback_stats, we'll make it more flexible since it can reference different types
-- ALTER TABLE feedback_stats ADD CONSTRAINT feedback_stats_target_id_fkey 
--   FOREIGN KEY (target_id) REFERENCES capsules(id) ON DELETE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS idx_user_progress_capsule_id;
CREATE INDEX idx_user_progress_capsule_id ON user_progress(capsule_id);

DROP INDEX IF EXISTS idx_generated_exercises_capsule;
CREATE INDEX idx_generated_exercises_capsule ON generated_exercises(capsule_id);


-- -----------------------------------------------------------
-- Migration: 022_remove_capsule_fk_constraint.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION: Remove capsule foreign key constraint
-- Version: 1.0
-- Description: Remove foreign key constraint since system uses JSON files
-- =================================================================

-- Remove the foreign key constraint that requires capsules to exist in database
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_capsule_id_fkey;

-- Remove the foreign key constraint for generated_exercises as well
ALTER TABLE generated_exercises DROP CONSTRAINT IF EXISTS generated_exercises_capsule_id_fkey;

-- The system works with JSON files, so we don't need database capsules
-- This allows user_progress to store capsule IDs like "cap-1-1" without
-- requiring them to exist in the capsules table


-- -----------------------------------------------------------
-- Migration: 022_remove_capsule_fk_constraint.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION: Remove capsule foreign key constraint
-- Version: 1.0
-- Description: Remove foreign key constraint since system uses JSON files
-- =================================================================

-- Remove the foreign key constraint that requires capsules to exist in database
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_capsule_id_fkey;

-- Remove the foreign key constraint for generated_exercises as well
ALTER TABLE generated_exercises DROP CONSTRAINT IF EXISTS generated_exercises_capsule_id_fkey;

-- The system works with JSON files, so we don't need database capsules
-- This allows user_progress to store capsule IDs like "cap-1-1" without
-- requiring them to exist in the capsules table


-- -----------------------------------------------------------
-- Migration: 023_fix_llm_usage_permissions.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION: Fix llm_usage table permissions
-- Version: 1.0
-- Description: Fix RLS policies and permissions for llm_usage table
-- =================================================================

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON TABLE llm_usage TO authenticated;

-- Grant permissions for service role (for admin operations)
GRANT ALL ON TABLE llm_usage TO service_role;

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Users can view own LLM usage" ON llm_usage;
DROP POLICY IF EXISTS "System can insert LLM usage" ON llm_usage;
DROP POLICY IF EXISTS "System can update LLM usage" ON llm_usage;

-- Recreate policies with proper permissions
CREATE POLICY "Users can view own LLM usage" ON llm_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own LLM usage" ON llm_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own LLM usage" ON llm_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant execute permission on the quota function
GRANT EXECUTE ON FUNCTION get_user_quota_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_quota_status(UUID) TO service_role;


-- -----------------------------------------------------------
-- Migration: 023_fix_llm_usage_permissions.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION: Fix llm_usage table permissions
-- Version: 1.0
-- Description: Fix RLS policies and permissions for llm_usage table
-- =================================================================

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON TABLE llm_usage TO authenticated;

-- Grant permissions for service role (for admin operations)
GRANT ALL ON TABLE llm_usage TO service_role;

-- Ensure RLS policies are correct
DROP POLICY IF EXISTS "Users can view own LLM usage" ON llm_usage;
DROP POLICY IF EXISTS "System can insert LLM usage" ON llm_usage;
DROP POLICY IF EXISTS "System can update LLM usage" ON llm_usage;

-- Recreate policies with proper permissions
CREATE POLICY "Users can view own LLM usage" ON llm_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own LLM usage" ON llm_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own LLM usage" ON llm_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant execute permission on the quota function
GRANT EXECUTE ON FUNCTION get_user_quota_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_quota_status(UUID) TO service_role;


-- -----------------------------------------------------------
-- Migration: 024_reduce_quotas_by_half.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION: Reduce quotas by half
-- Version: 1.0
-- Description: Cut all daily quotas in half to reduce costs
-- =================================================================

-- Update the quota function with half the limits
CREATE OR REPLACE FUNCTION get_user_quota_status(p_user_id UUID)
RETURNS TABLE(
    model TEXT,
    used INT,
    daily_limit INT,
    remaining INT
) AS $$
BEGIN
    RETURN QUERY
    WITH model_limits AS (
        SELECT 
            'magistral-medium'::TEXT as model,
            30 as daily_limit -- Reduced from 60 to 30
        UNION ALL
        SELECT 
            'mistral-medium-3'::TEXT,
            150 -- Reduced from 300 to 150
        UNION ALL
        SELECT 
            'mistral-small'::TEXT,
            500 -- Reduced from 1000 to 500
    ),
    today_usage AS (
        SELECT 
            u.model,
            COALESCE(u.request_count, 0) as used
        FROM llm_usage u
        WHERE u.user_id = p_user_id
        AND u.date = CURRENT_DATE
    )
    SELECT 
        ml.model,
        COALESCE(tu.used, 0)::INT as used,
        ml.daily_limit,
        (ml.daily_limit - COALESCE(tu.used, 0))::INT as remaining
    FROM model_limits ml
    LEFT JOIN today_usage tu ON ml.model = tu.model
    ORDER BY ml.model;
END;
$$ LANGUAGE plpgsql;

-- Update the view with new limits
CREATE OR REPLACE VIEW v_user_quotas AS
SELECT 
    u.user_id,
    u.model,
    u.date,
    u.request_count as used,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 30 -- Reduced from 60
        WHEN u.model = 'mistral-medium-3' THEN 150 -- Reduced from 300
        WHEN u.model = 'mistral-small' THEN 500 -- Reduced from 1000
    END as daily_limit,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 30 - u.request_count
        WHEN u.model = 'mistral-medium-3' THEN 150 - u.request_count
        WHEN u.model = 'mistral-small' THEN 500 - u.request_count
    END as remaining,
    u.total_tokens,
    u.total_cost
FROM llm_usage u
WHERE u.date = CURRENT_DATE;

-- Update comments
COMMENT ON FUNCTION get_user_quota_status IS 'Fonction pour obtenir le statut des quotas avec limites réduites de moitié';
COMMENT ON VIEW v_user_quotas IS 'Vue des quotas utilisateurs avec limites réduites de moitié';


-- -----------------------------------------------------------
-- Migration: 024_reduce_quotas_by_half.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION: Reduce quotas by half
-- Version: 1.0
-- Description: Cut all daily quotas in half to reduce costs
-- =================================================================

-- Update the quota function with half the limits
CREATE OR REPLACE FUNCTION get_user_quota_status(p_user_id UUID)
RETURNS TABLE(
    model TEXT,
    used INT,
    daily_limit INT,
    remaining INT
) AS $$
BEGIN
    RETURN QUERY
    WITH model_limits AS (
        SELECT 
            'magistral-medium'::TEXT as model,
            30 as daily_limit -- Reduced from 60 to 30
        UNION ALL
        SELECT 
            'mistral-medium-3'::TEXT,
            150 -- Reduced from 300 to 150
        UNION ALL
        SELECT 
            'mistral-small'::TEXT,
            500 -- Reduced from 1000 to 500
    ),
    today_usage AS (
        SELECT 
            u.model,
            COALESCE(u.request_count, 0) as used
        FROM llm_usage u
        WHERE u.user_id = p_user_id
        AND u.date = CURRENT_DATE
    )
    SELECT 
        ml.model,
        COALESCE(tu.used, 0)::INT as used,
        ml.daily_limit,
        (ml.daily_limit - COALESCE(tu.used, 0))::INT as remaining
    FROM model_limits ml
    LEFT JOIN today_usage tu ON ml.model = tu.model
    ORDER BY ml.model;
END;
$$ LANGUAGE plpgsql;

-- Update the view with new limits
CREATE OR REPLACE VIEW v_user_quotas AS
SELECT 
    u.user_id,
    u.model,
    u.date,
    u.request_count as used,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 30 -- Reduced from 60
        WHEN u.model = 'mistral-medium-3' THEN 150 -- Reduced from 300
        WHEN u.model = 'mistral-small' THEN 500 -- Reduced from 1000
    END as daily_limit,
    CASE 
        WHEN u.model = 'magistral-medium' THEN 30 - u.request_count
        WHEN u.model = 'mistral-medium-3' THEN 150 - u.request_count
        WHEN u.model = 'mistral-small' THEN 500 - u.request_count
    END as remaining,
    u.total_tokens,
    u.total_cost
FROM llm_usage u
WHERE u.date = CURRENT_DATE;

-- Update comments
COMMENT ON FUNCTION get_user_quota_status IS 'Fonction pour obtenir le statut des quotas avec limites réduites de moitié';
COMMENT ON VIEW v_user_quotas IS 'Vue des quotas utilisateurs avec limites réduites de moitié';


-- -----------------------------------------------------------
-- Migration: 025_consolidate_rls_policies.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION 026: Consolidated RLS Policies
-- Version: 1.0
-- Description: Clean consolidation of RLS policies from migrations
--              010-018, fixing function naming inconsistencies and
--              removing dangerous debug artifacts.
--
-- This migration replaces the debugging-heavy iteration chain with
-- a single, clean, well-documented RLS setup.
-- =================================================================

-- =================================================================
-- STEP 1: Clean Slate - Drop All Existing Policies and Functions
-- =================================================================
-- This ensures idempotent behavior regardless of which previous
-- migrations were applied or failed.

-- Drop all user_profiles policies (including dangerous debug policy)
DROP POLICY IF EXISTS "TEMP_DEBUG_ALLOW_ANY_READ" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow admins full access" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Drop all daily_challenges policies
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.daily_challenges;
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.daily_challenges;

-- Drop all role-checking functions (both old and new names)
DROP FUNCTION IF EXISTS public.get_user_role(p_user_id UUID);
DROP FUNCTION IF EXISTS public.get_role_from_jwt();
DROP FUNCTION IF EXISTS public.debug_jwt();

-- =================================================================
-- STEP 2: Create Definitive Role-Checking Function
-- =================================================================
-- This function reads the user's role from JWT claims with fallback
-- logic to handle different JWT structures across environments.
--
-- Why STABLE? The function result won't change within a single query.
-- Why SECURITY DEFINER? Allows reading JWT claims safely.

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Read role from JWT claims with multiple fallback paths.
  -- Supabase can store role in different JWT claim locations:
  -- 1. app_metadata->role (standard Supabase location)
  -- 2. role (alternative top-level location)
  -- 3. 'authenticated' (default for all logged-in users)
  SELECT COALESCE(
    auth.jwt()->'app_metadata'->>'role',
    auth.jwt()->>'role',
    'authenticated'
  ) INTO v_role;

  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission immediately after creation to avoid
-- timing issues where policies exist but can't call the function
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon;

-- Add function documentation
COMMENT ON FUNCTION public.get_user_role() IS
  'Returns the role of the currently authenticated user from JWT claims. Returns "authenticated" for users without explicit role. Used by RLS policies for role-based access control.';

-- =================================================================
-- STEP 3: Ensure Table Permissions Are Set Correctly
-- =================================================================
-- Grant base table permissions before creating RLS policies.
-- Without these grants, RLS policies won't even be evaluated.

GRANT SELECT ON TABLE public.user_profiles TO authenticated;
GRANT UPDATE ON TABLE public.user_profiles TO authenticated;
GRANT SELECT ON TABLE public.daily_challenges TO authenticated;
GRANT SELECT ON TABLE public.daily_challenges TO anon;

-- =================================================================
-- STEP 4: Create Clean RLS Policies for user_profiles
-- =================================================================

-- Policy 1: Authenticated users can read all profiles
-- Rationale: This is a social learning platform where users need to
--            see other users' profiles, display names, and progress.
--            Reading all profiles enables leaderboards, collaboration,
--            and community features.
CREATE POLICY "authenticated_read_all_profiles" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "authenticated_read_all_profiles" ON public.user_profiles IS
  'Allows all authenticated users to read all user profiles for social learning features (leaderboards, peer collaboration).';

-- Policy 2: Users can update only their own profile
-- Rationale: Security measure to prevent users from modifying other
--            users' data. Each user should only control their own
--            display name, preferences, and settings.
CREATE POLICY "users_update_own_profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "users_update_own_profile" ON public.user_profiles IS
  'Restricts profile updates to the profile owner only. Prevents users from modifying other users'' data.';

-- Policy 3: Admins have full access to all profiles
-- Rationale: Admin users need to manage user accounts, moderate
--            content, adjust roles, and perform platform maintenance.
--            This policy grants full CRUD access to users with
--            'admin' role in their JWT claims.
CREATE POLICY "admins_full_access_profiles" ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

COMMENT ON POLICY "admins_full_access_profiles" ON public.user_profiles IS
  'Grants full CRUD access to users with admin role for platform management and moderation.';

-- =================================================================
-- STEP 5: Create Clean RLS Policies for daily_challenges
-- =================================================================

-- Policy 1: Anyone (including anonymous) can view active challenges
-- Rationale: Daily challenges are public content used to attract and
--            engage users. Making active challenges publicly readable
--            allows preview before sign-up and encourages registration.
CREATE POLICY "public_read_active_challenges" ON public.daily_challenges
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

COMMENT ON POLICY "public_read_active_challenges" ON public.daily_challenges IS
  'Allows public read access to active challenges to encourage user engagement and sign-ups.';

-- Policy 2: Admins can manage all challenges
-- Rationale: Challenge creation, editing, and management should be
--            restricted to admin users. This prevents unauthorized
--            users from creating or modifying educational content.
CREATE POLICY "admins_manage_challenges" ON public.daily_challenges
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

COMMENT ON POLICY "admins_manage_challenges" ON public.daily_challenges IS
  'Restricts challenge creation and management to admin users only.';

-- =================================================================
-- STEP 6: Ensure RLS Is Enabled on Both Tables
-- =================================================================
-- Explicitly enable RLS to ensure security policies are enforced.

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- Migration Complete
-- =================================================================
-- This migration consolidates 9 previous RLS-related migrations
-- (010, 012-018) into a single, clean, well-documented setup.
--
-- Key improvements:
-- - Single function name (get_user_role) with no ambiguity
-- - Removed dangerous TEMP_DEBUG_ALLOW_ANY_READ policy
-- - All policies have clear names and comprehensive comments
-- - Permissions granted in correct order (no timing issues)
-- - Idempotent design allows safe re-running
-- =================================================================


-- -----------------------------------------------------------
-- Migration: 025_consolidate_rls_policies.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION 026: Consolidated RLS Policies
-- Version: 1.0
-- Description: Clean consolidation of RLS policies from migrations
--              010-018, fixing function naming inconsistencies and
--              removing dangerous debug artifacts.
--
-- This migration replaces the debugging-heavy iteration chain with
-- a single, clean, well-documented RLS setup.
-- =================================================================

-- =================================================================
-- STEP 1: Clean Slate - Drop All Existing Policies and Functions
-- =================================================================
-- This ensures idempotent behavior regardless of which previous
-- migrations were applied or failed.

-- Drop all user_profiles policies (including dangerous debug policy)
DROP POLICY IF EXISTS "TEMP_DEBUG_ALLOW_ANY_READ" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow admins full access" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Drop all daily_challenges policies
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.daily_challenges;
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.daily_challenges;

-- Drop all role-checking functions (both old and new names)
DROP FUNCTION IF EXISTS public.get_user_role(p_user_id UUID);
DROP FUNCTION IF EXISTS public.get_role_from_jwt();
DROP FUNCTION IF EXISTS public.debug_jwt();

-- =================================================================
-- STEP 2: Create Definitive Role-Checking Function
-- =================================================================
-- This function reads the user's role from JWT claims with fallback
-- logic to handle different JWT structures across environments.
--
-- Why STABLE? The function result won't change within a single query.
-- Why SECURITY DEFINER? Allows reading JWT claims safely.

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Read role from JWT claims with multiple fallback paths.
  -- Supabase can store role in different JWT claim locations:
  -- 1. app_metadata->role (standard Supabase location)
  -- 2. role (alternative top-level location)
  -- 3. 'authenticated' (default for all logged-in users)
  SELECT COALESCE(
    auth.jwt()->'app_metadata'->>'role',
    auth.jwt()->>'role',
    'authenticated'
  ) INTO v_role;

  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission immediately after creation to avoid
-- timing issues where policies exist but can't call the function
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon;

-- Add function documentation
COMMENT ON FUNCTION public.get_user_role() IS
  'Returns the role of the currently authenticated user from JWT claims. Returns "authenticated" for users without explicit role. Used by RLS policies for role-based access control.';

-- =================================================================
-- STEP 3: Ensure Table Permissions Are Set Correctly
-- =================================================================
-- Grant base table permissions before creating RLS policies.
-- Without these grants, RLS policies won't even be evaluated.

GRANT SELECT ON TABLE public.user_profiles TO authenticated;
GRANT UPDATE ON TABLE public.user_profiles TO authenticated;
GRANT SELECT ON TABLE public.daily_challenges TO authenticated;
GRANT SELECT ON TABLE public.daily_challenges TO anon;

-- =================================================================
-- STEP 4: Create Clean RLS Policies for user_profiles
-- =================================================================

-- Policy 1: Authenticated users can read all profiles
-- Rationale: This is a social learning platform where users need to
--            see other users' profiles, display names, and progress.
--            Reading all profiles enables leaderboards, collaboration,
--            and community features.
CREATE POLICY "authenticated_read_all_profiles" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "authenticated_read_all_profiles" ON public.user_profiles IS
  'Allows all authenticated users to read all user profiles for social learning features (leaderboards, peer collaboration).';

-- Policy 2: Users can update only their own profile
-- Rationale: Security measure to prevent users from modifying other
--            users' data. Each user should only control their own
--            display name, preferences, and settings.
CREATE POLICY "users_update_own_profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "users_update_own_profile" ON public.user_profiles IS
  'Restricts profile updates to the profile owner only. Prevents users from modifying other users'' data.';

-- Policy 3: Admins have full access to all profiles
-- Rationale: Admin users need to manage user accounts, moderate
--            content, adjust roles, and perform platform maintenance.
--            This policy grants full CRUD access to users with
--            'admin' role in their JWT claims.
CREATE POLICY "admins_full_access_profiles" ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

COMMENT ON POLICY "admins_full_access_profiles" ON public.user_profiles IS
  'Grants full CRUD access to users with admin role for platform management and moderation.';

-- =================================================================
-- STEP 5: Create Clean RLS Policies for daily_challenges
-- =================================================================

-- Policy 1: Anyone (including anonymous) can view active challenges
-- Rationale: Daily challenges are public content used to attract and
--            engage users. Making active challenges publicly readable
--            allows preview before sign-up and encourages registration.
CREATE POLICY "public_read_active_challenges" ON public.daily_challenges
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

COMMENT ON POLICY "public_read_active_challenges" ON public.daily_challenges IS
  'Allows public read access to active challenges to encourage user engagement and sign-ups.';

-- Policy 2: Admins can manage all challenges
-- Rationale: Challenge creation, editing, and management should be
--            restricted to admin users. This prevents unauthorized
--            users from creating or modifying educational content.
CREATE POLICY "admins_manage_challenges" ON public.daily_challenges
  FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

COMMENT ON POLICY "admins_manage_challenges" ON public.daily_challenges IS
  'Restricts challenge creation and management to admin users only.';

-- =================================================================
-- STEP 6: Ensure RLS Is Enabled on Both Tables
-- =================================================================
-- Explicitly enable RLS to ensure security policies are enforced.

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- Migration Complete
-- =================================================================
-- This migration consolidates 9 previous RLS-related migrations
-- (010, 012-018) into a single, clean, well-documented setup.
--
-- Key improvements:
-- - Single function name (get_user_role) with no ambiguity
-- - Removed dangerous TEMP_DEBUG_ALLOW_ANY_READ policy
-- - All policies have clear names and comprehensive comments
-- - Permissions granted in correct order (no timing issues)
-- - Idempotent design allows safe re-running
-- =================================================================


-- -----------------------------------------------------------
-- Migration: 026_student_notifications_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de notifications étudiants
-- Version: 1.0.0
-- Date: 2026-02-22
-- Description: Tables pour les notifications étudiants et leurs préférences

-- ============================================
-- ENUMS
-- ============================================

-- Types de notifications pour les étudiants
CREATE TYPE notification_type AS ENUM (
  'daily_challenge',
  'streak_reminder',
  'badge_earned',
  'peer_review',
  'new_module',
  'ai_nudge'
);

-- Fréquence des digests email
CREATE TYPE email_digest_frequency AS ENUM (
  'immediate',
  'daily',
  'weekly',
  'off'
);

-- ============================================
-- TABLE: student_notifications
-- Notifications pour les étudiants
-- ============================================
CREATE TABLE IF NOT EXISTS student_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Contenu de la notification
  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',

  -- État
  is_read BOOLEAN DEFAULT false NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_student_notifications_user ON student_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_student_notifications_user_unread ON student_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_student_notifications_created ON student_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_notifications_type ON student_notifications(type);

-- ============================================
-- TABLE: notification_preferences
-- Préférences de notifications des utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Types de notifications activés
  notification_types_enabled JSONB DEFAULT '{
    "daily_challenge": true,
    "streak_reminder": true,
    "badge_earned": true,
    "peer_review": true,
    "new_module": true,
    "ai_nudge": true
  }'::jsonb NOT NULL,

  -- Préférences email
  email_digest_frequency email_digest_frequency DEFAULT 'daily' NOT NULL,

  -- Préférences push
  push_enabled BOOLEAN DEFAULT false NOT NULL,
  push_subscription JSONB,

  -- Heure préférée pour les notifications de streak (format HH:MM)
  preferred_notification_time TIME DEFAULT '09:00:00',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_push ON notification_preferences(push_enabled) WHERE push_enabled = true;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour mettre à jour read_at quand is_read devient true
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement read_at
CREATE TRIGGER set_notification_read_at
  BEFORE UPDATE ON student_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_at();

-- Trigger pour mettre à jour updated_at sur notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer les préférences par défaut pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement les préférences lors de la création d'un profil
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur les tables
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies pour student_notifications
-- Les utilisateurs peuvent lire leurs propres notifications
CREATE POLICY "Users can view their own notifications"
  ON student_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres notifications (marquer comme lu)
CREATE POLICY "Users can update their own notifications"
  ON student_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications"
  ON student_notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Seul le système (service role) peut créer des notifications
-- Les utilisateurs normaux ne peuvent pas créer de notifications directement
CREATE POLICY "System can create notifications"
  ON student_notifications
  FOR INSERT
  WITH CHECK (true);

-- Policies pour notification_preferences
-- Les utilisateurs peuvent lire leurs propres préférences
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres préférences
CREATE POLICY "Users can update their own preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leurs propres préférences
CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Fonction pour obtenir le nombre de notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM student_notifications
  WHERE user_id = p_user_id
    AND is_read = false;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE student_notifications
  SET is_read = true
  WHERE user_id = p_user_id
    AND is_read = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE student_notifications IS 'Notifications pour les étudiants (défis quotidiens, streaks, badges, etc.)';
COMMENT ON TABLE notification_preferences IS 'Préférences de notifications des utilisateurs';
COMMENT ON COLUMN student_notifications.type IS 'Type de notification: daily_challenge, streak_reminder, badge_earned, peer_review, new_module, ai_nudge';
COMMENT ON COLUMN notification_preferences.notification_types_enabled IS 'JSONB object avec les types de notifications activés pour chaque catégorie';
COMMENT ON COLUMN notification_preferences.email_digest_frequency IS 'Fréquence des digests email: immediate, daily, weekly, off';
COMMENT ON COLUMN notification_preferences.preferred_notification_time IS 'Heure préférée pour recevoir les notifications de streak (format TIME)';


-- -----------------------------------------------------------
-- Migration: 026_student_notifications_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de notifications étudiants
-- Version: 1.0.0
-- Date: 2026-02-22
-- Description: Tables pour les notifications étudiants et leurs préférences

-- ============================================
-- ENUMS
-- ============================================

-- Types de notifications pour les étudiants
CREATE TYPE notification_type AS ENUM (
  'daily_challenge',
  'streak_reminder',
  'badge_earned',
  'peer_review',
  'new_module',
  'ai_nudge'
);

-- Fréquence des digests email
CREATE TYPE email_digest_frequency AS ENUM (
  'immediate',
  'daily',
  'weekly',
  'off'
);

-- ============================================
-- TABLE: student_notifications
-- Notifications pour les étudiants
-- ============================================
CREATE TABLE IF NOT EXISTS student_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Contenu de la notification
  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',

  -- État
  is_read BOOLEAN DEFAULT false NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_student_notifications_user ON student_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_student_notifications_user_unread ON student_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_student_notifications_created ON student_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_notifications_type ON student_notifications(type);

-- ============================================
-- TABLE: notification_preferences
-- Préférences de notifications des utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Types de notifications activés
  notification_types_enabled JSONB DEFAULT '{
    "daily_challenge": true,
    "streak_reminder": true,
    "badge_earned": true,
    "peer_review": true,
    "new_module": true,
    "ai_nudge": true
  }'::jsonb NOT NULL,

  -- Préférences email
  email_digest_frequency email_digest_frequency DEFAULT 'daily' NOT NULL,

  -- Préférences push
  push_enabled BOOLEAN DEFAULT false NOT NULL,
  push_subscription JSONB,

  -- Heure préférée pour les notifications de streak (format HH:MM)
  preferred_notification_time TIME DEFAULT '09:00:00',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_push ON notification_preferences(push_enabled) WHERE push_enabled = true;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour mettre à jour read_at quand is_read devient true
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement read_at
CREATE TRIGGER set_notification_read_at
  BEFORE UPDATE ON student_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_at();

-- Trigger pour mettre à jour updated_at sur notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer les préférences par défaut pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement les préférences lors de la création d'un profil
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur les tables
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies pour student_notifications
-- Les utilisateurs peuvent lire leurs propres notifications
CREATE POLICY "Users can view their own notifications"
  ON student_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres notifications (marquer comme lu)
CREATE POLICY "Users can update their own notifications"
  ON student_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications"
  ON student_notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Seul le système (service role) peut créer des notifications
-- Les utilisateurs normaux ne peuvent pas créer de notifications directement
CREATE POLICY "System can create notifications"
  ON student_notifications
  FOR INSERT
  WITH CHECK (true);

-- Policies pour notification_preferences
-- Les utilisateurs peuvent lire leurs propres préférences
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres préférences
CREATE POLICY "Users can update their own preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leurs propres préférences
CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Fonction pour obtenir le nombre de notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM student_notifications
  WHERE user_id = p_user_id
    AND is_read = false;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE student_notifications
  SET is_read = true
  WHERE user_id = p_user_id
    AND is_read = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE student_notifications IS 'Notifications pour les étudiants (défis quotidiens, streaks, badges, etc.)';
COMMENT ON TABLE notification_preferences IS 'Préférences de notifications des utilisateurs';
COMMENT ON COLUMN student_notifications.type IS 'Type de notification: daily_challenge, streak_reminder, badge_earned, peer_review, new_module, ai_nudge';
COMMENT ON COLUMN notification_preferences.notification_types_enabled IS 'JSONB object avec les types de notifications activés pour chaque catégorie';
COMMENT ON COLUMN notification_preferences.email_digest_frequency IS 'Fréquence des digests email: immediate, daily, weekly, off';
COMMENT ON COLUMN notification_preferences.preferred_notification_time IS 'Heure préférée pour recevoir les notifications de streak (format TIME)';


-- -----------------------------------------------------------
-- Migration: 027_teams_system.sql
-- -----------------------------------------------------------

-- Migration pour le système d'équipes
-- Version: 2.3.0
-- Date: 2026-02-22
-- Description: Tables pour les équipes, membres, invitations, défis d'équipe et classement

-- ============================================
-- TABLE: teams
-- Équipes de 2 à 5 membres pour défis collaboratifs
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,

  -- Métadonnées de l'équipe
  captain_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  max_members INTEGER DEFAULT 5 CHECK (max_members >= 2 AND max_members <= 5),
  is_public BOOLEAN DEFAULT true,

  -- Statistiques de l'équipe
  total_score INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,

  -- Tags et catégories
  tags TEXT[] DEFAULT '{}',

  -- Statut
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disbanded')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_teams_captain ON teams(captain_id);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_teams_public ON teams(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_teams_score ON teams(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

-- ============================================
-- TABLE: team_members
-- Junction table pour les membres d'équipe
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Rôle dans l'équipe
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('captain', 'co_captain', 'member')),

  -- Statistiques individuelles dans l'équipe
  contributions INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,

  -- Statut
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  UNIQUE(team_id, user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status) WHERE status = 'active';

-- ============================================
-- TABLE: team_invitations
-- Invitations pour rejoindre une équipe
-- ============================================
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255),

  -- Message d'invitation
  message TEXT,

  -- Statut de l'invitation
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,

  -- Contraintes (une invitation active par utilisateur par équipe)
  UNIQUE(team_id, invitee_id, status)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee ON team_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires ON team_invitations(expires_at) WHERE status = 'pending';

-- ============================================
-- TABLE: team_challenges
-- Défis d'équipe et participations
-- ============================================
CREATE TABLE IF NOT EXISTS team_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,

  -- Type de défi d'équipe
  challenge_type VARCHAR(20) DEFAULT 'collaborative' CHECK (challenge_type IN ('collaborative', 'tournament', 'custom')),

  -- Soumission d'équipe
  submission TEXT NOT NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Membres contributeurs
  contributors UUID[] NOT NULL DEFAULT '{}',

  -- Évaluation
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  ai_evaluation JSONB,
  bonus_points INTEGER DEFAULT 0,

  -- Métadonnées
  time_spent INTEGER, -- En secondes
  hints_used INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unicité (une seule participation d'équipe par défi)
  UNIQUE(team_id, challenge_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_challenges_team ON team_challenges(team_id);
CREATE INDEX IF NOT EXISTS idx_team_challenges_challenge ON team_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_team_challenges_completed ON team_challenges(completed_at);
CREATE INDEX IF NOT EXISTS idx_team_challenges_score ON team_challenges(score DESC);

-- ============================================
-- TABLE: team_leaderboard
-- Classement des équipes (vue matérialisée pour performance)
-- ============================================
CREATE TABLE IF NOT EXISTS team_leaderboard (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  rank INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  challenges_completed INTEGER NOT NULL,
  tournaments_won INTEGER NOT NULL,
  average_score NUMERIC(5,2) DEFAULT 0,
  member_count INTEGER NOT NULL,

  -- Périodes de temps
  weekly_score INTEGER DEFAULT 0,
  monthly_score INTEGER DEFAULT 0,

  -- Métadonnées
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_rank ON team_leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_score ON team_leaderboard(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_weekly ON team_leaderboard(weekly_score DESC);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_monthly ON team_leaderboard(monthly_score DESC);

-- ============================================
-- TABLE: team_achievements
-- Achievements débloqués par les équipes
-- ============================================
CREATE TABLE IF NOT EXISTS team_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,

  achievement_type VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(100) NOT NULL,
  achievement_description TEXT,
  icon_emoji VARCHAR(10),
  rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),

  progress INTEGER DEFAULT 0,
  max_progress INTEGER,

  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(team_id, achievement_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_team_achievements_team ON team_achievements(team_id);
CREATE INDEX IF NOT EXISTS idx_team_achievements_unlocked ON team_achievements(unlocked_at);

-- ============================================
-- TABLE: team_notifications
-- Notifications liées aux équipes
-- ============================================
CREATE TABLE IF NOT EXISTS team_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,

  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index
CREATE INDEX IF NOT EXISTS idx_team_notifications_team ON team_notifications(team_id);
CREATE INDEX IF NOT EXISTS idx_team_notifications_user_unread ON team_notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_team_notifications_created ON team_notifications(created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour vérifier le nombre de membres d'une équipe
CREATE OR REPLACE FUNCTION check_team_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_members INTEGER;
  team_max_members INTEGER;
BEGIN
  -- Compter les membres actifs de l'équipe
  SELECT COUNT(*), t.max_members
  INTO current_members, team_max_members
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE tm.team_id = NEW.team_id
    AND tm.status = 'active'
  GROUP BY t.max_members;

  -- Vérifier la limite
  IF current_members >= team_max_members THEN
    RAISE EXCEPTION 'Team has reached maximum member limit of %', team_max_members;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier la limite de membres
DROP TRIGGER IF EXISTS trigger_check_team_member_limit ON team_members;
CREATE TRIGGER trigger_check_team_member_limit
  BEFORE INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_limit();

-- Fonction pour mettre à jour le leaderboard des équipes
CREATE OR REPLACE FUNCTION update_team_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les statistiques pour toutes les équipes
  WITH team_stats AS (
    SELECT
      t.id as team_id,
      COALESCE(SUM(tc.score), 0) as total_score,
      COUNT(tc.id) as challenges_completed,
      COALESCE(AVG(tc.score), 0) as average_score,
      COUNT(DISTINCT tm.user_id) as member_count,
      COALESCE(SUM(CASE WHEN tc.completed_at >= NOW() - INTERVAL '7 days' THEN tc.score ELSE 0 END), 0) as weekly_score,
      COALESCE(SUM(CASE WHEN tc.completed_at >= NOW() - INTERVAL '30 days' THEN tc.score ELSE 0 END), 0) as monthly_score
    FROM teams t
    LEFT JOIN team_challenges tc ON tc.team_id = t.id
    LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.status = 'active'
    WHERE t.status = 'active'
    GROUP BY t.id
  ),
  ranked_teams AS (
    SELECT
      team_id,
      total_score,
      challenges_completed,
      average_score,
      member_count,
      weekly_score,
      monthly_score,
      RANK() OVER (ORDER BY total_score DESC, challenges_completed DESC) as new_rank
    FROM team_stats
  )
  INSERT INTO team_leaderboard (
    team_id, rank, total_score, challenges_completed,
    tournaments_won, average_score, member_count,
    weekly_score, monthly_score
  )
  SELECT
    team_id, new_rank, total_score, challenges_completed,
    0, -- tournaments_won sera mis à jour séparément
    average_score, member_count, weekly_score, monthly_score
  FROM ranked_teams
  ON CONFLICT (team_id)
  DO UPDATE SET
    rank = EXCLUDED.rank,
    total_score = EXCLUDED.total_score,
    challenges_completed = EXCLUDED.challenges_completed,
    average_score = EXCLUDED.average_score,
    member_count = EXCLUDED.member_count,
    weekly_score = EXCLUDED.weekly_score,
    monthly_score = EXCLUDED.monthly_score,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le leaderboard après un défi d'équipe
DROP TRIGGER IF EXISTS trigger_update_team_leaderboard ON team_challenges;
CREATE TRIGGER trigger_update_team_leaderboard
  AFTER INSERT OR UPDATE ON team_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_team_leaderboard();

-- Fonction pour mettre à jour les statistiques de l'équipe
CREATE OR REPLACE FUNCTION update_team_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE teams
  SET
    total_score = (
      SELECT COALESCE(SUM(score), 0)
      FROM team_challenges
      WHERE team_id = NEW.team_id
    ),
    challenges_completed = (
      SELECT COUNT(*)
      FROM team_challenges
      WHERE team_id = NEW.team_id
    ),
    updated_at = NOW()
  WHERE id = NEW.team_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les stats de l'équipe après un défi
DROP TRIGGER IF EXISTS trigger_update_team_stats ON team_challenges;
CREATE TRIGGER trigger_update_team_stats
  AFTER INSERT OR UPDATE ON team_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_team_stats();

-- Fonction pour expirer les invitations
CREATE OR REPLACE FUNCTION expire_team_invitations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE team_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer une notification d'équipe
CREATE OR REPLACE FUNCTION create_team_notification(
  p_team_id UUID,
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(200),
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO team_notifications (
    team_id, user_id, type, title, message, data
  ) VALUES (
    p_team_id, p_user_id, p_type, p_title, p_message, p_data
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les membres actifs d'une équipe
CREATE OR REPLACE FUNCTION get_active_team_members(p_team_id UUID)
RETURNS TABLE (
  user_id UUID,
  role VARCHAR(20),
  joined_at TIMESTAMP WITH TIME ZONE,
  contributions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tm.user_id,
    tm.role,
    tm.joined_at,
    tm.contributions
  FROM team_members tm
  WHERE tm.team_id = p_team_id
    AND tm.status = 'active'
  ORDER BY
    CASE tm.role
      WHEN 'captain' THEN 1
      WHEN 'co_captain' THEN 2
      ELSE 3
    END,
    tm.joined_at;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un utilisateur peut rejoindre une équipe
CREATE OR REPLACE FUNCTION can_join_team(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_members INTEGER;
  team_max_members INTEGER;
  user_in_team BOOLEAN;
BEGIN
  -- Vérifier si l'utilisateur est déjà membre
  SELECT EXISTS(
    SELECT 1 FROM team_members
    WHERE user_id = p_user_id
      AND team_id = p_team_id
      AND status = 'active'
  ) INTO user_in_team;

  IF user_in_team THEN
    RETURN FALSE;
  END IF;

  -- Vérifier la limite de membres
  SELECT COUNT(*), t.max_members
  INTO current_members, team_max_members
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE tm.team_id = p_team_id
    AND tm.status = 'active'
  GROUP BY t.max_members;

  RETURN current_members < team_max_members;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: teams
-- ============================================

-- Lecture: Tout le monde peut voir les équipes publiques et actives
DROP POLICY IF EXISTS "teams_select_policy" ON teams;
CREATE POLICY "teams_select_policy" ON teams
  FOR SELECT
  USING (
    status = 'active' AND (
      is_public = true
      OR captain_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = teams.id
          AND user_id = auth.uid()
          AND status = 'active'
      )
    )
  );

-- Insertion: Les utilisateurs authentifiés peuvent créer des équipes
DROP POLICY IF EXISTS "teams_insert_policy" ON teams;
CREATE POLICY "teams_insert_policy" ON teams
  FOR INSERT
  WITH CHECK (auth.uid() = captain_id);

-- Mise à jour: Seulement le capitaine peut modifier l'équipe
DROP POLICY IF EXISTS "teams_update_policy" ON teams;
CREATE POLICY "teams_update_policy" ON teams
  FOR UPDATE
  USING (auth.uid() = captain_id);

-- Suppression: Seulement le capitaine peut dissoudre l'équipe
DROP POLICY IF EXISTS "teams_delete_policy" ON teams;
CREATE POLICY "teams_delete_policy" ON teams
  FOR DELETE
  USING (auth.uid() = captain_id);

-- ============================================
-- RLS POLICIES: team_members
-- ============================================

-- Lecture: Membres de l'équipe et utilisateurs authentifiés (pour équipes publiques)
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
CREATE POLICY "team_members_select_policy" ON team_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
        AND (teams.is_public = true OR teams.captain_id = auth.uid())
    )
  );

-- Insertion: Capitaine ou co-capitaine peuvent ajouter des membres (via invitation)
DROP POLICY IF EXISTS "team_members_insert_policy" ON team_members;
CREATE POLICY "team_members_insert_policy" ON team_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
        AND teams.captain_id = auth.uid()
    )
  );

-- Mise à jour: Capitaine peut modifier les rôles
DROP POLICY IF EXISTS "team_members_update_policy" ON team_members;
CREATE POLICY "team_members_update_policy" ON team_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
        AND teams.captain_id = auth.uid()
    )
  );

-- Suppression: Membres peuvent se retirer, capitaine peut retirer des membres
DROP POLICY IF EXISTS "team_members_delete_policy" ON team_members;
CREATE POLICY "team_members_delete_policy" ON team_members
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
        AND teams.captain_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: team_invitations
-- ============================================

-- Lecture: Invité et invitant peuvent voir l'invitation
DROP POLICY IF EXISTS "team_invitations_select_policy" ON team_invitations;
CREATE POLICY "team_invitations_select_policy" ON team_invitations
  FOR SELECT
  USING (
    invitee_id = auth.uid()
    OR inviter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id
        AND teams.captain_id = auth.uid()
    )
  );

-- Insertion: Capitaine ou co-capitaine peuvent inviter
DROP POLICY IF EXISTS "team_invitations_insert_policy" ON team_invitations;
CREATE POLICY "team_invitations_insert_policy" ON team_invitations
  FOR INSERT
  WITH CHECK (
    inviter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('captain', 'co_captain')
    )
  );

-- Mise à jour: Invité peut accepter/refuser, invitant peut annuler
DROP POLICY IF EXISTS "team_invitations_update_policy" ON team_invitations;
CREATE POLICY "team_invitations_update_policy" ON team_invitations
  FOR UPDATE
  USING (
    invitee_id = auth.uid()
    OR inviter_id = auth.uid()
  );

-- ============================================
-- RLS POLICIES: team_challenges
-- ============================================

-- Lecture: Membres de l'équipe peuvent voir les défis
DROP POLICY IF EXISTS "team_challenges_select_policy" ON team_challenges;
CREATE POLICY "team_challenges_select_policy" ON team_challenges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_challenges.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.status = 'active'
    )
  );

-- Insertion: Membres de l'équipe peuvent soumettre
DROP POLICY IF EXISTS "team_challenges_insert_policy" ON team_challenges;
CREATE POLICY "team_challenges_insert_policy" ON team_challenges
  FOR INSERT
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_challenges.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.status = 'active'
    )
  );

-- ============================================
-- RLS POLICIES: team_leaderboard
-- ============================================

-- Lecture publique du leaderboard
DROP POLICY IF EXISTS "team_leaderboard_select_policy" ON team_leaderboard;
CREATE POLICY "team_leaderboard_select_policy" ON team_leaderboard
  FOR SELECT
  USING (true);

-- ============================================
-- RLS POLICIES: team_achievements
-- ============================================

-- Lecture: Membres de l'équipe
DROP POLICY IF EXISTS "team_achievements_select_policy" ON team_achievements;
CREATE POLICY "team_achievements_select_policy" ON team_achievements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_achievements.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: team_notifications
-- ============================================

-- Lecture: Destinataire de la notification
DROP POLICY IF EXISTS "team_notifications_select_policy" ON team_notifications;
CREATE POLICY "team_notifications_select_policy" ON team_notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Mise à jour: Destinataire peut marquer comme lu
DROP POLICY IF EXISTS "team_notifications_update_policy" ON team_notifications;
CREATE POLICY "team_notifications_update_policy" ON team_notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- INITIAL DATA
-- ============================================

-- Créer des achievements types pour les équipes
INSERT INTO team_achievements (team_id, achievement_type, achievement_name, achievement_description, icon_emoji, rarity, max_progress)
SELECT
  t.id,
  'first_challenge',
  'Premier Défi',
  'Compléter votre premier défi d''équipe',
  '🎯',
  'common',
  1
FROM teams t
WHERE NOT EXISTS (
  SELECT 1 FROM team_achievements ta
  WHERE ta.team_id = t.id AND ta.achievement_type = 'first_challenge'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE teams IS 'Équipes de 2 à 5 membres pour défis collaboratifs';
COMMENT ON TABLE team_members IS 'Junction table reliant les utilisateurs aux équipes';
COMMENT ON TABLE team_invitations IS 'Invitations pour rejoindre une équipe';
COMMENT ON TABLE team_challenges IS 'Défis d''équipe et leurs soumissions';
COMMENT ON TABLE team_leaderboard IS 'Classement des équipes basé sur leurs performances';
COMMENT ON TABLE team_achievements IS 'Achievements débloqués par les équipes';
COMMENT ON TABLE team_notifications IS 'Notifications relatives aux équipes';

COMMENT ON FUNCTION check_team_member_limit() IS 'Vérifie que l''équipe n''a pas atteint sa limite de membres';
COMMENT ON FUNCTION update_team_leaderboard() IS 'Met à jour le classement des équipes';
COMMENT ON FUNCTION update_team_stats() IS 'Met à jour les statistiques d''une équipe';
COMMENT ON FUNCTION expire_team_invitations() IS 'Expire les invitations périmées';
COMMENT ON FUNCTION create_team_notification(UUID, UUID, VARCHAR, VARCHAR, TEXT, JSONB) IS 'Crée une notification pour une équipe';
COMMENT ON FUNCTION get_active_team_members(UUID) IS 'Retourne les membres actifs d''une équipe';
COMMENT ON FUNCTION can_join_team(UUID, UUID) IS 'Vérifie si un utilisateur peut rejoindre une équipe';


-- -----------------------------------------------------------
-- Migration: 027_teams_system.sql
-- -----------------------------------------------------------

-- Migration pour le système d'équipes
-- Version: 2.3.0
-- Date: 2026-02-22
-- Description: Tables pour les équipes, membres, invitations, défis d'équipe et classement

-- ============================================
-- TABLE: teams
-- Équipes de 2 à 5 membres pour défis collaboratifs
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,

  -- Métadonnées de l'équipe
  captain_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  max_members INTEGER DEFAULT 5 CHECK (max_members >= 2 AND max_members <= 5),
  is_public BOOLEAN DEFAULT true,

  -- Statistiques de l'équipe
  total_score INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,

  -- Tags et catégories
  tags TEXT[] DEFAULT '{}',

  -- Statut
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disbanded')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_teams_captain ON teams(captain_id);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_teams_public ON teams(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_teams_score ON teams(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

-- ============================================
-- TABLE: team_members
-- Junction table pour les membres d'équipe
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Rôle dans l'équipe
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('captain', 'co_captain', 'member')),

  -- Statistiques individuelles dans l'équipe
  contributions INTEGER DEFAULT 0,
  challenges_completed INTEGER DEFAULT 0,

  -- Statut
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes
  UNIQUE(team_id, user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status) WHERE status = 'active';

-- ============================================
-- TABLE: team_invitations
-- Invitations pour rejoindre une équipe
-- ============================================
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255),

  -- Message d'invitation
  message TEXT,

  -- Statut de l'invitation
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,

  -- Contraintes (une invitation active par utilisateur par équipe)
  UNIQUE(team_id, invitee_id, status)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invitee ON team_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires ON team_invitations(expires_at) WHERE status = 'pending';

-- ============================================
-- TABLE: team_challenges
-- Défis d'équipe et participations
-- ============================================
CREATE TABLE IF NOT EXISTS team_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,

  -- Type de défi d'équipe
  challenge_type VARCHAR(20) DEFAULT 'collaborative' CHECK (challenge_type IN ('collaborative', 'tournament', 'custom')),

  -- Soumission d'équipe
  submission TEXT NOT NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Membres contributeurs
  contributors UUID[] NOT NULL DEFAULT '{}',

  -- Évaluation
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  ai_evaluation JSONB,
  bonus_points INTEGER DEFAULT 0,

  -- Métadonnées
  time_spent INTEGER, -- En secondes
  hints_used INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unicité (une seule participation d'équipe par défi)
  UNIQUE(team_id, challenge_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_challenges_team ON team_challenges(team_id);
CREATE INDEX IF NOT EXISTS idx_team_challenges_challenge ON team_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_team_challenges_completed ON team_challenges(completed_at);
CREATE INDEX IF NOT EXISTS idx_team_challenges_score ON team_challenges(score DESC);

-- ============================================
-- TABLE: team_leaderboard
-- Classement des équipes (vue matérialisée pour performance)
-- ============================================
CREATE TABLE IF NOT EXISTS team_leaderboard (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  rank INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  challenges_completed INTEGER NOT NULL,
  tournaments_won INTEGER NOT NULL,
  average_score NUMERIC(5,2) DEFAULT 0,
  member_count INTEGER NOT NULL,

  -- Périodes de temps
  weekly_score INTEGER DEFAULT 0,
  monthly_score INTEGER DEFAULT 0,

  -- Métadonnées
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_rank ON team_leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_score ON team_leaderboard(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_weekly ON team_leaderboard(weekly_score DESC);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_monthly ON team_leaderboard(monthly_score DESC);

-- ============================================
-- TABLE: team_achievements
-- Achievements débloqués par les équipes
-- ============================================
CREATE TABLE IF NOT EXISTS team_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,

  achievement_type VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(100) NOT NULL,
  achievement_description TEXT,
  icon_emoji VARCHAR(10),
  rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),

  progress INTEGER DEFAULT 0,
  max_progress INTEGER,

  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(team_id, achievement_type)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_team_achievements_team ON team_achievements(team_id);
CREATE INDEX IF NOT EXISTS idx_team_achievements_unlocked ON team_achievements(unlocked_at);

-- ============================================
-- TABLE: team_notifications
-- Notifications liées aux équipes
-- ============================================
CREATE TABLE IF NOT EXISTS team_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,

  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index
CREATE INDEX IF NOT EXISTS idx_team_notifications_team ON team_notifications(team_id);
CREATE INDEX IF NOT EXISTS idx_team_notifications_user_unread ON team_notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_team_notifications_created ON team_notifications(created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour vérifier le nombre de membres d'une équipe
CREATE OR REPLACE FUNCTION check_team_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_members INTEGER;
  team_max_members INTEGER;
BEGIN
  -- Compter les membres actifs de l'équipe
  SELECT COUNT(*), t.max_members
  INTO current_members, team_max_members
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE tm.team_id = NEW.team_id
    AND tm.status = 'active'
  GROUP BY t.max_members;

  -- Vérifier la limite
  IF current_members >= team_max_members THEN
    RAISE EXCEPTION 'Team has reached maximum member limit of %', team_max_members;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier la limite de membres
DROP TRIGGER IF EXISTS trigger_check_team_member_limit ON team_members;
CREATE TRIGGER trigger_check_team_member_limit
  BEFORE INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_member_limit();

-- Fonction pour mettre à jour le leaderboard des équipes
CREATE OR REPLACE FUNCTION update_team_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer les statistiques pour toutes les équipes
  WITH team_stats AS (
    SELECT
      t.id as team_id,
      COALESCE(SUM(tc.score), 0) as total_score,
      COUNT(tc.id) as challenges_completed,
      COALESCE(AVG(tc.score), 0) as average_score,
      COUNT(DISTINCT tm.user_id) as member_count,
      COALESCE(SUM(CASE WHEN tc.completed_at >= NOW() - INTERVAL '7 days' THEN tc.score ELSE 0 END), 0) as weekly_score,
      COALESCE(SUM(CASE WHEN tc.completed_at >= NOW() - INTERVAL '30 days' THEN tc.score ELSE 0 END), 0) as monthly_score
    FROM teams t
    LEFT JOIN team_challenges tc ON tc.team_id = t.id
    LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.status = 'active'
    WHERE t.status = 'active'
    GROUP BY t.id
  ),
  ranked_teams AS (
    SELECT
      team_id,
      total_score,
      challenges_completed,
      average_score,
      member_count,
      weekly_score,
      monthly_score,
      RANK() OVER (ORDER BY total_score DESC, challenges_completed DESC) as new_rank
    FROM team_stats
  )
  INSERT INTO team_leaderboard (
    team_id, rank, total_score, challenges_completed,
    tournaments_won, average_score, member_count,
    weekly_score, monthly_score
  )
  SELECT
    team_id, new_rank, total_score, challenges_completed,
    0, -- tournaments_won sera mis à jour séparément
    average_score, member_count, weekly_score, monthly_score
  FROM ranked_teams
  ON CONFLICT (team_id)
  DO UPDATE SET
    rank = EXCLUDED.rank,
    total_score = EXCLUDED.total_score,
    challenges_completed = EXCLUDED.challenges_completed,
    average_score = EXCLUDED.average_score,
    member_count = EXCLUDED.member_count,
    weekly_score = EXCLUDED.weekly_score,
    monthly_score = EXCLUDED.monthly_score,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le leaderboard après un défi d'équipe
DROP TRIGGER IF EXISTS trigger_update_team_leaderboard ON team_challenges;
CREATE TRIGGER trigger_update_team_leaderboard
  AFTER INSERT OR UPDATE ON team_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_team_leaderboard();

-- Fonction pour mettre à jour les statistiques de l'équipe
CREATE OR REPLACE FUNCTION update_team_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE teams
  SET
    total_score = (
      SELECT COALESCE(SUM(score), 0)
      FROM team_challenges
      WHERE team_id = NEW.team_id
    ),
    challenges_completed = (
      SELECT COUNT(*)
      FROM team_challenges
      WHERE team_id = NEW.team_id
    ),
    updated_at = NOW()
  WHERE id = NEW.team_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les stats de l'équipe après un défi
DROP TRIGGER IF EXISTS trigger_update_team_stats ON team_challenges;
CREATE TRIGGER trigger_update_team_stats
  AFTER INSERT OR UPDATE ON team_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_team_stats();

-- Fonction pour expirer les invitations
CREATE OR REPLACE FUNCTION expire_team_invitations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE team_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer une notification d'équipe
CREATE OR REPLACE FUNCTION create_team_notification(
  p_team_id UUID,
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(200),
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO team_notifications (
    team_id, user_id, type, title, message, data
  ) VALUES (
    p_team_id, p_user_id, p_type, p_title, p_message, p_data
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les membres actifs d'une équipe
CREATE OR REPLACE FUNCTION get_active_team_members(p_team_id UUID)
RETURNS TABLE (
  user_id UUID,
  role VARCHAR(20),
  joined_at TIMESTAMP WITH TIME ZONE,
  contributions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tm.user_id,
    tm.role,
    tm.joined_at,
    tm.contributions
  FROM team_members tm
  WHERE tm.team_id = p_team_id
    AND tm.status = 'active'
  ORDER BY
    CASE tm.role
      WHEN 'captain' THEN 1
      WHEN 'co_captain' THEN 2
      ELSE 3
    END,
    tm.joined_at;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un utilisateur peut rejoindre une équipe
CREATE OR REPLACE FUNCTION can_join_team(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_members INTEGER;
  team_max_members INTEGER;
  user_in_team BOOLEAN;
BEGIN
  -- Vérifier si l'utilisateur est déjà membre
  SELECT EXISTS(
    SELECT 1 FROM team_members
    WHERE user_id = p_user_id
      AND team_id = p_team_id
      AND status = 'active'
  ) INTO user_in_team;

  IF user_in_team THEN
    RETURN FALSE;
  END IF;

  -- Vérifier la limite de membres
  SELECT COUNT(*), t.max_members
  INTO current_members, team_max_members
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE tm.team_id = p_team_id
    AND tm.status = 'active'
  GROUP BY t.max_members;

  RETURN current_members < team_max_members;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: teams
-- ============================================

-- Lecture: Tout le monde peut voir les équipes publiques et actives
DROP POLICY IF EXISTS "teams_select_policy" ON teams;
CREATE POLICY "teams_select_policy" ON teams
  FOR SELECT
  USING (
    status = 'active' AND (
      is_public = true
      OR captain_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = teams.id
          AND user_id = auth.uid()
          AND status = 'active'
      )
    )
  );

-- Insertion: Les utilisateurs authentifiés peuvent créer des équipes
DROP POLICY IF EXISTS "teams_insert_policy" ON teams;
CREATE POLICY "teams_insert_policy" ON teams
  FOR INSERT
  WITH CHECK (auth.uid() = captain_id);

-- Mise à jour: Seulement le capitaine peut modifier l'équipe
DROP POLICY IF EXISTS "teams_update_policy" ON teams;
CREATE POLICY "teams_update_policy" ON teams
  FOR UPDATE
  USING (auth.uid() = captain_id);

-- Suppression: Seulement le capitaine peut dissoudre l'équipe
DROP POLICY IF EXISTS "teams_delete_policy" ON teams;
CREATE POLICY "teams_delete_policy" ON teams
  FOR DELETE
  USING (auth.uid() = captain_id);

-- ============================================
-- RLS POLICIES: team_members
-- ============================================

-- Lecture: Membres de l'équipe et utilisateurs authentifiés (pour équipes publiques)
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
CREATE POLICY "team_members_select_policy" ON team_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
        AND (teams.is_public = true OR teams.captain_id = auth.uid())
    )
  );

-- Insertion: Capitaine ou co-capitaine peuvent ajouter des membres (via invitation)
DROP POLICY IF EXISTS "team_members_insert_policy" ON team_members;
CREATE POLICY "team_members_insert_policy" ON team_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
        AND teams.captain_id = auth.uid()
    )
  );

-- Mise à jour: Capitaine peut modifier les rôles
DROP POLICY IF EXISTS "team_members_update_policy" ON team_members;
CREATE POLICY "team_members_update_policy" ON team_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
        AND teams.captain_id = auth.uid()
    )
  );

-- Suppression: Membres peuvent se retirer, capitaine peut retirer des membres
DROP POLICY IF EXISTS "team_members_delete_policy" ON team_members;
CREATE POLICY "team_members_delete_policy" ON team_members
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
        AND teams.captain_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: team_invitations
-- ============================================

-- Lecture: Invité et invitant peuvent voir l'invitation
DROP POLICY IF EXISTS "team_invitations_select_policy" ON team_invitations;
CREATE POLICY "team_invitations_select_policy" ON team_invitations
  FOR SELECT
  USING (
    invitee_id = auth.uid()
    OR inviter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id
        AND teams.captain_id = auth.uid()
    )
  );

-- Insertion: Capitaine ou co-capitaine peuvent inviter
DROP POLICY IF EXISTS "team_invitations_insert_policy" ON team_invitations;
CREATE POLICY "team_invitations_insert_policy" ON team_invitations
  FOR INSERT
  WITH CHECK (
    inviter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('captain', 'co_captain')
    )
  );

-- Mise à jour: Invité peut accepter/refuser, invitant peut annuler
DROP POLICY IF EXISTS "team_invitations_update_policy" ON team_invitations;
CREATE POLICY "team_invitations_update_policy" ON team_invitations
  FOR UPDATE
  USING (
    invitee_id = auth.uid()
    OR inviter_id = auth.uid()
  );

-- ============================================
-- RLS POLICIES: team_challenges
-- ============================================

-- Lecture: Membres de l'équipe peuvent voir les défis
DROP POLICY IF EXISTS "team_challenges_select_policy" ON team_challenges;
CREATE POLICY "team_challenges_select_policy" ON team_challenges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_challenges.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.status = 'active'
    )
  );

-- Insertion: Membres de l'équipe peuvent soumettre
DROP POLICY IF EXISTS "team_challenges_insert_policy" ON team_challenges;
CREATE POLICY "team_challenges_insert_policy" ON team_challenges
  FOR INSERT
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_challenges.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.status = 'active'
    )
  );

-- ============================================
-- RLS POLICIES: team_leaderboard
-- ============================================

-- Lecture publique du leaderboard
DROP POLICY IF EXISTS "team_leaderboard_select_policy" ON team_leaderboard;
CREATE POLICY "team_leaderboard_select_policy" ON team_leaderboard
  FOR SELECT
  USING (true);

-- ============================================
-- RLS POLICIES: team_achievements
-- ============================================

-- Lecture: Membres de l'équipe
DROP POLICY IF EXISTS "team_achievements_select_policy" ON team_achievements;
CREATE POLICY "team_achievements_select_policy" ON team_achievements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_achievements.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: team_notifications
-- ============================================

-- Lecture: Destinataire de la notification
DROP POLICY IF EXISTS "team_notifications_select_policy" ON team_notifications;
CREATE POLICY "team_notifications_select_policy" ON team_notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Mise à jour: Destinataire peut marquer comme lu
DROP POLICY IF EXISTS "team_notifications_update_policy" ON team_notifications;
CREATE POLICY "team_notifications_update_policy" ON team_notifications
  FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- INITIAL DATA
-- ============================================

-- Créer des achievements types pour les équipes
INSERT INTO team_achievements (team_id, achievement_type, achievement_name, achievement_description, icon_emoji, rarity, max_progress)
SELECT
  t.id,
  'first_challenge',
  'Premier Défi',
  'Compléter votre premier défi d''équipe',
  '🎯',
  'common',
  1
FROM teams t
WHERE NOT EXISTS (
  SELECT 1 FROM team_achievements ta
  WHERE ta.team_id = t.id AND ta.achievement_type = 'first_challenge'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE teams IS 'Équipes de 2 à 5 membres pour défis collaboratifs';
COMMENT ON TABLE team_members IS 'Junction table reliant les utilisateurs aux équipes';
COMMENT ON TABLE team_invitations IS 'Invitations pour rejoindre une équipe';
COMMENT ON TABLE team_challenges IS 'Défis d''équipe et leurs soumissions';
COMMENT ON TABLE team_leaderboard IS 'Classement des équipes basé sur leurs performances';
COMMENT ON TABLE team_achievements IS 'Achievements débloqués par les équipes';
COMMENT ON TABLE team_notifications IS 'Notifications relatives aux équipes';

COMMENT ON FUNCTION check_team_member_limit() IS 'Vérifie que l''équipe n''a pas atteint sa limite de membres';
COMMENT ON FUNCTION update_team_leaderboard() IS 'Met à jour le classement des équipes';
COMMENT ON FUNCTION update_team_stats() IS 'Met à jour les statistiques d''une équipe';
COMMENT ON FUNCTION expire_team_invitations() IS 'Expire les invitations périmées';
COMMENT ON FUNCTION create_team_notification(UUID, UUID, VARCHAR, VARCHAR, TEXT, JSONB) IS 'Crée une notification pour une équipe';
COMMENT ON FUNCTION get_active_team_members(UUID) IS 'Retourne les membres actifs d''une équipe';
COMMENT ON FUNCTION can_join_team(UUID, UUID) IS 'Vérifie si un utilisateur peut rejoindre une équipe';


-- -----------------------------------------------------------
-- Migration: 028_skill_tree_levels.sql
-- -----------------------------------------------------------

-- Migration pour le système d'arbre de compétences et de progression de niveau
-- Version: 2.2.0
-- Date: 2026-02-22
-- Description: Tables pour l'arbre de compétences (skill tree), progression des utilisateurs, définitions de niveaux et système XP

-- ============================================
-- TABLE: level_definitions
-- Définitions des niveaux et leurs exigences XP
-- ============================================
CREATE TABLE IF NOT EXISTS level_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_rank INTEGER UNIQUE NOT NULL CHECK (level_rank > 0),
  level_name VARCHAR(50) UNIQUE NOT NULL,
  level_name_fr VARCHAR(50) NOT NULL,

  -- Exigences XP
  xp_required INTEGER NOT NULL CHECK (xp_required >= 0),
  xp_next_level INTEGER, -- NULL pour le niveau max

  -- Visuel
  icon_emoji VARCHAR(10),
  color_hex VARCHAR(7),
  badge_image_url TEXT,

  -- Récompenses
  rewards JSONB DEFAULT '{}', -- Badges, avatars, fonctionnalités débloquées

  -- Métadonnées
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_level_definitions_rank ON level_definitions(level_rank);
CREATE INDEX IF NOT EXISTS idx_level_definitions_xp ON level_definitions(xp_required);

-- Insertion des 5 niveaux par défaut
INSERT INTO level_definitions (level_rank, level_name, level_name_fr, xp_required, xp_next_level, icon_emoji, color_hex, description) VALUES
  (1, 'Novice', 'Novice', 0, 1000, '🌱', '#94A3B8', 'Débutant en prompt engineering. Apprend les bases.'),
  (2, 'Apprentice', 'Apprenti', 1000, 5000, '📚', '#60A5FA', 'Maîtrise les techniques fondamentales.'),
  (3, 'Expert', 'Expert', 5000, 15000, '⚡', '#F59E0B', 'Expert en prompt engineering. Utilise des techniques avancées.'),
  (4, 'Master', 'Maître', 15000, 50000, '🔥', '#EF4444', 'Maître du prompt engineering. Guide les autres.'),
  (5, 'Legend', 'Légende', 50000, NULL, '👑', '#8B5CF6', 'Légende vivante. Innovateur en prompt engineering.')
ON CONFLICT (level_rank) DO NOTHING;

-- ============================================
-- TABLE: user_levels
-- Niveau et XP actuels des utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS user_levels (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- Niveau actuel
  current_level_id UUID REFERENCES level_definitions(id) NOT NULL,
  current_level_rank INTEGER NOT NULL DEFAULT 1,

  -- XP
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  current_level_xp INTEGER NOT NULL DEFAULT 0 CHECK (current_level_xp >= 0),

  -- Statistiques
  total_level_ups INTEGER DEFAULT 0,

  -- Timestamps
  last_xp_gain_at TIMESTAMP WITH TIME ZONE,
  last_level_up_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_levels_user ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_rank ON user_levels(current_level_rank);
CREATE INDEX IF NOT EXISTS idx_user_levels_xp ON user_levels(total_xp DESC);

-- ============================================
-- TABLE: xp_transactions
-- Historique des gains/pertes d'XP
-- ============================================
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Transaction
  xp_amount INTEGER NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'challenge_complete', 'tournament_win', 'daily_streak', 'peer_review', 'team_challenge'
  source_id UUID, -- ID de la source (challenge_id, tournament_id, etc.)

  -- Contexte
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);

-- ============================================
-- TABLE: skill_categories
-- Catégories de compétences (prompt engineering)
-- ============================================
CREATE TABLE IF NOT EXISTS skill_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  name_fr VARCHAR(100) NOT NULL,

  -- Visuel
  icon_emoji VARCHAR(10),
  color_hex VARCHAR(7),

  -- Métadonnées
  description TEXT,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_skill_categories_order ON skill_categories(display_order);

-- Insertion des catégories par défaut
INSERT INTO skill_categories (name, name_fr, icon_emoji, color_hex, description, display_order) VALUES
  ('Foundations', 'Fondamentaux', '🎯', '#3B82F6', 'Techniques de base du prompt engineering', 1),
  ('Context Control', 'Contrôle du Contexte', '📝', '#10B981', 'Gestion et optimisation du contexte', 2),
  ('Output Shaping', 'Façonnage de Sortie', '🎨', '#F59E0B', 'Contrôle du format et style de sortie', 3),
  ('Advanced Techniques', 'Techniques Avancées', '⚡', '#8B5CF6', 'Techniques avancées et spécialisées', 4),
  ('Chain of Thought', 'Chaîne de Pensée', '🧠', '#EC4899', 'Raisonnement et réflexion structurés', 5),
  ('Few-Shot Learning', 'Apprentissage Few-Shot', '📚', '#06B6D4', 'Utilisation d\'exemples pour guider l\'IA', 6)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TABLE: skill_nodes
-- Nœuds de l'arbre de compétences
-- ============================================
CREATE TABLE IF NOT EXISTS skill_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES skill_categories(id) ON DELETE CASCADE NOT NULL,

  -- Identification
  skill_key VARCHAR(100) UNIQUE NOT NULL, -- 'clear_instructions', 'role_prompting', 'chain_of_thought'
  name VARCHAR(200) NOT NULL,
  name_fr VARCHAR(200) NOT NULL,

  -- Hiérarchie
  parent_node_id UUID REFERENCES skill_nodes(id) ON DELETE SET NULL,
  tree_level INTEGER NOT NULL DEFAULT 1 CHECK (tree_level > 0),
  display_order INTEGER DEFAULT 0,

  -- Prérequis
  prerequisites UUID[] DEFAULT '{}', -- IDs des skill_nodes requis
  min_level_required INTEGER DEFAULT 1,
  xp_required INTEGER DEFAULT 0,

  -- Contenu
  description TEXT NOT NULL,
  detailed_explanation TEXT,
  examples JSONB DEFAULT '[]',
  resources TEXT[] DEFAULT '{}',

  -- Déverrouillage
  unlock_type VARCHAR(20) DEFAULT 'automatic' CHECK (unlock_type IN ('automatic', 'challenge', 'manual')),
  unlock_challenge_id UUID, -- Pour unlock_type='challenge'

  -- Visuel
  icon_emoji VARCHAR(10),
  position_x FLOAT, -- Position dans la visualisation
  position_y FLOAT,

  -- Métadonnées
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_time INTEGER, -- Minutes pour maîtriser

  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_skill_nodes_category ON skill_nodes(category_id);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_parent ON skill_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_level ON skill_nodes(tree_level);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_key ON skill_nodes(skill_key);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_active ON skill_nodes(active) WHERE active = true;

-- ============================================
-- TABLE: user_skill_progress
-- Progression des utilisateurs dans l'arbre de compétences
-- ============================================
CREATE TABLE IF NOT EXISTS user_skill_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_node_id UUID REFERENCES skill_nodes(id) ON DELETE CASCADE NOT NULL,

  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'completed', 'mastered')),

  -- Progression
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  practice_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,

  -- Timestamps
  unlocked_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  mastered_at TIMESTAMP WITH TIME ZONE,
  last_practiced_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unicité
  UNIQUE(user_id, skill_node_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_user ON user_skill_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_skill ON user_skill_progress(skill_node_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_status ON user_skill_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_completed ON user_skill_progress(completed_at DESC);

-- ============================================
-- TABLE: skill_unlocks_log
-- Journal des déverrouillages de compétences
-- ============================================
CREATE TABLE IF NOT EXISTS skill_unlocks_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_node_id UUID REFERENCES skill_nodes(id) ON DELETE CASCADE NOT NULL,

  -- Contexte de déverrouillage
  unlock_source VARCHAR(50), -- 'level_up', 'challenge_complete', 'prerequisite_met'
  unlock_context JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_skill_unlocks_user ON skill_unlocks_log(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_unlocks_skill ON skill_unlocks_log(skill_node_id);
CREATE INDEX IF NOT EXISTS idx_skill_unlocks_created ON skill_unlocks_log(created_at DESC);

-- ============================================
-- TABLE: level_up_notifications
-- Notifications de montée de niveau
-- ============================================
CREATE TABLE IF NOT EXISTS level_up_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Niveau
  from_level_rank INTEGER NOT NULL,
  to_level_rank INTEGER NOT NULL,
  from_level_name VARCHAR(50),
  to_level_name VARCHAR(50),

  -- Récompenses
  rewards_unlocked JSONB DEFAULT '{}',
  skills_unlocked UUID[] DEFAULT '{}',

  -- Statut
  shown BOOLEAN DEFAULT false,
  shown_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_level_up_notifications_user ON level_up_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_level_up_notifications_unshown ON level_up_notifications(user_id, shown) WHERE shown = false;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour initialiser le niveau d'un nouvel utilisateur
CREATE OR REPLACE FUNCTION initialize_user_level()
RETURNS TRIGGER AS $$
DECLARE
  v_default_level_id UUID;
BEGIN
  -- Récupérer l'ID du niveau Novice (rank 1)
  SELECT id INTO v_default_level_id
  FROM level_definitions
  WHERE level_rank = 1
  LIMIT 1;

  -- Créer l'enregistrement user_levels
  INSERT INTO user_levels (user_id, current_level_id, current_level_rank, total_xp, current_level_xp)
  VALUES (NEW.id, v_default_level_id, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer le niveau basé sur l'XP total
CREATE OR REPLACE FUNCTION calculate_level_from_xp(p_total_xp INTEGER)
RETURNS TABLE(level_id UUID, level_rank INTEGER, level_name VARCHAR, current_level_xp INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ld.id,
    ld.level_rank,
    ld.level_name,
    p_total_xp - ld.xp_required AS current_level_xp
  FROM level_definitions ld
  WHERE ld.xp_required <= p_total_xp
  ORDER BY ld.level_rank DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter de l'XP et gérer les montées de niveau
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_source_type VARCHAR,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_old_total_xp INTEGER;
  v_new_total_xp INTEGER;
  v_old_level_rank INTEGER;
  v_new_level_rank INTEGER;
  v_new_level_id UUID;
  v_new_level_name VARCHAR;
  v_current_level_xp INTEGER;
  v_leveled_up BOOLEAN := false;
  v_old_level_name VARCHAR;
  v_result JSONB;
BEGIN
  -- Récupérer l'état actuel
  SELECT total_xp, current_level_rank
  INTO v_old_total_xp, v_old_level_rank
  FROM user_levels
  WHERE user_id = p_user_id;

  -- Si l'utilisateur n'a pas d'enregistrement, l'initialiser
  IF v_old_total_xp IS NULL THEN
    PERFORM initialize_user_level_for_user(p_user_id);
    v_old_total_xp := 0;
    v_old_level_rank := 1;
  END IF;

  -- Calculer le nouveau total XP
  v_new_total_xp := v_old_total_xp + p_xp_amount;

  -- Enregistrer la transaction XP
  INSERT INTO xp_transactions (user_id, xp_amount, source_type, source_id, description)
  VALUES (p_user_id, p_xp_amount, p_source_type, p_source_id, p_description);

  -- Calculer le nouveau niveau
  SELECT * INTO v_new_level_id, v_new_level_rank, v_new_level_name, v_current_level_xp
  FROM calculate_level_from_xp(v_new_total_xp);

  -- Vérifier s'il y a eu montée de niveau
  IF v_new_level_rank > v_old_level_rank THEN
    v_leveled_up := true;

    -- Récupérer le nom de l'ancien niveau
    SELECT level_name INTO v_old_level_name
    FROM level_definitions
    WHERE level_rank = v_old_level_rank;

    -- Créer une notification de level up
    INSERT INTO level_up_notifications (
      user_id,
      from_level_rank,
      to_level_rank,
      from_level_name,
      to_level_name
    )
    VALUES (
      p_user_id,
      v_old_level_rank,
      v_new_level_rank,
      v_old_level_name,
      v_new_level_name
    );
  END IF;

  -- Mettre à jour user_levels
  UPDATE user_levels
  SET
    total_xp = v_new_total_xp,
    current_level_id = v_new_level_id,
    current_level_rank = v_new_level_rank,
    current_level_xp = v_current_level_xp,
    total_level_ups = CASE WHEN v_leveled_up THEN total_level_ups + 1 ELSE total_level_ups END,
    last_xp_gain_at = NOW(),
    last_level_up_at = CASE WHEN v_leveled_up THEN NOW() ELSE last_level_up_at END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Construire le résultat
  v_result := jsonb_build_object(
    'success', true,
    'xp_awarded', p_xp_amount,
    'total_xp', v_new_total_xp,
    'current_level_rank', v_new_level_rank,
    'current_level_name', v_new_level_name,
    'leveled_up', v_leveled_up,
    'old_level_rank', v_old_level_rank,
    'new_level_rank', v_new_level_rank
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour initialiser un utilisateur spécifique
CREATE OR REPLACE FUNCTION initialize_user_level_for_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_default_level_id UUID;
BEGIN
  SELECT id INTO v_default_level_id
  FROM level_definitions
  WHERE level_rank = 1
  LIMIT 1;

  INSERT INTO user_levels (user_id, current_level_id, current_level_rank, total_xp, current_level_xp)
  VALUES (p_user_id, v_default_level_id, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si les prérequis d'une compétence sont remplis
CREATE OR REPLACE FUNCTION check_skill_prerequisites(p_user_id UUID, p_skill_node_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_prerequisites UUID[];
  v_min_level_required INTEGER;
  v_xp_required INTEGER;
  v_user_level_rank INTEGER;
  v_user_total_xp INTEGER;
  v_completed_count INTEGER;
  v_required_count INTEGER;
BEGIN
  -- Récupérer les prérequis de la compétence
  SELECT prerequisites, min_level_required, xp_required
  INTO v_prerequisites, v_min_level_required, v_xp_required
  FROM skill_nodes
  WHERE id = p_skill_node_id;

  -- Récupérer le niveau et l'XP de l'utilisateur
  SELECT current_level_rank, total_xp
  INTO v_user_level_rank, v_user_total_xp
  FROM user_levels
  WHERE user_id = p_user_id;

  -- Vérifier le niveau minimum
  IF v_user_level_rank < v_min_level_required THEN
    RETURN false;
  END IF;

  -- Vérifier l'XP minimum
  IF v_user_total_xp < v_xp_required THEN
    RETURN false;
  END IF;

  -- Vérifier les compétences prérequises
  IF v_prerequisites IS NOT NULL AND array_length(v_prerequisites, 1) > 0 THEN
    v_required_count := array_length(v_prerequisites, 1);

    SELECT COUNT(*)
    INTO v_completed_count
    FROM user_skill_progress
    WHERE user_id = p_user_id
      AND skill_node_id = ANY(v_prerequisites)
      AND status IN ('completed', 'mastered');

    IF v_completed_count < v_required_count THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour déverrouiller une compétence
CREATE OR REPLACE FUNCTION unlock_skill(
  p_user_id UUID,
  p_skill_node_id UUID,
  p_unlock_source VARCHAR DEFAULT 'manual'
)
RETURNS JSONB AS $$
DECLARE
  v_prerequisites_met BOOLEAN;
  v_result JSONB;
BEGIN
  -- Vérifier les prérequis
  v_prerequisites_met := check_skill_prerequisites(p_user_id, p_skill_node_id);

  IF NOT v_prerequisites_met THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Prerequisites not met'
    );
  END IF;

  -- Créer ou mettre à jour la progression
  INSERT INTO user_skill_progress (user_id, skill_node_id, status, unlocked_at)
  VALUES (p_user_id, p_skill_node_id, 'available', NOW())
  ON CONFLICT (user_id, skill_node_id)
  DO UPDATE SET
    status = CASE WHEN user_skill_progress.status = 'locked' THEN 'available'::VARCHAR ELSE user_skill_progress.status END,
    unlocked_at = CASE WHEN user_skill_progress.unlocked_at IS NULL THEN NOW() ELSE user_skill_progress.unlocked_at END,
    updated_at = NOW();

  -- Enregistrer dans le log
  INSERT INTO skill_unlocks_log (user_id, skill_node_id, unlock_source)
  VALUES (p_user_id, p_skill_node_id, p_unlock_source);

  RETURN jsonb_build_object(
    'success', true,
    'skill_node_id', p_skill_node_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour initialiser le niveau d'un nouvel utilisateur
CREATE TRIGGER trigger_initialize_user_level
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_level();

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER trigger_update_level_definitions_updated_at
  BEFORE UPDATE ON level_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_levels_updated_at
  BEFORE UPDATE ON user_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_skill_categories_updated_at
  BEFORE UPDATE ON skill_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_skill_nodes_updated_at
  BEFORE UPDATE ON skill_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_skill_progress_updated_at
  BEFORE UPDATE ON user_skill_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE level_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_unlocks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_up_notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour level_definitions (lecture publique, modification admin)
CREATE POLICY "Level definitions are viewable by everyone"
  ON level_definitions FOR SELECT
  USING (true);

CREATE POLICY "Level definitions are editable by admins only"
  ON level_definitions FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour user_levels
CREATE POLICY "Users can view their own level"
  ON user_levels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view other users' levels for leaderboard"
  ON user_levels FOR SELECT
  USING (true);

CREATE POLICY "System can manage user levels"
  ON user_levels FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- Policies pour xp_transactions
CREATE POLICY "Users can view their own XP transactions"
  ON xp_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create XP transactions"
  ON xp_transactions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- Policies pour skill_categories (lecture publique)
CREATE POLICY "Skill categories are viewable by everyone"
  ON skill_categories FOR SELECT
  USING (true);

CREATE POLICY "Skill categories are editable by admins only"
  ON skill_categories FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour skill_nodes (lecture publique)
CREATE POLICY "Skill nodes are viewable by everyone"
  ON skill_nodes FOR SELECT
  USING (active = true OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Skill nodes are editable by admins only"
  ON skill_nodes FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour user_skill_progress
CREATE POLICY "Users can view their own skill progress"
  ON user_skill_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill progress"
  ON user_skill_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage skill progress"
  ON user_skill_progress FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- Policies pour skill_unlocks_log
CREATE POLICY "Users can view their own unlock log"
  ON skill_unlocks_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create unlock logs"
  ON skill_unlocks_log FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- Policies pour level_up_notifications
CREATE POLICY "Users can view their own level up notifications"
  ON level_up_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON level_up_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create level up notifications"
  ON level_up_notifications FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE level_definitions IS 'Définitions des niveaux (Novice, Apprenti, Expert, Maître, Légende)';
COMMENT ON TABLE user_levels IS 'Niveau actuel et XP total de chaque utilisateur';
COMMENT ON TABLE xp_transactions IS 'Historique de tous les gains/pertes d''XP';
COMMENT ON TABLE skill_categories IS 'Catégories de compétences en prompt engineering';
COMMENT ON TABLE skill_nodes IS 'Nœuds de l''arbre de compétences avec prérequis';
COMMENT ON TABLE user_skill_progress IS 'Progression de chaque utilisateur dans l''arbre de compétences';
COMMENT ON TABLE skill_unlocks_log IS 'Journal des déverrouillages de compétences';
COMMENT ON TABLE level_up_notifications IS 'Notifications de montée de niveau pour affichage UI';

COMMENT ON FUNCTION award_xp IS 'Ajoute de l''XP à un utilisateur et gère automatiquement les montées de niveau';
COMMENT ON FUNCTION check_skill_prerequisites IS 'Vérifie si un utilisateur remplit les prérequis pour déverrouiller une compétence';
COMMENT ON FUNCTION unlock_skill IS 'Déverrouille une compétence pour un utilisateur après vérification des prérequis';


-- -----------------------------------------------------------
-- Migration: 028_skill_tree_levels.sql
-- -----------------------------------------------------------

-- Migration pour le système d'arbre de compétences et de progression de niveau
-- Version: 2.2.0
-- Date: 2026-02-22
-- Description: Tables pour l'arbre de compétences (skill tree), progression des utilisateurs, définitions de niveaux et système XP

-- ============================================
-- TABLE: level_definitions
-- Définitions des niveaux et leurs exigences XP
-- ============================================
CREATE TABLE IF NOT EXISTS level_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_rank INTEGER UNIQUE NOT NULL CHECK (level_rank > 0),
  level_name VARCHAR(50) UNIQUE NOT NULL,
  level_name_fr VARCHAR(50) NOT NULL,

  -- Exigences XP
  xp_required INTEGER NOT NULL CHECK (xp_required >= 0),
  xp_next_level INTEGER, -- NULL pour le niveau max

  -- Visuel
  icon_emoji VARCHAR(10),
  color_hex VARCHAR(7),
  badge_image_url TEXT,

  -- Récompenses
  rewards JSONB DEFAULT '{}', -- Badges, avatars, fonctionnalités débloquées

  -- Métadonnées
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_level_definitions_rank ON level_definitions(level_rank);
CREATE INDEX IF NOT EXISTS idx_level_definitions_xp ON level_definitions(xp_required);

-- Insertion des 5 niveaux par défaut
INSERT INTO level_definitions (level_rank, level_name, level_name_fr, xp_required, xp_next_level, icon_emoji, color_hex, description) VALUES
  (1, 'Novice', 'Novice', 0, 1000, '🌱', '#94A3B8', 'Débutant en prompt engineering. Apprend les bases.'),
  (2, 'Apprentice', 'Apprenti', 1000, 5000, '📚', '#60A5FA', 'Maîtrise les techniques fondamentales.'),
  (3, 'Expert', 'Expert', 5000, 15000, '⚡', '#F59E0B', 'Expert en prompt engineering. Utilise des techniques avancées.'),
  (4, 'Master', 'Maître', 15000, 50000, '🔥', '#EF4444', 'Maître du prompt engineering. Guide les autres.'),
  (5, 'Legend', 'Légende', 50000, NULL, '👑', '#8B5CF6', 'Légende vivante. Innovateur en prompt engineering.')
ON CONFLICT (level_rank) DO NOTHING;

-- ============================================
-- TABLE: user_levels
-- Niveau et XP actuels des utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS user_levels (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- Niveau actuel
  current_level_id UUID REFERENCES level_definitions(id) NOT NULL,
  current_level_rank INTEGER NOT NULL DEFAULT 1,

  -- XP
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  current_level_xp INTEGER NOT NULL DEFAULT 0 CHECK (current_level_xp >= 0),

  -- Statistiques
  total_level_ups INTEGER DEFAULT 0,

  -- Timestamps
  last_xp_gain_at TIMESTAMP WITH TIME ZONE,
  last_level_up_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_levels_user ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_rank ON user_levels(current_level_rank);
CREATE INDEX IF NOT EXISTS idx_user_levels_xp ON user_levels(total_xp DESC);

-- ============================================
-- TABLE: xp_transactions
-- Historique des gains/pertes d'XP
-- ============================================
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Transaction
  xp_amount INTEGER NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'challenge_complete', 'tournament_win', 'daily_streak', 'peer_review', 'team_challenge'
  source_id UUID, -- ID de la source (challenge_id, tournament_id, etc.)

  -- Contexte
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);

-- ============================================
-- TABLE: skill_categories
-- Catégories de compétences (prompt engineering)
-- ============================================
CREATE TABLE IF NOT EXISTS skill_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  name_fr VARCHAR(100) NOT NULL,

  -- Visuel
  icon_emoji VARCHAR(10),
  color_hex VARCHAR(7),

  -- Métadonnées
  description TEXT,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_skill_categories_order ON skill_categories(display_order);

-- Insertion des catégories par défaut
INSERT INTO skill_categories (name, name_fr, icon_emoji, color_hex, description, display_order) VALUES
  ('Foundations', 'Fondamentaux', '🎯', '#3B82F6', 'Techniques de base du prompt engineering', 1),
  ('Context Control', 'Contrôle du Contexte', '📝', '#10B981', 'Gestion et optimisation du contexte', 2),
  ('Output Shaping', 'Façonnage de Sortie', '🎨', '#F59E0B', 'Contrôle du format et style de sortie', 3),
  ('Advanced Techniques', 'Techniques Avancées', '⚡', '#8B5CF6', 'Techniques avancées et spécialisées', 4),
  ('Chain of Thought', 'Chaîne de Pensée', '🧠', '#EC4899', 'Raisonnement et réflexion structurés', 5),
  ('Few-Shot Learning', 'Apprentissage Few-Shot', '📚', '#06B6D4', 'Utilisation d\'exemples pour guider l\'IA', 6)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TABLE: skill_nodes
-- Nœuds de l'arbre de compétences
-- ============================================
CREATE TABLE IF NOT EXISTS skill_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES skill_categories(id) ON DELETE CASCADE NOT NULL,

  -- Identification
  skill_key VARCHAR(100) UNIQUE NOT NULL, -- 'clear_instructions', 'role_prompting', 'chain_of_thought'
  name VARCHAR(200) NOT NULL,
  name_fr VARCHAR(200) NOT NULL,

  -- Hiérarchie
  parent_node_id UUID REFERENCES skill_nodes(id) ON DELETE SET NULL,
  tree_level INTEGER NOT NULL DEFAULT 1 CHECK (tree_level > 0),
  display_order INTEGER DEFAULT 0,

  -- Prérequis
  prerequisites UUID[] DEFAULT '{}', -- IDs des skill_nodes requis
  min_level_required INTEGER DEFAULT 1,
  xp_required INTEGER DEFAULT 0,

  -- Contenu
  description TEXT NOT NULL,
  detailed_explanation TEXT,
  examples JSONB DEFAULT '[]',
  resources TEXT[] DEFAULT '{}',

  -- Déverrouillage
  unlock_type VARCHAR(20) DEFAULT 'automatic' CHECK (unlock_type IN ('automatic', 'challenge', 'manual')),
  unlock_challenge_id UUID, -- Pour unlock_type='challenge'

  -- Visuel
  icon_emoji VARCHAR(10),
  position_x FLOAT, -- Position dans la visualisation
  position_y FLOAT,

  -- Métadonnées
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_time INTEGER, -- Minutes pour maîtriser

  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_skill_nodes_category ON skill_nodes(category_id);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_parent ON skill_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_level ON skill_nodes(tree_level);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_key ON skill_nodes(skill_key);
CREATE INDEX IF NOT EXISTS idx_skill_nodes_active ON skill_nodes(active) WHERE active = true;

-- ============================================
-- TABLE: user_skill_progress
-- Progression des utilisateurs dans l'arbre de compétences
-- ============================================
CREATE TABLE IF NOT EXISTS user_skill_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_node_id UUID REFERENCES skill_nodes(id) ON DELETE CASCADE NOT NULL,

  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'completed', 'mastered')),

  -- Progression
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  practice_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,

  -- Timestamps
  unlocked_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  mastered_at TIMESTAMP WITH TIME ZONE,
  last_practiced_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unicité
  UNIQUE(user_id, skill_node_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_user ON user_skill_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_skill ON user_skill_progress(skill_node_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_status ON user_skill_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_completed ON user_skill_progress(completed_at DESC);

-- ============================================
-- TABLE: skill_unlocks_log
-- Journal des déverrouillages de compétences
-- ============================================
CREATE TABLE IF NOT EXISTS skill_unlocks_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  skill_node_id UUID REFERENCES skill_nodes(id) ON DELETE CASCADE NOT NULL,

  -- Contexte de déverrouillage
  unlock_source VARCHAR(50), -- 'level_up', 'challenge_complete', 'prerequisite_met'
  unlock_context JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_skill_unlocks_user ON skill_unlocks_log(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_unlocks_skill ON skill_unlocks_log(skill_node_id);
CREATE INDEX IF NOT EXISTS idx_skill_unlocks_created ON skill_unlocks_log(created_at DESC);

-- ============================================
-- TABLE: level_up_notifications
-- Notifications de montée de niveau
-- ============================================
CREATE TABLE IF NOT EXISTS level_up_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Niveau
  from_level_rank INTEGER NOT NULL,
  to_level_rank INTEGER NOT NULL,
  from_level_name VARCHAR(50),
  to_level_name VARCHAR(50),

  -- Récompenses
  rewards_unlocked JSONB DEFAULT '{}',
  skills_unlocked UUID[] DEFAULT '{}',

  -- Statut
  shown BOOLEAN DEFAULT false,
  shown_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_level_up_notifications_user ON level_up_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_level_up_notifications_unshown ON level_up_notifications(user_id, shown) WHERE shown = false;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour initialiser le niveau d'un nouvel utilisateur
CREATE OR REPLACE FUNCTION initialize_user_level()
RETURNS TRIGGER AS $$
DECLARE
  v_default_level_id UUID;
BEGIN
  -- Récupérer l'ID du niveau Novice (rank 1)
  SELECT id INTO v_default_level_id
  FROM level_definitions
  WHERE level_rank = 1
  LIMIT 1;

  -- Créer l'enregistrement user_levels
  INSERT INTO user_levels (user_id, current_level_id, current_level_rank, total_xp, current_level_xp)
  VALUES (NEW.id, v_default_level_id, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer le niveau basé sur l'XP total
CREATE OR REPLACE FUNCTION calculate_level_from_xp(p_total_xp INTEGER)
RETURNS TABLE(level_id UUID, level_rank INTEGER, level_name VARCHAR, current_level_xp INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ld.id,
    ld.level_rank,
    ld.level_name,
    p_total_xp - ld.xp_required AS current_level_xp
  FROM level_definitions ld
  WHERE ld.xp_required <= p_total_xp
  ORDER BY ld.level_rank DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour ajouter de l'XP et gérer les montées de niveau
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_source_type VARCHAR,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_old_total_xp INTEGER;
  v_new_total_xp INTEGER;
  v_old_level_rank INTEGER;
  v_new_level_rank INTEGER;
  v_new_level_id UUID;
  v_new_level_name VARCHAR;
  v_current_level_xp INTEGER;
  v_leveled_up BOOLEAN := false;
  v_old_level_name VARCHAR;
  v_result JSONB;
BEGIN
  -- Récupérer l'état actuel
  SELECT total_xp, current_level_rank
  INTO v_old_total_xp, v_old_level_rank
  FROM user_levels
  WHERE user_id = p_user_id;

  -- Si l'utilisateur n'a pas d'enregistrement, l'initialiser
  IF v_old_total_xp IS NULL THEN
    PERFORM initialize_user_level_for_user(p_user_id);
    v_old_total_xp := 0;
    v_old_level_rank := 1;
  END IF;

  -- Calculer le nouveau total XP
  v_new_total_xp := v_old_total_xp + p_xp_amount;

  -- Enregistrer la transaction XP
  INSERT INTO xp_transactions (user_id, xp_amount, source_type, source_id, description)
  VALUES (p_user_id, p_xp_amount, p_source_type, p_source_id, p_description);

  -- Calculer le nouveau niveau
  SELECT * INTO v_new_level_id, v_new_level_rank, v_new_level_name, v_current_level_xp
  FROM calculate_level_from_xp(v_new_total_xp);

  -- Vérifier s'il y a eu montée de niveau
  IF v_new_level_rank > v_old_level_rank THEN
    v_leveled_up := true;

    -- Récupérer le nom de l'ancien niveau
    SELECT level_name INTO v_old_level_name
    FROM level_definitions
    WHERE level_rank = v_old_level_rank;

    -- Créer une notification de level up
    INSERT INTO level_up_notifications (
      user_id,
      from_level_rank,
      to_level_rank,
      from_level_name,
      to_level_name
    )
    VALUES (
      p_user_id,
      v_old_level_rank,
      v_new_level_rank,
      v_old_level_name,
      v_new_level_name
    );
  END IF;

  -- Mettre à jour user_levels
  UPDATE user_levels
  SET
    total_xp = v_new_total_xp,
    current_level_id = v_new_level_id,
    current_level_rank = v_new_level_rank,
    current_level_xp = v_current_level_xp,
    total_level_ups = CASE WHEN v_leveled_up THEN total_level_ups + 1 ELSE total_level_ups END,
    last_xp_gain_at = NOW(),
    last_level_up_at = CASE WHEN v_leveled_up THEN NOW() ELSE last_level_up_at END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Construire le résultat
  v_result := jsonb_build_object(
    'success', true,
    'xp_awarded', p_xp_amount,
    'total_xp', v_new_total_xp,
    'current_level_rank', v_new_level_rank,
    'current_level_name', v_new_level_name,
    'leveled_up', v_leveled_up,
    'old_level_rank', v_old_level_rank,
    'new_level_rank', v_new_level_rank
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction helper pour initialiser un utilisateur spécifique
CREATE OR REPLACE FUNCTION initialize_user_level_for_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_default_level_id UUID;
BEGIN
  SELECT id INTO v_default_level_id
  FROM level_definitions
  WHERE level_rank = 1
  LIMIT 1;

  INSERT INTO user_levels (user_id, current_level_id, current_level_rank, total_xp, current_level_xp)
  VALUES (p_user_id, v_default_level_id, 1, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si les prérequis d'une compétence sont remplis
CREATE OR REPLACE FUNCTION check_skill_prerequisites(p_user_id UUID, p_skill_node_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_prerequisites UUID[];
  v_min_level_required INTEGER;
  v_xp_required INTEGER;
  v_user_level_rank INTEGER;
  v_user_total_xp INTEGER;
  v_completed_count INTEGER;
  v_required_count INTEGER;
BEGIN
  -- Récupérer les prérequis de la compétence
  SELECT prerequisites, min_level_required, xp_required
  INTO v_prerequisites, v_min_level_required, v_xp_required
  FROM skill_nodes
  WHERE id = p_skill_node_id;

  -- Récupérer le niveau et l'XP de l'utilisateur
  SELECT current_level_rank, total_xp
  INTO v_user_level_rank, v_user_total_xp
  FROM user_levels
  WHERE user_id = p_user_id;

  -- Vérifier le niveau minimum
  IF v_user_level_rank < v_min_level_required THEN
    RETURN false;
  END IF;

  -- Vérifier l'XP minimum
  IF v_user_total_xp < v_xp_required THEN
    RETURN false;
  END IF;

  -- Vérifier les compétences prérequises
  IF v_prerequisites IS NOT NULL AND array_length(v_prerequisites, 1) > 0 THEN
    v_required_count := array_length(v_prerequisites, 1);

    SELECT COUNT(*)
    INTO v_completed_count
    FROM user_skill_progress
    WHERE user_id = p_user_id
      AND skill_node_id = ANY(v_prerequisites)
      AND status IN ('completed', 'mastered');

    IF v_completed_count < v_required_count THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour déverrouiller une compétence
CREATE OR REPLACE FUNCTION unlock_skill(
  p_user_id UUID,
  p_skill_node_id UUID,
  p_unlock_source VARCHAR DEFAULT 'manual'
)
RETURNS JSONB AS $$
DECLARE
  v_prerequisites_met BOOLEAN;
  v_result JSONB;
BEGIN
  -- Vérifier les prérequis
  v_prerequisites_met := check_skill_prerequisites(p_user_id, p_skill_node_id);

  IF NOT v_prerequisites_met THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Prerequisites not met'
    );
  END IF;

  -- Créer ou mettre à jour la progression
  INSERT INTO user_skill_progress (user_id, skill_node_id, status, unlocked_at)
  VALUES (p_user_id, p_skill_node_id, 'available', NOW())
  ON CONFLICT (user_id, skill_node_id)
  DO UPDATE SET
    status = CASE WHEN user_skill_progress.status = 'locked' THEN 'available'::VARCHAR ELSE user_skill_progress.status END,
    unlocked_at = CASE WHEN user_skill_progress.unlocked_at IS NULL THEN NOW() ELSE user_skill_progress.unlocked_at END,
    updated_at = NOW();

  -- Enregistrer dans le log
  INSERT INTO skill_unlocks_log (user_id, skill_node_id, unlock_source)
  VALUES (p_user_id, p_skill_node_id, p_unlock_source);

  RETURN jsonb_build_object(
    'success', true,
    'skill_node_id', p_skill_node_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour initialiser le niveau d'un nouvel utilisateur
CREATE TRIGGER trigger_initialize_user_level
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_level();

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER trigger_update_level_definitions_updated_at
  BEFORE UPDATE ON level_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_levels_updated_at
  BEFORE UPDATE ON user_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_skill_categories_updated_at
  BEFORE UPDATE ON skill_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_skill_nodes_updated_at
  BEFORE UPDATE ON skill_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_skill_progress_updated_at
  BEFORE UPDATE ON user_skill_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE level_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_unlocks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_up_notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour level_definitions (lecture publique, modification admin)
CREATE POLICY "Level definitions are viewable by everyone"
  ON level_definitions FOR SELECT
  USING (true);

CREATE POLICY "Level definitions are editable by admins only"
  ON level_definitions FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour user_levels
CREATE POLICY "Users can view their own level"
  ON user_levels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view other users' levels for leaderboard"
  ON user_levels FOR SELECT
  USING (true);

CREATE POLICY "System can manage user levels"
  ON user_levels FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- Policies pour xp_transactions
CREATE POLICY "Users can view their own XP transactions"
  ON xp_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create XP transactions"
  ON xp_transactions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- Policies pour skill_categories (lecture publique)
CREATE POLICY "Skill categories are viewable by everyone"
  ON skill_categories FOR SELECT
  USING (true);

CREATE POLICY "Skill categories are editable by admins only"
  ON skill_categories FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour skill_nodes (lecture publique)
CREATE POLICY "Skill nodes are viewable by everyone"
  ON skill_nodes FOR SELECT
  USING (active = true OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Skill nodes are editable by admins only"
  ON skill_nodes FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policies pour user_skill_progress
CREATE POLICY "Users can view their own skill progress"
  ON user_skill_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill progress"
  ON user_skill_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage skill progress"
  ON user_skill_progress FOR ALL
  USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- Policies pour skill_unlocks_log
CREATE POLICY "Users can view their own unlock log"
  ON skill_unlocks_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create unlock logs"
  ON skill_unlocks_log FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- Policies pour level_up_notifications
CREATE POLICY "Users can view their own level up notifications"
  ON level_up_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON level_up_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create level up notifications"
  ON level_up_notifications FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE level_definitions IS 'Définitions des niveaux (Novice, Apprenti, Expert, Maître, Légende)';
COMMENT ON TABLE user_levels IS 'Niveau actuel et XP total de chaque utilisateur';
COMMENT ON TABLE xp_transactions IS 'Historique de tous les gains/pertes d''XP';
COMMENT ON TABLE skill_categories IS 'Catégories de compétences en prompt engineering';
COMMENT ON TABLE skill_nodes IS 'Nœuds de l''arbre de compétences avec prérequis';
COMMENT ON TABLE user_skill_progress IS 'Progression de chaque utilisateur dans l''arbre de compétences';
COMMENT ON TABLE skill_unlocks_log IS 'Journal des déverrouillages de compétences';
COMMENT ON TABLE level_up_notifications IS 'Notifications de montée de niveau pour affichage UI';

COMMENT ON FUNCTION award_xp IS 'Ajoute de l''XP à un utilisateur et gère automatiquement les montées de niveau';
COMMENT ON FUNCTION check_skill_prerequisites IS 'Vérifie si un utilisateur remplit les prérequis pour déverrouiller une compétence';
COMMENT ON FUNCTION unlock_skill IS 'Déverrouille une compétence pour un utilisateur après vérification des prérequis';


-- -----------------------------------------------------------
-- Migration: 029_seasonal_leaderboards.sql
-- -----------------------------------------------------------

-- Migration pour le système de classements saisonniers
-- Version: 2.3.0
-- Date: 2026-02-22
-- Description: Tables pour les classements mensuels/trimestriels, entrées et archives historiques

-- ============================================
-- TABLE: seasons
-- Définitions des saisons (mensuelles/trimestrielles)
-- ============================================
CREATE TABLE IF NOT EXISTS seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_name VARCHAR(100) NOT NULL,
  season_type VARCHAR(20) NOT NULL CHECK (season_type IN ('monthly', 'quarterly')),

  -- Période
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'archived')),

  -- Métadonnées
  total_participants INTEGER DEFAULT 0,
  total_entries INTEGER DEFAULT 0,
  archived_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte: une saison ne peut pas avoir de dates qui se chevauchent pour le même type
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT unique_season_period UNIQUE (season_type, start_date, end_date)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_seasons_type ON seasons(season_type);
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(status) WHERE status = 'active';

-- ============================================
-- TABLE: seasonal_leaderboard_entries
-- Entrées de classement pour chaque saison
-- ============================================
CREATE TABLE IF NOT EXISTS seasonal_leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Scores
  total_score INTEGER DEFAULT 0 NOT NULL,
  challenges_completed INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  skill_nodes_unlocked INTEGER DEFAULT 0,

  -- Classement
  rank INTEGER,
  previous_rank INTEGER,

  -- Métadonnées
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un utilisateur ne peut avoir qu'une entrée par saison
  UNIQUE(season_id, user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_season ON seasonal_leaderboard_entries(season_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user ON seasonal_leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON seasonal_leaderboard_entries(season_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_score ON seasonal_leaderboard_entries(season_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_activity ON seasonal_leaderboard_entries(last_activity_at);

-- ============================================
-- TABLE: seasonal_leaderboard_archives
-- Archives historiques des classements
-- ============================================
CREATE TABLE IF NOT EXISTS seasonal_leaderboard_archives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Snapshot des données finales
  final_rank INTEGER NOT NULL,
  final_score INTEGER NOT NULL,
  challenges_completed INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  skill_nodes_unlocked INTEGER DEFAULT 0,

  -- Récompenses
  rewards_claimed BOOLEAN DEFAULT false,
  reward_data JSONB,

  -- Période de la saison (dénormalisé pour requêtes rapides)
  season_start_date DATE NOT NULL,
  season_end_date DATE NOT NULL,
  season_type VARCHAR(20) NOT NULL,
  season_name VARCHAR(100) NOT NULL,

  -- Timestamps
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(season_id, user_id)
);

-- Index pour performances et requêtes historiques
CREATE INDEX IF NOT EXISTS idx_archives_season ON seasonal_leaderboard_archives(season_id);
CREATE INDEX IF NOT EXISTS idx_archives_user ON seasonal_leaderboard_archives(user_id);
CREATE INDEX IF NOT EXISTS idx_archives_rank ON seasonal_leaderboard_archives(final_rank);
CREATE INDEX IF NOT EXISTS idx_archives_date_range ON seasonal_leaderboard_archives(season_start_date, season_end_date);
CREATE INDEX IF NOT EXISTS idx_archives_type_date ON seasonal_leaderboard_archives(season_type, season_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_archives_rewards ON seasonal_leaderboard_archives(rewards_claimed) WHERE rewards_claimed = false;

-- ============================================
-- TABLE: team_seasonal_leaderboard_entries
-- Classement saisonnier pour les équipes
-- ============================================
CREATE TABLE IF NOT EXISTS team_seasonal_leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,

  -- Scores d'équipe
  total_score INTEGER DEFAULT 0 NOT NULL,
  team_challenges_completed INTEGER DEFAULT 0,
  tournaments_participated INTEGER DEFAULT 0,
  average_member_xp INTEGER DEFAULT 0,

  -- Classement
  rank INTEGER,
  previous_rank INTEGER,

  -- Métadonnées
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(season_id, team_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_season ON team_seasonal_leaderboard_entries(season_id);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_team ON team_seasonal_leaderboard_entries(team_id);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_rank ON team_seasonal_leaderboard_entries(season_id, rank);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_score ON team_seasonal_leaderboard_entries(season_id, total_score DESC);

-- ============================================
-- TABLE: seasonal_rewards
-- Définitions des récompenses par saison
-- ============================================
CREATE TABLE IF NOT EXISTS seasonal_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,

  -- Critères
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('top_rank', 'participation', 'milestone', 'team_achievement')),
  min_rank INTEGER,
  max_rank INTEGER,
  required_score INTEGER,

  -- Récompense
  reward_name VARCHAR(200) NOT NULL,
  reward_description TEXT,
  reward_data JSONB, -- XP bonus, badges, avatars, etc.

  -- Métadonnées
  icon_emoji VARCHAR(10),
  rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_rewards_season ON seasonal_rewards(season_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON seasonal_rewards(reward_type);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour créer automatiquement les saisons
CREATE OR REPLACE FUNCTION generate_seasons(
  p_season_type VARCHAR,
  p_start_year INTEGER,
  p_count INTEGER DEFAULT 12
)
RETURNS INTEGER AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_season_name VARCHAR(100);
  v_created_count INTEGER := 0;
  i INTEGER;
BEGIN
  FOR i IN 0..p_count-1 LOOP
    IF p_season_type = 'monthly' THEN
      v_start_date := DATE(p_start_year || '-01-01') + (i || ' months')::INTERVAL;
      v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
      v_season_name := TO_CHAR(v_start_date, 'Month YYYY');
    ELSIF p_season_type = 'quarterly' THEN
      v_start_date := DATE(p_start_year || '-01-01') + (i * 3 || ' months')::INTERVAL;
      v_end_date := v_start_date + INTERVAL '3 months' - INTERVAL '1 day';
      v_season_name := 'Q' || CEIL((EXTRACT(MONTH FROM v_start_date)::INTEGER) / 3.0) || ' ' || EXTRACT(YEAR FROM v_start_date);
    ELSE
      RAISE EXCEPTION 'Invalid season type: %', p_season_type;
    END IF;

    INSERT INTO seasons (season_name, season_type, start_date, end_date, status)
    VALUES (
      v_season_name,
      p_season_type,
      v_start_date,
      v_end_date,
      CASE
        WHEN v_start_date > CURRENT_DATE THEN 'upcoming'
        WHEN v_start_date <= CURRENT_DATE AND v_end_date >= CURRENT_DATE THEN 'active'
        ELSE 'completed'
      END
    )
    ON CONFLICT (season_type, start_date, end_date) DO NOTHING;

    v_created_count := v_created_count + 1;
  END LOOP;

  RETURN v_created_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le classement d'une saison
CREATE OR REPLACE FUNCTION update_seasonal_leaderboard_ranks(p_season_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Sauvegarder les rangs actuels comme previous_rank
  UPDATE seasonal_leaderboard_entries
  SET previous_rank = rank
  WHERE season_id = p_season_id;

  -- Recalculer les rangs basés sur le score
  WITH ranked_entries AS (
    SELECT
      id,
      RANK() OVER (ORDER BY total_score DESC, last_activity_at ASC) as new_rank
    FROM seasonal_leaderboard_entries
    WHERE season_id = p_season_id
  )
  UPDATE seasonal_leaderboard_entries sle
  SET
    rank = re.new_rank,
    updated_at = NOW()
  FROM ranked_entries re
  WHERE sle.id = re.id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour archiver une saison terminée
CREATE OR REPLACE FUNCTION archive_season(p_season_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_season RECORD;
  v_archived_count INTEGER := 0;
BEGIN
  -- Vérifier que la saison existe et est terminée
  SELECT * INTO v_season
  FROM seasons
  WHERE id = p_season_id
    AND end_date < CURRENT_DATE
    AND status = 'completed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Season not found or not ready for archiving';
  END IF;

  -- Archiver les entrées du leaderboard
  INSERT INTO seasonal_leaderboard_archives (
    season_id,
    user_id,
    final_rank,
    final_score,
    challenges_completed,
    tournaments_won,
    xp_earned,
    skill_nodes_unlocked,
    season_start_date,
    season_end_date,
    season_type,
    season_name
  )
  SELECT
    sle.season_id,
    sle.user_id,
    sle.rank,
    sle.total_score,
    sle.challenges_completed,
    sle.tournaments_won,
    sle.xp_earned,
    sle.skill_nodes_unlocked,
    v_season.start_date,
    v_season.end_date,
    v_season.season_type,
    v_season.season_name
  FROM seasonal_leaderboard_entries sle
  WHERE sle.season_id = p_season_id
  ON CONFLICT (season_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_archived_count = ROW_COUNT;

  -- Mettre à jour le statut de la saison
  UPDATE seasons
  SET
    status = 'archived',
    archived_at = NOW(),
    updated_at = NOW()
  WHERE id = p_season_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir la saison active
CREATE OR REPLACE FUNCTION get_active_season(p_season_type VARCHAR)
RETURNS UUID AS $$
DECLARE
  v_season_id UUID;
BEGIN
  SELECT id INTO v_season_id
  FROM seasons
  WHERE season_type = p_season_type
    AND status = 'active'
    AND start_date <= CURRENT_DATE
    AND end_date >= CURRENT_DATE
  ORDER BY start_date DESC
  LIMIT 1;

  RETURN v_season_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le score d'un utilisateur dans la saison active
CREATE OR REPLACE FUNCTION update_user_seasonal_score(
  p_user_id UUID,
  p_score_increment INTEGER DEFAULT 0,
  p_challenges_increment INTEGER DEFAULT 0,
  p_tournaments_increment INTEGER DEFAULT 0,
  p_xp_increment INTEGER DEFAULT 0,
  p_skills_increment INTEGER DEFAULT 0
)
RETURNS BOOLEAN AS $$
DECLARE
  v_monthly_season_id UUID;
  v_quarterly_season_id UUID;
BEGIN
  -- Obtenir les saisons actives
  v_monthly_season_id := get_active_season('monthly');
  v_quarterly_season_id := get_active_season('quarterly');

  -- Mettre à jour la saison mensuelle
  IF v_monthly_season_id IS NOT NULL THEN
    INSERT INTO seasonal_leaderboard_entries (
      season_id,
      user_id,
      total_score,
      challenges_completed,
      tournaments_won,
      xp_earned,
      skill_nodes_unlocked
    ) VALUES (
      v_monthly_season_id,
      p_user_id,
      p_score_increment,
      p_challenges_increment,
      p_tournaments_increment,
      p_xp_increment,
      p_skills_increment
    )
    ON CONFLICT (season_id, user_id)
    DO UPDATE SET
      total_score = seasonal_leaderboard_entries.total_score + p_score_increment,
      challenges_completed = seasonal_leaderboard_entries.challenges_completed + p_challenges_increment,
      tournaments_won = seasonal_leaderboard_entries.tournaments_won + p_tournaments_increment,
      xp_earned = seasonal_leaderboard_entries.xp_earned + p_xp_increment,
      skill_nodes_unlocked = seasonal_leaderboard_entries.skill_nodes_unlocked + p_skills_increment,
      last_activity_at = NOW(),
      updated_at = NOW();
  END IF;

  -- Mettre à jour la saison trimestrielle
  IF v_quarterly_season_id IS NOT NULL THEN
    INSERT INTO seasonal_leaderboard_entries (
      season_id,
      user_id,
      total_score,
      challenges_completed,
      tournaments_won,
      xp_earned,
      skill_nodes_unlocked
    ) VALUES (
      v_quarterly_season_id,
      p_user_id,
      p_score_increment,
      p_challenges_increment,
      p_tournaments_increment,
      p_xp_increment,
      p_skills_increment
    )
    ON CONFLICT (season_id, user_id)
    DO UPDATE SET
      total_score = seasonal_leaderboard_entries.total_score + p_score_increment,
      challenges_completed = seasonal_leaderboard_entries.challenges_completed + p_challenges_increment,
      tournaments_won = seasonal_leaderboard_entries.tournaments_won + p_tournaments_increment,
      xp_earned = seasonal_leaderboard_entries.xp_earned + p_xp_increment,
      skill_nodes_unlocked = seasonal_leaderboard_entries.skill_nodes_unlocked + p_skills_increment,
      last_activity_at = NOW(),
      updated_at = NOW();
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le nombre de participants
CREATE OR REPLACE FUNCTION update_season_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE seasons
  SET
    total_participants = (
      SELECT COUNT(DISTINCT user_id)
      FROM seasonal_leaderboard_entries
      WHERE season_id = NEW.season_id
    ),
    total_entries = (
      SELECT COUNT(*)
      FROM seasonal_leaderboard_entries
      WHERE season_id = NEW.season_id
    ),
    updated_at = NOW()
  WHERE id = NEW.season_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour mettre à jour les timestamps
CREATE TRIGGER trigger_update_season_timestamp
  BEFORE UPDATE ON seasons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_leaderboard_entry_timestamp
  BEFORE UPDATE ON seasonal_leaderboard_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour le nombre de participants
CREATE TRIGGER trigger_update_participant_count
  AFTER INSERT OR DELETE ON seasonal_leaderboard_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_season_participant_count();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Seasons (lecture pour tous)
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons" ON seasons
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage seasons" ON seasons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Seasonal Leaderboard Entries (lecture pour tous)
ALTER TABLE seasonal_leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard entries" ON seasonal_leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own entries" ON seasonal_leaderboard_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update entries" ON seasonal_leaderboard_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can modify entries" ON seasonal_leaderboard_entries
  FOR UPDATE USING (true);

-- Archives (lecture pour tous)
ALTER TABLE seasonal_leaderboard_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view archives" ON seasonal_leaderboard_archives
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage archives" ON seasonal_leaderboard_archives
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Team Seasonal Leaderboard
ALTER TABLE team_seasonal_leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team leaderboard" ON team_seasonal_leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "System can update team entries" ON team_seasonal_leaderboard_entries
  FOR ALL USING (true);

-- Seasonal Rewards
ALTER TABLE seasonal_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rewards" ON seasonal_rewards
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage rewards" ON seasonal_rewards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- SEED DATA - Générer les saisons pour 2026
-- ============================================

-- Générer les saisons mensuelles pour 2026
SELECT generate_seasons('monthly', 2026, 12);

-- Générer les saisons trimestrielles pour 2026
SELECT generate_seasons('quarterly', 2026, 4);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE seasons IS 'Définitions des saisons mensuelles et trimestrielles';
COMMENT ON TABLE seasonal_leaderboard_entries IS 'Entrées de classement actives pour chaque saison';
COMMENT ON TABLE seasonal_leaderboard_archives IS 'Archives historiques des classements complétés';
COMMENT ON TABLE team_seasonal_leaderboard_entries IS 'Classement saisonnier pour les équipes';
COMMENT ON TABLE seasonal_rewards IS 'Récompenses disponibles par saison';

COMMENT ON FUNCTION generate_seasons IS 'Génère automatiquement les saisons mensuelles ou trimestrielles';
COMMENT ON FUNCTION update_seasonal_leaderboard_ranks IS 'Recalcule les rangs pour une saison donnée';
COMMENT ON FUNCTION archive_season IS 'Archive une saison terminée dans la table d''archives';
COMMENT ON FUNCTION get_active_season IS 'Retourne l''ID de la saison active pour un type donné';
COMMENT ON FUNCTION update_user_seasonal_score IS 'Met à jour le score d''un utilisateur dans les saisons actives';

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 029_seasonal_leaderboards.sql
-- -----------------------------------------------------------

-- Migration pour le système de classements saisonniers
-- Version: 2.3.0
-- Date: 2026-02-22
-- Description: Tables pour les classements mensuels/trimestriels, entrées et archives historiques

-- ============================================
-- TABLE: seasons
-- Définitions des saisons (mensuelles/trimestrielles)
-- ============================================
CREATE TABLE IF NOT EXISTS seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_name VARCHAR(100) NOT NULL,
  season_type VARCHAR(20) NOT NULL CHECK (season_type IN ('monthly', 'quarterly')),

  -- Période
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Statut
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'archived')),

  -- Métadonnées
  total_participants INTEGER DEFAULT 0,
  total_entries INTEGER DEFAULT 0,
  archived_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte: une saison ne peut pas avoir de dates qui se chevauchent pour le même type
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT unique_season_period UNIQUE (season_type, start_date, end_date)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_seasons_type ON seasons(season_type);
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(status) WHERE status = 'active';

-- ============================================
-- TABLE: seasonal_leaderboard_entries
-- Entrées de classement pour chaque saison
-- ============================================
CREATE TABLE IF NOT EXISTS seasonal_leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Scores
  total_score INTEGER DEFAULT 0 NOT NULL,
  challenges_completed INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  skill_nodes_unlocked INTEGER DEFAULT 0,

  -- Classement
  rank INTEGER,
  previous_rank INTEGER,

  -- Métadonnées
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un utilisateur ne peut avoir qu'une entrée par saison
  UNIQUE(season_id, user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_season ON seasonal_leaderboard_entries(season_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user ON seasonal_leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_rank ON seasonal_leaderboard_entries(season_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_score ON seasonal_leaderboard_entries(season_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_activity ON seasonal_leaderboard_entries(last_activity_at);

-- ============================================
-- TABLE: seasonal_leaderboard_archives
-- Archives historiques des classements
-- ============================================
CREATE TABLE IF NOT EXISTS seasonal_leaderboard_archives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Snapshot des données finales
  final_rank INTEGER NOT NULL,
  final_score INTEGER NOT NULL,
  challenges_completed INTEGER DEFAULT 0,
  tournaments_won INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  skill_nodes_unlocked INTEGER DEFAULT 0,

  -- Récompenses
  rewards_claimed BOOLEAN DEFAULT false,
  reward_data JSONB,

  -- Période de la saison (dénormalisé pour requêtes rapides)
  season_start_date DATE NOT NULL,
  season_end_date DATE NOT NULL,
  season_type VARCHAR(20) NOT NULL,
  season_name VARCHAR(100) NOT NULL,

  -- Timestamps
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(season_id, user_id)
);

-- Index pour performances et requêtes historiques
CREATE INDEX IF NOT EXISTS idx_archives_season ON seasonal_leaderboard_archives(season_id);
CREATE INDEX IF NOT EXISTS idx_archives_user ON seasonal_leaderboard_archives(user_id);
CREATE INDEX IF NOT EXISTS idx_archives_rank ON seasonal_leaderboard_archives(final_rank);
CREATE INDEX IF NOT EXISTS idx_archives_date_range ON seasonal_leaderboard_archives(season_start_date, season_end_date);
CREATE INDEX IF NOT EXISTS idx_archives_type_date ON seasonal_leaderboard_archives(season_type, season_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_archives_rewards ON seasonal_leaderboard_archives(rewards_claimed) WHERE rewards_claimed = false;

-- ============================================
-- TABLE: team_seasonal_leaderboard_entries
-- Classement saisonnier pour les équipes
-- ============================================
CREATE TABLE IF NOT EXISTS team_seasonal_leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,

  -- Scores d'équipe
  total_score INTEGER DEFAULT 0 NOT NULL,
  team_challenges_completed INTEGER DEFAULT 0,
  tournaments_participated INTEGER DEFAULT 0,
  average_member_xp INTEGER DEFAULT 0,

  -- Classement
  rank INTEGER,
  previous_rank INTEGER,

  -- Métadonnées
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(season_id, team_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_season ON team_seasonal_leaderboard_entries(season_id);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_team ON team_seasonal_leaderboard_entries(team_id);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_rank ON team_seasonal_leaderboard_entries(season_id, rank);
CREATE INDEX IF NOT EXISTS idx_team_leaderboard_score ON team_seasonal_leaderboard_entries(season_id, total_score DESC);

-- ============================================
-- TABLE: seasonal_rewards
-- Définitions des récompenses par saison
-- ============================================
CREATE TABLE IF NOT EXISTS seasonal_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,

  -- Critères
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('top_rank', 'participation', 'milestone', 'team_achievement')),
  min_rank INTEGER,
  max_rank INTEGER,
  required_score INTEGER,

  -- Récompense
  reward_name VARCHAR(200) NOT NULL,
  reward_description TEXT,
  reward_data JSONB, -- XP bonus, badges, avatars, etc.

  -- Métadonnées
  icon_emoji VARCHAR(10),
  rarity VARCHAR(20) CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_rewards_season ON seasonal_rewards(season_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON seasonal_rewards(reward_type);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour créer automatiquement les saisons
CREATE OR REPLACE FUNCTION generate_seasons(
  p_season_type VARCHAR,
  p_start_year INTEGER,
  p_count INTEGER DEFAULT 12
)
RETURNS INTEGER AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_season_name VARCHAR(100);
  v_created_count INTEGER := 0;
  i INTEGER;
BEGIN
  FOR i IN 0..p_count-1 LOOP
    IF p_season_type = 'monthly' THEN
      v_start_date := DATE(p_start_year || '-01-01') + (i || ' months')::INTERVAL;
      v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
      v_season_name := TO_CHAR(v_start_date, 'Month YYYY');
    ELSIF p_season_type = 'quarterly' THEN
      v_start_date := DATE(p_start_year || '-01-01') + (i * 3 || ' months')::INTERVAL;
      v_end_date := v_start_date + INTERVAL '3 months' - INTERVAL '1 day';
      v_season_name := 'Q' || CEIL((EXTRACT(MONTH FROM v_start_date)::INTEGER) / 3.0) || ' ' || EXTRACT(YEAR FROM v_start_date);
    ELSE
      RAISE EXCEPTION 'Invalid season type: %', p_season_type;
    END IF;

    INSERT INTO seasons (season_name, season_type, start_date, end_date, status)
    VALUES (
      v_season_name,
      p_season_type,
      v_start_date,
      v_end_date,
      CASE
        WHEN v_start_date > CURRENT_DATE THEN 'upcoming'
        WHEN v_start_date <= CURRENT_DATE AND v_end_date >= CURRENT_DATE THEN 'active'
        ELSE 'completed'
      END
    )
    ON CONFLICT (season_type, start_date, end_date) DO NOTHING;

    v_created_count := v_created_count + 1;
  END LOOP;

  RETURN v_created_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le classement d'une saison
CREATE OR REPLACE FUNCTION update_seasonal_leaderboard_ranks(p_season_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Sauvegarder les rangs actuels comme previous_rank
  UPDATE seasonal_leaderboard_entries
  SET previous_rank = rank
  WHERE season_id = p_season_id;

  -- Recalculer les rangs basés sur le score
  WITH ranked_entries AS (
    SELECT
      id,
      RANK() OVER (ORDER BY total_score DESC, last_activity_at ASC) as new_rank
    FROM seasonal_leaderboard_entries
    WHERE season_id = p_season_id
  )
  UPDATE seasonal_leaderboard_entries sle
  SET
    rank = re.new_rank,
    updated_at = NOW()
  FROM ranked_entries re
  WHERE sle.id = re.id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour archiver une saison terminée
CREATE OR REPLACE FUNCTION archive_season(p_season_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_season RECORD;
  v_archived_count INTEGER := 0;
BEGIN
  -- Vérifier que la saison existe et est terminée
  SELECT * INTO v_season
  FROM seasons
  WHERE id = p_season_id
    AND end_date < CURRENT_DATE
    AND status = 'completed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Season not found or not ready for archiving';
  END IF;

  -- Archiver les entrées du leaderboard
  INSERT INTO seasonal_leaderboard_archives (
    season_id,
    user_id,
    final_rank,
    final_score,
    challenges_completed,
    tournaments_won,
    xp_earned,
    skill_nodes_unlocked,
    season_start_date,
    season_end_date,
    season_type,
    season_name
  )
  SELECT
    sle.season_id,
    sle.user_id,
    sle.rank,
    sle.total_score,
    sle.challenges_completed,
    sle.tournaments_won,
    sle.xp_earned,
    sle.skill_nodes_unlocked,
    v_season.start_date,
    v_season.end_date,
    v_season.season_type,
    v_season.season_name
  FROM seasonal_leaderboard_entries sle
  WHERE sle.season_id = p_season_id
  ON CONFLICT (season_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_archived_count = ROW_COUNT;

  -- Mettre à jour le statut de la saison
  UPDATE seasons
  SET
    status = 'archived',
    archived_at = NOW(),
    updated_at = NOW()
  WHERE id = p_season_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir la saison active
CREATE OR REPLACE FUNCTION get_active_season(p_season_type VARCHAR)
RETURNS UUID AS $$
DECLARE
  v_season_id UUID;
BEGIN
  SELECT id INTO v_season_id
  FROM seasons
  WHERE season_type = p_season_type
    AND status = 'active'
    AND start_date <= CURRENT_DATE
    AND end_date >= CURRENT_DATE
  ORDER BY start_date DESC
  LIMIT 1;

  RETURN v_season_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le score d'un utilisateur dans la saison active
CREATE OR REPLACE FUNCTION update_user_seasonal_score(
  p_user_id UUID,
  p_score_increment INTEGER DEFAULT 0,
  p_challenges_increment INTEGER DEFAULT 0,
  p_tournaments_increment INTEGER DEFAULT 0,
  p_xp_increment INTEGER DEFAULT 0,
  p_skills_increment INTEGER DEFAULT 0
)
RETURNS BOOLEAN AS $$
DECLARE
  v_monthly_season_id UUID;
  v_quarterly_season_id UUID;
BEGIN
  -- Obtenir les saisons actives
  v_monthly_season_id := get_active_season('monthly');
  v_quarterly_season_id := get_active_season('quarterly');

  -- Mettre à jour la saison mensuelle
  IF v_monthly_season_id IS NOT NULL THEN
    INSERT INTO seasonal_leaderboard_entries (
      season_id,
      user_id,
      total_score,
      challenges_completed,
      tournaments_won,
      xp_earned,
      skill_nodes_unlocked
    ) VALUES (
      v_monthly_season_id,
      p_user_id,
      p_score_increment,
      p_challenges_increment,
      p_tournaments_increment,
      p_xp_increment,
      p_skills_increment
    )
    ON CONFLICT (season_id, user_id)
    DO UPDATE SET
      total_score = seasonal_leaderboard_entries.total_score + p_score_increment,
      challenges_completed = seasonal_leaderboard_entries.challenges_completed + p_challenges_increment,
      tournaments_won = seasonal_leaderboard_entries.tournaments_won + p_tournaments_increment,
      xp_earned = seasonal_leaderboard_entries.xp_earned + p_xp_increment,
      skill_nodes_unlocked = seasonal_leaderboard_entries.skill_nodes_unlocked + p_skills_increment,
      last_activity_at = NOW(),
      updated_at = NOW();
  END IF;

  -- Mettre à jour la saison trimestrielle
  IF v_quarterly_season_id IS NOT NULL THEN
    INSERT INTO seasonal_leaderboard_entries (
      season_id,
      user_id,
      total_score,
      challenges_completed,
      tournaments_won,
      xp_earned,
      skill_nodes_unlocked
    ) VALUES (
      v_quarterly_season_id,
      p_user_id,
      p_score_increment,
      p_challenges_increment,
      p_tournaments_increment,
      p_xp_increment,
      p_skills_increment
    )
    ON CONFLICT (season_id, user_id)
    DO UPDATE SET
      total_score = seasonal_leaderboard_entries.total_score + p_score_increment,
      challenges_completed = seasonal_leaderboard_entries.challenges_completed + p_challenges_increment,
      tournaments_won = seasonal_leaderboard_entries.tournaments_won + p_tournaments_increment,
      xp_earned = seasonal_leaderboard_entries.xp_earned + p_xp_increment,
      skill_nodes_unlocked = seasonal_leaderboard_entries.skill_nodes_unlocked + p_skills_increment,
      last_activity_at = NOW(),
      updated_at = NOW();
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le nombre de participants
CREATE OR REPLACE FUNCTION update_season_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE seasons
  SET
    total_participants = (
      SELECT COUNT(DISTINCT user_id)
      FROM seasonal_leaderboard_entries
      WHERE season_id = NEW.season_id
    ),
    total_entries = (
      SELECT COUNT(*)
      FROM seasonal_leaderboard_entries
      WHERE season_id = NEW.season_id
    ),
    updated_at = NOW()
  WHERE id = NEW.season_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour mettre à jour les timestamps
CREATE TRIGGER trigger_update_season_timestamp
  BEFORE UPDATE ON seasons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_leaderboard_entry_timestamp
  BEFORE UPDATE ON seasonal_leaderboard_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour le nombre de participants
CREATE TRIGGER trigger_update_participant_count
  AFTER INSERT OR DELETE ON seasonal_leaderboard_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_season_participant_count();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Seasons (lecture pour tous)
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons" ON seasons
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage seasons" ON seasons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Seasonal Leaderboard Entries (lecture pour tous)
ALTER TABLE seasonal_leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard entries" ON seasonal_leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own entries" ON seasonal_leaderboard_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can update entries" ON seasonal_leaderboard_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can modify entries" ON seasonal_leaderboard_entries
  FOR UPDATE USING (true);

-- Archives (lecture pour tous)
ALTER TABLE seasonal_leaderboard_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view archives" ON seasonal_leaderboard_archives
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage archives" ON seasonal_leaderboard_archives
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Team Seasonal Leaderboard
ALTER TABLE team_seasonal_leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view team leaderboard" ON team_seasonal_leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY "System can update team entries" ON team_seasonal_leaderboard_entries
  FOR ALL USING (true);

-- Seasonal Rewards
ALTER TABLE seasonal_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rewards" ON seasonal_rewards
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage rewards" ON seasonal_rewards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- SEED DATA - Générer les saisons pour 2026
-- ============================================

-- Générer les saisons mensuelles pour 2026
SELECT generate_seasons('monthly', 2026, 12);

-- Générer les saisons trimestrielles pour 2026
SELECT generate_seasons('quarterly', 2026, 4);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE seasons IS 'Définitions des saisons mensuelles et trimestrielles';
COMMENT ON TABLE seasonal_leaderboard_entries IS 'Entrées de classement actives pour chaque saison';
COMMENT ON TABLE seasonal_leaderboard_archives IS 'Archives historiques des classements complétés';
COMMENT ON TABLE team_seasonal_leaderboard_entries IS 'Classement saisonnier pour les équipes';
COMMENT ON TABLE seasonal_rewards IS 'Récompenses disponibles par saison';

COMMENT ON FUNCTION generate_seasons IS 'Génère automatiquement les saisons mensuelles ou trimestrielles';
COMMENT ON FUNCTION update_seasonal_leaderboard_ranks IS 'Recalcule les rangs pour une saison donnée';
COMMENT ON FUNCTION archive_season IS 'Archive une saison terminée dans la table d''archives';
COMMENT ON FUNCTION get_active_season IS 'Retourne l''ID de la saison active pour un type donné';
COMMENT ON FUNCTION update_user_seasonal_score IS 'Met à jour le score d''un utilisateur dans les saisons actives';

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 030_fix_supabase_role_permissions.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION 030: Restore Supabase Role Permissions
-- Version: 1.0
-- Description: The initial migration (001) ran DROP SCHEMA public CASCADE
--              which wiped all default Supabase grants for anon,
--              authenticated, and service_role. This migration restores
--              the standard Supabase permission structure.
--
-- Root cause: "permission denied for table user_profiles" on all
--             PostgREST API calls, including with the service_role key.
-- =================================================================

-- =================================================================
-- STEP 1: Schema-level permissions
-- =================================================================
-- Without USAGE on the schema, no role can access any object in it.

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- =================================================================
-- STEP 2: service_role - Full access to all tables
-- =================================================================
-- The service_role is used by server-side admin clients (via
-- SUPABASE_SERVICE_ROLE_KEY). It bypasses RLS by default but still
-- needs base table grants.

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- =================================================================
-- STEP 3: authenticated - Base permissions on all tables
-- =================================================================
-- RLS policies control the actual row-level access. These grants
-- only enable the policies to be evaluated.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- =================================================================
-- STEP 4: anon - Read-only on public content tables
-- =================================================================
-- Anonymous users can read public tables (modules, capsules, badges,
-- daily_challenges). RLS policies further restrict which rows.

GRANT SELECT ON TABLE public.modules TO anon;
GRANT SELECT ON TABLE public.capsules TO anon;
GRANT SELECT ON TABLE public.badges TO anon;
GRANT SELECT ON TABLE public.daily_challenges TO anon;
GRANT SELECT ON TABLE public.seasons TO anon;
GRANT SELECT ON TABLE public.tournaments TO anon;
GRANT SELECT ON TABLE public.seasonal_leaderboard_entries TO anon;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO anon;

-- =================================================================
-- STEP 5: Default privileges for future tables
-- =================================================================
-- Ensures any table created in the future automatically gets the
-- correct grants, preventing this issue from recurring.

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON ROUTINES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON ROUTINES TO authenticated;

-- =================================================================
-- Migration Complete
-- =================================================================


-- -----------------------------------------------------------
-- Migration: 030_fix_supabase_role_permissions.sql
-- -----------------------------------------------------------

-- =================================================================
-- MIGRATION 030: Restore Supabase Role Permissions
-- Version: 1.0
-- Description: The initial migration (001) ran DROP SCHEMA public CASCADE
--              which wiped all default Supabase grants for anon,
--              authenticated, and service_role. This migration restores
--              the standard Supabase permission structure.
--
-- Root cause: "permission denied for table user_profiles" on all
--             PostgREST API calls, including with the service_role key.
-- =================================================================

-- =================================================================
-- STEP 1: Schema-level permissions
-- =================================================================
-- Without USAGE on the schema, no role can access any object in it.

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- =================================================================
-- STEP 2: service_role - Full access to all tables
-- =================================================================
-- The service_role is used by server-side admin clients (via
-- SUPABASE_SERVICE_ROLE_KEY). It bypasses RLS by default but still
-- needs base table grants.

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- =================================================================
-- STEP 3: authenticated - Base permissions on all tables
-- =================================================================
-- RLS policies control the actual row-level access. These grants
-- only enable the policies to be evaluated.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- =================================================================
-- STEP 4: anon - Read-only on public content tables
-- =================================================================
-- Anonymous users can read public tables (modules, capsules, badges,
-- daily_challenges). RLS policies further restrict which rows.

GRANT SELECT ON TABLE public.modules TO anon;
GRANT SELECT ON TABLE public.capsules TO anon;
GRANT SELECT ON TABLE public.badges TO anon;
GRANT SELECT ON TABLE public.daily_challenges TO anon;
GRANT SELECT ON TABLE public.seasons TO anon;
GRANT SELECT ON TABLE public.tournaments TO anon;
GRANT SELECT ON TABLE public.seasonal_leaderboard_entries TO anon;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO anon;

-- =================================================================
-- STEP 5: Default privileges for future tables
-- =================================================================
-- Ensures any table created in the future automatically gets the
-- correct grants, preventing this issue from recurring.

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON ROUTINES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON ROUTINES TO authenticated;

-- =================================================================
-- Migration Complete
-- =================================================================


-- -----------------------------------------------------------
-- Migration: 031_fix_signup_triggers.sql
-- -----------------------------------------------------------

-- ============================================================================
-- Migration 031: Fix signup triggers
-- ============================================================================
-- Root cause: Multiple AFTER INSERT triggers on auth.users caused failures.
-- The cascaded trigger chain (auth.users → user_profiles → notification_preferences)
-- and the separate trigger (initialize_user_level) failed when running alongside
-- handle_new_user due to FK validation issues in nested trigger contexts.
--
-- Fix: Consolidate ALL user initialization into handle_new_user with error
-- handling. Make the other triggers no-ops to prevent cascaded failures.
-- ============================================================================

-- 1. Replace handle_new_user with a consolidated version
--    that creates profile, points, notification prefs, AND levels.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_default_level_id UUID;
BEGIN
  -- Extract username from auth metadata; fallback to email prefix
  v_username := COALESCE(
    LOWER(NEW.raw_user_meta_data->>'username'),
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  -- Sanitize for CHECK constraint: ^[a-z0-9_-]{3,20}$
  v_username := LEFT(REGEXP_REPLACE(v_username, '[^a-z0-9_-]', '', 'g'), 20);
  IF LENGTH(v_username) < 3 THEN
    v_username := v_username || SUBSTR(REPLACE(NEW.id::text, '-', ''), 1, 20 - LENGTH(v_username));
    v_username := LEFT(v_username, 20);
  END IF;

  -- Create user profile
  INSERT INTO public.user_profiles (
    user_id, email, display_name, role, username, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student',
    v_username,
    NOW(),
    NOW()
  );

  -- Create user points
  INSERT INTO public.user_points (user_id) VALUES (NEW.id);

  -- Create notification preferences (safe: won't block signup on failure)
  BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Initialize user level to Novice (safe: won't block signup on failure)
  BEGIN
    SELECT id INTO v_default_level_id
    FROM public.level_definitions
    WHERE level_rank = 1
    LIMIT 1;

    IF v_default_level_id IS NOT NULL THEN
      INSERT INTO public.user_levels (
        user_id, current_level_id, current_level_rank, total_xp, current_level_xp
      ) VALUES (
        NEW.id, v_default_level_id, 1, 0, 0
      ) ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Make initialize_user_level a no-op (now handled by handle_new_user)
CREATE OR REPLACE FUNCTION initialize_user_level()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Make create_default_notification_preferences a no-op (now handled by handle_new_user)
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- -----------------------------------------------------------
-- Migration: 031_fix_signup_triggers.sql
-- -----------------------------------------------------------

-- ============================================================================
-- Migration 031: Fix signup triggers
-- ============================================================================
-- Root cause: Multiple AFTER INSERT triggers on auth.users caused failures.
-- The cascaded trigger chain (auth.users → user_profiles → notification_preferences)
-- and the separate trigger (initialize_user_level) failed when running alongside
-- handle_new_user due to FK validation issues in nested trigger contexts.
--
-- Fix: Consolidate ALL user initialization into handle_new_user with error
-- handling. Make the other triggers no-ops to prevent cascaded failures.
-- ============================================================================

-- 1. Replace handle_new_user with a consolidated version
--    that creates profile, points, notification prefs, AND levels.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_default_level_id UUID;
BEGIN
  -- Extract username from auth metadata; fallback to email prefix
  v_username := COALESCE(
    LOWER(NEW.raw_user_meta_data->>'username'),
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  -- Sanitize for CHECK constraint: ^[a-z0-9_-]{3,20}$
  v_username := LEFT(REGEXP_REPLACE(v_username, '[^a-z0-9_-]', '', 'g'), 20);
  IF LENGTH(v_username) < 3 THEN
    v_username := v_username || SUBSTR(REPLACE(NEW.id::text, '-', ''), 1, 20 - LENGTH(v_username));
    v_username := LEFT(v_username, 20);
  END IF;

  -- Create user profile
  INSERT INTO public.user_profiles (
    user_id, email, display_name, role, username, created_at, updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student',
    v_username,
    NOW(),
    NOW()
  );

  -- Create user points
  INSERT INTO public.user_points (user_id) VALUES (NEW.id);

  -- Create notification preferences (safe: won't block signup on failure)
  BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Initialize user level to Novice (safe: won't block signup on failure)
  BEGIN
    SELECT id INTO v_default_level_id
    FROM public.level_definitions
    WHERE level_rank = 1
    LIMIT 1;

    IF v_default_level_id IS NOT NULL THEN
      INSERT INTO public.user_levels (
        user_id, current_level_id, current_level_rank, total_xp, current_level_xp
      ) VALUES (
        NEW.id, v_default_level_id, 1, 0, 0
      ) ON CONFLICT (user_id) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Make initialize_user_level a no-op (now handled by handle_new_user)
CREATE OR REPLACE FUNCTION initialize_user_level()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Make create_default_notification_preferences a no-op (now handled by handle_new_user)
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- -----------------------------------------------------------
-- Migration: 032_spaced_repetition_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de révision espacée (SM-2)
-- Version: 3.2.0
-- Date: 2026-03-03
-- Description: Tables pour la révision espacée basée sur l'algorithme SM-2

-- ============================================
-- TABLE: spaced_repetition_cards
-- Carte de révision par capsule/utilisateur
-- ============================================
CREATE TABLE IF NOT EXISTS spaced_repetition_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  capsule_id VARCHAR(50) NOT NULL,

  -- Paramètres SM-2
  easiness_factor REAL DEFAULT 2.5 CHECK (easiness_factor >= 1.3),
  interval_days INTEGER DEFAULT 1 CHECK (interval_days >= 0),
  repetitions INTEGER DEFAULT 0 CHECK (repetitions >= 0),

  -- Planification
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_review_date DATE,

  -- Statistiques
  total_reviews INTEGER DEFAULT 0,
  correct_reviews INTEGER DEFAULT 0,
  average_quality REAL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un seul card par capsule par utilisateur
  UNIQUE(user_id, capsule_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_sr_cards_user ON spaced_repetition_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_sr_cards_next_review ON spaced_repetition_cards(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_sr_cards_capsule ON spaced_repetition_cards(capsule_id);

-- ============================================
-- TABLE: spaced_repetition_reviews
-- Historique des sessions de révision
-- ============================================
CREATE TABLE IF NOT EXISTS spaced_repetition_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES spaced_repetition_cards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Évaluation SM-2 (0-5)
  quality INTEGER NOT NULL CHECK (quality >= 0 AND quality <= 5),

  -- État avant la révision (pour traçabilité)
  previous_interval INTEGER NOT NULL,
  previous_easiness REAL NOT NULL,
  previous_repetitions INTEGER NOT NULL,

  -- État après la révision
  new_interval INTEGER NOT NULL,
  new_easiness REAL NOT NULL,
  new_repetitions INTEGER NOT NULL,

  -- Temps passé
  time_spent_seconds INTEGER DEFAULT 0,

  -- Timestamp
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_sr_reviews_card ON spaced_repetition_reviews(card_id);
CREATE INDEX IF NOT EXISTS idx_sr_reviews_user ON spaced_repetition_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_sr_reviews_date ON spaced_repetition_reviews(reviewed_at);

-- ============================================
-- TABLE: spaced_repetition_stats
-- Statistiques agrégées par utilisateur
-- ============================================
CREATE TABLE IF NOT EXISTS spaced_repetition_stats (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  total_cards INTEGER DEFAULT 0,
  cards_due_today INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_easiness REAL DEFAULT 2.5,
  retention_rate REAL DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_review_date DATE,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FUNCTION: Mise à jour des stats après révision
-- ============================================
CREATE OR REPLACE FUNCTION update_sr_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO spaced_repetition_stats (user_id, total_reviews, last_review_date)
  VALUES (NEW.user_id, 1, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_reviews = spaced_repetition_stats.total_reviews + 1,
    last_review_date = CURRENT_DATE,
    updated_at = NOW();

  -- Mettre à jour les statistiques calculées
  UPDATE spaced_repetition_stats
  SET
    total_cards = (
      SELECT COUNT(*) FROM spaced_repetition_cards WHERE user_id = NEW.user_id
    ),
    cards_due_today = (
      SELECT COUNT(*) FROM spaced_repetition_cards
      WHERE user_id = NEW.user_id AND next_review_date <= CURRENT_DATE
    ),
    average_easiness = (
      SELECT COALESCE(AVG(easiness_factor), 2.5) FROM spaced_repetition_cards
      WHERE user_id = NEW.user_id
    ),
    retention_rate = (
      SELECT CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(COUNT(*) FILTER (WHERE quality >= 3)::NUMERIC / COUNT(*)::NUMERIC * 100, 1)
      END
      FROM spaced_repetition_reviews WHERE user_id = NEW.user_id
    )
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER trigger_update_sr_stats
  AFTER INSERT ON spaced_repetition_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_sr_stats();

-- Trigger updated_at sur les cartes
CREATE TRIGGER trigger_update_sr_card_timestamp
  BEFORE UPDATE ON spaced_repetition_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Cards
ALTER TABLE spaced_repetition_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cards" ON spaced_repetition_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards" ON spaced_repetition_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards" ON spaced_repetition_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards" ON spaced_repetition_cards
  FOR DELETE USING (auth.uid() = user_id);

-- Reviews
ALTER TABLE spaced_repetition_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reviews" ON spaced_repetition_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews" ON spaced_repetition_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stats
ALTER TABLE spaced_repetition_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" ON spaced_repetition_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all cards" ON spaced_repetition_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all stats" ON spaced_repetition_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE spaced_repetition_cards IS 'Cartes de révision espacée SM-2 par capsule';
COMMENT ON TABLE spaced_repetition_reviews IS 'Historique des révisions SM-2';
COMMENT ON TABLE spaced_repetition_stats IS 'Statistiques agrégées de révision par utilisateur';

-- Fin de la migration


-- -----------------------------------------------------------
-- Migration: 032_spaced_repetition_system.sql
-- -----------------------------------------------------------

-- Migration pour le système de révision espacée (SM-2)
-- Version: 3.2.0
-- Date: 2026-03-03
-- Description: Tables pour la révision espacée basée sur l'algorithme SM-2

-- ============================================
-- TABLE: spaced_repetition_cards
-- Carte de révision par capsule/utilisateur
-- ============================================
CREATE TABLE IF NOT EXISTS spaced_repetition_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  capsule_id VARCHAR(50) NOT NULL,

  -- Paramètres SM-2
  easiness_factor REAL DEFAULT 2.5 CHECK (easiness_factor >= 1.3),
  interval_days INTEGER DEFAULT 1 CHECK (interval_days >= 0),
  repetitions INTEGER DEFAULT 0 CHECK (repetitions >= 0),

  -- Planification
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_review_date DATE,

  -- Statistiques
  total_reviews INTEGER DEFAULT 0,
  correct_reviews INTEGER DEFAULT 0,
  average_quality REAL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un seul card par capsule par utilisateur
  UNIQUE(user_id, capsule_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_sr_cards_user ON spaced_repetition_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_sr_cards_next_review ON spaced_repetition_cards(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_sr_cards_capsule ON spaced_repetition_cards(capsule_id);

-- ============================================
-- TABLE: spaced_repetition_reviews
-- Historique des sessions de révision
-- ============================================
CREATE TABLE IF NOT EXISTS spaced_repetition_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES spaced_repetition_cards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Évaluation SM-2 (0-5)
  quality INTEGER NOT NULL CHECK (quality >= 0 AND quality <= 5),

  -- État avant la révision (pour traçabilité)
  previous_interval INTEGER NOT NULL,
  previous_easiness REAL NOT NULL,
  previous_repetitions INTEGER NOT NULL,

  -- État après la révision
  new_interval INTEGER NOT NULL,
  new_easiness REAL NOT NULL,
  new_repetitions INTEGER NOT NULL,

  -- Temps passé
  time_spent_seconds INTEGER DEFAULT 0,

  -- Timestamp
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_sr_reviews_card ON spaced_repetition_reviews(card_id);
CREATE INDEX IF NOT EXISTS idx_sr_reviews_user ON spaced_repetition_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_sr_reviews_date ON spaced_repetition_reviews(reviewed_at);

-- ============================================
-- TABLE: spaced_repetition_stats
-- Statistiques agrégées par utilisateur
-- ============================================
CREATE TABLE IF NOT EXISTS spaced_repetition_stats (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  total_cards INTEGER DEFAULT 0,
  cards_due_today INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_easiness REAL DEFAULT 2.5,
  retention_rate REAL DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_review_date DATE,

  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FUNCTION: Mise à jour des stats après révision
-- ============================================
CREATE OR REPLACE FUNCTION update_sr_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO spaced_repetition_stats (user_id, total_reviews, last_review_date)
  VALUES (NEW.user_id, 1, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_reviews = spaced_repetition_stats.total_reviews + 1,
    last_review_date = CURRENT_DATE,
    updated_at = NOW();

  -- Mettre à jour les statistiques calculées
  UPDATE spaced_repetition_stats
  SET
    total_cards = (
      SELECT COUNT(*) FROM spaced_repetition_cards WHERE user_id = NEW.user_id
    ),
    cards_due_today = (
      SELECT COUNT(*) FROM spaced_repetition_cards
      WHERE user_id = NEW.user_id AND next_review_date <= CURRENT_DATE
    ),
    average_easiness = (
      SELECT COALESCE(AVG(easiness_factor), 2.5) FROM spaced_repetition_cards
      WHERE user_id = NEW.user_id
    ),
    retention_rate = (
      SELECT CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(COUNT(*) FILTER (WHERE quality >= 3)::NUMERIC / COUNT(*)::NUMERIC * 100, 1)
      END
      FROM spaced_repetition_reviews WHERE user_id = NEW.user_id
    )
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER trigger_update_sr_stats
  AFTER INSERT ON spaced_repetition_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_sr_stats();

-- Trigger updated_at sur les cartes
CREATE TRIGGER trigger_update_sr_card_timestamp
  BEFORE UPDATE ON spaced_repetition_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Cards
ALTER TABLE spaced_repetition_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cards" ON spaced_repetition_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards" ON spaced_repetition_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards" ON spaced_repetition_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards" ON spaced_repetition_cards
  FOR DELETE USING (auth.uid() = user_id);

-- Reviews
ALTER TABLE spaced_repetition_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reviews" ON spaced_repetition_reviews
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews" ON spaced_repetition_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stats
ALTER TABLE spaced_repetition_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" ON spaced_repetition_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all cards" ON spaced_repetition_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all stats" ON spaced_repetition_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE spaced_repetition_cards IS 'Cartes de révision espacée SM-2 par capsule';
COMMENT ON TABLE spaced_repetition_reviews IS 'Historique des révisions SM-2';
COMMENT ON TABLE spaced_repetition_stats IS 'Statistiques agrégées de révision par utilisateur';

-- Fin de la migration

