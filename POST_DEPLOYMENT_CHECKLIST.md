# ✅ Checklist Post-Déploiement OUTILTECH

> À compléter après avoir déployé sur Vercel

Date de déploiement : _______________
URL Vercel : _______________
Domaine personnalisé : _______________

---

## 🚨 Configuration CRITIQUE (À faire immédiatement)

### 1. ⚙️ Variables d'environnement Vercel

Vérifiez que TOUTES les variables sont configurées dans Vercel :

- [ ] `VITE_SUPABASE_URL` → Vérifier qu'elle est identique à votre `.env` local
- [ ] `VITE_SUPABASE_ANON_KEY` → Vérifier qu'elle est identique à votre `.env` local
- [ ] `VITE_CINETPAY_API_KEY` → Configurée pour la production
- [ ] `VITE_CINETPAY_SITE_ID` → Configurée pour la production

**Comment vérifier :**
1. Allez dans votre projet Vercel
2. Settings → Environment Variables
3. Vérifiez que les 4 variables sont présentes
4. Si des modifications sont faites, **redéployez** : Deployments → ⋯ → Redeploy

---

### 2. 🔐 Configuration Supabase (TRÈS IMPORTANT)

**Sans cette étape, l'authentification ne fonctionnera PAS en production !**

#### A. Autoriser votre domaine dans Supabase

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Naviguez vers **Authentication** → **URL Configuration**

4. **Site URL** - Mettez votre domaine de production :
   ```
   https://votre-app.vercel.app
   ou
   https://outiltech.grainotech.com
   ```
   - [ ] Site URL configuré

5. **Redirect URLs** - Ajoutez ces URLs (une par ligne) :
   ```
   https://votre-app.vercel.app
   https://votre-app.vercel.app/auth/callback
   https://votre-app.vercel.app/dashboard
   https://outiltech.grainotech.com
   https://outiltech.grainotech.com/auth/callback
   https://outiltech.grainotech.com/dashboard
   ```
   - [ ] Toutes les Redirect URLs ajoutées

6. **Cliquez sur "Save"**
   - [ ] Sauvegardé

#### B. Vérifier les politiques RLS (Row Level Security)

1. Dans Supabase, allez sur **Database** → **Policies**
2. Vérifiez que les politiques sont actives pour :
   - [ ] Table `profiles`
   - [ ] Table `equipment`
   - [ ] Table `rentals`
   - [ ] Table `interventions`
   - [ ] Autres tables importantes

---

### 3. 🌐 Configuration du domaine personnalisé (Optionnel mais recommandé)

#### Si vous voulez utiliser `outiltech.grainotech.com` :

**A. Dans Vercel :**

1. Allez dans Settings → Domains
2. Cliquez sur "Add Domain"
3. Entrez : `outiltech.grainotech.com`
4. Notez les enregistrements DNS demandés par Vercel
   - [ ] Domaine ajouté dans Vercel

**B. Dans votre gestionnaire DNS (Grainotech) :**

Ajoutez un enregistrement CNAME :
```
Type: CNAME
Nom/Host: outiltech
Valeur/Points to: cname.vercel-dns.com
TTL: 3600
```

OU si Vercel demande un enregistrement A :
```
Type: A
Nom/Host: outiltech
Valeur/IP: 76.76.21.21
TTL: 3600
```

- [ ] Enregistrement DNS configuré
- [ ] Propagation DNS vérifiée (peut prendre jusqu'à 48h)

**C. Retour dans Supabase :**

Si vous utilisez un domaine personnalisé, mettez à jour les URLs dans Supabase (étape 2) avec votre nouveau domaine.

- [ ] URLs Supabase mises à jour avec le domaine personnalisé

---

## 🧪 Tests de fonctionnement

### Test 1 : Accessibilité du site

- [ ] Le site se charge via HTTPS
- [ ] Pas d'erreurs dans la console du navigateur (F12)
- [ ] Les images se chargent correctement
- [ ] Le CSS s'applique correctement
- [ ] Les animations fonctionnent

**URL à tester :** _______________

---

### Test 2 : Authentification

**Inscription d'un nouveau compte :**
1. Allez sur `/register`
2. Créez un nouveau compte de test
3. Vérifiez que :
   - [ ] Le formulaire d'inscription fonctionne
   - [ ] L'email de confirmation est reçu
   - [ ] La confirmation du compte fonctionne
   - [ ] La redirection vers le dashboard fonctionne

**Connexion :**
1. Déconnectez-vous
2. Allez sur `/login`
3. Connectez-vous avec le compte de test
4. Vérifiez que :
   - [ ] La connexion fonctionne
   - [ ] Le dashboard se charge
   - [ ] Les données utilisateur s'affichent

**Réinitialisation de mot de passe :**
1. Testez le "Mot de passe oublié"
   - [ ] L'email de réinitialisation est reçu
   - [ ] Le lien fonctionne
   - [ ] Le mot de passe peut être changé

---

### Test 3 : Catalogue et réservation

- [ ] Le catalogue s'affiche avec tous les équipements
- [ ] Les images des équipements se chargent
- [ ] Les filtres fonctionnent
- [ ] La recherche fonctionne
- [ ] Le formulaire de réservation s'ouvre
- [ ] Les dates peuvent être sélectionnées

---

### Test 4 : Paiement (Mode Test)

⚠️ **Utilisez uniquement le mode TEST pour CinetPay**

- [ ] Le bouton de paiement apparaît
- [ ] La popup CinetPay s'ouvre
- [ ] Un paiement test peut être complété
- [ ] La confirmation de paiement fonctionne

---

### Test 5 : Dashboard et rôles

**Pour chaque rôle, testez :**

**Client :**
- [ ] Peut voir ses réservations
- [ ] Peut créer une nouvelle réservation
- [ ] Peut voir son historique

**Gestionnaire de stock (si applicable) :**
- [ ] Peut accéder à la gestion de stock
- [ ] Peut ajouter/modifier des équipements
- [ ] Peut voir l'inventaire

**Technicien (si applicable) :**
- [ ] Peut voir les interventions assignées
- [ ] Peut mettre à jour le statut
- [ ] Peut voir le planning

---

### Test 6 : Performance et SEO

**Google PageSpeed Insights :**
1. Allez sur [pagespeed.web.dev](https://pagespeed.web.dev)
2. Testez votre URL de production
3. Vérifiez les scores :
   - [ ] Performance > 80
   - [ ] Accessibility > 90
   - [ ] Best Practices > 90
   - [ ] SEO > 90

**Lighthouse (DevTools Chrome) :**
- [ ] Ouvrez F12 → Lighthouse
- [ ] Lancez une analyse
- [ ] Notez les scores : Perf ___ | A11y ___ | BP ___ | SEO ___

---

### Test 7 : Responsive Design

Testez sur différents appareils/tailles :

- [ ] Mobile (< 640px) - Chrome DevTools
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (> 1024px)
- [ ] Navigation mobile (menu hamburger)
- [ ] Toutes les pages sont utilisables

---

## 🔍 Vérifications supplémentaires

### Sécurité

- [ ] HTTPS fonctionne (cadenas vert)
- [ ] Certificat SSL valide
- [ ] Pas d'avertissements de sécurité
- [ ] Headers de sécurité configurés (via vercel.json)

### SEO

- [ ] Le titre de la page est correct (F12 → Elements → `<title>`)
- [ ] La meta description est présente
- [ ] Les images ont des attributs `alt`
- [ ] Le fichier `robots.txt` est accessible (si créé)

### Monitoring

- [ ] Vercel Analytics activé (optionnel)
- [ ] Logs Vercel accessibles (Deployments → Function Logs)
- [ ] Supabase monitoring vérifié (Database → Reports)

---

## 📊 Informations de production

**Notez ces informations pour référence :**

- URL de production Vercel : _______________
- URL domaine personnalisé : _______________
- Version déployée (commit hash) : _______________
- Date/heure de déploiement : _______________
- Taille du bundle : _______________
- Temps de build Vercel : _______________

---

## 🚨 En cas de problème

### Le site ne se charge pas
1. Vérifiez les logs Vercel : Deployments → View Build Logs
2. Vérifiez les variables d'environnement
3. Redéployez : Deployments → ⋯ → Redeploy

### Erreur d'authentification
1. Vérifiez les URLs dans Supabase (étape 2)
2. Vérifiez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
3. Regardez les erreurs dans la console navigateur (F12)
4. Vérifiez les logs Supabase

### Erreur 404 sur les routes
1. Vérifiez que `vercel.json` contient les rewrites
2. Redéployez si nécessaire

### Les images ne se chargent pas
1. Vérifiez les permissions Supabase Storage
2. Vérifiez les URLs dans le code
3. Regardez la console navigateur

---

## 📞 Support

Si vous rencontrez des problèmes :

**Vercel Support :**
- Documentation : [vercel.com/docs](https://vercel.com/docs)
- Support : Dans le dashboard Vercel → Help

**Supabase Support :**
- Documentation : [supabase.com/docs](https://supabase.com/docs)
- Discord : [discord.supabase.com](https://discord.supabase.com)

**OUTILTECH Support :**
- Email : outiltech@grainotech.com
- Téléphone : +225 07 77 00 00 00

---

## ✅ Déploiement complété

Une fois TOUTES les cases cochées :

- [ ] **Configuration Vercel complète**
- [ ] **Configuration Supabase complète**
- [ ] **Tests de fonctionnement passés**
- [ ] **Performance satisfaisante**
- [ ] **Responsive testé**

**🎉 Félicitations ! Votre application OUTILTECH est en production !**

---

**Date de complétion :** _______________
**Signature :** _______________

---

**Développé avec ❤️ par Grainotech SAS**
