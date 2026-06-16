import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { PTN_DATA, SUBTES_SHORT } from '../data/ptnData';
import NotificationDropdown from '../components/NotificationDropdown';

/* ─── Navbar (same pattern as all other pages) ─── */
const TopNavbar = ({ user, isAdmin, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const links = [
    { to: '/dashboard',      label: 'Dashboard' },
    { to: '/latihan',        label: 'Latihan' },
    { to: '/tryout/packages',label: 'Tryout' },
    { to: '/battle',         label: 'Battle' },
    { to: '/riwayat',        label: 'Riwayat' },
    { to: '/prediksi-skor',  label: 'Prediksi Skor', active: true },
    { to: '/ujian-mandiri',  label: 'Ujian Mandiri' },
  ];

  return (
    <>
      <header className={`fixed top-0 z-[100] w-full backdrop-blur-md transition-all duration-300 ${scrolled ? 'bg-[#faf8ff]/90 shadow-sm border-b border-[#c2c6d8]/30' : 'bg-[#faf8ff] border-b border-transparent'}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-6 lg:gap-12">
            <Link to="/dashboard" className="flex items-center"><img src="/eduzet-brand-light.svg" alt="Eduzet" className="h-8 sm:h-10 md:h-12" /></Link>
            <nav className="hidden lg:flex items-center space-x-8 text-[14px] font-medium">
              {links.map(l => (
                <Link key={l.to} to={l.to} className={l.active ? 'text-[#0050cb] border-b-2 border-[#0050cb] pb-1 transition-colors' : 'text-[#424656] hover:text-[#0050cb] transition-colors'}>{l.label}</Link>
              ))}
              {isAdmin && <Link to="/admin" className="text-[#a33200] hover:text-[#0050cb] transition-colors">Admin Panel</Link>}
            </nav>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-[14px] font-medium text-[#191b24]">{user?.name?.split(' ')[0]}</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  user?.current_plan === 'sultan' ? 'bg-yellow-100 text-yellow-700' :
                  user?.current_plan === 'premium' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  <span className="material-symbols-outlined text-[10px]">
                    {user?.current_plan === 'sultan' ? 'star' : user?.current_plan === 'premium' ? 'diamond' : 'person'}
                  </span>
                  {user?.current_plan === 'sultan' ? 'Sultan' : user?.current_plan === 'premium' ? 'Premium' : 'Gratis'}
                </span>
              </div>
              <div className={`relative w-10 h-10 rounded-full bg-[#0050cb] flex items-center justify-center text-white font-bold text-sm border-2 ${
                user?.current_plan === 'sultan' ? 'border-yellow-400' : user?.current_plan === 'premium' ? 'border-blue-400' : 'border-transparent'
              }`}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                {(user?.current_plan === 'premium' || user?.current_plan === 'sultan') && (
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                    user?.current_plan === 'sultan' ? 'bg-yellow-400 text-yellow-900' : 'bg-blue-500 text-white'
                  }`}>
                    <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {user?.current_plan === 'sultan' ? 'star' : 'diamond'}
                    </span>
                  </span>
                )}
              </div>
              <NotificationDropdown />
            </div>
            <button onClick={onLogout} className="hidden sm:flex text-[#424656] hover:text-[#ba1a1a] transition-colors items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full text-[#424656]">
              <span className="material-symbols-outlined text-[24px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[99] bg-black/50 lg:hidden animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 right-0 bg-white rounded-b-[32px] shadow-2xl p-6 pt-20 animate-slide-down" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <Link to="/dashboard" className="flex items-center"><img src="/eduzet-brand-light.svg" alt="Eduzet" className="h-8" /></Link>
              <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {links.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileMenuOpen(false)} className={`px-5 py-4 rounded-2xl text-[16px] font-bold transition-colors ${l.active ? 'bg-[#dae1ff] text-[#0050cb]' : 'text-[#424656] hover:bg-[#f2f3ff]'}`}>{l.label}</Link>
              ))}
              {isAdmin && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-5 py-4 rounded-2xl text-[16px] font-bold text-[#a33200] hover:bg-[#f2f3ff]">Admin Panel</Link>}
            </nav>
            <hr className="my-6 border-[#c2c6d8]/30" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0050cb] flex items-center justify-center text-white font-bold text-lg">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#191b24]">{user?.name?.split(' ')[0]}</p>
                  <span className="text-[12px] font-bold uppercase text-[#727687]">{user?.current_plan || 'Gratis'}</span>
                </div>
              </div>
              <button onClick={() => { setMobileMenuOpen(false); onLogout(); }} className="px-6 py-3 rounded-xl text-[14px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 border border-red-100">
                <span className="material-symbols-outlined text-[18px]">logout</span> Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ─── Main Page ─── */
export default function PrediksiSkor() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // PTN & Prodi selection
  const [selectedPtnId, setSelectedPtnId] = useState('ui');
  const [selectedProdiIdx, setSelectedProdiIdx] = useState(0);
  const [showPtnModal, setShowPtnModal] = useState(false);
  const [prodiSearch, setProdiSearch] = useState('');
  const [ptnSearch, setPtnSearch] = useState('');

  // Get current PTN and Prodi
  const currentPtn = useMemo(() => PTN_DATA.find(p => p.id === selectedPtnId) || PTN_DATA[0], [selectedPtnId]);
  const currentProdi = currentPtn.prodi[selectedProdiIdx] || currentPtn.prodi[0];
  
  // Filter prodi by search
  const filteredProdi = useMemo(() => {
    if (!prodiSearch.trim()) return currentPtn.prodi;
    return currentPtn.prodi.filter(p => p.nama.toLowerCase().includes(prodiSearch.toLowerCase()));
  }, [currentPtn.prodi, prodiSearch]);

  // Filter PTN by search
  const filteredPtn = useMemo(() => {
    if (!ptnSearch.trim()) return PTN_DATA;
    const search = ptnSearch.toLowerCase();
    return PTN_DATA.filter(p => 
      p.nama.toLowerCase().includes(search) || 
      p.singkatan.toLowerCase().includes(search) ||
      p.lokasi.toLowerCase().includes(search)
    );
  }, [ptnSearch]);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="bg-[#faf8ff] text-[#191b24] min-h-screen flex flex-col font-sans">
      <TopNavbar user={user} isAdmin={isAdmin} onLogout={handleLogout} />

      <main className="flex-grow pt-20 sm:pt-24 px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto w-full pb-16">

        {/* ── Hero Section ── */}
        <div className="bg-[#0050cb] text-white rounded-3xl shadow-md overflow-hidden relative mb-12 mt-6">
          {/* Campus image background */}
          <div className="absolute inset-0 z-0">
            <img 
              src={currentPtn.image} 
              alt={currentPtn.nama}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0050cb] via-[#0050cb]/90 to-[#0050cb]/70" />
          </div>
          
          <div className="relative z-10 p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left: PTN & Prodi Info */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  {currentPtn.logo ? (
                    <img 
                      src={currentPtn.logo} 
                      alt={currentPtn.singkatan}
                      className="w-16 h-16 object-contain bg-white rounded-xl p-2"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
                      <span className="text-[16px] font-black text-[#0050cb]">{currentPtn.singkatan}</span>
                    </div>
                  )}
                  <div>
                    <h1 className="text-[24px] lg:text-[28px] font-bold leading-tight">{currentPtn.nama}</h1>
                    <p className="text-white/70 text-[14px]">{currentPtn.lokasi}</p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                  <p className="text-[11px] text-white/60 uppercase tracking-wider font-bold mb-2">Program Studi Terpilih</p>
                  <h2 className="text-[20px] lg:text-[24px] font-bold text-white leading-tight mb-1">{currentProdi.nama}</h2>
                  <p className="text-[13px] text-white/70">{currentProdi.jenjang} • Daya tampung: {currentProdi.daya_tampung || '-'}</p>
                  
                  {/* Subtes badges */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                    {currentProdi.subtes.map((sub, i) => {
                      const cfg = SUBTES_SHORT[sub];
                      return (
                        <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${cfg?.color || 'bg-gray-100 text-gray-700'}`}>
                          <span className="material-symbols-outlined text-[14px]">{cfg?.icon || 'help'}</span>
                          {cfg?.label || sub}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Right: Skor UTBK */}
              <div className="lg:text-right">
                <p className="text-[12px] text-white/60 uppercase tracking-wider font-bold mb-2">Skor UTBK Minimum</p>
                <span className="text-[72px] lg:text-[96px] font-black leading-none text-white">
                  {currentProdi.skor}
                </span>
                <p className="text-[14px] text-white/70 mt-2">Rata-rata skor peserta yang lolos</p>
                
                <button
                  onClick={() => setShowPtnModal(true)}
                  className="mt-6 px-8 py-3 bg-white text-[#0050cb] rounded-xl font-bold hover:bg-[#f2f3ff] transition-all text-[14px] inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                  Ganti PTN & Prodi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Subtes Pendukung ── */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[26px] font-bold">Subtes Pendukung</h2>
              <p className="text-[14px] text-[#727687] mt-1">3 subtes yang paling berpengaruh untuk prodi {currentProdi.nama}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {currentProdi.subtes.map((sub, idx) => {
              const cfg = SUBTES_SHORT[sub];
              const priority = idx === 0 ? 'Prioritas Utama' : idx === 1 ? 'Prioritas Kedua' : 'Prioritas Ketiga';
              const priorityColor = idx === 0 ? 'bg-[#0050cb] text-white' : idx === 1 ? 'bg-[#0050cb]/20 text-[#0050cb]' : 'bg-[#e6e7f4] text-[#424656]';
              
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-[#c2c6d8]/30 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-5">
                    <span className={`material-symbols-outlined p-3 rounded-xl text-[28px] ${cfg?.color || 'bg-gray-100 text-gray-700'}`}>
                      {cfg?.icon || 'help'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${priorityColor}`}>
                      {priority}
                    </span>
                  </div>
                  <h4 className="text-[18px] font-bold text-[#191b24] mb-1">{sub}</h4>
                  <p className="text-[13px] text-[#727687] mb-4">Kode: {cfg?.label || '-'}</p>
                  
                  <div className="pt-4 border-t border-[#c2c6d8]/20">
                    <p className="text-[12px] text-[#424656]">
                      {idx === 0 
                        ? 'Subtes ini memiliki bobot tertinggi untuk prodi ini. Fokuskan latihan di sini.'
                        : idx === 1
                        ? 'Subtes pendukung penting. Pastikan skor kamu di atas rata-rata.'
                        : 'Subtes pelengkap. Jaga konsistensi skor di subtes ini.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tips Section ── */}
        <div className="mt-12 bg-[#0050cb]/5 border border-[#0050cb]/20 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined text-[#0050cb] text-[28px] shrink-0 mt-0.5">lightbulb</span>
            <div>
              <h3 className="font-bold text-[#191b24] text-[16px] mb-1">Tips Meningkatkan Skor</h3>
              <p className="text-[14px] text-[#424656]">
                Fokus pada subtest dengan status <span className="font-bold text-[#ba1a1a]">Perlu Fokus</span>. Latihan rutin minimal 30 soal per hari dan gunakan fitur pembahasan untuk memahami pola soal. Konsistensi adalah kunci utama.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── PTN & Prodi Modal ── */}
      {showPtnModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowPtnModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-[#191b24]">Pilih PTN & Program Studi</h3>
              <button onClick={() => setShowPtnModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            {/* Two Column Layout */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-0 overflow-y-auto lg:overflow-hidden pr-1">
              {/* Left Column - PTN */}
              <div className="w-full lg:w-1/2 flex flex-col shrink-0 lg:shrink lg:min-h-0">
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-[#424656] mb-2">Cari Perguruan Tinggi Negeri</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727687] text-[20px]">search</span>
                    <input
                      type="text"
                      placeholder="Ketik nama PTN, singkatan, atau lokasi..."
                      value={ptnSearch}
                      onChange={(e) => setPtnSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#c2c6d8]/30 focus:border-[#0050cb] focus:outline-none text-[14px]"
                    />
                  </div>
                </div>

                <div className="h-[140px] lg:h-auto lg:flex-1 overflow-y-auto pr-1 min-h-0">
                  <div className="grid grid-cols-2 gap-2">
                    {filteredPtn.map(ptn => (
                      <button
                        key={ptn.id}
                        onClick={() => {
                          setSelectedPtnId(ptn.id);
                          setSelectedProdiIdx(0);
                          setProdiSearch('');
                        }}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left ${selectedPtnId === ptn.id ? 'border-[#0050cb] bg-[#f2f3ff]' : 'border-[#c2c6d8]/30 hover:border-[#0050cb]/40'}`}
                      >
                        <img src={ptn.logo} alt={ptn.singkatan} className="w-8 h-8 object-contain shrink-0" />
                        <span className="font-bold text-[13px] text-[#191b24] truncate">{ptn.singkatan}</span>
                      </button>
                    ))}
                  </div>
                  {filteredPtn.length === 0 && (
                    <div className="text-center py-8 text-[#727687]">
                      <span className="material-symbols-outlined text-[48px] mb-2">search_off</span>
                      <p>Tidak ada PTN yang cocok</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-px bg-[#c2c6d8]/30" />

              {/* Right Column - Prodi */}
              <div className="w-full lg:w-1/2 flex flex-col shrink-0 lg:shrink lg:min-h-0">
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-[#424656] mb-2">
                    Program Studi - <span className="text-[#0050cb]">{currentPtn.singkatan}</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727687] text-[20px]">search</span>
                    <input
                      type="text"
                      placeholder="Ketik nama prodi..."
                      value={prodiSearch}
                      onChange={(e) => setProdiSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#c2c6d8]/30 focus:border-[#0050cb] focus:outline-none text-[14px]"
                    />
                  </div>
                </div>
                
                <div className="h-[200px] lg:h-auto lg:flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                  {filteredProdi.map((prodi, idx) => {
                    const realIdx = currentPtn.prodi.indexOf(prodi);
                    const isSelected = realIdx === selectedProdiIdx;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedProdiIdx(realIdx);
                          setShowPtnModal(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isSelected ? 'border-[#0050cb] bg-[#f2f3ff]' : 'border-[#c2c6d8]/30 hover:border-[#0050cb]/40 hover:bg-[#f2f3ff]/50'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[13px] text-[#191b24] truncate">{prodi.nama}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[11px] text-[#424656]">{prodi.jenjang}</span>
                            <span className="text-[10px] text-[#727687]">•</span>
                            <span className="text-[11px] text-[#727687]">Daya tampung: {prodi.daya_tampung || '-'}</span>
                          </div>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {prodi.subtes.map((sub, i) => {
                              const cfg = SUBTES_SHORT[sub];
                              return (
                                <span key={i} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${cfg?.color || 'bg-gray-100 text-gray-700'}`}>
                                  {cfg?.label || sub}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <p className="text-[10px] text-[#727687]">Skor min.</p>
                          <p className="text-[16px] font-bold text-[#0050cb]">{prodi.skor}</p>
                        </div>
                      </button>
                    );
                  })}
                  {filteredProdi.length === 0 && (
                    <div className="text-center py-8 text-[#727687]">
                      <span className="material-symbols-outlined text-[48px] mb-2">search_off</span>
                      <p>Tidak ada prodi yang cocok</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
