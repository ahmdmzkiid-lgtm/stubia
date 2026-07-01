import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';
import Footer from '../components/Footer';
import ImageUpload from '../components/ImageUpload';
import { careerService, uploadService } from '../services/api';
import toast from 'react-hot-toast';

export default function Careers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComingModal, setShowComingModal] = useState(false);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Apply Modal & Form States
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyName, setApplyName] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyPhone, setApplyPhone] = useState('');
  const [applyPhoto, setApplyPhoto] = useState('');
  const [applyCv, setApplyCv] = useState('');
  const [applyDesc, setApplyDesc] = useState('');
  
  // Extra fields
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyTraining, setApplyTraining] = useState(true);
  const [applyPortfolio, setApplyPortfolio] = useState('');
  const [applyEducation, setApplyEducation] = useState('S1');

  const [cvUploading, setCvUploading] = useState(false);
  const [submittingApply, setSubmittingApply] = useState(false);

  useEffect(() => {
    if (user && showApplyModal) {
      setApplyName(user.name || '');
      setApplyEmail(user.email || '');
    }
  }, [user, showApplyModal]);

  // Auto reopen pending job application after successful login redirect
  useEffect(() => {
    const pendingJobId = sessionStorage.getItem('pending_job_id');
    if (pendingJobId && user && careers.length > 0) {
      const job = careers.find(j => j.id === pendingJobId);
      if (job) {
        setSelectedJob(job);
        setShowApplyModal(true);
      }
      sessionStorage.removeItem('pending_job_id');
    }
  }, [user, careers]);

  const handleCvChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error('Format file tidak didukung! Gunakan PDF, Word, atau gambar.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Maksimal ukuran file 10MB.');
      return;
    }

    setCvUploading(true);
    try {
      const res = await uploadService.uploadDocument(file, 'cvs');
      if (res.data?.success) {
        setApplyCv(res.data.data.url);
        toast.success('CV berhasil diupload');
      }
    } catch (err) {
      toast.error('Gagal mengupload CV');
    } finally {
      setCvUploading(false);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyName.trim() || !applyEmail.trim() || !applyPhone.trim() || !applyPhoto || !applyCv || !applyDesc.trim() || !applyStartDate.trim() || !applyEducation.trim()) {
      toast.error('Harap isi semua kolom wajib pada form lamaran!');
      return;
    }
    setSubmittingApply(true);
    try {
      await careerService.apply(selectedJob.id, {
        name: applyName.trim(),
        email: applyEmail.trim(),
        phone: applyPhone.trim(),
        photo_url: applyPhoto,
        cv_url: applyCv,
        description: applyDesc.trim(),
        start_date: applyStartDate.trim(),
        ready_for_training: applyTraining,
        portfolio_url: applyPortfolio.trim() || null,
        last_education: applyEducation.trim(),
      });
      toast.success('Lamaran Anda berhasil dikirim! Terima kasih.');
      setShowApplyModal(false);
      // Reset form states
      setApplyPhoto('');
      setApplyCv('');
      setApplyDesc('');
      setApplyPhone('');
      setApplyStartDate('');
      setApplyTraining(true);
      setApplyPortfolio('');
      setApplyEducation('S1');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Gagal mengirim lamaran.');
    } finally {
      setSubmittingApply(false);
    }
  };

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        setLoading(true);
        const res = await careerService.list();
        const activeCareers = res.data.data || [];
        setCareers(activeCareers);
        if (activeCareers.length === 0) {
          setShowComingModal(true);
        }
      } catch (err) {
        console.error(err);
        toast.error('Gagal mengambil daftar lowongan pekerjaan');
      } finally {
        setLoading(false);
      }
    };

    fetchCareers();
  }, []);

  const renderNavbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#c2c6d8]/30 h-[70px] flex items-center">
      <div className="flex justify-between items-center px-6 max-w-[1440px] mx-auto w-full">
        <div className="landing-logo cursor-pointer" onClick={() => navigate('/')}>
          <img
            src="/stubiabrandicon.png"
            alt="Stubia"
            className="h-10 w-auto"
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="text-[#424656] hover:text-[#0050cb] font-bold text-sm px-4 py-2 transition-colors" 
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button 
            className="bg-[#0050cb] hover:bg-[#003fa4] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-[#0050cb]/10" 
            onClick={() => navigate('/register')}
          >
            Daftar Gratis
          </button>
        </div>
      </div>
    </nav>
  );

  const mainContent = (
    <div>
      {/* About Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Tentang Stubia</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Stubia adalah platform pembelajaran UTBK terdepan di Indonesia yang membantu ribuan siswa mencapai impian mereka untuk masuk ke universitas ternama.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Kami berkomitmen untuk menyediakan pengalaman belajar terbaik dengan teknologi terkini dan konten berkualitas tinggi.
            </p>
          </div>
          <div>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Di Stubia, kami percaya bahwa setiap anggota tim memiliki peran penting dalam kesuksesan siswa kami. Kami memberikan ruang bagi Anda untuk berinovasi dan berkembang.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mb-20">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-12 text-center">Nilai Kami</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#c2c6d8]/30">
            <h3 className="text-xl font-bold text-[#191b24] mb-3">🎓 Fokus pada Siswa</h3>
            <p className="text-gray-700">
              Setiap keputusan yang kami ambil selalu didasarkan pada dampak positif bagi pengalaman belajar siswa kami.
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#c2c6d8]/30">
            <h3 className="text-xl font-bold text-[#191b24] mb-3">🚀 Inovasi Berkelanjutan</h3>
            <p className="text-gray-700">
              Kami terus memperbarui cara belajar, teknologi yang digunakan, dan konten materi untuk menjadi yang terbaik.
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#c2c6d8]/30">
            <h3 className="text-xl font-bold text-[#191b24] mb-3">💼 Budaya Kerja</h3>
            <p className="text-gray-700">
              Tim yang kolaboratif, inovatif, dan saling mendukung untuk menciptakan produk yang luar biasa.
            </p>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="mb-20">
        <h2 className="text-3xl font-extrabold text-[#191b24] mb-8">Lowongan Terbuka</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : careers.length === 0 ? (
          <p className="text-gray-600 text-center py-12 bg-white rounded-3xl border border-[#c2c6d8]/35 shadow-sm">
            Saat ini belum ada lowongan yang tersedia. Silakan periksa kembali di kemudian hari atau hubungi kami untuk informasi lebih lanjut.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {careers.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-[#c2c6d8]/40 rounded-3xl p-6 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xl font-bold text-[#191b24] mb-2">{job.title}</h3>
                  <div className="flex gap-2.5 mb-4">
                    <span className="inline-block bg-[#0050cb]/10 text-[#0050cb] text-xs font-semibold px-2.5 py-1 rounded-md">
                      {job.department}
                    </span>
                    <span className="inline-block bg-gray-50 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                      {job.type}
                    </span>
                  </div>
                  <p className="text-[#424656] text-sm mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                    {job.location}
                  </p>
                  <p className="text-gray-700 text-sm mb-4 leading-relaxed">{job.description}</p>
                  
                  {job.requirements && (
                    <div className="mb-6">
                      <h4 className="text-[13px] font-bold text-[#191b24] mb-2">Kualifikasi:</h4>
                      <ul className="space-y-1">
                        {job.requirements.split('\n').map((req, idx) => (
                          <li key={idx} className="text-gray-600 text-[12.5px] leading-relaxed flex items-start gap-1">
                            <span className="text-[#0050cb] select-none font-bold">•</span>
                            <span>{req.replace(/^-\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    if (!user) {
                      sessionStorage.setItem('pending_job_id', job.id);
                      toast('Silakan login terlebih dahulu untuk melamar.', { icon: '🔒' });
                      navigate('/login?redirect=/careers');
                      return;
                    }
                    setSelectedJob(job); setShowApplyModal(true);
                  }}
                  className="w-full bg-[#0050cb] hover:bg-[#003fa4] text-white font-bold py-2.5 rounded-xl text-center text-sm block transition-all shadow-sm shadow-[#0050cb]/10 cursor-pointer"
                >
                  Lamar Sekarang
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section className="bg-gradient-to-r from-[#0050cb] to-[#0050cb]/80 rounded-3xl p-12 text-center text-white shadow-sm shadow-[#0050cb]/10">
        <h2 className="text-3xl font-extrabold mb-4">Dapatkan Notifikasi Lowongan Terbaru</h2>
        <p className="text-white/90 mb-8 max-w-md mx-auto">
          Daftarkan email Anda untuk menerima notifikasi ketika kami membuka lowongan baru.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Masukkan email Anda"
            className="flex-1 px-4 py-3 rounded-xl focus:outline-none text-[14px] text-gray-800"
          />
          <button className="bg-white text-[#0050cb] hover:bg-gray-100 font-bold px-6 py-3 rounded-xl transition text-[14px]">
            Daftar
          </button>
        </div>
      </section>

      {/* Contact */}
      <section className="mt-20">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Hubungi Kami</h2>
        <p className="text-gray-700 mb-6 text-lg">
          Memiliki pertanyaan tentang karir di Stubia? Jangan ragu untuk menghubungi kami:
        </p>
        <div className="bg-white p-8 rounded-3xl border border-[#c2c6d8]/40 shadow-sm">
          <p className="text-gray-800 mb-2"><strong>Email:</strong> careers@stubia.com</p>
          <p className="text-gray-800 mb-2"><strong>Telepon:</strong> 085183147625</p>
          <p className="text-gray-800"><strong>Alamat:</strong> Jakarta, Indonesia</p>
        </div>
      </section>

      {/* Footer Link */}
      <div className="py-8 border-t border-[#c2c6d8]/30 mt-20">
        <Link 
          to={user ? "/dashboard" : "/"} 
          className="text-[#0050cb] hover:text-[#0050cb]/80 font-bold text-sm flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>{user ? "Kembali ke Dashboard" : "Kembali ke Beranda"}</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      {/* Modal */}
      {showComingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-gray-100">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Lowongan Belum Dibuka</h2>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                Terima kasih atas minat Anda bergabung dengan tim Stubia!
              </p>
              <p className="text-gray-550 mb-8 text-xs leading-relaxed">
                Saat ini kami belum memiliki lowongan pekerjaan terbuka. Namun, kami akan segera mengumumkan posisi terbaru. Silakan periksa kembali halaman ini atau hubungi kami untuk informasi lebih lanjut.
              </p>
              <button
                onClick={() => setShowComingModal(false)}
                className="bg-[#0050cb] text-white font-bold py-2.5 px-8 rounded-xl hover:bg-[#0050cb]/90 text-sm transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Job Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowApplyModal(false)}></div>
          
          <div className="bg-white border border-[#c2c6d8] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 shadow-2xl animate-[fadeInScale_0.2s_ease-out]">
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-[#c2c6d8]/40 flex justify-between items-center bg-[#f2f3ff]/40">
              <div>
                <h2 className="text-[17px] font-bold text-[#191b24]">Form Lamaran Pekerjaan</h2>
                <p className="text-[12px] text-[#727687] mt-0.5">Posisi: <strong className="text-[#0050cb]">{selectedJob.title}</strong> — {selectedJob.department}</p>
              </div>
              <button 
                onClick={() => setShowApplyModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f2f3ff] text-[#424656] hover:text-[#0050cb] transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleApplySubmit} className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-4 sm:p-6 space-y-5 flex-1">

                {/* Upload Row: Photo & CV */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Foto 3x4 */}
                  <div>
                    <ImageUpload
                      value={applyPhoto}
                      onChange={setApplyPhoto}
                      folder="applications"
                      label="Foto Pas 3x4 *"
                      aspectRatio="aspect-[3/4]"
                      uploadOnly={true}
                    />
                    <p className="text-[11px] text-[#727687] mt-1">Upload foto formal 3x4 (JPG/PNG, max 10MB).</p>
                  </div>

                  {/* CV Upload */}
                  <div className="space-y-2">
                    <label className="block text-[13px] font-semibold text-[#424656]">CV / Resume *</label>
                    <div 
                      className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors aspect-[3/4] flex flex-col items-center justify-center ${
                        applyCv ? 'border-green-400 bg-green-50/30' : 'border-[#c2c6d8] hover:border-[#0050cb] bg-[#f2f3ff]/30'
                      }`}
                      onClick={() => document.getElementById('cv-file-input')?.click()}
                    >
                      <input 
                        id="cv-file-input"
                        type="file" 
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" 
                        onChange={handleCvChange} 
                        className="hidden"
                      />
                      {cvUploading ? (
                        <>
                          <span className="material-symbols-outlined text-[32px] text-[#0050cb] animate-spin">progress_activity</span>
                          <p className="text-[13px] font-medium text-[#424656] mt-2">Mengupload...</p>
                        </>
                      ) : applyCv ? (
                        <div className="text-center p-4">
                          <span className="material-symbols-outlined text-[40px] text-green-500 mb-2">task</span>
                          <p className="text-[13px] font-bold text-green-700">CV Berhasil Diupload</p>
                          <a href={applyCv} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#0050cb] underline mt-1 block" onClick={e => e.stopPropagation()}>Lihat file</a>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setApplyCv(''); }}
                            className="mt-3 px-3 py-1.5 rounded-lg bg-white border border-[#c2c6d8] text-[#ba1a1a] text-[11px] font-bold hover:bg-red-50 transition-colors flex items-center gap-1 mx-auto"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[32px] text-[#727687]">upload_file</span>
                          <p className="text-[13px] font-bold text-[#424656] mt-2">Klik untuk upload CV</p>
                          <p className="text-[11px] text-[#727687]">PDF, Word, atau Gambar (max 10MB)</p>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-[#727687]">Upload CV/resume dalam format PDF, DOC, atau gambar.</p>
                  </div>
                </div>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Nama Lengkap *</label>
                    <input
                      type="text"
                      value={applyName}
                      onChange={(e) => setApplyName(e.target.value)}
                      placeholder="Nama lengkap Anda"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24] placeholder-slate-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={applyEmail}
                      onChange={(e) => setApplyEmail(e.target.value)}
                      placeholder="contoh@email.com"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24] placeholder-slate-400"
                      required
                    />
                  </div>
                </div>

                {/* Education & Portfolio Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Pendidikan Terakhir *</label>
                    <select
                      value={applyEducation}
                      onChange={(e) => setApplyEducation(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24]"
                      required
                    >
                      <option value="SMA/SMK">SMA/SMK</option>
                      <option value="D3">D3</option>
                      <option value="S1">S1 (Sarjana)</option>
                      <option value="S2">S2 (Magister)</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Link Portofolio (Opsional)</label>
                    <input
                      type="url"
                      value={applyPortfolio}
                      onChange={(e) => setApplyPortfolio(e.target.value)}
                      placeholder="https://behance.net/username atau drive"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24] placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Start Date & Ready for Training Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Tanggal Siap Mulai Bekerja *</label>
                    <input
                      type="date"
                      value={applyStartDate}
                      onChange={(e) => setApplyStartDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24]"
                      required
                    />
                  </div>
                  <div className="flex flex-col justify-center pl-1 pt-4 sm:pt-6">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={applyTraining}
                        onChange={(e) => setApplyTraining(e.target.checked)}
                        className="w-4 h-4 rounded border-[#c2c6d8] bg-white text-[#0050cb] focus:ring-0"
                      />
                      <span className="text-[13px] font-semibold text-[#424656]">Bersedia mengikuti program training *</span>
                    </label>
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    value={applyPhone}
                    onChange={(e) => setApplyPhone(e.target.value)}
                    placeholder="Contoh: 08xxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24] placeholder-slate-400"
                    required
                  />
                </div>

                {/* Description / Cover Letter */}
                <div>
                  <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Deskripsi Diri / Cover Letter *</label>
                  <textarea
                    value={applyDesc}
                    onChange={(e) => setApplyDesc(e.target.value)}
                    placeholder="Ceritakan tentang diri Anda, pengalaman, motivasi melamar posisi ini, dan keahlian yang relevan..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13.5px] text-[#191b24] placeholder-slate-400 resize-none"
                    required
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="px-4 sm:px-6 py-4 border-t border-[#c2c6d8]/40 bg-[#f2f3ff]/40 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white border border-[#c2c6d8] hover:bg-gray-50 text-[#424656] font-semibold text-sm transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="px-6 py-2.5 rounded-xl bg-[#0050cb] hover:bg-[#003fa4] text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingApply && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
                  Kirim Lamaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {user ? (
        <PageWrapper>
          <div className="max-w-[1280px] mx-auto w-full py-4 sm:py-6 animate-fade-in">
            <h1 className="text-3xl font-extrabold text-[#191b24] mb-8">Karir di Stubia</h1>
            {mainContent}
          </div>
        </PageWrapper>
      ) : (
        <div className="flex-1 flex flex-col">
          {renderNavbar()}
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0050cb] to-[#0050cb]/80 pt-[120px] pb-16">
            <div className="max-w-[1280px] mx-auto px-6 w-full text-white">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                Bergabunglah dengan Tim Stubia
              </h1>
              <p className="text-white/90 text-lg max-w-xl">
                Kami mencari talenta terbaik untuk membangun masa depan pendidikan Indonesia
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-[1280px] mx-auto px-6 py-16 flex-1 w-full animate-fade-in">
            {mainContent}
          </div>

          <Footer />
        </div>
      )}
    </div>
  );
}
