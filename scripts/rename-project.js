#!/usr/bin/env node

/**
 * Script de renommage du projet en GENIA Web Training
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Fichiers à mettre à jour
const FILES_TO_UPDATE = [
  {
    path: 'package.json',
    replacements: [
      { from: '"name": "prompt-engineering-platform"', to: '"name": "genia-web-training"' }
    ]
  },
  {
    path: 'README.md',
    replacements: [
      { from: 'Plateforme de Formation au Prompt Engineering', to: 'GENIA Web Training - Plateforme de Formation au Prompt Engineering' },
      { from: 'prompt-engineering-platform', to: 'genia-web-training' }
    ]
  },
  {
    path: '.env.example',
    replacements: [
      { from: '# Configuration Application', to: '# Configuration GENIA Web Training' }
    ]
  }
];

// Texte à ajouter dans certains fichiers
const BRANDING_UPDATES = {
  'src/app/layout.tsx': {
    title: 'GENIA Web Training - Formation Prompt Engineering',
    description: 'Maîtrisez le Prompt Engineering avec GENIA, la plateforme française utilisant Mistral AI'
  }
};

function updateFile(filePath, replacements) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`${colors.yellow}⚠️  Fichier non trouvé: ${filePath}${colors.reset}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  for (const { from, to } of replacements) {
    if (content.includes(from)) {
      content = content.replace(new RegExp(from, 'g'), to);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`${colors.green}✅ Mis à jour: ${filePath}${colors.reset}`);
    return true;
  }
  
  return false;
}

function main() {
  console.log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.magenta}  🚀 RENOMMAGE EN GENIA WEB TRAINING${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}\n`);
  
  let updatedCount = 0;
  
  // Mettre à jour les fichiers
  for (const file of FILES_TO_UPDATE) {
    if (updateFile(file.path, file.replacements)) {
      updatedCount++;
    }
  }
  
  // Créer/Mettre à jour le fichier de métadonnées
  const metadata = {
    name: 'GENIA Web Training',
    version: '1.0.0',
    description: 'Plateforme française de formation au Prompt Engineering avec Mistral AI',
    author: 'Hemerson KOFFI',
    brand: {
      colors: {
        primary: '#2563eb', // blue-600
        secondary: '#9333ea', // purple-600
        accent: '#f59e0b' // amber-500
      },
      tagline: 'Maîtrisez le Prompt Engineering avec l\'IA Française',
      logo: '/icons/genia-logo.svg'
    },
    features: [
      '100% Souverain (Mistral AI)',
      'Méthode GENIA en 5 piliers',
      'Assistant IA personnel 24/7',
      'Gamification complète',
      'RGPD natif'
    ]
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'genia-metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  console.log(`${colors.green}✅ Créé: genia-metadata.json${colors.reset}`);
  
  // Résumé
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}  📊 RÉSUMÉ${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
  
  console.log(`${colors.green}✅ ${updatedCount} fichiers mis à jour${colors.reset}`);
  console.log(`${colors.green}✅ Métadonnées créées${colors.reset}`);
  
  // Instructions
  console.log(`\n${colors.yellow}📝 Prochaines étapes :${colors.reset}`);
  console.log('1. Vérifier les logos dans /public/icons');
  console.log('2. Mettre à jour le favicon');
  console.log('3. Configurer les meta tags SEO');
  console.log('4. Tester avec: npm run dev');
  
  console.log(`\n${colors.magenta}✨ Renommage terminé ! Bienvenue dans GENIA Web Training !${colors.reset}\n`);
}

main();