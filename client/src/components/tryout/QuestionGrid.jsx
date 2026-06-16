import React from 'react';

const QuestionGrid = ({
  questions = [],
  currentSubject = '',
  currentIndex = 0,
  answers = {},
  flagged = {},
  onNavigate,
  onSubmit,
  totalAnswered = 0
}) => {
  // Calculate progress
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.keys(flagged).length;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Get status of a specific question
  const getQuestionStatus = (index) => {
    const hasAnswer = answers[index] !== undefined;
    const isFlagged = flagged[index];
    const isCurrent = index === currentIndex;

    if (isCurrent) return 'current';
    if (isFlagged) return 'flagged';
    if (hasAnswer) return 'answered';
    return 'idle';
  };

  // Get button class based on status
  const getButtonClass = (status) => {
    const base = 'nav-grid-btn h-11 flex items-center justify-center rounded-lg font-bold text-sm transition-all duration-200 hover:scale-105';

    switch (status) {
      case 'answered':
        return `${base} bg-[#006688] text-white shadow-sm`;
      case 'current':
        return `${base} border-2 border-[#0050cb]/40 bg-[#dae1ff]/10 text-[#0050cb]`;
      case 'flagged':
        return `${base} bg-[#ecedfa] border border-[#c2c6d8]/50 text-[#424656] relative`;
      case 'idle':
      default:
        return `${base} bg-[#ecedfa] border border-[#c2c6d8]/50 text-[#424656]`;
    }
  };

  return (
    <aside className="w-full bg-[#faf8ff] border border-[#c2c6d8]/20 rounded-2xl shadow-xl flex flex-col overflow-hidden">
      {/* Header - Current Subject */}
      <div className="p-6 border-b border-[#c2c6d8]/10">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[11px] font-bold text-[#727687] uppercase tracking-widest mb-1">Sedang Dikerjakan</p>
            <h3 className="text-lg font-bold text-[#191b24]">{currentSubject || 'Soal'}</h3>
          </div>
          <span className="text-[#006688] font-bold text-sm bg-[#c2e8ff]/50 px-2 py-0.5 rounded">
            {answeredCount}/{totalQuestions}
          </span>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-4 gap-2.5">
          {questions.map((question, idx) => {
            const status = getQuestionStatus(idx);
            const questionNum = idx + 1;

            return (
              <button
                key={question.id || idx}
                onClick={() => onNavigate && onNavigate(idx)}
                className={`${getButtonClass(status)} ${status === 'current' ? 'ring-2 ring-[#0050cb] ring-offset-1' : ''}`}
              >
                {questionNum}
                {/* Flagged indicator */}
                {status === 'flagged' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#a33200] border-2 border-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend & Progress */}
      <div className="p-6 space-y-6">
        {/* Legend */}
        <div className="grid grid-cols-2 gap-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-[#006688]"></div>
            <span className="text-[12px] font-medium text-[#424656]">Sudah Dijawab</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded border-2 border-[#0050cb]/40 bg-[#dae1ff]/10"></div>
            <span className="text-[12px] font-medium text-[#424656]">Sedang Dikerjakan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#a33200]"></div>
            <span className="text-[12px] font-medium text-[#424656]">Ditandai (Ragu)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded bg-[#ecedfa] border border-[#c2c6d8]/50"></div>
            <span className="text-[12px] font-medium text-[#424656]">Belum Dijawab</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-4 pt-4 border-t border-[#c2c6d8]/10">
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-medium text-[#424656]">Progres Pengerjaan</span>
            <span className="text-[#0050cb] font-bold text-[14px]">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#e1e2ee]/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0050cb] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-[#c2e8ff]/30 rounded-lg">
            <p className="text-[20px] font-bold text-[#006688]">{answeredCount}</p>
            <p className="text-[10px] text-[#424656] uppercase tracking-wider">Dijawab</p>
          </div>
          <div className="p-3 bg-[#ecedfa] rounded-lg">
            <p className="text-[20px] font-bold text-[#424656]">{totalQuestions - answeredCount}</p>
            <p className="text-[10px] text-[#424656] uppercase tracking-wider">Kosong</p>
          </div>
          <div className="p-3 bg-[#ffdbd0]/50 rounded-lg">
            <p className="text-[20px] font-bold text-[#a33200]">{flaggedCount}</p>
            <p className="text-[10px] text-[#424656] uppercase tracking-wider">Ragu</p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-auto p-6 bg-[#ecedfa]/30">
        <button
          onClick={onSubmit}
          className="w-full py-4 bg-[#0050cb] text-white rounded-xl font-bold text-[14px] shadow-lg shadow-[#0050cb]/20 hover:brightness-110 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">check_circle</span>
          Kirim Jawaban
        </button>
      </div>
    </aside>
  );
};

export default QuestionGrid;
