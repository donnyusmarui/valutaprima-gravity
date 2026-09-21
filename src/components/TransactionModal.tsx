import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RateItem } from './RatesTable';
import {
  X,
  ArrowRightLeft,
  AlertTriangle,
  Coins,
  CheckCircle2,
  Lock,
  AlertCircle,
} from 'lucide-react';

interface DenominationItem {
  id: number;
  currencyCode: string;
  denominationValue: number;
  quantity: number;
  isAvailable: boolean;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: RateItem[];
  defaultCurrency?: string;
  defaultType?: 'BUY' | 'SELL';
  onTransactionSuccess?: () => void;
  onNavigateToKyc?: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  rates,
  defaultCurrency = 'USD',
  defaultType = 'BUY',
  onTransactionSuccess,
  onNavigateToKyc,
}) => {
  const { user } = useAuth();
  const [type, setType] = useState<'BUY' | 'SELL'>(defaultType);
  const [currencyCode, setCurrencyCode] = useState<string>(defaultCurrency);
  const [amountForeign, setAmountForeign] = useState<number>(500);
  const [availableDenoms, setAvailableDenoms] = useState<DenominationItem[]>([]);
  const [selectedDenoms, setSelectedDenoms] = useState<{ [key: number]: number }>({});
  
  const [loadingEstimate, setLoadingEstimate] = useState<boolean>(false);
  const [estimateData, setEstimateData] = useState<any>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successTrx, setSuccessTrx] = useState<any>(null);

  // Sync default currency
  useEffect(() => {
    if (defaultCurrency) setCurrencyCode(defaultCurrency);
  }, [defaultCurrency]);

  useEffect(() => {
    if (defaultType) setType(defaultType);
  }, [defaultType]);

  // Fetch denominations when currency changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchDenoms = async () => {
      try {
        const res = await fetch(`/api/inventory?currencyCode=${currencyCode}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setAvailableDenoms(data.data);
          // Reset selected denoms
          setSelectedDenoms({});
        }
      } catch (err) {
        console.error('Failed to load denominations:', err);
      }
    };

    fetchDenoms();
  }, [currencyCode, isOpen]);

  // Calculate live estimate whenever amount, type, or currency changes
  useEffect(() => {
    if (!isOpen || !amountForeign || amountForeign <= 0) {
      setEstimateData(null);
      return;
    }

    const fetchEstimate = async () => {
      setLoadingEstimate(true);
      try {
        const res = await fetch('/api/transactions/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            currencyCode,
            amountForeign,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setEstimateData(data.data);
        } else {
          setEstimateData(null);
        }
      } catch (err) {
        console.error('Error fetching estimate:', err);
      } finally {
        setLoadingEstimate(false);
      }
    };

    const timer = setTimeout(fetchEstimate, 150);
    return () => clearTimeout(timer);
  }, [type, currencyCode, amountForeign, isOpen]);

  if (!isOpen) return null;

  const currentRateObj = rates.find((r) => r.currencyCode === currencyCode);
  const lockedRate = currentRateObj
    ? type === 'BUY'
      ? currentRateObj.sellRate
      : currentRateObj.buyRate
    : 0;

  // Handle denomination quantity changes
  const handleDenomChange = (value: number, qty: number) => {
    const validQty = Math.max(0, qty);
    setSelectedDenoms((prev) => ({
      ...prev,
      [value]: validQty,
    }));
  };

  // Calculate sum of chosen physical denominations
  const totalDenomVal = Object.entries(selectedDenoms).reduce(
    (sum, [valStr, qty]) => sum + parseInt(valStr) * qty,
    0
  );

  const denomDifference = amountForeign - totalDenomVal;

  const handleAutoFillDenoms = () => {
    // Greedy breakdown of largest denominations available
    let remaining = amountForeign;
    const newSelected: { [key: number]: number } = {};

    const sorted = [...availableDenoms].sort((a, b) => b.denominationValue - a.denominationValue);
    for (const d of sorted) {
      if (remaining <= 0) break;
      const count = Math.min(Math.floor(remaining / d.denominationValue), d.quantity);
      if (count > 0) {
        newSelected[d.denominationValue] = count;
        remaining -= count * d.denominationValue;
      }
    }
    setSelectedDenoms(newSelected);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!user.isKycVerified) {
      setSubmitError('Akun Anda belum terverifikasi KYC. Silakan verifikasi identitas terlebih dahulu.');
      return;
    }

    if (type === 'BUY' && availableDenoms.length > 0 && denomDifference !== 0) {
      setSubmitError(`Rincian pecahan belum sesuai. Selisih: ${denomDifference > 0 ? '+' : ''}${denomDifference} ${currencyCode}.`);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formattedDenoms = Object.entries(selectedDenoms)
        .filter(([_, qty]) => qty > 0)
        .map(([valStr, qty]) => ({
          denominationValue: parseInt(valStr),
          quantity: qty,
        }));

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type,
          currencyCode,
          amountForeign,
          denominations: formattedDenoms,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessTrx(data.data);
        if (onTransactionSuccess) onTransactionSuccess();
      } else {
        setSubmitError(data.error || 'Gagal membuat transaksi.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/75">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kalkulator & Booking Transaksi Valas
              </h3>
              <p className="text-xs text-slate-500">
                Pemesanan penukaran fisik dengan garansi kurs terkunci (Rate Lock)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Success State vs Form */}
        {successTrx ? (
          <div className="p-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Booking Berhasil Didaftarkan
              </span>
              <h4 className="text-xl font-black text-slate-900 mt-2">
                Nomor Referensi: {successTrx.referenceNo}
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Transaksi Anda telah masuk ke antrean <strong>Otorisasi Berjenjang Supervisor</strong>. Kurs dan stok kas fisik telah dipesan khusus untuk Anda.
              </p>
            </div>

            {/* Summary Ticket */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Tipe Transaksi:</span>
                <span className="font-bold text-slate-900">
                  {successTrx.type === 'BUY' ? 'Beli Valas (Customer Beli)' : 'Jual Valas (Customer Jual)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Valas:</span>
                <span className="font-bold text-slate-900">
                  {parseFloat(successTrx.amountForeign).toLocaleString()} {successTrx.currencyCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kurs Terkunci:</span>
                <span className="font-bold text-emerald-700">
                  Rp {formatRupiah(parseFloat(successTrx.lockedRate))}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="font-bold text-slate-800">Total Pembayaran:</span>
                <span className="font-black text-emerald-800">
                  Rp {formatRupiah(parseFloat(successTrx.amountIdr))}
                </span>
              </div>
              {successTrx.amlFlag && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 mt-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Transaksi bernilai $\ge$ Rp 100 Jt dilaporkan ke PPATK (CTR).</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSuccessTrx(null);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Tutup & Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateOrder} className="p-6 space-y-5">
            {/* KYC Gate Notice if Unverified */}
            {user?.role === 'customer' && !user?.isKycVerified && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-pulse">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold block">Verifikasi KYC Wajib</span>
                    <span>Anda harus lolos verifikasi KTP sebelum transaksi dapat dilakukan.</span>
                  </div>
                </div>
                {onNavigateToKyc && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToKyc();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs whitespace-nowrap transition cursor-pointer"
                  >
                    Verifikasi Sekarang
                  </button>
                )}
              </div>
            )}

            {/* Type Selector (BUY vs SELL) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setType('BUY')}
                className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  type === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Beli Valas (Customer Beli)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('SELL')}
                className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  type === 'SELL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Jual Valas (Customer Jual)</span>
              </button>
            </div>

            {/* Currency & Amount Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mata Uang Valas
                </label>
                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {rates.map((r) => (
                    <option key={r.currencyCode} value={r.currencyCode}>
                      {r.currencyCode} — {r.currencyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Valas ({currencyCode})
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amountForeign}
                  onChange={(e) => setAmountForeign(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Nominal Cepat:</span>
              {[100, 500, 1000, 5000, 10000].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setAmountForeign(chip)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                    amountForeign === chip
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  +{chip.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Physical Denominations Breakdown (Pecahan Kas Fisik) - Required for BUY */}
            {type === 'BUY' && availableDenoms.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>Pilihan Pecahan Kas Fisik ({currencyCode})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFillDenoms}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                  >
                    Otomatiskan Pecahan
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableDenoms.map((denom) => {
                    const currentQty = selectedDenoms[denom.denominationValue] || 0;
                    return (
                      <div
                        key={denom.id}
                        className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex flex-col justify-between gap-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-black text-slate-900">
                            {currencyCode} {denom.denominationValue}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Stok: {denom.quantity} lbr
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleDenomChange(
                                denom.denominationValue,
                                currentQty - 1
                              )
                            }
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={denom.quantity}
                            value={currentQty}
                            onChange={(e) =>
                              handleDenomChange(
                                denom.denominationValue,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full text-center py-0.5 text-xs font-bold border border-slate-200 rounded"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleDenomChange(
                                denom.denominationValue,
                                Math.min(denom.quantity, currentQty + 1)
                              )
                            }
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Denomination Counter Validation */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 font-semibold">
                  <span className="text-slate-600">
                    Total Lembar Terpilih: <strong>{totalDenomVal.toLocaleString()} {currencyCode}</strong>
                  </span>
                  <span
                    className={
                      denomDifference === 0
                        ? 'text-emerald-600 font-bold'
                        : 'text-amber-600 font-bold'
                    }
                  >
                    {denomDifference === 0
                      ? '✅ Pas dengan nominal order'
                      : `⚠️ Selisih: ${denomDifference > 0 ? `Kurang ${denomDifference}` : `Lebih ${Math.abs(denomDifference)}`} ${currencyCode}`}
                  </span>
                </div>
              </div>
            )}

            {/* Live Calculation Card */}
            <div className="bg-emerald-900 text-white rounded-xl p-4 space-y-2.5 text-xs shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-emerald-200 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  Kurs Terkunci (Rate Lock):
                </span>
                <span className="font-extrabold text-sm text-emerald-100">
                  Rp {formatRupiah(lockedRate)} / {currencyCode}
                </span>
              </div>

              <div className="flex items-center justify-between text-emerald-200/80">
                <span>Subtotal Konversi:</span>
                <span>
                  Rp {estimateData ? formatRupiah(estimateData.subtotalIdr) : '...'}
                </span>
              </div>

              <div className="flex items-center justify-between text-emerald-200/80">
                <span>Biaya Layanan & Administrasi:</span>
                <span>
                  {estimateData?.serviceFeeIdr === 0
                    ? 'GRATIS (Promo)'
                    : `Rp ${formatRupiah(estimateData?.serviceFeeIdr || 0)}`}
                </span>
              </div>

              <div className="border-t border-emerald-700/60 pt-2 flex items-center justify-between text-sm">
                <span className="font-bold text-white">Total IDR yang Dibayar:</span>
                <span className="text-lg font-black text-amber-300">
                  Rp {estimateData ? formatRupiah(estimateData.totalIdr) : '...'}
                </span>
              </div>
            </div>

            {/* AML / CTR Notice if >= 100 Juta */}
            {estimateData?.amlFlag && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Kewajiban Pelaporan Transaksi Tunai (CTR - PPATK)</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Nilai transaksi ini mencapai <strong>$\ge$ Rp 100.000.000</strong>. Sesuai Undang-Undang Anti-Pencucian Uang & regulasi Bank Indonesia, sistem akan menggenerate laporan transaksi tunai otomatis ke PPATK dan mewajibkan otorisasi Supervisor bersertifikat APU-PPT.
                </p>
              </div>
            )}

            {/* Error Banner */}
            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={
                  submitting ||
                  loadingEstimate ||
                  (user?.role === 'customer' && !user?.isKycVerified) ||
                  (type === 'BUY' && availableDenoms.length > 0 && denomDifference !== 0)
                }
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Memproses Booking...</span>
                ) : (
                  <>
                    <span>Pesan & Kunci Kurs</span>
                    <Lock className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
