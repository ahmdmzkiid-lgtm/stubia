import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { battleService, subjectService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
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

const BattleLobby = () => {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [searchingMatch, setSearchingMatch] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await subjectService.list();
      setSubjects(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortedSubjects = useMemo(() => {
    const getOrder = (s) => {
      const name = (s.title || s.name || '').toLowerCase();
      const idx = SUBJECT_ORDER.findIndex(o => name.includes(o));
      return idx >= 0 ? idx : 999;
    };
    return [...subjects].sort((a, b) => getOrder(a) - getOrder(b));
  }, [subjects]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const handleCreateMatch = async () => {
    if (!selectedSubject) {
      toast.error('Pilih subtes terlebih dahulu');
      return;
    }
    setCreatingMatch(true);
    try {
      const res = await battleService.createMatch({
        subject_id: selectedSubject.id,
        subject_name: selectedSubject.name || selectedSubject.title,
        question_count: 5,
        time_per_question: 30,
      });
      if (res.data.success) {
        const matchId = res.data.data.match_id;
        toast.success('Pertandingan dibuat! Kode: ' + matchId.split('-')[0]);
        navigate(`/battle/game/${matchId}`, {
          state: {
            matchId,
            subjectId: selectedSubject.id,
            subjectName: res.data.data.subject_name,
            questionCount: res.data.data.question_count,
            timePerQuestion: res.data.data.time_per_question,
            questionIds: res.data.data.question_ids,
          }
        });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal membuat pertandingan';
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setCreatingMatch(false);
    }
  };

  const handleRandomMatch = async () => {
    if (!selectedSubject) {
      toast.error('Pilih subtes terlebih dahulu');
      return;
    }
    setSearchingMatch(true);
    try {
      const res = await battleService.getRandomMatch(selectedSubject.id);
      if (res.data.success && res.data.data) {
        const matchId = res.data.data.id;
        const joinRes = await battleService.joinMatch({ match_id: matchId });
        if (joinRes.data.success) {
          toast.success('Bergabung ke pertandingan!');
          navigate(`/battle/game/${matchId}`, {
            state: {
              matchId,
              subjectId: selectedSubject.id,
              subjectName: res.data.data.subject_name,
              questionCount: res.data.data.question_count,
              timePerQuestion: res.data.data.time_per_question,
              questionIds: res.data.data.question_ids,
            }
          });
        }
      } else {
        // No waiting match found, create a new one
        toast('Tidak ada lawan yang menunggu, membuat pertandingan baru...', { icon: '🔍' });
        await handleCreateMatch();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal mencari pertandingan';
      toast.error(errorMsg);
      console.error(err);
    } finally {
      setSearchingMatch(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      toast.error('Masukkan kode pertandingan');
      return;
    }
    try {
      const res = await battleService.joinMatch({ code: inviteCode.trim() });
      if (res.data.success) {
        toast.success('Berhasil bergabung!');
        const matchId = res.data.data.match_id;
        navigate(`/battle/game/${matchId}`, {
          state: {
            matchId,
            subjectId: res.data.data.subject_id,
            subjectName: res.data.data.subject_name,
            questionCount: res.data.data.question_count,
            timePerQuestion: res.data.data.time_per_question,
            questionIds: res.data.data.question_ids,
          }
        });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal bergabung dengan kode tersebut';
      toast.error(errorMsg);
    }
  };

  const headerClass = scrolled
    ? 'bg-[#faf8ff]/90 shadow-sm border-b border-[#c2c6d8]/30 backdrop-blur-md fixed top-0 z-[100] w-full transition-all duration-300'
    : 'bg-[#faf8ff] border-b border-transparent backdrop-blur-md fixed top-0 z-[100] w-full transition-all duration-300';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-5 text-[#424656] font-medium text-[15px]">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b24]">
      {/* Navbar — identical to LatihanSoal */}
      <header className={headerClass}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-6 lg:gap-12">
            <Link to="/dashboard" className="flex items-center"><img src="/eduzet-brand-light.svg" alt="Eduzet" className="h-8 sm:h-10 md:h-12" /></Link>
            <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium">
              <Link to="/dashboard" className="text-[#424656] hover:text-[#0050cb]">Dashboard</Link>
              <Link to="/latihan" className="text-[#424656] hover:text-[#0050cb]">Latihan</Link>
              <Link to="/tryout/packages" className="text-[#424656] hover:text-[#0050cb]">Tryout</Link>
              <Link to="/battle" className="text-[#0050cb] border-b-2 border-[#0050cb] pb-1">Battle</Link>
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
              {[{to:'/dashboard',label:'Dashboard'},{to:'/latihan',label:'Latihan'},{to:'/tryout/packages',label:'Tryout'},{to:'/battle',label:'Battle',active:true},{to:'/riwayat',label:'Riwayat'},{to:'/prediksi-skor',label:'Prediksi Skor'},{to:'/ujian-mandiri',label:'Ujian Mandiri'}].map(l => (
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
            Battle 1vs1
          </h1>
          <p className="text-[16px] sm:text-[18px] text-[#424656] max-w-2xl leading-relaxed">
            Jawab 5 soal dalam 30 detik per soal. Dapatkan 200 poin jika kamu satu-satunya yang benar, 100 poin jika keduanya benar, dan 0 jika salah.
          </p>
        </section>

        {/* Subject Cards Grid */}
        <section className="px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto pb-24">
          <h2 className="text-[20px] font-bold text-[#191b24] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0050cb]">swords</span>
            Pilih Subtes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedSubjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => setSelectedSubject(subject)}
                className="relative bg-white border border-[#c2c6d8]/30 rounded-[24px] p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{
                        backgroundColor: subject.bg_color || '#dae1ff',
                        color: subject.icon_color || '#0050cb'
                      }}
                    >
                      <span className="material-symbols-outlined text-[24px]">
                        {subject.icon || 'school'}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-[20px] font-bold text-[#191b24] mb-2">{subject.title || subject.name}</h3>
                  <p className="text-[14px] text-[#424656] line-clamp-2">
                    {subject.description || 'Uji kemampuanmu di subtes ini melalui pertandingan 1vs1'}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#c2c6d8]/20 flex items-center justify-between">
                  <span className="text-[14px] font-bold text-[#0050cb]">Mulai Battle</span>
                  <span className="material-symbols-outlined text-[#0050cb] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Battle Mode Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setSelectedSubject(null)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative bg-white rounded-[28px] w-full max-w-[520px] shadow-2xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-5 border-b border-[#e0e2f0]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      backgroundColor: selectedSubject.bg_color || '#dae1ff',
                      color: selectedSubject.icon_color || '#0050cb'
                    }}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {selectedSubject.icon || 'school'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[20px] font-bold text-[#191b24]">{selectedSubject.title || selectedSubject.name}</h3>
                    <p className="text-[13px] text-[#727687]">5 soal · 30 detik per soal</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubject(null)}
                  className="w-10 h-10 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#dae1ff] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4">
              {/* Random Match */}
              <button
                onClick={handleRandomMatch}
                disabled={searchingMatch || creatingMatch}
                className="w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 border-[#e0e2f0] hover:border-[#0050cb] hover:bg-[#f8f9ff] transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-xl bg-[#dae1ff] flex items-center justify-center flex-shrink-0 group-hover:bg-[#0050cb] transition-colors">
                  <span className="material-symbols-outlined text-[24px] text-[#0050cb] group-hover:text-white transition-colors">
                    {searchingMatch ? 'progress_activity' : 'shuffle'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[16px] font-bold text-[#191b24]">Cari Lawan Acak</h4>
                  <p className="text-[13px] text-[#727687]">Otomatis dicarikan lawan atau buat pertandingan baru</p>
                </div>
                <span className="material-symbols-outlined text-[#c2c6d8] group-hover:text-[#0050cb] transition-colors">arrow_forward</span>
              </button>

              {/* Create Match */}
              <button
                onClick={handleCreateMatch}
                disabled={creatingMatch || searchingMatch}
                className="w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 border-[#e0e2f0] hover:border-[#0050cb] hover:bg-[#f8f9ff] transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 rounded-xl bg-[#dae1ff] flex items-center justify-center flex-shrink-0 group-hover:bg-[#0050cb] transition-colors">
                  <span className="material-symbols-outlined text-[24px] text-[#0050cb] group-hover:text-white transition-colors">
                    {creatingMatch ? 'progress_activity' : 'add_circle'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[16px] font-bold text-[#191b24]">Buat Pertandingan</h4>
                  <p className="text-[13px] text-[#727687]">Buat ruang & share kode ke temanmu</p>
                </div>
                <span className="material-symbols-outlined text-[#c2c6d8] group-hover:text-[#0050cb] transition-colors">arrow_forward</span>
              </button>

              {/* Join by Code */}
              <div className="rounded-2xl border-2 border-[#e0e2f0] p-4 sm:p-5">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#dae1ff] flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[24px] text-[#0050cb]">vpn_key</span>
                  </div>
                  <div>
                    <h4 className="text-[16px] font-bold text-[#191b24]">Gabung dengan Kode</h4>
                    <p className="text-[13px] text-[#727687]">Masukkan kode dari temanmu</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Masukkan kode..."
                    className="flex-grow min-w-0 px-4 py-3 border-2 border-[#e0e2f0] rounded-xl text-[14px] font-medium focus:outline-none focus:border-[#0050cb] transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                  />
                  <button
                    onClick={handleJoinByCode}
                    className="px-5 py-3 bg-[#0050cb] text-white rounded-xl font-bold text-[14px] hover:bg-[#003da6] transition-colors flex-shrink-0"
                  >
                    Gabung
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-8 py-4 bg-[#faf8ff] border-t border-[#e0e2f0] flex items-center justify-center">
              <Link
                to={`/battle/leaderboard/${selectedSubject.id}`}
                state={{ subjectName: selectedSubject.name || selectedSubject.title }}
                className="inline-flex items-center gap-2 text-[#0050cb] font-semibold text-[13px] hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">leaderboard</span>
                Lihat Leaderboard
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <ChatWidget />
    </div>
  );
};

export default BattleLobby;
