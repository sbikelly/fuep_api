/* Knex configuration for migrations and seeds (Windows-friendly) */
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const port = +(process.env.DB_PORT || 5432);
const user = process.env.DB_USER || 'fuep';
const password = process.env.DB_PASSWORD || 'fuep';
const database = process.env.DB_NAME || 'fuep_portal';

const connectionUrl =
  process.env.DB_URL ||
  `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(
    database
  )}`;

module.exports = {
  client: 'pg',
  connection: connectionUrl,
  pool: { min: 0, max: 10 },
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations',
    extension: 'js', // keep JS for portability with CLI
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
    extension: 'js',
  },
};
