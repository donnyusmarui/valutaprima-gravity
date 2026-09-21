import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEON_DATABASE_URL || process.env.INSFORGE_DATABASE_URL;

export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: url || '',
  },
});
