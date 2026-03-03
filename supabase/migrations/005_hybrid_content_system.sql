-- Migration pour l'architecture hybride JSON + Supabase
-- Création des tables pour la gestion de contenu hybride

-- Table de configuration des modules (métadonnées dynamiques)
CREATE TABLE IF NOT EXISTS public.content_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id TEXT UNIQUE NOT NULL,
  is_published BOOLEAN DEFAULT true,
  custom_order INTEGER,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  modified_by UUID REFERENCES auth.users(id)
);

-- Table de configuration système
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table d'audit pour tracer les actions admin
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'module', 'user', 'system', etc.
  target_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table de notifications pour les admins
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'info', 'warning', 'error', 'success'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table de métriques système pour monitoring
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL,
  metric_unit TEXT,
  tags JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_content_config_module_id ON public.content_config(module_id);
CREATE INDEX IF NOT EXISTS idx_content_config_published ON public.content_config(is_published);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON public.system_config(key);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.admin_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_admin_id ON public.admin_notifications(admin_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON public.system_metrics(metric_name, recorded_at);

-- RLS (Row Level Security) pour la sécurité
ALTER TABLE public.content_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins seulement
CREATE POLICY "Admins can manage content config" ON public.content_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage system config" ON public.system_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view audit log" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage notifications" ON public.admin_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view metrics" ON public.system_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Fonction pour mettre à jour automatically last_modified
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour content_config
CREATE TRIGGER update_content_config_last_modified
  BEFORE UPDATE ON public.content_config
  FOR EACH ROW
  EXECUTE FUNCTION update_last_modified();

-- Fonction pour logger automatiquement les actions admin
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Seulement pour les admins
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  ) THEN
    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_type,
      target_id,
      details
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      CASE 
        WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
        ELSE row_to_json(NEW)
      END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers d'audit pour les tables importantes
CREATE TRIGGER audit_content_config
  AFTER INSERT OR UPDATE OR DELETE ON public.content_config
  FOR EACH ROW EXECUTE FUNCTION log_admin_action();

-- Insérer quelques configurations système par défaut
INSERT INTO public.system_config (key, value, description) VALUES 
  ('maintenance_mode', 'false', 'Mode maintenance de la plateforme'),
  ('last_content_sync', NULL, 'Dernière synchronisation du contenu JSON'),
  ('max_file_upload', '10485760', 'Taille max des fichiers uploadés (10MB)'),
  ('session_timeout', '3600', 'Timeout des sessions en secondes'),
  ('backup_frequency', 'daily', 'Fréquence des backups automatiques')
ON CONFLICT (key) DO NOTHING;
