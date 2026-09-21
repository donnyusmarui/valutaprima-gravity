import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Camera,
} from 'lucide-react';

export interface KycSubmission {
  id: number;
  userId: number;
  idCardNumber: string;
  idCardType: string;
  idCardFileUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  reviewNotes?: string | null;
  submittedAt: string;
}

export const KycCustomerCard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [kycData, setKycData] = useState<KycSubmission | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Form State
  const [idType, setIdType] = useState<'KTP' | 'PASSPORT'>('KTP');
  const [idNumber, setIdNumber] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const fetchMyKyc = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/kyc/my?userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setKycData(data.data);
      }
    } catch (err) {
      console.error('Error fetching KYC status:', err);
    }
  };

  useEffect(() => {
    fetchMyKyc();
  }, [user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !idNumber) return;

    setSubmitting(true);
    try {
      const previewUrl =
        fileUrl ||
        'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=600&q=80';

      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          idCardType: idType,
          idCardNumber: idNumber,
          idCardFileUrl: previewUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitMsg('Dokumen berhasil dikirim! Menunggu verifikasi Teller.');
        setTimeout(() => {
          setShowUploadModal(false);
          setSubmitMsg(null);
          fetchMyKyc();
          refreshUser();
        }, 1200);
      }
    } catch (err) {
      console.error('Error submitting KYC:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Determine current effective status
  const currentStatus = user?.isKycVerified
    ? 'verified'
    : kycData?.status || 'not_submitted';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              currentStatus === 'verified'
                ? 'bg-emerald-100 text-emerald-600'
                : currentStatus === 'pending'
                ? 'bg-amber-100 text-amber-600'
                : currentStatus === 'rejected'
                ? 'bg-rose-100 text-rose-600'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {currentStatus === 'verified' ? (
              <ShieldCheck className="w-6 h-6" />
            ) : currentStatus === 'pending' ? (
              <Clock className="w-6 h-6 animate-pulse" />
            ) : currentStatus === 'rejected' ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <FileText className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Verifikasi Identitas Nasabah (KYC)</h3>
              {currentStatus === 'verified' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Terverifikasi
                </span>
              )}
              {currentStatus === 'pending' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  <Clock className="w-3.5 h-3.5" />
                  Menunggu Review Teller
                </span>
              )}
              {currentStatus === 'rejected' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                  <XCircle className="w-3.5 h-3.5" />
                  Dokumen Ditolak
                </span>
              )}
              {currentStatus === 'not_submitted' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  Belum Lengkap
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Sesuai regulasi AML (Anti Money Laundering) & Bank Indonesia, verifikasi identitas (KTP/Paspor)
              diperlukan untuk melakukan transaksi penukaran valas non-tunai secara aman.
            </p>

            {currentStatus === 'rejected' && kycData?.reviewNotes && (
              <div className="mt-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                Catatan Teller: {kycData.reviewNotes}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div>
          {currentStatus === 'verified' ? (
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-block">
                ✓ Akun Siap Transaksi
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{currentStatus === 'pending' ? 'Perbarui Dokumen' : 'Unggah Dokumen KYC'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KYC Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Formulir Upload KYC</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {submitMsg && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{submitMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitKyc} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Dokumen</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIdType('KTP')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      idType === 'KTP'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    KTP (WNI)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdType('PASSPORT')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      idType === 'PASSPORT'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Paspor (WNA/WNI)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor {idType === 'KTP' ? 'NIK KTP' : 'Paspor'}
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={idType === 'KTP' ? '317xxxxxxxxxxxxxx (16 digit)' : 'A12345678'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Foto Identitas Asli</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-emerald-400 transition bg-slate-50/50">
                  {fileUrl ? (
                    <div className="relative group">
                      <img
                        src={fileUrl}
                        alt="Preview Identitas"
                        className="max-h-36 mx-auto rounded-lg shadow-xs object-cover"
                      />
                      <p className="text-[11px] text-emerald-600 mt-2 font-semibold">✓ Foto terpilih</p>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-600 font-medium">Klik untuk memilih foto dokumen</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Mendukung JPG, PNG (Maks 5MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="mt-2 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? 'Mengunggah...' : 'Kirim untuk Verifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
