import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { RatesTable, RateItem } from './components/RatesTable';
import { KycCustomerCard } from './components/KycCustomerCard';
import { TellerKycReview } from './components/TellerKycReview';
import { TransactionModal } from './components/TransactionModal';
import { SupervisorAuthorization } from './components/SupervisorAuthorization';
import { InventoryPanel } from './components/InventoryPanel';
import { CustomerTransactionHistory } from './components/CustomerTransactionHistory';
import PaymentModal from './components/PaymentModal';
import AuditLogPanel from './components/AuditLogPanel';
import {
  TrendingUp,
  ShieldCheck,
  FileCheck,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Receipt,
  Building2,
  ShieldAlert,
  ArrowRightLeft,
  ClipboardList,
} from 'lucide-react';

function DashboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'rates' | 'history' | 'kyc' | 'review' | 'supervisor' | 'inventory' | 'audit'
  >('rates');

  // Trade Modal State
  const [isTradeOpen, setIsTradeOpen] = useState<boolean>(false);
  const [tradeCurrency, setTradeCurrency] = useState<string>('USD');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [rates, setRates] = useState<RateItem[]>([]);

  // Payment Modal State (Sprint 3)
  const [paymentTransaction, setPaymentTransaction] = useState<{
    id: number;
    invoiceNo: string;
    currencyCode: string;
    amount: number;
    rate: number;
    totalAmountIdr: number;
    serviceFee: number;
    transactionType: 'buy' | 'sell';
    amlFlag?: boolean;
    status: string;
  } | null>(null);

  const isStaff = user?.role === 'teller' || user?.role === 'supervisor';

  // Fetch rates for shared use
  const fetchRates = async () => {
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRates(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch rates in App:', err);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleOpenTrade = (curr = 'USD', type: 'BUY' | 'SELL' = 'BUY') => {
    setTradeCurrency(curr);
    setTradeType(type);
    setIsTradeOpen(true);
  };

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

        {/* Sprint 2 Banner & Execution Highlight */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-7 shadow-sm border border-emerald-800/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Sprint 2 Aktif
                </span>
                <span className="text-xs text-emerald-200">
                  Kalkulator Kurs Terkunci + Stok Pecahan Kas + Otorisasi Supervisor PIN (AML/CTR)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Digital Foreign Exchange Money Changer & Kas Brankas
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Platform penukaran valuta asing berizin resmi Bank Indonesia. Dilengkapi kalkulasi kurs real-time,
                alokasi pecahan lembar fisik, pengawasan transaksi tunai &gt;= Rp 100 Juta (PPATK), serta otorisasi PIN berjenjang.
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => handleOpenTrade('USD', 'BUY')}
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Mulai Transaksi Valas</span>
              </button>

              <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 border border-white/15 text-[11px] text-emerald-200 flex items-center justify-center gap-1.5">
                <span>PIN Supervisor Demo:</span>
                <code className="font-bold text-amber-300 bg-black/30 px-1.5 py-0.5 rounded">123456</code>
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
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Riwayat Transaksi</span>
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

          {/* Supervisor / Teller Specific Tabs */}
          <button
            onClick={() => setActiveTab('supervisor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'supervisor'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Otorisasi Supervisor</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold">
              PIN & AML
            </span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Brankas Kas Fisik</span>
          </button>

          {isStaff && (
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
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold">
                Teller
              </span>
            </button>
          )}

          {/* Sprint 3: Audit Log Tab — visible to supervisor */}
          {user?.role === 'supervisor' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Audit Log & PPATK</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold">
                BI/PPATK
              </span>
            </button>
          )}
        </div>

        {/* Tab Content Panels */}
        <div className="space-y-6">
          {activeTab === 'rates' && (
            <div className="space-y-6">
              <RatesTable onOpenTrade={handleOpenTrade} />
              <CustomerTransactionHistory onNewBooking={() => handleOpenTrade('USD', 'BUY')} />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <CustomerTransactionHistory onNewBooking={() => handleOpenTrade('USD', 'BUY')} />
              <RatesTable onOpenTrade={handleOpenTrade} />
            </div>
          )}

          {activeTab === 'supervisor' && (
            <div className="space-y-6">
              <SupervisorAuthorization />
              <InventoryPanel />
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <InventoryPanel />
              <RatesTable onOpenTrade={handleOpenTrade} />
            </div>
          )}

          {activeTab === 'kyc' && (
            <div className="space-y-6">
              <KycCustomerCard />
              <RatesTable onOpenTrade={handleOpenTrade} />
            </div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-6">
              <TellerKycReview />
              <RatesTable onOpenTrade={handleOpenTrade} />
            </div>
          )}

          {/* Sprint 3: Audit Log Panel */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <AuditLogPanel userRole={user?.role || 'supervisor'} />
            </div>
          )}
        </div>
      </main>

      {/* Global Interactive Transaction Modal */}
      <TransactionModal
        isOpen={isTradeOpen}
        onClose={() => setIsTradeOpen(false)}
        rates={rates}
        defaultCurrency={tradeCurrency}
        defaultType={tradeType}
        onTransactionSuccess={() => {
          fetchRates();
          setActiveTab('history');
        }}
        onNavigateToKyc={() => setActiveTab('kyc')}
      />

      {/* Sprint 3: Payment Modal — mounted globally, triggered after transaction authorized */}
      {paymentTransaction && (
        <PaymentModal
          transaction={paymentTransaction}
          customerName={user?.name || 'Nasabah'}
          customerEmail={user?.email || ''}
          onClose={() => setPaymentTransaction(null)}
          onPaymentComplete={() => {
            setPaymentTransaction(null);
            setActiveTab('history');
            fetchRates();
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Valuta Prima Gravity &copy; 2026 — Digital Money Changer Platform.</span>
          <span className="font-mono text-[11px] text-slate-400">
            Engine: V7LA Master Engine v3.0 | Neon Cloud DB Connected | Sprint 3 Active
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
