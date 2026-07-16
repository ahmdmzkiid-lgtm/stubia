import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { ujianMandiriService, activityService } from '../services/api';
import QuestionGrid from '../components/tryout/QuestionGrid';
import SubmitConfirmModal from '../components/SubmitConfirmModal';
import Calculator from '../components/tryout/Calculator';
import SocialFollowModal from '../components/SocialFollowModal';
import LatihanPreRequirementModal from '../components/LatihanPreRequirementModal';
import MathText from '../components/MathText';
import ZoomableImage from '../components/ui/ZoomableImage';
import ExitConfirmModal from '../components/ExitConfirmModal';
import PreviewBanner from '../components/layout/PreviewBanner';

const LatihanSoalUM = () => {
  const navigate = useNavigate();
  const { ujianId, latihanId } = useParams();
  const { user } = useAuth();

  const [ujian, setUjian] = useState(null);
  const [latihan, setLatihan] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showPreModal, setShowPreModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingExitPath, setPendingExitPath] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ujianRes, latihanRes] = await Promise.all([
          ujianMandiriService.getById(ujianId),
          ujianMandiriService.getLatihan(ujianId),
        ]);
        const ujianData = ujianRes.data.data;
        const latihanList = latihanRes.data.data || [];
        const latihanData = latihanList.find(l => String(l.id) === String(latihanId));
        
        if (!ujianData || !latihanData) {
          navigate(`/ujian-mandiri/${ujianId}`);
          return;
        }
        
        setUjian(ujianData);
        setLatihan(latihanData);
        
        // Fetch questions for this latihan
        const qRes = await ujianMandiriService.getQuestions({ parent_type: 'latihan_soal', parent_id: latihanId });
        setQuestions(qRes.data.data || []);
      } catch (err) {
        console.error(err);
        const code = err.response?.data?.code;
        if (code === 'FREE_LIMIT_REQUIRE_SOCIAL') {
          setShowPreModal(true);
          setShowSocialModal(true);
          setError('FREE_LIMIT_REQUIRE_SOCIAL');
        } else if (code === 'FREE_LIMIT_REACHED') {
          setError('FREE_LIMIT_REACHED');
        } else if (code === 'PLAN_REQUIRED') {
          setError('PLAN_REQUIRED');
        } else {
          const errMsg = err.response?.data?.error || err.message || 'Gagal memuat latihan soal';
          toast.error(errMsg);
          navigate(`/ujian-mandiri/${ujianId}`);
        }
      } finally {
        setLoading(false);
      }
    };
    if (ujianId && latihanId) fetchData();
  }, [ujianId, latihanId, navigate]);

  // Block copy/select-all keyboard shortcuts on exam page
  useEffect(() => {
    const blockCopy = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'a', 'x', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', blockCopy);
    return () => document.removeEventListener('keydown', blockCopy);
  }, []);

  const handleVerified = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ujianRes, latihanRes] = await Promise.all([
        ujianMandiriService.getById(ujianId),
        ujianMandiriService.getLatihan(ujianId),
      ]);
      const ujianData = ujianRes.data.data;
      const latihanList = latihanRes.data.data || [];
      const latihanData = latihanList.find(l => String(l.id) === String(latihanId));
      setUjian(ujianData);
      setLatihan(latihanData);
      const qRes = await ujianMandiriService.getQuestions({ parent_type: 'latihan_soal', parent_id: latihanId });
      setQuestions(qRes.data.data || []);
      setShowSocialModal(false);
      setShowPreModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Gagal memuat latihan');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (choiceId) => {
    setAnswers({ ...answers, [currentIndex]: choiceId });
  };

  const toggleFlag = () => {
    setFlagged({ ...flagged, [currentIndex]: !flagged[currentIndex] });
  };

  const handleConfirmFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Persist results to backend latihan_sessions table
      const res = await activityService.submitLatihan({
        subject_id: null,
        subject_name: latihan?.title || 'Latihan Ujian Mandiri',
        latihan_id: latihanId,
        questions,
        answers,
      });

      const irtData = res.data?.data || {};
      const sessionId = res.data?.data?.sessionId;

      navigate(sessionId
        ? `/ujian-mandiri/${ujianId}/latihan/${latihanId}/hasil/${sessionId}`
        : `/ujian-mandiri/${ujianId}/latihan/${latihanId}/hasil`, {
        state: { 
          questions, 
          answers, 
          latihanName: latihan?.title,
          ujianName: ujian?.nama_ujian,
          ujianId,
          latihanId,
          irtData,
          sessionId,
        }
      });
    } catch (err) {
      console.error('Failed to persist UM latihan session:', err);
      toast.error('Gagal menyimpan latihan. Coba lagi.');
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    setShowSubmitModal(true);
  };

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (showSubmitModal) return;

      const key = e.key.toUpperCase();
      const choices = currentQuestion?.choices || [];

      if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
        const match = choices.find(c => (c.label || '').toUpperCase() === key);
        if (match) {
          e.preventDefault();
          handleOptionSelect(match.id);
        }
      }
      if (e.key === 'ArrowRight' || key === 'N') {
        e.preventDefault();
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }
      if (e.key === 'ArrowLeft' || key === 'P') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      }
      if (key === 'F') {
        e.preventDefault();
        toggleFlag();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, currentIndex, totalQuestions, showSubmitModal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-5 text-[#424656] font-medium text-[15px]">Memuat soal...</p>
        </div>
      </div>
    );
  }

  if (error === 'PLAN_REQUIRED') {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 border border-[#c2c6d8]/30 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-[#191b24] mb-2">Latihan Premium</h2>
          <p className="text-sm text-[#424656] mb-6">Latihan ini khusus paket Premium atau Sultan. Upgrade paket untuk mengakses.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/pricing')} className="px-5 py-3 rounded-xl text-white font-semibold" style={{ background: 'linear-gradient(135deg, #0050cb, #3b82f6)' }}>Upgrade Paket</button>
            <button onClick={() => navigate(`/ujian-mandiri/${ujianId}`)} className="px-5 py-3 rounded-xl border border-[#e5e7eb] text-[#424656] font-semibold">Kembali</button>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'FREE_LIMIT_REACHED') {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#c2c6d8]/30 shadow-[0_24px_48px_-12px_rgba(0,80,203,0.08)] text-center animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0050cb, #6366f1)' }}>
            <span className="material-symbols-outlined text-white text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
          </div>
          <h2 className="text-[28px] font-bold text-[#191b24] mb-3 tracking-tight">Akses Latihan Terbatas</h2>
          <p className="text-[15px] text-[#424656] leading-relaxed mb-8">
            Akun Gratis kamu memiliki batas untuk mengerjakan setiap latihan soal sebanyak 1 kali. Upgrade ke <strong className="text-[#0050cb]">Premium</strong> sekarang untuk accessing ratusan bank soal tanpa batasan!
          </p>

          {/* Features list */}
          <div className="text-left bg-[#faf8ff] rounded-2xl p-6 border border-[#c2c6d8]/20 mb-8 space-y-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#0050cb] font-bold mt-0.5">check_circle</span>
              <p className="text-sm font-medium text-[#424656]">Akses tak terbatas ke seluruh bank soal UTBK & Ujian Mandiri</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#0050cb] font-bold mt-0.5">check_circle</span>
              <p className="text-sm font-medium text-[#424656]">Ujian simulasi dengan sistem IRT real-time standar nasional</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#0050cb] font-bold mt-0.5">check_circle</span>
              <p className="text-sm font-medium text-[#424656]">Sesi Battle 1vs1 dan analisis kelemahan subtes</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/pricing')}
              className="flex-1 py-4 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #0050cb, #3b82f6)' }}
            >
              <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
              <span>Upgrade Premium Sekarang</span>
            </button>
            <button
              onClick={() => navigate(`/ujian-mandiri/${ujianId}`)}
              className="sm:w-40 py-4 rounded-xl border border-[#c2c6d8] text-[#424656] font-bold text-sm hover:bg-[#e6e7f4]/50 transition-all active:scale-[0.98]"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'FREE_LIMIT_REQUIRE_SOCIAL') {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 border border-[#c2c6d8]/30 shadow-lg text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0050cb]/10 flex items-center justify-center text-[#0050cb]">
            <span className="material-symbols-outlined text-[32px]">favorite</span>
          </div>
          <h2 className="text-2xl font-bold text-[#191b24] mb-2">Verifikasi Sosial Diperlukan</h2>
          <p className="text-sm text-[#424656] mb-6">Follow akun Stubia dan tag 3 teman di komentar postingan. Setelah disetujui admin, kamu bisa mengakses latihan soal gratis.</p>
          <div className="flex gap-3 justify-center">
            <button
              className="px-5 py-3 rounded-xl text-white font-semibold hover:shadow-lg active:scale-[0.99] transition"
              style={{ background: 'linear-gradient(135deg, #0050cb, #3b82f6)' }}
              onClick={() => { setShowPreModal(true); setShowSocialModal(true); }}
            >
              Buka Verifikasi
            </button>
            <button
              className="px-5 py-3 rounded-xl border border-[#e5e7eb] text-[#424656] font-semibold hover:bg-gray-50"
              onClick={() => navigate(`/ujian-mandiri/${ujianId}`)}
            >
              Kembali
            </button>
          </div>
        </div>
        <LatihanPreRequirementModal
          open={showPreModal}
          onClose={() => setShowPreModal(false)}
          onProceed={() => setShowSocialModal(true)}
        />
        <SocialFollowModal
          open={showSocialModal}
          onClose={() => setShowSocialModal(false)}
          onVerified={handleVerified}
        />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] block mb-4">quiz</span>
          <h2 className="text-[22px] font-bold text-[#191b24] mb-2">Belum Ada Soal</h2>
          <p className="text-[#424656] mb-6 text-[15px]">Belum ada soal tersedia untuk latihan ini.</p>
          <button onClick={() => navigate(`/ujian-mandiri/${ujianId}`)} className="px-8 py-3 bg-[#0050cb] text-white font-bold rounded-xl hover:bg-[#003da6] transition-all">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-5 text-[#424656] font-medium text-[15px]">Menyelaraskan soal...</p>
        </div>
      </div>
    );
  }

  const subjectName = latihan?.title || 'Latihan';
  const showCalc = subjectName?.toLowerCase().includes('matematika') || subjectName?.toLowerCase().includes('kuantitatif');

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b24] flex flex-col">
      <PreviewBanner />
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8ff]/95 backdrop-blur-md border-b border-[#e0e2f0] shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { setPendingExitPath('/dashboard'); setShowExitModal(true); }} className="flex items-center">
              <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 sm:h-9 cursor-pointer" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[#0050cb] bg-[#e8eeff] px-3 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[16px]">school</span>
              {ujian?.namaUjian || 'Ujian Mandiri'}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {showCalc && (
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-[13px] transition-all ${
                  showCalculator ? 'bg-[#0050cb] text-white shadow-lg shadow-[#0050cb]/20' : 'bg-[#e8eeff] text-[#0050cb] hover:bg-[#dae1ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">calculate</span>
                <span className="hidden sm:inline">Kalkulator</span>
              </button>
            )}
            <button
              onClick={() => setShowNavDrawer(true)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl text-[#424656] hover:bg-[#ecedfa] transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">grid_view</span>
            </button>
            <div className="hidden sm:flex w-10 h-10 rounded-full bg-[#0050cb] text-white items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pb-20">
        <div className="pt-[76px] sm:pt-[84px] pb-4 px-4 sm:px-6 bg-[#faf8ff] border-b border-[#e0e2f0]">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-[17px] font-bold text-[#191b24]">{subjectName}</h1>
                <p className="text-[13px] text-[#727687]">Soal {currentIndex + 1} dari {totalQuestions}</p>
              </div>
              <div className="text-[13px] font-medium text-[#727687] bg-[#ecedfa] px-3 py-1 rounded-lg">
                {Object.keys(answers).length} / {totalQuestions} soal terjawab
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="min-w-0">
            <div className="mb-6">
              <div className="flex justify-between text-[12px] text-[#727687] mb-2">
                <span>Soal {currentIndex + 1}</span>
                <span>{totalQuestions} soal</span>
              </div>
              <div className="h-2 bg-[#e0e2f0] rounded-full overflow-hidden">
                <div className="h-full bg-[#0050cb] rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-7 mb-6 border border-[#e0e2f0] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-xl bg-[#0050cb] text-white flex items-center justify-center font-bold text-[14px] shadow-sm shadow-[#0050cb]/20">{currentIndex + 1}</span>
              </div>
              {currentQuestion.image_url && currentQuestion.image_position === 'before' && (
                <div className="mb-4">
                  <ZoomableImage className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={currentQuestion.image_url} alt="Soal" />
                </div>
              )}
              {currentQuestion.stimulus && (
                <div className="mb-4 text-[15px] text-[#191b24] leading-relaxed whitespace-pre-wrap">
                  <MathText text={currentQuestion.stimulus} />
                </div>
              )}
              <MathText className="text-[15px] text-[#191b24] leading-relaxed" text={currentQuestion.content || ''} />
              {currentQuestion.image_url && currentQuestion.image_position !== 'before' && (
                <div className="mt-4">
                  <ZoomableImage className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={currentQuestion.image_url} alt="Soal" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {(currentQuestion.choices || []).map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleOptionSelect(choice.id)}
                  className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    answers[currentIndex] === choice.id
                    ? 'bg-[#e8eeff] border-[#0050cb] shadow-sm shadow-[#0050cb]/10'
                    : 'bg-white border-[#e0e2f0] hover:border-[#a8b4d9] hover:shadow-sm'
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold shrink-0 transition-all ${
                    answers[currentIndex] === choice.id
                    ? 'bg-[#0050cb] text-white shadow-sm shadow-[#0050cb]/20'
                    : 'bg-[#ecedfa] text-[#424656] group-hover:bg-[#dae1ff]'
                  }`}>{choice.label}</span>
                  <MathText className={`text-[14px] leading-relaxed ${answers[currentIndex] === choice.id ? 'font-medium text-[#191b24]' : 'text-[#424656]'}`} text={choice.content || ''} />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#e0e2f0]">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-3 rounded-xl border border-[#c2c6d8] text-[13px] font-semibold text-[#424656] hover:bg-[#ecedfa] transition-colors disabled:opacity-35 disabled:cursor-not-allowed min-w-0"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>
              <button
                onClick={toggleFlag}
                className={`px-3 sm:px-4 py-3 rounded-xl text-[13px] font-semibold transition-colors flex items-center justify-center gap-1 min-w-0 ${
                  flagged[currentIndex] ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'text-[#727687] hover:bg-[#ecedfa] border border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{flagged[currentIndex] ? 'bookmark_added' : 'bookmark'}</span>
                <span className="hidden sm:inline">Ragu-ragu</span>
                <span className="sm:hidden">Ragu</span>
              </button>
              <button
                onClick={() => {
                  if (currentIndex < totalQuestions - 1) {
                    setCurrentIndex(currentIndex + 1);
                  } else {
                    handleFinish();
                  }
                }}
                className="bg-[#0050cb] text-white px-4 sm:px-6 py-3 rounded-xl text-[13px] font-semibold hover:bg-[#003da6] transition-colors flex items-center justify-center gap-1 sm:gap-2 shadow-sm shadow-[#0050cb]/20 min-w-0"
              >
                <span className="truncate">{currentIndex < totalQuestions - 1 ? 'Lanjut' : 'Selesai'}</span>
                <span className="material-symbols-outlined text-[18px]">{currentIndex < totalQuestions - 1 ? 'chevron_right' : 'check'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowNavDrawer(true)}
              className="lg:hidden mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#c2c6d8] text-[13px] font-semibold text-[#424656] hover:bg-[#ecedfa] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              Daftar Soal
            </button>
          </div>

          <aside className="hidden lg:block sticky top-[140px]">
            <QuestionGrid
              questions={questions}
              currentSubject={subjectName}
              currentIndex={currentIndex}
              answers={answers}
              flagged={flagged}
              onNavigate={(idx) => setCurrentIndex(idx)}
              onSubmit={handleFinish}
              totalAnswered={Object.keys(answers).length}
            />
          </aside>
        </div>
      </main>

      {showNavDrawer && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-start sm:items-center sm:justify-center p-0 sm:p-4 animate-fade-in" onClick={() => setShowNavDrawer(false)}>
          <div className="bg-[#faf8ff] w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-b-2xl sm:rounded-2xl pt-20 sm:pt-4 animate-slide-down shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-4">
              <h3 className="font-bold text-[#191b24]">Daftar Soal</h3>
              <button onClick={() => setShowNavDrawer(false)} className="w-8 h-8 rounded-lg hover:bg-[#ecedfa] flex items-center justify-center text-[#424656]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-3">
              <QuestionGrid
                questions={questions}
                currentSubject={subjectName}
                currentIndex={currentIndex}
                answers={answers}
                flagged={flagged}
                onNavigate={(idx) => { setCurrentIndex(idx); setShowNavDrawer(false); }}
                onSubmit={() => { setShowNavDrawer(false); handleFinish(); }}
                totalAnswered={Object.keys(answers).length}
              />
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-[#faf8ff]/95 backdrop-blur-md border-t border-[#e0e2f0] py-2.5 sm:py-3 px-4 sm:px-6 z-40">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-[12px] sm:text-[13px] text-[#727687]">
          <span className="font-medium truncate mr-2">{subjectName}</span>
          <span className="bg-[#ecedfa] px-2.5 py-0.5 rounded-md font-semibold whitespace-nowrap">{Object.keys(answers).length} / {totalQuestions} terjawab</span>
        </div>
      </div>

      <SubmitConfirmModal
        open={showSubmitModal}
        onClose={() => !submitting && setShowSubmitModal(false)}
        onConfirm={handleConfirmFinish}
        loading={submitting}
        title="Sudah Yakin dengan Jawabanmu?"
        answered={Object.keys(answers).length}
        total={totalQuestions}
      />
      {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}

      <ExitConfirmModal
        open={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => { setShowExitModal(false); navigate(pendingExitPath || '/dashboard'); }}
        title="Yakin ingin keluar dari latihan?"
        message="Jawaban yang sudah dikerjakan akan tetap tersimpan."
      />
    </div>
  );
};

export default LatihanSoalUM;
