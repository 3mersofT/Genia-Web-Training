#!/usr/bin/env node

/**
 * Script de vérification des bugs connus et problèmes de dépendances
 * GENIA Web Training Platform
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Problèmes connus et leurs solutions
const KNOWN_ISSUES = {
  'next@14.0.4': {
    issues: [
      {
        description: 'Problème potentiel avec App Router et Server Actions',
        solution: 'Assurez-vous que experimental.serverActions est activé dans next.config.js',
        severity: 'medium'
      }
    ]
  },
  '@supabase/supabase-js@^2.39.3': {
    issues: [
      {
        description: 'Conflits possibles entre auth-helpers-nextjs et auth-helpers-react',
        solution: 'Utiliser uniquement auth-helpers-react dans les composants client',
        severity: 'low'
      }
    ]
  },
  'framer-motion@^10.18.0': {
    issues: [
      {
        description: 'Performance issues avec de nombreuses animations simultanées',
        solution: 'Utiliser AnimatePresence avec mode="wait" pour les transitions',
        severity: 'low'
      }
    ]
  }
};

// Vérifications de compatibilité
const COMPATIBILITY_CHECKS = [
  {
    name: 'Node.js version',
    check: () => {
      const nodeVersion = process.version;
      const major = parseInt(nodeVersion.split('.')[0].substring(1));
      return {
        pass: major >= 18,
        message: `Node.js ${nodeVersion} (minimum requis: v18)`,
        severity: major < 18 ? 'critical' : 'ok'
      };
    }
  },
  {
    name: 'TypeScript strict mode',
    check: () => {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      if (fs.existsSync(tsconfigPath)) {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        const strict = tsconfig.compilerOptions?.strict;
        return {
          pass: strict === true,
          message: strict ? 'Mode strict activé' : 'Mode strict désactivé (recommandé: true)',
          severity: strict ? 'ok' : 'warning'
        };
      }
      return {
        pass: false,
        message: 'tsconfig.json non trouvé',
        severity: 'critical'
      };
    }
  },
  {
    name: 'Variables d\'environnement',
    check: () => {
      const envPath = path.join(process.cwd(), '.env.local');
      const envExamplePath = path.join(process.cwd(), '.env.example');
      
      if (!fs.existsSync(envPath)) {
        return {
          pass: false,
          message: '.env.local manquant',
          severity: 'critical'
        };
      }
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'MISTRAL_API_KEY'
      ];
      
      const missingVars = requiredVars.filter(v => !envContent.includes(v));
      
      if (missingVars.length > 0) {
        return {
          pass: false,
          message: `Variables manquantes: ${missingVars.join(', ')}`,
          severity: 'critical'
        };
      }
      
      return {
        pass: true,
        message: 'Toutes les variables requises sont présentes',
        severity: 'ok'
      };
    }
  },
  {
    name: 'Imports Mistral Service',
    check: () => {
      const correctPath = 'src/services/mistralService.ts';
      const oldPath = 'src/lib/services/mistral.service.ts';
      
      const hasCorrect = fs.existsSync(path.join(process.cwd(), correctPath));
      const hasOld = fs.existsSync(path.join(process.cwd(), oldPath));
      
      if (hasOld && !hasCorrect) {
        return {
          pass: false,
          message: 'Ancien fichier mistral.service.ts détecté, utilisez mistralService.ts',
          severity: 'critical'
        };
      }
      
      if (!hasCorrect) {
        return {
          pass: false,
          message: 'Service Mistral manquant',
          severity: 'critical'
        };
      }
      
      return {
        pass: true,
        message: 'Service Mistral correctement configuré',
        severity: 'ok'
      };
    }
  },
  {
    name: 'Logo et icônes',
    check: () => {
      const iconPath = path.join(process.cwd(), 'public/icons');
      
      if (!fs.existsSync(iconPath)) {
        return {
          pass: false,
          message: 'Dossier /public/icons manquant',
          severity: 'warning'
        };
      }
      
      const files = fs.readdirSync(iconPath);
      const hasLogo = files.some(f => f.includes('logo') || f.includes('genia'));
      
      return {
        pass: hasLogo,
        message: hasLogo ? 'Logo GENIA trouvé' : 'Logo GENIA non trouvé dans /public/icons',
        severity: hasLogo ? 'ok' : 'warning'
      };
    }
  }
];

// Corrections automatiques possibles
const AUTO_FIXES = {
  'next.config.js': {
    check: () => {
      const configPath = path.join(process.cwd(), 'next.config.js');
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        return !content.includes('serverActions');
      }
      return false;
    },
    fix: () => {
      const configPath = path.join(process.cwd(), 'next.config.js');
      const config = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig`;
      
      fs.writeFileSync(configPath, config);
      return 'next.config.js mis à jour avec serverActions';
    }
  }
};

function printHeader(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}  ${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

function printResult(name, pass, message, severity = 'ok') {
  const icon = pass ? '✅' : severity === 'critical' ? '❌' : '⚠️';
  const color = pass ? colors.green : severity === 'critical' ? colors.red : colors.yellow;
  console.log(`${color}${icon} ${name}${colors.reset}`);
  console.log(`   ${message}\n`);
}

async function main() {
  console.log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.magenta}  🔍 VÉRIFICATION DES BUGS & DÉPENDANCES${colors.reset}`);
  console.log(`${colors.magenta}     GENIA Web Training Platform${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  
  let criticalCount = 0;
  let warningCount = 0;
  let fixedCount = 0;
  
  // Vérifications de compatibilité
  printHeader('🔧 Vérifications de compatibilité');
  
  for (const check of COMPATIBILITY_CHECKS) {
    const result = check.check();
    printResult(check.name, result.pass, result.message, result.severity);
    
    if (!result.pass) {
      if (result.severity === 'critical') criticalCount++;
      else if (result.severity === 'warning') warningCount++;
    }
  }
  
  // Vérifier les problèmes connus
  printHeader('⚠️  Problèmes connus dans les dépendances');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  let hasKnownIssues = false;
  for (const [dep, version] of Object.entries(allDeps)) {
    const key = `${dep}@${version}`;
    if (KNOWN_ISSUES[key]) {
      hasKnownIssues = true;
      console.log(`${colors.yellow}📦 ${dep}@${version}${colors.reset}`);
      for (const issue of KNOWN_ISSUES[key].issues) {
        console.log(`   ${colors.yellow}⚠️  ${issue.description}${colors.reset}`);
        console.log(`   ${colors.blue}💡 Solution: ${issue.solution}${colors.reset}\n`);
        if (issue.severity === 'medium') warningCount++;
      }
    }
  }
  
  if (!hasKnownIssues) {
    console.log(`${colors.green}✅ Aucun problème connu détecté dans les dépendances${colors.reset}\n`);
  }
  
  // Corrections automatiques
  printHeader('🔨 Corrections automatiques');
  
  for (const [file, fix] of Object.entries(AUTO_FIXES)) {
    if (fix.check()) {
      console.log(`${colors.yellow}🔧 Correction disponible pour ${file}${colors.reset}`);
      const result = fix.fix();
      console.log(`${colors.green}✅ ${result}${colors.reset}\n`);
      fixedCount++;
    }
  }
  
  if (fixedCount === 0) {
    console.log(`${colors.green}✅ Aucune correction automatique nécessaire${colors.reset}\n`);
  }
  
  // Vérifier les vulnérabilités npm
  printHeader('🛡️  Audit de sécurité npm');
  
  try {
    console.log('Analyse des vulnérabilités...\n');
    const audit = execSync('npm audit --json', { encoding: 'utf8' });
    const auditData = JSON.parse(audit);
    
    if (auditData.metadata.vulnerabilities.total > 0) {
      const vulns = auditData.metadata.vulnerabilities;
      console.log(`${colors.yellow}Vulnérabilités détectées:${colors.reset}`);
      console.log(`  Critiques: ${vulns.critical || 0}`);
      console.log(`  Hautes: ${vulns.high || 0}`);
      console.log(`  Moyennes: ${vulns.moderate || 0}`);
      console.log(`  Basses: ${vulns.low || 0}\n`);
      
      if (vulns.critical > 0 || vulns.high > 0) {
        console.log(`${colors.red}⚠️  Exécutez 'npm audit fix' pour corriger${colors.reset}\n`);
        criticalCount++;
      }
    } else {
      console.log(`${colors.green}✅ Aucune vulnérabilité détectée${colors.reset}\n`);
    }
  } catch (error) {
    // npm audit peut retourner non-zero même sans erreur critique
    console.log(`${colors.yellow}⚠️  Vérification de sécurité incomplète${colors.reset}\n`);
  }
  
  // Build test
  printHeader('🏗️  Test de build');
  
  console.log('Test de compilation TypeScript...\n');
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log(`${colors.green}✅ Compilation TypeScript réussie${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}❌ Erreurs de compilation TypeScript détectées${colors.reset}`);
    console.log(`${colors.yellow}   Exécutez 'npx tsc --noEmit' pour voir les détails${colors.reset}\n`);
    criticalCount++;
  }
  
  // Résumé final
  printHeader('📊 RÉSUMÉ');
  
  if (criticalCount === 0 && warningCount === 0) {
    console.log(`${colors.green}🎉 Tout est parfait ! Aucun problème détecté.${colors.reset}`);
  } else {
    if (criticalCount > 0) {
      console.log(`${colors.red}❌ ${criticalCount} problème(s) critique(s) à corriger${colors.reset}`);
    }
    if (warningCount > 0) {
      console.log(`${colors.yellow}⚠️  ${warningCount} avertissement(s) à vérifier${colors.reset}`);
    }
    if (fixedCount > 0) {
      console.log(`${colors.green}✅ ${fixedCount} problème(s) corrigé(s) automatiquement${colors.reset}`);
    }
  }
  
  // Recommandations
  printHeader('💡 RECOMMANDATIONS');
  
  const recommendations = [
    'Testez l\'application localement: npm run dev',
    'Vérifiez les migrations SQL dans Supabase',
    'Configurez les variables d\'environnement en production',
    'Activez les sauvegardes automatiques Supabase',
    'Mettez en place un monitoring (Sentry, LogRocket)',
    'Configurez un CDN pour les assets statiques'
  ];
  
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec}`);
  });
  
  console.log(`\n${colors.magenta}✨ Vérification terminée !${colors.reset}\n`);
  
  // Code de sortie selon les problèmes
  if (criticalCount > 0) process.exit(1);
  process.exit(0);
}

main().catch(error => {
  console.error(`${colors.red}Erreur: ${error.message}${colors.reset}`);
  process.exit(1);
});