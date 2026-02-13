# Guide de Démarrage Rapide - Système de Notifications

## ✅ Ce qui est déjà fait

Tous les fichiers sont créés et le code est prêt. L'interface utilisateur fonctionne déjà !

## 🚀 Étapes pour activer complètement le système

### 1. Appliquer les migrations SQL (5 minutes)

Allez dans **Supabase Dashboard > SQL Editor** et exécutez dans l'ordre :

1. **`notification_schema_enhancement_fixed.sql`** ⚠️ (Utilisez la version FIXED, pas l'originale)
2. **`notification_triggers.sql`** ✅ (Routes corrigées - utilise `/dashboard/invoices`)

> **Note importante** : La version "fixed" gère correctement les données existantes dans la table notifications.

### 2. Déployer la fonction Email (10 minutes)

```bash
# Installer Supabase CLI
brew install supabase/tap/supabase

# Lier votre projet
supabase link --project-ref VOTRE_PROJECT_REF

# Configurer la clé API Resend (déjà fournie)
supabase secrets set RESEND_API_KEY=re_QPswtRn3_8x6TDJBpeRvQgnTrXgQvzxYd

# Déployer
supabase functions deploy send-invoice-email
```

### 3. Tester ! 🎉

L'application est déjà prête :
- ✅ Cloche de notification visible dans le dashboard
- ✅ Panneau de notifications fonctionnel
- ✅ Système temps réel activé
- ✅ Routes corrigées (plus d'erreur 404)

**Test simple :**
1. Créez une nouvelle commande
2. Regardez la cloche → notification apparaît !
3. Cliquez sur une notification → navigation correcte

## 📧 Envoyer un email de test

```typescript
import { sendInvoiceEmail } from '@/lib/emailService';

// Dans votre code React
const handleSendEmail = async () => {
  const result = await sendInvoiceEmail('rental-id-ici');
  console.log(result);
};
```

## 🐛 Résolution de problèmes

**Erreur "check constraint violated"** : Utilisez `notification_schema_enhancement_fixed.sql` au lieu de `notification_schema_enhancement.sql`

**Erreur 404 "/dashboard/accounting"** : ✅ Corrigé ! Utilisez la dernière version de `notification_triggers.sql`

## 📚 Documentation complète

Voir [walkthrough.md](file:///Users/inexiumus/.gemini/antigravity/brain/4e838da0-e141-4693-a951-ff3d53e97843/walkthrough.md) pour tous les détails.
