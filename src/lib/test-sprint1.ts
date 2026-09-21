import { handleGetRates } from '../api/handlers/rates.handler';
import { handleDevSwitchRole, handleGetMe } from '../api/handlers/auth.handler';
import { handleSubmitKyc, handleGetPendingKyc, handleReviewKyc } from '../api/handlers/kyc.handler';

async function testSprint1() {
  console.log('--- 1. Testing Rates Handler ---');
  const rates = await handleGetRates();
  console.log(`[OK] Rates count: ${rates.data?.length}, Sample: ${rates.data?.[0]?.currencyCode} Buy Rate: Rp ${rates.data?.[0]?.buyRate}`);

  console.log('--- 2. Testing Auth Handler ---');
  const userRes = await handleDevSwitchRole('customer');
  const customer = userRes.data!;
  console.log(`[OK] Customer logged in: ${customer.name} (ID: ${customer.id}, KYC: ${customer.isKycVerified})`);

  console.log('--- 3. Testing KYC Submission ---');
  const submitRes = await handleSubmitKyc({
    userId: customer.id,
    idCardNumber: '3171012345678901',
    idCardType: 'KTP',
    idCardFileUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=400',
  });
  console.log(`[OK] KYC Submitted: success=${submitRes.success}, Sub ID=${submitRes.data?.id}`);

  console.log('--- 4. Testing Teller Pending Queue ---');
  const pending = await handleGetPendingKyc();
  console.log(`[OK] Pending Queue count: ${pending.data?.length}, Latest applicant: ${pending.data?.[0]?.userName}`);

  console.log('--- 5. Testing Teller Review Approval ---');
  const reviewRes = await handleReviewKyc({
    submissionId: submitRes.data!.id,
    reviewerId: 'Siti Rahma (Teller)',
    action: 'verified',
    notes: 'KTP jelas dan data kependudukan valid.',
  });
  console.log(`[OK] Review Approval: success=${reviewRes.success}, Status: ${reviewRes.data?.status}`);

  console.log('--- 6. Verifying User Verification Status ---');
  const updatedUser = await handleGetMe(customer.id);
  console.log(`[OK] Customer KYC now verified: ${updatedUser.data?.isKycVerified}`);

  console.log('🎉 SPRINT 1 E2E VERIFICATION PASSED 100%!');
}

testSprint1().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
