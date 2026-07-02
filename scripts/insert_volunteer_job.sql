-- Insert contoh lowongan volunter: Content Writer Volunteer
INSERT INTO job_vacancies (
  title,
  department,
  location,
  type,
  description,
  responsibilities,
  requirements,
  benefits,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Content Writer Volunteer',
  'Content & Curriculum',
  'Remote (Indonesia)',
  'Volunteer',
  'Stubia.id membuka kesempatan bagi kamu yang memiliki semangat menulis dan peduli terhadap kualitas pendidikan Indonesia untuk bergabung sebagai Content Writer Volunteer. Kamu akan berperan langsung dalam menciptakan konten blog edukatif yang membantu ribuan pejuang PTN mempersiapkan diri menghadapi UTBK-SNBT dan Ujian Mandiri PTN.',
  '- Menulis artikel blog berkualitas tinggi seputar tips belajar UTBK, strategi ujian, dan pembahasan soal
- Melakukan riset mendalam terkait materi UTBK dan ujian mandiri PTN (SIMAK UI, UTUL UGM, dll)
- Berkolaborasi dengan tim kurikulum untuk memastikan akurasi konten akademik
- Mengoptimalkan artikel untuk SEO agar mudah ditemukan calon siswa
- Mereview dan menyempurnakan draft artikel sebelum dipublikasikan
- Mengikuti briefing mingguan bersama tim konten',
  '- Sedang atau telah menempuh pendidikan S1 dari jurusan apapun (diutamakan Bahasa Indonesia, Komunikasi, Pendidikan, atau IPA/IPS)
- Memiliki kemampuan menulis artikel yang baik, informatif, dan mudah dipahami
- Paham konteks UTBK-SNBT dan/atau ujian mandiri PTN (pernah mengikuti atau mempersiapkan diri)
- Mampu menghasilkan minimal 2 artikel per minggu secara konsisten
- Bersedia bekerja secara remote dan fleksibel
- Tidak diperlukan pengalaman profesional sebelumnya — semangat belajar adalah yang utama!',
  '- Sertifikat Resmi Volunteer dari Stubia.id
- Pengalaman kerja nyata yang bisa dicantumkan di CV/LinkedIn
- Akses Premium Stubia.id selama masa volunteer (senilai Rp150.000)
- Mentoring langsung dari tim konten profesional Stubia
- Kesempatan direkrut sebagai staf tetap berdasarkan performa
- Komunitas belajar dan networking bersama sesama pejuang PTN',
  true,
  NOW(),
  NOW()
);
