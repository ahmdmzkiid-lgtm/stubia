import React, { useState } from 'react';
import MathText from '../../MathText';
import CPNSQuestionForm from './CPNSQuestionForm';
import CPNSExcelImportModal from './CPNSExcelImportModal';
import toast from 'react-hot-toast';

// Initial Mock Packages matching CPNS SKD standard
const INITIAL_PACKAGES = [
  {
    id: 'pkg-cpns-1',
    title: 'Tryout SKD CPNS 2026 - Paket Simulasi 1',
    duration_total: 100,
    scheduled_at: '2026-08-01T08:00',
    end_date: '2026-08-10T23:59',
    is_active: true,
    is_public: true,
    passing_grade: { twk: 65, tiu: 80, tkp: 166 },
    questions: [
      {
        id: 'q-twk-1',
        category: 'TWK',
        topic: 'Pancasila & UUD 1945',
        difficulty: 'medium',
        stimulus: 'UUD 1945 mengatur mekanisme amandemen konstitusi dalam Pasal 37.',
        content: 'Syarat kuorum untuk mengajukan usulan perubahan pasal UUD 1945 dalam sidang MPR adalah sekurang-kurangnya dihadiri oleh...',
        image_url: '',
        image_position: 'middle',
        choices: [
          { label: 'A', content: '1/3 dari jumlah anggota MPR', is_correct: true, tkp_point: 5 },
          { label: 'B', content: '2/3 dari jumlah anggota MPR', is_correct: false, tkp_point: 0 },
          { label: 'C', content: '50% + 1 dari jumlah anggota MPR', is_correct: false, tkp_point: 0 },
          { label: 'D', content: '3/4 dari jumlah anggota MPR', is_correct: false, tkp_point: 0 },
          { label: 'E', content: 'Seluruh anggota MPR', is_correct: false, tkp_point: 0 },
        ],
        explanation: 'Pasal 37 ayat (1) UUD 1945 menyebutkan sekurang-kurangnya 1/3 dari jumlah anggota MPR.'
      },
      {
        id: 'q-tiu-1',
        category: 'TIU',
        topic: 'Silogisme & Penalaran Logis',
        difficulty: 'hard',
        stimulus: 'Premis 1: Semua CPNS yang lulus latsar mendapat sertifikat.\nPremis 2: Sebagian staf tidak memiliki sertifikat.',
        content: 'Kesimpulan yang paling tepat dari kedua premis adalah...',
        image_url: '',
        image_position: 'top',
        choices: [
          { label: 'A', content: 'Semua staf belum lulus latsar', is_correct: false, tkp_point: 0 },
          { label: 'B', content: 'Sebagian staf bukan CPNS yang lulus latsar', is_correct: true, tkp_point: 5 },
          { label: 'C', content: 'Semua pemegang sertifikat pasti staf', is_correct: false, tkp_point: 0 },
          { label: 'D', content: 'Sebagian CPNS tidak ikut latsar', is_correct: false, tkp_point: 0 },
          { label: 'E', content: 'Tidak ada kesimpulan', is_correct: false, tkp_point: 0 },
        ],
        explanation: 'Hukum silogisme: Premis universal + partikular menghasilkan kesimpulan partikular.'
      },
      {
        id: 'q-tkp-1',
        category: 'TKP',
        topic: 'Pelayanan Publik',
        difficulty: 'medium',
        stimulus: 'Warga disabilitas mengalami kesulitan pendaftaran online di loket Anda.',
        content: 'Sikap dan tindakan profesional yang paling tepat adalah...',
        image_url: '',
        image_position: 'bottom',
        choices: [
          { label: 'A', content: 'Mendampingi secara langsung dan membantu pengisian formulir hingga selesai', is_correct: false, tkp_point: 5 },
          { label: 'B', content: 'Memberikan penjelasan perlahan dan memandu warga', is_correct: false, tkp_point: 4 },
          { label: 'C', content: 'Meminta rekan lain membantu', is_correct: false, tkp_point: 3 },
          { label: 'D', content: 'Menyarankan membawa pendamping keluarga', is_correct: false, tkp_point: 2 },
          { label: 'E', content: 'Memberikan brosur panduan', is_correct: false, tkp_point: 1 },
        ],
        explanation: 'Opsi A bernilai 5 poin karena responsif, berempati tinggi, dan inklusif.'
      }
    ]
  }
];

export default function CPNSAdminPanel() {
  const [packages, setPackages] = useState(INITIAL_PACKAGES);

  // Navigation State (Simple 3-level flow matching UTBK Tryout)
  // Level 1: 'packages' (Daftar Paket)
  // Level 2: 'subtests' (Kelola Tryout - Subtes TWK, TIU, TKP)
  // Level 3: 'questions' (Kelola Soal dalam Subtes)
  const [viewLevel, setViewLevel] = useState('packages');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedSubtest, setSelectedSubtest] = useState(null); // 'TWK' | 'TIU' | 'TKP'

  // Subtest Question Tab inside Level 3
  const [questionTab, setQuestionTab] = useState('list'); // 'list' | 'manual' | 'excel'

  // Question Edit & Preview States
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  // Package Modal State (Create / Edit Package Info)
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPkgObj, setEditingPkgObj] = useState(null);
  const [packageForm, setPackageForm] = useState({
    title: '',
    duration_total: 100,
    scheduled_at: '',
    end_date: '',
    is_active: true,
    is_public: true,
    passing_grade: { twk: 65, tiu: 80, tkp: 166 }
  });

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // --- LEVEL 1: PACKAGE ACTIONS ---
  const handleOpenCreatePackageModal = () => {
    setEditingPkgObj(null);
    setPackageForm({
      title: '',
      duration_total: 100,
      scheduled_at: '',
      end_date: '',
      is_active: true,
      is_public: true,
      passing_grade: { twk: 65, tiu: 80, tkp: 166 }
    });
    setShowPackageModal(true);
  };

  const handleOpenEditPackageModal = (pkg, e) => {
    e.stopPropagation();
    setEditingPkgObj(pkg);
    setPackageForm({
      title: pkg.title || '',
      duration_total: pkg.duration_total || 100,
      scheduled_at: pkg.scheduled_at || '',
      end_date: pkg.end_date || '',
      is_active: pkg.is_active !== undefined ? pkg.is_active : true,
      is_public: pkg.is_public !== undefined ? pkg.is_public : true,
      passing_grade: {
        twk: pkg.passing_grade?.twk ?? 65,
        tiu: pkg.passing_grade?.tiu ?? 80,
        tkp: pkg.passing_grade?.tkp ?? 166,
      }
    });
    setShowPackageModal(true);
  };

  const handleSavePackageModal = (e) => {
    e.preventDefault();
    if (!packageForm.title.trim()) {
      toast.error('Judul paket wajib diisi!');
      return;
    }

    if (editingPkgObj) {
      // Update Package
      setPackages(prev => prev.map(p => p.id === editingPkgObj.id ? { ...p, ...packageForm } : p));
      if (selectedPackage?.id === editingPkgObj.id) {
        setSelectedPackage(prev => ({ ...prev, ...packageForm }));
      }
      toast.success('Paket tryout berhasil diperbarui');
    } else {
      // Create Package
      const newPkg = {
        id: `pkg-cpns-${Date.now()}`,
        ...packageForm,
        questions: []
      };
      setPackages(prev => [newPkg, ...prev]);
      toast.success('Paket tryout baru berhasil dibuat');
    }
    setShowPackageModal(false);
  };

  const handleDeletePackage = (pkgId, e) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus paket tryout ini beserta seluruh soal di dalamnya?')) {
      setPackages(prev => prev.filter(p => p.id !== pkgId));
      if (selectedPackage?.id === pkgId) {
        setSelectedPackage(null);
        setViewLevel('packages');
      }
      toast.success('Paket berhasil dihapus');
    }
  };

  // Select Package to Manage (Go to Level 2: Subtests View)
  const handleSelectPackageToManage = (pkg) => {
    setSelectedPackage(pkg);
    setViewLevel('subtests');
  };

  // Select Subtest to Manage Questions (Go to Level 3: Questions View)
  const handleSelectSubtestToManage = (subtestName) => {
    setSelectedSubtest(subtestName);
    setQuestionTab('list');
    setEditingQuestion(null);
    setEditingIndex(null);
    setViewLevel('questions');
  };

  // --- LEVEL 3: QUESTION ACTIONS INSIDE SUBTEST ---
  const getSubtestQuestions = () => {
    if (!selectedPackage || !selectedSubtest) return [];
    return (selectedPackage.questions || []).filter(q => q.category === selectedSubtest);
  };

  const handleSaveQuestionInSubtest = (questionData) => {
    const questionsArr = [...(selectedPackage.questions || [])];

    if (editingIndex !== null && editingIndex >= 0) {
      // Find global index of question in package array
      const subQuestions = questionsArr.filter(q => q.category === selectedSubtest);
      const targetQ = subQuestions[editingIndex];
      const globalIdx = questionsArr.findIndex(q => q === targetQ || q.id === targetQ?.id);

      if (globalIdx !== -1) {
        questionsArr[globalIdx] = { ...questionsArr[globalIdx], ...questionData, category: selectedSubtest };
      }
    } else {
      // New Question
      questionsArr.push({
        id: `q-${selectedSubtest.toLowerCase()}-${Date.now()}`,
        ...questionData,
        category: selectedSubtest
      });
    }

    // Update package state
    const updatedPkg = { ...selectedPackage, questions: questionsArr };
    setSelectedPackage(updatedPkg);
    setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));

    toast.success(editingIndex !== null ? 'Soal berhasil diperbarui' : 'Soal baru berhasil ditambahkan');
    setEditingQuestion(null);
    setEditingIndex(null);
    setQuestionTab('list');
  };

  const handleDeleteQuestionInSubtest = (localIdx) => {
    if (!window.confirm('Hapus soal ini dari subtes?')) return;

    const subQuestions = getSubtestQuestions();
    const targetQ = subQuestions[localIdx];
    const updatedAll = (selectedPackage.questions || []).filter(q => q !== targetQ && q.id !== targetQ.id);

    const updatedPkg = { ...selectedPackage, questions: updatedAll };
    setSelectedPackage(updatedPkg);
    setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));
    toast.success('Soal berhasil dihapus');
  };

  const handleImportExcelInSubtest = (importedArr) => {
    const formatted = importedArr.map(q => ({
      ...q,
      category: selectedSubtest
    }));

    const updatedAll = [...(selectedPackage.questions || []), ...formatted];
    const updatedPkg = { ...selectedPackage, questions: updatedAll };
    setSelectedPackage(updatedPkg);
    setPackages(prev => prev.map(p => p.id === updatedPkg.id ? updatedPkg : p));

    toast.success(`${formatted.length} soal Excel berhasil diimport ke subtes ${selectedSubtest}`);
    setQuestionTab('list');
  };

  const subtestQuestions = getSubtestQuestions();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* --- LEVEL 1: DAFTAR PAKET TRYOUT --- */}
        {viewLevel === 'packages' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Kelola Tryout CPNS
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Buat paket tryout, kelola durasi, passing grade (TWK: 65, TIU: 80, TKP: 166), dan atur soal per subtes.
                </p>
              </div>

              <button
                onClick={handleOpenCreatePackageModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:translate-y-px shrink-0"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Buat Paket Baru
              </button>
            </div>

            {/* Package Cards List */}
            {packages.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 py-16 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-400 mb-3">quiz</span>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Belum ada paket tryout</h3>
                <p className="text-xs text-slate-500 mb-4">Mulai buat paket tryout CPNS baru Anda sekarang.</p>
                <button
                  onClick={handleOpenCreatePackageModal}
                  className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
                >
                  + Buat Paket Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => {
                  const twkCount = (pkg.questions || []).filter(q => q.category === 'TWK').length;
                  const tiuCount = (pkg.questions || []).filter(q => q.category === 'TIU').length;
                  const tkpCount = (pkg.questions || []).filter(q => q.category === 'TKP').length;
                  const totalCount = (pkg.questions || []).length;

                  return (
                    <div
                      key={pkg.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-md hover:border-blue-500 transition-all flex flex-col justify-between group space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            pkg.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pkg.is_active ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                            {pkg.is_active ? 'Aktif' : 'Draft'}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleOpenEditPackageModal(pkg, e)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded"
                              title="Edit Info Paket"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              onClick={(e) => handleDeletePackage(pkg.id, e)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                              title="Hapus Paket"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2">
                          {pkg.title}
                        </h3>

                        <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[11px] font-bold p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <div className="text-blue-600">TWK: {twkCount}/30</div>
                          <div className="text-purple-600">TIU: {tiuCount}/35</div>
                          <div className="text-emerald-600">TKP: {tkpCount}/45</div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-semibold">
                          Total: <strong>{totalCount} Soal</strong> ({pkg.duration_total} mnt)
                        </span>

                        <button
                          onClick={() => handleSelectPackageToManage(pkg)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                        >
                          <span className="material-symbols-outlined text-base">settings</span>
                          Kelola Tryout
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- LEVEL 2: KELOLA TRYOUT (Overview Subtes TWK, TIU, TKP) --- */}
        {viewLevel === 'subtests' && selectedPackage && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full">
                  Paket Tryout: {selectedPackage.title}
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  Kelola Subtes CPNS
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pilih subtes untuk menambah, mengedit, atau mengimpor soal dari Excel.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedPackage(null);
                  setViewLevel('packages');
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl font-bold text-xs flex items-center gap-1.5 self-start sm:self-center"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Kembali ke Daftar Paket
              </button>
            </div>

            {/* Subtests Grid (3 Subtests: TWK, TIU, TKP) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* SUBTES 1: TWK */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900 p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded-full text-xs font-extrabold">
                      Subtes 1
                    </span>
                    <span className="text-xs font-bold text-slate-500">Target: 30 Soal</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">TWK (Tes Wawasan Kebangsaan)</h3>
                  <p className="text-xs text-slate-500 mt-1">Menguji Pancasila, UUD 1945, NKRI, Bhinneka Tunggal Ika, dan Bahasa Indonesia.</p>

                  <div className="mt-4 p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-blue-900 dark:text-blue-200">Soal Terisi:</span>
                      <span className="text-blue-700 dark:text-blue-300 font-extrabold text-sm">
                        {(selectedPackage.questions || []).filter(q => q.category === 'TWK').length} / 30
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">Passing Grade: <strong>{selectedPackage.passing_grade?.twk ?? 65} Poin</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectSubtestToManage('TWK')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-base">edit_note</span>
                  Kelola Soal TWK
                </button>
              </div>

              {/* SUBTES 2: TIU */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-900 p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded-full text-xs font-extrabold">
                      Subtes 2
                    </span>
                    <span className="text-xs font-bold text-slate-500">Target: 35 Soal</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">TIU (Tes Inteligensia Umum)</h3>
                  <p className="text-xs text-slate-500 mt-1">Menguji Kemampuan Verbal, Numerik (Berhitung, Deret), dan Figural/Analitis.</p>

                  <div className="mt-4 p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-purple-900 dark:text-purple-200">Soal Terisi:</span>
                      <span className="text-purple-700 dark:text-purple-300 font-extrabold text-sm">
                        {(selectedPackage.questions || []).filter(q => q.category === 'TIU').length} / 35
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">Passing Grade: <strong>{selectedPackage.passing_grade?.tiu ?? 80} Poin</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectSubtestToManage('TIU')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-base">edit_note</span>
                  Kelola Soal TIU
                </button>
              </div>

              {/* SUBTES 3: TKP */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900 p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-extrabold">
                      Subtes 3
                    </span>
                    <span className="text-xs font-bold text-slate-500">Target: 45 Soal</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">TKP (Tes Karakteristik Pribadi)</h3>
                  <p className="text-xs text-slate-500 mt-1">Menguji Pelayanan Publik, Profesionalisme, Jejaring Kerja, dan Teknologi Informasi.</p>

                  <div className="mt-4 p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-900 dark:text-emerald-200">Soal Terisi:</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                        {(selectedPackage.questions || []).filter(q => q.category === 'TKP').length} / 45
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">Passing Grade: <strong>{selectedPackage.passing_grade?.tkp ?? 166} Poin</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectSubtestToManage('TKP')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-base">edit_note</span>
                  Kelola Soal TKP
                </button>
              </div>

            </div>
          </div>
        )}

        {/* --- LEVEL 3: KELOLA SOAL DALAM SUBTES (TWK / TIU / TKP) --- */}
        {viewLevel === 'questions' && selectedPackage && selectedSubtest && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
            
            {/* Top Subtest Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold uppercase">
                    {selectedPackage.title}
                  </span>
                  <span className="text-slate-400 font-bold">•</span>
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Subtes {selectedSubtest}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Kelola Soal Subtes: {selectedSubtest}
                </h2>
              </div>

              <button
                onClick={() => {
                  setSelectedSubtest(null);
                  setViewLevel('subtests');
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl font-bold text-xs flex items-center gap-1.5 self-start sm:self-center"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Kembali ke Subtes
              </button>
            </div>

            {/* Subtest Action Tabs (Daftar Soal, Import Excel, Input Manual) */}
            <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                onClick={() => {
                  setQuestionTab('list');
                  setEditingQuestion(null);
                  setEditingIndex(null);
                }}
                className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                  questionTab === 'list'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">format_list_bulleted</span>
                Daftar Soal ({subtestQuestions.length})
              </button>

              <button
                onClick={() => {
                  setQuestionTab('excel');
                }}
                className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                  questionTab === 'excel'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">table_chart</span>
                Import Excel
              </button>

              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setEditingIndex(null);
                  setQuestionTab('manual');
                }}
                className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                  questionTab === 'manual'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                Input Manual
              </button>
            </div>

            {/* Body per Tab */}
            <div className="p-6">
              
              {/* TAB 1: DAFTAR SOAL SUBTES */}
              {questionTab === 'list' && (
                <div className="space-y-4">
                  {subtestQuestions.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
                      <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">description</span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum Ada Soal dalam Subtes {selectedSubtest}</h3>
                      <p className="text-xs text-slate-500 mt-1 mb-4">Tambahkan soal baru secara manual atau import berkas dari Excel.</p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setQuestionTab('excel')}
                          className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-base">table_chart</span>
                          Import Excel
                        </button>
                        <button
                          onClick={() => {
                            setEditingQuestion(null);
                            setEditingIndex(null);
                            setQuestionTab('manual');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-base">add_circle</span>
                          Input Manual
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subtestQuestions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <span className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                              {idx + 1}
                            </span>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {q.topic && (
                                  <span className="text-[10px] bg-white dark:bg-slate-700 px-2 py-0.5 rounded font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                    {q.topic}
                                  </span>
                                )}
                                {q.image_url && (
                                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-bold uppercase">
                                    Gambar ({q.image_position || 'middle'})
                                  </span>
                                )}
                              </div>

                              {q.stimulus && (
                                <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold line-clamp-1">
                                  Stimulus: {q.stimulus}
                                </p>
                              )}

                              <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                                <MathText text={q.content} />
                              </div>

                              <div className="text-[11px] font-bold text-slate-500 pt-0.5">
                                {selectedSubtest === 'TKP' ? (
                                  <span>
                                    Bobot Skor A-E: {q.choices.map(c => `${c.label}:${c.tkp_point}`).join(', ')}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    Kunci Jawaban: Opsi {q.choices.find(c => c.is_correct)?.label || '-'} (5 Poin)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 self-end md:self-center">
                            <button
                              onClick={() => setPreviewQuestion(q)}
                              className="p-1.5 text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs"
                              title="Pratinjau Soal"
                            >
                              <span className="material-symbols-outlined text-base">visibility</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingQuestion(q);
                                setEditingIndex(idx);
                                setQuestionTab('manual');
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg text-xs"
                              title="Edit Soal"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteQuestionInSubtest(idx)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-xs"
                              title="Hapus Soal"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INPUT MANUAL SOAL */}
              {questionTab === 'manual' && (
                <CPNSQuestionForm
                  initialData={editingQuestion ? { ...editingQuestion, category: selectedSubtest } : { category: selectedSubtest }}
                  categories={[selectedSubtest]}
                  onSave={handleSaveQuestionInSubtest}
                  onCancel={() => setQuestionTab('list')}
                />
              )}

              {/* TAB 3: IMPORT EXCEL SOAL */}
              {questionTab === 'excel' && (
                <CPNSExcelImportModal
                  isOpen={true}
                  defaultCategory={selectedSubtest}
                  onClose={() => setQuestionTab('list')}
                  onImportSuccess={handleImportExcelInSubtest}
                />
              )}
            </div>
          </div>
        )}

      </div>

      {/* Package Modal (Create / Edit Package Info) */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <form onSubmit={handleSavePackageModal} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="bg-blue-600 p-5 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingPkgObj ? 'Edit Informasi Paket Tryout' : 'Buat Paket Tryout Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPackageModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Judul Paket <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={packageForm.title}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Tryout SKD CPNS 2026 - Paket 1"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Durasi Ujian (Menit)
                </label>
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={packageForm.duration_total}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, duration_total: parseInt(e.target.value, 10) || 100 }))}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold"
                />
                <span className="text-[10px] text-slate-500">Standar SKD CPNS = 100 Menit</span>
              </div>

              {/* Passing Grade Default CPNS BKN */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 space-y-2">
                <span className="font-bold text-blue-900 dark:text-blue-300 uppercase block">
                  Passing Grade Default BKN CPNS:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="font-semibold text-slate-600 block">TWK</span>
                    <input
                      type="number"
                      value={packageForm.passing_grade.twk}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, passing_grade: { ...prev.passing_grade, twk: parseInt(e.target.value, 10) || 65 } }))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border rounded font-bold"
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600 block">TIU</span>
                    <input
                      type="number"
                      value={packageForm.passing_grade.tiu}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, passing_grade: { ...prev.passing_grade, tiu: parseInt(e.target.value, 10) || 80 } }))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border rounded font-bold"
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600 block">TKP</span>
                    <input
                      type="number"
                      value={packageForm.passing_grade.tkp}
                      onChange={(e) => setPackageForm(prev => ({ ...prev, passing_grade: { ...prev.passing_grade, tkp: parseInt(e.target.value, 10) || 166 } }))}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 border rounded font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPackageModal(false)}
                className="px-4 py-2 border rounded-xl font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm"
              >
                Simpan Paket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Question Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn my-auto">
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
                Preview Soal {previewQuestion.category}
              </span>
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {previewQuestion.image_url && previewQuestion.image_position === 'top' && (
                <div className="flex justify-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <img src={previewQuestion.image_url} alt="Top" className="max-h-52 object-contain rounded" />
                </div>
              )}

              {previewQuestion.stimulus && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded text-xs text-slate-800 dark:text-slate-200">
                  <span className="font-bold text-amber-900 dark:text-amber-400 block mb-1">STIMULUS / BACAAN:</span>
                  <MathText text={previewQuestion.stimulus} />
                </div>
              )}

              {previewQuestion.image_url && previewQuestion.image_position === 'middle' && (
                <div className="flex justify-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <img src={previewQuestion.image_url} alt="Middle" className="max-h-52 object-contain rounded" />
                </div>
              )}

              <div className="font-semibold text-slate-900 dark:text-white text-sm leading-relaxed">
                <MathText text={previewQuestion.content} />
              </div>

              {previewQuestion.image_url && previewQuestion.image_position === 'bottom' && (
                <div className="flex justify-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <img src={previewQuestion.image_url} alt="Bottom" className="max-h-52 object-contain rounded" />
                </div>
              )}

              <div className="space-y-2 pt-1">
                {previewQuestion.choices.map((c) => (
                  <div
                    key={c.label}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      c.is_correct && previewQuestion.category !== 'TKP'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 font-bold text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{c.label}.</span>
                      <MathText text={c.content} />
                    </div>
                    <span className="text-[11px] font-bold opacity-80 shrink-0 ml-2">
                      {previewQuestion.category === 'TKP' ? `Skor: ${c.tkp_point}` : c.is_correct ? 'Kunci (5 Poin)' : '0 Poin'}
                    </span>
                  </div>
                ))}
              </div>

              {previewQuestion.explanation && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-xs text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-900 space-y-1">
                  <strong className="block font-bold">Pembahasan:</strong>
                  <MathText text={previewQuestion.explanation} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
