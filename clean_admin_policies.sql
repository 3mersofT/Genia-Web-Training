-- Nettoyage complet des policies RLS et recréation propre
-- À exécuter dans l'éditeur SQL Supabase

-- 1. SUPPRIMER TOUTES les policies existantes
drop policy if exists "Read own or admin" on public.user_profiles;
drop policy if exists "Update own or admin" on public.user_profiles;
drop policy if exists "Insert self or admin" on public.user_profiles;
drop policy if exists "Delete admin only" on public.user_profiles;
drop policy if exists "Select own or jwt admin" on public.user_profiles;
drop policy if exists "Update own or jwt admin" on public.user_profiles;
drop policy if exists "Insert self or jwt admin" on public.user_profiles;
drop policy if exists "Delete own or jwt admin" on public.user_profiles;

-- 2. Vérifier qu'il n'y a plus de policies
select count(*) as policy_count from pg_policies where tablename = 'user_profiles';

-- 3. Recréer UNIQUEMENT les policies nécessaires
-- SELECT: son profil OU admin (peut voir tous)
create policy "admin_can_see_all"
on public.user_profiles
for select
to authenticated
using (
  user_id = auth.uid()  -- Son propre profil
  or 
  coalesce(
    auth.jwt()->>'role',
    auth.jwt()->'app_metadata'->>'role',
    ''
  ) = 'admin'  -- OU admin (peut voir tous)
);

-- UPDATE: son profil OU admin (peut modifier tous)
create policy "admin_can_update_all"
on public.user_profiles
for update
to authenticated
using (
  user_id = auth.uid()  -- Son propre profil
  or 
  coalesce(
    auth.jwt()->>'role',
    auth.jwt()->'app_metadata'->>'role',
    ''
  ) = 'admin'  -- OU admin (peut modifier tous)
)
with check (
  user_id = auth.uid()  -- Son propre profil
  or 
  coalesce(
    auth.jwt()->>'role',
    auth.jwt()->'app_metadata'->>'role',
    ''
  ) = 'admin'  -- OU admin (peut modifier tous)
);

-- INSERT: son profil OU admin (peut créer pour tous)
create policy "admin_can_insert_all"
on public.user_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()  -- Son propre profil
  or 
  coalesce(
    auth.jwt()->>'role',
    auth.jwt()->'app_metadata'->>'role',
    ''
  ) = 'admin'  -- OU admin (peut créer pour tous)
);

-- DELETE: admin uniquement (peut supprimer tous)
create policy "admin_can_delete_all"
on public.user_profiles
for delete
to authenticated
using (
  coalesce(
    auth.jwt()->>'role',
    auth.jwt()->'app_metadata'->>'role',
    ''
  ) = 'admin'  -- Admin uniquement
);

-- 4. Vérifier les nouvelles policies
select 
  policyname, 
  cmd, 
  qual 
from pg_policies 
where tablename = 'user_profiles' 
order by policyname;
