# 🚀 Guide de Démarrage Rapide - Authentification Optimisée

Ce guide vous permet de mettre en place le système d'authentification optimisé en **moins de 10 minutes**.

## ⏱️ Temps estimé : 10 minutes

---

## Étape 1 : Configuration Supabase (3 minutes)

### 1.1 Activer la Confirmation d'Email

1. Connectez-vous à [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** → **Settings** → **Email Auth**
4. Activez **"Enable email confirmations"**
5. Cliquez sur **Save**

✅ **Checkpoint** : La confirmation d'email est activée

---

### 1.2 Configurer les URL de Redirection

1. Dans **Authentication** → **URL Configuration**
2. Ajoutez ces URLs dans **Redirect URLs** :

```
http://localhost:5173/verify-email
http://localhost:5173/reset-password
```

3. Cliquez sur **Save**

✅ **Checkpoint** : Les URLs sont configurées

---

### 1.3 Personnaliser les Templates d'Email (Optionnel)

1. Allez dans **Authentication** → **Email Templates**
2. Sélectionnez **"Confirm signup"**
3. Personnalisez le sujet et le contenu (voir templates ci-dessous)
4. Répétez pour **"Reset password"**

**Template "Confirm signup"** :
```
Sujet : Confirmez votre inscription à OUTILTECH

Corps :
Bienvenue sur OUTILTECH ! 🌾

Pour activer votre compte, cliquez sur le lien ci-dessous :
{{ .ConfirmationURL }}

Ce lien expire dans 24 heures.

L'équipe OUTILTECH
```

**Template "Reset password"** :
```
Sujet : Réinitialisation de votre mot de passe

Corps :
Vous avez demandé à réinitialiser votre mot de passe.
Cliquez sur le lien ci-dessous :
{{ .ConfirmationURL }}

Ce lien expire dans 1 heure.

L'équipe OUTILTECH
```

✅ **Checkpoint** : Les templates sont configurés

---

### 1.4 Exécuter le Script SQL

1. Allez dans **SQL Editor**
2. Cliquez sur **New query**
3. Copiez le contenu de `supabase_email_auth_setup.sql`
4. Cliquez sur **Run**
5. Vérifiez qu'il n'y a pas d'erreurs

✅ **Checkpoint** : Le script SQL est exécuté

---

## Étape 2 : Configuration Locale (2 minutes)

### 2.1 Vérifier les Variables d'Environnement

Ouvrez votre fichier `.env` et vérifiez :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

✅ **Checkpoint** : Les variables sont configurées

---

### 2.2 Installer les Dépendances

```bash
npm install
```

✅ **Checkpoint** : Les dépendances sont installées

---

## Étape 3 : Test (5 minutes)

### 3.1 Démarrer le Serveur

```bash
npm run dev
```

Ouvrez http://localhost:5173

✅ **Checkpoint** : Le serveur est démarré

---

### 3.2 Tester l'Inscription

1. Allez sur http://localhost:5173/register
2. Remplissez le formulaire :
   - Nom : **Test User**
   - Email : **votre-email@example.com** (utilisez un vrai email !)
   - Téléphone : **77 000 00 00**
   - Mot de passe : **Test123!@#**
3. Observez l'indicateur de force du mot de passe
4. Cliquez sur **Créer mon compte**

✅ **Checkpoint** : Le formulaire est soumis

---

### 3.3 Vérifier l'Email

1. Vérifiez votre boîte email
2. Ouvrez l'email de OUTILTECH
3. Cliquez sur le lien de confirmation
4. Vous devriez être redirigé vers le dashboard

✅ **Checkpoint** : L'email est vérifié

---

### 3.4 Tester la Réinitialisation

1. Déconnectez-vous
2. Allez sur http://localhost:5173/forgot-password
3. Entrez votre email
4. Cliquez sur **Envoyer le lien**
5. Vérifiez votre email
6. Cliquez sur le lien de réinitialisation
7. Définissez un nouveau mot de passe
8. Connectez-vous avec le nouveau mot de passe

✅ **Checkpoint** : La réinitialisation fonctionne

---

## 🎉 Félicitations !

Votre système d'authentification optimisé est maintenant opérationnel !

---

## 📋 Checklist Finale

- [x] Confirmation d'email activée dans Supabase
- [x] URLs de redirection configurées
- [x] Templates d'email personnalisés (optionnel)
- [x] Script SQL exécuté
- [x] Variables d'environnement configurées
- [x] Dépendances installées
- [x] Serveur démarré
- [x] Inscription testée
- [x] Email vérifié
- [x] Réinitialisation testée

---

## 🐛 Problèmes Courants

### L'email n'arrive pas

**Solution** :
1. Vérifiez le dossier spam
2. Vérifiez que l'email est bien configuré dans Supabase
3. Utilisez le bouton "Renvoyer l'email"

### Le lien de confirmation ne fonctionne pas

**Solution** :
1. Vérifiez que les URLs de redirection sont correctes
2. Vérifiez que le lien n'a pas expiré (24h)
3. Demandez un nouveau lien

### Erreur "Invalid session"

**Solution** :
1. Le lien a peut-être expiré
2. Demandez un nouveau lien de réinitialisation
3. Vérifiez la configuration Supabase

### Le mot de passe n'est pas accepté

**Solution** :
1. Vérifiez que le mot de passe respecte tous les critères :
   - Au moins 8 caractères
   - Une majuscule
   - Une minuscule
   - Un chiffre
   - Un caractère spécial
2. Observez l'indicateur de force

---

## 📚 Ressources

### Documentation
- [Guide Complet](./AUTHENTICATION_GUIDE.md)
- [Guide Visuel](./VISUAL_GUIDE.md)
- [Plan de Tests](./TESTING_PLAN.md)
- [Changelog](./CHANGELOG.md)

### Liens Utiles
- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Email Templates Supabase](https://supabase.com/docs/guides/auth/auth-email-templates)

---

## 🆘 Support

Besoin d'aide ?

- 📧 Email : outiltech@grainotech.com
- 📱 Téléphone : +225 07 77 00 00 00
- 🌐 Site : [www.grainotech.com](https://www.grainotech.com)

---

## 🎯 Prochaines Étapes

Maintenant que votre authentification est configurée, vous pouvez :

1. **Personnaliser les templates d'email** avec votre branding
2. **Configurer l'authentification 2FA** (optionnel)
3. **Ajouter des connexions sociales** (Google, Facebook)
4. **Déployer en production** avec les URLs de production

---

**Temps total écoulé** : ~10 minutes ⏱️

**Développé avec ❤️ par Grainotech SAS**
