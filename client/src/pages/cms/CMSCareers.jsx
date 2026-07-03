import React, { useState, useEffect, useRef } from 'react';
import { careerService, certificateService, uploadService } from '../../services/api';
import toast from 'react-hot-toast';

export default function CMSCareers() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Page Tab: 'vacancies' | 'applications' | 'certificates'
  const [pageTab, setPageTab] = useState('vacancies');

  // Certificates State
  const [certificates, setCertificates] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [certSearch, setCertSearch] = useState('');
  const [certTypeFilter, setCertTypeFilter] = useState('all');
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [currentCertId, setCurrentCertId] = useState(null);
  const [selectedCertForPrint, setSelectedCertForPrint] = useState(null);
  const [sigUploading, setSigUploading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const certPrintRef = useRef(null);
  const [certFormData, setCertFormData] = useState({
    recipient_name: '',
    program_type: 'internship',
    position: '',
    start_date: '',
    end_date: '',
    signer_name: 'Zakaria (Kak Z)',
    signer_role: 'Chief Executive Officer',
    signature_url: '',
    location: 'Jakarta'
  });

  // Applications State
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  // Error States
  const [error, setError] = useState(null);
  const [appsError, setAppsError] = useState(null);

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
    benefits: '',
    responsibilities: '',
    is_active: true
  });

  const fetchVacancies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await careerService.listAll();
      setVacancies(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError('Gagal mengambil daftar lowongan. Silakan periksa koneksi Anda.');
      toast.error('Gagal mengambil daftar lowongan');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setAppsLoading(true);
    setAppsError(null);
    try {
      const res = await careerService.listApplications();
      setApplications(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setAppsError('Gagal mengambil daftar lamaran. Silakan periksa koneksi Anda.');
      toast.error('Gagal mengambil daftar lamaran');
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchCertificates = async () => {
    try {
      setCertsLoading(true);
      const res = await certificateService.list();
      setCertificates(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil daftar sertifikat');
    } finally {
      setCertsLoading(false);
    }
  };

  const handleOpenCertModal = (cert = null) => {
    if (cert) {
      setCurrentCertId(cert.id);
      setCertFormData({
        recipient_name: cert.recipient_name,
        program_type: cert.program_type,
        position: cert.position,
        start_date: cert.start_date ? cert.start_date.substring(0, 10) : '',
        end_date: cert.end_date ? cert.end_date.substring(0, 10) : '',
        signer_name: cert.signer_name,
        signer_role: cert.signer_role,
        signature_url: cert.signature_url,
        location: cert.location || 'Jakarta'
      });
    } else {
      setCurrentCertId(null);
      setCertFormData({
        recipient_name: '',
        program_type: 'internship',
        position: '',
        start_date: '',
        end_date: '',
        signer_name: 'Zakaria (Kak Z)',
        signer_role: 'Chief Executive Officer',
        signature_url: '',
        location: 'Jakarta'
      });
    }
    setIsCertModalOpen(true);
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error('Format foto tidak didukung! Gunakan JPG, JPEG, PNG, atau WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Maksimal ukuran tanda tangan 2MB.');
      return;
    }

    setSigUploading(true);
    try {
      const res = await uploadService.uploadPublicImage(file, 'signatures');
      if (res.data?.success) {
        setCertFormData(prev => ({ ...prev, signature_url: res.data.data.url }));
        toast.success('Tanda tangan berhasil diunggah');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunggah tanda tangan');
    } finally {
      setSigUploading(false);
    }
  };

  const handleCertSubmit = async (e) => {
    e.preventDefault();
    if (!certFormData.signature_url) {
      toast.error('Tanda tangan wajib diunggah');
      return;
    }
    try {
      if (currentCertId) {
        await certificateService.update(currentCertId, certFormData);
        toast.success('Sertifikat berhasil diupdate');
      } else {
        await certificateService.create(certFormData);
        toast.success('Sertifikat berhasil dibuat');
      }
      setIsCertModalOpen(false);
      fetchCertificates();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan sertifikat');
    }
  };

  const handleDeleteCertificate = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus sertifikat ini?')) return;
    try {
      await certificateService.delete(id);
      toast.success('Sertifikat berhasil dihapus');
      fetchCertificates();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus sertifikat');
    }
  };

  const downloadAsPDF = async () => {
    if (!certPrintRef.current || !selectedCertForPrint) return;
    setIsGeneratingPDF(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const element = certPrintRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFEF7',
        logging: false,
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

      const safeName = (selectedCertForPrint.recipient_name || 'Penerima').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const safeCode = (selectedCertForPrint.certificate_code || '').replace(/\//g, '-');
      pdf.save(`Sertifikat_${safeName}_${safeCode}.pdf`);
      toast.success('PDF berhasil diunduh!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Gagal mengunduh PDF. Coba lagi.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    if (pageTab === 'applications') {
      fetchApplications();
    } else if (pageTab === 'certificates') {
      fetchCertificates();
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
        benefits: job.benefits || '',
        responsibilities: job.responsibilities || '',
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
        benefits: '',
        responsibilities: '',
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
        ) : pageTab === 'certificates' ? (
          <button
            onClick={() => handleOpenCertModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0050cb] hover:bg-[#0050cb]/95 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Tambah Sertifikat</span>
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
        <button
          onClick={() => setPageTab('certificates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold tracking-wide transition-all ${
            pageTab === 'certificates' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">verified</span>
          Sertifikat
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
          ) : error ? (
            <div className="bg-white border border-red-200 rounded-3xl py-12 px-6 text-center max-w-md mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[48px] text-red-500 mb-3">error</span>
              <h3 className="text-[#191b24] font-bold text-lg">Gagal Memuat Data</h3>
              <p className="text-[#727687] text-sm mt-1 mb-6">{error}</p>
              <button 
                onClick={fetchVacancies}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0050cb] hover:bg-[#003da6] text-white font-semibold text-sm transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Coba Lagi
              </button>
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
                          <option value="Volunteer">Volunteer</option>
                          <option value="Fellowship">Fellowship</option>
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

                    {/* Responsibilities */}
                    <div>
                      <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Job / Tanggung Jawab (Pisahkan dengan baris baru)</label>
                      <textarea
                        name="responsibilities"
                        value={formData.responsibilities}
                        onChange={handleChange}
                        placeholder={"Contoh:\n- Mengembangkan fitur web frontend...\n- Menulis unit test..."}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13.5px] text-[#191b24] placeholder-slate-400 resize-y"
                      />
                    </div>

                    {/* Benefits */}
                    <div>
                      <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Benefit / Fasilitas (Pisahkan dengan baris baru)</label>
                      <textarea
                        name="benefits"
                        value={formData.benefits}
                        onChange={handleChange}
                        placeholder={"Contoh:\n- Gaji kompetitif...\n- Jam kerja fleksibel...\n- Anggaran belajar..."}
                        rows={3}
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
          ) : appsError ? (
            <div className="bg-white border border-red-200 rounded-3xl py-12 px-6 text-center max-w-md mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[48px] text-red-500 mb-3">error</span>
              <h3 className="text-[#191b24] font-bold text-lg">Gagal Memuat Data</h3>
              <p className="text-[#727687] text-sm mt-1 mb-6">{appsError}</p>
              <button 
                onClick={fetchApplications}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0050cb] hover:bg-[#003da6] text-white font-semibold text-sm transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Coba Lagi
              </button>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Nama Lengkap</p>
                          <p className="text-[15px] font-bold text-[#191b24]">{selectedApp.name}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Nomor Pendaftaran</p>
                          <p className="text-[15px] font-mono font-bold text-[#0050cb]">{selectedApp.registration_number || '-'}</p>
                        </div>
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
                          <p className="text-[13px] text-[#424656] font-semibold">{selectedApp.last_education || '-'} ({selectedApp.institution_name || '-'})</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Tempat Tanggal Lahir</p>
                          <p className="text-[13px] text-[#424656] font-semibold">{selectedApp.birth_place_date || '-'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Lama Pengalaman</p>
                          <p className="text-[13px] text-[#424656] font-semibold">{selectedApp.experience_duration || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Tanggal Melamar</p>
                          <p className="text-[12px] text-[#424656] font-semibold">{new Date(selectedApp.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Kapan Bisa Mulai</p>
                          <p className="text-[13px] text-[#424656] font-semibold">
                            {selectedApp.start_date 
                              ? (() => {
                                  const d = new Date(selectedApp.start_date);
                                  return isNaN(d.getTime()) 
                                    ? selectedApp.start_date 
                                    : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                                })()
                              : '-'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Durasi Komitmen</p>
                          <p className="text-[13px] text-[#424656] font-semibold">{selectedApp.work_duration || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Alamat Domisili</p>
                        <p className="text-[13px] text-[#424656] font-medium leading-relaxed">{selectedApp.address || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* KTP Link */}
                  {selectedApp.ktp_url && (
                    <div className="bg-[#f2f3ff]/50 border border-[#c2c6d8]/30 rounded-xl p-4 mb-4">
                      <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-2">Dokumen KTP</p>
                      <a href={selectedApp.ktp_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#0050cb] font-bold text-[13px] hover:underline">
                        <span className="material-symbols-outlined text-[20px]">badge</span>
                        Buka / Download KTP
                      </a>
                    </div>
                  )}

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

                  {/* Motivasi */}
                  {selectedApp.motivation && (
                    <div className="mb-4">
                      <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-2">Motivasi Melamar</p>
                      <div className="bg-gray-50 border border-[#c2c6d8]/30 rounded-xl p-4 text-[13px] text-[#424656] leading-relaxed whitespace-pre-wrap">
                        {selectedApp.motivation}
                      </div>
                    </div>
                  )}

                  {/* Description / Cover Letter */}
                  <div>
                    <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-2">Deskripsi Pengalaman</p>
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

      {/* ═══════ CERTIFICATES TAB ═══════ */}
      {pageTab === 'certificates' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="bg-white rounded-3xl border border-[#c2c6d8]/40 p-4 flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative w-full md:flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#727687] text-[20px]">search</span>
              <input
                type="text"
                placeholder="Cari berdasarkan nama penerima atau posisi..."
                value={certSearch}
                onChange={(e) => setCertSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24] placeholder-slate-400 transition-colors"
              />
            </div>
            {/* Type Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-[13px] font-bold text-[#727687] whitespace-nowrap">Program:</span>
              <select
                value={certTypeFilter}
                onChange={(e) => setCertTypeFilter(e.target.value)}
                className="w-full md:w-44 px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13px] font-semibold text-[#424656] cursor-pointer"
              >
                <option value="all">Semua Program</option>
                <option value="internship">Magang (Internship)</option>
                <option value="volunteer">Relawan (Volunteer)</option>
              </select>
            </div>
          </div>

          {/* List of Certificates */}
          {certsLoading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <div className="w-8 h-8 border-3 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : certificates.length === 0 ? (
            <div className="bg-white border border-[#c2c6d8]/40 rounded-3xl p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-[48px] text-[#0050cb]/60 mb-3">verified</span>
              <h3 className="text-[#191b24] font-bold text-lg">Belum Ada Sertifikat</h3>
              <p className="text-[#727687] text-sm mt-1 mb-6">Buat sertifikat kelulusan magang atau relawan di sini.</p>
              <button
                onClick={() => handleOpenCertModal()}
                className="px-5 py-2.5 rounded-xl bg-[#0050cb] text-white font-bold text-sm hover:bg-[#003fa4]"
              >
                Buat Sertifikat Pertama
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#c2c6d8]/40 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#c2c6d8]/30 bg-slate-50 text-[#727687] text-[11px] font-extrabold uppercase tracking-wider">
                      <th className="px-6 py-4">Nomor Sertifikat</th>
                      <th className="px-6 py-4">Penerima</th>
                      <th className="px-6 py-4">Program & Posisi</th>
                      <th className="px-6 py-4">Periode</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c2c6d8]/10 text-[13px] text-[#424656] font-medium">
                    {certificates
                      .filter(c => {
                        const matchesSearch = c.recipient_name.toLowerCase().includes(certSearch.toLowerCase()) ||
                                             c.position.toLowerCase().includes(certSearch.toLowerCase());
                        const matchesFilter = certTypeFilter === 'all' ? true : c.program_type === certTypeFilter;
                        return matchesSearch && matchesFilter;
                      })
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/55 transition-colors">
                          <td className="px-6 py-4 text-[#0050cb] font-bold font-mono">{c.certificate_code}</td>
                          <td className="px-6 py-4 font-bold text-[#191b24]">{c.recipient_name}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mr-2 ${
                              c.program_type === 'internship' 
                                ? 'bg-blue-50 text-blue-700' 
                                : c.program_type === 'fellowship'
                                ? 'bg-purple-50 text-purple-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {c.program_type === 'internship' ? 'Magang' : c.program_type === 'fellowship' ? 'Fellowship' : 'Volunteer'}
                            </span>
                            <span>{c.position}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(c.start_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} – {new Date(c.end_date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedCertForPrint(c)}
                              className="p-2 rounded-lg bg-indigo-50 hover:bg-[#0050cb] text-[#0050cb] hover:text-white transition-colors"
                              title="Tinjau & Cetak"
                            >
                              <span className="material-symbols-outlined text-[18px]">print</span>
                            </button>
                            <button
                              onClick={() => handleOpenCertModal(c)}
                              className="p-2 rounded-lg bg-amber-50 hover:bg-amber-500 text-amber-600 hover:text-white transition-colors"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCertificate(c.id)}
                              className="p-2 rounded-lg bg-red-50 hover:bg-[#ba1a1a] text-[#ba1a1a] hover:text-white transition-colors"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ CERTIFICATE EDIT/CREATE MODAL ═══════ */}
      {isCertModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#c2c6d8]/40 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#c2c6d8]/20 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-[#191b24]">
                {currentCertId ? 'Edit Sertifikat' : 'Buat Sertifikat Baru'}
              </h2>
              <button
                onClick={() => setIsCertModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white border border-[#c2c6d8] text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCertSubmit} className="p-6 space-y-4 flex-1">
              <div>
                <label className="block text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-1.5">Nama Penerima *</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap lulusan"
                  value={certFormData.recipient_name}
                  onChange={(e) => setCertFormData(p => ({ ...p, recipient_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-1.5">Tipe Program *</label>
                  <select
                    value={certFormData.program_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setCertFormData(p => ({
                        ...p,
                        program_type: type,
                        location: type === 'fellowship' ? 'Depok' : 'Jakarta'
                      }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13px] font-semibold cursor-pointer"
                  >
                    <option value="internship">Magang (Internship)</option>
                    <option value="volunteer">Relawan (Volunteer)</option>
                    <option value="fellowship">Academic Fellowship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-1.5">Posisi / Peran *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Content Writer, UI/UX Designer"
                    value={certFormData.position}
                    onChange={(e) => setCertFormData(p => ({ ...p, position: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-1.5">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={certFormData.start_date}
                    onChange={(e) => setCertFormData(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-1.5">Tanggal Selesai *</label>
                  <input
                    type="date"
                    required
                    value={certFormData.end_date}
                    onChange={(e) => setCertFormData(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#c2c6d8]/20 pt-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-1.5">Nama Penandatangan *</label>
                  <input
                    type="text"
                    required
                    value={certFormData.signer_name}
                    onChange={(e) => setCertFormData(p => ({ ...p, signer_name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-1.5">Jabatan Penandatangan *</label>
                  <input
                    type="text"
                    required
                    value={certFormData.signer_role}
                    onChange={(e) => setCertFormData(p => ({ ...p, signer_role: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-1.5">Lokasi Penerbitan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jakarta / Depok"
                  value={certFormData.location}
                  onChange={(e) => setCertFormData(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13px] mb-4"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-1.5">Upload Tanda Tangan Digital *</label>
                <div className="flex items-center gap-4 p-4 border border-dashed border-[#c2c6d8] rounded-xl bg-slate-50">
                  {certFormData.signature_url ? (
                    <div className="relative w-32 h-16 border border-[#c2c6d8]/60 bg-white rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img src={certFormData.signature_url} alt="Tanda Tangan" className="max-h-full max-w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setCertFormData(p => ({ ...p, signature_url: '' }))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[12px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-16 border border-dashed border-[#c2c6d8]/60 bg-white rounded-lg flex items-center justify-center text-slate-400 flex-shrink-0">
                      <span className="material-symbols-outlined text-[24px]">draw</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-[#424656]">Pilih file tanda tangan (.png transparent direkomendasikan)</p>
                    <p className="text-[10px] text-[#727687] mt-0.5">Maks 2MB. JPG/PNG/WEBP.</p>
                    
                    {!certFormData.signature_url && (
                      <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0050cb] hover:bg-[#003fa4] text-white font-bold text-[11px] cursor-pointer transition-all">
                        <span className="material-symbols-outlined text-[14px]">upload</span>
                        <span>{sigUploading ? 'Mengupload...' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp"
                          disabled={sigUploading}
                          onChange={handleSignatureUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Footer Action */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#c2c6d8]/20">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white border border-[#c2c6d8] hover:bg-slate-50 text-slate-600 font-bold text-sm transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0050cb] hover:bg-[#003fa4] text-white font-bold text-sm transition-all shadow-sm shadow-[#0050cb]/10"
                >
                  Simpan Sertifikat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════ CERTIFICATE PDF PREVIEW OVERLAY ═══════ */}
      {selectedCertForPrint && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-black/90 px-4 py-6 items-center justify-start overflow-y-auto">
          {/* Controls Bar */}
          <div className="w-full max-w-5xl mb-6 flex flex-wrap gap-3 justify-between items-center text-white">
            <div>
              <h3 className="font-bold text-xl">Preview Sertifikat</h3>
              <p className="text-xs text-slate-400 mt-0.5">Klik "Unduh PDF" untuk menyimpan dalam format PDF (A4 Landscape)</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadAsPDF}
                disabled={isGeneratingPDF}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg"
              >
                {isGeneratingPDF ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Mengunduh...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Unduh PDF
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedCertForPrint(null)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                Tutup
              </button>
            </div>
          </div>

          {/* ── Premium Certificate (A4 Landscape Ratio) ── */}
          <div
            ref={certPrintRef}
            style={{
              width: '100%',
              maxWidth: '900px',
              aspectRatio: '1.414 / 1',
              background: 'linear-gradient(145deg, #FFFEF7 0%, #FFF9E6 50%, #FFFEF7 100%)',
              border: '10px double #B8860B',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: '44px 48px 36px',
              boxSizing: 'border-box',
              fontFamily: "'Inter', sans-serif",
              color: '#1A1A2E',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            {/* Watermark logo */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, pointerEvents: 'none', zIndex: 0, width: '280px' }}>
              <img src="/stubiabrandicon.png" alt="" style={{ width: '100%', height: 'auto' }} />
            </div>
            {/* Corner ornaments */}
            <div style={{ position: 'absolute', top: 12, left: 12, width: 50, height: 50, borderTop: '2.5px solid #B8860B', borderLeft: '2.5px solid #B8860B' }} />
            <div style={{ position: 'absolute', top: 12, right: 12, width: 50, height: 50, borderTop: '2.5px solid #B8860B', borderRight: '2.5px solid #B8860B' }} />
            <div style={{ position: 'absolute', bottom: 12, left: 12, width: 50, height: 50, borderBottom: '2.5px solid #B8860B', borderLeft: '2.5px solid #B8860B' }} />
            <div style={{ position: 'absolute', bottom: 12, right: 12, width: 50, height: 50, borderBottom: '2.5px solid #B8860B', borderRight: '2.5px solid #B8860B' }} />

            {/* Main content column */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

              {/* Header Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <img src="/stubiabrandicon.png" alt="Stubia" style={{ height: 34, width: 'auto', objectFit: 'contain' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#8A7340', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Nomor Sertifikat</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF', fontFamily: 'monospace', marginTop: 2, letterSpacing: '0.05em' }}>
                    {selectedCertForPrint.certificate_code}
                  </div>
                </div>
              </div>

              {/* Gold divider */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, #B8860B 30%, #E8C96B 50%, #B8860B 70%, transparent 100%)', marginBottom: 18 }} />

              {/* Title */}
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#8A7340', letterSpacing: '0.28em', textTransform: 'uppercase', margin: '0 0 7px' }}>✦ &nbsp; Stubia.id &nbsp; ✦</p>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1A2E5A', fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif", letterSpacing: '0.06em', margin: '0 0 4px', lineHeight: 1.15 }}>
                  SERTIFIKAT PENGHARGAAN
                </h2>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#8A7340', letterSpacing: '0.22em', textTransform: 'uppercase', margin: '4px 0 10px' }}>
                  Certificate of Appreciation
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #C9A84C)' }} />
                  <span style={{ fontSize: 14, color: '#B8860B' }}>✦</span>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #C9A84C, transparent)' }} />
                </div>
              </div>

              {/* Recipient Block */}
              <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
                <p style={{ fontSize: 11.5, color: '#5A5A6E', margin: 0 }}>Dengan bangga diberikan kepada:</p>
                <div>
                  <h1 style={{ fontSize: 34, fontWeight: 900, color: '#1A2E5A', fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif", margin: '4px 0 16px', lineHeight: 1.3 }}>
                    {selectedCertForPrint.recipient_name}
                  </h1>
                  <div style={{ width: 240, height: 1.5, background: 'linear-gradient(90deg, transparent, #B8860B, transparent)', margin: '0 auto 12px' }} />
                </div>
                 <div style={{ margin: '4px 0' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A2E5A', margin: '0 0 4px', display: 'inline-block', whiteSpace: 'nowrap' }}>
                    {selectedCertForPrint.program_type === 'internship' 
                      ? 'Internship' 
                      : selectedCertForPrint.program_type === 'fellowship'
                      ? 'Academic Fellow:'
                      : 'Volunteer'} {selectedCertForPrint.position}
                  </h3>
                  <div>
                    <p style={{ fontSize: 12, color: '#8A7340', margin: 0, fontWeight: 500 }}>
                      Periode{' '}
                      <strong style={{ fontWeight: 700, color: '#8A7340', display: 'inline-block', whiteSpace: 'nowrap' }}>
                        {new Date(selectedCertForPrint.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </strong>
                      {' '} - {' '}
                      <strong style={{ fontWeight: 700, color: '#8A7340', display: 'inline-block', whiteSpace: 'nowrap' }}>
                        {new Date(selectedCertForPrint.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </strong>
                    </p>
                  </div>
                </div>
                <p style={{ 
                  fontSize: selectedCertForPrint.program_type === 'fellowship' ? 11.5 : 12.5, 
                  color: '#3A3A4E', 
                  maxWidth: selectedCertForPrint.program_type === 'fellowship' ? 580 : 540, 
                  margin: '4px auto 0', 
                  lineHeight: selectedCertForPrint.program_type === 'fellowship' ? 1.5 : 1.7 
                }}>
                  {selectedCertForPrint.program_type === 'fellowship'
                    ? 'Selama program berlangsung, yang bersangkutan telah menunjukkan kompetensi profesional, kerja sama tim yang baik, serta komitmen tinggi dalam memperluas akses pendidikan digital di Indonesia.'
                    : 'Sebagai bentuk penghargaan atas dedikasi, komitmen, dan kontribusi berharga yang telah diberikan dalam menyukseskan program kerja serta pengembangan ekosistem Stubia.id.'}
                </p>
              </div>

              {/* Footer row */}
              <div>
                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent 0%, #B8860B 30%, #E8C96B 50%, #B8860B 70%, transparent 100%)', margin: '14px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>

                  {/* QR Code */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                    <div style={{ padding: 5, border: '1.5px solid #C9A84C', borderRadius: 8, background: '#fff' }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`${window.location.origin}/careers/verify/${selectedCertForPrint.id}`)}`}
                        alt="QR Verifikasi"
                        crossOrigin="anonymous"
                        style={{ width: 64, height: 64, display: 'block' }}
                      />
                    </div>
                    <div style={{ paddingBottom: 2 }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: '#8A7340', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Scan untuk Verifikasi</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: '#555', marginBottom: 1 }}>Google Lens / QR Scanner</div>
                      <div style={{ fontSize: 7.5, color: '#888', fontFamily: 'monospace' }}>stubia.id/careers/verify</div>
                    </div>
                  </div>

                  {/* Signature */}
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 9.5, color: '#5A5A6E', marginBottom: 5 }}>
                      {selectedCertForPrint.location || 'Jakarta'}, {new Date(selectedCertForPrint.issue_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                      <img
                        src={selectedCertForPrint.signature_url}
                        alt="Tanda Tangan"
                        crossOrigin="anonymous"
                        style={{ maxHeight: '100%', maxWidth: 130, objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ width: 140, height: 1, background: '#888', marginBottom: 4 }} />
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1A1A2E' }}>{selectedCertForPrint.signer_name}</div>
                    <div style={{ fontSize: 9.5, color: '#5A5A6E', marginTop: 1 }}>{selectedCertForPrint.signer_role}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-xs mt-4 text-center pb-4">
            Sertifikat diunduh dalam format PDF A4 Landscape. Pastikan gambar tanda tangan dan QR code sudah terlihat dengan jelas.
          </p>
        </div>
      )}

    </div>
  );
}
