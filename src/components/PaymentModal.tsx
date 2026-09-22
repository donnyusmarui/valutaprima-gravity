// PaymentModal.tsx — Sprint 3 Langkah 7
// Checkout flow: Show payment summary → Initiate Midtrans Snap / Demo mode
// PDF Invoice download via jsPDF (client-side, zero serverless cost)

import { useState } from 'react';
import { X, CreditCard, QrCode, Building2, AlertTriangle, CheckCircle, Download, Loader2, ExternalLink } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface TransactionData {
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
  createdAt?: string;
}

interface PaymentModalProps {
  transaction: TransactionData;
  customerName: string;
  customerEmail: string;
  onClose: () => void;
  onPaymentComplete: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function PaymentModal({
  transaction,
  customerName,
  customerEmail,
  onClose,
  onPaymentComplete,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    snapToken?: string;
    redirectUrl?: string;
    isDemoMode?: boolean;
    message?: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [pdfGenerated, setPdfGenerated] = useState(false);

  const fmtIdr = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('id-ID', { dateStyle: 'long' }) : new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });

  // ─── Initiate Midtrans Payment ──────────────────────────────────────────────
  const handleInitiatePayment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.id,
          customerName,
          customerEmail,
          totalAmountIdr: transaction.totalAmountIdr,
          invoiceNo: transaction.invoiceNo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentResult(data.data);

        // Jika ada Midtrans Snap SDK (production/sandbox nyata)
        if (!data.data.isDemoMode && data.data.snapToken && (window as any).snap) {
          (window as any).snap.pay(data.data.snapToken, {
            onSuccess: () => { setPaymentResult(prev => prev ? { ...prev, status: 'success' } : prev); onPaymentComplete(); },
            onPending: () => {},
            onError: (err: any) => setError(err.message || 'Pembayaran gagal'),
            onClose: () => {},
          });
        }
      } else {
        setError(data.error || 'Gagal membuat sesi pembayaran');
      }
    } catch (e) {
      setError('Gagal terhubung ke server pembayaran');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Generate PDF Invoice (client-side jsPDF) ───────────────────────────────
  const handleDownloadPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 20;
    let y = margin;

    // Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PT VALUTA PRIMA GRAVITY', margin, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Jl. Money Changer No. 1, Jakarta Pusat | Izin PPATK-MC-2024-001', margin, 26);
    doc.text('Tel: +62 21 1234 5678 | info@valutaprima.com', margin, 33);

    y = 55;
    doc.setTextColor(0, 0, 0);

    // Invoice title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('BUKTI TRANSAKSI VALUTA ASING', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`No. Invoice: ${transaction.invoiceNo}`, margin, y);
    doc.text(`Tanggal: ${fmtDate(transaction.createdAt)}`, 150, y);
    y += 12;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 8;

    // Customer info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Informasi Nasabah', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nama  : ${customerName}`, margin, y); y += 5;
    doc.text(`Email : ${customerEmail}`, margin, y); y += 12;

    // Transaction detail table header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 2, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Detail Transaksi', margin + 2, y + 4);
    y += 12;

    const rows = [
      ['Jenis Transaksi', transaction.transactionType === 'buy' ? 'Beli (Customer membeli valas)' : 'Jual (Customer menjual valas)'],
      ['Mata Uang', transaction.currencyCode],
      ['Jumlah', `${transaction.amount.toFixed(2)} ${transaction.currencyCode}`],
      ['Kurs', `${fmtIdr(transaction.rate)} / 1 ${transaction.currencyCode}`],
      ['Biaya Layanan', fmtIdr(transaction.serviceFee)],
      ['Total IDR', fmtIdr(transaction.totalAmountIdr)],
      ['Status', transaction.status.toUpperCase()],
    ];

    doc.setFont('helvetica', 'normal');
    rows.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y - 2, 170, 7, 'F');
      }
      doc.setTextColor(80, 80, 80);
      doc.text(label, margin + 2, y + 3);
      doc.setTextColor(0, 0, 0);
      doc.text(value, 100, y + 3);
      y += 7;
    });

    y += 8;

    // AML notice jika ada
    if (transaction.amlFlag) {
      doc.setFillColor(254, 243, 199);
      doc.rect(margin, y, 170, 14, 'F');
      doc.setTextColor(180, 83, 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('⚠ PERHATIAN: Transaksi ini memenuhi ambang batas CTR (>= Rp 100.000.000)', margin + 3, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text('Telah dilaporkan ke PPATK sesuai regulasi BI No. 14/27/PBI/2012', margin + 3, y + 11);
      y += 20;
    }

    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, 190, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('Dokumen ini diterbitkan secara elektronik dan sah tanpa tanda tangan basah.', margin, y);
    y += 4;
    doc.text('PT Valuta Prima Gravity | Berizin dan diawasi oleh Bank Indonesia', margin, y);
    y += 4;
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, margin, y);

    doc.save(`${transaction.invoiceNo}.pdf`);
    setPdfGenerated(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Pembayaran</h2>
            <p className="text-sm text-slate-500 mt-1">{transaction.invoiceNo}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* AML Warning */}
          {transaction.amlFlag && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="text-sm font-semibold text-amber-800">CTR — Laporan PPATK Diperlukan</p>
                <p className="text-xs text-amber-700 mt-0.5">Transaksi ini ≥ Rp 100.000.000 dan wajib dilaporkan ke PPATK.</p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Jenis</span>
              <span className="font-medium capitalize">{transaction.transactionType === 'buy' ? 'Beli Valas' : 'Jual Valas'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Mata Uang</span>
              <span className="font-medium">{transaction.amount.toFixed(2)} {transaction.currencyCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Kurs</span>
              <span className="font-medium">{fmtIdr(transaction.rate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Biaya Layanan</span>
              <span className="font-medium">{fmtIdr(transaction.serviceFee)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-bold text-slate-900">Total Bayar</span>
              <span className="font-bold text-lg text-emerald-700">{fmtIdr(transaction.totalAmountIdr)}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
          )}

          {/* Payment result / Demo mode */}
          {paymentResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="text-emerald-600" size={18} />
                <span className="font-semibold text-emerald-800">
                  {paymentResult.isDemoMode ? 'Mode Demo Aktif' : 'Sesi Pembayaran Dibuat'}
                </span>
              </div>
              {paymentResult.isDemoMode && (
                <p className="text-xs text-emerald-700 mb-3">{paymentResult.message}</p>
              )}
              {paymentResult.redirectUrl && !paymentResult.isDemoMode && (
                <a
                  href={paymentResult.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
                >
                  <ExternalLink size={14} /> Buka Halaman Pembayaran Midtrans
                </a>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!paymentResult && (
              <button
                onClick={handleInitiatePayment}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {isLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Memproses...</>
                ) : (
                  <><CreditCard size={18} /> Bayar Sekarang — {fmtIdr(transaction.totalAmountIdr)}</>
                )}
              </button>
            )}

            {/* PDF Download — always available */}
            <button
              onClick={handleDownloadPdf}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-3 rounded-xl transition-colors"
            >
              <Download size={18} />
              {pdfGenerated ? '✓ PDF Terunduh — Unduh Lagi' : 'Unduh Invoice PDF'}
            </button>

            {paymentResult && (
              <button
                onClick={onPaymentComplete}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Selesai
              </button>
            )}
          </div>

          {/* Payment method icons */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Building2 size={12} /> Virtual Account
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <QrCode size={12} /> QRIS
            </div>
            <div className="text-xs text-slate-400">powered by Midtrans</div>
          </div>
        </div>
      </div>
    </div>
  );
}
