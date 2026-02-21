#!/usr/bin/env node

/**
 * Script de vérification pré-déploiement
 * Vérifie que tout est prêt pour la production
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

// Configuration des vérifications
const checks = {
  environment: {
    title: '🔐 Variables d\'environnement',
    items: []
  },
  files: {
    title: '📁 Fichiers requis',
    items: []
  },
  migrations: {
    title: '🗄️ Migrations SQL',
    items: []
  },
  dependencies: {
    title: '📦 Dépendances',
    items: []
  },
  code: {
    title: '💻 Code et Configuration',
    items: []
  }
};

let hasErrors = false;
let hasWarnings = false;

// Fonction helper pour afficher les résultats
function log(status, message) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  const colorMap = {
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    info: colors.blue
  };
  
  console.log(`${icons[status]} ${colorMap[status]}${message}${colors.reset}`);
  
  if (status === 'error') hasErrors = true;
  if (status === 'warning') hasWarnings = true;
}

// 1. Vérification des variables d'environnement
function checkEnvironmentVariables() {
  console.log(`\n${colors.bold}${checks.environment.title}${colors.reset}`);
  
  const envPath = path.join(__dirname, '..', '.env.local');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envPath)) {
    log('error', '.env.local n\'existe pas. Copiez .env.example vers .env.local');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'MISTRAL_API_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=.+`, 'm');
    if (regex.test(envContent)) {
      const value = envContent.match(regex)[0].split('=')[1];
      if (value.includes('your-') || value.includes('xxx')) {
        log('error', `${varName} n'est pas configuré (valeur par défaut détectée)`);
      } else {
        log('success', `${varName} est configuré`);
      }
    } else {
      log('error', `${varName} est manquant`);
    }
  });
  
  // Variables optionnelles
  const optionalVars = ['JWT_SECRET', 'COOKIE_SECRET'];
  optionalVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=.+`, 'm');
    if (!regex.test(envContent)) {
      log('warning', `${varName} est optionnel mais recommandé pour la production`);
    }
  });
}

// 2. Vérification des fichiers importants
function checkRequiredFiles() {
  console.log(`\n${colors.bold}${checks.files.title}${colors.reset}`);
  
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'tsconfig.json',
    'tailwind.config.ts',
    'src/middleware.ts',
    'public/favicon.ico',
    'public/manifest.json'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      log('success', `${file} présent`);
    } else {
      log('error', `${file} manquant`);
    }
  });
}

// 3. Vérification des migrations SQL
function checkMigrations() {
  console.log(`\n${colors.bold}${checks.migrations.title}${colors.reset}`);
  
  const migrationsPath = path.join(__dirname, '..', 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsPath)) {
    log('error', 'Dossier migrations manquant');
    return;
  }
  
  const files = fs.readdirSync(migrationsPath);
  const sqlFiles = files.filter(f => f.endsWith('.sql') && !f.startsWith('_'));
  const archiveFiles = files.filter(f => f.startsWith('_old_'));
  
  sqlFiles.sort().forEach(file => {
    log('success', `Migration: ${file}`);
  });
  
  if (archiveFiles.length > 0) {
    log('warning', `${archiveFiles.length} fichiers obsolètes trouvés (déplacés dans _archive)`);
  }
  
  // Vérifier l'ordre des migrations
  const expectedOrder = [
    '001_initial_schema.sql',
    '003_genia_chat_tables.sql',
    '004_init_demo_accounts.sql',
    '005_update_rate_limits.sql',
    '006_hybrid_content_system.sql',
    '007_feedback_system.sql',
    '008_genia_memory_system.sql',
    '009_daily_challenges_system.sql'
  ];
  
  expectedOrder.forEach(expected => {
    if (!sqlFiles.includes(expected)) {
      log('warning', `Migration attendue manquante: ${expected}`);
    }
  });
}

// 4. Vérification des dépendances
function checkDependencies() {
  console.log(`\n${colors.bold}${checks.dependencies.title}${colors.reset}`);
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const criticalDeps = [
    '@supabase/supabase-js',
    'next',
    'react',
    'react-dom',
    'framer-motion',
    'lucide-react'
  ];
  
  criticalDeps.forEach(dep => {
    if (packageContent.dependencies[dep]) {
      log('success', `${dep}: ${packageContent.dependencies[dep]}`);
    } else {
      log('error', `Dépendance critique manquante: ${dep}`);
    }
  });
  
  // Vérifier node_modules
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log('error', 'node_modules manquant - Exécutez: npm install');
  } else {
    log('success', 'node_modules présent');
  }
}

// 5. Vérifications du code
function checkCodeIntegrity() {
  console.log(`\n${colors.bold}${checks.code.title}${colors.reset}`);
  
  // Vérifier les composants critiques
  const criticalComponents = [
    'src/app/page.tsx',
    'src/app/(dashboard)/layout.tsx',
    'src/app/admin/page.tsx',
    'src/services/mistralService.ts',
    'src/lib/supabase/client.ts'
  ];
  
  criticalComponents.forEach(component => {
    const componentPath = path.join(__dirname, '..', component);
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Vérifier qu'il n'y a pas de console.log en production
      if (content.includes('console.log') && !component.includes('debug')) {
        log('warning', `${component} contient des console.log`);
      } else {
        log('success', `${component} vérifié`);
      }
      
      // Vérifier les TODO non résolus
      if (content.includes('TODO') || content.includes('FIXME')) {
        log('warning', `${component} contient des TODO/FIXME`);
      }
    } else {
      log('error', `Composant critique manquant: ${component}`);
    }
  });
  
  // Vérifier les données des modules
  const modulesPath = path.join(__dirname, '..', 'src', 'data', 'modules');
  if (fs.existsSync(modulesPath)) {
    const moduleFiles = fs.readdirSync(modulesPath);
    const jsonModules = moduleFiles.filter(f => f.endsWith('.json'));
    log('success', `${jsonModules.length} modules de formation trouvés`);
  } else {
    log('error', 'Dossier des modules de formation manquant');
  }
}

// 6. Résumé final
function printSummary() {
  console.log(`\n${colors.bold}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bold}📊 RÉSUMÉ DE LA VÉRIFICATION${colors.reset}`);
  console.log(`${colors.bold}${'='.repeat(50)}${colors.reset}\n`);
  
  if (hasErrors) {
    log('error', 'Des erreurs critiques ont été détectées');
    console.log(`\n${colors.red}${colors.bold}⚠️  NE PAS DÉPLOYER EN PRODUCTION${colors.reset}`);
    console.log('Corrigez d\'abord les erreurs ci-dessus.\n');
    process.exit(1);
  } else if (hasWarnings) {
    log('warning', 'Des avertissements ont été détectés');
    console.log(`\n${colors.yellow}${colors.bold}⚠️  DÉPLOIEMENT POSSIBLE MAIS AVEC PRÉCAUTIONS${colors.reset}`);
    console.log('Vérifiez les avertissements ci-dessus.\n');
  } else {
    log('success', 'Toutes les vérifications sont passées avec succès!');
    console.log(`\n${colors.green}${colors.bold}✨ PRÊT POUR LE DÉPLOIEMENT EN PRODUCTION!${colors.reset}\n`);
  }
  
  // Instructions suivantes
  console.log(`${colors.bold}Prochaines étapes:${colors.reset}`);
  console.log('1. Committez vos changements: git add . && git commit -m "Ready for production"');
  console.log('2. Poussez sur GitHub: git push origin main');
  console.log('3. Déployez sur Vercel: vercel --prod');
  console.log('4. Configurez les variables d\'environnement sur Vercel');
  console.log('5. Testez l\'application en production\n');
}

// Exécution du script
console.log(`${colors.bold}${colors.blue}`);
console.log('╔════════════════════════════════════════════════╗');
console.log('║     VÉRIFICATION PRÉ-DÉPLOIEMENT v2.1         ║');
console.log('║         GENIA Web Training Platform           ║');
console.log('╚════════════════════════════════════════════════╝');
console.log(`${colors.reset}`);

// Lancer toutes les vérifications
checkEnvironmentVariables();
checkRequiredFiles();
checkMigrations();
checkDependencies();
checkCodeIntegrity();
printSummary();
