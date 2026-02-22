-- Migration pour le système de notifications étudiants
-- Version: 1.0.0
-- Date: 2026-02-22
-- Description: Tables pour les notifications étudiants et leurs préférences

-- ============================================
-- ENUMS
-- ============================================

-- Types de notifications pour les étudiants
CREATE TYPE notification_type AS ENUM (
  'daily_challenge',
  'streak_reminder',
  'badge_earned',
  'peer_review',
  'new_module',
  'ai_nudge'
);

-- Fréquence des digests email
CREATE TYPE email_digest_frequency AS ENUM (
  'immediate',
  'daily',
  'weekly',
  'off'
);

-- ============================================
-- TABLE: student_notifications
-- Notifications pour les étudiants
-- ============================================
CREATE TABLE IF NOT EXISTS student_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Contenu de la notification
  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',

  -- État
  is_read BOOLEAN DEFAULT false NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_student_notifications_user ON student_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_student_notifications_user_unread ON student_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_student_notifications_created ON student_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_notifications_type ON student_notifications(type);

-- ============================================
-- TABLE: notification_preferences
-- Préférences de notifications des utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Types de notifications activés
  notification_types_enabled JSONB DEFAULT '{
    "daily_challenge": true,
    "streak_reminder": true,
    "badge_earned": true,
    "peer_review": true,
    "new_module": true,
    "ai_nudge": true
  }'::jsonb NOT NULL,

  -- Préférences email
  email_digest_frequency email_digest_frequency DEFAULT 'daily' NOT NULL,

  -- Préférences push
  push_enabled BOOLEAN DEFAULT false NOT NULL,
  push_subscription JSONB,

  -- Heure préférée pour les notifications de streak (format HH:MM)
  preferred_notification_time TIME DEFAULT '09:00:00',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_push ON notification_preferences(push_enabled) WHERE push_enabled = true;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Fonction pour mettre à jour read_at quand is_read devient true
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement read_at
CREATE TRIGGER set_notification_read_at
  BEFORE UPDATE ON student_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_at();

-- Trigger pour mettre à jour updated_at sur notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer les préférences par défaut pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement les préférences lors de la création d'un profil
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur les tables
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies pour student_notifications
-- Les utilisateurs peuvent lire leurs propres notifications
CREATE POLICY "Users can view their own notifications"
  ON student_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres notifications (marquer comme lu)
CREATE POLICY "Users can update their own notifications"
  ON student_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications"
  ON student_notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Seul le système (service role) peut créer des notifications
-- Les utilisateurs normaux ne peuvent pas créer de notifications directement
CREATE POLICY "System can create notifications"
  ON student_notifications
  FOR INSERT
  WITH CHECK (true);

-- Policies pour notification_preferences
-- Les utilisateurs peuvent lire leurs propres préférences
CREATE POLICY "Users can view their own preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres préférences
CREATE POLICY "Users can update their own preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leurs propres préférences
CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Fonction pour obtenir le nombre de notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM student_notifications
  WHERE user_id = p_user_id
    AND is_read = false;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE student_notifications
  SET is_read = true
  WHERE user_id = p_user_id
    AND is_read = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE student_notifications IS 'Notifications pour les étudiants (défis quotidiens, streaks, badges, etc.)';
COMMENT ON TABLE notification_preferences IS 'Préférences de notifications des utilisateurs';
COMMENT ON COLUMN student_notifications.type IS 'Type de notification: daily_challenge, streak_reminder, badge_earned, peer_review, new_module, ai_nudge';
COMMENT ON COLUMN notification_preferences.notification_types_enabled IS 'JSONB object avec les types de notifications activés pour chaque catégorie';
COMMENT ON COLUMN notification_preferences.email_digest_frequency IS 'Fréquence des digests email: immediate, daily, weekly, off';
COMMENT ON COLUMN notification_preferences.preferred_notification_time IS 'Heure préférée pour recevoir les notifications de streak (format TIME)';
