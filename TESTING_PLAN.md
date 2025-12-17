# 🧪 Plan de Tests - Authentification Optimisée

Ce document décrit tous les tests à effectuer pour valider le système d'authentification.

## ✅ Checklist de Tests

### 1. Tests d'Inscription

#### Test 1.1 : Inscription avec mot de passe valide
- [ ] Remplir tous les champs du formulaire
- [ ] Entrer un mot de passe respectant tous les critères
- [ ] Vérifier que l'indicateur affiche "Très fort" en vert
- [ ] Soumettre le formulaire
- [ ] Vérifier la redirection vers `/verify-email`
- [ ] Vérifier le message de succès

**Résultat attendu** : ✅ Compte créé, email envoyé, redirection réussie

#### Test 1.2 : Inscription avec mot de passe faible
- [ ] Entrer un mot de passe simple (ex: "test123")
- [ ] Vérifier que l'indicateur affiche "Très faible" en rouge
- [ ] Vérifier l'affichage des messages d'erreur
- [ ] Tenter de soumettre le formulaire
- [ ] Vérifier que la soumission est bloquée

**Résultat attendu** : ❌ Formulaire non soumis, erreurs affichées

#### Test 1.3 : Inscription avec email déjà utilisé
- [ ] Utiliser un email existant
- [ ] Remplir le formulaire avec un mot de passe valide
- [ ] Soumettre le formulaire
- [ ] Vérifier le message d'erreur

**Résultat attendu** : ❌ Message "Cette adresse email est déjà utilisée"

#### Test 1.4 : Validation en temps réel du mot de passe
- [ ] Commencer à taper un mot de passe
- [ ] Vérifier que la barre de progression se met à jour en temps réel
- [ ] Ajouter une majuscule → vérifier le changement
- [ ] Ajouter un chiffre → vérifier le changement
- [ ] Ajouter un caractère spécial → vérifier le changement
- [ ] Vérifier que les messages d'erreur disparaissent progressivement

**Résultat attendu** : ✅ Mise à jour fluide et instantanée

---

### 2. Tests de Vérification d'Email

#### Test 2.1 : Réception de l'email de confirmation
- [ ] S'inscrire avec un email valide
- [ ] Vérifier la boîte de réception
- [ ] Vérifier la présence de l'email
- [ ] Vérifier le sujet : "Confirmez votre inscription à OUTILTECH"
- [ ] Vérifier le contenu de l'email

**Résultat attendu** : ✅ Email reçu avec le bon contenu

#### Test 2.2 : Clic sur le lien de confirmation
- [ ] Cliquer sur le lien dans l'email
- [ ] Vérifier la redirection vers `/verify-email?token=...`
- [ ] Vérifier l'affichage du message de succès
- [ ] Vérifier la redirection automatique vers `/dashboard`

**Résultat attendu** : ✅ Email vérifié, redirection vers dashboard

#### Test 2.3 : Renvoyer l'email de confirmation
- [ ] Aller sur `/verify-email`
- [ ] Entrer son email dans le champ
- [ ] Cliquer sur "Renvoyer"
- [ ] Vérifier le message de succès
- [ ] Vérifier la réception du nouvel email

**Résultat attendu** : ✅ Nouvel email envoyé et reçu

#### Test 2.4 : Lien de confirmation expiré
- [ ] Attendre l'expiration du lien (24h) ou utiliser un vieux lien
- [ ] Cliquer sur le lien expiré
- [ ] Vérifier l'affichage du message d'erreur
- [ ] Vérifier la possibilité de renvoyer l'email

**Résultat attendu** : ❌ Message d'erreur, option de renvoi disponible

---

### 3. Tests de Réinitialisation de Mot de Passe

#### Test 3.1 : Demande de réinitialisation
- [ ] Aller sur `/forgot-password`
- [ ] Entrer un email valide
- [ ] Soumettre le formulaire
- [ ] Vérifier le message de succès
- [ ] Vérifier la réception de l'email

**Résultat attendu** : ✅ Email de réinitialisation envoyé

#### Test 3.2 : Réinitialisation avec mot de passe valide
- [ ] Cliquer sur le lien dans l'email
- [ ] Vérifier la redirection vers `/reset-password`
- [ ] Entrer un nouveau mot de passe valide
- [ ] Vérifier l'indicateur de force
- [ ] Confirmer le mot de passe
- [ ] Vérifier le message de correspondance
- [ ] Soumettre le formulaire
- [ ] Vérifier la redirection vers `/login`

**Résultat attendu** : ✅ Mot de passe réinitialisé, redirection vers login

#### Test 3.3 : Mots de passe non correspondants
- [ ] Entrer un mot de passe
- [ ] Entrer un mot de passe différent dans la confirmation
- [ ] Vérifier l'affichage du message d'erreur
- [ ] Vérifier que le bouton est désactivé

**Résultat attendu** : ❌ Message d'erreur, bouton désactivé

#### Test 3.4 : Lien de réinitialisation expiré
- [ ] Utiliser un lien expiré (> 1h)
- [ ] Vérifier le message d'erreur
- [ ] Vérifier la possibilité de demander un nouveau lien

**Résultat attendu** : ❌ Message d'erreur, redirection possible

---

### 4. Tests de Connexion

#### Test 4.1 : Connexion avec compte non vérifié
- [ ] S'inscrire sans vérifier l'email
- [ ] Tenter de se connecter
- [ ] Vérifier le comportement (selon config Supabase)

**Résultat attendu** : Selon configuration (bloqué ou autorisé)

#### Test 4.2 : Connexion après vérification
- [ ] Vérifier son email
- [ ] Se connecter avec email et mot de passe
- [ ] Vérifier la redirection vers `/dashboard`

**Résultat attendu** : ✅ Connexion réussie

---

### 5. Tests de Sécurité

#### Test 5.1 : Injection SQL
- [ ] Tenter d'entrer `'; DROP TABLE users; --` dans l'email
- [ ] Vérifier que c'est traité comme texte normal
- [ ] Vérifier qu'aucune erreur serveur n'apparaît

**Résultat attendu** : ✅ Pas d'injection possible

#### Test 5.2 : XSS (Cross-Site Scripting)
- [ ] Tenter d'entrer `<script>alert('XSS')</script>` dans le nom
- [ ] Vérifier que le script n'est pas exécuté
- [ ] Vérifier l'échappement HTML

**Résultat attendu** : ✅ Pas d'exécution de script

#### Test 5.3 : Brute Force
- [ ] Tenter plusieurs connexions échouées rapidement
- [ ] Vérifier s'il y a un rate limiting
- [ ] Vérifier les messages d'erreur

**Résultat attendu** : ✅ Protection contre brute force (si configurée)

#### Test 5.4 : CSRF (Cross-Site Request Forgery)
- [ ] Vérifier la présence de tokens CSRF
- [ ] Tenter une requête depuis un autre domaine

**Résultat attendu** : ✅ Protection CSRF active

---

### 6. Tests de Performance

#### Test 6.1 : Temps de validation du mot de passe
- [ ] Taper rapidement dans le champ mot de passe
- [ ] Mesurer le délai de mise à jour de l'indicateur
- [ ] Vérifier qu'il n'y a pas de lag

**Résultat attendu** : ✅ Mise à jour < 50ms

#### Test 6.2 : Temps de chargement des pages
- [ ] Mesurer le temps de chargement de `/verify-email`
- [ ] Mesurer le temps de chargement de `/reset-password`
- [ ] Mesurer le temps de chargement de `/register`

**Résultat attendu** : ✅ Chargement < 1s

#### Test 6.3 : Taille des bundles
- [ ] Vérifier la taille du bundle JavaScript
- [ ] Vérifier la taille du bundle CSS
- [ ] Vérifier qu'il n'y a pas de code mort

**Résultat attendu** : ✅ Bundles optimisés

---

### 7. Tests de Responsive Design

#### Test 7.1 : Mobile (320px - 767px)
- [ ] Tester sur iPhone SE (320px)
- [ ] Tester sur iPhone 12 (390px)
- [ ] Vérifier que tous les éléments sont visibles
- [ ] Vérifier que les boutons sont cliquables
- [ ] Vérifier que le texte est lisible

**Résultat attendu** : ✅ Design adapté au mobile

#### Test 7.2 : Tablette (768px - 1023px)
- [ ] Tester sur iPad (768px)
- [ ] Vérifier le layout
- [ ] Vérifier les espacements

**Résultat attendu** : ✅ Design adapté à la tablette

#### Test 7.3 : Desktop (1024px+)
- [ ] Tester sur écran 1920x1080
- [ ] Vérifier le split screen (formulaire + visuel)
- [ ] Vérifier les animations

**Résultat attendu** : ✅ Design optimisé pour desktop

---

### 8. Tests d'Accessibilité

#### Test 8.1 : Navigation au clavier
- [ ] Naviguer avec Tab entre les champs
- [ ] Vérifier l'ordre de tabulation
- [ ] Vérifier la visibilité du focus
- [ ] Soumettre le formulaire avec Entrée

**Résultat attendu** : ✅ Navigation au clavier fluide

#### Test 8.2 : Lecteur d'écran
- [ ] Tester avec VoiceOver (Mac) ou NVDA (Windows)
- [ ] Vérifier les labels ARIA
- [ ] Vérifier les messages d'erreur
- [ ] Vérifier les descriptions

**Résultat attendu** : ✅ Compatible lecteur d'écran

#### Test 8.3 : Contraste des couleurs
- [ ] Vérifier le contraste texte/fond
- [ ] Utiliser un outil de vérification (WAVE, axe)
- [ ] Vérifier le ratio WCAG AA (4.5:1)

**Résultat attendu** : ✅ Contraste conforme WCAG AA

---

### 9. Tests Cross-Browser

#### Test 9.1 : Chrome
- [ ] Tester sur Chrome (dernière version)
- [ ] Vérifier toutes les fonctionnalités

**Résultat attendu** : ✅ Fonctionne parfaitement

#### Test 9.2 : Firefox
- [ ] Tester sur Firefox (dernière version)
- [ ] Vérifier toutes les fonctionnalités

**Résultat attendu** : ✅ Fonctionne parfaitement

#### Test 9.3 : Safari
- [ ] Tester sur Safari (dernière version)
- [ ] Vérifier toutes les fonctionnalités
- [ ] Vérifier les animations CSS

**Résultat attendu** : ✅ Fonctionne parfaitement

#### Test 9.4 : Edge
- [ ] Tester sur Edge (dernière version)
- [ ] Vérifier toutes les fonctionnalités

**Résultat attendu** : ✅ Fonctionne parfaitement

---

### 10. Tests d'Intégration

#### Test 10.1 : Flux complet d'inscription
```
1. Inscription → 2. Email → 3. Vérification → 4. Dashboard
```
- [ ] Exécuter le flux complet
- [ ] Vérifier chaque étape
- [ ] Vérifier les données en base

**Résultat attendu** : ✅ Flux complet fonctionnel

#### Test 10.2 : Flux complet de réinitialisation
```
1. Demande → 2. Email → 3. Réinitialisation → 4. Connexion
```
- [ ] Exécuter le flux complet
- [ ] Vérifier chaque étape
- [ ] Vérifier que le nouveau mot de passe fonctionne

**Résultat attendu** : ✅ Flux complet fonctionnel

---

## 📊 Rapport de Tests

### Template de Rapport

```markdown
# Rapport de Tests - [Date]

## Résumé
- Tests réussis : X/Y
- Tests échoués : Z
- Taux de réussite : XX%

## Détails

### Tests d'Inscription
- ✅ Test 1.1 : Réussi
- ✅ Test 1.2 : Réussi
- ❌ Test 1.3 : Échoué - [Raison]
- ✅ Test 1.4 : Réussi

### Tests de Vérification d'Email
- ✅ Test 2.1 : Réussi
- ...

## Bugs Identifiés
1. [Bug #1] : Description
2. [Bug #2] : Description

## Recommandations
1. Recommandation 1
2. Recommandation 2
```

---

## 🔧 Outils de Test Recommandés

### Tests Manuels
- **Chrome DevTools** : Inspection, responsive, performance
- **Firefox Developer Tools** : Accessibilité
- **Lighthouse** : Performance, SEO, accessibilité
- **WAVE** : Accessibilité

### Tests Automatisés
```bash
# Tests unitaires (à implémenter)
npm run test

# Tests E2E avec Playwright (à implémenter)
npm run test:e2e

# Vérification de types
npm run type-check

# Linting
npm run lint
```

### Tests de Performance
```bash
# Lighthouse CLI
npx lighthouse http://localhost:5173/register --view

# Bundle analyzer
npm run build -- --analyze
```

---

## 📝 Notes de Test

### Environnements
- **Local** : http://localhost:5173
- **Staging** : https://staging.outiltech.com
- **Production** : https://outiltech.com

### Comptes de Test
```
Email: test@outiltech.com
Mot de passe: Test123!@#

Email: admin@outiltech.com
Mot de passe: Admin123!@#
```

### Données de Test
- Emails valides : test1@example.com, test2@example.com
- Emails invalides : invalid, @example.com, test@
- Mots de passe faibles : 123, test, password
- Mots de passe forts : Test123!@#, MyP@ssw0rd2024

---

## ✅ Validation Finale

Avant de déployer en production :

- [ ] Tous les tests passent
- [ ] Aucun bug critique
- [ ] Performance optimale
- [ ] Accessibilité validée
- [ ] Cross-browser testé
- [ ] Documentation à jour
- [ ] Configuration Supabase vérifiée
- [ ] Emails de test envoyés et reçus
- [ ] Backup de la base de données effectué

---

**Date de dernière mise à jour** : [À remplir]
**Testeur** : [À remplir]
**Version** : 1.0.0
