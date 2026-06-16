import React from 'react';

export default function StartConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = "Apakah Anda yakin ingin memulai?",
  subtitle = "",
  details = [],
  rules = [
    "Sesi pengerjaan akan dimulai langsung setelah Anda menekan tombol mulai.",
    "Koneksi internet yang stabil sangat disarankan selama pengerjaan.",
    "Jawaban Anda akan tersimpan otomatis setiap kali berpindah soal."
  ]
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10990] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />

      {/* Modal Box */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-[#0050cb] to-[#3b82f6] text-white">
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-blue-100 mt-1 font-medium">{subtitle}</p>}
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Details Row */}
          {details && details.length > 0 && (
            <div className="grid grid-cols-2 gap-4 bg-[#f8f9ff] border border-[#c2c6d8]/20 p-4 rounded-xl">
              {details.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#dae1ff]/50 flex items-center justify-center text-[#0050cb]">
                    <span className="material-symbols-outlined text-[20px]">{item.icon || 'info'}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#727687] font-semibold uppercase tracking-wider">{item.label}</p>
                    <p className="text-[13px] font-bold text-[#191b24]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rules/Info List */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-[#727687] uppercase tracking-wider">Pemberitahuan Penting</p>
            <ul className="space-y-2">
              {rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[16px] text-[#0050cb] mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>
                    info
                  </span>
                  <span className="text-[13px] text-[#424656] leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 py-3 rounded-xl border border-[#c2c6d8]/50 text-[#424656] font-bold text-sm hover:bg-gray-50 transition active:scale-[0.98]"
              onClick={onClose}
            >
              Batal
            </button>
            <button
              type="button"
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.98] transition flex items-center justify-center gap-1.5"
              style={{ background: 'linear-gradient(135deg, #0050cb, #3b82f6)' }}
              onClick={onConfirm}
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>Mulai</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
