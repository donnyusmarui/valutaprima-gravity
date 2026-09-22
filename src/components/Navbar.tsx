import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import {
  Banknote,
  User as UserIcon,
  ShieldCheck,
  Briefcase,
  UserCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, switchRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition shadow-sm shadow-orange-600/25 cursor-pointer"
                title="Masuk atau Daftar Akun"
              >
                <span>Masuk / Daftar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern AuthModal (Sesuai Referensi Gambar) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="login"
      />
    </>
  );
};
