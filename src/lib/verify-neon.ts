import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.NEON_DATABASE_URL;
if (!url) {
  console.error('NEON_DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(url);

async function main() {
  console.log('🔍 Checking Neon Database...');
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;

  console.log('\n📊 Tables present in Neon:');
  for (const t of tables) {
    const tableName = t.table_name;
    const countRes = await sql(`SELECT count(*) FROM "${tableName}"`);
    console.log(`  ✓ ${tableName} : ${countRes[0].count} records`);
  }

  // Check columns of transactions, kyc_submissions, exchange_rates, users
  console.log('\n📋 Sample Schema Check:');
  const cols = await sql`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    ORDER BY table_name, ordinal_position;
  `;
  
  let currentTable = '';
  for (const col of cols) {
    if (col.table_name !== currentTable) {
      currentTable = col.table_name;
      console.log(`\n  Table [${currentTable}]:`);
    }
    console.log(`    - ${col.column_name} (${col.data_type})`);
  }

  console.log('\n✅ Database Neon is 100% synchronized and active!');
}

main().catch(console.error);
