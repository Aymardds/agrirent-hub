# 🚀 DÉPLOIEMENT VERCEL - GUIDE INTERACTIF

**Projet:** OUTILTECH  
**Date:** $(date)  
**Statut:** ✅ Code committé et poussé sur GitHub

---

## 📋 INSTRUCTIONS ÉTAPE PAR ÉTAPE

### ÉTAPE 1️⃣ : Accéder à Vercel

1. **Ouvrez votre navigateur**
2. **Allez sur** : [https://vercel.com](https://vercel.com)
3. **Cliquez sur** "Sign Up" ou "Log In"
4. **Connectez-vous avec GitHub** (recommandé)

✅ **Checkpoint** : Vous êtes sur le dashboard Vercel

---

### ÉTAPE 2️⃣ : Créer un nouveau projet

1. **Cliquez sur** "Add New..." → "Project"
2. **Cherchez** "agrirent-hub" dans la liste des dépôts
3. **Cliquez sur** "Import" à côté du dépôt

✅ **Checkpoint** : Vous êtes sur la page de configuration du projet

---

### ÉTAPE 3️⃣ : Configuration du projet

**Configure Project** :

#### A. Project Name (Optionnel)
```
outiltech
```

#### B. Framework Preset
```
Vite
```
(Doit être détecté automatiquement ✓)

#### C. Root Directory
```
./
```
(Laisser par défaut ✓)

#### D. Build and Output Settings
NE TOUCHEZ PAS ! Vercel détecte automatiquement grâce à `vercel.json` :
- ✓ Build Command: `npm run build`
- ✓ Output Directory: `dist`
- ✓ Install Command: `npm install`

✅ **Checkpoint** : Configuration de base OK

---

### ÉTAPE 4️⃣ : Variables d'environnement (CRUCIAL !)

**Cliquez sur "Environment Variables"** (dérouler si fermé)

**Ajoutez ces 4 variables UNE PAR UNE :**

#### Variable 1 : VITE_SUPABASE_URL
```
Key: VITE_SUPABASE_URL
Value: https://xztvxhuvmwlurkljsqhx.supabase.co
Environment: Production ✓
```
→ Cliquez "Add"

#### Variable 2 : VITE_SUPABASE_ANON_KEY
```
Key: VITE_SUPABASE_ANON_KEY
Value: [Copiez depuis votre fichier .env local]
Environment: Production ✓
```
→ Cliquez "Add"

#### Variable 3 : VITE_CINETPAY_API_KEY
```
Key: VITE_CINETPAY_API_KEY
Value: [Copiez depuis votre fichier .env local]
Environment: Production ✓
```
→ Cliquez "Add"

#### Variable 4 : VITE_CINETPAY_SITE_ID
```
Key: VITE_CINETPAY_SITE_ID
Value: [Copiez depuis votre fichier .env local]
Environment: Production ✓
```
→ Cliquez "Add"

⚠️ **IMPORTANT** : 
- Vérifiez qu'il n'y a PAS d'espaces avant ou après les valeurs
- Les 4 variables doivent être en "Production"
- Copiez les valeurs EXACTEMENT depuis votre `.env`

✅ **Checkpoint** : 4 variables d'environnement ajoutées

---

### ÉTAPE 5️⃣ : Déployer !

1. **Vérifiez** que tout est configuré :
   - ✓ Framework: Vite
   - ✓ 4 variables d'environnement
   
2. **Cliquez sur le gros bouton "Deploy"** 🚀

3. **Attendez 2-3 minutes**... ☕

   Vous verrez :
   - ⏳ Building...
   - ⏳ Deploying...
   - 🎉 Congratulations!

✅ **Checkpoint** : Déploiement terminé !

---

### ÉTAPE 6️⃣ : Vérifier le déploiement

1. **Notez votre URL** (ex: `outiltech.vercel.app`)
2. **Cliquez sur "Visit"** pour ouvrir votre site
3. **Vérifiez** :
   - [ ] Le site se charge
   - [ ] Pas d'erreurs (F12 → Console)
   - [ ] Le catalogue s'affiche

✅ **Checkpoint** : Site accessible en ligne !

---

## 🌐 CONFIGURATION DOMAINE PERSONNALISÉ (Optionnel)

### Pour utiliser `outiltech.grainotech.com` :

#### A. Dans Vercel :

1. **Allez dans** : Settings → Domains
2. **Cliquez sur** "Add Domain"
3. **Entrez** : `outiltech.grainotech.com`
4. **Cliquez sur** "Add"

Vercel vous montrera les enregistrements DNS à configurer.

#### B. Dans votre gestionnaire DNS (Grainotech) :

**Ajoutez un enregistrement CNAME :**

```
Type: CNAME
Name/Host: outiltech
Value/Points to: cname.vercel-dns.com
TTL: 3600
```

**OU si Vercel demande un enregistrement A :**

```
Type: A
Name/Host: outiltech
Value/IP: 76.76.21.21
TTL: 3600
```

#### C. Vérification :

1. **Attendez** 5-30 minutes (parfois jusqu'à 48h)
2. **Vérifiez** : `https://outiltech.grainotech.com`
3. **HTTPS** sera configuré automatiquement par Vercel

✅ **Checkpoint** : Domaine personnalisé configuré

---

## 🔐 CONFIGURATION SUPABASE (CRITIQUE !)

**⚠️ Sans cela, l'authentification NE fonctionnera PAS !**

### Étapes :

1. **Ouvrez** : [https://app.supabase.com](https://app.supabase.com)
2. **Sélectionnez** votre projet
3. **Allez dans** : Authentication → URL Configuration

#### A. Site URL :

```
https://outiltech.vercel.app
(ou https://outiltech.grainotech.com si domaine configuré)
```

#### B. Redirect URLs (Ajoutez ces 3 lignes) :

**Si vous utilisez l'URL Vercel :**
```
https://outiltech.vercel.app
https://outiltech.vercel.app/auth/callback
https://outiltech.vercel.app/dashboard
```

**Si vous utilisez le domaine personnalisé, ajoutez AUSSI :**
```
https://outiltech.grainotech.com
https://outiltech.grainotech.com/auth/callback
https://outiltech.grainotech.com/dashboard
```

4. **Cliquez sur** "Save"

✅ **Checkpoint** : Supabase configuré pour la production

---

## 🧪 TESTS FINAUX

### Test 1 : Chargement du site
- [ ] Le site se charge en HTTPS
- [ ] Pas d'erreurs dans la console (F12)
- [ ] Les images se chargent
- [ ] Le catalogue s'affiche

### Test 2 : Authentification
- [ ] Créer un nouveau compte
- [ ] Recevoir l'email de confirmation
- [ ] Confirmer le compte
- [ ] Se connecter
- [ ] Accéder au dashboard

### Test 3 : Navigation
- [ ] Toutes les pages fonctionnent
- [ ] Le menu fonctionne
- [ ] Les liens vers Grainotech fonctionnent

---

## ✅ CHECKLIST FINALE

- [ ] Code committé et poussé sur GitHub
- [ ] Projet importé dans Vercel
- [ ] 4 variables d'environnement configurées
- [ ] Déploiement réussi
- [ ] Site accessible en ligne
- [ ] (Optionnel) Domaine personnalisé configuré
- [ ] Supabase configuré avec les bonnes URLs
- [ ] Tests de base passés
- [ ] Authentification fonctionne

---

## 📊 INFORMATIONS IMPORTANTES

**Notez ces informations :**

- URL Vercel : _______________________
- URL domaine : _______________________
- Date de déploiement : _______________________
- Version (commit) : _______________________

---

## 🔄 DÉPLOIEMENT AUTOMATIQUE

Maintenant configuré ! ✅

Chaque fois que vous pousserez sur GitHub :
- 🟢 **Branch `main`** → Déploiement en PRODUCTION
- 🟡 **Autres branches** → Déploiement de PREVIEW

---

## 🆘 PROBLÈMES COURANTS

### Le build échoue
→ Vérifiez les logs dans Vercel
→ Vérifiez les variables d'environnement

### L'authentification ne fonctionne pas
→ Avez-vous configuré Supabase ? (Section Configuration Supabase)
→ Vérifiez les variables VITE_SUPABASE_*

### Erreur 404 sur les routes
→ Vérifiez que `vercel.json` existe dans le repo
→ Redéployez

### Variables d'environnement non reconnues
→ Redéployez après avoir ajouté les variables
→ Deployments → ⋯ → Redeploy

---

## 📞 SUPPORT

**Questions ?**
- Email : outiltech@grainotech.com
- Tél : +225 07 77 00 00 00

**Documentation :**
- Vercel : [vercel.com/docs](https://vercel.com/docs)
- Supabase : [supabase.com/docs](https://supabase.com/docs)

---

## 🎉 FÉLICITATIONS !

Une fois toutes les étapes complétées, votre application **OUTILTECH** sera :
- ✅ En ligne 24/7
- ✅ Sécurisée (HTTPS)
- ✅ Déployée automatiquement
- ✅ Prête pour vos utilisateurs

---

**Développé avec ❤️ par Grainotech SAS**  
**www.grainotech.com**
