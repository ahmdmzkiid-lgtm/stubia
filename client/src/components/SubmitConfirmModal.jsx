import React from 'react';

const SubmitConfirmModal = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  title = 'Sudah Yakin dengan Jawabanmu?',
  answered = 0,
  total = 0,
  confirmLabel = 'Ya, Selesaikan',
  cancelLabel = 'Kembali Periksa',
  noteLabel = 'Tindakan ini tidak dapat dibatalkan setelah dikirim',
}) => {
  if (!open) return null;

  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(25, 27, 36, 0.4)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl overflow-hidden border border-white/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative pt-8 pb-6 px-6 text-center">
          {/* Premium Illustration/Icon Area */}
          <div className="mb-5 relative inline-block">
            <div className="absolute inset-0 bg-[#0050cb]/10 blur-2xl rounded-full scale-150"></div>
            <div className="relative bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-md mx-auto border border-[#c2c6d8]/20">
              <span
                className="material-symbols-outlined text-[#0050cb] text-[32px]"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                task_alt
              </span>
            </div>
          </div>

          <h2 className="text-[20px] sm:text-[22px] font-bold text-[#191b24] mb-2 leading-snug tracking-tight">
            {title}
          </h2>
          <p className="text-[#424656] text-[14px] mb-6 max-w-[340px] mx-auto leading-relaxed">
            Kamu telah menjawab{' '}
            <span className="font-bold text-[#0050cb]">
              {answered} dari {total} soal
            </span>
            . Pastikan semua jawaban telah diperiksa dengan teliti sebelum mengirimkan hasil akhir.
          </p>

          {/* Progress Bar Detail */}
          <div className="mb-6 w-full">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[10px] font-semibold text-[#424656] uppercase tracking-wide">
                Progress Pengerjaan
              </span>
              <span className="font-bold text-[12px] text-[#0050cb]">
                {percent}% Selesai
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#e6e7f4] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0050cb] rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onConfirm}
              disabled={loading}
              className="w-full bg-[#0050cb] text-white py-3 rounded-xl font-bold text-[15px] hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-[#0050cb]/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Mengirim...
                </>
              ) : (
                confirmLabel
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full text-[#0050cb] hover:bg-[#0050cb]/5 py-2.5 rounded-xl font-bold text-[14px] transition-colors disabled:opacity-60"
            >
              {cancelLabel}
            </button>
          </div>

          <p className="mt-5 text-[#832600] text-[11px] font-semibold flex items-center justify-center gap-1 opacity-60">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            {noteLabel}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubmitConfirmModal;
