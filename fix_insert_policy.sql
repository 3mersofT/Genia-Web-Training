-- Corriger la policy INSERT qui a qual = NULL
-- À exécuter dans l'éditeur SQL Supabase

-- Supprimer et recréer la policy INSERT
drop policy if exists "admin_can_insert_all" on public.user_profiles;

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

-- Vérifier que la policy est bien créée
select 
  policyname, 
  cmd, 
  qual 
from pg_policies 
where tablename = 'user_profiles' 
and policyname = 'admin_can_insert_all';
