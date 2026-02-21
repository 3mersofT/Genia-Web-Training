#!/usr/bin/env node

/**
 * Script d'installation automatique GENIA
 * Configure l'environnement et vérifie les prérequis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Couleurs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function execCommand(command, silent = false) {
  try {
    if (!silent) {
      console.log(`${colors.blue}Exécution: ${command}${colors.reset}`);
    }
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    return null;
  }
}

function printHeader(title) {
  console.log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.magenta}  ${title}${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}\n`);
}

function printSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function printError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function printInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

async function checkPrerequisites() {
  printHeader('Vérification des prérequis');
  
  let allGood = true;
  
  // Node.js
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  if (majorVersion >= 18) {
    printSuccess(`Node.js ${nodeVersion} installé`);
  } else {
    printError(`Node.js ${nodeVersion} détecté. Version 18+ requise`);
    allGood = false;
  }
  
  // npm/pnpm
  const npmVersion = execCommand('npm --version', true);
  if (npmVersion) {
    printSuccess(`npm ${npmVersion.trim()} installé`);
  } else {
    printError('npm non détecté');
    allGood = false;
  }
  
  // Git
  const gitVersion = execCommand('git --version', true);
  if (gitVersion) {
    printSuccess(`Git installé`);
  } else {
    printWarning('Git non détecté (optionnel)');
  }
  
  return allGood;
}

async function setupEnvironment() {
  printHeader('Configuration de l\'environnement');
  
  // Vérifier si .env.local existe déjà
  if (fs.existsSync('.env.local')) {
    const overwrite = await question(`${colors.yellow}.env.local existe déjà. Écraser? (y/N): ${colors.reset}`);
    if (overwrite.toLowerCase() !== 'y') {
      printInfo('Configuration environnement ignorée');
      return;
    }
  }
  
  // Copier .env.example
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env.local');
    printSuccess('.env.local créé depuis .env.example');
  } else {
    // Créer un .env.local minimal
    const envContent = `# Configuration Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Configuration Mistral AI
MISTRAL_API_KEY=

# Configuration Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
`;
    fs.writeFileSync('.env.local', envContent);
    printSuccess('.env.local créé');
  }
  
  console.log('\n' + colors.yellow + 'Configuration requise:' + colors.reset);
  console.log('1. Créer un projet Supabase: https://supabase.com');
  console.log('2. Obtenir une clé API Mistral: https://console.mistral.ai');
  console.log('3. Éditer .env.local avec vos clés\n');
  
  const openEditor = await question('Ouvrir .env.local dans votre éditeur? (y/N): ');
  if (openEditor.toLowerCase() === 'y') {
    // Essayer d'ouvrir avec l'éditeur par défaut
    const editors = ['code', 'nano', 'vim', 'notepad'];
    for (const editor of editors) {
      if (execCommand(`${editor} .env.local`, true)) {
        break;
      }
    }
  }
}

async function installDependencies() {
  printHeader('Installation des dépendances');
  
  const usePackageManager = await question('Gestionnaire de paquets (npm/pnpm)? [npm]: ');
  const pm = usePackageManager.toLowerCase() === 'pnpm' ? 'pnpm' : 'npm';
  
  printInfo(`Installation avec ${pm}...`);
  const result = execCommand(`${pm} install`);
  
  if (result) {
    printSuccess('Dépendances installées');
  } else {
    printError('Erreur lors de l\'installation');
    return false;
  }
  
  return true;
}

async function setupDatabase() {
  printHeader('Configuration de la base de données');
  
  console.log('Pour configurer Supabase:');
  console.log('1. Connectez-vous à votre dashboard Supabase');
  console.log('2. Allez dans SQL Editor');
  console.log('3. Exécutez les migrations dans l\'ordre:\n');
  
  const migrations = [
    'supabase/migrations/001_initial_schema.sql',
    'supabase/migrations/003_genia_chat_tables.sql'
  ];
  
  migrations.forEach((migration, index) => {
    if (fs.existsSync(migration)) {
      console.log(`   ${index + 1}. ${migration}`);
    }
  });
  
  console.log('\n' + colors.blue + 'Alternative: Utiliser Supabase CLI' + colors.reset);
  console.log('npx supabase db push\n');
  
  const hasSupabaseCLI = await question('Avez-vous Supabase CLI installé? (y/N): ');
  if (hasSupabaseCLI.toLowerCase() === 'y') {
    const projectRef = await question('Project Reference Supabase: ');
    if (projectRef) {
      execCommand(`npx supabase link --project-ref ${projectRef}`);
      execCommand('npx supabase db push');
      printSuccess('Migrations appliquées via Supabase CLI');
    }
  }
}

async function finalChecks() {
  printHeader('Vérification finale');
  
  // Exécuter le script de vérification
  if (fs.existsSync('scripts/check-deployment.js')) {
    console.log('Exécution des vérifications...\n');
    execCommand('node scripts/check-deployment.js');
  }
}

async function main() {
  console.clear();
  console.log(`
${colors.blue}╔══════════════════════════════════════════════════════════╗
║                                                            ║
║     🚀 INSTALLATION PLATEFORME GENIA                      ║
║     Formation au Prompt Engineering avec IA Mistral       ║
║                                                            ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
`);
  
  // Étape 1: Prérequis
  const prerequisitesOk = await checkPrerequisites();
  if (!prerequisitesOk) {
    printError('\nCorrigez les prérequis avant de continuer');
    process.exit(1);
  }
  
  // Étape 2: Environnement
  await setupEnvironment();
  
  // Étape 3: Dépendances
  const depsInstalled = await installDependencies();
  if (!depsInstalled) {
    printError('\nProblème avec l\'installation des dépendances');
    const continueAnyway = await question('Continuer quand même? (y/N): ');
    if (continueAnyway.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }
  
  // Étape 4: Base de données
  await setupDatabase();
  
  // Étape 5: Vérifications finales
  await finalChecks();
  
  // Succès!
  printHeader('🎉 Installation terminée!');
  
  console.log(`
${colors.green}Prochaines étapes:${colors.reset}

1. ${colors.blue}Complétez .env.local${colors.reset} avec vos clés API

2. ${colors.blue}Lancez le développement:${colors.reset}
   npm run dev

3. ${colors.blue}Ouvrez votre navigateur:${colors.reset}
   http://localhost:3000

${colors.yellow}Documentation complète:${colors.reset} README.md
${colors.yellow}Support:${colors.reset} https://github.com/yourusername/prompt-engineering-platform

${colors.magenta}Bon développement avec GENIA! 🚀${colors.reset}
`);
  
  rl.close();
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  printError(`Erreur inattendue: ${error.message}`);
  process.exit(1);
});

// Lancer le script
main().catch((error) => {
  printError(`Erreur: ${error.message}`);
  process.exit(1);
});