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
  connection: dbConfig.connection,
  ssl: dbConfig.ssl,
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
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await db.raw('select 1');
      console.log('[DB] Connection successful');
      return true;
    } catch (err: any) {
      console.error(
        `[DB] Connection attempt ${attempt}/${maxRetries} failed:`,
        err?.message || err
      );

      if (attempt === maxRetries) {
        console.error('[DB] All connection attempts failed');
        return false;
      }

      console.log(`[DB] Retrying in ${retryDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  return false;
}

export async function waitForDatabase(maxAttempts: number = 30): Promise<boolean> {
  console.log('[DB] Waiting for database connection...');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isConnected = await pingDb();
    if (isConnected) {
      console.log('[DB] Database is ready!');
      return true;
    }

    console.log(`[DB] Attempt ${attempt}/${maxAttempts} - waiting 2 seconds...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.error('[DB] Database connection timeout after', maxAttempts, 'attempts');
  return false;
}
