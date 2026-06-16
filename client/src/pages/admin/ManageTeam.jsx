import React, { useState, useEffect } from 'react';
import { teamService } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import toast from 'react-hot-toast';

export default function ManageTeam() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null); // null means adding new

  const [form, setForm] = useState({
    name: '',
    role: '',
    photo_url: '',
    bio: '',
    instagram_url: '',
    linkedin_url: '',
    display_order: 0
  });

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const res = await teamService.list();
      setTeamMembers(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data tim');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setForm({
      name: '',
      role: '',
      photo_url: '',
      bio: '',
      instagram_url: '',
      linkedin_url: '',
      display_order: teamMembers.length + 1
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      role: member.role,
      photo_url: member.photo_url || '',
      bio: member.bio || '',
      instagram_url: member.instagram_url || '',
      linkedin_url: member.linkedin_url || '',
      display_order: member.display_order
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.role) {
      toast.error('Nama dan role wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      if (editingMember) {
        // Update
        const res = await teamService.update(editingMember.id, form);
        if (res.data?.success) {
          toast.success('Anggota tim berhasil diupdate!');
        }
      } else {
        // Create
        const res = await teamService.create(form);
        if (res.data?.success) {
          toast.success('Anggota tim berhasil ditambahkan!');
        }
      }
      setShowModal(false);
      fetchTeamMembers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Gagal menyimpan data anggota tim');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus anggota tim ini?')) {
      return;
    }

    try {
      setLoading(true);
      const res = await teamService.delete(id);
      if (res.data?.success) {
        toast.success('Anggota tim berhasil dihapus!');
        fetchTeamMembers();
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus anggota tim');
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
          <h2 className="text-[28px] lg:text-[32px] font-bold text-[#191b24]">Tim Eduzet</h2>
          <p className="text-[14px] text-[#424656] mt-1">Kelola anggota tim yang tampil di footer landing page dan halaman siswa</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2 shadow-[0_8px_16px_-6px_rgba(0,80,203,0.3)]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah Anggota
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#c2c6d8]/30 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f2f3ff]/50 border-b border-[#c2c6d8]/30">
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider w-20 text-center">Urutan</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider w-24">Foto</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider">Nama</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider">Role / Jabatan</th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-wider w-36 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c2c6d8]/20">
              {loading && teamMembers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[#727687]">
                    <span className="material-symbols-outlined animate-spin text-[32px] text-[#0050cb] mb-2">progress_activity</span>
                    <p className="text-[14px]">Memuat data...</p>
                  </td>
                </tr>
              ) : teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-[#fcf9f8] transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-[14px] text-[#424656]">
                      {member.display_order}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-[#c2c6d8]/30 bg-[#f2f3ff] flex items-center justify-center">
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#0050cb] to-[#003d9b] flex items-center justify-center text-white text-[16px] font-bold">
                            {member.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[14px] text-[#191b24]">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-[#424656] font-medium">
                      {member.role}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(member)}
                          className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#0050cb] hover:bg-[#0050cb] hover:text-white transition-all"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="w-9 h-9 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white transition-all"
                          title="Hapus"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-[#727687]">
                    <span className="material-symbols-outlined text-[48px] text-[#c2c6d8] mb-2">groups</span>
                    <p className="text-[14px]">Belum ada anggota tim ditambahkan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-[#191b24]">
                {editingMember ? 'Edit Anggota Tim' : 'Tambah Anggota Tim Baru'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelCls}>Nama Anggota *</label>
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Jabatan / Role *</label>
                <input
                  className={inputCls}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Co-Founder / Developer"
                  required
                />
              </div>

              <div>
                <ImageUpload
                  value={form.photo_url}
                  onChange={(url) => setForm({ ...form, photo_url: url })}
                  folder="team"
                  label="Foto Anggota"
                  placeholder="Upload foto atau masukkan URL"
                  aspectRatio="aspect-square w-24 h-24 rounded-full mx-auto"
                />
              </div>

              <div>
                <label className={labelCls}>Deskripsi / Bio</label>
                <textarea
                  className={inputCls + " min-h-[80px] resize-y"}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="e.g. Berpengalaman lebih dari 15 tahun..."
                />
              </div>

              <div>
                <label className={labelCls}>Instagram URL</label>
                <input
                  type="url"
                  className={inputCls}
                  value={form.instagram_url}
                  onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                  placeholder="e.g. https://instagram.com/username"
                />
              </div>

              <div>
                <label className={labelCls}>LinkedIn URL</label>
                <input
                  type="url"
                  className={inputCls}
                  value={form.linkedin_url}
                  onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                  placeholder="e.g. https://linkedin.com/in/username"
                />
              </div>

              <div>
                <label className={labelCls}>Urutan Tampilan</label>
                <input
                  type="number"
                  className={inputCls}
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 1"
                />
                <p className="text-[11px] text-[#727687] mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Anggota akan ditampilkan berdasarkan urutan terkecil ke terbesar.
                </p>
              </div>

              <div className="flex gap-3 pt-6 border-t border-[#c2c6d8]/20">
                <button type="submit" disabled={loading} className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2 disabled:opacity-50 flex-1 justify-center">
                  {loading ? (
                    <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Menyimpan...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px]">save</span> Simpan</>
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
