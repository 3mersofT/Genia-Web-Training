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
