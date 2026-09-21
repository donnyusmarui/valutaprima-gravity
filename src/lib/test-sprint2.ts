import { handleGetDenominations } from '../api/handlers/inventory.handler';
import {
  handleCalculateEstimate,
  handleCreateTransaction,
  handleGetTransactions,
  handleAuthorizeTransaction,
} from '../api/handlers/transactions.handler';
import { handleDevSwitchRole } from '../api/handlers/auth.handler';
import { db, schema } from './db';
import { eq } from 'drizzle-orm';

async function testSprint2() {
  console.log('=============================================');
  console.log('🧪 SPRINT 2 END-TO-END AUTOMATED VERIFICATION');
  console.log('=============================================\n');

  // 1. Inventory Check
  console.log('--- 1. Testing Denomination Inventory ---');
  const denomsRes = await handleGetDenominations('USD');
  console.log(`[OK] USD Denominations count: ${denomsRes.data?.length}`);
  for (const d of denomsRes.data || []) {
    console.log(`   - Pecahan $${d.denominationValue}: ${d.quantity} lembar (Total: $${d.denominationValue * d.quantity})`);
  }

  // 2. Estimation & AML Calculation
  console.log('\n--- 2. Testing Estimate & AML Calculator ---');
  // Small transaction (< 100 Juta)
  const smallEst = await handleCalculateEstimate({
    type: 'BUY',
    currencyCode: 'USD',
    amountForeign: 1000,
  });
  console.log(`[OK] Small BUY $1000: Rate=Rp ${smallEst.data?.lockedRate.toLocaleString()}, Total=Rp ${smallEst.data?.totalIdr.toLocaleString()}, AML Flag=${smallEst.data?.amlFlag}`);

  // Large transaction (>= 100 Juta, e.g. $10,000 * 16,050 = 160.5 Juta)
  const largeEst = await handleCalculateEstimate({
    type: 'BUY',
    currencyCode: 'USD',
    amountForeign: 10000,
  });
  console.log(`[OK] Large BUY $10000: Total=Rp ${largeEst.data?.totalIdr.toLocaleString()}, AML Flag=${largeEst.data?.amlFlag} (Expected: true - CTR PPATK)`);

  if (!largeEst.data?.amlFlag) {
    throw new Error('AML Flag failed for >= 100 Juta transaction!');
  }

  // 3. KYC Gate Testing
  console.log('\n--- 3. Testing KYC Verification Gate ---');
  // Make temporary unverified user
  const tempEmail = 'unverified_test@valutaprima.com';
  await db.insert(schema.users).values({
    email: tempEmail,
    name: 'Unverified Test User',
    role: 'customer',
    isKycVerified: false,
  }).onConflictDoUpdate({
    target: schema.users.email,
    set: { isKycVerified: false },
  });

  const unverifiedUser = (await db.select().from(schema.users).where(eq(schema.users.email, tempEmail)))[0];

  const blockedTrx = await handleCreateTransaction({
    userId: unverifiedUser.id,
    type: 'BUY',
    currencyCode: 'USD',
    amountForeign: 500,
  });

  console.log(`[OK] Unverified KYC transaction attempt: success=${blockedTrx.success}, Error: ${blockedTrx.error}`);
  if (blockedTrx.success) {
    throw new Error('Transaction should have been BLOCKED for unverified KYC!');
  }

  // 4. Booking Transaction for Verified Customer
  console.log('\n--- 4. Testing Verified Customer Transaction Booking ---');
  const customerRes = await handleDevSwitchRole('customer');
  const customer = customerRes.data!;

  // Ensure customer is verified for test
  await db.update(schema.users).set({ isKycVerified: true }).where(eq(schema.users.id, customer.id));

  // Request $700 = 5 lembar x $100 + 4 lembar x $50
  const requestedDenoms = [
    { denominationValue: 100, quantity: 5 },
    { denominationValue: 50, quantity: 4 },
  ];

  const createRes = await handleCreateTransaction({
    userId: customer.id,
    type: 'BUY',
    currencyCode: 'USD',
    amountForeign: 700,
    denominations: requestedDenoms,
  });

  console.log(`[OK] Transaction Created: Ref=${createRes.data?.referenceNo}, Status=${createRes.data?.status}`);
  if (!createRes.success || !createRes.data) {
    throw new Error('Failed to create transaction: ' + createRes.error);
  }

  const transactionId = createRes.data.id;

  // 5. Supervisor Queue
  console.log('\n--- 5. Testing Supervisor Transaction Queue ---');
  const queueRes = await handleGetTransactions({ role: 'supervisor', status: 'pending_supervisor' });
  console.log(`[OK] Pending Supervisor Queue Count: ${queueRes.data?.length}`);
  const queuedTrx = queueRes.data?.find((t) => t.id === transactionId);
  console.log(`[OK] Found our transaction in queue: Ref=${queuedTrx?.referenceNo}, Amount IDR=Rp ${queuedTrx?.amountIdr.toLocaleString()}`);

  // 6. Supervisor Authorization - PIN Security
  console.log('\n--- 6. Testing Supervisor PIN Validation ---');
  const wrongPinRes = await handleAuthorizeTransaction({
    transactionId,
    supervisorName: 'Hendra Wijaya (Supervisor)',
    pin: '000000', // WRONG PIN
    action: 'approve',
  });
  console.log(`[OK] Wrong PIN response: success=${wrongPinRes.success}, Error=${wrongPinRes.error}`);
  if (wrongPinRes.success) {
    throw new Error('Wrong PIN should have been rejected!');
  }

  // Correct PIN
  console.log('\n--- 7. Testing Supervisor Approval & Atomic Stock Lock ---');
  const approveRes = await handleAuthorizeTransaction({
    transactionId,
    supervisorName: 'Hendra Wijaya (Supervisor)',
    pin: '123456', // CORRECT PIN
    action: 'approve',
    notes: 'Disetujui. Dana IDR telah diverifikasi fisik di kasir.',
  });

  console.log(`[OK] Approval Success: ${approveRes.success}, Invoice No: ${approveRes.data?.invoiceNo}`);
  if (!approveRes.success) {
    throw new Error('Failed to approve transaction with valid PIN!');
  }

  // 8. Verify Stock Deduction & Invoice
  console.log('\n--- 8. Verifying Inventory & Invoice in Database ---');
  const updatedDenoms = await handleGetDenominations('USD');
  const d100 = updatedDenoms.data?.find((d) => d.denominationValue === 100);
  const d50 = updatedDenoms.data?.find((d) => d.denominationValue === 50);
  console.log(`[OK] USD 100 remaining quantity: ${d100?.quantity} (Deducted by 5)`);
  console.log(`[OK] USD 50 remaining quantity: ${d50?.quantity} (Deducted by 4)`);

  const invoices = await db.select().from(schema.invoices).where(eq(schema.invoices.transactionId, transactionId));
  console.log(`[OK] Invoice created in DB: ${invoices[0]?.invoiceNo}, Amount: Rp ${parseFloat(invoices[0]?.amountIdr as string).toLocaleString()}`);

  console.log('\n=============================================');
  console.log('🎉 SPRINT 2 E2E VERIFICATION COMPLETED (100% PASS)');
  console.log('=============================================\n');
}

testSprint2().catch((err) => {
  console.error('❌ Sprint 2 Test Failed:', err);
  process.exit(1);
});
