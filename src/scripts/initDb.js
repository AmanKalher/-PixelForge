import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { ENV } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('[InitDB] Initializing PostgreSQL database for PixelForge...');

  // Target database
  const targetDb = ENV.DB.database || 'pixelforge';
  const baseConfig = {
    host: ENV.DB.host,
    port: ENV.DB.port,
    user: ENV.DB.user,
    password: ENV.DB.password,
  };

  // Step 1: Ensure database exists by connecting to 'postgres' administrative database
  try {
    const adminClient = new pg.Client({ ...baseConfig, database: 'postgres' });
    await adminClient.connect();
    const checkDb = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );
    if (checkDb.rowCount === 0) {
      console.log(`[InitDB] Creating database "${targetDb}"...`);
      await adminClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`[InitDB] Database "${targetDb}" created.`);
    } else {
      console.log(`[InitDB] Database "${targetDb}" already exists.`);
    }
    await adminClient.end();
  } catch (err) {
    console.warn(`[InitDB] Notice checking administrative database: ${err.message}`);
  }

  // Step 2: Connect to target database and execute PG Local.session.sql
  const client = new pg.Client({ ...baseConfig, database: targetDb });
  try {
    await client.connect();
    console.log(`[InitDB] Connected to "${targetDb}". Executing schema migration...`);

    const sqlPath = path.resolve(__dirname, '../../../database/PG Local.session.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL schema file not found at: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sqlContent);

    console.log('[InitDB] Schema and tables created successfully in "pixelforge" schema!');
  } catch (err) {
    console.error(`[InitDB] Failed to run schema migration: ${err.message}`);
  } finally {
    await client.end().catch(() => {});
  }
}

initDatabase();
