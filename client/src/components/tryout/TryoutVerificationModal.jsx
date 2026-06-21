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

  // Lock body scroll when open
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

  // Reset form when modal opens fresh (no existing status)
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
      x: "https://x.com/eduzet",
    };
    window.open(socialMediaLinks[selectedPlatform], "_blank");
  };

  const handleSubmit = async () => {
    if (!socialUsername.trim()) {
      toast.error("Masukkan username IG atau X kamu");
      return;
    }
    if (!commentLink.trim()) {
      toast.error("Masukkan link komentar kamu");
      return;
    }
    if (!contactEmail.trim()) {
      toast.error("Masukkan email kontak kamu");
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
        contact_email: contactEmail,
      });

      toast.success("Registrasi berhasil! Menunggu verifikasi admin.");
      onSubmitSuccess();
    } catch (err) {
      // Error toast handled by axios interceptor
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const status = registrationStatus?.status;
  const showForm = !status || status === "rejected";
  const platformLabel =
    selectedPlatform === "instagram" ? "Instagram" : "X (Twitter)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div
          className="relative px-6 pt-6 pb-4"
          style={{
            background:
              "linear-gradient(135deg, #0050cb 0%, #3b82f6 50%, #6366f1 100%)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[22px]">
                verified
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Verifikasi Akses Tryout
              </h2>
              <p className="text-sm text-blue-100">{packageTitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          className="px-6 py-5 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 120px)" }}
        >
          {/* ── Status: Approved ── */}
          {status === "approved" && (
            <div className="text-center py-6">
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                }}
              >
                <span className="material-symbols-outlined text-white text-[32px]">
                  check_circle
                </span>
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: "#191b24" }}
              >
                Verifikasi Berhasil!
              </h3>
              <p className="text-sm mb-6 px-4" style={{ color: "#424656" }}>
                Akun Anda telah berhasil diverifikasi oleh admin. Apakah Anda
                ingin langsung memulai tryout?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl border border-[#c2c6d8] hover:bg-gray-50 text-[#424656] font-semibold text-sm transition-all"
                >
                  Nanti Saja
                </button>
                <button
                  type="button"
                  onClick={onConfirmStart || onClose}
                  className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #0050cb, #3b82f6)",
                  }}
                >
                  Ya, Mulai
                </button>
              </div>
            </div>
          )}

          {/* ── Status: Pending ── */}
          {status === "pending" && (
            <div className="text-center py-8">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ backgroundColor: "#f59e0b" }}
                />
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  }}
                >
                  <span className="material-symbols-outlined text-white text-[40px]">
                    hourglass_top
                  </span>
                </div>
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: "#191b24" }}
              >
                Menunggu Verifikasi
              </h3>
              <p className="text-sm mb-2" style={{ color: "#424656" }}>
                Registrasi kamu sedang ditinjau oleh admin. Kami akan
                menghubungi kamu melalui email yang sudah kamu berikan.
              </p>
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mt-2"
                style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "#f59e0b" }}
                />
                Menunggu verifikasi admin...
              </div>
            </div>
          )}

          {/* ── Status: Rejected ── */}
          {status === "rejected" && (
            <div
              className="mb-5 p-4 rounded-xl border"
              style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca" }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="material-symbols-outlined text-[20px] mt-0.5"
                  style={{ color: "#dc2626" }}
                >
                  error
                </span>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#991b1b" }}
                  >
                    Verifikasi Ditolak
                  </p>
                  {registrationStatus?.rejection_reason && (
                    <p className="text-sm mt-1" style={{ color: "#b91c1c" }}>
                      {registrationStatus.rejection_reason}
                    </p>
                  )}
                  <p className="text-xs mt-2" style={{ color: "#424656" }}>
                    Silakan perbaiki dan kirim ulang verifikasi kamu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Submission Form ── */}
          {showForm && (
            <>
              {/* Step 1: Choose Platform */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ backgroundColor: "#0050cb" }}
                  >
                    1
                  </span>
                  <h4
                    className="text-sm font-semibold"
                    style={{ color: "#191b24" }}
                  >
                    Pilih Platform Media Sosial
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Instagram Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform("instagram")}
                    className="relative p-4 rounded-xl border-2 transition-all text-left"
                    style={{
                      borderColor:
                        selectedPlatform === "instagram"
                          ? "#E1306C"
                          : "#e5e7eb",
                      background:
                        selectedPlatform === "instagram"
                          ? "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)"
                          : "#faf8ff",
                      boxShadow:
                        selectedPlatform === "instagram"
                          ? "0 0 0 3px rgba(225,48,108,0.12)"
                          : "none",
                    }}
                    disabled={submitting}
                  >
                    {selectedPlatform === "instagram" && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#E1306C" }}
                      >
                        <span className="material-symbols-outlined text-white text-[14px]">
                          check
                        </span>
                      </div>
                    )}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                      style={{
                        background:
                          "linear-gradient(135deg, #E1306C, #C13584, #833AB4)",
                      }}
                    >
                      <svg
                        className="w-5 h-5 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "#191b24" }}
                    >
                      Instagram
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "#727687" }}
                    >
                      Follow & tag 3 teman
                    </p>
                  </button>

                  {/* X / Twitter Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform("x")}
                    className="relative p-4 rounded-xl border-2 transition-all text-left"
                    style={{
                      borderColor:
                        selectedPlatform === "x" ? "#000" : "#e5e7eb",
                      background:
                        selectedPlatform === "x"
                          ? "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)"
                          : "#faf8ff",
                      boxShadow:
                        selectedPlatform === "x"
                          ? "0 0 0 3px rgba(0,0,0,0.08)"
                          : "none",
                    }}
                    disabled={submitting}
                  >
                    {selectedPlatform === "x" && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "#000" }}
                      >
                        <span className="material-symbols-outlined text-white text-[14px]">
                          check
                        </span>
                      </div>
                    )}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                      style={{ backgroundColor: "#000" }}
                    >
                      <svg
                        className="w-4.5 h-4.5 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        width="18"
                        height="18"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "#191b24" }}
                    >
                      X (Twitter)
                    </p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "#727687" }}
                    >
                      Follow & tag 3 teman
                    </p>
                  </button>
                </div>
              </div>

              {/* Step 2: Follow & Tag Instructions */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ backgroundColor: "#0050cb" }}
                  >
                    2
                  </span>
                  <h4
                    className="text-sm font-semibold"
                    style={{ color: "#191b24" }}
                  >
                    Follow & Tag 3 Teman di {platformLabel}
                  </h4>
                </div>

                <div
                  className="p-4 rounded-xl border"
                  style={{
                    borderColor: "#e5e7eb",
                    background:
                      selectedPlatform === "instagram"
                        ? "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)"
                        : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                  }}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{
                          backgroundColor:
                            selectedPlatform === "instagram"
                              ? "#E1306C"
                              : "#000",
                        }}
                      >
                        ✓
                      </div>
                      <p className="text-sm" style={{ color: "#191b24" }}>
                        <strong>Follow</strong> akun {platformLabel} kami
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{
                          backgroundColor:
                            selectedPlatform === "instagram"
                              ? "#E1306C"
                              : "#000",
                        }}
                      >
                        ✓
                      </div>
                      <p className="text-sm" style={{ color: "#191b24" }}>
                        <strong>Tag 3 teman</strong> di kolom komentar postingan
                        tryout ini
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenSocialMedia}
                  disabled={submitting}
                  className="w-full mt-3 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{
                    background:
                      selectedPlatform === "instagram"
                        ? "linear-gradient(135deg, #E1306C, #C13584)"
                        : "linear-gradient(135deg, #000, #424656)",
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    open_in_new
                  </span>
                  <span>Buka {platformLabel}</span>
                </button>
              </div>

              {/* Step 3: Username & Comment Link */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ backgroundColor: "#0050cb" }}
                  >
                    3
                  </span>
                  <h4
                    className="text-sm font-semibold"
                    style={{ color: "#191b24" }}
                  >
                    Username & Link Komentar
                  </h4>
                </div>

                {/* Username Input */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-[#424656] mb-1.5 block">
                    Username {platformLabel}
                  </label>
                  <div className="relative">
                    <span
                      className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]"
                      style={{ color: "#727687" }}
                    >
                      person
                    </span>
                    <input
                      type="text"
                      value={socialUsername}
                      onChange={(e) => setSocialUsername(e.target.value)}
                      placeholder="@username"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "#c2c6d8",
                        color: "#191b24",
                        backgroundColor: "#faf8ff",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#0050cb";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(0,80,203,0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#c2c6d8";
                        e.target.style.boxShadow = "none";
                      }}
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Comment Link Input */}
                <div>
                  <label className="text-xs font-semibold text-[#424656] mb-1.5 block">
                    Link Komentar
                  </label>
                  <div className="relative">
                    <span
                      className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]"
                      style={{ color: "#727687" }}
                    >
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
                      style={{
                        borderColor: "#c2c6d8",
                        color: "#191b24",
                        backgroundColor: "#faf8ff",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#0050cb";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(0,80,203,0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#c2c6d8";
                        e.target.style.boxShadow = "none";
                      }}
                      disabled={submitting}
                    />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "#727687" }}>
                    Salin link postingan tryout tempat kamu berkomentar dan tag
                    3 teman
                  </p>
                </div>
              </div>

              {/* Step 4: Email */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ backgroundColor: "#0050cb" }}
                  >
                    4
                  </span>
                  <h4
                    className="text-sm font-semibold"
                    style={{ color: "#191b24" }}
                  >
                    Email Akun Stubia
                  </h4>
                </div>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]"
                    style={{ color: "#727687" }}
                  >
                    mail
                  </span>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Email yang dipakai saat daftar Stubia"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2"
                    style={{
                      borderColor: "#c2c6d8",
                      color: "#191b24",
                      backgroundColor: "#faf8ff",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0050cb";
                      e.target.style.boxShadow = "0 0 0 3px rgba(0,80,203,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#c2c6d8";
                      e.target.style.boxShadow = "none";
                    }}
                    disabled={submitting}
                  />
                </div>
                <p className="text-xs mt-1.5" style={{ color: "#727687" }}>
                  Gunakan email yang sama dengan akun Stubia kamu. Notifikasi
                  hasil verifikasi akan dikirim ke email ini.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !socialUsername.trim() ||
                  !commentLink.trim() ||
                  !contactEmail.trim()
                }
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100 flex items-center justify-center gap-2"
                style={{
                  background:
                    submitting ||
                    !socialUsername.trim() ||
                    !commentLink.trim() ||
                    !contactEmail.trim()
                      ? "#94a3b8"
                      : "linear-gradient(135deg, #0050cb, #3b82f6)",
                }}
              >
                {submitting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      send
                    </span>
                    <span>Kirim Verifikasi</span>
                  </>
                )}
              </button>

              <p
                className="text-xs text-center mt-3"
                style={{ color: "#727687" }}
              >
                Dengan mengirim, kamu menyatakan telah follow dan tag 3 teman di
                kolom komentar
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TryoutVerificationModal;
