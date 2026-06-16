import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';

export default function TeamPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teamService.list()
      .then(res => setTeam(res.data?.data || []))
      .catch(err => console.error('Gagal mengambil data tim', err))
      .finally(() => setLoading(false));
  }, []);

  const backPath = user ? '/dashboard' : '/';
  const backText = user ? 'Kembali ke Dashboard' : 'Kembali ke Beranda';

  const mainContent = (
    <>
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center">
        <div className="w-10 h-[1px] bg-primary mx-auto mb-4"></div>
        <h1 className="text-[32px] md:text-display-lg leading-[40px] md:leading-[56px] font-bold mb-6 text-on-surface tracking-tight">
          Mengenal Tim Kami
        </h1>
        <p className="text-[16px] md:text-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          EduZET didorong oleh para visioner, pendidik, dan inovator teknologi yang berdedikasi untuk memberdayakan setiap siswa melalui pendidikan berkualitas tinggi dan bimbingan yang presisi.
        </p>
      </section>

      {/* Team Grid */}
      <section className="pb-24 md:pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#727687]">
            <span className="material-symbols-outlined animate-spin text-[48px] text-[#0050cb] mb-4">progress_activity</span>
            <p className="text-lg font-medium">Memuat data tim...</p>
          </div>
        ) : team.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter">
            {team.map((member) => (
              <div 
                key={member.id} 
                className="group bg-surface-container-lowest border border-outline-variant/30 p-6 md:p-8 transition-all duration-300 hover:border-primary hover:-translate-y-1 rounded-3xl"
              >
                <div className="aspect-[4/5] mb-8 overflow-hidden bg-[#e1e2ee]/30 rounded-2xl">
                  {member.photo_url ? (
                    <img 
                      alt={member.name} 
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                      src={member.photo_url}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0050cb] to-[#003d9b] flex items-center justify-center text-white text-[32px] font-bold">
                      {member.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="mb-2">
                  <h3 className="text-[20px] font-bold text-on-surface leading-snug line-clamp-1">{member.name}</h3>
                  <p className="text-[13px] text-primary tracking-wider uppercase mb-4 mt-1 font-semibold">{member.role}</p>
                </div>
                <p className="text-[14px] md:text-body-md text-on-surface-variant mb-6 line-clamp-2 leading-relaxed">
                  {member.bio || "Mendedikasikan keahliannya untuk memajukan sistem pembelajaran digital Eduzet."}
                </p>
                <div className="flex gap-4">
                  <a 
                    className="text-on-surface-variant hover:text-[#e1306c] transition-colors flex items-center justify-center" 
                    href={member.instagram_url || "https://instagram.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Instagram"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                  <a 
                    className="text-on-surface-variant hover:text-[#0077b5] transition-colors flex items-center justify-center" 
                    href={member.linkedin_url || "https://linkedin.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="LinkedIn"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-outline-variant/20 shadow-sm">
            <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">groups</span>
            <h2 className="text-xl font-bold text-[#191b24] mb-2">Belum Ada Anggota Tim</h2>
            <p className="text-[#727687]">Silakan periksa kembali beberapa saat lagi.</p>
          </div>
        )}
      </section>

      {/* Quote/Mission Callout */}
      <section className="bg-surface-container-low py-20 md:py-32 border-y border-outline-variant/20 rounded-3xl my-12">
        <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <span className="material-symbols-outlined text-primary text-[40px] md:text-[48px] mb-6 md:mb-8" style={{ fontVariationSettings: "'FILL' 1" }}>
            format_quote
          </span>
          <blockquote className="text-[18px] sm:text-[22px] md:text-headline-lg text-on-surface italic mb-6 md:mb-8 leading-relaxed max-w-3xl mx-auto">
            "Pendidikan bukan hanya tentang mengisi wadah, tetapi tentang menyalakan api rasa ingin tahu."
          </blockquote>
          <div className="text-[12px] md:text-label-md text-on-surface-variant uppercase tracking-widest font-semibold">— Visi Akademik EduZET</div>
        </div>
      </section>

      {/* Joining Section */}
      <section className="py-20 md:py-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="lg:w-1/2 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
          <h2 className="text-[28px] sm:text-[32px] md:text-display-lg text-on-surface tracking-tight leading-tight">
            Ingin Menjadi Bagian dari Kami?
          </h2>
          <p className="text-[16px] md:text-body-lg text-on-surface-variant leading-relaxed max-w-xl">
            Kami selalu mencari talenta yang bersemangat untuk mengubah wajah pendidikan. Mari berkolaborasi dalam menciptakan masa depan yang lebih cerah.
          </p>
          <button 
            onClick={() => navigate('/careers')}
            className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-label-md hover:bg-[#003fa4] transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            Lihat Lowongan Kerja <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
        <div className="lg:w-1/2 grid grid-cols-2 gap-4 md:gap-6 w-full">
          <div className="aspect-square bg-surface-container border border-outline-variant/20 p-6 md:p-8 flex flex-col justify-center rounded-3xl">
            <span className="text-[32px] md:text-display-lg text-primary mb-2 font-bold">50+</span>
            <span className="text-[11px] md:text-label-md text-on-surface-variant uppercase tracking-wide font-semibold">Pakar Mentor</span>
          </div>
          <div className="aspect-square bg-surface-container-high border border-outline-variant/20 p-6 md:p-8 flex flex-col justify-center rounded-3xl">
            <span className="text-[32px] md:text-display-lg text-primary mb-2 font-bold">12k</span>
            <span className="text-[11px] md:text-label-md text-on-surface-variant uppercase tracking-wide font-semibold">Siswa Aktif</span>
          </div>
        </div>
      </section>
    </>
  );

  const backLink = (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-4">
      <button 
        onClick={() => navigate(backPath)} 
        className="text-primary hover:text-primary-container font-semibold flex items-center gap-2 text-[14px]"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        {backText}
      </button>
    </div>
  );

  if (user) {
    return (
      <PageWrapper>
        <div className="bg-surface text-on-surface min-h-screen flex flex-col justify-between font-sans selection:bg-primary/20 rounded-3xl p-6 md:p-12 border border-outline-variant/20">
          <main className="flex-1">
            {backLink}
            {mainContent}
          </main>
        </div>
      </PageWrapper>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col justify-between font-sans selection:bg-primary/20">
      <main className="flex-1">
        {backLink}
        {mainContent}
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-outline-variant/30">
        <div className="flex flex-col md:flex-row justify-between items-center py-12 md:py-16 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto gap-8">
          <div className="text-center md:text-left">
            <div className="text-[20px] font-bold text-on-surface mb-2">EduZET</div>
            <p className="text-[14px] md:text-body-md text-on-surface-variant max-w-xs leading-relaxed">
              Membangun jembatan menuju keunggulan akademis dan profesional di era digital.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <span onClick={() => navigate('/')} className="text-[14px] md:text-body-md text-on-surface-variant hover:text-primary cursor-pointer hover:underline transition-all">About Us</span>
            <span onClick={() => navigate('/team')} className="text-[14px] md:text-body-md text-primary font-bold cursor-pointer transition-all">Our Team</span>
            <span onClick={() => navigate('/privacy-policy')} className="text-[14px] md:text-body-md text-on-surface-variant hover:text-primary cursor-pointer hover:underline transition-all">Privacy Policy</span>
            <span onClick={() => navigate('/terms-and-conditions')} className="text-[14px] md:text-body-md text-on-surface-variant hover:text-primary cursor-pointer hover:underline transition-all">Terms of Service</span>
            <span onClick={() => navigate('/contact-us')} className="text-[14px] md:text-body-md text-on-surface-variant hover:text-primary cursor-pointer hover:underline transition-all">Contact</span>
          </div>
        </div>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-8 text-center md:text-left">
          <p className="text-[12px] text-[#727687]">
            © 2026 EduZET Academic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
