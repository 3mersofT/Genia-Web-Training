# Guide de Débogage des Permissions Supabase (RLS)

Ce document résume les leçons apprises lors du débogage d'une erreur persistante `"permission denied for table ..."` sur Supabase.

## Le Principe : 3 Niveaux de Sécurité à Vérifier

Lorsqu'un utilisateur authentifié ne peut pas accéder à des données, il faut vérifier 3 niveaux de sécurité dans l'ordre suivant. Une erreur à un niveau supérieur rendra les niveaux inférieurs inaccessibles.

---

### Niveau 1 : Permissions de la Table (`GRANT`)

C'est la porte d'entrée de l'immeuble. Si elle est fermée, personne ne peut accéder aux étages, même avec la bonne clé d'appartement.

**Problème typique :** Le rôle de base de l'utilisateur (ex: `authenticated`) n'a pas la permission `SELECT` (lecture) sur la table.

**Diagnostic :**
L'erreur `"permission denied for table ..."` persiste même après avoir mis en place une politique RLS ultra-permissive (`USING (true)`).

**Solution (Migration SQL) :**
Il faut explicitement donner la permission au groupe concerné.

```sql
-- Donne la permission de lecture (SELECT) sur la table 'ma_table'
-- au groupe de tous les utilisateurs connectés ('authenticated').
GRANT SELECT ON TABLE public.ma_table TO authenticated;
```

---

### Niveau 2 : Politiques de Sécurité au Niveau des Lignes (RLS)

Ce sont les clés des appartements. Une fois dans l'immeuble, elles déterminent quels appartements (lignes) un utilisateur a le droit de voir ou de modifier.

**Problème typique :** Une politique RLS est trop restrictive, contient une erreur logique, ou (pire) crée une **boucle de récursion**.

**Exemple de récursion (à ne PAS faire) :**
Une politique sur la table `user_profiles` qui, pour vérifier si un utilisateur est admin, lit... dans la table `user_profiles`.

```sql
-- MAUVAISE PRATIQUE - CRÉE UNE RÉCURSION
CREATE POLICY "Admin access" ON user_profiles
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

**Solution :**
La politique doit baser sa décision sur des informations qui ne nécessitent pas de lire la table qu'elle protège. La meilleure source est le "passeport" de session de l'utilisateur : le **JWT**.

---

### Niveau 3 : Vérification du Rôle via le JWT

C'est la vérification de la mention "VIP" sur le passeport de l'utilisateur. C'est la méthode la plus sûre pour vérifier des permissions comme le statut "admin".

**Problème typique :** La fonction SQL qui lit le JWT ne regarde pas au bon endroit.

**Diagnostic :**
Créer une fonction de débogage temporaire pour voir le contenu exact du JWT tel que la base de données le voit.

```sql
-- Fonction de débogage temporaire
CREATE OR REPLACE FUNCTION public.debug_jwt() RETURNS jsonb AS $$
  RETURN auth.jwt();
$$ LANGUAGE plpgsql;
```
Appeler cette fonction depuis l'application (`supabase.rpc('debug_jwt')`) pour voir la structure JSON.

**Exemple de JWT :**
```json
{
  "role": "authenticated",
  "app_metadata": {
    "role": "admin"
  }
}
```

**Solution (Fonction SQL) :**
Écrire une fonction qui lit le rôle au bon endroit (`app_metadata` dans ce cas) et l'utiliser dans les politiques RLS.

```sql
-- BONNE PRATIQUE - PAS DE RÉCURSION
CREATE OR REPLACE FUNCTION public.get_role_from_jwt() RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt()->'app_metadata'->>'role', -- Chemin correct
    'authenticated'
  );
END;
$$ LANGUAGE plpgsql;

-- Utilisation dans une politique
CREATE POLICY "Admin access" ON user_profiles
USING (public.get_role_from_jwt() = 'admin');
```
