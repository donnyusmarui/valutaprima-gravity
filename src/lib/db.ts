import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import pg from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

const neonUrl = process.env.NEON_DATABASE_URL;
const insforgeUrl = process.env.INSFORGE_DATABASE_URL;
const dbMode = process.env.DB_MODE || 'development';

function initDatabase() {
  if (dbMode === 'insforge' && insforgeUrl) {
    const pool = new pg.Pool({ connectionString: insforgeUrl });
    return drizzlePg(pool, { schema });
  }

  if (neonUrl && !neonUrl.includes('<GANTI_PASSWORD_BARU>')) {
    const sql = neon(neonUrl);
    return drizzleNeon(sql, { schema });
  }

  const pool = new pg.Pool({
    connectionString: insforgeUrl || 'postgresql://postgres:postgres@localhost:7130/valutaprima_gravity',
  });
  return drizzlePg(pool, { schema });
}

export const db = initDatabase();
export { schema };
