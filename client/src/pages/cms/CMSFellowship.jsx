import React, { useState, useEffect } from 'react';
import { fellowshipService, uploadService } from '../../services/api';
import toast from 'react-hot-toast';

export default function CMSFellowship() {
  // ── BUDDIES STATE ──
  const [buddies, setBuddies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    photo_url: '',
    position: 'Question Creator',
    message: ''
  });

  const fetchBuddies = async () => {
    try {
      setLoading(true);
      const res = await fellowshipService.listBuddies();
      setBuddies(res.data.data || []);
    } catch (err) {
      toast.error('Gagal mengambil daftar Buddy & Alumni');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuddies();
  }, []);

  const handleOpenModal = (buddy = null) => {
    if (buddy) {
      setCurrentId(buddy.id);
      setFormData({
        name: buddy.name,
        photo_url: buddy.photo_url,
        position: buddy.position,
        message: buddy.message
      });
    } else {
      setCurrentId(null);
      setFormData({
        name: '',
        photo_url: '',
        position: 'Question Creator',
        message: ''
      });
    }
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Maksimal ukuran foto 2MB');
      return;
    }
    try {
      setPhotoUploading(true);
      const res = await uploadService.uploadPublicImage(file, 'fellowship');
      setFormData(prev => ({ ...prev, photo_url: res.data.data.url }));
      toast.success('Foto berhasil diunggah');
    } catch (err) {
      toast.error('Gagal mengunggah foto');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.photo_url || !formData.message.trim()) {
      toast.error('Semua kolom wajib diisi!');
      return;
    }
    try {
      if (currentId) {
        await fellowshipService.updateBuddy(currentId, formData);
        toast.success('Profil Buddy/Alumni berhasil diperbarui');
      } else {
        await fellowshipService.createBuddy(formData);
        toast.success('Profil Buddy/Alumni baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchBuddies();
    } catch (err) {
      toast.error('Gagal menyimpan profil Buddy');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus profil Buddy/Alumni "${name}"?`)) return;
    try {
      await fellowshipService.deleteBuddy(id);
      toast.success('Profil Buddy/Alumni berhasil dihapus');
      fetchBuddies();
    } catch (err) {
      toast.error('Gagal menghapus profil');
    }
  };

  const filteredBuddies = buddies.filter(buddy =>
    buddy.name.toLowerCase().includes(search.toLowerCase()) ||
    buddy.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-[#c2c6d8]/30 shadow-sm">
        <div>
          <h1 className="text-[20px] font-bold text-[#191b24]">Fellowship Buddy & Alumni Profile</h1>
          <p className="text-[12px] text-[#727687] mt-0.5">Kelola data profil para fellow dan alumni untuk ditampilkan di Landing Page.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#0050cb] hover:bg-[#003fa4] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span> Tambah Buddy / Alumni
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            type="text"
            placeholder="Cari nama atau posisi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0050cb] bg-white text-slate-800"
          />
        </div>
        <button
          onClick={fetchBuddies}
          className="text-xs font-bold text-slate-600 hover:text-[#0050cb] flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span> Segarkan Data
        </button>
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div></div>
      ) : filteredBuddies.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl py-16 text-center shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-slate-300 mb-3">group</span>
          <h3 className="text-slate-700 font-bold text-base">Belum Ada Profil Buddy & Alumni</h3>
          <p className="text-slate-450 text-xs max-w-xs mx-auto mt-1">Tambahkan profil baru untuk dipublikasikan di Landing Page program Fellowship.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredBuddies.map(buddy => (
            <div key={buddy.id} className="bg-white border border-slate-250/50 rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg transition-all">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img src={buddy.photo_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 shadow-sm" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{buddy.name}</h4>
                    <p className="text-[11px] text-[#0050cb] font-bold truncate">{buddy.position}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border italic leading-relaxed">
                  "{buddy.message}"
                </p>
              </div>
              <div className="flex justify-end gap-2.5 mt-4 border-t pt-3">
                <button
                  onClick={() => handleOpenModal(buddy)}
                  className="text-slate-600 hover:text-blue-600 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                </button>
                <button
                  onClick={() => handleDelete(buddy.id, buddy.name)}
                  className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-slate-800 text-base">
                {currentId ? 'Edit Buddy / Alumni' : 'Tambah Buddy / Alumni Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Fellow Batch 1"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#0050cb] bg-white text-slate-850"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Posisi / Peran *</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={e => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Contoh: Quality Assurance"
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#0050cb] bg-white text-slate-855"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Pesan / Kesaksian *</label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Tulis testimoni/kesaksian selama program..."
                  className="w-full px-3.5 py-2.5 border rounded-xl text-sm h-24 resize-none focus:outline-none focus:border-[#0050cb] bg-white text-slate-860"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Foto Profile *</label>
                <div className="flex items-center gap-4">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="" className="w-14 h-14 rounded-full object-cover border" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-dashed">
                      <span className="material-symbols-outlined">image</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#f2f3ff] file:text-[#0050cb] hover:file:bg-[#e2e5ff] cursor-pointer"
                      disabled={photoUploading}
                    />
                    {photoUploading && <p className="text-[10px] text-blue-600 mt-1">Mengunggah...</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#0050cb] hover:bg-[#003fa4] text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
