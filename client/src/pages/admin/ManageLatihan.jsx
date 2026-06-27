import React, { useState, useEffect, useRef } from "react";
import { subjectService, soalService, adminService } from "../../services/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import ImageUpload from "../../components/ImageUpload";
import MathText from "../../components/MathText";

// Urutan kanonik subtes UTBK + prioritas plan
const SUBTEST_ORDER = [
  "penalaran umum",
  "pemahaman dan pengetahuan umum",
  "pengetahuan dan pemahaman umum",
  "pemahaman bacaan dan tulisan",
  "penalaran kuantitatif",
  "pengetahuan kuantitatif",
  "literasi bahasa indonesia",
  "literasi bahasa inggris",
  "penalaran matematika",
];

const PLAN_ORDER = { gratis: 0, premium: 1, sultan: 2 };

function getSubtestIdx(title) {
  const lower = (title || "").toLowerCase().trim();
  const idx = SUBTEST_ORDER.findIndex(
    (s) => lower.includes(s) || s.includes(lower),
  );
  return idx === -1 ? 999 : idx;
}

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

const ManageLatihan = () => {
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
    title: "",
    description: "",
    icon: "calculate",
    bgColor: "#dae1ff",
    iconColor: "#0050cb",
    requiredPlan: "gratis",
    is_active: true,
  });

  const [topicForm, setTopicForm] = useState({
    title: "",
    description: "",
    questions: "",
    icon: "calculate",
    level: "Dasar",
    type: "standard",
    isPopular: false,
    isFeatured: false,
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
      const res = await soalService.list({
        subject_id: subjectId,
        topic_id: topicId,
        page,
        limit: 20,
      });
      // Backend returns { success: true, data: [...] } directly
      const questionsList = Array.isArray(res.data?.data) ? res.data.data : [];
      setQuestions(questionsList);
      setQuestionsPagination({
        total: questionsList.length,
        page,
        totalPages: 1,
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
      await soalService.delete(id);
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

  const handleShuffleChoices = async (e, questionId) => {
    e.stopPropagation();
    try {
      await soalService.shuffleChoices(questionId);
      toast.success("Jawaban berhasil diacak!");
      fetchQuestions(
        selectedSubject.id,
        selectedTopic?.id,
        questionsPagination.page,
      );
    } catch (err) {
      toast.error("Gagal mengacak jawaban");
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
        image_url: editingQuestion.image_url || null,
        image_position: editingQuestion.image_position || 'bottom',
        stimulus: editingQuestion.stimulus || null,
      });
      toast.success("Soal berhasil disimpan");
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
    fd.append("difficulty", importDifficulty);
    fd.append("destination", "latihan");
    try {
      const res = await adminService.importExcel(fd);
      const {
        importedCount,
        rejectedCount,
        errors: importErrors,
      } = res.data.data || {};
      if (importedCount > 0) {
        toast.success(`${importedCount} soal berhasil diimport!`);
      }
      if (rejectedCount > 0) {
        toast.error(
          `${rejectedCount} soal gagal diimport. Cek format Excel:\n` +
            (importErrors?.slice(0, 3).join("\n") ||
              "Periksa kolom SOAL, OPSI A-E, KUNCI JAWABAN, PEMBAHASAN"),
        );
      }
      if (importedCount === 0 && rejectedCount === 0) {
        toast.error(
          "Tidak ada soal yang diimport. Pastikan file Excel tidak kosong.",
        );
      }
      setImportFile(null);
      setImportPreview([]);
      if (importedCount > 0) setShowImportSection(false);
      fetchQuestions(selectedSubject.id, selectedTopic.id);
    } catch {
      // handled by interceptor
    } finally {
      setImportLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await subjectService.list();
      setSubjects(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (subjectId) => {
    try {
      const res = await subjectService.listTopics(subjectId);
      setTopics(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await subjectService.update(editingItem.id, subjectForm);
        toast.success("Subtes diperbarui");
      } else {
        await subjectService.create(subjectForm);
        toast.success("Subtes ditambahkan");
      }
      fetchSubjects();
      setShowSubjectModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await subjectService.updateTopic(editingItem.id, topicForm);
        toast.success("Topik diperbarui");
      } else {
        await subjectService.createTopic(selectedSubject.id, topicForm);
        toast.success("Topik ditambahkan");
      }
      fetchTopics(selectedSubject.id);
      setShowTopicModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const handleDeleteSubject = async (e, id) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Hapus subtes ini? Semua data terkait akan ikut terhapus.",
      )
    )
      return;
    try {
      await subjectService.delete(id);
      toast.success("Subtes dihapus");
      fetchSubjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm("Hapus topik ini?")) return;
    try {
      await subjectService.deleteTopic(id);
      toast.success("Topik dihapus");
      fetchTopics(selectedSubject.id);
    } catch (err) {
      console.error(err);
    }
  };

  const PLAN_OPTIONS = [
    { value: "gratis", label: "Gratis", color: "bg-gray-100 text-gray-700" },
    { value: "premium", label: "Premium", color: "bg-blue-100 text-blue-700" },
    {
      value: "sultan",
      label: "Sultan",
      color: "bg-yellow-100 text-yellow-800",
    },
  ];

  const handleOpenSubjectModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setSubjectForm({
        title: item.title || "",
        description: item.description || "",
        icon: item.icon || "calculate",
        bgColor: item.bg_color || "#dae1ff",
        iconColor: item.icon_color || "#0050cb",
        requiredPlan: item.required_plan || "gratis",
        is_active: item.is_active !== undefined ? item.is_active : true,
      });
    } else {
      setEditingItem(null);
      setSubjectForm({
        title: "",
        description: "",
        icon: "calculate",
        bgColor: "#dae1ff",
        iconColor: "#0050cb",
        requiredPlan: "gratis",
        is_active: true,
      });
    }
    setShowSubjectModal(true);
  };

  const handleOpenTopicModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setTopicForm({
        title: item.title || "",
        description: item.description || "",
        questions: item.questions_count || "",
        icon: item.icon || "calculate",
        level: item.difficulty_level || "Dasar",
        type: item.card_type || "standard",
        isPopular: !!item.is_popular,
        isFeatured: !!item.is_featured,
      });
    } else {
      setEditingItem(null);
      setTopicForm({
        title: "",
        description: "",
        questions: "",
        icon: "calculate",
        level: "Dasar",
        type: "standard",
        isPopular: false,
        isFeatured: false,
      });
    }
    setShowTopicModal(true);
  };

  return (
    <div className="animate-fade-in bg-surface min-h-screen pb-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        {/* Breadcrumb / Back Navigation */}
        <div className="pt-8 mb-4">
          <nav className="flex items-center gap-2 text-[12px] font-semibold text-[#727687] uppercase tracking-wider">
            <button
              onClick={() => setSelectedSubject(null)}
              className="hover:text-[#0050cb] transition-colors"
            >
              Practice Management
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
                  {selectedSubject.title}
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
                  ? `Kelola Topik: ${selectedSubject.title}`
                  : "Kelola Kategori Latihan"}
            </h1>
            <p className="text-[14px] sm:text-[16px] md:text-[18px] text-[#424656] mt-2 max-w-2xl">
              {selectedTopic
                ? `Daftar soal untuk topik ${selectedTopic.title}. Total: ${questionsPagination.total} soal.`
                : selectedSubject
                  ? `Kelola daftar topik dan bank soal untuk subtes ${selectedSubject.title}.`
                  : "Pilih kategori subtes untuk mengelola bank soal dan tingkat kesulitan."}
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
              <button
                onClick={() => setShowImportSection(!showImportSection)}
                className="flex-1 sm:flex-none bg-[#0050cb] text-white px-4 sm:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#0050cb]/20 transition-all active:translate-y-px text-[14px]"
              >
                <span className="material-symbols-outlined text-[18px]">
                  upload_file
                </span>
                Import Excel
              </button>
            ) : (
              !selectedTopic && (
                <button
                  onClick={() =>
                    selectedSubject
                      ? handleOpenTopicModal()
                      : handleOpenSubjectModal()
                  }
                  className="flex-1 sm:flex-none bg-[#0050cb] text-white px-4 sm:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#0050cb]/20 transition-all active:translate-y-px text-[14px]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add_circle
                  </span>
                  {selectedSubject ? "Tambah Topik Baru" : "Tambah Subtes Baru"}
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
                        {selectedSubject.title}
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
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-1.5">
                      Tingkat Kesulitan
                    </label>
                    <select
                      className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0050cb] text-[14px]"
                      value={importDifficulty}
                      onChange={(e) => setImportDifficulty(e.target.value)}
                    >
                      <option value="easy">Mudah</option>
                      <option value="medium">Sedang</option>
                      <option value="hard">Sulit</option>
                    </select>
                  </div>
                  <div className="sm:self-end">
                    <button
                      onClick={handleImportUpload}
                      disabled={!importFile || importLoading}
                      className="w-full sm:w-auto bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[14px] whitespace-nowrap"
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
                  Import soal dari file Excel atau gunakan Generate AI.
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
                            {q.question_type === 'complex_mc_tf' && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                                Kompleks
                              </span>
                            )}
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
                            title="Acak urutan jawaban"
                            onClick={(e) => handleShuffleChoices(e, q.id)}
                            className="p-2 text-[#727687] hover:text-[#0050cb] hover:bg-[#dae1ff]/30 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              shuffle
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuestion(q.id);
                            }}
                            className="p-2 text-[#727687] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/30 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Stimulus Section - Always Visible */}
                      {q.stimulus && (
                        <div className="mx-6 mb-3 p-4 bg-amber-50/80 border border-amber-200/60 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-[16px] text-amber-600">
                              auto_stories
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                              Stimulus / Wacana
                            </span>
                          </div>
                          <MathText
                            className="text-[14px] text-[#424656] leading-relaxed whitespace-pre-line"
                            text={q.stimulus}
                          />
                        </div>
                      )}

                      {/* Image - Before or After Question based on position */}
                      {q.image_url && ['top', 'before', 'atas'].includes(q.image_position) && (
                        <div className="mx-6 mb-3">
                          <img
                            src={q.image_url}
                            alt="Gambar soal"
                            className="max-h-[240px] rounded-xl border border-[#c2c6d8]/20 object-contain"
                          />
                        </div>
                      )}

                      {/* Question Content - Always Fully Visible */}
                      <div className="px-6 pb-3">
                        <MathText
                          className="text-[15px] text-[#191b24] font-medium leading-relaxed whitespace-pre-line"
                          text={q.content || ""}
                        />
                      </div>

                      {/* Image - Middle position */}
                      {q.image_url && ['middle', 'ditengah', 'tengah'].includes(q.image_position) && (
                        <div className="mx-6 mb-3">
                          <img
                            src={q.image_url}
                            alt="Gambar soal"
                            className="max-h-[240px] rounded-xl border border-[#c2c6d8]/20 object-contain"
                          />
                        </div>
                      )}

                      {/* Image - Bottom/default position */}
                      {q.image_url && (!q.image_position || ['bottom', 'after', 'bawah'].includes(q.image_position)) && (
                        <div className="mx-6 mb-3">
                          <img
                            src={q.image_url}
                            alt="Gambar soal"
                            className="max-h-[240px] rounded-xl border border-[#c2c6d8]/20 object-contain"
                          />
                        </div>
                      )}

                      {/* Answer Choices - Always Visible */}
                      {q.choices && q.choices.length > 0 && (
                        <div className="px-6 pb-5 pt-2 border-t border-[#c2c6d8]/15 mt-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-3">
                            {q.choices.map((c) => (
                              <div
                                key={c.id}
                                className={`p-3 rounded-xl border text-[14px] flex items-start gap-3 ${
                                  q.question_type === 'complex_mc_tf'
                                    ? (c.is_correct ? "border-green-300 bg-green-50/30" : "border-red-200 bg-red-50/30")
                                    : (c.is_correct ? "border-green-300 bg-green-50" : "border-[#c2c6d8]/30 bg-[#f2f3ff]/50")
                                }`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                                    q.question_type === 'complex_mc_tf'
                                      ? (c.is_correct ? "bg-green-500 text-white" : "bg-red-500 text-white")
                                      : (c.is_correct ? "bg-green-500 text-white" : "bg-[#c2c6d8]/30 text-[#424656]")
                                  }`}
                                >
                                  {c.label}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <MathText
                                    className={
                                      q.question_type === 'complex_mc_tf'
                                        ? (c.is_correct ? "text-green-800 font-medium" : "text-red-800 font-medium")
                                        : (c.is_correct ? "text-green-800 font-medium" : "text-[#191b24]")
                                    }
                                    text={c.content || ""}
                                  />
                                  {q.question_type === 'complex_mc_tf' && (
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded mt-1 inline-block ${c.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {c.is_correct ? 'BENAR' : 'SALAH'}
                                    </span>
                                  )}
                                  {c.is_correct && c.explanation && q.question_type !== 'complex_mc_tf' && (
                                    <MathText
                                      className="text-[12px] text-green-700 mt-1 italic block"
                                      text={c.explanation}
                                    />
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
              ? [1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white h-[350px] rounded-3xl border border-[#c2c6d8]/30 animate-pulse"
                  ></div>
                ))
              : [...(subjects || [])]
                  .sort((a, b) => {
                    const planA = PLAN_ORDER[a.required_plan] ?? 1;
                    const planB = PLAN_ORDER[b.required_plan] ?? 1;
                    if (planA !== planB) return planA - planB;
                    return getSubtestIdx(a.title) - getSubtestIdx(b.title);
                  })
                  .map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSubject(s)}
                      className="bg-white border border-[#c2c6d8]/30 rounded-3xl p-8 hover:shadow-2xl hover:shadow-[#0050cb]/5 transition-all group flex flex-col relative overflow-hidden cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-8">
                        <div
                          className="p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300 shadow-sm"
                          style={{
                            backgroundColor: s.bg_color || "#dae1ff",
                            color: s.icon_color || "#0050cb",
                          }}
                        >
                          <span
                            className="material-symbols-outlined text-[28px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {s.icon || "school"}
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
                          <button
                            className="p-2 text-[#727687] hover:text-[#0050cb] hover:bg-[#dae1ff]/30 rounded-full transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              settings
                            </span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteSubject(e, s.id)}
                            className="p-2 text-[#727687] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/30 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              archive
                            </span>
                          </button>
                        </div>
                      </div>

                      <h3 className="text-[24px] font-bold text-[#191b24] mb-2 group-hover:text-[#0050cb] transition-colors leading-tight">
                        {s.title}
                      </h3>
                      <p className="text-[14px] text-[#424656] mb-4 line-clamp-2">
                        {s.description ||
                          "No description available for this module."}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg ${
                          s.required_plan === "sultan"
                            ? "bg-yellow-100 text-yellow-800"
                            : s.required_plan === "premium"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {s.required_plan === "sultan"
                            ? "star"
                            : s.required_plan === "premium"
                              ? "diamond"
                              : "lock_open"}
                        </span>
                        {s.required_plan === "sultan"
                          ? "Sultan"
                          : s.required_plan === "premium"
                            ? "Premium"
                            : "Gratis"}
                      </span>
                    </div>
                  ))}
          </div>
        ) : (
          /* LEVEL 2: Topic List for Selected Subject */
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(topics || []).map((t) => (
                <div
                  key={t.id}
                  className="bg-white border border-[#c2c6d8]/30 rounded-[32px] p-6 hover:shadow-xl transition-all group border-l-4 border-l-[#0050cb]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#dae1ff]/50 flex items-center justify-center text-[#0050cb]">
                      <span className="material-symbols-outlined text-[24px]">
                        {t.icon || "notes"}
                      </span>
                    </div>
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
                  </div>
                  <h4 className="text-[18px] font-bold text-[#191b24] mb-1">
                    {t.title}
                  </h4>
                  <p className="text-[13px] text-[#424656] mb-4 line-clamp-2">
                    {t.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#c2c6d8]/20">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-[#727687] uppercase bg-[#f2f3ff] px-2 py-0.5 rounded-md">
                        {t.difficulty_level}
                      </span>
                      <span className="text-[11px] font-bold text-[#0050cb]">
                        {t.questions_count || 0} Soal
                      </span>
                    </div>
                    <button
                      onClick={() => handleOpenKelolaSoal(t)}
                      className="text-[12px] font-bold text-[#0050cb] flex items-center gap-1 hover:underline"
                    >
                      Kelola Soal
                      <span className="material-symbols-outlined text-[14px]">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              ))}
              {/* Add Topic CTA */}
              <button
                onClick={() => handleOpenTopicModal()}
                className="border-2 border-dashed border-[#c2c6d8]/50 rounded-[32px] p-8 flex flex-col items-center justify-center text-center hover:border-[#0050cb] hover:bg-[#dae1ff]/10 transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#727687] group-hover:bg-[#0050cb] group-hover:text-white mb-4 transition-all">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <span className="font-bold text-[#424656] group-hover:text-[#0050cb]">
                  Tambah Topik Baru
                </span>
              </button>
            </div>
            {(!topics || topics.length === 0) && (
              <div className="text-center py-20 bg-white rounded-[40px] border border-[#c2c6d8]/30">
                <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">
                  folder_open
                </span>
                <p className="text-[#727687] font-medium">
                  Belum ada topik untuk subtes ini. Mulai buat sekarang!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Global Analytics Snippet */}
        {!selectedSubject && (
          <section className="mt-20 bg-[#0066ff] text-white rounded-[32px] p-10 lg:p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4 scale-150 pointer-events-none">
              <span
                className="material-symbols-outlined text-[300px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                insights
              </span>
            </div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
              <div className="max-w-xl">
                <h2 className="text-[32px] lg:text-[40px] font-bold mb-4 leading-tight">
                  Practice Performance Overview
                </h2>
                <p className="text-white/80 text-[18px] leading-relaxed">
                  Real-time distribution metrics across all topics. Overall
                  content quality score is currently at{" "}
                  <span className="text-[#00c1fd] font-bold underline">
                    94.2%
                  </span>{" "}
                  based on student feedback.
                </p>
              </div>
              <div className="flex gap-16 text-center">
                <div>
                  <p className="text-[48px] lg:text-[64px] font-bold leading-none mb-2">
                    6,555
                  </p>
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] opacity-70">
                    Questions Total
                  </p>
                </div>
                <div>
                  <p className="text-[48px] lg:text-[64px] font-bold leading-none mb-2">
                    24%
                  </p>
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] opacity-70">
                    Hard Difficulty
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-10 border-b border-[#c2c6d8]/20 flex justify-between items-center bg-[#faf8ff]">
              <div>
                <h3 className="font-bold text-[28px] text-[#191b24]">
                  {editingItem ? "Edit Subtes" : "Tambah Subtes Baru"}
                </h3>
                <p className="text-[14px] text-[#727687]">
                  Konfigurasi detail kategori latihan di bawah ini.
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
              className="p-10 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                    Nama Subtes
                  </label>
                  <input
                    required
                    className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb] transition-all text-[15px]"
                    value={subjectForm.title}
                    onChange={(e) =>
                      setSubjectForm({ ...subjectForm, title: e.target.value })
                    }
                    placeholder="Misal: Penalaran Matematika"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb] transition-all resize-none text-[15px]"
                    value={subjectForm.description}
                    onChange={(e) =>
                      setSubjectForm({
                        ...subjectForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Deskripsi singkat untuk siswa..."
                  />
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
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                      Warna Ikon (Hex)
                    </label>
                    <div className="flex items-center gap-3 bg-[#f2f3ff] rounded-2xl px-4 py-1 border border-[#c2c6d8]/20">
                      <input
                        type="color"
                        className="w-8 h-8 rounded-lg cursor-pointer"
                        value={subjectForm.iconColor}
                        onChange={(e) =>
                          setSubjectForm({
                            ...subjectForm,
                            iconColor: e.target.value,
                          })
                        }
                      />
                      <input
                        className="w-full bg-transparent border-none py-3 outline-none text-[14px] font-mono"
                        value={subjectForm.iconColor}
                        onChange={(e) =>
                          setSubjectForm({
                            ...subjectForm,
                            iconColor: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                      Warna BG (Hex)
                    </label>
                    <div className="flex items-center gap-3 bg-[#f2f3ff] rounded-2xl px-4 py-1 border border-[#c2c6d8]/20">
                      <input
                        type="color"
                        className="w-8 h-8 rounded-lg cursor-pointer"
                        value={subjectForm.bgColor}
                        onChange={(e) =>
                          setSubjectForm({
                            ...subjectForm,
                            bgColor: e.target.value,
                          })
                        }
                      />
                      <input
                        className="w-full bg-transparent border-none py-3 outline-none text-[14px] font-mono"
                        value={subjectForm.bgColor}
                        onChange={(e) =>
                          setSubjectForm({
                            ...subjectForm,
                            bgColor: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                    Paket Minimum
                  </label>
                  <div className="flex gap-3">
                    {PLAN_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setSubjectForm({
                            ...subjectForm,
                            requiredPlan: opt.value,
                          })
                        }
                        className={`flex-1 py-3 rounded-xl font-bold text-[13px] border-2 transition-all ${
                          subjectForm.requiredPlan === opt.value
                            ? "border-[#0050cb] bg-[#dae1ff] text-[#0050cb]"
                            : "border-[#c2c6d8]/20 bg-[#f2f3ff] text-[#727687] hover:border-[#c2c6d8]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[12px] text-[#727687] mt-2">
                    Hanya user dengan paket ini atau di atasnya yang bisa
                    mengakses.
                  </p>
                </div>
                <div>
                  <label className="block text-[14px] font-bold text-[#191b24] mb-4">
                    Pilih Ikon Visual
                  </label>
                  <div className="grid grid-cols-6 gap-3 p-4 bg-[#f2f3ff] rounded-[24px] max-h-48 overflow-y-auto custom-scrollbar border border-[#c2c6d8]/10">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setSubjectForm({ ...subjectForm, icon })}
                        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${subjectForm.icon === icon ? "bg-[#0050cb] text-white shadow-lg shadow-[#0050cb]/20 scale-110" : "bg-white hover:bg-[#e6e7f4] text-[#727687]"}`}
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {icon}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <button
                  disabled={isSubmitting}
                  className="w-full py-5 bg-[#0050cb] text-white rounded-[24px] font-bold text-[16px] hover:bg-[#003fa4] hover:shadow-xl hover:shadow-[#0050cb]/20 transition-all disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : editingItem
                      ? "Perbarui Subtes"
                      : "Simpan Subtes"}
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
                  {editingItem ? "Edit Topik" : "Tambah Topik Baru"}
                </h3>
                <p className="text-[14px] text-[#727687]">
                  Konfigurasi detail topik latihan untuk{" "}
                  {selectedSubject?.title}.
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
                    Nama Topik
                  </label>
                  <input
                    required
                    className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb] transition-all"
                    value={topicForm.title}
                    onChange={(e) =>
                      setTopicForm({ ...topicForm, title: e.target.value })
                    }
                    placeholder="Misal: Persamaan Kuadrat"
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
                    placeholder="Deskripsi singkat untuk kartu topik..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                      Jumlah Soal
                    </label>
                    <input
                      type="number"
                      className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb]"
                      value={topicForm.questions}
                      onChange={(e) =>
                        setTopicForm({
                          ...topicForm,
                          questions: e.target.value,
                        })
                      }
                      placeholder="Misal: 120"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                      Level
                    </label>
                    <select
                      className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb] appearance-none"
                      value={topicForm.level}
                      onChange={(e) =>
                        setTopicForm({ ...topicForm, level: e.target.value })
                      }
                    >
                      <option>Dasar</option>
                      <option>Menengah</option>
                      <option>Tingkat Lanjut</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6 flex flex-col">
                <div>
                  <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                    Tipe Kartu
                  </label>
                  <select
                    className="w-full bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-[#0050cb] appearance-none"
                    value={topicForm.type}
                    onChange={(e) =>
                      setTopicForm({ ...topicForm, type: e.target.value })
                    }
                  >
                    <option value="standard">Standard (White)</option>
                    <option value="featured">Featured (Primary Blue)</option>
                    <option value="centered">Centered (Grey Layout)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-4 p-4 bg-[#f2f3ff] rounded-2xl border border-[#c2c6d8]/10">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={topicForm.isPopular}
                      onChange={(e) =>
                        setTopicForm({
                          ...topicForm,
                          isPopular: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-[#c2c6d8] text-[#0050cb] focus:ring-[#0050cb]"
                    />
                    <span className="text-[14px] font-bold text-[#424656] group-hover:text-[#0050cb] transition-colors">
                      Beri Tag "Populer"
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={topicForm.isFeatured}
                      onChange={(e) =>
                        setTopicForm({
                          ...topicForm,
                          isFeatured: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-[#c2c6d8] text-[#0050cb] focus:ring-[#0050cb]"
                    />
                    <span className="text-[14px] font-bold text-[#424656] group-hover:text-[#0050cb] transition-colors">
                      Beri Tag "Spesial"
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
                <div className="mt-auto">
                  <button
                    disabled={isSubmitting}
                    className="w-full py-5 bg-[#0050cb] text-white rounded-[24px] font-bold text-[16px] hover:bg-[#003fa4] transition-all disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Menyimpan..."
                      : editingItem
                        ? "Perbarui Topik"
                        : "Simpan Topik"}
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
                Edit Soal
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
                  Pertanyaan
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8]/40 focus:border-[#0050cb] focus:outline-none text-[15px] min-h-[120px] resize-y"
                  value={editingQuestion.content}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      content: e.target.value,
                    })
                  }
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

              {editingQuestion.choices &&
                editingQuestion.choices.length > 0 && (
                  <div>
                    <label className="block text-[14px] font-bold text-[#191b24] mb-2">
                      Pilihan Jawaban
                    </label>
                    <div className="space-y-2">
                      {editingQuestion.choices.map((c) => (
                        <div
                          key={c.id}
                          className={`p-3 rounded-xl border text-[14px] flex items-start gap-3 ${
                            c.is_correct
                              ? "border-green-300 bg-green-50"
                              : "border-[#c2c6d8]/30 bg-[#f2f3ff]/50"
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ${
                              c.is_correct
                                ? "bg-green-500 text-white"
                                : "bg-[#c2c6d8]/30 text-[#424656]"
                            }`}
                          >
                            {c.label}
                          </span>
                          <MathText
                            className={
                              c.is_correct
                                ? "text-green-800 font-medium"
                                : "text-[#191b24]"
                            }
                            text={c.content || ""}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-[12px] text-[#727687] mt-2">
                      * Pilihan jawaban tidak dapat diedit di sini. Gunakan
                      import Excel untuk mengganti soal.
                    </p>
                  </div>
                )}

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

export default ManageLatihan;
