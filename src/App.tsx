import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { RatesTable } from './components/RatesTable';
import { KycCustomerCard } from './components/KycCustomerCard';
import { TellerKycReview } from './components/TellerKycReview';
import {
  TrendingUp,
  ShieldCheck,
  FileCheck,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

function DashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'rates' | 'kyc' | 'review'>('rates');

  const isStaff = user?.role === 'teller' || user?.role === 'supervisor';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KYC Verification Required Banner for Unverified Customers */}
        {user?.role === 'customer' && !user?.isKycVerified && (
          <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Verifikasi KYC Diperlukan untuk Akun Anda ({user.name})
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                  Anda telah masuk via Akun Google. Namun sesuai Peraturan Bank Indonesia (PBI) mengenai Penyelenggaraan
                  KUPVA Bukan Bank & UU Anti-Pencucian Uang (APU-PPT), Anda <strong>wajib melengkapi verifikasi identitas (KTP/Paspor)</strong> sebelum dapat melakukan penukaran valuta asing.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('kyc')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer"
            >
              <span>Verifikasi Identitas Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Sprint 1 Banner & Guide */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 sm:p-7 shadow-sm border border-emerald-900/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Sprint 1 Aktif
                </span>
                <span className="text-xs text-emerald-200">Auth OAuth + Kurs DB + Verifikasi KYC</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Money Changer Digital Valuta Prima
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Platform penukaran valuta asing berizin resmi. Alur verifikasi berjenjang dari registrasi nasabah,
                screening kepatuhan AML, hingga papan kurs real-time tersinkronisasi database Neon.
              </p>
            </div>

            {/* Quick Flow Hint */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 text-xs space-y-1.5 min-w-[260px]">
              <span className="font-bold text-amber-300 text-[11px] uppercase tracking-wider block">
                Alur Verifikasi E2E:
              </span>
              <div className="flex items-center gap-1.5 text-white/90 text-[11px]">
                <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Unggah KTP (Customer)</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/90 text-[11px]">
                <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Ganti Role & Review (Teller)</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/90 text-[11px]">
                <span className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Customer Terverifikasi!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('rates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'rates'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Papan Kurs Real-Time</span>
          </button>

          <button
            onClick={() => setActiveTab('kyc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'kyc'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Status KYC Saya</span>
            {user?.isKycVerified ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'review'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Review KYC Nasabah</span>
            {isStaff && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold">
                Teller
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="space-y-6">
          {activeTab === 'rates' && (
            <div className="space-y-6">
              <RatesTable />
              <KycCustomerCard />
            </div>
          )}

          {activeTab === 'kyc' && (
            <div className="space-y-6">
              <KycCustomerCard />
              <RatesTable />
            </div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-6">
              <TellerKycReview />
              <RatesTable />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Valuta Prima Gravity &copy; 2026 — Digital Money Changer Platform.</span>
          <span className="font-mono text-[11px] text-slate-400">
            Engine: V7LA Master Engine v3.0 | Neon Cloud DB Connected
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
