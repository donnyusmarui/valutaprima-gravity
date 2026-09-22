// AuditLogPanel.tsx — Sprint 3 Langkah 8
// Supervisor/Admin panel: Audit log transaksi + PPATK CTR report export

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Download, Filter, RefreshCw, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface AuditRecord {
  id: number;
  invoiceNo: string;
  referenceNo?: string;
  type: string;
  currencyCode: string;
  amountForeign: number | string;
  lockedRate?: number | string;
  amountIdr: number | string;
  serviceFeeIdr?: number | string;
  status: string;
  amlFlag: boolean;
  reviewNotes?: string;
  createdAt: string;
  authorizedAt?: string;
  customerName?: string;
  customerEmail?: string;
}

interface AuditSummary {
  totalTransactions: number;
  completedTransactions: number;
  amlFlaggedTransactions: number;
  totalVolumeIdr: number;
  reportPeriod: { start: string; end: string };
}

interface AuditLogPanelProps {
  userRole?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: 'Selesai', color: 'text-emerald-700 bg-emerald-50', icon: <CheckCircle size={12} /> },
  pending: { label: 'Pending', color: 'text-amber-700 bg-amber-50', icon: <Clock size={12} /> },
  awaiting_payment: { label: 'Menunggu Bayar', color: 'text-blue-700 bg-blue-50', icon: <Clock size={12} /> },
  authorized: { label: 'Diotorisasi', color: 'text-indigo-700 bg-indigo-50', icon: <CheckCircle size={12} /> },
  cancelled: { label: 'Dibatalkan', color: 'text-red-700 bg-red-50', icon: <XCircle size={12} /> },
  rejected: { label: 'Ditolak', color: 'text-red-700 bg-red-50', icon: <XCircle size={12} /> },
};

export default function AuditLogPanel({ userRole: _userRole }: AuditLogPanelProps) {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [filterAml, setFilterAml] = useState(false);
  const [filterCurrency, setFilterCurrency] = useState('');

  const fmtIdr = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-';

  const fetchAuditLog = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAml) params.set('amlOnly', 'true');
      if (filterCurrency) params.set('currencyCode', filterCurrency);
      params.set('limit', '200');

      const res = await fetch(`${API_BASE}/invoice/audit-log?${params}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
        setSummary(data.summary || null);
        setIsOffline(!!data.isOfflineFallback);
      }
    } catch {
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAuditLog(); }, [filterAml, filterCurrency]);

  // ─── Export PPATK PDF Report ─────────────────────────────────────────────────
  const handleExportPpatkPdf = async () => {
    try {
      const res = await fetch(`${API_BASE}/invoice/ppatk-report`);
      const data = await res.json();
      const flagged: AuditRecord[] = data.data || [];
      const meta = data.meta || {};

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      let y = 15;

      // Header
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 297, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN CTR (CASH TRANSACTION REPORT) — PPATK', 15, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`PT Valuta Prima Gravity | ${meta.licenseNo || 'PPATK-MC-2024-001'} | Dicetak: ${new Date().toLocaleString('id-ID')}`, 15, 22);

      y = 40;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Transaksi CTR Terflag: ${flagged.length} transaksi`, 15, y);
      doc.text(`Ambang Batas: ${meta.threshold || 'Rp 100.000.000'}`, 150, y);
      y += 10;

      // Table header
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 267, 8, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      const cols = [15, 45, 70, 88, 108, 140, 175, 210, 245];
      const headers = ['No. Invoice', 'Tanggal', 'Nasabah', 'Jenis', 'Mata Uang', 'Jumlah', 'Kurs (IDR)', 'Total IDR', 'Status'];
      headers.forEach((h, i) => doc.text(h, cols[i], y + 5.5));
      y += 10;

      // Table rows
      doc.setFont('helvetica', 'normal');
      flagged.forEach((r, idx) => {
        if (y > 185) { doc.addPage(); y = 15; }
        if (idx % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(15, y - 1, 267, 7, 'F');
        }
        doc.setTextColor(0, 0, 0);
        doc.text(r.invoiceNo?.substring(0, 18) || '-', cols[0], y + 4.5);
        doc.text(fmtDate(r.createdAt), cols[1], y + 4.5);
        doc.text((r.customerName || r.customerEmail || '-').substring(0, 14), cols[2], y + 4.5);
        doc.text(r.type === 'BUY' ? 'Beli' : 'Jual', cols[3], y + 4.5);
        doc.text(r.currencyCode || '-', cols[4], y + 4.5);
        doc.text(`${Number(r.amountForeign || 0).toFixed(2)}`, cols[5], y + 4.5);
        doc.text(fmtIdr(Number(r.lockedRate || 0)).replace('Rp\u00a0', 'Rp '), cols[6], y + 4.5);
        doc.text(fmtIdr(Number(r.amountIdr || 0)).replace('Rp\u00a0', 'Rp '), cols[7], y + 4.5);
        doc.text(r.status || '-', cols[8], y + 4.5);
        y += 7;
      });

      if (flagged.length === 0) {
        doc.setTextColor(100, 100, 100);
        doc.text('Tidak ada transaksi CTR yang perlu dilaporkan.', 15, y + 10);
      }

      doc.save(`PPATK-CTR-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      alert('Gagal generate laporan PPATK. Coba lagi.');
    }
  };

  // ─── Export Audit Log CSV ────────────────────────────────────────────────────
  const handleExportCsv = () => {
    const headers = ['ID','Invoice','Tanggal','Nasabah','Email','Jenis','Mata Uang','Jumlah','Kurs','Total IDR','Biaya','Status','AML Flag'];
    const rows = records.map(r => [
      r.id, r.invoiceNo, fmtDate(r.createdAt), r.customerName || '', r.customerEmail || '',
      r.type, r.currencyCode, r.amountForeign, r.lockedRate, r.amountIdr, r.serviceFeeIdr,
      r.status, r.amlFlag ? 'YES' : 'NO',
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currencies = ['', 'USD', 'EUR', 'SGD', 'JPY', 'AUD', 'GBP', 'CNY', 'SAR'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <Shield className="text-indigo-600" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Audit Log & Laporan PPATK</h2>
            <p className="text-sm text-slate-500">Riwayat lengkap transaksi + pelaporan BI/PPATK</p>
          </div>
        </div>
        <button
          onClick={fetchAuditLog}
          disabled={isLoading}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin text-slate-400' : 'text-slate-600'} />
        </button>
      </div>

      {/* Offline badge */}
      {isOffline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle size={14} /> Data tidak tersedia (DB offline) — menampilkan data kosong.
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Transaksi', value: summary.totalTransactions, color: 'indigo' },
            { label: 'Selesai', value: summary.completedTransactions, color: 'emerald' },
            { label: 'AML Terflag', value: summary.amlFlaggedTransactions, color: 'amber' },
            { label: 'Volume Total', value: fmtIdr(summary.totalVolumeIdr), color: 'slate', isText: true },
          ].map(({ label, value, color, isText }) => (
            <div key={label} className="bg-white border rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={`text-xl font-bold text-${color}-700`}>{isText ? value : value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Export */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={filterCurrency}
            onChange={e => setFilterCurrency(e.target.value)}
            className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {currencies.map(c => <option key={c} value={c}>{c || 'Semua Mata Uang'}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filterAml}
            onChange={e => setFilterAml(e.target.checked)}
            className="rounded accent-amber-500"
          />
          <span className="flex items-center gap-1 text-amber-700 font-medium">
            <AlertTriangle size={12} /> Hanya AML Flag
          </span>
        </label>
        <div className="flex-1" />
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Download size={14} /> Export CSV
        </button>
        <button
          onClick={handleExportPpatkPdf}
          className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <FileText size={14} /> Export PPATK PDF
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {['No. Invoice', 'Tanggal', 'Nasabah', 'Jenis', 'Mata Uang', 'Total IDR', 'Status', 'AML'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                  Memuat audit log...
                </td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                  Belum ada data transaksi
                </td></tr>
              ) : (
                records.map(r => {
                  const sc = statusConfig[r.status] || { label: r.status, color: 'text-slate-700 bg-slate-100', icon: null };
                  return (
                    <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${r.amlFlag ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.invoiceNo || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{fmtDate(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 truncate max-w-[120px]">{r.customerName || '-'}</div>
                        <div className="text-xs text-slate-400 truncate max-w-[120px]">{r.customerEmail || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.type === 'BUY' ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50'}`}>
                          {r.type === 'BUY' ? 'Beli' : 'Jual'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{r.currencyCode}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{fmtIdr(Number(r.amountIdr || 0))}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                          {sc.icon} {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.amlFlag ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-xs">
                            <AlertTriangle size={12} /> CTR
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
