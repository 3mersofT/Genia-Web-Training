#!/bin/bash

# ============================================
# Script de Déploiement Rapide GENIA v2.1
# ============================================

echo "================================================"
echo "   🚀 DÉPLOIEMENT GENIA WEB TRAINING v2.1"
echo "================================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les étapes
step() {
    echo -e "${BLUE}▶ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Vérification pré-déploiement
step "Étape 1: Vérification pré-déploiement..."
if [ -f "scripts/pre-deployment-check.js" ]; then
    node scripts/pre-deployment-check.js
    if [ $? -ne 0 ]; then
        error "La vérification pré-déploiement a échoué. Corrigez les erreurs avant de continuer."
    fi
else
    warning "Script de vérification non trouvé. Continuons..."
fi
echo ""

# 2. Vérification du fichier .env.local
step "Étape 2: Vérification de la configuration..."
if [ ! -f ".env.local" ]; then
    error "Le fichier .env.local n'existe pas. Créez-le à partir de .env.example"
fi

# Vérifier les variables essentielles
required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "MISTRAL_API_KEY"
)

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env.local; then
        error "Variable manquante dans .env.local: ${var}"
    fi
done
success "Configuration vérifiée"
echo ""

# 3. Installation des dépendances
step "Étape 3: Installation des dépendances..."
npm install --silent
if [ $? -eq 0 ]; then
    success "Dépendances installées"
else
    error "Erreur lors de l'installation des dépendances"
fi
echo ""

# 4. Build de production
step "Étape 4: Build de production..."
npm run build
if [ $? -eq 0 ]; then
    success "Build réussi"
else
    error "Erreur lors du build"
fi
echo ""

# 5. Tests (optionnel)
step "Étape 5: Tests..."
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    npm test --passWithNoTests
    if [ $? -eq 0 ]; then
        success "Tests passés"
    else
        warning "Certains tests ont échoué"
    fi
else
    warning "Pas de tests configurés"
fi
echo ""

# 6. Git status
step "Étape 6: Vérification Git..."
if [ -d ".git" ]; then
    # Vérifier s'il y a des changements non commités
    if [[ $(git status --porcelain) ]]; then
        warning "Des changements non commités détectés"
        echo "Fichiers modifiés:"
        git status --short
        echo ""
        read -p "Voulez-vous commiter ces changements? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            read -p "Message de commit: " commit_msg
            git commit -m "${commit_msg:-Release v2.1}"
            success "Changements commités"
        fi
    else
        success "Aucun changement non commité"
    fi
else
    warning "Pas de repository Git initialisé"
fi
echo ""

# 7. Déploiement
step "Étape 7: Options de déploiement..."
echo "Choisissez votre méthode de déploiement:"
echo "1) Vercel (recommandé)"
echo "2) GitHub Pages"
echo "3) Export statique uniquement"
echo "4) Passer cette étape"
read -p "Votre choix (1-4): " deploy_choice

case $deploy_choice in
    1)
        step "Déploiement sur Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
            success "Déploiement Vercel lancé"
        else
            warning "Vercel CLI non installé"
            echo "Installez avec: npm i -g vercel"
        fi
        ;;
    2)
        step "Préparation pour GitHub Pages..."
        npm run export
        success "Export statique créé dans /out"
        echo "Configurez GitHub Pages pour utiliser le dossier /out"
        ;;
    3)
        step "Export statique..."
        npm run export
        success "Export créé dans /out"
        ;;
    4)
        echo "Déploiement ignoré"
        ;;
    *)
        warning "Choix invalide"
        ;;
esac
echo ""

# 8. Instructions finales
echo "================================================"
echo "           📋 ÉTAPES FINALES"
echo "================================================"
echo ""
echo "Si vous avez déployé sur Vercel:"
echo "1. Allez sur https://vercel.com/dashboard"
echo "2. Configurez les variables d'environnement"
echo "3. Ajoutez votre domaine personnalisé"
echo ""
echo "Sur Supabase (Production):"
echo "1. Créez un nouveau projet si nécessaire"
echo "2. Exécutez les migrations dans l'ordre:"
echo "   - 001_initial_schema.sql"
echo "   - 003_genia_chat_tables.sql"
echo "   - 004_init_demo_accounts.sql (optionnel)"
echo "   - 005_update_rate_limits.sql"
echo "   - 006_hybrid_content_system.sql"
echo "   - 007_feedback_system.sql"
echo "   - 008_genia_memory_system.sql"
echo "   - 009_daily_challenges_system.sql"
echo ""
echo "Tests finaux:"
echo "1. Testez la création de compte"
echo "2. Testez la connexion"
echo "3. Testez le chat GENIA"
echo "4. Vérifiez le dashboard admin"
echo ""
success "Script de déploiement terminé!"
echo ""
echo "================================================"
echo "     🎉 GENIA WEB TRAINING v2.1 PRÊT!"
echo "================================================"
