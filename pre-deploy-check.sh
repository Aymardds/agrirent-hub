#!/bin/bash

# Script de vérification pré-déploiement OUTILTECH
# Ce script vérifie que tout est prêt pour le déploiement

echo "🚀 OUTILTECH - Vérification pré-déploiement"
echo "==========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
ERRORS=0
WARNINGS=0

# Fonction de vérification
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ((ERRORS++))
    fi
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# 1. Vérifier que Node.js est installé
echo "📦 Vérification de l'environnement..."
command -v node >/dev/null 2>&1
check $? "Node.js est installé ($(node --version))"

command -v npm >/dev/null 2>&1
check $? "npm est installé ($(npm --version))"

# 2. Vérifier que les dépendances sont installées
echo ""
echo "📚 Vérification des dépendances..."
if [ -d "node_modules" ]; then
    check 0 "node_modules existe"
else
    check 1 "node_modules n'existe pas - Exécutez 'npm install'"
fi

# 3. Vérifier le fichier .env
echo ""
echo "🔐 Vérification des variables d'environnement..."
if [ -f ".env" ]; then
    check 0 "Fichier .env existe"
    
    # Vérifier les variables importantes
    if grep -q "VITE_SUPABASE_URL" .env; then
        check 0 "VITE_SUPABASE_URL est défini"
    else
        check 1 "VITE_SUPABASE_URL n'est pas défini"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        check 0 "VITE_SUPABASE_ANON_KEY est défini"
    else
        check 1 "VITE_SUPABASE_ANON_KEY n'est pas défini"
    fi
    
    if grep -q "VITE_CINETPAY_API_KEY" .env; then
        check 0 "VITE_CINETPAY_API_KEY est défini"
    else
        warn "VITE_CINETPAY_API_KEY n'est pas défini (nécessaire pour les paiements)"
    fi
else
    check 1 "Fichier .env n'existe pas"
fi

# 4. Vérifier les fichiers de configuration
echo ""
echo "⚙️ Vérification de la configuration..."
[ -f "package.json" ]
check $? "package.json existe"

[ -f "vite.config.ts" ]
check $? "vite.config.ts existe"

[ -f "vercel.json" ]
check $? "vercel.json existe"

[ -f ".gitignore" ]
check $? ".gitignore existe"

# 5. Test du build
echo ""
echo "🔨 Test du build de production..."
if npm run build > /dev/null 2>&1; then
    check 0 "Build de production réussi"
    
    # Vérifier que le dossier dist existe
    if [ -d "dist" ]; then
        check 0 "Dossier dist créé"
        
        # Vérifier la taille du bundle
        BUNDLE_SIZE=$(du -sh dist | cut -f1)
        echo "   📊 Taille du bundle: $BUNDLE_SIZE"
    else
        check 1 "Dossier dist n'existe pas"
    fi
else
    check 1 "Échec du build de production"
fi

# 6. Vérifier Git
echo ""
echo "📝 Vérification Git..."
if [ -d ".git" ]; then
    check 0 "Dépôt Git initialisé"
    
    # Vérifier les fichiers non committés
    if [ -n "$(git status --porcelain)" ]; then
        warn "Vous avez des modifications non committées"
        echo "   Fichiers modifiés: $(git status --porcelain | wc -l)"
    else
        check 0 "Tous les fichiers sont committés"
    fi
    
    # Vérifier la branche
    BRANCH=$(git branch --show-current)
    echo "   🌿 Branche actuelle: $BRANCH"
    if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
        check 0 "Sur la branche principale"
    else
        warn "Vous n'êtes pas sur la branche principale"
    fi
else
    check 1 "Dépôt Git non initialisé"
fi

# Résumé
echo ""
echo "=========================================="
echo "📊 Résumé"
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Tout est prêt pour le déploiement ! 🎉${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Commitez et poussez vos changements sur GitHub"
    echo "2. Allez sur vercel.com et importez votre projet"
    echo "3. Configurez les variables d'environnement"
    echo "4. Déployez !"
    echo ""
    echo "Ou utilisez la CLI:"
    echo "  vercel --prod"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS avertissement(s) - Le déploiement peut continuer${NC}"
    echo ""
    echo "Revoyez les avertissements ci-dessus avant de déployer."
    exit 0
else
    echo -e "${RED}✗ $ERRORS erreur(s) détectée(s) - Corrigez-les avant de déployer${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS avertissement(s)${NC}"
    fi
    echo ""
    echo "Corrigez les erreurs ci-dessus avant de continuer."
    exit 1
fi
