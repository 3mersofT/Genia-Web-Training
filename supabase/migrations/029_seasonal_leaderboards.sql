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
