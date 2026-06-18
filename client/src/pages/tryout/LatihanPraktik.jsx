import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { soalService, subjectService, activityService } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import QuestionGrid from '../../components/tryout/QuestionGrid';
import SubmitConfirmModal from '../../components/SubmitConfirmModal';
import Calculator from '../../components/tryout/Calculator';
import SocialFollowModal from '../../components/SocialFollowModal';
import LatihanPreRequirementModal from '../../components/LatihanPreRequirementModal';
import MathText from '../../components/MathText';
import ExitConfirmModal from '../../components/ExitConfirmModal';

const LatihanPraktik = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const topicId = searchParams.get('topic_id');
  const { user } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [subjectName, setSubjectName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  // isScrolled removed - header is now fixed style
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showPreModal, setShowPreModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingExitPath, setPendingExitPath] = useState(null);
  const [excludeCompleted, setExcludeCompleted] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { subject_id: subjectId, limit: 100, exclude_completed: excludeCompleted ? 'true' : 'false' };
        if (topicId) params.topic_id = topicId;

        const [soalRes, subRes] = await Promise.all([
          soalService.list(params),
          subjectService.list()
        ]);
        // Backend returns { success: true, data: [...] } — data is a direct array
        const qs = Array.isArray(soalRes.data?.data) ? soalRes.data.data : [];
        setQuestions(qs);
        const subj = (subRes.data?.data || []).find(s => s.id === subjectId);
        setSubjectName(subj?.title || subj?.name || 'Latihan');

        // Fetch topic name if topicId is given
        if (topicId) {
          try {
            const topicsRes = await subjectService.listTopics(subjectId);
            const topic = (topicsRes.data?.data || []).find(t => t.id === topicId);
            if (topic) setTopicName(topic.title);
          } catch {}
        }
      } catch (err) {
        console.error(err);
        const code = err.response?.data?.code;
        const isGratis = !user || user.current_plan === 'gratis';
        if (code === 'FREE_LIMIT_REQUIRE_SOCIAL' && isGratis) {
          setShowPreModal(true);
          setShowSocialModal(true);
          setError('FREE_LIMIT_REQUIRE_SOCIAL');
        } else if (code === 'FREE_LIMIT_REACHED' && isGratis) {
          setError('FREE_LIMIT_REACHED');
        } else {
          setError(err.response?.data?.error || 'Gagal memuat latihan');
        }
      } finally {
        setLoading(false);
      }
    };
    if (subjectId) fetchData();
  }, [subjectId, topicId, excludeCompleted]);

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
      // retry fetch after verified
      setLoading(true);
      setError(null);
      const params = { subject_id: subjectId, limit: 100, exclude_completed: excludeCompleted ? 'true' : 'false' };
      if (topicId) params.topic_id = topicId;
      const [soalRes, subRes] = await Promise.all([
        soalService.list(params),
        subjectService.list()
      ]);
      const qs = Array.isArray(soalRes.data?.data) ? soalRes.data.data : [];
      setQuestions(qs);
      const subj = (subRes.data?.data || []).find(s => s.id === subjectId);
      setSubjectName(subj?.title || subj?.name || 'Latihan');
      setError(null);
      setShowSocialModal(false);
      setShowPreModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Gagal memuat latihan');
    } finally {
      setLoading(false);
    }
  };

  // scroll listener removed - fixed header style

  const handleOptionSelect = (choiceId) => {
    setAnswers({ ...answers, [currentIndex]: choiceId });
  };

  const toggleFlag = () => {
    setFlagged({ ...flagged, [currentIndex]: !flagged[currentIndex] });
  };

  const handleConfirmFinish = async () => {
    if (submitting) return; // Guard against double-submission
    setSubmitting(true);
    try {
      const res = await activityService.submitLatihan({
        subject_id: subjectId,
        subject_name: subjectName,
        topic_id: topicId,
        questions,
        answers,
      });
      const irtData = res.data?.data || {};
      const sessionId = irtData.sessionId;
      navigate(`/latihan/hasil${sessionId ? `/${sessionId}` : ''}`, {
        state: { questions, answers, subjectName, subjectId, topicId, irtData }
      });
    } catch (err) {
      console.error('Failed to submit latihan:', err);
      toast.error('Gagal menyimpan hasil latihan. Silakan coba lagi.');
      setSubmitting(false);
      return;
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = () => {
    setShowSubmitModal(true);
  };

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];

  // Keyboard shortcuts: A-E for answers, ArrowLeft/ArrowRight for nav, F for flag
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (showSubmitModal) return;

      const key = e.key.toUpperCase();
      const choices = currentQuestion?.choices || [];

      // A-E: select answer by label
      if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
        const match = choices.find(c => (c.label || '').toUpperCase() === key);
        if (match) {
          e.preventDefault();
          handleOptionSelect(match.id);
        }
      }
      // Arrow Right or N: next question
      if (e.key === 'ArrowRight' || key === 'N') {
        e.preventDefault();
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      }
      // Arrow Left or P: previous question
      if (e.key === 'ArrowLeft' || key === 'P') {
        e.preventDefault();
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      }
      // F: toggle flag
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

  if (error === 'FREE_LIMIT_REQUIRE_SOCIAL') {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 border border-[#c2c6d8]/30 shadow-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0050cb]/10 flex items-center justify-center text-[#0050cb]">
            <span className="material-symbols-outlined text-[32px]">favorite</span>
          </div>
          <h2 className="text-2xl font-bold text-[#191b24] mb-2">Verifikasi Sosial Diperlukan</h2>
          <p className="text-sm text-[#424656] mb-6">Follow & repost IG/X sekali saja. Setelah disetujui admin, akses latihan jadi bebas (latihan yang sudah dikerjakan tetap 1x).</p>
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
              onClick={() => navigate('/dashboard')}
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

  if (error === 'FREE_LIMIT_REACHED') {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#c2c6d8]/30 shadow-[0_24px_48px_-12px_rgba(0,80,203,0.08)] text-center animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0050cb, #6366f1)' }}>
            <span className="material-symbols-outlined text-white text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
          </div>
          <h2 className="text-[28px] font-bold text-[#191b24] mb-3 tracking-tight">Akses Latihan Terbatas</h2>
          <p className="text-[15px] text-[#424656] leading-relaxed mb-8">
            Akun Gratis kamu memiliki batas untuk mengerjakan setiap latihan soal sebanyak 1 kali. Upgrade ke <strong className="text-[#0050cb]">Premium</strong> sekarang untuk mengakses ratusan bank soal tanpa batasan!
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
              onClick={() => navigate('/dashboard')}
              className="sm:w-40 py-4 rounded-xl border border-[#c2c6d8] text-[#424656] font-bold text-sm hover:bg-[#e6e7f4]/50 transition-all active:scale-[0.98]"
            >
              Ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#c2c6d8]/30 shadow-lg text-center animate-in zoom-in-95 duration-200" style={{ fontFamily: "'Inter', sans-serif" }}>
          {excludeCompleted ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-[32px]">task_alt</span>
              </div>
              <h2 className="text-xl font-bold text-[#191b24] mb-2">Hebat! Semua Soal Selesai</h2>
              <p className="text-sm text-[#424656] mb-6 leading-relaxed">
                Kamu telah menyelesaikan seluruh bank soal yang tersedia di subtes/topik ini.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setExcludeCompleted(false)}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #0050cb, #3b82f6)' }}
                >
                  Kerjakan Ulang Soal
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full py-3 rounded-xl border border-[#c2c6d8] text-[#424656] font-semibold hover:bg-gray-50 text-sm"
                >
                  Kembali
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-[32px]">quiz</span>
              </div>
              <h2 className="text-xl font-bold text-[#191b24] mb-2">Belum Ada Soal</h2>
              <p className="text-sm text-[#424656] mb-6 leading-relaxed">
                Belum ada soal tersedia untuk subtes ini.
              </p>
              <button
                onClick={() => navigate(-1)}
                className="w-full py-3 bg-[#0050cb] text-white font-bold rounded-xl hover:bg-[#003da6] transition-all text-sm"
              >
                Kembali
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b24] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8ff]/95 backdrop-blur-md border-b border-[#e0e2f0] shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { setPendingExitPath('/dashboard'); setShowExitModal(true); }} className="flex items-center">
              <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 sm:h-9 cursor-pointer" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[#0050cb] bg-[#e8eeff] px-3 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[16px]">school</span>
              Latihan
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {subjectName?.toLowerCase().includes('matematika') && (
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
              title="Navigasi Soal"
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
        {/* Progress Info */}
        <div className="pt-[76px] sm:pt-[84px] pb-4 px-4 sm:px-6 bg-[#faf8ff] border-b border-[#e0e2f0]">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-[17px] font-bold text-[#191b24]">
                  {topicName ? `${subjectName} · ${topicName}` : subjectName}
                </h1>
                <p className="text-[13px] text-[#727687]">
                  Soal {currentIndex + 1} dari {totalQuestions}
                </p>
              </div>
              <div className="text-[13px] font-medium text-[#727687] bg-[#ecedfa] px-3 py-1 rounded-lg">
                {Object.keys(answers).length} / {totalQuestions} soal terjawab
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="min-w-0">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-[12px] text-[#727687] mb-2">
            <span>Soal {currentIndex + 1}</span>
            <span>{totalQuestions} soal</span>
          </div>
          <div className="h-2 bg-[#e0e2f0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0050cb] rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 mb-6 border border-[#e0e2f0] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 rounded-xl bg-[#0050cb] text-white flex items-center justify-center font-bold text-[14px] shadow-sm shadow-[#0050cb]/20">
              {currentIndex + 1}
            </span>
            <span className={`text-[12px] font-medium px-2.5 py-0.5 rounded-md ${
              currentQuestion.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
              currentQuestion.difficulty === 'hard' ? 'bg-red-50 text-red-500' :
              'text-[#727687] bg-[#ecedfa]'
            }`}>
              {currentQuestion.difficulty === 'easy' ? 'Mudah' : currentQuestion.difficulty === 'hard' ? 'Sulit' : 'Sedang'}
            </span>
          </div>
          <MathText className="text-[15px] text-[#191b24] leading-relaxed" text={currentQuestion.content || ''} />
          {currentQuestion.image_url && (
            <div className="mt-4">
              <img className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={currentQuestion.image_url} alt="Soal" />
            </div>
          )}
        </div>

        {/* Answer Options */}
        <div className="flex flex-col gap-3 mb-6">
          {currentQuestion?.question_type === 'short_answer' ? (
            /* Short Answer Input */
            <div className="bg-white rounded-2xl p-5 border border-[#e0e2f0] shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[20px] text-[#0050cb]">edit_note</span>
                <span className="text-[13px] font-semibold text-[#727687]">Ketik jawaban Anda</span>
              </div>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8] focus:border-[#0050cb] focus:ring-2 focus:ring-[#0050cb]/20 outline-none text-[15px] text-[#191b24] placeholder:text-[#c2c6d8] transition-all bg-white"
                placeholder="Tulis jawaban singkat di sini..."
                value={answers[currentIndex] || ''}
                onChange={(e) => handleOptionSelect(e.target.value)}
              />
            </div>
          ) : (
            (currentQuestion?.choices || []).map((choice) => (
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
                }`}>
                  {choice.label}
                </span>
                <MathText className={`text-[14px] leading-relaxed ${answers[currentIndex] === choice.id ? 'font-medium text-[#191b24]' : 'text-[#424656]'}`} text={choice.content || ''} />
              </button>
            ))
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-[#e0e2f0]">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-[#c2c6d8] text-[13px] font-semibold text-[#424656] hover:bg-[#ecedfa] transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>
          <button
            onClick={toggleFlag}
            className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[13px] font-semibold transition-colors ${
              flagged[currentIndex] ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'text-[#727687] hover:bg-[#ecedfa]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] align-middle mr-0 sm:mr-1">{flagged[currentIndex] ? 'bookmark_added' : 'bookmark'}</span>
            <span className="hidden sm:inline">Ragu-ragu</span>
          </button>
          <button
            onClick={() => {
              if (currentIndex < totalQuestions - 1) {
                setCurrentIndex(currentIndex + 1);
              } else {
                handleFinish();
              }
            }}
            className="bg-[#0050cb] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[13px] font-semibold hover:bg-[#003da6] transition-colors flex items-center gap-2 shadow-sm shadow-[#0050cb]/20"
          >
            <span className="hidden sm:inline">{currentIndex < totalQuestions - 1 ? 'Lanjut' : 'Selesai'}</span>
            <span className="material-symbols-outlined text-[18px]">{currentIndex < totalQuestions - 1 ? 'chevron_right' : 'check'}</span>
          </button>
        </div>

        {/* Mobile: open navigator button */}
        <button
          onClick={() => setShowNavDrawer(true)}
          className="lg:hidden mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#c2c6d8] text-[13px] font-semibold text-[#424656] hover:bg-[#ecedfa] transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">grid_view</span>
          Daftar Soal
        </button>
        </div>

          {/* Desktop sidebar */}
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

      {/* Mobile navigator drawer */}
      {showNavDrawer && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-start sm:items-center sm:justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowNavDrawer(false)}
        >
          <div
            className="bg-[#faf8ff] w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-b-2xl sm:rounded-2xl pt-20 sm:pt-4 animate-slide-down shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4">
              <h3 className="font-bold text-[#191b24]">Daftar Soal</h3>
              <button
                onClick={() => setShowNavDrawer(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#ecedfa] flex items-center justify-center text-[#424656]"
              >
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

      {/* Bottom Info */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#faf8ff]/95 backdrop-blur-md border-t border-[#e0e2f0] py-3 px-4 sm:px-6 z-40">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-[13px] text-[#727687]">
          <span className="font-medium">{topicName ? `${subjectName} · ${topicName}` : subjectName}</span>
          <span className="bg-[#ecedfa] px-2.5 py-0.5 rounded-md font-semibold">{Object.keys(answers).length} / {totalQuestions} terjawab</span>
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

export default LatihanPraktik;
