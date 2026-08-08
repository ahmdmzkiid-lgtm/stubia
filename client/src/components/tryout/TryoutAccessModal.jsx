import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Lock, 
  Sparkles, 
  Calendar, 
  AlertCircle, 
  Gem, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

/**
 * Professional Access & Restriction Modal for Tryouts
 * Replaces intrusive toasts with elegant, informative, action-oriented modals.
 */
export default function TryoutAccessModal({
  open,
  onClose,
  type = 'not_started', // 'not_started' | 'expired' | 'plan_required' | 'limit_reached' | 'inactive' | 'not_verified' | 'custom'
  title,
  subtitle,
  message,
  startDate,
  endDate,
  requiredPlan = 'premium',
  onAction,
  actionText,
  cancelText = 'Tutup'
}) {
  const navigate = useNavigate();

  if (!open) return null;

  const formatDateDisplay = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
      if (isNaN(d.getTime())) return '-';
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }).format(d);
    } catch {
      return String(dateVal);
    }
  };

  // Determine contents based on type
  let config = {
    badgeColor: 'bg-blue-50 text-[#0050cb] border-blue-150',
    iconBg: 'bg-blue-50 text-[#0050cb]',
    icon: <Lock className="w-7 h-7 text-[#0050cb]" />,
    defaultTitle: 'Akses Tryout Terbatas',
    defaultSubtitle: 'Informasi akses paket simulasi',
    defaultMessage: 'Silakan cek status akun atau jadwal tryout untuk melanjutkan.',
    primaryAction: {
      text: 'Upgrade ke Premium',
      onClick: () => {
        onClose();
        navigate('/paket-belajar');
      },
      gradient: 'linear-gradient(135deg, #0050cb 0%, #3b82f6 100%)',
      show: true
    }
  };

  if (type === 'not_started') {
    config = {
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600',
      icon: <Clock className="w-7 h-7 text-amber-600" />,
      defaultTitle: 'Tryout Belum Dibuka',
      defaultSubtitle: 'Jadwal pelaksanaan gratis belum dimulai',
      defaultMessage: 'Paket simulasi ini baru dapat dikerjakan secara gratis sesuai jadwal yang tertera. Ingin langsung mencoba latihan kapan saja tanpa menunggu jadwal?',
      primaryAction: {
        text: 'Akses Kapan Saja (Upgrade Premium)',
        onClick: () => {
          onClose();
          navigate('/paket-belajar');
        },
        gradient: 'linear-gradient(135deg, #0050cb 0%, #3b82f6 100%)',
        show: true
      }
    };
  } else if (type === 'expired') {
    config = {
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-50 text-rose-600',
      icon: <Clock className="w-7 h-7 text-rose-600" />,
      defaultTitle: 'Tenggat Waktu Gratis Berakhir',
      defaultSubtitle: 'Masa event tryout gratis telah selesai',
      defaultMessage: 'Tenggat waktu pengerjaan gratis telah berakhir dan paket ini kembali berstatus Premium. Upgrade ke paket belajar untuk membuka kembali akses soal, pembahasan, dan grafik skor IRT.',
      primaryAction: {
        text: 'Buka Kembali dengan Premium',
        onClick: () => {
          onClose();
          navigate('/paket-belajar');
        },
        gradient: 'linear-gradient(135deg, #0050cb 0%, #3b82f6 100%)',
        show: true
      }
    };
  } else if (type === 'limit_reached') {
    config = {
      badgeColor: 'bg-blue-50 text-[#0050cb] border-blue-200',
      iconBg: 'bg-blue-50 text-[#0050cb]',
      icon: <CheckCircle2 className="w-7 h-7 text-[#0050cb]" />,
      defaultTitle: 'Batas Pengerjaan Gratis Tercapai',
      defaultSubtitle: 'Kamu sudah menyelesaikan tryout gratis ini (1x pengerjaan)',
      defaultMessage: 'Akun gratis hanya memiliki kesempatan 1x pengerjaan per paket. Upgrade ke Premium untuk membuka pengerjaan ulang tanpa batas (re-take), pembahasan interaktif, dan ribuan bank soal lainnya.',
      primaryAction: {
        text: 'Upgrade Akses Tanpa Batas',
        onClick: () => {
          onClose();
          navigate('/paket-belajar');
        },
        gradient: 'linear-gradient(135deg, #0050cb 0%, #3b82f6 100%)',
        show: true
      }
    };
  } else if (type === 'plan_required') {
    const isSultan = requiredPlan === 'sultan';
    config = {
      badgeColor: isSultan ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-[#0050cb] border-blue-200',
      iconBg: isSultan ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-[#0050cb]',
      icon: isSultan ? <Gem className="w-7 h-7 text-purple-600" /> : <Lock className="w-7 h-7 text-[#0050cb]" />,
      defaultTitle: `Khusus Member ${isSultan ? 'Sultan' : 'Premium'}`,
      defaultSubtitle: `Paket tryout ini membutuhkan level akun ${isSultan ? 'Sultan' : 'Premium'}`,
      defaultMessage: `Nikmati simulasi berstandar nasional dan analisis peluang lolos PTN dengan mengaktifkan paket ${isSultan ? 'Sultan' : 'Premium'}.`,
      primaryAction: {
        text: `Upgrade ke ${isSultan ? 'Sultan' : 'Premium'}`,
        onClick: () => {
          onClose();
          navigate('/paket-belajar');
        },
        gradient: isSultan 
          ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' 
          : 'linear-gradient(135deg, #0050cb 0%, #3b82f6 100%)',
        show: true
      }
    };
  } else if (type === 'inactive') {
    config = {
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
      iconBg: 'bg-slate-100 text-slate-600',
      icon: <AlertCircle className="w-7 h-7 text-slate-600" />,
      defaultTitle: 'Tryout Sedang Non-Aktif',
      defaultSubtitle: 'Dalam pemeliharaan konten',
      defaultMessage: 'Paket tryout ini sedang ditutup atau dalam proses pembaruan bank soal oleh tim kurikulum.',
      primaryAction: {
        show: false
      }
    };
  } else if (type === 'not_verified') {
    config = {
      badgeColor: 'bg-blue-50 text-[#0050cb] border-blue-200',
      iconBg: 'bg-blue-50 text-[#0050cb]',
      icon: <Lock className="w-7 h-7 text-[#0050cb]" />,
      defaultTitle: 'Pendaftaran Dibutuhkan',
      defaultSubtitle: 'Lengkapi formulir pendaftaran gratis',
      defaultMessage: 'Untuk membuka kunci subtes tryout gratis ini, silakan selesaikan pendaftaran dan verifikasi data diri.',
      primaryAction: {
        text: 'Lengkapi Pendaftaran',
        onClick: () => {
          onClose();
          if (onAction) onAction();
        },
        gradient: 'linear-gradient(135deg, #0050cb 0%, #3b82f6 100%)',
        show: true
      }
    };
  }

  const finalTitle = title || config.defaultTitle;
  const finalSubtitle = subtitle || config.defaultSubtitle;
  const finalMessage = message || config.defaultMessage;
  const finalActionText = actionText || config.primaryAction?.text;

  return (
    <div 
      className="fixed inset-0 z-[10990] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Top Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
          aria-label="Tutup"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Header Visual Area */}
        <div className="pt-8 pb-4 px-6 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${config.iconBg} mb-4 shadow-sm border border-black/5`}>
            {config.icon}
          </div>
          
          <h2 className="text-[20px] sm:text-[22px] font-extrabold text-[#191b24] tracking-tight leading-snug">
            {finalTitle}
          </h2>
          
          {finalSubtitle && (
            <p className="text-[13px] sm:text-[14px] text-[#727687] font-medium mt-1">
              {finalSubtitle}
            </p>
          )}
        </div>

        {/* Modal Body */}
        <div className="px-6 pb-6 space-y-4">
          {/* Schedule Info Box (If available & applicable) */}
          {(type === 'not_started' || type === 'expired') && (startDate || endDate) && (
            <div className="bg-[#f8f9ff] border border-[#c2c6d8]/30 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#0050cb]">
                <Calendar size={15} />
                <span>Jadwal Pelaksanaan Gratis</span>
              </div>
              
              <div className="space-y-1.5 text-[13px]">
                {startDate && (
                  <div className="flex items-center justify-between text-[#424656]">
                    <span className="text-[#727687]">Waktu Mulai:</span>
                    <span className="font-bold text-[#191b24]">{formatDateDisplay(startDate)}</span>
                  </div>
                )}
                {endDate && (
                  <div className="flex items-center justify-between text-[#424656]">
                    <span className="text-[#727687]">Waktu Berakhir:</span>
                    <span className="font-bold text-[#191b24]">{formatDateDisplay(endDate)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description Message Box */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-[13px] text-[#424656] leading-relaxed">
            {finalMessage}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {config.primaryAction?.show && (
              <button
                type="button"
                onClick={() => {
                  if (onAction) {
                    onAction();
                  } else if (config.primaryAction?.onClick) {
                    config.primaryAction.onClick();
                  }
                }}
                className="w-full py-3.5 px-5 rounded-2xl text-white font-bold text-[14px] shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                style={{ background: config.primaryAction.gradient }}
              >
                <span>{finalActionText}</span>
                <ChevronRight size={17} strokeWidth={2.5} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-[#727687] hover:text-[#191b24] font-semibold text-[13px] transition-colors"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
