import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TellerKycReview } from '../TellerKycReview';
import { InventoryPanel } from '../InventoryPanel';
import { CurrencyManagementPanel } from '../CurrencyManagementPanel';
import {
  ArrowRightLeft,
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Banknote,
  TrendingUp,
  DollarSign,
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

interface RateItem {
  currencyCode: string;
  currencyName: string;
  buyRate: number;
  sellRate: number;
  stockAmount: number;
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
      const kycRes = await fetch('/api/kyc/pending');
      const kycData = await kycRes.json();
      if (kycData.success && Array.isArray(kycData.data)) {
        setKycQueue(kycData.data.slice(0, 4));
        setStats((prev) => ({ ...prev, kycPending: kycData.data.length }));
      }

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
      label: 'Transaksi Hari Ini',
      value: loadingStats ? '...' : `${stats.txToday}`,
      sub: 'Semua nasabah',
      icon: <ArrowRightLeft className="w-5 h-5" />,
      color: 'indigo',
    },
    {
      label: 'Total Kas Brankas',
      value: loadingStats ? '...' : formatIdr(stats.totalCashIdr),
      sub: 'Seluruh denominasi',
      icon: <Banknote className="w-5 h-5" />,
      color: 'blue',
    },
    {
      label: 'KYC Menunggu Review',
      value: loadingStats ? '...' : `${stats.kycPending}`,
      sub: stats.kycPending > 0 ? 'Perlu ditindaklanjuti' : 'Semua nasabah sudah diproses',
      icon: <ShieldCheck className="w-5 h-5" />,
      color: stats.kycPending > 0 ? 'amber' : 'green',
    },
    {
      label: 'Stok Menipis',
      value: loadingStats ? '...' : `${stats.lowStockCount} item`,
      sub: 'Pecahan perlu penambahan',
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

  // ── Sub-section routing (sidebar navigation) ──────────────────────────────
  if (activeSection === 'review') return <TellerKycReview />;
  if (activeSection === 'inventory') return <InventoryPanel />;
  if (activeSection === 'currency') return <CurrencyManagementPanel />;
  if (activeSection === 'rates') {
    // Teller rates: read-only view (no transaction buttons)
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-black text-lg text-slate-900">Papan Kurs Referensi</h2>
          <p className="text-xs text-slate-500">Lihat kurs aktif. Untuk ubah kurs, buka menu Kelola Mata Uang.</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-600">MATA UANG</th>
                <th className="px-4 py-3 text-right font-bold text-slate-600">KURS BELI</th>
                <th className="px-4 py-3 text-right font-bold text-slate-600">KURS JUAL</th>
                <th className="px-4 py-3 text-right font-bold text-slate-600">SPREAD</th>
                <th className="px-4 py-3 text-right font-bold text-slate-600">STOK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rates.map((r) => (
                <tr key={r.currencyCode} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-black text-slate-900">{r.currencyCode}</p>
                    <p className="text-[10px] text-slate-500">{r.currencyName}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">{r.buyRate?.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">{r.sellRate?.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{(r.sellRate - r.buyRate).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${r.stockAmount < 1000 ? 'text-red-500' : 'text-slate-700'}`}>
                      {r.stockAmount?.toLocaleString('id-ID')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── DEFAULT: Teller Dashboard Home ────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Hero Card — Indigo, Teller-specific */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_60%)]" />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-bold border border-white/30">
              🏦 Loket Kasir — Operasional Aktif
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Halo, {user?.name?.split(' ')[0]} — Teller Kasir
            </h1>
            <p className="text-sm text-white/85 max-w-md">
              Panel operasional teller: kelola kurs mata uang, review KYC nasabah, dan pantau stok brankas kas fisik.
            </p>
            {/* Teller quick capability list */}
            <div className="flex flex-wrap gap-2 pt-1">
              {['Review & Approve KYC', 'Tambah / Edit Mata Uang', 'Kelola Stok Brankas', 'Pantau Transaksi Nasabah'].map((cap) => (
                <span key={cap} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 border border-white/25">
                  ✓ {cap}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => onNavigate('review')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-black text-sm shadow-sm hover:bg-indigo-50 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Review Antrean KYC
              {stats.kycPending > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[10px] font-extrabold">
                  {stats.kycPending}
                </span>
              )}
            </button>
            <button
              onClick={() => onNavigate('currency')}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Kelola Mata Uang & Kurs
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 font-bold text-xs border border-white/15 transition cursor-pointer"
            >
              <Banknote className="w-3.5 h-3.5" />
              Brankas Kas Fisik
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

      {/* Bottom Grid: KYC Queue + Rates Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* KYC Pending Queue */}
        <div className="lg:col-span-1 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Antrean KYC Nasabah
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
              <p className="text-xs text-slate-500 font-semibold">Semua nasabah sudah diverifikasi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {kycQueue.map((k) => (
                <button
                  key={k.id}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-indigo-50 hover:border-indigo-100 transition text-left"
                  onClick={() => onNavigate('review')}
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {k.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{k.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{k.email}</p>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                    Pending
                  </span>
                </button>
              ))}
              {stats.kycPending > 4 && (
                <button
                  onClick={() => onNavigate('review')}
                  className="w-full text-[11px] text-indigo-600 font-bold py-2 hover:text-indigo-700 cursor-pointer text-center"
                >
                  +{stats.kycPending - 4} nasabah lainnya menunggu →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Live Rates — Teller view with edit shortcut */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Kurs Aktif — Referensi Kasir
            </h3>
            <button
              onClick={() => onNavigate('currency')}
              className="text-[11px] text-indigo-600 font-bold hover:text-indigo-700 cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-lg"
            >
              ✏️ Edit Kurs →
            </button>
          </div>
          <div className="space-y-1.5">
            {rates.slice(0, 7).map((r) => (
              <div key={r.currencyCode} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition group">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-slate-900 w-10">{r.currencyCode}</span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">{r.currencyName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Beli / Jual</p>
                    <p className="text-xs font-bold text-slate-800">
                      {r.buyRate?.toLocaleString('id-ID')} / {r.sellRate?.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('currency')}
                    className="opacity-0 group-hover:opacity-100 transition w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center cursor-pointer"
                    title="Edit kurs"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
                  </button>
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

      {/* Staff Info Banner */}
      <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 flex items-start gap-3">
        <Users className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-indigo-800">Akses Teller Kasir</p>
          <p className="text-[11px] text-indigo-600 mt-0.5">
            Anda dapat melihat dan memverifikasi KYC semua nasabah, mengelola kurs mata uang (tambah/edit/hapus), serta memantau stok kas brankas fisik. Transaksi dengan nilai ≥ Rp 100 juta memerlukan otorisasi PIN Supervisor.
          </p>
        </div>
      </div>
    </div>
  );
}
