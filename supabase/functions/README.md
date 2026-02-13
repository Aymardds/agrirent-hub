# Déploiement de la Fonction Edge pour l'Envoi d'Emails

## Prérequis

1. **Supabase CLI** installé
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Clé API Resend** : `re_QPswtRn3_8x6TDJBpeRvQgnTrXgQvzxYd`

## Configuration

### 1. Lier le projet Supabase

```bash
supabase link --project-ref VOTRE_PROJECT_REF
```

### 2. Configurer les secrets

```bash
# Définir la clé API Resend
supabase secrets set RESEND_API_KEY=re_QPswtRn3_8x6TDJBpeRvQgnTrXgQvzxYd

# Les autres variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) sont automatiquement disponibles
```

### 3. Déployer la fonction

```bash
supabase functions deploy send-invoice-email
```

## Utilisation

### Depuis l'application React

```typescript
import { supabase } from '@/lib/supabase';

// Envoyer une facture
const { data, error } = await supabase.functions.invoke('send-invoice-email', {
  body: {
    rentalId: 'uuid-de-la-location',
    type: 'invoice' // ou 'payment_confirmation' ou 'payment_reminder'
  }
});
```

### Types d'emails disponibles

1. **`invoice`** : Facture de service
2. **`payment_confirmation`** : Confirmation de paiement reçu
3. **`payment_reminder`** : Rappel de paiement en attente

## Test Local

Pour tester localement avant le déploiement :

```bash
supabase functions serve send-invoice-email --env-file ./supabase/.env.local
```

Puis appelez la fonction :

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-invoice-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"rentalId":"uuid-test","type":"invoice"}'
```

## Configuration de l'Email Sender

Dans Resend, vous devrez :

1. Vérifier le domaine `outiltech.com` (ou utiliser le domaine de test)
2. Configurer l'email d'envoi : `noreply@outiltech.com`

Si vous utilisez le domaine de test de Resend, modifiez le `from` dans `index.ts` :

```typescript
from: 'onboarding@resend.dev', // Pour les tests
```

## Logs et Debugging

Voir les logs de la fonction :

```bash
supabase functions logs send-invoice-email
```

## Notes Importantes

- La fonction utilise le Service Role Key pour accéder aux données sans restrictions RLS
- Les emails sont envoyés de manière asynchrone
- En cas d'erreur, vérifiez les logs de la fonction Edge
- La clé API Resend a un quota (3000 emails/mois en gratuit)
