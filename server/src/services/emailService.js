const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM_EMAIL || 'noreply@stubia.id';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'Stubia';

/**
 * Utility to send email via Brevo v3 SMTP API using native fetch
 */
async function sendEmail({ toEmail, toName, subject, html }) {
  if (!BREVO_API_KEY) {
    console.warn('⚠️ BREVO_API_KEY is not configured in .env. Email will not be sent.');
    return null;
  }
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: FROM_NAME,
          email: FROM_EMAIL,
        },
        to: [
          {
            email: toEmail,
            name: toName || toEmail,
          }
        ],
        subject: subject,
        htmlContent: html,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    console.log(`✉️ Email successfully sent to ${toEmail} via Brevo. Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to send email via Brevo:', error);
    throw error;
  }
}

/**
 * 1. Send Welcome Email upon registration
 */
async function sendWelcomeEmail(userEmail, userName) {
  const subject = 'Selamat Datang di Stubia! 🚀';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Selamat Datang di Stubia! 🎉</h2>
      <p>Halo <strong>${userName}</strong>,</p>
      <p>Terima kasih telah bergabung dengan Stubia. Akun Anda telah berhasil dibuat dengan email <strong>${userEmail}</strong>.</p>
      <p>Sekarang Anda sudah bisa mulai mengerjakan latihan soal, tryout UTBK, dan melacak perkembangan kesiapan ujianmu.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://stubia.id/dashboard" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Mulai Belajar Sekarang</a>
      </div>
      <p>Jika Anda memiliki pertanyaan, jangan ragu untuk membalas email ini secara langsung.</p>
      <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888888; text-align: center;">&copy; ${new Date().getFullYear()} Stubia. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ toEmail: userEmail, toName: userName, subject, html });
}

/**
 * 2. Send Premium Plan Activation Email upon successful payment
 */
async function sendPremiumPlanActivatedEmail(userEmail, userName, planName, price, orderId) {
  const subject = 'Pembelian Paket Premium Stubia Berhasil! 👑';
  const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #fbbf24; text-align: center;">Paket Premium Anda Aktif! 👑</h2>
      <p>Halo <strong>${userName}</strong>,</p>
      <p>Pembayaran untuk pembelian paket <strong>${planName}</strong> telah berhasil diverifikasi.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin-top: 0;">Detail Transaksi:</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; color: #6b7280;">Order ID:</td><td style="text-align: right; font-weight: bold;">${orderId}</td></tr>
          <tr><td style="padding: 4px 0; color: #6b7280;">Nama Paket:</td><td style="text-align: right; font-weight: bold; color: #4f46e5;">${planName}</td></tr>
          <tr><td style="padding: 4px 0; color: #6b7280;">Total Pembayaran:</td><td style="text-align: right; font-weight: bold;">${formattedPrice}</td></tr>
          <tr><td style="padding: 4px 0; color: #6b7280;">Status:</td><td style="text-align: right; color: #10b981; font-weight: bold;">Berhasil / Aktif</td></tr>
        </table>
      </div>

      <p>Akses Premium Anda telah terbuka penuh! Anda sekarang bisa mengakses seluruh latihan soal, pembahasan lengkap berbasis AI, dan simulasi tryout tanpa batas.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://stubia.id/tryout" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Mulai Tryout Premium</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888888; text-align: center;">&copy; ${new Date().getFullYear()} Stubia. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ toEmail: userEmail, toName: userName, subject, html });
}

/**
 * 3. Send Tryout Verification Success Email
 */
async function sendTryoutRegistrationApprovedEmail(userEmail, userName, packageTitle, packageType) {
  const subject = 'Pendaftaran Tryout Stubia Berhasil Diverifikasi! 📝';
  const linkPath = packageType === 'um' ? '/ujian-mandiri' : '/tryout';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #10b981; text-align: center;">Verifikasi Pendaftaran Berhasil! 📝</h2>
      <p>Halo <strong>${userName}</strong>,</p>
      <p>Kabar gembira! Admin kami telah memverifikasi bukti pendaftaran sosial media Anda untuk paket tryout berikut:</p>
      
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-weight: bold; color: #065f46;">${packageTitle}</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #047857;">Tipe Paket: ${packageType.toUpperCase()}</p>
      </div>

      <p>Anda sekarang sudah dapat mengerjakan tryout tersebut secara gratis melalui dashboard akun Stubia Anda.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://stubia.id${linkPath}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Kerjakan Tryout Sekarang</a>
      </div>
      <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888888; text-align: center;">&copy; ${new Date().getFullYear()} Stubia. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ toEmail: userEmail, toName: userName, subject, html });
}

/**
 * 4. Send Tryout Verification Rejected Email
 */
async function sendTryoutRegistrationRejectedEmail(userEmail, userName, packageTitle, reason) {
  const subject = 'Pendaftaran Tryout Stubia Ditolak ⚠️';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #ef4444; text-align: center;">Verifikasi Pendaftaran Ditolak ⚠️</h2>
      <p>Halo <strong>${userName}</strong>,</p>
      <p>Mohon maaf, pendaftaran gratis Anda untuk paket tryout <strong>${packageTitle}</strong> belum disetujui oleh admin dengan alasan:</p>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-weight: bold; color: #991b1b;">Alasan Penolakan:</p>
        <p style="margin: 5px 0 0 0; color: #b91c1c;">${reason || 'Screenshot tidak valid atau kurang lengkap.'}</p>
      </div>

      <p>Silakan lakukan pendaftaran ulang dengan mengunggah bukti screenshot follow dan repost yang benar melalui dashboard Stubia.</p>
      <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #888888; text-align: center;">&copy; ${new Date().getFullYear()} Stubia. All rights reserved.</p>
    </div>
  `;
  return sendEmail({ toEmail: userEmail, toName: userName, subject, html });
}

module.exports = {
  sendWelcomeEmail,
  sendPremiumPlanActivatedEmail,
  sendTryoutRegistrationApprovedEmail,
  sendTryoutRegistrationRejectedEmail
};
