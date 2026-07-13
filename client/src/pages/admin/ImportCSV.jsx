import React, { useState, useRef, useEffect } from 'react';
import { adminService, subjectService, tryoutService, skdService } from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import MathText from '../../components/MathText';

const ImportCSV = () => {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [destination, setDestination] = useState('latihan');
  const [tryoutPackages, setTryoutPackages] = useState([]);
  const [tryoutPackageId, setTryoutPackageId] = useState('');
  const [topics, setTopics] = useState([]);
  const [topicId, setTopicId] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [examCategory, setExamCategory] = useState('utbk'); // 'utbk' or 'skd'
  const [skdSubjects, setSkdSubjects] = useState([]);
  const [skdPackages, setSkdPackages] = useState([]);
  const [skdTopics, setSkdTopics] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    subjectService.list().then(res => setSubjects(res.data.data)).catch(() => {});
    tryoutService.listPackages().then(res => setTryoutPackages(res.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (examCategory === 'skd' && skdSubjects.length === 0) {
      skdService.adminGetSubjects().then(res => setSkdSubjects(res.data?.data || [])).catch(() => {});
      skdService.adminGetPackages().then(res => setSkdPackages(res.data?.data || [])).catch(() => {});
    }
  }, [examCategory]);

  useEffect(() => {
    if (subjectId) {
      setTopics([]);
      setTopicId('');
      if (examCategory === 'skd') {
        skdService.adminGetTopics(subjectId)
          .then(res => setSkdTopics(res.data?.data || []))
          .catch(() => setSkdTopics([]));
      } else {
        subjectService.listTopics(subjectId)
          .then(res => setTopics(res.data?.data || []))
          .catch(() => setTopics([]));
      }
    } else {
      setTopics([]);
      setTopicId('');
      setSkdTopics([]);
    }
  }, [subjectId, examCategory]);

  const parseExcelFile = (selectedFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        setTotalRows(jsonData.length);
        setPreview(jsonData);
      } catch {
        toast.error('Gagal membaca file Excel. Pastikan format file benar.');
        setFile(null);
        setPreview([]);
        setTotalRows(0);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validExtensions = ['.xlsx', '.xls'];
    const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      toast.error('Hanya file Excel (.xlsx, .xls) yang didukung');
      return;
    }
    setFile(selectedFile);
    setResult(null);
    setTotalRows(0);
    parseExcelFile(selectedFile);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      handleFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Pilih file Excel terlebih dahulu'); return; }
    if (!subjectId) { toast.error('Pilih mata pelajaran terlebih dahulu'); return; }

    if (destination === 'tryout' && !tryoutPackageId) { toast.error('Pilih paket tryout terlebih dahulu'); return; }
    if (destination === 'latihan' && !topicId) { toast.error('Pilih topik latihan terlebih dahulu'); return; }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject_id', subjectId);
    
    try {
      if (examCategory === 'skd') {
        if (destination === 'tryout' && tryoutPackageId) {
          formData.append('package_id', tryoutPackageId);
        }
        if (destination === 'latihan' && topicId) {
          formData.append('topic_id', topicId);
        }
        const res = await skdService.adminImportExcel(formData);
        setResult({
          importedCount: res.data.imported,
          rejectedCount: 0,
          errors: []
        });
        toast.success(res.data.message || 'Import berhasil!');
      } else {
        formData.append('difficulty', difficulty);
        formData.append('destination', destination);
        if (destination === 'tryout' && tryoutPackageId) {
          formData.append('tryout_package_id', tryoutPackageId);
        }
        if (destination === 'latihan' && topicId) {
          formData.append('topic_id', topicId);
        }
        const res = await adminService.importExcel(formData);
        setResult(res.data.data);
        toast.success(res.data.message);
      }
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'STIMULUS': '',
        'SOAL': 'Berapakah hasil dari 2 + 2?',
        'OPSI A': '3',
        'OPSI B': '4',
        'OPSI C': '5',
        'OPSI D': '6',
        'OPSI E': '7',
        'KUNCI JAWABAN': 'B',
        'PEMBAHASAN': 'Karena 2 + 2 = 4',
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 40 }, // STIMULUS
      { wch: 40 }, // SOAL
      { wch: 15 }, // OPSI A
      { wch: 15 }, // OPSI B
      { wch: 15 }, // OPSI C
      { wch: 15 }, // OPSI D
      { wch: 15 }, // OPSI E
      { wch: 18 }, // KUNCI JAWABAN
      { wch: 30 }, // PEMBAHASAN
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Soal');
    XLSX.writeFile(wb, 'template_soal_stubia.xlsx');
    toast.success('Template Excel berhasil didownload!');
  };

  // Normalize column name for preview display
  const getCol = (row, ...keys) => {
    for (const key of keys) {
      for (const k of Object.keys(row)) {
        const clean = k.replace(/^\uFEFF/, '').trim().toLowerCase();
        if (clean === key.toLowerCase()) {
          const val = row[k];
          if (val === null || val === undefined) return '';
          return String(val).trim();
        }
      }
    }
    return '';
  };

  const getStatus = (row) => {
    const soal = getCol(row, 'soal', 'content', 'question', 'pertanyaan');
    const opsiA = getCol(row, 'opsi a', 'opsia', 'choice_a', 'pilihan a');
    const opsiB = getCol(row, 'opsi b', 'opsib', 'choice_b', 'pilihan b');
    const kunci = getCol(row, 'kunci jawaban', 'kunci', 'correct_label', 'answer', 'jawaban');
    const pembahasan = getCol(row, 'pembahasan', 'explanation', 'penjelasan');
    if (!soal) return 'error';
    if (!opsiA || !opsiB) return 'error';
    
    const isTkp = examCategory === 'skd' && skdSubjects.find(s => s.id === subjectId)?.is_tkp;
    if (!isTkp) {
      if (!['A','B','C','D','E'].includes(kunci.toUpperCase())) return 'error';
    }
    if (examCategory !== 'skd' && !pembahasan) return 'error';
    return 'ok';
  };

  return (
    <div className="animate-fade-in text-on-surface">

      {/* Page Header */}
      <div className="bg-surface-container-low/50 -mx-6 -mt-6 px-6 py-8 mb-8 border-b border-outline-variant/20">
        <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-2">
          <span className="hover:text-primary cursor-pointer">Dashboard</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>Import Questions</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface">Import Questions</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Upload soal UTBK secara massal menggunakan file Excel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Left Column ── */}
        <div className="lg:col-span-5 space-y-8">

          {/* Upload Card */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Upload Excel</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Import soal ke bank soal secara massal.</p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1 text-primary font-label-md text-label-md hover:underline flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Download Template
              </button>
            </div>

            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer group ${
                isDragging ? 'border-primary bg-[#dae1ff]/20'
                : file ? 'border-green-400 bg-green-50'
                : 'border-outline-variant hover:border-primary bg-surface-container-low/30'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${file ? 'bg-green-100' : 'bg-[#dae1ff]'}`}>
                  <span className={`material-symbols-outlined text-3xl ${file ? 'text-green-600' : 'text-primary'}`}>
                    {file ? 'check_circle' : 'upload_file'}
                  </span>
                </div>
                {file ? (
                  <>
                    <p className="font-headline-md text-on-surface mb-1">{file.name}</p>
                    <p className="font-body-md text-on-surface-variant mb-4">{(file.size / 1024).toFixed(1)} KB • <strong>{totalRows}</strong> soal terdeteksi</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setPreview([]); setTotalRows(0); setResult(null); }}
                      className="text-error font-label-md text-label-md hover:underline"
                    >
                      Hapus File
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-headline-md text-on-surface mb-1">Drag and drop file di sini</p>
                    <p className="font-body-md text-on-surface-variant mb-6">Mendukung Excel (.xlsx, .xls) hingga 10MB</p>
                    <button type="button" className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md text-label-md hover:shadow-lg transition-all">
                      Browse Files
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Format Info */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider mb-4">Format Excel yang Diharapkan</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-label-sm text-label-sm border-collapse">
                <thead>
                  <tr className="bg-surface-container-low">
                    {['SOAL','OPSI A','OPSI B','OPSI C','OPSI D','OPSI E','KUNCI JAWABAN','PEMBAHASAN'].map(h => (
                      <th key={h} className="px-3 py-2 text-on-surface-variant text-left border border-outline-variant/30 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {['Teks soal...','Pilihan A','Pilihan B','Pilihan C','Pilihan D','Pilihan E','A','Penjelasan...'].map((v, i) => (
                      <td key={i} className="px-3 py-2 text-on-surface-variant border border-outline-variant/30 whitespace-nowrap italic">{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-3">
              💡 OPSI C–E opsional. KUNCI JAWABAN harus salah satu dari: <strong>A, B, C, D, atau E</strong>. <strong>PEMBAHASAN wajib diisi</strong> untuk setiap soal. Gunakan sheet pertama pada file Excel.
            </p>
          </section>

          {/* Config Card */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Konfigurasi Import</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">Tentukan kategori ujian, subtes, topik/paket, dan tingkat kesulitan untuk semua soal dalam file ini.</p>

            <div className="space-y-5">
              {/* Kategori Ujian */}
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Kategori Ujian</label>
                <div className="flex gap-2 p-1 bg-surface-container-low rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setExamCategory('utbk');
                      setSubjectId('');
                      setTopicId('');
                      setTryoutPackageId('');
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                      examCategory === 'utbk'
                        ? 'bg-surface text-on-surface shadow-sm border border-outline-variant/10'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    UTBK
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExamCategory('skd');
                      setSubjectId('');
                      setTopicId('');
                      setTryoutPackageId('');
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${
                      examCategory === 'skd'
                        ? 'bg-surface text-on-surface shadow-sm border border-outline-variant/10'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    SKD CPNS
                  </button>
                </div>
              </div>

              {/* UTBK Category Selector (only for UTBK) */}
              {examCategory === 'utbk' && (
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Kategori UTBK *</label>
                  <select
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-3 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                    value={category}
                    onChange={e => { setCategory(e.target.value); setSubjectId(''); }}
                  >
                    <option value="">Semua Kategori</option>
                    {[...new Set(subjects.map(s => s.category))].map(cat => (
                      <option key={cat} value={cat}>{cat === 'TPS' ? 'TPS (Tes Potensi Skolastik)' : cat === 'TKA_SAINTEK' ? 'TKA Saintek' : cat === 'TKA_SOSHUM' ? 'TKA Soshum' : cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Subtes / Mata Pelajaran *</label>
                <select
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-3 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                >
                  <option value="">Pilih Subtes...</option>
                  {examCategory === 'skd' ? (
                    skdSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.full_name})</option>
                    ))
                  ) : (
                    subjects.filter(s => !category || s.category === category).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Tingkat Kesulitan</label>
                <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
                  {[
                    { key: 'easy', label: 'Mudah' },
                    { key: 'medium', label: 'Sedang' },
                    { key: 'hard', label: 'Sulit' },
                  ].map(lvl => (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setDifficulty(lvl.key)}
                      className={`flex-1 py-2 text-label-sm font-label-sm rounded-md transition-all ${
                        difficulty === lvl.key
                          ? 'bg-surface text-on-surface shadow-sm border border-outline-variant/20'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Tujuan Import *</label>
                <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
                  {[
                    { key: 'latihan', label: 'Latihan', icon: 'school' },
                    { key: 'tryout', label: 'Tryout', icon: 'quiz' },
                  ].map(dest => (
                    <button
                      key={dest.key}
                      type="button"
                      onClick={() => { setDestination(dest.key); setTryoutPackageId(''); setTopicId(''); }}
                      className={`flex-1 py-2 text-label-sm font-label-sm rounded-md transition-all flex items-center justify-center gap-1.5 ${
                        destination === dest.key
                          ? 'bg-surface text-on-surface shadow-sm border border-outline-variant/20'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{dest.icon}</span>
                      {dest.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tryout Package Selector (shown only when destination is 'tryout') */}
              {destination === 'tryout' && (
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Paket Tryout *</label>
                  <select
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-3 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                    value={tryoutPackageId}
                    onChange={e => setTryoutPackageId(e.target.value)}
                  >
                    <option value="">Pilih Paket Tryout...</option>
                    {examCategory === 'skd' ? (
                      skdPackages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                      ))
                    ) : (
                      tryoutPackages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>{pkg.title}</option>
                      ))
                    )}
                  </select>
                  {examCategory === 'skd' && skdPackages.length === 0 && (
                    <p className="text-label-sm text-on-surface-variant mt-1 italic">Belum ada paket tryout CPNS. Buat dulu di menu Kelola SKD CPNS.</p>
                  )}
                  {examCategory === 'utbk' && tryoutPackages.length === 0 && (
                    <p className="text-label-sm text-on-surface-variant mt-1 italic">Belum ada paket tryout. Buat dulu di menu Kelola Tryout.</p>
                  )}
                </div>
              )}

              {/* Topic Selector (shown only when destination is 'latihan') */}
              {destination === 'latihan' && (
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Topik Latihan *</label>
                  <select
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-3 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                    value={topicId}
                    onChange={e => setTopicId(e.target.value)}
                  >
                    <option value="">Pilih Topik...</option>
                    {examCategory === 'skd' ? (
                      skdTopics.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))
                    ) : (
                      topics.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))
                    )}
                  </select>
                  {subjectId && examCategory === 'skd' && skdTopics.length === 0 && (
                    <p className="text-label-sm text-on-surface-variant mt-1 italic">Belum ada topik untuk subtes SKD ini. Buat dulu di menu Kelola SKD CPNS.</p>
                  )}
                  {subjectId && examCategory === 'utbk' && topics.length === 0 && (
                    <p className="text-label-sm text-on-surface-variant mt-1 italic">Belum ada topik untuk subtes ini. Buat dulu di menu Kelola Latihan.</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || !subjectId || loading || (destination === 'tryout' && !tryoutPackageId) || (destination === 'latihan' && !topicId)}
                className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    Mengimport...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                    Validate & Start Import
                  </>
                )}
              </button>
              {!subjectId && (
                <p className="text-label-sm text-error mt-2 text-center flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Pilih mata pelajaran sebelum mengimport
                </p>
              )}
            </div>
          </section>
        </div>

        {/* ── Right Column: Preview ── */}
        <div className="lg:col-span-7">
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 flex flex-col h-full overflow-hidden">

            <div className="p-8 border-b border-outline-variant">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Data Preview</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {file
                      ? <>Menampilkan <strong>{totalRows}</strong> soal dari <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-label-sm">{file.name}</code> — semua soal akan diimport</>
                      : 'Upload file Excel untuk melihat preview data.'
                    }
                  </p>
                </div>
                {preview.length > 0 && (
                  <span className="bg-[#c2e8ff] text-[#001e2b] px-3 py-1 rounded-full font-label-sm text-label-sm flex-shrink-0">
                    {preview.filter(r => getStatus(r) === 'ok').length} Valid
                    {preview.filter(r => getStatus(r) === 'error').length > 0 &&
                      ` • ${preview.filter(r => getStatus(r) === 'error').length} Error`}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-grow overflow-x-auto max-h-[600px] overflow-y-auto">
              {preview.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Status</th>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Stimulus</th>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Soal</th>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Kunci</th>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Opsi</th>
                      <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">Pembahasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {preview.map((row, i) => {
                      if (i === 0) console.log('Excel row keys:', Object.keys(row), 'Row data:', row);
                      const stimulus = getCol(row, 'stimulus', 'wacana', 'bacaan', 'stimulus/wacana');
                      const soal = getCol(row, 'soal', 'content', 'question', 'pertanyaan');
                      const kunci = getCol(row, 'kunci jawaban', 'kunci', 'correct_label', 'answer', 'jawaban').toUpperCase();
                      const opsiCount = ['opsi a','opsi b','opsi c','opsi d','opsi e'].filter(k => getCol(row, k) !== '').length;
                      const pembahasan = getCol(row, 'pembahasan', 'explanation', 'penjelasan');
                      const status = getStatus(row);
                      const isTkp = examCategory === 'skd' && skdSubjects.find(s => s.id === subjectId)?.is_tkp;
                      return (
                        <tr key={i} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-6 py-4">
                            <span
                              className={`material-symbols-outlined ${status === 'ok' ? 'text-green-500' : 'text-error'}`}
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              {status === 'ok' ? 'check_circle' : 'error'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-body-md text-body-md text-on-surface-variant max-w-[150px]">
                            {stimulus ? (
                              <MathText className="line-clamp-2 italic" text={stimulus} />
                            ) : (
                              <span className="text-gray-400 italic text-[12px]">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-body-md text-body-md text-on-surface max-w-xs">
                            {soal ? (
                              <MathText className="line-clamp-2" text={soal} />
                            ) : (
                              <span className="text-error italic">Kosong</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isTkp ? (
                              <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">TKP Poin</span>
                            ) : kunci && ['A','B','C','D','E'].includes(kunci) ? (
                              <span className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">{kunci}</span>
                            ) : (
                              <span className="text-error font-label-sm text-label-sm">{kunci || '?'}</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded font-label-sm text-label-sm">{opsiCount} opsi</span>
                          </td>
                          <td className="px-6 py-4">
                            {pembahasan ? (
                              <MathText className="line-clamp-1 text-label-sm text-on-surface-variant max-w-[150px] inline-block" text={pembahasan} />
                            ) : (
                              <span className="text-error font-label-sm italic">Kosong</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-outline text-4xl">table_chart</span>
                  </div>
                  <p className="font-headline-md text-on-surface-variant mb-1">Belum ada data</p>
                  <p className="font-body-md text-outline">Upload file Excel untuk melihat preview soal Anda.</p>
                </div>
              )}
            </div>

            {preview.length > 0 && (
              <div className="p-6 bg-surface-container-low border-t border-outline-variant/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant italic">
                    {preview.filter(r => getStatus(r) === 'ok').length} dari {totalRows} soal siap diimport
                    {preview.filter(r => getStatus(r) === 'error').length > 0 &&
                      `, ${preview.filter(r => getStatus(r) === 'error').length} soal butuh perbaikan.`}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Import Result */}
      {result && (
        <section className="mt-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Hasil Import</h3>
          <div className="flex gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 px-6 py-4 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-green-600 text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <div>
                <p className="text-[28px] font-bold leading-none text-green-700">{result.importedCount}</p>
                <p className="font-label-sm text-green-600">Soal berhasil diimport</p>
              </div>
            </div>
            {result.rejectedCount > 0 && (
              <div className="bg-red-50 border border-red-200 px-6 py-4 rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500 text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                <div>
                  <p className="text-[28px] font-bold leading-none text-red-600">{result.rejectedCount}</p>
                  <p className="font-label-sm text-red-500">Soal gagal diimport</p>
                </div>
              </div>
            )}
          </div>
          {result.errors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="font-label-md text-error mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">error</span>
                Detail Error
              </h4>
              <ul className="space-y-1">
                {result.errors.slice(0, 10).map((err, i) => (
                  <li key={i} className="font-body-md text-body-md text-red-700">• {err}</li>
                ))}
                {result.errors.length > 10 && (
                  <li className="font-label-sm text-red-500">... dan {result.errors.length - 10} error lainnya</li>
                )}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* AI Pro Tip */}
      <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="relative rounded-2xl overflow-hidden h-[360px] shadow-xl bg-gradient-to-br from-primary to-[#003fa4]">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              <circle cx="170" cy="30" r="80" fill="white" />
              <circle cx="30" cy="170" r="100" fill="white" />
            </svg>
          </div>
          <div className="absolute inset-0 flex flex-col justify-end p-8 z-10">
            <span className="material-symbols-outlined text-white/40 text-[80px] mb-4">cloud_upload</span>
            <p className="text-on-primary font-headline-md">Streamlined Content Creation</p>
          </div>
        </div>
        <div className="p-8">
          <a href="/admin/input" className="bg-primary text-on-primary px-8 py-3 rounded-lg font-label-md text-label-md hover:shadow-xl transition-all inline-block">
            Input Manual
          </a>
        </div>
      </section>

      <footer className="mt-12 pt-8 border-t border-outline-variant/30">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-on-surface-variant font-label-sm text-label-sm">© 2026 Stubia UTBK Platform. All rights reserved.</div>
          <div className="flex gap-6">
            <span className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm cursor-pointer">Privacy Policy</span>
            <span className="text-on-surface-variant hover:text-primary font-label-sm text-label-sm cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ImportCSV;
