import { db, schema } from '../../lib/db';
import { eq, desc, asc } from 'drizzle-orm';

export interface DenominationItem {
  id: number;
  currencyCode: string;
  denominationValue: number;
  quantity: number;
  isAvailable: boolean;
  updatedAt: string;
}

export const DEFAULT_DENOMINATIONS: DenominationItem[] = [
  { id: 1, currencyCode: 'USD', denominationValue: 100, quantity: 300, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 2, currencyCode: 'USD', denominationValue: 50, quantity: 200, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 3, currencyCode: 'USD', denominationValue: 20, quantity: 250, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 4, currencyCode: 'EUR', denominationValue: 100, quantity: 150, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 5, currencyCode: 'EUR', denominationValue: 50, quantity: 200, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 6, currencyCode: 'EUR', denominationValue: 20, quantity: 150, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 7, currencyCode: 'SGD', denominationValue: 50, quantity: 800, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 8, currencyCode: 'SGD', denominationValue: 10, quantity: 2500, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 9, currencyCode: 'JPY', denominationValue: 10000, quantity: 100, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 10, currencyCode: 'JPY', denominationValue: 5000, quantity: 100, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 11, currencyCode: 'AUD', denominationValue: 100, quantity: 200, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 12, currencyCode: 'AUD', denominationValue: 50, quantity: 240, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 13, currencyCode: 'GBP', denominationValue: 50, quantity: 200, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 14, currencyCode: 'GBP', denominationValue: 20, quantity: 400, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 15, currencyCode: 'CNY', denominationValue: 100, quantity: 500, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 16, currencyCode: 'CNY', denominationValue: 50, quantity: 600, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 17, currencyCode: 'SAR', denominationValue: 500, quantity: 100, isAvailable: true, updatedAt: new Date().toISOString() },
  { id: 18, currencyCode: 'SAR', denominationValue: 100, quantity: 450, isAvailable: true, updatedAt: new Date().toISOString() },
];

export async function handleGetDenominations(currencyCode?: string) {
  try {
    let rawList;
    if (currencyCode) {
      rawList = await db
        .select()
        .from(schema.currencyDenominations)
        .where(eq(schema.currencyDenominations.currencyCode, currencyCode.toUpperCase()))
        .orderBy(desc(schema.currencyDenominations.denominationValue));
    } else {
      rawList = await db
        .select()
        .from(schema.currencyDenominations)
        .orderBy(asc(schema.currencyDenominations.currencyCode), desc(schema.currencyDenominations.denominationValue));
    }

    if (rawList && rawList.length > 0) {
      const data: DenominationItem[] = rawList.map((d) => ({
        id: d.id,
        currencyCode: d.currencyCode,
        denominationValue: d.denominationValue,
        quantity: d.quantity,
        isAvailable: d.isAvailable ?? true,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
      }));

      return {
        success: true,
        data,
      };
    }

    // Fallback to defaults
    const filtered = currencyCode
      ? DEFAULT_DENOMINATIONS.filter((d) => d.currencyCode === currencyCode.toUpperCase())
      : DEFAULT_DENOMINATIONS;

    return {
      success: true,
      data: filtered,
    };
  } catch (error: any) {
    console.warn('⚠️ [inventory.handler] Database error, returning fallback denominations:', error.message);
    const filtered = currencyCode
      ? DEFAULT_DENOMINATIONS.filter((d) => d.currencyCode === currencyCode.toUpperCase())
      : DEFAULT_DENOMINATIONS;

    return {
      success: true,
      data: filtered,
    };
  }
}

export async function handleUpdateDenomination(params: {
  id: number;
  quantity: number;
  isAvailable?: boolean;
}) {
  try {
    const { id, quantity, isAvailable } = params;

    const updateFields: any = {
      quantity,
      updatedAt: new Date(),
    };
    if (isAvailable !== undefined) {
      updateFields.isAvailable = isAvailable;
    }

    const updated = await db
      .update(schema.currencyDenominations)
      .set(updateFields)
      .where(eq(schema.currencyDenominations.id, id))
      .returning();

    if (!updated.length) {
      return { success: false, error: 'Pecahan tidak ditemukan.' };
    }

    return {
      success: true,
      message: 'Stok pecahan berhasil diperbarui.',
      data: updated[0],
    };
  } catch (error: any) {
    console.error('Error in handleUpdateDenomination:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
