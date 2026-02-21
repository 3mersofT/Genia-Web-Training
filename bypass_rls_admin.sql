-- Solution alternative : bypass RLS pour les admins
-- À exécuter dans l'éditeur SQL Supabase

-- 1. Créer une fonction qui vérifie si l'utilisateur est admin
create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 
    from auth.users 
    where id = auth.uid() 
    and (
      raw_app_meta_data->>'role' = 'admin'
      or raw_user_meta_data->>'role' = 'admin'
    )
  );
$$;

-- 2. Accorder les privilèges à la fonction
grant execute on function public.is_admin_user() to authenticated;

-- 3. Créer des policies basées sur cette fonction
drop policy if exists "admin_can_see_all" on public.user_profiles;
drop policy if exists "admin_can_update_all" on public.user_profiles;
drop policy if exists "admin_can_insert_all" on public.user_profiles;
drop policy if exists "admin_can_delete_all" on public.user_profiles;

-- SELECT: son profil OU admin (via fonction)
create policy "admin_can_see_all"
on public.user_profiles
for select
to authenticated
using (
  user_id = auth.uid() or public.is_admin_user()
);

-- UPDATE: son profil OU admin (via fonction)
create policy "admin_can_update_all"
on public.user_profiles
for update
to authenticated
using (
  user_id = auth.uid() or public.is_admin_user()
)
with check (
  user_id = auth.uid() or public.is_admin_user()
);

-- INSERT: son profil OU admin (via fonction)
create policy "admin_can_insert_all"
on public.user_profiles
for insert
to authenticated
with check (
  user_id = auth.uid() or public.is_admin_user()
);

-- DELETE: admin uniquement (via fonction)
create policy "admin_can_delete_all"
on public.user_profiles
for delete
to authenticated
using (
  public.is_admin_user()
);

-- 4. Tester la fonction
select 
  auth.uid() as current_uid,
  public.is_admin_user() as is_admin_via_function;
