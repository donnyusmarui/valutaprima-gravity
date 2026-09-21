import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.DB_MODE === 'production';
const url = isProd
  ? process.env.NEON_DATABASE_URL
  : process.env.INSFORGE_DATABASE_URL || 'postgresql://postgres:postgres@localhost:7130/valutaprima_gravity';

export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: url || '',
  },
});
