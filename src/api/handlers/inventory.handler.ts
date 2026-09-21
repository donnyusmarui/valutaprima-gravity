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
  } catch (error: any) {
    console.error('Error in handleGetDenominations:', error);
    return {
      success: false,
      error: error.message,
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
