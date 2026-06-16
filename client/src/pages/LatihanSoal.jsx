import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { subjectService } from '../services/api';
import toast from 'react-hot-toast';
import ChatWidget from '../components/ChatWidget';
import Footer from '../components/Footer';
import NotificationDropdown from '../components/NotificationDropdown';

const SUBJECT_ORDER = [
  'penalaran umum',
  'pengetahuan dan pemahaman umum',
  'pemahaman bacaan dan tulisan',
  'pengetahuan kuantitatif',
  'literasi bahasa indonesia',
  'literasi bahasa inggris',
  'penalaran matematika',
];

const PLAN_RANK = { gratis: 0, premium_um: 0, premium: 1, sultan: 2 };

export default function LatihanSoal() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await subjectService.list();
      setSubjects(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  function formatTimeAgo(date) {
    if (!date) return 'Baru saja';
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} hari lalu`;
    if (hours > 0) return `${hours} jam lalu`;
    return 'Baru saja';
  }

  const headerClass = scrolled
    ? 'bg-[#faf8ff]/90 shadow-sm border-b border-[#c2c6d8]/30 backdrop-blur-md fixed top-0 z-[100] w-full transition-all duration-300'
    : 'bg-[#faf8ff] border-b border-transparent backdrop-blur-md fixed top-0 z-[100] w-full transition-all duration-300';

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b24]">
      {/* Navbar */}
      <header className={headerClass}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-6 lg:gap-12">
            <Link to="/dashboard" className="flex items-center"><img src="/eduzet-brand-light.svg" alt="Eduzet" className="h-8 sm:h-10 md:h-12" /></Link>
            <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium">
              <Link to="/dashboard" className="text-[#424656] hover:text-[#0050cb]">Dashboard</Link>
              <Link to="/latihan" className="text-[#0050cb] border-b-2 border-[#0050cb] pb-1">Latihan</Link>
              <Link to="/tryout/packages" className="text-[#424656] hover:text-[#0050cb]">Tryout</Link>
              <Link to="/battle" className="text-[#424656] hover:text-[#0050cb]">Battle</Link>
              <Link to="/riwayat" className="text-[#424656] hover:text-[#0050cb]">Riwayat</Link>
              <Link to="/prediksi-skor" className="text-[#424656] hover:text-[#0050cb]">Prediksi Skor</Link>
              <Link to="/ujian-mandiri" className="text-[#424656] hover:text-[#0050cb]">Ujian Mandiri</Link>
              {isAdmin && <Link to="/admin" className="text-[#a33200] hover:text-[#0050cb]">Admin</Link>}
            </nav>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
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
              <div className={`relative w-10 h-10 rounded-full bg-[#dae1ff] flex items-center justify-center text-[#0050cb] font-bold text-sm border-2 ${
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
            <button onClick={handleLogout} className="hidden sm:flex text-[#424656] hover:text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full text-[#424656]">
              <span className="material-symbols-outlined text-[24px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </header>
      {/* Mobile menu */}
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
              {[{to:'/dashboard',label:'Dashboard'},{to:'/latihan',label:'Latihan',active:true},{to:'/tryout/packages',label:'Tryout'},{to:'/battle',label:'Battle'},{to:'/riwayat',label:'Riwayat'},{to:'/prediksi-skor',label:'Prediksi Skor'},{to:'/ujian-mandiri',label:'Ujian Mandiri'}].map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileMenuOpen(false)} className={`px-5 py-4 rounded-2xl text-[16px] font-bold transition-colors ${l.active ? 'bg-[#dae1ff] text-[#0050cb]' : 'text-[#424656] hover:bg-[#f2f3ff]'}`}>{l.label}</Link>
              ))}
              {isAdmin && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-5 py-4 rounded-2xl text-[16px] font-bold text-[#a33200] hover:bg-[#f2f3ff]">Admin</Link>}
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
              <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="px-6 py-3 rounded-xl text-[14px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 border border-red-100">
                <span className="material-symbols-outlined text-[18px]">logout</span> Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-20">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto pt-10 sm:pt-16 pb-8">
          <h1 className="text-[32px] sm:text-[40px] lg:text-[56px] font-bold text-[#0050cb] mb-4 leading-tight tracking-tight">
            Eksplorasi Topik Belajar
          </h1>
          <p className="text-[16px] sm:text-[18px] text-[#424656] max-w-2xl leading-relaxed">
            Pilih kategori belajar untuk memulai latihan soal mandiri. Setiap kategori disusun untuk persiapan UTBK.
          </p>
        </section>

        {/* Recent Activity - akan muncul setelah user kerjakan sesuatu */}
        {recentActivity.length > 0 && (
          <section className="px-6 lg:px-10 max-w-[1440px] mx-auto pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-bold text-[#191b24]">Aktivitas Terakhir</h2>
              <Link to="/riwayat" className="text-[14px] font-medium text-[#0050cb] hover:underline">Lihat Semua</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-5 border border-[#c2c6d8]/30 hover:shadow-lg hover:border-[#0050cb]/30 cursor-pointer transition-all" onClick={() => navigate(`/latihan/${item.id}`)}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bg || 'bg-[#dae1ff]'}`}>
                      <span className={`material-symbols-outlined text-[24px] ${item.color || 'text-[#0050cb]'}`}>
                        {item.icon || 'school'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#dae1ff] text-[#0050cb]">
                          {item.type || 'Latihan'}
                        </span>
                        <span className="text-[10px] text-[#727687]">
                          {formatTimeAgo(item.updatedAt)}
                        </span>
                      </div>
                      <h4 className="text-[14px] font-bold text-[#191b24] truncate">{item.name}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[12px] text-[#424656]">
                          {item.progress || 0}% progres
                        </span>
                        {item.score && (
                          <span className="text-[12px] font-bold text-[#0050cb]">
                            Skor: {item.score}
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-[#e1e2ee]/50 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div
                          className="h-full bg-[#0050cb] rounded-full transition-all"
                          style={{ width: `${item.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-[20px] font-bold ${(item.progress || 0) >= 100 ? 'text-[#006688]' : 'text-[#424656]'}`}>
                        {item.progress || 0}%
                      </span>
                      {(item.progress || 0) >= 100 && (
                        <span className="material-symbols-outlined text-[16px] text-[#006688] block">check_circle</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Topics Grid */}
        <section className="px-6 lg:px-10 max-w-[1440px] mx-auto pb-24">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-[#e1e2ee]/50 animate-pulse rounded-[24px]"></div>
              ))}
            </div>
          ) : (
            <SubjectGrid subjects={subjects} user={user} navigate={navigate} />
          )}
          {subjects.length === 0 && !loading && (
            <div className="text-center py-20 text-[#727687]">
              <span className="material-symbols-outlined text-[64px] block mb-4">sentiment_neutral</span>
              <p>Belum ada topik tersedia.</p>
            </div>
          )}
        </section>


      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}

function SubjectGrid({ subjects, user, navigate }) {
  const userPlan = user?.current_plan || 'gratis';
  const userRank = PLAN_RANK[userPlan] ?? 0;

  const sortedSubjects = useMemo(() => {
    const getSubjectOrder = (s) => {
      const name = (s.title || s.name || '').toLowerCase();
      const idx = SUBJECT_ORDER.findIndex(o => name.includes(o));
      return idx >= 0 ? idx : 999;
    };

    return [...subjects]
      .filter(s => s.is_active !== false)
      .sort((a, b) => {
        const planA = PLAN_RANK[a.required_plan || 'gratis'] ?? 0;
        const planB = PLAN_RANK[b.required_plan || 'gratis'] ?? 0;
        if (planA !== planB) return planA - planB;
        return getSubjectOrder(a) - getSubjectOrder(b);
      });
  }, [subjects]);

  const gratisSubjects = sortedSubjects.filter(s => (s.required_plan || 'gratis') === 'gratis');
  const premiumSubjects = sortedSubjects.filter(s => (s.required_plan || 'gratis') === 'premium');
  const sultanSubjects = sortedSubjects.filter(s => (s.required_plan || 'gratis') === 'sultan');

  const handleClick = (subject) => {
    const reqPlan = subject.required_plan || 'gratis';
    const reqRank = PLAN_RANK[reqPlan] ?? 0;
    if (subject.is_active === false) {
      toast.error('Latihan sedang non-aktif.');
      return;
    }
    if (reqRank > userRank) {
      toast.error(`Latihan ini khusus paket ${reqPlan === 'sultan' ? 'Sultan' : 'Premium'}. Upgrade paketmu di halaman Harga.`);
      return;
    }
    navigate(`/latihan/${subject.id}`);
  };

  const renderCard = (subject) => {
    const reqPlan = subject.required_plan || 'gratis';
    const reqRank = PLAN_RANK[reqPlan] ?? 0;
    const isLocked = reqRank > userRank;

    return (
      <div
        key={subject.id}
        onClick={() => handleClick(subject)}
        className={`relative bg-white border rounded-[24px] p-6 transition-all duration-300 flex flex-col justify-between ${
          isLocked
            ? 'border-[#c2c6d8]/50 opacity-75 cursor-not-allowed'
            : 'border-[#c2c6d8]/30 hover:shadow-xl cursor-pointer group'
        }`}
      >
        {isLocked && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
            <span className="material-symbols-outlined text-[14px] text-gray-500">lock</span>
            <span className="text-[11px] font-bold text-gray-500 uppercase">
              {reqPlan === 'sultan' ? 'Sultan' : 'Premium'}
            </span>
          </div>
        )}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`p-3 rounded-xl ${isLocked ? 'grayscale opacity-60' : ''}`}
              style={{
                backgroundColor: subject.bg_color || '#dae1ff',
                color: subject.icon_color || '#0050cb'
              }}
            >
              <span className="material-symbols-outlined text-[24px]">
                {isLocked ? 'lock' : (subject.icon || 'calculate')}
              </span>
            </div>
          </div>
          <h3 className="text-[20px] font-bold text-[#191b24] mb-2">{subject.title || subject.name}</h3>
          <p className="text-[14px] text-[#424656] line-clamp-2">
            {subject.description || 'Tidak ada deskripsi'}
          </p>
        </div>
        <div className="mt-6 pt-4 border-t border-[#c2c6d8]/20 flex items-center justify-between">
          {isLocked ? (
            <>
              <span className="text-[14px] font-bold text-gray-400">Terkunci</span>
              <span className="material-symbols-outlined text-gray-400">lock</span>
            </>
          ) : (
            <>
              <span className="text-[14px] font-bold text-[#0050cb]">Mulai Latihan</span>
              <span className="material-symbols-outlined text-[#0050cb] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {gratisSubjects.length > 0 && (
        <div>
          <h2 className="text-[20px] font-bold text-[#191b24] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0050cb]">lock_open</span>
            Gratis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gratisSubjects.map(renderCard)}
          </div>
        </div>
      )}
      {premiumSubjects.length > 0 && (
        <div>
          <h2 className="text-[20px] font-bold text-[#191b24] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">diamond</span>
            Premium
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumSubjects.map(renderCard)}
          </div>
        </div>
      )}
      {sultanSubjects.length > 0 && (
        <div>
          <h2 className="text-[20px] font-bold text-[#191b24] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-600">star</span>
            Sultan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sultanSubjects.map(renderCard)}
          </div>
        </div>
      )}
    </div>
  );
}
