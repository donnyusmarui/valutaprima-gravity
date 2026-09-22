// test-sprint3.ts — E2E Test Sprint 3 (Langkah 7 & 8)
// Verifikasi: Payment creation (demo mode) + Audit Log + PPATK Report

import * as dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://localhost:3001/api';
let passed = 0;
let failed = 0;

function pass(label: string, detail?: string) {
  console.log(`  ✅ ${label}${detail ? ' — ' + detail : ''}`);
  passed++;
}

function fail(label: string, detail?: string) {
  console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
  failed++;
}

async function get(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  return { status: res.status, data: await res.json() };
}

async function post(path: string, body: object) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function runSprint3Tests() {
  console.log('\n════════════════════════════════════════════');
  console.log('  SPRINT 3 — E2E TEST (Langkah 7 & 8)');
  console.log('════════════════════════════════════════════\n');

  // ─── Langkah 7: Payment Gateway ──────────────────────────────────────────────
  console.log('📍 LANGKAH 7: Midtrans Payment Gateway\n');

  // Test 1: Create Payment (Demo Mode — tanpa Midtrans key nyata)
  {
    console.log('  Test 1: handleCreatePayment (Demo Mode)');
    const { status, data } = await post('/payment/create', {
      transactionId: 1,
      customerName: 'Test Customer',
      customerEmail: 'customer@valutaprima.com',
      totalAmountIdr: 15_000_000,
      invoiceNo: 'INV-20260922-TEST',
    });
    if (status === 200 && data.success) {
      if (data.data.isDemoMode) {
        pass('Payment created (Demo Mode)', `Token: ${data.data.snapToken}`);
      } else {
        pass('Payment created (Sandbox Live)', `Token: ${data.data.snapToken?.substring(0, 15)}...`);
      }
    } else {
      fail('handleCreatePayment', data.error || `HTTP ${status}`);
    }
  }

  // Test 2: Webhook Notification (simulasi Midtrans POST)
  {
    console.log('  Test 2: handleWebhookNotification (simulasi)');
    const { status, data } = await post('/payment/webhook', {
      order_id: 'INV-20260922-TEST-1234567890',
      transaction_status: 'settlement',
      fraud_status: 'accept',
      gross_amount: '15000000',
    });
    // Webhook selalu harus return 200
    if (status === 200) {
      pass('Webhook received with HTTP 200 (idempotent)', data.message || 'OK');
    } else {
      fail('Webhook must return 200', `Got HTTP ${status}`);
    }
  }

  // Test 3: Get Payment Status
  {
    console.log('  Test 3: handleGetPaymentStatus');
    const { status, data } = await get('/payment/status?id=1');
    if (status === 200 || (status === 404 && !data.success)) {
      pass('Payment status endpoint OK', status === 200 ? `Status: ${data.data?.status}` : 'No transaction yet (expected)');
    } else {
      fail('handleGetPaymentStatus', `HTTP ${status}`);
    }
  }

  // ─── Langkah 8: Invoice & PPATK Audit ───────────────────────────────────────
  console.log('\n📍 LANGKAH 8: Invoice PDF Data + Audit Log PPATK\n');

  // Test 4: Get Invoice Data
  {
    console.log('  Test 4: handleGetInvoiceData');
    const { status, data } = await get('/invoice/data?transactionId=1');
    if (status === 200 || (status === 404 && !data.success)) {
      pass('Invoice data endpoint OK', status === 200 ? `Invoice: ${data.data?.invoiceNo}` : 'No transaction yet (expected)');
    } else {
      fail('handleGetInvoiceData', `HTTP ${status}`);
    }
  }

  // Test 5: Audit Log (all transactions)
  {
    console.log('  Test 5: handleGetAuditLog (all)');
    const { status, data } = await get('/invoice/audit-log?limit=10');
    if (status === 200 && data.success) {
      pass('Audit log fetched', `${data.data.length} records | AML terflag: ${data.summary.amlFlaggedTransactions}`);
    } else {
      fail('handleGetAuditLog', data.error || `HTTP ${status}`);
    }
  }

  // Test 6: Audit Log (AML filter only)
  {
    console.log('  Test 6: handleGetAuditLog (amlOnly=true)');
    const { status, data } = await get('/invoice/audit-log?amlOnly=true&limit=10');
    if (status === 200 && data.success) {
      const allAml = data.data.every((r: { amlFlag: boolean }) => r.amlFlag === true);
      if (data.data.length === 0 || allAml) {
        pass('AML filter berjalan benar', `${data.data.length} CTR records`);
      } else {
        fail('AML filter tidak tepat — ada record non-AML');
      }
    } else {
      fail('handleGetAuditLog (amlOnly)', data.error || `HTTP ${status}`);
    }
  }

  // Test 7: PPATK Report
  {
    console.log('  Test 7: handleGetPpatkReport');
    const { status, data } = await get('/invoice/ppatk-report');
    if (status === 200 && data.success) {
      pass('PPATK report generated', `Total CTR: ${data.meta.totalFlagged} | ${data.meta.institution}`);
    } else {
      fail('handleGetPpatkReport', data.error || `HTTP ${status}`);
    }
  }

  // Test 8: Summary check
  {
    console.log('  Test 8: Audit summary has required fields');
    const { status, data } = await get('/invoice/audit-log');
    if (status === 200 && data.summary) {
      const s = data.summary;
      if (typeof s.totalTransactions === 'number' &&
          typeof s.amlFlaggedTransactions === 'number' &&
          typeof s.totalVolumeIdr === 'number') {
        pass('Summary fields validated', `Total vol: Rp ${s.totalVolumeIdr.toLocaleString('id-ID')}`);
      } else {
        fail('Summary fields tidak lengkap', JSON.stringify(s));
      }
    } else {
      fail('Summary check', `HTTP ${status}`);
    }
  }

  // ─── Final Report ─────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════');
  const total = passed + failed;
  console.log(`  📊 SPRINT 3 RESULTS: ${passed}/${total} PASSED`);
  if (failed === 0) {
    console.log('  🎉 SPRINT 3 GATE: PASS — Build + E2E OK');
  } else {
    console.log(`  ⚠️  ${failed} test(s) gagal — cek log di atas`);
  }
  console.log('════════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

runSprint3Tests().catch(err => {
  console.error('Test runner error:', err.message);
  console.log('\n⚠️  Pastikan dev server berjalan: npm run dev:server\n');
  process.exit(1);
});
