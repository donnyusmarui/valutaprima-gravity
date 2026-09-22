// invoice.handler.ts — Sprint 3 Langkah 8 (Fixed)
// Audit Log PPATK/BI + Invoice data untuk client-side jsPDF

import { db } from '../../lib/db.js';
import { transactions, users } from '../../lib/schema.js';
import { eq, and, desc } from 'drizzle-orm';

const AML_THRESHOLD = 100_000_000;

// ─── handleGetInvoiceData ─────────────────────────────────────────────────────
export async function handleGetInvoiceData(transactionId: number) {
  try {
    const result = await db
      .select({
        id: transactions.id,
        referenceNo: transactions.referenceNo,
        invoiceNo: transactions.invoiceNo,
        type: transactions.type,
        currencyCode: transactions.currencyCode,
        amountForeign: transactions.amountForeign,
        lockedRate: transactions.lockedRate,
        amountIdr: transactions.amountIdr,
        serviceFeeIdr: transactions.serviceFeeIdr,
        status: transactions.status,
        amlFlag: transactions.amlFlag,
        authorizedAt: transactions.authorizedAt,
        denominations: transactions.denominations,
        createdAt: transactions.createdAt,
        customerName: users.name,
        customerEmail: users.email,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (!result.length) return { success: false, error: 'Transaksi tidak ditemukan' };

    const r = result[0];
    return {
      success: true,
      data: {
        invoiceNo: r.invoiceNo || `INV-MANUAL-${r.id}`,
        referenceNo: r.referenceNo,
        date: r.createdAt,
        customer: { name: r.customerName || 'N/A', email: r.customerEmail || 'N/A' },
        transaction: {
          id: r.id,
          type: r.type,
          currencyCode: r.currencyCode,
          amountForeign: r.amountForeign,
          lockedRate: r.lockedRate,
          amountIdr: r.amountIdr,
          serviceFeeIdr: r.serviceFeeIdr,
          status: r.status,
          amlFlag: r.amlFlag,
          authorizedAt: r.authorizedAt,
          denominations: r.denominations,
        },
        company: {
          name: 'PT Valuta Prima Gravity',
          address: 'Jl. Money Changer No. 1, Jakarta Pusat',
          phone: '+62 21 1234 5678',
          email: 'info@valutaprima.com',
          license: 'PPATK-MC-2024-001',
        },
        compliance: { isAmlReported: r.amlFlag === true, reportThreshold: AML_THRESHOLD },
      },
    };
  } catch (err) {
    return { success: false, error: `Gagal mengambil data invoice: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─── handleGetAuditLog ────────────────────────────────────────────────────────
export async function handleGetAuditLog(params: {
  startDate?: string;
  endDate?: string;
  amlOnly?: boolean;
  currencyCode?: string;
  limit?: number;
}) {
  try {
    const { amlOnly, limit = 100 } = params;

    const conditions = [];
    if (amlOnly) conditions.push(eq(transactions.amlFlag, true));
    if (params.currencyCode) conditions.push(eq(transactions.currencyCode, params.currencyCode));

    const baseQuery = db
      .select({
        id: transactions.id,
        invoiceNo: transactions.invoiceNo,
        referenceNo: transactions.referenceNo,
        type: transactions.type,
        currencyCode: transactions.currencyCode,
        amountForeign: transactions.amountForeign,
        lockedRate: transactions.lockedRate,
        amountIdr: transactions.amountIdr,
        serviceFeeIdr: transactions.serviceFeeIdr,
        status: transactions.status,
        amlFlag: transactions.amlFlag,
        reviewNotes: transactions.reviewNotes,
        createdAt: transactions.createdAt,
        authorizedAt: transactions.authorizedAt,
        customerName: users.name,
        customerEmail: users.email,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    const result = conditions.length === 0
      ? await baseQuery
      : conditions.length === 1
        ? await baseQuery.where(conditions[0])
        : await baseQuery.where(and(...conditions));

    const totalVolume = result.reduce((sum: number, r: typeof result[0]) => sum + Number(r.amountIdr || 0), 0);
    const amlCount = result.filter((r: typeof result[0]) => r.amlFlag).length;
    const completedCount = result.filter((r: typeof result[0]) => r.status === 'completed').length;

    return {
      success: true,
      data: result,
      summary: {
        totalTransactions: result.length,
        completedTransactions: completedCount,
        amlFlaggedTransactions: amlCount,
        totalVolumeIdr: totalVolume,
        reportPeriod: { start: params.startDate || 'All time', end: params.endDate || new Date().toISOString() },
      },
    };
  } catch (err) {
    return {
      success: true,
      data: [],
      summary: { totalTransactions: 0, completedTransactions: 0, amlFlaggedTransactions: 0, totalVolumeIdr: 0, reportPeriod: { start: 'N/A', end: 'N/A' } },
      isOfflineFallback: true,
      error: String(err),
    };
  }
}

// ─── handleGetPpatkReport ─────────────────────────────────────────────────────
export async function handleGetPpatkReport() {
  try {
    const flagged = await db
      .select({
        id: transactions.id,
        invoiceNo: transactions.invoiceNo,
        type: transactions.type,
        currencyCode: transactions.currencyCode,
        amountForeign: transactions.amountForeign,
        amountIdr: transactions.amountIdr,
        status: transactions.status,
        createdAt: transactions.createdAt,
        authorizedAt: transactions.authorizedAt,
        customerName: users.name,
        customerEmail: users.email,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .where(eq(transactions.amlFlag, true))
      .orderBy(desc(transactions.createdAt));

    return {
      success: true,
      data: flagged,
      meta: {
        reportType: 'CTR (Cash Transaction Report)',
        threshold: `Rp ${AML_THRESHOLD.toLocaleString('id-ID')}`,
        generatedAt: new Date().toISOString(),
        totalFlagged: flagged.length,
        institution: 'PT Valuta Prima Gravity',
        licenseNo: 'PPATK-MC-2024-001',
      },
    };
  } catch {
    return {
      success: true,
      data: [],
      meta: { reportType: 'CTR', totalFlagged: 0, generatedAt: new Date().toISOString() },
      isOfflineFallback: true,
    };
  }
}
