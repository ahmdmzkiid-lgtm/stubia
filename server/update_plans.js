const { Client } = require('pg');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_nZyNj0oOY8us@ep-odd-heart-ao3cui14-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔗 Terhubung ke database...');

    // 1. Matikan (deactive) plan 'utbk_6m' karena digantikan oleh 'premium'
    await client.query("UPDATE plans SET is_active = false WHERE name = 'utbk_6m'");
    console.log("✅ Plan 'utbk_6m' berhasil dinonaktifkan.");

    // 2. Update plan 'premium' agar harganya 70.000, durasi tetap 180 hari (6 bulan),
    //    deskripsi & fitur disamakan dengan utbk_6m, sort_order diubah ke 11 (posisi di grid)
    const features = JSON.stringify([
      "Akses penuh latihan soal UTBK",
      "Akses penuh tryout UTBK",
      "Pembahasan berbasis AI",
      "Analisis performa IRT"
    ]);

    await client.query(`
      UPDATE plans 
      SET 
        price = 70000,
        display_name = 'Premium',
        description = 'Akses Latihan Soal & Tryout UTBK/SNBT selama 6 bulan',
        features = $1,
        sort_order = 11,
        is_popular = true
      WHERE name = 'premium'
    `, [features]);
    console.log("✅ Plan 'premium' berhasil disesuaikan (Harga Rp70.000, 6 bulan, deskripsi diperbarui).");

  } catch (err) {
    console.error('❌ Gagal memperbarui plan:', err);
  } finally {
    await client.end();
  }
}

main();
