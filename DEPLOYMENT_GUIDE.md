# 🚀 Guide de Déploiement OUTILTECH

> Guide complet pour déployer OUTILTECH en production avec un domaine personnalisé

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Préparation du projet](#préparation-du-projet)
3. [Déploiement sur Vercel](#déploiement-sur-vercel)
4. [Configuration du domaine personnalisé](#configuration-du-domaine-personnalisé)
5. [Configuration Supabase](#configuration-supabase)
6. [Tests post-déploiement](#tests-post-déploiement)

---

## 🎯 Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte GitHub avec le code source poussé
- ✅ Un compte Vercel (gratuit) : [vercel.com](https://vercel.com)
- ✅ Un domaine personnalisé (ex: outiltech.grainotech.com)
- ✅ Accès à votre base de données Supabase
- ✅ Les clés API CinetPay pour les paiements

---

## 📦 Préparation du projet

### 1. Créer un fichier `.env.example`

Créez un fichier `.env.example` à la racine pour documenter les variables nécessaires :

```env
# Supabase Configuration
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_supabase

# CinetPay Configuration
VITE_CINETPAY_API_KEY=votre_api_key
VITE_CINETPAY_SITE_ID=votre_site_id
```

### 2. Vérifier le `.gitignore`

Assurez-vous que votre `.gitignore` contient :

```
.env
.env.local
.env.production
node_modules/
dist/
.vercel
```

### 3. Tester le build en local

```bash
npm run build
npm run preview
```

Si le build réussit, vous êtes prêt pour le déploiement ! ✅

---

## 🌐 Déploiement sur Vercel (Recommandé)

### Méthode 1 : Déploiement via l'interface web (Plus simple)

#### Étape 1 : Connecter votre projet

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New Project"**
3. Importez votre dépôt GitHub
4. Sélectionnez le dépôt `agrirent-hub`

#### Étape 2 : Configuration du projet

**Framework Preset** : Vite
**Root Directory** : `./`
**Build Command** : `npm run build`
**Output Directory** : `dist`
**Install Command** : `npm install`

#### Étape 3 : Variables d'environnement

Dans les paramètres du projet Vercel, ajoutez les variables :

```
VITE_SUPABASE_URL = https://xztvxhuvmwlurkljsqhx.supabase.co
VITE_SUPABASE_ANON_KEY = [votre_clé_anon]
VITE_CINETPAY_API_KEY = [votre_api_key]
VITE_CINETPAY_SITE_ID = [votre_site_id]
```

#### Étape 4 : Déployer

Cliquez sur **"Deploy"** et attendez que le déploiement se termine (2-3 minutes).

---

### Méthode 2 : Déploiement via CLI

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter à Vercel
vercel login

# Déployer en production
vercel --prod
```

Suivez les instructions interactives pour configurer votre projet.

---

## 🌍 Configuration du domaine personnalisé

### Option A : Sous-domaine Grainotech (Recommandé)

Si vous voulez `outiltech.grainotech.com` :

#### 1. Dans Vercel

1. Allez dans **Settings** > **Domains**
2. Cliquez sur **"Add Domain"**
3. Entrez : `outiltech.grainotech.com`
4. Vercel vous donnera des enregistrements DNS à configurer

#### 2. Dans votre gestionnaire DNS (Grainotech)

Ajoutez un enregistrement CNAME :

```
Type: CNAME
Name: outiltech
Value: cname.vercel-dns.com
TTL: 3600
```

Ou si Vercel vous demande un enregistrement A :

```
Type: A
Name: outiltech
Value: 76.76.21.21
TTL: 3600
```

#### 3. Vérification

- La propagation DNS peut prendre 5 minutes à 48 heures
- Vercel configurera automatiquement HTTPS avec Let's Encrypt
- Testez : `https://outiltech.grainotech.com`

---

### Option B : Domaine principal

Si vous voulez `outiltech.com` ou un autre domaine :

#### 1. Dans Vercel

Ajoutez le domaine complet (ex: `outiltech.com`)

#### 2. Dans votre registrar de domaine

Configurez les nameservers pour pointer vers Vercel :

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Ou ajoutez des enregistrements A/CNAME selon les instructions de Vercel.

---

## 🗄️ Configuration Supabase

### 1. Autoriser le domaine dans Supabase

Dans votre projet Supabase :

1. Allez dans **Authentication** > **URL Configuration**
2. Ajoutez votre domaine de production dans **Site URL** :
   ```
   https://outiltech.grainotech.com
   ```

3. Dans **Redirect URLs**, ajoutez :
   ```
   https://outiltech.grainotech.com
   https://outiltech.grainotech.com/auth/callback
   https://outiltech.grainotech.com/dashboard
   ```

### 2. Configurer CORS

Dans **API Settings**, assurez-vous que CORS est configuré pour accepter votre domaine.

---

## 🔒 Sécurité et Performance

### 1. Variables d'environnement

⚠️ **IMPORTANT** : Ne committez JAMAIS vos fichiers `.env` !

Les variables avec le préfixe `VITE_` sont exposées côté client. Ne mettez JAMAIS de secrets dans ces variables !

### 2. HTTPS

Vercel configure automatiquement HTTPS. Assurez-vous que :
- Toutes les requêtes HTTP redirigent vers HTTPS
- Les certificats SSL sont automatiquement renouvelés

### 3. Headers de sécurité

Créez un fichier `vercel.json` à la racine :

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

## 🧪 Tests post-déploiement

### Checklist de vérification

- [ ] Le site est accessible via HTTPS
- [ ] Le domaine personnalisé fonctionne
- [ ] L'authentification Supabase fonctionne
- [ ] Les images se chargent correctement
- [ ] Le catalogue s'affiche
- [ ] Les paiements CinetPay fonctionnent (mode test)
- [ ] Toutes les pages sont accessibles
- [ ] Le site est responsive (mobile/desktop)
- [ ] Les performances sont bonnes (Lighthouse > 90)

### Tests de fonctionnalités

1. **Authentification**
   ```
   - Inscription d'un nouvel utilisateur
   - Connexion
   - Déconnexion
   - Récupération de mot de passe
   ```

2. **Navigation**
   ```
   - Toutes les pages se chargent
   - Les liens fonctionnent
   - Pas d'erreurs 404
   ```

3. **Fonctionnalités métier**
   ```
   - Voir le catalogue
   - Créer une réservation
   - Effectuer un paiement (test)
   - Accéder au dashboard
   ```

---

## 🔄 Déploiement continu (CI/CD)

Une fois configuré, Vercel déploiera automatiquement :

- 🟢 **Production** : Chaque push sur la branche `main`
- 🟡 **Preview** : Chaque push sur les autres branches
- 🔵 **Pull Request** : Déploiement de prévisualisation pour chaque PR

---

## 📊 Monitoring et Analytics

### 1. Vercel Analytics

Activez Vercel Analytics dans les paramètres du projet pour :
- Performance monitoring
- Core Web Vitals
- Statistiques de trafic

### 2. Supabase Monitoring

Dans votre dashboard Supabase :
- Surveillez l'utilisation de la base de données
- Vérifiez les logs d'authentification
- Monitorez les requêtes API

---

## 🆘 Dépannage

### Problème : Build échoue

**Solution** :
```bash
# Nettoyer et rebuilder localement
rm -rf node_modules dist
npm install
npm run build
```

### Problème : Variables d'environnement non reconnues

**Solution** :
1. Vérifiez que les variables commencent par `VITE_`
2. Redéployez après avoir ajouté les variables
3. Vérifiez qu'il n'y a pas d'espaces dans les valeurs

### Problème : Domaine ne fonctionne pas

**Solution** :
1. Vérifiez la propagation DNS : `dig outiltech.grainotech.com`
2. Attendez jusqu'à 48h pour la propagation complète
3. Vérifiez les enregistrements DNS dans votre registrar

### Problème : Erreurs Supabase en production

**Solution** :
1. Vérifiez que le domaine est autorisé dans Supabase
2. Vérifiez les URL de redirection
3. Vérifiez les clés API dans les variables d'environnement

---

## 📚 Ressources utiles

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Vite](https://vitejs.dev/guide/build.html)
- [Documentation Supabase](https://supabase.com/docs)
- [Guide DNS](https://www.cloudflare.com/learning/dns/what-is-dns/)

---

## 🎉 Félicitations !

Une fois déployé avec succès, votre application OUTILTECH sera :
- ✅ Accessible mondialement 24/7
- ✅ Sécurisée avec HTTPS
- ✅ Optimisée pour les performances
- ✅ Déployée automatiquement à chaque mise à jour

---

**Développé avec ❤️ par [Grainotech SAS](https://www.grainotech.com)**
