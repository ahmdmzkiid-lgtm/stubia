const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const sourceUrl = process.argv[2];
const destUrl = process.env.DATABASE_URL;

if (!sourceUrl) {
  console.error('❌ Error: Silakan masukkan URL database lama sebagai argumen.');
  console.error('Penggunaan: node scripts/migrate_db.js "postgresql://user:pass@host:port/db"');
  process.exit(1);
}

if (!destUrl) {
  console.error('❌ Error: DATABASE_URL tidak ditemukan di file .env.');
  process.exit(1);
}

// Menentukan urutan tabel berdasarkan foreign key dependency
const tablesToMigrate = [
  { name: 'users', conflict: 'id' },
  { name: 'subjects', conflict: 'id' },
  { name: 'topics', conflict: 'id' },
  { name: 'tryout_packages', conflict: 'id' },
  { name: 'plans', conflict: 'id' },
  { name: 'questions', conflict: 'id' },
  { name: 'answer_choices', conflict: 'id' },
  { name: 'tryout_sessions', conflict: 'id' },
  { name: 'user_answers', conflict: 'id' },
  { name: 'bookmarks', conflict: 'id' },
  { name: 'site_settings', conflict: 'key' },
  { name: 'subscriptions', conflict: 'id' },
  { name: 'vouchers', conflict: 'id' },
  { name: 'payment_transactions', conflict: 'id' },
  { name: 'latihan_sessions', conflict: 'id' },
  { name: 'ujian_mandiri', conflict: 'id' },
  { name: 'um_tryout_packages', conflict: 'id' },
  { name: 'um_latihan_soal', conflict: 'id' },
  { name: 'um_questions', conflict: 'id' },
  { name: 'um_answer_choices', conflict: 'id' },
  { name: 'um_tryout_sessions', conflict: 'id' },
  { name: 'um_user_answers', conflict: 'id' },
  { name: 'tryout_registrations', conflict: 'id' },
  { name: 'user_social_verifications', conflict: 'id' },
  { name: 'team_members', conflict: 'id' },
  { name: 'user_vouchers', conflict: 'id' },
  { name: 'order_items', conflict: 'id' },
  { name: 'battle_matches', conflict: 'id' },
  { name: 'battle_participants', conflict: 'id' },
  { name: 'battle_leaderboard', conflict: 'id' },
  { name: 'migrations_run', conflict: 'filename' }
];

async function runMigration() {
  console.log('🔗 Menghubungkan ke database lama...');
  const sourceClient = new Client({
    connectionString: sourceUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  console.log('🔗 Menghubungkan ke database baru...');
  const destClient = new Client({
    connectionString: destUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await sourceClient.connect();
    console.log('✅ Berhasil terhubung ke database lama (Source).');
    
    await destClient.connect();
    console.log('✅ Berhasil terhubung ke database baru (Destination).');

    for (const table of tablesToMigrate) {
      console.log(`\n⏳ Memulai migrasi untuk tabel: "${table.name}"...`);

      // Cek apakah tabel ada di database sumber
      const tableCheck = await sourceClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table.name]);

      if (!tableCheck.rows[0].exists) {
        console.log(`⏭️  Tabel "${table.name}" tidak ada di database lama. Dilewati.`);
        continue;
      }

      // Ambil semua data dari database sumber
      const { rows } = await sourceClient.query(`SELECT * FROM "${table.name}"`);
      if (rows.length === 0) {
        console.log(`✅ Tabel "${table.name}" kosong di database lama. Tidak ada data untuk dipindahkan.`);
        continue;
      }

      console.log(`📦 Ditemukan ${rows.length} data di tabel "${table.name}". Memindahkan...`);

      let insertedCount = 0;
      let skippedCount = 0;

      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);

        const colNamesStr = columns.map(c => `"${c}"`).join(', ');
        const valPlaceholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        let queryText = `INSERT INTO "${table.name}" (${colNamesStr}) VALUES (${valPlaceholders})`;
        
        if (table.conflict) {
          if (table.conflict === 'key') {
            // Update jika ada konflik pada key settings
            const updateStr = columns
              .filter(c => c !== table.conflict)
              .map(c => `"${c}" = EXCLUDED."${c}"`)
              .join(', ');
            queryText += ` ON CONFLICT ("${table.conflict}") DO UPDATE SET ${updateStr}`;
          } else {
            // Lewati jika ada konflik (misal UUID sudah ada)
            queryText += ` ON CONFLICT ("${table.conflict}") DO NOTHING`;
          }
        }

        try {
          const res = await destClient.query(queryText, values);
          if (res.rowCount > 0) {
            insertedCount++;
          } else {
            skippedCount++;
          }
        } catch (err) {
          console.error(`❌ Gagal memindahkan baris di tabel "${table.name}":`, err.message);
        }
      }

      console.log(`✅ Selesai untuk tabel "${table.name}": ${insertedCount} berhasil dipindahkan, ${skippedCount} dilewati (sudah ada).`);
    }

    console.log('\n🎉 SELURUH DATA BERHASIL DIMIGRASIKAN DENGAN AMAN!');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat proses migrasi data:', error);
  } finally {
    await sourceClient.end().catch(() => {});
    await destClient.end().catch(() => {});
  }
}

runMigration();
