const { Client } = require('pg');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_nZyNj0oOY8us@ep-odd-heart-ao3cui14-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const emails = [
  'imam43826@gmail.com',
  'latisyakhadijah42@gmail.com',
  'huwaiedaaizzatie@gmail.com',
  'ahmadmuzakiy31@gmail.com'
];

async function main() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔗 Terhubung ke database...');

    // 1. Dapatkan plan_id untuk premium_um
    const planRes = await client.query("SELECT id FROM plans WHERE name = 'premium_um' LIMIT 1");
    if (planRes.rows.length === 0) {
      console.error('❌ Plan premium_um tidak ditemukan di database.');
      return;
    }
    const umPlanId = planRes.rows[0].id;
    console.log(`✅ ID Plan premium_um: ${umPlanId}`);

    for (const email of emails) {
      console.log(`\n⏳ Memproses email: ${email}`);

      // 2. Dapatkan user_id dari email
      const userRes = await client.query("SELECT id, name FROM users WHERE email = $1 LIMIT 1", [email]);
      if (userRes.rows.length === 0) {
        console.log(`⚠️ User dengan email ${email} tidak ditemukan di database.`);
        continue;
      }
      const user = userRes.rows[0];
      console.log(`👤 User ditemukan: ${user.name} (${user.id})`);

      // 3. Dapatkan masa berlaku subscription UTBK ('premium') aktif mereka
      const subRes = await client.query(`
        SELECT s.expires_at FROM subscriptions s
        JOIN plans p ON p.id = s.plan_id
        WHERE s.user_id = $1 AND p.name = 'premium' AND s.status = 'active'
        ORDER BY s.expires_at DESC LIMIT 1
      `, [user.id]);

      let expiresAt = new Date();
      // Tambahkan 6 bulan (180 hari) sebagai fallback jika tidak ada subscription aktif di tabel
      expiresAt.setDate(expiresAt.getDate() + 180);

      if (subRes.rows.length > 0) {
        expiresAt = subRes.rows[0].expires_at;
        console.log(`📅 Menyamakan masa berlaku UTBK: ${expiresAt.toISOString()}`);
      } else {
        console.log(`⚠️ Tidak ada subscription 'premium' aktif di tabel. Menggunakan masa aktif 180 hari ke depan: ${expiresAt.toISOString()}`);
      }

      // 4. Periksa apakah subscription premium_um sudah ada untuk user ini
      const checkSub = await client.query(
        "SELECT id FROM subscriptions WHERE user_id = $1 AND plan_id = $2 LIMIT 1",
        [user.id, umPlanId]
      );

      if (checkSub.rows.length > 0) {
        // Update
        await client.query(
          "UPDATE subscriptions SET status = 'active', expires_at = $1, started_at = NOW() WHERE id = $2",
          [expiresAt, checkSub.rows[0].id]
        );
        console.log(`🔄 Berhasil memperbarui akses Premium Ujian Mandiri ke ${user.name}`);
      } else {
        // Insert
        await client.query(
          "INSERT INTO subscriptions (user_id, plan_id, status, started_at, expires_at) VALUES ($1, $2, 'active', NOW(), $3)",
          [user.id, umPlanId, expiresAt]
        );
        console.log(`🎉 Berhasil memberikan akses Premium Ujian Mandiri ke ${user.name}`);
      }
    }

  } catch (err) {
    console.error('❌ Terjadi kesalahan:', err);
  } finally {
    await client.end();
  }
}

main();
