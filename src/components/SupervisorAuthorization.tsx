import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Lock,
  KeyRound,
  FileCheck2,
  RefreshCw,
  Search,
} from 'lucide-react';

interface DenominationItem {
  denominationValue: number;
  quantity: number;
}

interface TransactionItem {
  id: number;
  referenceNo: string;
  userId: number;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  type: 'BUY' | 'SELL';
  currencyCode: string;
  amountForeign: number;
  lockedRate: number;
  amountIdr: number;
  serviceFeeIdr: number;
  denominations: DenominationItem[];
  amlFlag: boolean;
  status: string;
  authorizedBy?: string;
  authorizedAt?: string;
  reviewNotes?: string;
  invoiceNo?: string;
  createdAt: string;
}

export const SupervisorAuthorization: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending_supervisor');
  const [search, setSearch] = useState<string>('');

  // PIN Authorization Modal State
  const [selectedTrx, setSelectedTrx] = useState<TransactionItem | null>(null);
  const [pin, setPin] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submittingAuth, setSubmittingAuth] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Reject Modal State
  const [rejectTrx, setRejectTrx] = useState<TransactionItem | null>(null);
  const [rejectNotes, setRejectNotes] = useState<string>('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/transactions?status=${statusFilter}` : '/api/transactions';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTransactions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions for supervisor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const handleOpenAuthModal = (trx: TransactionItem) => {
    setSelectedTrx(trx);
    setPin('');
    setNotes('Disetujui. Fisik uang & verifikasi kasir telah selesai.');
    setAuthError(null);
    setAuthSuccessMsg(null);
  };

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrx || !user) return;

    setSubmittingAuth(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/transactions/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: selectedTrx.id,
          supervisorName: user.name || 'Supervisor',
          pin,
          action: 'approve',
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAuthSuccessMsg(
          `Transaksi ${selectedTrx.referenceNo} berhasil disetujui! Invoice diterbitkan: ${data.data?.invoiceNo || 'INV-Generated'}`
        );
        setTimeout(() => {
          setSelectedTrx(null);
          setAuthSuccessMsg(null);
          fetchTransactions();
        }, 1500);
      } else {
        setAuthError(data.error || 'Otorisasi gagal.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Kesalahan sistem.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTrx || !user) return;

    try {
      const res = await fetch('/api/transactions/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: rejectTrx.id,
          supervisorName: user.name || 'Supervisor',
          pin: '123456', // Dev bypass for rejection
          action: 'reject',
          notes: rejectNotes || 'Ditolak oleh Supervisor.',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRejectTrx(null);
        setRejectNotes('');
        fetchTransactions();
      }
    } catch (err) {
      console.error('Error rejecting transaction:', err);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  const filtered = transactions.filter(
    (t) =>
      t.referenceNo.toLowerCase().includes(search.toLowerCase()) ||
      t.userName?.toLowerCase().includes(search.toLowerCase()) ||
      t.currencyCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Header Panel */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Panel Otorisasi Berjenjang Supervisor
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Limit & AML Control
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Persetujuan transaksi valas tunai, validasi kecukupan kas fisik, mitigasi AML/PPATK, dan rilis invoice resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
          >
            <option value="pending_supervisor">Antrean Menunggu Otorisasi</option>
            <option value="approved">Sudah Disetujui (Approved)</option>
            <option value="rejected">Ditolak (Rejected)</option>
            <option value="">Semua Status</option>
          </select>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari TRX / Nasabah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500 w-44"
            />
          </div>

          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Refresh Antrean"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Transactions Queue */}
      <div className="p-4 sm:p-6 pt-0 space-y-4">
        {loading && transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-500" />
            <span>Memuat antrean transaksi valas...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">Tidak ada transaksi dalam antrean ini.</p>
            <p className="text-xs text-slate-400 mt-1">
              Semua order valas saat ini sudah diproses atau belum ada booking baru.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((trx) => {
              const isPending = trx.status === 'pending_supervisor';
              return (
                <div
                  key={trx.id}
                  className={`p-5 rounded-2xl border transition ${
                    trx.amlFlag
                      ? 'border-amber-300 bg-amber-50/25'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Column: Trx Info */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {trx.referenceNo}
                        </span>

                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            trx.type === 'BUY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {trx.type === 'BUY' ? 'BELI (Nasabah Beli)' : 'JUAL (Nasabah Jual)'}
                        </span>

                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            trx.status === 'pending_supervisor'
                              ? 'bg-purple-100 text-purple-800 animate-pulse'
                              : trx.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {trx.status === 'pending_supervisor'
                            ? 'Menunggu Otorisasi'
                            : trx.status === 'approved'
                            ? 'Disetujui (Approved)'
                            : 'Ditolak'}
                        </span>

                        {trx.amlFlag && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                            <AlertTriangle className="w-3 h-3" />
                            CTR LAPOR PPATK ($\ge$ 100 Jt)
                          </span>
                        )}
                      </div>

                      {/* Nasabah & Amounts */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Nasabah:</span>
                          <span className="font-bold text-slate-800">{trx.userName || 'Nasabah'}</span>
                          <span className="text-[10px] text-slate-400 block">{trx.userEmail}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[11px]">Nominal Valas:</span>
                          <span className="font-black text-sm text-slate-900">
                            {trx.amountForeign.toLocaleString()} {trx.currencyCode}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Kurs: Rp {formatRupiah(trx.lockedRate)}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[11px]">Total Pembayaran IDR:</span>
                          <span className="font-black text-sm text-emerald-700">
                            Rp {formatRupiah(trx.amountIdr)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Fee: Rp {formatRupiah(trx.serviceFeeIdr)}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[11px]">Pecahan Fisik:</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {trx.denominations && trx.denominations.length > 0 ? (
                              trx.denominations.map((d, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700"
                                >
                                  {d.quantity}x {trx.currencyCode} {d.denominationValue}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Pecahan Campur</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Authorized Info if Approved */}
                      {trx.invoiceNo && (
                        <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-2">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            No Invoice: <strong className="text-slate-800">{trx.invoiceNo}</strong> | Disetujui oleh: {trx.authorizedBy}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Actions */}
                    {isPending && (
                      <div className="flex items-center gap-2 lg:flex-col lg:items-end flex-shrink-0">
                        <button
                          onClick={() => handleOpenAuthModal(trx)}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Otorisasi PIN</span>
                        </button>

                        <button
                          onClick={() => {
                            setRejectTrx(trx);
                            setRejectNotes('');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Supervisor PIN Verification Modal */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-purple-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Otorisasi Supervisor Valas
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Ref: {selectedTrx.referenceNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrx(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {authSuccessMsg ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-slate-900">{authSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleAuthorize} className="p-6 space-y-4">
                {/* Security Advisory */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between font-semibold">
                    <span>Nasabah:</span>
                    <span className="text-slate-900">{selectedTrx.userName}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total IDR:</span>
                    <span className="text-emerald-700">Rp {formatRupiah(selectedTrx.amountIdr)}</span>
                  </div>
                  {selectedTrx.amlFlag && (
                    <div className="text-amber-700 font-bold text-[11px] pt-1">
                      ⚠️ Wajib Verifikasi Formulir PPATK sebelum rilis kas.
                    </div>
                  )}
                </div>

                {/* PIN Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    6-Digit PIN Otorisasi Supervisor
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full text-center tracking-[0.5em] text-lg font-mono px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 text-center">
                    (PIN Demo Pengujian: <code>123456</code>)
                  </span>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Otorisasi Kasir / Supervisor
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {authError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {authError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTrx(null)}
                    className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAuth || pin.length < 6}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {submittingAuth ? 'Memverifikasi...' : 'Setujui & Kunci Kas'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              Tolak Transaksi {rejectTrx.referenceNo}?
            </h4>
            <p className="text-xs text-slate-600">
              Berikan alasan penolakan untuk arsip kepatuhan transaksi.
            </p>
            <textarea
              rows={3}
              placeholder="Alasan penolakan..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectTrx(null)}
                className="px-4 py-2 text-xs text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
