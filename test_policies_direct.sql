-- Test direct des policies RLS
-- À exécuter dans l'éditeur SQL Supabase

-- 1. Vérifier combien de profils existent au total (sans RLS)
set row_security = off;
select count(*) as total_profiles from public.user_profiles;
set row_security = on;

-- 2. Vérifier combien de profils sont accessibles avec RLS activé
select count(*) as accessible_profiles from public.user_profiles;

-- 3. Lister tous les profils accessibles
select 
  user_id,
  email,
  display_name,
  role,
  created_at
from public.user_profiles
order by created_at;

-- 4. Tester la condition admin directement
select 
  auth.uid() as current_uid,
  coalesce(
    auth.jwt()->>'role',
    auth.jwt()->'app_metadata'->>'role',
    ''
  ) as admin_check,
  case 
    when coalesce(
      auth.jwt()->>'role',
      auth.jwt()->'app_metadata'->>'role',
      ''
    ) = 'admin' then 'ADMIN_DETECTED'
    else 'NOT_ADMIN'
  end as admin_status;

-- 5. Vérifier les policies actives
select 
  policyname, 
  cmd, 
  permissive,
  roles,
  qual 
from pg_policies 
where tablename = 'user_profiles' 
order by policyname;
