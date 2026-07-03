import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Footer from '../components/Footer';
import { careerService, certificateService } from '../services/api';
import toast from 'react-hot-toast';

export default function Careers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('Semua');

  // Scroll-based reveal animation
  const [visibleSections, setVisibleSections] = useState({});

  // Certificate verification state
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  const handleVerifyCertificate = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);
    setVerifyError(null);
    try {
      const res = await certificateService.search(verifyCode.trim());
      setVerifyResult(res.data.data);
    } catch (err) {
      setVerifyError('Sertifikat tidak ditemukan. Periksa kembali kode yang Anda masukkan.');
    } finally {
      setVerifyLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        setLoading(true);
        const res = await careerService.list();
        const activeCareers = res.data.data || [];
        setCareers(activeCareers);
      } catch (err) {
        console.error(err);
        toast.error('Gagal mengambil daftar lowongan pekerjaan');
      } finally {
        setLoading(false);
      }
    };

    fetchCareers();
  }, []);

  // Filter jobs by type (normal jobs vs fellowship jobs)
  const normalJobs = careers.filter(job => job.type?.toLowerCase() !== 'fellowship');
  const fellowshipJobs = careers.filter(job => job.type?.toLowerCase() === 'fellowship');

  // Get unique departments for filter
  const departments = ['Semua', ...new Set(normalJobs.map(job => job.department))];
  
  const filteredCareers = departmentFilter === 'Semua' 
    ? normalJobs 
    : normalJobs.filter(job => job.department === departmentFilter);

  const sectionClass = (id) =>
    `transition-all duration-700 ${visibleSections[id] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`;

  const getDeptIcon = (dept) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('engineering') || d.includes('tech') || d.includes('dev')) return 'code';
    if (d.includes('design') || d.includes('creative')) return 'palette';
    if (d.includes('marketing') || d.includes('sales')) return 'campaign';
    if (d.includes('content') || d.includes('curriculum') || d.includes('tutor') || d.includes('tentor') || d.includes('writer')) return 'menu_book';
    return 'work';
  };

  const getDeptColor = (dept) => {
    const d = (dept || '').toLowerCase();
    if (d.includes('engineering') || d.includes('tech') || d.includes('dev')) return 'from-[#2563eb] to-[#3b82f6]';
    if (d.includes('design') || d.includes('creative')) return 'from-[#db2777] to-[#f43f5e]';
    if (d.includes('marketing') || d.includes('sales')) return 'from-[#7e22ce] to-[#a855f7]';
    return 'from-[#0d9488] to-[#14b8a6]';
  };

  const values = [
    {
      icon: 'lightbulb',
      title: 'Inovasi',
      description: 'Kami menantang status quo dan mendorong ide-ide berani yang melampaui batas dari apa yang mungkin dilakukan di industri pendidikan.',
    },
    {
      icon: 'groups',
      title: 'Kolaborasi',
      description: 'Kesuksesan adalah upaya kolektif. Kami meruntuhkan sekat-sekat untuk bekerja sama mencapai tujuan bersama dengan transparansi dan rasa hormat.',
    },
    {
      icon: 'trending_up',
      title: 'Pertumbuhan',
      description: 'Kami berinvestasi pada sumber daya manusia kami. Mulai dari bimbingan hingga tunjangan belajar, kami memastikan evolusi profesional Anda tidak pernah berhenti.',
    },
  ];

  const perks = [
    { icon: 'home_work', label: 'Kerja Remote' },
    { icon: 'medical_services', label: 'Asuransi Kesehatan' },
    { icon: 'school', label: 'Anggaran Belajar' },
    { icon: 'timer', label: 'Jam Kerja Fleksibel' },
    { icon: 'payments', label: 'Gaji Kompetitif' },
    { icon: 'flight', label: 'Cuti Tak Terbatas' },
    { icon: 'laptop_mac', label: 'Teknologi Modern' },
    { icon: 'celebration', label: 'Retret Tim' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#c3c6d6]/30 h-[70px] flex items-center">
        <div className="flex justify-between items-center px-4 md:px-6 max-w-[1280px] mx-auto w-full">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <img
              src="/stubiabrandicon.png"
              alt="Stubia"
              className="h-10 w-auto"
            />
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button 
                className="bg-[#0055D4] hover:bg-[#003fa4] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all" 
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </button>
            ) : (
              <>
                <button 
                  className="text-[#434654] hover:text-[#0055D4] font-semibold text-sm px-4 py-2 transition-colors" 
                  onClick={() => navigate('/login')}
                >
                  Login
                </button>
                <button 
                  className="bg-[#0055D4] hover:bg-[#003fa4] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all" 
                  onClick={() => navigate('/register')}
                >
                  Daftar Gratis
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section 
        id="hero"
        data-animate
        className={`relative overflow-hidden pt-[120px] pb-16 md:pt-[160px] md:pb-24 px-4 md:px-6 max-w-[1280px] mx-auto flex flex-col items-center gap-12 ${sectionClass('hero')}`}
      >
        <div className="w-full flex flex-col items-center text-center space-y-8 z-10">
          <div className="mb-4">
            <img 
              alt="stubia.id logo" 
              className="h-16 w-auto mx-auto" 
              src="/stubiabrandicon.png"
            />
          </div>
          <h1 className="text-[24px] md:text-[48px] leading-[32px] md:leading-[56px] font-bold md:font-extrabold text-[#121c2a] max-w-3xl mx-auto tracking-tight md:tracking-[-0.02em]">
            Bangun Masa Depan Anda bersama <span className="text-[#0055D4]">Stubia</span>
          </h1>
          <p className="text-[18px] leading-[28px] text-[#434654] max-w-2xl mx-auto">
            Bergabunglah dengan tim visioner dan pemecah masalah. Kami sedang membangun infrastruktur pendidikan profesional generasi berikutnya yang menghargai perspektif unik dan keunggulan teknis Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
            <a 
              href="#jobs" 
              className="bg-[#0055D4] text-white px-8 py-4 rounded-lg font-semibold text-[14px] tracking-[0.05em] inline-flex items-center justify-center hover:opacity-90 transition-all"
            >
              Lihat Lowongan
            </a>
            <a 
              href="#values" 
              className="border border-[#0055D4] text-[#0055D4] px-8 py-4 rounded-lg font-semibold text-[14px] tracking-[0.05em] inline-flex items-center justify-center hover:bg-[#e6eeff] transition-all"
            >
              Budaya Kami
            </a>
          </div>
        </div>
      </section>

      {/* ── Values / Culture Section ── */}
      <section 
        id="values"
        data-animate
        className={`bg-[#eff4ff] py-16 md:py-24 ${sectionClass('values')}`}
      >
        <div className="px-4 md:px-6 max-w-[1280px] mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-[32px] leading-[40px] font-bold text-[#121c2a] tracking-[-0.01em]">Budaya Kami</h2>
            <p className="text-[16px] leading-[24px] text-[#434654] max-w-2xl mx-auto">
              Kami beroperasi di atas fondasi kepercayaan, di mana setiap individu memiliki agensi untuk mendorong perubahan dan dukungan untuk mengembangkan karier mereka.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, idx) => (
              <div 
                key={idx} 
                className="bg-white p-10 rounded-xl border border-[#c3c6d6] text-center flex flex-col items-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-[#e6eeff] rounded-full flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[#0055D4] text-3xl">{value.icon}</span>
                </div>
                <h3 className="text-[24px] leading-[32px] font-semibold text-[#121c2a] mb-4">{value.title}</h3>
                <p className="text-[16px] leading-[24px] text-[#434654]">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Job Listings Section ── */}
      <section 
        id="jobs"
        data-animate
        className={`py-16 md:py-24 px-4 md:px-6 max-w-[1280px] mx-auto w-full ${sectionClass('jobs')}`}
      >
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="space-y-4">
            <h2 className="text-[32px] leading-[40px] font-bold text-[#121c2a] tracking-[-0.01em]">Lowongan Pekerjaan</h2>
            <p className="text-[16px] leading-[24px] text-[#434654]">Temukan peran yang sesuai dengan keahlian dan ambisi Anda.</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-4 py-2 rounded-full text-[14px] font-semibold tracking-[0.05em] whitespace-nowrap cursor-pointer transition-colors ${
                  departmentFilter === dept 
                    ? 'bg-[#0055D4] text-white' 
                    : 'bg-[#e6eeff] text-[#0055D4] hover:bg-[#dee9fc]'
                }`}
              >
                {dept === 'Semua' ? 'Semua Peran' : dept}
              </button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-3 border-[#0055D4] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredCareers.length === 0 ? (
          <div className="bg-white border border-[#c3c6d6] rounded-xl py-20 text-center">
            <span className="material-symbols-outlined text-[64px] text-[#c3c6d6] block mb-4">work_outline</span>
            <h3 className="text-[24px] font-semibold text-[#121c2a] mb-2">Belum Ada Lowongan</h3>
            <p className="text-[16px] text-[#434654] max-w-md mx-auto">
              {departmentFilter !== 'Semua' 
                ? `Saat ini belum ada lowongan untuk divisi ${departmentFilter}. Coba lihat divisi lainnya.`
                : 'Saat ini belum ada lowongan yang tersedia. Silakan periksa kembali di kemudian hari.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredCareers.map((job) => {
              const typeSlug = (job.type || 'volunteer').toLowerCase().replace(/\s+/g, '-');
              const isRemote = (job.location || '').toLowerCase().includes('remote');
              
              // Parse bullets safely
              const descBullets = (job.description || '').split('\n').filter(b => b.trim()).slice(0, 3);
              const reqBullets = (job.requirements || '').split('\n').filter(b => b.trim()).slice(0, 3);

              return (
                <div 
                  key={job.id} 
                  className="bg-white border border-[#c3c6d6] rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-[#0055D4]/40 hover:shadow-lg transition-all duration-300 relative"
                >
                  <div>
                    {/* Header: megphone icon + Title + badges */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`w-14 h-14 bg-gradient-to-tr ${getDeptIcon(job.department) === 'work' ? 'from-[#0055D4] to-[#3b82f6]' : getDeptColor(job.department)} rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm`}>
                        <span className="material-symbols-outlined text-[28px]">{getDeptIcon(job.department)}</span>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-[20px] leading-[26px] font-bold text-[#121c2a]">{job.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-[#ffebd5] text-[#ea580c] font-bold text-[11px] px-3 py-1 rounded-full flex items-center gap-1 select-none">
                            <span className="material-symbols-outlined text-[14px]">work</span> {job.type}
                          </span>
                          <span className="bg-[#dbeafe] text-[#2563eb] font-bold text-[11px] px-3 py-1 rounded-full flex items-center gap-1 select-none">
                            <span className="material-symbols-outlined text-[14px]">{isRemote ? 'home_work' : 'location_on'}</span> {isRemote ? 'Remote' : job.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dashed line separator */}
                    <div className="border-t border-dashed border-[#c3c6d6]/60 my-5"></div>

                    {/* Deskripsi Pekerjaan */}
                    {descBullets.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-[14px] font-bold text-[#121c2a] flex items-center gap-1.5 mb-2">
                          <span className="material-symbols-outlined text-[18px] text-[#0055D4]">format_list_bulleted</span>
                          Deskripsi Pekerjaan
                        </h4>
                        <ul className="space-y-1 text-[13px] text-[#434654] list-disc list-inside pl-1">
                          {descBullets.map((bullet, idx) => (
                            <li key={idx} className="leading-[20px] truncate">{bullet.replace(/^-\s*/, '')}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Kualifikasi */}
                    {reqBullets.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-[14px] font-bold text-[#121c2a] flex items-center gap-1.5 mb-2">
                          <span className="material-symbols-outlined text-[18px] text-[#0055D4]">person</span>
                          Kualifikasi
                        </h4>
                        <ul className="space-y-1 text-[13px] text-[#434654] list-disc list-inside pl-1">
                          {reqBullets.map((bullet, idx) => (
                            <li key={idx} className="leading-[20px] truncate">{bullet.replace(/^-\s*/, '')}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Lamar button */}
                  <button
                    onClick={() => {
                      navigate(`/careers/daftar/${typeSlug}/${job.id}`);
                    }}
                    className="w-full bg-[#0055D4] hover:bg-[#003fa4] text-white font-bold py-3.5 px-6 rounded-2xl text-center text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-[#0055D4]/10 cursor-pointer"
                  >
                    <span>Lamar Sekarang</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Program Fellowship Section ── */}
      <section 
        id="fellowships"
        data-animate
        className={`py-16 md:py-24 px-4 md:px-6 max-w-[1280px] mx-auto w-full border-t border-slate-100 ${sectionClass('fellowships')}`}
      >
        <div className="text-left mb-12 space-y-4">
          <h2 className="text-[32px] leading-[40px] font-bold text-[#121c2a] tracking-[-0.01em]">Program Fellowship</h2>
          <p className="text-[16px] leading-[24px] text-[#434654]">Temukan kesempatan berkontribusi nyata dalam mendemokrasikan pendidikan berkualitas melalui program fellowship kami.</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-3 border-[#0055D4] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : fellowshipJobs.length === 0 ? (
          <div className="bg-white border border-[#c3c6d6] rounded-xl py-20 text-center">
            <span className="material-symbols-outlined text-[64px] text-[#c3c6d6] block mb-4">work_outline</span>
            <h3 className="text-[24px] font-semibold text-[#121c2a] mb-2">Belum Ada Lowongan Fellowship</h3>
            <p className="text-[16px] text-[#434654] max-w-md mx-auto">
              Saat ini pendaftaran program Fellowship belum dibuka. Silakan periksa kembali di kemudian hari.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {fellowshipJobs.map((job) => {
              const typeSlug = (job.type || 'fellowship').toLowerCase().replace(/\s+/g, '-');
              const isRemote = (job.location || '').toLowerCase().includes('remote');
              
              const descBullets = (job.description || '').split('\n').filter(b => b.trim()).slice(0, 3);
              const reqBullets = (job.requirements || '').split('\n').filter(b => b.trim()).slice(0, 3);

              return (
                <div 
                  key={job.id} 
                  className="bg-white border border-[#c3c6d6] rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-[#0055D4]/40 hover:shadow-lg transition-all duration-300 relative"
                >
                  <div>
                    {/* Header: icon + Title + badges */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`w-14 h-14 bg-gradient-to-tr ${getDeptIcon(job.department) === 'work' ? 'from-[#0055D4] to-[#3b82f6]' : getDeptColor(job.department)} rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm`}>
                        <span className="material-symbols-outlined text-[28px]">{getDeptIcon(job.department)}</span>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-[20px] leading-[26px] font-bold text-[#121c2a]">{job.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-[#ffebd5] text-[#ea580c] font-bold text-[11px] px-3 py-1 rounded-full flex items-center gap-1 select-none">
                            <span className="material-symbols-outlined text-[14px]">work</span> {job.type}
                          </span>
                          <span className="bg-[#dbeafe] text-[#2563eb] font-bold text-[11px] px-3 py-1 rounded-full flex items-center gap-1 select-none">
                            <span className="material-symbols-outlined text-[14px]">{isRemote ? 'home_work' : 'location_on'}</span> {isRemote ? 'Remote' : job.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dashed line separator */}
                    <div className="border-t border-dashed border-[#c3c6d6]/60 my-5"></div>

                    {/* Deskripsi Pekerjaan */}
                    {descBullets.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-[14px] font-bold text-[#121c2a] flex items-center gap-1.5 mb-2">
                          <span className="material-symbols-outlined text-[18px] text-[#0055D4]">format_list_bulleted</span>
                          Deskripsi Pekerjaan
                        </h4>
                        <ul className="space-y-1 text-[13px] text-[#434654] list-disc list-inside pl-1">
                          {descBullets.map((bullet, idx) => (
                            <li key={idx} className="leading-[20px] truncate">{bullet.replace(/^-\s*/, '')}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Kualifikasi */}
                    {reqBullets.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-[14px] font-bold text-[#121c2a] flex items-center gap-1.5 mb-2">
                          <span className="material-symbols-outlined text-[18px] text-[#0055D4]">person</span>
                          Kualifikasi
                        </h4>
                        <ul className="space-y-1 text-[13px] text-[#434654] list-disc list-inside pl-1">
                          {reqBullets.map((bullet, idx) => (
                            <li key={idx} className="leading-[20px] truncate">{bullet.replace(/^-\s*/, '')}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Lamar button */}
                  <button
                    onClick={() => {
                      navigate(`/careers/daftar/${typeSlug}/${job.id}`);
                    }}
                    className="w-full bg-[#0055D4] hover:bg-[#003fa4] text-white font-bold py-3.5 px-6 rounded-2xl text-center text-sm flex items-center justify-center gap-2 transition-all shadow-sm shadow-[#0055D4]/10 cursor-pointer"
                  >
                    <span>Lamar Sekarang</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Perks & Benefits Section ── */}
      <section 
        id="perks"
        data-animate
        className={`bg-[#e6eeff] py-16 md:py-24 ${sectionClass('perks')}`}
      >
        <div className="px-4 md:px-6 max-w-[1280px] mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-[32px] leading-[40px] font-bold text-[#121c2a] tracking-[-0.01em]">Tunjangan & Manfaat</h2>
            <p className="text-[16px] leading-[24px] text-[#434654] max-w-2xl mx-auto">
              Kami peduli dengan kesejahteraan Anda sama seperti pekerjaan Anda. Inilah yang kami tawarkan kepada tim kami.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {perks.map((perk, idx) => (
              <div 
                key={idx} 
                className="bg-white p-8 rounded-xl flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <span className="material-symbols-outlined text-[#0055D4] text-4xl mb-4">{perk.icon}</span>
                <h4 className="text-[14px] leading-[20px] font-semibold tracking-[0.05em] text-[#121c2a]">{perk.label}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section 
        id="cta"
        data-animate
        className={`py-16 md:py-24 px-4 md:px-6 max-w-[1280px] mx-auto w-full text-center ${sectionClass('cta')}`}
      >
        <div className="bg-[#0055D4] text-white p-12 md:p-24 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="relative z-10 space-y-8">
            <h2 className="text-[24px] md:text-[48px] leading-[32px] md:leading-[56px] font-bold md:font-extrabold tracking-tight md:tracking-[-0.02em]">Tidak menemukan yang cocok?</h2>
            <p className="text-[18px] leading-[28px] text-white/90 max-w-2xl mx-auto">
              Kami selalu mencari talenta luar biasa untuk bergabung dalam misi kami. Kirimkan CV Anda saja, dan kami akan mempertimbangkan Anda untuk lowongan di masa depan.
            </p>
            <div className="pt-6">
              <button 
                onClick={() => {
                  window.open('mailto:careers@stubia.id?subject=Lamaran Spontan - Stubia', '_blank');
                }}
                className="bg-white text-[#0055D4] px-10 py-5 rounded-lg font-semibold text-[14px] tracking-[0.05em] hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                Kirim Lamaran Spontan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Certificate Verification Section ── */}
      <section
        id="verifikasi-sertifikat"
        data-animate
        className={`py-20 px-4 bg-gradient-to-b from-slate-50 to-white border-t border-slate-100 transition-all duration-700 ${visibleSections['verifikasi-sertifikat'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="max-w-2xl mx-auto text-center">
          {/* Header */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[#EEF3FF] text-[#0055D4] border border-blue-200 mb-6">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Verifikasi Sertifikat
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Cek Keaslian Sertifikat
          </h2>
          <p className="text-slate-500 text-lg mb-10 leading-relaxed">
            Masukkan kode sertifikat Stubia.id untuk memverifikasi keasliannya secara instan.
          </p>

          {/* Input Form */}
          <form onSubmit={handleVerifyCertificate} className="mb-6">
            <div className="flex gap-3 max-w-lg mx-auto">
              <input
                type="text"
                id="verifikasi-input"
                value={verifyCode}
                onChange={(e) => {
                  setVerifyCode(e.target.value);
                  setVerifyResult(null);
                  setVerifyError(null);
                }}
                placeholder="Contoh: STUBIA/2025/INT/001"
                className="flex-1 px-5 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#0055D4] focus:ring-2 focus:ring-[#0055D4]/10 text-slate-900 placeholder-slate-400 font-mono text-sm transition-all"
              />
              <button
                id="verifikasi-btn"
                type="submit"
                disabled={verifyLoading || !verifyCode.trim()}
                className="px-6 py-3.5 bg-[#0055D4] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center gap-2 transition-all shrink-0"
              >
                {verifyLoading ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">search</span>
                )}
                Cek
              </button>
            </div>
          </form>

          {/* Success Result */}
          {verifyResult && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 text-left max-w-lg mx-auto shadow-sm">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
                </div>
                <span className="font-bold text-emerald-700 text-base">Sertifikat Terverifikasi</span>
                <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">VALID ✓</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Nama Penerima', value: verifyResult.recipient_name },
                  { label: 'Posisi / Jabatan', value: verifyResult.position },
                  { label: 'Program', value: verifyResult.program_type === 'internship' ? 'Magang (Internship)' : 'Relawan (Volunteer)' },
                  { label: 'Periode', value: `${new Date(verifyResult.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} – ${new Date(verifyResult.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` },
                  { label: 'Kode Sertifikat', value: verifyResult.certificate_code, mono: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-start gap-4 text-sm">
                    <span className="text-slate-500 shrink-0">{row.label}</span>
                    <span className={`font-semibold text-slate-900 text-right ${row.mono ? 'font-mono text-[#0055D4]' : ''}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {verifyError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-center gap-3 max-w-lg mx-auto">
              <span className="material-symbols-outlined text-red-500 text-[24px] shrink-0">cancel</span>
              <p className="text-red-700 font-medium text-sm text-left">{verifyError}</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <Footer />

      {/* ── Custom Styles ── */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
