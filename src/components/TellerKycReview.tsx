import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

interface PendingKycItem {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  idCardNumber: string;
  idCardType: string;
  idCardFileUrl: string;
  status: string;
  submittedAt: string;
}

export const TellerKycReview: React.FC = () => {
  const { user } = useAuth();
  const [pendingList, setPendingList] = useState<PendingKycItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedKyc, setSelectedKyc] = useState<PendingKycItem | null>(null);
  const [pepChecked, setPepChecked] = useState<boolean>(false);
  const [legitChecked, setLegitChecked] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kyc/pending');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPendingList(data.data);
      }
    } catch (err) {
      console.error('Error fetching pending KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openReviewModal = (item: PendingKycItem) => {
    setSelectedKyc(item);
    setPepChecked(false);
    setLegitChecked(false);
    setNotes('');
    setResultMsg(null);
  };

  const handleProcess = async (action: 'verified' | 'rejected') => {
    if (!selectedKyc || !user) return;
    if (action === 'verified' && (!pepChecked || !legitChecked)) {
      setResultMsg({
        type: 'error',
        text: 'Harap centang verifikasi keaslian dokumen dan PEP screening sebelum menyetujui.',
      });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/kyc/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedKyc.id,
          reviewerId: `${user.name} (${user.role})`,
          action,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResultMsg({
          type: 'success',
          text: data.message,
        });
        setTimeout(() => {
          setSelectedKyc(null);
          fetchPending();
        }, 1200);
      } else {
        setResultMsg({ type: 'error', text: data.error || 'Gagal memproses review' });
      }
    } catch (err) {
      console.error('Error processing review:', err);
      setResultMsg({ type: 'error', text: 'Terjadi kesalahan sistem' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Panel Review KYC (Teller & Supervisor)</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {pendingList.length} Antrean Menunggu
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifikasi identitas fisik, kejelasan dokumen, dan screening watchlist/PEP sebelum otorisasi transaksi.
          </p>
        </div>

        <button
          onClick={fetchPending}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>Segarkan Antrean</span>
        </button>
      </div>

      {/* Pending List */}
      <div className="divide-y divide-slate-100">
        {loading && pendingList.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
            Memuat daftar antrean KYC...
          </div>
        ) : pendingList.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">Semua Dokumen Telah Diverifikasi</h4>
            <p className="text-xs text-slate-400 mt-0.5">Tidak ada antrean pengajuan KYC yang pending saat ini.</p>
          </div>
        ) : (
          pendingList.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-indigo-50/20 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100/70 text-indigo-700 font-bold flex items-center justify-center text-xs">
                  {item.idCardType}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.userName || 'Nasabah'}</span>
                    <span className="text-[11px] text-slate-400">({item.userEmail})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-700">
                      {item.idCardNumber}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {new Date(item.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => openReviewModal(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-2xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Periksa & Verifikasi</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Verifikasi Dokumen Identitas</h3>
              </div>
              <button
                onClick={() => setSelectedKyc(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {resultMsg && (
              <div
                className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
                  resultMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {resultMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span>{resultMsg.text}</span>
              </div>
            )}

            {/* Applicant Details */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Nasabah:</span>
                <span className="font-bold text-slate-800">{selectedKyc.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-700">{selectedKyc.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tipe / No. Identitas:</span>
                <span className="font-mono font-bold text-indigo-700">
                  {selectedKyc.idCardType} - {selectedKyc.idCardNumber}
                </span>
              </div>
            </div>

            {/* Document Image Preview */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Foto Dokumen</label>
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900/5 p-2 text-center">
                <img
                  src={selectedKyc.idCardFileUrl}
                  alt="Dokumen KYC"
                  className="max-h-56 mx-auto rounded-lg shadow-sm object-contain"
                />
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
              <label className="block text-xs font-semibold text-slate-700">Kepatuhan AML & Verifikasi Teller</label>
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legitChecked}
                  onChange={(e) => setLegitChecked(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Foto identitas jelas, tidak buram, dan data sesuai identitas pemohon.</span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pepChecked}
                  onChange={(e) => setPepChecked(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Screening PEP (Politically Exposed Person) & Daftar Teroris (DTTOT) Bersih.</span>
              </label>
            </div>

            {/* Review Notes */}
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Verifikasi (Wajib diisi jika menolak)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tulis alasan jika menolak, atau catatan khusus persetujuan..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleProcess('rejected')}
                disabled={actionLoading}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Tolak Dokumen</span>
              </button>

              <button
                type="button"
                onClick={() => handleProcess('verified')}
                disabled={actionLoading || !pepChecked || !legitChecked}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition cursor-pointer ${
                  pepChecked && legitChecked
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Memproses...' : 'Setujui Dokumen (Approve)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
