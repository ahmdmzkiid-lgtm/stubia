import React, { useState, useEffect, useRef } from "react";
import { skdService } from "../../services/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import ImageUpload from "../../components/ImageUpload";
import MathText from "../../components/MathText";
import { useAuth } from "../../hooks/useAuth";

const PLAN_ORDER = { gratis: 0, premium: 1, sultan: 2 };

const ICON_OPTIONS = [
  "calculate",
  "psychology",
  "menu_book",
  "translate",
  "functions",
  "bar_chart",
  "change_history",
  "category",
  "school",
  "edit_note",
  "language",
  "public",
  "flag",
  "description",
  "find_in_page",
  "notes",
  "segment",
  "data_object",
  "numbers",
  "chat",
  "star",
  "history_edu",
];

const ManageLatihanSKD = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsPagination, setQuestionsPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Import Excel state
  const [showImportSection, setShowImportSection] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importDifficulty, setImportDifficulty] = useState("medium");
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const importFileRef = useRef(null);

  // Modal States
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [subjectForm, setSubjectForm] = useState({
    passing_grade: 0,
    is_active: true,
    question_count: 30,
    duration_minutes: 30
  });

  const [topicForm, setTopicForm] = useState({
    title: "",
    description: "",
    icon: "notes",
    difficulty_level: "Dasar",
    display_order: 1,
    is_popular: false,
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchTopics(selectedSubject.id);
    }
  }, [selectedSubject]);

  const fetchQuestions = async (subjectId, topicId, page = 1) => {
    setQuestionsLoading(true);
    try {
      const res = await skdService.adminGetQuestions({
        subject_id: subjectId,
        topic_id: topicId,
        package_id: "latihan-umum",
        page,
        limit: 20,
      });
      const questionsList = Array.isArray(res.data?.data) ? res.data.data : [];
      setQuestions(questionsList);
      const pag = res.data?.pagination || { total: questionsList.length, pages: 1 };
      setQuestionsPagination({
        total: pag.total || questionsList.length,
        page,
        totalPages: pag.pages || 1,
      });
    } catch (err) {
      toast.error("Gagal memuat soal");
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleOpenKelolaSoal = (topic) => {
    setSelectedTopic(topic);
    fetchQuestions(selectedSubject.id, topic.id);
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Hapus soal ini?")) return;
    try {
      await skdService.adminDeleteQuestion(id);
      toast.success("Soal berhasil dihapus");
      fetchQuestions(
        selectedSubject.id,
        selectedTopic?.id,
        questionsPagination.page,
      );
    } catch (err) {
      toast.error("Gagal menghapus soal");
    }
  };

  const handleEditQuestion = (e, question) => {
    e.stopPropagation();
    // Pre-populate editing question choices ensuring A-E exists
    const choices = question.choices && question.choices.length > 0 ? question.choices.map(c => ({
      id: c.id,
      label: c.label,
      content: c.content || '',
      is_correct: !!c.is_correct,
      tkp_point: c.tkp_point || 0,
      explanation: c.explanation || ''
    })) : [
      { label: 'A', content: '', is_correct: false, tkp_point: 0, explanation: '' },
      { label: 'B', content: '', is_correct: false, tkp_point: 0, explanation: '' },
      { label: 'C', content: '', is_correct: false, tkp_point: 0, explanation: '' },
      { label: 'D', content: '', is_correct: false, tkp_point: 0, explanation: '' },
      { label: 'E', content: '', is_correct: false, tkp_point: 0, explanation: '' },
    ];

    setEditingQuestion({
      ...question,
      choices
    });
    setShowEditQuestionModal(true);
  };

  const handleOpenAddQuestion = () => {
    setEditingQuestion({
      content: '',
      stimulus: '',
      image_url: '',
      image_position: 'bottom',
      difficulty: 'medium',
      topic_id: selectedTopic.id,
      choices: [
        { label: 'A', content: '', is_correct: false, tkp_point: 0, explanation: '' },
        { label: 'B', content: '', is_correct: false, tkp_point: 0, explanation: '' },
        { label: 'C', content: '', is_correct: false, tkp_point: 0, explanation: '' },
        { label: 'D', content: '', is_correct: false, tkp_point: 0, explanation: '' },
        { label: 'E', content: '', is_correct: false, tkp_point: 0, explanation: '' },
      ]
    });
    setShowEditQuestionModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    if (!editingQuestion.content.trim()) {
      toast.error('Konten soal wajib diisi');
      return;
    }
    const emptyChoice = editingQuestion.choices.find(c => !c.content.trim());
    if (emptyChoice) {
      toast.error(`Pilihan ${emptyChoice.label} masih kosong`);
      return;
    }

    const isTkp = selectedSubject.is_tkp;
    if (!isTkp) {
      const correctCount = editingQuestion.choices.filter(c => c.is_correct).length;
      if (correctCount !== 1) {
        toast.error('Harap pilih tepat satu jawaban benar');
        return;
      }
    }

    try {
      const payload = {
        subject_id: selectedSubject.id,
        tryout_package_id: null,
        content: editingQuestion.content,
        difficulty: editingQuestion.difficulty,
        image_url: editingQuestion.image_url || null,
        image_position: editingQuestion.image_position || 'bottom',
        stimulus: editingQuestion.stimulus || null,
        topic_id: selectedTopic.id,
        choices: editingQuestion.choices
      };

      if (editingQuestion.id) {
        await skdService.adminUpdateQuestion(editingQuestion.id, payload);
        toast.success("Soal berhasil disimpan");
      } else {
        await skdService.adminCreateQuestion(payload);
        toast.success("Soal berhasil ditambahkan");
      }
      setShowEditQuestionModal(false);
      setEditingQuestion(null);
      fetchQuestions(
        selectedSubject.id,
        selectedTopic?.id,
        questionsPagination.page,
      );
    } catch (err) {
      toast.error("Gagal menyimpan soal");
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
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        setImportPreview(json);
      } catch {
        setImportPreview([]);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImportUpload = async () => {
    if (!importFile || !selectedSubject || !selectedTopic) return;
    setImportLoading(true);
    const fd = new FormData();
    fd.append("file", importFile);
    fd.append("subject_id", selectedSubject.id);
    fd.append("topic_id", selectedTopic.id);
    fd.append("package_id", "latihan-umum");
    try {
      const res = await skdService.adminImportExcel(fd);
      toast.success(res.data?.message || 'Soal berhasil diimport');
      setImportFile(null);
      setImportPreview([]);
      setShowImportSection(false);
      fetchQuestions(selectedSubject.id, selectedTopic.id);
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal mengimport file Excel");
    } finally {
      setImportLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await skdService.adminGetSubjects();
      setSubjects(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (subjectId) => {
    try {
      const res = await skdService.adminGetTopics(subjectId);
      setTopics(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await skdService.adminUpdateSubject(editingItem.id, subjectForm);
      toast.success("Subtes diperbarui");
      fetchSubjects();
      setShowSubjectModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui subtes");
    }
    setIsSubmitting(false);
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await skdService.adminUpdateTopic(editingItem.id, topicForm);
        toast.success("Topik diperbarui");
      } else {
        await skdService.adminCreateTopic(selectedSubject.id, topicForm);
        toast.success("Topik ditambahkan");
      }
      fetchTopics(selectedSubject.id);
      setShowTopicModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan topik");
    }
    setIsSubmitting(false);
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm("Hapus topik ini?")) return;
    try {
      await skdService.adminDeleteTopic(id);
      toast.success("Topik dihapus");
      fetchTopics(selectedSubject.id);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus topik");
    }
  };

  const handleOpenSubjectModal = (item) => {
    setEditingItem(item);
    setSubjectForm({
      passing_grade: item.passing_grade || 0,
      is_active: item.is_active !== undefined ? item.is_active : true,
      question_count: item.question_count || 30,
      duration_minutes: item.duration_minutes || 30
    });
    setShowSubjectModal(true);
  };

  const handleOpenTopicModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setTopicForm({
        title: item.title || "",
        description: item.description || "",
        icon: item.icon || "notes",
        difficulty_level: item.difficulty_level || "Dasar",
        display_order: item.display_order || 1,
        is_popular: !!item.is_popular,
      });
    } else {
      setEditingItem(null);
      setTopicForm({
        title: "",
        description: "",
        icon: "notes",
        difficulty_level: "Dasar",
        display_order: (topics.length || 0) + 1,
        is_popular: false,
      });
    }
    setShowTopicModal(true);
  };

  const handleDeleteBulkQuestions = async () => {
    if (!window.confirm(`APAKAH ANDA YAKIN? Semua soal latihan pada topik ini akan dihapus secara permanen.`)) {
      return;
    }
    try {
      await skdService.adminDeleteBulkQuestions({
        subject_id: selectedSubject.id,
        topic_id: selectedTopic.id,
        package_id: 'latihan-umum'
      });
      toast.success('Semua soal berhasil dihapus');
      fetchQuestions(selectedSubject.id, selectedTopic.id);
    } catch (err) {
      toast.error('Gagal menghapus soal massal');
    }
  };

  return (
    <div className="animate-fade-in bg-surface min-h-screen pb-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        {/* Breadcrumb / Back Navigation */}
        <div className="pt-8 mb-4">
          <nav className="flex items-center gap-2 text-[12px] font-semibold text-[#727687] uppercase tracking-wider">
            <button
              onClick={() => {
                setSelectedSubject(null);
                setSelectedTopic(null);
              }}
              className="hover:text-[#0050cb] transition-colors"
            >
              Practice SKD
            </button>
            <span className="material-symbols-outlined text-[14px]">
              chevron_right
            </span>
            <span
              className={selectedSubject ? "text-[#727687]" : "text-[#0050cb]"}
            >
              Subtes
            </span>
            {selectedSubject && (
              <>
                <span className="material-symbols-outlined text-[14px]">
                  chevron_right
                </span>
                <button
                  onClick={() => {
                    setSelectedTopic(null);
                  }}
                  className={`hover:text-[#0050cb] transition-colors ${selectedTopic ? "text-[#727687]" : "text-[#0050cb]"}`}
                >
                  {selectedSubject.name}
                </button>
              </>
            )}
            {selectedTopic && (
              <>
                <span className="material-symbols-outlined text-[14px]">
                  chevron_right
                </span>
                <span className="text-[#0050cb]">Kelola Soal</span>
              </>
            )}
          </nav>
        </div>

        {/* Dynamic Header */}
        <div className="flex flex-col gap-4 mb-8 sm:mb-12">
          <div>
            <h1 className="text-[26px] sm:text-[36px] md:text-[48px] font-bold text-[#191b24] leading-tight break-words">
              {selectedTopic
                ? `Kelola Soal: ${selectedTopic.title}`
                : selectedSubject
                  ? `Kelola Paket Latihan: ${selectedSubject.name}`
                  : "Kelola Kategori Latihan SKD CPNS"}
            </h1>
            <p className="text-[14px] sm:text-[16px] md:text-[18px] text-[#424656] mt-2 max-w-2xl">
              {selectedTopic
                ? `Daftar soal untuk paket ${selectedTopic.title}. Total: ${questionsPagination.total} soal.`
                : selectedSubject
                  ? `Kelola daftar paket latihan dan bank soal untuk subtes ${selectedSubject.name}.`
                  : "Pilih kategori subtes untuk mengelola paket latihan dan bank soal."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {(selectedSubject || selectedTopic) && (
              <button
                onClick={() =>
                  selectedTopic
                    ? setSelectedTopic(null)
                    : setSelectedSubject(null)
                }
                className="flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-white border border-[#c2c6d8]/50 text-[#424656] hover:bg-[#f2f3ff] transition-all text-[14px]"
              >
                <span className="material-symbols-outlined text-[18px]">
                  arrow_back
                </span>
                Kembali
              </button>
            )}
            {selectedTopic ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowImportSection(!showImportSection)}
                  className="flex-1 sm:flex-none bg-[#0050cb] text-white px-4 sm:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#0050cb]/20 transition-all active:translate-y-px text-[14px]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    upload_file
                  </span>
                  Import Excel
                </button>
                <button
                  onClick={handleOpenAddQuestion}
                  className="flex-1 sm:flex-none bg-emerald-600 text-white px-4 sm:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:translate-y-px text-[14px]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add_circle
                  </span>
                  Tambah Manual
                </button>
                <button
                  onClick={handleDeleteBulkQuestions}
                  className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-4 sm:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:translate-y-px text-[14px]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    delete_sweep
                  </span>
                  Hapus Semua Soal
                </button>
              </div>
            ) : (
              !selectedTopic && (
                <button
                  onClick={() =>
                    selectedSubject
                      ? handleOpenTopicModal()
                      : null
                  }
                  className={`flex-1 sm:flex-none bg-[#0050cb] text-white px-4 sm:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#0050cb]/20 transition-all active:translate-y-px text-[14px] ${!selectedSubject ? 'hidden' : ''}`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add_circle
                  </span>
                  Tambah Paket Baru
                </button>
              )
            )}
          </div>
        </div>

        {/* View Switcher */}
        {selectedTopic ? (
          /* LEVEL 3: Questions List for Selected Topic */
          <div className="space-y-6 animate-fade-in-up">
            {/* Inline Import Excel Section */}
            {showImportSection && (
              <div className="bg-white border border-[#c2c6d8]/30 rounded-2xl p-4 sm:p-6 shadow-sm animate-fade-in">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="min-w-0">
                    <h3 className="text-[16px] sm:text-[18px] font-bold text-[#191b24] leading-snug">
                      Import Soal dari Excel
                    </h3>
                    <p className="text-[13px] text-[#424656] mt-1">
                      Subtes:{" "}
                      <strong className="break-words">
                        {selectedSubject.name}
                      </strong>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowImportSection(false);
                      setImportFile(null);
                      setImportPreview([]);
                    }}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[#727687] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      close
                    </span>
                  </button>
                </div>

                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-5 sm:p-8 text-center cursor-pointer transition-colors mb-4 ${
                    importFile
                      ? "border-green-400 bg-green-50"
                      : "border-[#c2c6d8] hover:border-[#0050cb] bg-[#f2f3ff]/30"
                  }`}
                  onClick={() => importFileRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    ref={importFileRef}
                    onChange={handleImportFileChange}
                  />
                  {importFile ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-green-600 text-[28px]">
                        check_circle
                      </span>
                      <p className="font-bold text-[#191b24] text-[14px] break-all">
                        {importFile.name}
                      </p>
                      <p className="text-[13px] text-[#727687]">
                        <strong>{importPreview.length}</strong> soal terdeteksi
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImportFile(null);
                          setImportPreview([]);
                        }}
                        className="text-[#ba1a1a] text-[13px] font-bold mt-1 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-[#727687] text-[28px]">
                        upload_file
                      </span>
                      <p className="font-semibold text-[#424656] text-[14px]">
                        Ketuk untuk pilih file Excel
                      </p>
                      <p className="text-[12px] text-[#727687]">
                        .xlsx atau .xls
                      </p>
                    </div>
                  )}
                </div>

                {/* Config row */}
                <div className="flex justify-end">
                  <button
                    onClick={handleImportUpload}
                    disabled={!importFile || importLoading}
                    className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[14px] whitespace-nowrap"
                  >
                    {importLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>{" "}
                        Mengimport...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">
                          cloud_upload
                        </span>{" "}
                        Import
                        {importPreview.length > 0
                          ? ` ${importPreview.length} Soal`
                          : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {questionsLoading ? (
              <div className="flex items-center justify-center py-20">
                <span className="material-symbols-outlined animate-spin text-[32px] text-[#0050cb]">
                  progress_activity
                </span>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[40px] border border-[#c2c6d8]/30">
                <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">
                  quiz
                </span>
                <p className="text-[#727687] font-medium">
                  Belum ada soal untuk subtes ini.
                </p>
                <p className="text-[14px] text-[#727687] mt-2 mb-6">
                  Import soal dari file Excel atau tambah manual.
                </p>
                {!showImportSection && (
                  <button
                    onClick={() => setShowImportSection(true)}
                    className="bg-[#0050cb] text-white px-8 py-3 rounded-xl font-bold inline-flex items-center gap-2 hover:shadow-lg transition-all"
                  >
                    <span className="material-symbols-outlined">
                      upload_file
                    </span>
                    Import Excel Sekarang
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-5">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="bg-white border border-[#c2c6d8]/30 rounded-2xl overflow-hidden hover:shadow-md transition-all"
                    >
                      {/* Header: Number + Action Buttons */}
                      <div className="px-6 pt-5 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-[#0050cb] font-bold text-[14px] flex-shrink-0">
                            {(questionsPagination.page - 1) * 20 + idx + 1}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg ${
                                q.difficulty === "easy"
                                  ? "bg-green-100 text-green-700"
                                  : q.difficulty === "hard"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-[#f2f3ff] text-[#0050cb]"
                              }`}
                            >
                              {q.difficulty === "easy"
                                ? "Mudah"
                                : q.difficulty === "hard"
                                  ? "Sulit"
                                  : "Sedang"}
                            </span>
                            <span className="text-[11px] text-[#727687]">
                              {q.choices?.length || 0} opsi
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            title="Edit soal"
                            onClick={(e) => handleEditQuestion(e, q)}
                            className="p-2 text-[#727687] hover:text-[#0050cb] hover:bg-[#dae1ff]/30 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-2 text-[#727687] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/30 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>

                      {q.stimulus && (
                        <div className="mx-6 mb-3 bg-[#faf8ff] border border-[#c2c6d8]/20 p-4 rounded-xl">
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-2">Stimulus / Wacana</p>
                          <MathText
                            className="text-[15px] text-[#191b24] font-medium leading-relaxed whitespace-pre-line"
                            text={q.stimulus}
                          />
                        </div>
                      )}

                      <div className="px-6 pb-3">
                        <MathText
                          className="text-[15px] text-[#191b24] font-semibold leading-relaxed whitespace-pre-line"
                          text={q.content || ""}
                        />
                      </div>

                      {q.image_url && (
                        <div className="mx-6 mb-3">
                          <img
                            src={q.image_url}
                            alt="Gambar soal"
                            className="max-h-[220px] rounded-xl border border-[#c2c6d8]/20 object-contain bg-slate-50 p-2"
                          />
                        </div>
                      )}

                      {/* Answer Choices */}
                      {q.choices && q.choices.length > 0 && (
                        <div className="px-6 pb-5 pt-2 border-t border-[#c2c6d8]/15 mt-2 bg-[#fcfdff]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-3">
                            {q.choices.map((c) => {
                              const isTkp = selectedSubject.is_tkp;
                              return (
                                <div
                                  key={c.id}
                                  className={`p-3 rounded-xl border text-[14px] flex items-start gap-3 ${
                                    !isTkp && c.is_correct
                                      ? "border-green-300 bg-green-50"
                                      : "border-[#c2c6d8]/30 bg-white"
                                  }`}
                                >
                                  <span
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                                      !isTkp && c.is_correct ? "bg-green-500 text-white" : "bg-[#c2c6d8]/30 text-[#424656]"
                                    }`}
                                  >
                                    {c.label}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <MathText
                                      className={!isTkp && c.is_correct ? "text-green-800 font-semibold" : "text-[#191b24]"}
                                      text={c.content || ""}
                                    />
                                    {isTkp && (
                                      <span className="inline-block mt-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                        Poin: {c.tkp_point || 0}
                                      </span>
                                    )}
                                    {c.explanation && (
                                      <p className="text-[12px] text-slate-500 mt-1 italic"><strong className="text-slate-600">Pembahasan:</strong> {c.explanation}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {questionsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    {Array.from(
                      { length: questionsPagination.totalPages },
                      (_, i) => i + 1,
                    )
                      .slice(0, 10)
                      .map((p) => (
                        <button
                          key={p}
                          onClick={() =>
                            fetchQuestions(
                              selectedSubject.id,
                              selectedTopic.id,
                              p,
                            )
                          }
                          className={`w-10 h-10 rounded-xl font-bold text-[14px] transition-all ${
                            p === questionsPagination.page
                              ? "bg-[#0050cb] text-white shadow-lg"
                              : "bg-white border border-[#c2c6d8]/30 text-[#424656] hover:bg-[#f2f3ff]"
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
        ) : !selectedSubject ? (
          /* LEVEL 1: Subtest Grid (Bento) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading
              ? [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white h-[320px] rounded-3xl border border-[#c2c6d8]/30 animate-pulse"
                  ></div>
                ))
              : [...(subjects || [])]
                  .sort((a, b) => {
                    const planA = PLAN_ORDER[a.required_plan] ?? 1;
                    const planB = PLAN_ORDER[b.required_plan] ?? 1;
                    if (planA !== planB) return planA - planB;
                    return a.name.localeCompare(b.name);
                  })
                  .map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSubject(s)}
                      className="bg-white border border-[#c2c6d8]/30 rounded-3xl p-8 hover:shadow-2xl hover:shadow-[#0050cb]/5 transition-all group flex flex-col relative overflow-hidden cursor-pointer h-[320px] justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <div
                            className="p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300 shadow-sm"
                            style={{
                              backgroundColor: "#f2f3ff",
                              color: "#0050cb",
                            }}
                          >
                            <span
                              className="material-symbols-outlined text-[28px]"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              school
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenSubjectModal(s);
                              }}
                              className="p-2 text-[#727687] hover:text-[#0050cb] hover:bg-[#dae1ff]/30 rounded-full transition-colors"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                edit
                              </span>
                            </button>
                          </div>
                        </div>

                        <h3 className="text-[24px] font-bold text-[#191b24] mb-2 group-hover:text-[#0050cb] transition-colors leading-tight">
                          {s.name}
                        </h3>
                        <p className="text-[14px] text-[#424656] line-clamp-2">
                          {s.full_name || "Mata pelajaran persiapan SKD CPNS."}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-[#727687]">Passing Grade</span>
                          <span className="text-[14px] font-extrabold text-[#191b24]">{s.passing_grade || 0}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-[#727687]">Target Soal</span>
                          <span className="text-[14px] font-extrabold text-[#191b24]">{s.question_count || 0}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-[#727687]">Durasi</span>
                          <span className="text-[14px] font-extrabold text-[#191b24]">{s.duration_minutes || 0}m</span>
                        </div>
                      </div>
                    </div>
                  ))}
          </div>
        ) : (
          /* LEVEL 2: Topic List for Selected Subject */
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(topics || []).map((t, idx) => (
                <div
                  key={t.id}
                  className="bg-white border border-[#c2c6d8]/30 rounded-[32px] p-6 hover:shadow-xl transition-all group border-l-4 border-l-[#0050cb] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#dae1ff]/50 flex items-center justify-center text-[#0050cb] relative">
                        <span className="material-symbols-outlined text-[24px]">
                          {t.icon || "notes"}
                        </span>
                        <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#0050cb] text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                          {idx + 1}
                        </span>
                      </div>
                      {user?.role !== "quality_assurance" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenTopicModal(t)}
                            className="p-2 text-[#727687] hover:text-[#0050cb] hover:bg-[#dae1ff]/30 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(t.id)}
                            className="p-2 text-[#727687] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/30 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                    <h4 className="text-[18px] font-bold text-[#191b24] mb-1">
                      {t.title}
                    </h4>
                    <p className="text-[13px] text-[#424656] mb-4 line-clamp-2">
                      {t.description || "Topik pembelajaran latihan soal SKD."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#c2c6d8]/20">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-[#727687] uppercase bg-[#f2f3ff] px-2 py-0.5 rounded-md">
                        {t.difficulty_level || 'Dasar'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenKelolaSoal(t)}
                        className="text-[12px] font-bold text-[#0050cb] flex items-center gap-1 hover:underline"
                      >
                        Kelola Soal Paket
                        <span className="material-symbols-outlined text-[14px]">
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {/* Add Topic CTA */}
              <button
                onClick={() => handleOpenTopicModal()}
                className="border-2 border-dashed border-[#c2c6d8]/50 rounded-[32px] p-8 flex flex-col items-center justify-center text-center hover:border-[#0050cb] hover:bg-[#dae1ff]/10 transition-all group min-h-[220px]"
              >
                <div className="w-14 h-14 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#727687] group-hover:bg-[#0050cb] group-hover:text-white mb-4 transition-all">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <span className="font-bold text-[#424656] group-hover:text-[#0050cb]">
                  Tambah Paket Baru
                </span>
              </button>
            </div>
            {(!topics || topics.length === 0) && (
              <div className="text-center py-20 bg-white rounded-[40px] border border-[#c2c6d8]/30">
                <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">
                  folder_open
                </span>
                <p className="text-[#727687] font-medium">
                  Belum ada paket latihan untuk subtes ini. Mulai buat sekarang!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-10 border-b border-[#c2c6d8]/20 flex justify-between items-center bg-[#faf8ff]">
              <div>
                <h3 className="font-bold text-[28px] text-[#191b24]">
                  Konfigurasi Subtes SKD
                </h3>
                <p className="text-[14px] text-[#727687]">
                  Konfigurasi detail kategori latihan SKD CPNS.
                </p>
              </div>
              <button
                onClick={() => setShowSubjectModal(false)}
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white shadow-sm transition-all text-[#424656]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form
              onSubmit={handleSubjectSubmit}
              className="p-10 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar"
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-[14px] font-bold text-[#191b24] mb-2">Passing Grade *</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb] transition-all text-[15px]"
                    value={subjectForm.passing_grade}
                    onChange={(e) => setSubjectForm({ ...subjectForm, passing_grade: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] font-bold text-[#191b24] mb-2">Target Jumlah Soal *</label>
                    <input
                      type="number"
                      required
                      className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb]"
                      value={subjectForm.question_count}
                      onChange={(e) => setSubjectForm({ ...subjectForm, question_count: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-bold text-[#191b24] mb-2">Durasi Standar (Menit) *</label>
                    <input
                      type="number"
                      required
                      className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb]"
                      value={subjectForm.duration_minutes}
                      onChange={(e) => setSubjectForm({ ...subjectForm, duration_minutes: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 text-[14px] font-bold text-[#191b24] cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-[#c2c6d8] text-[#0050cb]"
                    checked={!!subjectForm.is_active}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        is_active: e.target.checked,
                      })
                    }
                  />
                  Aktifkan subtes
                </label>
              </div>
              <div className="pt-4">
                <button
                  disabled={isSubmitting}
                  className="w-full py-5 bg-[#0050cb] text-white rounded-[24px] font-bold text-[16px] hover:bg-[#003fa4] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Konfigurasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topic Modal */}
      {showTopicModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-10 border-b border-[#c2c6d8]/20 flex justify-between items-center bg-[#faf8ff]">
              <div>
                <h3 className="font-bold text-[28px] text-[#191b24]">
                  {editingItem ? "Edit Paket Latihan" : "Tambah Paket Baru"}
                </h3>
                <p className="text-[14px] text-[#727687]">
                  Konfigurasi detail paket latihan untuk {selectedSubject?.name}.
                </p>
              </div>
              <button
                onClick={() => setShowTopicModal(false)}
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white shadow-sm transition-all text-[#424656]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form
              onSubmit={handleTopicSubmit}
              className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10 overflow-y-auto max-h-[80vh] custom-scrollbar"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                    Nama Paket *
                  </label>
                  <input
                    required
                    className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb] transition-all"
                    value={topicForm.title}
                    onChange={(e) =>
                      setTopicForm({ ...topicForm, title: e.target.value })
                    }
                    placeholder="Misal: Paket Latihan 1"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb] transition-all resize-none"
                    value={topicForm.description}
                    onChange={(e) =>
                      setTopicForm({
                        ...topicForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Deskripsi singkat untuk kartu paket..."
                  />
                </div>
              </div>

              <div className="space-y-6 flex flex-col">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                      Urutan Display
                    </label>
                    <input
                      type="number"
                      className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb]"
                      value={topicForm.display_order}
                      onChange={(e) =>
                        setTopicForm({
                          ...topicForm,
                          display_order: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                      Level
                    </label>
                    <select
                      className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb]"
                      value={topicForm.difficulty_level}
                      onChange={(e) =>
                        setTopicForm({ ...topicForm, difficulty_level: e.target.value })
                      }
                    >
                      <option>Dasar</option>
                      <option>Menengah</option>
                      <option>Tingkat Lanjut</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-4 bg-[#f2f3ff] rounded-2xl border border-[#c2c6d8]/10">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={topicForm.is_popular}
                      onChange={(e) =>
                        setTopicForm({
                          ...topicForm,
                          is_popular: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-[#c2c6d8] text-[#0050cb] focus:ring-[#0050cb]"
                    />
                    <span className="text-[14px] font-bold text-[#424656] group-hover:text-[#0050cb] transition-colors">
                      Beri Tag "Populer"
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-[#191b24] mb-3">
                    Pilih Ikon
                  </label>
                  <div className="grid grid-cols-5 gap-3 p-4 bg-[#f2f3ff] rounded-2xl max-h-40 overflow-y-auto custom-scrollbar">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setTopicForm({ ...topicForm, icon })}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${topicForm.icon === icon ? "bg-[#0050cb] text-white shadow-lg" : "bg-white text-[#727687]"}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {icon}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <button
                    disabled={isSubmitting}
                    className="w-full py-5 bg-[#0050cb] text-white rounded-[24px] font-bold text-[16px] hover:bg-[#003fa4] transition-all disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Menyimpan..."
                      : editingItem
                        ? "Perbarui Paket Latihan"
                        : "Simpan Paket Latihan"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditQuestionModal && editingQuestion && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowEditQuestionModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-[#191b24]">
                {editingQuestion.id ? "Edit Soal" : "Tambah Soal"}
              </h3>
              <button
                onClick={() => setShowEditQuestionModal(false)}
                className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                  Stimulus / Wacana (opsional)
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8]/40 focus:border-[#0050cb] focus:outline-none text-[15px] min-h-[80px] resize-y bg-slate-50"
                  value={editingQuestion.stimulus || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      stimulus: e.target.value,
                    })
                  }
                  placeholder="Masukkan stimulus/wacana di sini (opsional). Akan ditampilkan di atas pertanyaan."
                />
              </div>

              <div>
                <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                  Pertanyaan *
                </label>
                <textarea
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8]/40 focus:border-[#0050cb] focus:outline-none text-[15px] min-h-[120px] resize-y"
                  value={editingQuestion.content}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      content: e.target.value,
                    })
                  }
                  placeholder="Ketik pertanyaan di sini..."
                />
              </div>

              <ImageUpload
                label="Gambar Soal (opsional)"
                value={editingQuestion.image_url || ""}
                onChange={(url) =>
                  setEditingQuestion({ ...editingQuestion, image_url: url })
                }
                folder="latihan/soal"
                aspectRatio="aspect-video"
              />

              {editingQuestion.image_url && (
                <div>
                  <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                    Posisi Gambar
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="image_position"
                        className="accent-[#0050cb]"
                        checked={['top', 'before', 'atas'].includes(editingQuestion.image_position)}
                        onChange={() => setEditingQuestion({ ...editingQuestion, image_position: 'top' })}
                      />
                      <span className="text-[14px] text-[#191b24]">Atas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="image_position"
                        className="accent-[#0050cb]"
                        checked={['middle', 'ditengah', 'tengah'].includes(editingQuestion.image_position)}
                        onChange={() => setEditingQuestion({ ...editingQuestion, image_position: 'middle' })}
                      />
                      <span className="text-[14px] text-[#191b24]">Tengah</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="image_position"
                        className="accent-[#0050cb]"
                        checked={['bottom', 'after', 'bawah'].includes(editingQuestion.image_position) || !editingQuestion.image_position}
                        onChange={() => setEditingQuestion({ ...editingQuestion, image_position: 'bottom' })}
                      />
                      <span className="text-[14px] text-[#191b24]">Bawah</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                  Tingkat Kesulitan
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8]/40 focus:border-[#0050cb] focus:outline-none text-[15px]"
                  value={editingQuestion.difficulty}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      difficulty: e.target.value,
                    })
                  }
                >
                  <option value="easy">Mudah</option>
                  <option value="medium">Sedang</option>
                  <option value="hard">Sulit</option>
                </select>
              </div>

              {/* Choices Editor */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="block text-[14px] font-bold text-[#191b24]">Pilihan Jawaban (5 Opsi PG)</label>
                {editingQuestion.choices.map((c, i) => {
                  const isTkp = selectedSubject.is_tkp;
                  return (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[#faf8ff] rounded-2xl border border-slate-100">
                      <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-[#424656] flex-shrink-0">
                        {c.label}
                      </span>
                      <input
                        type="text"
                        className="flex-grow bg-white border border-[#c2c6d8]/40 rounded-xl px-3 py-2 text-xs"
                        value={c.content}
                        onChange={(e) => {
                          const updated = [...editingQuestion.choices];
                          updated[i].content = e.target.value;
                          setEditingQuestion({ ...editingQuestion, choices: updated });
                        }}
                        placeholder={`Ketik jawaban pilihan ${c.label}...`}
                        required
                      />
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {isTkp ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-green-700">Poin:</span>
                            <input
                              type="number"
                              min="1"
                              max="5"
                              className="w-12 bg-white border border-[#c2c6d8]/40 rounded text-xs text-center font-bold"
                              value={c.tkp_point || 0}
                              onChange={(e) => {
                                const val = Math.min(5, Math.max(1, parseInt(e.target.value) || 1));
                                const updated = [...editingQuestion.choices];
                                updated[i].tkp_point = val;
                                setEditingQuestion({ ...editingQuestion, choices: updated });
                              }}
                            />
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="is_correct_edit"
                              checked={c.is_correct}
                              onChange={() => {
                                const updated = editingQuestion.choices.map((ch, idx) => ({
                                  ...ch,
                                  is_correct: idx === i
                                }));
                                setEditingQuestion({ ...editingQuestion, choices: updated });
                              }}
                              className="w-4 h-4 text-[#0050cb] focus:ring-[#0050cb] border-slate-300"
                            />
                            <span className="text-xs font-bold text-[#727687]">Jawaban Benar</span>
                          </label>
                        )}
                        {!isTkp && c.is_correct && (
                          <input
                            type="text"
                            className="bg-white border border-[#c2c6d8]/40 rounded-xl px-2 py-1.5 text-[10px] w-36"
                            value={c.explanation || ''}
                            onChange={(e) => {
                              const updated = [...editingQuestion.choices];
                              updated[i].explanation = e.target.value;
                              setEditingQuestion({ ...editingQuestion, choices: updated });
                            }}
                            placeholder="Pembahasan..."
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#c2c6d8]/20">
                <button
                  onClick={handleSaveQuestion}
                  className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    save
                  </span>
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

export default ManageLatihanSKD;
