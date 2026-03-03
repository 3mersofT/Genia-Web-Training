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
