import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ujianMandiriService } from '../services/api';
import toast from 'react-hot-toast';
import SubmitConfirmModal from '../components/SubmitConfirmModal';
import QuestionGrid from '../components/tryout/QuestionGrid';
import Calculator from '../components/tryout/Calculator';
import MathText from '../components/MathText';
import ZoomableImage from '../components/ui/ZoomableImage';
import ExitConfirmModal from '../components/ExitConfirmModal';

const TryoutSessionUM = () => {
  const { ujianId, tryoutId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [packageInfo, setPackageInfo] = useState(null);
  const [ujianName, setUjianName] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});     // { questionIndex: choiceId }
  const [flagged, setFlagged] = useState({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingExitPath, setPendingExitPath] = useState(null);
  const timerRef = useRef(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const questionsRef = useRef(questions);
  questionsRef.current = questions;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const flaggedRef = useRef(flagged);
  flaggedRef.current = flagged;
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;

  // LocalStorage keys (keyed by tryoutId so we can resume)
  const LS_SESSION = `tryout_um_session_${tryoutId}`;
  const LS_ANSWERS = `tryout_um_answers_${tryoutId}`;
  const LS_FLAGGED = `tryout_um_flagged_${tryoutId}`;
  const LS_TIMER = `tryout_um_timer_${tryoutId}`;
  const LS_NAV = `tryout_um_nav_${tryoutId}`;

  // ── Initialize: Start or Resume Session ──
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      try {
        let currentSessionId = null;
        let isResuming = false;

        // 1. Check localStorage for an existing session
        const savedSession = localStorage.getItem(LS_SESSION);
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            currentSessionId = parsed.sessionId;
            isResuming = true;
          } catch { /* corrupted, start fresh */ }
        }

        // 2. If no existing session, start a new one via backend
        if (!currentSessionId) {
          const startRes = await ujianMandiriService.startTryout(tryoutId);
          currentSessionId = startRes.data.data.session_id;
          const duration = startRes.data.data.duration || 60;
          const wasResumed = startRes.data.data.resumed === true;

          // Save session info to localStorage
          localStorage.setItem(LS_SESSION, JSON.stringify({
            sessionId: currentSessionId,
            tryoutId,
            ujianId,
            startedAt: new Date().toISOString()
          }));

          // If backend resumed an existing session, treat it as resuming
          if (wasResumed) {
            isResuming = true;
          } else {
            // Set initial timer only for truly new sessions
            setTimeLeft(duration * 60);
            localStorage.setItem(LS_TIMER, String(duration * 60));
          }
        }

        setSessionId(currentSessionId);

        // 3. Single-fetch: Get ALL questions for this session
        const qRes = await ujianMandiriService.getTryoutSessionQuestions(currentSessionId);
        const fetchedQuestions = qRes.data.data || [];
        const pkg = qRes.data.package || {};
        
        setQuestions(fetchedQuestions);
        setPackageInfo(pkg);

        // Fetch ujian name for display
        try {
          const ujianRes = await ujianMandiriService.getById(ujianId);
          setUjianName(ujianRes.data.data?.nama_ujian || 'Ujian Mandiri');
        } catch {
          setUjianName('Ujian Mandiri');
        }

        // 4. Restore saved state from localStorage (if resuming)
        if (isResuming) {
          try {
            const savedAnswers = localStorage.getItem(LS_ANSWERS);
            if (savedAnswers) {
              setAnswers(JSON.parse(savedAnswers));
            } else {
              // Fallback: restore answers from server DB if localStorage was empty
              const serverAnswers = {};
              const serverFlagged = {};
              fetchedQuestions.forEach((q, idx) => {
                if (q.chosen_choice_id) {
                  serverAnswers[idx] = q.chosen_choice_id;
                }
                if (q.is_flagged) {
                  serverFlagged[idx] = true;
                }
              });
              if (Object.keys(serverAnswers).length > 0) setAnswers(serverAnswers);
              if (Object.keys(serverFlagged).length > 0) setFlagged(serverFlagged);
            }

            const savedFlagged = localStorage.getItem(LS_FLAGGED);
            if (savedFlagged) setFlagged(JSON.parse(savedFlagged));

            const savedNav = localStorage.getItem(LS_NAV);
            if (savedNav) {
              const nav = JSON.parse(savedNav);
              const restoredIdx = nav.questionIdx || 0;
              if (restoredIdx >= 0 && restoredIdx < fetchedQuestions.length) {
                setCurrentIndex(restoredIdx);
              } else {
                setCurrentIndex(0);
              }
            }

            const savedTimer = localStorage.getItem(LS_TIMER);
            if (savedTimer) {
              const remaining = parseInt(savedTimer, 10);
              if (remaining > 0) {
                setTimeLeft(remaining);
              } else {
                // Time already expired, auto-submit
                setTimeLeft(0);
              }
            } else {
              // Calculate remaining time from server started_at
              const serverStartedAt = pkg.started_at;
              const totalSeconds = (pkg.duration || 60) * 60;
              if (serverStartedAt) {
                const elapsed = Math.floor((Date.now() - new Date(serverStartedAt).getTime()) / 1000);
                setTimeLeft(Math.max(totalSeconds - elapsed, 0));
              } else {
                setTimeLeft(totalSeconds);
              }
            }
          } catch {
            // Calculate remaining time from server started_at on error
            const serverStartedAt = pkg.started_at;
            const totalSeconds = (pkg.duration || 60) * 60;
            if (serverStartedAt) {
              const elapsed = Math.floor((Date.now() - new Date(serverStartedAt).getTime()) / 1000);
              setTimeLeft(Math.max(totalSeconds - elapsed, 0));
            } else {
              setTimeLeft(totalSeconds);
            }
          }
        } else {
          // New session — timer was already set above
          // Nothing else to restore
        }

        if (fetchedQuestions.length === 0) {
          toast.error('Belum ada soal untuk tryout ini.');
          navigate(`/ujian-mandiri/${ujianId}`);
          return;
        }
      } catch (err) {
        console.error('Failed to initialize UM tryout session:', err);
        const errMsg = err.response?.data?.error || err.message || 'Gagal memulai sesi tryout';
        toast.error(errMsg);
        // Clear all session-related localStorage keys on failure to avoid infinite reload loop
        localStorage.removeItem(LS_SESSION);
        localStorage.removeItem(LS_ANSWERS);
        localStorage.removeItem(LS_FLAGGED);
        localStorage.removeItem(LS_TIMER);
        localStorage.removeItem(LS_NAV);
        navigate(`/ujian-mandiri/${ujianId}`);
      } finally {
        setLoading(false);
      }
    };

    if (ujianId && tryoutId) initSession();
  }, [ujianId, tryoutId, navigate]);

  // ── Timer Countdown ──
  useEffect(() => {
    if (loading || questions.length === 0) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        localStorage.setItem(LS_TIMER, String(next));
        return next;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, loading, questions.length]);

  // ── Autosave answers to localStorage ──
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(LS_ANSWERS, JSON.stringify(answers));
    }
  }, [answers]);

  useEffect(() => {
    localStorage.setItem(LS_FLAGGED, JSON.stringify(flagged));
  }, [flagged]);

  useEffect(() => {
    localStorage.setItem(LS_NAV, JSON.stringify({ questionIdx: currentIndex }));
  }, [currentIndex]);

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

  // ── Submit: Bulk submit to backend, then navigate to result ──
  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    const currentAnswers = answersRef.current;
    const currentQuestions = questionsRef.current;
    const currentSessionId = sessionIdRef.current;
    const currentFlagged = flaggedRef.current;

    try {
      // Build bulk answers payload
      const answersPayload = currentQuestions.map((q, idx) => ({
        questionId: q.id,
        choiceId: currentAnswers[idx] || null,
        flagged: !!currentFlagged[idx],
        timeSpent: 0
      }));

      await ujianMandiriService.submitTryoutBulk({
        sessionId: currentSessionId,
        answers: answersPayload
      });

      // Clear localStorage after successful submission
      localStorage.removeItem(LS_SESSION);
      localStorage.removeItem(LS_ANSWERS);
      localStorage.removeItem(LS_FLAGGED);
      localStorage.removeItem(LS_TIMER);
      localStorage.removeItem(LS_NAV);

      toast.success('Jawaban berhasil dikumpulkan!');
      navigate(`/ujian-mandiri/${ujianId}/tryout/${tryoutId}/hasil/${currentSessionId}`);
    } catch (err) {
      console.error('Failed to submit UM tryout:', err);
      toast.error('Gagal mengumpulkan jawaban. Silakan coba lagi.');
      setSubmitting(false);
    }
  }, [submitting, ujianId, tryoutId, navigate]);

  const handleOptionSelect = (choiceId) => {
    setAnswers({ ...answers, [currentIndex]: choiceId });
  };

  const toggleFlag = () => {
    setFlagged({ ...flagged, [currentIndex]: !flagged[currentIndex] });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const isUrgent = timeLeft < 300;

  // ── Keyboard Shortcuts ──
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
        if (currentIndex < totalQuestions - 1) setCurrentIndex(currentIndex + 1);
      }
      if (e.key === 'ArrowLeft' || key === 'P') {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
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
          <p className="mt-5 text-[#424656] font-medium text-[15px]">Memuat soal tryout...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] block mb-4">quiz</span>
          <h2 className="text-[22px] font-bold text-[#191b24] mb-2">Belum Ada Soal</h2>
          <p className="text-[#424656] mb-6 text-[15px]">Belum ada soal tersedia untuk tryout ini.</p>
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

  const subjectName = packageInfo?.title || 'Tryout';
  const showCalc = subjectName?.toLowerCase().includes('matematika') || subjectName?.toLowerCase().includes('kuantitatif');

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b24] flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8ff]/95 backdrop-blur-md border-b border-[#e0e2f0] shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { setPendingExitPath('/dashboard'); setShowExitModal(true); }} className="flex items-center">
              <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 sm:h-9 cursor-pointer" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[#0050cb] bg-[#e8eeff] px-3 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[16px]">school</span>
              {ujianName || 'Ujian Mandiri'}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[14px] ${
              isUrgent ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-[#e8eeff] text-[#0050cb]'
            }`}>
              <span className="material-symbols-outlined text-[18px]">timer</span>
              {formatTime(timeLeft)}
            </div>
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
                <span className={`text-[12px] font-medium px-2.5 py-0.5 rounded-md ${
                  currentQuestion.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
                  currentQuestion.difficulty === 'hard' ? 'bg-red-50 text-red-500' : 'text-[#727687] bg-[#ecedfa]'
                }`}>
                  {currentQuestion.difficulty === 'easy' ? 'Mudah' : currentQuestion.difficulty === 'hard' ? 'Sulit' : 'Sedang'}
                </span>
              </div>
              {currentQuestion.image_url && currentQuestion.image_position === 'before' && (
                <div className="mb-4">
                  <ZoomableImage className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={currentQuestion.image_url} alt="Soal" />
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
                    setShowSubmitModal(true);
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
              onSubmit={() => setShowSubmitModal(true)}
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
                onSubmit={() => { setShowNavDrawer(false); setShowSubmitModal(true); }}
                totalAnswered={Object.keys(answers).length}
              />
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-[#faf8ff]/95 backdrop-blur-md border-t border-[#e0e2f0] py-2.5 sm:py-3 px-4 sm:px-6 z-40">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-[12px] sm:text-[13px] text-[#727687]">
          <span className="font-medium truncate mr-2">{subjectName}</span>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="bg-[#ecedfa] px-2.5 py-0.5 rounded-md font-semibold whitespace-nowrap">{Object.keys(answers).length} / {totalQuestions} terjawab</span>
            <span className={`px-2.5 py-0.5 rounded-md font-semibold whitespace-nowrap ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-[#ecedfa]'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      <SubmitConfirmModal
        open={showSubmitModal}
        onClose={() => !submitting && setShowSubmitModal(false)}
        onConfirm={handleSubmit}
        loading={submitting}
        title="Kumpulkan Jawaban?"
        answered={Object.keys(answers).length}
        total={totalQuestions}
      />
      {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}

      <ExitConfirmModal
        open={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => { setShowExitModal(false); navigate(pendingExitPath || '/dashboard'); }}
        title="Yakin ingin keluar dari tryout?"
        message="Tryout dapat dilanjutkan kembali nanti."
      />
    </div>
  );
};

export default TryoutSessionUM;
