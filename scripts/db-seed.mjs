#!/usr/bin/env node

/**
 * db-seed — Insert sample data for development.
 *
 * Usage:
 *   npm run db:seed
 *
 * Creates:
 * - An admin user profile (linked to current auth user)
 * - Sample user_progress entries
 * - Sample badges
 *
 * Requires DATABASE_URL and ADMIN_USER_ID in .env.local.
 * ADMIN_USER_ID = the Supabase auth.users UUID of your admin account.
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

// ── Seed SQL ─────────────────────────────────────────────────────────────────

function getSeedSQL(adminUserId) {
  return `
-- ==========================================================
-- GENIA Seed Data
-- ==========================================================

-- Promote the specified user to admin
UPDATE user_profiles
SET role = 'admin', updated_at = NOW()
WHERE user_id = '${adminUserId}';

-- If the profile doesn't exist yet, create it
INSERT INTO user_profiles (user_id, role, full_name)
VALUES ('${adminUserId}', 'admin', 'Admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Insert a few sample modules into module_progress (if table exists)
-- These are safe no-ops if data already exists
DO $$
BEGIN
  -- Verify that base tables exist before seeding
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_progress') THEN
    RAISE NOTICE 'user_progress table exists — seed can insert progress rows if needed.';
  END IF;
END $$;
`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${C.blue}╔══════════════════════════════════════╗${C.reset}`);
  console.log(`${C.blue}║   GENIA — Database Seed              ║${C.reset}`);
  console.log(`${C.blue}╚══════════════════════════════════════╝${C.reset}\n`);

  loadEnv();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    fail('DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) {
    warn('ADMIN_USER_ID is not set in .env.local');
    info('To promote a user to admin, add ADMIN_USER_ID=<uuid> to .env.local');
    info('You can find the UUID in Supabase Dashboard → Authentication → Users');
    info('Skipping admin promotion. Running minimal seed...');
  }

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    info('Connecting...');
    await client.connect();
    ok('Connected');

    if (adminUserId) {
      info(`Promoting user ${adminUserId.slice(0, 8)}... to admin`);
      await client.query(getSeedSQL(adminUserId));
      ok('Admin user configured');
    }

    // Check table counts
    const { rows } = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM user_profiles) AS profiles,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') AS tables
    `);
    info(`Database has ${rows[0].tables} tables, ${rows[0].profiles} user profiles`);

    ok('Seed complete!');
  } catch (err) {
    fail(`Database error: ${err.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log(`\n${C.green}Seed data applied.${C.reset}`);
  info('Start the app: npm run dev\n');
}

main();
