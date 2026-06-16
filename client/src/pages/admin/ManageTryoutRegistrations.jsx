import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';

const ManageTryoutRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(''); // '' for all, 'pending', 'approved', 'rejected'
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });
  
  // Lightbox and Reject Modal states
  const [selectedImage, setSelectedImage] = useState(null);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
      };
      const res = await adminService.getTryoutRegistrations(params);
      setRegistrations(res.data.data.registrations || []);
      setPagination(res.data.data.pagination || { total: 0, totalPages: 1, limit: 10 });
    } catch (err) {
      toast.error('Gagal memuat data pendaftaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [page, statusFilter]);

  const handleApprove = async (id) => {
    if (submittingAction) return;
    setSubmittingAction(true);
    try {
      await adminService.updateTryoutRegistration(id, { status: 'approved' });
      toast.success('Pendaftaran berhasil disetujui');
      fetchRegistrations();
    } catch (err) {
      // Handled by axios interceptor
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Masukkan alasan penolakan');
      return;
    }
    setSubmittingAction(true);
    try {
      await adminService.updateTryoutRegistration(rejectingItem.id, {
        status: 'rejected',
        rejection_reason: rejectionReason,
      });
      toast.success('Pendaftaran berhasil ditolak');
      setRejectingItem(null);
      setRejectionReason('');
      fetchRegistrations();
    } catch (err) {
      // Handled by axios interceptor
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSubmittingAction(true);
    try {
      await adminService.deleteTryoutRegistration(deletingItem.id);
      toast.success('Pendaftaran berhasil dihapus');
      setDeletingItem(null);
      fetchRegistrations();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal menghapus pendaftaran';
      toast.error(errorMsg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border border-red-200';
      default:
        return 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse';
    }
  };

  const getPlatformBadge = (platform) => {
    if (platform === 'instagram') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #fce7f3, #fdf2f8)', color: '#C13584', border: '1px solid #f9a8d4' }}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
          Instagram
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}>
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        X (Twitter)
      </span>
    );
  };

  // Helper to get screenshot URLs with fallback for old data
  const getScreenshots = (reg) => {
    const followUrl = reg.screenshot_follow_url || reg.screenshot_url;
    const repostUrl = reg.screenshot_repost_url;
    return { followUrl, repostUrl };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Page Header */}
      <div>
        <h1 className="text-[32px] font-bold text-[#191b24] mb-2 leading-tight">Verifikasi Pendaftaran Tryout</h1>
        <p className="text-[#424656] text-[16px]">Tinjau dan verifikasi bukti screenshot pendaftaran tryout dari pengguna Free Plan.</p>
      </div>

      {/* Filters Tab Bar */}
      <div className="bg-white p-2 rounded-2xl border border-[#c2c6d8]/30 flex flex-wrap gap-2 shadow-sm">
        {[
          { label: 'Semua', value: '' },
          { label: 'Menunggu Verifikasi', value: 'pending' },
          { label: 'Disetujui', value: 'approved' },
          { label: 'Ditolak', value: 'rejected' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-5 py-2.5 rounded-xl font-bold text-[14px] transition-all ${
              statusFilter === tab.value
                ? 'bg-[#0050cb] text-white shadow-md shadow-[#0050cb]/15'
                : 'text-[#424656] hover:bg-[#e6e7f4]/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-[#c2c6d8]/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined animate-spin text-[48px] text-[#0050cb]">progress_activity</span>
            <p className="mt-4 text-[#727687] font-medium">Memuat pendaftaran...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="py-24 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#c2c6d8] mb-3">verified</span>
            <p className="text-[#727687] font-medium">Tidak ada pendaftaran ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f2f3ff]/50 border-b border-[#c2c6d8]/20">
                  <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">Pengguna</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">Email & Platform</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">Paket Tryout</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">SS Follow</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">SS Repost</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c2c6d8]/10">
                {registrations.map((reg) => {
                  const { followUrl, repostUrl } = getScreenshots(reg);
                  return (
                    <tr key={reg.id} className="hover:bg-[#f2f3ff]/20 transition-colors">
                      {/* User */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0050cb]/10 text-[#0050cb] font-bold flex items-center justify-center">
                            {reg.user_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[15px] text-[#191b24]">{reg.user_name}</p>
                            <p className="text-[12px] text-[#727687]">{reg.user_email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Email + Platform */}
                      <td className="px-6 py-5">
                        <span className="text-[14px] text-[#191b24] font-medium block mb-1">{reg.contact_email}</span>
                        {getPlatformBadge(reg.platform || 'instagram')}
                      </td>

                      {/* Tryout Package */}
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-bold text-[14px] text-[#191b24]">{reg.package_title}</p>
                          <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 mt-0.5 rounded-full ${
                            reg.package_type === 'utbk' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                          }`}>
                            {reg.package_type === 'utbk' ? 'UTBK' : 'Ujian Mandiri'}
                          </span>
                        </div>
                      </td>

                      {/* Screenshot Follow */}
                      <td className="px-6 py-5">
                        {followUrl ? (
                          <div 
                            className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#c2c6d8]/50 cursor-zoom-in hover:scale-105 transition-transform"
                            onClick={() => setSelectedImage(followUrl)}
                          >
                            <img src={followUrl} alt="Follow proof" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5">FOLLOW</div>
                          </div>
                        ) : (
                          <span className="text-xs text-[#c2c6d8]">—</span>
                        )}
                      </td>

                      {/* Screenshot Repost */}
                      <td className="px-6 py-5">
                        {repostUrl ? (
                          <div 
                            className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#c2c6d8]/50 cursor-zoom-in hover:scale-105 transition-transform"
                            onClick={() => setSelectedImage(repostUrl)}
                          >
                            <img src={repostUrl} alt="Repost proof" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] font-bold text-center py-0.5">REPOST</div>
                          </div>
                        ) : (
                          <span className="text-xs text-[#c2c6d8]">—</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-5">
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusBadgeClass(reg.status)}`}>
                            {reg.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                            {reg.status === 'approved' ? 'Disetujui' : reg.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                          </span>
                          {reg.status === 'rejected' && reg.rejection_reason && (
                            <p className="text-xs text-red-500 mt-1 max-w-[180px] truncate" title={reg.rejection_reason}>
                              Reason: {reg.rejection_reason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          {reg.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApprove(reg.id)}
                                disabled={submittingAction}
                                className="w-10 h-10 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-all border border-green-200"
                                title="Setujui"
                              >
                                <span className="material-symbols-outlined text-[20px] font-bold">check</span>
                              </button>
                              <button
                                onClick={() => setRejectingItem(reg)}
                                disabled={submittingAction}
                                className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all border border-red-200"
                                title="Tolak"
                              >
                                <span className="material-symbols-outlined text-[20px] font-bold">close</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeletingItem(reg)}
                              disabled={submittingAction}
                              className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all border border-red-200"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[20px] font-bold">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-8 py-5 border-t border-[#c2c6d8]/20 flex justify-between items-center bg-[#faf8ff]/50">
            <span className="text-sm font-medium text-[#424656]">
              Menampilkan {registrations.length} dari {pagination.total} pendaftaran
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#c2c6d8]/30 text-[#424656] disabled:opacity-50 hover:bg-[#e6e7f4]/40 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="text-sm font-bold text-[#191b24] px-3">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#c2c6d8]/30 text-[#424656] disabled:opacity-50 hover:bg-[#e6e7f4]/40 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Lightbox Modal ── */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
          <img 
            src={selectedImage} 
            alt="Proof enlarged" 
            className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Reject Reason Modal ── */}
      {rejectingItem && (
        <div 
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRejectingItem(null)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-red-600 px-6 py-4 flex items-center gap-3 text-white">
              <span className="material-symbols-outlined">warning</span>
              <h3 className="font-bold text-lg">Tolak Bukti Pendaftaran</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#424656]">
                Berikan alasan penolakan agar <strong>{rejectingItem.user_name}</strong> dapat memperbaiki bukti pendaftaran mereka.
              </p>
              
              {/* Show submitted screenshots for reference */}
              {(() => {
                const { followUrl, repostUrl } = getScreenshots(rejectingItem);
                return (followUrl || repostUrl) ? (
                  <div className="flex gap-3">
                    {followUrl && (
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-[#727687] uppercase mb-1">SS Follow</p>
                        <img src={followUrl} alt="Follow" className="w-full h-20 object-cover rounded-lg border border-[#c2c6d8]/30" />
                      </div>
                    )}
                    {repostUrl && (
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-[#727687] uppercase mb-1">SS Repost</p>
                        <img src={repostUrl} alt="Repost" className="w-full h-20 object-cover rounded-lg border border-[#c2c6d8]/30" />
                      </div>
                    )}
                  </div>
                ) : null;
              })()}

              <div>
                <label className="text-xs font-bold text-[#727687] uppercase tracking-wider block mb-1.5">Alasan Penolakan</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Misalnya: Screenshot tidak menampilkan postingan terbaru atau buram."
                  rows={4}
                  className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all placeholder:text-gray-400 bg-gray-50 border-[#c2c6d8]"
                  disabled={submittingAction}
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-[#c2c6d8]/10">
              <button
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 text-sm font-semibold hover:bg-gray-150 rounded-lg text-gray-600 transition-all"
                disabled={submittingAction}
              >
                Batal
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-md shadow-red-600/10 flex items-center gap-1.5 transition-all disabled:opacity-50"
                disabled={submittingAction || !rejectionReason.trim()}
              >
                {submittingAction ? 'Memproses...' : 'Tolak Pendaftaran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deletingItem && (
        <div 
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDeletingItem(null)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px] text-red-600">delete_forever</span>
              </div>
              <h3 className="text-lg font-bold text-[#191b24] mb-2">Hapus Pendaftaran?</h3>
              <p className="text-sm text-[#727687]">
                Pendaftaran dari <strong>{deletingItem.user_name}</strong> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-[#c2c6d8]/10">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-sm font-semibold hover:bg-gray-150 rounded-lg text-gray-600 transition-all"
                disabled={submittingAction}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-md shadow-red-600/10 flex items-center gap-1.5 transition-all disabled:opacity-50"
                disabled={submittingAction}
              >
                {submittingAction ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTryoutRegistrations;
