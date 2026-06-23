import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { subjectService, settingsService } from '../../services/api';
import toast from 'react-hot-toast';
import StudentNavbar from '../../components/layout/StudentNavbar';
import StartConfirmationModal from '../../components/StartConfirmationModal';



const TopikLatihan = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [isFeatureActive, setIsFeatureActive] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [subjectId]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const [subjectsRes, settingsRes] = await Promise.all([
        subjectService.list(),
        settingsService.get()
      ]);
      
      const settings = settingsRes.data?.data;
      if (settings && settings.latihan_utbk_active === 'false' && !isAdmin) {
        setIsFeatureActive(false);
      } else {
        setIsFeatureActive(true);
      }

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

  if (!loading && !isFeatureActive) {
    return (
      <div className="min-h-screen bg-[#faf8ff] text-[#191b24] flex flex-col justify-between">
        <div>
          <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />
          <main className="pt-20 max-w-md mx-auto px-6 text-center flex-grow flex items-center justify-center">
            <div className="bg-white rounded-3xl p-8 border border-[#c2c6d8]/30 shadow-lg my-10 animate-fade-in">
              <span className="material-symbols-outlined text-[64px] text-yellow-500 mb-4 animate-bounce">warning</span>
              <h2 className="text-[24px] font-bold text-[#191b24] mb-3">Latihan UTBK Non-Aktif</h2>
              <p className="text-[15px] text-[#424656] leading-relaxed mb-6">
                Fitur latihan soal UTBK saat ini sedang dinonaktifkan sementara oleh administrator. Silakan hubungi admin atau kembali lagi nanti.
              </p>
              <Link to="/" className="inline-block w-full bg-[#0050cb] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all">
                Kembali ke Dashboard
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />
      
      <main className="flex-grow">
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
                                <button 
                                  key={aIdx}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/latihan/hasil/${attempt.id}`);
                                  }}
                                  className="px-2.5 py-1 bg-[#f2f3ff] border border-[#c2c6d8]/30 rounded-lg text-[12px] font-bold text-[#0050cb] shadow-sm hover:bg-[#0050cb] hover:text-white hover:border-transparent transition-all duration-150"
                                  title={`Lihat hasil percobaan ini (Dikerjakan pada ${new Date(attempt.submitted_at).toLocaleDateString('id-ID')})`}
                                >
                                  {attempt.percentage}%
                                </button>
                              ))}
                              {topicHistory.length > 5 && (
                                <span className="text-[12px] text-[#727687] self-center ml-1">+{topicHistory.length - 5} lagi</span>
                              )}
                            </div>
                          </div>
                        )}

                        {isDone ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const latestSessionId = topicHistory[0]?.id;
                                if (latestSessionId) {
                                  navigate(`/latihan/hasil/${latestSessionId}`);
                                } else {
                                  toast.error('Gagal memuat hasil latihan.');
                                }
                              }}
                              className="py-3 bg-[#0050cb] text-white font-bold text-[14px] rounded-lg hover:bg-[#003da8] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 active:scale-95 flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                              Lihat Hasil
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmData({
                                  topicId: item.id,
                                  title: item.title,
                                  questionsCount: item.questions_count,
                                });
                                setConfirmOpen(true);
                              }}
                              className="py-3 bg-white border border-[#0050cb] text-[#0050cb] font-bold text-[14px] rounded-lg hover:bg-[#f2f3ff] transition-all duration-200 active:scale-95 flex items-center justify-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[18px]">replay</span>
                              Ulangi
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmData({
                                topicId: item.id,
                                title: item.title,
                                questionsCount: item.questions_count,
                              });
                              setConfirmOpen(true);
                            }}
                            className="w-full py-3 bg-white border border-[#0050cb] text-[#0050cb] font-bold text-[14px] rounded-lg hover:bg-[#0050cb] hover:text-white transition-all duration-200 active:scale-95 flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                            Mulai
                          </button>
                        )}
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
          <p className="text-[12px] text-[#424656] font-medium text-center md:text-left">© 2026 Stubia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default TopikLatihan;
