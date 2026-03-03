-- Migration pour le système de feedback
-- Version: 2.0.0
-- Date: 2024-12-19

-- Table des feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('module', 'capsule', 'platform')),
  target_id VARCHAR(100) NOT NULL, -- ID du module/capsule ou 'platform'
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  categories TEXT[] DEFAULT '{}', -- ['contenu', 'pedagogie', 'technique', 'ux']
  is_anonymous BOOLEAN DEFAULT false,
  user_name VARCHAR(100), -- Nom affiché si pas anonyme
  user_email VARCHAR(255), -- Email si pas anonyme
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  admin_notes TEXT, -- Notes de l'admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_feedbacks_type_target ON feedbacks(feedback_type, target_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at);

-- Table des statistiques de feedback (pour cache)
CREATE TABLE IF NOT EXISTS feedback_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type VARCHAR(20) NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  total_feedbacks INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  rating_distribution JSONB DEFAULT '{}', -- {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
  category_stats JSONB DEFAULT '{}', -- Stats par catégorie
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(target_type, target_id)
);

-- Fonction pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_feedback_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour les stats pour le feedback modifié
  INSERT INTO feedback_stats (target_type, target_id, total_feedbacks, average_rating, rating_distribution, category_stats, last_updated)
  SELECT 
    feedback_type,
    target_id,
    COUNT(*) as total_feedbacks,
    ROUND(AVG(rating), 2) as average_rating,
    jsonb_build_object(
      '1', COUNT(*) FILTER (WHERE rating = 1),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '5', COUNT(*) FILTER (WHERE rating = 5)
    ) as rating_distribution,
    jsonb_build_object(
      'contenu', COUNT(*) FILTER (WHERE 'contenu' = ANY(categories)),
      'pedagogie', COUNT(*) FILTER (WHERE 'pedagogie' = ANY(categories)),
      'technique', COUNT(*) FILTER (WHERE 'technique' = ANY(categories)),
      'ux', COUNT(*) FILTER (WHERE 'ux' = ANY(categories))
    ) as category_stats,
    NOW() as last_updated
  FROM feedbacks 
  WHERE feedback_type = COALESCE(NEW.feedback_type, OLD.feedback_type)
    AND target_id = COALESCE(NEW.target_id, OLD.target_id)
    AND status = 'approved'
  GROUP BY feedback_type, target_id
  ON CONFLICT (target_type, target_id) 
  DO UPDATE SET
    total_feedbacks = EXCLUDED.total_feedbacks,
    average_rating = EXCLUDED.average_rating,
    rating_distribution = EXCLUDED.rating_distribution,
    category_stats = EXCLUDED.category_stats,
    last_updated = EXCLUDED.last_updated;
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour les stats automatiquement
CREATE TRIGGER trigger_update_feedback_stats_insert
  AFTER INSERT ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_stats();

CREATE TRIGGER trigger_update_feedback_stats_update
  AFTER UPDATE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_stats();

CREATE TRIGGER trigger_update_feedback_stats_delete
  AFTER DELETE ON feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_stats();

-- RLS (Row Level Security)
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_stats ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour feedbacks
CREATE POLICY "Users can view their own feedbacks" ON feedbacks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedbacks" ON feedbacks
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own feedbacks" ON feedbacks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedbacks" ON feedbacks
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour les admins
CREATE POLICY "Admins can view all feedbacks" ON feedbacks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Politiques pour feedback_stats (lecture seule pour tous)
CREATE POLICY "Anyone can view feedback stats" ON feedback_stats
  FOR SELECT USING (true);

-- Fonction pour obtenir les stats d'un module/capsule
CREATE OR REPLACE FUNCTION get_feedback_stats(target_type_param VARCHAR, target_id_param VARCHAR)
RETURNS TABLE (
  total_feedbacks INTEGER,
  average_rating DECIMAL,
  rating_distribution JSONB,
  category_stats JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(fs.total_feedbacks, 0)::INTEGER,
    COALESCE(fs.average_rating, 0.00)::DECIMAL,
    COALESCE(fs.rating_distribution, '{}'::jsonb),
    COALESCE(fs.category_stats, '{}'::jsonb)
  FROM feedback_stats fs
  WHERE fs.target_type = target_type_param 
    AND fs.target_id = target_id_param;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les feedbacks récents
CREATE OR REPLACE FUNCTION get_recent_feedbacks(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  feedback_type VARCHAR,
  target_id VARCHAR,
  rating INTEGER,
  comment TEXT,
  categories TEXT[],
  is_anonymous BOOLEAN,
  user_name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.feedback_type,
    f.target_id,
    f.rating,
    f.comment,
    f.categories,
    f.is_anonymous,
    f.user_name,
    f.created_at
  FROM feedbacks f
  WHERE f.status = 'approved'
  ORDER BY f.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insertion de données de test
INSERT INTO feedbacks (user_id, feedback_type, target_id, rating, comment, categories, is_anonymous, user_name, status) VALUES
  (NULL, 'platform', 'platform', 5, 'Excellente plateforme, très intuitive !', ARRAY['ux', 'technique'], true, 'Utilisateur anonyme', 'approved'),
  (NULL, 'module', 'fondamentaux', 4, 'Contenu très bien structuré, j''ai appris beaucoup', ARRAY['contenu', 'pedagogie'], true, 'Étudiant', 'approved'),
  (NULL, 'capsule', 'cap-1-3', 5, 'Capsule parfaite, les exemples sont très clairs', ARRAY['pedagogie'], false, 'Marie Dupont', 'approved'),
  (NULL, 'platform', 'platform', 3, 'Bien mais pourrait être plus rapide', ARRAY['technique'], true, 'Utilisateur', 'approved'),
  (NULL, 'module', 'techniques', 4, 'Très utile pour mon travail', ARRAY['contenu'], false, 'Jean Martin', 'approved');

-- Mise à jour des stats initiales (via trigger automatique)
-- Les stats seront mises à jour automatiquement par les triggers
