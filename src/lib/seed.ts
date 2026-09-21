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
  console.log('🌱 [Seeder] Connecting to Neon Database...');

  // 1. Create Tables
  console.log('🔨 [Seeder] Creating tables if not exist...');
  
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
      status VARCHAR(30) NOT NULL DEFAULT 'pending_teller',
      authorized_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  // 2. Seed Default Users (Customer, Teller, Supervisor)
  console.log('👤 [Seeder] Seeding default roles & demo users...');
  const demoUsers = [
    { email: 'customer@valutaprima.com', name: 'Budi Santoso', role: 'customer', is_kyc_verified: false },
    { email: 'teller@valutaprima.com', name: 'Siti Rahma (Teller)', role: 'teller', is_kyc_verified: true },
    { email: 'supervisor@valutaprima.com', name: 'Hendra Wijaya (Supervisor)', role: 'supervisor', is_kyc_verified: true },
  ];

  for (const u of demoUsers) {
    await sql`
      INSERT INTO users (email, name, role, is_kyc_verified)
      VALUES (${u.email}, ${u.name}, ${u.role}, ${u.is_kyc_verified})
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role;
    `;
  }

  // 3. Seed Exchange Rates
  console.log('💱 [Seeder] Seeding exchange rates (real-time market baseline)...');
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

  console.log('✅ [Seeder] Database initialized and seeded successfully!');
}

main().catch((err) => {
  console.error('❌ [Seeder] Failed:', err);
  process.exit(1);
});
