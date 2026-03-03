#!/usr/bin/env node

/**
 * db-setup — Run the consolidated schema on a fresh Supabase project.
 *
 * Usage:
 *   npm run db:setup
 *
 * Requires DATABASE_URL in .env.local (Supabase direct connection string).
 * Example: postgresql://postgres.[ref]:[password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

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

// ── Load .env.local ──────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) {
    fail('.env.local not found. Copy .env.example → .env.local and fill in DATABASE_URL.');
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

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${C.blue}╔══════════════════════════════════════╗${C.reset}`);
  console.log(`${C.blue}║   GENIA — Database Setup             ║${C.reset}`);
  console.log(`${C.blue}╚══════════════════════════════════════╝${C.reset}\n`);

  loadEnv();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    fail('DATABASE_URL is not set in .env.local');
    info('Add your Supabase direct connection string:');
    console.log(`  ${C.dim}DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-...pooler.supabase.com:5432/postgres${C.reset}\n`);
    process.exit(1);
  }

  // Choose SQL source
  const consolidatedPath = path.join(ROOT, 'supabase', 'schema_consolidated.sql');
  if (!fs.existsSync(consolidatedPath)) {
    fail(`Consolidated schema not found at ${consolidatedPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(consolidatedPath, 'utf8');
  info(`Loaded schema: ${(sql.length / 1024).toFixed(0)} KB from schema_consolidated.sql`);

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    info('Connecting to database...');
    await client.connect();
    ok('Connected');

    info('Running consolidated schema (this may take a moment)...');
    await client.query(sql);
    ok('Schema applied successfully!');
  } catch (err) {
    fail(`Database error: ${err.message}`);
    if (err.message.includes('already exists')) {
      warn('Some objects already exist. Use `npm run db:fresh` for a clean rebuild.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log(`\n${C.green}Database setup complete.${C.reset}`);
  info('Next: npm run db:seed  (optional — insert sample data)');
  info('Then:  npm run dev\n');
}

main();
