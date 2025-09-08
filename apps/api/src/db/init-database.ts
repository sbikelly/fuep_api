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
      console.log('[DB-INIT] Database schema already initialized, checking for sample data...');

      // Check if sample candidates exist
      const sampleCandidates = await db.raw(`
        SELECT COUNT(*) as count 
        FROM candidates 
        WHERE jamb_reg_no LIKE '202511595352%'
      `);

      if (sampleCandidates.rows[0].count > 0) {
        console.log('[DB-INIT] Sample candidates already exist, skipping data insertion...');
        return true;
      }

      console.log('[DB-INIT] Sample candidates not found, inserting sample data...');
      await insertSampleCandidates();
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

    // Insert sample candidates after schema creation
    console.log('[DB-INIT] Inserting sample candidates...');
    await insertSampleCandidates();

    return true;
  } catch (error: any) {
    console.error('[DB-INIT] ❌ Database initialization failed:', error.message);
    return false;
  }
}

/**
 * Insert sample candidates for testing
 */
async function insertSampleCandidates(): Promise<void> {
  try {
    console.log('[DB-INIT] Inserting sample candidates...');

    // Check if departments table exists and has data
    const departmentsCheck = await db.raw(`
      SELECT COUNT(*) as count FROM departments
    `);

    if (departmentsCheck.rows[0].count === 0) {
      console.log('[DB-INIT] ⚠️  No departments found, skipping sample candidates...');
      return;
    }

    // Get department IDs
    const departments = await db.raw(`
      SELECT id, code FROM departments WHERE code IN ('CSC', 'BAD', 'CEN', 'ACC', 'EEN')
    `);

    console.log(
      '[DB-INIT] Found departments:',
      departments.rows.map((row: any) => `${row.code}:${row.id}`).join(', ')
    );

    const deptMap = departments.rows.reduce((acc: any, row: any) => {
      acc[row.code] = row.id;
      return acc;
    }, {});

    // Insert sample candidates with only required fields
    const sampleCandidates = [
      {
        jamb_reg_no: '202511595352DA',
        firstname: 'John',
        surname: 'Doe',
        othernames: 'Michael',
        gender: 'male',
        dob: '2005-03-15',
        nationality: 'Nigerian',
        state: 'Lagos',
        lga: 'Ikeja',
        address: '123 Victoria Island, Lagos',
        email: 'john.doe@email.com',
        phone: '+2348012345678',
        department: 'Computer Science',
        department_id: deptMap['CSC'] || null,
        mode_of_entry: 'UTME',
        marital_status: 'single',
        registration_completed: true,
        biodata_completed: true,
        education_completed: true,
        next_of_kin_completed: true,
        sponsor_completed: true,
        password_hash: '$2b$10$example_hash',
        is_first_login: false,
        is_active: true,
      },
      {
        jamb_reg_no: '202511595352DB',
        firstname: 'Jane',
        surname: 'Smith',
        othernames: 'Elizabeth',
        gender: 'female',
        dob: '2005-07-22',
        nationality: 'Nigerian',
        state: 'Abuja',
        lga: 'Garki',
        address: '456 Wuse 2, Abuja',
        email: 'jane.smith@email.com',
        phone: '+2348023456789',
        department: 'Business Administration',
        department_id: deptMap['BAD'] || null,
        mode_of_entry: 'UTME',
        marital_status: 'single',
        registration_completed: true,
        biodata_completed: true,
        education_completed: true,
        next_of_kin_completed: true,
        sponsor_completed: true,
        password_hash: '$2b$10$example_hash',
        is_first_login: false,
        is_active: true,
      },
      {
        jamb_reg_no: '202511595352DC',
        firstname: 'Ahmed',
        surname: 'Hassan',
        othernames: 'Ibrahim',
        gender: 'male',
        dob: '2005-01-10',
        nationality: 'Nigerian',
        state: 'Kano',
        lga: 'Nassarawa',
        address: '789 Sabon Gari, Kano',
        email: 'ahmed.hassan@email.com',
        phone: '+2348034567890',
        department: 'Computer Engineering',
        department_id: deptMap['CEN'] || null,
        mode_of_entry: 'UTME',
        marital_status: 'single',
        registration_completed: true,
        biodata_completed: true,
        education_completed: true,
        next_of_kin_completed: true,
        sponsor_completed: true,
        password_hash: '$2b$10$example_hash',
        is_first_login: false,
        is_active: true,
      },
      {
        jamb_reg_no: '202511595352DD',
        firstname: 'Fatima',
        surname: 'Ali',
        othernames: 'Aisha',
        gender: 'female',
        dob: '2005-11-05',
        nationality: 'Nigerian',
        state: 'Kaduna',
        lga: 'Kaduna North',
        address: '321 Independence Way, Kaduna',
        email: 'fatima.ali@email.com',
        phone: '+2348045678901',
        department: 'Accounting',
        department_id: deptMap['ACC'] || null,
        mode_of_entry: 'UTME',
        marital_status: 'single',
        registration_completed: true,
        biodata_completed: true,
        education_completed: true,
        next_of_kin_completed: true,
        sponsor_completed: true,
        password_hash: '$2b$10$example_hash',
        is_first_login: false,
        is_active: true,
      },
      {
        jamb_reg_no: '202511595352DE',
        firstname: 'Emmanuel',
        surname: 'Okafor',
        othernames: 'Chukwu',
        gender: 'male',
        dob: '2005-09-18',
        nationality: 'Nigerian',
        state: 'Enugu',
        lga: 'Enugu North',
        address: '654 Independence Layout, Enugu',
        email: 'emmanuel.okafor@email.com',
        phone: '+2348056789012',
        department: 'Electrical Engineering',
        department_id: deptMap['EEN'] || null,
        mode_of_entry: 'UTME',
        marital_status: 'single',
        registration_completed: true,
        biodata_completed: true,
        education_completed: true,
        next_of_kin_completed: true,
        sponsor_completed: true,
        password_hash: '$2b$10$example_hash',
        is_first_login: false,
        is_active: true,
      },
    ];

    // Insert candidates with conflict resolution
    let insertedCount = 0;
    for (const candidate of sampleCandidates) {
      try {
        const result = await db('candidates').insert(candidate).onConflict('jamb_reg_no').ignore();
        if (result && result.length > 0) {
          insertedCount++;
          console.log(
            `[DB-INIT] ✅ Inserted candidate: ${candidate.jamb_reg_no} - ${candidate.firstname} ${candidate.surname}`
          );
        } else {
          console.log(`[DB-INIT] ⚠️  Candidate already exists: ${candidate.jamb_reg_no}`);
        }
      } catch (error: any) {
        console.error(
          `[DB-INIT] ❌ Error inserting candidate ${candidate.jamb_reg_no}:`,
          error.message
        );
      }
    }

    console.log(
      `[DB-INIT] ✅ Sample candidates insertion completed. Inserted: ${insertedCount}/${sampleCandidates.length}`
    );
  } catch (error: any) {
    console.error('[DB-INIT] ❌ Error inserting sample candidates:', error.message);
    console.error('[DB-INIT] Full error:', error);
    throw error;
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
