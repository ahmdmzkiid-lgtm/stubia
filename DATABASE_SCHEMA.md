# Dokumentasi Struktur Tabel Database Stubia (PostgreSQL)

Dokumen ini berisi detail dari seluruh tabel yang ada di dalam database PostgreSQL Stubia yang digunakan untuk pengembangan (Pre-Production/Development). Setiap kali ada perubahan atau penambahan struktur tabel baru melalui file migrasi SQL, pastikan untuk memperbarui dokumen ini.

---

## Ringkasan Tabel

| No | Nama Tabel | Deskripsi |
|---|---|---|
| 1 | `users` | Menyimpan data pengguna (siswa dan admin) |
| 2 | `subjects` | Mata pelajaran yang diujikan dalam UTBK/SNBT |
| 3 | `topics` | Sub-topik spesifik di bawah suatu mata pelajaran (untuk latihan soal) |
| 4 | `questions` | Bank soal untuk UTBK/SNBT |
| 5 | `answer_choices` | Pilihan jawaban untuk soal UTBK/SNBT |
| 6 | `tryout_packages` | Paket tryout UTBK/SNBT |
| 7 | `tryout_sessions` | Sesi pengerjaan tryout UTBK/SNBT oleh pengguna |
| 8 | `user_answers` | Detail jawaban pengguna untuk setiap soal tryout UTBK |
| 9 | `bookmarks` | Soal-soal yang disimpan/ditandai oleh pengguna |
| 10 | `site_settings` | Pengaturan situs (key-value store untuk konten dinamis admin) |
| 11 | `plans` | Paket langganan atau kuota tryout yang ditawarkan |
| 12 | `subscriptions` | Langganan aktif dan kuota pengguna |
| 13 | `payment_transactions` | Catatan transaksi pembayaran menggunakan Midtrans |
| 14 | `latihan_sessions` | Sesi pengerjaan latihan soal (UTBK & Ujian Mandiri) |
| 15 | `ujian_mandiri` | Daftar universitas & ujian mandiri (SIMAK UI, UTUL UGM, dll) |
| 16 | `um_tryout_packages` | Paket tryout Ujian Mandiri |
| 17 | `um_latihan_soal` | Paket latihan soal Ujian Mandiri |
| 18 | `um_questions` | Bank soal khusus Ujian Mandiri |
| 19 | `um_answer_choices` | Pilihan jawaban untuk soal Ujian Mandiri |
| 20 | `um_tryout_sessions` | Sesi pengerjaan tryout Ujian Mandiri |
| 21 | `um_user_answers` | Detail jawaban pengguna untuk tryout Ujian Mandiri |
| 22 | `tryout_registrations` | Pendaftaran verifikasi sosial media untuk tryout gratis |
| 23 | `notifications` (DEPRECATED) | *(Tidak digunakan lagi / Dihapus dari aplikasi)* |
| 24 | `user_social_verifications` | Verifikasi sosial media pengguna untuk akses latihan |
| 25 | `team_members` | Data tim Stubia (CEO, Curriculum, Developer, dll) |
| 26 | `vouchers` | Kode promo/voucher diskon pembayaran |
| 27 | `user_vouchers` | Pelacakan penggunaan voucher oleh pengguna |
| 28 | `order_items` | Item keranjang belanja dalam satu transaksi pembayaran |
| 29 | `battle_matches` | Sesi pertandingan Battle Soal antar siswa |
| 30 | `battle_participants` | Peserta yang tergabung dalam suatu Battle Soal |
| 31 | `battle_leaderboard` | Papan peringkat (leaderboard) Battle Soal per mata pelajaran |
| 32 | `migrations_run` | Log file migrasi SQL yang telah dieksekusi |

---

## Detail Struktur Tabel

### 1. `users`
Menyimpan data otentikasi dan profil pengguna.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `email` (`VARCHAR(255)`, Unique, Not Null)
*   `password_hash` (`VARCHAR(255)`, Not Null)
*   `name` (`VARCHAR(255)`, Not Null)
*   `role` (`VARCHAR(20)`, Default: `'student'`, Check: `student`, `admin`)
*   `current_plan` (`VARCHAR(50)`, Default: `'gratis'`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 2. `subjects`
Mata pelajaran utama UTBK (TPS, TKA Saintek, TKA Soshum).
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `name` (`VARCHAR(100)`, Not Null) - *e.g., 'Penalaran Matematika'*
*   `category` (`VARCHAR(50)`, Not Null, Check: `TPS`, `TKA_SAINTEK`, `TKA_SOSHUM`)
*   `duration_minutes` (`INT`, Default: `90`)
*   `title` (`VARCHAR(255)`)
*   `description` (`TEXT`)
*   `icon` (`VARCHAR(100)`)
*   `bg_color` (`VARCHAR(20)`)
*   `icon_color` (`VARCHAR(20)`)
*   `required_plan` (`VARCHAR(20)`, Default: `'gratis'`)
*   `is_active` (`BOOLEAN`, Default: `TRUE`)

### 3. `topics`
Kategori/sub-topik di bawah mata pelajaran untuk fitur latihan soal terfokus.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `subject_id` (`UUID`, FK referencing `subjects(id)` ON DELETE CASCADE)
*   `title` (`VARCHAR(255)`, Not Null)
*   `description` (`TEXT`)
*   `icon` (`VARCHAR(100)`)
*   `questions_count` (`VARCHAR(50)`)
*   `difficulty_level` (`VARCHAR(50)`, Default: `'Dasar'`)
*   `card_type` (`VARCHAR(50)`, Default: `'standard'`)
*   `is_popular` (`BOOLEAN`, Default: `FALSE`)
*   `is_featured` (`BOOLEAN`, Default: `FALSE`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 4. `questions`
Bank soal latihan dan tryout untuk kategori UTBK/SNBT.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `subject_id` (`UUID`, FK referencing `subjects(id)` ON DELETE CASCADE)
*   `topic_id` (`UUID`, FK referencing `topics(id)` ON DELETE SET NULL)
*   `tryout_package_id` (`UUID`, FK referencing `tryout_packages(id)` ON DELETE SET NULL)
*   `content` (`TEXT`, Not Null) - *Teks soal*
*   `image_url` (`TEXT`)
*   `image_position` (`VARCHAR(20)`, Default: `'after'`, Check: `before`, `after`)
*   `difficulty` (`VARCHAR(20)`, Default: `'medium'`, Check: `easy`, `medium`, `hard`)
*   `question_type` (`VARCHAR(20)`, Default: `'multiple_choice'`, Check: `multiple_choice`, `short_answer`)
*   `source` (`VARCHAR(100)`, Default: `'manual'`)
*   `display_order` (`INT`)
*   `content_hash` (`VARCHAR(64)`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 5. `answer_choices`
Pilihan jawaban (A-E) untuk soal bertipe pilihan ganda UTBK.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `question_id` (`UUID`, FK referencing `questions(id)` ON DELETE CASCADE)
*   `label` (`CHAR(1)`, Not Null, Check: `A`, `B`, `C`, `D`, `E`)
*   `content` (`TEXT`, Not Null) - *Isi teks jawaban*
*   `is_correct` (`BOOLEAN`, Default: `FALSE`)
*   `explanation` (`TEXT`) - *Pembahasan/solusi dari jawaban ini*

### 6. `tryout_packages`
Paket pengerjaan simulasi ujian UTBK/SNBT.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `title` (`VARCHAR(255)`, Unique, Not Null)
*   `subject_config` (`JSONB`, Not Null) - *Konfigurasi waktu dan jumlah soal per subtes*
*   `scheduled_at` (`TIMESTAMP`)
*   `is_public` (`BOOLEAN`, Default: `TRUE`)
*   `is_active` (`BOOLEAN`, Default: `TRUE`)
*   `required_plan` (`VARCHAR(20)`, Default: `'gratis'`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 7. `tryout_sessions`
Mencatat sesi pengerjaan tryout UTBK oleh siswa.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `user_id` (`UUID`, FK referencing `users(id)`)
*   `package_id` (`UUID`, FK referencing `tryout_packages(id)`)
*   `started_at` (`TIMESTAMP`, Default: `NOW()`)
*   `submitted_at` (`TIMESTAMP`)
*   `total_score` (`FLOAT`)
*   `score_breakdown` (`JSONB`)

### 8. `user_answers`
Menyimpan jawaban yang dipilih/diketik pengguna untuk setiap butir soal di tryout UTBK.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `session_id` (`UUID`, FK referencing `tryout_sessions(id)` ON DELETE CASCADE)
*   `question_id` (`UUID`, FK referencing `questions(id)`)
*   `chosen_choice_id` (`UUID`, FK referencing `answer_choices(id)`)
*   `answer_text` (`TEXT`) - *Diisi jika tipe soal short_answer*
*   `is_flagged` (`BOOLEAN`, Default: `FALSE`) - *Ditandai ragu-ragu*
*   `time_spent_sec` (`INT`, Default: `0`)
*   `position` (`INT`, Default: `0`) - *Urutan tampil soal dalam sesi*

### 9. `bookmarks`
Menyimpan soal-soal favorit yang di-bookmark oleh siswa.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `user_id` (`UUID`, FK referencing `users(id)`)
*   `question_id` (`UUID`, FK referencing `questions(id)`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)
*   *Constraint: UNIQUE(user_id, question_id)*

### 10. `site_settings`
Penyimpanan berbasis Key-Value untuk konfigurasi admin global dinamis (banner text, jadwal dsb).
*   `key` (`VARCHAR(100)`, PK)
*   `value` (`TEXT`, Not Null)
*   `updated_at` (`TIMESTAMP`, Default: `NOW()`)

### 11. `plans`
Paket langganan premium dan kuota tryout yang bisa dibeli siswa.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `name` (`VARCHAR(50)`, Unique, Not Null) - *e.g., 'premium', 'sultan'*
*   `display_name` (`VARCHAR(100)`, Not Null)
*   `description` (`TEXT`)
*   `price` (`INTEGER`, Default: `0`, Not Null)
*   `duration_days` (`INTEGER`, Default: `30`, Not Null)
*   `features` (`JSONB`, Default: `'[]'`)
*   `is_popular` (`BOOLEAN`, Default: `FALSE`)
*   `sort_order` (`INTEGER`, Default: `0`)
*   `is_active` (`BOOLEAN`, Default: `TRUE`)
*   `plan_type` (`VARCHAR(20)`, Default: `'subscription'`, Check: `subscription`, `quota`, `access`)
*   `target_type` (`VARCHAR(20)`, Default: `'utbk'`, Check: `utbk`, `um`)
*   `quota_limit` (`INTEGER`, Default: `NULL`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 12. `subscriptions`
Mencatat paket aktif yang dimiliki pengguna serta sisa kuota tryout.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `user_id` (`UUID`, FK referencing `users(id)` ON DELETE CASCADE, Not Null)
*   `plan_id` (`UUID`, FK referencing `plans(id)`, Not Null)
*   `status` (`VARCHAR(20)`, Default: `'active'`, Check: `active`, `expired`, `cancelled`)
*   `quota_remaining` (`INTEGER`, Default: `NULL`)
*   `started_at` (`TIMESTAMP`, Default: `NOW()`)
*   `expires_at` (`TIMESTAMP`, Not Null)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 13. `payment_transactions`
Log pembayaran Midtrans Gateway untuk pembelian plan/paket belajar.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `user_id` (`UUID`, FK referencing `users(id)` ON DELETE CASCADE, Not Null)
*   `plan_id` (`UUID`, FK referencing `plans(id)` NULL)
*   `voucher_id` (`UUID`, FK referencing `vouchers(id)` ON DELETE SET NULL)
*   `order_id` (`VARCHAR(100)`, Unique, Not Null)
*   `midtrans_transaction_id` (`VARCHAR(255)`)
*   `amount` (`INTEGER`, Not Null)
*   `status` (`VARCHAR(30)`, Default: `'pending'`, Check: `pending`, `capture`, `settlement`, `deny`, `cancel`, `expire`, `failure`, `refund`)
*   `payment_type` (`VARCHAR(50)`)
*   `snap_token` (`VARCHAR(255)`)
*   `snap_redirect_url` (`TEXT`)
*   `raw_response` (`JSONB`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)
*   `updated_at` (`TIMESTAMP`, Default: `NOW()`)

### 14. `latihan_sessions`
Mencatat hasil latihan soal mandiri siswa, baik kategori UTBK maupun Ujian Mandiri.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `user_id` (`UUID`, FK referencing `users(id)` ON DELETE CASCADE)
*   `subject_id` (`UUID`, FK referencing `subjects(id)` ON DELETE CASCADE NULL)
*   `topic_id` (`UUID`, FK referencing `topics(id)` ON DELETE SET NULL NULL)
*   `latihan_id` (`UUID`, FK referencing `um_latihan_soal(id)` ON DELETE SET NULL NULL)
*   `subject_name` (`VARCHAR(255)`)
*   `total_questions` (`INT`, Default: `0`)
*   `correct_count` (`INT`, Default: `0`)
*   `incorrect_count` (`INT`, Default: `0`)
*   `unanswered_count` (`INT`, Default: `0`)
*   `irt_score` (`FLOAT`, Default: `200`)
*   `theta` (`FLOAT`, Default: `-4`)
*   `percentile` (`INT`, Default: `1`)
*   `score_breakdown` (`JSONB`)
*   `started_at` (`TIMESTAMP`, Default: `NOW()`)
*   `submitted_at` (`TIMESTAMP`, Default: `NOW()`)

### 15. `ujian_mandiri`
Informasi utama seleksi Ujian Mandiri universitas (SIMAK UI, UTUL UGM, SM-ITB dsb).
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `universitas` (`VARCHAR(255)`, Not Null)
*   `nama_ujian` (`VARCHAR(255)`, Not Null)
*   `status` (`VARCHAR(30)`, Default: `'open'`, Check: `open`, `coming-soon`, `closed`)
*   `deadline` (`VARCHAR(255)`)
*   `lokasi` (`VARCHAR(255)`)
*   `image` (`TEXT`)
*   `logo` (`TEXT`)
*   `detail_link` (`TEXT`)
*   `display_order` (`INT`, Default: `0`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)
*   `updated_at` (`TIMESTAMP`, Default: `NOW()`)

### 16. `um_tryout_packages`
Paket pengerjaan tryout simulasi Ujian Mandiri.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `ujian_id` (`UUID`, FK referencing `ujian_mandiri(id)` ON DELETE CASCADE)
*   `title` (`VARCHAR(255)`, Not Null)
*   `description` (`TEXT`)
*   `icon` (`VARCHAR(100)`, Default: `'auto_stories'`)
*   `icon_color` (`VARCHAR(20)`, Default: `'#0050cb'`)
*   `duration` (`INT`, Default: `120`)
*   `peserta` (`INT`, Default: `0`)
*   `display_order` (`INT`, Default: `0`)
*   `is_active` (`BOOLEAN`, Default: `TRUE`)
*   `required_plan` (`VARCHAR(20)`, Default: `'gratis'`)
*   `points_correct` (`INT`, Default: `4`)
*   `points_incorrect` (`INT`, Default: `-1`)
*   `points_unanswered` (`INT`, Default: `0`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 17. `um_latihan_soal`
Modul latihan mandiri per mata uji seleksi mandiri universitas.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `ujian_id` (`UUID`, FK referencing `ujian_mandiri(id)` ON DELETE CASCADE)
*   `title` (`VARCHAR(255)`, Not Null)
*   `description` (`TEXT`)
*   `category` (`VARCHAR(100)`)
*   `icon` (`VARCHAR(100)`, Default: `'auto_stories'`)
*   `icon_bg_color` (`VARCHAR(20)`, Default: `'#0050cb'`)
*   `category_color` (`VARCHAR(20)`, Default: `'#0050cb'`)
*   `button_style` (`VARCHAR(20)`, Default: `'filled'`)
*   `display_order` (`INT`, Default: `0`)
*   `is_active` (`BOOLEAN`, Default: `TRUE`)
*   `required_plan` (`VARCHAR(20)`, Default: `'gratis'`)
*   `points_correct` (`INT`, Default: `4`)
*   `points_incorrect` (`INT`, Default: `-1`)
*   `points_unanswered` (`INT`, Default: `0`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 18. `um_questions`
Bank soal pengerjaan Tryout / Latihan Ujian Mandiri.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `tryout_package_id` (`UUID`, FK referencing `um_tryout_packages(id)` ON DELETE CASCADE NULL)
*   `latihan_id` (`UUID`, FK referencing `um_latihan_soal(id)` ON DELETE CASCADE NULL)
*   `content` (`TEXT`, Not Null)
*   `image_url` (`TEXT`)
*   `image_position` (`VARCHAR(20)`, Default: `'after'`, Check: `before`, `after`)
*   `difficulty` (`VARCHAR(20)`, Default: `'medium'`, Check: `easy`, `medium`, `hard`)
*   `display_order` (`INT`, Default: `0`)
*   `content_hash` (`VARCHAR(64)`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)
*   *Constraint: Harus berupa soal Tryout ATAU Latihan, tidak boleh keduanya sekaligus.*

### 19. `um_answer_choices`
Pilihan jawaban (A-E) soal Ujian Mandiri.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `question_id` (`UUID`, FK referencing `um_questions(id)` ON DELETE CASCADE)
*   `label` (`CHAR(1)`, Not Null, Check: `A`, `B`, `C`, `D`, `E`)
*   `content` (`TEXT`, Not Null)
*   `is_correct` (`BOOLEAN`, Default: `FALSE`)
*   `explanation` (`TEXT`)

### 20. `um_tryout_sessions`
Mencatat sesi tryout Mandiri siswa.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `user_id` (`UUID`, FK referencing `users(id)` ON DELETE CASCADE)
*   `package_id` (`UUID`, FK referencing `um_tryout_packages(id)` ON DELETE CASCADE)
*   `started_at` (`TIMESTAMP`, Default: `NOW()`)
*   `submitted_at` (`TIMESTAMP`)
*   `total_score` (`INT`)
*   `score_breakdown` (`JSONB`)

### 21. `um_user_answers`
Jawaban butir soal tryout Mandiri pengguna.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `session_id` (`UUID`, FK referencing `um_tryout_sessions(id)` ON DELETE CASCADE)
*   `question_id` (`UUID`, FK referencing `um_questions(id)` ON DELETE CASCADE)
*   `chosen_choice_id` (`UUID`, FK referencing `um_answer_choices(id)` ON DELETE SET NULL)
*   `is_flagged` (`BOOLEAN`, Default: `FALSE`)
*   `time_spent_sec` (`INT`, Default: `0`)
*   `position` (`INT`)

### 22. `tryout_registrations`
Pendaftaran verifikasi syarat media sosial untuk mengakses event tryout gratis.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `user_id` (`UUID`, FK referencing `users(id)` ON DELETE CASCADE)
*   `contact_email` (`VARCHAR(255)`, Not Null)
*   `package_type` (`VARCHAR(10)`, Not Null, Check: `utbk`, `um`)
*   `utbk_package_id` (`UUID`, FK referencing `tryout_packages(id)` ON DELETE SET NULL NULL)
*   `um_package_id` (`UUID`, FK referencing `um_tryout_packages(id)` ON DELETE SET NULL NULL)
*   `screenshot_url` (`TEXT` NULL) - *Kolom lama (untuk kompatibilitas)*
*   `screenshot_follow_url` (`TEXT`) - *SS bukti follow akun*
*   `screenshot_repost_url` (`TEXT`) - *SS bukti repost postingan*
*   `platform` (`VARCHAR(20)`, Default: `'instagram'`, Check: `instagram`, `x`)
*   `status` (`VARCHAR(20)`, Default: `'pending'`, Check: `pending`, `approved`, `rejected`)
*   `rejection_reason` (`TEXT`)
*   `admin_notes` (`TEXT`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)
*   `updated_at` (`TIMESTAMP`, Default: `NOW()`)

### 23. `notifications` (DEPRECATED)
*(Tabel ini sudah tidak digunakan lagi karena fitur notifikasi dihapus dari aplikasi)*
*   `id` (`UUID`, PK, Default: `gen_random_uuid()`)
*   `user_id` (`UUID`, FK referencing `users(id)` ON DELETE CASCADE)
*   `title` (`VARCHAR(255)`, Not Null)
*   `message` (`TEXT`, Not Null)
*   `image_url` (`TEXT`)
*   `is_read` (`BOOLEAN`, Default: `FALSE`)
*   `is_modal_shown` (`BOOLEAN`, Default: `FALSE`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 24. `user_social_verifications`
Pendaftaran verifikasi akun media sosial siswa untuk membuka fitur latihan soal tertentu.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `user_id` (`UUID`, FK referencing `users(id)` ON DELETE CASCADE)
*   `context` (`VARCHAR(50)`, Default: `'latihan'`)
*   `ig_username` (`VARCHAR(150)`)
*   `x_username` (`VARCHAR(150)`)
*   `status` (`VARCHAR(20)`, Default: `'pending'`, Check: `pending`, `approved`, `rejected`)
*   `rejection_reason` (`TEXT`)
*   `approved_at` (`TIMESTAMP`)
*   `reviewed_by` (`UUID`, FK referencing `users(id)` ON DELETE SET NULL)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 25. `team_members`
Daftar anggota tim/pengurus Stubia untuk halaman tim (about us).
*   `id` (`SERIAL`, PK)
*   `name` (`VARCHAR(255)`, Not Null)
*   `role` (`VARCHAR(255)`, Not Null)
*   `photo_url` (`TEXT`)
*   `bio` (`TEXT`)
*   `instagram_url` (`TEXT`)
*   `linkedin_url` (`TEXT`)
*   `display_order` (`INT`, Default: `0`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)
*   `updated_at` (`TIMESTAMP`, Default: `NOW()`)

### 26. `vouchers`
Kode diskon/promo voucher untuk pembelian paket belajar.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `code` (`VARCHAR(50)`, Unique, Not Null) - *e.g., 'STUBIANEW'*
*   `discount_type` (`VARCHAR(20)`, Not Null, Check: `percentage`, `fixed`)
*   `discount_value` (`INTEGER`, Not Null) - *Jumlah persentase (e.g., 20) atau nominal (e.g., 10000)*
*   `min_purchase` (`INTEGER`, Default: `0`)
*   `max_discount` (`INTEGER`, Default: `NULL`)
*   `expires_at` (`TIMESTAMP`, Not Null)
*   `usage_limit` (`INTEGER`, Default: `NULL`)
*   `usage_count` (`INTEGER`, Default: `0`)
*   `is_active` (`BOOLEAN`, Default: `TRUE`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 27. `user_vouchers`
Pencatatan penggunaan voucher per pengguna agar satu voucher (yang memiliki limit tertentu) tidak digunakan berulang kali secara tidak sah.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `user_id` (`UUID`, FK referencing `users(id)` ON DELETE CASCADE, Not Null)
*   `voucher_id` (`UUID`, FK referencing `vouchers(id)` ON DELETE CASCADE, Not Null)
*   `used_at` (`TIMESTAMP`, Default: `NOW()`)
*   `order_id` (`VARCHAR(100)`, Not Null)
*   *Constraint: UNIQUE(user_id, voucher_id)*

### 28. `order_items`
Rincian produk (paket belajar/plans) yang dibeli dalam satu transaksi pembayaran.
*   `id` (`UUID`, PK, Default: `uuid_generate_v4()`)
*   `transaction_id` (`UUID`, FK referencing `payment_transactions(id)` ON DELETE CASCADE, Not Null)
*   `plan_id` (`UUID`, FK referencing `plans(id)` ON DELETE CASCADE, Not Null)
*   `price` (`INTEGER`, Not Null)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 29. `battle_matches`
Informasi pertandingan Battle Soal UTBK multi-player realtime/semi-realtime antar siswa.
*   `id` (`UUID`, PK, Default: `gen_random_uuid()`)
*   `subject_id` (`UUID`, FK referencing `subjects(id)` ON DELETE CASCADE, Not Null)
*   `subject_name` (`VARCHAR(255)`, Not Null)
*   `question_count` (`INT`, Default: `5`)
*   `time_per_question` (`INT`, Default: `60`) - *Dalam detik per soal*
*   `status` (`VARCHAR(20)`, Default: `'waiting'`, Check: `waiting`, `active`, `completed`)
*   `created_by` (`UUID`, FK referencing `users(id)` ON DELETE SET NULL)
*   `question_ids` (`JSONB`, Default: `'[]'::jsonb`) - *Array UUID soal yang diujikan*
*   `current_question_index` (`INT`, Default: `0`)
*   `question_started_at` (`TIMESTAMP`)
*   `started_at` (`TIMESTAMP`)
*   `completed_at` (`TIMESTAMP`)
*   `created_at` (`TIMESTAMP`, Default: `NOW()`)

### 30. `battle_participants`
Peserta yang berpartisipasi di dalam Match Battle Soal.
*   `id` (`UUID`, PK, Default: `gen_random_uuid()`)
*   `match_id` (`UUID`, FK referencing `battle_matches(id)` ON DELETE CASCADE, Not Null)
*   `user_id` (`UUID`, FK referencing `users(id)` ON DELETE CASCADE, Not Null)
*   `score` (`INT`, Default: `0`)
*   `correct_count` (`INT`, Default: `0`)
*   `answers` (`JSONB`, Default: `'{}'::jsonb`) - *Jawaban peserta: { questionId: choiceId }*
*   `joined_at` (`TIMESTAMP`, Default: `NOW()`)
*   *Constraint: UNIQUE(match_id, user_id)*

### 31. `battle_leaderboard`
Rekapitulasi performa Battle Soal siswa untuk menampilkan peringkat global per mata pelajaran.
*   `id` (`UUID`, PK, Default: `gen_random_uuid()`)
*   `user_id` (`UUID`, FK referencing `users(id)` ON DELETE CASCADE, Not Null)
*   `subject_id` (`UUID`, FK referencing `subjects(id)` ON DELETE CASCADE, Not Null)
*   `subject_name` (`VARCHAR(255)`, Not Null)
*   `total_matches` (`INT`, Default: `0`)
*   `wins` (`INT`, Default: `0`)
*   `losses` (`INT`, Default: `0`)
*   `total_points` (`INT`, Default: `0`)
*   `updated_at` (`TIMESTAMP`, Default: `NOW()`)
*   *Constraint: UNIQUE(user_id, subject_id)*

### 32. `migrations_run`
Tabel pencatat internal untuk migrasi SQL otomatis.
*   `filename` (`VARCHAR(255)`, PK) - *Nama file SQL migrasi (e.g., '001_init.sql')*
*   `executed_at` (`TIMESTAMP`, Default: `NOW()`)
