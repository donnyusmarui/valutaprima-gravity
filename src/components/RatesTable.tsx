import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  RefreshCw,
  Search,
  Edit3,
  CheckCircle2,
  Coins,
} from 'lucide-react';

export interface RateItem {
  id: number;
  currencyCode: string;
  currencyName: string;
  buyRate: number;
  sellRate: number;
  stockAmount: number;
  updatedAt: string;
}

export interface RatesTableProps {
  onOpenTrade?: (currencyCode: string, type: 'BUY' | 'SELL') => void;
}

export const RatesTable: React.FC<RatesTableProps> = ({ onOpenTrade }) => {
  const { user } = useAuth();
  const [rates, setRates] = useState<RateItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [editingRate, setEditingRate] = useState<RateItem | null>(null);
  const [editBuy, setEditBuy] = useState<string>('');
  const [editSell, setEditSell] = useState<string>('');
  const [editStock, setEditStock] = useState<string>('');
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const isStaff = user?.role === 'teller' || user?.role === 'supervisor';

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRates(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch rates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const openEditModal = (rate: RateItem) => {
    setEditingRate(rate);
    setEditBuy(rate.buyRate.toString());
    setEditSell(rate.sellRate.toString());
    setEditStock(rate.stockAmount.toString());
    setUpdateMsg(null);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;

    try {
      const res = await fetch('/api/rates/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currencyCode: editingRate.currencyCode,
          buyRate: parseFloat(editBuy),
          sellRate: parseFloat(editSell),
          stockAmount: parseFloat(editStock),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUpdateMsg('Kurs berhasil diperbarui di database!');
        setTimeout(() => {
          setEditingRate(null);
          setUpdateMsg(null);
          fetchRates();
        }, 1000);
      }
    } catch (err) {
      console.error('Error saving rate:', err);
    }
  };

  const filteredRates = rates.filter(
    (r) =>
      r.currencyCode.toLowerCase().includes(search.toLowerCase()) ||
      r.currencyName.toLowerCase().includes(search.toLowerCase())
  );

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Panel */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Papan Kurs Valas Real-Time</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Database
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kurs indikatif jual dan beli tunai valuta asing terakreditasi Bank Indonesia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari mata uang (USD, EUR...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-48 sm:w-56"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchRates}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Refresh Data Kurs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Rates Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 sm:px-6">Mata Uang</th>
              <th className="py-3 px-4 text-right">
                <span className="inline-flex items-center gap-1 justify-end">
                  Beli (Kami Beli)
                  <span className="text-slate-400 text-[10px] lowercase">(customer jual)</span>
                </span>
              </th>
              <th className="py-3 px-4 text-right">
                <span className="inline-flex items-center gap-1 justify-end">
                  Jual (Kami Jual)
                  <span className="text-slate-400 text-[10px] lowercase">(customer beli)</span>
                </span>
              </th>
              <th className="py-3 px-4 text-right hidden sm:table-cell">Spread</th>
              <th className="py-3 px-4 text-right hidden md:table-cell">Ketersediaan Stok</th>
              <th className="py-3 px-4 text-center">Aksi Transaksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading && rates.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                  Mengambil data kurs terkini dari database...
                </td>
              </tr>
            ) : filteredRates.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  Tidak ada mata uang yang cocok dengan pencarian "{search}".
                </td>
              </tr>
            ) : (
              filteredRates.map((rate) => {
                const spread = rate.sellRate - rate.buyRate;
                const isStockLow = rate.stockAmount < 20000 && rate.currencyCode !== 'JPY';

                return (
                  <tr key={rate.id} className="hover:bg-emerald-50/30 transition">
                    <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-800 font-extrabold flex items-center justify-center text-xs tracking-wider">
                          {rate.currencyCode}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{rate.currencyCode}</div>
                          <div className="text-[11px] text-slate-500">{rate.currencyName}</div>
                        </div>
                      </div>
                    </td>

                    {/* Beli */}
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-700">
                      Rp {formatRupiah(rate.buyRate)}
                    </td>

                    {/* Jual */}
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                      Rp {formatRupiah(rate.sellRate)}
                    </td>

                    {/* Spread */}
                    <td className="py-3.5 px-4 text-right text-slate-500 hidden sm:table-cell">
                      Rp {formatRupiah(spread)}
                    </td>

                    {/* Stok */}
                    <td className="py-3.5 px-4 text-right hidden md:table-cell">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isStockLow
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <Coins className="w-3 h-3" />
                        {new Intl.NumberFormat('id-ID').format(rate.stockAmount)} {rate.currencyCode}
                      </span>
                    </td>

                    {/* Actions: Transaksi & Staff Edit */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onOpenTrade && (
                          <button
                            onClick={() => onOpenTrade(rate.currencyCode, 'BUY')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
                            title="Beli / Jual Valas"
                          >
                            <span>Transaksi</span>
                          </button>
                        )}
                        {isStaff && (
                          <button
                            onClick={() => openEditModal(rate)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                            title="Ubah Kurs & Stok"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Rate Modal (for Teller & Supervisor) */}
      {editingRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Kelola Kurs: {editingRate.currencyCode} ({editingRate.currencyName})
              </h3>
              <button
                onClick={() => setEditingRate(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {updateMsg && (
              <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{updateMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveRate} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kurs Beli (IDR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editBuy}
                  onChange={(e) => setEditBuy(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kurs Jual (IDR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editSell}
                  onChange={(e) => setEditSell(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Stok Fisik ({editingRate.currencyCode})
                </label>
                <input
                  type="number"
                  step="1"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRate(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
