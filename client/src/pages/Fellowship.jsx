import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Footer from '../components/Footer';
import SeoHead from '../components/SeoHead';
import { fellowshipService } from '../services/api';

export default function Fellowship() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Scroll-based reveal animation
  const [visibleSections, setVisibleSections] = useState({});
  const [buddies, setBuddies] = useState([]);
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (idx) => setActiveFaq(activeFaq === idx ? null : idx);

  const faqData = [
    {
      q: "Apa itu Stubia Academic Fellowship Program?",
      a: "Program ini adalah wadah pengembangan bakat dan kemitraan eksklusif yang dirancang oleh stubia.id untuk mahasiswa aktif dan fresh graduate di seluruh Indonesia. Di sini, para Fellows akan terlibat langsung dalam proyek nyata pengembangan industri EdTech, mulai dari penyusunan materi akademis hingga pengujian sistem platform."
    },
    {
      q: "Berapa lama durasi program Fellowship ini berlangsung?",
      a: "Durasinya sangat fleksibel! Kamu bisa menentukan sendiri komitmen durasimu mulai dari 1 bulan hingga 3 bulan, sesuai dengan ketersediaan waktu luang, libur semester, atau jadwal akademik kampusmu."
    },
    {
      q: "Apakah saya tetap mendapat sertifikat jika hanya ikut selama 1 bulan?",
      a: "Ya, tentu saja. Setiap Fellows yang menyelesaikan komitmen durasi yang dipilihnya dengan baik—baik itu 1 bulan, 2 bulan, atau 3 bulan—akan tetap mendapatkan Sertifikat Resmi Digital dengan pencantuman periode tanggal durasi yang sesuai dan jujur di lembar sertifikatnya."
    },
    {
      q: "Apakah program ini berbayar atau dipungut biaya?",
      a: "Tidak. Seluruh proses pendaftaran dan pelaksanaan program ini 100% gratis. Stubia.id tidak pernah memungut biaya apa pun dari pelamar."
    },
    {
      q: "Apakah program Fellowship ini mendapatkan gaji bulanan?",
      a: "Program ini merupakan kemitraan berbasis pengembangan portofolio dan kontribusi sosial, sehingga tidak menyediakan kompensasi berupa gaji bulanan tetap (non-moneter). Namun, kami menyediakan fasilitas digital premium gratis, mentoring industri, sertifikat resmi."
    },
    {
      q: "Bagaimana sistem dan jam kerja selama program berlangsung?",
      a: "Sistem kerja berjalan secara 100% Remote / Work from Home (WFH) dan berbasis proyek mingguan (Project-Based). Waktu kerjanya sangat fleksibel (hanya membutuhkan sekitar 3–5 jam per minggu), sehingga didesain agar sama sekali tidak mengganggu jadwal kuliah atau aktivitas utama kamu."
    },
    {
      q: "Bagaimana metode koordinasi dan komunikasinya?",
      a: "Seluruh koordinasi, pembagian tugas, dan evaluasi hasil kerja dilakukan secara asinkron tertulis (100% via chat) melalui workspace resmi tim (Whatsapp). Kamu tidak perlu khawatir tentang rapat tatap muka atau panggilan video yang menyita waktu."
    },
    {
      q: "Apa saja dokumen yang perlu saya siapkan untuk mendaftar?",
      a: "Kamu hanya perlu menyiapkan Curriculum Vitae (CV) terbaru dalam format PDF/JPG untuk diunggah di formulir pendaftaran."
    }
  ];

  useEffect(() => {
    fellowshipService.listBuddies()
      .then(res => {
        if (res.data?.success && res.data.data.length > 0) {
          setBuddies(res.data.data);
        }
      })
      .catch(err => console.error("Failed to load buddies:", err));
  }, []);

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
  }, []);

  const sectionClass = (id) =>
    `transition-all duration-700 ${visibleSections[id] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`;

  const misiItems = [
    {
      icon: 'rocket_launch',
      title: 'Empowerment',
      description: 'Memberikan tantangan nyata lewat proyek pembuatan konten dan kurasi soal agar mahasiswa memiliki portofolio kerja bernilai tinggi pasca kelulusan.',
      gradient: 'from-[#0055D4] to-[#3b82f6]',
    },
    {
      icon: 'school',
      title: 'Quality & Integrity',
      description: 'Mengembangkan bank soal, pembahasan, dan kisi-kisi dengan standar kualitas ketat yang ramah siswa serta tervalidasi oleh tim kurator.',
      gradient: 'from-[#7c3aed] to-[#a78bfa]',
    },
    {
      icon: 'groups',
      title: 'Community Growth',
      description: 'Menciptakan ruang kolaboratif antar mahasiswa dari berbagai kampus untuk saling bertukar ide dan menciptakan terobosan belajar digital.',
      gradient: 'from-[#0891b2] to-[#22d3ee]',
    },
  ];

  const fellowsBuddyData = [
    {
      name: 'Sarah Wijaya',
      position: 'Academic Fellow: Question Creator',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150',
      message: 'Pengalaman di Stubia sangat luar biasa! Saya belajar merancang materi berkualitas tinggi bersama kurator terbaik.'
    },
    {
      name: 'Rian Pratama',
      position: 'Academic Fellow: Quality Assurance',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
      message: 'Dapat berkontribusi nyata dalam memperluas akses pendidikan berkualitas sembari mengasah analytical thinking saya.'
    },
    {
      name: 'Amanda Lestari',
      position: 'Academic Fellow: Content Writer',
      photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
      message: 'Stubia memberikan ruang kolaborasi yang sangat suportif bagi mahasiswa untuk bertumbuh dan berkarya.'
    },
    {
      name: 'Fikri Alamsyah',
      position: 'Academic Fellow: Product Designer',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150',
      message: 'Bertemu dengan sesama talenta muda berbakat se-Indonesia dan mengerjakan proyek EdTech secara real-time.'
    }
  ];

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

  const benefits = [
    { 
      icon: 'workspace_premium', 
      label: 'Sertifikat Resmi', 
      desc: 'Bukti kontribusi nyata yang ditandatangani langsung oleh CEO Stubia untuk memperkuat CV profesional Anda.' 
    },
    { 
      icon: 'mark_email_read', 
      label: 'Surat Rekomendasi (LoR)', 
      desc: 'Letter of Recommendation yang dipersonalisasi berdasarkan performa kerja Anda untuk melamar kerja atau beasiswa.' 
    },
    { 
      icon: 'work_history', 
      label: 'Portofolio EdTech Riil', 
      desc: 'Terlibat langsung dalam dapur produksi konten belajar yang diakses oleh puluhan ribu siswa di seluruh Indonesia.' 
    },
    { 
      icon: 'schedule', 
      label: 'Jam Kerja Fleksibel', 
      desc: 'Bebas mengatur jadwal kontribusi Anda secara remote (WFH) agar tidak bentrok dengan jadwal kuliah atau organisasi.' 
    },
    { 
      icon: 'timer', 
      label: 'Komitmen Bersahabat', 
      desc: 'Pilihan durasi kontribusi program yang fleksibel sesuai kebutuhan Anda, mulai dari jangka pendek minimal 1 bulan.' 
    },
    { 
      icon: 'groups', 
      label: 'Koneksi Antar Kampus', 
      desc: 'Bertemu, berdiskusi, dan berkolaborasi erat dengan sesama inovator muda dan mahasiswa berprestasi se-Indonesia.' 
    },
  ];

  const fellowshipSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://www.stubia.id/fellowship#webpage',
    url: 'https://www.stubia.id/fellowship',
    name: 'Academic Fellowship Program - Stubia.id',
    description: 'Stubia Academic Fellowship Program — wadah eksklusif bagi mahasiswa dan inovator muda Indonesia untuk bertumbuh di industri EdTech.',
    isPartOf: { '@id': 'https://www.stubia.id/#website' },
    inLanguage: 'id-ID',
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SeoHead
        title="Academic Fellowship Program"
        description="Stubia Academic Fellowship Program adalah wadah eksklusif bagi mahasiswa dan inovator muda di seluruh Indonesia untuk bertumbuh, mengasah keahlian industri EdTech, dan berkontribusi nyata dalam mendemokrasikan akses pendidikan berkualitas."
        canonical="/fellowship"
        schema={fellowshipSchema}
      />

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

      {/* HERO SECTION */}
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
            Shape the Future of <span className="text-[#0055D4]">Digital Education</span>
          </h1>

          <p className="text-[18px] leading-[28px] text-[#434654] max-w-2xl mx-auto">
            Stubia Academic Fellowship Program adalah wadah eksklusif bagi mahasiswa dan inovator muda di seluruh Indonesia 
            untuk bertumbuh, mengasah keahlian industri EdTech, dan berkontribusi nyata dalam mendemokrasikan akses pendidikan berkualitas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
            <button
              onClick={() => navigate('/careers')}
              className="bg-[#0055D4] text-white px-8 py-4 rounded-lg font-semibold text-[14px] tracking-[0.05em] inline-flex items-center justify-center hover:opacity-90 transition-all"
            >
              DAFTAR ACADEMIC FELLOWSHIP
            </button>
            <a
              href="#visi-misi"
              className="border border-[#0055D4] text-[#0055D4] px-8 py-4 rounded-lg font-semibold text-[14px] tracking-[0.05em] inline-flex items-center justify-center hover:bg-[#e6eeff] transition-all"
            >
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>
      </section>

      {/* VISI & MISI PROGRAM */}
      <section
        id="visi-misi"
        data-animate
        className={`py-20 md:py-28 px-4 md:px-6 bg-white ${sectionClass('visi-misi')}`}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[#EEF3FF] text-[#0055D4] border border-blue-200/60 mb-6">
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              Visi & Misi
            </div>
            <h2 className="text-[24px] md:text-[40px] font-extrabold text-[#0f172a] tracking-tight md:tracking-[-0.02em]">
              Apa itu STUBIA ACADEMIC FELLOWSHIP
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
            {/* VISI */}
            <div className="bg-white border border-[#c2c6d8]/40 rounded-3xl p-8 md:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:border-slate-300 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0055D4] flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[24px]">visibility</span>
              </div>
              <h3 className="text-[20px] md:text-[22px] font-bold text-[#0f172a] mb-4">Visi Kami</h3>
              <p className="text-[14.5px] md:text-[15.5px] leading-[26px] md:leading-[28px] text-[#4b5563] italic">
                “Membangun wadah belajar berbasis aksi di mana mahasiswa berkumpul untuk mendesain materi belajar berkualitas yang asyik, akurat, dan dapat diakses setara oleh seluruh siswa Indonesia.”
              </p>
            </div>

            {/* MISI */}
            <div className="bg-white border border-[#c2c6d8]/40 rounded-3xl p-8 md:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] hover:border-slate-300 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7c3aed] flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[24px]">flag</span>
              </div>
              <h3 className="text-[20px] md:text-[22px] font-bold text-[#0f172a] mb-6">Misi Kami</h3>
              <div className="space-y-6">
                {misiItems.map((item, idx) => {
                  const flatColors = [
                    'bg-blue-50 text-[#0055D4]',
                    'bg-purple-50 text-[#7c3aed]',
                    'bg-cyan-50 text-[#0891b2]'
                  ];
                  return (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className={`w-9 h-9 rounded-full ${flatColors[idx] || flatColors[0]} flex items-center justify-center shrink-0`}>
                        <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-[14px] md:text-[15px] text-[#0f172a] mb-1">{item.title}</h4>
                        <p className="text-[13px] text-[#64748b] leading-[20px]">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FELLOWS BUDDY & ALUMNI */}
      <section
        id="fellows"
        data-animate
        className={`py-20 md:py-28 px-4 md:px-6 bg-gradient-to-b from-[#f8f9ff] to-white ${sectionClass('fellows')}`}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-[#f0ebff] text-[#7c3aed] border border-purple-200/60 mb-6">
              <span className="material-symbols-outlined text-[16px]">groups</span>
              Fellows Buddy & Alumni
            </div>
            <h2 className="text-[24px] md:text-[44px] leading-[32px] md:leading-[52px] font-extrabold text-[#0f172a] tracking-tight mb-4">
              Bertemu dengan Tim Kami
            </h2>
            <p className="text-[15px] md:text-[17px] text-[#64748b] max-w-[600px] mx-auto leading-relaxed">
              Para Fellow terbaik yang berkontribusi dalam membangun ekosistem pendidikan digital Indonesia bersama Stubia.id.
            </p>
          </div>

          {buddies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {buddies.map((buddy) => (
                <div
                  key={buddy.id}
                  className="group relative bg-white border border-slate-200/60 rounded-2xl p-6 text-center hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    {buddy.photo_url ? (
                      <img
                        src={buddy.photo_url}
                        alt={buddy.name}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover mx-auto mb-4 border-2 border-[#0055D4]/20 shadow-md group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#0055D4] to-[#3b82f6] flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-white font-bold text-[18px] md:text-[22px]">{buddy.name?.charAt(0)}</span>
                      </div>
                    )}
                    <h4 className="font-bold text-[14px] md:text-[16px] text-[#0f172a] mb-1">{buddy.name}</h4>
                    <p className="text-[12px] md:text-[13px] text-[#0055D4] font-semibold">{buddy.position}</p>
                  </div>
                  {buddy.message && (
                    <p className="text-[11px] text-[#64748b] mt-4 leading-relaxed italic border-t border-slate-100 pt-3">
                      "{buddy.message}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative bg-gradient-to-br from-[#0055D4]/5 via-[#7c3aed]/5 to-[#0891b2]/5 border border-blue-200/50 rounded-3xl p-8 md:p-10 text-center shadow-md overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 opacity-20 blur-2xl rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-400 to-indigo-400 opacity-20 blur-2xl rounded-full"></div>
                
                <span className="material-symbols-outlined text-[44px] text-[#0055D4] mb-3.5 animate-bounce">
                  award_star
                </span>
                <h3 className="text-[18px] md:text-[22px] font-extrabold text-[#0f172a] mb-2.5">
                  Jadilah Fellowship Buddy Batch 1!
                </h3>
                <p className="text-[13px] md:text-[14px] text-[#4b5563] leading-relaxed max-w-lg mx-auto mb-6">
                  Belum ada profil fellow yang dipublikasikan. Ambil kesempatan emas ini untuk menjadi pionir, bertumbuh bersama praktisi EdTech, dan menuliskan kisah suksesmu sendiri!
                </p>
                <button
                  onClick={() => navigate('/careers')}
                  className="bg-gradient-to-r from-[#0055D4] to-[#3b82f6] text-white px-6 py-3 rounded-xl font-bold text-[12px] tracking-[0.02em] hover:shadow-lg hover:shadow-blue-500/10 transition-all transform hover:-translate-y-0.5"
                >
                  Daftar & Bergabung Sekarang
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* BENEFIT SECTION */}
      <section
        id="benefits"
        data-animate
        className={`py-20 md:py-28 px-4 md:px-6 bg-slate-50/30 border-t border-slate-100/80 ${sectionClass('benefits')}`}
      >
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[24px] md:text-[40px] font-extrabold text-[#0f172a] tracking-tight">Benefit Program</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => (
              <div 
                key={idx} 
                className="group bg-white border border-[#c2c6d8]/30 rounded-3xl p-7 shadow-[0_2px_12px_rgba(0,0,0,0.015)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:border-[#0055D4]/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-full bg-blue-50 text-[#0055D4] group-hover:bg-[#0055D4] group-hover:text-white flex items-center justify-center mb-5 transition-all duration-300">
                    <span className="material-symbols-outlined text-[20px]">{benefit.icon}</span>
                  </div>
                  <h4 className="font-bold text-[15.5px] text-[#0f172a] tracking-tight mb-2 group-hover:text-[#0055D4] transition-colors">
                    {benefit.label}
                  </h4>
                  <p className="text-[13px] text-[#64748b] leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section
        id="faq"
        data-animate
        className={`py-20 md:py-28 px-4 md:px-6 bg-white border-t border-slate-100/80 ${sectionClass('faq')}`}
      >
        <div className="max-w-[800px] mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-[24px] md:text-[40px] font-extrabold text-[#0f172a] tracking-tight">
              Frequently Asked Questions (FAQ)
            </h2>
            <p className="text-[14px] text-[#64748b] mt-3">Paling sering ditanyakan seputar program STUBIA Academic Fellowship</p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className={`border rounded-2xl transition-all duration-300 ${
                    isOpen 
                      ? 'border-[#0055D4] bg-blue-50/10 shadow-[0_4px_20px_rgba(0,85,212,0.04)]' 
                      : 'border-[#c3c6d6]/40 hover:border-[#0055D4]/40 hover:bg-slate-50/20'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-[15px] sm:text-[16px] text-[#0f172a] hover:text-[#0055D4] transition-colors focus:outline-none cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className={`material-symbols-outlined shrink-0 ml-4 transition-transform duration-300 text-[#64748b] ${
                      isOpen ? 'rotate-180 text-[#0055D4]' : ''
                    }`}>
                      expand_more
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="px-6 pb-5 text-[14px] text-[#475569] leading-relaxed border-t border-[#c3c6d6]/20 pt-4">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
