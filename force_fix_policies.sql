-- Forcer la correction des policies RLS
-- À exécuter dans l'éditeur SQL Supabase

-- 1. Supprimer TOUTES les policies existantes
drop policy if exists "admin_can_delete_all" on public.user_profiles;
drop policy if exists "admin_can_insert_all" on public.user_profiles;
drop policy if exists "admin_can_see_all" on public.user_profiles;
drop policy if exists "admin_can_update_all" on public.user_profiles;

-- 2. Vérifier qu'il n'y a plus de policies
select count(*) as remaining_policies from pg_policies where tablename = 'user_profiles';

-- 3. Recréer les policies une par une avec des noms différents
-- SELECT: son profil OU admin
create policy "select_own_or_admin"
on public.user_profiles
for select
to authenticated
using (
  user_id = auth.uid() 
  or 
  coalesce(
    auth.jwt()->>'role',
    auth.jwt()->'app_metadata'->>'role',
    ''
  ) = 'admin'
);

-- UPDATE: son profil OU admin
create policy "update_own_or_admin"
on public.user_profiles
for update
to authenticated
using (
  user_id = auth.uid() 
  or 
  coalesce(
    auth.jwt()->>'role',
    auth.jwt()->'app_metadata'->>'role',
    ''
  ) = 'admin'
)
with check (
  user_id = auth.uid() 
  or 
  coalesce(
    auth.jwt()->>'role',
    auth.jwt()->'app_metadata'->>'role',
    ''
  ) = 'admin'
);

-- INSERT: son profil OU admin
create policy "insert_own_or_admin"
on public.user_profiles
for insert
to authenticated
with check (
  user_id = auth.uid() 
  or 
  coalesce(
    auth.jwt()->>'role',
    auth.jwt()->'app_metadata'->>'role',
    ''
  ) = 'admin'
);

-- DELETE: admin uniquement
create policy "delete_admin_only"
on public.user_profiles
for delete
to authenticated
using (
  coalesce(
    auth.jwt()->>'role',
    auth.jwt()->'app_metadata'->>'role',
    ''
  ) = 'admin'
);

-- 4. Vérifier les nouvelles policies
select 
  policyname, 
  cmd, 
  qual 
from pg_policies 
where tablename = 'user_profiles' 
order by policyname;

-- 5. Test rapide
select count(*) as total_profiles from public.user_profiles;
