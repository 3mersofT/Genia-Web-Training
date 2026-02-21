#!/usr/bin/env node

/**
 * Script de nettoyage des fichiers obsolètes
 * Supprime ou renomme les fichiers qui ne sont plus utilisés dans le projet
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

// Liste des fichiers obsolètes à nettoyer
const OBSOLETE_FILES = [
  {
    path: 'supabase/migrations/002_genia_chat_system.sql',
    reason: 'Remplacé par 003_genia_chat_tables.sql (tables en doublon)',
    action: 'rename' // 'delete' ou 'rename'
  },
  {
    path: 'src/lib/services/mistral.service.ts',
    reason: 'Remplacé par src/services/mistralService.ts',
    action: 'rename'
  }
];

// Fichiers de backup à supprimer définitivement (optionnel)
const BACKUP_FILES = [
  'supabase/migrations/_old_002_genia_chat_system.sql.backup',
  'src/lib/services/_old_mistral.service.ts.backup'
];

function fileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function renameFile(oldPath, newPath) {
  const fullOldPath = path.join(process.cwd(), oldPath);
  const fullNewPath = path.join(process.cwd(), newPath);
  
  try {
    fs.renameSync(fullOldPath, fullNewPath);
    return true;
  } catch (error) {
    console.error(`${colors.red}Erreur lors du renommage: ${error.message}${colors.reset}`);
    return false;
  }
}

function deleteFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    fs.unlinkSync(fullPath);
    return true;
  } catch (error) {
    console.error(`${colors.red}Erreur lors de la suppression: ${error.message}${colors.reset}`);
    return false;
  }
}

function printHeader(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}  ${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

function main() {
  printHeader('🧹 Nettoyage des fichiers obsolètes');
  
  let cleanedCount = 0;
  let errorCount = 0;
  
  // Nettoyer les fichiers obsolètes
  console.log('Recherche des fichiers obsolètes...\n');
  
  for (const file of OBSOLETE_FILES) {
    if (fileExists(file.path)) {
      console.log(`${colors.yellow}⚠️  Trouvé: ${file.path}${colors.reset}`);
      console.log(`   Raison: ${file.reason}`);
      
      if (file.action === 'rename') {
        const backupPath = file.path + '.backup';
        console.log(`   Action: Renommage vers ${backupPath}`);
        
        if (renameFile(file.path, backupPath)) {
          console.log(`${colors.green}   ✅ Renommé avec succès${colors.reset}\n`);
          cleanedCount++;
        } else {
          console.log(`${colors.red}   ❌ Échec du renommage${colors.reset}\n`);
          errorCount++;
        }
      } else if (file.action === 'delete') {
        console.log(`   Action: Suppression`);
        
        if (deleteFile(file.path)) {
          console.log(`${colors.green}   ✅ Supprimé avec succès${colors.reset}\n`);
          cleanedCount++;
        } else {
          console.log(`${colors.red}   ❌ Échec de la suppression${colors.reset}\n`);
          errorCount++;
        }
      }
    } else {
      console.log(`${colors.green}✅ Déjà nettoyé: ${file.path}${colors.reset}`);
    }
  }
  
  // Optionnel: Supprimer les backups existants
  printHeader('🗑️  Fichiers de backup');
  
  console.log('Fichiers de backup trouvés:\n');
  let backupsFound = false;
  
  for (const backup of BACKUP_FILES) {
    if (fileExists(backup)) {
      console.log(`${colors.yellow}📁 ${backup}${colors.reset}`);
      backupsFound = true;
    }
  }
  
  if (!backupsFound) {
    console.log(`${colors.green}Aucun fichier de backup trouvé${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}Conseil: Vous pouvez supprimer ces fichiers manuellement après vérification${colors.reset}`);
  }
  
  // Résumé
  printHeader('📊 Résumé');
  
  if (cleanedCount > 0) {
    console.log(`${colors.green}✅ ${cleanedCount} fichier(s) nettoyé(s)${colors.reset}`);
  }
  
  if (errorCount > 0) {
    console.log(`${colors.red}❌ ${errorCount} erreur(s) rencontrée(s)${colors.reset}`);
  }
  
  if (cleanedCount === 0 && errorCount === 0) {
    console.log(`${colors.green}✨ Projet déjà propre !${colors.reset}`);
  }
  
  // Instructions finales
  printHeader('💡 Actions recommandées');
  
  console.log('1. Si vous aviez déjà exécuté les migrations obsolètes:');
  console.log(`   ${colors.blue}Réinitialisez votre base de données et réexécutez les migrations${colors.reset}`);
  console.log('\n2. Vérifiez que tous les imports sont corrects:');
  console.log(`   ${colors.blue}npm run build${colors.reset}`);
  console.log('\n3. Testez l\'application:');
  console.log(`   ${colors.blue}npm run dev${colors.reset}`);
  
  console.log(`\n${colors.green}Nettoyage terminé !${colors.reset}\n`);
}

// Exécuter le script
main();