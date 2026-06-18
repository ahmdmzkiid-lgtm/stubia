import React, { useState, useEffect } from 'react';
import { voucherService } from '../../services/api';
import toast from 'react-hot-toast';

export default function ManageVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase: '',
    max_discount: '',
    expires_at: '',
    usage_limit: ''
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await voucherService.list();
      setVouchers(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleOpenAddModal = () => {
    // Set default expiration date to 30 days from now
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const dateString = nextMonth.toISOString().slice(0, 16); // format: YYYY-MM-DDTHH:mm

    setForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase: 0,
      max_discount: '',
      expires_at: dateString,
      usage_limit: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount_type || form.discount_value === '' || !form.expires_at) {
      toast.error('Kolom bertanda bintang (*) wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...form,
        discount_value: parseInt(form.discount_value, 10),
        min_purchase: parseInt(form.min_purchase, 10) || 0,
        max_discount: form.max_discount ? parseInt(form.max_discount, 10) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
      };

      const res = await voucherService.create(payload);
      if (res.data?.success) {
        toast.success('Voucher diskon berhasil dibuat!');
        setShowModal(false);
        fetchVouchers();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Gagal menyimpan voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus voucher ini?')) {
      return;
    }

    try {
      setLoading(true);
      const res = await voucherService.delete(id);
      if (res.data?.success) {
        toast.success('Voucher berhasil dihapus!');
        fetchVouchers();
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus voucher');
    } finally {
      setLoading(false);
    }
  };

  const labelCls = "block text-[13px] font-bold text-[#191b24] mb-2";
  const inputCls = "w-full bg-[#f2f3ff]/50 border border-[#c2c6d8]/40 rounded-xl px-4 py-3 text-[14px] text-[#191b24] focus:outline-none focus:border-[#0050cb] focus:bg-white transition-all placeholder:text-[#727687]";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[28px] lg:text-[32px] font-bold text-[#191b24]">Voucher Diskon</h2>
          <p className="text-[14px] text-[#424656] mt-1">Kelola dan generate voucher diskon belajar untuk digunakan siswa dihalaman checkout</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2 shadow-[0_8px_16px_-6px_rgba(0,80,203,0.3)]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Buat Voucher Baru
        </button>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-3xl border border-[#c2c6d8]/30 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f3ff]/50 border-b border-[#c2c6d8]/30">
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider">Kode Voucher</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider">Potongan Diskon</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider">Min. Transaksi</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider">Maks. Potongan</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider">Kedaluwarsa</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider">Kuota Terpakai</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider w-24 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c2c6d8]/20">
              {loading && vouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-[#727687]">
                    <span className="material-symbols-outlined animate-spin text-[32px] text-[#0050cb] mb-2">progress_activity</span>
                    <p className="text-[14px]">Memuat data...</p>
                  </td>
                </tr>
              ) : vouchers.length > 0 ? (
                vouchers.map((v) => {
                  const isExpired = new Date(v.expires_at) < new Date();
                  return (
                    <tr key={v.id} className="hover:bg-[#fcf9f8] transition-colors">
                      <td className="px-6 py-4 font-bold text-[14px] text-[#0050cb] tracking-wide">
                        {v.code}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#191b24] font-semibold">
                        {v.discount_type === 'percentage' 
                          ? `${v.discount_value}%` 
                          : `Rp${v.discount_value.toLocaleString('id-ID')}`
                        }
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#424656]">
                        Rp{v.min_purchase.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#424656]">
                        {v.max_discount ? `Rp${v.max_discount.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-[14px]">
                        <span className={`font-medium ${isExpired ? 'text-red-500' : 'text-gray-700'}`}>
                          {new Date(v.expires_at).toLocaleString('id-ID')}
                        </span>
                        {isExpired && (
                          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">Expired</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#424656]">
                        <strong>{v.usage_count}</strong> / {v.usage_limit || '∞'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="w-9 h-9 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white transition-all mx-auto"
                          title="Hapus"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[#727687]">
                    <span className="material-symbols-outlined text-[48px] text-[#c2c6d8] mb-2">confirmation_number</span>
                    <p className="text-[14px]">Belum ada voucher diskon dibuat</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Voucher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-[#191b24]">Buat Voucher Baru</h3>
              <button type="button" onClick={() => setShowModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelCls}>Kode Voucher *</label>
                <input
                  className={inputCls + " uppercase tracking-widest font-bold"}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. PROMO20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tipe Diskon *</label>
                  <select
                    className={inputCls}
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value, discount_value: '', max_discount: '' })}
                    required
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Rupiah (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Nilai Diskon *</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === 'percentage' ? 'e.g. 25' : 'e.g. 15000'}
                    required
                    min="1"
                    max={form.discount_type === 'percentage' ? "100" : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Min. Transaksi</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.min_purchase}
                    onChange={(e) => setForm({ ...form, min_purchase: e.target.value })}
                    placeholder="e.g. 30000"
                    min="0"
                  />
                </div>
                <div>
                  <label className={labelCls}>Maks. Potongan (Rp)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.max_discount}
                    onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                    placeholder="Kosongkan jika tak terbatas"
                    disabled={form.discount_type === 'fixed'}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Kedaluwarsa *</label>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Kuota Penggunaan</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={form.usage_limit}
                    onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                    placeholder="Kosongkan jika tak terbatas"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-[#c2c6d8]/20">
                <button type="submit" disabled={loading} className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2 disabled:opacity-50 flex-1 justify-center">
                  {loading ? (
                    <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Menyimpan...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">save</span> Buat Voucher</>
                  )}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="border border-[#c2c6d8]/40 text-[#424656] px-5 py-3 rounded-xl font-bold text-[14px] hover:bg-[#f2f3ff] transition-all">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
