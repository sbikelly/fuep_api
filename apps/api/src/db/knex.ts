import knex, { Knex } from 'knex';

const host = process.env.DB_HOST || '127.0.0.1';
const port = +(process.env.DB_PORT || 5432);
const user = process.env.DB_USER || 'fuep';
const password = process.env.DB_PASSWORD || 'fuep';
const database = process.env.DB_NAME || 'fuep_portal';

// Prefer a full URL if provided; otherwise compose one explicitly
const connectionUrl =
  process.env.DB_URL ||
  `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(
    database
  )}`;

export const db: Knex = knex({
  client: 'pg',
  connection: connectionUrl,
  pool: { min: 0, max: 10 }
});

export async function pingDb(): Promise<boolean> {
  try {
    await db.raw('select 1');
    return true;
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[DB] ping failed:', err?.message || err);
    return false;
  }
}