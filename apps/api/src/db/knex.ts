import knex, { Knex } from 'knex';

// Database configuration with cloud deployment support
const getDatabaseConfig = () => {
  // If DATABASE_URL is provided (common in cloud platforms), use it directly
  if (process.env.DATABASE_URL) {
    return {
      connection: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };
  }

  // Fallback to individual environment variables
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = +(process.env.DB_PORT || 5432);
  const user = process.env.DB_USER || 'fuep';
  const password = process.env.DB_PASSWORD || 'fuep';
  const database = process.env.DB_NAME || 'fuep_portal';

  const connectionUrl = `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;

  return {
    connection: connectionUrl,
    ssl:
      process.env.NODE_ENV === 'production' && host !== '127.0.0.1' && host !== 'localhost'
        ? { rejectUnauthorized: false }
        : false,
  };
};

const dbConfig = getDatabaseConfig();

export const db: Knex = knex({
  client: 'pg',
  connection: {
    connectionString: dbConfig.connection,
    ssl: dbConfig.ssl,
  },
  pool: {
    min: 0,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
  acquireConnectionTimeout: 30000,
});

export async function pingDb(): Promise<boolean> {
  try {
    // Simple connection test with timeout
    await Promise.race([
      db.raw('select 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000)),
    ]);
    console.log('[DB] Connection successful');
    return true;
  } catch (err: any) {
    console.error('[DB] Connection failed:', err?.message || err);
    return false;
  }
}

export async function waitForDatabase(maxAttempts: number = 10): Promise<boolean> {
  console.log('[DB] Waiting for database connection...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[DB] Attempt ${attempt}/${maxAttempts}...`);
    const isConnected = await pingDb();
    if (isConnected) {
      console.log('[DB] Database is ready!');
      return true;
    }

    if (attempt < maxAttempts) {
      console.log(`[DB] Waiting 2 seconds before retry...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.error('[DB] Database connection timeout after', maxAttempts, 'attempts');
  return false;
}
