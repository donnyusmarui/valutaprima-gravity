import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface CurrencyRate {
  id: number;
  currencyCode: string;
  currencyName: string;
  buyRate: number;
  sellRate: number;
  stockAmount: number;
  updatedAt: string;
}

interface EditState {
  currencyCode: string;
  buyRate: string;
  sellRate: string;
  stockAmount: string;
}

interface AddState {
  currencyCode: string;
  currencyName: string;
  buyRate: string;
  sellRate: string;
  stockAmount: string;
}

const EMPTY_ADD: AddState = {
  currencyCode: '',
  currencyName: '',
  buyRate: '',
  sellRate: '',
  stockAmount: '0',
};

export function CurrencyManagementPanel() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addState, setAddState] = useState<AddState>(EMPTY_ADD);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRates(data.data);
      }
    } catch (e) {
      setError('Gagal memuat data kurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const showMsg = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccess('');
    } else {
      setSuccess(msg);
      setError('');
    }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const startEdit = (rate: CurrencyRate) => {
    setEditingCode(rate.currencyCode);
    setEditState({
      currencyCode: rate.currencyCode,
      buyRate: rate.buyRate.toString(),
      sellRate: rate.sellRate.toString(),
      stockAmount: rate.stockAmount.toString(),
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingCode(null);
    setEditState(null);
  };

  const saveEdit = async () => {
    if (!editState) return;
    setSaving(true);
    try {
      const res = await fetch('/api/rates/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currencyCode: editState.currencyCode,
          buyRate: parseFloat(editState.buyRate),
          sellRate: parseFloat(editState.sellRate),
          stockAmount: parseFloat(editState.stockAmount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg(`✓ Kurs ${editState.currencyCode} berhasil diperbarui`);
        cancelEdit();
        fetchRates();
      } else {
        showMsg(data.error || 'Gagal menyimpan', true);
      }
    } catch {
      showMsg('Koneksi gagal', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/rates/${code}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showMsg(`✓ Mata uang ${code} berhasil dihapus`);
        setDeleteConfirm(null);
        fetchRates();
      } else {
        showMsg(data.error || 'Gagal menghapus', true);
      }
    } catch {
      showMsg('Koneksi gagal', true);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!addState.currencyCode || !addState.currencyName || !addState.buyRate || !addState.sellRate) {
      showMsg('Lengkapi semua field wajib', true);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currencyCode: addState.currencyCode.toUpperCase(),
          currencyName: addState.currencyName,
          buyRate: parseFloat(addState.buyRate),
          sellRate: parseFloat(addState.sellRate),
          stockAmount: parseFloat(addState.stockAmount || '0'),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg(`✓ Mata uang ${addState.currencyCode.toUpperCase()} berhasil ditambahkan`);
        setAddState(EMPTY_ADD);
        setShowAddForm(false);
        fetchRates();
      } else {
        showMsg(data.error || 'Gagal menambahkan', true);
      }
    } catch {
      showMsg('Koneksi gagal', true);
    } finally {
      setSaving(false);
    }
  };

  const adjustRate = (field: 'buyRate' | 'sellRate', dir: 'up' | 'down') => {
    if (!editState) return;
    const cur = parseFloat(editState[field]) || 0;
    const step = cur > 1000 ? 50 : cur > 100 ? 5 : 0.5;
    const next = dir === 'up' ? cur + step : Math.max(0, cur - step);
    setEditState({ ...editState, [field]: next.toFixed(2) });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-lg text-slate-900">Manajemen Kurs & Mata Uang</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tambah, edit, atau hapus mata uang yang tersedia untuk transaksi nasabah.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRates}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          </button>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setEditingCode(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Mata Uang
          </button>
        </div>
      </div>

      {/* Notification */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <Check className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-5 space-y-4">
          <h3 className="font-bold text-sm text-indigo-900 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tambah Mata Uang Baru
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Kode Mata Uang *</label>
              <input
                type="text"
                maxLength={5}
                placeholder="USD"
                value={addState.currencyCode}
                onChange={(e) => setAddState({ ...addState, currencyCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Nama Mata Uang *</label>
              <input
                type="text"
                placeholder="US Dollar"
                value={addState.currencyName}
                onChange={(e) => setAddState({ ...addState, currencyName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Kurs Beli (IDR) *</label>
              <input
                type="number"
                placeholder="15850"
                value={addState.buyRate}
                onChange={(e) => setAddState({ ...addState, buyRate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Kurs Jual (IDR) *</label>
              <input
                type="number"
                placeholder="16050"
                value={addState.sellRate}
                onChange={(e) => setAddState({ ...addState, sellRate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Stok Awal</label>
              <input
                type="number"
                placeholder="0"
                value={addState.stockAmount}
                onChange={(e) => setAddState({ ...addState, stockAmount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Menyimpan...' : 'Simpan Mata Uang'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddState(EMPTY_ADD); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Rates Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-bold text-slate-600">MATA UANG</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-600">KURS BELI (IDR)</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-600">KURS JUAL (IDR)</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-600">STOK</th>
                  <th className="px-4 py-3 text-right font-bold text-slate-600">DIPERBARUI</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-600">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rates.map((rate) => (
                  <tr key={rate.currencyCode} className="hover:bg-slate-50 transition">
                    {editingCode === rate.currencyCode && editState ? (
                      // Edit row
                      <>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900">{rate.currencyCode}</p>
                              <p className="text-[10px] text-slate-500">{rate.currencyName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={editState.buyRate}
                              onChange={(e) => setEditState({ ...editState, buyRate: e.target.value })}
                              className="w-24 px-2 py-1.5 rounded-lg border border-indigo-300 bg-white text-right font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            <div className="flex flex-col gap-0.5">
                              <button onClick={() => adjustRate('buyRate', 'up')} className="w-5 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button onClick={() => adjustRate('buyRate', 'down')} className="w-5 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={editState.sellRate}
                              onChange={(e) => setEditState({ ...editState, sellRate: e.target.value })}
                              className="w-24 px-2 py-1.5 rounded-lg border border-indigo-300 bg-white text-right font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            <div className="flex flex-col gap-0.5">
                              <button onClick={() => adjustRate('sellRate', 'up')} className="w-5 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button onClick={() => adjustRate('sellRate', 'down')} className="w-5 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={editState.stockAmount}
                            onChange={(e) => setEditState({ ...editState, stockAmount: e.target.value })}
                            className="w-24 ml-auto block px-2 py-1.5 rounded-lg border border-indigo-300 bg-white text-right font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400">—</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              Simpan
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // Display row
                      <>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900">{rate.currencyCode}</p>
                              <p className="text-[10px] text-slate-500">{rate.currencyName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          {rate.buyRate?.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          {rate.sellRate?.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${rate.stockAmount < 1000 ? 'text-red-600' : 'text-slate-700'}`}>
                            {rate.stockAmount?.toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 text-[10px]">
                          {new Date(rate.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => startEdit(rate)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition cursor-pointer"
                              title="Edit kurs"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                            {deleteConfirm === rate.currencyCode ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(rate.currencyCode)}
                                  disabled={saving}
                                  className="px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold transition cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold transition cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(rate.currencyCode)}
                                className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition cursor-pointer"
                                title="Hapus mata uang"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700">
          <strong>Perhatian:</strong> Perubahan kurs akan langsung berlaku untuk seluruh transaksi baru. Perubahan kurs tidak berlaku retroaktif untuk transaksi yang sudah dikunci.
        </p>
      </div>
    </div>
  );
}
