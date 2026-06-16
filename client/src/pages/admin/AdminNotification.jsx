import React, { useState, useEffect } from 'react';
import { notificationService, adminService, uploadService } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminNotification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  
  const [form, setForm] = useState({
    title: '',
    message: '',
    image_url: '',
    target_user_id: ''
  });
  const [imageFile, setImageFile] = useState(null);

  const templates = [
    {
      label: "Support Dev (Sosmed)",
      title: "Dukung Pengembangan Eduzet! 🚀",
      message: "Halo! Bantu kami terus mengembangkan fitur-fitur keren di Eduzet dengan cara follow sosial media kami. Dukungan kamu sangat berarti bagi developer! ❤️\n\n[IG] [X]",
      image_url: ""
    }
  ];

  const handleApplyTemplate = (tpl) => {
    setForm(prev => ({ ...prev, title: tpl.title, message: tpl.message, image_url: tpl.image_url }));
    setImageFile(null);
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getHistory();
      setNotifications(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil riwayat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await adminService.getUsers({ limit: 1000 });
        setUsers(res.data?.data?.users || []);
      } catch (err) {
        console.error('Gagal mengambil daftar pengguna', err);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let finalImageUrl = form.image_url;
      
      if (imageFile) {
        const uploadRes = await uploadService.uploadImage(imageFile, 'notifications');
        finalImageUrl = uploadRes.data.data.url;
      }
      
      await notificationService.send({ ...form, image_url: finalImageUrl });
      toast.success('Notifikasi berhasil dikirim!');
      setShowModal(false);
      setForm({ title: '', message: '', image_url: '', target_user_id: '' });
      setImageFile(null);
      fetchHistory();
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengirim notifikasi');
    } finally {
      setLoading(false);
    }
  };

  const labelCls = "block text-[13px] font-bold text-[#191b24] mb-2";
  const inputCls = "w-full bg-[#f2f3ff]/50 border border-[#c2c6d8]/40 rounded-xl px-4 py-3 text-[14px] text-[#191b24] focus:outline-none focus:border-[#0050cb] focus:bg-white transition-all placeholder:text-[#727687]";

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[28px] lg:text-[32px] font-bold text-[#191b24]">Blast Notifikasi</h2>
          <p className="text-[14px] text-[#424656] mt-1">Kirim pengumuman atau promo ke semua user</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2 shadow-[0_8px_16px_-6px_rgba(0,80,203,0.3)]"
        >
          <span className="material-symbols-outlined text-[18px]">campaign</span>
          Kirim Baru
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#c2c6d8]/30 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f3ff]/50 border-b border-[#c2c6d8]/30">
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider">Judul / Pesan</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider">Gambar</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider">Terkirim Ke</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c2c6d8]/20">
              {loading && notifications.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-[#727687]">
                    <span className="material-symbols-outlined animate-spin text-[32px] text-[#0050cb] mb-2">progress_activity</span>
                    <p className="text-[14px]">Memuat data...</p>
                  </td>
                </tr>
              ) : notifications.length > 0 ? (
                notifications.map((notif, idx) => (
                  <tr key={idx} className="hover:bg-[#fcf9f8] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[14px] text-[#191b24] mb-1">{notif.title}</div>
                      <div className="text-[13px] text-[#424656] line-clamp-2 max-w-md">{notif.message}</div>
                    </td>
                    <td className="px-6 py-4">
                      {notif.image_url ? (
                        <a href={notif.image_url} target="_blank" rel="noreferrer" className="text-[#0050cb] hover:underline text-[13px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">image</span> Lihat
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[12px] font-bold">
                        <span className="material-symbols-outlined text-[14px]">group</span>
                        {notif.recipient_count} user
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[#727687]">
                      {new Date(notif.sent_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-[#727687]">
                    <span className="material-symbols-outlined text-[48px] text-[#c2c6d8] mb-2">campaign</span>
                    <p className="text-[14px]">Belum ada riwayat notifikasi</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-[#191b24]">Kirim Notifikasi Baru</h3>
              <button type="button" onClick={() => setShowModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4 bg-[#f2f3ff] p-4 rounded-xl border border-[#c2c6d8]/30">
                <label className="block text-[12px] font-bold text-[#0050cb] uppercase tracking-wider mb-3">Template Cepat:</label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((tpl, i) => (
                    <button key={i} type="button" onClick={() => handleApplyTemplate(tpl)} className="px-4 py-2 rounded-lg bg-white border border-[#c2c6d8] text-[13px] font-bold text-[#424656] hover:bg-[#0050cb] hover:text-white hover:border-[#0050cb] transition-all shadow-sm">
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Judul *</label>
                <input 
                  className={inputCls} 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  placeholder="e.g. Diskon 50% Akhir Tahun!" 
                  required 
                />
              </div>
              
              <div>
                <label className={labelCls}>Pesan *</label>
                <textarea 
                  className={inputCls + ' min-h-[120px] resize-y'} 
                  value={form.message} 
                  onChange={(e) => setForm({ ...form, message: e.target.value })} 
                  placeholder="Tulis pesan lengkap di sini. Pesan ini akan muncul di popup modal dan list notifikasi." 
                  required 
                />
              </div>
              
              <div>
                <label className={labelCls}>Upload Gambar (Opsional)</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="flex-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  {imageFile && (
                    <button type="button" onClick={() => setImageFile(null)} className="text-red-500 text-[13px] hover:underline whitespace-nowrap">
                      Hapus
                    </button>
                  )}
                </div>
                {!imageFile && (
                  <input 
                    className={inputCls + " mt-2"} 
                    value={form.image_url} 
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })} 
                    placeholder="Atau masukkan URL gambar https://..." 
                  />
                )}
                <p className="text-[11px] text-[#727687] mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Gambar ini akan ditampilkan besar di dalam popup modal.
                </p>
              </div>

              <div>
                <label className={labelCls}>Target User ID (Opsional)</label>
                <select 
                  className={inputCls} 
                  value={form.target_user_id} 
                  onChange={(e) => setForm({ ...form, target_user_id: e.target.value })} 
                >
                  <option value="">-- Broadcast ke SEMUA user --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-6 border-t border-[#c2c6d8]/20">
                <button type="submit" disabled={loading} className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2 disabled:opacity-50 flex-1 justify-center">
                  {loading ? (
                    <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Mengirim...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">send</span> Kirim Notifikasi</>
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
