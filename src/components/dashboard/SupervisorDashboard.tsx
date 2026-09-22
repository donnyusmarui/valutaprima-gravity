import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RatesTable, RateItem } from '../RatesTable';
import { SupervisorAuthorization } from '../SupervisorAuthorization';
import { InventoryPanel } from '../InventoryPanel';
import { CustomerTransactionHistory } from '../CustomerTransactionHistory';
import AuditLogPanel from '../AuditLogPanel';
import { TellerKycReview } from '../TellerKycReview';
import {
  ShieldAlert,
  ClipboardList,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Lock,
  FileText,
} from 'lucide-react';

interface SupervisorDashboardProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

interface AmlTx {
  id: number;
  invoiceNo: string;
  currencyCode: string;
  amountIdr: number;
  status: string;
  createdAt: string;
}

interface StatCard {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}

export function SupervisorDashboard({ activeSection, onNavigate }: SupervisorDashboardProps) {
  const { user } = useAuth();
  const [rates, setRates] = useState<RateItem[]>([]);
  const [amlTxs, setAmlTxs] = useState<AmlTx[]>([]);
  const [stats, setStats] = useState({
    pinQueue: 0,
    amlFlagged: 0,
    totalVolumeToday: 0,
    auditCount: 0,
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
      // Fetch all transactions to compute volume + AML
      const txRes = await fetch('/api/transactions?limit=500');
      const txData = await txRes.json();
      if (txData.success && Array.isArray(txData.data)) {
        const txs = txData.data;
        const today = new Date().toDateString();
        const todayTxs = txs.filter(
          (t: { createdAt: string }) => new Date(t.createdAt).toDateString() === today
        );
        const volumeToday = todayTxs.reduce((s: number, t: { amountIdr: number }) => s + (t.amountIdr || 0), 0);

        const aml = txs.filter(
          (t: { amlFlag: boolean; status: string }) =>
            t.amlFlag && ['pending', 'waiting_payment', 'waiting_verification'].includes((t.status || '').toLowerCase())
        );
        const flagged = txs.filter((t: { amlFlag: boolean }) => t.amlFlag);

        setAmlTxs(aml.slice(0, 5));
        setStats((prev) => ({
          ...prev,
          pinQueue: aml.length,
          amlFlagged: flagged.length,
          totalVolumeToday: volumeToday,
        }));
      }

      // Audit count
      const auditRes = await fetch('/api/invoice/audit-log?limit=100');
      const auditData = await auditRes.json();
      if (auditData.success && Array.isArray(auditData.data)) {
        setStats((prev) => ({ ...prev, auditCount: auditData.data.length }));
      }
    } catch (e) {
      console.error('Failed to fetch supervisor stats', e);
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
      label: 'Antrean Otorisasi PIN',
      value: loadingStats ? '...' : `${stats.pinQueue}`,
      sub: 'Menunggu persetujuan',
      icon: <Lock className="w-5 h-5" />,
      color: stats.pinQueue > 0 ? 'rose' : 'green',
    },
    {
      label: 'Transaksi Terflag AML',
      value: loadingStats ? '...' : `${stats.amlFlagged}`,
      sub: '>= Rp 100 juta (PPATK)',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: stats.amlFlagged > 0 ? 'amber' : 'green',
    },
    {
      label: 'Total Volume Harian',
      value: loadingStats ? '...' : formatIdr(stats.totalVolumeToday),
      sub: 'Semua transaksi hari ini',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'purple',
    },
    {
      label: 'Entri Audit Trail',
      value: loadingStats ? '...' : `${stats.auditCount}`,
      sub: 'Log kepatuhan tercatat',
      icon: <FileText className="w-5 h-5" />,
      color: 'blue',
    },
  ];

  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    rose: { bg: 'bg-rose-50 border-rose-200', icon: 'bg-rose-500 text-white', text: 'text-rose-700' },
    amber: { bg: 'bg-amber-50 border-amber-200', icon: 'bg-amber-500 text-white', text: 'text-amber-700' },
    purple: { bg: 'bg-purple-50 border-purple-200', icon: 'bg-purple-500 text-white', text: 'text-purple-700' },
    blue: { bg: 'bg-blue-50 border-blue-200', icon: 'bg-blue-500 text-white', text: 'text-blue-700' },
    green: { bg: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-500 text-white', text: 'text-emerald-700' },
  };

  // Sub-section routing
  if (activeSection === 'supervisor') return <SupervisorAuthorization />;
  if (activeSection === 'audit') return <AuditLogPanel userRole="supervisor" />;
  if (activeSection === 'inventory') return <InventoryPanel />;
  if (activeSection === 'review') return <TellerKycReview />;
  if (activeSection === 'history') return <CustomerTransactionHistory onNewBooking={() => {}} />;
  if (activeSection === 'rates') return <RatesTable onOpenTrade={() => {}} />;

  // Default: Dashboard home
  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-800 via-purple-700 to-violet-700 text-white p-6 sm:p-7 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_60%)]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-bold border border-white/30">
              🔐 Supervisor — Pengawas Kepatuhan
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Halo, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-white/85 max-w-md">
              Pengawasan kepatuhan & otorisasi transaksi. Tinjau antrean PIN, laporan AML, dan audit trail harian.
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => onNavigate('supervisor')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-purple-700 font-black text-sm shadow-sm hover:bg-purple-50 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              Buka Antrean PIN
            </button>
            <button
              onClick={() => onNavigate('audit')}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Audit Log & PPATK
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

      {/* Bottom Grid: AML Queue + Spread Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* AML Queue Widget */}
        <div className="lg:col-span-1 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Antrean AML / PIN
            </h3>
            <button
              onClick={() => onNavigate('supervisor')}
              className="text-[11px] text-purple-600 font-bold hover:text-purple-700 cursor-pointer"
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
          ) : amlTxs.length === 0 ? (
            <div className="text-center py-8">
              <ShieldAlert className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Tidak ada antrean otorisasi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {amlTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100 cursor-pointer hover:bg-rose-100 transition"
                  onClick={() => onNavigate('supervisor')}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{tx.invoiceNo}</p>
                    <p className="text-[11px] text-slate-600">
                      {tx.currencyCode} · {formatIdr(tx.amountIdr)}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-700">
                    🔐 PIN
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spread & Rates Monitor */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Monitor Spread Kurs & Likuiditas
            </h3>
            <button
              onClick={() => onNavigate('rates')}
              className="text-[11px] text-purple-600 font-bold hover:text-purple-700 cursor-pointer"
            >
              Papan Lengkap →
            </button>
          </div>
          <div className="space-y-2">
            {rates.slice(0, 6).map((r) => {
              const spread = r.sellRate && r.buyRate ? r.sellRate - r.buyRate : 0;
              const spreadPct = r.buyRate ? ((spread / r.buyRate) * 100).toFixed(2) : '0.00';
              return (
                <div key={r.currencyCode} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-slate-900 w-10">{r.currencyCode}</span>
                    <span className="text-[11px] text-slate-500">{r.currencyName}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Beli / Jual</p>
                      <p className="text-xs font-bold text-slate-800">
                        {r.buyRate?.toLocaleString('id-ID')} / {r.sellRate?.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Spread</p>
                      <p className={`text-xs font-bold ${parseFloat(spreadPct) > 2 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {spreadPct}%
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              );
            })}
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

      {/* Compliance Notice */}
      <div className="rounded-2xl bg-purple-50 border border-purple-100 p-4 flex items-start gap-3">
        <ClipboardList className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-purple-800">Mode Supervisor — Pengawasan Penuh</p>
          <p className="text-[11px] text-purple-600 mt-0.5">
            Anda memiliki akses penuh ke semua data transaksi, log audit, dan otorisasi PIN. Semua tindakan supervisor dicatat dalam audit trail kepatuhan BI/PPATK.
          </p>
        </div>
      </div>
    </div>
  );
}
