import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function CPNSExcelImportModal({ isOpen, onClose, onImportSuccess, defaultCategory = 'TWK' }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Generate & Download Excel Template with EXACT 9 columns requested:
  // STIMULUS | SOAL | OPSI A | OPSI B | OPSI C | OPSI D | OPSI E | KUNCI JAWABAN | PEMBAHASAN
  const handleDownloadTemplate = () => {
    try {
      const templateRows = [
        {
          STIMULUS: 'UUD 1945 mengatur mekanisme amandemen konstitusi dalam Pasal 37.',
          SOAL: 'Syarat kuorum untuk mengajukan usulan perubahan pasal UUD 1945 dalam sidang MPR adalah sekurang-kurangnya dihadiri oleh...',
          'OPSI A': '1/3 dari jumlah anggota MPR',
          'OPSI B': '2/3 dari jumlah anggota MPR',
          'OPSI C': '50% + 1 dari jumlah anggota MPR',
          'OPSI D': '3/4 dari jumlah anggota MPR',
          'OPSI E': 'Seluruh anggota MPR',
          'KUNCI JAWABAN': 'A', // TWK / TIU: huruf kunci (A/B/C/D/E)
          PEMBAHASAN: 'Berdasarkan Pasal 37 ayat (1) UUD 1945, usul perubahan pasal dapat diagendakan bila diajukan sekurang-kurangnya 1/3 anggota MPR.'
        },
        {
          STIMULUS: 'Anda adalah petugas pelayanan umum. Seorang warga disabilitas mengalami kesulitan pendaftaran online.',
          SOAL: 'Sikap profesional yang paling tepat Anda lakukan adalah...',
          'OPSI A': 'Segera mendampingi secara langsung dan membantu mengisikan formulir hingga selesai',
          'OPSI B': 'Memberikan penjelasan secara perlahan dan memandu warga',
          'OPSI C': 'Meminta rekan kerja lain yang sedang senggang membantu',
          'OPSI D': 'Menyarankan warga membawa pendamping keluarga',
          'OPSI E': 'Memberikan brosur panduan pendaftaran',
          'KUNCI JAWABAN': '5, 4, 3, 2, 1', // TKP: skor urut A-E (misal 5,4,3,2,1) atau huruf kunci
          PEMBAHASAN: 'Opsi A mendapat skor 5 karena paling menunjukkan empati pelayanan inklusif disabilitas dan bantuan langsung.'
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Template ${defaultCategory}`);

      // Set explicit column widths
      worksheet['!cols'] = [
        { wch: 35 }, // STIMULUS
        { wch: 45 }, // SOAL
        { wch: 30 }, // OPSI A
        { wch: 30 }, // OPSI B
        { wch: 30 }, // OPSI C
        { wch: 30 }, // OPSI D
        { wch: 30 }, // OPSI E
        { wch: 18 }, // KUNCI JAWABAN
        { wch: 45 }  // PEMBAHASAN
      ];

      XLSX.writeFile(workbook, `Template_Soal_${defaultCategory}_CPNS.xlsx`);
      toast.success('Template Excel resmi berhasil diunduh!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh template Excel');
    }
  };

  // Helper to parse key / TKP scores from KUNCI JAWABAN column
  const parseKeyAndScores = (rawKeyStr, category) => {
    const str = (rawKeyStr || '').toString().trim();
    
    // Check if input is multi-score e.g. "5,4,3,2,1" or "5-4-3-2-1" or "5 4 3 2 1"
    const numbersMatch = str.match(/\d+/g);
    if (numbersMatch && numbersMatch.length === 5) {
      const scores = numbersMatch.map(n => Math.min(5, Math.max(1, parseInt(n, 10))));
      const maxScoreIdx = scores.indexOf(Math.max(...scores));
      const keyLetter = String.fromCharCode(65 + (maxScoreIdx !== -1 ? maxScoreIdx : 0));
      return {
        keyLetter,
        scores: {
          A: scores[0],
          B: scores[1],
          C: scores[2],
          D: scores[3],
          E: scores[4],
        }
      };
    }

    // Default single key letter e.g. "A", "B", "C", "D", "E"
    const keyLetter = (str.toUpperCase().match(/[A-E]/) || ['A'])[0];
    const keyIdx = keyLetter.charCodeAt(0) - 65; // 0 for A, 1 for B, etc.

    if (category === 'TKP') {
      const scores = { A: 1, B: 1, C: 1, D: 1, E: 1 };
      ['A', 'B', 'C', 'D', 'E'].forEach((label, idx) => {
        if (idx === keyIdx) scores[label] = 5;
        else if (idx === (keyIdx + 1) % 5) scores[label] = 4;
        else if (idx === (keyIdx + 2) % 5) scores[label] = 3;
        else if (idx === (keyIdx + 3) % 5) scores[label] = 2;
        else scores[label] = 1;
      });
      return { keyLetter, scores };
    }

    // TWK / TIU
    return {
      keyLetter,
      scores: {
        A: keyLetter === 'A' ? 5 : 0,
        B: keyLetter === 'B' ? 5 : 0,
        C: keyLetter === 'C' ? 5 : 0,
        D: keyLetter === 'D' ? 5 : 0,
        E: keyLetter === 'E' ? 5 : 0,
      }
    };
  };

  // Handle File Upload & Parse
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          toast.error('File Excel kosong!');
          setLoading(false);
          return;
        }

        const parsed = rawJson.map((row, idx) => {
          const getCol = (possibleKeys) => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.toString().toUpperCase().trim().replace(/_/g, ' ');
              if (possibleKeys.some(pk => cleanKey === pk || cleanKey.includes(pk))) {
                return row[key];
              }
            }
            return '';
          };

          const stimulus = (getCol(['STIMULUS', 'WACANA', 'BACAAN']) || '').toString();
          const content = (getCol(['SOAL', 'TEKS SOAL', 'PERTANYAAN', 'CONTENT']) || '').toString();
          const optA = (getCol(['OPSI A', 'PILIHAN A', 'OPTION A', 'A']) || '').toString();
          const optB = (getCol(['OPSI B', 'PILIHAN B', 'OPTION B', 'B']) || '').toString();
          const optC = (getCol(['OPSI C', 'PILIHAN C', 'OPTION C', 'C']) || '').toString();
          const optD = (getCol(['OPSI D', 'PILIHAN D', 'OPTION D', 'D']) || '').toString();
          const optE = (getCol(['OPSI E', 'PILIHAN E', 'OPTION E', 'E']) || '').toString();
          const rawKey = (getCol(['KUNCI JAWABAN', 'KUNCI', 'CORRECT KEY']) || '').toString();
          const explanation = (getCol(['PEMBAHASAN', 'EXPLANATION', 'SOLUSI']) || '').toString();

          const category = defaultCategory;
          const { keyLetter, scores } = parseKeyAndScores(rawKey, category);

          const choices = [
            { label: 'A', content: optA, is_correct: keyLetter === 'A', tkp_point: scores.A },
            { label: 'B', content: optB, is_correct: keyLetter === 'B', tkp_point: scores.B },
            { label: 'C', content: optC, is_correct: keyLetter === 'C', tkp_point: scores.C },
            { label: 'D', content: optD, is_correct: keyLetter === 'D', tkp_point: scores.D },
            { label: 'E', content: optE, is_correct: keyLetter === 'E', tkp_point: scores.E },
          ];

          let isValid = true;
          let errorMsg = '';

          if (!content.trim()) {
            isValid = false;
            errorMsg = 'Teks SOAL kosong';
          } else if (!optA || !optB || !optC || !optD || !optE) {
            isValid = false;
            errorMsg = 'Opsi A-E belum lengkap';
          }

          return {
            id: `imported-${idx}-${Date.now()}`,
            category,
            stimulus,
            content,
            image_url: '',
            image_position: 'middle',
            choices,
            explanation,
            keyLetter,
            isValid,
            errorMsg,
          };
        });

        setPreviewData(parsed);
        toast.success(`Berhasil membaca ${parsed.length} soal Excel untuk subtes ${defaultCategory}`);
      } catch (err) {
        console.error(err);
        toast.error('Gagal membaca file Excel. Pastikan format kolom sesuai.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleConfirmImport = () => {
    const validItems = previewData.filter(d => d.isValid);
    if (validItems.length === 0) {
      toast.error('Tidak ada data soal valid untuk diimpor!');
      return;
    }

    onImportSuccess && onImportSuccess(validItems);
    onClose();
  };

  const validCount = previewData.filter(d => d.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <span className="material-symbols-outlined text-2xl">table_chart</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Import Excel Soal Subtes: {defaultCategory}</h3>
              <p className="text-xs text-blue-100">
                Format standar 9 kolom: STIMULUS | SOAL | OPSI A-E | KUNCI JAWABAN | PEMBAHASAN.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-base">help_outline</span>
              Panduan Excel
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Action Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Download Template Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-blue-900 dark:text-blue-200 block uppercase">
                  1. Template Format Excel
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  9 Kolom Standar (Gambar via Edit Soal).
                </p>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Unduh Template
                </button>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">menu_book</span>
                  Panduan Excel
                </button>
              </div>
            </div>

            {/* Upload File Box */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block uppercase">
                  2. Upload File Excel
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[180px]">
                  {file ? file.name : 'Pilih file .xlsx / .csv'}
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition-all flex items-center gap-1 shrink-0"
              >
                <span className="material-symbols-outlined text-base">file_upload</span>
                Pilih File Excel
              </button>
            </div>
          </div>

          {/* Banner Quick Note */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-200 text-[11px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-amber-600 shrink-0">info</span>
              <span>
                <strong>Catatan:</strong> Excel hanya diisi teks 9 kolom. Penambahan & letak gambar (*Atas, Tengah, Bawah*) dilakukan dari tombol <strong>Edit Soal</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-2.5 py-1 bg-amber-200 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 rounded-lg font-bold text-[10px] shrink-0"
            >
              Baca Panduan Lengkap
            </button>
          </div>

          {/* Preview Table */}
          {previewData.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded-xl font-bold">
                <span>Preview Data Soal ({previewData.length} Baris):</span>
                <span className="text-emerald-600 dark:text-emerald-400">✓ {validCount} Valid</span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-72">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider sticky top-0 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Stimulus</th>
                      <th className="p-3">Soal</th>
                      <th className="p-3">Opsi A-E & Kunci</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {previewData.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-slate-500">{idx + 1}</td>
                        <td className="p-3 max-w-[150px] truncate text-amber-700 font-semibold">
                          {row.stimulus || '-'}
                        </td>
                        <td className="p-3 max-w-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                          {row.content}
                        </td>
                        <td className="p-3">
                          {defaultCategory === 'TKP' ? (
                            <span>Skor: {row.choices.map(c => `${c.label}:${c.tkp_point}`).join(', ')}</span>
                          ) : (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Kunci: {row.keyLetter}</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {row.isValid ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold">
                              Valid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 rounded font-bold" title={row.errorMsg}>
                              {row.errorMsg}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-100 transition-all text-xs"
          >
            Tutup
          </button>

          <button
            type="button"
            disabled={validCount === 0 || loading}
            onClick={handleConfirmImport}
            className={`px-6 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
              validCount > 0 && !loading
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-base">file_download_done</span>
            Impor {validCount} Soal ke Subtes {defaultCategory}
          </button>
        </div>
      </div>

      {/* --- MODAL PANDUAN FORMAT EXCEL --- */}
      {showGuideModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header Modal Panduan */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-5 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950/15 flex items-center justify-center backdrop-blur-md">
                  <span className="material-symbols-outlined text-2xl text-slate-950">menu_book</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">Panduan Membuat Soal via Excel</h3>
                  <p className="text-xs text-slate-900/80 font-medium">Format Resmi 9 Kolom untuk SKD CPNS & Tryout UTBK</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-950/10 hover:bg-slate-950/20 flex items-center justify-center text-slate-950 transition-all"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Content Body Panduan */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800 dark:text-slate-200">
              
              {/* Section 1: Ringkasan 9 Kolom */}
              <div className="space-y-3">
                <h4 className="text-sm font-black uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">view_column</span>
                  1. Struktur 9 Kolom Wajib di Excel
                </h4>
                
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold uppercase border-b">
                      <tr>
                        <th className="p-2.5">Nama Kolom Header</th>
                        <th className="p-2.5">Keterangan & Cara Pengisian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      <tr>
                        <td className="p-2.5 font-bold text-amber-700 dark:text-amber-400 font-mono">STIMULUS</td>
                        <td className="p-2.5">Teks wacana, bacaan, atau cerita konteks. <em>(Opsional, kosongkan jika tidak ada wacana)</em>.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-blue-600 font-mono">SOAL</td>
                        <td className="p-2.5 font-semibold">Teks utama pertanyaan / soal <strong>(Wajib diisi)</strong>.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold font-mono">OPSI A s/d OPSI E</td>
                        <td className="p-2.5 font-semibold">Teks pilihan jawaban A, B, C, D, E dalam kolom terpisah <strong>(Wajib lengkap 5 opsi)</strong>.</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-emerald-600 font-mono">KUNCI JAWABAN</td>
                        <td className="p-2.5">
                          • <strong>TWK / TIU:</strong> Tulis 1 huruf kunci: <code>A</code>, <code>B</code>, <code>C</code>, <code>D</code>, atau <code>E</code>.<br/>
                          • <strong>TKP:</strong> Tulis 5 angka skor urut A-E dipisah koma (misal <code>5, 4, 3, 2, 1</code>), atau cukup tulis huruf kunci utama.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-purple-600 font-mono">PEMBAHASAN</td>
                        <td className="p-2.5">Teks penjelasan solusi, rumus, atau konsep penyelesaian soal.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Gambar */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl space-y-2">
                <h4 className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">image</span>
                  2. Cara Menambahkan Gambar Soal
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                  Untuk mempermudah pembuatan Excel, <strong>gambar tidak perlu dimasukkan di dalam file Excel</strong>. Setelah file Excel di-import:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                  <li>Buka daftar soal yang telah di-import.</li>
                  <li>Klik tombol <strong>Edit (Ikon Pensil)</strong> pada soal yang ingin diberi gambar.</li>
                  <li>Masukkan URL Gambar dan pilih <strong>Posisi Gambar (Atas, Tengah, atau Bawah)</strong>.</li>
                </ol>
              </div>

              {/* Section 3: Langkah Impor */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  3. Langkah-Langkah Penggunaan
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-[11px]">
                  <li>Klik tombol <strong>"Unduh Template .XLSX"</strong> di modal import.</li>
                  <li>Buka file template di <strong>Microsoft Excel</strong> atau <strong>Google Sheets</strong>.</li>
                  <li>Isi data soal mengikuti 9 kolom header di atas tanpa mengubah nama header kolom.</li>
                  <li>Simpan (*Save*) berkas sebagai format <code>.xlsx</code> atau <code>.csv</code>.</li>
                  <li>Klik <strong>"Pilih File Excel"</strong>, periksa pratinjau data, lalu klik <strong>"Impor Soal"</strong>.</li>
                </ol>
              </div>

            </div>

            {/* Footer Modal Panduan */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">download</span>
                Unduh Template Excel Sekarang
              </button>

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Saya Mengerti
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
