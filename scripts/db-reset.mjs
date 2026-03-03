#!/usr/bin/env node

/**
 * db-reset — Drop public schema and re-apply the consolidated schema.
 *
 * Usage:
 *   npm run db:reset
 *
 * ⚠️  DESTRUCTIVE — drops ALL tables, types, functions in public schema.
 * Requires DATABASE_URL in .env.local.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import readline from 'node:readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Helpers ──────────────────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

function ok(msg) { console.log(`${C.green}✓${C.reset} ${msg}`); }
function fail(msg) { console.error(`${C.red}✗${C.reset} ${msg}`); }
function info(msg) { console.log(`${C.blue}ℹ${C.reset} ${msg}`); }
function warn(msg) { console.log(`${C.yellow}⚠${C.reset} ${msg}`); }

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) {
    fail('.env.local not found.');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

function confirm(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${C.red}╔══════════════════════════════════════╗${C.reset}`);
  console.log(`${C.red}║   GENIA — Database Reset             ║${C.reset}`);
  console.log(`${C.red}╚══════════════════════════════════════╝${C.reset}\n`);

  // Allow --force flag to skip confirmation
  const force = process.argv.includes('--force');

  if (!force) {
    warn('This will DROP all tables and re-create the schema from scratch.');
    const yes = await confirm(`${C.yellow}Are you sure? (y/N): ${C.reset}`);
    if (!yes) {
      info('Aborted.');
      process.exit(0);
    }
  }

  loadEnv();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    fail('DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const consolidatedPath = path.join(ROOT, 'supabase', 'schema_consolidated.sql');
  if (!fs.existsSync(consolidatedPath)) {
    fail('schema_consolidated.sql not found');
    process.exit(1);
  }

  const sql = fs.readFileSync(consolidatedPath, 'utf8');
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    info('Connecting...');
    await client.connect();
    ok('Connected');

    info('Dropping public schema...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    ok('Schema dropped and recreated');

    info('Applying consolidated schema...');
    await client.query(sql);
    ok('Schema applied successfully!');
  } catch (err) {
    fail(`Database error: ${err.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log(`\n${C.green}Database reset complete.${C.reset}\n`);
}

main();
