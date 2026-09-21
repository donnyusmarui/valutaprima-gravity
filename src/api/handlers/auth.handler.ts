import { db, schema } from '../../lib/db';
import { eq } from 'drizzle-orm';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'teller' | 'supervisor';
  avatarUrl?: string | null;
  isKycVerified: boolean;
}

export async function handleGetMe(userIdOrEmail: string | number) {
  try {
    let userRecord;
    if (typeof userIdOrEmail === 'number') {
      const results = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userIdOrEmail))
        .limit(1);
      userRecord = results[0];
    } else {
      const results = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, userIdOrEmail))
        .limit(1);
      userRecord = results[0];
    }

    if (!userRecord) {
      // Return demo customer fallback if not in DB
      return {
        success: true,
        data: {
          id: 1,
          email: 'customer@valutaprima.com',
          name: 'Budi Santoso',
          role: 'customer' as const,
          avatarUrl: null,
          isKycVerified: true,
        },
      };
    }

    return {
      success: true,
      data: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role as 'customer' | 'teller' | 'supervisor',
        avatarUrl: userRecord.avatarUrl,
        isKycVerified: !!userRecord.isKycVerified,
      },
    };
  } catch (error: any) {
    console.warn('⚠️ [auth.handler] Database error, returning fallback demo user:', error.message);
    return {
      success: true,
      data: {
        id: 1,
        email: 'customer@valutaprima.com',
        name: 'Budi Santoso',
        role: 'customer' as const,
        avatarUrl: null,
        isKycVerified: true,
      },
    };
  }
}

export async function handleDevSwitchRole(targetRole: 'customer' | 'teller' | 'supervisor') {
  try {
    const roleEmailMap = {
      customer: 'customer@valutaprima.com',
      teller: 'teller@valutaprima.com',
      supervisor: 'supervisor@valutaprima.com',
    };

    const targetEmail = roleEmailMap[targetRole] || roleEmailMap.customer;
    let user = (
      await db.select().from(schema.users).where(eq(schema.users.email, targetEmail)).limit(1)
    )[0];

    if (!user) {
      // Fallback create if not exists
      const inserted = await db
        .insert(schema.users)
        .values({
          email: targetEmail,
          name: targetRole === 'customer' ? 'Budi Santoso' : targetRole === 'teller' ? 'Siti Rahma' : 'Hendra Wijaya',
          role: targetRole,
          isKycVerified: targetRole !== 'customer',
        })
        .returning();
      user = inserted[0];
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'customer' | 'teller' | 'supervisor',
        avatarUrl: user.avatarUrl,
        isKycVerified: !!user.isKycVerified,
        token: `dev_token_${user.role}_${user.id}`,
      },
    };
  } catch (error: any) {
    console.warn('⚠️ [auth.handler] Database error, returning fallback demo role:', error.message);
    const demoNames = {
      customer: 'Budi Santoso',
      teller: 'Siti Rahma (Teller)',
      supervisor: 'Hendra Wijaya (Supervisor)',
    };
    return {
      success: true,
      data: {
        id: targetRole === 'customer' ? 1 : targetRole === 'teller' ? 2 : 3,
        email: `${targetRole}@valutaprima.com`,
        name: demoNames[targetRole] || 'Pengguna Demo',
        role: targetRole,
        avatarUrl: null,
        isKycVerified: true,
        token: `dev_token_${targetRole}`,
      },
    };
  }
}

export async function handleGoogleOAuthCallback(profile: { email: string; name: string; avatarUrl?: string }) {
  try {
    let user = (
      await db.select().from(schema.users).where(eq(schema.users.email, profile.email)).limit(1)
    )[0];

    if (!user) {
      const inserted = await db
        .insert(schema.users)
        .values({
          email: profile.email,
          name: profile.name,
          role: 'customer',
          avatarUrl: profile.avatarUrl,
          isKycVerified: false,
        })
        .returning();
      user = inserted[0];
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'customer' | 'teller' | 'supervisor',
        avatarUrl: user.avatarUrl,
        isKycVerified: !!user.isKycVerified,
        token: `google_token_${user.id}`,
      },
    };
  } catch (error: any) {
    console.warn('⚠️ [auth.handler] Database error, returning Google profile directly:', error.message);
    return {
      success: true,
      data: {
        id: 99,
        email: profile.email,
        name: profile.name,
        role: 'customer' as const,
        avatarUrl: profile.avatarUrl,
        isKycVerified: false,
        token: 'google_token_99',
      },
    };
  }
}
