import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RatesTable, RateItem } from '../RatesTable';
import { KycCustomerCard } from '../KycCustomerCard';
import { TransactionModal } from '../TransactionModal';
import { CustomerTransactionHistory } from '../CustomerTransactionHistory';
import {
  ArrowRightLeft,
  ShieldCheck,
  BadgeCheck,
  Clock,
  Coins,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Wallet,
} from 'lucide-react';

interface CustomerDashboardProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

interface PendingTx {
  id: number;
  invoiceNo: string;
  currencyCode: string;
  amountForeign: number;
  amountIdr: number;
  status: string;
  type: string;
  createdAt: string;
}

interface StatCard {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}

export function CustomerDashboard({ activeSection, onNavigate }: CustomerDashboardProps) {
  const { user } = useAuth();
  const [rates, setRates] = useState<RateItem[]>([]);
  const [pendingTxs, setPendingTxs] = useState<PendingTx[]>([]);
  const [stats, setStats] = useState({
    txThisMonth: 0,
    totalVolumeIdr: 0,
    lastCurrency: '-',
  });
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [tradeCurrency, setTradeCurrency] = useState('USD');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchRates = async () => {
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) setRates(data.data);
    } catch (e) {
      console.error('Failed to fetch rates', e);
    }
  };

  const fetchStats = async () => {
    if (!user?.id) return;
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/transactions?userId=${user.id}&limit=100`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const txs: PendingTx[] = data.data;
        const now = new Date();
        const thisMonth = txs.filter((t) => {
          const d = new Date(t.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const pending = txs.filter((t) =>
          ['pending', 'waiting_payment', 'waiting_verification'].includes(t.status.toLowerCase())
        );
        const totalIdr = txs.reduce((sum, t) => sum + (t.amountIdr || 0), 0);
        const lastCurr = txs.length > 0 ? txs[0].currencyCode : '-';
        setPendingTxs(pending.slice(0, 5));
        setStats({
          txThisMonth: thisMonth.length,
          totalVolumeIdr: totalIdr,
          lastCurrency: lastCurr,
        });
      }
    } catch (e) {
      console.error('Failed to fetch stats', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchRates();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleOpenTrade = (curr = 'USD', type: 'BUY' | 'SELL' = 'BUY') => {
    setTradeCurrency(curr);
    setTradeType(type);
    setIsTradeOpen(true);
  };

  const formatIdr = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const statCards: StatCard[] = [
    {
      label: 'Transaksi Bulan Ini',
      value: loadingStats ? '...' : `${stats.txThisMonth}`,
      sub: 'Semua jenis transaksi',
      icon: <ArrowRightLeft className="w-5 h-5" />,
      color: 'orange',
    },
    {
      label: 'Total Volume Tukar',
      value: loadingStats ? '...' : formatIdr(stats.totalVolumeIdr),
      sub: 'Seluruh riwayat',
      icon: <Wallet className="w-5 h-5" />,
      color: 'blue',
    },
    {
      label: 'Status KYC Identitas',
      value: user?.isKycVerified ? 'Terverifikasi ✓' : 'Belum Verifikasi',
      sub: user?.isKycVerified ? 'Akun aktif penuh' : 'Lengkapi KTP/Paspor',
      icon: <ShieldCheck className="w-5 h-5" />,
      color: user?.isKycVerified ? 'green' : 'amber',
    },
    {
      label: 'Mata Uang Terakhir',
      value: loadingStats ? '...' : stats.lastCurrency,
      sub: 'Transaksi terbaru Anda',
      icon: <Coins className="w-5 h-5" />,
      color: 'purple',
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    orange: { bg: 'bg-orange-50 border-orange-200', icon: 'bg-orange-500 text-white', text: 'text-orange-600' },
    blue: { bg: 'bg-blue-50 border-blue-200', icon: 'bg-blue-500 text-white', text: 'text-blue-600' },
    green: { bg: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-500 text-white', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50 border-amber-200', icon: 'bg-amber-500 text-white', text: 'text-amber-600' },
    purple: { bg: 'bg-purple-50 border-purple-200', icon: 'bg-purple-500 text-white', text: 'text-purple-600' },
  };

  const popularCurrencies = ['USD', 'EUR', 'SGD', 'JPY', 'AUD', 'GBP'];
  const popularRates = rates.filter((r) => popularCurrencies.includes(r.currencyCode));

  // Render active sections other than dashboard
  if (activeSection === 'rates') {
    return (
      <div className="space-y-6">
        <RatesTable onOpenTrade={handleOpenTrade} />
        <TransactionModal
          isOpen={isTradeOpen}
          onClose={() => setIsTradeOpen(false)}
          rates={rates}
          defaultCurrency={tradeCurrency}
          defaultType={tradeType}
          onTransactionSuccess={() => { fetchRates(); fetchStats(); onNavigate('history'); }}
          onNavigateToKyc={() => onNavigate('kyc')}
        />
      </div>
    );
  }

  if (activeSection === 'history') {
    return (
      <div className="space-y-6">
        <CustomerTransactionHistory onNewBooking={() => handleOpenTrade('USD', 'BUY')} />
        <TransactionModal
          isOpen={isTradeOpen}
          onClose={() => setIsTradeOpen(false)}
          rates={rates}
          defaultCurrency={tradeCurrency}
          defaultType={tradeType}
          onTransactionSuccess={() => { fetchRates(); fetchStats(); onNavigate('history'); }}
          onNavigateToKyc={() => onNavigate('kyc')}
        />
      </div>
    );
  }

  if (activeSection === 'kyc') {
    return <KycCustomerCard />;
  }

  if (activeSection === 'transaction') {
    return (
      <div>
        <div className="rounded-2xl bg-orange-50 border border-orange-200 p-6 text-center space-y-3">
          <ArrowRightLeft className="w-10 h-10 text-orange-500 mx-auto" />
          <h2 className="font-black text-lg text-slate-900">Mulai Transaksi Valas</h2>
          <p className="text-sm text-slate-600">Pilih mata uang dan nominal yang ingin Anda tukarkan.</p>
          <button
            onClick={() => handleOpenTrade('USD', 'BUY')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Buka Kalkulator Valas
          </button>
        </div>
        <TransactionModal
          isOpen={isTradeOpen}
          onClose={() => setIsTradeOpen(false)}
          rates={rates}
          defaultCurrency={tradeCurrency}
          defaultType={tradeType}
          onTransactionSuccess={() => { fetchRates(); fetchStats(); onNavigate('history'); }}
          onNavigateToKyc={() => onNavigate('kyc')}
        />
      </div>
    );
  }

  // Default: Dashboard home
  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_60%)]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {user?.isKycVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-bold border border-white/30">
                  <BadgeCheck className="w-3 h-3" /> KYC Terverifikasi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-800/40 text-amber-200 text-[11px] font-bold border border-amber-400/30">
                  <AlertTriangle className="w-3 h-3" /> KYC Belum Lengkap
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Halo, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-white/85 max-w-md">
              Siap transaksi valas hari ini? Kurs terkini tersedia untuk USD, EUR, SGD, dan lebih banyak mata uang lainnya.
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => handleOpenTrade('USD', 'BUY')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-orange-600 font-black text-sm shadow-sm hover:bg-orange-50 transition cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Mulai Transaksi Baru
            </button>
            {!user?.isKycVerified && (
              <button
                onClick={() => onNavigate('kyc')}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-800/40 hover:bg-amber-800/60 text-amber-100 font-bold text-xs border border-amber-400/30 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Lengkapi KYC Sekarang
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const c = colorMap[card.color];
          return (
            <div key={card.label} className={`rounded-2xl border p-4 ${c.bg}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.icon}`}>
                {card.icon}
              </div>
              <p className={`text-lg font-black ${c.text}`}>{card.value}</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">{card.label}</p>
              {card.sub && <p className="text-[11px] text-slate-500 mt-0.5">{card.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Bottom Grid: Pending + Popular Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending Transactions Widget */}
        <div className="lg:col-span-1 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Transaksi Tertunda
            </h3>
            <button
              onClick={() => onNavigate('history')}
              className="text-[11px] text-orange-600 font-bold hover:text-orange-700 cursor-pointer"
            >
              Lihat Semua →
            </button>
          </div>
          {loadingStats ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : pendingTxs.length === 0 ? (
            <div className="text-center py-8">
              <BadgeCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Tidak ada transaksi tertunda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{tx.invoiceNo}</p>
                    <p className="text-[11px] text-slate-500">
                      {tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.currencyCode} · {tx.amountForeign.toLocaleString()}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                    Tertunda
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Rates Grid */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Kurs Valas Populer
            </h3>
            <button
              onClick={() => onNavigate('rates')}
              className="text-[11px] text-orange-600 font-bold hover:text-orange-700 cursor-pointer"
            >
              Papan Lengkap →
            </button>
          </div>
          {popularRates.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {popularCurrencies.map((c) => (
                <div key={c} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {popularRates.map((r) => (
                <div
                  key={r.currencyCode}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1 hover:border-orange-200 hover:bg-orange-50 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-slate-900">{r.currencyCode}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 transition" />
                  </div>
                  <p className="text-[11px] text-slate-500">{r.currencyName}</p>
                  <div className="pt-1 border-t border-slate-100 space-y-0.5">
                    <p className="text-[11px] text-slate-600">
                      Beli: <span className="font-bold text-slate-900">{r.buyRate?.toLocaleString('id-ID')}</span>
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Jual: <span className="font-bold text-slate-900">{r.sellRate?.toLocaleString('id-ID')}</span>
                    </p>
                  </div>
                  <div className="flex gap-1 pt-1">
                    <button
                      onClick={() => handleOpenTrade(r.currencyCode, 'BUY')}
                      className="flex-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition cursor-pointer"
                    >
                      Beli
                    </button>
                    <button
                      onClick={() => handleOpenTrade(r.currencyCode, 'SELL')}
                      className="flex-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition cursor-pointer"
                    >
                      Jual
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTradeOpen}
        onClose={() => setIsTradeOpen(false)}
        rates={rates}
        defaultCurrency={tradeCurrency}
        defaultType={tradeType}
        onTransactionSuccess={() => {
          fetchRates();
          fetchStats();
          onNavigate('history');
        }}
        onNavigateToKyc={() => onNavigate('kyc')}
      />
    </div>
  );
}
