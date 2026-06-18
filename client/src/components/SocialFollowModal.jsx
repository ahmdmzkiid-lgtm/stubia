import { useEffect, useState } from 'react';
import { socialService } from '../services/api';
import toast from 'react-hot-toast';

export default function SocialFollowModal({ open, onClose, onVerified }) {
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [socialUsername, setSocialUsername] = useState('');
  const [commentLink, setCommentLink] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchStatus();
      setShowSuccessScreen(false);
    }
  }, [open]);

  const fetchStatus = async () => {
    try {
      const res = await socialService.getStatus();
      const data = res.data?.data || null;
      setStatus(data?.status || null);
      setRejectionReason(data?.rejection_reason || '');
      if (data) {
        setSelectedPlatform(data.platform || (data.ig_username ? 'instagram' : 'x'));
        setSocialUsername(data.social_username || data.ig_username || data.x_username || '');
        setCommentLink(data.comment_link || '');
        setContactEmail(data.contact_email || '');
      }
    } catch {
      // handled by interceptor
    }
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleOpenSocialMedia = () => {
    const links = {
      instagram: 'https://instagram.com/stubia.my.id',
      x: 'https://twitter.com/stubia',
    };
    window.open(links[selectedPlatform], '_blank');
  };

  const handleSubmit = async () => {
    if (!socialUsername.trim()) {
      toast.error('Masukkan username IG atau X kamu');
      return;
    }
    if (!commentLink.trim()) {
      toast.error('Masukkan link komentar kamu');
      return;
    }
    if (!contactEmail.trim() || !isValidEmail(contactEmail)) {
      toast.error('Masukkan email kontak yang valid');
      return;
    }
    try {
      setSubmitting(true);
      await socialService.submitVerification({
        platform: selectedPlatform,
        social_username: socialUsername.trim(),
        comment_link: commentLink.trim(),
        contact_email: contactEmail.trim(),
      });
      setShowSuccessScreen(true);
      await fetchStatus();
    } catch {
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
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0050cb]">
            <span className="material-symbols-outlined text-[48px]">send</span>
          </div>
          <h2 className="text-2xl font-bold text-[#191b24] mb-3">Permintaan Terkirim!</h2>
          <p className="text-sm text-[#424656] leading-relaxed mb-6">
            Verifikasi follow & tag 3 kamu sedang ditinjau admin. Setelah disetujui, kamu bisa mengakses latihan soal gratis tanpa batas sesi.
          </p>
          <button
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #0050cb, #3b82f6)' }}
            onClick={() => { setShowSuccessScreen(false); onClose(); }}
          >
            Oke, Paham
          </button>
        </div>
      </div>
    );
  }

  const isApproved = status === 'approved';
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';
  const showForm = !status || isRejected;
  const platformLabel = selectedPlatform === 'instagram' ? 'Instagram' : 'X (Twitter)';

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-[#0050cb] to-[#3b82f6] text-white flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined">favorite</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">Verifikasi Follow & Tag 3</h2>
            <p className="text-sm text-blue-100">Wajib setelah 2 sesi latihan gratis. Cukup sekali verifikasi.</p>
          </div>
          <button type="button" className="text-white/80 hover:text-white shrink-0" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {isApproved && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <span className="material-symbols-outlined text-[32px]">check_circle</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Verifikasi Disetujui</h3>
              <p className="text-sm text-[#424656] mb-6">
                Kamu sudah bisa mengakses latihan soal gratis. Latihan premium tetap membutuhkan upgrade paket.
              </p>
              <button
                type="button"
                className="w-full py-3 rounded-xl text-white font-semibold"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                onClick={() => { onVerified?.(); onClose(); }}
              >
                Mulai Latihan
              </button>
            </div>
          )}

          {isPending && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined text-[32px]">hourglass_top</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Menunggu Verifikasi Admin</h3>
              <p className="text-sm text-[#424656]">Admin akan meninjau bukti follow & tag 3 kamu.</p>
            </div>
          )}

          {isRejected && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <p className="font-semibold">Verifikasi ditolak</p>
              {rejectionReason && <p className="mt-1">{rejectionReason}</p>}
              <p className="text-xs mt-2">Perbaiki dan kirim ulang di bawah.</p>
            </div>
          )}

          {showForm && (
            <>
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#424656] mb-2">1. Pilih Platform</p>
                <div className="grid grid-cols-2 gap-2">
                  {['instagram', 'x'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPlatform(p)}
                      className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                        selectedPlatform === p ? 'border-[#0050cb] bg-[#dae1ff] text-[#0050cb]' : 'border-[#e5e7eb] text-[#424656]'
                      }`}
                    >
                      {p === 'instagram' ? 'Instagram' : 'X (Twitter)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4 p-4 rounded-xl bg-[#f2f3ff] border border-[#dae1ff] text-sm text-[#424656] space-y-2">
                <p><strong>2. Follow</strong> akun Stubia di {platformLabel}</p>
                <p><strong>3. Tag 3 teman</strong> di kolom komentar postingan Stubia</p>
                <button
                  type="button"
                  onClick={handleOpenSocialMedia}
                  className="w-full mt-2 py-2 rounded-lg bg-[#0050cb] text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  Buka {platformLabel}
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-semibold text-[#424656] mb-1 block">Username {platformLabel}</label>
                  <input
                    className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050cb]"
                    placeholder="@username"
                    value={socialUsername}
                    onChange={(e) => setSocialUsername(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#424656] mb-1 block">Link Komentar</label>
                  <input
                    className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050cb]"
                    placeholder="https://..."
                    value={commentLink}
                    onChange={(e) => setCommentLink(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#424656] mb-1 block">Email Kontak</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-[#e5e7eb] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0050cb]"
                    placeholder="email@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #0050cb, #3b82f6)' }}
              >
                {submitting ? 'Mengirim...' : 'Kirim Verifikasi'}
              </button>
            </>
          )}

          {!isApproved && (
            <button
              type="button"
              className="w-full mt-3 py-2.5 rounded-xl border border-[#e5e7eb] text-[#424656] font-semibold text-sm"
              onClick={onClose}
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
