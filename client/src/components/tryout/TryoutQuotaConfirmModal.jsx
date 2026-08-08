import React from 'react';

/**
 * Professional Quota Confirmation Modal for UTBK Tryouts
 * Displayed when a student initiates a tryout using retail/eceran quota.
 * Strictly uses Material Symbols vector icons — zero emojis/emoticons.
 */
export default function TryoutQuotaConfirmModal({
  open,
  onClose,
  onConfirm,
  packageTitle = 'Tryout UTBK-SNBT',
  subtestName = '',
  questionCount = 0,
  durationText = '',
  quotaRemaining = 1,
  targetPtn = '',
  targetMajor = '',
}) {
  if (!open) return null;

  const currentQuota = typeof quotaRemaining === 'number' ? quotaRemaining : 1;
  const remainingAfter = Math.max(0, currentQuota - 1);

  return (
    <div
      className="fixed inset-0 z-[10990] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quota-modal-title"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-150 animate-in zoom-in-95 duration-200 z-10 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="px-6 pt-6 pb-5 bg-gradient-to-r from-[#0050cb] via-[#1a65d6] to-[#2563eb] text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  token
                </span>
                <span>Kuota Tryout Eceran</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Tutup modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <h2 id="quota-modal-title" className="text-xl font-bold text-white mt-3 tracking-tight">
              Konfirmasi Penggunaan Kuota
            </h2>
            <p className="text-xs text-blue-100 font-medium mt-0.5 line-clamp-1">
              {packageTitle}
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 text-[#191b24]">
          {/* Main Callout / Alert Box */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 sm:p-4.5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                warning
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] sm:text-[15px] font-bold text-amber-950 leading-snug">
                Anda ingin menggunakan 1 kuota untuk tryout ini dan tidak bisa dibatalkan
              </h3>
              <p className="text-[12px] sm:text-[13px] text-amber-800 mt-1 leading-relaxed">
                Pengurangan 1 kuota bersifat permanen dan memberikan Anda akses penuh ke seluruh subtes dalam paket tryout ini.
              </p>
            </div>
          </div>

          {/* Quota Deduction Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#0050cb]">
                account_balance_wallet
              </span>
              <span>Ringkasan Kuota Akun</span>
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white rounded-xl p-2.5 border border-slate-200/60 shadow-xs">
                <span className="text-[10px] text-[#727687] font-semibold block uppercase">Sisa Kuota</span>
                <span className="text-[16px] font-extrabold text-[#191b24] mt-0.5 block">{currentQuota}</span>
                <span className="text-[10px] text-[#727687]">kuota</span>
              </div>
              <div className="bg-amber-50/70 rounded-xl p-2.5 border border-amber-200/70 shadow-xs">
                <span className="text-[10px] text-amber-700 font-semibold block uppercase">Digunakan</span>
                <span className="text-[16px] font-extrabold text-amber-700 mt-0.5 block">-1</span>
                <span className="text-[10px] text-amber-700">kuota</span>
              </div>
              <div className="bg-blue-50/70 rounded-xl p-2.5 border border-blue-200/70 shadow-xs">
                <span className="text-[10px] text-[#0050cb] font-semibold block uppercase">Sisa Setelahnya</span>
                <span className="text-[16px] font-extrabold text-[#0050cb] mt-0.5 block">{remainingAfter}</span>
                <span className="text-[10px] text-[#0050cb]">kuota</span>
              </div>
            </div>
          </div>

          {/* Subtest & Session Details */}
          <div className="grid grid-cols-2 gap-2.5">
            {subtestName && (
              <div className="bg-[#faf8ff] border border-[#c2c6d8]/30 rounded-xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0050cb]/10 text-[#0050cb] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">quiz</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[#727687] font-semibold uppercase tracking-wider">Subtes Awal</p>
                  <p className="text-[12px] font-bold text-[#191b24] truncate">{subtestName}</p>
                </div>
              </div>
            )}

            {questionCount > 0 && (
              <div className="bg-[#faf8ff] border border-[#c2c6d8]/30 rounded-xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0050cb]/10 text-[#0050cb] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">description</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[#727687] font-semibold uppercase tracking-wider">Jumlah Soal</p>
                  <p className="text-[12px] font-bold text-[#191b24]">{questionCount} Soal</p>
                </div>
              </div>
            )}

            {durationText && (
              <div className="bg-[#faf8ff] border border-[#c2c6d8]/30 rounded-xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0050cb]/10 text-[#0050cb] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[#727687] font-semibold uppercase tracking-wider">Durasi Subtes</p>
                  <p className="text-[12px] font-bold text-[#191b24]">{durationText}</p>
                </div>
              </div>
            )}

            {targetPtn && (
              <div className="bg-[#faf8ff] border border-[#c2c6d8]/30 rounded-xl p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0050cb]/10 text-[#0050cb] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">school</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[#727687] font-semibold uppercase tracking-wider">Target PTN</p>
                  <p className="text-[12px] font-bold text-[#191b24] truncate">{targetPtn}</p>
                </div>
              </div>
            )}
          </div>

          {/* Important Rules / Terms */}
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-2xl p-4 space-y-2">
            <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#0050cb]">
                verified_user
              </span>
              <span>Ketentuan Pengerjaan</span>
            </p>
            <ul className="space-y-2 text-[12px] text-[#424656] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#0050cb] mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span>1 kuota mencakup seluruh rangkaian subtes dalam paket tryout ini sampai selesai.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-600 mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lock
                </span>
                <span>Setelah tombol mulai ditekan, kuota tidak dapat dikembalikan atau dibatalkan dengan alasan apapun.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#0050cb] mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  wifi
                </span>
                <span>Pastikan koneksi internet stabil dan waktu Anda mencukupi selama sesi berlangsung.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 bg-white text-[#424656] font-bold text-sm hover:bg-slate-100 hover:text-[#191b24] transition-all active:scale-[0.98]"
            onClick={onClose}
          >
            Batalkan
          </button>
          <button
            type="button"
            className="flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #0050cb 0%, #3b82f6 100%)' }}
            onClick={onConfirm}
          >
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            <span>Gunakan 1 Kuota & Mulai</span>
          </button>
        </div>
      </div>
    </div>
  );
}
