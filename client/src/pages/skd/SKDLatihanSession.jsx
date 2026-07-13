import React, { useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { skdService } from '../../services/api';
import toast from 'react-hot-toast';

const SUBJECT_COLOR = {
  TWK: { primary: '#e65100', light: '#fff3e0' },
  TIU: { primary: '#1565c0', light: '#e3f2fd' },
  TKP: { primary: '#2e7d32', light: '#e8f5e9' },
};

export default function SKDLatihanSession() {
  const { subjectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { questions = [], subject, topicId, questionCount } = location.state || {};

  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const questionStartRef = useRef(Date.now());
  const timeSpentRef = useRef({});

  if (!questions || questions.length === 0) {
    navigate('/skd/latihan/' + subjectId);
    return null;
  }

  const color = SUBJECT_COLOR[subject?.name] || SUBJECT_COLOR.TWK;
  const isTkp = subject?.is_tkp;
  const currentQuestion = questions[currentIdx];

  function handleAnswer(questionId, choiceId) {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    timeSpentRef.current[questionId] = (timeSpentRef.current[questionId] || 0) + elapsed;
    questionStartRef.current = Date.now();
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const answersPayload = questions.map((q, i) => ({
        question_id: q.id,
        chosen_choice_id: answers[q.id] || null,
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
    } catch {
      toast.error('Gagal menyimpan hasil latihan');
      setSubmitting(false);
    }
  }

  const answeredCount = Object.values(answers).filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8faff' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#c2c6d8]/30 shadow-sm">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-black"
              style={{ backgroundColor: color.light, color: color.primary }}>
              {subject?.name}
            </div>
            <div>
              <div className="text-[13px] font-bold text-[#191b24]">Latihan {subject?.name}</div>
              <div className="text-[11px] text-[#727687]">{answeredCount}/{questions.length} dijawab</div>
            </div>
          </div>

          {/* Progress bar compact */}
          <div className="flex-1 max-w-[200px]">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${((currentIdx + 1) / questions.length) * 100}%`,
                backgroundColor: color.primary
              }} />
            </div>
          </div>

          <span className="text-[12px] font-bold text-[#727687]">{currentIdx + 1}/{questions.length}</span>

          <button onClick={() => setShowSubmit(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold text-white shadow-sm transition-all"
            style={{ backgroundColor: color.primary }}>
            <span className="material-symbols-outlined text-[16px]">done_all</span>
            <span className="hidden sm:inline">Selesai</span>
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-[900px] mx-auto w-full px-4 sm:px-6 py-8">
        {/* Question card */}
        <div className="bg-white rounded-2xl border border-[#c2c6d8]/40 shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[13px] font-bold text-[#727687]">Soal {currentIdx + 1} dari {questions.length}</span>
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

          {currentQuestion.image_url && currentQuestion.image_position === 'before' && (
            <img src={currentQuestion.image_url} alt="Soal" className="max-w-full rounded-xl mb-4 border border-[#c2c6d8]/30" />
          )}

          <div className="text-[15px] sm:text-[16px] leading-relaxed text-[#191b24] mb-6"
            dangerouslySetInnerHTML={{ __html: currentQuestion.content }} />

          {currentQuestion.image_url && currentQuestion.image_position === 'after' && (
            <img src={currentQuestion.image_url} alt="Soal" className="max-w-full rounded-xl mb-6 border border-[#c2c6d8]/30" />
          )}

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
                        +{choice.tkp_point}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold bg-white border border-[#c2c6d8]/40 text-[#424656] hover:border-[#0050cb] hover:text-[#0050cb] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span> Sebelumnya
          </button>

          {/* Mini question dots */}
          <div className="flex gap-1 flex-wrap justify-center max-w-[300px]">
            {questions.map((q, i) => (
              <button key={q.id} onClick={() => setCurrentIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIdx ? 'scale-150' : ''
                }`}
                style={{ backgroundColor: answers[q.id] ? color.primary : i === currentIdx ? color.primary : '#c2c6d8' }}
              />
            ))}
          </div>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => { setCurrentIdx(currentIdx + 1); questionStartRef.current = Date.now(); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white transition-all shadow-md"
              style={{ backgroundColor: color.primary }}
            >
              Berikutnya <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSubmit(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold bg-green-600 text-white hover:bg-green-700 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">done_all</span> Selesai
            </button>
          )}
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSubmit(false)} />
          <div className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: color.light, color: color.primary }}>
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
            </div>
            <h2 className="text-[20px] font-bold text-[#191b24] mb-2">Selesaikan Latihan?</h2>
            <div className="grid grid-cols-2 gap-3 my-5">
              <div className="p-3 rounded-xl" style={{ backgroundColor: color.light }}>
                <div className="text-[22px] font-black" style={{ color: color.primary }}>{answeredCount}</div>
                <div className="text-[11px] text-[#727687]">Dijawab</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-[22px] font-black text-gray-500">{questions.length - answeredCount}</div>
                <div className="text-[11px] text-[#727687]">Belum Dijawab</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmit(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border border-[#c2c6d8]/40 text-[#424656] hover:bg-gray-50">
                Kembali
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white disabled:opacity-60 flex items-center justify-center gap-1.5"
                style={{ backgroundColor: color.primary }}>
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Lihat Hasil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
