-- ============================================
-- SCRIPT D'INITIALISATION DES COMPTES DE BASE
-- VERSION CORRIGÉE
-- ============================================

-- Cette fonction configure les comptes après leur création dans Supabase Auth
CREATE OR REPLACE FUNCTION setup_demo_accounts()
RETURNS void AS $$
DECLARE
    v_admin_id UUID;
    v_student_id UUID;
    v_demo_id UUID;
BEGIN
    -- Récupérer les IDs des utilisateurs
    SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@geniawebtraining.com';
    SELECT id INTO v_student_id FROM auth.users WHERE email = 'student@geniawebtraining.com';
    SELECT id INTO v_demo_id FROM auth.users WHERE email = 'demo@geniawebtraining.com';
    
    -- Si les comptes n'existent pas, afficher un message
    IF v_admin_id IS NULL OR v_student_id IS NULL OR v_demo_id IS NULL THEN
        RAISE NOTICE 'Créez d''abord les comptes dans Supabase Auth avec ces emails:';
        RAISE NOTICE '- admin@geniawebtraining.com (Password: AdminGenia2025!)';
        RAISE NOTICE '- student@geniawebtraining.com (Password: Test@2025!)';
        RAISE NOTICE '- demo@geniawebtraining.com (Password: Demo@2025!)';
        RETURN;
    END IF;
    
    -- Configurer le compte admin
    IF v_admin_id IS NOT NULL THEN
        -- Mettre à jour le rôle dans user_profiles
        UPDATE user_profiles 
        SET 
            role = 'admin',
            display_name = 'Administrateur GENIA',
            bio = 'Administrateur de la plateforme GENIA Web Training',
            onboarding_completed = true,
            updated_at = NOW()
        WHERE user_id = v_admin_id;
        
        -- Mettre à jour les points
        UPDATE user_points 
        SET 
            total_points = 1000,
            level = 10,
            updated_at = NOW()
        WHERE user_id = v_admin_id;
        
        -- Initialiser la progression GENIA
        INSERT INTO user_progress_genia (
            user_id, 
            current_level, 
            total_messages, 
            exercises_completed,
            exercises_succeeded,
            average_score
        )
        VALUES (v_admin_id, 'advanced', 100, 50, 45, 90.0)
        ON CONFLICT (user_id) DO UPDATE
        SET 
            current_level = EXCLUDED.current_level,
            total_messages = EXCLUDED.total_messages,
            exercises_completed = EXCLUDED.exercises_completed,
            exercises_succeeded = EXCLUDED.exercises_succeeded,
            average_score = EXCLUDED.average_score,
            updated_at = NOW();
        
        RAISE NOTICE 'Compte admin configuré: %', v_admin_id;
    END IF;
    
    -- Configurer le compte étudiant test
    IF v_student_id IS NOT NULL THEN
        UPDATE user_profiles 
        SET 
            display_name = 'Étudiant Test',
            bio = 'Compte test pour les étudiants',
            onboarding_completed = false,
            updated_at = NOW()
        WHERE user_id = v_student_id;
        
        -- Initialiser la progression GENIA
        INSERT INTO user_progress_genia (user_id)
        VALUES (v_student_id)
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Compte étudiant configuré: %', v_student_id;
    END IF;
    
    -- Configurer le compte démo avec des données
    IF v_demo_id IS NOT NULL THEN
        UPDATE user_profiles 
        SET 
            display_name = 'Compte Démo',
            bio = 'Compte de démonstration avec données exemples',
            onboarding_completed = true,
            updated_at = NOW()
        WHERE user_id = v_demo_id;
        
        UPDATE user_points 
        SET 
            total_points = 250,
            level = 3,
            streak_days = 7,
            updated_at = NOW()
        WHERE user_id = v_demo_id;
        
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
        SET 
            current_level = EXCLUDED.current_level,
            total_messages = EXCLUDED.total_messages,
            exercises_completed = EXCLUDED.exercises_completed,
            exercises_succeeded = EXCLUDED.exercises_succeeded,
            average_score = EXCLUDED.average_score,
            streak_days = EXCLUDED.streak_days,
            updated_at = NOW();
        
        RAISE NOTICE 'Compte démo configuré: %', v_demo_id;
    END IF;
    
    RAISE NOTICE 'Configuration terminée !';
END;
$$ LANGUAGE plpgsql;

-- NE PAS EXÉCUTER AUTOMATIQUEMENT
-- Cette fonction sera appelée APRÈS la création des comptes dans Supabase Auth

-- Pour vérifier les comptes après configuration :
-- SELECT 
--     au.email,
--     up.role,
--     up.display_name,
--     upg.current_level,
--     upo.total_points,
--     upo.level as user_level
-- FROM auth.users au
-- LEFT JOIN user_profiles up ON au.id = up.user_id
-- LEFT JOIN user_progress_genia upg ON au.id = upg.user_id
-- LEFT JOIN user_points upo ON au.id = upo.user_id
-- WHERE au.email IN (
--     'admin@geniawebtraining.com',
--     'student@geniawebtraining.com',
--     'demo@geniawebtraining.com'
-- );