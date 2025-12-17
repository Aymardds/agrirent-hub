# 🏗️ Architecture du Système d'Authentification

Ce document présente l'architecture complète du système d'authentification optimisé.

## 📐 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                    OUTILTECH - Authentification                 │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │   Frontend  │◄──►│   Supabase  │◄──►│   Database  │       │
│  │   (React)   │    │    Auth     │    │ (PostgreSQL)│       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
│         │                   │                   │              │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐       │
│  │  UI/UX      │    │   Email     │    │    RLS      │       │
│  │ Components  │    │  Service    │    │  Policies   │       │
│  └─────────────┘    └─────────────┘    └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flux d'Inscription

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUX D'INSCRIPTION COMPLET                    │
└──────────────────────────────────────────────────────────────────┘

1. UTILISATEUR                    2. FRONTEND                3. SUPABASE
   │                                  │                          │
   │ Remplit formulaire              │                          │
   │─────────────────────────────────►│                          │
   │                                  │ Valide mot de passe     │
   │                                  │ (temps réel)            │
   │                                  │                          │
   │ Soumet formulaire               │                          │
   │─────────────────────────────────►│                          │
   │                                  │ signUp()                │
   │                                  │─────────────────────────►│
   │                                  │                          │ Crée user
   │                                  │                          │ Génère token
   │                                  │                          │ Envoie email
   │                                  │                          │
   │                                  │◄─────────────────────────│
   │                                  │ Redirige /verify-email  │
   │◄─────────────────────────────────│                          │
   │                                  │                          │
   │ Reçoit email                    │                          │
   │◄────────────────────────────────────────────────────────────│
   │                                  │                          │
   │ Clique sur lien                 │                          │
   │─────────────────────────────────►│                          │
   │                                  │ Vérifie token           │
   │                                  │─────────────────────────►│
   │                                  │                          │ Confirme email
   │                                  │                          │ Active compte
   │                                  │◄─────────────────────────│
   │                                  │ Redirige /dashboard     │
   │◄─────────────────────────────────│                          │
   │                                  │                          │
   │ ✅ COMPTE ACTIVÉ                │                          │
   │                                  │                          │
```

---

## 🔄 Flux de Réinitialisation

```
┌──────────────────────────────────────────────────────────────────┐
│              FLUX DE RÉINITIALISATION DE MOT DE PASSE            │
└──────────────────────────────────────────────────────────────────┘

1. UTILISATEUR                    2. FRONTEND                3. SUPABASE
   │                                  │                          │
   │ Clique "Mot de passe oublié"    │                          │
   │─────────────────────────────────►│                          │
   │                                  │ Affiche /forgot-password│
   │◄─────────────────────────────────│                          │
   │                                  │                          │
   │ Entre email                     │                          │
   │─────────────────────────────────►│                          │
   │                                  │ resetPasswordForEmail() │
   │                                  │─────────────────────────►│
   │                                  │                          │ Génère token
   │                                  │                          │ Envoie email
   │                                  │◄─────────────────────────│
   │                                  │ Affiche confirmation    │
   │◄─────────────────────────────────│                          │
   │                                  │                          │
   │ Reçoit email                    │                          │
   │◄────────────────────────────────────────────────────────────│
   │                                  │                          │
   │ Clique sur lien                 │                          │
   │─────────────────────────────────►│                          │
   │                                  │ Affiche /reset-password │
   │◄─────────────────────────────────│                          │
   │                                  │                          │
   │ Entre nouveau MDP               │                          │
   │─────────────────────────────────►│                          │
   │                                  │ Valide force            │
   │                                  │ updateUser()            │
   │                                  │─────────────────────────►│
   │                                  │                          │ Met à jour MDP
   │                                  │◄─────────────────────────│
   │                                  │ Redirige /login         │
   │◄─────────────────────────────────│                          │
   │                                  │                          │
   │ ✅ MDP RÉINITIALISÉ             │                          │
   │                                  │                          │
```

---

## 🗂️ Structure des Composants

```
src/
│
├── pages/
│   ├── Register.tsx
│   │   ├── FormData State
│   │   ├── Password Validation
│   │   ├── Strength Indicator
│   │   └── Submit Handler
│   │
│   ├── VerifyEmail.tsx
│   │   ├── Status State (loading/success/error)
│   │   ├── Token Verification
│   │   ├── Resend Email Handler
│   │   └── Auto Redirect
│   │
│   ├── ForgotPassword.tsx
│   │   ├── Email State
│   │   ├── Submit Handler
│   │   └── Success/Error States
│   │
│   └── ResetPassword.tsx
│       ├── Password State
│       ├── Confirm Password State
│       ├── Strength Validation
│       ├── Match Verification
│       └── Update Handler
│
├── lib/
│   └── emailConfig.ts
│       ├── validatePassword()
│       ├── calculatePasswordStrength()
│       ├── getPasswordStrengthLabel()
│       └── Email URLs Configuration
│
└── App.tsx
    └── Routes
        ├── /register
        ├── /verify-email
        ├── /forgot-password
        └── /reset-password
```

---

## 🔐 Couches de Sécurité

```
┌─────────────────────────────────────────────────────────────┐
│                    COUCHES DE SÉCURITÉ                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Couche 1 : Validation Côté Client                         │
│  ─────────────────────────────────────────────────────────  │
│  • Validation en temps réel                                 │
│  • Indicateur de force visuel                               │
│  • Messages d'erreur détaillés                              │
│  • Blocage de soumission si invalide                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Couche 2 : Validation Côté Serveur (Supabase)             │
│  ─────────────────────────────────────────────────────────  │
│  • Vérification des critères de mot de passe               │
│  • Validation de l'unicité de l'email                       │
│  • Génération de tokens sécurisés                           │
│  • Hachage du mot de passe (bcrypt)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Couche 3 : Row Level Security (RLS)                       │
│  ─────────────────────────────────────────────────────────  │
│  • Politiques d'accès aux profils                           │
│  • Isolation des données utilisateurs                       │
│  • Vérification auth.uid()                                  │
│  • Protection contre l'accès non autorisé                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Couche 4 : Gestion des Tokens                             │
│  ─────────────────────────────────────────────────────────  │
│  • Tokens avec expiration                                   │
│  • Confirmation email : 24h                                 │
│  • Réinitialisation MDP : 1h                                │
│  • Tokens à usage unique                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Base de Données

```sql
┌─────────────────────────────────────────────────────────────┐
│                    SCHÉMA DE BASE DE DONNÉES                │
└─────────────────────────────────────────────────────────────┘

auth.users (Supabase Auth)
├── id (UUID, PK)
├── email (TEXT, UNIQUE)
├── encrypted_password (TEXT)
├── email_confirmed_at (TIMESTAMP)
├── confirmation_sent_at (TIMESTAMP)
├── confirmation_token (TEXT)
├── recovery_token (TEXT)
├── raw_user_meta_data (JSONB)
│   ├── full_name
│   ├── phone
│   ├── company
│   └── role
└── created_at (TIMESTAMP)

        │
        │ (Trigger: on_auth_user_created)
        ▼

public.profiles
├── id (UUID, PK, FK → auth.users.id)
├── email (TEXT)
├── full_name (TEXT)
├── phone (TEXT)
├── company (TEXT)
├── role (TEXT, DEFAULT 'client')
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

RLS Policies:
├── "Users can view own profile"
│   └── SELECT WHERE auth.uid() = id
└── "Users can update own profile"
    └── UPDATE WHERE auth.uid() = id
```

---

## 🎨 Composants UI Réutilisables

```
┌─────────────────────────────────────────────────────────────┐
│              COMPOSANTS UI RÉUTILISABLES                    │
└─────────────────────────────────────────────────────────────┘

PasswordStrengthIndicator
├── Props
│   ├── password: string
│   ├── strength: number (0-100)
│   └── errors: string[]
├── Render
│   ├── Progress Bar (colored)
│   ├── Strength Label
│   └── Error Messages
└── Logic
    ├── calculatePasswordStrength()
    └── getPasswordStrengthLabel()

EmailVerificationCard
├── Props
│   ├── status: 'loading' | 'success' | 'error'
│   ├── email?: string
│   └── onResend: () => void
├── Render
│   ├── Icon (Mail/Check/Error)
│   ├── Title
│   ├── Description
│   └── Actions (Resend button)
└── Logic
    └── Status-based rendering

PasswordInput
├── Props
│   ├── value: string
│   ├── onChange: (value: string) => void
│   └── showStrength: boolean
├── Render
│   ├── Input field
│   ├── Toggle visibility button
│   └── Strength indicator (optional)
└── Logic
    ├── Show/hide password
    └── Validation
```

---

## 🔄 États et Transitions

```
┌─────────────────────────────────────────────────────────────┐
│                  MACHINE À ÉTATS - INSCRIPTION              │
└─────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  IDLE    │ État initial
    └────┬─────┘
         │ User fills form
         ▼
    ┌──────────┐
    │VALIDATING│ Validation en temps réel
    └────┬─────┘
         │ Password valid
         ▼
    ┌──────────┐
    │  READY   │ Prêt à soumettre
    └────┬─────┘
         │ Submit
         ▼
    ┌──────────┐
    │SUBMITTING│ Envoi en cours
    └────┬─────┘
         │ Success
         ▼
    ┌──────────┐
    │EMAIL_SENT│ Email envoyé
    └────┬─────┘
         │ Click link
         ▼
    ┌──────────┐
    │VERIFYING │ Vérification token
    └────┬─────┘
         │ Success
         ▼
    ┌──────────┐
    │CONFIRMED │ Compte activé
    └──────────┘
```

---

## 📱 Responsive Breakpoints

```
┌─────────────────────────────────────────────────────────────┐
│                    RESPONSIVE DESIGN                        │
└─────────────────────────────────────────────────────────────┘

Mobile (< 768px)
├── Layout: Single column
├── Form: Full width
├── Buttons: Stacked
└── Font size: 14px base

Tablet (768px - 1023px)
├── Layout: Single column with padding
├── Form: Max-width 600px
├── Buttons: Inline
└── Font size: 16px base

Desktop (≥ 1024px)
├── Layout: Split screen
│   ├── Left: Form
│   └── Right: Visual/Branding
├── Form: Max-width 480px
├── Buttons: Inline with icons
└── Font size: 16px base
```

---

## 🎯 Points d'Extension Futurs

```
┌─────────────────────────────────────────────────────────────┐
│                  ARCHITECTURE ÉVOLUTIVE                     │
└─────────────────────────────────────────────────────────────┘

Authentification Actuelle
├── Email + Mot de passe
├── Confirmation par email
└── Réinitialisation de MDP

        │
        ▼ Extensions Possibles

Authentification 2FA
├── SMS OTP
├── Authenticator App (TOTP)
└── Email OTP

        │
        ▼

Authentification Sociale
├── Google OAuth
├── Facebook Login
└── Apple Sign In

        │
        ▼

Authentification Avancée
├── Biométrie (WebAuthn)
├── Passkeys
└── Hardware Keys (YubiKey)
```

---

## 📈 Monitoring et Analytics

```
┌─────────────────────────────────────────────────────────────┐
│                  POINTS DE MONITORING                       │
└─────────────────────────────────────────────────────────────┘

Métriques Utilisateur
├── Taux d'inscription
├── Taux de confirmation email
├── Taux de réinitialisation MDP
└── Temps moyen de vérification

Métriques Technique
├── Temps de validation (< 50ms)
├── Temps de chargement page (< 1s)
├── Taux d'erreur API
└── Disponibilité du service

Métriques Sécurité
├── Tentatives de connexion échouées
├── Mots de passe faibles rejetés
├── Tokens expirés
└── Activités suspectes
```

---

## 🔧 Configuration Requise

```
┌─────────────────────────────────────────────────────────────┐
│                  STACK TECHNOLOGIQUE                        │
└─────────────────────────────────────────────────────────────┘

Frontend
├── React 18+
├── TypeScript 5+
├── Vite 5+
├── TailwindCSS 3+
└── shadcn/ui

Backend/Database
├── Supabase
│   ├── PostgreSQL 15+
│   ├── Auth Service
│   └── Email Service
└── Row Level Security

Outils de Développement
├── Node.js 18+
├── npm/yarn/pnpm
├── Git
└── VS Code (recommandé)
```

---

**Architecture conçue pour la scalabilité, la sécurité et la maintenabilité**

**Développé avec ❤️ pour OUTILTECH - Grainotech SAS**
