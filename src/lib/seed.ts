import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config();

const neonUrl = process.env.NEON_DATABASE_URL;

if (!neonUrl) {
  console.error('❌ NEON_DATABASE_URL is required to run seed.');
  process.exit(1);
}

const sql = neon(neonUrl);

async function main() {
  console.log('🌱 [Seeder] Connecting to Neon Database for Sprint 2...');

  // 1. Create / Update Tables
  console.log('🔨 [Seeder] Ensuring tables and columns exist...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'customer',
      avatar_url TEXT,
      is_kyc_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id SERIAL PRIMARY KEY,
      currency_code VARCHAR(3) UNIQUE NOT NULL,
      currency_name VARCHAR(100) NOT NULL,
      buy_rate NUMERIC(12, 2) NOT NULL,
      sell_rate NUMERIC(12, 2) NOT NULL,
      stock_amount NUMERIC(14, 2) DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS currency_denominations (
      id SERIAL PRIMARY KEY,
      currency_code VARCHAR(3) NOT NULL,
      denomination_value INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      is_available BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS kyc_submissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      id_card_number VARCHAR(50) NOT NULL,
      id_card_type VARCHAR(20) NOT NULL DEFAULT 'KTP',
      id_card_file_url TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      reviewer_id VARCHAR(100),
      review_notes TEXT,
      submitted_at TIMESTAMP DEFAULT NOW(),
      reviewed_at TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      reference_no VARCHAR(50) UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(10) NOT NULL,
      currency_code VARCHAR(3) NOT NULL,
      amount_foreign NUMERIC(14, 2) NOT NULL,
      locked_rate NUMERIC(12, 2) NOT NULL,
      amount_idr NUMERIC(16, 2) NOT NULL,
      service_fee_idr NUMERIC(12, 2) DEFAULT 0,
      denominations TEXT,
      aml_flag BOOLEAN DEFAULT FALSE,
      status VARCHAR(30) NOT NULL DEFAULT 'pending_supervisor',
      authorized_by VARCHAR(100),
      authorized_at TIMESTAMP,
      review_notes TEXT,
      invoice_no VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // Alter transactions table columns if not yet present
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS denominations TEXT;`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS aml_flag BOOLEAN DEFAULT FALSE;`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS review_notes TEXT;`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS invoice_no VARCHAR(50);`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS authorized_at TIMESTAMP;`;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      invoice_no VARCHAR(50) UNIQUE NOT NULL,
      transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount_idr NUMERIC(16, 2) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // 2. Seed Default Users
  console.log('👤 [Seeder] Ensuring default demo users exist...');
  const demoUsers = [
    { email: 'customer@valutaprima.com', name: 'Budi Santoso', role: 'customer', is_kyc_verified: true },
    { email: 'teller@valutaprima.com', name: 'Siti Rahma (Teller)', role: 'teller', is_kyc_verified: true },
    { email: 'supervisor@valutaprima.com', name: 'Hendra Wijaya (Supervisor)', role: 'supervisor', is_kyc_verified: true },
  ];

  for (const u of demoUsers) {
    await sql`
      INSERT INTO users (email, name, role, is_kyc_verified)
      VALUES (${u.email}, ${u.name}, ${u.role}, ${u.is_kyc_verified})
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        is_kyc_verified = EXCLUDED.is_kyc_verified;
    `;
  }

  // 3. Seed Exchange Rates Baseline
  console.log('💱 [Seeder] Updating exchange rates...');
  const rates = [
    { code: 'USD', name: 'US Dollar', buy: 15850.00, sell: 16050.00, stock: 45000 },
    { code: 'EUR', name: 'Euro', buy: 17200.00, sell: 17450.00, stock: 28000 },
    { code: 'SGD', name: 'Singapore Dollar', buy: 11800.00, sell: 11980.00, stock: 65000 },
    { code: 'JPY', name: 'Japanese Yen (x100)', buy: 104.50, sell: 106.80, stock: 1500000 },
    { code: 'AUD', name: 'Australian Dollar', buy: 10250.00, sell: 10450.00, stock: 32000 },
    { code: 'GBP', name: 'British Pound', buy: 20150.00, sell: 20450.00, stock: 18000 },
    { code: 'CNY', name: 'Chinese Yuan', buy: 2180.00, sell: 2240.00, stock: 80000 },
    { code: 'SAR', name: 'Saudi Riyal', buy: 4220.00, sell: 4350.00, stock: 95000 },
  ];

  for (const r of rates) {
    await sql`
      INSERT INTO exchange_rates (currency_code, currency_name, buy_rate, sell_rate, stock_amount, updated_at)
      VALUES (${r.code}, ${r.name}, ${r.buy}, ${r.sell}, ${r.stock}, NOW())
      ON CONFLICT (currency_code) DO UPDATE SET
        buy_rate = EXCLUDED.buy_rate,
        sell_rate = EXCLUDED.sell_rate,
        stock_amount = EXCLUDED.stock_amount,
        updated_at = NOW();
    `;
  }

  // 4. Seed Physical Denominations (Pecahan Kas Fisik)
  console.log('💵 [Seeder] Seeding physical denominations inventory...');
  await sql`DELETE FROM currency_denominations;`;

  const denoms = [
    // USD
    { code: 'USD', val: 100, qty: 300 }, // $30,000
    { code: 'USD', val: 50, qty: 200 },  // $10,000
    { code: 'USD', val: 20, qty: 250 },  // $5,000
    // EUR
    { code: 'EUR', val: 100, qty: 150 }, // €15,000
    { code: 'EUR', val: 50, qty: 200 },  // €10,000
    { code: 'EUR', val: 20, qty: 150 },  // €3,000
    // SGD
    { code: 'SGD', val: 50, qty: 800 },  // $40,000
    { code: 'SGD', val: 10, qty: 2500 }, // $25,000
    // JPY
    { code: 'JPY', val: 10000, qty: 100 }, // ¥1,000,000
    { code: 'JPY', val: 5000, qty: 100 },  // ¥500,000
    // AUD
    { code: 'AUD', val: 100, qty: 200 }, // $20,000
    { code: 'AUD', val: 50, qty: 240 },  // $12,000
    // GBP
    { code: 'GBP', val: 50, qty: 200 },  // £10,000
    { code: 'GBP', val: 20, qty: 400 },  // £8,000
    // CNY
    { code: 'CNY', val: 100, qty: 500 }, // ¥50,000
    { code: 'CNY', val: 50, qty: 600 },  // ¥30,000
    // SAR
    { code: 'SAR', val: 500, qty: 100 }, // ﷼50,000
    { code: 'SAR', val: 100, qty: 450 }, // ﷼45,000
  ];

  for (const d of denoms) {
    await sql`
      INSERT INTO currency_denominations (currency_code, denomination_value, quantity, is_available, updated_at)
      VALUES (${d.code}, ${d.val}, ${d.qty}, TRUE, NOW());
    `;
  }

  console.log('✅ [Seeder] Sprint 2 database migration and seed completed successfully!');
}

main().catch((err) => {
  console.error('❌ [Seeder] Failed:', err);
  process.exit(1);
});
