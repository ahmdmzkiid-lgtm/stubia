const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM_EMAIL || "noreply@stubia.id";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Stubia";

// ─── Shared helpers ─────────────────────────────────────────────────────────

function baseTemplate({ preheader = "", body }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Stubia</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif;">

  <!-- Preheader (hidden preview text) -->
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</span>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f0f4ff;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"
          style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,80,203,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0050cb 0%,#0038a0 100%);padding:32px 40px;text-align:center;">
              <img src="https://stubia.id/stubiabrandicon.png" alt="Stubia" height="44"
                style="display:inline-block;height:44px;" onerror="this.style.display='none'" />
              <div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.65);letter-spacing:2px;text-transform:uppercase;font-weight:600;">
                Platform Persiapan UTBK
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${body}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#e8ecf8;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#8b95b0;">
                Email ini dikirim secara otomatis oleh sistem Stubia. Mohon tidak membalas email ini.
              </p>
              <p style="margin:0;font-size:11px;color:#b0b8cc;">
                &copy; ${new Date().getFullYear()} Stubia &mdash; stubia.id &nbsp;|&nbsp;
                <a href="https://stubia.id/privacy-policy" style="color:#0050cb;text-decoration:none;">Kebijakan Privasi</a>
                &nbsp;|&nbsp;
                <a href="https://stubia.id/contact-us" style="color:#0050cb;text-decoration:none;">Bantuan</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton({ href, label, color = "#0050cb" }) {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto 0;">
    <tr>
      <td style="border-radius:10px;background-color:${color};">
        <a href="${href}" target="_blank"
          style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.3px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function infoBox({ rows, borderColor = "#0050cb", bgColor = "#f0f4ff" }) {
  const rowsHtml = rows
    .map(
      ([label, value]) => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#727687;width:140px;">${label}</td>
      <td style="padding:8px 0;font-size:13px;font-weight:700;color:#191b24;text-align:right;">${value}</td>
    </tr>`,
    )
    .join("");

  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
    style="background-color:${bgColor};border-radius:10px;border-left:4px solid ${borderColor};padding:16px 20px;margin:20px 0;">
    <tr><td>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${rowsHtml}
      </table>
    </td></tr>
  </table>`;
}

/**
 * Core send function via Brevo API
 */
async function sendEmail({ toEmail, toName, subject, html }) {
  if (!BREVO_API_KEY) {
    console.warn("⚠️ BREVO_API_KEY is not configured. Email will not be sent.");
    return null;
  }
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: toEmail, name: toName || toEmail }],
        subject,
        htmlContent: html,
      }),
    });

    const result = await response.json();
    if (!response.ok)
      throw new Error(result.message || `HTTP ${response.status}`);
    console.log(
      `✉️  Email sent to ${toEmail} — Message ID: ${result.messageId}`,
    );
    return result;
  } catch (error) {
    console.error("❌ Failed to send email via Brevo:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. WELCOME EMAIL — dikirim saat user baru registrasi
// ─────────────────────────────────────────────────────────────────────────────
async function sendWelcomeEmail(userEmail, userName) {
  const firstName = userName.split(" ")[0];
  const subject = `Halo ${firstName}, akun Stubia-mu sudah siap!`;
  const html = baseTemplate({
    preheader: `Selamat bergabung di Stubia, ${firstName}! Akun kamu sudah aktif dan siap digunakan.`,
    body: `
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#191b24;line-height:1.2;">
        Selamat datang, <span style="color:#0050cb;">${firstName}!</span>
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#424656;line-height:1.7;">
        Akun Stubia-mu sudah berhasil dibuat. Kini kamu sudah bisa mulai mempersiapkan UTBK / Ujian Mandiri
        dengan ribuan soal latihan, tryout simulasi, dan pembahasan berbasis AI — semuanya
        dalam satu platform.
      </p>

      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#191b24;">
        Apa yang bisa kamu lakukan sekarang?
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#424656;">
            📚 &nbsp;<strong>Latihan Soal</strong> — ribuan soal, dari Mudah sampai HOTS
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#424656;">
            🎯 &nbsp;<strong>Tryout Simulasi</strong> — simulasi UTBK realistis dengan skor IRT
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#424656;">
            🤖 &nbsp;<strong>Tanya Bia</strong> — AI tutor siap bantu strategi belajar & info PTN
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#424656;">
            📊 &nbsp;<strong>Analisis Performa</strong> — pantau perkembangan belajarmu setiap saat
          </td>
        </tr>
      </table>

      ${ctaButton({ href: "https://stubia.id/dashboard", label: "Mulai Belajar Sekarang →" })}

      <p style="margin:24px 0 0;font-size:13px;color:#8b95b0;text-align:center;line-height:1.6;">
        Butuh bantuan? Hubungi kami di
        <a href="https://stubia.id/contact-us" style="color:#0050cb;text-decoration:none;">stubia.id/contact-us</a>
        atau balas langsung ke email tim kami.
      </p>
    `,
  });
  return sendEmail({ toEmail: userEmail, toName: userName, subject, html });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PREMIUM ACTIVATION EMAIL — dikirim saat pembayaran berhasil
// ─────────────────────────────────────────────────────────────────────────────
async function sendPremiumPlanActivatedEmail(
  userEmail,
  userName,
  planName,
  price,
  orderId,
) {
  const firstName = userName.split(" ")[0];
  const formattedPrice =
    price === 0
      ? "Gratis (voucher)"
      : new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          minimumFractionDigits: 0,
        }).format(price);

  const isSultan = planName.toLowerCase().includes("sultan");
  const isUM =
    planName.toLowerCase().includes("mandiri") ||
    planName.toLowerCase().includes("um");
  const accentColor = isSultan ? "#1a1a2e" : isUM ? "#0d9488" : "#0050cb";

  const subject = `Yeay! Paket ${planName}-mu sudah aktif, ${firstName}!`;
  const html = baseTemplate({
    preheader: `Pembayaran ${planName} berhasil! Akses premium kamu sudah terbuka penuh.`,
    body: `
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#191b24;line-height:1.2;">
        Selamat, <span style="color:${accentColor};">${firstName}!</span>
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#424656;line-height:1.7;">
        Pembayaran paket <strong>${planName}</strong> kamu sudah berhasil dikonfirmasi.
        Akses premium-mu langsung aktif sekarang — tidak perlu menunggu apapun lagi!
      </p>

      ${infoBox({
        borderColor: accentColor,
        bgColor: isSultan ? "#f5f5f7" : "#f0f4ff",
        rows: [
          ["Nama Paket", planName],
          ["Total Pembayaran", formattedPrice],
          ["Order ID", orderId],
          ["Status", "✅ Aktif"],
        ],
      })}

      <p style="margin:20px 0 12px;font-size:14px;font-weight:700;color:#191b24;">
        Apa yang sudah terbuka untukmu?
      </p>
      ${
        isSultan
          ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td style="padding:8px 0;font-size:14px;color:#424656;">💎 &nbsp;Akses <strong>semua</strong> latihan soal UTBK & Ujian Mandiri</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#424656;">💎 &nbsp;Akses <strong>semua</strong> tryout UTBK & Ujian Mandiri tanpa batas</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#424656;">💎 &nbsp;Pembahasan soal lengkap berbasis AI sepuasnya</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#424656;">💎 &nbsp;Analisis performa & prediksi skor IRT</td></tr>
      </table>`
          : isUM
            ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td style="padding:8px 0;font-size:14px;color:#424656;">🎯 &nbsp;Akses penuh <strong>semua latihan soal</strong> Ujian Mandiri</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#424656;">🎯 &nbsp;Akses penuh <strong>semua tryout</strong> Ujian Mandiri (SIMAK UI, UTUL UGM, dll)</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#424656;">🎯 &nbsp;Pembahasan lengkap & analisis performa</td></tr>
      </table>`
            : `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td style="padding:8px 0;font-size:14px;color:#424656;">🚀 &nbsp;Akses penuh <strong>semua latihan soal UTBK</strong> tanpa batas</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#424656;">🚀 &nbsp;Akses penuh <strong>semua tryout UTBK</strong></td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#424656;">🚀 &nbsp;Pembahasan soal lengkap berbasis AI</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#424656;">🚀 &nbsp;Analisis performa & prediksi skor IRT</td></tr>
      </table>`
      }

      ${ctaButton({ href: "https://stubia.id/dashboard", label: "Buka Dashboard-ku →", color: accentColor })}

      <p style="margin:24px 0 0;font-size:13px;color:#8b95b0;text-align:center;line-height:1.6;">
        Ada pertanyaan tentang langgananmu? Hubungi kami di
        <a href="https://stubia.id/contact-us" style="color:#0050cb;text-decoration:none;">stubia.id/contact-us</a>.
      </p>
    `,
  });
  return sendEmail({ toEmail: userEmail, toName: userName, subject, html });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TRYOUT REGISTRATION SUBMITTED — dikirim saat user mengirim bukti verifikasi
// ─────────────────────────────────────────────────────────────────────────────
async function sendTryoutRegistrationSubmittedEmail(
  contactEmail,
  userName,
  packageTitle,
  packageType,
  platform,
) {
  const firstName = userName.split(" ")[0];
  const typeLabel = packageType === "um" ? "Ujian Mandiri" : "UTBK";
  const platformLabel = platform === "x" ? "X (Twitter)" : "Instagram";
  const subject = `Bukti verifikasimu sudah kami terima, ${firstName}! ⏳`;
  const html = baseTemplate({
    preheader: `Pendaftaran tryout ${packageTitle} sudah masuk. Admin kami sedang memproses verifikasimu.`,
    body: `
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#191b24;line-height:1.2;">
        Bukti diterima, <span style="color:#f59e0b;">${firstName}!</span> ⏳
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#424656;line-height:1.7;">
        Kami sudah menerima bukti verifikasi sosial media kamu untuk tryout berikut.
        Tim admin Stubia akan memproses dan memverifikasinya secepatnya — biasanya
        <strong>dalam 1×24 jam</strong>.
      </p>

      ${infoBox({
        borderColor: "#f59e0b",
        bgColor: "#fffbeb",
        rows: [
          ["Paket Tryout", packageTitle],
          ["Tipe", typeLabel],
          ["Platform", platformLabel],
          ["Status", "⏳ Menunggu Verifikasi Admin"],
        ],
      })}

      <p style="margin:20px 0;font-size:14px;color:#424656;line-height:1.7;">
        Kamu akan mendapat email konfirmasi di alamat ini begitu verifikasi selesai.
        Pastikan kamu <strong>tetap mem-follow akun Stubia</strong> dan <strong>link komentarmu aktif</strong>
        selama proses berlangsung.
      </p>

      <p style="margin:0;font-size:14px;color:#424656;line-height:1.7;">
        Sambil menunggu, kamu masih bisa belajar dan latihan soal gratis di dashboard Stubia!
      </p>

      ${ctaButton({ href: "https://stubia.id/dashboard", label: "Buka Dashboard →", color: "#f59e0b" })}

      <p style="margin:24px 0 0;font-size:13px;color:#8b95b0;text-align:center;line-height:1.6;">
        Pertanyaan? Hubungi kami di
        <a href="https://stubia.id/contact-us" style="color:#0050cb;text-decoration:none;">stubia.id/contact-us</a>.
      </p>
    `,
  });
  return sendEmail({ toEmail: contactEmail, toName: userName, subject, html });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TRYOUT REGISTRATION APPROVED — dikirim saat admin menyetujui
// ─────────────────────────────────────────────────────────────────────────────
async function sendTryoutRegistrationApprovedEmail(
  userEmail,
  userName,
  packageTitle,
  packageType,
) {
  const firstName = userName.split(" ")[0];
  const typeLabel = packageType === "um" ? "Ujian Mandiri" : "UTBK";
  const linkPath = packageType === "um" ? "/ujian-mandiri" : "/tryout/packages";
  const subject = `Verifikasi disetujui! Tryout ${packageTitle} sudah bisa kamu mulai!`;
  const html = baseTemplate({
    preheader: `Kabar baik! Pendaftaran tryout ${packageTitle}-mu sudah disetujui oleh admin Stubia.`,
    body: `
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#191b24;line-height:1.2;">
        Verifikasi berhasil, <span style="color:#10b981;">${firstName}!</span>
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#424656;line-height:1.7;">
        Kabar gembira! Admin Stubia telah <strong>menyetujui</strong> bukti verifikasi sosial media kamu.
        Tryout di bawah ini sudah bisa langsung kamu kerjakan!
      </p>

      ${infoBox({
        borderColor: "#10b981",
        bgColor: "#f0fdf9",
        rows: [
          [
            "Paket Tryout",
            `<span style="color:#065f46;">${packageTitle}</span>`,
          ],
          ["Tipe", typeLabel],
          ["Status", "✅ Disetujui — Siap dikerjakan"],
        ],
      })}

      <p style="margin:20px 0;font-size:14px;color:#424656;line-height:1.7;">
        Kamu punya <strong>1 kesempatan</strong> untuk mengerjakan paket tryout ini secara gratis.
        Pastikan kamu sudah siap dan berada di tempat yang nyaman sebelum memulai, ya!
      </p>
      <p style="margin:0;font-size:14px;color:#424656;line-height:1.7;">
        Ingin akses tryout tanpa batas? Upgrade ke paket Premium atau Sultan kapan saja.
      </p>

      ${ctaButton({ href: `https://stubia.id${linkPath}`, label: "Kerjakan Tryout Sekarang →", color: "#10b981" })}

      <p style="margin:24px 0 0;font-size:13px;color:#8b95b0;text-align:center;line-height:1.6;">
        Semangat, ${firstName}! Tim Stubia percaya kamu bisa meraih PTN impianmu.
      </p>
    `,
  });
  return sendEmail({ toEmail: userEmail, toName: userName, subject, html });
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TRYOUT REGISTRATION REJECTED — dikirim saat admin menolak
// ─────────────────────────────────────────────────────────────────────────────
async function sendTryoutRegistrationRejectedEmail(
  userEmail,
  userName,
  packageTitle,
  reason,
) {
  const firstName = userName.split(" ")[0];
  const defaultReason =
    "Bukti verifikasi tidak valid, tidak lengkap, atau tidak sesuai ketentuan.";
  const subject = `Verifikasi belum berhasil nih, ${firstName} — yuk coba lagi 🔄`;
  const html = baseTemplate({
    preheader: `Sayangnya verifikasi tryout ${packageTitle}-mu belum disetujui. Kamu bisa mendaftar ulang!`,
    body: `
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#191b24;line-height:1.2;">
        Oops, belum berhasil nih, <span style="color:#ef4444;">${firstName}</span>
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#424656;line-height:1.7;">
        Mohon maaf, admin Stubia belum bisa menyetujui pendaftaran verifikasi sosial media kamu
        untuk paket tryout <strong>${packageTitle}</strong>. Tapi jangan khawatir —
        kamu bisa mendaftar ulang setelah memperbaiki buktinya!
      </p>

      ${infoBox({
        borderColor: "#ef4444",
        bgColor: "#fff5f5",
        rows: [
          ["Paket Tryout", packageTitle],
          ["Status", "❌ Tidak Disetujui"],
          ["Alasan", reason || defaultReason],
        ],
      })}

      <p style="margin:20px 0 12px;font-size:14px;font-weight:700;color:#191b24;">
        Langkah selanjutnya:
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td style="padding:6px 0;font-size:14px;color:#424656;">
          1️⃣ &nbsp;Pastikan kamu <strong>follow akun resmi Stubia</strong> di platform yang dipilih
        </td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#424656;">
          2️⃣ &nbsp;Tinggalkan <strong>komentar yang sesuai</strong> di postingan yang ditentukan
        </td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#424656;">
          3️⃣ &nbsp;Salin <strong>link komentar</strong>-mu yang valid dan dapat diakses
        </td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#424656;">
          4️⃣ &nbsp;Kembali ke dashboard dan <strong>daftar ulang</strong> dengan data yang sudah benar
        </td></tr>
      </table>

      ${ctaButton({ href: "https://stubia.id/dashboard", label: "Daftar Ulang di Dashboard →", color: "#ef4444" })}

      <p style="margin:24px 0 0;font-size:13px;color:#8b95b0;text-align:center;line-height:1.6;">
        Ingin akses tryout tanpa verifikasi? Pertimbangkan upgrade ke paket
        <a href="https://stubia.id/dashboard#pricing-plans" style="color:#0050cb;text-decoration:none;">Premium atau Sultan</a>.
      </p>
    `,
  });
  return sendEmail({ toEmail: userEmail, toName: userName, subject, html });
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. LATIHAN SOCIAL VERIFICATION APPROVED — dikirim ke contact_email
// ─────────────────────────────────────────────────────────────────────────────
async function sendLatihanVerificationApprovedEmail(
  contactEmail,
  userName,
  platform,
) {
  const firstName = userName.split(" ")[0];
  const platformLabel = platform === "x" ? "X (Twitter)" : "Instagram";
  const subject = `Akses latihan soal gratis-mu sudah terbuka, ${firstName}!`;
  const html = baseTemplate({
    preheader: `Verifikasi sosial media kamu disetujui! Latihan soal gratis sudah bisa diakses penuh.`,
    body: `
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#191b24;line-height:1.2;">
        Akses terbuka, <span style="color:#0050cb;">${firstName}!</span>
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#424656;line-height:1.7;">
        Selamat! Admin Stubia sudah memverifikasi bukti follow & komentar ${platformLabel}-mu.
        Kamu sekarang bisa mengakses <strong>latihan soal gratis</strong> secara penuh melalui dashboard Stubia.
      </p>

      ${infoBox({
        borderColor: "#0050cb",
        bgColor: "#f0f4ff",
        rows: [
          ["Platform", platformLabel],
          ["Status", "✅ Disetujui — Akses aktif"],
          ["Berlaku untuk", "Seluruh latihan soal gratis"],
        ],
      })}

      <p style="margin:20px 0;font-size:14px;color:#424656;line-height:1.7;">
        Manfaatkan akses ini sebaik mungkin untuk persiapan UTBK-mu.
        Untuk akses <strong>tidak terbatas</strong> termasuk tryout dan pembahasan AI,
        kamu bisa upgrade ke paket Premium atau Sultan kapan saja.
      </p>

      ${ctaButton({ href: "https://stubia.id/latihan", label: "Mulai Latihan Soal →" })}

      <p style="margin:24px 0 0;font-size:13px;color:#8b95b0;text-align:center;line-height:1.6;">
        Semangat belajar, ${firstName}! Stubia selalu ada untuk mendukung perjalananmu 💙
      </p>
    `,
  });
  return sendEmail({ toEmail: contactEmail, toName: userName, subject, html });
}

module.exports = {
  sendWelcomeEmail,
  sendPremiumPlanActivatedEmail,
  sendTryoutRegistrationSubmittedEmail,
  sendTryoutRegistrationApprovedEmail,
  sendTryoutRegistrationRejectedEmail,
  sendLatihanVerificationApprovedEmail,
};
