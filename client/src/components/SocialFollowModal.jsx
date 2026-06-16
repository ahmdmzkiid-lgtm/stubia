import { useEffect, useState } from 'react';
import { socialService } from '../services/api';
import toast from 'react-hot-toast';

export default function SocialFollowModal({ open, onClose, onVerified }) {
  const [igUsername, setIgUsername] = useState('');
  const [xUsername, setXUsername] = useState('');
  const [isIgEnabled, setIsIgEnabled] = useState(true);
  const [isXEnabled, setIsXEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // pending | approved | rejected | null
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStatus();
      setShowSuccessScreen(false); // Reset success screen on reopen
    }
  }, [open]);

  const fetchStatus = async () => {
    try {
      const res = await socialService.getStatus();
      const data = res.data?.data || null;
      setStatus(data?.status || null);
      setRejectionReason(data?.rejection_reason || '');
      setIgUsername(data?.ig_username || '');
      setXUsername(data?.x_username || '');

      const hasIg = !!data?.ig_username;
      const hasX = !!data?.x_username;
      if (data) {
        setIsIgEnabled(hasIg || (!hasIg && !hasX)); // default to IG if both empty
        setIsXEnabled(hasX);
      } else {
        setIsIgEnabled(true);
        setIsXEnabled(false);
      }
    } catch (err) {
      // error handled by interceptor
    }
  };

  const handleSubmit = async () => {
    const finalIg = isIgEnabled ? igUsername : '';
    const finalX = isXEnabled ? xUsername : '';

    if (!finalIg && !finalX) {
      toast.error('Aktifkan dan isi salah satu username IG atau X');
      return;
    }
    try {
      setSubmitting(true);
      await socialService.submitVerification({ 
        ig_username: finalIg || undefined, 
        x_username: finalX || undefined 
      });
      setShowSuccessScreen(true);
      await fetchStatus();
    } catch (err) {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  if (showSuccessScreen) {
    return (
      <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4" onClick={() => { setShowSuccessScreen(false); onClose(); }}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0050cb]">
            <span className="material-symbols-outlined text-[48px] animate-bounce">send</span>
          </div>
          <h2 className="text-2xl font-bold text-[#191b24] mb-3">Permintaan Terkirim! 🚀</h2>
          <p className="text-sm text-[#424656] leading-relaxed mb-6">
            Data Instagram/X kamu berhasil diajukan ke admin. Kami akan segera memverifikasinya dalam waktu kurang dari 24 jam.<br/><br/>
            Terima kasih banyak telah berpartisipasi dan membantu platform Eduzet terus bertumbuh! 🌟
          </p>
          <button
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-blue-500/15 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #0050cb, #3b82f6)' }}
            onClick={() => {
              setShowSuccessScreen(false);
              onClose();
            }}
          >
            Sip, Oke Paham!
          </button>
        </div>
      </div>
    );
  }

  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-[#e5e7eb] bg-gradient-to-r from-[#0050cb] to-[#3b82f6] text-white flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined">favorite</span>
          </div>
          <div>
            <h2 className="text-lg font-bold">Follow & Repost untuk Akses Latihan</h2>
            <p className="text-sm text-blue-100">Cukup isi username salah satu sosmed, admin akan cek dan approve.</p>
          </div>
          <button className="ml-auto text-white/80 hover:text-white" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex gap-3">
            <a
              href="https://www.instagram.com/eduzet.my.id?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:shadow-lg transition"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              Buka Instagram
            </a>
            <a
              href="https://x.com/eduzet?s=20"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-black text-white font-semibold shadow-md hover:shadow-lg transition"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Buka X
            </a>
          </div>

          <div className={`space-y-2 transition-all duration-300 ${isIgEnabled ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#191b24] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#e1306c]">photo_camera</span>
                Username Instagram
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsIgEnabled(!isIgEnabled);
                  if (isIgEnabled) setIgUsername('');
                }}
                className="flex items-center text-[#0050cb] hover:text-[#003da6] transition-colors"
                disabled={isApproved || isPending}
              >
                <span className="material-symbols-outlined text-[28px]">
                  {isIgEnabled ? 'toggle_on' : 'toggle_off'}
                </span>
              </button>
            </div>
            <input
              className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050cb] disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="@username"
              value={igUsername}
              onChange={(e) => setIgUsername(e.target.value)}
              disabled={!isIgEnabled || isApproved || isPending}
            />
          </div>

          <div className={`space-y-2 transition-all duration-300 ${isXEnabled ? 'opacity-100' : 'opacity-50'}`}>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#191b24] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-black">close</span>
                Username X
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsXEnabled(!isXEnabled);
                  if (isXEnabled) setXUsername('');
                }}
                className="flex items-center text-[#0050cb] hover:text-[#003da6] transition-colors"
                disabled={isApproved || isPending}
              >
                <span className="material-symbols-outlined text-[28px]">
                  {isXEnabled ? 'toggle_on' : 'toggle_off'}
                </span>
              </button>
            </div>
            <input
              className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050cb] disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="@username"
              value={xUsername}
              onChange={(e) => setXUsername(e.target.value)}
              disabled={!isXEnabled || isApproved || isPending}
            />
          </div>

          {isPending && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
              <div>
                <p className="font-semibold">Menunggu verifikasi admin</p>
                <p>Balasan akan muncul otomatis setelah disetujui.</p>
              </div>
            </div>
          )}

          {isApproved && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <div>
                <p className="font-semibold">Sudah disetujui</p>
                <p>Kamu sudah bebas mengerjakan latihan (latihan yang sudah dikerjakan tetap 1x).</p>
              </div>
            </div>
          )}

          {isRejected && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <div>
                <p className="font-semibold">Ditolak</p>
                {rejectionReason && <p>{rejectionReason}</p>}
                <p className="text-xs text-red-600 mt-1">Perbaiki username, lalu kirim ulang.</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              className="flex-1 py-3 rounded-xl border border-[#e5e7eb] text-[#424656] font-semibold hover:bg-gray-50"
              onClick={onClose}
            >
              Tutup
            </button>
            {!isApproved && !isPending && (
              <button
                className="flex-1 py-3 rounded-xl text-white font-semibold hover:shadow-lg active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #0050cb, #3b82f6)' }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Mengirim...' : 'Kirim untuk verifikasi'}
              </button>
            )}
            {isPending && (
              <button
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-400 font-semibold cursor-not-allowed border border-[#e5e7eb] flex items-center justify-center gap-1.5"
                disabled
              >
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Menunggu Verifikasi
              </button>
            )}
            {isApproved && (
              <button
                className="flex-1 py-3 rounded-xl text-white font-semibold hover:shadow-lg active:scale-[0.99] transition"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                onClick={() => {
                  onVerified?.();
                  onClose();
                }}
              >
                Mulai Latihan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
