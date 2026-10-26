import pg from 'pg';
import { ENV } from './env.js';

const { Pool } = pg;

let pool = null;
let dbConnected = false;

// In-memory fallback store for offline / dev resilience
export const memoryStore = {
  boards: new Map(),        // boardId -> board
  canvasObjects: new Map(), // boardId -> Map(clientObjectId -> object)
  revisions: new Map(),     // boardId -> revision[]
  operations: new Map(),    // boardId -> op[]
  shareLinks: new Map(),    // tokenHash -> link
  assets: new Map(),        // boardId -> asset[]
  latestFabricState: new Map(), // boardId -> JSON fabric state
};

export function getPool() {
  if (!pool) {
    const config = ENV.DB.connectionString
      ? { connectionString: ENV.DB.connectionString }
      : {
          host: ENV.DB.host,
          port: ENV.DB.port,
          user: ENV.DB.user,
          password: ENV.DB.password,
          database: ENV.DB.database,
          connectionTimeoutMillis: 3000,
        };

    pool = new Pool(config);

    pool.on('error', (err) => {
      console.warn('[Database Pool Warning] Idle client error:', err.message);
    });
  }
  return pool;
}

export async function checkDbConnection() {
  const target = `${ENV.DB.user}@${ENV.DB.host}:${ENV.DB.port}/${ENV.DB.database}`;
  try {
    const p = getPool();
    const res = await p.query('SELECT NOW() as current_time');
    dbConnected = true;
    console.log(`[Database] Connected to PostgreSQL (${target}) successfully at ${res.rows[0].current_time}`);
    return true;
  } catch (err) {
    dbConnected = false;
    console.warn(`[Database] PostgreSQL connection to ${target} failed (${err.message}). Running with in-memory persistence fallback.`);
    return false;
  }
}

export function isDbConnected() {
  return dbConnected;
}

export async function query(text, params = []) {
  if (dbConnected) {
    try {
      const p = getPool();
      return await p.query(text, params);
    } catch (err) {
      console.warn(`[Database Query Error] Fallback triggered: ${err.message}`);
      throw err;
    }
  }
  throw new Error('Database is offline. Use fallback store.');
}
