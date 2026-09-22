import { createContext, useContext, useState, useEffect, type ReactNode, type FC } from 'react';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'customer' | 'teller' | 'supervisor';
  avatarUrl?: string | null;
  isKycVerified: boolean;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  switchRole: (role: 'customer' | 'teller' | 'supervisor') => Promise<void>;
  loginWithGoogle: (email: string, name: string, avatarUrl?: string) => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (name: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial load: restore session or default to customer demo user
  useEffect(() => {
    const saved = localStorage.getItem('valuta_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    // Fetch latest user info from server
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const saved = localStorage.getItem('valuta_user');
      const parsed = saved ? JSON.parse(saved) : null;
      const param = parsed?.id ? `userId=${parsed.id}` : 'email=customer@valutaprima.com';

      const res = await fetch(`/api/auth/me?${param}`);
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem('valuta_user', JSON.stringify(data.data));
      } else {
        // Default to dev customer
        await switchRole('customer');
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (targetRole: 'customer' | 'teller' | 'supervisor') => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/dev-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem('valuta_user', JSON.stringify(data.data));
      }
    } catch (err) {
      console.error('Error switching role:', err);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (email: string, name: string, avatarUrl?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, avatarUrl }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem('valuta_user', JSON.stringify(data.data));
      }
    } catch (err) {
      console.error('Error in loginWithGoogle:', err);
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem('valuta_user', JSON.stringify(data.data));
        return { success: true };
      }
      return { success: false, error: data.error || 'Login gagal' };
    } catch (err: any) {
      console.error('Error in loginWithEmail:', err);
      // Fallback offline session
      const fallbackUser: User = {
        id: Date.now(),
        email,
        name: email.split('@')[0],
        role: 'customer',
        isKycVerified: false,
      };
      setUser(fallbackUser);
      localStorage.setItem('valuta_user', JSON.stringify(fallbackUser));
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (name: string, email: string, password?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem('valuta_user', JSON.stringify(data.data));
        return { success: true };
      }
      return { success: false, error: data.error || 'Pendaftaran gagal' };
    } catch (err: any) {
      console.error('Error in registerWithEmail:', err);
      const fallbackUser: User = {
        id: Date.now(),
        email,
        name,
        role: 'customer',
        isKycVerified: false,
      };
      setUser(fallbackUser);
      localStorage.setItem('valuta_user', JSON.stringify(fallbackUser));
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/auth/me?userId=${user.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem('valuta_user', JSON.stringify(data.data));
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('valuta_user');
    switchRole('customer');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        switchRole,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
