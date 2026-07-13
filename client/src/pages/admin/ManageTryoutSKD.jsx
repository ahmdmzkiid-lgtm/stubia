import React, { useState, useEffect, useRef } from 'react';
import { skdService } from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ImageUpload from '../../components/ImageUpload';
import MathText from '../../components/MathText';
import ZoomableImage from '../../components/ui/ZoomableImage';
import { useAuth } from '../../hooks/useAuth';

export default function ManageTryoutSKD() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('packages');
  const [loading, setLoading] = useState(false);

  // --- Packages State ---
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageStats, setPackageStats] = useState({});
  const [packageForm, setPackageForm] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    is_public: true,
    is_active: true,
    required_plan: 'gratis',
    subject_config: [
      { name: 'TWK', questionCount: 30, durationMin: 30, durationSec: 0 },
      { name: 'TIU', questionCount: 35, durationMin: 30, durationSec: 0 },
      { name: 'TKP', questionCount: 45, durationMin: 40, durationSec: 0 },
    ]
  });

  const PLAN_OPTIONS = [
    { value: 'gratis', label: 'Gratis (Free Plan)', icon: 'redeem' },
    { value: 'cpns_to_eceran', label: 'Eceran CPNS', icon: 'shopping_bag' },
    { value: 'cpns_to_all', label: 'Paket Bundling CPNS', icon: 'widgets' },
    { value: 'cpns_3m', label: 'Premium CPNS 3 Bulan', icon: 'diamond' },
    { value: 'cpns_6m', label: 'Premium CPNS 6 Bulan', icon: 'star' },
  ];

  // --- Questions State ---
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [managingSubtest, setManagingSubtest] = useState(null); // { name: 'TWK'|'TIU'|'TKP', subjectId: 'uuid' }
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [showImportTab, setShowImportTab] = useState(false);

  // Manual Question Form Modal
  const [showQuestionFormModal, setShowQuestionFormModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    content: '',
    stimulus: '',
    image_url: '',
    image_position: 'after',
    difficulty: 'medium',
    topic_id: '',
    choices: [
      { label: 'A', content: '', is_correct: false, tkp_point: 0, explanation: '' },
      { label: 'B', content: '', is_correct: false, tkp_point: 0, explanation: '' },
      { label: 'C', content: '', is_correct: false, tkp_point: 0, explanation: '' },
      { label: 'D', content: '', is_correct: false, tkp_point: 0, explanation: '' },
      { label: 'E', content: '', is_correct: false, tkp_point: 0, explanation: '' },
    ]
  });

  // Import State
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importTopicId, setImportTopicId] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const fileInputRef = useRef(null);

  // --- Subjects & Topics State ---
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState({}); // { subjectId: [topics] }

  // --- Registrations State ---
  const [registrations, setRegistrations] = useState([]);
  const [regFilter, setRegFilter] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingId, setRejectingId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingRegAction, setSubmittingRegAction] = useState(false);

  // --- Initial Data Fetching ---
  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const subRes = await skdService.adminGetSubjects();
      const subs = subRes.data?.data || [];
      setSubjects(subs);
      for (const sub of subs) {
        fetchTopics(sub.id);
      }

      if (activeTab === 'packages') {
        const res = await skdService.adminGetPackages();
        const pkgs = res.data?.data || [];
        setPackages(pkgs);
        pkgs.forEach(p => fetchPackageStats(p.id));
      } else if (activeTab === 'registrations') {
        fetchRegistrations();
      }
    } catch (err) {
      toast.error('Gagal memuat data awal');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (subjectId) => {
    try {
      const res = await skdService.adminGetTopics(subjectId);
      setTopics(prev => ({
        ...prev,
        [subjectId]: res.data?.data || []
      }));
    } catch (err) {}
  };

  const fetchRegistrations = async () => {
    try {
      const params = regFilter ? { status: regFilter } : {};
      const res = await skdService.adminGetRegistrations(params);
      setRegistrations(res.data?.data || []);
    } catch (err) {
      toast.error('Gagal memuat pendaftaran tryout');
    }
  };

  // --- Package Actions ---
  const fetchPackageStats = async (packageId) => {
    if (!packageId || packageId === 'latihan-umum') return;
    try {
      const res = await skdService.adminGetPackageStats(packageId);
      setPackageStats(prev => ({
        ...prev,
        [packageId]: res.data?.data || []
      }));
    } catch (err) {
      console.error('Failed to load stats for package:', packageId);
    }
  };

  const handleOpenPackageModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      let dateStr = '';
      if (pkg.scheduled_at) {
        try {
          const d = new Date(pkg.scheduled_at);
          if (!isNaN(d.getTime())) {
            dateStr = d.toISOString().slice(0, 16);
          }
        } catch (e) {
          console.error(e);
        }
      }
      let subjectConfig = [];
      if (pkg.subject_config) {
        if (typeof pkg.subject_config === 'string') {
          try {
            subjectConfig = JSON.parse(pkg.subject_config);
          } catch (e) {
            console.error(e);
          }
        } else {
          subjectConfig = pkg.subject_config;
        }
      }
      if (subjectConfig.length === 0) {
        subjectConfig = [
          { name: 'TWK', questionCount: 30, durationMin: 30, durationSec: 0 },
          { name: 'TIU', questionCount: 35, durationMin: 30, durationSec: 0 },
          { name: 'TKP', questionCount: 45, durationMin: 40, durationSec: 0 },
        ];
      }
      setPackageForm({
        title: pkg.title || '',
        description: pkg.description || '',
        scheduled_at: dateStr,
        is_public: !!pkg.is_public,
        is_active: pkg.is_active !== undefined ? pkg.is_active : true,
        required_plan: pkg.required_plan || 'gratis',
        subject_config: subjectConfig
      });
    } else {
      setEditingPackage(null);
      setPackageForm({
        title: '',
        description: '',
        scheduled_at: '',
        is_public: true,
        is_active: true,
        required_plan: 'gratis',
        subject_config: [
          { name: 'TWK', questionCount: 30, durationMin: 30, durationSec: 0 },
          { name: 'TIU', questionCount: 35, durationMin: 30, durationSec: 0 },
          { name: 'TKP', questionCount: 45, durationMin: 40, durationSec: 0 },
        ]
      });
    }
    setShowPackageModal(true);
  };

  const setFormValue = (key, val) => {
    setPackageForm(prev => ({ ...prev, [key]: val }));
  };

  const updateSubtestFormConfig = (index, field, val) => {
    const updated = [...packageForm.subject_config];
    updated[index][field] = val;
    setPackageForm(prev => ({ ...prev, subject_config: updated }));
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!packageForm.title.trim()) {
      toast.error('Judul paket wajib diisi');
      return;
    }
    try {
      const payload = {
        ...packageForm,
        scheduled_at: packageForm.scheduled_at ? new Date(packageForm.scheduled_at).toISOString() : null
      };

      if (editingPackage) {
        await skdService.adminUpdatePackage(editingPackage.id, payload);
        toast.success('Paket tryout berhasil diperbarui');
      } else {
        await skdService.adminCreatePackage(payload);
        toast.success('Paket tryout baru berhasil dibuat');
      }
      setShowPackageModal(false);
      fetchInitialData();
    } catch (err) {
      toast.error('Gagal menyimpan paket tryout');
    }
  };

  const handleDeletePackage = async (pkgId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus paket ini secara permanen? Semua soal di dalam paket ini akan dilepas paketnya (kembali ke latihan umum).')) return;
    try {
      await skdService.adminDeletePackage(pkgId);
      toast.success('Paket berhasil dihapus');
      if (selectedPackage?.id === pkgId) setSelectedPackage(null);
      fetchInitialData();
    } catch (err) {
      toast.error('Gagal menghapus paket');
    }
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    fetchPackageStats(pkg.id);
  };

  // --- Questions Actions ---
  useEffect(() => {
    if (showQuestionsModal && managingSubtest) {
      loadQuestions();
    }
  }, [showQuestionsModal, managingSubtest]);

  const loadQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const params = {
        subject_id: managingSubtest.subjectId,
        package_id: selectedPackage?.id,
        limit: 200, // Load all questions for index navigator
      };
      const res = await skdService.adminGetQuestions(params);
      const data = res.data?.data || [];
      setQuestions(data);
      if (data.length > 0) {
        setActiveQuestionId(data[0].id);
      } else {
        setActiveQuestionId(null);
      }
    } catch (err) {
      toast.error('Gagal memuat soal');
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleOpenQuestionForm = (q = null) => {
    if (q) {
      setEditingQuestion(q);
      setQuestionForm({
        content: q.content || '',
        stimulus: q.stimulus || '',
        image_url: q.image_url || '',
        image_position: q.image_position || 'after',
        difficulty: q.difficulty || 'medium',
        topic_id: q.topic_id || '',
        choices: q.choices && q.choices.length > 0 ? q.choices.map(c => ({
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
        ]
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        content: '',
        stimulus: '',
        image_url: '',
        image_position: 'after',
        difficulty: 'medium',
        topic_id: topics[managingSubtest?.subjectId]?.[0]?.id || '',
        choices: [
          { label: 'A', content: '', is_correct: false, tkp_point: 0, explanation: '' },
          { label: 'B', content: '', is_correct: false, tkp_point: 0, explanation: '' },
          { label: 'C', content: '', is_correct: false, tkp_point: 0, explanation: '' },
          { label: 'D', content: '', is_correct: false, tkp_point: 0, explanation: '' },
          { label: 'E', content: '', is_correct: false, tkp_point: 0, explanation: '' },
        ]
      });
    }
    setShowQuestionFormModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionForm.content.trim()) {
      toast.error('Konten soal wajib diisi');
      return;
    }
    const emptyChoice = questionForm.choices.find(c => !c.content.trim());
    if (emptyChoice) {
      toast.error(`Pilihan ${emptyChoice.label} masih kosong`);
      return;
    }

    if (!managingSubtest.is_tkp) {
      const correctCount = questionForm.choices.filter(c => c.is_correct).length;
      if (correctCount !== 1) {
        toast.error('Harap pilih tepat satu jawaban benar');
        return;
      }
    }

    try {
      const payload = {
        subject_id: managingSubtest.subjectId,
        tryout_package_id: selectedPackage.id,
        ...questionForm,
        topic_id: questionForm.topic_id || null
      };

      if (editingQuestion) {
        await skdService.adminUpdateQuestion(editingQuestion.id, payload);
        toast.success('Soal berhasil diperbarui');
      } else {
        await skdService.adminCreateQuestion(payload);
        toast.success('Soal baru berhasil ditambahkan');
      }
      setShowQuestionFormModal(false);
      loadQuestions();
      fetchPackageStats(selectedPackage.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan soal');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    try {
      await skdService.adminDeleteQuestion(qId);
      toast.success('Soal berhasil dihapus');
      loadQuestions();
      fetchPackageStats(selectedPackage.id);
    } catch (err) {
      toast.error('Gagal menghapus soal');
    }
  };

  const handleDeleteBulkQuestions = async () => {
    if (!window.confirm(`APAKAH ANDA YAKIN? Semua soal subtes ini di dalam paket ini akan dihapus secara permanen.`)) {
      return;
    }
    try {
      await skdService.adminDeleteBulkQuestions({
        subject_id: managingSubtest.subjectId,
        package_id: selectedPackage.id
      });
      toast.success('Semua soal berhasil dihapus');
      loadQuestions();
      fetchPackageStats(selectedPackage.id);
    } catch (err) {
      toast.error('Gagal menghapus soal massal');
    }
  };

  // --- Excel Import Actions ---
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
      } catch {
        setImportPreview([]);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImportExcel = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Harap pilih file Excel terlebih dahulu');
      return;
    }

    setImportLoading(true);
    const form = new FormData();
    form.append('file', importFile);
    form.append('subject_id', managingSubtest.subjectId);
    form.append('package_id', selectedPackage.id);
    if (importTopicId) {
      form.append('topic_id', importTopicId);
    }

    try {
      const res = await skdService.adminImportExcel(form);
      toast.success(res.data?.message || 'Soal berhasil diimport');
      setImportFile(null);
      setImportPreview([]);
      setShowImportTab(false);
      loadQuestions();
      fetchPackageStats(selectedPackage.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengimport file Excel');
    } finally {
      setImportLoading(false);
    }
  };

  const handleImageUploaded = (url) => {
    setQuestionForm(prev => ({
      ...prev,
      image_url: url
    }));
  };

  // --- Registration Actions ---
  const handleRegAction = async (id, action, reason = '') => {
    if (action === 'approve') {
      if (!window.confirm('Setujui pendaftaran ini? Pengguna akan diberikan akses ke paket ini.')) return;
    }
    setSubmittingRegAction(true);
    try {
      const payload = action === 'reject' ? { action, reason } : { action };
      await skdService.adminActionRegistration(id, payload);
      toast.success(action === 'approve' ? 'Pendaftaran disetujui' : 'Pendaftaran ditolak');
      setShowRejectModal(false);
      setRejectionReason('');
      fetchRegistrations();
    } catch (err) {
      toast.error('Gagal memproses pendaftaran');
    } finally {
      setSubmittingRegAction(false);
    }
  };

  const handleOpenRejectModal = (id) => {
    setRejectingId(id);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleSaveReject = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi');
      return;
    }
    handleRegAction(rejectingId, 'reject', rejectionReason);
  };

  const inputCls = "w-full bg-[#faf8ff] border border-[#c2c6d8]/40 rounded-xl px-4 py-3 text-[#191b24] font-medium placeholder:text-[#727687] focus:border-[#0050cb] focus:ring-1 focus:ring-[#0050cb] outline-none transition-all text-[14px]";
  const labelCls = "block text-xs font-bold uppercase tracking-wider text-[#424656] mb-2";

  return (
    <div className="animate-fade-in text-on-surface">
      {/* Page Header */}
      <div className="bg-white border-b border-[#c2c6d8]/20 -mx-6 -mt-6 px-6 py-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-bold text-[#191b24]">Manage Tryout SKD CPNS</h2>
          <p className="text-[13px] text-[#727687] mt-1">Buat paket, kelola komposisi soal subtes, dan lakukan verifikasi sosial media pendaftaran tryout.</p>
        </div>
        <div className="flex gap-2 bg-[#faf8ff] p-1 rounded-2xl border border-[#c2c6d8]/30">
          <button
            onClick={() => { setActiveTab('packages'); setSelectedPackage(null); }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'packages' ? 'bg-[#0050cb] text-white shadow-sm' : 'text-[#424656] hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">quiz</span>
            Paket Tryout
          </button>
          <button
            onClick={() => { setActiveTab('registrations'); setSelectedPackage(null); }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'registrations' ? 'bg-[#0050cb] text-white shadow-sm' : 'text-[#424656] hover:bg-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Verifikasi Pendaftaran
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-24 text-center">
          <span className="material-symbols-outlined animate-spin text-[48px] text-[#0050cb]">progress_activity</span>
          <p className="mt-4 text-[#727687] font-medium">Memuat data...</p>
        </div>
      )}

      {!loading && (
        <div>
          {/* TAB: PACKAGES */}
          {activeTab === 'packages' && (
            <div className="space-y-6">
              {!selectedPackage || selectedPackage.id === 'latihan-umum' ? (
                packages.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-[#c2c6d8]/30 py-20 text-center">
                    <span className="material-symbols-outlined text-[56px] text-[#c2c6d8] mb-4">quiz</span>
                    <h3 className="text-[18px] font-bold text-[#191b24] mb-1">Belum ada paket tryout</h3>
                    <p className="text-[#727687] text-[14px] mb-6">Mulai buat paket tryout SKD CPNS baru Anda sekarang.</p>
                    <button
                      onClick={() => handleOpenPackageModal()}
                      className="bg-[#0050cb] text-white px-6 py-3 rounded-xl font-bold text-[14px] hover:bg-[#003fa4] transition-all shadow-md"
                    >
                      Buat Paket Pertama
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[18px] font-bold text-[#191b24]">Daftar Paket Tryout CPNS ({packages.length})</h3>
                      <button
                        onClick={() => handleOpenPackageModal()}
                        className="bg-[#0050cb] hover:bg-[#003fa4] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Buat Paket Baru
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {packages.map((pkg) => {
                        const reqPlanObj = PLAN_OPTIONS.find(o => o.value === pkg.required_plan);
                        return (
                          <div
                            key={pkg.id}
                            onClick={() => handleSelectPackage(pkg)}
                            className="bg-white rounded-3xl border border-[#c2c6d8]/30 hover:border-[#0050cb] hover:shadow-[0_12px_40px_-16px_rgba(0,80,203,0.12)] transition-all p-6 cursor-pointer flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                                  pkg.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${pkg.is_active ? 'bg-green-600 animate-pulse' : 'bg-slate-400'}`} />
                                  {pkg.is_active ? 'Aktif' : 'Draft'}
                                </span>
                                <span className="text-[12px] font-bold text-[#727687]">
                                  {pkg.is_public ? 'Publik' : 'Privat'}
                                </span>
                              </div>
                              <h3 className="text-[18px] font-bold text-[#191b24] mb-2 group-hover:text-[#0050cb] transition-all line-clamp-1">{pkg.title}</h3>
                              <p className="text-[#727687] text-[13px] line-clamp-2 mb-4 leading-relaxed">{pkg.description || 'Tidak ada deskripsi.'}</p>
                              <div className="space-y-2 border-t border-[#c2c6d8]/20 pt-4">
                                <div className="flex items-center gap-2 text-[13px] text-[#424656]">
                                  <span className="material-symbols-outlined text-[18px] text-[#727687]">calendar_month</span>
                                  <span>Rilis: {pkg.scheduled_at ? new Date(pkg.scheduled_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Langsung'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[13px] text-[#424656]">
                                  <span className="material-symbols-outlined text-[18px] text-[#727687]">key</span>
                                  <span>Plan: <strong>{reqPlanObj ? reqPlanObj.label : pkg.required_plan}</strong></span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-6 border-t border-[#c2c6d8]/20 pt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPackageModal(pkg);
                                }}
                                className="flex-1 bg-[#f2f3ff] hover:bg-[#e6e7f4] text-[#0050cb] font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                Edit Paket
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePackage(pkg.id);
                                }}
                                className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-500 hover:text-white text-red-600 transition-all flex items-center justify-center"
                                title="Hapus Paket"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              ) : (
                /* Selected Package Subtests Overview */
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl border border-[#c2c6d8]/30 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => setSelectedPackage(null)}
                        className="w-10 h-10 rounded-full bg-[#f2f3ff] hover:bg-[#e6e7f4] text-[#424656] flex items-center justify-center transition-all"
                      >
                        <span className="material-symbols-outlined">arrow_back</span>
                      </button>
                      <div>
                        <h2 className="text-[20px] font-bold text-[#191b24]">{selectedPackage.title}</h2>
                        <p className="text-[13px] text-[#727687] mt-1">{selectedPackage.description || 'Tidak ada deskripsi.'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPackageModal(selectedPackage)}
                        className="px-4 py-2.5 rounded-xl border border-[#c2c6d8]/40 hover:bg-slate-50 font-bold text-xs text-[#424656] flex items-center gap-1.5 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Edit Paket
                      </button>
                    </div>
                  </div>

                  {/* Subtests List */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {selectedPackage.subject_config.map((sub, idx) => {
                      const stats = packageStats[selectedPackage.id]?.find(s => s.name.toUpperCase() === sub.name.toUpperCase()) || { available: 0 };
                      const isComplete = stats.available >= sub.questionCount;
                      return (
                        <div key={idx} className="bg-white rounded-3xl border border-[#c2c6d8]/30 p-6 flex flex-col justify-between h-[220px]">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-[18px] font-bold text-[#191b24]">{sub.name}</h4>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isComplete ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                {stats.available} / {sub.questionCount} Soal
                              </span>
                            </div>
                            <p className="text-[12px] text-[#727687] leading-relaxed mb-4">
                              Subtes {sub.name} dengan target pengerjaan <strong>{sub.durationMin} menit</strong>.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const matchSub = subjects.find(s => s.name.toUpperCase() === sub.name.toUpperCase());
                              if (matchSub) {
                                setManagingSubtest({ name: sub.name, subjectId: matchSub.id, is_tkp: matchSub.is_tkp });
                                setShowImportTab(false);
                                setImportPreview([]);
                                setImportFile(null);
                                setShowQuestionsModal(true);
                              } else {
                                toast.error('Mata pelajaran subtes tidak ditemukan.');
                              }
                            }}
                            className="w-full bg-[#0050cb] hover:bg-[#003fa4] text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit_note</span>
                            Kelola Soal
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: REGISTRATIONS */}
          {activeTab === 'registrations' && (
            <div className="space-y-6">
              <div className="bg-white p-2 rounded-2xl border border-[#c2c6d8]/30 flex flex-wrap gap-2 shadow-sm">
                {[
                  { label: 'Semua Status', value: '' },
                  { label: 'Menunggu Verifikasi', value: 'pending' },
                  { label: 'Disetujui', value: 'approved' },
                  { label: 'Ditolak', value: 'rejected' },
                ].map((rTab) => (
                  <button
                    key={rTab.value}
                    onClick={() => {
                      setRegFilter(rTab.value);
                      setTimeout(() => fetchRegistrations(), 10);
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-[13px] transition-all ${
                      regFilter === rTab.value ? 'bg-[#0050cb] text-white shadow-sm' : 'text-[#424656] hover:bg-[#e6e7f4]/50'
                    }`}
                  >
                    {rTab.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-3xl border border-[#c2c6d8]/30 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#f2f3ff]/50 border-b border-[#c2c6d8]/20">
                      <th className="px-6 py-4 text-[11px] font-bold text-[#424656] uppercase tracking-widest">Pengguna</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#424656] uppercase tracking-widest">Email & Platform</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#424656] uppercase tracking-widest">Paket Tryout</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#424656] uppercase tracking-widest">Username Sosmed</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#424656] uppercase tracking-widest">Link Komentar</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#424656] uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#424656] uppercase tracking-widest text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c2c6d8]/10">
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center text-[#727687]">
                          <span className="material-symbols-outlined text-[48px] text-[#c2c6d8] mb-3">verified</span>
                          <p className="text-[14px]">Tidak ada pendaftaran verifikasi ditemukan</p>
                        </td>
                      </tr>
                    ) : (
                      registrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-[#f2f3ff]/20 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#0050cb]/10 text-[#0050cb] font-bold flex items-center justify-center text-sm">
                                {reg.user_name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-[14px] text-[#191b24]">{reg.user_name}</p>
                                <p className="text-[11px] text-[#727687]">{reg.user_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[13px] text-[#191b24] font-medium block mb-1">{reg.contact_email}</span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-[#424656] uppercase tracking-wider">
                              {reg.platform || 'instagram'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <p className="font-bold text-[13px] text-[#191b24]">{reg.package_title || '—'}</p>
                            <span className="text-[10px] text-slate-500 font-bold">CPNS</span>
                          </td>
                          <td className="px-6 py-5 font-semibold text-[13px] text-[#0050cb]">
                            @{reg.social_username?.replace(/^@/, '') || '—'}
                          </td>
                          <td className="px-6 py-5 max-w-[150px] truncate" title={reg.proof_link}>
                            {reg.proof_link ? (
                              <a href={reg.proof_link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0050cb] font-bold hover:underline flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">link</span>
                                Buka Link Proof
                              </a>
                            ) : '—'}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              reg.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                              reg.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {reg.status === 'approved' ? 'Disetujui' : reg.status === 'rejected' ? 'Ditolak' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 justify-center">
                              {reg.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleRegAction(reg.id, 'approve')}
                                    disabled={submittingRegAction}
                                    className="bg-green-50 hover:bg-green-600 hover:text-white text-green-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-green-200 transition-all"
                                  >
                                    Setujui
                                  </button>
                                  <button
                                    onClick={() => handleOpenRejectModal(reg.id)}
                                    disabled={submittingRegAction}
                                    className="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 font-bold text-xs px-3 py-1.5 rounded-xl border border-red-200 transition-all"
                                  >
                                    Tolak
                                  </button>
                                </>
                              ) : reg.status === 'rejected' ? (
                                <div className="text-[11px] text-[#727687] max-w-[120px] truncate" title={reg.rejection_reason}>
                                  <strong>Ditolak:</strong> {reg.rejection_reason || 'Tanpa alasan'}
                                </div>
                              ) : (
                                <span className="text-xs text-[#727687] font-semibold">Telah Terverifikasi</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL: CREATE/EDIT PACKAGE --- */}
      {showPackageModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowPackageModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-[#191b24]">{editingPackage ? 'Edit Paket Tryout SKD' : 'Buat Paket Tryout SKD Baru'}</h3>
              <button onClick={() => setShowPackageModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSavePackage} className="space-y-5">
              <div>
                <label className={labelCls}>Judul Paket *</label>
                <input
                  type="text"
                  className={inputCls}
                  value={packageForm.title}
                  onChange={(e) => setFormValue('title', e.target.value)}
                  placeholder="Contoh: Tryout Akbar SKD CPNS 2026 #1"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Deskripsi</label>
                <textarea
                  className={inputCls + " h-20 resize-none"}
                  value={packageForm.description}
                  onChange={(e) => setFormValue('description', e.target.value)}
                  placeholder="Penjelasan ringkas paket tryout ini..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Waktu Rilis (Jadwal Mulai)</label>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={packageForm.scheduled_at}
                    onChange={(e) => setFormValue('scheduled_at', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelCls}>Batas Pembelian Plan Paket</label>
                  <select
                    className={inputCls}
                    value={packageForm.required_plan}
                    onChange={(e) => setFormValue('required_plan', e.target.value)}
                  >
                    {PLAN_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Akses Publik</label>
                  <select
                    className={inputCls}
                    value={packageForm.is_public ? 'public' : 'private'}
                    onChange={(e) => setFormValue('is_public', e.target.value === 'public')}
                  >
                    <option value="public">Publik (Terlihat di Dashboard)</option>
                    <option value="private">Privat (Hanya lewat Link)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status Aktif</label>
                  <select
                    className={inputCls}
                    value={packageForm.is_active ? 'active' : 'draft'}
                    onChange={(e) => setFormValue('is_active', e.target.value === 'active')}
                  >
                    <option value="active">Aktif (Dapat Dikerjakan)</option>
                    <option value="draft">Draft (Disembunyikan)</option>
                  </select>
                </div>
              </div>

              {/* Config subtests */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-[14px] font-bold text-[#191b24] mb-4">Pengaturan Konfigurasi Subtes</h4>
                <div className="space-y-4">
                  {packageForm.subject_config.map((sub, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4 items-center bg-[#faf8ff] p-4 rounded-xl border border-slate-100">
                      <div className="font-bold text-[14px] text-[#0050cb]">{sub.name}</div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#727687] mb-1">Target Soal</label>
                        <input
                          type="number"
                          className="w-full bg-white border border-[#c2c6d8]/40 rounded-lg px-3 py-1.5 text-xs font-semibold"
                          value={sub.questionCount}
                          onChange={(e) => updateSubtestFormConfig(i, 'questionCount', parseInt(e.target.value) || 0)}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-[#727687] mb-1">Durasi (Menit)</label>
                        <input
                          type="number"
                          className="w-full bg-white border border-[#c2c6d8]/40 rounded-lg px-3 py-1.5 text-xs font-semibold"
                          value={sub.durationMin}
                          onChange={(e) => updateSubtestFormConfig(i, 'durationMin', parseInt(e.target.value) || 0)}
                          min="1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 border-t border-[#c2c6d8]/20 pt-6">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="flex-1 py-3.5 rounded-xl border border-[#c2c6d8]/40 hover:bg-slate-50 font-bold text-[14px] text-[#424656] transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-[#0050cb] hover:bg-[#003fa4] text-white font-bold text-[14px] transition-all shadow-md shadow-[#0050cb]/10"
                >
                  Simpan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: REJECT REASON --- */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[250] bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-bold text-red-600">Tolak Pendaftaran Tryout</h3>
              <button onClick={() => setShowRejectModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveReject} className="space-y-5">
              <div>
                <label className={labelCls}>Alasan Penolakan *</label>
                <textarea
                  className={inputCls + " h-24 resize-none"}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Link proof tidak valid / salah paket / screenshot tidak lengkap..."
                  required
                />
              </div>
              <div className="flex gap-4 border-t border-[#c2c6d8]/20 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#c2c6d8]/40 hover:bg-slate-50 font-bold text-xs text-[#424656] transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRegAction}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all disabled:opacity-50"
                >
                  Tolak Pendaftaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: QUESTIONS LIST --- */}
      {showQuestionsModal && managingSubtest && (
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
                    Subtes {managingSubtest.name}
                  </span>
                </div>
                <h2 className="text-[22px] sm:text-[24px] font-extrabold text-[#191b24] tracking-tight">
                  Kelola Soal: {managingSubtest.name}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowQuestionsModal(false);
                  setManagingSubtest(null);
                  setQuestions([]);
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
                  Daftar Soal ({questions.length})
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
              {!showImportTab && (
                <button
                  onClick={() => handleOpenQuestionForm()}
                  className="bg-[#0050cb] hover:bg-[#003fa4] text-white px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm my-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Tambah Manual
                </button>
              )}
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
                  ) : questions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white m-6 rounded-3xl border border-dashed border-[#c2c6d8]/40">
                      <span className="material-symbols-outlined text-[56px] text-[#c2c6d8] mb-4">description</span>
                      <h3 className="text-[18px] font-bold text-[#191b24] mb-1">Belum Ada Soal</h3>
                      <p className="text-[14px] text-[#727687] max-w-sm mb-6">Subtes ini belum memiliki soal. Silakan tambah soal dengan mengimport file Excel templates atau tambah manual.</p>
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
                        <div className="p-4 bg-white border-b border-[#e2e8f0] shrink-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[13px] font-bold text-[#191b24]">Navigasi Soal</h4>
                            <span className="text-[11px] font-bold text-[#727687] bg-slate-100 px-2 py-0.5 rounded-full">
                              {questions.length} Soal
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-0">
                          <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, idx) => {
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
                                  }}
                                  className={`relative w-full aspect-square rounded-xl border text-[14px] font-bold transition-all flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-[#0050cb] border-[#0050cb] text-white shadow-lg shadow-[#0050cb]/20 scale-105'
                                      : 'bg-white border-slate-200 text-[#191b24] hover:border-[#0050cb]/40 hover:bg-[#f2f3ff]'
                                  }`}
                                  title={`Soal ${idx + 1}`}
                                >
                                  {idx + 1}
                                  <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isSelected ? 'bg-white/60' : diffColor}`} />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="px-4 py-2.5 border-t border-[#e2e8f0] bg-white shrink-0">
                          <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-[#727687]">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />Mudah</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Sedang</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />Sulit</span>
                          </div>
                        </div>

                        <div className="p-4 border-t border-[#e2e8f0] bg-white shrink-0">
                          <button
                            onClick={handleDeleteBulkQuestions}
                            className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-100 text-[12px] font-bold"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                            Hapus Semua Soal
                          </button>
                        </div>
                      </div>

                      {/* Right Panel: Selected Question Preview */}
                      <div className="flex-1 bg-white flex flex-col min-h-0 overflow-hidden">
                        {(() => {
                          const selectedQuestion = questions.find(q => q.id === activeQuestionId);
                          if (!selectedQuestion) {
                            return (
                              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
                                <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">description</span>
                                <h4 className="text-[16px] font-bold text-[#191b24]">Belum Ada Soal Terpilih</h4>
                                <p className="text-[13px] text-[#727687]">Pilih salah satu soal di daftar sebelah kiri untuk melihat detail.</p>
                              </div>
                            );
                          }
                          const idx = questions.findIndex(q => q.id === selectedQuestion.id);

                          return (
                            <div className="flex-grow flex flex-col overflow-hidden">
                              <div className="px-6 py-4 border-b border-[#e2e8f0] bg-[#faf8ff]/50 flex flex-wrap justify-between items-center gap-4 shrink-0">
                                <h3 className="text-[16px] font-extrabold text-[#191b24]">Soal {idx + 1}</h3>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleOpenQuestionForm(selectedQuestion)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-all flex items-center justify-center"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl transition-all flex items-center justify-center"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                </div>
                              </div>

                              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {selectedQuestion.stimulus && (
                                  <div className="bg-[#faf8ff] border border-[#c2c6d8]/30 rounded-2xl p-4">
                                    <p className="text-xs font-bold text-[#727687] mb-2 uppercase tracking-wider">Stimulus / Wacana</p>
                                    <MathText text={selectedQuestion.stimulus} />
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-bold text-[#727687] mb-2 uppercase tracking-wider">Pertanyaan</p>
                                  <MathText className="text-[15px] font-semibold text-[#191b24]" text={selectedQuestion.content} />
                                </div>

                                {selectedQuestion.image_url && (
                                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2 max-w-md">
                                    <ZoomableImage src={selectedQuestion.image_url} alt="Graphic" />
                                  </div>
                                )}

                                <div className="space-y-2">
                                  {selectedQuestion.choices?.map(c => {
                                    const isTkp = managingSubtest.is_tkp;
                                    return (
                                      <div
                                        key={c.id}
                                        className={`p-3 rounded-xl border flex items-start gap-3 ${
                                          !isTkp && c.is_correct ? "border-green-300 bg-green-50" : "border-[#c2c6d8]/30 bg-white"
                                        }`}
                                      >
                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                                          !isTkp && c.is_correct ? "bg-green-500 text-white" : "bg-[#c2c6d8]/30 text-[#424656]"
                                        }`}>
                                          {c.label}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <MathText text={c.content} />
                                          {isTkp && (
                                            <span className="inline-block mt-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                              Poin: {c.tkp_point || 0}
                                            </span>
                                          )}
                                          {c.explanation && (
                                            <p className="text-xs text-slate-500 mt-1 italic"><strong className="text-slate-600">Pembahasan:</strong> {c.explanation}</p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Tab 2: Import Excel */}
              {showImportTab && (
                <div className="p-8 space-y-6 max-w-xl mx-auto w-full">
                  <form onSubmit={handleImportExcel} className="space-y-6 bg-white p-8 rounded-3xl border border-[#c2c6d8]/20">
                    <h3 className="text-lg font-bold text-slate-900">Import Soal via Excel</h3>
                    <div>
                      <label className={labelCls}>Pilih Topik Latihan (Opsional)</label>
                      <select
                        className={inputCls}
                        value={importTopicId}
                        onChange={(e) => setImportTopicId(e.target.value)}
                      >
                        <option value="">Gunakan Topik di Baris Excel / Kosong</option>
                        {(topics[managingSubtest?.subjectId] || []).map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>File Excel (.xlsx)</label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".xlsx, .xls"
                        onChange={handleImportFileChange}
                        className="hidden"
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                          importFile ? 'border-green-400 bg-green-50' : 'border-[#c2c6d8] hover:border-[#0050cb] bg-[#faf8ff]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[32px] text-[#727687] mb-2">upload_file</span>
                        <p className="text-xs font-bold text-[#191b24]">{importFile ? importFile.name : 'Pilih file Excel Anda'}</p>
                        {importPreview.length > 0 && <p className="text-[11px] text-green-700 font-bold mt-1">{importPreview.length} Soal Terdeteksi</p>}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={importLoading || !importFile}
                      className="w-full bg-[#0050cb] text-white py-3 rounded-xl font-bold hover:bg-[#003fa4] transition-all disabled:opacity-50"
                    >
                      {importLoading ? 'Sedang Import...' : 'Mulai Import'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: QUESTION CREATE/EDIT FORM (MANUAL) --- */}
      {showQuestionFormModal && (
        <div className="fixed inset-0 z-[250] bg-black/60 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowQuestionFormModal(false)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h3 className="text-[20px] font-bold text-[#191b24]">
                {editingQuestion ? 'Edit Soal SKD' : 'Tambah Soal Manual'}
              </h3>
              <button onClick={() => setShowQuestionFormModal(false)} className="w-9 h-9 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656] hover:bg-[#e6e7f4]">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveQuestion} className="space-y-5 flex-grow">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Topik *</label>
                  <select
                    className={inputCls}
                    value={questionForm.topic_id}
                    onChange={(e) => setQuestionForm({ ...questionForm, topic_id: e.target.value })}
                    required
                  >
                    <option value="">Pilih Topik...</option>
                    {(topics[managingSubtest?.subjectId] || []).map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Kesulitan *</label>
                  <select
                    className={inputCls}
                    value={questionForm.difficulty}
                    onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                    required
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Stimulus / Wacana (Opsional)</label>
                <textarea
                  className={inputCls + " h-20 resize-none"}
                  value={questionForm.stimulus}
                  onChange={(e) => setQuestionForm({ ...questionForm, stimulus: e.target.value })}
                  placeholder="Isi stimulus wacana di sini..."
                />
              </div>

              <div>
                <label className={labelCls}>Pertanyaan / Teks Soal *</label>
                <textarea
                  className={inputCls + " h-24 resize-none"}
                  value={questionForm.content}
                  onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                  placeholder="Ketik soal/pertanyaan di sini..."
                  required
                />
              </div>

              <div>
                <label className={labelCls}>Gambar Soal (Opsional)</label>
                <div className="flex gap-4 items-center">
                  <div className="flex-grow">
                    <ImageUpload onUploadSuccess={handleImageUploaded} currentImageUrl={questionForm.image_url} />
                  </div>
                  {questionForm.image_url && (
                    <div className="w-1/3">
                      <label className={labelCls}>Posisi Gambar</label>
                      <select
                        className={inputCls}
                        value={questionForm.image_position}
                        onChange={(e) => setQuestionForm({ ...questionForm, image_position: e.target.value })}
                      >
                        <option value="after">Setelah Soal</option>
                        <option value="before">Sebelum Soal</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className={labelCls}>Pilihan Jawaban (5 Opsi PG)</label>
                {questionForm.choices.map((c, i) => {
                  const isTkp = managingSubtest.is_tkp;
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
                          const updated = [...questionForm.choices];
                          updated[i].content = e.target.value;
                          setQuestionForm({ ...questionForm, choices: updated });
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
                                const updated = [...questionForm.choices];
                                updated[i].tkp_point = val;
                                setQuestionForm({ ...questionForm, choices: updated });
                              }}
                            />
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="is_correct"
                              checked={c.is_correct}
                              onChange={() => {
                                const updated = questionForm.choices.map((ch, idx) => ({
                                  ...ch,
                                  is_correct: idx === i
                                }));
                                setQuestionForm({ ...questionForm, choices: updated });
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
                              const updated = [...questionForm.choices];
                              updated[i].explanation = e.target.value;
                              setQuestionForm({ ...questionForm, choices: updated });
                            }}
                            placeholder="Pembahasan..."
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 border-t border-[#c2c6d8]/20 pt-6 mt-6 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowQuestionFormModal(false)}
                  className="flex-1 py-3.5 rounded-xl border border-[#c2c6d8]/40 hover:bg-slate-50 font-bold text-xs text-[#424656] transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-[#0050cb] hover:bg-[#003fa4] text-white font-bold text-xs transition-all shadow-md shadow-[#0050cb]/10"
                >
                  {editingQuestion ? 'Perbarui Soal' : 'Simpan Soal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
