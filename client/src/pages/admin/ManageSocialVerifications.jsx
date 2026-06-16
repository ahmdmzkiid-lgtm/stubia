import { useState, useEffect } from 'react';
import { socialService } from '../../services/api';
import toast from 'react-hot-toast';

export default function ManageSocialVerifications() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let res;
      if (statusFilter === '' || statusFilter === 'pending') {
        // For 'all' and 'pending', use appropriate endpoints
        if (statusFilter === 'pending') {
          res = await socialService.listPending();
        } else {
          res = await socialService.listAll();
        }
      } else {
        res = await socialService.listAll(statusFilter);
      }
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error('Gagal memuat permintaan verifikasi sosial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    if (submittingAction) return;
    setSubmittingAction(true);
    try {
      await socialService.reviewRequest(id, { action: 'approve' });
      toast.success('Permintaan verifikasi disetujui');
      fetchRequests();
    } catch (err) {
      // handled by interceptor
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
      await socialService.reviewRequest(rejectingItem.id, {
        action: 'reject',
        rejection_reason: rejectionReason,
      });
      toast.success('Permintaan verifikasi berhasil ditolak');
      setRejectingItem(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err) {
      // handled by interceptor
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setSubmittingAction(true);
    try {
      await socialService.deleteRequest(deletingItem.id);
      toast.success('Verifikasi berhasil dihapus');
      setDeletingItem(null);
      fetchRequests();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal menghapus verifikasi';
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-[32px] font-bold text-[#191b24] mb-2 leading-tight">Verifikasi Media Sosial Latihan</h1>
        <p className="text-[#424656] text-[16px]">Tinjau dan verifikasi username IG/X yang dimasukkan oleh pengguna Free Plan untuk akses latihan soal.</p>
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
            onClick={() => setStatusFilter(tab.value)}
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

      <div className="bg-white rounded-3xl border border-[#c2c6d8]/30 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#727687]">
            <div className="w-10 h-10 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-semibold text-sm">Memuat data permintaan...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-[#727687]">
            <span className="material-symbols-outlined text-[48px] mb-2 text-[#cbd5e1]">check_circle</span>
            <p className="font-semibold text-sm">
              {statusFilter === 'pending' ? 'Tidak ada permintaan verifikasi yang pending' :
               statusFilter === 'approved' ? 'Tidak ada verifikasi yang disetujui' :
               statusFilter === 'rejected' ? 'Tidak ada verifikasi yang ditolak' :
               'Tidak ada data verifikasi'}
            </p>
            <p className="text-xs">
              {statusFilter === 'pending' ? 'Semua permintaan telah selesai diproses.' : 'Belum ada data untuk ditampilkan.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#c2c6d8]/20 bg-[#faf8ff] text-[#424656] font-bold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">Nama Pengguna</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Username Instagram</th>
                  <th className="px-6 py-4">Username X</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tanggal Diajukan</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c2c6d8]/10 text-sm">
                {requests.map((item) => (
                  <tr key={item.id} className="hover:bg-[#faf8ff]/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#191b24]">{item.user_name}</td>
                    <td className="px-6 py-4 text-[#424656]">{item.user_email}</td>
                    <td className="px-6 py-4 font-mono text-[#0050cb]">
                      {item.ig_username ? `@${item.ig_username.replace(/^@/, '')}` : '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-[#0050cb]">
                      {item.x_username ? `@${item.x_username.replace(/^@/, '')}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusBadgeClass(item.status)}`}>
                          {item.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                          {item.status === 'approved' ? 'Disetujui' : item.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                        {item.status === 'rejected' && item.rejection_reason && (
                          <p className="text-xs text-red-500 mt-1 max-w-[180px] truncate" title={item.rejection_reason}>
                            {item.rejection_reason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#727687]">
                      {new Date(item.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {item.status === 'pending' ? (
                          <>
                            <button
                              disabled={submittingAction}
                              onClick={() => setRejectingItem(item)}
                              className="px-3.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition"
                            >
                              Tolak
                            </button>
                            <button
                              disabled={submittingAction}
                              onClick={() => handleApprove(item.id)}
                              className="px-3.5 py-1.5 rounded-lg bg-[#0050cb] hover:bg-[#003da6] text-white text-xs font-semibold shadow transition"
                            >
                              Setujui
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeletingItem(item)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRejectingItem(null)} />
          <div 
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#191b24] mb-2">Tolak Permintaan Verifikasi</h3>
            <p className="text-xs text-[#727687] mb-4">Berikan alasan mengapa permintaan ini ditolak. Alasan ini akan ditampilkan kepada user.</p>
            <textarea
              className="w-full rounded-xl border border-[#c2c6d8] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050cb]"
              rows={4}
              placeholder="Alasan penolakan..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                className="flex-1 py-2.5 border border-[#e5e7eb] rounded-xl text-sm font-semibold text-[#424656] hover:bg-gray-50 transition"
                onClick={() => {
                  setRejectingItem(null);
                  setRejectionReason('');
                }}
              >
                Batal
              </button>
              <button
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                onClick={handleRejectSubmit}
                disabled={submittingAction}
              >
                Tolak Permintaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div 
          className="fixed inset-0 z-[12000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
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
              <h3 className="text-lg font-bold text-[#191b24] mb-2">Hapus Verifikasi?</h3>
              <p className="text-sm text-[#727687]">
                Verifikasi dari <strong>{deletingItem.user_name}</strong> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
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
}
