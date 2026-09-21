import { db, schema } from '../../lib/db';
import { eq, desc } from 'drizzle-orm';

export interface SubmitKycInput {
  userId: number;
  idCardNumber: string;
  idCardType: 'KTP' | 'PASSPORT';
  idCardFileUrl: string;
}

export async function handleSubmitKyc(input: SubmitKycInput) {
  try {
    if (!input.userId || !input.idCardNumber || !input.idCardFileUrl) {
      return { success: false, error: 'Data nomor identitas dan foto dokumen wajib diisi.' };
    }

    const inserted = await db
      .insert(schema.kycSubmissions)
      .values({
        userId: input.userId,
        idCardNumber: input.idCardNumber,
        idCardType: input.idCardType || 'KTP',
        idCardFileUrl: input.idCardFileUrl,
        status: 'pending',
        submittedAt: new Date(),
      })
      .returning();

    return {
      success: true,
      message: 'Dokumen KYC berhasil diajukan dan sedang dalam antrean verifikasi Teller.',
      data: inserted[0],
    };
  } catch (error: any) {
    console.error('Error in handleSubmitKyc:', error);
    return { success: false, error: error.message };
  }
}

export async function handleGetMyKyc(userId: number) {
  try {
    const submissions = await db
      .select()
      .from(schema.kycSubmissions)
      .where(eq(schema.kycSubmissions.userId, userId))
      .orderBy(desc(schema.kycSubmissions.submittedAt))
      .limit(1);

    const latest = submissions[0] || null;

    return {
      success: true,
      data: latest,
    };
  } catch (error: any) {
    console.error('Error in handleGetMyKyc:', error);
    return { success: false, error: error.message };
  }
}

export async function handleGetPendingKyc() {
  try {
    // Join with users table to get applicant name and email
    const results = await db
      .select({
        id: schema.kycSubmissions.id,
        userId: schema.kycSubmissions.userId,
        userName: schema.users.name,
        userEmail: schema.users.email,
        idCardNumber: schema.kycSubmissions.idCardNumber,
        idCardType: schema.kycSubmissions.idCardType,
        idCardFileUrl: schema.kycSubmissions.idCardFileUrl,
        status: schema.kycSubmissions.status,
        submittedAt: schema.kycSubmissions.submittedAt,
        reviewNotes: schema.kycSubmissions.reviewNotes,
      })
      .from(schema.kycSubmissions)
      .leftJoin(schema.users, eq(schema.kycSubmissions.userId, schema.users.id))
      .where(eq(schema.kycSubmissions.status, 'pending'))
      .orderBy(desc(schema.kycSubmissions.submittedAt));

    return {
      success: true,
      data: results,
    };
  } catch (error: any) {
    console.error('Error in handleGetPendingKyc:', error);
    return { success: false, error: error.message };
  }
}

export async function handleReviewKyc(params: {
  submissionId: number;
  reviewerId: string;
  action: 'verified' | 'rejected';
  notes?: string;
}) {
  try {
    const { submissionId, reviewerId, action, notes } = params;

    const updated = await db
      .update(schema.kycSubmissions)
      .set({
        status: action,
        reviewerId: reviewerId,
        reviewNotes: notes || (action === 'verified' ? 'Identitas terverifikasi valid oleh Teller.' : 'Dokumen tidak memenuhi standar kejelasan.'),
        reviewedAt: new Date(),
      })
      .where(eq(schema.kycSubmissions.id, submissionId))
      .returning();

    if (!updated.length) {
      return { success: false, error: 'Pengajuan KYC tidak ditemukan.' };
    }

    const sub = updated[0];

    // If verified, update the user record's isKycVerified flag
    if (action === 'verified' && sub.userId) {
      await db
        .update(schema.users)
        .set({ isKycVerified: true })
        .where(eq(schema.users.id, sub.userId));
    }

    return {
      success: true,
      message: `KYC telah berhasil di-${action === 'verified' ? 'setujui' : 'tolak'}.`,
      data: sub,
    };
  } catch (error: any) {
    console.error('Error in handleReviewKyc:', error);
    return { success: false, error: error.message };
  }
}
