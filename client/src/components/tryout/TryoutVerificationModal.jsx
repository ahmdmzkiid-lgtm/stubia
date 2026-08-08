import { useState, useEffect } from "react";
import { tryoutService } from "../../services/api";
import toast from "react-hot-toast";

const TryoutVerificationModal = ({
  open,
  onClose,
  packageType,
  packageId,
  packageTitle,
  registrationStatus,
  onSubmitSuccess,
  onConfirmStart,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [socialUsername, setSocialUsername] = useState("");
  const [commentLink, setCommentLink] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Reset form inputs when opened fresh
  useEffect(() => {
    if (open && !registrationStatus) {
      setSelectedPlatform("instagram");
      setSocialUsername("");
      setCommentLink("");
      setContactEmail("");
    }
  }, [open, registrationStatus]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleOpenSocialMedia = () => {
    const socialMediaLinks = {
      instagram: "https://instagram.com/stubia.id",
      x: "https://x.com/stubia_id",
    };
    window.open(socialMediaLinks[selectedPlatform], "_blank");
  };

  const handleSubmit = async () => {
    if (!socialUsername.trim()) {
      toast.error("Masukkan username IG atau X kamu");
      return;
    }
    if (!commentLink.trim()) {
      toast.error("Masukkan link komentar atau repost kamu");
      return;
    }
    if (!contactEmail.trim()) {
      toast.error("Masukkan email akun Stubia kamu");
      return;
    }
    if (!isValidEmail(contactEmail)) {
      toast.error("Format email tidak valid");
      return;
    }

    try {
      setSubmitting(true);
      await tryoutService.registerForTryout({
        package_type: packageType,
        package_id: packageId,
        social_username: socialUsername.trim(),
        comment_link: commentLink.trim(),
        platform: selectedPlatform,
        contact_email: contactEmail.trim(),
      });

      toast.success("Registrasi berhasil! Menunggu verifikasi admin.");
      onSubmitSuccess();
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const status = registrationStatus?.status;
  const showForm = !status || status === "rejected";
  const platformLabel = selectedPlatform === "instagram" ? "Instagram" : "X (Twitter)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-20 sm:p-5 sm:pt-20 md:pt-24 pb-6 overflow-y-auto"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" />

      {/* Modal Container - Styled to match Stubia theme */}
      <div
        className="relative w-full max-w-4xl bg-[#faf8ff] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#c2c6d8]/40 animate-in zoom-in-95 fade-in duration-200 text-[#191b24] mb-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "calc(100vh - 110px)" }}
      >
        {/* Modal Header */}
        <div className="bg-[#f2f3ff] px-6 py-4 sm:px-8 sm:py-5 border-b border-[#dae1ff] flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0050cb] text-white flex items-center justify-center shadow-md shadow-blue-500/15 shrink-0">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#0050cb] text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  AKSES GRATIS
                </span>
                <span className="text-[12px] text-[#727687] font-semibold hidden sm:inline">
                  {packageTitle}
                </span>
              </div>
              <h2 className="text-[18px] sm:text-[22px] font-extrabold text-[#191b24] leading-snug">
                Verifikasi Akses Tryout
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#dae1ff] border border-[#c2c6d8]/40 text-[#424656] flex items-center justify-center transition-all shrink-0"
            title="Tutup Modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 overflow-y-auto max-h-[calc(100vh-190px)]">
          {/* Status: Approved */}
          {status === "approved" && (
            <div className="bg-white rounded-2xl p-8 border border-[#a5d6a7] shadow-[0_4px_20px_rgba(0,80,203,0.05)] text-center my-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#10b981] text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#191b24] mb-2">
                Verifikasi Akses Berhasil!
              </h3>
              <p className="text-sm text-[#424656] max-w-md mx-auto mb-6 leading-relaxed">
                Pendaftaran tryout gratis kamu sudah disetujui admin. Kamu dapat langsung memulai pengerjaan subtes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-5 py-2.5 rounded-xl border border-[#c2c6d8] hover:bg-[#faf8ff] text-[#424656] font-bold text-sm transition-all"
                >
                  Nanti Saja
                </button>
                <button
                  type="button"
                  onClick={onConfirmStart || onClose}
                  className="w-full px-5 py-2.5 rounded-xl text-white bg-[#0050cb] hover:bg-[#003da1] font-bold text-sm transition-all shadow-md shadow-blue-500/15"
                >
                  Ya, Mulai Tryout
                </button>
              </div>
            </div>
          )}

          {/* Status: Pending */}
          {status === "pending" && (
            <div className="bg-white rounded-2xl p-8 border border-[#ffe082] shadow-[0_4px_20px_rgba(0,80,203,0.05)] text-center my-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f59e0b] text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="material-symbols-outlined text-[36px]">hourglass_top</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#191b24] mb-2">
                Menunggu Verifikasi Admin
              </h3>
              <p className="text-sm text-[#424656] max-w-md mx-auto mb-6 leading-relaxed">
                Registrasi kamu sedang diverifikasi oleh admin Stubia. Notifikasi akan dikirimkan ke email akun kamu.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fff8e1] text-[#92400e] text-xs font-bold border border-[#ffe082]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] animate-pulse" />
                <span>Status: Menunggu Persetujuan Admin</span>
              </div>
            </div>
          )}

          {/* Status: Rejected Warning Banner */}
          {status === "rejected" && (
            <div className="mb-6 p-4 rounded-xl bg-[#ffebee] border border-[#ffcdd2] flex items-start gap-3">
              <span className="material-symbols-outlined text-[#ef4444] text-[22px] shrink-0 mt-0.5">error</span>
              <div>
                <h4 className="text-sm font-bold text-[#b71c1c]">Verifikasi Ditolak</h4>
                {registrationStatus?.rejection_reason && (
                  <p className="text-xs text-[#c62828] mt-1">Alasan: {registrationStatus.rejection_reason}</p>
                )}
                <p className="text-xs text-[#727687] mt-1.5">
                  Silakan perbaiki data di bawah dan kirim ulang verifikasi kamu.
                </p>
              </div>
            </div>
          )}

          {/* Submission Form Grid */}
          {showForm && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Step 1 / Card B: Select Platform (Order 1 on mobile, Top-Right on desktop) */}
              <div className="order-1 lg:order-2 lg:col-start-6 lg:col-span-7 lg:row-start-1 bg-white rounded-2xl p-5 sm:p-6 border border-[#c2c6d8]/30 shadow-[0_4px_20px_rgba(0,80,203,0.03)] space-y-3">
                <label className="text-[12px] font-bold uppercase tracking-wider text-[#727687] block mb-1">
                  1. Pilih Platform Media Sosial
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Instagram option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform("instagram")}
                    className={`p-3.5 rounded-xl border transition-all text-left flex items-center gap-3 ${
                      selectedPlatform === "instagram"
                        ? "border-[#E1306C] bg-pink-50/40 ring-2 ring-[#E1306C]/20"
                        : "border-[#c2c6d8]/50 hover:border-[#c2c6d8] bg-white"
                    }`}
                    disabled={submitting}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ background: "linear-gradient(135deg, #E1306C, #C13584)" }}
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#191b24]">Instagram</p>
                      <p className="text-[10px] text-[#727687]">Follow, Repost &amp; Tag</p>
                    </div>
                  </button>

                  {/* X Twitter option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform("x")}
                    className={`p-3.5 rounded-xl border transition-all text-left flex items-center gap-3 ${
                      selectedPlatform === "x"
                        ? "border-black bg-gray-50 ring-2 ring-black/10"
                        : "border-[#c2c6d8]/50 hover:border-[#c2c6d8] bg-white"
                    }`}
                    disabled={submitting}
                  >
                    <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center text-[#fff] shrink-0 shadow-sm">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#191b24]">X (Twitter)</p>
                      <p className="text-[10px] text-[#727687]">Follow, Repost &amp; Tag</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2 / Card A: Requirements & Instructions (Order 2 on mobile, Left Column on desktop) */}
              <div className="order-2 lg:order-1 lg:col-start-1 lg:col-span-5 lg:row-start-1 lg:row-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-[#c2c6d8]/30 shadow-[0_4px_20px_rgba(0,80,203,0.03)] space-y-4">
                <div className="flex items-center gap-2 text-[#0050cb] pb-3 border-b border-[#f2f3ff]">
                  <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
                  <h3 className="text-[15px] font-bold text-[#191b24]">2. Persyaratan Akses Gratis</h3>
                </div>

                <div className="space-y-3.5 text-[13px] text-[#424656]">
                  {/* Requirement 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#f2f3ff] text-[#0050cb] font-extrabold text-[12px] flex items-center justify-center shrink-0 mt-0.5 border border-[#dae1ff]">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-[#191b24]">Follow Media Sosial Official</p>
                      <p className="text-[12px] text-[#727687]">
                        Follow akun {platformLabel} {selectedPlatform === "instagram" ? "@stubia.id" : "@stubia_id"}
                      </p>
                    </div>
                  </div>

                  {/* Requirement 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#f2f3ff] text-[#0050cb] font-extrabold text-[12px] flex items-center justify-center shrink-0 mt-0.5 border border-[#dae1ff]">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-[#191b24]">Repost Story / Posting Ulang</p>
                      <p className="text-[12px] text-[#727687]">Wajib repost story atau posting ulang info tryout Stubia di akunmu</p>
                    </div>
                  </div>

                  {/* Requirement 3 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#f2f3ff] text-[#0050cb] font-extrabold text-[12px] flex items-center justify-center shrink-0 mt-0.5 border border-[#dae1ff]">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-[#191b24]">Tag 3 Teman di Komentar</p>
                      <p className="text-[12px] text-[#727687]">Tag 3 teman pejuang PTN di kolom komentar postingan tryout</p>
                    </div>
                  </div>
                </div>

                {/* Direct Link Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOpenSocialMedia}
                    disabled={submitting}
                    className="w-full py-2.5 px-4 bg-[#f2f3ff] hover:bg-[#dae1ff] border border-[#0050cb]/20 text-[#0050cb] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <span>Kunjungi {platformLabel} Stubia</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </button>
                </div>
              </div>

              {/* Step 3 / Card C: Verification Data Form (Order 3 on mobile, Bottom-Right on desktop) */}
              <div className="order-3 lg:order-3 lg:col-start-6 lg:col-span-7 lg:row-start-2 bg-white rounded-2xl p-5 sm:p-6 border border-[#c2c6d8]/30 shadow-[0_4px_20px_rgba(0,80,203,0.03)] space-y-4">
                <label className="text-[12px] font-bold uppercase tracking-wider text-[#727687] block mb-1">
                  3. Data Verifikasi Kamu
                </label>

                {/* Username Input */}
                <div>
                  <label className="text-xs font-semibold text-[#424656] mb-1 block">
                    Username {platformLabel}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#727687]">
                      alternate_email
                    </span>
                    <input
                      type="text"
                      value={socialUsername}
                      onChange={(e) => setSocialUsername(e.target.value)}
                      placeholder="Contoh: @namakamu"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#c2c6d8] bg-[#faf8ff] text-sm text-[#191b24] focus:bg-white focus:border-[#0050cb] focus:ring-2 focus:ring-[#0050cb]/15 outline-none transition-all"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Comment / Repost Link Input */}
                <div>
                  <label className="text-xs font-semibold text-[#424656] mb-1 block">
                    Link Komentar / Proof Repost Story
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#727687]">
                      link
                    </span>
                    <input
                      type="url"
                      value={commentLink}
                      onChange={(e) => setCommentLink(e.target.value)}
                      placeholder={
                        selectedPlatform === "instagram"
                          ? "https://www.instagram.com/p/..."
                          : "https://x.com/.../status/..."
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#c2c6d8] bg-[#faf8ff] text-sm text-[#191b24] focus:bg-white focus:border-[#0050cb] focus:ring-2 focus:ring-[#0050cb]/15 outline-none transition-all"
                      disabled={submitting}
                    />
                  </div>
                  <p className="text-[11px] text-[#727687] mt-1">
                    Tempelkan link komentar atau proof repost story kamu yang telah me-tag 3 teman.
                  </p>
                </div>

                {/* Email Input */}
                <div>
                  <label className="text-xs font-semibold text-[#424656] mb-1 block">
                    Email Akun Stubia
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#727687]">
                      mail
                    </span>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Email terdaftar di Stubia"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#c2c6d8] bg-[#faf8ff] text-sm text-[#191b24] focus:bg-white focus:border-[#0050cb] focus:ring-2 focus:ring-[#0050cb]/15 outline-none transition-all"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      !socialUsername.trim() ||
                      !commentLink.trim() ||
                      !contactEmail.trim()
                    }
                    className="w-full py-3.5 rounded-xl text-white font-extrabold text-sm transition-all shadow-md shadow-blue-500/15 hover:shadow-blue-500/25 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                    style={{
                      background:
                        submitting ||
                        !socialUsername.trim() ||
                        !commentLink.trim() ||
                        !contactEmail.trim()
                          ? "#94a3b8"
                          : "#0050cb",
                    }}
                  >
                    {submitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                        <span>Mengirim Verifikasi...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        <span>Kirim Verifikasi Akses</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-[#727687] text-center mt-2">
                    Dengan mengirim, kamu mengonfirmasi telah follow, repost story &amp; tag 3 teman di postingan.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TryoutVerificationModal;
