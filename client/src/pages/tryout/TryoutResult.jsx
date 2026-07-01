import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { tryoutService, subscriptionService } from '../../services/api';
import DiscussQuestionModal from '../../components/DiscussQuestionModal';
import MathText from '../../components/MathText';
import NationalLeaderboardCard from '../../components/NationalLeaderboardCard';
import StudentNavbar from '../../components/layout/StudentNavbar';
import { PTN_DATA } from '../../data/ptnData';

// Helper functions defined outside the component
const getSubjectColors = (statusColor) => {
  const colors = {
    primary: {
      bg: 'bg-[#dae1ff]',
      icon: 'text-[#0050cb]',
      bar: 'bg-[#0050cb]',
      dot: 'bg-[#0050cb]',
      bgSolid: 'bg-[#0050cb]'
    },
    tertiary: {
      bg: 'bg-[#ffdbd0]',
      icon: 'text-[#a33200]',
      bar: 'bg-[#a33200]',
      dot: 'bg-[#a33200]',
      bgSolid: 'bg-[#a33200]'
    },
    secondary: {
      bg: 'bg-[#c2e8ff]',
      icon: 'text-[#006688]',
      bar: 'bg-[#006688]',
      dot: 'bg-[#006688]',
      bgSolid: 'bg-[#006688]'
    }
  };
  return colors[statusColor] || colors.primary;
};

const getSubjectIcon = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('penalaran umum')) return 'psychology';
  if (lower.includes('pengetahuan') && lower.includes('pemahaman')) return 'auto_stories';
  if (lower.includes('pemahaman bacaan')) return 'edit_note';
  if (lower.includes('pengetahuan kuantitatif')) return 'calculate';
  if (lower.includes('literasi') && lower.includes('indonesia')) return 'translate';
  if (lower.includes('literasi') && lower.includes('inggris')) return 'language';
  if (lower.includes('matematika') || lower.includes('penalaran matematika')) return 'functions';
  if (lower.includes('literasi')) return 'menu_book';
  if (lower.includes('penalaran')) return 'psychology';
  return 'quiz';
};

const getShortName = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('penalaran umum')) return 'Penalaran Umum';
  if (lower.includes('pengetahuan') && lower.includes('pemahaman')) return 'Pengetahuan dan Pemahaman Umum';
  if (lower.includes('pemahaman bacaan')) return 'Pemahaman Bacaan dan Tulisan';
  if (lower.includes('pengetahuan kuantitatif')) return 'Pengetahuan Kuantitatif';
  if (lower.includes('literasi') && lower.includes('indonesia')) return 'Literasi Bahasa Indonesia';
  if (lower.includes('literasi') && lower.includes('inggris')) return 'Literasi Bahasa Inggris';
  if (lower.includes('penalaran matematika')) return 'Penalaran Matematika';
  if (lower.includes('matematika')) return 'Penalaran Matematika';
  if (lower.includes('literasi')) return 'Literasi';
  if (lower.includes('penalaran')) return 'Penalaran Umum';
  return name;
};

const getAbbreviation = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('penalaran umum')) return 'PU';
  if (lower.includes('pengetahuan') && lower.includes('pemahaman')) return 'PPU';
  if (lower.includes('pemahaman bacaan')) return 'PBM';
  if (lower.includes('pengetahuan kuantitatif')) return 'PK';
  if (lower.includes('literasi') && lower.includes('indonesia')) return 'LBI';
  if (lower.includes('literasi') && lower.includes('inggris')) return 'LBE';
  if (lower.includes('penalaran matematika')) return 'PM';
  if (lower.includes('matematika')) return 'PM';
  return name?.substring(0, 3)?.toUpperCase() || '?';
};

const SUBJECT_ORDER = ['PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM'];

const TryoutResult = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sortedSubjects = useMemo(() => {
    if (!result?.subjects) return [];
    const subjectsCopy = [...result.subjects];
    return subjectsCopy.sort((a, b) => {
      const idxA = SUBJECT_ORDER.indexOf(getAbbreviation(a.name));
      const idxB = SUBJECT_ORDER.indexOf(getAbbreviation(b.name));
      const valA = idxA === -1 ? 99 : idxA;
      const valB = idxB === -1 ? 99 : idxB;
      return valA - valB;
    });
  }, [result?.subjects]);

  const [filter, setFilter] = useState('all'); // 'all' | 'wrong' | 'bookmark'
  const [subjectFilter, setSubjectFilter] = useState(''); // active subject name
  const [isDiscussOpen, setIsDiscussOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [activePlans, setActivePlans] = useState([]);

  useEffect(() => {
    subscriptionService.getActivePlans()
      .then(res => setActivePlans(res.data?.data || []))
      .catch(() => {});
  }, []);

  const isPremium = useMemo(() => {
    if (isAdmin) return true;
    return activePlans.some(p => {
      const name = p.name || p.plan_name;
      if (name === 'gratis' || !name) return false;
      if (p.target_type === 'utbk' && (p.plan_type === 'subscription' || p.plan_type === 'access')) return true;
      if (p.target_type === 'utbk' && p.plan_type === 'quota' && (p.quota_remaining || 0) > 0) return true;
      return false;
    });
  }, [activePlans, isAdmin]);

  const activeSubject = subjectFilter || sortedSubjects[0]?.name || '';

  const openDiscussion = (question) => {
    setSelectedQuestion(question);
    setIsDiscussOpen(true);
  };

  const baseQuestions = useMemo(() => {
    if (!result?.questions || !activeSubject) return [];
    return result.questions.filter(q => q.subject === activeSubject);
  }, [result?.questions, activeSubject]);

  const filteredQuestions = useMemo(() => {
    return filter === 'wrong'
      ? baseQuestions.filter(q => !q.isCorrect)
      : filter === 'bookmark'
      ? baseQuestions.filter(q => q.isFlagged)
      : baseQuestions;
  }, [baseQuestions, filter]);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState('general'); // 'general' | 'major'
  const pkgId = result?.packageId || location.state?.packageId;

  useEffect(() => {
    const fetchResult = async () => {
      // Check if we have multiple session IDs from the subtest hub flow
      const allSessionIds = location.state?.allSessionIds;
      const packageId = location.state?.packageId;

      if (allSessionIds && allSessionIds.length > 0) {
        // Combined result from multiple per-subtest sessions
        try {
          const response = await tryoutService.getCombinedResult(allSessionIds, packageId);
          if (response.data.success) {
            setResult(response.data.data);
          } else {
            setError(response.data.error || 'Gagal memuat hasil');
          }
        } catch (err) {
          console.error('Failed to fetch combined result:', err);
          let errorMsg = 'Gagal memuat hasil tryout';
          if (err.response?.data?.error) errorMsg = err.response.data.error;
          else if (err.response?.data?.details) errorMsg = err.response.data.details;
          else if (err.message) errorMsg = err.message;
          setError(errorMsg);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Single session result (normal flow)
      if (!sessionId) {
        setError('Session ID tidak valid');
        setLoading(false);
        return;
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sessionId)) {
        setError('Format Session ID tidak valid');
        setLoading(false);
        return;
      }

      try {
        const response = await tryoutService.getResult(sessionId);
        if (response.data.success) {
          setResult(response.data.data);
        } else {
          setError(response.data.error || 'Gagal memuat hasil');
        }
      } catch (err) {
        console.error('Failed to fetch result:', err);
        let errorMsg = 'Gagal memuat hasil tryout';
        if (err.response?.data?.error) errorMsg = err.response.data.error;
        else if (err.response?.data?.details) errorMsg = err.response.data.details;
        else if (err.message) errorMsg = err.message;
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [sessionId, location.state]);

  // Fetch leaderboard when result is available
  useEffect(() => {
    const pkgId = result?.packageId || location.state?.packageId;
    if (!pkgId) return;
    setLeaderboardLoading(true);
    tryoutService.getLeaderboard(pkgId, 10)
      .then(res => {
        if (res.data?.success) setLeaderboard(res.data.data);
      })
      .catch(() => {})
      .finally(() => setLeaderboardLoading(false));
  }, [result, location.state]);



  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-[#424656]">Memuat hasil tryout...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">info</span>
          <h2 className="text-[24px] font-bold text-[#191b24] mb-2">Tidak ada data hasil</h2>
          <p className="text-[#424656] mb-6">{error || 'Silakan selesaikan tryout terlebih dahulu.'}</p>
          <button onClick={() => navigate('/tryout/packages')} className="px-8 py-3 bg-[#0050cb] text-white font-bold rounded-xl hover:shadow-lg transition-all">
            Ke Pusat Tryout
          </button>
        </div>
      </div>
    );
  }

  const stats = result.stats || { correct: 0, incorrect: 0, unanswered: 0, total: 0 };
  // Ensure unanswered is calculated if not provided by the API
  if (stats.unanswered === undefined) {
    stats.unanswered = Math.max(0, stats.total - stats.correct - stats.incorrect);
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b24]">
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
        {/* Back Button */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/tryout/packages')} 
            className="flex items-center gap-2 text-[#0050cb] hover:text-[#003fb2] font-semibold text-[14px] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Kembali ke Pusat Tryout</span>
          </button>
        </div>

        {/* Header Section */}
        <section className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
            <div>
              <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold text-[#191b24] mb-2 leading-tight">Hasil Tryout</h1>
              <p className="text-base sm:text-[18px] text-[#424656]">{result.title}{result.subtitle ? ` - ${result.subtitle}` : ''}</p>
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#c2c6d8] text-[#424656] hover:bg-[#ecedfa] transition-all">
                <span className="material-symbols-outlined">download</span>
                <span className="text-[14px] font-medium">Unduh Sertifikat</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#c2c6d8] text-[#424656] hover:bg-[#ecedfa] transition-all">
                <span className="material-symbols-outlined">share</span>
                <span className="text-[14px] font-medium">Bagikan Hasil</span>
              </button>
            </div>
          </div>
        </section>

        {/* Bento Grid Overview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-20">
          {/* Main Score Card with IRT */}
          <div className="md:col-span-4 bg-[#0050cb] rounded-xl p-8 flex flex-col justify-between text-white shadow-lg min-h-[320px]">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <p className="text-[12px] font-medium opacity-80 uppercase tracking-widest">Skor IRT</p>
                <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-semibold">3PL</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00c1fd]/20 rounded text-[10px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c1fd] animate-pulse"></span>
                  LIVE
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[72px] font-bold leading-tight">{result.totalScore}</span>
                <span className="text-[20px] opacity-60">/1000</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-[#00c1fd]">
                  {result.scoreChange >= 0 ? 'trending_up' : 'trending_down'}
                </span>
                <span className="text-[14px] font-medium">
                  {result.scoreChange > 0 ? '+' : ''}{result.scoreChange || 0}% dari Tryout lalu
                </span>
              </div>
              {result.theta !== undefined && (
                <div className="mt-3 text-[12px] opacity-70">
                  Ability (θ): {result.theta} • Percentile: {result.percentile}
                </div>
              )}
              {result.computedAt && (
                <div className="mt-1 text-[10px] opacity-60">
                  Dihitung ulang: {new Date(result.computedAt).toLocaleTimeString('id-ID')}
                </div>
              )}
            </div>
            <div className="mt-8 pt-8 border-t border-white/20">
              <p className="text-[12px] font-medium opacity-70 mb-2">Mastery ({result.targetPassingGrade || 0}%)</p>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-[#00c1fd] h-full transition-all duration-1000" style={{ width: `${result.targetPassingGrade || 0}%` }}></div>
              </div>
              <p className="text-[12px] font-medium mt-2">
                {result.percentile ? `Top ${100 - result.percentile}% nasional` : 'Berdasarkan hasil pengerjaan'}
              </p>
            </div>
          </div>

          {/* Stats Card */}
          <div className="md:col-span-4 bg-[#f2f3ff] rounded-xl p-8 border border-[#c2c6d8]/30 flex flex-col justify-between">
            <div>
              <p className="text-[14px] font-medium text-[#424656] uppercase tracking-widest mb-4">Statistik Jawaban</p>
              <div className="flex items-baseline gap-2">
                <span className="text-[48px] font-bold text-[#191b24]">{stats.correct}</span>
                <span className="text-[18px] text-[#424656]">/{stats.total} Benar</span>
              </div>
            </div>
            <div className="mt-6 mb-4">
              <div className="w-full bg-[#ecedfa] h-3 rounded-full overflow-hidden flex">
                {stats.total > 0 && (
                  <>
                    <div className="bg-[#00c1fd] h-full transition-all duration-1000" style={{ width: `${(stats.correct / stats.total) * 100}%` }}></div>
                    <div className="bg-[#ba1a1a] h-full transition-all duration-1000" style={{ width: `${(stats.incorrect / stats.total) * 100}%` }}></div>
                    <div className="bg-[#c2c6d8] h-full transition-all duration-1000" style={{ width: `${(stats.unanswered / stats.total) * 100}%` }}></div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-auto space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#00c1fd]"></span>
                  <span className="text-[14px] text-[#424656]">Benar</span>
                </div>
                <span className="text-[20px] font-bold text-[#191b24]">{stats.correct}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ba1a1a]"></span>
                  <span className="text-[14px] text-[#424656]">Salah</span>
                </div>
                <span className="text-[20px] font-bold text-[#191b24]">{stats.incorrect}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#c2c6d8]"></span>
                  <span className="text-[14px] text-[#424656]">Kosong</span>
                </div>
                <span className="text-[20px] font-bold text-[#191b24]">{stats.unanswered}</span>
              </div>
            </div>
          </div>

          {/* Peringkat Tryout - Tabbed Leaderboard */}
          <div className="md:col-span-4">
            <div className="bg-white rounded-xl p-5 md:p-6 shadow-sm border border-[#c2c6d8]/20 max-h-[calc(100vh-140px)] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c2c6d8 transparent' }}>
              {/* Tab Toggle */}
              {leaderboard?.targetPtn && leaderboard?.targetMajor ? (
                <div className="flex gap-1 p-1 bg-[#f0f1f7] rounded-xl mb-4">
                  <button
                    onClick={() => setLeaderboardTab('general')}
                    className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-bold transition-all ${
                      leaderboardTab === 'general'
                        ? 'bg-white text-[#0050cb] shadow-sm'
                        : 'text-[#727687] hover:text-[#424656]'
                    }`}
                  >
                    Peringkat Nasional
                  </button>
                  <button
                    onClick={() => setLeaderboardTab('major')}
                    className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-bold transition-all ${
                      leaderboardTab === 'major'
                        ? 'bg-white text-[#0050cb] shadow-sm'
                        : 'text-[#727687] hover:text-[#424656]'
                    }`}
                  >
                    Peringkat Jurusan
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[14px] font-medium text-[#424656] uppercase tracking-widest">Peringkat Nasional</p>
                  <span className="material-symbols-outlined text-[#0050cb] text-[20px]">leaderboard</span>
                </div>
              )}

              {leaderboardTab === 'general' ? (
                /* General Leaderboard */
                <>
                  {leaderboard?.user_rank && (
                    <div className="bg-gradient-to-r from-[#0050cb] to-[#003da6] text-white rounded-xl p-3.5 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider opacity-80 mb-0.5">Peringkatmu</p>
                          <p className="text-[24px] font-bold leading-tight">#{leaderboard.user_rank.rank}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider opacity-80 mb-0.5">Dari</p>
                          <p className="text-[18px] font-bold">{leaderboard.user_rank.total_participants} peserta</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {leaderboardLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-3 text-[13px] text-[#727687]">Memuat peringkat...</span>
                    </div>
                  ) : leaderboard?.leaderboard?.length > 0 ? (
                    <div className="space-y-2">
                      {leaderboard.leaderboard.slice(0, 5).map((entry) => {
                        const isCurrentUser = entry.user_id === user?.id;
                        const medalColors = { 1: 'bg-[#FFD700] text-[#7A6200]', 2: 'bg-[#C0C0C0] text-[#555]', 3: 'bg-[#CD7F32] text-white' };
                        return (
                          <div key={entry.rank} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${isCurrentUser ? 'bg-[#e8eeff] border border-[#0050cb]/30' : 'hover:bg-[#f8f9ff]'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${medalColors[entry.rank] || 'bg-[#ecedfa] text-[#424656]'}`}>{entry.rank}</div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] font-medium truncate ${isCurrentUser ? 'text-[#0050cb] font-bold' : 'text-[#191b24]'}`}>
                                {isCurrentUser ? `${entry.name} (Kamu)` : entry.name}
                              </p>
                            </div>
                            <span className="text-[14px] font-bold text-[#191b24] shrink-0">{entry.score}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined text-[40px] text-[#c2c6d8] mb-2">group_off</span>
                      <p className="text-[13px] text-[#727687]">Belum ada data peringkat</p>
                    </div>
                  )}
                  {leaderboard?.total_participants > 0 && (
                    <p className="text-center text-[11px] text-[#727687] mt-3">
                      Total {leaderboard.total_participants} peserta pada tryout ini
                    </p>
                  )}
                </>
              ) : (
                /* Major Leaderboard */
                <>
                  {/* Target info */}
                  <div className="bg-[#f5f5ff] rounded-xl p-3 mb-4 border border-[#e6e7f4]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[16px] text-[#0050cb]">school</span>
                      <p className="text-[12px] font-bold text-[#0050cb]">{leaderboard?.targetPtn}</p>
                    </div>
                    <p className="text-[13px] font-medium text-[#191b24] ml-6">{leaderboard?.targetMajor}</p>
                    {(() => {
                      // Look up target score from ptnData
                      const ptnEntry = PTN_DATA.find(p => leaderboard?.targetPtn?.includes(p.singkatan) || leaderboard?.targetPtn?.includes(p.nama));
                      const majorEntry = ptnEntry?.prodi?.find(m => m.nama === leaderboard?.targetMajor);
                      const targetScore = majorEntry?.skor;
                      const userScore = leaderboard?.user_rank?.score || leaderboard?.userMajorRank?.score || 0;
                      if (!targetScore) return null;
                      const passed = userScore >= targetScore;
                      return (
                        <div className={`mt-2 ml-6 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${passed ? 'bg-[#e8f5e9] text-[#2e7d32]' : 'bg-[#fef3f2] text-[#ba1a1a]'}`}>
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{passed ? 'check_circle' : 'cancel'}</span>
                          {passed ? `Skormu melewati target (${targetScore})` : `Target skor: ${targetScore} (kurang ${targetScore - userScore})`}
                        </div>
                      );
                    })()}
                  </div>

                  {leaderboard?.userMajorRank && (
                    <div className="bg-gradient-to-r from-[#6d28d9] to-[#4c1d95] text-white rounded-xl p-3.5 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider opacity-80 mb-0.5">Peringkat Jurusan</p>
                          <p className="text-[24px] font-bold leading-tight">#{leaderboard.userMajorRank.rank}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider opacity-80 mb-0.5">Dari</p>
                          <p className="text-[18px] font-bold">{leaderboard.userMajorRank.total_participants} peserta</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {leaderboardLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-[#6d28d9] border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-3 text-[13px] text-[#727687]">Memuat peringkat jurusan...</span>
                    </div>
                  ) : leaderboard?.majorLeaderboard?.length > 0 ? (
                    <div className="space-y-2">
                      {leaderboard.majorLeaderboard.slice(0, 5).map((entry) => {
                        const isCurrentUser = entry.user_id === user?.id;
                        const medalColors = { 1: 'bg-[#FFD700] text-[#7A6200]', 2: 'bg-[#C0C0C0] text-[#555]', 3: 'bg-[#CD7F32] text-white' };
                        return (
                          <div key={entry.rank} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${isCurrentUser ? 'bg-[#ede9fe] border border-[#6d28d9]/30' : 'hover:bg-[#f8f9ff]'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${medalColors[entry.rank] || 'bg-[#ecedfa] text-[#424656]'}`}>{entry.rank}</div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] font-medium truncate ${isCurrentUser ? 'text-[#6d28d9] font-bold' : 'text-[#191b24]'}`}>
                                {isCurrentUser ? `${entry.name} (Kamu)` : entry.name}
                              </p>
                            </div>
                            <span className="text-[14px] font-bold text-[#191b24] shrink-0">{entry.score}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined text-[40px] text-[#c2c6d8] mb-2">group_off</span>
                      <p className="text-[13px] text-[#727687]">Belum ada peserta lain dengan jurusan yang sama</p>
                    </div>
                  )}
                </>
              )}

              {/* View Full Leaderboard Button */}
              {pkgId && (
                <button
                  onClick={() => navigate(`/leaderboard/utbk-tryout/${pkgId}`)}
                  className="w-full mt-4 py-2.5 bg-gradient-to-r from-[#0050cb] to-[#003da6] text-white hover:shadow-md rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Lihat Leaderboard</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Subtest Analysis */}
        <section className="mb-20">
          <div className="flex justify-between items-baseline mb-12">
            <h2 className="text-[32px] font-bold text-[#191b24]">Analisis PerSubtes</h2>
            <p className="text-[14px] font-medium text-[#0050cb] hover:underline cursor-pointer">Lihat Metodologi Penilaian</p>
          </div>
          <div className="space-y-6">
            {(sortedSubjects || []).map((subject, idx) => {
              const colors = getSubjectColors(subject.statusColor);
              const isGood = subject.statusColor === 'primary' || subject.statusColor === 'secondary';
              const subjectQuestions = result.questions?.filter(q => q.subject === subject.name) || [];
              const unansweredCount = subjectQuestions.filter(q => q.userAnswer === null).length;
              const incorrectCount = subjectQuestions.length - subject.correct - unansweredCount;

              return (
                <section
                  key={idx}
                  className="bg-white rounded-xl p-6 md:p-8 border border-[#c2c6d8]/30 hover:border-[#0050cb]/20 transition-all duration-300"
                  style={{ boxShadow: '0 4px 20px -2px rgba(0, 80, 203, 0.04)' }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 lg:gap-8">
                    {/* Left: Subject & Status */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="bg-[#dae1ff] text-[#0050cb] px-3 py-1 rounded-full text-[12px] font-semibold">
                          SUBTEST {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className={`flex items-center gap-1.5 ${colors.icon}`}>
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isGood ? 'check_circle' : 'circle'}
                          </span>
                          <span className="text-[14px] font-medium">{subject.status || 'Perlu Fokus'}</span>
                        </div>
                      </div>
                      <h3 className="text-[20px] md:text-[24px] font-bold text-[#191b24] mb-3">
                        {getShortName(subject.name)}
                      </h3>
                      <p className="text-[#424656] text-[16px] max-w-lg mb-4 lg:mb-0">
                        {subject.description || 'Tidak ada deskripsi tersedia.'}
                      </p>
                    </div>

                    {/* Right: Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:min-w-[450px]">
                      <div>
                        <span className="block text-[#424656] text-[12px] font-semibold mb-1">Akurasi</span>
                        <span className="text-[24px] font-bold text-[#191b24]">{subject.correct || 0}/{subject.total || 0}</span>
                        <div className="text-[10px] text-[#727687] mt-0.5">
                          <span>Salah: {incorrectCount}</span>
                          <span className="mx-1">•</span>
                          <span>Kosong: {unansweredCount}</span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-[#424656] text-[12px] font-semibold mb-1">Avg. Speed</span>
                        <span className="text-[24px] font-bold text-[#191b24]">{subject.avgSpeed || 0}s</span>
                      </div>
                      <div>
                        <span className="block text-[#424656] text-[12px] font-semibold mb-1">Skor</span>
                        <div className="flex items-baseline">
                          <span className="text-[24px] font-bold text-[#0050cb]">{subject.score || 0}</span>
                          <span className="text-[11px] text-[#727687] ml-0.5">/1000</span>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="block text-[#424656] text-[12px] font-semibold mb-2">Mastery</span>
                        <div className="w-full bg-[#f1f5f9] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${colors.bgSolid || 'bg-[#0050cb]'}`}
                            style={{ width: `${subject.percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        {isPremium ? (
          /* Pembahasan Section */
          <section className="mb-20">
            <div className="bg-[#f2f3ff] rounded-[32px] border border-[#c2c6d8]/30 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-[#c2c6d8]/20">
              <h2 className="text-[22px] font-bold text-[#191b24]">Pembahasan Soal</h2>
              <p className="text-[13px] text-[#424656]">Pilih subtes untuk melihat pembahasan soal.</p>
            </div>

            {/* Subject Filter Cards */}
            <div className="p-4 md:p-6 border-b border-[#c2c6d8]/20 overflow-x-auto">
              <div className="flex gap-3 min-w-max">
                {(sortedSubjects || []).map((subject, idx) => {
                  const subjectQuestions = result.questions?.filter(q => q.subject === subject.name) || [];
                  const wrongCount = subjectQuestions.filter(q => !q.isCorrect).length;
                  const isActive = activeSubject === subject.name;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSubjectFilter(subject.name)}
                      className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all min-w-[72px] ${
                        isActive
                          ? 'border-[#0050cb] bg-[#0050cb] text-white shadow-md'
                          : 'border-[#c2c6d8]/30 bg-white text-[#424656] hover:border-[#0050cb]/40'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[22px] ${isActive ? 'text-white' : 'text-[#0050cb]'}`}>
                        {getSubjectIcon(subject.name)}
                      </span>
                      <p className="text-[12px] font-bold">{getAbbreviation(subject.name)}</p>
                      <p className={`text-[10px] ${isActive ? 'text-white/70' : 'text-[#727687]'}`}>
                        {wrongCount}/{subjectQuestions.length}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Tabs (Semua, Salah, Ragu) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#c2c6d8]/10 bg-[#faf8ff]">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                    filter === 'all' ? 'bg-[#0050cb] text-white shadow-sm' : 'text-[#424656] hover:bg-[#ecedfa]'
                  }`}
                >
                  Semua ({baseQuestions.length})
                </button>
                <button
                  onClick={() => setFilter('wrong')}
                  className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                    filter === 'wrong' ? 'bg-[#ba1a1a] text-white shadow-sm' : 'text-[#424656] hover:bg-[#ecedfa]'
                  }`}
                >
                  Salah ({baseQuestions.filter(q => !q.isCorrect).length})
                </button>
                <button
                  onClick={() => setFilter('bookmark')}
                  className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                    filter === 'bookmark' ? 'bg-amber-500 text-white shadow-sm' : 'text-[#424656] hover:bg-[#ecedfa]'
                  }`}
                >
                  Ragu ({baseQuestions.filter(q => q.isFlagged).length})
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-4 md:p-6 bg-[#f8f9fc]">
              {(filteredQuestions || []).map((question) => {
                const subtestNumber = baseQuestions.indexOf(question) + 1;
                return (
                <div
                  key={question.id}
                  className={`p-5 md:p-7 rounded-2xl border ${question.isCorrect ? 'bg-white border-[#c2c6d8]/30' : question.userAnswer === null ? 'bg-white border-[#c2c6d8]/40' : 'bg-white border-[#ba1a1a]/15'}`}
                  style={{ borderLeft: `4px solid ${question.isCorrect ? '#00c1fd' : question.userAnswer === null ? '#c2c6d8' : '#ba1a1a'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-[#ecedfa] rounded text-[12px] font-semibold">Soal #{subtestNumber}</span>
                    <span className={`px-3 py-1 text-[12px] font-semibold flex items-center gap-1 rounded ${
                      question.isCorrect
                        ? 'bg-[#00c1fd]/10 text-[#006688]'
                        : question.userAnswer === null
                        ? 'bg-[#ecedfa] text-[#424656]'
                        : 'bg-[#ffdad6] text-[#93000a]'
                    }`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {question.isCorrect ? 'check_circle' : question.userAnswer === null ? 'remove_circle' : 'cancel'}
                      </span>
                      {question.isCorrect ? 'Benar' : question.userAnswer === null ? 'Kosong' : 'Salah'}
                    </span>
                    <span className="px-3 py-1 border border-[#c2c6d8] rounded text-[12px] font-semibold text-[#424656]">{question.subject}</span>
                    <span className={`px-3 py-1 text-[12px] font-semibold rounded ${
                      question.difficulty === 'HOTS'
                        ? 'bg-[#dae1ff] text-[#0050cb]'
                        : question.difficulty === 'medium'
                        ? 'bg-[#c2e8ff] text-[#004d67]'
                        : 'bg-[#ecedfa] text-[#424656]'
                    }`}>
                      {question.difficulty === 'HOTS' ? 'HOTS' : question.difficulty === 'medium' ? 'Sedang' : 'Mudah'}
                    </span>
                  </div>
                  <div className="max-w-4xl">
                    {/* TOP IMAGE */}
                    {question.imageUrl && ['top', 'before', 'atas'].includes(question.image_position) && (
                      <div className="mb-4">
                        <img className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={question.imageUrl} alt="Soal" />
                      </div>
                    )}

                    {/* Stimulus */}
                    {question.stimulus && (
                      <div className="mb-4 text-[15px] text-[#191b24] leading-relaxed whitespace-pre-wrap">
                        <MathText text={question.stimulus} />
                      </div>
                    )}

                    {/* MIDDLE IMAGE */}
                    {question.imageUrl && ['middle', 'ditengah', 'tengah'].includes(question.image_position) && (
                      <div className="mb-4">
                        <img className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={question.imageUrl} alt="Soal" />
                      </div>
                    )}

                    <MathText className="text-[15px] font-semibold text-[#191b24] mb-4 leading-relaxed" text={question.content || ''} />

                    {/* BOTTOM IMAGE */}
                    {question.imageUrl && !['top', 'before', 'atas', 'middle', 'ditengah', 'tengah'].includes(question.image_position) && (
                      <div className="mb-4">
                        <img className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={question.imageUrl} alt="Soal" />
                      </div>
                    )}

                    {/* Answer Choices */}
                    <div className="mb-4">
                      {question.question_type === 'complex_mc_tf' ? (
                        <div className="space-y-2.5">
                          {(question.choices || []).map((choice) => {
                            let studentAnswers = {};
                            try {
                              studentAnswers = question.userAnswer ? (typeof question.userAnswer === 'string' ? JSON.parse(question.userAnswer) : question.userAnswer) : {};
                            } catch(e) {}
                            const studentAns = studentAnswers[choice.label];
                            const isCorrectAnswer = choice.is_correct;
                            const studentGotIt = studentAns === isCorrectAnswer;
                            return (
                              <div key={choice.id || choice.label} className={`flex items-start p-4 rounded-xl border-2 ${
                                studentGotIt ? 'border-[#0050cb] bg-[#dae1ff]/5' : 'border-[#ba1a1a] bg-[#ffdad6]/10'
                              }`}>
                                <div className="flex-1 min-w-0">
                                  <MathText className="text-[13px] text-[#191b24]" text={choice.content || ''} />
                                  <div className="flex flex-wrap items-center gap-3 mt-2">
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${isCorrectAnswer ? 'bg-[#dae1ff] text-[#0050cb]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
                                      Kunci: {isCorrectAnswer ? 'BENAR' : 'SALAH'}
                                    </span>
                                    {studentAns !== undefined ? (
                                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${studentAns ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                        Jawabanmu: {studentAns ? 'BENAR' : 'SALAH'}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                                        Jawabanmu: KOSONG
                                      </span>
                                    )}
                                    <span className="material-symbols-outlined text-[18px] align-middle" style={{ fontVariationSettings: "'FILL' 1", color: studentGotIt ? '#0050cb' : '#ba1a1a' }}>
                                      {studentGotIt ? 'check' : 'close'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : question.question_type === 'short_answer' ? (
                        <div className="space-y-2">
                          <div className={`relative flex items-center p-3 rounded-xl border-2 ${
                            question.isCorrect
                              ? 'border-[#0050cb] bg-[#dae1ff]/5'
                              : 'border-2 border-[#ba1a1a] bg-[#ffdad6]/10'
                          }`}>
                            <span className="text-[13px] font-bold text-gray-700 mr-2">Jawabanmu:</span>
                            <span className="text-[13px] text-gray-900 font-medium flex-1">{question.userAnswer || '(Tidak dijawab)'}</span>
                            <span className="flex-shrink-0 ml-2">
                              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1", color: question.isCorrect ? '#0050cb' : '#ba1a1a' }}>
                                {question.isCorrect ? 'check' : 'close'}
                              </span>
                            </span>
                          </div>
                          {!question.isCorrect && question.correctAnswer && (
                            <div className="relative flex items-center p-3 rounded-xl border border-[#0050cb] bg-[#dae1ff]/5">
                              <span className="text-[13px] font-bold text-[#0050cb] mr-2">Jawaban Benar:</span>
                              <span className="text-[13px] text-[#0050cb] font-medium">{question.correctAnswer}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(question.choices || []).map((choice) => {
                            const isChosen = choice.label === question.userAnswer;
                            const isCorrectChoice = choice.is_correct === true;

                            let cardClass = 'p-3 rounded-xl border bg-white border-[#c2c6d8]/50';
                            let contentClass = 'text-[13px] text-[#424656]';
                            let icon = null;

                            if (isCorrectChoice) {
                              cardClass = 'p-3 rounded-xl border-2 border-[#0050cb] bg-[#dae1ff]/5';
                              contentClass = 'text-[13px] font-bold text-[#191b24]';
                              icon = <span className="material-symbols-outlined text-[18px] text-[#0050cb]">check</span>;
                            }

                            if (isChosen && !isCorrectChoice) {
                              cardClass = 'p-3 rounded-xl border-2 border-[#ba1a1a] bg-[#ffdad6]/10';
                              contentClass = 'text-[13px] font-bold text-[#191b24]';
                              icon = <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">close</span>;
                            }

                            return (
                              <div key={choice.id || choice.label} className={cardClass}>
                                <div className="flex justify-between items-center">
                                  <div className={`${contentClass} flex items-start gap-1.5`}>
                                    <span className="font-bold shrink-0">{choice.label}.</span>
                                    <MathText text={choice.content || ''} />
                                  </div>
                                  {icon && <span>{icon}</span>}
                                </div>
                                {isChosen && !isCorrectChoice && (
                                  <p className="text-[12px] text-[#ba1a1a] mt-1 font-semibold">Pilihan kamu</p>
                                )}
                                {isCorrectChoice && !isChosen && (
                                  <p className="text-[12px] text-[#0050cb] mt-1 font-semibold">Jawaban benar</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Explanation from Admin */}
                    {question.explanation && (
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 bg-[#ecedfa] p-4 rounded-xl">
                          <h4 className="text-[11px] font-semibold text-[#0050cb] uppercase tracking-widest mb-2">
                            {question.isCorrect ? 'Penjelasan Strategis' : 'Analisis Pedagogis'}
                          </h4>
                          <MathText className="text-[13px] text-[#424656] leading-relaxed" text={question.explanation || ''} />
                        </div>
                        
                        {/* Elegant Chat Button */}
                        <div className="md:w-64 flex-shrink-0">
                          <button 
                            onClick={() => openDiscussion(question)}
                            className="w-full h-full min-h-[100px] bg-white border-2 border-dashed border-[#0050cb]/30 rounded-xl p-4 flex flex-col items-center justify-center text-center group hover:border-[#0050cb] hover:bg-[#0050cb]/5 transition-all duration-300"
                          >
                            <div className="w-10 h-10 bg-[#0050cb] rounded-full flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform">
                              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                            </div>
                            <span className="text-[12px] font-bold text-[#0050cb] mb-1">Masih Bingung?</span>
                            <span className="text-[10px] text-[#424656] font-medium leading-tight">Chat dengan Bia untuk Membahas soal ini</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </section>
        ) : (
          /* Premium Upgrade Card */
          <section className="mb-20">
            <div className="relative overflow-hidden rounded-[32px] border border-[#0050cb]/25 bg-gradient-to-br from-white to-[#f5f8ff] p-8 md:p-12 text-center shadow-xl">
              {/* Premium Background Glows */}
              <div className="absolute -left-16 -top-16 w-64 h-64 bg-[#0050cb]/5 blur-[80px] rounded-full"></div>
              <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full"></div>
              
              <div className="relative max-w-2xl mx-auto flex flex-col items-center">
                {/* Premium Golden Lock Badge */}
                <div className="mb-6 relative">
                  <div className="absolute inset-0 bg-[#0050cb]/15 blur-xl rounded-full scale-150"></div>
                  <div className="relative bg-gradient-to-tr from-[#0050cb] to-[#003da1] w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transform rotate-3">
                    <span className="material-symbols-outlined text-white text-[40px] transform -rotate-3" style={{ fontVariationSettings: "'FILL' 1" }}>
                      lock
                    </span>
                  </div>
                </div>

                <h2 className="text-[26px] md:text-[32px] font-bold text-[#191b24] mb-4 tracking-tight">
                  Pembahasan Khusus Pengguna Premium 🌟
                </h2>
                
                <p className="text-[#424656] text-[15px] md:text-[16px] leading-relaxed mb-8">
                  Dapatkan akses ke penjelasan strategis tiap soal, analisis pedagogis lengkap, 
                  jawaban benar terperinci, serta fitur Bia AI Discussion untuk membantumu lolos PTN impian.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <button
                    onClick={() => navigate('/paket-belajar')}
                    className="px-8 py-4 bg-[#0050cb] hover:bg-[#003da1] text-white font-bold rounded-xl text-[15px] hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                    <span>Buka Pembahasan Premium</span>
                  </button>
                  <button
                    onClick={() => navigate('/tryout/packages')}
                    className="px-8 py-4 bg-white border border-[#c2c6d8] text-[#424656] font-bold rounded-xl text-[15px] hover:bg-[#ecedfa] transition-all"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Discuss Modal */}
        {selectedQuestion && (
          <DiscussQuestionModal 
            isOpen={isDiscussOpen} 
            onClose={() => setIsDiscussOpen(false)} 
            question={selectedQuestion} 
          />
        )}

        {/* Bottom CTA */}
        <div className="flex flex-col md:flex-row justify-center gap-4 mb-12">
          <button
            onClick={() => navigate('/tryout/packages')}
            className="px-8 py-4 bg-[#0050cb] text-white rounded-xl text-[14px] font-medium hover:shadow-lg transition-all"
          >
            Coba Tryout Lain
          </button>
          <button
            onClick={() => navigate('/latihan')}
            className="px-8 py-4 border-2 border-[#0050cb] text-[#0050cb] rounded-xl text-[14px] font-medium hover:bg-[#0050cb] hover:text-white transition-colors"
          >
            Mulai Latihan
          </button>
          <button
            onClick={() => navigate('/riwayat')}
            className="px-8 py-4 border border-[#c2c6d8] text-[#424656] rounded-xl text-[14px] font-medium hover:bg-[#ecedfa] transition-colors"
          >
            Lihat Riwayat
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#f2f3ff] border-t border-[#c2c6d8]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 lg:px-10 py-12 max-w-[1440px] mx-auto">
          <div className="space-y-6">
            <div className="text-[24px] font-bold text-[#0050cb]">Stubia</div>
            <p className="text-[16px] text-[#424656] max-w-md">
              Empowering learners worldwide with data-driven education tools and professional resources.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h5 className="text-[14px] font-semibold text-[#191b24] mb-6 uppercase tracking-widest">Platform</h5>
              <ul className="space-y-4">
                <li><Link className="text-[16px] text-[#424656] hover:underline" to="/latihan">Courses</Link></li>
                <li><Link className="text-[16px] text-[#424656] hover:underline" to="/tryout/packages">Tryout</Link></li>
                <li><Link className="text-[16px] text-[#424656] hover:underline" to="/riwayat">Riwayat</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-[14px] font-semibold text-[#191b24] mb-6 uppercase tracking-widest">Support</h5>
              <ul className="space-y-4">
                <li><Link className="text-[16px] text-[#424656] hover:underline" to="#">Privacy Policy</Link></li>
                <li><Link className="text-[16px] text-[#424656] hover:underline" to="#">Terms of Service</Link></li>
                <li><Link className="text-[16px] text-[#424656] hover:underline" to="#">Help Center</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TryoutResult;
