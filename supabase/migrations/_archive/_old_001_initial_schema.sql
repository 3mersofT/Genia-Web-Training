-- ========================================
-- MIGRATION COMPLÈTE - E-LEARNING PLATFORM
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

-- Users table (extends auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role user_role DEFAULT 'student' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User profiles
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{"theme": "light", "notifications": true, "language": "fr"}'::jsonb,
    onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
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

-- User progress
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
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

-- Points system
CREATE TABLE user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
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

-- User badges
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    seen_at TIMESTAMPTZ,
    shared BOOLEAN DEFAULT FALSE NOT NULL,
    UNIQUE(user_id, badge_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON user_progress
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view modules" ON modules
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view capsules" ON capsules
    FOR SELECT USING (is_published = true);
