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