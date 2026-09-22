// payment.handler.ts — Sprint 3 Langkah 7 (Fixed)
import { db } from '../../lib/db.js';
import { transactions } from '../../lib/schema.js';
import { eq } from 'drizzle-orm';

// ─── Midtrans dynamic import (serverless-safe) ────────────────────────────────
async function getMidtransSnap() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const midtransClient = await import('midtrans-client') as any;
  const Snap = midtransClient.Snap ?? midtransClient.default?.Snap;
  return new Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  });
}

async function getMidtransCoreApi() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const midtransClient = await import('midtrans-client') as any;
  const CoreApi = midtransClient.CoreApi ?? midtransClient.default?.CoreApi;
  return new CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CreatePaymentInput {
  transactionId: number;
  customerName: string;
  customerEmail: string;
  totalAmountIdr: number;
  invoiceNo: string;
  paymentMethod?: 'snap' | 'va_bca' | 'va_bni' | 'va_mandiri' | 'qris';
}

export interface WebhookNotificationInput {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_id?: string;
  settlement_time?: string;
}

// ─── OFFLINE FALLBACK saat Midtrans key belum dikonfigurasi ──────────────────
function isMidtransConfigured(): boolean {
  const key = process.env.MIDTRANS_SERVER_KEY || '';
  return key.length > 10;
}

// ─── handleCreatePayment ──────────────────────────────────────────────────────
export async function handleCreatePayment(input: CreatePaymentInput) {
  const { transactionId, customerName, customerEmail, totalAmountIdr, invoiceNo } = input;

  if (!isMidtransConfigured()) {
    // Simulasi mode demo
    try {
      await db.update(transactions)
        .set({ status: 'awaiting_payment' })
        .where(eq(transactions.id, transactionId));
    } catch { /* DB offline — skip */ }

    return {
      success: true,
      data: {
        snapToken: `DEMO-SNAP-${Date.now()}`,
        redirectUrl: null,
        isDemoMode: true,
        message: 'Mode Demo — Midtrans Sandbox belum dikonfigurasi. Set MIDTRANS_SERVER_KEY di .env untuk aktivasi pembayaran nyata.',
        invoiceNo,
        totalAmountIdr,
      },
    };
  }

  try {
    const snap = await getMidtransSnap();
    const parameter = {
      transaction_details: {
        order_id: `${invoiceNo}-${Date.now()}`,
        gross_amount: Math.ceil(totalAmountIdr),
      },
      customer_details: {
        first_name: customerName.split(' ')[0],
        last_name: customerName.split(' ').slice(1).join(' ') || '',
        email: customerEmail,
      },
      item_details: [{
        id: `TXN-${transactionId}`,
        price: Math.ceil(totalAmountIdr),
        quantity: 1,
        name: `Transaksi Valas - ${invoiceNo}`,
      }],
    };

    const snapResponse = await snap.createTransaction(parameter);
    await db.update(transactions)
      .set({ status: 'awaiting_payment' })
      .where(eq(transactions.id, transactionId));

    return {
      success: true,
      data: { snapToken: snapResponse.token, redirectUrl: snapResponse.redirect_url, isDemoMode: false, invoiceNo, totalAmountIdr },
    };
  } catch (err) {
    return { success: false, error: `Gagal membuat sesi pembayaran: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─── handleWebhookNotification ────────────────────────────────────────────────
export async function handleWebhookNotification(body: WebhookNotificationInput) {
  try {
    const coreApi = await getMidtransCoreApi();
    const statusResponse = await coreApi.transaction.notification(body);
    const { order_id, transaction_status, fraud_status } = statusResponse;
    const invoiceNo = order_id.split('-').slice(0, 3).join('-');

    let newStatus: string;
    if (transaction_status === 'capture') {
      newStatus = fraud_status === 'challenge' ? 'awaiting_payment' : 'completed';
    } else if (transaction_status === 'settlement') {
      newStatus = 'completed';
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      newStatus = 'cancelled';
    } else {
      newStatus = 'awaiting_payment';
    }

    const existing = await db.select().from(transactions).where(eq(transactions.invoiceNo, invoiceNo)).limit(1);
    if (!existing.length) return { success: false, error: `Invoice ${invoiceNo} tidak ditemukan` };

    const txn = existing[0];
    if (txn.status === 'completed' && newStatus === 'completed') {
      return { success: true, message: 'Already processed (idempotent)', status: txn.status };
    }

    await db.update(transactions).set({ status: newStatus }).where(eq(transactions.invoiceNo, invoiceNo));
    return { success: true, message: `Status ${invoiceNo} → ${newStatus}`, invoiceNo, newStatus };
  } catch (err) {
    console.error('[Webhook Error]', err);
    return { success: true, message: 'Webhook received (error logged)', error: String(err) };
  }
}

// ─── handleGetPaymentStatus ───────────────────────────────────────────────────
export async function handleGetPaymentStatus(transactionId: number) {
  try {
    const result = await db.select({
      id: transactions.id,
      status: transactions.status,
      invoiceNo: transactions.invoiceNo,
      amountIdr: transactions.amountIdr,
      createdAt: transactions.createdAt,
    }).from(transactions).where(eq(transactions.id, transactionId)).limit(1);

    if (!result.length) return { success: false, error: 'Transaksi tidak ditemukan' };
    return { success: true, data: result[0] };
  } catch {
    return { success: false, error: 'Gagal mengambil status pembayaran' };
  }
}
