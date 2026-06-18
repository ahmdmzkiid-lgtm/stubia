import React, { useState, useEffect, useRef } from 'react';
import { subjectService, adminService, soalService } from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ImageUpload from '../../components/ImageUpload';
import MathText from '../../components/MathText';

const ManageBattleSoal = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSubject, setSelectedSubject] = useState(null);
  
  // Question list states
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsPagination, setQuestionsPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Import Excel state
  const [showImportSection, setShowImportSection] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importDifficulty, setImportDifficulty] = useState('medium');
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const importFileRef = useRef(null);

  // Edit question state
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await subjectService.list();
      const rawSubjects = res.data?.data || [];
      
      const UTBK_ORDER = [
        "Penalaran Umum",
        "Pengetahuan dan Pemahaman Umum",
        "Pemahaman Bacaan dan Tulisan",
        "Pengetahuan Kuantitatif",
        "Literasi Bahasa Indonesia",
        "Literasi Bahasa Inggris",
        "Penalaran Matematika"
      ];
      
      const filteredSorted = rawSubjects
        .filter(s => UTBK_ORDER.includes(s.name))
        .sort((a, b) => UTBK_ORDER.indexOf(a.name) - UTBK_ORDER.indexOf(b.name));
        
      setSubjects(filteredSorted);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat daftar subtes');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (subjectId, page = 1) => {
    setQuestionsLoading(true);
    try {
      const res = await soalService.list({ subject_id: subjectId, source: 'battle', page, limit: 20 });
      const questionsList = Array.isArray(res.data?.data) ? res.data.data : [];
      setQuestions(questionsList);
      setQuestionsPagination({ total: questionsList.length, page, totalPages: 1 }); // Backend currently doesn't return totalPages, assuming 1 for now or handling manually
    } catch (err) {
      toast.error('Gagal memuat soal battle');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleOpenSubject = (subject) => {
    setSelectedSubject(subject);
    setShowImportSection(false);
    fetchQuestions(subject.id);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setQuestions([]);
    setShowImportSection(false);
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Hapus soal ini?')) return;
    try {
      await soalService.delete(id);
      toast.success('Soal berhasil dihapus');
      fetchQuestions(selectedSubject.id, questionsPagination.page);
    } catch (err) {
      toast.error('Gagal menghapus soal');
    }
  };

  const handleDeleteAllQuestions = async () => {
    if (!window.confirm('Peringatan: Anda akan menghapus SEMUA soal battle di subtes ini. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) return;
    try {
      const res = await soalService.deleteAllBySubject(selectedSubject.id, { source: 'battle' });
      toast.success(res.data?.message || 'Semua soal battle berhasil dihapus');
      fetchQuestions(selectedSubject.id, 1);
    } catch (err) {
      toast.error('Gagal menghapus semua soal');
    }
  };

  const handleShuffleChoices = async (e, questionId) => {
    e.stopPropagation();
    try {
      await soalService.shuffleChoices(questionId);
      toast.success('Jawaban berhasil diacak!');
      fetchQuestions(selectedSubject.id, questionsPagination.page);
    } catch (err) {
      toast.error('Gagal mengacak jawaban');
    }
  };

  const handleEditQuestion = (e, question) => {
    e.stopPropagation();
    setEditingQuestion({ ...question });
    setShowEditQuestionModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    try {
      await soalService.update(editingQuestion.id, {
        content: editingQuestion.content,
        difficulty: editingQuestion.difficulty,
        image_url: editingQuestion.image_url || null
      });
      toast.success('Soal berhasil disimpan');
      setShowEditQuestionModal(false);
      setEditingQuestion(null);
      fetchQuestions(selectedSubject.id, questionsPagination.page);
    } catch (err) {
      toast.error('Gagal menyimpan soal');
    }
  };

  const handleImportFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImportFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        setImportPreview(json);
      } catch { setImportPreview([]); }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImportUpload = async () => {
    if (!importFile || !selectedSubject) return;
    setImportLoading(true);
    const fd = new FormData();
    fd.append('file', importFile);
    fd.append('subject_id', selectedSubject.id);
    fd.append('difficulty', importDifficulty);
    fd.append('destination', 'battle'); // Flag for battle questions
    try {
      const res = await adminService.importExcel(fd);
      const { importedCount, rejectedCount, errors: importErrors } = res.data.data || {};
      if (importedCount > 0) {
        toast.success(`${importedCount} soal battle berhasil diimport!`);
      }
      if (rejectedCount > 0) {
        toast.error(
          `${rejectedCount} soal gagal diimport. Cek format Excel:\n` +
          (importErrors?.slice(0, 3).join('\n') || 'Periksa kolom SOAL, OPSI A-E, KUNCI JAWABAN, PEMBAHASAN')
        );
      }
      if (importedCount === 0 && rejectedCount === 0) {
        toast.error('Tidak ada soal yang diimport. Pastikan file Excel tidak kosong.');
      }
      setImportFile(null);
      setImportPreview([]);
      if (importedCount > 0) {
        setShowImportSection(false);
        fetchQuestions(selectedSubject.id);
      }
    } catch {
      // handled by interceptor
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="animate-fade-in bg-surface min-h-screen pb-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        
        {/* Breadcrumb / Back Navigation */}
        <div className="pt-8 mb-4">
          <nav className="flex items-center gap-2 text-[12px] font-semibold text-[#727687] uppercase tracking-wider">
            <button 
              onClick={handleBackToSubjects}
              className={`hover:text-[#0050cb] transition-colors ${!selectedSubject ? 'text-[#0050cb]' : 'text-[#727687]'}`}
            >
              Battle 1vs1 Management
            </button>
            {selectedSubject && (
              <>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-[#0050cb]">{selectedSubject.title}</span>
              </>
            )}
          </nav>
        </div>

        {/* Dynamic Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-[48px] font-bold text-[#191b24] leading-tight">
              {selectedSubject ? `Bank Soal Battle: ${selectedSubject.title}` : 'Bank Soal Battle 1vs1'}
            </h1>
            <p className="text-[18px] text-[#424656] mt-2 max-w-2xl">
              {selectedSubject 
                ? `Kelola daftar soal khusus untuk fitur Battle 1vs1 di subtes ${selectedSubject.title}.`
                : 'Pilih subtes untuk mengelola dan meng-upload soal khusus fitur Battle 1vs1 (Multiplayer).'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {selectedSubject && (
              <>
                <button 
                  onClick={handleBackToSubjects}
                  className="px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 bg-white border border-[#c2c6d8]/50 text-[#424656] hover:bg-[#f2f3ff] transition-all"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Kembali
                </button>
                <button 
                  onClick={() => setShowImportSection(!showImportSection)}
                  className="bg-[#0050cb] text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-[#0050cb]/20 transition-all active:translate-y-px"
                >
                  <span className="material-symbols-outlined">upload_file</span>
                  Import Excel
                </button>
              </>
            )}
          </div>
        </div>

        {selectedSubject ? (
          <div className="space-y-6 animate-fade-in-up">
            {/* Import Excel Section */}
            {showImportSection && (
              <div className="bg-white border border-[#c2c6d8]/30 rounded-2xl p-8 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-[20px] font-bold text-[#191b24]">Import Soal Battle dari Excel</h3>
                    <p className="text-[14px] text-[#424656] mt-1">Soal akan ditandai khusus untuk Battle di subtes <strong>{selectedSubject.title}</strong></p>
                  </div>
                  <button onClick={() => { setShowImportSection(false); setImportFile(null); setImportPreview([]); }} className="p-2 text-[#727687] hover:text-[#ba1a1a] rounded-full">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8">
                  {/* File Drop Zone */}
                  <div 
                    className={`flex-1 border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${
                      importFile ? 'border-green-400 bg-green-50' : 'border-[#c2c6d8] hover:border-[#0050cb] bg-[#f2f3ff]/30'
                    }`}
                    onClick={() => importFileRef.current?.click()}
                  >
                    <input type="file" accept=".xlsx,.xls" className="hidden" ref={importFileRef} onChange={handleImportFileChange} />
                    {importFile ? (
                      <div>
                        <span className="material-symbols-outlined text-green-600 text-[48px] mb-4">check_circle</span>
                        <p className="font-bold text-[18px] text-[#191b24]">{importFile.name}</p>
                        <p className="text-[15px] text-[#727687] mt-2"><strong>{importPreview.length}</strong> soal terdeteksi</p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setImportFile(null); setImportPreview([]); }} className="text-[#ba1a1a] text-[14px] font-bold mt-4 hover:underline px-4 py-2 rounded-lg hover:bg-red-50">Ganti File</button>
                      </div>
                    ) : (
                      <div>
                        <span className="material-symbols-outlined text-[#727687] text-[48px] mb-4">upload_file</span>
                        <p className="font-bold text-[18px] text-[#424656]">Klik untuk pilih file Excel</p>
                        <p className="text-[14px] text-[#727687] mt-2">Format .xlsx atau .xls didukung</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Config */}
                  <div className="w-full md:w-80 space-y-6">
                    <div>
                      <label className="block text-[13px] font-bold text-[#727687] uppercase tracking-wider mb-3">Tingkat Kesulitan Default</label>
                      <select 
                        className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#0050cb] text-[15px] font-medium"
                        value={importDifficulty}
                        onChange={e => setImportDifficulty(e.target.value)}
                      >
                        <option value="easy">Mudah</option>
                        <option value="medium">Sedang</option>
                        <option value="hard">Sulit</option>
                      </select>
                    </div>
                    <button
                      onClick={handleImportUpload}
                      disabled={!importFile || importLoading}
                      className="w-full bg-[#0050cb] text-white py-4 rounded-xl font-bold text-[16px] flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-[#0050cb]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importLoading ? (
                        <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> Mengimport...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[20px]">cloud_upload</span> Upload Soal Battle</>
                      )}
                    </button>
                    <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-[13px] leading-relaxed border border-blue-100">
                      <span className="font-bold block mb-1">Informasi:</span>
                      Soal yang diupload akan otomatis ditandai sebagai <code>source = 'battle'</code> dan hanya akan muncul saat user mencari lawan di fitur Battle 1vs1.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Questions List */}
            {questionsLoading ? (
              <div className="flex items-center justify-center py-20">
                <span className="material-symbols-outlined animate-spin text-[32px] text-[#0050cb]">progress_activity</span>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[40px] border border-[#c2c6d8]/30">
                <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">quiz</span>
                <p className="text-[#727687] font-medium">Belum ada soal battle untuk subtes ini.</p>
                <p className="text-[14px] text-[#727687] mt-2 mb-6">Soal latihan biasa tidak akan muncul di sini. Silakan import dari Excel.</p>
                {!showImportSection && (
                  <button 
                    onClick={() => setShowImportSection(true)}
                    className="bg-[#0050cb] text-white px-8 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:shadow-lg transition-all"
                  >
                    <span className="material-symbols-outlined">upload_file</span>
                    Import Excel Sekarang
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 px-2">
                  <h3 className="font-bold text-[#191b24] text-[18px]">Total {questions.length} Soal Battle</h3>
                  <button
                    onClick={handleDeleteAllQuestions}
                    className="text-[13px] font-bold text-[#ba1a1a] bg-[#ffdad6] hover:bg-[#ffb4ab] px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                    Hapus Semua Soal
                  </button>
                </div>
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="bg-white border border-[#c2c6d8]/30 rounded-2xl overflow-hidden hover:shadow-md transition-all">
                      <div 
                        className="p-6 flex items-start gap-4 cursor-pointer"
                        onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                      >
                        <span className="w-10 h-10 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-[#0050cb] font-bold text-[14px] flex-shrink-0">
                          {(questionsPagination.page - 1) * 20 + idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <MathText className="text-[15px] text-[#191b24] font-medium line-clamp-2 whitespace-pre-wrap" text={q.content || ''} />
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md ${
                              q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              q.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                              'bg-[#f2f3ff] text-[#0050cb]'
                            }`}>
                              {q.difficulty === 'easy' ? 'Mudah' : q.difficulty === 'hard' ? 'Sulit' : 'Sedang'}
                            </span>
                            <span className="text-[11px] text-[#727687] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-md font-bold">BATTLE</span>
                            <span className="text-[11px] text-[#727687]">{q.choices?.length || 0} opsi</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            title="Edit soal"
                            onClick={(e) => handleEditQuestion(e, q)}
                            className="p-2 text-[#727687] hover:text-[#0050cb] hover:bg-[#dae1ff]/30 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            title="Acak urutan jawaban"
                            onClick={(e) => handleShuffleChoices(e, q.id)}
                            className="p-2 text-[#727687] hover:text-[#0050cb] hover:bg-[#dae1ff]/30 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">shuffle</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }}
                            className="p-2 text-[#727687] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/30 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                          <span className="material-symbols-outlined text-[20px] text-[#727687] transition-transform" style={{ transform: expandedQuestion === q.id ? 'rotate(180deg)' : 'none' }}>
                            expand_more
                          </span>
                        </div>
                      </div>
                      {expandedQuestion === q.id && q.choices && (
                        <div className="px-6 pb-6 pt-0 border-t border-[#c2c6d8]/20 mt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                            {q.choices.map(c => (
                              <div key={c.id} className={`p-3 rounded-xl border text-[14px] flex items-start gap-3 ${
                                c.is_correct ? 'border-green-300 bg-green-50' : 'border-[#c2c6d8]/30 bg-[#f2f3ff]/50'
                              }`}>
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                                  c.is_correct ? 'bg-green-500 text-white' : 'bg-[#c2c6d8]/30 text-[#424656]'
                                }`}>{c.label}</span>
                                <div className="flex-1 min-w-0">
                                  <MathText className={c.is_correct ? 'text-green-800 font-medium whitespace-pre-wrap' : 'text-[#191b24] whitespace-pre-wrap'} text={c.content || ''} />
                                  {c.is_correct && c.explanation && (
                                    <MathText className="text-[12px] text-green-700 mt-1 italic whitespace-pre-wrap block" text={c.explanation} />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                {questionsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    {Array.from({ length: questionsPagination.totalPages }, (_, i) => i + 1).slice(0, 10).map(p => (
                      <button
                        key={p}
                        onClick={() => fetchQuestions(selectedSubject.id, p)}
                        className={`w-10 h-10 rounded-xl font-bold text-[14px] transition-all ${
                          p === questionsPagination.page
                            ? 'bg-[#0050cb] text-white shadow-lg'
                            : 'bg-white border border-[#c2c6d8]/30 text-[#424656] hover:bg-[#f2f3ff]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
            {loading ? (
              [1,2,3,4,5,6,7].map(i => (
                <div key={i} className="bg-white h-[200px] rounded-[24px] border border-[#c2c6d8]/30 animate-pulse"></div>
              ))
            ) : (
              (subjects || []).map((s) => (
                <div 
                  key={s.id} 
                  className="bg-white border border-[#c2c6d8]/30 rounded-[24px] p-6 hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div 
                      className="p-3 rounded-xl transition-transform group-hover:scale-110 duration-300 shadow-sm"
                      style={{ backgroundColor: s.bg_color || '#dae1ff', color: s.icon_color || '#0050cb' }}
                    >
                      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon || 'school'}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-[20px] font-bold text-[#191b24] mb-2 leading-tight">
                    {s.title || s.name}
                  </h3>
                  <p className="text-[13px] text-[#727687] mb-6 line-clamp-2">{s.description || 'Kelola bank soal untuk subtes ini.'}</p>
                  
                  <div className="mt-auto pt-6 border-t border-[#c2c6d8]/20 flex gap-2">
                    <button 
                      onClick={() => handleOpenSubject(s)}
                      className="flex-1 py-3 bg-[#f2f3ff] text-[#0050cb] hover:bg-[#0050cb] hover:text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-[13px]"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      Kelola Soal
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Question Modal */}
      {showEditQuestionModal && editingQuestion && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowEditQuestionModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-[#191b24]">Edit Soal Battle</h3>
              <button onClick={() => setShowEditQuestionModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[14px] font-bold text-[#191b24] mb-2">Pertanyaan</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8]/40 focus:border-[#0050cb] focus:outline-none text-[15px] min-h-[120px] resize-y"
                  value={editingQuestion.content}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                />
              </div>

              <ImageUpload
                label="Gambar Soal (opsional)"
                value={editingQuestion.image_url || ''}
                onChange={(url) => setEditingQuestion({ ...editingQuestion, image_url: url })}
                folder="battle/soal"
                aspectRatio="aspect-video"
              />

              <div>
                <label className="block text-[14px] font-bold text-[#191b24] mb-2">Tingkat Kesulitan</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8]/40 focus:border-[#0050cb] focus:outline-none text-[15px]"
                  value={editingQuestion.difficulty}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                >
                  <option value="easy">Mudah</option>
                  <option value="medium">Sedang</option>
                  <option value="hard">Sulit</option>
                </select>
              </div>

              {editingQuestion.choices && editingQuestion.choices.length > 0 && (
                <div>
                  <label className="block text-[14px] font-bold text-[#191b24] mb-2">Pilihan Jawaban</label>
                  <div className="space-y-2">
                    {editingQuestion.choices.map(c => (
                      <div key={c.id} className={`p-3 rounded-xl border text-[14px] flex items-start gap-3 ${
                        c.is_correct ? 'border-green-300 bg-green-50' : 'border-[#c2c6d8]/30 bg-[#f2f3ff]/50'
                      }`}>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                          c.is_correct ? 'bg-green-500 text-white' : 'bg-[#c2c6d8]/30 text-[#424656]'
                        }`}>{c.label}</span>
                        <MathText className={c.is_correct ? 'text-green-800 font-medium' : 'text-[#191b24]'} text={c.content || ''} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[12px] text-[#727687] mt-2">* Pilihan jawaban tidak dapat diedit di sini. Gunakan import Excel untuk mengganti soal.</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-[#c2c6d8]/20">
                <button
                  onClick={handleSaveQuestion}
                  className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Simpan
                </button>
                <button
                  onClick={() => setShowEditQuestionModal(false)}
                  className="border border-[#c2c6d8]/40 text-[#424656] px-5 py-3 rounded-xl font-bold text-[14px] hover:bg-[#f2f3ff] transition-all"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBattleSoal;
