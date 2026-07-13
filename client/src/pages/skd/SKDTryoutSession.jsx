import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { skdService } from '../../services/api';
import toast from 'react-hot-toast';

const SUBJECT_COLOR = {
  TWK: { primary: '#e65100', light: '#fff3e0', label: 'TWK' },
  TIU: { primary: '#1565c0', light: '#e3f2fd', label: 'TIU' },
  TKP: { primary: '#2e7d32', light: '#e8f5e9', label: 'TKP' },
};

export default function SKDTryoutSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessionData, setSessionData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showNav, setShowNav] = useState(false);

  // Timer per subtes
  const [timeRemaining, setTimeRemaining] = useState({});
  const [currentSubtes, setCurrentSubtes] = useState(null);
  const timerRef = useRef(null);
  const startTimesRef = useRef({});
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    loadSession();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionId]);

  async function loadSession() {
    try {
      const res = await skdService.getSessionQuestions(sessionId);
      const data = res.data?.data;
      if (!data) throw new Error('Sesi tidak ditemukan');
      setSessionData(data.session);
      setQuestions(data.questions || []);

      // Initialize time from subject config
      const subjectConfig = data.subjectConfig || [];
      const initialTime = {};
      subjectConfig.forEach((sc) => {
        initialTime[sc.name] = (sc.durationMinutes || 35) * 60;
      });
      setTimeRemaining(initialTime);

      // Set current subtes
      if (data.questions.length > 0) {
        setCurrentSubtes(data.questions[0].subject_name);
      }

      // Restore existing answers
      const existingAnswers = {};
      const existingFlags = {};
      (data.questions || []).forEach((q) => {
        if (q.existingAnswer?.chosen_choice_id) {
          existingAnswers[q.id] = q.existingAnswer.chosen_choice_id;
        }
        if (q.existingAnswer?.is_flagged) {
          existingFlags[q.id] = true;
        }
      });
      setAnswers(existingAnswers);
      setFlagged(existingFlags);
    } catch (err) {
      toast.error('Gagal memuat sesi tryout');
      navigate('/skd');
    } finally {
      setLoading(false);
    }
  }

  // Timer logic
  useEffect(() => {
    if (!currentSubtes || Object.keys(timeRemaining).length === 0) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const updated = { ...prev };
        if ((updated[currentSubtes] || 0) <= 1) {
          // Time up for this subtes — move to next or submit
          clearInterval(timerRef.current);
          handleSubtesTimeUp();
          return prev;
        }
        updated[currentSubtes] = (updated[currentSubtes] || 0) - 1;
        return updated;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentSubtes]);

  function handleSubtesTimeUp() {
    const subtesNames = [...new Set(questions.map((q) => q.subject_name))];
    const currentSubtesIdx = subtesNames.indexOf(currentSubtes);
    if (currentSubtesIdx < subtesNames.length - 1) {
      const nextSubtes = subtesNames[currentSubtesIdx + 1];
      toast('Waktu subtes habis. Lanjut ke ' + nextSubtes, { icon: '⏰' });
      setCurrentSubtes(nextSubtes);
      const nextSubtesFirstIdx = questions.findIndex((q) => q.subject_name === nextSubtes);
      if (nextSubtesFirstIdx >= 0) setCurrentIdx(nextSubtesFirstIdx);
    } else {
      toast('Waktu habis! Jawaban otomatis dikumpulkan.', { icon: '⏰' });
      handleSubmit(true);
    }
  }

  const currentQuestion = questions[currentIdx];
  const currentSubtesForQuestion = currentQuestion?.subject_name;

  // Update currentSubtes when navigating questions
  useEffect(() => {
    if (currentQuestion && currentQuestion.subject_name !== currentSubtes) {
      setCurrentSubtes(currentQuestion.subject_name);
    }
  }, [currentIdx]);

  function formatTime(seconds) {
    if (!seconds || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function handleAnswer(questionId, choiceId) {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
    // Auto-save
    const q = questions.find((q) => q.id === questionId);
    skdService.saveAnswer({
      session_id: sessionId,
      question_id: questionId,
      chosen_choice_id: choiceId,
      is_flagged: flagged[questionId] || false,
      time_spent_sec: Math.round((Date.now() - questionStartRef.current) / 1000),
      position: q?.position || 0,
    }).catch(() => {});
    questionStartRef.current = Date.now();
  }

  function handleFlag(questionId) {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  }

  async function handleSubmit(forced = false) {
    setSubmitting(true);
    try {
      const allAnswers = questions.map((q, i) => ({
        question_id: q.id,
        chosen_choice_id: answers[q.id] || null,
        is_flagged: flagged[q.id] || false,
        time_spent_sec: 0,
        position: i,
      }));

      await skdService.submitBulk({ session_id: sessionId, answers: allAnswers });
      navigate(`/skd/tryout/hasil/${sessionId}`);
    } catch (err) {
      toast.error('Gagal mengumpulkan jawaban');
      setSubmitting(false);
    }
  }

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const unanswered = questions.length - answeredCount;

  // Group questions by subtes
  const subtesGroups = {};
  questions.forEach((q, i) => {
    if (!subtesGroups[q.subject_name]) subtesGroups[q.subject_name] = [];
    subtesGroups[q.subject_name].push({ ...q, globalIdx: i });
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d47a1] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3 }} />
          <p className="text-[16px] font-medium opacity-80">Memuat soal tryout SKD...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const color = SUBJECT_COLOR[currentQuestion.subject_name] || SUBJECT_COLOR.TWK;
  const isTkp = currentQuestion.is_tkp;
  const subtesTimer = timeRemaining[currentQuestion.subject_name] || 0;
  const isTimeCritical = subtesTimer <= 60;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8faff' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#c2c6d8]/30 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-3">
          {/* Subtes badges */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {Object.keys(subtesGroups).map((name) => {
              const c = SUBJECT_COLOR[name] || SUBJECT_COLOR.TWK;
              const isActive = name === currentQuestion.subject_name;
              const groupQs = subtesGroups[name];
              const groupAnswered = groupQs.filter((q) => answers[q.id]).length;
              return (
                <button key={name}
                  onClick={() => { const first = groupQs[0]; if (first) setCurrentIdx(first.globalIdx); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                    isActive ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={isActive ? { backgroundColor: c.primary } : {}}
                >
                  <span>{name}</span>
                  <span className="opacity-70">{groupAnswered}/{groupQs.length}</span>
                </button>
              );
            })}
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-black text-[15px] ${
            isTimeCritical ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-[#f2f3ff] text-[#0050cb]'
          }`}>
            <span className="material-symbols-outlined text-[16px]">timer</span>
            {formatTime(subtesTimer)}
          </div>

          <button onClick={() => setShowNav(!showNav)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0050cb] text-white rounded-xl text-[12px] font-bold">
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
            <span className="hidden sm:inline">Navigasi</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-6 gap-6">
        {/* Main question area */}
        <div className="flex-1 min-w-0">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${((currentIdx + 1) / questions.length) * 100}%`,
                backgroundColor: color.primary
              }} />
            </div>
            <span className="text-[12px] font-bold text-[#727687] shrink-0">
              {currentIdx + 1}/{questions.length}
            </span>
          </div>

          {/* Question card */}
          <div className="bg-white rounded-2xl border border-[#c2c6d8]/40 shadow-sm p-6 sm:p-8 mb-6">
            {/* Subtes + number */}
            <div className="flex items-center gap-3 mb-5">
              <div className="px-3 py-1.5 rounded-xl text-[12px] font-black"
                style={{ backgroundColor: color.light, color: color.primary }}>
                {currentQuestion.subject_name}
              </div>
              <span className="text-[14px] font-semibold text-[#424656]">Soal {currentIdx + 1}</span>
              {flagged[currentQuestion.id] && (
                <span className="flex items-center gap-1 text-[12px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span> Ragu
                </span>
              )}
              {isTkp && (
                <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Poin 1–5</span>
              )}
            </div>

            {/* Stimulus */}
            {currentQuestion.stimulus && (
              <div className="bg-[#f8f9ff] border-l-4 rounded-r-xl p-4 mb-5 text-[14px] leading-relaxed text-[#424656]"
                style={{ borderLeftColor: color.primary }}>
                <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: color.primary }}>Bacaan</div>
                <div dangerouslySetInnerHTML={{ __html: currentQuestion.stimulus }} />
              </div>
            )}

            {/* Image before */}
            {currentQuestion.image_url && currentQuestion.image_position === 'before' && (
              <img src={currentQuestion.image_url} alt="Soal" className="max-w-full rounded-xl mb-4 border border-[#c2c6d8]/30" />
            )}

            {/* Question content */}
            <div className="text-[15px] sm:text-[16px] leading-relaxed text-[#191b24] mb-6"
              dangerouslySetInnerHTML={{ __html: currentQuestion.content }} />

            {/* Image after */}
            {currentQuestion.image_url && currentQuestion.image_position === 'after' && (
              <img src={currentQuestion.image_url} alt="Soal" className="max-w-full rounded-xl mb-6 border border-[#c2c6d8]/30" />
            )}

            {/* Choices */}
            <div className="space-y-3">
              {(currentQuestion.choices || []).map((choice) => {
                const isSelected = answers[currentQuestion.id] === choice.id;
                return (
                  <button
                    key={choice.id}
                    onClick={() => handleAnswer(currentQuestion.id, choice.id)}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-[#0050cb] bg-[#dae1ff]/40 shadow-sm'
                        : 'border-[#c2c6d8]/30 hover:border-[#0050cb]/50 hover:bg-[#f2f3ff]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-black shrink-0 transition-all ${
                      isSelected ? 'bg-[#0050cb] text-white' : 'bg-[#f2f3ff] text-[#424656]'
                    }`}>
                      {choice.label}
                    </div>
                    <div className="flex-1">
                      <span className="text-[14px] sm:text-[15px] leading-relaxed text-[#191b24]"
                        dangerouslySetInnerHTML={{ __html: choice.content }} />
                      {isTkp && choice.tkp_point > 0 && (
                        <span className="ml-2 text-[11px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                          +{choice.tkp_point} poin
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-[#c2c6d8]/40 text-[#424656] hover:border-[#0050cb] hover:text-[#0050cb]"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span> Sebelumnya
              </button>
              <button
                onClick={() => handleFlag(currentQuestion.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all border ${
                  flagged[currentQuestion.id]
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-white border-[#c2c6d8]/40 text-[#424656] hover:border-amber-400 hover:text-amber-600'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: `'FILL' ${flagged[currentQuestion.id] ? 1 : 0}` }}>flag</span>
                {flagged[currentQuestion.id] ? 'Ditandai' : 'Tandai'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold bg-[#0050cb] text-white hover:bg-[#003da1] transition-all shadow-md shadow-blue-500/10"
                >
                  Berikutnya <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-bold bg-green-600 text-white hover:bg-green-700 transition-all shadow-md shadow-green-500/10"
                >
                  <span className="material-symbols-outlined text-[18px]">done_all</span> Kumpulkan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Side Navigation Panel (desktop) */}
        <div className={`hidden lg:flex flex-col gap-4 w-72 shrink-0`}>
          <div className="bg-white rounded-2xl border border-[#c2c6d8]/40 shadow-sm p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#0050cb]">grid_view</span>
              <h3 className="font-bold text-[#191b24]">Navigasi Soal</h3>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mb-2 text-[10px] font-bold text-center text-[#727687]">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#0050cb]" /> Dijawab</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-400" /> Ditandai</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-gray-200" /> Belum</div>
            </div>

            {Object.entries(subtesGroups).map(([subtesName, groupQs]) => {
              const c = SUBJECT_COLOR[subtesName] || SUBJECT_COLOR.TWK;
              return (
                <div key={subtesName} className="mb-4">
                  <div className="text-[11px] font-black uppercase tracking-wider mb-2 flex items-center gap-2" style={{ color: c.primary }}>
                    <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: c.primary }} />
                    {subtesName}
                    <span className="font-normal text-[#727687]">({groupQs.filter((q) => answers[q.id]).length}/{groupQs.length})</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {groupQs.map((q) => {
                      const isAnswered = Boolean(answers[q.id]);
                      const isFlagged = Boolean(flagged[q.id]);
                      const isCurrent = q.globalIdx === currentIdx;
                      return (
                        <button key={q.id}
                          onClick={() => setCurrentIdx(q.globalIdx)}
                          className={`w-full aspect-square rounded-lg text-[11px] font-bold transition-all border ${
                            isCurrent
                              ? 'border-[#0050cb] scale-110 shadow-md text-[#0050cb] bg-[#dae1ff]'
                              : isFlagged
                              ? 'bg-amber-400 text-white border-amber-400'
                              : isAnswered
                              ? 'text-white border-transparent shadow-sm'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}
                          style={isAnswered && !isFlagged && !isCurrent ? { backgroundColor: c.primary } : {}}
                          title={`Soal ${q.globalIdx + 1}`}
                        >
                          {q.globalIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="mt-4 pt-4 border-t border-[#c2c6d8]/20">
              <div className="flex justify-between text-[12px] mb-3">
                <span className="text-[#424656]">Dijawab:</span>
                <span className="font-bold text-[#0050cb]">{answeredCount}/{questions.length}</span>
              </div>
              <button
                onClick={() => setShowSubmitConfirm(true)}
                className="w-full py-3 rounded-xl text-[14px] font-bold bg-green-600 text-white hover:bg-green-700 transition-all"
              >
                Kumpulkan Semua
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Drawer (mobile) */}
      {showNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNav(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#191b24]">Navigasi Soal</h3>
              <button onClick={() => setShowNav(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {Object.entries(subtesGroups).map(([subtesName, groupQs]) => {
              const c = SUBJECT_COLOR[subtesName] || SUBJECT_COLOR.TWK;
              return (
                <div key={subtesName} className="mb-5">
                  <div className="text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: c.primary }}>
                    {subtesName} ({groupQs.filter((q) => answers[q.id]).length}/{groupQs.length})
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {groupQs.map((q) => {
                      const isAnswered = Boolean(answers[q.id]);
                      const isFlagged = Boolean(flagged[q.id]);
                      const isCurrent = q.globalIdx === currentIdx;
                      return (
                        <button key={q.id}
                          onClick={() => { setCurrentIdx(q.globalIdx); setShowNav(false); }}
                          className={`w-full aspect-square rounded-lg text-[11px] font-bold transition-all ${
                            isCurrent ? 'ring-2 ring-[#0050cb] bg-[#dae1ff] text-[#0050cb]'
                              : isFlagged ? 'bg-amber-400 text-white'
                              : isAnswered ? 'text-white'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                          style={isAnswered && !isFlagged && !isCurrent ? { backgroundColor: c.primary } : {}}
                        >
                          {q.globalIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => { setShowNav(false); setShowSubmitConfirm(true); }}
              className="w-full py-3 mt-4 rounded-xl text-[14px] font-bold bg-green-600 text-white"
            >
              Kumpulkan
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirm Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSubmitConfirm(false)} />
          <div className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-[32px] text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
            </div>
            <h2 className="text-[22px] font-bold text-[#191b24] text-center mb-2">Kumpulkan Jawaban?</h2>
            <p className="text-[14px] text-[#424656] text-center mb-6">
              {unanswered > 0
                ? `Masih ada ${unanswered} soal yang belum dijawab. Jawaban yang belum diisi tidak mendapat nilai.`
                : 'Semua soal sudah dijawab. Pastikan jawabanmu sudah benar sebelum dikumpulkan.'}
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6 text-center">
              <div className="p-3 bg-blue-50 rounded-xl">
                <div className="text-[20px] font-black text-[#0050cb]">{answeredCount}</div>
                <div className="text-[11px] text-[#727687]">Dijawab</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <div className="text-[20px] font-black text-amber-600">{flaggedCount}</div>
                <div className="text-[11px] text-[#727687]">Ditandai</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-[20px] font-black text-gray-500">{unanswered}</div>
                <div className="text-[11px] text-[#727687]">Belum</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-3 rounded-xl text-[14px] font-bold border border-[#c2c6d8]/50 text-[#424656] hover:bg-gray-50">
                Kembali
              </button>
              <button onClick={() => handleSubmit(false)} disabled={submitting}
                className="flex-1 py-3 rounded-xl text-[14px] font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengumpulkan...</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">done_all</span> Ya, Kumpulkan</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
