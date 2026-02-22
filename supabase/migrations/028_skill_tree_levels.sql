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
