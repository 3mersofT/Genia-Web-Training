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
