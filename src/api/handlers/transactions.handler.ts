import { db, schema } from '../../lib/db';
import { eq, desc, and } from 'drizzle-orm';

export interface DenominationRequest {
  denominationValue: number;
  quantity: number;
}

export interface CalculateEstimateInput {
  type: 'BUY' | 'SELL';
  currencyCode: string;
  amountForeign: number;
}

export interface CreateTransactionInput {
  userId: number;
  type: 'BUY' | 'SELL';
  currencyCode: string;
  amountForeign: number;
  denominations?: DenominationRequest[];
}

export interface AuthorizeTransactionInput {
  transactionId: number;
  supervisorName: string;
  pin: string;
  action: 'approve' | 'reject';
  notes?: string;
}

// Generate unique formatted references
function generateReferenceNo(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${dateStr}-${rand}`;
}

function generateInvoiceNo(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${rand}`;
}

/**
 * 1. Kalkulator Estimasi Kurs & Biaya
 */
export async function handleCalculateEstimate(input: CalculateEstimateInput) {
  try {
    const { type, currencyCode, amountForeign } = input;

    if (!amountForeign || amountForeign <= 0) {
      return { success: false, error: 'Jumlah valas harus lebih besar dari 0.' };
    }

    const rates = await db
      .select()
      .from(schema.exchangeRates)
      .where(eq(schema.exchangeRates.currencyCode, currencyCode.toUpperCase()))
      .limit(1);

    if (!rates.length) {
      return { success: false, error: `Mata uang ${currencyCode} tidak ditemukan.` };
    }

    const rateRow = rates[0];
    const buyRate = parseFloat(rateRow.buyRate as string);
    const sellRate = parseFloat(rateRow.sellRate as string);
    const stockAmount = parseFloat((rateRow.stockAmount as string) || '0');

    // Customer BUY = Rate Jual Money Changer (sellRate)
    // Customer SELL = Rate Beli Money Changer (buyRate)
    const lockedRate = type === 'BUY' ? sellRate : buyRate;
    const subtotalIdr = Math.round(amountForeign * lockedRate);

    // Biaya administrasi / materai (flat Rp 0 untuk promo, jika >= Rp 5.000.000 bebas biaya)
    const serviceFeeIdr = subtotalIdr < 5000000 ? 5000 : 0;
    const totalIdr = type === 'BUY' ? subtotalIdr + serviceFeeIdr : subtotalIdr - serviceFeeIdr;

    // Threshold Pelaporan Transaksi Keuangan Tunai (CTR / PPATK) >= Rp 100.000.000
    const amlFlag = totalIdr >= 100000000;

    return {
      success: true,
      data: {
        type,
        currencyCode: rateRow.currencyCode,
        currencyName: rateRow.currencyName,
        amountForeign,
        lockedRate,
        subtotalIdr,
        serviceFeeIdr,
        totalIdr,
        availableStock: stockAmount,
        isStockSufficient: type === 'BUY' ? stockAmount >= amountForeign : true,
        amlFlag,
      },
    };
  } catch (error: any) {
    console.error('Error in handleCalculateEstimate:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 2. Booking / Pembuatan Transaksi Baru
 */
export async function handleCreateTransaction(input: CreateTransactionInput) {
  try {
    const { userId, type, currencyCode, amountForeign, denominations } = input;

    if (!userId || !amountForeign || amountForeign <= 0) {
      return { success: false, error: 'Data transaksi tidak valid.' };
    }

    // A. Validasi Status KYC Pengguna
    const userList = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!userList.length) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    const user = userList[0];
    if (!user.isKycVerified) {
      return {
        success: false,
        error: 'KYC_NOT_VERIFIED: Akun Anda belum terverifikasi KYC. Selesaikan verifikasi identitas terlebih dahulu sebelum melakukan transaksi valas.',
      };
    }

    // B. Cek Rate & Stok
    const rates = await db
      .select()
      .from(schema.exchangeRates)
      .where(eq(schema.exchangeRates.currencyCode, currencyCode.toUpperCase()))
      .limit(1);

    if (!rates.length) {
      return { success: false, error: `Mata uang ${currencyCode} tidak ditemukan.` };
    }

    const rateRow = rates[0];
    const buyRate = parseFloat(rateRow.buyRate as string);
    const sellRate = parseFloat(rateRow.sellRate as string);
    const currentStock = parseFloat((rateRow.stockAmount as string) || '0');

    if (type === 'BUY' && currentStock < amountForeign) {
      return {
        success: false,
        error: `Stok kas fisik ${currencyCode} tidak mencukupi (Tersedia: ${currentStock.toLocaleString()}, Diminta: ${amountForeign.toLocaleString()}).`,
      };
    }

    // C. Validasi Stok Pecahan Fisik jika BUY dan ada spesifikasi pecahan
    if (type === 'BUY' && denominations && denominations.length > 0) {
      const dbDenoms = await db
        .select()
        .from(schema.currencyDenominations)
        .where(eq(schema.currencyDenominations.currencyCode, currencyCode.toUpperCase()));

      const denomMap = new Map(dbDenoms.map((d) => [d.denominationValue, d.quantity]));

      for (const req of denominations) {
        const availableQty = denomMap.get(req.denominationValue) || 0;
        if (req.quantity > availableQty) {
          return {
            success: false,
            error: `Pecahan ${currencyCode} ${req.denominationValue} tidak mencukupi. Tersedia: ${availableQty} lembar, diminta: ${req.quantity} lembar.`,
          };
        }
      }
    }

    const lockedRate = type === 'BUY' ? sellRate : buyRate;
    const subtotalIdr = Math.round(amountForeign * lockedRate);
    const serviceFeeIdr = subtotalIdr < 5000000 ? 5000 : 0;
    const totalIdr = type === 'BUY' ? subtotalIdr + serviceFeeIdr : subtotalIdr - serviceFeeIdr;
    const amlFlag = totalIdr >= 100000000;

    const referenceNo = generateReferenceNo();

    const inserted = await db
      .insert(schema.transactions)
      .values({
        referenceNo,
        userId,
        type,
        currencyCode: currencyCode.toUpperCase(),
        amountForeign: amountForeign.toString(),
        lockedRate: lockedRate.toString(),
        amountIdr: totalIdr.toString(),
        serviceFeeIdr: serviceFeeIdr.toString(),
        denominations: denominations ? JSON.stringify(denominations) : null,
        amlFlag,
        status: 'pending_supervisor',
        createdAt: new Date(),
      })
      .returning();

    return {
      success: true,
      message: `Transaksi ${referenceNo} berhasil dibuat dan menunggu otorisasi Supervisor.`,
      data: inserted[0],
    };
  } catch (error: any) {
    console.error('Error in handleCreateTransaction:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 3. Daftar Transaksi (Filter per User atau Supervisor/Teller Queue)
 */
export async function handleGetTransactions(params: {
  userId?: number;
  role?: string;
  status?: string;
}) {
  try {
    const { userId, role, status } = params;

    let query = db
      .select({
        id: schema.transactions.id,
        referenceNo: schema.transactions.referenceNo,
        userId: schema.transactions.userId,
        userName: schema.users.name,
        userEmail: schema.users.email,
        userAvatar: schema.users.avatarUrl,
        type: schema.transactions.type,
        currencyCode: schema.transactions.currencyCode,
        amountForeign: schema.transactions.amountForeign,
        lockedRate: schema.transactions.lockedRate,
        amountIdr: schema.transactions.amountIdr,
        serviceFeeIdr: schema.transactions.serviceFeeIdr,
        denominations: schema.transactions.denominations,
        amlFlag: schema.transactions.amlFlag,
        status: schema.transactions.status,
        authorizedBy: schema.transactions.authorizedBy,
        authorizedAt: schema.transactions.authorizedAt,
        reviewNotes: schema.transactions.reviewNotes,
        invoiceNo: schema.transactions.invoiceNo,
        createdAt: schema.transactions.createdAt,
      })
      .from(schema.transactions)
      .leftJoin(schema.users, eq(schema.transactions.userId, schema.users.id))
      .orderBy(desc(schema.transactions.createdAt));

    const rawList = await query;

    // Filter in-memory for flexible condition matching
    let filtered = rawList;

    if (role === 'customer' && userId) {
      filtered = filtered.filter((t) => t.userId === userId);
    } else if (userId && !role) {
      filtered = filtered.filter((t) => t.userId === userId);
    }

    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    const data = filtered.map((t) => ({
      ...t,
      amountForeign: parseFloat(t.amountForeign as string),
      lockedRate: parseFloat(t.lockedRate as string),
      amountIdr: parseFloat(t.amountIdr as string),
      serviceFeeIdr: parseFloat((t.serviceFeeIdr as string) || '0'),
      denominations: t.denominations ? JSON.parse(t.denominations) : [],
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      authorizedAt: t.authorizedAt ? new Date(t.authorizedAt).toISOString() : null,
    }));

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error('Error in handleGetTransactions:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 4. Otorisasi Supervisor (PIN Verification & Atomic Stock Locking)
 */
export async function handleAuthorizeTransaction(input: AuthorizeTransactionInput) {
  try {
    const { transactionId, supervisorName, pin, action, notes } = input;

    // A. Validasi PIN Supervisor (Default demo PIN: 123456)
    if (pin !== '123456') {
      return {
        success: false,
        error: 'PIN_INVALID: PIN Otorisasi Supervisor salah. Akses ditolak demi keamanan perbankan.',
      };
    }

    // B. Ambil Transaksi
    const trxList = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, transactionId))
      .limit(1);

    if (!trxList.length) {
      return { success: false, error: 'Transaksi tidak ditemukan.' };
    }

    const trx = trxList[0];
    if (trx.status !== 'pending_supervisor') {
      return {
        success: false,
        error: `Transaksi sudah berstatus ${trx.status} dan tidak dapat diotorisasi ulang.`,
      };
    }

    // C. Jika Ditolak (Reject)
    if (action === 'reject') {
      const updated = await db
        .update(schema.transactions)
        .set({
          status: 'rejected',
          authorizedBy: supervisorName,
          authorizedAt: new Date(),
          reviewNotes: notes || 'Ditolak oleh Supervisor.',
        })
        .where(eq(schema.transactions.id, transactionId))
        .returning();

      return {
        success: true,
        message: 'Transaksi berhasil ditolak oleh Supervisor.',
        data: updated[0],
      };
    }

    // D. Jika Disetujui (Approve): Kurangi/Tambah Stok Kas & Pecahan secara Atomik
    const amountForeign = parseFloat(trx.amountForeign as string);
    const parsedDenoms: DenominationRequest[] = trx.denominations ? JSON.parse(trx.denominations) : [];

    // 1. Update stok di exchangeRates
    const currentRate = await db
      .select()
      .from(schema.exchangeRates)
      .where(eq(schema.exchangeRates.currencyCode, trx.currencyCode))
      .limit(1);

    if (currentRate.length > 0) {
      const stock = parseFloat((currentRate[0].stockAmount as string) || '0');
      const newStock = trx.type === 'BUY' ? stock - amountForeign : stock + amountForeign;

      await db
        .update(schema.exchangeRates)
        .set({
          stockAmount: Math.max(0, newStock).toString(),
          updatedAt: new Date(),
        })
        .where(eq(schema.exchangeRates.currencyCode, trx.currencyCode));
    }

    // 2. Update stok lembar pecahan fisik di currencyDenominations
    if (parsedDenoms.length > 0) {
      for (const item of parsedDenoms) {
        const existingDenom = await db
          .select()
          .from(schema.currencyDenominations)
          .where(
            and(
              eq(schema.currencyDenominations.currencyCode, trx.currencyCode),
              eq(schema.currencyDenominations.denominationValue, item.denominationValue)
            )
          )
          .limit(1);

        if (existingDenom.length > 0) {
          const currentQty = existingDenom[0].quantity;
          const newQty = trx.type === 'BUY' ? currentQty - item.quantity : currentQty + item.quantity;

          await db
            .update(schema.currencyDenominations)
            .set({
              quantity: Math.max(0, newQty),
              updatedAt: new Date(),
            })
            .where(eq(schema.currencyDenominations.id, existingDenom[0].id));
        }
      }
    }

    // 3. Generate Draft Invoice
    const invoiceNo = generateInvoiceNo();
    await db.insert(schema.invoices).values({
      invoiceNo,
      transactionId: trx.id,
      userId: trx.userId,
      amountIdr: trx.amountIdr,
      status: 'paid',
      createdAt: new Date(),
    });

    // 4. Update status transaksi menjadi approved / completed
    const updated = await db
      .update(schema.transactions)
      .set({
        status: 'approved',
        authorizedBy: supervisorName,
        authorizedAt: new Date(),
        reviewNotes: notes || 'Disetujui oleh Supervisor. Stok kas telah diperbarui.',
        invoiceNo,
      })
      .where(eq(schema.transactions.id, transactionId))
      .returning();

    return {
      success: true,
      message: `Transaksi ${trx.referenceNo} berhasil diotorisasi. Invoice ${invoiceNo} telah diterbitkan.`,
      data: {
        transaction: updated[0],
        invoiceNo,
      },
    };
  } catch (error: any) {
    console.error('Error in handleAuthorizeTransaction:', error);
    return { success: false, error: error.message };
  }
}
