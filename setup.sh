#!/bin/bash

# ========================================
# SETUP AUTOMATIQUE - PROMPT ENGINEERING PLATFORM
# ========================================

echo "🚀 Installation de la Plateforme E-Learning Prompt Engineering..."
echo "=================================================="
echo ""

# Vérifier Node.js
echo "📋 Vérification des prérequis..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js 18+ depuis https://nodejs.org"
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances npm..."
npm install

# Créer le fichier .env.local si nécessaire
if [ ! -f .env.local ]; then
    echo "⚙️ Création du fichier .env.local..."
    cp .env.local.example .env.local 2>/dev/null || true
fi

# Installer Supabase CLI si nécessaire
echo "🔧 Vérification de Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "📥 Installation de Supabase CLI..."
    npm install -g supabase
fi

echo ""
echo "✅ Installation terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Configurez votre projet Supabase sur https://app.supabase.com"
echo "2. Mettez à jour .env.local avec vos clés Supabase"
echo "3. Exécutez les migrations : npm run db:push"
echo "4. Lancez le serveur : npm run dev"
echo ""
echo "🔗 Documentation complète dans README.md"
