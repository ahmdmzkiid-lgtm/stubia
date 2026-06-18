import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ImageUpload from '../../components/ImageUpload';
import { ujianMandiriService } from '../../services/api';
import { STATUS_OPTIONS, getStatusConfig } from '../../data/ujianMandiriData';
import MathText from '../../components/MathText';
import ZoomableImage from '../../components/ui/ZoomableImage';

const DEFAULT_BANNER = {
  badge: 'AKADEMIK 2026', title: 'Eksplorasi Ujian Mandiri 2026',
  description: 'Temukan peluang pendidikan terbaik di institusi pendidikan tinggi terkemuka Indonesia.',
  primaryButtonText: 'Mulai Registrasi', primaryButtonLink: '',
  secondaryButtonText: 'Unduh Panduan (PDF)', secondaryButtonLink: '',
  image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
  verifiedLabel: 'TERVERIFIKASI', verifiedText: 'Institusi Utama',
};

const emptyItem = {
  universitas: '',
  nama_ujian: '',
  status: 'open',
  deadline: '',
  lokasi: '',
  image: '',
  logo: '',
  detail_link: '',
};

const emptyTryoutPackage = {
  title: '',
  description: '',
  icon: 'auto_stories',
  icon_color: '#0050cb',
  duration: 120,
  points_correct: 4,
  points_incorrect: -1,
  points_unanswered: 0,
  is_active: true,
  required_plan: 'gratis',
};

const emptyLatihan = {
  package_name: '',
  description: '',
  is_active: true,
  required_plan: 'gratis',
};

const emptyExercise = {
  title: '',
  category: '',
  description: '',
  icon: 'auto_stories',
  icon_bg_color: '#0050cb',
  category_color: '#0050cb',
  button_style: 'filled',
  points_correct: 4,
  points_incorrect: -1,
  points_unanswered: 0,
  is_active: true,
  required_plan: 'gratis',
  package_name: '',
};

const ICON_OPTIONS = [
  'auto_stories', 'science', 'public', 'psychology', 'edit_note', 
  'calculate', 'menu_book', 'history_edu', 'school', 'quiz'
];

const PLAN_OPTIONS = [
  { value: 'gratis', label: 'Gratis', icon: 'redeem' },
  { value: 'premium', label: 'Premium', icon: 'diamond' },
  { value: 'sultan', label: 'Sultan', icon: 'stars' },
];

export default function ManageUjianMandiri() {
  const [tab, setTab] = useState('list');
  const [items, setItems] = useState([]);
  const [banner, setBanner] = useState(DEFAULT_BANNER);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyItem);

  // Tryout & Latihan states
  const [tryoutPackages, setTryoutPackages] = useState({});
  const [latihanSoal, setLatihanSoal] = useState({});
  const [selectedUjianId, setSelectedUjianId] = useState(null);
  const [showTryoutModal, setShowTryoutModal] = useState(false);
  const [showLatihanModal, setShowLatihanModal] = useState(false);
  const [editingTryout, setEditingTryout] = useState(null);
  const [editingLatihan, setEditingLatihan] = useState(null);
  const [tryoutForm, setTryoutForm] = useState(emptyTryoutPackage);
  const [latihanForm, setLatihanForm] = useState(emptyLatihan);

  // Exercise states
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [exerciseForm, setExerciseForm] = useState(emptyExercise);

  // Kelola Soal states
  const [managingItem, setManagingItem] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [showImportSection, setShowImportSection] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importDifficulty, setImportDifficulty] = useState('medium');
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importParsing, setImportParsing] = useState(false);
  const importFileRef = useRef(null);
  const [showEditQuestionModal, setShowEditQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // Pagination for questions list
  const QUESTIONS_PER_PAGE = 20;
  const [questionsPage, setQuestionsPage] = useState(0);

  // ========== Fetch data from API ==========
  const fetchItems = async () => {
    try {
      const res = await ujianMandiriService.list();
      setItems(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch ujian mandiri:', err);
    }
  };

  const fetchBanner = async () => {
    try {
      const res = await ujianMandiriService.getBanner();
      if (res.data.data) setBanner(res.data.data);
    } catch (err) {
      console.error('Failed to fetch banner:', err);
    }
  };

  const fetchTryoutPackages = async (ujianId) => {
    try {
      const res = await ujianMandiriService.getTryoutPackages(ujianId);
      setTryoutPackages(prev => ({ ...prev, [ujianId]: res.data.data || [] }));
    } catch (err) {
      console.error('Failed to fetch tryout packages:', err);
    }
  };

  const fetchLatihanSoal = async (ujianId) => {
    try {
      const res = await ujianMandiriService.getLatihan(ujianId);
      setLatihanSoal(prev => ({ ...prev, [ujianId]: res.data.data || [] }));
    } catch (err) {
      console.error('Failed to fetch latihan soal:', err);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchBanner();
  }, []);

  // Fetch tryout/latihan when items change
  useEffect(() => {
    items.forEach(item => {
      fetchTryoutPackages(item.id);
      fetchLatihanSoal(item.id);
    });
  }, [items.length]);

  // ========== Ujian Mandiri CRUD ==========
  const openAddModal = () => {
    setEditingItem(null);
    setForm({ ...emptyItem });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({ ...item });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.universitas.trim() || !form.nama_ujian.trim()) {
      toast.error('Universitas & Nama Ujian wajib diisi');
      return;
    }
    try {
      if (editingItem) {
        await ujianMandiriService.update(editingItem.id, form);
        toast.success('Ujian mandiri berhasil diupdate');
      } else {
        await ujianMandiriService.create(form);
        toast.success('Ujian mandiri berhasil ditambahkan');
      }
      await fetchItems();
      setShowModal(false);
    } catch (err) {
      toast.error('Gagal menyimpan: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus ujian mandiri ini?')) return;
    try {
      await ujianMandiriService.delete(id);
      toast.success('Ujian mandiri berhasil dihapus');
      await fetchItems();
    } catch (err) {
      toast.error('Gagal menghapus: ' + (err.response?.data?.error || err.message));
    }
  };

  // ========== Banner ==========
  const handleSaveBanner = async () => {
    try {
      await ujianMandiriService.updateBanner(banner);
      toast.success('Banner berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan banner: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleResetBanner = async () => {
    if (!confirm('Reset banner ke default?')) return;
    try {
      setBanner(DEFAULT_BANNER);
      await ujianMandiriService.updateBanner(DEFAULT_BANNER);
      toast.success('Banner direset ke default');
    } catch (err) {
      toast.error('Gagal mereset banner');
    }
  };

  // ========== Tryout Package handlers ==========
  const openTryoutModal = (ujianId, pkg = null) => {
    setSelectedUjianId(ujianId);
    if (pkg) {
      setEditingTryout(pkg);
      setTryoutForm({ ...emptyTryoutPackage, ...pkg });
    } else {
      setEditingTryout(null);
      setTryoutForm({ ...emptyTryoutPackage });
    }
    setShowTryoutModal(true);
  };

  const handleTryoutSubmit = async (e) => {
    e.preventDefault();
    if (!tryoutForm.title.trim()) {
      toast.error('Judul paket wajib diisi');
      return;
    }
    try {
      if (editingTryout) {
        await ujianMandiriService.updateTryoutPackage(editingTryout.id, tryoutForm);
        toast.success('Paket tryout berhasil diupdate');
      } else {
        await ujianMandiriService.createTryoutPackage(selectedUjianId, tryoutForm);
        toast.success('Paket tryout berhasil ditambahkan');
      }
      await fetchTryoutPackages(selectedUjianId);
      setShowTryoutModal(false);
    } catch (err) {
      toast.error('Gagal menyimpan paket tryout: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteTryout = async (ujianId, pkgId) => {
    if (!confirm('Hapus paket tryout ini?')) return;
    try {
      await ujianMandiriService.deleteTryoutPackage(pkgId);
      toast.success('Paket tryout berhasil dihapus');
      await fetchTryoutPackages(ujianId);
    } catch (err) {
      toast.error('Gagal menghapus paket tryout');
    }
  };

  // ========== Latihan Soal handlers ==========
  const openLatihanModal = (ujianId, lat = null) => {
    setSelectedUjianId(ujianId);
    if (lat) {
      setEditingLatihan(lat);
      setLatihanForm({ ...emptyLatihan, ...lat });
    } else {
      setEditingLatihan(null);
      setLatihanForm({ ...emptyLatihan });
    }
    setShowLatihanModal(true);
  };

  const handleLatihanSubmit = async (e) => {
    e.preventDefault();
    if (!latihanForm.package_name || !latihanForm.package_name.trim()) {
      toast.error('Nama paket wajib diisi');
      return;
    }
    const payload = {
      ...latihanForm,
      title: latihanForm.package_name,
      category: 'package_placeholder',
    };
    try {
      if (editingLatihan) {
        await ujianMandiriService.updateLatihan(editingLatihan.id, payload);
        toast.success('Paket latihan berhasil diupdate');
      } else {
        await ujianMandiriService.createLatihan(selectedUjianId, payload);
        toast.success('Paket latihan berhasil ditambahkan');
      }
      await fetchLatihanSoal(selectedUjianId);
      setShowLatihanModal(false);
    } catch (err) {
      toast.error('Gagal menyimpan paket latihan: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteLatihan = async (ujianId, latId) => {
    if (!confirm('Hapus latihan soal ini?')) return;
    try {
      await ujianMandiriService.deleteLatihan(latId);
      toast.success('Latihan soal berhasil dihapus');
      await fetchLatihanSoal(ujianId);
    } catch (err) {
      toast.error('Gagal menghapus latihan soal');
    }
  };

  const handleDeletePackage = async (ujianId, pkgName, items) => {
    if (!confirm(`Hapus paket "${pkgName}" beserta seluruh ${items.length} latihan didalamnya?`)) return;
    try {
      for (const item of items) {
        await ujianMandiriService.deleteLatihan(item.id);
      }
      toast.success(`Paket "${pkgName}" berhasil dihapus`);
      await fetchLatihanSoal(ujianId);
    } catch (err) {
      toast.error('Gagal menghapus paket latihan');
    }
  };

  const openExerciseModal = (ujianId, pkgName, exercise = null) => {
    setSelectedUjianId(ujianId);
    if (exercise) {
      setEditingExercise(exercise);
      setExerciseForm({ ...emptyExercise, ...exercise });
    } else {
      setEditingExercise(null);
      setExerciseForm({ ...emptyExercise, package_name: pkgName });
    }
    setShowExerciseModal(true);
  };

  const handleExerciseSubmit = async (e) => {
    e.preventDefault();
    if (!exerciseForm.title.trim()) {
      toast.error('Judul latihan wajib diisi');
      return;
    }
    try {
      if (editingExercise) {
        await ujianMandiriService.updateLatihan(editingExercise.id, exerciseForm);
        toast.success('Latihan soal berhasil diupdate');
      } else {
        await ujianMandiriService.createLatihan(selectedUjianId, exerciseForm);
        toast.success('Latihan soal berhasil ditambahkan');
      }
      await fetchLatihanSoal(selectedUjianId);
      setShowExerciseModal(false);
    } catch (err) {
      toast.error('Gagal menyimpan latihan soal: ' + (err.response?.data?.error || err.message));
    }
  };

  // ========== Kelola Soal Functions ==========
  const fetchQuestions = async (itemInfo = managingItem) => {
    if (!itemInfo) return;
    setQuestionsLoading(true);
    try {
      const res = await ujianMandiriService.getQuestions({
        parent_type: itemInfo.type === 'tryout' ? 'tryout_package' : 'latihan_soal',
        parent_id: itemInfo.item.id,
      });
      setQuestions(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const openManageSoal = async (type, ujianId, item) => {
    const itemInfo = { type, ujianId, item };
    setManagingItem(itemInfo);
    setShowImportSection(false);
    setImportFile(null);
    setImportPreview([]);
    setQuestionsPage(0);
    await fetchQuestions(itemInfo);
  };

  const closeManageSoal = () => {
    setManagingItem(null);
    setQuestions([]);
    setExpandedQuestion(null);
    setShowImportSection(false);
  };

  const handleImportFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImportFile(f);
    setImportParsing(true);
    setImportPreview([]);
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Defer heavy XLSX parsing so the UI thread stays responsive
      setTimeout(() => {
        try {
          const data = new Uint8Array(ev.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
          setImportPreview(json);
        } catch { setImportPreview([]); }
        setImportParsing(false);
      }, 50);
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImportUpload = async () => {
    if (!importFile || !managingItem) return;
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('parent_type', managingItem.type === 'tryout' ? 'tryout_package' : 'latihan_soal');
      formData.append('parent_id', managingItem.item.id);
      formData.append('difficulty', importDifficulty);
      const res = await ujianMandiriService.importExcel(formData);
      toast.success(`${res.data.imported || 0} soal berhasil diimport`);
      // Refresh questions
      await fetchQuestions(managingItem);
      setImportFile(null);
      setImportPreview([]);
      setShowImportSection(false);
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Gagal mengimport soal: ' + (err.response?.data?.error || err.message || ''));
    } finally {
      setImportLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Hapus soal ini?')) return;
    try {
      await ujianMandiriService.deleteQuestion(questionId);
      setQuestions(questions.filter(q => q.id !== questionId));
      toast.success('Soal berhasil dihapus');
    } catch (err) {
      toast.error('Gagal menghapus soal');
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion({ ...question });
    setShowEditQuestionModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    try {
      await ujianMandiriService.updateQuestion(editingQuestion.id, {
        content: editingQuestion.content,
        difficulty: editingQuestion.difficulty,
        image_url: editingQuestion.image_url,
        image_position: editingQuestion.image_position || 'after',
      });
      setQuestions(questions.map(q => q.id === editingQuestion.id ? editingQuestion : q));
      toast.success('Soal berhasil disimpan');
      setShowEditQuestionModal(false);
      setEditingQuestion(null);
    } catch (err) {
      toast.error('Gagal menyimpan soal');
    }
  };

  const handleShuffleChoices = async (questionId) => {
    try {
      await ujianMandiriService.shuffleChoices(questionId);
      toast.success('Jawaban berhasil diacak!');
      // Reload questions to get shuffled choices from server
      await fetchQuestions();
    } catch (err) {
      toast.error('Gagal mengacak jawaban');
    }
  };

  const handleDeleteAllQuestions = async () => {
    if (!managingItem) return;
    const count = questions.length;
    if (!confirm(`Hapus semua ${count} soal? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const payload = managingItem.type === 'tryout'
        ? { tryout_package_id: managingItem.item.id }
        : { latihan_id: managingItem.item.id };
      await ujianMandiriService.deleteAllQuestions(payload);
      setQuestions([]);
      toast.success(`${count} soal berhasil dihapus`);
    } catch (err) {
      toast.error('Gagal menghapus semua soal: ' + (err.response?.data?.error || err.message));
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-[#c2c6d8]/40 focus:border-[#0050cb] focus:outline-none text-[14px]";
  const labelCls = "block text-[13px] font-semibold text-[#424656] mb-2";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[28px] lg:text-[32px] font-bold text-[#191b24]">Manage Ujian Mandiri</h2>
        <p className="text-[14px] text-[#424656] mt-1">Kelola daftar ujian mandiri dan banner halaman.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#c2c6d8]/30 overflow-x-auto">
        <button
          onClick={() => setTab('list')}
          className={`px-5 py-3 text-[14px] font-bold border-b-2 transition-colors whitespace-nowrap ${tab === 'list' ? 'border-[#0050cb] text-[#0050cb]' : 'border-transparent text-[#424656] hover:text-[#0050cb]'}`}
        >
          Daftar Ujian ({items.length})
        </button>
        <button
          onClick={() => setTab('tryout')}
          className={`px-5 py-3 text-[14px] font-bold border-b-2 transition-colors whitespace-nowrap ${tab === 'tryout' ? 'border-[#0050cb] text-[#0050cb]' : 'border-transparent text-[#424656] hover:text-[#0050cb]'}`}
        >
          Paket Tryout
        </button>
        <button
          onClick={() => setTab('latihan')}
          className={`px-5 py-3 text-[14px] font-bold border-b-2 transition-colors whitespace-nowrap ${tab === 'latihan' ? 'border-[#0050cb] text-[#0050cb]' : 'border-transparent text-[#424656] hover:text-[#0050cb]'}`}
        >
          Latihan Soal
        </button>
        <button
          onClick={() => setTab('banner')}
          className={`px-5 py-3 text-[14px] font-bold border-b-2 transition-colors whitespace-nowrap ${tab === 'banner' ? 'border-[#0050cb] text-[#0050cb]' : 'border-transparent text-[#424656] hover:text-[#0050cb]'}`}
        >
          Edit Banner
        </button>
      </div>

      {/* List Tab */}
      {tab === 'list' && (
        <div className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={openAddModal}
              className="bg-[#0050cb] text-white px-5 py-2.5 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tambah Ujian Mandiri
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#c2c6d8]/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f2f3ff]/50">
                    <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">Universitas</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">Nama Ujian</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">Deadline</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">Lokasi</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c2c6d8]/10">
                  {items.map(item => {
                    const statusCfg = getStatusConfig(item.status);
                    return (
                      <tr key={item.id} className="hover:bg-[#f2f3ff]/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#f0edee] flex items-center justify-center shrink-0 overflow-hidden">
                              {item.logo ? (
                                <img src={item.logo} alt="" className="w-8 h-8 object-contain" />
                              ) : (
                                <span className="material-symbols-outlined text-[#0050cb] text-[20px]">school</span>
                              )}
                            </div>
                            <span className="font-bold text-[14px]">{item.universitas}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#424656]">{item.nama_ujian}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 border-l-2 text-[11px] font-bold ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-[#424656]">{item.deadline}</td>
                        <td className="px-6 py-4 text-[13px] text-[#424656]">{item.lokasi}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(item)}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#0050cb] hover:bg-[#dae1ff] transition-colors"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-[#727687]">
                        Belum ada data. Klik "Tambah Ujian Mandiri".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tryout Tab */}
      {tab === 'tryout' && (
        <div className="space-y-6">
          {items.map(ujian => {
            const packages = tryoutPackages[ujian.id] || [];
            return (
              <div key={ujian.id} className="bg-white rounded-2xl border border-[#c2c6d8]/30 overflow-hidden">
                <div className="px-6 py-4 bg-[#f2f3ff]/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden border border-[#c2c6d8]/30">
                      {ujian.logo ? (
                        <img src={ujian.logo} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-[#0050cb] text-[20px]">school</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[16px] text-[#191b24]">{ujian.universitas}</h3>
                      <p className="text-[12px] text-[#424656]">{ujian.nama_ujian} • {packages.length} paket</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openTryoutModal(ujian.id)}
                    className="bg-[#0050cb] text-white px-4 py-2 rounded-lg font-bold text-[13px] hover:bg-[#003fa4] transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Tambah Paket
                  </button>
                </div>
                <div className="p-4">
                  {packages.length > 0 ? (
                    <div className="space-y-3">
                      {packages.map(pkg => (
                        <div key={pkg.id} className="flex items-center gap-4 p-4 bg-[#f6f3f4] rounded-xl">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${pkg.icon_color || '#0050cb'}15` }}>
                            <span className="material-symbols-outlined text-[24px]" style={{ color: pkg.icon_color || '#0050cb' }}>{pkg.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[14px] text-[#191b24] truncate">{pkg.title}</h4>
                            <p className="text-[12px] text-[#424656] truncate">{pkg.description}</p>
                            <div className="flex gap-4 mt-1 text-[11px] text-[#727687]">
                              <span>{pkg.soal_count || 0} soal</span>
                              <span>{pkg.duration} menit</span>
                              <span>{(pkg.peserta || 0).toLocaleString()} peserta</span>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-bold">✓ {pkg.points_correct ?? 4}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">✗ {pkg.points_incorrect ?? -1}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">— {pkg.points_unanswered ?? 0}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openManageSoal('tryout', ujian.id, pkg)}
                              className="w-9 h-9 rounded-xl bg-[#0050cb]/10 text-[#0050cb] hover:bg-[#0050cb] hover:text-white flex items-center justify-center transition-all shadow-sm shadow-[#0050cb]/5"
                              title="Kelola Soal"
                            >
                              <span className="material-symbols-outlined text-[18px]">quiz</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openTryoutModal(ujian.id, pkg)}
                              className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-all"
                              title="Edit Paket"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTryout(ujian.id, pkg.id)}
                              className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-all"
                              title="Hapus Paket"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-[#727687] text-[14px]">Belum ada paket tryout</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Latihan Tab */}
      {tab === 'latihan' && (
        <div className="space-y-6">
          {items.map(ujian => {
            const latihans = latihanSoal[ujian.id] || [];
            // Group by package_name
            const packageGroups = {};
            latihans.forEach(lat => {
              const pkg = lat.package_name || 'Paket 1';
              if (!packageGroups[pkg]) packageGroups[pkg] = [];
              packageGroups[pkg].push(lat);
            });
            const packageNames = Object.keys(packageGroups).sort();
            return (
              <div key={ujian.id} className="bg-white rounded-2xl border border-[#c2c6d8]/30 overflow-hidden">
                <div className="px-6 py-4 bg-[#f2f3ff]/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden border border-[#c2c6d8]/30">
                      {ujian.logo ? (
                        <img src={ujian.logo} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-[#0050cb] text-[20px]">school</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[16px] text-[#191b24]">{ujian.universitas}</h3>
                      <p className="text-[12px] text-[#424656]">{ujian.nama_ujian} • {latihans.filter(l => l.category !== 'package_placeholder').length} latihan • {packageNames.length} paket</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openLatihanModal(ujian.id)}
                    className="bg-[#0050cb] text-white px-4 py-2 rounded-lg font-bold text-[13px] hover:bg-[#003fa4] transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Tambah Latihan
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {packageNames.length > 0 ? (
                    <div className="space-y-6">
                      {packageNames.map(pkgName => {
                        const placeholder = packageGroups[pkgName].find(lat => lat.category === 'package_placeholder');
                        const exercises = packageGroups[pkgName].filter(lat => lat.category !== 'package_placeholder');
                        const pkgDescription = placeholder?.description || 'Paket latihan soal mandiri.';
                        const pkgPlan = placeholder?.required_plan || 'gratis';
                        const pkgActive = placeholder?.is_active ?? true;

                        return (
                          <div key={pkgName} className="bg-[#fcfcff] border-2 border-[#dae1ff] rounded-2xl p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#c2c6d8]/20">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-[#0050cb] text-[20px]">inventory_2</span>
                                  <h4 className="font-bold text-[16px] text-[#191b24]">{pkgName}</h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    pkgPlan === 'sultan' ? 'bg-yellow-100 text-yellow-700' :
                                    pkgPlan === 'premium' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>{pkgPlan.toUpperCase()}</span>
                                  {!pkgActive && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">NON-AKTIF</span>
                                  )}
                                </div>
                                <p className="text-[13px] text-[#424656]">{pkgDescription}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                <button
                                  type="button"
                                  onClick={() => openExerciseModal(ujian.id, pkgName)}
                                  className="bg-[#0050cb] text-white px-3.5 py-2 rounded-xl font-bold text-[12px] hover:bg-[#003fa4] transition-all flex items-center gap-1.5"
                                >
                                  <span className="material-symbols-outlined text-[16px]">add</span>
                                  Tambah Latihan Soal
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openLatihanModal(ujian.id, placeholder || { package_name: pkgName, description: pkgDescription, required_plan: pkgPlan, is_active: pkgActive })}
                                  className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-all"
                                  title="Edit Paket"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePackage(ujian.id, pkgName, packageGroups[pkgName])}
                                  className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-all"
                                  title="Hapus Paket"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </div>
                            </div>

                            {exercises.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {exercises.map(lat => (
                                  <div key={lat.id} className="flex items-center gap-4 p-4 bg-white border border-[#c2c6d8]/20 rounded-xl hover:shadow-sm transition-all">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${lat.icon_bg_color || '#0050cb'}15` }}>
                                      <span className="material-symbols-outlined text-[24px]" style={{ color: lat.icon_bg_color || '#0050cb' }}>{lat.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: lat.category_color || '#0050cb' }}>{lat.category}</span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                          lat.required_plan === 'sultan' ? 'bg-yellow-100 text-yellow-700' :
                                          lat.required_plan === 'premium' ? 'bg-blue-100 text-blue-700' :
                                          'bg-green-100 text-green-700'
                                        }`}>{(lat.required_plan || 'gratis').toUpperCase()}</span>
                                      </div>
                                      <h4 className="font-bold text-[14px] text-[#191b24] truncate">{lat.title}</h4>
                                      <p className="text-[12px] text-[#424656] truncate">{lat.description}</p>
                                      <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-bold">✓ {lat.points_correct ?? 4}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">✗ {lat.points_incorrect ?? -1}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold">— {lat.points_unanswered ?? 0}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => openManageSoal('latihan', ujian.id, lat)}
                                        className="w-9 h-9 rounded-xl bg-[#0050cb]/10 text-[#0050cb] hover:bg-[#0050cb] hover:text-white flex items-center justify-center transition-all shadow-sm shadow-[#0050cb]/5"
                                        title="Kelola Soal"
                                      >
                                        <span className="material-symbols-outlined text-[18px]">quiz</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openExerciseModal(ujian.id, pkgName, lat)}
                                        className="w-9 h-9 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-all"
                                        title="Edit Latihan"
                                      >
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLatihan(ujian.id, lat.id)}
                                        className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-all"
                                        title="Hapus Latihan"
                                      >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-center py-6 text-[#727687] text-[13px] border border-dashed border-[#c2c6d8]/30 rounded-xl bg-white">Belum ada latihan soal di dalam paket ini. Klik "Tambah Latihan Soal".</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-[#727687] text-[14px]">Belum ada paket latihan. Klik "Tambah Latihan".</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Banner Tab */}
      {tab === 'banner' && (
        <div className="bg-white rounded-2xl border border-[#c2c6d8]/30 p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}>Badge</label>
              <input className={inputCls} value={banner.badge} onChange={(e) => setBanner({ ...banner, badge: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Verified Label</label>
              <input className={inputCls} value={banner.verifiedLabel} onChange={(e) => setBanner({ ...banner, verifiedLabel: e.target.value })} />
            </div>
            <div className="lg:col-span-2">
              <label className={labelCls}>Title</label>
              <input className={inputCls} value={banner.title} onChange={(e) => setBanner({ ...banner, title: e.target.value })} />
            </div>
            <div className="lg:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea
                className={inputCls + ' min-h-[100px] resize-y'}
                value={banner.description}
                onChange={(e) => setBanner({ ...banner, description: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Tombol Utama - Teks</label>
              <input className={inputCls} value={banner.primaryButtonText} onChange={(e) => setBanner({ ...banner, primaryButtonText: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Tombol Utama - Link</label>
              <input className={inputCls} value={banner.primaryButtonLink} onChange={(e) => setBanner({ ...banner, primaryButtonLink: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className={labelCls}>Tombol Sekunder - Teks</label>
              <input className={inputCls} value={banner.secondaryButtonText} onChange={(e) => setBanner({ ...banner, secondaryButtonText: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Tombol Sekunder - Link</label>
              <input className={inputCls} value={banner.secondaryButtonLink} onChange={(e) => setBanner({ ...banner, secondaryButtonLink: e.target.value })} placeholder="https://..." />
            </div>
            <div className="lg:col-span-2">
              <ImageUpload
                label="Gambar Hero Banner"
                value={banner.image}
                onChange={(url) => setBanner({ ...banner, image: url })}
                folder="ujian-mandiri/banner"
                aspectRatio="aspect-[21/9]"
              />
            </div>
            <div>
              <label className={labelCls}>Verified Text</label>
              <input className={inputCls} value={banner.verifiedText} onChange={(e) => setBanner({ ...banner, verifiedText: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-6 border-t border-[#c2c6d8]/20">
            <button
              onClick={handleSaveBanner}
              className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Simpan Banner
            </button>
            <button
              onClick={handleResetBanner}
              className="border border-[#c2c6d8]/40 text-[#424656] px-5 py-3 rounded-xl font-bold text-[14px] hover:bg-[#f2f3ff] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              Reset Default
            </button>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-[#191b24]">
                {editingItem ? 'Edit Ujian Mandiri' : 'Tambah Ujian Mandiri'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nama Universitas *</label>
                <input className={inputCls} value={form.universitas || ''} onChange={(e) => setForm({ ...form, universitas: e.target.value })} required />
              </div>
              <div>
                <label className={labelCls}>Nama Ujian *</label>
                <input className={inputCls} value={form.nama_ujian || ''} onChange={(e) => setForm({ ...form, nama_ujian: e.target.value })} placeholder="e.g. SIMAK UI" required />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select
                  className={inputCls + ' cursor-pointer'}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Deadline / Tanggal</label>
                <input className={inputCls} value={form.deadline || ''} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="e.g. 15 Juli 2026" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Lokasi</label>
                <input className={inputCls} value={form.lokasi || ''} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} placeholder="e.g. Depok, Jawa Barat" />
              </div>
              <div className="sm:col-span-2">
                <ImageUpload
                  label="Gambar Kampus"
                  value={form.image || ''}
                  onChange={(url) => setForm({ ...form, image: url })}
                  folder="ujian-mandiri/kampus"
                  aspectRatio="aspect-video"
                />
              </div>
              <div className="sm:col-span-2">
                <ImageUpload
                  label="Logo Universitas"
                  value={form.logo || ''}
                  onChange={(url) => setForm({ ...form, logo: url })}
                  folder="ujian-mandiri/logo"
                  aspectRatio="aspect-square"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Link Detail (Lihat Detail Button)</label>
                <input className={inputCls} value={form.detail_link || ''} onChange={(e) => setForm({ ...form, detail_link: e.target.value })} placeholder="https://simak.ui.ac.id" />
              </div>

              <div className="sm:col-span-2 flex gap-3 pt-4 border-t border-[#c2c6d8]/20">
                <button
                  type="submit"
                  className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {editingItem ? 'Update' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border border-[#c2c6d8]/40 text-[#424656] px-5 py-3 rounded-xl font-bold text-[14px] hover:bg-[#f2f3ff] transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tryout Package */}
      {showTryoutModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowTryoutModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-[#191b24]">
                {editingTryout ? 'Edit Paket Tryout' : 'Tambah Paket Tryout'}
              </h3>
              <button type="button" onClick={() => setShowTryoutModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleTryoutSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Judul Paket *</label>
                <input className={inputCls} value={tryoutForm.title} onChange={(e) => setTryoutForm({ ...tryoutForm, title: e.target.value })} placeholder="e.g. SIMAK UI Package 1: Kemampuan Dasar" required />
              </div>
              <div>
                <label className={labelCls}>Deskripsi</label>
                <textarea className={inputCls + ' min-h-[80px] resize-y'} value={tryoutForm.description} onChange={(e) => setTryoutForm({ ...tryoutForm, description: e.target.value })} placeholder="Fokus pada Matematika Dasar, Bahasa Indonesia, dan Bahasa Inggris." />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-[#c2c6d8] text-[#0050cb]"
                  checked={!!tryoutForm.is_active}
                  onChange={(e) => setTryoutForm({ ...tryoutForm, is_active: e.target.checked })}
                />
                <span className="text-[14px] font-bold text-[#191b24]">Aktifkan paket</span>
              </label>
              <div>
                <label className={labelCls}>Akses Minimum</label>
                <div className="flex gap-3 flex-wrap">
                  {PLAN_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTryoutForm({ ...tryoutForm, required_plan: opt.value })}
                      className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold text-[13px] border-2 transition-all flex items-center justify-center gap-2 ${
                        tryoutForm.required_plan === opt.value
                          ? 'border-[#0050cb] bg-[#dae1ff] text-[#0050cb]'
                          : 'border-[#c2c6d8]/30 bg-[#f2f3ff] text-[#727687] hover:border-[#c2c6d8]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Icon</label>
                  <select className={inputCls + ' cursor-pointer'} value={tryoutForm.icon} onChange={(e) => setTryoutForm({ ...tryoutForm, icon: e.target.value })}>
                    {ICON_OPTIONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Warna Icon</label>
                  <input type="color" className="w-full h-[46px] rounded-xl border border-[#c2c6d8]/40 cursor-pointer" value={tryoutForm.icon_color || '#0050cb'} onChange={(e) => setTryoutForm({ ...tryoutForm, icon_color: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Jumlah Soal</label>
                  <input type="number" className={inputCls} value={tryoutForm.soal_count || 0} onChange={(e) => setTryoutForm({ ...tryoutForm, soal_count: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className={labelCls}>Durasi (menit)</label>
                  <input type="number" className={inputCls} value={tryoutForm.duration} onChange={(e) => setTryoutForm({ ...tryoutForm, duration: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className={labelCls}>Peserta</label>
                  <input type="number" className={inputCls} value={tryoutForm.peserta || 0} onChange={(e) => setTryoutForm({ ...tryoutForm, peserta: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              {/* Scoring Points */}
              <div className="bg-[#f2f3ff]/50 border border-[#c2c6d8]/30 rounded-xl p-4 space-y-3">
                <label className="block text-[13px] font-bold text-[#0050cb]">⚙️ Pengaturan Penilaian</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-green-700 mb-1">Benar (+)</label>
                    <input type="number" className={inputCls} value={tryoutForm.points_correct ?? 4} onChange={(e) => setTryoutForm({ ...tryoutForm, points_correct: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-red-700 mb-1">Salah (−)</label>
                    <input type="number" className={inputCls} value={tryoutForm.points_incorrect ?? -1} onChange={(e) => setTryoutForm({ ...tryoutForm, points_incorrect: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Kosong</label>
                    <input type="number" className={inputCls} value={tryoutForm.points_unanswered ?? 0} onChange={(e) => setTryoutForm({ ...tryoutForm, points_unanswered: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <p className="text-[11px] text-[#727687]">Contoh: 10 benar, 5 salah, 5 kosong = {((tryoutForm.points_correct ?? 4) * 10) + ((tryoutForm.points_incorrect ?? -1) * 5) + ((tryoutForm.points_unanswered ?? 0) * 5)} poin</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#c2c6d8]/20">
                <button type="submit" className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {editingTryout ? 'Update' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setShowTryoutModal(false)} className="border border-[#c2c6d8]/40 text-[#424656] px-5 py-3 rounded-xl font-bold text-[14px] hover:bg-[#f2f3ff] transition-all">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Paket Latihan */}
      {showLatihanModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowLatihanModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-[#191b24]">
                {editingLatihan ? 'Edit Paket Latihan' : 'Tambah Paket Latihan'}
              </h3>
              <button type="button" onClick={() => setShowLatihanModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleLatihanSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Nama Paket *</label>
                <input className={inputCls} value={latihanForm.package_name || ''} onChange={(e) => setLatihanForm({ ...latihanForm, package_name: e.target.value })} placeholder="e.g. Paket 1, Paket 2, Paket 3" required />
              </div>
              <div>
                <label className={labelCls}>Deskripsi</label>
                <textarea className={inputCls + ' min-h-[80px] resize-y'} value={latihanForm.description || ''} onChange={(e) => setLatihanForm({ ...latihanForm, description: e.target.value })} placeholder="Deskripsi paket latihan ini." />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-[#c2c6d8] text-[#0050cb]"
                  checked={latihanForm.is_active !== false}
                  onChange={(e) => setLatihanForm({ ...latihanForm, is_active: e.target.checked })}
                />
                <span className="text-[14px] font-bold text-[#191b24]">Aktifkan paket</span>
              </label>
              <div>
                <label className={labelCls}>Akses Minimum</label>
                <div className="flex gap-3 flex-wrap">
                  {PLAN_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLatihanForm({ ...latihanForm, required_plan: opt.value })}
                      className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold text-[13px] border-2 transition-all flex items-center justify-center gap-2 ${
                        (latihanForm.required_plan || 'gratis') === opt.value
                          ? 'border-[#0050cb] bg-[#dae1ff] text-[#0050cb]'
                          : 'border-[#c2c6d8]/30 bg-[#f2f3ff] text-[#727687] hover:border-[#c2c6d8]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#c2c6d8]/20">
                <button type="submit" className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {editingLatihan ? 'Update' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setShowLatihanModal(false)} className="border border-[#c2c6d8]/40 text-[#424656] px-5 py-3 rounded-xl font-bold text-[14px] hover:bg-[#f2f3ff] transition-all">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Latihan Soal */}
      {showExerciseModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowExerciseModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-[#191b24]">
                {editingExercise ? 'Edit Latihan Soal' : `Tambah Latihan Soal - ${exerciseForm.package_name}`}
              </h3>
              <button type="button" onClick={() => setShowExerciseModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleExerciseSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Judul Latihan Soal *</label>
                <input className={inputCls} value={exerciseForm.title || ''} onChange={(e) => setExerciseForm({ ...exerciseForm, title: e.target.value })} placeholder="e.g. Penalaran Umum" required />
              </div>
              <div>
                <label className={labelCls}>Kategori / Subtest</label>
                <input className={inputCls} value={exerciseForm.category || ''} onChange={(e) => setExerciseForm({ ...exerciseForm, category: e.target.value })} placeholder="e.g. Penalaran Umum, Pengetahuan Kuantitatif" />
              </div>
              <div>
                <label className={labelCls}>Deskripsi</label>
                <textarea className={inputCls + ' min-h-[80px] resize-y'} value={exerciseForm.description || ''} onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })} placeholder="Deskripsi latihan soal ini." />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-[#c2c6d8] text-[#0050cb]"
                  checked={exerciseForm.is_active !== false}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, is_active: e.target.checked })}
                />
                <span className="text-[14px] font-bold text-[#191b24]">Aktifkan latihan</span>
              </label>
              <div>
                <label className={labelCls}>Akses Minimum</label>
                <div className="flex gap-3 flex-wrap">
                  {PLAN_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExerciseForm({ ...exerciseForm, required_plan: opt.value })}
                      className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold text-[13px] border-2 transition-all flex items-center justify-center gap-2 ${
                        (exerciseForm.required_plan || 'gratis') === opt.value
                          ? 'border-[#0050cb] bg-[#dae1ff] text-[#0050cb]'
                          : 'border-[#c2c6d8]/30 bg-[#f2f3ff] text-[#727687] hover:border-[#c2c6d8]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Icon</label>
                  <select className={inputCls + ' cursor-pointer'} value={exerciseForm.icon || 'auto_stories'} onChange={(e) => setExerciseForm({ ...exerciseForm, icon: e.target.value })}>
                    {ICON_OPTIONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Warna Icon</label>
                  <input type="color" className="w-full h-[46px] rounded-xl border border-[#c2c6d8]/40 cursor-pointer" value={exerciseForm.icon_bg_color || '#0050cb'} onChange={(e) => setExerciseForm({ ...exerciseForm, icon_bg_color: e.target.value, category_color: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Style Tombol</label>
                <select className={inputCls + ' cursor-pointer'} value={exerciseForm.button_style || 'filled'} onChange={(e) => setExerciseForm({ ...exerciseForm, button_style: e.target.value })}>
                  <option value="filled">Filled (Biru)</option>
                  <option value="outline">Outline</option>
                </select>
              </div>

              {/* Scoring Points */}
              <div className="bg-[#f2f3ff]/50 border border-[#c2c6d8]/30 rounded-xl p-4 space-y-3">
                <label className="block text-[13px] font-bold text-[#0050cb]">⚙️ Pengaturan Penilaian</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-green-700 mb-1">Benar (+)</label>
                    <input type="number" className={inputCls} value={exerciseForm.points_correct ?? 4} onChange={(e) => setExerciseForm({ ...exerciseForm, points_correct: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-red-700 mb-1">Salah (−)</label>
                    <input type="number" className={inputCls} value={exerciseForm.points_incorrect ?? -1} onChange={(e) => setExerciseForm({ ...exerciseForm, points_incorrect: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Kosong</label>
                    <input type="number" className={inputCls} value={exerciseForm.points_unanswered ?? 0} onChange={(e) => setExerciseForm({ ...exerciseForm, points_unanswered: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#c2c6d8]/20">
                <button type="submit" className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  {editingExercise ? 'Update' : 'Simpan'}
                </button>
                <button type="button" onClick={() => setShowExerciseModal(false)} className="border border-[#c2c6d8]/40 text-[#424656] px-5 py-3 rounded-xl font-bold text-[14px] hover:bg-[#f2f3ff] transition-all">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Soal */}
      {managingItem && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={closeManageSoal}>
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#c2c6d8]/30 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-[20px] font-bold text-[#191b24]">
                  Kelola Soal - {managingItem.item.title}
                </h3>
                <p className="text-[13px] text-[#424656]">
                  {managingItem.type === 'tryout' ? 'Paket Tryout' : 'Latihan Soal'} • {questions.length} soal
                </p>
              </div>
              <button type="button" onClick={closeManageSoal} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Import Section Toggle & Delete All */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowImportSection(!showImportSection)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all ${
                    showImportSection ? 'bg-[#0050cb] text-white' : 'bg-[#f2f3ff] text-[#0050cb] hover:bg-[#dae1ff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  Import Excel
                </button>
                {questions.length > 0 && (
                  <button
                    onClick={handleDeleteAllQuestions}
                    className="px-4 py-2.5 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab]"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                    Hapus Semua ({questions.length})
                  </button>
                )}
              </div>

              {/* Import Excel Section */}
              {showImportSection && (
                <div className="bg-[#f2f3ff]/50 border border-[#c2c6d8]/30 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* File Drop Zone */}
                    <div 
                      className={`flex-1 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${
                        importFile ? 'border-green-400 bg-green-50' : 'border-[#c2c6d8] hover:border-[#0050cb] bg-white'
                      }`}
                      onClick={() => importFileRef.current?.click()}
                    >
                      <input type="file" accept=".xlsx,.xls" className="hidden" ref={importFileRef} onChange={handleImportFileChange} />
                      {importFile ? (
                        <div>
                          {importParsing ? (
                            <>
                              <span className="material-symbols-outlined animate-spin text-[#0050cb] text-[40px] mb-3">progress_activity</span>
                              <p className="font-bold text-[16px] text-[#424656]">Memproses file...</p>
                              <p className="text-[14px] text-[#727687] mt-1">{importFile.name}</p>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-green-600 text-[40px] mb-3">check_circle</span>
                              <p className="font-bold text-[16px] text-[#191b24]">{importFile.name}</p>
                              <p className="text-[14px] text-[#727687] mt-1"><strong>{importPreview.length}</strong> soal terdeteksi</p>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setImportFile(null); setImportPreview([]); }} className="text-[#ba1a1a] text-[13px] font-bold mt-3 hover:underline">Ganti File</button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="material-symbols-outlined text-[#727687] text-[40px] mb-3">upload_file</span>
                          <p className="font-bold text-[16px] text-[#424656]">Klik untuk pilih file Excel</p>
                          <p className="text-[13px] text-[#727687] mt-1">Format .xlsx atau .xls</p>
                        </div>
                      )}
                        </div>
                    
                    {/* Config */}
                    <div className="w-full md:w-64 space-y-4">
                      <div>
                        <label className="block text-[12px] font-bold text-[#727687] uppercase tracking-wider mb-2">Tingkat Kesulitan</label>
                        <select 
                          className="w-full bg-white border border-[#c2c6d8]/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#0050cb] text-[14px]"
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
                        disabled={!importPreview.length || importLoading || importParsing}
                        className="w-full bg-[#0050cb] text-white py-3 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-[#003fa4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {importLoading ? (
                          <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Mengimport...</>
                        ) : (
                          <><span className="material-symbols-outlined text-[18px]">cloud_upload</span> Upload Soal</>
                        )}
                      </button>
                      <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-[12px] leading-relaxed border border-blue-100">
                        <span className="font-bold block mb-1">Format Excel:</span>
                        SOAL | OPSI A | OPSI B | OPSI C | OPSI D | OPSI E | KUNCI JAWABAN | PEMBAHASAN
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions List */}
              {questionsLoading ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined animate-spin text-[40px] text-[#0050cb] mb-4">progress_activity</span>
                  <p className="text-[#727687] font-medium">Memuat soal...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-16 bg-[#f2f3ff]/30 rounded-2xl border border-dashed border-[#c2c6d8]">
                  <span className="material-symbols-outlined text-[56px] text-[#c2c6d8] mb-4">quiz</span>
                  <p className="text-[#727687] font-medium">Belum ada soal</p>
                  <p className="text-[13px] text-[#727687] mt-1">Import soal dari file Excel untuk memulai</p>
                </div>
              ) : (() => {
                const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
                const startIdx = questionsPage * QUESTIONS_PER_PAGE;
                const pageQuestions = questions.slice(startIdx, startIdx + QUESTIONS_PER_PAGE);
                return (
                  <div className="space-y-3">
                    {/* Pagination Info */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between bg-[#f2f3ff]/50 rounded-xl px-4 py-3">
                        <span className="text-[13px] text-[#424656]">
                          Menampilkan <strong>{startIdx + 1}-{Math.min(startIdx + QUESTIONS_PER_PAGE, questions.length)}</strong> dari <strong>{questions.length}</strong> soal
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setQuestionsPage(0)}
                            disabled={questionsPage === 0}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#424656] hover:bg-[#dae1ff] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Halaman pertama"
                          >
                            <span className="material-symbols-outlined text-[16px]">first_page</span>
                          </button>
                          <button
                            onClick={() => setQuestionsPage(p => Math.max(0, p - 1))}
                            disabled={questionsPage === 0}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#424656] hover:bg-[#dae1ff] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                          </button>
                          <span className="px-3 text-[13px] font-bold text-[#0050cb]">{questionsPage + 1} / {totalPages}</span>
                          <button
                            onClick={() => setQuestionsPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={questionsPage >= totalPages - 1}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#424656] hover:bg-[#dae1ff] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                          </button>
                          <button
                            onClick={() => setQuestionsPage(totalPages - 1)}
                            disabled={questionsPage >= totalPages - 1}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#424656] hover:bg-[#dae1ff] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Halaman terakhir"
                          >
                            <span className="material-symbols-outlined text-[16px]">last_page</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {pageQuestions.map((q, idx) => {
                      const globalIdx = startIdx + idx;
                      const isExpanded = expandedQuestion === q.id;
                      // Truncate plain text for collapsed view to avoid heavy KaTeX rendering
                      const previewText = !isExpanded && q.content && q.content.length > 150
                        ? q.content.substring(0, 150) + '...'
                        : q.content;
                      return (
                        <div key={q.id} className="bg-white border border-[#c2c6d8]/30 rounded-xl overflow-hidden hover:shadow-md transition-all">
                          <div 
                            className="p-4 flex items-start gap-3 cursor-pointer"
                            onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                          >
                            <span className="w-8 h-8 rounded-lg bg-[#f2f3ff] flex items-center justify-center text-[#0050cb] font-bold text-[13px] shrink-0">
                              {globalIdx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              {isExpanded ? (
                                <MathText className="text-[14px] text-[#191b24] font-medium" text={q.content || ''} />
                              ) : (
                                <p className="text-[14px] text-[#191b24] font-medium line-clamp-2">{previewText || ''}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                  q.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                  'bg-[#f2f3ff] text-[#0050cb]'
                                }`}>
                                  {q.difficulty === 'easy' ? 'Mudah' : q.difficulty === 'hard' ? 'Sulit' : 'Sedang'}
                                </span>
                                <span className="text-[10px] text-[#727687]">{q.choices?.length || 0} opsi</span>
                                {q.image_url && <span className="text-[10px] text-[#727687] bg-[#f2f3ff] px-2 py-0.5 rounded">📷 Gambar</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditQuestion(q); }}
                                className="p-1.5 text-[#727687] hover:text-[#0050cb] hover:bg-[#dae1ff]/30 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleShuffleChoices(q.id); }}
                                className="p-1.5 text-[#727687] hover:text-[#0050cb] hover:bg-[#dae1ff]/30 rounded-lg transition-colors"
                                title="Acak Jawaban"
                              >
                                <span className="material-symbols-outlined text-[18px]">shuffle</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }}
                                className="p-1.5 text-[#727687] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/30 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                              <span className="material-symbols-outlined text-[18px] text-[#727687] transition-transform ml-1" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                                expand_more
                              </span>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-0 border-t border-[#c2c6d8]/20">
                              {q.image_url && (
                                <div className="mb-3 pt-3">
                                  <ZoomableImage src={q.image_url} alt="Soal" className="max-w-[300px] max-h-[200px] rounded-lg object-contain border border-[#c2c6d8]/30" />
                                </div>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-3">
                                {q.choices?.map(c => (
                                  <div key={c.id} className={`p-3 rounded-lg border text-[13px] flex items-start gap-2 ${
                                    c.is_correct ? 'border-green-300 bg-green-50' : 'border-[#c2c6d8]/30 bg-[#f6f3f4]'
                                  }`}>
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                      c.is_correct ? 'bg-green-500 text-white' : 'bg-[#c2c6d8]/30 text-[#424656]'
                                    }`}>{c.label}</span>
                                    <div className="flex-1 min-w-0">
                                      <MathText className={c.is_correct ? 'text-green-800 font-medium' : 'text-[#191b24]'} text={c.content || ''} />
                                      {c.is_correct && c.explanation && (
                                        <MathText className="text-[11px] text-green-700 mt-1 italic block" text={c.explanation} />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Bottom Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-1 pt-2">
                        <button
                          onClick={() => setQuestionsPage(p => Math.max(0, p - 1))}
                          disabled={questionsPage === 0}
                          className="px-4 py-2 rounded-lg text-[13px] font-bold text-[#0050cb] hover:bg-[#dae1ff] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          ← Sebelumnya
                        </button>
                        <span className="px-4 text-[13px] text-[#424656]">{questionsPage + 1} / {totalPages}</span>
                        <button
                          onClick={() => setQuestionsPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={questionsPage >= totalPages - 1}
                          className="px-4 py-2 rounded-lg text-[13px] font-bold text-[#0050cb] hover:bg-[#dae1ff] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          Selanjutnya →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {showEditQuestionModal && editingQuestion && (
        <div className="fixed inset-0 z-[250] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowEditQuestionModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-[#191b24]">Edit Soal</h3>
              <button type="button" onClick={() => setShowEditQuestionModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[14px] font-bold text-[#191b24] mb-2">Pertanyaan</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8]/40 focus:border-[#0050cb] focus:outline-none text-[14px] min-h-[100px] resize-y"
                  value={editingQuestion.content}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                />
              </div>

              <ImageUpload
                label="Gambar Soal (opsional)"
                value={editingQuestion.image_url || ''}
                onChange={(url) => setEditingQuestion({ ...editingQuestion, image_url: url })}
                folder="ujian-mandiri/soal"
                aspectRatio="aspect-video"
              />

              {editingQuestion.image_url && (
                <div>
                  <label className="block text-[14px] font-bold text-[#191b24] mb-2">Posisi Gambar</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-[14px] cursor-pointer text-[#424656]">
                      <input
                        type="radio"
                        name="image_position"
                        value="after"
                        checked={(editingQuestion.image_position || 'after') === 'after'}
                        onChange={() => setEditingQuestion({ ...editingQuestion, image_position: 'after' })}
                        className="w-4 h-4 text-[#0050cb]"
                      />
                      Setelah Teks (Bawah)
                    </label>
                    <label className="flex items-center gap-2 text-[14px] cursor-pointer text-[#424656]">
                      <input
                        type="radio"
                        name="image_position"
                        value="before"
                        checked={editingQuestion.image_position === 'before'}
                        onChange={() => setEditingQuestion({ ...editingQuestion, image_position: 'before' })}
                        className="w-4 h-4 text-[#0050cb]"
                      />
                      Sebelum Teks (Atas)
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[14px] font-bold text-[#191b24] mb-2">Tingkat Kesulitan</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8]/40 focus:border-[#0050cb] focus:outline-none text-[14px]"
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
                      <div key={c.id} className={`p-3 rounded-xl border text-[13px] flex items-start gap-2 ${
                        c.is_correct ? 'border-green-300 bg-green-50' : 'border-[#c2c6d8]/30 bg-[#f2f3ff]/50'
                      }`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          c.is_correct ? 'bg-green-500 text-white' : 'bg-[#c2c6d8]/30 text-[#424656]'
                        }`}>{c.label}</span>
                        <MathText className={c.is_correct ? 'text-green-800 font-medium' : 'text-[#191b24]'} text={c.content || ''} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#727687] mt-2">* Pilihan jawaban tidak dapat diedit di sini. Gunakan import Excel untuk mengganti soal.</p>
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
}
