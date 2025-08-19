const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://fuep:fuep@localhost:5432/fuep_portal',
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  console.log('Testing database connection...');
  try {
    const client = await pool.connect();
    console.log('✅ Connected successfully!');

    const result = await client.query('SELECT COUNT(*) FROM payments');
    console.log('✅ Query successful:', result.rows[0]);

    client.release();
    await pool.end();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
