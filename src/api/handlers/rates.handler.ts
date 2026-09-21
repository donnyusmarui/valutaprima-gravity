import { db, schema } from '../../lib/db';
import { eq, asc } from 'drizzle-orm';

export interface ExchangeRateItem {
  id: number;
  currencyCode: string;
  currencyName: string;
  buyRate: number;
  sellRate: number;
  stockAmount: number;
  updatedAt: string;
}

export const DEFAULT_INDICATIVE_RATES: ExchangeRateItem[] = [
  { id: 1, currencyCode: 'USD', currencyName: 'US Dollar', buyRate: 15850, sellRate: 16050, stockAmount: 45000, updatedAt: new Date().toISOString() },
  { id: 2, currencyCode: 'EUR', currencyName: 'Euro', buyRate: 17200, sellRate: 17450, stockAmount: 28000, updatedAt: new Date().toISOString() },
  { id: 3, currencyCode: 'SGD', currencyName: 'Singapore Dollar', buyRate: 11800, sellRate: 11980, stockAmount: 65000, updatedAt: new Date().toISOString() },
  { id: 4, currencyCode: 'JPY', currencyName: 'Japanese Yen (x100)', buyRate: 104.5, sellRate: 106.8, stockAmount: 1500000, updatedAt: new Date().toISOString() },
  { id: 5, currencyCode: 'AUD', currencyName: 'Australian Dollar', buyRate: 10250, sellRate: 10450, stockAmount: 32000, updatedAt: new Date().toISOString() },
  { id: 6, currencyCode: 'GBP', currencyName: 'British Pound', buyRate: 20150, sellRate: 20450, stockAmount: 18000, updatedAt: new Date().toISOString() },
  { id: 7, currencyCode: 'CNY', currencyName: 'Chinese Yuan', buyRate: 2180, sellRate: 2240, stockAmount: 80000, updatedAt: new Date().toISOString() },
  { id: 8, currencyCode: 'SAR', currencyName: 'Saudi Riyal', buyRate: 4220, sellRate: 4350, stockAmount: 95000, updatedAt: new Date().toISOString() },
];

export async function handleGetRates() {
  try {
    const rawRates = await db
      .select()
      .from(schema.exchangeRates)
      .orderBy(asc(schema.exchangeRates.currencyCode));

    if (rawRates && rawRates.length > 0) {
      const rates = rawRates.map((r) => ({
        id: r.id,
        currencyCode: r.currencyCode,
        currencyName: r.currencyName,
        buyRate: parseFloat(r.buyRate as string),
        sellRate: parseFloat(r.sellRate as string),
        stockAmount: parseFloat((r.stockAmount as string) || '0'),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
      }));

      return {
        success: true,
        data: rates,
        isLiveDatabase: true,
      };
    }

    // If table exists but has no rows yet
    return {
      success: true,
      data: DEFAULT_INDICATIVE_RATES,
      isOfflineFallback: true,
    };
  } catch (error: any) {
    console.warn('⚠️ [rates.handler] Database offline or unconfigured, providing indicative fallback rates:', error.message);
    return {
      success: true,
      data: DEFAULT_INDICATIVE_RATES,
      isOfflineFallback: true,
      warning: 'Koneksi database cloud Neon belum terhubung di Netlify. Menampilkan data kurs indikatif.',
    };
  }
}

export async function handleUpdateRate(data: {
  currencyCode: string;
  buyRate?: number;
  sellRate?: number;
  stockAmount?: number;
}) {
  try {
    const updateValues: any = {
      updatedAt: new Date(),
    };
    if (data.buyRate !== undefined) updateValues.buyRate = data.buyRate.toString();
    if (data.sellRate !== undefined) updateValues.sellRate = data.sellRate.toString();
    if (data.stockAmount !== undefined) updateValues.stockAmount = data.stockAmount.toString();

    const updated = await db
      .update(schema.exchangeRates)
      .set(updateValues)
      .where(eq(schema.exchangeRates.currencyCode, data.currencyCode))
      .returning();

    if (!updated.length) {
      return { success: false, error: 'Mata uang tidak ditemukan' };
    }

    return {
      success: true,
      message: `Kurs ${data.currencyCode} berhasil diperbarui`,
      data: updated[0],
    };
  } catch (error: any) {
    console.error('Error in handleUpdateRate:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
