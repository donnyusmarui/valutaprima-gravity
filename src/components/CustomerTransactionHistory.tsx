import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  Printer,
} from 'lucide-react';

interface DenominationItem {
  denominationValue: number;
  quantity: number;
}

interface TransactionItem {
  id: number;
  referenceNo: string;
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
  invoiceNo?: string;
  createdAt: string;
}

export const CustomerTransactionHistory: React.FC<{ onNewBooking: () => void }> = ({
  onNewBooking,
}) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<TransactionItem | null>(null);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?userId=${user.id}&role=${user.role}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTransactions(data.data);
      }
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Riwayat Transaksi Valas Saya
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Kupon & Nota Resmi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pemesanan penukaran valuta asing dengan kurs terkunci dan bukti transaksi resmi KUPVA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewBooking}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Transaksi Baru</span>
          </button>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Refresh Riwayat"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="p-5 sm:p-6 pt-0">
        {loading && transactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
            <span>Memuat riwayat transaksi...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <p className="text-sm font-bold text-slate-700">Belum ada transaksi</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih mata uang di Papan Kurs dan mulai booking penukaran valas pertama Anda.
              </p>
            </div>
            <button
              onClick={onNewBooking}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Booking Kurs Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((t) => {
              const isApproved = t.status === 'approved';
              const isPending = t.status === 'pending_supervisor';

              return (
                <div
                  key={t.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {t.referenceNo}
                      </span>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          t.type === 'BUY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.type === 'BUY' ? 'Beli Valas' : 'Jual Valas'}
                      </span>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPending
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Disetujui (Approved)</span>
                          </>
                        ) : isPending ? (
                          <>
                            <Clock className="w-3 h-3 text-purple-600" />
                            <span>Menunggu Otorisasi Supervisor</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Ditolak</span>
                          </>
                        )}
                      </span>

                      {t.amlFlag && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          CTR Reportable
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        Valas: <strong className="text-slate-900">{t.amountForeign.toLocaleString()} {t.currencyCode}</strong>
                      </span>
                      <span>
                        Kurs Terkunci: <strong>Rp {formatRupiah(t.lockedRate)}</strong>
                      </span>
                      <span>
                        Total IDR: <strong className="text-emerald-700">Rp {formatRupiah(t.amountIdr)}</strong>
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(t.createdAt).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Denominations */}
                    {t.denominations && t.denominations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                        <span>Pecahan:</span>
                        {t.denominations.map((d, idx) => (
                          <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-700">
                            {d.quantity}x {t.currencyCode} {d.denominationValue}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isApproved && t.invoiceNo && (
                      <button
                        onClick={() => setSelectedInvoice(t)}
                        className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Lihat Bukti Nota ({t.invoiceNo})</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Modal Preview */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  KUPVA BUKAN BANK RESMI
                </span>
                <h3 className="text-base font-black">PT VALUTA PRIMA GRAVITY</h3>
                <p className="text-xs text-slate-300">Izin BI: 26/988/KEP/DIR/KUPVA</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between border-b pb-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nomor Invoice:</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{selectedInvoice.invoiceNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Tanggal:</span>
                  <span className="font-semibold text-slate-700">{new Date(selectedInvoice.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Referensi Booking:</span>
                  <span className="font-mono font-bold">{selectedInvoice.referenceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipe Transaksi:</span>
                  <span className="font-bold">{selectedInvoice.type === 'BUY' ? 'Beli Valas' : 'Jual Valas'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal Valas:</span>
                  <span className="font-bold">{selectedInvoice.amountForeign.toLocaleString()} {selectedInvoice.currencyCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kurs Eksekusi:</span>
                  <span className="font-bold">Rp {formatRupiah(selectedInvoice.lockedRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Biaya Administrasi:</span>
                  <span>Rp {formatRupiah(selectedInvoice.serviceFeeIdr)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-slate-900">
                  <span>Total Transaksi IDR:</span>
                  <span className="text-emerald-700">Rp {formatRupiah(selectedInvoice.amountIdr)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] space-y-1">
                <div className="text-slate-600">
                  Otorisasi Supervisor: <strong>{selectedInvoice.authorizedBy || 'Hendra Wijaya'}</strong>
                </div>
                <div className="text-emerald-700 font-semibold">
                  Status: Kas Tunai Telah Diserahterimakan & Diverifikasi.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Nota</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
