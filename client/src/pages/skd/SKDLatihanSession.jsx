import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { skdService } from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import QuestionGrid from '../../components/tryout/QuestionGrid';
import SubmitConfirmModal from '../../components/SubmitConfirmModal';
import MathText from '../../components/MathText';
import ExitConfirmModal from '../../components/ExitConfirmModal';
import PreviewBanner from '../../components/layout/PreviewBanner';

export default function SKDLatihanSession() {
  const { subjectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { questions = [], subject, topicId, topicTitle, questionCount } = location.state || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [index]: choiceId }
  const [flagged, setFlagged] = useState({}); // { [index]: boolean }
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showNavDrawer, setShowNavDrawer] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingExitPath, setPendingExitPath] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const questionStartRef = useRef(Date.now());
  const timeSpentRef = useRef({});

  // Redirect if no questions
  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate(`/skd/latihan/${subjectId}`);
    }
  }, [questions, subjectId, navigate]);

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
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (showSubmitModal) return;

      const key = e.key.toUpperCase();
      const currentQuestion = questions[currentIndex];
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
        if (currentIndex < questions.length - 1) {
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
  }, [currentIndex, questions, showSubmitModal]);

  if (!questions || questions.length === 0) return null;

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const isTkp = !!subject?.is_tkp;
  const subjectName = subject?.name || 'SKD';
  const displayTitle = topicTitle ? `${subjectName} · ${topicTitle}` : `Latihan ${subjectName}`;

  const handleOptionSelect = (choiceId) => {
    const q = questions[currentIndex];
    if (!q) return;
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    timeSpentRef.current[q.id] = (timeSpentRef.current[q.id] || 0) + elapsed;
    questionStartRef.current = Date.now();

    setAnswers(prev => ({ ...prev, [currentIndex]: choiceId }));
  };

  const toggleFlag = () => {
    setFlagged(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  const handleConfirmFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const answersPayload = questions.map((q, i) => ({
        question_id: q.id,
        chosen_choice_id: answers[i] || null,
        time_spent_sec: timeSpentRef.current[q.id] || 0,
        position: i,
      }));

      const res = await skdService.submitLatihan({
        subject_id: subjectId,
        topic_id: topicId || null,
        answers: answersPayload,
        question_count: questionCount || questions.length,
      });

      const sessionId = res.data?.data?.sessionId;
      navigate(`/skd/latihan/${subjectId}/hasil/${sessionId}`, {
        state: { questions, answers, subject },
      });
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan hasil latihan. Silakan coba lagi.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b24] flex flex-col">
      <PreviewBanner />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#faf8ff]/95 backdrop-blur-md border-b border-[#e0e2f0] shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { setPendingExitPath(`/skd/latihan/${subjectId}`); setShowExitModal(true); }} className="flex items-center">
              <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 sm:h-9 cursor-pointer" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold text-[#0050cb] bg-[#e8eeff] px-3 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[16px]">school</span>
              Latihan SKD
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
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
        {/* Subheader / Progress Info */}
        <div className="pt-[76px] sm:pt-[84px] pb-4 px-4 sm:px-6 bg-[#faf8ff] border-b border-[#e0e2f0]">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-[17px] font-bold text-[#191b24]">
                  {displayTitle}
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

        {/* Main Content (2 Columns) */}
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

            {/* Question Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-7 mb-6 border border-[#e0e2f0] shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-xl bg-[#0050cb] text-white flex items-center justify-center font-bold text-[14px] shadow-sm shadow-[#0050cb]/20">
                  {currentIndex + 1}
                </span>
                {isTkp && (
                  <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                    TKP • Sistem Poin 1–5
                  </span>
                )}
              </div>

              {/* TOP IMAGE */}
              {currentQuestion.image_url && ['top', 'before', 'atas'].includes(currentQuestion.image_position) && (
                <div className="mb-4">
                  <img className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={currentQuestion.image_url} alt="Soal" />
                </div>
              )}

              {/* STIMULUS */}
              {currentQuestion.stimulus && (
                <div className="mb-4 text-[15px] text-[#191b24] leading-relaxed whitespace-pre-wrap">
                  <MathText text={currentQuestion.stimulus} />
                </div>
              )}

              {/* MIDDLE IMAGE */}
              {currentQuestion.image_url && ['middle', 'ditengah', 'tengah'].includes(currentQuestion.image_position) && (
                <div className="mb-4">
                  <img className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={currentQuestion.image_url} alt="Soal" />
                </div>
              )}

              <MathText className="text-[15px] text-[#191b24] leading-relaxed" text={currentQuestion.content || ''} />

              {/* BOTTOM IMAGE */}
              {currentQuestion.image_url && !['top', 'before', 'atas', 'middle', 'ditengah', 'tengah'].includes(currentQuestion.image_position) && (
                <div className="mt-4">
                  <img className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={currentQuestion.image_url} alt="Soal" />
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="flex flex-col gap-3 mb-6">
              {(currentQuestion?.choices || []).map((choice) => {
                const isSelected = answers[currentIndex] === choice.id;
                return (
                  <button
                    key={choice.id}
                    onClick={() => handleOptionSelect(choice.id)}
                    className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? 'bg-[#e8eeff] border-[#0050cb] shadow-sm shadow-[#0050cb]/10'
                        : 'bg-white border-[#e0e2f0] hover:border-[#a8b4d9] hover:shadow-sm'
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#0050cb] text-white shadow-sm shadow-[#0050cb]/20'
                        : 'bg-[#ecedfa] text-[#424656] group-hover:bg-[#dae1ff]'
                    }`}>
                      {choice.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <MathText className={`text-[14px] leading-relaxed ${isSelected ? 'font-medium text-[#191b24]' : 'text-[#424656]'}`} text={choice.content || ''} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-[#e0e2f0]">
              <button
                onClick={() => {
                  if (currentIndex > 0) {
                    setCurrentIndex(currentIndex - 1);
                    questionStartRef.current = Date.now();
                  }
                }}
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
                    questionStartRef.current = Date.now();
                  } else {
                    setShowSubmitModal(true);
                  }
                }}
                className="bg-[#0050cb] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[13px] font-semibold hover:bg-[#003da6] transition-colors flex items-center gap-2 shadow-sm shadow-[#0050cb]/20"
              >
                <span className="hidden sm:inline">{currentIndex < totalQuestions - 1 ? 'Lanjut' : 'Selesai'}</span>
                <span className="material-symbols-outlined text-[18px]">{currentIndex < totalQuestions - 1 ? 'chevron_right' : 'check'}</span>
              </button>
            </div>

            {/* Mobile Navigator CTA */}
            <button
              onClick={() => setShowNavDrawer(true)}
              className="lg:hidden mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#c2c6d8] text-[13px] font-semibold text-[#424656] hover:bg-[#ecedfa] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
              Daftar Soal
            </button>
          </div>

          {/* Desktop Sidebar (QuestionGrid) */}
          <aside className="hidden lg:block sticky top-[140px]">
            <QuestionGrid
              questions={questions}
              currentSubject={subjectName}
              currentIndex={currentIndex}
              answers={answers}
              flagged={flagged}
              onNavigate={(idx) => {
                setCurrentIndex(idx);
                questionStartRef.current = Date.now();
              }}
              onSubmit={() => setShowSubmitModal(true)}
              totalAnswered={Object.keys(answers).length}
            />
          </aside>
        </div>
      </main>

      {/* Mobile Navigator Drawer */}
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
                onNavigate={(idx) => {
                  setCurrentIndex(idx);
                  questionStartRef.current = Date.now();
                  setShowNavDrawer(false);
                }}
                onSubmit={() => {
                  setShowNavDrawer(false);
                  setShowSubmitModal(true);
                }}
                totalAnswered={Object.keys(answers).length}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#faf8ff]/95 backdrop-blur-md border-t border-[#e0e2f0] py-3 px-4 sm:px-6 z-40">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-[13px] text-[#727687]">
          <span className="font-medium">{displayTitle}</span>
          <span className="bg-[#ecedfa] px-2.5 py-0.5 rounded-md font-semibold">{Object.keys(answers).length} / {totalQuestions} terjawab</span>
        </div>
      </div>

      {/* Submit Confirm Modal */}
      <SubmitConfirmModal
        open={showSubmitModal}
        onClose={() => !submitting && setShowSubmitModal(false)}
        onConfirm={handleConfirmFinish}
        loading={submitting}
        title="Sudah Yakin dengan Jawabanmu?"
        answered={Object.keys(answers).length}
        total={totalQuestions}
      />

      {/* Exit Confirm Modal */}
      <ExitConfirmModal
        open={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => {
          setShowExitModal(false);
          navigate(pendingExitPath || `/skd/latihan/${subjectId}`);
        }}
        title="Yakin ingin keluar dari latihan SKD?"
        message="Kemajuan yang sudah kamu kerjakan dalam sesi ini tidak akan tersimpan jika kamu keluar sekarang."
      />
    </div>
  );
}
