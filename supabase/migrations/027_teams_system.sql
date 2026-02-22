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
