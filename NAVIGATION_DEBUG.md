# 🎯 Guide de Test - Navigation et Routing

## ✅ Améliorations Implémentées

### 1. Logs de Débogage Console
Le système affiche maintenant automatiquement dans la console (F12):

#### Au Chargement de la Page:
```
📋 Dashboard Layout Loaded: {
  userRole: "super_admin",
  menuItems: 8,
  currentPath: "/dashboard",
  menu: [
    { label: "Tableau de bord", href: "/dashboard" },
    { label: "Utilisateurs", href: "/dashboard/users" },
    ...
  ]
}
```

#### À Chaque Clic sur un Menu:
```
🔗 Navigation Click: {
  from: "/dashboard",
  to: "/dashboard/users",
  label: "Utilisateurs",
  userRole: "super_admin"
}
```

### 2. Comment Tester le Routing

#### Étape 1: Ouvrir la Console
```
Appuyez sur F12
Allez dans l'onglet "Console"
```

#### Étape 2: Recharger la Page
```
F5 ou Cmd/Ctrl+R
```
Vous devriez voir: `📋 Dashboard Layout Loaded:`

#### Étape 3: Cliquer sur un Élément du Menu
```
Cliquez sur n'importe quel item (ex: "Utilisateurs")
```
Vous devriez voir: `🔗 Navigation Click:`

#### Étape 4: Vérifier le Résultat
- ✅ L'URL dans la barre d'adresse change
- ✅ Le contenu de la page change
- ✅ L'élément cliqué est surligné
- ✅ Pas d'erreur rouge dans la console

## 🔍 Diagnostic Visuel

### Résultat Attendu (✅ OK)
1. **Au chargement:**
   - Message `📋 Dashboard Layout Loaded` dans console
   - Menu sidebar visible
   - Bon rôle affiché (ex: "Super Admin")

2. **Au clic:**
   - Message `🔗 Navigation Click` dans console
   - URL change immédiatement
   - Page se recharge avec nouveau contenu
   - Menu highlight le bon item

### Symptômes de Problème (❌ Problème)

#### Symptôme A: Clic → Rien ne se passe
**Console devrait montrer:**
- ✅ `🔗 Navigation Click` apparaît
- ❌ Mais pas de changement d'URL

**Cause probable:** 
- Route non définie dans App.tsx
- ProtectedRoute bloque l'accès

**Actions:**
1. Noter l'URL `to:` dans le log
2. Vérifier que cette route existe dans App.tsx
3. Vérifier les `allowedRoles` pour votre rôle

#### Symptôme B: Clic → Erreur dans console
**Console montrera:**
- ❌ Erreur rouge avec message

**Actions:**
1. Lire le message d'erreur
2. Si "Cannot GET /dashboard/XXX" → Route manquante
3. Si "Access denied" → Problème de permissions

#### Symptôme C: Aucun log n'apparaît
**Console vide = Problème grave**

**Actions:**
1. Vérifier que F12 est bien ouvert
2. Vérifier l'onglet "Console" (pas Network, etc.)
3. Recharger la page complètement (Cmd/Ctrl+Shift+R)
4. Si toujours rien → Problème de build

## 📋 Checklist Complète

### Test 1: Chargement Initial
- [ ] Ouvrir http://localhost:5173/dashboard
- [ ] F12 → Console
- [ ] Voir message `📋 Dashboard Layout Loaded`
- [ ] Vérifier que `userRole` est correct
- [ ] Vérifier que `menuItems` > 0

### Test 2: Navigation par Clic
- [ ] Cliquer sur premier élément du menu
- [ ] Voir message `🔗 Navigation Click`
- [ ] URL change
- [ ] Contenu change
- [ ] Item surligné

### Test 3: Navigation par URL
- [ ] Copier: http://localhost:5173/dashboard/users
- [ ] Coller dans barre d'adresse
- [ ] Appuyer sur Entrée
- [ ] Page se charge correctement
- [ ] Menu highlight "Utilisateurs"

### Test 4: Rechargement
- [ ] Sur n'importe quelle page dashboard
- [ ] Appuyer sur F5
- [ ] Page se recharge correctement
- [ ] Pas de redirection vers /
- [ ] Menu toujours correct

## 🐛 Debugging Avancé

### Voir Tous les Menus Disponibles
Dans la console, tapez:
```javascript
// Copier-coller dans console
console.table([
  { role: 'super_admin', items: 8 },
  { role: 'admin', items: 5 },
  { role: 'technician', items: 5 },
  { role: 'stock_manager', items: 4 },
  { role: 'client', items: 4 },
  { role: 'accountant', items: 4 }
]);
```

### Forcer un Rôle (Test)
Pour tester un autre rôle sans changer dans Supabase:
```javascript
// ⚠️ TEMPORAIRE - NE PAS UTILISER EN PRODUCTION
localStorage.setItem('test_role', 'technician');
// Puis recharger la page
```

### Vérifier React Router
Dans console:
```javascript
// Voir l'URL actuelle selon React Router
window.location.pathname
```

## 🎯 Scénarios de Test par Rôle

### Super Admin
```
✅ Devrait voir: 8 items
✅ Peut accéder à: Tout
✅ Dashboard home: /dashboard (reste sur dashboard admin)
```

### Technician
```
✅ Devrait voir: 5 items
✅ Peut accéder à: Interventions, Planning, Stats, Settings
✅ Dashboard home: /dashboard → redirige vers /dashboard/technician
```

### Client
```  
✅ Devrait voir: 4 items
✅ Peut accéder à: Catalogue, Mes locations, Factures
✅ Dashboard home: /dashboard → redirige vers /dashboard/client
```

### Stock Manager
```
✅ Devrait voir: 4 items
✅ Peut accéder à: Stock, Planning, Maintenance
✅ Dashboard home: /dashboard → redirige vers /dashboard/stock-manager
```

### Accountant
```
✅ Devrait voir: 4 items
✅ Peut accéder à: Facturation, États financiers, Paiements
✅ Dashboard home: /dashboard → redirige vers /dashboard/accountant
```

## 📊 Rapport de Test

Après vos tests, notez:
```
✅ Chargement initial: OK / PAS OK
✅ Logs console visibles: OK / PAS OK
✅ Navigation par clic: OK / PAS OK
✅ Navigation par URL: OK / PAS OK
✅ Rechargement page: OK / PAS OK
✅ Bon menu pour rôle: OK / PAS OK
```

Si tous ✅ = Routing fonctionne correctement!
