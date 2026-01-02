#!/usr/bin/env tsx
// File: scripts/mark-migrations-applied.ts

/**
 * Script to mark all existing migrations as applied in the __drizzle_migrations table.
 * Use this when you've migrated data from another database and the tables already exist,
 * but Drizzle doesn't know the migrations have been applied.
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/mark-migrations-applied.ts
 */

import "dotenv/config";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { Pool } from "pg";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    log("❌ DATABASE_URL environment variable is required", "red");
    process.exit(1);
  }

  log("\n🔧 Marking migrations as applied...\n", "cyan");

  const pool = new Pool({
    connectionString: databaseUrl,
    // Neon handles SSL automatically
  });

  try {
    // Test connection
    await pool.query("SELECT 1");
    log("✓ Database connection successful\n", "green");

    // Ensure __drizzle_migrations table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      );
    `);
    log("✓ Migration tracking table ready\n", "green");

    // Get all migration files
    const drizzleDir = join(process.cwd(), "drizzle");
    const files = await readdir(drizzleDir);
    const migrationFiles = files
      .filter((f) => f.endsWith(".sql"))
      .sort();

    log(`Found ${migrationFiles.length} migration files\n`, "cyan");

    // Get already applied migrations
    const appliedResult = await pool.query(
      'SELECT hash FROM "__drizzle_migrations"'
    );
    const appliedHashes = new Set(
      appliedResult.rows.map((row: any) => row.hash)
    );

    let marked = 0;
    let skipped = 0;

    for (const file of migrationFiles) {
      // Read migration file to get hash
      const filePath = join(drizzleDir, file);
      const content = await readFile(filePath, "utf-8");
      
      // Generate hash from filename (Drizzle uses filename as hash identifier)
      // Format: 0000_name.sql -> hash is derived from the migration name
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) {
        log(`⚠️  Skipping ${file} (unexpected format)`, "yellow");
        continue;
      }

      // Drizzle uses the migration name as part of the hash
      // We'll use a simple hash based on the filename
      const hash = file.replace(/\.sql$/, "");

      if (appliedHashes.has(hash)) {
        log(`⊘ ${file} - already marked as applied`, "yellow");
        skipped++;
        continue;
      }

      // Mark as applied
      await pool.query(
        'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
        [hash, Date.now()]
      );
      log(`✓ ${file} - marked as applied`, "green");
      marked++;
    }

    log(`\n✅ Complete!`, "green");
    log(`   Marked: ${marked} migrations`, "green");
    log(`   Skipped: ${skipped} migrations (already applied)\n`, "green");

    // Verify
    const verifyResult = await pool.query(
      'SELECT COUNT(*) as count FROM "__drizzle_migrations"'
    );
    log(
      `📊 Total migrations in tracking table: ${verifyResult.rows[0]?.count || 0}\n`,
      "cyan"
    );
  } catch (error: any) {
    log(`\n❌ Error: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  log(`Fatal error: ${err.message}`, "red");
  console.error(err);
  process.exit(1);
});

