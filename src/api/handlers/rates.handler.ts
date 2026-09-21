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

export async function handleGetRates() {
  try {
    const rawRates = await db
      .select()
      .from(schema.exchangeRates)
      .orderBy(asc(schema.exchangeRates.currencyCode));

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
    };
  } catch (error: any) {
    console.error('Error in handleGetRates:', error);
    return {
      success: false,
      error: error.message,
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
