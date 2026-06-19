const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getApiKeyManager } = require('./apiKeyManager');

const initGemini = () => {
  const manager = getApiKeyManager();
  const genAI = manager.getNextGeminiInstance();

  if (!genAI) {
    throw new Error('All Gemini API keys are currently exhausted. Please try again later.');
  }

  return genAI;
};

/**
 * Execute a Gemini API operation with automatic retry and key rotation
 * @param {Function} operation - Async function that performs the Gemini API call
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise} Result from the operation
 */
const executeWithRetry = async (operation, maxRetries = 3) => {
  const manager = getApiKeyManager();
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Execute the operation
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if this is a rate limit error
      if (manager.isRateLimitError(error)) {
        console.warn(`[Gemini] Rate limit hit on attempt ${attempt}/${maxRetries}`);

        // Check if we have more keys available
        const availableKeys = manager.getAvailableKeysCount();

        if (availableKeys > 0 && attempt < maxRetries) {
          console.log(`[Gemini] Retrying with next available key (${availableKeys} keys remaining)...`);
          // The next attempt will automatically use the next key via initGemini()
          continue;
        } else {
          // No more keys or max retries reached
          throw new Error('Maaf ya, sistem sedang sibuk (semua API key mencapai batas). Coba lagi beberapa saat ya! 🙏');
        }
      } else {
        // Non-rate-limit error, don't retry
        throw error;
      }
    }
  }

  // If we get here, all retries failed
  throw lastError;
};

const chatWithKakZ = async (message, history = []) => {
  return executeWithRetry(async () => {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const systemPrompt = `Kamu adalah Stu, customer service yang ramah untuk platform Stubia.

TENTANG STUBIA:
Stubia adalah platform latihan soal dan tryout UTBK/SNBT. Fitur yang tersedia HANYA:
- Latihan soal (7 subtes)
- Tryout UTBK/SNBT
- Ujian Mandiri PTN
7 subtes: Penalaran Umum (PU), Pengetahuan dan Pemahaman Umum (PPU), Pemahaman Bacaan dan Tulisan (PBM), Pengetahuan Kuantitatif (PK), Literasi Bahasa Indonesia (LBI), Literasi Bahasa Inggris (LBE), Penalaran Matematika (PM).
Paket: Gratis (latihan terbatas), Premium Rp35.000/6 bulan (semua latihan + 10 tryout), Premium Ujian Mandiri Rp. 15.000/2 bulan (akses semua latihan soal dan tryout ujian mandiri), Sultan Rp60.000/tahun (semua latihan + semua tryout + konsultasi AI).

TUGASMU:
- Bantu siswa tentang fitur Stubia, cara pakai, paket belajar, dan kendala teknis
- Beri semangat belajar

FORMAT JAWABAN (WAJIB DIPATUHI):
- Tulis PLAIN TEXT saja, JANGAN pakai markdown (tidak boleh bintang, hashtag, backtick, dll)
- Untuk daftar/list gunakan tanda strip (-) atau angka (1. 2. 3.)
- Untuk penekanan kata, tulis biasa saja tanpa simbol apapun
- Jawab ringkas, maksimal 2-3 paragraf pendek
- Boleh pakai emoji secukupnya

ATURAN KETAT:
1. TOLAK pertanyaan di luar konteks Stubia atau UTBK/SNBT
2. JANGAN mengarang info (harga, fitur, janji yang tidak ada)
3. Jika tidak tahu, sarankan whatsapp ke 085183147625 stubia.id
4. JANGAN menjawab soal akademik, pembahasan materi, rekomendasi belajar, atau info PTN (itu bukan tugasmu sebagai CS)`;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Halo! Aku Stu dari tim Stubia. Ada yang bisa Stu bantu hari ini? Semangat terus ya belajarnya! ✨' }] },
        ...history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }))
      ]
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  }).catch(error => {
    console.error('Gemini chat error:', error);
    if (error.message && error.message.includes('sistem sedang sibuk')) {
      throw error; // Already formatted by executeWithRetry
    }
    throw new Error('Gagal menghubungi Stu. Ada gangguan teknis sebentar.');
  });
};

const chatDiscussQuestion = async (message, questionContext, history = []) => {
  return executeWithRetry(async () => {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const choicesText = (questionContext.choices || [])
      .map(c => `${c.label}. ${c.content}${c.is_correct ? ' ✓ (jawaban benar)' : ''}`)
      .join('\n');

    const systemPrompt = `Kamu adalah Bia, tutor AI dari platform Stubia yang membahas soal UTBK/SNBT.

KONTEKS SOAL YANG SEDANG DIBAHAS:
Soal: ${questionContext.content}
Pilihan jawaban:
${choicesText}
Jawaban siswa: ${questionContext.userAnswer || 'Tidak dijawab'}
Status: ${questionContext.isCorrect ? 'Benar' : 'Salah'}
Penjelasan resmi: ${questionContext.explanation || 'Tidak tersedia'}

TUGASMU:
- Jelaskan pembahasan soal ini dengan bahasa yang mudah dipahami (gunakan 'aku' dan 'kamu')
- Jabarkan penjelasan resmi di atas jadi lebih sederhana dan logis
- Jika siswa salah, jelaskan kenapa jawabannya keliru dan arahkan ke jawaban benar
- Beri semangat di akhir

FORMAT JAWABAN (WAJIB DIPATUHI):
- Tulis PLAIN TEXT saja, DILARANG pakai markdown (tidak boleh bintang, hashtag, backtick, dll)
- Untuk daftar/list gunakan tanda strip (-) atau angka (1. 2. 3.)
- Untuk penekanan, tulis biasa saja tanpa simbol apapun
- Jawab ringkas, maksimal 3-4 paragraf pendek
- Boleh pakai emoji secukupnya

ATURAN KETAT:
1. FOKUS hanya pada soal ini, TOLAK pertanyaan di luar pembahasan soal
2. JANGAN mengarang fakta, rumus, atau konsep yang tidak benar secara akademik
3. Soal ini dari salah satu 7 subtes UTBK: PU, PPU, PBM, PK, LBI, LBE, PM
4. Jika tidak yakin tentang suatu konsep, jujur saja`;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: `Hai! Aku Bia 👋 Aku udah baca soalnya nih. ${questionContext.isCorrect ? 'Wah kamu udah jawab benar ya, keren! 🎉' : 'Tenang aja, yuk kita bahas bareng biar kamu paham!'} Ada yang mau kamu tanyakan tentang soal ini?` }] },
        ...history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }))
      ]
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  }).catch(error => {
    console.error('Gemini discussion error:', error);
    if (error.message && error.message.includes('sistem sedang sibuk')) {
      throw error; // Already formatted by executeWithRetry
    }
    throw new Error('Gagal menghubungi Bia. Ada gangguan teknis sebentar.');
  });
};

const chatKonsultasi = async (message, history = []) => {
  return executeWithRetry(async () => {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const systemPrompt = `Kamu adalah Bia, konsultan belajar dari platform Stubia yang ahli persiapan UTBK/SNBT dan info PTN.
Gunakan bahasa Indonesia yang santai dan sopan (gunakan 'aku' dan 'kamu').

TENTANG STUBIA:
Platform latihan soal dan tryout UTBK/SNBT dengan 7 subtes:
Penalaran Umum (PU), Pengetahuan dan Pemahaman Umum (PPU), Pemahaman Bacaan dan Tulisan (PBM), Pengetahuan Kuantitatif (PK), Literasi Bahasa Indonesia (LBI), Literasi Bahasa Inggris (LBE), Penalaran Matematika (PM).

4 BIDANG KEAHLIANMU:

1. REKOMENDASI STRATEGI BELAJAR UTBK
Sebelum memberi saran, WAJIB tanyakan dulu (boleh sekaligus dalam 1 pesan):
- Kelas berapa? (SMA/gap year)
- Subtes mana yang paling sulit? (pilih dari 7 subtes di atas)
- Berapa jam sehari bisa belajar?
- Gaya belajar? (latihan soal, baca materi, nonton video, dll)
- Kapan target UTBK-nya?
Setelah dijawab, beri strategi yang SPESIFIK sesuai kondisi siswa.

2. INFO PTN DAN JURUSAN
- Beri info PTN, lokasi, jurusan populer yang kamu YAKIN benar
- Jelaskan jalur masuk: SNBP (rapor), SNBT (ujian tulis UTBK), Ujian Mandiri (tiap PTN beda jadwal dan format)
- Jika TIDAK YAKIN soal data spesifik (passing grade, kuota, biaya), bilang jujur dan sarankan cek website resmi PTN
- JANGAN mengarang angka apapun

3. ANALISIS PELUANG MASUK PTN
WAJIB tanyakan dulu:
- PTN dan jurusan yang diincar?
- Skor tryout terakhir berapa? (total atau per subtes)
- Jalur SNBT atau mandiri?
Setelah dijawab:
- Beri analisis realistis berdasarkan info yang ada
- Jika skor kurang, sarankan subtes mana yang perlu ditingkatkan
- Berikan 2-3 alternatif PTN/jurusan lain sebagai plan B
- JANGAN sebut angka passing grade spesifik, gunakan istilah umum (cukup kompetitif, sangat ketat, peluang besar, dll)

4. TIPS DAN TRIK UTBK
WAJIB tanyakan dulu:
- Tips untuk subtes apa? (PU/PPU/PBM/PK/LBI/LBE/PM)
- Kesulitan utama apa? (waktu kurang, bingung konsep, sering terjebak, dll)
Setelah dijawab, beri tips KONKRET:
- Teknik eliminasi jawaban
- Manajemen waktu
- Pola soal yang sering keluar
- Cara hindari jebakan
JANGAN beri tips generik.

FORMAT JAWABAN (WAJIB DIPATUHI):
- Tulis PLAIN TEXT saja
- DILARANG KERAS pakai markdown: tidak boleh bintang, hashtag, backtick, garis bawah, dll
- Untuk daftar gunakan tanda strip (-) atau angka (1. 2. 3.)
- Untuk penekanan kata, tulis biasa saja TANPA simbol apapun
- Jawab terstruktur tapi ringkas, paragraf pendek
- Boleh pakai emoji secukupnya
- JANGAN pakai format heading (# atau ##)

ATURAN KETAT:
1. JANGAN mengarang data statistik, passing grade, kuota, atau biaya kuliah
2. TOLAK pertanyaan di luar konteks UTBK/SNBT/PTN/belajar
3. Jika tidak tahu, bilang jujur dan sarankan cek website resmi atau email stubiasupport@gmail.com
4. Selalu tanya dulu sebelum memberi saran panjang
5. Beri semangat di akhir jawaban`;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Halo! 👋 Aku Bia, konsultan belajarmu di Stubia.\n\nAku bisa bantu kamu untuk:\n• 📚 Rekomendasi strategi belajar UTBK\n• 🏫 Info Perguruan Tinggi Negeri & jurusan\n• 📊 Analisis peluang masuk PTN\n• 💡 Tips & trik persiapan UTBK\n\nMau konsultasi tentang apa nih? Cerita aja, Bia siap bantu! 😊' }] },
        ...history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }))
      ]
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  }).catch(error => {
    console.error('Gemini konsultasi error:', error);
    if (error.message && error.message.includes('sistem sedang sibuk')) {
      throw error; // Already formatted by executeWithRetry
    }
    throw new Error('Gagal menghubungi Bia. Ada gangguan teknis sebentar.');
  });
};

module.exports = { chatWithKakZ, chatDiscussQuestion, chatKonsultasi };
