import React from 'react';

export default function ExitConfirmModal({ open, onClose, onConfirm, title, message }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10990] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
          <h2 className="text-lg font-bold">{title || 'Yakin ingin keluar?'}</h2>
          <p className="text-sm text-red-100 mt-1 font-medium">{message || 'Jawaban yang sudah dikerjakan akan tetap tersimpan.'}</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="material-symbols-outlined text-amber-600 text-[20px] mt-0.5">warning</span>
            <p className="text-[13px] text-amber-800 leading-relaxed">
              Waktu tryout akan terus berjalan selama Anda meninggalkan halaman ini.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              className="flex-1 py-3 rounded-xl border border-[#c2c6d8]/50 text-[#424656] font-bold text-sm hover:bg-gray-50 transition active:scale-[0.98]"
              onClick={onClose}
            >
              Lanjutkan Tryout
            </button>
            <button
              type="button"
              className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 active:scale-[0.98] transition flex items-center justify-center gap-1.5"
              onClick={onConfirm}
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>Ya, Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
