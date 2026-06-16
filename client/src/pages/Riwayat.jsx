import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { activityService } from '../services/api';
import ChatWidget from '../components/ChatWidget';
import Footer from '../components/Footer';
import NotificationDropdown from '../components/NotificationDropdown';

const TopNavbar = ({ user, isAdmin, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h); 
    return () => window.removeEventListener('scroll', h);
  }, []);

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/latihan', label: 'Latihan' },
    { to: '/tryout/packages', label: 'Tryout' },
    { to: '/battle', label: 'Battle' },
    { to: '/riwayat', label: 'Riwayat', active: true },
    { to: '/prediksi-skor', label: 'Prediksi Skor' },
    { to: '/ujian-mandiri', label: 'Ujian Mandiri' },
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

const Riwayat = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        const res = await activityService.getRiwayat();
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch riwayat:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRiwayat();
  }, []);

  const summary = data?.summary || { avgScore: 0, totalExams: 0, totalTryouts: 0, totalLatihan: 0, percentile: 0, scoreChange: 0 };
  const history = data?.history || [];

  const filteredHistory = search
    ? history.filter(h => h.name.toLowerCase().includes(search.toLowerCase()))
    : history;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bg-[#faf8ff] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-[#424656]">Memuat riwayat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8ff] text-[#191b24] min-h-screen flex flex-col font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        .premium-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(8px);
            border: 1px solid #E2E8F0;
            box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .premium-card:hover {
            transform: translateY(-4px);
            box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.08);
        }
        .accent-gradient {
            background: linear-gradient(135deg, #0052cc 0%, #003d9b 100%);
        }
      `}} />
      
      <TopNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />
      
      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 mb-24 flex-grow w-full mt-16 sm:mt-20">
        {/* Header Section */}
        <section className="mb-12">
          <h1 className="text-[40px] font-extrabold leading-[52px] tracking-tight text-[#0050cb] mb-2">Riwayat Belajar</h1>
          <p className="text-base font-normal text-[#434654] opacity-80">Pantau progres dan performa akademismu secara mendalam.</p>
        </section>

        {/* Stats Overview Bento-ish Layout */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Average IRT Card */}
          <div className="premium-card p-8 rounded-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 accent-gradient opacity-5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#0052cc]/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#003d9b] text-2xl">insights</span>
              </div>
              <p className="text-xs font-semibold text-[#434654] uppercase tracking-wider mb-2">Skor Rata-Rata IRT</p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[40px] font-extrabold leading-[52px] tracking-tight text-[#111c2d]">{summary.avgScore}</span>
              <span className="text-xl font-bold text-[#737685]">/1000</span>
            </div>
          </div>

          {/* Exams Count Card */}
          <div className="premium-card p-8 rounded-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#006e2f] opacity-5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#006e2f]/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#006e2f] text-2xl">assignment_turned_in</span>
              </div>
              <p className="text-xs font-semibold text-[#434654] uppercase tracking-wider mb-2">Total Ujian Diikuti</p>
            </div>
            <div>
              <span className="text-[40px] font-extrabold leading-[52px] tracking-tight text-[#111c2d]">{summary.totalExams}</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full bg-[#dee8ff] text-[#434654] text-xs font-semibold">{summary.totalTryouts} Tryout</span>
                <span className="px-3 py-1 rounded-full bg-[#f0f3ff] text-[#737685] text-xs font-semibold">{summary.totalLatihan} Latihan</span>
              </div>
            </div>
          </div>

          {/* Percentile Rank Card */}
          <div className="premium-card p-8 rounded-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#3e444c] opacity-5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform"></div>
            <div>
              <div className="w-12 h-12 rounded-lg bg-[#3e444c]/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#3e444c] text-2xl">military_tech</span>
              </div>
              <p className="text-xs font-semibold text-[#434654] uppercase tracking-wider mb-2">Peringkat Persentil</p>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-[40px] font-extrabold leading-[52px] tracking-tight text-[#111c2d]">{summary.percentile > 0 ? summary.percentile : '-'}</span>
                <span className="text-xl font-bold text-[#737685]">{summary.percentile > 0 ? '%' : ''}</span>
              </div>
              {summary.percentile > 0 ? (
                <p className="text-sm text-[#006e2f] font-semibold mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  Berada di {100 - summary.percentile}% teratas
                </p>
              ) : (
                <p className="text-sm text-[#737685] font-semibold mt-2 flex items-center gap-1">
                  Belum ada data peringkat
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Detailed History List */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <h2 className="text-xl font-bold text-[#111c2d]">Riwayat Aktivitas</h2>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737685] text-lg">search</span>
              <input 
                className="pl-10 pr-4 py-2 w-full border border-[#c3c6d6] rounded-xl text-sm focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] transition-all bg-white" 
                placeholder="Cari aktivitas..." 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredHistory.length > 0 ? (
            filteredHistory.map((h, i) => {
              const isTryout = h.type === 'tryout';
              const isUM = h.type === 'ujian_mandiri_tryout';
              
              let iconName = 'school';
              let indicatorColor = 'bg-[#003d9b]';
              let sideBgColor = 'md:bg-[#dee8ff]';
              
              if (h.type === 'latihan') {
                iconName = 'menu_book';
                indicatorColor = 'bg-[#3e444c]';
                sideBgColor = 'md:bg-[#f0f3ff]';
              } else if (isUM) {
                iconName = 'account_balance';
                indicatorColor = 'bg-[#8b5cf6]';
                sideBgColor = 'md:bg-[#f3e8ff]';
              }
              
              let tags = [];
              if (isTryout) {
                tags.push(
                  <span key="tag1" className="px-2 py-1 rounded text-[10px] font-bold tracking-tight uppercase bg-[#003d9b] text-white leading-none inline-flex items-center">
                    UTBK
                  </span>
                );
                tags.push(
                  <span key="tag2" className="px-2 py-1 rounded text-[10px] font-bold tracking-tight uppercase bg-[#6bff8f] text-[#007432] inline-flex items-center leading-none">
                    FREE
                  </span>
                );
              } else if (isUM) {
                tags.push(
                  <span key="tag1" className="px-2 py-1 rounded text-[10px] font-bold tracking-tight uppercase bg-[#8b5cf6] text-white leading-none inline-flex items-center">
                    UM
                  </span>
                );
                tags.push(
                  <span key="tag2" className="px-2 py-1 rounded text-[10px] font-bold tracking-tight uppercase bg-[#f3e8ff] text-[#6b21a8] leading-none inline-flex items-center">
                    TRYOUT MANDIRI
                  </span>
                );
              } else {
                tags.push(
                  <span key="tag1" className="px-2 py-1 rounded text-[10px] font-bold tracking-tight uppercase bg-[#3e444c] text-white leading-none inline-flex items-center">
                    LATIHAN
                  </span>
                );
                tags.push(
                  <span key="tag2" className="px-2 py-1 rounded text-[10px] font-bold tracking-tight uppercase bg-[#f0f3ff] text-[#434654] leading-none inline-flex items-center">
                    LATIHAN MANDIRI
                  </span>
                );
              }

              let description = '';
              if (isTryout) {
                description = `Selesaikan ${h.subtestCount || 0} subtes tryout nasional. Fokus pada materi ujian masuk perguruan tinggi negeri.`;
              } else if (isUM) {
                description = `Ujian Mandiri masuk Perguruan Tinggi Negeri. Menguji materi akademik dengan total ${h.total || 0} soal.`;
              } else {
                description = `Latihan soal mandiri untuk mengasah pemahaman subtes ${h.name}. Menjawab ${h.correct || 0} dari ${h.total || 0} soal dengan benar.`;
              }

              const handleDetailClick = () => {
                if (isTryout) {
                  navigate(`/tryout/hasil/${h.id}`, {
                    state: h.sessionIds && h.sessionIds.length > 1 ? { allSessionIds: h.sessionIds, packageId: h.packageId } : { packageId: h.packageId }
                  });
                } else if (isUM) {
                  navigate(`/ujian-mandiri/${h.ujianId}/tryout/${h.packageId}/hasil/${h.id}`);
                }
              };

              return (
                <div key={h.id || i} className="premium-card flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl md:pl-8">
                  {/* Indicator */}
                  <div className="flex items-center justify-center w-12 shrink-0">
                    <div className={`w-10 h-10 rounded-full ${h.type === 'latihan' ? 'bg-[#3e444c]/10' : isUM ? 'bg-[#8b5cf6]/10' : 'bg-[#003d9b]/10'} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined ${isTryout ? 'text-[#003d9b]' : isUM ? 'text-[#8b5cf6]' : 'text-[#3e444c]'} text-xl`}>
                        {iconName}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags}
                    </div>
                    <h3 className="text-xl font-bold text-[#111c2d] mb-2">{h.name}</h3>
                    <p className="text-sm font-normal text-[#434654]">{description}</p>
                    <div className="flex items-center gap-4 mt-4 text-[#737685] text-xs font-semibold">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">calendar_today</span>
                        {formatDate(h.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">timer</span>
                        {formatTime(h.date)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Detail & Score */}
                  <div className="w-full md:w-auto flex md:flex-col items-center justify-between md:justify-center gap-4 md:pl-6 md:border-l border-[#c3c6d6]">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#737685] uppercase tracking-tighter">
                        {h.type === 'latihan' ? 'Skor Latihan' : isUM ? 'Skor UM' : 'Skor IRT'}
                      </p>
                      <p className="text-xl font-bold text-[#003d9b]">{h.score}</p>
                    </div>
                    {(isTryout || isUM) ? (
                      <button 
                        onClick={handleDetailClick}
                        className="px-6 py-3 bg-[#003d9b] text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-2"
                      >
                        Detail Hasil
                      </button>
                    ) : (
                      <span className="px-4 py-2 bg-[#f0f3ff] text-[#434654] rounded-lg text-xs font-semibold">
                        Latihan
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-[#737685] premium-card rounded-xl">
              <span className="material-symbols-outlined text-[48px] text-[#c3c6d6] mb-2">history</span>
              <p className="text-sm">{search ? 'Tidak ditemukan aktivitas dengan nama tersebut.' : 'Belum ada riwayat aktivitas.'}</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Riwayat;
