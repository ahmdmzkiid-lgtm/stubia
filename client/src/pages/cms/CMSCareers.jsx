import React, { useState, useEffect } from 'react';
import { careerService } from '../../services/api';
import toast from 'react-hot-toast';

export default function CMSCareers() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Page Tab: 'vacancies' | 'applications'
  const [pageTab, setPageTab] = useState('vacancies');

  // Applications State
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    location: 'Jakarta, Indonesia',
    type: 'Full-time',
    description: '',
    requirements: '',
    is_active: true
  });

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      const res = await careerService.listAll();
      setVacancies(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil daftar lowongan');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setAppsLoading(true);
    try {
      const res = await careerService.listApplications();
      setApplications(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil daftar lamaran');
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    fetchVacancies();
  }, []);

  useEffect(() => {
    if (pageTab === 'applications') {
      fetchApplications();
    }
  }, [pageTab]);

  const handleOpenModal = (job = null) => {
    if (job) {
      setCurrentId(job.id);
      setFormData({
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        description: job.description || '',
        requirements: job.requirements || '',
        is_active: job.is_active
      });
    } else {
      setCurrentId(null);
      setFormData({
        title: '',
        department: 'Engineering',
        location: 'Jakarta, Indonesia',
        type: 'Full-time',
        description: '',
        requirements: '',
        is_active: true
      });
    }
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, department, location, type, description } = formData;
    if (!title.trim() || !department.trim() || !location.trim() || !type.trim() || !description.trim()) {
      toast.error('Harap isi semua kolom wajib!');
      return;
    }

    try {
      if (currentId) {
        await careerService.update(currentId, formData);
        toast.success('Lowongan pekerjaan berhasil diperbarui');
      } else {
        await careerService.create(formData);
        toast.success('Lowongan pekerjaan baru berhasil ditambahkan');
      }
      handleCloseModal();
      fetchVacancies();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan lowongan');
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus lowongan pekerjaan "${title}"?`)) {
      try {
        await careerService.delete(id);
        toast.success('Lowongan berhasil dihapus');
        fetchVacancies();
      } catch (err) {
        console.error(err);
        toast.error('Gagal menghapus lowongan');
      }
    }
  };

  const handleToggleStatus = async (job) => {
    try {
      await careerService.update(job.id, {
        is_active: !job.is_active
      });
      toast.success(job.is_active ? 'Lowongan dinonaktifkan' : 'Lowongan diaktifkan');
      fetchVacancies();
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengubah status lowongan');
    }
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus lamaran ini?')) return;
    try {
      await careerService.deleteApplication(id);
      toast.success('Lamaran berhasil dihapus');
      setApplications(prev => prev.filter(a => a.id !== id));
      if (selectedApp?.id === id) setSelectedApp(null);
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus lamaran');
    }
  };

  const filteredVacancies = vacancies.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                          job.department.toLowerCase().includes(search.toLowerCase()) ||
                          job.location.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'active') {
      return matchesSearch && job.is_active;
    }
    if (statusFilter === 'inactive') {
      return matchesSearch && !job.is_active;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#191b24]">Lowongan Kerja</h1>
          <p className="text-[#424656] text-sm">Kelola informasi karir, rekrutmen, dan lamaran masuk.</p>
        </div>
        {pageTab === 'vacancies' ? (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0050cb] hover:bg-[#0050cb]/95 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Tambah Lowongan</span>
          </button>
        ) : (
          <button
            onClick={fetchApplications}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#c2c6d8] hover:bg-[#f2f3ff] text-[#424656] font-semibold text-sm transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Page Tabs */}
      <div className="flex gap-1.5 p-1 bg-[#f2f3ff] border border-[#c2c6d8]/30 rounded-xl self-start w-fit">
        <button
          onClick={() => setPageTab('vacancies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold tracking-wide transition-all ${
            pageTab === 'vacancies' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">work</span>
          Lowongan
        </button>
        <button
          onClick={() => setPageTab('applications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold tracking-wide transition-all ${
            pageTab === 'applications' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">inbox</span>
          Inbox Lamaran
          {applications.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#0050cb] text-white text-[10px] font-bold min-w-[18px] text-center">{applications.length}</span>
          )}
        </button>
      </div>

      {/* ═══════ VACANCIES TAB ═══════ */}
      {pageTab === 'vacancies' && (
        <>
          {/* Filter and Search controls */}
          <div className="bg-white rounded-3xl border border-[#c2c6d8]/40 p-4 flex flex-col md:flex-row gap-4 items-center">
            
            {/* Search */}
            <div className="relative w-full md:flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#727687] text-[20px]">search</span>
              <input
                type="text"
                placeholder="Cari berdasarkan posisi, divisi, lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24] placeholder-slate-400 transition-colors"
              />
            </div>

            {/* Tabs for Filter */}
            <div className="flex gap-1.5 p-1 bg-[#f2f3ff] border border-[#c2c6d8]/30 rounded-xl w-full md:w-auto">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'active', label: 'Aktif' },
                { id: 'inactive', label: 'Tidak Aktif' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    statusFilter === tab.id 
                      ? 'bg-white text-[#0050cb] border border-[#c2c6d8]/20 shadow-sm' 
                      : 'text-[#424656] hover:text-[#0050cb]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>

          {/* Table List */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <div className="w-8 h-8 border-3 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredVacancies.length === 0 ? (
            <div className="bg-white border border-[#c2c6d8]/40 rounded-3xl py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-slate-450 mb-3">work_outline</span>
              <h3 className="text-[#191b24] font-bold text-lg">Belum Ada Lowongan</h3>
              <p className="text-[#727687] text-sm max-w-sm mx-auto mt-1">Tidak ditemukan lowongan yang cocok dengan filter atau kata kunci Anda.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#c2c6d8]/40 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#c2c6d8]/40 bg-[#f2f3ff]/40">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#727687]">Lowongan Pekerjaan</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#727687]">Divisi</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#727687]">Lokasi & Tipe</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#727687] text-center">Status</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#727687] text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c2c6d8]/20">
                    {filteredVacancies.map(job => (
                      <tr key={job.id} className="hover:bg-[#f2f3ff]/10 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#191b24]">{job.title}</div>
                          <div className="text-[12px] text-[#727687] mt-0.5 line-clamp-1 max-w-xs">{job.description}</div>
                        </td>
                        <td className="px-6 py-4 text-[#424656] font-semibold text-sm">{job.department}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-[#424656]">{job.location}</div>
                          <div className="text-[11px] font-bold text-[#0050cb]">{job.type}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(job)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                              job.is_active 
                                ? 'bg-green-50 text-green-700 border-green-200/50 hover:bg-green-100' 
                                : 'bg-red-50 text-red-700 border-red-200/50 hover:bg-red-100'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {job.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenModal(job)}
                              className="w-8 h-8 rounded-lg bg-[#f2f3ff] hover:bg-[#0050cb] text-[#0050cb] hover:text-white flex items-center justify-center transition-colors"
                              title="Edit Lowongan"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(job.id, job.title)}
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-[#ba1a1a] text-[#ba1a1a] hover:text-white flex items-center justify-center transition-colors"
                              title="Hapus Lowongan"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CRUD Form Modal */}
          {isOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
              
              <div className="bg-white border border-[#c2c6d8] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-zoomIn shadow-2xl">
                
                {/* Modal Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-[#c2c6d8]/40 flex justify-between items-center bg-[#f2f3ff]/40">
                  <h2 className="text-[17px] font-bold text-[#191b24]">
                    {currentId ? 'Edit Lowongan Kerja' : 'Tambah Lowongan Baru'}
                  </h2>
                  <button 
                    onClick={handleCloseModal}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f2f3ff] text-[#424656] hover:text-[#0050cb] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
                  
                  <div className="p-4 sm:p-6 space-y-4 flex-1">
                    
                    {/* Title */}
                    <div>
                      <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Nama Posisi / Pekerjaan</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Contoh: Frontend Developer, Academic Tutor Math"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24] placeholder-slate-400"
                        required
                      />
                    </div>

                    {/* Grid inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Divisi / Departemen</label>
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24]"
                        >
                          <option value="Engineering">Engineering</option>
                          <option value="Product">Product</option>
                          <option value="Design">Design</option>
                          <option value="Content & Curriculum">Content & Curriculum</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Operations">Operations</option>
                          <option value="Tutor / Tentor">Tutor / Tentor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Lokasi</label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Jakarta, Indonesia / Remote"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Tipe Pekerjaan</label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24]"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Internship">Internship</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </div>
                    </div>

                    {/* Active Checkbox */}
                    <div className="flex items-center pl-1">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={formData.is_active}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-[#c2c6d8] bg-white text-[#0050cb] focus:ring-0"
                        />
                        <span className="text-[13px] font-semibold text-[#424656]">Aktifkan lowongan ini agar langsung tampil</span>
                      </label>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Deskripsi Ringkas</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Contoh: Mengembangkan interface yang intuitif..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13.5px] text-[#191b24] placeholder-slate-400 resize-none"
                        required
                      />
                    </div>

                    {/* Requirements */}
                    <div>
                      <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Persyaratan & Kualifikasi (Pisahkan dengan baris baru)</label>
                      <textarea
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleChange}
                        placeholder={"Contoh:\n- Minimal 2 tahun pengalaman..."}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13.5px] text-[#191b24] placeholder-slate-400 resize-y"
                      />
                    </div>

                  </div>

                  {/* Modal Footer Actions */}
                  <div className="px-4 sm:px-6 py-4 border-t border-[#c2c6d8]/40 bg-[#f2f3ff]/40 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-5 py-2.5 rounded-xl bg-white border border-[#c2c6d8] hover:bg-gray-50 text-[#424656] font-semibold text-sm transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#0050cb] hover:bg-[#0050cb]/95 text-white font-semibold text-sm shadow-sm transition-all"
                    >
                      Simpan Lowongan
                    </button>
                  </div>

                </form>

              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════ APPLICATIONS TAB ═══════ */}
      {pageTab === 'applications' && (
        <div className="space-y-6">
          {appsLoading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <div className="w-8 h-8 border-3 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white border border-[#c2c6d8]/40 rounded-3xl py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-slate-400 mb-3">inbox</span>
              <h3 className="text-[#191b24] font-bold text-lg">Belum Ada Lamaran Masuk</h3>
              <p className="text-[#727687] text-sm max-w-sm mx-auto mt-1">Lamaran yang dikirim pelamar melalui halaman Karir akan muncul di sini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Application List */}
              <div className={`${selectedApp ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-3`}>
                {applications.map(app => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`bg-white border rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedApp?.id === app.id ? 'border-[#0050cb] ring-1 ring-[#0050cb]/20 shadow-md' : 'border-[#c2c6d8]/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {app.photo_url ? (
                        <img src={app.photo_url} alt={app.name} className="w-12 h-16 rounded-lg object-cover border border-[#c2c6d8]/30 shrink-0" />
                      ) : (
                        <div className="w-12 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-slate-400 shrink-0">
                          <span className="material-symbols-outlined text-[20px]">person</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[14px] font-bold text-[#191b24] truncate">{app.name}</h4>
                        <p className="text-[12px] text-[#0050cb] font-semibold truncate">{app.vacancy_title}</p>
                        <p className="text-[11px] text-[#727687] truncate">{app.vacancy_department}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#727687]">
                          <span className="flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                            {new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteApplication(app.id); }}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-[#ba1a1a] text-[#ba1a1a] hover:text-white flex items-center justify-center transition-colors shrink-0"
                        title="Hapus Lamaran"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail Panel */}
              {selectedApp && (
                <div className="lg:col-span-7 bg-white border border-[#c2c6d8]/40 rounded-3xl p-5 sm:p-6 shadow-sm lg:sticky lg:top-4">
                  <div className="flex justify-between items-start mb-5">
                    <h3 className="text-[18px] font-bold text-[#191b24]">Detail Lamaran</h3>
                    <button onClick={() => setSelectedApp(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f2f3ff] text-[#424656] transition-colors">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                    {/* Photo */}
                    <div className="sm:col-span-1">
                      {selectedApp.photo_url ? (
                        <img src={selectedApp.photo_url} alt={selectedApp.name} className="w-full aspect-[3/4] object-cover rounded-2xl border border-[#c2c6d8]/30" />
                      ) : (
                        <div className="w-full aspect-[3/4] rounded-2xl bg-gray-100 flex items-center justify-center text-slate-400">
                          <span className="material-symbols-outlined text-[40px]">person</span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="sm:col-span-2 space-y-3">
                      <div>
                        <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Nama Lengkap</p>
                        <p className="text-[15px] font-bold text-[#191b24]">{selectedApp.name}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Posisi Dilamar</p>
                        <p className="text-[14px] font-semibold text-[#0050cb]">{selectedApp.vacancy_title} — {selectedApp.vacancy_department}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Email</p>
                          <a href={`mailto:${selectedApp.email}`} className="text-[13px] text-[#0050cb] underline break-all">{selectedApp.email}</a>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">WhatsApp</p>
                          <a href={`https://wa.me/${selectedApp.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[13px] text-green-600 font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">chat</span>
                            {selectedApp.phone}
                          </a>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Pendidikan Terakhir</p>
                          <p className="text-[13px] text-[#424656] font-semibold">{selectedApp.last_education || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Siap Mulai Kerja/Magang</p>
                          <p className="text-[13px] text-[#424656] font-semibold">
                            {selectedApp.start_date ? new Date(selectedApp.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Bersedia Training</p>
                          <p className={`text-[13px] font-bold ${selectedApp.ready_for_training ? 'text-green-600' : 'text-red-500'}`}>
                            {selectedApp.ready_for_training ? 'YA' : 'TIDAK'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Tanggal Melamar</p>
                          <p className="text-[12px] text-[#424656]">{new Date(selectedApp.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CV Link */}
                  <div className="bg-[#f2f3ff]/50 border border-[#c2c6d8]/30 rounded-xl p-4 mb-4">
                    <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-2">CV / Resume</p>
                    <a href={selectedApp.cv_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#0050cb] font-bold text-[13px] hover:underline">
                      <span className="material-symbols-outlined text-[20px]">description</span>
                      Buka / Download CV
                    </a>
                  </div>

                  {/* Portfolio Link */}
                  {selectedApp.portfolio_url && (
                    <div className="bg-[#f2f3ff]/50 border border-[#c2c6d8]/30 rounded-xl p-4 mb-4">
                      <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-2">Portofolio</p>
                      <a href={selectedApp.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-600 font-bold text-[13px] hover:underline">
                        <span className="material-symbols-outlined text-[20px]">folder_special</span>
                        Buka Tautan Portofolio
                      </a>
                    </div>
                  )}

                  {/* Description / Cover Letter */}
                  <div>
                    <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-2">Deskripsi Diri / Cover Letter</p>
                    <div className="bg-gray-50 border border-[#c2c6d8]/30 rounded-xl p-4 text-[13px] text-[#424656] leading-relaxed whitespace-pre-wrap">
                      {selectedApp.description}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-[#c2c6d8]/20">
                    <a
                      href={`mailto:${selectedApp.email}?subject=Re: Lamaran Pekerjaan ${selectedApp.vacancy_title} - Stubia`}
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0050cb] hover:bg-[#003fa4] text-white font-semibold text-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                      Balas Email
                    </a>
                    <a
                      href={`https://wa.me/${selectedApp.phone.replace(/[^0-9]/g, '')}?text=Halo ${selectedApp.name}, terima kasih telah melamar posisi ${selectedApp.vacancy_title} di Stubia.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      Hubungi WA
                    </a>
                    <button
                      onClick={() => handleDeleteApplication(selectedApp.id)}
                      className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-[#ba1a1a] text-[#ba1a1a] hover:text-white font-semibold text-sm transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Hapus
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
