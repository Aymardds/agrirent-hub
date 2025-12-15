# 🔧 Guide de Résolution - Problème Super Admin

## Diagnostic du Problème

Le système Super Admin ne fonctionne pas correctement. Voici les causes possibles et leurs solutions.

## ✅ Solution 1: Vérifier et Corriger le Rôle dans Supabase

### Étape 1: Accéder à la Page de Debug
1. Connectez-vous à l'application
2. Allez sur: `http://localhost:5173/dashboard/debug-role`
3. Vérifiez les informations affichées:
   - **Rôle brut**: Ce qui est stocké dans Supabase
   - **Rôle normalisé**: Ce que l'app utilise

### Étape 2: Corriger le Rôle dans Supabase
1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor**
3. **Option A - Vérifier d'abord:**
   ```sql
   SELECT 
       email,
       raw_user_meta_data->>'role' as role,
       raw_user_meta_data->>'full_name' as full_name
   FROM auth.users
   ORDER BY created_at DESC;
   ```

4. **Option B - Corriger votre compte:**
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_set(
       raw_user_meta_data,
       '{role}',
       '"super_admin"'
   )
   WHERE email = 'VOTRE_EMAIL@example.com';
   ```
   ⚠️ **IMPORTANT**: Remplacez `VOTRE_EMAIL@example.com` par votre vraie adresse email!

5. **Vérifier la mise à jour:**
   ```sql
   SELECT 
       email,
       raw_user_meta_data->>'role' as role
   FROM auth.users
   WHERE email = 'VOTRE_EMAIL@example.com';
   ```

### Étape 3: Déconnexion / Reconnexion
1. Déconnectez-vous de l'application
2. Fermez tous les onglets
3. Reconnectez-vous
4. Le système devrait maintenant reconnaître votre rôle Super Admin

## ✅ Solution 2: Vérifier les Variantes de Rôle Acceptées

Le système normalise automatiquement ces variantes:
- ✅ `super_admin` (RECOMMANDÉ)
- ✅ `Super Admin`
- ✅ `SUPER_ADMIN`
- ✅ `super admin`

**Si vous utilisez autre chose**, le système peut ne pas reconnaître le rôle.

## ✅ Solution 3: Architecture Mise à Jour

### Normalisation Centralisée
Nous avons créé un système de normalisation centralisé dans `/src/lib/roleUtils.ts`:
- ✅ Gère les variantes FR/EN
- ✅ Gère les espaces et la casse
- ✅ Utilisé partout dans l'app

### Routes Protégées Améliorées
- ✅ Super Admin a accès à TOUT
- ✅ Vérification cohérente dans `ProtectedRoute.tsx`
- ✅ Redirection intelligente dans `Dashboard.tsx`

## 🎯 Menu Sidebar Super Admin

Après correction, le Super Admin devrait voir:
- ✅ Tableau de bord
- ✅ Utilisateurs
- ✅ Matériels
- ✅ Locations
- ✅ Interventions
- ✅ Statistiques
- ✅ Facturation
- ✅ Paramètres

## 📝 Checklist de Vérification

- [ ] Page de debug accessible (`/dashboard/debug-role`)
- [ ] Rôle brut = `super_admin` (ou variante acceptée)
- [ ] Rôle normalisé = `super_admin`
- [ ] Menu sidebar affiche les 8 items Super Admin
- [ ] Accès à `/dashboard/users` fonctionne
- [ ] Accès à `/dashboard/interventions` fonctionne
- [ ] Pas de redirection vers dashboard client/technician

## 🚀 Scripts SQL Fournis

Utilisez le fichier `supabase_fix_roles.sql` qui contient:
1. Requêtes de diagnostic
2. Scripts de correction de rôles
3. Mise à jour en masse
4. Statistiques des rôles

## ⚠️ Problèmes Courants

### Problème 1: "Client" menu apparaît au lieu de "Super Admin"
**Cause**: Rôle mal configuré ou NULL dans Supabase
**Solution**: Exécuter la requête SQL de correction (Option B ci-dessus)

### Problème 2: Redirection vers `/dashboard/client`
**Cause**: Normalisation détecte le rôle comme "client"
**Solution**: Vérifier avec `/dashboard/debug-role` et corriger dans Supabase

### Problème 3: Accès refusé aux routes admin
**Cause**: `ProtectedRoute` ne reconnaît pas le rôle
**Solution**: Assurez-vous que le rôle est exactement `super_admin` (snake_case, minuscules)

## 🔄 Après Toute Modification SQL

**TOUJOURS faire:**
1. Déconnexion de l'application
2. Vider le cache du navigateur (Cmd/Ctrl + Shift + R)
3. Reconnexion
4. Vérifier `/dashboard/debug-role`

## 📞 Besoin d'Aide Supplémentaire?

Si le problème persiste:
1. Accédez à `/dashboard/debug-role`
2. Faites une capture d'écran complète
3. Vérifiez la console du navigateur (F12) pour des erreurs
4. Vérifiez que `npm run dev` fonctionne sans erreurs

## ✨ Nouveautés Implémentées

- ✅ Normalisation centralisée des rôles
- ✅ Page de debug interactive
- ✅ Scripts SQL de diagnostic
- ✅ Dashboards dédiés par rôle
- ✅ Protection renforcée des routes
- ✅ Super Admin a accès universel garanti
