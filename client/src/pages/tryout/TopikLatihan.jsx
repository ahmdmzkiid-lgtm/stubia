import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { subjectService } from '../../services/api';
import NotificationDropdown from '../../components/NotificationDropdown';
import StartConfirmationModal from '../../components/StartConfirmationModal';

const TopNavbar = ({ user, isAdmin, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h); 
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <header className={`fixed top-0 z-[100] w-full backdrop-blur-md transition-all duration-300 ${scrolled ? 'bg-[#faf8ff]/90 shadow-sm border-b border-[#c2c6d8]/30' : 'bg-[#faf8ff] border-b border-transparent'}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-6 lg:gap-12">
          <Link to="/dashboard" className="flex items-center"><img src="/eduzet-brand-light.svg" alt="Eduzet" className="h-8 sm:h-10 md:h-12" /></Link>
          <nav className="hidden lg:flex items-center space-x-8 text-[14px] font-medium">
            <Link to="/dashboard" className="text-[#424656] hover:text-[#0050cb] transition-colors">Dashboard</Link>
            <Link to="/latihan" className="text-[#0050cb] transition-colors">Latihan</Link>
            <Link to="/tryout/packages" className="text-[#424656] hover:text-[#0050cb] transition-colors">Tryout</Link>
            <Link to="/riwayat" className="text-[#424656] hover:text-[#0050cb] transition-colors">Riwayat</Link>
            {isAdmin && <Link to="/admin" className="text-[#a33200] hover:text-[#0050cb] transition-colors">Admin</Link>}
          </nav>
        </div>
        <div className="flex items-center gap-3">
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
          <button onClick={onLogout} className="hidden sm:flex text-[#424656] hover:text-[#ba1a1a] transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full text-[#424656]">
            <span className="material-symbols-outlined text-[24px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
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
              {[{to:'/dashboard',label:'Dashboard'},{to:'/latihan',label:'Latihan',active:true},{to:'/tryout/packages',label:'Tryout'},{to:'/riwayat',label:'Riwayat'}].map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileMenuOpen(false)} className={`px-5 py-4 rounded-2xl text-[16px] font-bold transition-colors ${l.active ? 'bg-[#dae1ff] text-[#0050cb]' : 'text-[#424656] hover:bg-[#f2f3ff]'}`}>{l.label}</Link>
              ))}
              {isAdmin && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-5 py-4 rounded-2xl text-[16px] font-bold text-[#a33200] hover:bg-[#f2f3ff] transition-colors">Admin</Link>}
            </nav>
            <hr className="my-6 border-[#c2c6d8]/20" />
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
              <button onClick={onLogout} className="px-6 py-3 rounded-xl text-[14px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 border border-red-100">
                <span className="material-symbols-outlined text-[18px]">logout</span> Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const TopikLatihan = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  useEffect(() => {
    fetchContent();
  }, [subjectId]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      // We don't have a getSubjectById but we can find it in the list or add it to API
      // For now let's just get list and filter, or I should've added getById to API.
      // I'll update api.js to include getSubjectById.
      const subjectsRes = await subjectService.list();
      const currentSubject = subjectsRes.data.data.find(s => s.id === subjectId);
      setSubject(currentSubject);

      const topicsRes = await subjectService.listTopics(subjectId);
      setTopics(topicsRes.data.data);
    } catch (err) {}
    setLoading(false);
  };

  const totalProgress = topics.length > 0
    ? Math.round(topics.reduce((acc, item) => {
        const p = item.history && item.history.length > 0 ? item.history[0].percentage : 0;
        return acc + p;
      }, 0) / topics.length)
    : 0;

  if (!loading && !subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Subtes tidak ditemukan</h2>
          <Link to="/latihan" className="text-[#0050cb] hover:underline">Kembali ke Latihan</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8ff] text-[#191b24] min-h-screen flex flex-col font-sans overflow-x-hidden">
      <TopNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />
      
      <main className="flex-grow pt-16 sm:pt-20">
        <section className="px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto py-10 sm:py-16">
          
          {loading ? (
            <div className="animate-pulse space-y-12">
              <div className="h-40 bg-surface-container-low rounded-3xl w-2/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1,2,3].map(i => <div key={i} className="h-64 bg-surface-container-low rounded-3xl"></div>)}
              </div>
            </div>
          ) : (
            <>
              {/* Subject Header with Progress */}
              <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="max-w-2xl">
                  <nav className="flex items-center gap-2 mb-4 text-[#424656]">
                    <Link to="/dashboard" className="text-[14px] font-medium hover:text-[#0050cb]">Dashboard</Link>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    <Link to="/latihan" className="text-[14px] font-medium hover:text-[#0050cb]">Latihan</Link>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    <span className="text-[14px] font-medium text-[#0050cb]">{subject.title}</span>
                  </nav>
                  <h1 className="text-[32px] sm:text-[40px] lg:text-[56px] font-bold text-[#191b24] mb-6 leading-tight tracking-tight">{subject.title}</h1>
                  <p className="text-base sm:text-[18px] font-light text-[#424656] leading-relaxed">
                    {subject.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 p-4 sm:p-6 bg-[#f2f3ff] rounded-xl border border-[#c2c6d8]/30">
                  <div className="flex flex-col">
                    <span className="text-[10px] sm:text-[12px] font-bold text-[#424656] uppercase tracking-wider">Total Progress</span>
                    <span className="text-[18px] sm:text-[24px] font-bold text-[#0050cb]">{totalProgress}% Selesai</span>
                  </div>
                  <div className="w-16 sm:w-24 h-1.5 sm:h-2 bg-[#e1e2ee] rounded-full overflow-hidden">
                    <div className="h-full bg-[#00c1fd]" style={{ width: `${totalProgress}%` }}></div>
                  </div>
                </div>
              </div>
              
              {/* Topics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {topics.map((item, idx) => {
                  const topicHistory = item.history || [];
                  const isDone = topicHistory.length > 0;
                  const progress = isDone ? topicHistory[0].percentage : 0;

                  return (
                    <div key={idx} className="group bg-white border border-[#c2c6d8]/50 rounded-xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,80,203,0.06)] hover:translate-y-[-4px] hover:shadow-[0_12px_24px_-4px_rgba(0,80,203,0.12)] transition-all duration-300 cursor-pointer">
                      <div className="h-48 w-full bg-[#0050cb]/5 flex items-center justify-center relative overflow-hidden">
                        <span className="material-symbols-outlined text-[64px] text-[#0050cb]/20 absolute -right-4 -bottom-4 rotate-12">{item.icon || 'menu_book'}</span>
                        <div className="w-16 h-16 rounded-2xl bg-[#0050cb]/10 flex items-center justify-center text-[#0050cb] relative z-10">
                          <span className="material-symbols-outlined text-[32px]">{item.icon || 'menu_book'}</span>
                        </div>
                        {item.difficulty_level && (
                          <div className="absolute top-4 left-4 z-20">
                            <span className="px-3 py-1 bg-white border border-[#c2c6d8]/50 text-[#424656] text-[12px] font-bold rounded-full shadow-sm">{item.difficulty_level}</span>
                          </div>
                        )}
                        {isDone && (
                          <div className="absolute top-4 right-4 z-20">
                            <span className="px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-700 text-[12px] font-bold rounded-full shadow-sm flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                              Selesai
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-[24px] font-bold text-[#191b24] mb-1">{item.title}</h3>
                            <p className="text-[14px] text-[#424656]">{item.questions_count} Soal</p>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[12px] font-medium text-[#424656]">Progress Belajar</span>
                            <span className="text-[12px] font-bold text-[#0050cb]">{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#e6e7f4] rounded-full overflow-hidden">
                            <div className="h-full bg-[#0050cb] transition-all duration-500" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>

                        {isDone && (
                          <div className="mb-6">
                            <span className="text-[12px] font-medium text-[#424656] block mb-2">Riwayat Skor:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {topicHistory.slice(0, 5).map((attempt, aIdx) => (
                                <span 
                                  key={aIdx} 
                                  className="px-2.5 py-1 bg-[#f2f3ff] border border-[#c2c6d8]/30 rounded-lg text-[12px] font-bold text-[#0050cb] shadow-sm"
                                  title={`Dikerjakan pada ${new Date(attempt.submitted_at).toLocaleDateString('id-ID')}`}
                                >
                                  {attempt.percentage}%
                                </span>
                              ))}
                              {topicHistory.length > 5 && (
                                <span className="text-[12px] text-[#727687] self-center ml-1">+{topicHistory.length - 5} lagi</span>
                              )}
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmData({
                              topicId: item.id,
                              title: item.title,
                              questionsCount: item.questions_count,
                            });
                            setConfirmOpen(true);
                          }}
                          className="w-full py-3 bg-white border border-[#0050cb] text-[#0050cb] font-bold text-[14px] rounded-lg hover:bg-[#0050cb] hover:text-white transition-all duration-200 active:scale-95"
                        >
                          {isDone ? 'Ulangi Latihan' : 'Mulai'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {topics.length === 0 && (
                <div className="text-center py-20 opacity-40">
                  <p>Belum ada topik untuk subtes ini.</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <StartConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          if (confirmData) {
            navigate(`/latihan/praktik/${subjectId}?topic_id=${confirmData.topicId}`);
          }
        }}
        title="Apakah Anda yakin ingin memulai latihan?"
        subtitle={confirmData?.title}
        details={[
          { label: 'Jumlah Soal', value: `${confirmData?.questionsCount || 0} soal`, icon: 'description' },
          { label: 'Tipe Sesi', value: 'Latihan Soal', icon: 'school' }
        ]}
      />

      <footer className="bg-white border-t border-[#c2c6d8]/30">
        <div className="px-6 lg:px-10 max-w-[1440px] mx-auto py-8 border-t border-[#c2c6d8]/20">
          <p className="text-[12px] text-[#424656] font-medium text-center md:text-left">© 2026 Eduzet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TopikLatihan;
