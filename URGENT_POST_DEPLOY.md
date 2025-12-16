# 🚨 ACTIONS URGENTES POST-DÉPLOIEMENT

> **À faire IMMÉDIATEMENT après le déploiement Vercel**

---

## ⚠️ ÉTAPE 1 : Configurer Supabase (CRITIQUE)

**Sans cela, l'authentification ne fonctionnera PAS !**

### 🔧 Configuration en 2 minutes

1. **Ouvrez Supabase :**
   ```
   https://app.supabase.com
   ```

2. **Sélectionnez votre projet** → **Authentication** → **URL Configuration**

3. **Site URL** - Remplacez par votre URL Vercel :
   ```
   https://votre-app.vercel.app
   ```

4. **Redirect URLs** - Ajoutez ces 3 lignes :
   ```
   https://votre-app.vercel.app
   https://votre-app.vercel.app/auth/callback
   https://votre-app.vercel.app/dashboard
   ```

5. **Cliquez sur "Save"** ✅

---

## ✅ ÉTAPE 2 : Test rapide

### Test de base (2 minutes)

1. **Ouvrez votre site** : `https://votre-app.vercel.app`

2. **Vérifiez :**
   - [ ] Le site se charge
   - [ ] Pas d'erreurs en console (F12)
   - [ ] Le catalogue s'affiche

3. **Test d'authentification :**
   - [ ] Créez un compte test
   - [ ] Vérifiez l'email de confirmation
   - [ ] Connectez-vous

---

## 🌐 ÉTAPE 3 : Domaine personnalisé (Optionnel)

### Pour utiliser outiltech.grainotech.com

**Dans Vercel :**
1. Settings → Domains
2. Add Domain : `outiltech.grainotech.com`

**Dans votre DNS :**
```
Type: CNAME
Nom: outiltech
Valeur: cname.vercel-dns.com
```

**Puis retournez dans Supabase et ajoutez :**
```
https://outiltech.grainotech.com
https://outiltech.grainotech.com/auth/callback
https://outiltech.grainotech.com/dashboard
```

---

## 🔍 Où trouver votre URL Vercel ?

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. L'URL est affichée en haut (ex: `outiltech.vercel.app`)
4. **Ou** dans "Deployments" → cliquez sur le dernier déploiement

---

## ⚡ Accès rapide

- **Vercel Dashboard** : https://vercel.com/dashboard
- **Supabase Dashboard** : https://app.supabase.com
- **Checklist complète** : Voir `POST_DEPLOYMENT_CHECKLIST.md`

---

## 🆘 Problème urgent ?

### L'authentification ne fonctionne pas
→ Avez-vous configuré Supabase (Étape 1) ? C'est la cause #1

### Variables d'environnement manquantes
1. Vercel → Settings → Environment Variables
2. Ajoutez les 4 variables depuis votre `.env`
3. Deployments → Redeploy

### Erreur 404
→ Vérifiez que `vercel.json` existe et contient les rewrites

---

**📞 Support : outiltech@grainotech.com | +225 07 77 00 00 00**

**Une fois ces 3 étapes complétées, consultez `POST_DEPLOYMENT_CHECKLIST.md` pour les tests complets.**
