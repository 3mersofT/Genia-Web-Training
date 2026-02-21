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