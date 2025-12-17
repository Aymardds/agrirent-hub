# OUTILTECH

> Une solution digitale de **Grainotech SAS**

## 🌾 À propos

**OUTILTECH** est la plateforme digitale de référence pour la location et la gestion de matériel agricole en Afrique de l'Ouest. Développée par **Grainotech SAS**, cette solution simplifie l'accès au matériel motorisé pour les agriculteurs, coopératives et prestataires techniques.

### 🎯 Fonctionnalités principales

- 📋 **Catalogue de matériel** - Consultez et réservez du matériel agricole en ligne
- 🚜 **Gestion de location** - Suivez vos locations en temps réel
- 📦 **Gestion de stock** - Gérez l'inventaire de matériel disponible
- 👥 **Multi-rôles** - Support pour clients, gestionnaires, techniciens et administrateurs
- 💰 **Gestion financière** - Suivi des paiements et comptabilité
- 🔧 **Suivi des interventions** - Gestion des maintenances et réparations
- 🔐 **Authentification sécurisée** - Confirmation par email, validation de mot de passe renforcée

### ✨ Nouveautés - Authentification Optimisée

Notre système d'authentification a été entièrement optimisé pour offrir une sécurité maximale :

- ✅ **Confirmation par email automatique** - Vérification de l'adresse email après inscription
- ✅ **Validation de mot de passe renforcée** - Indicateur de force en temps réel avec 5 critères de sécurité
- ✅ **Réinitialisation sécurisée** - Processus complet de récupération de mot de passe
- ✅ **Interface intuitive** - Design moderne avec feedback visuel instantané
- ✅ **Sécurité renforcée** - Protection contre les attaques courantes

📖 **Documentation complète** : Consultez [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) pour plus de détails.

## 🏢 À propos de Grainotech SAS

[Grainotech](https://www.grainotech.com) est leader des solutions digitales pour l'agriculture en Afrique de l'Ouest. Nous développons des outils innovants pour moderniser et digitaliser le secteur agricole.

**Site web**: [www.grainotech.com](https://www.grainotech.com)

## 🚀 Installation et développement

### Prérequis

- Node.js & npm (recommandé: [installer avec nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Compte Supabase pour la base de données

### Installation locale

```sh
# Cloner le dépôt
git clone <YOUR_GIT_URL>

# Naviguer dans le répertoire du projet
cd agrirent-hub

# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Créer un fichier .env à la racine avec vos clés Supabase

# Démarrer le serveur de développement
npm run dev
```

### Configuration

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_supabase
```

## 🛠️ Technologies utilisées

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth
- **Paiement**: CinetPay
- **Stockage**: Supabase Storage

## 📦 Structure du projet

```
├── src/
│   ├── components/      # Composants React réutilisables
│   ├── pages/          # Pages de l'application
│   ├── contexts/       # Contextes React (Auth, etc.)
│   ├── hooks/          # Custom hooks
│   └── lib/            # Utilitaires et configuration
├── public/             # Fichiers statiques
└── supabase/          # Migrations et configurations Supabase
```

## 🤝 Support

Pour toute question ou support technique, contactez:
- **Email**: outiltech@grainotech.com
- **Téléphone**: +225 07 77 00 00 00
- **Website**: [www.grainotech.com](https://www.grainotech.com)

## 📄 Licence

© 2024 OUTILTECH - Grainotech SAS. Tous droits réservés.

---

**Développé avec ❤️ par [Grainotech SAS](https://www.grainotech.com)**

