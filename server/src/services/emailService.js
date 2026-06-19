const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM_EMAIL || "noreply@stubia.id";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Stubia";

// ─── Layout ──────────────────────────────────────────────────────────────────

function baseTemplate({ preheader = "", accentColor = "#0050cb", body }) {
  return `<!DOCTYPE html>
<html lang="id" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>Stubia</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f4f6fb;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f6fb;">
    <tr>
      <td align="center" style="padding:40px 16px 48px;">

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="580" style="max-width:580px;width:100%;">

          <!-- Logo bar -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <img src="https://stubia.id/stubiabrandicon.png" alt="Stubia" height="36"
                style="display:inline-block;height:36px;" onerror="this.style.display='none'"/>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">

              <!-- Accent bar -->
              <div style="height:4px;background:${accentColor};"></div>

              <!-- Content -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding:44px 48px 40px;">
                    ${body}
                  </td>
                </tr>
              </table>

              <!-- Promo strip -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                style="background-color:#fafafa;border-top:1px solid #f0f0f0;">
                <tr>
                  <td style="padding:28px 48px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom:10px;">
                          <span style="display:inline-block;font-size:10px;font-weight:700;color:#0050cb;text-transform:uppercase;letter-spacing:2px;border-bottom:1px solid #0050cb;padding-bottom:2px;">Penawaran Eksklusif</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="vertical-align:middle;padding-right:24px;">
                                <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#111827;line-height:1.3;">
                                  Diskon 65% untuk semua paket Premium
                                </p>
                                <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
                                  Masukkan kode berikut saat checkout dan hemat langsung.
                                </p>
                              </td>
                              <td style="vertical-align:middle;white-space:nowrap;">
                                <div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:8px;padding:10px 18px;text-align:center;">
                                  <span style="display:block;font-size:10px;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">Kode Voucher</span>
                                  <span style="font-size:19px;font-weight:800;color:#0050cb;letter-spacing:4px;font-family:'Courier New',Courier,monospace;">STUBIA65</span>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:18px;">
                          <a href="https://stubia.id/dashboard#pricing-plans"
                            style="display:inline-block;background:#0050cb;color:#ffffff;font-size:13px;font-weight:600;padding:11px 24px;border-radius:7px;text-decoration:none;letter-spacing:0.3px;">
                            Lihat Paket Belajar
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:28px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
                Email ini dikirim otomatis. Mohon tidak membalas langsung.
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} Stubia &nbsp;&middot;&nbsp;
                <a href="https://stubia.id/privacy-policy" style="color:#9ca3af;text-decoration:underline;">Kebijakan Privasi</a>
                &nbsp;&middot;&nbsp;
                <a href="https://stubia.id/contact-us" style="color:#9ca3af;text-decoration:underline;">Hubungi Kami</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function primaryButton({ href, label, color = "#0050cb" }) {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="border-radius:8px;background-color:${color};">
        <a href="${href}" target="_blank"
          style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function divider() {
  return `<div style="height:1px;background-color:#f0f0f0;margin:28px 0;"></div>`;
}

function detailTable(rows) {
  const rowsHtml = rows
    .map(
      ([label, value]) => `
    <tr>
      <td style="padding:10px 0;font-size:13px;color:#6b7280;border-bottom:1px solid #f3f4f6;width:45%;">${label}</td>
      <td style="padding:10px 0;font-size:13px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;text-align:right;">${value}</td>
    </tr>`,
    )
    .join("");
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
    style="border-radius:8px;border:1px solid #f3f4f6;overflow:hidden;margin:20px 0;">
    <tr>
      <td style="padding:0 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          ${rowsHtml}
        </table>
      </td>
    </tr>
  </table>`;
}

// ─── Core sender ─────────────────────────────────────────────────────────────

async function sendEmail({ toEmail, toName, subject, html }) {
  if (!BREVO_API_KEY) {
    console.warn("⚠️  BREVO_API_KEY tidak dikonfigurasi. Email tidak dikirim.");
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
    console.log(`✉️  Email terkirim ke ${toEmail} — ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error("❌ Gagal mengirim email via Brevo:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. WELCOME — Registrasi akun baru
// ─────────────────────────────────────────────────────────────────────────────
async function sendWelcomeEmail(userEmail, userName) {
  const firstName = userName.split(" ")[0];
  const subject = `Selamat datang di Stubia, ${firstName}`;

  const html = baseTemplate({
    preheader: `Akun kamu sudah aktif. Mulai persiapkan UTBK bersama Stubia sekarang.`,
    accentColor: "#0050cb",
    body: `
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#0050cb;text-transform:uppercase;letter-spacing:1.5px;">Akun Aktif</p>
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#111827;line-height:1.25;letter-spacing:-0.5px;">
        Halo, ${firstName}.
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Akun Stubia kamu telah berhasil dibuat. Kami senang kamu bergabung. Platform ini dirancang untuk membantu kamu mempersiapkan UTBK secara terstruktur — dari latihan soal harian hingga simulasi tryout penuh.
      </p>

      ${divider()}

      <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.5px;">Yang bisa kamu akses sekarang</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid #f3f4f6;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-size:13px;font-weight:600;color:#111827;width:36%;">Latihan Soal</td>
                <td style="font-size:13px;color:#6b7280;">Ribuan soal per bab, mudah hingga tingkat tinggi</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid #f3f4f6;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-size:13px;font-weight:600;color:#111827;width:36%;">Tryout Simulasi</td>
                <td style="font-size:13px;color:#6b7280;">Simulasi UTBK dengan timer dan sistem skor IRT</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:9px 0;border-bottom:1px solid #f3f4f6;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-size:13px;font-weight:600;color:#111827;width:36%;">Konsultasi Bia</td>
                <td style="font-size:13px;color:#6b7280;">AI tutor untuk strategi belajar dan info PTN</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:9px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-size:13px;font-weight:600;color:#111827;width:36%;">Analisis Performa</td>
                <td style="font-size:13px;color:#6b7280;">Lacak perkembangan belajar dan prediksi skormu</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
        Buka dashboard untuk mulai belajar. Jika ada pertanyaan, tim kami siap membantu di
        <a href="https://stubia.id/contact-us" style="color:#0050cb;text-decoration:none;font-weight:600;">stubia.id/contact-us</a>.
      </p>

      ${primaryButton({ href: "https://stubia.id/dashboard", label: "Buka Dashboard" })}
    `,
  });

  return sendEmail({ toEmail: userEmail, toName: userName, subject, html });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TRYOUT APPROVED — Admin menyetujui verifikasi tryout
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
  const subject = `Verifikasi disetujui — ${packageTitle}`;

  const html = baseTemplate({
    preheader: `Pendaftaran tryout ${packageTitle} kamu telah disetujui. Kamu siap untuk memulai.`,
    accentColor: "#059669",
    body: `
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#059669;text-transform:uppercase;letter-spacing:1.5px;">Verifikasi Disetujui</p>
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#111827;line-height:1.25;letter-spacing:-0.5px;">
        Pendaftaran kamu diterima, ${firstName}.
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Tim admin Stubia telah meninjau dan menyetujui bukti verifikasi sosial media kamu. Paket tryout di bawah ini sudah dapat kamu akses dan kerjakan sekarang.
      </p>

      ${detailTable([
        ["Paket Tryout", packageTitle],
        ["Kategori", typeLabel],
        ["Status", "Disetujui"],
      ])}

      <p style="margin:20px 0 24px;font-size:14px;color:#374151;line-height:1.7;">
        Perlu diingat bahwa akun gratis hanya mendapatkan <strong>satu kesempatan pengerjaan</strong> per paket tryout. Pastikan koneksi internet stabil dan kamu berada di tempat yang kondusif sebelum memulai.
      </p>

      ${primaryButton({ href: `https://stubia.id${linkPath}`, label: "Mulai Tryout", color: "#059669" })}
    `,
  });

  return sendEmail({ toEmail: userEmail, toName: userName, subject, html });
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TRYOUT REJECTED — Admin menolak verifikasi tryout
// ─────────────────────────────────────────────────────────────────────────────
async function sendTryoutRegistrationRejectedEmail(
  userEmail,
  userName,
  packageTitle,
  reason,
) {
  const firstName = userName.split(" ")[0];
  const defaultReason =
    "Bukti verifikasi tidak dapat dikonfirmasi. Pastikan akun sudah aktif mengikuti dan link komentar dapat diakses.";
  const subject = `Verifikasi belum dapat disetujui — ${packageTitle}`;

  const html = baseTemplate({
    preheader: `Pendaftaran tryout ${packageTitle} kamu memerlukan perbaikan. Kamu dapat mendaftar ulang.`,
    accentColor: "#dc2626",
    body: `
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:1.5px;">Perlu Perbaikan</p>
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#111827;line-height:1.25;letter-spacing:-0.5px;">
        Verifikasi belum berhasil, ${firstName}.
      </h1>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
        Kami telah meninjau bukti verifikasi yang kamu kirimkan, namun belum dapat kami setujui saat ini. Kamu dapat melakukan pendaftaran ulang setelah memperbaiki hal berikut.
      </p>

      ${detailTable([
        ["Paket Tryout", packageTitle],
        ["Status", "Belum Disetujui"],
        ["Alasan", reason || defaultReason],
      ])}

      ${divider()}

      <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:0.5px;">Langkah perbaikan</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-size:13px;font-weight:700;color:#111827;width:20px;vertical-align:top;">1.</td>
                <td style="font-size:13px;color:#374151;line-height:1.6;">Pastikan akun kamu sudah <strong>mengikuti (follow)</strong> akun resmi Stubia di platform yang dipilih.</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-size:13px;font-weight:700;color:#111827;width:20px;vertical-align:top;">2.</td>
                <td style="font-size:13px;color:#374151;line-height:1.6;">Tinggalkan komentar sesuai ketentuan pada postingan yang telah ditentukan.</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-size:13px;font-weight:700;color:#111827;width:20px;vertical-align:top;">3.</td>
                <td style="font-size:13px;color:#374151;line-height:1.6;">Salin link komentar yang valid dan dapat dibuka secara publik.</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-size:13px;font-weight:700;color:#111827;width:20px;vertical-align:top;">4.</td>
                <td style="font-size:13px;color:#374151;line-height:1.6;">Kembali ke dashboard Stubia dan kirimkan pendaftaran ulang dengan data yang telah diperbaiki.</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${divider()}

      <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">
        Sebagai alternatif, kamu dapat upgrade ke paket Premium untuk mendapatkan akses tryout tanpa batas verifikasi. Gunakan kode voucher di bawah untuk mendapatkan diskon eksklusif.
      </p>

      ${primaryButton({ href: "https://stubia.id/dashboard", label: "Daftar Ulang", color: "#dc2626" })}
    `,
  });

  return sendEmail({ toEmail: userEmail, toName: userName, subject, html });
}

module.exports = {
  sendWelcomeEmail,
  sendTryoutRegistrationApprovedEmail,
  sendTryoutRegistrationRejectedEmail,
};
