-- Correction des policies RLS pour permettre à l'admin de voir tous les profils
-- À exécuter dans l'éditeur SQL Supabase

-- 1. Nettoyer les anciennes policies
drop policy if exists "Read own or admin"   on public.user_profiles;
drop policy if exists "Update own or admin" on public.user_profiles;
drop policy if exists "Insert self or admin" on public.user_profiles;
drop policy if exists "Delete admin only"    on public.user_profiles;

-- 2. Créer les nouvelles policies avec la bonne logique
-- SELECT: son propre profil OU admin (peut voir tous)
create policy "Read own or admin"
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

-- UPDATE: son propre profil OU admin (peut modifier tous)
create policy "Update own or admin"
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

-- INSERT: son propre profil OU admin (peut créer pour tous)
create policy "Insert self or admin"
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
create policy "Delete admin only"
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

-- 3. Vérifier que les policies sont bien créées
select 
  policyname, 
  cmd, 
  qual 
from pg_policies 
where tablename = 'user_profiles' 
order by policyname;
