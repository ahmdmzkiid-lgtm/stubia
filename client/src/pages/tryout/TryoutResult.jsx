import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../hooks/useAuth';
import { tryoutService, subscriptionService } from '../../services/api';
import DiscussQuestionModal from '../../components/DiscussQuestionModal';
import MathText from '../../components/MathText';
import NationalLeaderboardCard from '../../components/NationalLeaderboardCard';
import StudentNavbar from '../../components/layout/StudentNavbar';
import { PTN_DATA, getPtnLogo } from '../../data/ptnData';

// Helper functions defined outside the component
const getSubtestCategoryGroup = (name) => {
  const n = (name || '').toLowerCase();
  if (
    n.includes('penalaran umum') ||
    n.includes('pemahaman umum') ||
    n.includes('bacaan') ||
    n.includes('tulisan') ||
    n.includes('kuantitatif') ||
    n.includes('tps') ||
    n.includes('skolastik')
  ) {
    return 'Tes Potensi Skolastik';
  }
  if (
    n.includes('literasi dalam bahasa indonesia') ||
    n.includes('literasi dalam bahasa inggris') ||
    n.includes('literasi bahasa') ||
    n.includes('literasi')
  ) {
    return 'Tes Literasi Bahasa';
  }
  if (n.includes('penalaran matematika') || n.includes('matematika')) {
    return 'Tes Penalaran Matematika';
  }
  return 'Subtes Utama';
};

const CATEGORY_ORDER = [
  'Tes Potensi Skolastik',
  'Tes Literasi Bahasa',
  'Tes Penalaran Matematika',
  'Subtes Utama'
];

const formatDurationDetailed = (totalSec) => {
  const sec = Math.max(0, Math.round(totalSec || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) {
    return `${s} detik`;
  }
  if (s === 0) {
    return `${m} menit`;
  }
  return `${m} menit ${s} detik`;
};
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

  const groupedSubjects = useMemo(() => {
    const groups = {};
    sortedSubjects.forEach((sub) => {
      const cat = getSubtestCategoryGroup(sub.name);
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(sub);
    });

    return CATEGORY_ORDER
      .filter(cat => groups[cat] && groups[cat].length > 0)
      .map(cat => {
        return {
          category: cat,
          items: groups[cat]
        };
      });
  }, [sortedSubjects]);

  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (category) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const [filter, setFilter] = useState('all'); // 'all' | 'wrong' | 'bookmark'
  const [subjectFilter, setSubjectFilter] = useState(''); // active subject name
  const [isDiscussOpen, setIsDiscussOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const certificateRef = useRef(null);
  const [activePlans, setActivePlans] = useState([]);

  const handleShare = () => {
    const text = `Saya baru saja menyelesaikan ${result?.title || 'Tryout'} di Eduzet dengan Skor IRT ${result?.totalScore || 0}/1000! Cek hasilnya di sini:`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: `Hasil Tryout - ${result?.title || 'Eduzet'}`,
        text: text,
        url: shareUrl,
      }).catch(() => {
        setShowShareModal(true);
      });
    } else {
      setShowShareModal(true);
    }
  };

  const downloadCertificatePdf = async () => {
    if (!certificateRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const cleanSlug = (text) => (text || '').trim().replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const pkgSlug = cleanSlug(result?.title || 'TRYOUT');
      const userSlug = cleanSlug(user?.name || 'PESERTA');
      const fileName = `SERTIFIKAT-SNBT-${pkgSlug}-${userSlug}.pdf`;
      pdf.save(fileName);
      toast.success('Surat Keterangan Hasil Tryout berhasil diunduh!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Gagal mengunduh sertifikat.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let allSessionIds = location.state?.allSessionIds;
      let packageId = location.state?.packageId || (!uuidRegex.test(sessionId) ? sessionId : null);

      // If allSessionIds not in state, try localStorage fallbacks
      if (!allSessionIds || allSessionIds.length === 0) {
        // 1. Try result-specific key (saved before navigating to result page, survives refresh)
        if (packageId) {
          const resultSessions = JSON.parse(localStorage.getItem(`tryout_result_sessions_${packageId}`) || '[]');
          if (resultSessions.length > 0) allSessionIds = resultSessions;
        }
        // 2. Fallback to working sessions key (for mid-attempt viewing)
        if ((!allSessionIds || allSessionIds.length === 0) && packageId) {
          const savedSessions = JSON.parse(localStorage.getItem(`tryout_sessions_${packageId}`) || '{}');
          const ids = Object.values(savedSessions);
          if (ids.length > 0) allSessionIds = ids;
        }
      }

      // 1. Try combined result if we have allSessionIds or packageId
      if ((allSessionIds && allSessionIds.length > 0) || packageId) {
        try {
          const response = await tryoutService.getCombinedResult(allSessionIds || [], packageId);
          if (response.data.success) {
            setResult(response.data.data);
            return;
          }
        } catch (err) {
          console.error('Failed to fetch combined result:', err);
        }
      }

      // 2. Single session result (UUID flow)
      if (sessionId && uuidRegex.test(sessionId)) {
        try {
          const response = await tryoutService.getResult(sessionId);
          if (response.data.success) {
            setResult(response.data.data);
            return;
          }
        } catch (err) {
          console.error('Failed to fetch single session result:', err);
        }
      }

      setError('Tidak ada data hasil tryout yang ditemukan.');
    };

    fetchResult().finally(() => setLoading(false));
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

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-8 lg:py-12">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <button 
            onClick={() => navigate('/tryout/packages')} 
            className="flex items-center gap-1.5 text-[#0050cb] hover:text-[#003fb2] font-semibold text-[13px] sm:text-[14px] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">arrow_back</span>
            <span>Kembali ke Pusat Tryout</span>
          </button>
        </div>

        {/* Header Section */}
        <section className="mb-8 sm:mb-12 lg:mb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              <h1 className="text-[24px] sm:text-[32px] lg:text-[40px] font-bold text-[#191b24] mb-1 sm:mb-2 leading-tight">Hasil Tryout</h1>
              <p className="text-[13px] sm:text-base lg:text-[18px] text-[#424656]">{result.title}{result.subtitle ? ` - ${result.subtitle}` : ''}</p>
            </div>
            <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
              <button 
                onClick={downloadCertificatePdf}
                disabled={isGeneratingPdf}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg border border-[#c2c6d8] text-[#424656] hover:bg-[#ecedfa] transition-all text-[12px] sm:text-[14px] disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#0050cb] border-t-transparent rounded-full animate-spin"></span>
                    <span className="font-medium">Mengunduh...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px] sm:text-[22px]">download</span>
                    <span className="font-medium">Unduh Sertifikat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Bento Grid Overview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 mb-10 sm:mb-16 lg:mb-20">
          {/* Combined Score & Answer Stats Card */}
          <div className="md:col-span-8 bg-[#0050cb] rounded-xl p-5 sm:p-6 lg:p-8 text-white shadow-lg flex flex-col justify-between self-start">
            <div>
              <p className="text-[11px] sm:text-[12px] font-medium opacity-80 uppercase tracking-widest mb-2">Skor IRT</p>
              <div className="flex items-baseline gap-1 mt-1 sm:mt-2">
                <span className="text-[52px] sm:text-[60px] lg:text-[72px] font-bold leading-none">{result.totalScore}</span>
                <span className="text-[18px] sm:text-[20px] opacity-60">/1000</span>
              </div>
              <p className="text-[11px] sm:text-[12px] opacity-75 mt-2 sm:mt-3 leading-snug">
                Skor bersifat dinamis (IRT) & dapat menyesuaikan seiring bertambahnya peserta
              </p>
            </div>

            {/* Statistik Jawaban Underneath */}
            <div className="mt-6 pt-5 border-t border-white/20 space-y-3">
              <p className="text-[11px] sm:text-[12px] font-medium opacity-80 uppercase tracking-widest mb-1">Statistik Jawaban</p>
              
              {/* Segmented Bar */}
              <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden flex mb-3">
                {stats.total > 0 && (
                  <>
                    <div className="bg-[#10b981] h-full transition-all duration-1000" style={{ width: `${(stats.correct / stats.total) * 100}%` }}></div>
                    <div className="bg-[#ef4444] h-full transition-all duration-1000" style={{ width: `${(stats.incorrect / stats.total) * 100}%` }}></div>
                    <div className="bg-[#c2c6d8] h-full transition-all duration-1000" style={{ width: `${(stats.unanswered / stats.total) * 100}%` }}></div>
                  </>
                )}
              </div>

              {/* Legend List */}
              <div className="grid grid-cols-3 gap-2 text-[12px] sm:text-[14px]">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0"></span>
                  <span className="opacity-90 truncate">Benar: <strong className="ml-0.5">{stats.correct}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shrink-0"></span>
                  <span className="opacity-90 truncate">Salah: <strong className="ml-0.5">{stats.incorrect}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c2c6d8] shrink-0"></span>
                  <span className="opacity-90 truncate">Kosong: <strong className="ml-0.5">{stats.unanswered}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Peringkat Tryout - Tabbed Leaderboard */}
          <div className="md:col-span-4">
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-[#c2c6d8]/20 md:max-h-[520px] md:overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c2c6d8 transparent' }}>
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
                        const displayScore = isCurrentUser ? (result?.totalScore ?? entry.score) : entry.score;
                        const medalColors = { 1: 'bg-[#FFD700] text-[#7A6200]', 2: 'bg-[#C0C0C0] text-[#555]', 3: 'bg-[#CD7F32] text-white' };
                        return (
                          <div key={entry.rank} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${isCurrentUser ? 'bg-[#e8eeff] border border-[#0050cb]/30' : 'hover:bg-[#f8f9ff]'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${medalColors[entry.rank] || 'bg-[#ecedfa] text-[#424656]'}`}>{entry.rank}</div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] font-medium truncate ${isCurrentUser ? 'text-[#0050cb] font-bold' : 'text-[#191b24]'}`}>
                                {isCurrentUser ? `${entry.name} (Kamu)` : entry.name}
                              </p>
                            </div>
                            <span className="text-[14px] font-bold text-[#191b24] shrink-0">{displayScore}</span>
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
                  {(() => {
                    const ptnEntry = PTN_DATA.find(p => leaderboard?.targetPtn?.includes(p.singkatan) || leaderboard?.targetPtn?.includes(p.nama));
                    const logoUrl = ptnEntry?.id ? getPtnLogo(ptnEntry.id) : null;
                    const majorEntry = ptnEntry?.prodi?.find(m => m.nama === leaderboard?.targetMajor);
                    const targetScore = majorEntry?.skor;
                    const userScore = leaderboard?.user_rank?.score || leaderboard?.userMajorRank?.score || 0;
                    const passed = targetScore ? userScore >= targetScore : false;

                    return (
                      <div className="bg-[#f5f5ff] rounded-xl p-4 mb-4 border border-[#e6e7f4] flex items-start gap-3">
                        {logoUrl ? (
                          <img src={logoUrl} alt={ptnEntry?.singkatan || 'Logo'} className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-gray-100 flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#dae1ff] flex items-center justify-center text-[#0050cb] flex-shrink-0">
                            <span className="material-symbols-outlined text-[24px]">school</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-[#0050cb]">{leaderboard?.targetPtn}</p>
                          <p className="text-[13px] font-semibold text-[#191b24] mt-0.5">{leaderboard?.targetMajor}</p>
                          {targetScore && (
                            <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${passed ? 'bg-[#e8f5e9] text-[#2e7d32]' : 'bg-[#fef3f2] text-[#ba1a1a]'}`}>
                              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{passed ? 'check_circle' : 'cancel'}</span>
                              {passed ? `Skormu melewati target (${targetScore})` : `Target skor: ${targetScore} (kurang ${targetScore - userScore})`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

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
                        const displayScore = isCurrentUser ? (result?.totalScore ?? entry.score) : entry.score;
                        const medalColors = { 1: 'bg-[#FFD700] text-[#7A6200]', 2: 'bg-[#C0C0C0] text-[#555]', 3: 'bg-[#CD7F32] text-white' };
                        return (
                          <div key={entry.rank} className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${isCurrentUser ? 'bg-[#ede9fe] border border-[#6d28d9]/30' : 'hover:bg-[#f8f9ff]'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${medalColors[entry.rank] || 'bg-[#ecedfa] text-[#424656]'}`}>{entry.rank}</div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] font-medium truncate ${isCurrentUser ? 'text-[#6d28d9] font-bold' : 'text-[#191b24]'}`}>
                                {isCurrentUser ? `${entry.name} (Kamu)` : entry.name}
                              </p>
                            </div>
                            <span className="text-[14px] font-bold text-[#191b24] shrink-0">{displayScore}</span>
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
        <section className="mb-16">
          <div className="mb-6">
            <h2 className="text-[24px] font-bold text-[#191b24]">Analisis PerSubtes</h2>
          </div>
          <div className="space-y-4 sm:space-y-6">
            {groupedSubjects.map((group, groupIdx) => {
              const isCollapsed = collapsedGroups[group.category];
              return (
                <div key={groupIdx} className="bg-transparent">
                  {/* Category Header */}
                  <div
                    onClick={() => toggleGroup(group.category)}
                    className="flex items-center justify-between py-2 sm:py-3 border-b border-[#c2c6d8]/30 mb-3 sm:mb-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] sm:text-[16px] font-bold text-[#191b24]">{group.category} <span className="font-semibold text-[#0050cb] text-[13px] sm:text-[15px] ml-1">{group.items.length}/{group.items.length}</span></h3>
                    </div>
                    <span className={`material-symbols-outlined text-[20px] text-[#727687] transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>

                  {/* Subtests Grid */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-1">
                    {group.items.map((subject, idx) => {
                      const subjectQuestions = result.questions?.filter(q => q.subject === subject.name) || [];
                      const unansweredCount = subjectQuestions.filter(q => q.userAnswer === null).length;
                      const correctCount = subject.correct || 0;
                      const totalCount = subject.total || 0;
                      const incorrectCount = totalCount - correctCount - unansweredCount;

                      const questionsSecSum = subjectQuestions.reduce((sum, q) => sum + (q.timeSpentSec || 0), 0);
                      const rawSec = (subject.totalTimeSpent !== undefined && subject.totalTimeSpent !== null && subject.totalTimeSpent > 0)
                        ? subject.totalTimeSpent
                        : (questionsSecSum > 0
                            ? questionsSecSum
                            : (subject.avgSpeed && subject.avgSpeed > 0
                                ? subject.avgSpeed * totalCount
                                : (totalCount > 0 ? totalCount * 75 : 0)));
                      const m = rawSec > 0 ? (rawSec / 60).toFixed(1).replace('.0', '') : '0';

                      const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

                      return (
                        <div key={idx} className="bg-white rounded-xl p-3.5 sm:p-5 border border-[#c2c6d8]/30 hover:border-[#0050cb]/20 hover:shadow-md transition-all duration-300">
                          <div className="flex items-start justify-between gap-3 mb-1.5 sm:mb-1">
                            <h4 className="text-[14px] sm:text-[16px] font-bold text-[#191b24] line-clamp-2 leading-snug sm:leading-tight mt-0.5 sm:mt-1 flex-1">{getShortName(subject.name)}</h4>
                            <div className="flex flex-col items-end shrink-0 bg-[#f2f3ff] px-2 py-1 rounded-lg">
                              <span className="text-[9px] font-semibold text-[#0050cb] uppercase tracking-wider mb-0.5">Skor</span>
                              <span className="text-[14px] sm:text-[15px] font-bold text-[#0050cb] leading-none">{subject.score || 0}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3 text-[12px] sm:text-[13px] font-medium text-[#727687]">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-[#0050cb]">timer</span>
                              <span>{formatDurationDetailed(rawSec)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px] sm:text-[16px] text-[#0050cb]">my_location</span>
                              <span>akurasi <span className="font-bold text-[#0050cb]">{accuracy}%</span></span>
                            </div>
                          </div>

                          {/* Segmented Progress Bar */}
                          <div className="w-full h-2 rounded-full flex overflow-hidden mb-3 bg-[#e6e7f4]">
                            {totalCount > 0 && (
                              <>
                                <div style={{ width: `${(correctCount / totalCount) * 100}%` }} className="bg-[#10b981]"></div>
                                <div style={{ width: `${(incorrectCount / totalCount) * 100}%` }} className="bg-[#ef4444]"></div>
                                <div style={{ width: `${(unansweredCount / totalCount) * 100}%` }} className="bg-[#c2c6d8]"></div>
                              </>
                            )}
                          </div>

                          {/* Legend */}
                          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 sm:gap-4 text-[11px] sm:text-[13px] text-[#727687]">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                              <span><span className="font-bold text-[#10b981]">{correctCount}</span> benar</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div>
                              <span><span className="font-bold text-[#ef4444]">{incorrectCount}</span> salah</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#c2c6d8]"></div>
                              <span><span className="font-bold text-[#a0a4b8]">{unansweredCount}</span> kosong</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
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
                  Pembahasan Khusus Pengguna Premium
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

        {/* Methodology Modal */}
        {showMethodologyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#c2c6d8]/30 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#c2c6d8]/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0050cb]">analytics</span>
                  <h3 className="text-[18px] font-bold text-[#191b24]">Metodologi Penilaian IRT 3PL</h3>
                </div>
                <button 
                  onClick={() => setShowMethodologyModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#727687] hover:bg-gray-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="space-y-3.5 text-[13px] text-[#424656] leading-relaxed">
                <div className="bg-[#f2f3ff] p-3.5 rounded-xl border border-[#dae1ff]">
                  <p className="font-semibold text-[#0050cb] mb-1">Standar Penilaian Resmi SNPMB UTBK</p>
                  <p className="text-[12px] text-[#424656]">Sistem penilaian Eduzet menggunakan model <strong>Item Response Theory (IRT) 3-Parameter Logistic (3PL)</strong> yang secara akurat mengukur bobot setiap soal secara ilmiah.</p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#0050cb]/10 text-[#0050cb] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-bold text-[#191b24]">Tingkat Kesulitan (*Difficulty*)</p>
                      <p className="text-[12px] text-[#727687]">Soal yang sedikit dijawab benar oleh peserta lain dianggap sulit dan bernilai poin lebih tinggi.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#0050cb]/10 text-[#0050cb] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-bold text-[#191b24]">Daya Pembeda (*Discrimination*)</p>
                      <p className="text-[12px] text-[#727687]">Mengukur seberapa efektif suatu soal dalam membedakan peserta berkemampuan tinggi dan rendah.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#0050cb]/10 text-[#0050cb] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-bold text-[#191b24]">Faktor Tebakan (*Pseudo-guessing*)</p>
                      <p className="text-[12px] text-[#727687]">Memperhitungkan kemungkinan peserta menjawab benar hanya karena menebak pada pilihan ganda.</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#c2c6d8]/30 text-[12px] text-[#424656] flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#0050cb] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                  <div>
                    <strong>Catatan:</strong> Tidak ada sistem minus untuk jawaban salah. Namun, konsistensi pengerjaan dan akurasi pada soal berbobot tinggi akan menaikkan estimasi skor (*theta*) secara signifikan.
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowMethodologyModal(false)}
                  className="px-5 py-2 bg-[#0050cb] text-white font-bold text-[13px] rounded-xl hover:bg-[#003da6] transition-colors"
                >
                  Paham
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Hidden Printable Certificate Element */}
        <div className="fixed left-[-9999px] top-[-9999px] pointer-events-none opacity-0">
          <div
            ref={certificateRef}
            className="bg-white text-[#191b24] p-8 sm:p-12 w-[794px] min-h-[1123px] relative flex flex-col justify-between border-[12px] border-[#0050cb]/10"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
            {/* Outer Frame Border */}
            <div className="absolute top-3 left-3 right-3 bottom-3 border-2 border-[#0050cb]/30 pointer-events-none"></div>

            <div>
              {/* Center Logo Header */}
              <div className="flex flex-col items-center justify-center border-b-2 border-[#191b24] pb-5 mb-6">
                <img src="/stubiabrandicon.png" alt="Stubia Logo" className="h-12 object-contain mb-3" />
                <h1 className="text-[22px] font-bold uppercase tracking-wider text-[#191b24] font-sans text-center">
                  SERTIFIKAT SIMULASI TRYOUT SNBT
                </h1>
                <p className="text-[15px] font-bold text-[#0050cb] font-sans mt-1 text-center uppercase tracking-wide">
                  {result?.title || 'TRYOUT UTBK'}
                </p>
                <p className="text-[11px] text-[#727687] font-sans mt-1 text-center">
                  Nomor: STB/SKH/{result?.packageId ? String(result.packageId).slice(0, 8).toUpperCase() : 'TRYOUT'}/{new Date().getFullYear()}
                </p>
              </div>

              {/* Student Info */}
              <div className="my-6 text-[14px] leading-relaxed font-sans text-[#2c3e50] space-y-2">
                <p>Menerangkan secara resmi bahwa peserta di bawah ini:</p>
                <div className="grid grid-cols-12 gap-2 bg-[#f8fafc] p-4 rounded-xl border border-gray-200 my-3">
                  <div className="col-span-4 font-semibold text-[#424656]">Nama Peserta</div>
                  <div className="col-span-8 font-bold text-[#191b24]">: {user?.name || 'Peserta Stubia'}</div>
                  <div className="col-span-4 font-semibold text-[#424656]">Paket Ujian</div>
                  <div className="col-span-8 font-bold text-[#191b24]">: {result?.title || 'Tryout UTBK'}</div>
                  <div className="col-span-4 font-semibold text-[#424656]">Tanggal Pengerjaan</div>
                  <div className="col-span-8 font-bold text-[#191b24]">: {new Date(result?.computedAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
                <p>Telah menyelesaikan rangkaian simulasi ujian UTBK-SNBT dengan perolehan nilai kalkulasi IRT (Item Response Theory 3PL) sebagai berikut:</p>
              </div>

              {/* Total Score Box */}
              <div className="my-6 p-5 bg-[#f0f4ff] rounded-xl border-2 border-[#0050cb]/30 flex items-center justify-between font-sans">
                <div className="flex flex-col justify-center">
                  <p className="text-[12px] font-bold uppercase text-[#0050cb] tracking-wider leading-snug">SKOR IRT TOTAL</p>
                  <p className="text-[11px] text-[#424656] mt-0.5 leading-snug">Dihitung berdasarkan pembobotan Item Response Theory (3PL)</p>
                </div>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="text-[38px] font-black text-[#0050cb] leading-none">{result?.totalScore || 0}</span>
                  <span className="text-[15px] font-bold text-[#424656] leading-none">/ 1000</span>
                </div>
              </div>

              {/* Subtests Table */}
              <div className="my-6 font-sans">
                <p className="text-[13px] font-bold text-[#191b24] mb-2">Rincian Hasil Subtes:</p>
                <table className="w-full text-left text-[12px] border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-[#0050cb] text-white">
                      <th className="p-2 border border-gray-300 w-10 text-center">No</th>
                      <th className="p-2 border border-gray-300">Materi Subtes</th>
                      <th className="p-2 border border-gray-300 text-center">Benar</th>
                      <th className="p-2 border border-gray-300 text-center">Salah</th>
                      <th className="p-2 border border-gray-300 text-center">Kosong</th>
                      <th className="p-2 border border-gray-300 text-right">Skor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sortedSubjects || []).map((sub, i) => {
                      const subjectQuestions = result?.questions?.filter(q => q.subject === sub.name) || [];
                      const unansweredCount = subjectQuestions.filter(q => q.userAnswer === null).length;
                      const correctCount = sub.correct || 0;
                      const totalCount = sub.total || 0;
                      const incorrectCount = totalCount - correctCount - unansweredCount;

                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-2 border border-gray-300 text-center font-semibold">{i + 1}</td>
                          <td className="p-2 border border-gray-300 font-semibold">{sub.name}</td>
                          <td className="p-2 border border-gray-300 text-center text-[#10b981] font-bold">{correctCount}</td>
                          <td className="p-2 border border-gray-300 text-center text-[#ef4444] font-bold">{incorrectCount}</td>
                          <td className="p-2 border border-gray-300 text-center text-gray-400 font-bold">{unansweredCount}</td>
                          <td className="p-2 border border-gray-300 text-right font-bold text-[#0050cb]">{sub.score || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Section */}
            <div className="mt-8 pt-4 font-sans text-[12px] flex items-end justify-end border-t border-gray-200">
              <div className="text-center min-w-[200px]">
                <p className="text-[11px] text-[#424656] mb-1">Jakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold text-[#191b24] mb-10">Tim Akademik Stubia</p>
                <div className="border-b border-gray-800 font-bold text-[#191b24] pb-1">
                  STUBIA ACADEMIC SYSTEM
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Official Verified Document</p>
              </div>
            </div>

          </div>
        </div>

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
    </div>
  );
};

export default TryoutResult;
