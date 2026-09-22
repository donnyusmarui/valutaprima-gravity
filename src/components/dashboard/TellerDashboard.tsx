import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RatesTable, RateItem } from '../RatesTable';
import { TellerKycReview } from '../TellerKycReview';
import { InventoryPanel } from '../InventoryPanel';
import { CustomerTransactionHistory } from '../CustomerTransactionHistory';
import {
  ArrowRightLeft,
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Banknote,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

interface TellerDashboardProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

interface KycQueueItem {
  id: number;
  name: string;
  email: string;
  kycStatus: string;
  createdAt: string;
}

interface StatCard {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}

export function TellerDashboard({ activeSection, onNavigate }: TellerDashboardProps) {
  const { user } = useAuth();
  const [rates, setRates] = useState<RateItem[]>([]);
  const [kycQueue, setKycQueue] = useState<KycQueueItem[]>([]);
  const [stats, setStats] = useState({
    txToday: 0,
    totalCashIdr: 0,
    kycPending: 0,
    lowStockCount: 0,
  });
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
    setLoadingStats(true);
    try {
      // Fetch KYC pending queue
      const kycRes = await fetch('/api/kyc/list');
      const kycData = await kycRes.json();
      if (kycData.success && Array.isArray(kycData.data)) {
        const pending = kycData.data.filter((k: KycQueueItem) => k.kycStatus === 'pending');
        setKycQueue(pending.slice(0, 4));
        setStats((prev) => ({ ...prev, kycPending: pending.length }));
      }

      // Fetch inventory
      const invRes = await fetch('/api/inventory');
      const invData = await invRes.json();
      if (invData.success && Array.isArray(invData.data)) {
        const low = invData.data.filter((item: { quantity: number }) => item.quantity < 10);
        let total = 0;
        invData.data.forEach((item: { quantity: number; denominationIdr: number }) => {
          total += item.quantity * item.denominationIdr;
        });
        setStats((prev) => ({ ...prev, totalCashIdr: total, lowStockCount: low.length }));
      }

      // Fetch transactions for today count
      const txRes = await fetch('/api/transactions?limit=100');
      const txData = await txRes.json();
      if (txData.success && Array.isArray(txData.data)) {
        const today = new Date().toDateString();
        const todayTxs = txData.data.filter(
          (t: { createdAt: string }) => new Date(t.createdAt).toDateString() === today
        );
        setStats((prev) => ({ ...prev, txToday: todayTxs.length }));
      }
    } catch (e) {
      console.error('Failed to fetch teller stats', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchRates();
    fetchStats();
  }, []);

  const formatIdr = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const statCards: StatCard[] = [
    {
      label: 'Transaksi Kasir Hari Ini',
      value: loadingStats ? '...' : `${stats.txToday}`,
      sub: 'Semua nasabah',
      icon: <ArrowRightLeft className="w-5 h-5" />,
      color: 'indigo',
    },
    {
      label: 'Total Kas IDR',
      value: loadingStats ? '...' : formatIdr(stats.totalCashIdr),
      sub: 'Seluruh brankas fisik',
      icon: <Banknote className="w-5 h-5" />,
      color: 'blue',
    },
    {
      label: 'KYC Menunggu Review',
      value: loadingStats ? '...' : `${stats.kycPending}`,
      sub: 'Perlu ditindaklanjuti',
      icon: <ShieldCheck className="w-5 h-5" />,
      color: stats.kycPending > 0 ? 'amber' : 'green',
    },
    {
      label: 'Stok Pecahan Menipis',
      value: loadingStats ? '...' : `${stats.lowStockCount} item`,
      sub: 'Perlu penambahan stok',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: stats.lowStockCount > 0 ? 'rose' : 'green',
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    indigo: { bg: 'bg-indigo-50 border-indigo-200', icon: 'bg-indigo-500 text-white', text: 'text-indigo-700' },
    blue: { bg: 'bg-blue-50 border-blue-200', icon: 'bg-blue-500 text-white', text: 'text-blue-700' },
    green: { bg: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-500 text-white', text: 'text-emerald-700' },
    amber: { bg: 'bg-amber-50 border-amber-200', icon: 'bg-amber-500 text-white', text: 'text-amber-700' },
    rose: { bg: 'bg-rose-50 border-rose-200', icon: 'bg-rose-500 text-white', text: 'text-rose-700' },
  };

  // Sub-section routing
  if (activeSection === 'review') return <TellerKycReview />;
  if (activeSection === 'inventory') return <InventoryPanel />;
  if (activeSection === 'history') return <CustomerTransactionHistory onNewBooking={() => {}} />;
  if (activeSection === 'rates') {
    return <RatesTable onOpenTrade={() => {}} />;
  }

  // Default: Dashboard
  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_60%)]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-bold border border-white/30">
              🏦 Loket Kasir Aktif
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Halo, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-white/85 max-w-md">
              Operasional loket kasir siap melayani nasabah. Pantau KYC, stok kas, dan transaksi hari ini.
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => onNavigate('review')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-black text-sm shadow-sm hover:bg-indigo-50 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Buka Antrean KYC
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
            >
              <Banknote className="w-3.5 h-3.5" />
              Kelola Brankas Kas
            </button>
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

      {/* Bottom Grid: KYC Queue + Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* KYC Review Queue */}
        <div className="lg:col-span-1 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Antrean Review KYC
            </h3>
            <button
              onClick={() => onNavigate('review')}
              className="text-[11px] text-indigo-600 font-bold hover:text-indigo-700 cursor-pointer"
            >
              Buka Panel →
            </button>
          </div>
          {loadingStats ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : kycQueue.length === 0 ? (
            <div className="text-center py-8">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Semua KYC sudah diproses</p>
            </div>
          ) : (
            <div className="space-y-2">
              {kycQueue.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-indigo-50 hover:border-indigo-100 transition"
                  onClick={() => onNavigate('review')}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {k.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{k.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{k.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    Pending
                  </span>
                </div>
              ))}
              {stats.kycPending > 4 && (
                <button
                  onClick={() => onNavigate('review')}
                  className="w-full text-[11px] text-indigo-600 font-bold py-2 hover:text-indigo-700 cursor-pointer"
                >
                  +{stats.kycPending - 4} nasabah lainnya →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Live Rates Snapshot */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Kurs Referensi Kasir
            </h3>
            <button
              onClick={() => onNavigate('rates')}
              className="text-[11px] text-indigo-600 font-bold hover:text-indigo-700 cursor-pointer"
            >
              Papan Lengkap →
            </button>
          </div>
          <div className="space-y-2">
            {rates.slice(0, 6).map((r) => (
              <div key={r.currencyCode} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-slate-900 w-10">{r.currencyCode}</span>
                  <span className="text-[11px] text-slate-500">{r.currencyName}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Beli</p>
                    <p className="text-xs font-bold text-slate-800">{r.buyRate?.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Jual</p>
                    <p className="text-xs font-bold text-slate-800">{r.sellRate?.toLocaleString('id-ID')}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            ))}
            {rates.length === 0 && (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staff info */}
      <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 flex items-center gap-3">
        <Users className="w-5 h-5 text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-700">
          <strong>Mode Teller Kasir</strong> — Anda dapat melihat riwayat transaksi semua nasabah, mereview KYC, dan mengelola stok kas brankas. Data nasabah tetap terlindungi sesuai kebijakan privasi.
        </p>
      </div>
    </div>
  );
}
