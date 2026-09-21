import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Coins,
  RefreshCw,
  Edit2,
  Check,
  Plus,
  Minus,
  Building2,
} from 'lucide-react';

interface DenominationItem {
  id: number;
  currencyCode: string;
  denominationValue: number;
  quantity: number;
  isAvailable: boolean;
  updatedAt: string;
}

export const InventoryPanel: React.FC = () => {
  const { user } = useAuth();
  const [denoms, setDenoms] = useState<DenominationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);

  const isStaff = user?.role === 'teller' || user?.role === 'supervisor';

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const url = selectedCurrency === 'ALL' ? '/api/inventory' : `/api/inventory?currencyCode=${selectedCurrency}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDenoms(data.data);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedCurrency]);

  const handleStartEdit = (d: DenominationItem) => {
    setEditingId(d.id);
    setEditQty(d.quantity);
  };

  const handleSaveEdit = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch('/api/inventory/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          quantity: editQty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        fetchInventory();
      }
    } catch (err) {
      console.error('Error saving denomination:', err);
    } finally {
      setSaving(false);
    }
  };

  const currencies = ['ALL', 'USD', 'EUR', 'SGD', 'JPY', 'AUD', 'GBP', 'CNY', 'SAR'];

  // Summary statistics
  const totalSheets = denoms.reduce((sum, d) => sum + d.quantity, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Header Panel */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Inventaris Kas Fisik Valas (Physical Vault)
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Pecahan Lembar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring stok lembar pecahan fisik valas di brankas utama cabang secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-600" />
            <span>Total Lembar: {totalSheets.toLocaleString()} lbr</span>
          </div>

          <button
            onClick={fetchInventory}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Refresh Stok Fisik"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Currency Filter Chips */}
      <div className="px-5 sm:px-6 flex items-center gap-2 overflow-x-auto pb-2">
        {currencies.map((curr) => (
          <button
            key={curr}
            onClick={() => setSelectedCurrency(curr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              selectedCurrency === curr
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {curr}
          </button>
        ))}
      </div>

      {/* Denominations Grid */}
      <div className="p-5 sm:p-6 pt-0">
        {loading && denoms.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-500" />
            <span>Memuat data brankas fisik...</span>
          </div>
        ) : denoms.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border border-dashed rounded-xl">
            Tidak ada data pecahan untuk mata uang {selectedCurrency}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {denoms.map((item) => {
              const isEditing = editingId === item.id;
              const isLow = item.quantity < 50;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition ${
                    isLow
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-slate-500">
                      {item.currencyCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isLow
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isLow ? 'Stok Tipis' : 'Tersedia'}
                    </span>
                  </div>

                  <div className="text-xl font-black text-slate-900 mb-1">
                    {item.currencyCode} {item.denominationValue.toLocaleString()}
                  </div>

                  <div className="text-xs text-slate-500 mb-3">
                    Nilai Total: {(item.denominationValue * item.quantity).toLocaleString()} {item.currencyCode}
                  </div>

                  {/* Quantity Display & Edit */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditQty(Math.max(0, editQty - 10))}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={editQty}
                        onChange={(e) => setEditQty(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-center text-xs font-bold border border-slate-200 rounded py-1"
                      />
                      <button
                        type="button"
                        onClick={() => setEditQty(editQty + 10)}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSaveEdit(item.id)}
                        className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        title="Simpan"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Jumlah Lembar:</span>
                        <span className="font-extrabold text-sm text-slate-900">
                          {item.quantity.toLocaleString()} lbr
                        </span>
                      </div>

                      {isStaff && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Ubah Stok Kasir"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
