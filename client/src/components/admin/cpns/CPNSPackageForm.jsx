import React, { useState, useEffect } from 'react';
import MathText from '../../MathText';
import CPNSQuestionForm from './CPNSQuestionForm';
import CPNSExcelImportModal from './CPNSExcelImportModal';
import toast from 'react-hot-toast';

export default function CPNSPackageForm({
  initialData = null,
  onSave,
  onCancel,
}) {
  const DEFAULT_PASSING_GRADES = {
    twk: 65,
    tiu: 80,
    tkp: 166,
  };

  const [packageForm, setPackageForm] = useState({
    title: '',
    description: '',
    duration_total: 100, // minutes
    start_date: '',
    end_date: '',
    is_active: true,
    is_public: true,
    passing_grade: {
      twk: DEFAULT_PASSING_GRADES.twk,
      tiu: DEFAULT_PASSING_GRADES.tiu,
      tkp: DEFAULT_PASSING_GRADES.tkp,
    },
    // Soal dikelola LANGSUNG di dalam paket ini
    questions: [],
  });

  // Active Tab inside Package Editor
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'TWK' | 'TIU' | 'TKP'

  // Question Form Modal State (Create / Edit question inside package)
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  // Excel Import Modal State
  const [showExcelModal, setShowExcelModal] = useState(false);

  // Question Preview Modal State
  const [previewQuestion, setPreviewQuestion] = useState(null);

  useEffect(() => {
    if (initialData) {
      setPackageForm({
        title: initialData.title || '',
        description: initialData.description || '',
        duration_total: initialData.duration_total || initialData.duration_min || 100,
        start_date: initialData.start_date || initialData.scheduled_at ? formatDateForInput(initialData.start_date || initialData.scheduled_at) : '',
        end_date: initialData.end_date ? formatDateForInput(initialData.end_date) : '',
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        is_public: initialData.is_public !== undefined ? initialData.is_public : true,
        passing_grade: {
          twk: initialData.passing_grade?.twk ?? DEFAULT_PASSING_GRADES.twk,
          tiu: initialData.passing_grade?.tiu ?? DEFAULT_PASSING_GRADES.tiu,
          tkp: initialData.passing_grade?.tkp ?? DEFAULT_PASSING_GRADES.tkp,
        },
        questions: initialData.questions || [],
      });
    }
  }, [initialData]);

  function formatDateForInput(dateString) {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 16);
    } catch (e) {
      return '';
    }
  }

  // Reset to default passing grade (TWK: 65, TIU: 80, TKP: 166)
  const handleResetPassingGrade = () => {
    setPackageForm(prev => ({
      ...prev,
      passing_grade: { ...DEFAULT_PASSING_GRADES }
    }));
    toast.success('Passing Grade direset ke standar resmi CPNS (TWK: 65, TIU: 80, TKP: 166)');
  };

  // --- Handlers Questions directly inside Package ---

  // Add / Edit Single Question
  const handleSaveQuestionDirect = (questionData) => {
    setPackageForm(prev => {
      const updatedQuestions = [...prev.questions];
      if (editingQuestionIndex !== null && editingQuestionIndex >= 0) {
        // Update existing question
        updatedQuestions[editingQuestionIndex] = {
          ...updatedQuestions[editingQuestionIndex],
          ...questionData
        };
      } else {
        // Append new question to package
        updatedQuestions.push({
          id: `q-pkg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          ...questionData
        });
      }
      return { ...prev, questions: updatedQuestions };
    });

    toast.success(editingQuestionIndex !== null ? 'Soal diperbarui' : 'Soal berhasil ditambahkan ke paket');
    setShowQuestionModal(false);
    setEditingQuestion(null);
    setEditingQuestionIndex(null);
  };

  // Delete question from package
  const handleDeleteQuestionDirect = (indexInAll) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus soal ini dari paket?')) {
      setPackageForm(prev => {
        const updated = prev.questions.filter((_, idx) => idx !== indexInAll);
        return { ...prev, questions: updated };
      });
      toast.success('Soal dihapus dari paket');
    }
  };

  // Batch Import questions from Excel directly into package
  const handleImportExcelDirect = (importedQuestions) => {
    setPackageForm(prev => ({
      ...prev,
      questions: [...prev.questions, ...importedQuestions]
    }));
    toast.success(`${importedQuestions.length} soal dari Excel berhasil ditambahkan ke paket ini!`);
  };

  // Get question counts per category
  const twkQuestions = packageForm.questions.filter(q => q.category === 'TWK');
  const tiuQuestions = packageForm.questions.filter(q => q.category === 'TIU');
  const tkpQuestions = packageForm.questions.filter(q => q.category === 'TKP');

  const handleSubmitPackage = (e) => {
    e.preventDefault();
    if (!packageForm.title.trim()) {
      toast.error('Judul Paket Tryout wajib diisi!');
      return;
    }

    if (packageForm.questions.length === 0) {
      toast.error('Tambahkan setidaknya 1 soal ke dalam paket tryout!');
      return;
    }

    onSave && onSave(packageForm);
  };

  return (
    <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-5xl mx-auto my-4 transition-all">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 px-6 py-5 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
              {initialData ? 'Edit Paket Tryout' : 'Buat Paket Tryout CPNS'}
            </span>
            <span className="bg-amber-400 text-slate-950 text-xs px-2.5 py-0.5 rounded-full font-bold">
              Manajemen Soal Langsung di Paket
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1 text-white">
            {initialData ? 'Edit Paket & Kelola Soal CPNS' : 'Buat Paket Tryout CPNS Baru'}
          </h2>
          <p className="text-xs text-purple-100 mt-0.5">
            Kelola soal TWK, TIU, TKP, Passing Grade (65/80/166), dan import Excel secara langsung di dalam paket ini.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white/15 p-1 rounded-xl backdrop-blur-md border border-white/20 flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">settings</span>
            Informasi Paket
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TWK')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'TWK'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <span>TWK</span>
            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {twkQuestions.length}/30
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TIU')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'TIU'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <span>TIU</span>
            <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {tiuQuestions.length}/35
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TKP')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'TKP'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <span>TKP</span>
            <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {tkpQuestions.length}/45
            </span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmitPackage} className="p-6 space-y-6">
        {/* Real-time Question Counter Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">TWK (Tes Wawasan)</span>
            <div className="text-lg font-black text-blue-900 dark:text-blue-100 flex items-baseline gap-1">
              {twkQuestions.length} <span className="text-xs font-normal text-slate-500">/ 30 Soal</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-900 h-1.5 rounded-full mt-1 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (twkQuestions.length / 30) * 100)}%` }} />
            </div>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-lg">
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">TIU (Inteligensium)</span>
            <div className="text-lg font-black text-purple-900 dark:text-purple-100 flex items-baseline gap-1">
              {tiuQuestions.length} <span className="text-xs font-normal text-slate-500">/ 35 Soal</span>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-900 h-1.5 rounded-full mt-1 overflow-hidden">
              <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (tiuQuestions.length / 35) * 100)}%` }} />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">TKP (Karakteristik)</span>
            <div className="text-lg font-black text-emerald-900 dark:text-emerald-100 flex items-baseline gap-1">
              {tkpQuestions.length} <span className="text-xs font-normal text-slate-500">/ 45 Soal</span>
            </div>
            <div className="w-full bg-emerald-200 dark:bg-emerald-900 h-1.5 rounded-full mt-1 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (tkpQuestions.length / 45) * 100)}%` }} />
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">Total Soal Dalam Paket</span>
            <div className="text-lg font-black text-amber-900 dark:text-amber-100 flex items-baseline gap-1">
              {packageForm.questions.length} <span className="text-xs font-normal text-slate-500">/ 110 Soal</span>
            </div>
            <div className="w-full bg-amber-200 dark:bg-amber-900 h-1.5 rounded-full mt-1 overflow-hidden">
              <div className="bg-amber-600 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (packageForm.questions.length / 110) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* TAB 1: INFORMASI PAKET & PASSING GRADE */}
        {activeTab === 'settings' ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Judul Paket Tryout CPNS <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={packageForm.title}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Tryout Nasional CPNS SKD 2026 Batch 1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Deskripsi Paket
                </label>
                <textarea
                  rows={3}
                  value={packageForm.description}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi singkat atau petunjuk pengerjaan tryout CPNS..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Durasi & Tanggal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Durasi Ujian (Menit) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={300}
                    value={packageForm.duration_total}
                    onChange={(e) => setPackageForm(prev => ({ ...prev, duration_total: parseInt(e.target.value, 10) || 100 }))}
                    className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-500">Menit</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Standar SKD CPNS = 100 menit</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Tanggal & Waktu Buka
                </label>
                <input
                  type="datetime-local"
                  value={packageForm.start_date}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Tanggal & Waktu Tutup
                </label>
                <input
                  type="datetime-local"
                  value={packageForm.end_date}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Passing Grade Default (TWK: 65, TIU: 80, TKP: 166) */}
            <div className="p-5 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200 dark:border-indigo-900/50 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600">verified</span>
                    Passing Grade Default (Nilai Ambang Batas CPNS)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Nilai ambang batas kelulusan per subtes sesuai PermenPANRB BKN.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetPassingGrade}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Reset Standar BKN (65/80/166)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900">
                  <label className="block text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-1">
                    Passing Grade TWK
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={150}
                      value={packageForm.passing_grade.twk}
                      onChange={(e) => setPackageForm(prev => ({
                        ...prev,
                        passing_grade: { ...prev.passing_grade, twk: parseInt(e.target.value, 10) || 0 }
                      }))}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-extrabold text-blue-900 dark:text-blue-100"
                    />
                    <span className="text-xs font-semibold text-slate-500">Poin</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Default BKN = 65 (30 Soal)</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900">
                  <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 uppercase mb-1">
                    Passing Grade TIU
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={175}
                      value={packageForm.passing_grade.tiu}
                      onChange={(e) => setPackageForm(prev => ({
                        ...prev,
                        passing_grade: { ...prev.passing_grade, tiu: parseInt(e.target.value, 10) || 0 }
                      }))}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-extrabold text-purple-900 dark:text-purple-100"
                    />
                    <span className="text-xs font-semibold text-slate-500">Poin</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Default BKN = 80 (35 Soal)</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900">
                  <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase mb-1">
                    Passing Grade TKP
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={225}
                      value={packageForm.passing_grade.tkp}
                      onChange={(e) => setPackageForm(prev => ({
                        ...prev,
                        passing_grade: { ...prev.passing_grade, tkp: parseInt(e.target.value, 10) || 0 }
                      }))}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-extrabold text-emerald-900 dark:text-emerald-100"
                    />
                    <span className="text-xs font-semibold text-slate-500">Poin</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Default BKN = 166 (45 Soal)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TAB SUBTES: KELOLA SOAL TWK / TIU / TKP LANGSUNG DI PAKET */
          <div className="space-y-4">
            {/* Header Subtes Section */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800 p-4 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Daftar Soal Subtes:
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-xs text-white ${
                    activeTab === 'TWK' ? 'bg-blue-600' : activeTab === 'TIU' ? 'bg-purple-600' : 'bg-emerald-600'
                  }`}>
                    {activeTab}
                  </span>
                  ({activeTab === 'TWK' ? twkQuestions.length : activeTab === 'TIU' ? tiuQuestions.length : tkpQuestions.length} Soal)
                </h3>
              </div>

              {/* Action Buttons inside Package */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExcelModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">table_chart</span>
                  Import Excel ({activeTab})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingQuestion(null);
                    setEditingQuestionIndex(null);
                    setShowQuestionModal(true);
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Tambah Soal {activeTab}
                </button>
              </div>
            </div>

            {/* List Soal dalam Subtes Paket Ini */}
            <div className="space-y-3">
              {(activeTab === 'TWK' ? twkQuestions : activeTab === 'TIU' ? tiuQuestions : tkpQuestions).length === 0 ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">quiz</span>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada soal {activeTab} di paket ini</h4>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Klik tombol Tambah Soal atau Import Excel di atas untuk mulai menambah soal.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingQuestion(null);
                      setEditingQuestionIndex(null);
                      setShowQuestionModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    + Tambah Soal {activeTab} Pertama
                  </button>
                </div>
              ) : (
                (activeTab === 'TWK' ? twkQuestions : activeTab === 'TIU' ? tiuQuestions : tkpQuestions).map((q, idx) => {
                  const globalIndex = packageForm.questions.findIndex(item => item === q || item.id === q.id);
                  return (
                    <div
                      key={q.id || idx}
                      className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                          {idx + 1}
                        </span>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {q.topic && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold text-slate-600 dark:text-slate-400">
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

                          {/* Key / Score Badge */}
                          <div className="text-[11px] font-bold text-slate-500 pt-1">
                            {activeTab === 'TKP' ? (
                              <span>
                                Bobot Opsi: {q.choices.map(c => `${c.label}:${c.tkp_point}`).join(', ')}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                Kunci Jawaban: Opsi {q.choices.find(c => c.is_correct)?.label || '-'} (5 Poin)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions for Question inside Package */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => setPreviewQuestion(q)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs"
                          title="Pratinjau Soal"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestion(q);
                            setEditingQuestionIndex(globalIndex);
                            setShowQuestionModal(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg text-xs"
                          title="Edit Soal"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestionDirect(globalIndex)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-xs"
                          title="Hapus Soal"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 font-semibold">
            Total {packageForm.questions.length} soal tersimpan di dalam paket ini.
          </div>

          <div className="flex items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">save</span>
              Simpan Paket Tryout CPNS
            </button>
          </div>
        </div>
      </form>

      {/* Question Form Modal directly for this package */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CPNSQuestionForm
              initialData={editingQuestion ? { ...editingQuestion, category: activeTab !== 'settings' ? activeTab : editingQuestion.category } : { category: activeTab !== 'settings' ? activeTab : 'TWK' }}
              categories={['TWK', 'TIU', 'TKP']}
              onSave={handleSaveQuestionDirect}
              onCancel={() => {
                setShowQuestionModal(false);
                setEditingQuestion(null);
                setEditingQuestionIndex(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Excel Import Modal directly for this package */}
      <CPNSExcelImportModal
        isOpen={showExcelModal}
        defaultCategory={activeTab !== 'settings' ? activeTab : 'TWK'}
        onClose={() => setShowExcelModal(false)}
        onImportSuccess={handleImportExcelDirect}
      />

      {/* Preview Modal */}
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
