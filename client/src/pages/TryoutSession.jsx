import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { tryoutService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import SubmitConfirmModal from '../components/SubmitConfirmModal';
import QuestionGrid from '../components/tryout/QuestionGrid';
import Calculator from '../components/tryout/Calculator';
import MathText from '../components/MathText';
import ZoomableImage from '../components/ui/ZoomableImage';
import ExitConfirmModal from '../components/ExitConfirmModal';
import PreviewBanner from '../components/layout/PreviewBanner';

const TryoutSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subjectsData, setSubjectsData] = useState([]);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSubjectDoneModal, setShowSubjectDoneModal] = useState(false);
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingExitPath, setPendingExitPath] = useState(null);
  const timerRef = useRef(null);

  // Refs to avoid stale closures in handleSubmit
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const flaggedRef = useRef(flagged);
  flaggedRef.current = flagged;
  const subjectsDataRef = useRef(subjectsData);
  subjectsDataRef.current = subjectsData;

  const currentSubject = subjectsData[currentSubjectIndex];
  const questions = currentSubject?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const totalSubjects = subjectsData.length;
  const totalQuestionsInSubject = questions.length;
  const totalQuestions = subjectsData.reduce((sum, s) => sum + s.questions.length, 0);
  const isUrgent = timeLeft < 300;

  const globalKey = `${currentSubjectIndex}:${currentQuestionIndex}`;

  // localStorage keys for this session
  const LS_ANSWERS = `tryout_answers_${sessionId}`;
  const LS_FLAGGED = `tryout_flagged_${sessionId}`;
  const LS_TIMER = `tryout_timer_${sessionId}`;
  const LS_NAV = `tryout_nav_${sessionId}`;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await tryoutService.getQuestions(sessionId);
        const data = response.data.data || [];
        setSubjectsData(data);

        // Restore saved state from localStorage (survives refresh)
        try {
          const savedAnswers = localStorage.getItem(LS_ANSWERS);
          if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
          const savedFlagged = localStorage.getItem(LS_FLAGGED);
          if (savedFlagged) setFlagged(JSON.parse(savedFlagged));
          
          let savedSubjectIdx = 0;
          let savedQuestionIdx = 0;
          const savedNav = localStorage.getItem(LS_NAV);
          if (savedNav) {
            const nav = JSON.parse(savedNav);
            savedSubjectIdx = nav.subjectIdx || 0;
            savedQuestionIdx = nav.questionIdx || 0;
            setCurrentSubjectIndex(savedSubjectIdx);
            setCurrentQuestionIndex(savedQuestionIdx);
          }
          
          const savedTimer = localStorage.getItem(LS_TIMER);
          if (savedTimer) {
            setTimeLeft(parseInt(savedTimer, 10));
          } else {
            // Calculate remaining time from server started_at if available
            const serverStartedAt = response.data.started_at;
            const serverTime = response.data.server_time || new Date().toISOString();
            const currentSub = data[savedSubjectIdx];
            const dur = currentSub?.duration || 30;
            const durSec = currentSub?.durationSec || 0;
            const totalSeconds = dur * 60 + durSec;
            if (serverStartedAt) {
              const elapsed = Math.floor((new Date(serverTime).getTime() - new Date(serverStartedAt).getTime()) / 1000);
              const remaining = Math.max(totalSeconds - elapsed, 0);
              setTimeLeft(remaining);
            } else {
              setTimeLeft(totalSeconds);
            }
          }
        } catch {
          const serverStartedAt = response.data.started_at;
          const serverTime = response.data.server_time || new Date().toISOString();
          const dur = data[0]?.duration || 30;
          const durSec = data[0]?.durationSec || 0;
          const totalSeconds = dur * 60 + durSec;
          if (serverStartedAt) {
            const elapsed = Math.floor((new Date(serverTime).getTime() - new Date(serverStartedAt).getTime()) / 1000);
            setTimeLeft(Math.max(totalSeconds - elapsed, 0));
          } else {
            setTimeLeft(totalSeconds);
          }
        }
        // Fallback: restore answers from server DB if localStorage was empty
        if (!localStorage.getItem(LS_ANSWERS)) {
          const serverAnswers = {};
          const serverFlagged = {};
          data.forEach((subject, sIdx) => {
            (subject.questions || []).forEach((q, qIdx) => {
              const key = `${sIdx}:${qIdx}`;
              if (q.chosen_choice_id) {
                serverAnswers[key] = q.chosen_choice_id;
              }
              if (q.answer_text) {
                serverAnswers[`${key}_text`] = q.answer_text;
                if (!q.chosen_choice_id) {
                  serverAnswers[key] = q.question_type === 'complex_mc_tf' ? '__complex_mc_tf__' : '__short_answer__';
                }
              }
              if (q.is_flagged) {
                serverFlagged[key] = true;
              }
            });
          });
          if (Object.keys(serverAnswers).length > 0) setAnswers(serverAnswers);
          if (Object.keys(serverFlagged).length > 0) setFlagged(serverFlagged);
        }
      } catch (error) {
        console.error('Failed to fetch questions', error);
        toast.error('Gagal memuat soal tryout');
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchQuestions();
  }, [sessionId]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return; // Guard against double-submission
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      // Build batch payload from latest state via refs (avoids stale closure)
      const currentAnswers = answersRef.current;
      const currentFlagged = flaggedRef.current;
      const currentSubjectsData = subjectsDataRef.current;
      const answerPayload = [];
      currentSubjectsData.forEach((subject, subjectIdx) => {
        (subject.questions || []).forEach((q, qIdx) => {
          const key = `${subjectIdx}:${qIdx}`;
          const choiceId = currentAnswers[key];
          answerPayload.push({
            question_id: q.id,
            chosen_choice_id: (choiceId === '__short_answer__' || choiceId === '__complex_mc_tf__') ? null : (choiceId || null),
            answer_text: currentAnswers[`${key}_text`] || null,
            is_flagged: currentFlagged[key] || false,
            time_spent_sec: 0,
          });
        });
      });

      // Send all answers in one batch request
      if (answerPayload.length > 0) {
        await tryoutService.answerBatch({ session_id: sessionId, answers: answerPayload });
      }

      await tryoutService.submit(sessionId);

      // Clean up tryout localStorage data after successful submit
      try {
        localStorage.removeItem(`tryout_answers_${sessionId}`);
        localStorage.removeItem(`tryout_flagged_${sessionId}`);
        localStorage.removeItem(`tryout_timer_${sessionId}`);
        localStorage.removeItem(`tryout_nav_${sessionId}`);
      } catch {}

      // Check if this session was started from the subtest selection hub
      const returnPackageId = localStorage.getItem(`tryout_return_package_${sessionId}`);
      const currentSubtestName = localStorage.getItem(`tryout_current_subtest_${sessionId}`);

      if (returnPackageId && currentSubtestName) {
        // Mark this subtest as completed
        const key = `tryout_completed_${returnPackageId}`;
        const completed = JSON.parse(localStorage.getItem(key) || '[]');
        if (!completed.includes(currentSubtestName)) {
          completed.push(currentSubtestName);
          localStorage.setItem(key, JSON.stringify(completed));
        }
        // Store session ID for this subtest so we can retrieve results later
        const sessionsKey = `tryout_sessions_${returnPackageId}`;
        const sessions = JSON.parse(localStorage.getItem(sessionsKey) || '{}');
        sessions[currentSubtestName] = sessionId;
        localStorage.setItem(sessionsKey, JSON.stringify(sessions));

        // Clean up
        localStorage.removeItem(`tryout_return_package_${sessionId}`);
        localStorage.removeItem(`tryout_current_subtest_${sessionId}`);

        toast.success(`Subtes "${currentSubtestName}" selesai!`);
        navigate(`/tryout/select/${returnPackageId}`);
      } else {
        toast.success('Tryout berhasil disubmit!');
        navigate(`/tryout/hasil/${sessionId}`);
      }
    } catch (error) {
      toast.error('Gagal mensubmit tryout');
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  }, [sessionId, navigate]);

  // Handle timer expiration (Auto-transition to next subtest or submit)
  const handleTimeExpired = useCallback(() => {
    if (currentSubjectIndex < totalSubjects - 1) {
      const nextIdx = currentSubjectIndex + 1;
      const nextSubject = subjectsData[nextIdx];
      const nextDuration = (nextSubject?.duration || 30) * 60 + (nextSubject?.durationSec || 0);
      
      toast.error(`Waktu untuk subtes "${currentSubject?.name || 'Subtes'}" telah habis! Melanjutkan ke subtes berikutnya...`, { duration: 4000 });
      
      setCurrentSubjectIndex(nextIdx);
      setCurrentQuestionIndex(0);
      setTimeLeft(nextDuration);
      
      localStorage.setItem(LS_TIMER, String(nextDuration));
      localStorage.setItem(LS_NAV, JSON.stringify({ subjectIdx: nextIdx, questionIdx: 0 }));
    } else {
      toast.error('Waktu tryout telah habis! Menyimpan jawaban...', { duration: 4000 });
      handleSubmit();
    }
  }, [currentSubjectIndex, totalSubjects, subjectsData, currentSubject, LS_TIMER, LS_NAV, handleSubmit]);

  // Timer
  useEffect(() => {
    if (loading || subjectsData.length === 0) return;

    if (timeLeft <= 0) {
      handleTimeExpired();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        // Save to localStorage
        localStorage.setItem(LS_TIMER, String(next));
        return next;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, loading, subjectsData.length, handleTimeExpired]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (choiceId) => {
    if (!currentQuestion) return;
    // Save locally only — no API call per click, batch sent on submit
    setAnswers(prev => {
      const next = { ...prev, [globalKey]: choiceId };
      try { localStorage.setItem(LS_ANSWERS, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const toggleFlag = () => {
    if (!currentQuestion) return;
    const newFlagStatus = !flagged[globalKey];
    setFlagged(prev => {
      const next = { ...prev, [globalKey]: newFlagStatus };
      try { localStorage.setItem(LS_FLAGGED, JSON.stringify(next)); } catch {}
      return next;
    });
  };

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

  // Keyboard shortcuts: A-E for answers, ArrowLeft/ArrowRight for nav, F for flag
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input/textarea or modal is open
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (showSubmitModal || showSubjectDoneModal) return;

      const key = e.key.toUpperCase();
      const choices = currentQuestion?.choices || [];

      // A-E: select answer by label
      if (['A', 'B', 'C', 'D', 'E'].includes(key)) {
        const match = choices.find(c => (c.label || '').toUpperCase() === key);
        if (match) {
          e.preventDefault();
          handleAnswerSelect(match.id);
        }
      }
      // Arrow Right or N: next question
      if (e.key === 'ArrowRight' || key === 'N') {
        e.preventDefault();
        goToNextQuestion();
      }
      // Arrow Left or P: previous question
      if (e.key === 'ArrowLeft' || key === 'P') {
        e.preventDefault();
        goToPrevQuestion();
      }
      // F: toggle flag
      if (key === 'F') {
        e.preventDefault();
        toggleFlag();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, showSubmitModal, showSubjectDoneModal, currentQuestionIndex, currentSubjectIndex]);

  // Persist navigation position to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_NAV, JSON.stringify({ subjectIdx: currentSubjectIndex, questionIdx: currentQuestionIndex }));
    } catch {}
  }, [currentSubjectIndex, currentQuestionIndex]);

  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestionsInSubject - 1) {
      // Lanjut ke soal berikutnya di subtes yang sama
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSubjectIndex < totalSubjects - 1) {
      // Sudah selesai semua soal di subtes ini, tanya apakah mau lanjut
      setShowSubjectDoneModal(true);
    } else {
      // Semua subtes selesai
      setShowSubmitModal(true);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
    // Tidak bisa mundur ke subtes sebelumnya
  };

  const handleStartNextSubject = () => {
    setShowSubjectDoneModal(false);
    const nextIdx = currentSubjectIndex + 1;
    const nextSubject = subjectsData[nextIdx];
    const nextDuration = (nextSubject?.duration || 30) * 60 + (nextSubject?.durationSec || 0);
    
    setCurrentSubjectIndex(nextIdx);
    setCurrentQuestionIndex(0);
    setTimeLeft(nextDuration);
    
    localStorage.setItem(LS_TIMER, String(nextDuration));
    localStorage.setItem(LS_NAV, JSON.stringify({ subjectIdx: nextIdx, questionIdx: 0 }));
    toast.success(`Memulai subtes baru: "${nextSubject?.name || 'Subtes'}"`);
  };

  const handleFinishLastSubject = () => {
    setShowSubjectDoneModal(false);
    setShowSubmitModal(true);
  };

  const totalAnswered = Object.keys(answers).filter(k => !k.endsWith('_text')).length;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestionInSubject = currentQuestionIndex === totalQuestionsInSubject - 1;
  const isLastSubject = currentSubjectIndex === totalSubjects - 1;

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

  if (subjectsData.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] block mb-4">quiz</span>
          <h2 className="text-[22px] font-bold text-[#191b24] mb-2">Tidak Ada Soal</h2>
          <p className="text-[#424656] mb-6 text-[15px]">Soal tryout tidak ditemukan untuk sesi ini.</p>
          <button onClick={() => navigate('/tryout/packages')} className="px-8 py-3 bg-[#0050cb] text-white font-bold rounded-xl hover:bg-[#003da6] transition-all">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b24] flex flex-col">
      <PreviewBanner />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8ff]/95 backdrop-blur-md border-b border-[#e0e2f0] shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { setPendingExitPath('/dashboard'); setShowExitModal(true); }} className="flex items-center">
              <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 sm:h-9 cursor-pointer" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[#0050cb] bg-[#e8eeff] px-3 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              Tryout
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {currentSubject?.name?.toLowerCase().includes('matematika') && (
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
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-[13px] sm:text-[14px] ${isUrgent ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-[#ecedfa] text-[#424656]'}`}>
              <span className="material-symbols-outlined text-[18px]">timer</span>
              <span className="tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Info */}
      <div className="pt-[76px] sm:pt-[84px] pb-4 px-4 sm:px-6 bg-[#faf8ff] border-b border-[#e0e2f0]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-[17px] font-bold text-[#191b24]">{currentSubject?.name}</h1>
              <p className="text-[13px] text-[#727687]">
                Subtes {currentSubjectIndex + 1} dari {totalSubjects} • Soal {currentQuestionIndex + 1} dari {totalQuestionsInSubject}
              </p>
            </div>
            <div className="text-[13px] font-medium text-[#727687] bg-[#ecedfa] px-3 py-1 rounded-lg">
              {totalAnswered} / {totalQuestions} soal terjawab
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow w-full pb-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="min-w-0">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-[12px] text-[#727687] mb-2">
            <span>Soal {currentQuestionIndex + 1}</span>
            <span>{totalQuestionsInSubject} soal</span>
          </div>
          <div className="h-2 bg-[#e0e2f0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0050cb] rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestionsInSubject) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 mb-6 border border-[#e0e2f0] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-9 h-9 rounded-xl bg-[#0050cb] text-white flex items-center justify-center font-bold text-[14px] shadow-sm shadow-[#0050cb]/20">
              {currentQuestionIndex + 1}
            </span>
            <span className="text-[12px] font-medium text-[#727687] bg-[#ecedfa] px-2.5 py-0.5 rounded-md">{currentQuestion?.difficulty || 'medium'}</span>
          </div>
          {/* TOP IMAGE */}
          {currentQuestion?.image_url && ['top', 'before', 'atas'].includes(currentQuestion.image_position) && (
            <div className="mb-4">
              <ZoomableImage className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={currentQuestion.image_url} alt="Soal" />
            </div>
          )}
          {/* STIMULUS */}
          {currentQuestion?.stimulus && (
            <div className="mb-4 text-[15px] text-[#191b24] leading-relaxed whitespace-pre-wrap">
              <MathText text={currentQuestion.stimulus} />
            </div>
          )}
          {/* MIDDLE IMAGE */}
          {currentQuestion?.image_url && ['middle', 'ditengah', 'tengah'].includes(currentQuestion.image_position) && (
            <div className="mb-4">
              <ZoomableImage className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={currentQuestion.image_url} alt="Soal" />
            </div>
          )}
          <MathText className="text-[15px] text-[#191b24] leading-relaxed" text={currentQuestion?.content || ''} />
          {/* BOTTOM IMAGE */}
          {currentQuestion?.image_url && !['top', 'before', 'atas', 'middle', 'ditengah', 'tengah'].includes(currentQuestion.image_position) && (
            <div className="mt-4">
              <ZoomableImage className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={currentQuestion.image_url} alt="Soal" />
            </div>
          )}
        </div>

        {/* Answer Options */}
        <div className="flex flex-col gap-3 mb-6">
          {currentQuestion?.question_type === 'complex_mc_tf' ? (
            /* Complex MC True/False */
            <div className="bg-white rounded-2xl p-5 border border-[#e0e2f0] shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[20px] text-[#0050cb]">fact_check</span>
                <span className="text-[13px] font-semibold text-[#727687]">Tentukan Benar atau Salah untuk setiap pernyataan</span>
              </div>
              <div className="space-y-3">
                {(currentQuestion?.choices || []).map((choice) => {
                  let studentAnswer = null;
                  try {
                    const textKey = `${globalKey}_text`;
                    const parsed = answers[textKey] ? (typeof answers[textKey] === 'string' ? JSON.parse(answers[textKey]) : answers[textKey]) : {};
                    studentAnswer = parsed[choice.label];
                  } catch(e) {}
                  return (
                    <div key={choice.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-[#e0e2f0] bg-[#faf8ff]">
                      <div className="flex-1 min-w-0">
                        <MathText className="text-[14px] text-[#191b24] leading-relaxed" text={choice.content || ''} />
                      </div>
                      <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
                        <button
                          onClick={() => {
                            const textKey = `${globalKey}_text`;
                            const current = answers[textKey] ? (typeof answers[textKey] === 'string' ? JSON.parse(answers[textKey]) : answers[textKey]) : {};
                            const updated = { ...current, [choice.label]: true };
                            const jsonStr = JSON.stringify(updated);
                            setAnswers(prev => {
                              const next = { ...prev, [textKey]: jsonStr };
                              const allAnswered = (currentQuestion?.choices || []).every(c => updated[c.label] !== undefined);
                              if (allAnswered) { next[globalKey] = '__complex_mc_tf__'; } else { delete next[globalKey]; }
                              try { localStorage.setItem(LS_ANSWERS, JSON.stringify(next)); } catch {}
                              return next;
                            });
                          }}
                          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center gap-1.5 ${studentAnswer === true ? 'bg-[#0050cb] text-white shadow-sm shadow-[#0050cb]/20' : 'bg-[#ecedfa] text-[#424656] hover:bg-[#dae1ff]'}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{studentAnswer === true ? 'check_circle' : 'circle'}</span>
                          Benar
                        </button>
                        <button
                          onClick={() => {
                            const textKey = `${globalKey}_text`;
                            const current = answers[textKey] ? (typeof answers[textKey] === 'string' ? JSON.parse(answers[textKey]) : answers[textKey]) : {};
                            const updated = { ...current, [choice.label]: false };
                            const jsonStr = JSON.stringify(updated);
                            setAnswers(prev => {
                              const next = { ...prev, [textKey]: jsonStr };
                              const allAnswered = (currentQuestion?.choices || []).every(c => updated[c.label] !== undefined);
                              if (allAnswered) { next[globalKey] = '__complex_mc_tf__'; } else { delete next[globalKey]; }
                              try { localStorage.setItem(LS_ANSWERS, JSON.stringify(next)); } catch {}
                              return next;
                            });
                          }}
                          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all flex items-center gap-1.5 ${studentAnswer === false ? 'bg-[#ba1a1a] text-white shadow-sm shadow-[#ba1a1a]/20' : 'bg-[#ecedfa] text-[#424656] hover:bg-[#ffdad6]'}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{studentAnswer === false ? 'cancel' : 'circle'}</span>
                          Salah
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : currentQuestion?.question_type === 'short_answer' ? (
            /* Short Answer Input */
            <div className="bg-white rounded-2xl p-5 border-2 border-[#e0e2f0]">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[20px] text-[#0050cb]">edit_note</span>
                <span className="text-[13px] font-semibold text-[#727687]">Ketik jawaban Anda</span>
              </div>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#e0e2f0] focus:border-[#0050cb] focus:ring-2 focus:ring-[#0050cb]/20 outline-none text-[15px] text-[#191b24] placeholder:text-[#c2c6d8] transition-all"
                placeholder="Tulis jawaban singkat di sini..."
                value={answers[`${globalKey}_text`] || ''}
                onChange={(e) => {
                  const text = e.target.value;
                  setAnswers(prev => {
                    const next = { ...prev, [`${globalKey}_text`]: text };
                    // Also set a truthy value for the main key so it counts as answered
                    if (text.trim()) {
                      next[globalKey] = '__short_answer__';
                    } else {
                      delete next[globalKey];
                    }
                    try { localStorage.setItem(LS_ANSWERS, JSON.stringify(next)); } catch {}
                    return next;
                  });
                }}
              />
            </div>
          ) : (
            (currentQuestion?.choices || []).map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleAnswerSelect(choice.id)}
              className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                answers[globalKey] === choice.id
                ? 'bg-[#e8eeff] border-[#0050cb] shadow-sm shadow-[#0050cb]/10'
                : 'bg-white border-[#e0e2f0] hover:border-[#a8b4d9] hover:shadow-sm'
              }`}
            >
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold shrink-0 transition-all ${
                answers[globalKey] === choice.id
                ? 'bg-[#0050cb] text-white shadow-sm shadow-[#0050cb]/20'
                : 'bg-[#ecedfa] text-[#424656] group-hover:bg-[#dae1ff]'
              }`}>
                {choice.label}
              </span>
              <MathText className={`text-[14px] leading-relaxed ${answers[globalKey] === choice.id ? 'font-medium text-[#191b24]' : 'text-[#424656]'}`} text={choice.content || ''} />
            </button>
            ))
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#e0e2f0]">
          <button
            onClick={goToPrevQuestion}
            disabled={isFirstQuestion}
            className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-3 rounded-xl border border-[#c2c6d8] text-[13px] font-semibold text-[#424656] hover:bg-[#ecedfa] transition-colors disabled:opacity-35 disabled:cursor-not-allowed min-w-0"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            <span className="hidden sm:inline">Sebelumnya</span>
          </button>
          <button
            onClick={toggleFlag}
            className={`px-3 sm:px-4 py-3 rounded-xl text-[13px] font-semibold transition-colors flex items-center justify-center gap-1 min-w-0 ${
              flagged[globalKey] ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'text-[#727687] hover:bg-[#ecedfa] border border-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{flagged[globalKey] ? 'bookmark_added' : 'bookmark'}</span>
            <span className="hidden sm:inline">Ragu-ragu</span>
            <span className="sm:hidden">Ragu</span>
          </button>
          <button
            onClick={goToNextQuestion}
            className="bg-[#0050cb] text-white px-4 sm:px-6 py-3 rounded-xl text-[13px] font-semibold hover:bg-[#003da6] transition-colors flex items-center justify-center gap-1 sm:gap-2 shadow-sm shadow-[#0050cb]/20 min-w-0"
          >
            <span className="truncate">{isLastQuestionInSubject && isLastSubject ? 'Selesai' : isLastQuestionInSubject ? 'Lanjut Subtes' : 'Lanjut'}</span>
            <span className="material-symbols-outlined text-[18px]">
              {isLastQuestionInSubject ? (isLastSubject ? 'check' : 'east') : 'chevron_right'}
            </span>
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
            currentSubject={currentSubject?.name}
            currentIndex={currentQuestionIndex}
            answers={Object.fromEntries(
              Object.entries(answers)
                .filter(([k]) => k.startsWith(`${currentSubjectIndex}:`) && !k.endsWith('_text'))
                .map(([k, v]) => [Number(k.split(':')[1]), v])
            )}
            flagged={Object.fromEntries(
              Object.entries(flagged)
                .filter(([k, v]) => v && k.startsWith(`${currentSubjectIndex}:`))
                .map(([k, v]) => [Number(k.split(':')[1]), v])
            )}
            onNavigate={(idx) => setCurrentQuestionIndex(idx)}
            onSubmit={() => setShowSubmitModal(true)}
            totalAnswered={Object.keys(answers).filter(k => k.startsWith(`${currentSubjectIndex}:`) && !k.endsWith('_text')).length}
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
                currentSubject={currentSubject?.name}
                currentIndex={currentQuestionIndex}
                answers={Object.fromEntries(
                  Object.entries(answers)
                    .filter(([k]) => k.startsWith(`${currentSubjectIndex}:`) && !k.endsWith('_text'))
                    .map(([k, v]) => [Number(k.split(':')[1]), v])
                )}
                flagged={Object.fromEntries(
                  Object.entries(flagged)
                    .filter(([k, v]) => v && k.startsWith(`${currentSubjectIndex}:`))
                    .map(([k, v]) => [Number(k.split(':')[1]), v])
                )}
                onNavigate={(idx) => { setCurrentQuestionIndex(idx); setShowNavDrawer(false); }}
                onSubmit={() => { setShowNavDrawer(false); setShowSubmitModal(true); }}
                totalAnswered={Object.keys(answers).filter(k => k.startsWith(`${currentSubjectIndex}:`) && !k.endsWith('_text')).length}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Info */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#faf8ff]/95 backdrop-blur-md border-t border-[#e0e2f0] py-2.5 sm:py-3 px-4 sm:px-6 z-40">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-[12px] sm:text-[13px] text-[#727687]">
          <span className="font-medium truncate mr-2">{currentSubject?.name}</span>
          <span className="bg-[#ecedfa] px-2.5 py-0.5 rounded-md font-semibold whitespace-nowrap">{Object.keys(answers).filter(k => k.startsWith(`${currentSubjectIndex}:`) && !k.endsWith('_text')).length} / {totalQuestionsInSubject} terjawab</span>
        </div>
      </div>

      {/* Subtes Selesai Modal */}
      {showSubjectDoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl border border-[#e0e2f0]">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 mx-auto mb-4 flex items-center justify-center">
                <span className="material-symbols-outlined text-[32px] text-emerald-500">check_circle</span>
              </div>
              <h3 className="text-[20px] font-bold text-[#191b24] mb-2">Subtes Selesai!</h3>
              <p className="text-[#727687] text-[14px]">
                Kamu telah menyelesaikan <strong className="text-[#191b24]">{currentSubject?.name}</strong>.
              </p>
            </div>
            <div className="space-y-3">
              {currentSubjectIndex < totalSubjects - 1 ? (
                <>
                  <p className="text-center text-[14px] text-[#727687] mb-2">
                    Lanjut ke: <strong className="text-[#191b24]">{subjectsData[currentSubjectIndex + 1]?.name}</strong>
                  </p>
                  <button
                    onClick={handleStartNextSubject}
                    className="w-full py-3 bg-[#0050cb] text-white font-semibold rounded-xl hover:bg-[#003da6] transition-colors shadow-sm shadow-[#0050cb]/20"
                  >
                    Lanjut ke Subtes {currentSubjectIndex + 2}
                  </button>
                  <button
                    onClick={handleFinishLastSubject}
                    className="w-full py-3 border border-[#c2c6d8] text-[#424656] font-semibold rounded-xl hover:bg-[#ecedfa] transition-colors"
                  >
                    Akhiri Tryout
                  </button>
                </>
              ) : (
                <>
                  <p className="text-center text-[14px] text-[#727687] mb-2">
                    Semua subtes sudah selesai!
                  </p>
                  <button
                    onClick={handleFinishLastSubject}
                    className="w-full py-3 bg-[#0050cb] text-white font-semibold rounded-xl hover:bg-[#003da6] transition-colors shadow-sm shadow-[#0050cb]/20"
                  >
                    Submit Tryout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <SubmitConfirmModal
        open={showSubmitModal}
        onClose={() => !submitting && setShowSubmitModal(false)}
        onConfirm={handleSubmit}
        loading={submitting}
        title="Sudah Yakin dengan Jawabanmu?"
        answered={totalAnswered}
        total={totalQuestions}
        confirmLabel={localStorage.getItem(`tryout_return_package_${sessionId}`) ? 'Kirim Jawaban' : 'Ya, Selesaikan'}
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

export default TryoutSession;