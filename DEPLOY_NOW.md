# 🚀 Déploiement Rapide - OUTILTECH

## ✅ Statut : Prêt pour le déploiement

Le build de production a été testé avec succès ! 

---

## 🎯 Déploiement en 5 minutes

### Option 1 : Via l'interface Vercel (Recommandé pour débutants)

1. **Connexion**
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez-vous avec GitHub

2. **Import du projet**
   - Cliquez sur "Add New Project"
   - Sélectionnez le dépôt `agrirent-hub`
   - Cliquez sur "Import"

3. **Configuration**
   ```
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Variables d'environnement**
   
   Ajoutez ces 4 variables dans "Environment Variables" :
   
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_CINETPAY_API_KEY
   VITE_CINETPAY_SITE_ID
   ```
   
   ⚠️ Copiez les valeurs depuis votre fichier `.env` local

5. **Déployer**
   - Cliquez sur "Deploy"
   - Attendez 2-3 minutes ⏱️
   - Votre site est en ligne ! 🎉

---

### Option 2 : Via CLI (Pour utilisateurs avancés)

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Se connecter
vercel login

# 3. Déployer
vercel --prod

# 4. Suivre les instructions à l'écran
```

---

## 🌐 Configuration du domaine personnalisé

### Pour outiltech.grainotech.com

1. **Dans Vercel**
   - Settings → Domains → Add Domain
   - Entrez : `outiltech.grainotech.com`

2. **Dans votre DNS Grainotech**
   
   Ajoutez un enregistrement CNAME :
   ```
   Type: CNAME
   Nom: outiltech
   Valeur: cname.vercel-dns.com
   TTL: 3600
   ```

3. **Vérification**
   - Attendez 5-30 minutes pour la propagation DNS
   - Vercel configurera automatiquement HTTPS
   - Testez votre domaine ✅

---

## 🔧 Configuration Supabase post-déploiement

**Important** : Après le déploiement, configurez les URLs dans Supabase :

1. Allez dans votre projet Supabase
2. **Authentication** → **URL Configuration**
3. Ajoutez :
   ```
   Site URL: https://outiltech.grainotech.com
   
   Redirect URLs:
   - https://outiltech.grainotech.com
   - https://outiltech.grainotech.com/auth/callback
   - https://outiltech.grainotech.com/dashboard
   ```

---

## ✅ Checklist finale

Avant de considérer le déploiement terminé :

- [ ] Site accessible via HTTPS
- [ ] Domaine personnalisé fonctionne
- [ ] Test de connexion utilisateur
- [ ] Catalogue s'affiche correctement
- [ ] Images se chargent
- [ ] Pas d'erreurs dans la console navigateur
- [ ] Site responsive (mobile + desktop)

---

## 🆘 Problèmes courants

### Le site ne se charge pas
→ Vérifiez les variables d'environnement dans Vercel

### Erreur d'authentification Supabase
→ Ajoutez votre domaine dans les Redirect URLs Supabase

### Domaine ne fonctionne pas
→ Attendez jusqu'à 48h pour la propagation DNS

---

## 📞 Support

Des questions ? Contactez :
- Email: outiltech@grainotech.com
- Tel: +225 07 77 00 00 00

---

**Guide complet** : Consultez `DEPLOYMENT_GUIDE.md` pour plus de détails

**Développé par Grainotech SAS** 🌾
