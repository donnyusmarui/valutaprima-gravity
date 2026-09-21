import { pgTable, serial, text, numeric, timestamp, varchar, boolean, integer } from 'drizzle-orm/pg-core';

// Users / Customers
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('customer'), // 'customer' | 'teller' | 'supervisor'
  avatarUrl: text('avatar_url'),
  isKycVerified: boolean('is_kyc_verified').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Exchange Rates
export const exchangeRates = pgTable('exchange_rates', {
  id: serial('id').primaryKey(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull().unique(), // 'USD', 'EUR', 'SGD', etc.
  currencyName: varchar('currency_name', { length: 100 }).notNull(),
  buyRate: numeric('buy_rate', { precision: 12, scale: 2 }).notNull(),
  sellRate: numeric('sell_rate', { precision: 12, scale: 2 }).notNull(),
  stockAmount: numeric('stock_amount', { precision: 14, scale: 2 }).default('0'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Currency Denominations (Stok Pecahan Fisik Valas)
export const currencyDenominations = pgTable('currency_denominations', {
  id: serial('id').primaryKey(),
  currencyCode: varchar('currency_code', { length: 3 }).notNull(),
  denominationValue: integer('denomination_value').notNull(), // e.g. 100, 50, 20, 10
  quantity: integer('quantity').notNull().default(0), // Jumlah lembar
  isAvailable: boolean('is_available').default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// KYC Submissions
export const kycSubmissions = pgTable('kyc_submissions', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  idCardNumber: varchar('id_card_number', { length: 50 }).notNull(),
  idCardType: varchar('id_card_type', { length: 20 }).notNull().default('KTP'), // 'KTP' | 'PASSPORT'
  idCardFileUrl: text('id_card_file_url').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'verified' | 'rejected'
  reviewerId: varchar('reviewer_id', { length: 100 }),
  reviewNotes: text('review_notes'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
});

// Transactions
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  referenceNo: varchar('reference_no', { length: 50 }).notNull().unique(),
  userId: serial('user_id').references(() => users.id),
  type: varchar('type', { length: 10 }).notNull(), // 'BUY' (Customer beli valas) | 'SELL' (Customer jual valas)
  currencyCode: varchar('currency_code', { length: 3 }).notNull(),
  amountForeign: numeric('amount_foreign', { precision: 14, scale: 2 }).notNull(),
  lockedRate: numeric('locked_rate', { precision: 12, scale: 2 }).notNull(),
  amountIdr: numeric('amount_idr', { precision: 16, scale: 2 }).notNull(),
  serviceFeeIdr: numeric('service_fee_idr', { precision: 12, scale: 2 }).default('0'),
  denominations: text('denominations'), // JSON string rincian pecahan
  amlFlag: boolean('aml_flag').default(false), // True jika >= 100 Juta IDR (CTR Wajib Lapor)
  status: varchar('status', { length: 30 }).notNull().default('pending_supervisor'), 
  // 'pending_supervisor' | 'approved' | 'awaiting_payment' | 'paid' | 'completed' | 'rejected'
  authorizedBy: varchar('authorized_by', { length: 100 }),
  authorizedAt: timestamp('authorized_at'),
  reviewNotes: text('review_notes'),
  invoiceNo: varchar('invoice_no', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Invoices
export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNo: varchar('invoice_no', { length: 50 }).notNull().unique(),
  transactionId: integer('transaction_id').references(() => transactions.id),
  userId: integer('user_id').references(() => users.id),
  amountIdr: numeric('amount_idr', { precision: 16, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'paid' | 'cancelled'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
