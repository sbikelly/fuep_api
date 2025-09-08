import { readFileSync } from 'fs';
import { join } from 'path';

import { db } from './knex.js';

/**
 * Database initialization script
 * Runs all SQL migration files in order to set up the database schema
 */
export async function initializeDatabase(): Promise<boolean> {
  console.log('[DB-INIT] Starting database initialization...');

  try {
    // List of SQL files to run in order
    const sqlFiles = [
      '001_academic_structure.sql',
      '003_simplified_candidate_schema.sql',
      '004_admin_schema.sql',
      '004_payment_updates.sql',
      '006_payment_purposes.sql',
      '008_academic_simplification.sql',
      '009_candidate_department_association.sql',
      '010_remove_documents_module.sql',
      '011_add_is_first_login_flag.sql',
      '012_remove_prelist_table.sql',
    ];

    // Check if tables already exist
    const existingTables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('candidates', 'admin_users', 'payments', 'faculties')
    `);

    if (existingTables.rows.length >= 4) {
      console.log('[DB-INIT] Database schema already initialized, skipping...');
      return true;
    }

    console.log('[DB-INIT] Database schema not found, running migrations...');

    // Run each SQL file
    for (const sqlFile of sqlFiles) {
      try {
        console.log(`[DB-INIT] Running ${sqlFile}...`);

        // Read SQL file from infra/db directory
        const sqlPath = join('/app', 'infra', 'db', sqlFile);
        const sqlContent = readFileSync(sqlPath, 'utf8');

        // Execute SQL
        await db.raw(sqlContent);
        console.log(`[DB-INIT] ✅ ${sqlFile} completed successfully`);
      } catch (error: any) {
        // Some errors are expected (like "table already exists")
        if (
          error.message.includes('already exists') ||
          error.message.includes('does not exist, skipping')
        ) {
          console.log(`[DB-INIT] ⚠️  ${sqlFile} - ${error.message.split('\n')[0]}`);
        } else {
          console.error(`[DB-INIT] ❌ Error in ${sqlFile}:`, error.message);
          throw error;
        }
      }
    }

    // Verify tables were created
    const finalTables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`[DB-INIT] ✅ Database initialization completed!`);
    console.log(
      `[DB-INIT] Created ${finalTables.rows.length} tables:`,
      finalTables.rows.map((row: any) => row.table_name).join(', ')
    );

    return true;
  } catch (error: any) {
    console.error('[DB-INIT] ❌ Database initialization failed:', error.message);
    return false;
  }
}

/**
 * Check if database is properly initialized
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const result = await db.raw(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('candidates', 'admin_users', 'payments', 'faculties')
    `);

    return result.rows[0].count >= 4;
  } catch (error) {
    console.error('[DB-INIT] Error checking database initialization:', error);
    return false;
  }
}
