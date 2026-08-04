import React from 'react';

export default function ConfirmModal({
  isOpen,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'info', // 'danger' | 'warning' | 'info' | 'success'
  onConfirm,
  onCancel,
  isLoading = false
}) {
  if (!isOpen) return null;

  const iconMap = {
    danger: { name: 'warning', bg: 'bg-red-50 text-red-600 border-red-100', btn: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' },
    warning: { name: 'help', bg: 'bg-amber-50 text-amber-600 border-amber-100', btn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20' },
    info: { name: 'info', bg: 'bg-blue-50 text-[#0050cb] border-blue-100', btn: 'bg-[#0050cb] hover:bg-[#003da6] text-white shadow-[#0050cb]/20' },
    success: { name: 'task_alt', bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' },
  };

  const style = iconMap[type] || iconMap.info;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${style.bg} shrink-0 shadow-inner`}>
            <span className="material-symbols-outlined text-[24px]">{style.name}</span>
          </div>
          <div>
            <h3 className="text-[17px] font-extrabold text-[#191b24] leading-snug">{title}</h3>
            <p className="text-[13px] font-medium text-[#727687] mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-[#424656] font-bold text-[13px] hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer ${style.btn}`}
          >
            {isLoading ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
