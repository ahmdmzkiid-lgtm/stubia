import React from 'react';

export default function LatihanPreRequirementModal({ open, onClose, onProceed }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[10990] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-[#0050cb] to-[#3b82f6] text-white">
          <h2 className="text-lg font-bold">Akses Latihan Gratis</h2>
          <p className="text-sm text-blue-100 mt-1">Follow & tag 3 teman sekali saja. Setelah disetujui admin, latihan gratis bisa diakses tanpa batas sesi.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[22px] text-[#0050cb]">verified</span>
            <div>
              <p className="text-sm font-semibold text-[#191b24]">Kenapa ada langkah ini?</p>
              <p className="text-sm text-[#424656]">User Gratis perlu follow akun Stubia dan tag 3 teman di komentar postingan. Cukup sekali verifikasi untuk akses latihan gratis.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[22px] text-[#0050cb]">counter_3</span>
            <div>
              <p className="text-sm font-semibold text-[#191b24]">Muncul saat sesi ke-3</p>
              <p className="text-sm text-[#424656]">Sesi 1-2 gratis tanpa hambatan. Mulai sesi ke-3, kamu akan diminta verifikasi.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[22px] text-[#0050cb]">workspace_premium</span>
            <div>
              <p className="text-sm font-semibold text-[#191b24]">Sudah Premium/Sultan?</p>
              <p className="text-sm text-[#424656]">Kamu tidak akan melihat modal ini.</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 py-3 rounded-xl border border-[#e5e7eb] text-[#424656] font-semibold hover:bg-gray-50"
              onClick={onClose}
            >
              Tutup
            </button>
            <button
              className="flex-1 py-3 rounded-xl text-white font-semibold hover:shadow-lg active:scale-[0.99] transition"
              style={{ background: 'linear-gradient(135deg, #0050cb, #3b82f6)' }}
              onClick={onProceed}
            >
              Lanjut
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
