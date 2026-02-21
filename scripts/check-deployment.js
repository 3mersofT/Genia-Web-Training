#!/usr/bin/env node

/**
 * Script de vérification pré-déploiement
 * Vérifie que tous les fichiers et configurations sont en place
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Liste des fichiers critiques
const CRITICAL_FILES = [
  // Configuration
  '.env.local',
  'package.json',
  'tsconfig.json',
  'next.config.js',
  'tailwind.config.ts',
  
  // Services et API
  'src/services/mistralService.ts',
  'src/app/api/chat/route.ts',
  'src/app/api/exercise/generate/route.ts',
  'src/app/api/exercise/evaluate/route.ts',
  'src/app/api/quotas/route.ts',
  
  // Composants
  'src/components/chat/GENIAChat.tsx',
  
  // Hooks et utilitaires
  'src/hooks/useGENIAChat.ts',
  'src/lib/geniaPrompts.ts',
  'src/lib/supabase/client.ts',
  'src/lib/supabase/server.ts',
  
  // Migrations SQL (dans l'ordre d'exécution)
  'supabase/migrations/001_initial_schema.sql',
  'supabase/migrations/003_genia_chat_tables.sql'
  // Note: 002_genia_chat_system.sql est obsolète et ne doit pas être utilisé
];

// Variables d'environnement requises
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'MISTRAL_API_KEY'
];

// Dépendances NPM requises
const REQUIRED_DEPENDENCIES = [
  '@supabase/supabase-js',
  '@supabase/auth-helpers-react',
  'framer-motion',
  'lucide-react',
  'next',
  'react',
  'tailwindcss'
];

function checkFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

function checkEnvVar(varName) {
  if (!fs.existsSync('.env.local')) {
    return false;
  }
  
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const regex = new RegExp(`^${varName}=.+`, 'm');
  return regex.test(envContent);
}

function checkDependency(depName) {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return (
      (packageJson.dependencies && packageJson.dependencies[depName]) ||
      (packageJson.devDependencies && packageJson.devDependencies[depName])
    );
  } catch (error) {
    return false;
  }
}

function printHeader(title) {
  console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
}

function printResult(name, success, optional = false) {
  const icon = success ? '✅' : (optional ? '⚠️' : '❌');
  const color = success ? colors.green : (optional ? colors.yellow : colors.red);
  console.log(`${color}${icon} ${name}${colors.reset}`);
}

async function main() {
  console.log(`${colors.blue}🔍 Vérification pré-déploiement GENIA${colors.reset}`);
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Vérifier les fichiers critiques
  printHeader('📁 Vérification des fichiers');
  for (const file of CRITICAL_FILES) {
    const exists = checkFile(file);
    printResult(file, exists, file.includes('migrations/002'));
    if (!exists && !file.includes('migrations/002')) {
      hasErrors = true;
    }
  }
  
  // Vérifier les variables d'environnement
  printHeader('🔐 Variables d\'environnement');
  
  if (!fs.existsSync('.env.local')) {
    console.log(`${colors.red}❌ Fichier .env.local manquant!${colors.reset}`);
    console.log(`${colors.yellow}   → Copier .env.example vers .env.local et remplir les valeurs${colors.reset}`);
    hasErrors = true;
  } else {
    for (const envVar of REQUIRED_ENV_VARS) {
      const exists = checkEnvVar(envVar);
      printResult(envVar, exists);
      if (!exists) {
        hasErrors = true;
      }
    }
  }
  
  // Vérifier les dépendances
  printHeader('📦 Dépendances NPM');
  for (const dep of REQUIRED_DEPENDENCIES) {
    const installed = checkDependency(dep);
    printResult(dep, installed);
    if (!installed) {
      hasErrors = true;
    }
  }
  
  // Vérifications supplémentaires
  printHeader('🔧 Vérifications supplémentaires');
  
  // Vérifier node_modules
  const nodeModulesExists = fs.existsSync('node_modules');
  printResult('node_modules installés', nodeModulesExists);
  if (!nodeModulesExists) {
    console.log(`${colors.yellow}   → Exécuter: npm install${colors.reset}`);
    hasWarnings = true;
  }
  
  // Vérifier la version de Node.js
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  const nodeVersionOk = majorVersion >= 18;
  printResult(`Node.js ${nodeVersion} (minimum v18)`, nodeVersionOk);
  if (!nodeVersionOk) {
    hasErrors = true;
  }
  
  // Résumé
  printHeader('📊 Résumé');
  
  if (hasErrors) {
    console.log(`${colors.red}❌ Des erreurs critiques ont été détectées.${colors.reset}`);
    console.log(`${colors.red}   Corrigez-les avant de déployer.${colors.reset}`);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`${colors.yellow}⚠️  Des avertissements ont été détectés.${colors.reset}`);
    console.log(`${colors.yellow}   Le déploiement peut fonctionner mais vérifiez les points mentionnés.${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ Tout est prêt pour le déploiement!${colors.reset}`);
  }
  
  // Instructions suivantes
  printHeader('🚀 Prochaines étapes');
  console.log('1. Assurez-vous que Supabase est configuré:');
  console.log(`   ${colors.blue}npm run db:push${colors.reset}`);
  console.log('\n2. Testez en local:');
  console.log(`   ${colors.blue}npm run dev${colors.reset}`);
  console.log('\n3. Build de production:');
  console.log(`   ${colors.blue}npm run build${colors.reset}`);
  console.log('\n4. Déployez sur Vercel:');
  console.log(`   ${colors.blue}vercel${colors.reset}`);
  
  console.log(`\n${colors.green}💡 Conseil: Testez d'abord avec quelques utilisateurs avant le déploiement complet.${colors.reset}`);
}

// Exécuter le script
main().catch(console.error);