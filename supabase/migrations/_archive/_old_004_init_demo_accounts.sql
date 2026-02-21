-- ============================================
-- SCRIPT D'INITIALISATION DES COMPTES DE BASE
-- À exécuter après la création des migrations
-- ============================================

-- Insérer les comptes via l'interface Supabase Auth d'abord, puis exécuter ce script

-- Fonction pour créer les données de test
CREATE OR REPLACE FUNCTION setup_demo_accounts()
RETURNS void AS $$
DECLARE
    v_admin_id UUID;
    v_student_id UUID;
    v_demo_id UUID;
BEGIN
    -- Récupérer les IDs des utilisateurs (ils doivent être créés dans Supabase Auth d'abord)
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@geniawebtraining.com';
    SELECT id INTO v_student_id FROM auth.users WHERE email = 'student@geniawebtraining.com';
    SELECT id INTO v_demo_id FROM auth.users WHERE email = 'demo@geniawebtraining.com';
    
    -- Si les comptes n'existent pas, afficher un message
    IF v_admin_id IS NULL OR v_student_id IS NULL OR v_demo_id IS NULL THEN
        RAISE NOTICE 'Créez d''abord les comptes dans Supabase Auth avec ces emails:';
        RAISE NOTICE '- admin@geniawebtraining.com';
        RAISE NOTICE '- student@geniawebtraining.com';
        RAISE NOTICE '- demo@geniawebtraining.com';
        RETURN;
    END IF;
    
    -- Configurer le compte admin
    IF v_admin_id IS NOT NULL THEN
        -- Mettre à jour le rôle
        UPDATE users SET role = 'admin' WHERE id = v_admin_id;
        
        -- Créer/Mettre à jour le profil
        INSERT INTO user_profiles (user_id, display_name, bio, onboarding_completed)
        VALUES (
            v_admin_id,
            'Administrateur GENIA',
            'Administrateur de la plateforme GENIA Web Training',
            true
        )
        ON CONFLICT (user_id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            bio = EXCLUDED.bio,
            onboarding_completed = EXCLUDED.onboarding_completed;
        
        -- Initialiser les points
        INSERT INTO user_points (user_id, total_points, level)
        VALUES (v_admin_id, 1000, 10)
        ON CONFLICT (user_id) DO UPDATE
        SET total_points = EXCLUDED.total_points,
            level = EXCLUDED.level;
        
        -- Initialiser la progression GENIA
        INSERT INTO user_progress_genia (user_id, current_level, total_messages, exercises_completed)
        VALUES (v_admin_id, 'advanced', 100, 50)
        ON CONFLICT (user_id) DO UPDATE
        SET current_level = EXCLUDED.current_level,
            total_messages = EXCLUDED.total_messages,
            exercises_completed = EXCLUDED.exercises_completed;
        
        RAISE NOTICE 'Compte admin configuré: %', v_admin_id;
    END IF;
    
    -- Configurer le compte étudiant test
    IF v_student_id IS NOT NULL THEN
        INSERT INTO user_profiles (user_id, display_name, bio, onboarding_completed)
        VALUES (
            v_student_id,
            'Étudiant Test',
            'Compte test pour les étudiants',
            false
        )
        ON CONFLICT (user_id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            bio = EXCLUDED.bio;
        
        INSERT INTO user_points (user_id)
        VALUES (v_student_id)
        ON CONFLICT (user_id) DO NOTHING;
        
        INSERT INTO user_progress_genia (user_id)
        VALUES (v_student_id)
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Compte étudiant configuré: %', v_student_id;
    END IF;
    
    -- Configurer le compte démo avec des données
    IF v_demo_id IS NOT NULL THEN
        INSERT INTO user_profiles (user_id, display_name, bio, onboarding_completed)
        VALUES (
            v_demo_id,
            'Compte Démo',
            'Compte de démonstration avec données exemples',
            true
        )
        ON CONFLICT (user_id) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            bio = EXCLUDED.bio,
            onboarding_completed = EXCLUDED.onboarding_completed;
        
        INSERT INTO user_points (user_id, total_points, level, streak_days)
        VALUES (v_demo_id, 250, 3, 7)
        ON CONFLICT (user_id) DO UPDATE
        SET total_points = EXCLUDED.total_points,
            level = EXCLUDED.level,
            streak_days = EXCLUDED.streak_days;
        
        INSERT INTO user_progress_genia (
            user_id, 
            current_level, 
            total_messages, 
            exercises_completed,
            exercises_succeeded,
            average_score,
            streak_days
        )
        VALUES (v_demo_id, 'intermediate', 25, 10, 8, 80.0, 7)
        ON CONFLICT (user_id) DO UPDATE
        SET current_level = EXCLUDED.current_level,
            total_messages = EXCLUDED.total_messages,
            exercises_completed = EXCLUDED.exercises_completed,
            exercises_succeeded = EXCLUDED.exercises_succeeded,
            average_score = EXCLUDED.average_score,
            streak_days = EXCLUDED.streak_days;
        
        RAISE NOTICE 'Compte démo configuré: %', v_demo_id;
    END IF;
    
    RAISE NOTICE 'Configuration terminée !';
END;
$$ LANGUAGE plpgsql;

-- Exécuter la fonction
SELECT setup_demo_accounts();

-- Vérifier que tout est bien configuré
SELECT 
    u.email,
    u.role,
    up.display_name,
    upg.current_level,
    upo.total_points,
    upo.level as user_level
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_progress_genia upg ON u.id = upg.user_id
LEFT JOIN user_points upo ON u.id = upo.user_id
WHERE u.email IN (
    'admin@geniawebtraining.com',
    'student@geniawebtraining.com',
    'demo@geniawebtraining.com'
);