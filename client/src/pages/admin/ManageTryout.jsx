import React, { useState, useEffect, useRef } from 'react';
import { tryoutService, subjectService, soalService, adminService } from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ImageUpload from '../../components/ImageUpload';
import MathText from '../../components/MathText';
import ZoomableImage from '../../components/ui/ZoomableImage';
import { useAuth } from '../../hooks/useAuth';

const ManageTryout = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showManageQuestionsModal, setShowManageQuestionsModal] = useState(false);
  const [managingSubtest, setManagingSubtest] = useState(null);
  const [subtestQuestions, setSubtestQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [showImportTab, setShowImportTab] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    scheduled_at: '',
    is_public: true,
    required_plan: 'gratis',
    subject_config: []
  });

  const PLAN_OPTIONS = [
    { value: 'gratis', label: 'Gratis', icon: 'lock_open' },
    { value: 'premium', label: 'Premium', icon: 'diamond' },
    { value: 'sultan', label: 'Sultan', icon: 'star' },
  ];

  const standardSubtests = [
    "Penalaran Umum",
    "Pengetahuan dan Pemahaman Umum",
    "Pemahaman Bacaan dan Tulisan",
    "Pengetahuan Kuantitatif",
    "Literasi Bahasa Indonesia",
    "Literasi Bahasa Inggris",
    "Penalaran Matematika"
  ];

  const packageImages = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAiFl_dP12hxrVBRuG1bFQb_v76-R5_eTCTeuh-a2KAq3hToqk6VA9kYJVgvaUldh-ktgrnLemCq8EDdDVRWTx0jkQC6pSF8UowhHXadydGg-nLllks6o1ScUONu82Vm9G8mcP6GRr-t3mNe3vUA6IcdGo7BfuIPKzEDwUOeRm87sboKElY8HVklPnDXMc6HcpPELs523KOVtCcvkFTvx-TYI7ogM9OjMBLHsUnQdeDHoYSSc7O6kOolJqWQwCZZYq7MBwbL0No0Kk",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBauluVwFfyPksOnWuLDEcEhAoHPPQ76tpqOfPWR6zddLcA3v52taej5a1PhoTqW3k4mce8se5PAJNI5aXCr05Z6FPTfpOXySKM10ejU9EN0oO1YdvP2yaQFjSKgjjRStqEN2jnUym019xsF-yKo6Z-6cqThK3Ud6l2LIqb58aNEAhh5Q6FcGDtma9cj_gLgF3ccM_frAr-R1BlGWFkHTKuGgO9Bv5fye634hmO9lTLVdoUH7zI-cBdWErWcPma1rbhPNwBD_eD0VM",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuB48NfGPG7Bp2Gq1qY8YOmd3FUHn2Jiu4bq4KA_wVBmI7zTdwJkISo-EmvG7dE47dW_xxYrCb8sn87DR_0urarpmRwcE2hC6hvnL2qY6J9q38Yxpj9ln-OJ2kdDg2jEzE08c48PNhrlRQRIFlqpQcbxKWSDBAc2TojR7kbTawaM6jCUtP8EemOHplrO-ET2g043zeosMho9jxzUxhEWBEDyA9KLdqvxCvXG5Sn1rCd2twvKDHicDj-Gg1nf-HsE7xUqh7E-zyqGHc"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pkgsRes, subRes] = await Promise.all([
        tryoutService.listPackages(),
        subjectService.list()
      ]);
      setPackages(pkgsRes.data?.data || []);
      setSubjects(subRes.data?.data || []);
    } catch (error) {
      toast.error('Gagal memuat data. Periksa koneksi server.');
    } finally {
      setLoading(false);
    }
  };

  const ensureArray = (data, fallbackToStandard = false) => {
    let arr = [];
    if (Array.isArray(data)) {
      arr = data;
    } else if (data && typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) arr = parsed;
      } catch (e) {}
    }
    
    if ((!arr || arr.length === 0) && fallbackToStandard) {
      return standardSubtests.map(name => ({
        name,
        questionCount: 20,
        durationMin: 30,
        durationSec: 0
      }));
    }
    return arr;
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      let dateStr = '';
      if (pkg.scheduled_at) {
        try {
          const d = new Date(pkg.scheduled_at);
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString().slice(0, 16);
          }
        } catch (e) { console.error(e); }
      }

      setFormData({
        title: pkg.title || '',
        scheduled_at: dateStr,
        is_public: !!pkg.is_public,
        is_active: pkg.is_active !== undefined ? pkg.is_active : true,
        required_plan: pkg.required_plan || 'gratis',
        subject_config: ensureArray(pkg.subject_config, true)
      });
    } else {
      setEditingPackage(null);
      const initialConfig = standardSubtests.map(name => ({
        name,
        questionCount: 20,
        durationMin: 30,
        durationSec: 0
      }));
      setFormData({
        title: '',
        scheduled_at: '',
        is_public: true,
        is_active: true,
        required_plan: 'gratis',
        subject_config: initialConfig
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        is_public: !!formData.is_active,
        is_active: !!formData.is_active
      };
      if (editingPackage) {
        await tryoutService.updatePackage(editingPackage.id, payload);
        toast.success("Tryout berhasil diperbarui");
      } else {
        await tryoutService.createPackage(payload);
        toast.success("Tryout berhasil dibuat");
      }
      setShowModal(false);
      fetchData();
      if (selectedPackage && editingPackage?.id === selectedPackage.id) {
         setSelectedPackage({ ...selectedPackage, ...payload });
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Gagal menyimpan tryout. Coba lagi.';
      toast.error(msg);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Hapus paket tryout ini?")) return;
    tryoutService.deletePackage(id).then(() => {
      toast.success("Tryout dihapus");
      fetchData();
      if (selectedPackage?.id === id) setSelectedPackage(null);
    }).catch((err) => {
      const msg = err.response?.data?.error || 'Gagal menghapus tryout.';
      toast.error(msg);
    });
  };

  const handlePreview = (e, pkgId) => {
    e.stopPropagation();
    toast.loading("Mempersiapkan preview...", { id: "preview-loading" });
    tryoutService.start(pkgId, null).then((res) => {
      toast.dismiss("preview-loading");
      const sessionId = res.data?.data?.session_id;
      if (sessionId) {
        window.open(`/tryout/${sessionId}?preview=true`, '_blank');
      } else {
        toast.error("Gagal mendapatkan Session ID");
      }
    }).catch((err) => {
      toast.dismiss("preview-loading");
      toast.error(err.response?.data?.error || "Gagal memulai sesi preview.");
    });
  };

  const updateSubtestConfig = (index, field, value) => {
    const config = ensureArray(formData.subject_config);
    const newConfig = [...config];
    if (newConfig[index]) {
      newConfig[index][field] = value;
      setFormData({ ...formData, subject_config: newConfig });
    }
  };

  const formatScheduledDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'TBA';
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'TBA';
    }
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage({
      ...pkg,
      subject_config: ensureArray(pkg.subject_config, true)
    });
  };

  const handleOpenManageQuestions = async (subtest) => {
    setManagingSubtest(subtest);
    setShowManageQuestionsModal(true);
    setQuestionsLoading(true);
    setSearchQuery('');
    setDifficultyFilter('all');
    setEditingQuestion(null);
    try {
      const res = await soalService.list({ 
        subject_name: subtest.name,
        tryout_package_id: selectedPackage?.id
      });
      const questions = res.data?.data || [];
      const qArray = Array.isArray(questions) ? questions : [];
      setSubtestQuestions(qArray);
      if (qArray.length > 0) {
        setActiveQuestionId(qArray[0].id);
      } else {
        setActiveQuestionId(null);
      }
    } catch {
      toast.error('Gagal memuat soal');
      setSubtestQuestions([]);
      setActiveQuestionId(null);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleRemoveQuestion = async (questionId) => {
    if (!window.confirm('Hapus soal ini?')) return;
    try {
      await soalService.delete(questionId);
      setSubtestQuestions(prev => {
        const filtered = prev.filter(q => q.id !== questionId);
        if (activeQuestionId === questionId) {
          if (filtered.length > 0) {
            const oldIndex = prev.findIndex(q => q.id === questionId);
            const nextActiveIndex = Math.min(oldIndex, filtered.length - 1);
            setActiveQuestionId(filtered[nextActiveIndex].id);
          } else {
            setActiveQuestionId(null);
          }
        }
        return filtered;
      });
      setEditingQuestion(null);
      toast.success('Soal dihapus');
    } catch {
      toast.error('Gagal menghapus soal');
    }
  };

  const handleDeleteAllQuestions = async () => {
    if (!managingSubtest) return;
    const matchedSubject = subjects.find(s => s.name === managingSubtest.name || s.title === managingSubtest.name);
    if (!matchedSubject) {
      toast.error('Subject tidak ditemukan');
      return;
    }
    if (!window.confirm(`Hapus SEMUA soal di "${managingSubtest.name}"? Tindakan ini tidak bisa dibatalkan!`)) return;

    try {
      const res = await soalService.deleteAllBySubject(matchedSubject.id, { tryout_package_id: selectedPackage?.id });
      setSubtestQuestions([]);
      setActiveQuestionId(null);
      setEditingQuestion(null);
      toast.success(res.data.message || 'Semua soal berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus semua soal');
    }
  };

  const handleMoveQuestionUp = async (index) => {
    if (index === 0) {
      toast.error('Soal sudah di posisi teratas');
      return;
    }
    const questions = [...ensureArray(subtestQuestions)];
    [questions[index], questions[index - 1]] = [questions[index - 1], questions[index]];
    
    try {
      const questionIds = questions.map(q => q.id);
      await soalService.reorderQuestions(questionIds);
      setSubtestQuestions(questions);
      toast.success('Urutan soal berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui urutan soal');
    }
  };

  const handleMoveQuestionDown = async (index) => {
    const questions = ensureArray(subtestQuestions);
    if (index === questions.length - 1) {
      toast.error('Soal sudah di posisi terbawah');
      return;
    }
    const updatedQuestions = [...questions];
    [updatedQuestions[index], updatedQuestions[index + 1]] = [updatedQuestions[index + 1], updatedQuestions[index]];
    
    try {
      const questionIds = updatedQuestions.map(q => q.id);
      await soalService.reorderQuestions(questionIds);
      setSubtestQuestions(updatedQuestions);
      toast.success('Urutan soal berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui urutan soal');
    }
  };

  const handleShuffleChoices = async (question) => {
    try {
      await soalService.shuffleChoices(question.id);
      // Reload questions to get shuffled choices
      const res = await soalService.list({ 
        subject_name: managingSubtest.name,
        tryout_package_id: selectedPackage?.id
      });
      const questions = res.data?.data || [];
      const qArray = Array.isArray(questions) ? questions : [];
      setSubtestQuestions(qArray);
      if (qArray.length > 0) {
        const updatedSelected = qArray.find(q => q.id === question.id);
        if (updatedSelected) {
          setActiveQuestionId(updatedSelected.id);
        }
      }
      toast.success('Urutan jawaban sudah diacak');
    } catch {
      toast.error('Gagal mengacak jawaban');
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
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
        stimulus: editingQuestion.stimulus || null
      });
      toast.success('Soal berhasil disimpan');
      const savedId = editingQuestion.id;
      setEditingQuestion(null);
      // Reload questions
      const res = await soalService.list({ 
        subject_name: managingSubtest.name,
        tryout_package_id: selectedPackage?.id
      });
      const questions = res.data?.data || [];
      const qArray = Array.isArray(questions) ? questions : [];
      setSubtestQuestions(qArray);
      setActiveQuestionId(savedId);
    } catch {
      toast.error('Gagal menyimpan soal');
    }
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        setImportPreview(jsonData);
        setImportFile(file);
      } catch {
        toast.error('Gagal membaca file Excel');
        setImportFile(null);
        setImportPreview([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error('File harus berformat Excel (.xlsx, .xls) atau CSV');
      return;
    }
    parseExcelFile(selectedFile);
  };

  const handleImportQuestions = async () => {
    if (!managingSubtest) return;
    if (importPreview.length === 0) {
      toast.error('Tidak ada data untuk diimport');
      return;
    }

    // Find subject_id by name from subjects list
    const matchedSubject = subjects.find(s => s.name === managingSubtest.name || s.title === managingSubtest.name);
    if (!matchedSubject) {
      toast.error('Subject tidak ditemukan. Pastikan subtes sudah terdaftar di sistem.');
      return;
    }

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('subject_id', matchedSubject.id);
      formData.append('difficulty', 'medium');
      formData.append('destination', 'tryout');
      formData.append('tryout_package_id', selectedPackage?.id || '');

      const res = await adminService.importExcel(formData);

      if (res.data.success) {
        const { importedCount, rejectedCount, errors } = res.data.data;
        if (rejectedCount > 0) {
          toast.error(`${importedCount} soal berhasil diimport, ${rejectedCount} gagal. Lihat detail di console.`);
          console.warn('Import errors:', errors);
        } else {
          toast.success(`${importedCount} soal berhasil diimport!`);
        }
      } else {
        toast.error(res.data.error || 'Gagal mengimport soal');
      }

      // Reload questions by subject_id
      const questionsRes = await soalService.list({ 
        subject_id: matchedSubject.id,
        tryout_package_id: selectedPackage?.id
      });
      const qArray = Array.isArray(questionsRes.data?.data) ? questionsRes.data.data : [];
      setSubtestQuestions(qArray);
      if (qArray.length > 0) {
        setActiveQuestionId(qArray[0].id);
      } else {
        setActiveQuestionId(null);
      }

      // Reset import tab
      setImportPreview([]);
      setImportFile(null);
      setShowImportTab(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error(error.response?.data?.error || 'Gagal mengimport soal');
    } finally {
      setImportLoading(false);
    }
  };

  const filteredQuestions = ensureArray(subtestQuestions).filter(q => {
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const contentMatch = q.content && q.content.toLowerCase().includes(query);
      const choiceMatch = q.choices && q.choices.some(choice => choice.content && choice.content.toLowerCase().includes(query));
      return contentMatch || choiceMatch;
    }
    return true;
  });

  return (
    <div className="animate-fade-in bg-surface min-h-screen pb-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        
        {/* Breadcrumbs */}
        <div className="pt-8 mb-4">
          <nav className="flex items-center gap-2 text-[12px] font-semibold text-[#727687] uppercase tracking-wider">
            <button 
              onClick={() => setSelectedPackage(null)}
              className="hover:text-[#0050cb] transition-colors"
            >
              Tryout Management
            </button>
            {selectedPackage && (
              <>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-[#0050cb]">{selectedPackage.title}</span>
              </>
            )}
          </nav>
        </div>

        {/* Dynamic Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-[28px] sm:text-[40px] lg:text-[48px] font-bold text-[#191b24] mb-2 leading-tight">
              {selectedPackage ? `Manage Subtests: ${selectedPackage.title}` : 'Kelola Tryout'}
            </h1>
            <p className="text-[15px] sm:text-[18px] text-[#424656] max-w-2xl leading-relaxed">
              {selectedPackage 
                ? `Configure the 7 subtests for ${selectedPackage.title}. Define question quotas and individual time limits.`
                : 'Manage national simulation packages. Configure subtests, duration, and question distribution for upcoming exams.'}
            </p>
          </div>
          <div className="flex gap-4">
            {selectedPackage ? (
              <button 
                onClick={() => setSelectedPackage(null)}
                className="px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 bg-white border border-[#c2c6d8]/50 text-[#424656] hover:bg-[#f2f3ff] transition-all"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Packages
              </button>
            ) : (
              <button 
                onClick={() => handleOpenModal()}
                className="bg-[#0050cb] text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[#0050cb]/20 hover:shadow-xl transition-all active:translate-y-px"
              >
                <span className="material-symbols-outlined">add</span>
                Create New Package
              </button>
            )}
          </div>
        </header>

        {!selectedPackage ? (
          /* VIEW 1: Package List */
          <section className="flex flex-col gap-6 mb-20">
            {loading ? (
              [1,2].map(i => (
                <div key={i} className="bg-white h-64 rounded-[32px] border border-[#c2c6d8]/30 animate-pulse"></div>
              ))
            ) : (!packages || packages.length === 0) ? (
              <div className="bg-white p-20 rounded-[40px] border border-dashed border-[#c2c6d8] text-center">
                <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">quiz</span>
                <p className="text-[#727687] font-medium">Belum ada paket tryout. Mulai buat sekarang!</p>
              </div>
            ) : (
              packages.map((pkg, idx) => (
                <div key={pkg.id || idx} className="bg-white rounded-[40px] shadow-sm border border-[#c2c6d8]/30 hover:shadow-xl transition-all duration-500 group flex flex-col">
                  <div className="p-8 md:p-10 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="inline-block px-3 py-1 rounded-lg bg-[#f2f3ff] text-[#0050cb] text-[10px] font-bold uppercase tracking-widest">
                            National Selection
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${pkg.is_active ? 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {pkg.is_active ? 'Active' : 'Draft'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            pkg.required_plan === 'sultan' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            pkg.required_plan === 'premium' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {pkg.required_plan === 'sultan' ? '⭐ Sultan' : pkg.required_plan === 'premium' ? '💎 Premium' : 'Gratis'}
                          </span>
                        </div>
                        <h3 className="text-[32px] font-bold text-[#191b24] group-hover:text-[#0050cb] transition-colors">{pkg.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => handlePreview(e, pkg.id)}
                          className="px-4 h-12 rounded-2xl bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center justify-center gap-1.5 transition-all shadow-sm font-bold text-sm"
                          title="Live Preview Tryout"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                          Live Preview
                        </button>
                        {user?.role !== 'quality_assurance' && (
                          <>
                            <button 
                              onClick={() => handleOpenModal(pkg)}
                              className="w-12 h-12 rounded-2xl bg-[#f2f3ff] flex items-center justify-center text-[#191b24] hover:bg-[#0050cb] hover:text-white transition-all shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[22px]">edit</span>
                            </button>
                            <button 
                              onClick={(e) => handleDelete(e, pkg.id)}
                              className="w-12 h-12 rounded-2xl bg-[#f2f3ff] flex items-center justify-center text-[#191b24] hover:bg-[#ba1a1a] hover:text-white transition-all shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[22px]">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#dae1ff]/50 flex items-center justify-center text-[#0050cb]">
                          <span className="material-symbols-outlined text-[20px]">groups</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Students</p>
                          <p className="text-[15px] font-extrabold text-[#191b24]">12,450</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#dae1ff]/50 flex items-center justify-center text-[#0050cb]">
                          <span className="material-symbols-outlined text-[20px]">event</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Date</p>
                          <p className="text-[15px] font-extrabold text-[#191b24]">{formatScheduledDate(pkg.scheduled_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#dae1ff]/50 flex items-center justify-center text-[#0050cb]">
                          <span className="material-symbols-outlined text-[20px]">history</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Duration</p>
                          <p className="text-[15px] font-extrabold text-[#191b24]">
                            {(() => {
                              const config = ensureArray(pkg.subject_config);
                              const totalSecs = config.reduce((sum, sub) => sum + (sub.durationMin || 0) * 60 + (sub.durationSec || 0), 0);
                              const mins = Math.floor(totalSecs / 60);
                              const secs = totalSecs % 60;
                              return secs > 0 ? `${mins}m ${secs}s` : `${mins} Min`;
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#dae1ff]/50 flex items-center justify-center text-[#0050cb]">
                          <span className="material-symbols-outlined text-[20px]">layers</span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-[#727687] uppercase tracking-wider">Subtests</p>
                          <p className="text-[15px] font-extrabold text-[#191b24]">{ensureArray(pkg.subject_config, true).length} Modules</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-6">
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[11px] font-bold text-[#727687] uppercase tracking-widest">
                          <span>Difficulty Breakdown</span>
                          <span className="text-[#0050cb]">Balanced</span>
                        </div>
                        <div className="w-full h-2.5 bg-[#f2f3ff] rounded-full overflow-hidden flex shadow-inner">
                          <div className="h-full bg-[#00c1fd]" style={{ width: '25%' }}></div>
                          <div className="h-full bg-[#0050cb]" style={{ width: '50%' }}></div>
                          <div className="h-full bg-[#cc4204]" style={{ width: '25%' }}></div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectPackage(pkg)}
                        className="px-6 py-3 rounded-2xl bg-[#191b24] text-white text-[14px] font-bold hover:bg-[#424656] transition-all flex items-center gap-2"
                      >
                        Manage Subtests
                        <span className="material-symbols-outlined text-[18px]">settings</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </section>
        ) : (
          /* VIEW 2: Subtest List for Selected Package */
          <section className="animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ensureArray(selectedPackage.subject_config, true).map((sub, idx) => (
                <div key={idx} className="bg-white rounded-[32px] border border-[#c2c6d8]/30 p-8 hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#dae1ff] flex items-center justify-center text-[#0050cb]">
                      <span className="material-symbols-outlined text-[28px]">description</span>
                    </div>
                    <button
                      onClick={() => handleOpenModal(selectedPackage)}
                      className="p-2 text-[#727687] hover:text-[#0050cb] hover:bg-[#f2f3ff] rounded-full transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit_note</span>
                    </button>
                  </div>

                  <span className="text-[11px] font-bold text-[#0050cb] uppercase tracking-[0.2em] mb-2 block">
                    Subtest {idx + 1}
                  </span>
                  <h3 className="text-[22px] font-bold text-[#191b24] mb-8">{sub.name}</h3>

                  <div className="space-y-4 mb-10">
                    <div className="flex justify-between items-center py-3 border-b border-[#f2f3ff]">
                      <span className="text-[14px] text-[#424656] font-medium">Question Quota</span>
                      <span className="text-[15px] font-bold text-[#191b24]">{sub.questionCount} Questions</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[#f2f3ff]">
                      <span className="text-[14px] text-[#424656] font-medium">Time Limit</span>
                      <span className="text-[15px] font-bold text-[#191b24]">
                        {sub.durationMin} Menit {sub.durationSec ? `${sub.durationSec} Detik` : ''}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenManageQuestions(sub)}
                    className="w-full py-4 rounded-[20px] font-bold text-[14px] transition-all flex items-center justify-center gap-2 bg-[#f2f3ff] text-[#0050cb] hover:bg-[#0050cb] hover:text-white"
                  >
                    Manage Questions
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Global Stats Footer (only on main view) */}
        {!selectedPackage && (
          <section className="bg-white rounded-[40px] p-12 border border-[#c2c6d8]/30 overflow-hidden relative shadow-2xl mb-20">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#dae1ff]/30 to-transparent pointer-events-none"></div>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
              <div className="flex-1 space-y-4 text-center lg:text-left">
                <h2 className="text-[32px] font-bold text-[#191b24] leading-tight">Comprehensive Analytics</h2>
                <p className="text-[#424656] text-[18px] max-w-lg mx-auto lg:mx-0">Overview of platform performance and student engagement across all active tryout modules.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-12 lg:gap-16">
                <div className="text-center">
                  <p className="text-[12px] font-bold text-[#727687] uppercase tracking-[0.2em] mb-2">Participants</p>
                  <p className="text-[48px] font-bold text-[#0050cb] leading-none">58.3K</p>
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-bold text-[#727687] uppercase tracking-[0.2em] mb-2">Average Score</p>
                  <p className="text-[48px] font-bold text-[#006688] leading-none">642.5</p>
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-bold text-[#727687] uppercase tracking-[0.2em] mb-2">Questions</p>
                  <p className="text-[48px] font-bold text-[#a33200] leading-none">2.4K</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-[#c2c6d8]/20 flex justify-between items-center bg-[#faf8ff]">
              <div>
                <h2 className="text-[28px] font-bold text-[#191b24]">{editingPackage ? 'Edit Tryout' : 'Buat Tryout Baru'}</h2>
                <p className="text-[14px] text-[#727687]">Konfigurasi detail paket simulasi nasional di bawah ini.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white shadow-sm transition-all text-[#424656]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-10 flex-1 bg-[#faf8ff]/30 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[14px] font-bold text-[#191b24] mb-2">Judul Tryout</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Tryout Nasional Batch 1"
                      className="w-full px-6 py-4 rounded-2xl border border-[#c2c6d8]/20 focus:ring-2 focus:ring-[#0050cb] outline-none transition-all text-[15px]"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-bold text-[#191b24] mb-2">Jadwal Pelaksanaan</label>
                    <input
                      type="datetime-local"
                      className="w-full px-6 py-4 rounded-2xl border border-[#c2c6d8]/20 focus:ring-2 focus:ring-[#0050cb] outline-none transition-all text-[15px]"
                      value={formData.scheduled_at}
                      onChange={e => setFormData({...formData, scheduled_at: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <label className="flex items-center gap-4 cursor-pointer p-6 bg-white rounded-[32px] border border-[#c2c6d8]/20 shadow-sm w-full group hover:border-[#0050cb] transition-all">
                    <input
                      type="checkbox"
                      className="w-6 h-6 rounded-md border-[#c2c6d8] text-[#0050cb] focus:ring-[#0050cb]"
                      checked={formData.is_active}
                      onChange={e => setFormData({
                        ...formData,
                        is_active: e.target.checked,
                        is_public: e.target.checked
                      })}
                    />
                    <div>
                      <span className="text-[18px] font-bold text-[#191b24] group-hover:text-[#0050cb] transition-colors">Aktifkan & Publikasikan Paket</span>
                      <p className="text-[12px] text-[#727687]">Aktifkan paket agar dapat diakses dan dilihat oleh pengguna.</p>
                    </div>
                  </label>
                  <div>
                    <label className="block text-[14px] font-bold text-[#191b24] mb-3">Paket Minimum</label>
                    <div className="flex gap-3">
                      {PLAN_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({...formData, required_plan: opt.value})}
                          className={`flex-1 py-3.5 rounded-xl font-bold text-[13px] border-2 transition-all flex items-center justify-center gap-2 ${
                            formData.required_plan === opt.value
                              ? 'border-[#0050cb] bg-[#dae1ff] text-[#0050cb]'
                              : 'border-[#c2c6d8]/20 bg-[#f2f3ff] text-[#727687] hover:border-[#c2c6d8]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[12px] text-[#727687] mt-2">User harus punya paket ini untuk bisa ikut tryout.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[20px] font-bold text-[#191b24] mb-8 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0050cb] bg-[#dae1ff] p-2 rounded-xl">layers</span>
                  Konfigurasi 7 Subtes UTBK
                </h3>
                <div className="space-y-5">
                  {ensureArray(formData.subject_config, true).map((sub, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[32px] border border-[#c2c6d8]/10 shadow-sm flex flex-wrap lg:flex-nowrap items-center gap-8 hover:shadow-md transition-shadow">
                      <div className="flex-1 min-w-[240px]">
                        <span className="text-[11px] font-bold text-[#0050cb] uppercase tracking-[0.2em] block mb-2">Subtes {idx + 1}</span>
                        <h4 className="font-bold text-[#191b24] text-[18px]">{sub.name}</h4>
                      </div>
                      <div className="w-full lg:w-48">
                        <label className="block text-[12px] font-bold text-[#727687] mb-2 uppercase tracking-wider">Jumlah Soal</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-4 py-3.5 rounded-xl border border-[#c2c6d8]/20 bg-[#f2f3ff] focus:ring-2 focus:ring-[#0050cb] outline-none font-bold text-[#191b24]"
                          value={sub.questionCount}
                          onChange={e => updateSubtestConfig(idx, 'questionCount', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-full lg:w-32">
                        <label className="block text-[12px] font-bold text-[#727687] mb-2 uppercase tracking-wider">Menit</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full px-4 py-3.5 rounded-xl border border-[#c2c6d8]/20 bg-[#f2f3ff] focus:ring-2 focus:ring-[#0050cb] outline-none font-bold text-[#191b24]"
                          value={sub.durationMin || 0}
                          onChange={e => updateSubtestConfig(idx, 'durationMin', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-full lg:w-32">
                        <label className="block text-[12px] font-bold text-[#727687] mb-2 uppercase tracking-wider">Detik</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          className="w-full px-4 py-3.5 rounded-xl border border-[#c2c6d8]/20 bg-[#f2f3ff] focus:ring-2 focus:ring-[#0050cb] outline-none font-bold text-[#191b24]"
                          value={sub.durationSec || 0}
                          onChange={e => updateSubtestConfig(idx, 'durationSec', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-16 p-10 border-t border-[#c2c6d8]/20 flex justify-end gap-6 bg-[#faf8ff] -mx-10 -mb-10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-10 py-4 text-[#424656] font-bold hover:bg-[#f2f3ff] rounded-[24px] transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-12 py-4 bg-[#0050cb] text-white font-bold rounded-[24px] shadow-xl hover:shadow-2xl hover:bg-[#003fa4] transition-all active:scale-95"
                >
                  {editingPackage ? 'Simpan Perubahan' : 'Buat Tryout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Questions Modal */}
      {showManageQuestionsModal && managingSubtest && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#f8fafc] w-full max-w-[96vw] xl:max-w-7xl h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-[#e2e8f0] flex justify-between items-center bg-white shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#dae1ff] text-[#0050cb] text-[10px] font-bold uppercase tracking-wider">
                    {selectedPackage?.title}
                  </span>
                  <span className="text-[12px] text-[#727687] font-semibold">•</span>
                  <span className="text-[12px] text-[#727687] font-bold uppercase">
                    Subtes {ensureArray(selectedPackage?.subject_config).findIndex(sub => sub.name === managingSubtest.name) + 1}
                  </span>
                </div>
                <h2 className="text-[22px] sm:text-[24px] font-extrabold text-[#191b24] tracking-tight">
                  Kelola Soal: {managingSubtest.name}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowManageQuestionsModal(false);
                  setManagingSubtest(null);
                  setSubtestQuestions([]);
                  setShowImportTab(false);
                  setImportPreview([]);
                  setImportFile(null);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all text-[#424656]"
                title="Tutup"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Navigation (Tabs) */}
            <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-white px-8 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImportTab(false)}
                  className={`px-4 py-3 font-bold text-[13px] border-b-2 transition-all flex items-center gap-2 ${
                    !showImportTab
                      ? 'border-[#0050cb] text-[#0050cb]'
                      : 'border-transparent text-[#727687] hover:text-[#191b24]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                  Daftar Soal ({ensureArray(subtestQuestions).length})
                </button>
                <button
                  onClick={() => setShowImportTab(true)}
                  className={`px-4 py-3 font-bold text-[13px] border-b-2 transition-all flex items-center gap-2 ${
                    showImportTab
                      ? 'border-[#0050cb] text-[#0050cb]'
                      : 'border-transparent text-[#727687] hover:text-[#191b24]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  Import Excel
                </button>
              </div>

            </div>

            {/* Modal Body Container */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[#f8fafc]">
              
              {/* Tab 1: Daftar Soal with Split Layout */}
              {!showImportTab && (
                <>
                  {questionsLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                      <span className="material-symbols-outlined animate-spin text-[32px] text-[#0050cb]">progress_activity</span>
                      <span className="mt-3 text-[14px] text-[#727687] font-semibold">Memuat soal subtes...</span>
                    </div>
                  ) : !ensureArray(subtestQuestions).length ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white m-6 rounded-3xl border border-dashed border-[#c2c6d8]/40">
                      <span className="material-symbols-outlined text-[56px] text-[#c2c6d8] mb-4">description</span>
                      <h3 className="text-[18px] font-bold text-[#191b24] mb-1">Belum Ada Soal</h3>
                      <p className="text-[14px] text-[#727687] max-w-sm mb-6">Subtes ini belum memiliki soal. Silakan tambah soal dengan mengimport file Excel templates.</p>
                      <button
                        onClick={() => setShowImportTab(true)}
                        className="px-6 py-2.5 bg-[#0050cb] text-white font-bold rounded-xl hover:bg-[#003fa4] transition-all flex items-center gap-2 text-[13px] shadow-md shadow-[#0050cb]/10"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                        Import dari Excel
                      </button>
                    </div>
                  ) : (
                    /* Double Panel layout */
                    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0 w-full">
                      
                      {/* Left Panel: Number Navigation */}
                      <div className="w-full lg:w-[260px] border-r border-[#e2e8f0] bg-slate-50 flex flex-col min-h-0 shrink-0">
                        {/* Header */}
                        <div className="p-4 bg-white border-b border-[#e2e8f0] shrink-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[13px] font-bold text-[#191b24]">Navigasi Soal</h4>
                            <span className="text-[11px] font-bold text-[#727687] bg-slate-100 px-2 py-0.5 rounded-full">
                              {ensureArray(subtestQuestions).length} Soal
                            </span>
                          </div>
                        </div>

                        {/* Number Grid */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0">
                          <div className="grid grid-cols-5 gap-2">
                            {ensureArray(subtestQuestions).map((q, idx) => {
                              const isSelected = q.id === activeQuestionId;
                              const diffColor = q.difficulty === 'easy'
                                ? 'bg-emerald-400'
                                : q.difficulty === 'medium'
                                  ? 'bg-amber-400'
                                  : 'bg-red-400';
                              return (
                                <button
                                  key={q.id}
                                  onClick={() => {
                                    setActiveQuestionId(q.id);
                                    setEditingQuestion(null);
                                  }}
                                  className={`relative w-full aspect-square rounded-xl border text-[14px] font-bold transition-all flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-[#0050cb] border-[#0050cb] text-white shadow-lg shadow-[#0050cb]/20 scale-105'
                                      : 'bg-white border-slate-200 text-[#191b24] hover:border-[#0050cb]/40 hover:bg-[#f2f3ff]'
                                  }`}
                                  title={`Soal ${idx + 1} — ${q.difficulty === 'easy' ? 'Mudah' : q.difficulty === 'medium' ? 'Sedang' : 'Sulit'}`}
                                >
                                  {idx + 1}
                                  <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isSelected ? 'bg-white/60' : diffColor}`} />
                                </button>
                              );
                            })}
                          </div>

                          {ensureArray(subtestQuestions).length === 0 && (
                            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-[#c2c6d8]/30 p-6">
                              <span className="material-symbols-outlined text-[28px] text-[#c2c6d8] mb-2">quiz</span>
                              <p className="text-[12px] text-[#727687] font-bold">Belum ada soal</p>
                            </div>
                          )}
                        </div>

                        {/* Legend */}
                        <div className="px-4 py-2.5 border-t border-[#e2e8f0] bg-white shrink-0">
                          <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-[#727687]">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />Mudah</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Sedang</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />Sulit</span>
                          </div>
                        </div>

                        {/* Sidebar Footer */}
                        {ensureArray(subtestQuestions).length > 0 && (
                          <div className="p-4 border-t border-[#e2e8f0] bg-white shrink-0">
                            <button
                              onClick={handleDeleteAllQuestions}
                              className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-100 text-[12px] font-bold"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                              Hapus Semua Soal ({ensureArray(subtestQuestions).length})
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right Panel: Selected Question Preview/Edit */}
                      <div className="flex-1 bg-white flex flex-col min-h-0 overflow-hidden">
                        {(() => {
                          const selectedQuestion = ensureArray(subtestQuestions).find(q => q.id === activeQuestionId);
                          if (!selectedQuestion) {
                            return (
                              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                                <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">description</span>
                                <h4 className="text-[16px] font-bold text-[#191b24]">Belum Ada Soal Terpilih</h4>
                                <p className="text-[13px] text-[#727687] max-w-xs mt-1">Pilih salah satu soal di daftar sebelah kiri untuk melihat detail atau mengedit.</p>
                              </div>
                            );
                          }
                          const idx = ensureArray(subtestQuestions).findIndex(q => q.id === selectedQuestion.id);

                          return (
                            <>
                              {/* Top Panel Bar */}
                              <div className="px-6 py-4 border-b border-[#e2e8f0] bg-[#faf8ff]/50 flex flex-wrap justify-between items-center gap-4 shrink-0">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-[16px] font-extrabold text-[#191b24]">
                                    Detail Soal {idx + 1}
                                  </h3>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    selectedQuestion.difficulty === 'easy' ? 'bg-green-50 text-green-700 border border-green-200' :
                                    selectedQuestion.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                    'bg-red-50 text-red-700 border border-red-200'
                                  }`}>
                                    {selectedQuestion.difficulty === 'easy' ? 'Mudah' : selectedQuestion.difficulty === 'medium' ? 'Sedang' : 'Sulit'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleMoveQuestionUp(idx)}
                                    disabled={idx === 0}
                                    className="p-2 text-[#0050cb] hover:bg-[#f2f3ff] rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Naikkan Urutan"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                                  </button>
                                  <button
                                    onClick={() => handleMoveQuestionDown(idx)}
                                    disabled={idx === ensureArray(subtestQuestions).length - 1}
                                    className="p-2 text-[#0050cb] hover:bg-[#f2f3ff] rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    title="Turunkan Urutan"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                                  </button>

                                  <div className="h-6 w-px bg-slate-200 mx-2"></div>

                                  <button
                                    onClick={() => handleShuffleChoices(selectedQuestion)}
                                    className="px-3 py-1.5 rounded-xl text-[#0050cb] hover:bg-[#f2f3ff] transition-all flex items-center gap-1 text-[12px] font-bold"
                                    title="Acak pilihan jawaban"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">shuffle</span>
                                    Acak Opsi
                                  </button>

                                  <button
                                    onClick={() => handleRemoveQuestion(selectedQuestion.id)}
                                    className="px-3 py-1.5 rounded-xl text-red-600 hover:bg-red-50 transition-all flex items-center gap-1 text-[12px] font-bold"
                                    title="Hapus soal ini"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                    Hapus Soal
                                  </button>
                                </div>
                              </div>

                              {/* Content Area */}
                              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 custom-scrollbar min-h-0">
                                {editingQuestion && editingQuestion.id === selectedQuestion.id ? (
                                  /* INLINE EDITOR */
                                  <div className="space-y-6 max-w-3xl">
                                    <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                                      <div>
                                        <h4 className="text-[15px] font-bold text-[#191b24]">Edit Konten Soal</h4>
                                        <p className="text-[12px] text-[#727687]">Sesuaikan pertanyaan, gambar pendukung, dan bobot tingkat kesulitan.</p>
                                      </div>
                                      <span className="text-[11px] font-extrabold text-[#0050cb] bg-[#dae1ff] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                        Edit Mode
                                      </span>
                                    </div>

                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-[13px] font-bold text-[#191b24] mb-1.5">Stimulus / Wacana (Opsional)</label>
                                        <textarea
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/80 focus:ring-2 focus:ring-[#0050cb] outline-none transition-all text-[14px] min-h-[100px] font-medium leading-relaxed"
                                          value={editingQuestion.stimulus || ''}
                                          onChange={(e) => setEditingQuestion({ ...editingQuestion, stimulus: e.target.value })}
                                          placeholder="Masukkan stimulus/wacana di sini (opsional). Akan ditampilkan di atas pertanyaan."
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[13px] font-bold text-[#191b24] mb-1.5">Isi Pertanyaan</label>
                                        <textarea
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0050cb] outline-none transition-all text-[14px] min-h-[160px] font-medium leading-relaxed"
                                          value={editingQuestion.content}
                                          onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                                          placeholder="Tulis soal di sini. Gunakan sintaks LaTeX seperti $...$ atau $$...$$ untuk rumus matematika."
                                        />
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-[13px] font-bold text-[#191b24] mb-1.5">Tingkat Kesulitan</label>
                                          <select
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-[#0050cb] outline-none text-[14px] font-bold text-[#191b24]"
                                            value={editingQuestion.difficulty}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                                          >
                                            <option value="easy">Easy (Mudah)</option>
                                            <option value="medium">Medium (Sedang)</option>
                                            <option value="hard">Hard (Sulit)</option>
                                          </select>
                                        </div>

                                        {editingQuestion.image_url && (
                                          <div>
                                            <label className="block text-[13px] font-bold text-[#191b24] mb-1.5">Posisi Gambar</label>
                                            <div className="flex gap-4 py-2">
                                              <label className="flex items-center gap-2 text-[13px] cursor-pointer text-[#424656] font-bold">
                                                <input
                                                  type="radio"
                                                  name="inline_img_pos"
                                                  value="top"
                                                  checked={['top', 'before', 'atas'].includes(editingQuestion.image_position)}
                                                  onChange={() => setEditingQuestion({ ...editingQuestion, image_position: 'top' })}
                                                  className="w-4 h-4 text-[#0050cb] focus:ring-[#0050cb]"
                                                />
                                                Atas
                                              </label>
                                              <label className="flex items-center gap-2 text-[13px] cursor-pointer text-[#424656] font-bold">
                                                <input
                                                  type="radio"
                                                  name="inline_img_pos"
                                                  value="middle"
                                                  checked={['middle', 'ditengah', 'tengah'].includes(editingQuestion.image_position)}
                                                  onChange={() => setEditingQuestion({ ...editingQuestion, image_position: 'middle' })}
                                                  className="w-4 h-4 text-[#0050cb] focus:ring-[#0050cb]"
                                                />
                                                Tengah
                                              </label>
                                              <label className="flex items-center gap-2 text-[13px] cursor-pointer text-[#424656] font-bold">
                                                <input
                                                  type="radio"
                                                  name="inline_img_pos"
                                                  value="bottom"
                                                  checked={['bottom', 'after', 'bawah'].includes(editingQuestion.image_position) || !editingQuestion.image_position}
                                                  onChange={() => setEditingQuestion({ ...editingQuestion, image_position: 'bottom' })}
                                                  className="w-4 h-4 text-[#0050cb] focus:ring-[#0050cb]"
                                                />
                                                Bawah (Default)
                                              </label>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      <div className="border border-slate-200/60 rounded-xl p-4 bg-slate-50/50">
                                        <ImageUpload
                                          label="Gambar Pendukung Soal (Opsional)"
                                          value={editingQuestion.image_url || ''}
                                          onChange={(url) => setEditingQuestion({ ...editingQuestion, image_url: url })}
                                          folder="tryout/soal"
                                          aspectRatio="aspect-video"
                                        />
                                      </div>

                                      {editingQuestion.choices && editingQuestion.choices.length > 0 && (
                                        <div>
                                          <div className="flex items-center justify-between mb-2">
                                            <label className="block text-[13px] font-bold text-[#191b24]">Pilihan Jawaban (Non-Editable)</label>
                                            <span className="text-[10px] font-bold text-[#727687] bg-slate-100 px-2 py-0.5 rounded">
                                              Modifikasi via Re-import Excel
                                            </span>
                                          </div>
                                          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                            {editingQuestion.choices.map((choice) => (
                                              <div key={choice.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                                                  choice.is_correct ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                  {choice.label}
                                                </span>
                                                <span className="text-[13px] text-[#191b24] font-medium flex-1">
                                                  <MathText text={choice.content} />
                                                </span>
                                                {choice.is_correct && (
                                                  <span className="text-green-600 text-[11px] font-bold flex items-center gap-0.5">
                                                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                                    Kunci
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
                                      <button
                                        type="button"
                                        onClick={() => setEditingQuestion(null)}
                                        className="px-6 py-2.5 border border-slate-200 text-[#424656] font-bold rounded-xl hover:bg-slate-50 transition-all text-[13px]"
                                      >
                                        Batal
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleSaveQuestion}
                                        className="px-8 py-2.5 bg-[#0050cb] text-white font-bold rounded-xl hover:bg-[#003fa4] transition-all text-[13px] flex items-center gap-1.5 shadow-sm shadow-[#0050cb]/10"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">save</span>
                                        Simpan Perubahan
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* PREVIEW MODE */
                                  <div className="space-y-6">
                                    
                                    {/* Question box Card */}
                                    <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-5">
                                      {/* TOP IMAGE */}
                                      {selectedQuestion.image_url && ['top', 'before', 'atas'].includes(selectedQuestion.image_position) && (
                                        <div className="p-3 border border-slate-100 bg-white rounded-2xl inline-block max-w-full">
                                          <ZoomableImage
                                            src={selectedQuestion.image_url}
                                            alt="Soal"
                                            className="max-w-[500px] max-h-[300px] rounded-xl object-contain"
                                          />
                                        </div>
                                      )}

                                      {/* STIMULUS */}
                                      {selectedQuestion.stimulus && (
                                        <div className="text-[18px] text-slate-800 font-semibold leading-relaxed whitespace-pre-wrap">
                                          <MathText text={selectedQuestion.stimulus} />
                                        </div>
                                      )}

                                      {/* MIDDLE IMAGE */}
                                      {selectedQuestion.image_url && ['middle', 'ditengah', 'tengah'].includes(selectedQuestion.image_position) && (
                                        <div className="p-3 border border-slate-100 bg-white rounded-2xl inline-block max-w-full">
                                          <ZoomableImage
                                            src={selectedQuestion.image_url}
                                            alt="Soal"
                                            className="max-w-[500px] max-h-[300px] rounded-xl object-contain"
                                          />
                                        </div>
                                      )}

                                      <div className="text-[18px] text-slate-800 font-semibold leading-[1.8] whitespace-pre-wrap">
                                        <MathText text={selectedQuestion.content || ''} />
                                      </div>

                                      {/* BOTTOM IMAGE */}
                                      {selectedQuestion.image_url && (['bottom', 'after', 'bawah'].includes(selectedQuestion.image_position) || !['top', 'before', 'atas', 'middle', 'ditengah', 'tengah'].includes(selectedQuestion.image_position)) && (
                                        <div className="p-3 border border-slate-100 bg-white rounded-2xl inline-block max-w-full">
                                          <ZoomableImage
                                            src={selectedQuestion.image_url}
                                            alt="Soal"
                                            className="max-w-[500px] max-h-[300px] rounded-xl object-contain"
                                          />
                                        </div>
                                      )}
                                    </div>

                                    {/* Choices cards list */}
                                    {selectedQuestion.choices && selectedQuestion.choices.length > 0 && (
                                      <div className="space-y-4">
                                        <h4 className="text-[13px] font-bold text-[#727687] uppercase tracking-wider">Opsi Jawaban</h4>
                                        <div className="space-y-3.5">
                                          {selectedQuestion.choices.map((choice) => {
                                            const isCorrect = choice.is_correct;
                                            return (
                                              <div
                                                key={choice.id}
                                                className={`p-5 rounded-xl border flex items-start gap-4 transition-all ${
                                                  isCorrect
                                                    ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950 shadow-sm'
                                                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                                                }`}
                                              >
                                                <span className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[14px] font-extrabold ${
                                                  isCorrect
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                }`}>
                                                  {choice.label}
                                                </span>
                                                <div className="flex-1 text-[16px] font-semibold leading-[1.7] pt-0.5 text-slate-900">
                                                  <MathText text={choice.content} />
                                                </div>
                                                {isCorrect && (
                                                  <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider shrink-0">
                                                    <span className="material-symbols-outlined text-[14px]">check</span>
                                                    Kunci Jawaban
                                                  </span>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Pembahasan / Explanation */}
                                    {(() => {
                                      const correctChoice = selectedQuestion.choices?.find(c => c.is_correct);
                                      const explanation = correctChoice?.explanation || selectedQuestion.choices?.find(c => c.explanation)?.explanation;
                                      if (!explanation) return null;
                                      return (
                                        <div className="space-y-3">
                                          <h4 className="text-[13px] font-bold text-[#727687] uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[16px]">menu_book</span>
                                            Pembahasan
                                          </h4>
                                          <div className="p-6 rounded-xl bg-sky-50/60 border border-sky-200/60">
                                            <div className="text-[16px] text-slate-800 leading-[1.8] whitespace-pre-wrap">
                                              <MathText text={explanation} />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* Edit Soal button */}
                                    <div className="flex justify-end pt-4">
                                      <button
                                        onClick={() => setEditingQuestion({ ...selectedQuestion })}
                                        className="px-6 py-3 bg-[#0050cb] text-white font-bold rounded-xl hover:bg-[#003fa4] transition-all flex items-center gap-2 text-[13px] shadow-md shadow-[#0050cb]/15"
                                      >
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                        Edit Soal Ini
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tab 2: Import Excel */}
              {showImportTab && (
                <div className="overflow-y-auto p-10 flex-1 bg-white custom-scrollbar">
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {ensureArray(importPreview).length === 0 ? (
                      <div
                        className="border-2 border-dashed border-slate-300 hover:border-[#0050cb] rounded-[24px] p-16 text-center cursor-pointer hover:bg-slate-50/50 transition-all flex flex-col items-center justify-center group"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-[#f2f3ff] group-hover:text-[#0050cb] flex items-center justify-center transition-all mb-4">
                          <span className="material-symbols-outlined text-[36px]">cloud_upload</span>
                        </div>
                        <p className="text-[18px] font-extrabold text-[#191b24] mb-1">Unggah Template Soal Excel</p>
                        <p className="text-[14px] text-[#727687] max-w-md">Format yang didukung: .xlsx, .xls, atau .csv. Pastikan format kolom sesuai dengan template standar.</p>
                        <div className="mt-4 px-4 py-2 rounded-xl bg-slate-100 text-[11px] font-bold text-[#424656] border border-slate-200 max-w-xl leading-relaxed text-left">
                          <strong>Kolom yang diperlukan:</strong> question, choice_a, choice_b, choice_c, choice_d, choice_e, correct_answer, explanation
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleImportFileChange}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-800">
                            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                            <span className="text-[14px] font-bold">
                              Berhasil membaca file. {ensureArray(importPreview).length} baris data siap diimport.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setImportPreview([]);
                              setImportFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="text-[12px] font-bold text-red-600 hover:text-red-800 underline"
                          >
                            Reset File
                          </button>
                        </div>

                        {/* List preview of top 5 rows */}
                        <div className="space-y-3">
                          <h4 className="text-[12px] font-bold text-[#727687] uppercase tracking-wider">Preview 5 Soal Pertama</h4>
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {importPreview.slice(0, 5).map((row, idx) => {
                              const keys = Object.keys(row).map(k => k.replace(/^\uFEFF/, '').trim());
                              const vals = Object.values(row);
                              const findCol = (...aliases) => {
                                for (const alias of aliases) {
                                  const i = keys.findIndex(k => k.toLowerCase() === alias.toLowerCase());
                                  if (i !== -1 && vals[i] !== undefined && vals[i] !== '') return String(vals[i]).trim();
                                }
                                return '';
                              };
                              const soal = findCol('soal', 'content', 'question', 'pertanyaan');
                              const kunci = findCol('kunci jawaban', 'kunci', 'jawaban', 'answer');
                              return (
                                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 text-left">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-extrabold text-[#0050cb] uppercase tracking-wider">Soal {idx + 1}</span>
                                    {kunci && (
                                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        Kunci: {kunci.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[13px] text-slate-800 font-bold leading-relaxed whitespace-pre-wrap">{soal || 'Soal tidak terdeteksi'}</p>
                                  <div className="flex flex-wrap gap-2 mt-2.5">
                                    {['A','B','C','D','E'].map(label => {
                                      const val = findCol(`opsi ${label.toLowerCase()}`, `choice_${label.toLowerCase()}`, label.toLowerCase(), label);
                                      if (!val) return null;
                                      return (
                                        <span key={label} className={`text-[11px] px-2.5 py-1 rounded-lg border text-slate-700 ${
                                          kunci?.toUpperCase() === label
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                            : 'bg-white border-slate-200'
                                        }`}>
                                          <strong>{label}.</strong> {val.length > 40 ? val.slice(0, 40) + '...' : val}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {importPreview.length > 5 && (
                            <p className="text-center text-[12px] text-[#727687] font-semibold py-1">
                              +{importPreview.length - 5} soal lainnya tidak ditampilkan dalam preview
                            </p>
                          )}
                        </div>

                        {/* Import tab Actions */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setImportPreview([]);
                              setImportFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="px-6 py-2.5 border border-slate-200 text-[#424656] font-bold rounded-xl hover:bg-slate-50 transition-all text-[13px]"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleImportQuestions}
                            disabled={importLoading}
                            className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-60 text-[13px] flex items-center gap-1.5 shadow-md shadow-emerald-600/10"
                          >
                            <span className="material-symbols-outlined text-[16px]">download</span>
                            {importLoading ? 'Mengimport...' : 'Mulai Import Soal'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-[#e2e8f0] flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-bold text-[#727687] uppercase tracking-wider">Kuota Soal Subtes:</span>
                <span className={`text-[13px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  ensureArray(subtestQuestions).length >= managingSubtest.questionCount
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                  {ensureArray(subtestQuestions).length} / {managingSubtest.questionCount} Soal
                </span>
              </div>
              <button
                onClick={() => {
                  setShowManageQuestionsModal(false);
                  setManagingSubtest(null);
                  setSubtestQuestions([]);
                  setShowImportTab(false);
                  setImportPreview([]);
                  setImportFile(null);
                }}
                className="px-8 py-2.5 bg-[#191b24] text-white font-bold rounded-xl hover:bg-[#323647] transition-all text-[13px] shadow-sm active:scale-[0.98]"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTryout;
