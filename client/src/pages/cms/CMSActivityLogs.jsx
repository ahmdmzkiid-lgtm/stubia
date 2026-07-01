import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';

export default function CMSActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [targetFilter, setTargetFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await adminService.getActivityLogs({ page, limit: 15 });
      if (response.data && response.data.success) {
        setLogs(response.data.data.items);
        setTotalPages(response.data.data.totalPages);
        setTotalItems(response.data.data.total);
      } else {
        toast.error('Gagal mengambil data log aktivitas');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat memuat log aktivitas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleClearLogs = async () => {
    try {
      const response = await adminService.clearActivityLogs();
      if (response.data && response.data.success) {
        toast.success('Semua log aktivitas admin berhasil dibersihkan');
        setPage(1);
        fetchLogs();
        setShowConfirmClear(false);
      } else {
        toast.error('Gagal membersihkan log');
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat membersihkan log');
    }
  };

  // Filter logs locally
  const filteredLogs = logs.filter(log => {
    const matchAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchTarget = targetFilter === 'ALL' || log.target_type === targetFilter;
    return matchAction && matchTarget;
  });

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return 'add_circle';
      case 'UPDATE':
        return 'edit_square';
      case 'DELETE':
        return 'delete_forever';
      default:
        return 'info';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-[#191b24] tracking-tight">Aktivitas Admin</h1>
          <p className="text-[14px] text-[#727687] font-semibold mt-1">Pantau seluruh riwayat aksi CRUD, pengelolaan paket, soal, tryout, dan artikel</p>
        </div>
        {totalItems > 0 && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100/80 text-red-600 font-bold text-[13px] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            <span>Hapus Semua Log</span>
          </button>
        )}
      </div>

      {/* Filter Options */}
      <div className="bg-white rounded-2xl border border-[#c2c6d8]/40 p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          {/* Action Filter */}
          <div className="space-y-2">
            <span className="block text-[11px] font-bold text-[#727687] uppercase tracking-wider">Aksi Admin</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: 'ALL', label: 'Semua Aksi' },
                { value: 'CREATE', label: 'Tambah (CREATE)' },
                { value: 'UPDATE', label: 'Ubah (UPDATE)' },
                { value: 'DELETE', label: 'Hapus (DELETE)' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setActionFilter(opt.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold transition-all border ${
                    actionFilter === opt.value
                      ? 'bg-[#0050cb] border-[#0050cb] text-white shadow-sm shadow-[#0050cb]/10'
                      : 'bg-white border-[#c2c6d8]/40 text-[#424656] hover:bg-[#f2f3ff]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Type Filter */}
          <div className="space-y-2">
            <span className="block text-[11px] font-bold text-[#727687] uppercase tracking-wider">Kategori Target</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { value: 'ALL', label: 'Semua Kategori' },
                { value: 'SOAL', label: 'Soal' },
                { value: 'PAKET_TRYOUT', label: 'Paket' },
                { value: 'TRYOUT', label: 'Tryout' },
                { value: 'ARTIKEL', label: 'Artikel' },
                { value: 'KARIR', label: 'Karir' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTargetFilter(opt.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold transition-all border ${
                    targetFilter === opt.value
                      ? 'bg-[#0050cb] border-[#0050cb] text-white shadow-sm shadow-[#0050cb]/10'
                      : 'bg-white border-[#c2c6d8]/40 text-[#424656] hover:bg-[#f2f3ff]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white rounded-2xl border border-[#c2c6d8]/40 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-3 border-[#0050cb] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[14px] text-[#727687] font-semibold">Memuat log aktivitas...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-20 text-center">
            <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">history</span>
            <h3 className="text-[16px] font-extrabold text-[#191b24]">Tidak ada log ditemukan</h3>
            <p className="text-[14px] text-[#727687] max-w-sm mx-auto mt-1">Belum ada aktivitas admin yang tercatat atau tidak ada log yang cocok dengan filter Anda.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#c2c6d8]/30">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-5 sm:p-6 hover:bg-[#f9faff]/40 transition-colors flex flex-col md:flex-row md:items-start gap-4">
                {/* Action Badge */}
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-extrabold uppercase tracking-wide ${getActionColor(log.action)}`}>
                    <span className="material-symbols-outlined text-[15px]">{getActionIcon(log.action)}</span>
                    {log.action}
                  </span>
                </div>

                {/* Log Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-extrabold text-[#191b24]">{log.admin_name}</span>
                      <span className="text-[12px] font-semibold text-[#727687]">({log.admin_email})</span>
                    </div>
                    <span className="text-[12px] text-[#727687] font-bold">{formatDate(log.created_at)}</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[14px] text-[#424656] leading-relaxed">
                      {log.details}
                    </p>
                    <div className="flex items-center gap-1 text-[12px] font-bold text-[#0050cb]">
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#0050cb] border border-blue-100 text-[10px] uppercase font-extrabold">
                        {log.target_type}
                      </span>
                      <span className="text-[#424656] truncate max-w-lg font-semibold">{log.target_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer/Pagination */}
        {!loading && totalPages > 1 && (
          <div className="bg-[#faf8ff]/50 px-6 py-4 border-t border-[#c2c6d8]/30 flex items-center justify-between">
            <span className="text-[13px] text-[#727687] font-semibold">
              Menampilkan {filteredLogs.length} log dari {totalItems} total aktivitas
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-[#c2c6d8]/40 hover:bg-[#f2f3ff] transition-all disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px] block">chevron_left</span>
              </button>
              <span className="text-[13px] font-bold text-[#191b24] px-2">
                Halaman {page} dari {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-[#c2c6d8]/40 hover:bg-[#f2f3ff] transition-all disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <span className="material-symbols-outlined text-[20px] block">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmClear(false)}></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#c2c6d8]/30 space-y-6 animate-scaleIn">
            <div className="flex items-center gap-3 text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[32px]">warning</span>
              <h3 className="text-[18px] font-extrabold text-[#191b24]">Konfirmasi Hapus</h3>
            </div>
            <p className="text-[14px] text-[#424656] leading-relaxed">
              Apakah Anda yakin ingin menghapus seluruh log aktivitas admin? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 rounded-xl text-[13px] font-bold text-[#424656] hover:bg-[#f2f3ff] transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 rounded-xl text-[13px] font-bold bg-[#ba1a1a] text-white hover:bg-[#ba1a1a]/95 transition-all shadow-sm"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
