import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Banknote,
  User as UserIcon,
  ShieldCheck,
  Briefcase,
  UserCheck,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, switchRole, loginWithGoogle } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [oauthStep, setOauthStep] = useState<'select' | 'consent'>('select');
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<{ email: string; name: string } | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const googlePresetAccounts = [
    { name: 'Donny Yusmar', email: 'donny.yusmar@ui.ac.id', avatar: 'DY' },
    { name: 'Budi Santoso', email: 'budi.santoso@gmail.com', avatar: 'BS' },
    { name: 'Nasabah Baru Google', email: 'nasabah.baru@gmail.com', avatar: 'NB' },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'supervisor':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Supervisor
          </span>
        );
      case 'teller':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            Teller / Kasir
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
            Customer
          </span>
        );
    }
  };

  const handleStartGoogleOAuth = (account: { email: string; name: string }) => {
    setSelectedGoogleAccount(account);
    setOauthStep('consent');
  };

  const handleConfirmGoogleConsent = async () => {
    if (!selectedGoogleAccount) return;
    await loginWithGoogle(selectedGoogleAccount.email, selectedGoogleAccount.name);
    setShowGoogleModal(false);
    setOauthStep('select');
    setSelectedGoogleAccount(null);
  };

  const handleCustomGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) return;
    handleStartGoogleOAuth({ email: customEmail, name: customName });
  };

  return (
    <>
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-500/20">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight">Valuta Prima</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md uppercase tracking-wider">
                  Gravity v3
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Digital Money Changer & Valas Platform</p>
            </div>
          </div>

          {/* Role Switcher & User Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition cursor-pointer shadow-2xs"
                title="Ganti Peran Pengguna untuk Pengujian"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline text-slate-500">Peran:</span>
                <span className="font-bold text-slate-800 capitalize">{user?.role || 'Customer'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Simulasi Ganti Role (Dev)
                  </div>
                  <button
                    onClick={() => {
                      switchRole('customer');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      user?.role === 'customer' ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      <span>Customer (Nasabah)</span>
                    </div>
                    {user?.role === 'customer' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                  </button>
                  <button
                    onClick={() => {
                      switchRole('teller');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      user?.role === 'teller' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>Teller (Verifikasi KYC)</span>
                    </div>
                    {user?.role === 'teller' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>}
                  </button>
                  <button
                    onClick={() => {
                      switchRole('supervisor');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                      user?.role === 'supervisor' ? 'text-purple-600 font-bold bg-purple-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Supervisor (Otorisasi)</span>
                    </div>
                    {user?.role === 'supervisor' && <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>}
                  </button>
                </div>
              )}
            </div>

            {/* User Profile Card */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs font-semibold text-slate-800">{user?.name || 'Pengguna'}</span>
                  {user?.isKycVerified ? (
                    <span title="KYC Terverifikasi" className="text-emerald-600">
                      <UserCheck className="w-3.5 h-3.5" />
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {user && getRoleBadge(user.role)}
                </div>
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs uppercase shadow-2xs">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>

              {/* Login / Auth Button */}
              <button
                onClick={() => {
                  setOauthStep('select');
                  setShowGoogleModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-2xs cursor-pointer"
                title="Google OAuth / Ganti Akun"
              >
                <span>Akun Google</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Google OAuth 2.0 Verification Dialog */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {oauthStep === 'select' ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Masuk dengan Google</h3>
                      <p className="text-[11px] text-slate-500">Pilih akun untuk melanjutkan ke Valuta Prima</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowGoogleModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Pilih Akun Terdaftar:
                  </span>
                  {googlePresetAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => handleStartGoogleOAuth(acc)}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 group-hover:border-emerald-400">
                          {acc.avatar}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{acc.name}</div>
                          <div className="text-[11px] text-slate-500">{acc.email}</div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-emerald-600 font-semibold">Pilih →</span>
                    </button>
                  ))}

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase tracking-wider">
                      atau gunakan akun Google lain
                    </span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <form onSubmit={handleCustomGoogleLogin} className="space-y-2.5">
                    <div>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Nama Lengkap Google"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="nama@gmail.com"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                    >
                      Lanjutkan dengan Akun Ini
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* Google OAuth Permission & Consent Verification Screen */
              <div className="space-y-4">
                <div className="text-center pb-2 border-b border-slate-100">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Verifikasi Izin Google OAuth 2.0</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Valuta Prima meminta izin untuk mengakses akun Anda:
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {selectedGoogleAccount?.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800">{selectedGoogleAccount?.name}</div>
                    <div className="text-[11px] text-slate-500">{selectedGoogleAccount?.email}</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60">
                  <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider">
                    Izin yang Diberikan:
                  </span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Melihat nama, foto profil, dan alamat email Anda</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Menerbitkan token autentikasi sesi nasabah</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                  ⚠️ <strong>Catatan Kepatuhan:</strong> Setelah login Google, Anda tetap diwajibkan melengkapi
                  Verifikasi KYC (KTP/Paspor) sebelum dapat melakukan penukaran valas.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOauthStep('select')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmGoogleConsent}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                  >
                    Izinkan & Masuk
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
