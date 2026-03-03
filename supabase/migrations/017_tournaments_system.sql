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
