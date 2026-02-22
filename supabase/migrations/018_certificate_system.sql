-- Migration pour le système de certificats
-- Version: 1.0.0
-- Date: 2026-02-22

-- Type de certificat
CREATE TYPE certificate_type AS ENUM ('module', 'master');
CREATE TYPE certificate_status AS ENUM ('issued', 'revoked', 'expired');

-- Table des certificats
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id UUID REFERENCES modules(id) ON DELETE SET NULL,
  certificate_type certificate_type NOT NULL DEFAULT 'module',
  student_name VARCHAR(255) NOT NULL,
  completion_date TIMESTAMP WITH TIME ZONE NOT NULL,
  score DECIMAL(5,2), -- Score ou moyenne pour le module/curriculum
  verification_code VARCHAR(64) NOT NULL UNIQUE, -- Code unique pour vérification
  status certificate_status DEFAULT 'issued' NOT NULL,
  metadata JSONB DEFAULT '{}', -- Données additionnelles (modules complétés pour master cert, etc.)
  shared_on_linkedin BOOLEAN DEFAULT false,
  linkedin_shared_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0 NOT NULL,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_module_cert CHECK (
    (certificate_type = 'module' AND module_id IS NOT NULL) OR
    (certificate_type = 'master' AND module_id IS NULL)
  )
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_module_id ON certificates(module_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_code ON certificates(verification_code);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates(certificate_type);

-- Table des statistiques de certificats (pour analytics)
CREATE TABLE IF NOT EXISTS certificate_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_issued INTEGER DEFAULT 0,
  total_module_certs INTEGER DEFAULT 0,
  total_master_certs INTEGER DEFAULT 0,
  total_shared_linkedin INTEGER DEFAULT 0,
  total_verifications INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialiser les stats
INSERT INTO certificate_stats (total_issued, last_updated) VALUES (0, NOW());

-- Fonction pour générer un code de vérification unique
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Évite les caractères ambigus (0, O, I, 1)
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..16 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Formater le code (XXXX-XXXX-XXXX-XXXX)
    result := substr(result, 1, 4) || '-' ||
              substr(result, 5, 4) || '-' ||
              substr(result, 9, 4) || '-' ||
              substr(result, 13, 4);

    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM certificates WHERE verification_code = result) INTO code_exists;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_certificate_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE certificate_stats
  SET
    total_issued = (SELECT COUNT(*) FROM certificates WHERE status = 'issued'),
    total_module_certs = (SELECT COUNT(*) FROM certificates WHERE certificate_type = 'module' AND status = 'issued'),
    total_master_certs = (SELECT COUNT(*) FROM certificates WHERE certificate_type = 'master' AND status = 'issued'),
    total_shared_linkedin = (SELECT COUNT(*) FROM certificates WHERE shared_on_linkedin = true),
    last_updated = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour les stats automatiquement
CREATE TRIGGER trigger_update_certificate_stats_insert
  AFTER INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_stats();

CREATE TRIGGER trigger_update_certificate_stats_update
  AFTER UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_stats();

CREATE TRIGGER trigger_update_certificate_stats_delete
  AFTER DELETE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificate_stats();

-- Trigger pour auto-générer le code de vérification
CREATE OR REPLACE FUNCTION set_verification_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verification_code IS NULL OR NEW.verification_code = '' THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_verification_code
  BEFORE INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION set_verification_code();

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificates_updated_at();

-- RLS (Row Level Security)
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_stats ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour certificates
-- Les utilisateurs peuvent voir leurs propres certificats
CREATE POLICY "Users can view their own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent créer leurs propres certificats
CREATE POLICY "Users can create their own certificates" ON certificates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres certificats (partage LinkedIn, téléchargements)
CREATE POLICY "Users can update their own certificates" ON certificates
  FOR UPDATE USING (auth.uid() = user_id);

-- Les admins peuvent voir et gérer tous les certificats
CREATE POLICY "Admins can manage all certificates" ON certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Politique pour la vérification publique (par code uniquement)
-- Note: La fonction verify_certificate ci-dessous est SECURITY DEFINER pour permettre l'accès public

-- Politiques pour certificate_stats (lecture seule pour admins)
CREATE POLICY "Admins can view certificate stats" ON certificate_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Fonction publique pour vérifier un certificat par code (SECURITY DEFINER pour accès public)
CREATE OR REPLACE FUNCTION verify_certificate(verification_code_param VARCHAR)
RETURNS TABLE (
  valid BOOLEAN,
  certificate_id UUID,
  student_name VARCHAR,
  module_title TEXT,
  certificate_type certificate_type,
  completion_date TIMESTAMP WITH TIME ZONE,
  issued_at TIMESTAMP WITH TIME ZONE,
  status certificate_status,
  score DECIMAL
)
SECURITY DEFINER
AS $$
BEGIN
  -- Incrémenter le compteur de vérifications
  UPDATE certificate_stats
  SET total_verifications = total_verifications + 1;

  RETURN QUERY
  SELECT
    (c.id IS NOT NULL AND c.status = 'issued')::BOOLEAN as valid,
    c.id,
    c.student_name,
    COALESCE(m.title, 'Master Certificate - All Modules')::TEXT as module_title,
    c.certificate_type,
    c.completion_date,
    c.issued_at,
    c.status,
    c.score
  FROM certificates c
  LEFT JOIN modules m ON c.module_id = m.id
  WHERE c.verification_code = verification_code_param;

  -- Si aucun résultat, retourner une ligne avec valid = false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false::BOOLEAN, NULL::UUID, NULL::VARCHAR, NULL::TEXT,
                        NULL::certificate_type, NULL::TIMESTAMP WITH TIME ZONE,
                        NULL::TIMESTAMP WITH TIME ZONE, NULL::certificate_status, NULL::DECIMAL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les certificats d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_certificates(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  certificate_type certificate_type,
  module_title TEXT,
  student_name VARCHAR,
  completion_date TIMESTAMP WITH TIME ZONE,
  score DECIMAL,
  verification_code VARCHAR,
  issued_at TIMESTAMP WITH TIME ZONE,
  shared_on_linkedin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.certificate_type,
    COALESCE(m.title, 'Master Certificate - All Modules')::TEXT as module_title,
    c.student_name,
    c.completion_date,
    c.score,
    c.verification_code,
    c.issued_at,
    c.shared_on_linkedin
  FROM certificates c
  LEFT JOIN modules m ON c.module_id = m.id
  WHERE c.user_id = user_id_param
    AND c.status = 'issued'
  ORDER BY c.issued_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur a déjà un certificat pour un module
CREATE OR REPLACE FUNCTION has_certificate_for_module(user_id_param UUID, module_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM certificates
    WHERE user_id = user_id_param
      AND module_id = module_id_param
      AND certificate_type = 'module'
      AND status = 'issued'
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un utilisateur a le master certificate
CREATE OR REPLACE FUNCTION has_master_certificate(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM certificates
    WHERE user_id = user_id_param
      AND certificate_type = 'master'
      AND status = 'issued'
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer un certificat comme partagé sur LinkedIn
CREATE OR REPLACE FUNCTION mark_shared_on_linkedin(certificate_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE certificates
  SET
    shared_on_linkedin = true,
    linkedin_shared_at = NOW(),
    updated_at = NOW()
  WHERE id = certificate_id_param
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter le compteur de téléchargements
CREATE OR REPLACE FUNCTION increment_download_count(certificate_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE certificates
  SET
    download_count = download_count + 1,
    last_downloaded_at = NOW(),
    updated_at = NOW()
  WHERE id = certificate_id_param
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
