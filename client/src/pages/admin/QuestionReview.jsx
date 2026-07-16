import React, { useState, useEffect, useCallback } from 'react';
import { adminService, soalService, subjectService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import MathText from '../../components/MathText';

const WORKFLOW_CONFIG = {
  draft: {
    label: 'Revisi',
    icon: 'edit_note',
    bg: 'bg-white border-slate-200/80 hover:border-slate-350 hover:shadow-sm',
    activeBg: 'bg-slate-50 border-[#424656]/50 shadow-sm ring-2 ring-slate-200',
    text: 'text-slate-800',
    iconText: 'text-[#424656]',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    badgeBg: 'bg-slate-50 text-slate-750 border-slate-200/60',
    cardBorder: 'border-l-slate-400',
    accentBg: 'bg-slate-100'
  },
  under_review: {
    label: 'Under Review',
    icon: 'rate_review',
    bg: 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-sm',
    activeBg: 'bg-[#f4f7ff] border-blue-400 shadow-sm ring-2 ring-[#0050cb]/10',
    text: 'text-[#0050cb]',
    iconText: 'text-[#0050cb]',
    border: 'border-blue-200',
    dot: 'bg-[#0050cb]',
    badgeBg: 'bg-[#f0f4ff] text-[#0050cb] border-blue-200',
    cardBorder: 'border-l-blue-400',
    accentBg: 'bg-[#f0f4ff]'
  },
  approved: {
    label: 'Approved',
    icon: 'verified',
    bg: 'bg-white border-slate-200/80 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/5',
    activeBg: 'bg-[#eef5ff] border-[#0050cb] shadow-md shadow-[#0050cb]/5 ring-2 ring-[#0050cb]/15',
    text: 'text-[#003da6]',
    iconText: 'text-[#0050cb]',
    border: 'border-[#0050cb]/30',
    dot: 'bg-[#0050cb]',
    badgeBg: 'bg-[#0050cb]/5 text-[#003da6] border-[#0050cb]/25',
    cardBorder: 'border-l-[#0050cb]',
    accentBg: 'bg-[#0050cb]/10'
  },
};

const DIFFICULTY_CONFIG = {
  easy: { label: 'Mudah', cls: 'bg-slate-50 text-slate-600 border-slate-200/60' },
  medium: { label: 'Sedang', cls: 'bg-slate-50 text-slate-600 border-slate-200/60' },
  hard: { label: 'Sulit', cls: 'bg-slate-50 text-slate-600 border-slate-200/60' },
  hots: { label: 'HOTS', cls: 'bg-slate-50 text-slate-600 border-slate-200/60' },
};

const TYPE_LABELS = {
  multiple_choice: 'Pilihan Ganda',
  short_answer: 'Jawaban Singkat',
  complex_mc_tf: 'Benar/Salah',
};

function WorkflowBadge({ status }) {
  const cfg = WORKFLOW_CONFIG[status] || WORKFLOW_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${cfg.badgeBg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function QuestionReview() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isQA = user?.role === 'quality_assurance';
  const isWriter = user?.role === 'question_writer';

  const [questions, setQuestions] = useState([]);
  const [summary, setSummary] = useState({ draft: 0, under_review: 0, approved: 0 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Confirm action modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    question: null,
    toStatus: ''
  });
  const [updating, setUpdating] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      const res = await adminService.getQuestionReview({ limit: 1 });
      if (res.data?.success && res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: search || undefined,
        workflow_status: statusFilter || undefined,
        subject_id: subjectFilter || undefined
      };
      const res = await adminService.getQuestionReview(params);
      if (res.data?.success) {
        setQuestions(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error('Gagal memuat daftar soal review');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, subjectFilter]);

  const fetchSubjectsList = useCallback(async () => {
    try {
      const res = await subjectService.list();
      setSubjects(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchSubjectsList();
  }, [fetchSubjectsList]);

  useEffect(() => {
    fetchQuestions();
    fetchSummary();
  }, [fetchQuestions, fetchSummary]);

  // Debounced search reset page
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleStatusChange = async (questionId, newStatus) => {
    setUpdating(true);
    try {
      const res = await soalService.updateWorkflow(questionId, {
        status: newStatus,
        note: noteInput.trim() || undefined
      });
      if (res.data?.success) {
        toast.success(`Status soal diubah ke ${WORKFLOW_CONFIG[newStatus].label}`);
        setConfirmModal({ isOpen: false, question: null, toStatus: '' });
        fetchQuestions();
        fetchSummary();
        if (selectedQuestion?.id === questionId) {
          setSelectedQuestion(prev => prev ? { ...prev, workflow_status: newStatus } : null);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengubah status');
    } finally {
      setUpdating(false);
    }
  };

  const openConfirm = (question, toStatus) => {
    setConfirmModal({
      isOpen: true,
      question,
      toStatus
    });
    setNoteInput('');
  };

  const canTransitionTo = (question, target) => {
    const current = question.workflow_status;
    if (isAdmin) return true; 
    
    if (isWriter) {
      if (current === 'draft' && target === 'under_review') return true;
    }
    
    if (isQA) {
      if (current === 'draft' && target === 'under_review') return true;
      if (current === 'under_review' && target === 'draft') return true;
      if (current === 'under_review' && target === 'approved') return true;
    }
    
    return false;
  };

  const ActionButtons = ({ question, compact = false }) => {
    const from = question.workflow_status;
    const b = compact
      ? 'px-3.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all border shadow-sm whitespace-nowrap'
      : 'px-5 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all border shadow-sm whitespace-nowrap';
    return (
      <div className="flex flex-wrap gap-2">
        {from === 'draft' && canTransitionTo(question, 'under_review') && (
          <button onClick={e => { e.stopPropagation(); openConfirm(question, 'under_review'); }}
            className={`${b} bg-[#0050cb] text-white border-[#003da6] hover:bg-[#003da6]`}>
            <span className="material-symbols-outlined text-[15px] font-bold">rate_review</span>
            {!compact && 'Ajukan Review'}
          </button>
        )}
        {from === 'under_review' && (isAdmin || isQA) && (
          <button onClick={e => { e.stopPropagation(); openConfirm(question, 'approved'); }}
            className={`${b} bg-[#0050cb] text-white border-[#003da6] hover:bg-[#003da6]`}>
            <span className="material-symbols-outlined text-[15px] font-bold">verified</span>
            {!compact && 'Approve'}
          </button>
        )}
        {from === 'under_review' && canTransitionTo(question, 'draft') && (
          <button onClick={e => { e.stopPropagation(); openConfirm(question, 'draft'); }}
            className={`${b} bg-white text-[#424656] border-slate-200 hover:bg-slate-50`}>
            <span className="material-symbols-outlined text-[15px] font-bold">undo</span>
            {!compact && 'Tolak / Revisi'}
          </button>
        )}
        {from === 'approved' && isAdmin && (
          <button onClick={e => { e.stopPropagation(); openConfirm(question, 'draft'); }}
            className={`${b} bg-white text-[#424656] border-slate-200 hover:bg-slate-50`}>
            <span className="material-symbols-outlined text-[15px] font-bold">edit</span>
            {!compact && 'Tarik ke Revisi'}
          </button>
        )}
        {(isAdmin || isWriter) && (
          <button onClick={e => {
            e.stopPropagation();
            const url = question.tryout_package_id
              ? `/admin/tryout?package_id=${question.tryout_package_id}&question_id=${question.id}`
              : `/admin/latihan?subject_id=${question.subject_id}&question_id=${question.id}`;
            window.open(url, '_blank');
          }}
            className={`${b} bg-white text-[#0050cb] border-[#0050cb]/25 hover:bg-[#f0f4ff]/50`}>
            <span className="material-symbols-outlined text-[15px] font-bold">open_in_new</span>
            {!compact && 'Edit Soal'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] p-4 lg:p-8 relative overflow-hidden">
      {/* Subtle Background radial accent matching logo brand */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-[25px] font-extrabold text-[#191b24] tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 rounded bg-[#0050cb] inline-block" />
              Workflow Review Soal
            </h1>
            <p className="text-[13px] text-slate-500 font-medium mt-1">Sistem kontrol kualitas dan alur penerbitan bank soal UTBK</p>
          </div>
          <div className="flex items-center gap-3 bg-white border border-[#e2e8f0] rounded-2xl px-4 py-2.5 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0050cb] animate-pulse" />
            <div>
              <p className="text-[9px] font-extrabold text-[#727687] uppercase tracking-wider leading-none">Hak Akses Anda</p>
              <p className="text-[12px] font-extrabold text-[#0050cb] mt-1.5">
                {isAdmin ? 'Administrator' : isQA ? 'Quality Assurance (QA)' : 'Question Writer'}
              </p>
            </div>
          </div>
        </div>

        {/* Workflow Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(WORKFLOW_CONFIG).map(([status, cfg]) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => { setStatusFilter(prev => prev === status ? '' : status); setPage(1); }}
                className={`p-5 rounded-3xl border text-left transition-all duration-300 flex items-center justify-between ${
                  isActive ? cfg.activeBg : `${cfg.bg} shadow-sm border-slate-200/80`
                }`}
              >
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{cfg.label}</p>
                  <p className={`text-[34px] font-extrabold tracking-tight mt-1 leading-none ${isActive ? cfg.text : 'text-[#191b24]'}`}>
                    {summary[status] || 0}
                  </p>
                  <span className="text-[10px] text-slate-400 font-bold mt-2.5 inline-block">
                    {isActive ? '✓ Menampilkan status ini' : 'Klik untuk memfilter'}
                  </span>
                </div>

                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-transform duration-300 ${
                  isActive ? 'bg-white border-white' : `${cfg.accentBg} ${cfg.border}`
                }`}>
                  <span className={`material-symbols-outlined text-[24px] ${cfg.iconText}`}>{cfg.icon}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Control Center (Filter Bar) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span>
            <input
              type="text"
              placeholder="Cari konten teks soal..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-[13px] text-[#191b24] placeholder:text-slate-400 focus:outline-none focus:border-[#0050cb] font-semibold transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-[13px] font-bold text-[#424656] focus:outline-none focus:border-[#0050cb] bg-white cursor-pointer transition-all"
            >
              <option value="">Semua Status</option>
              <option value="draft">Revisi</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
            </select>
            <select
              value={subjectFilter}
              onChange={e => { setSubjectFilter(e.target.value); setPage(1); }}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-[13px] font-bold text-[#424656] focus:outline-none focus:border-[#0050cb] bg-white cursor-pointer transition-all max-w-[200px]"
            >
              <option value="">Semua Subtes</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name || s.title}</option>)}
            </select>
            {(statusFilter || subjectFilter || search) && (
              <button
                onClick={() => { setStatusFilter(''); setSubjectFilter(''); setSearch(''); setPage(1); }}
                className="px-4 py-2.5 rounded-2xl text-[12px] font-bold text-[#727687] hover:bg-slate-50 border border-slate-200 flex items-center gap-1.5 transition-all bg-white"
              >
                <span className="material-symbols-outlined text-[16px]">filter_list_off</span>Reset
              </button>
            )}
          </div>
          <div className="ml-auto text-[12px] font-extrabold text-[#727687] bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            {total} soal ditemukan
          </div>
        </div>

        {/* List Layout */}
        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-16 flex items-center justify-center shadow-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-[3px] border-[#0050cb]/20 border-t-[#0050cb] rounded-full animate-spin" />
                  <p className="text-[12px] text-slate-400 font-extrabold tracking-wide uppercase">Memuat bank soal...</p>
                </div>
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-20 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <span className="material-symbols-outlined text-[28px]">find_in_page</span>
                </div>
                <h3 className="text-[16px] font-extrabold text-[#191b24]">Tidak Ada Soal</h3>
                <p className="text-[13px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                  {statusFilter ? `Tidak ada soal dengan status ${WORKFLOW_CONFIG[statusFilter]?.label}.` : 'Belum ada soal terdaftar untuk kriteria pencarian ini.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map(q => {
                  const dCfg = DIFFICULTY_CONFIG[q.difficulty] || DIFFICULTY_CONFIG.medium;
                  const wCfg = WORKFLOW_CONFIG[q.workflow_status] || WORKFLOW_CONFIG.draft;
                  const isSelected = selectedQuestion?.id === q.id;
                  return (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuestion(prev => prev?.id === q.id ? null : q)}
                      className={`bg-white rounded-3xl border-2 cursor-pointer transition-all duration-200 border-l-4 ${wCfg.cardBorder} ${
                        isSelected ? 'border-[#0050cb] shadow-sm shadow-[#0050cb]/5 bg-[#fbfdff]' : 'border-slate-200/80 hover:border-slate-350'
                      }`}
                    >
                      <div className="p-5 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                            <WorkflowBadge status={q.workflow_status} />
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${dCfg.cls}`}>{dCfg.label}</span>
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-650 uppercase tracking-wider">{TYPE_LABELS[q.question_type] || 'Pilihan Ganda'}</span>
                            {q.subject_name && <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#f2f3ff] border border-blue-200/60 text-[#0050cb] uppercase tracking-wider">{q.subject_name}</span>}
                            {q.package_title && <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">Tryout: {q.package_title}</span>}
                            {q.topic_title && <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">Topik: {q.topic_title}</span>}
                          </div>
                          
                          {q.workflow_status === 'draft' && q.review_note && (
                            <div className="mb-2.5 p-3 rounded-2xl bg-rose-50/70 border border-rose-100/80 text-[11.5px] text-rose-800 flex items-start gap-2">
                              <span className="material-symbols-outlined text-[15px] text-rose-600 shrink-0 select-none mt-0.5 font-bold">feedback</span>
                              <div className="font-medium leading-relaxed">
                                <span className="font-extrabold uppercase text-[9px] tracking-wider text-rose-600 block mb-0.5">Catatan Reviewer:</span>
                                {q.review_note}
                              </div>
                            </div>
                          )}

                          <p className="text-[13.5px] text-[#191b24] font-bold leading-relaxed line-clamp-2 pr-4">
                            {q.content?.replace(/<[^>]*>/g, '') || '(Tidak ada konten teks)'}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-[#727687] font-semibold">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-slate-400">check_circle</span> {q.choices_count} opsi jawaban</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-slate-400">calendar_today</span> {new Date(q.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {(isAdmin || isWriter || isQA) && q.creator_name && (
                              <>
                                <span>·</span>
                                <span className="font-extrabold text-slate-650 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">person</span>
                                  Writer: {q.creator_name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 pt-1" onClick={e => e.stopPropagation()}>
                          <ActionButtons question={q} compact />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="text-[13px] font-extrabold text-slate-600 bg-white px-4 py-2 border border-slate-200 rounded-2xl shadow-sm">Halaman {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Soal Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto pt-16">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl my-8 overflow-hidden flex flex-col animate-[fadeInScale_0.2s_ease-out] border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-4 bg-slate-50/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#f2f3ff] flex items-center justify-center text-[#0050cb] border border-[#dae1ff]">
                  <span className="material-symbols-outlined text-[22px]">description</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-[#191b24]">Review Detail Soal</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <WorkflowBadge status={selectedQuestion.workflow_status} />
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${(DIFFICULTY_CONFIG[selectedQuestion.difficulty] || DIFFICULTY_CONFIG.medium).cls}`}>
                      {(DIFFICULTY_CONFIG[selectedQuestion.difficulty] || DIFFICULTY_CONFIG.medium).label}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                      {TYPE_LABELS[selectedQuestion.question_type] || 'Pilihan Ganda'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="w-9 h-9 rounded-xl hover:bg-slate-150 flex items-center justify-center text-[#727687] hover:text-[#191b24] transition-all border border-transparent hover:border-slate-200"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#191b24] leading-relaxed bg-[#faf8ff]">
              
              {/* Metadata Banner */}
              <div className="bg-white rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border border-slate-200/60 shadow-sm">
                <div className="border-r border-slate-100 last:border-0 pr-4">
                  <p className="text-[10px] font-bold text-[#727687] uppercase tracking-wider">Mata Pelajaran / Subtes</p>
                  <p className="text-[14px] font-extrabold text-[#0050cb] mt-1">{selectedQuestion.subject_name || 'Latihan Soal UTBK'}</p>
                </div>
                <div className="border-r border-slate-100 last:border-0 px-2">
                  <p className="text-[10px] font-bold text-[#727687] uppercase tracking-wider">Sumber / Konten</p>
                  <p className="text-[14px] font-bold text-slate-800 mt-1">
                    {selectedQuestion.package_title ? 'Paket Tryout' : selectedQuestion.topic_title ? 'Topik Latihan' : 'Latihan Umum'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedQuestion.package_title || selectedQuestion.topic_title || '-'}</p>
                </div>
                <div className="border-r border-slate-100 last:border-0 px-2">
                  <p className="text-[10px] font-bold text-[#727687] uppercase tracking-wider">Tanggal Dibuat</p>
                  <p className="text-[14px] font-bold text-slate-800 mt-1">
                    {new Date(selectedQuestion.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                {(isAdmin || isWriter || isQA) && selectedQuestion.creator_name && (
                  <div className="last:border-0 px-2">
                    <p className="text-[10px] font-bold text-[#727687] uppercase tracking-wider">Pembuat Soal</p>
                    <p className="text-[14px] font-extrabold text-orange-600 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] translate-y-[-0.5px]">person</span>
                      {selectedQuestion.creator_name}
                    </p>
                  </div>
                )}
              </div>

              {/* Reviewer Note Banner */}
              {selectedQuestion.workflow_status === 'draft' && selectedQuestion.review_note && (
                <div className="bg-rose-50/50 border border-rose-200/60 rounded-3xl p-5 space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 text-rose-800 font-extrabold text-[12.5px] uppercase tracking-wider pb-2 border-b border-rose-100/60">
                    <span className="material-symbols-outlined text-[18px] text-rose-600 font-bold">feedback</span>
                    Catatan Evaluasi / Masukan Reviewer
                  </div>
                  <p className="text-[13.5px] text-rose-900 font-semibold leading-relaxed pt-1">
                    {selectedQuestion.review_note}
                  </p>
                </div>
              )}

              {/* Soal Sheet Container */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <span className="w-1.5 h-4 rounded-full bg-[#0050cb]" />
                  <h4 className="text-[13px] font-bold text-slate-750 uppercase tracking-wider">Lembar Soal</h4>
                </div>

                {/* 1. TOP IMAGE */}
                {selectedQuestion.image_url && ['top', 'before', 'atas'].includes(selectedQuestion.image_position) && (
                  <div className="flex justify-center my-4 bg-slate-50 rounded-2xl p-3 border border-slate-200/60 max-w-xl mx-auto shadow-sm">
                    <img src={selectedQuestion.image_url} alt="Soal Gambar Atas" className="max-w-full h-auto max-h-64 object-contain rounded-xl" />
                  </div>
                )}

                {/* 2. STIMULUS / WACANA */}
                {selectedQuestion.stimulus && (
                  <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 text-[14px] text-slate-700 leading-relaxed font-medium">
                    <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Stimulus / Wacana Pendukung:</div>
                    <MathText text={selectedQuestion.stimulus} />
                  </div>
                )}

                {/* 3. MIDDLE IMAGE */}
                {selectedQuestion.image_url && ['middle', 'ditengah', 'tengah'].includes(selectedQuestion.image_position) && (
                  <div className="flex justify-center my-4 bg-slate-50 rounded-2xl p-3 border border-slate-200/60 max-w-xl mx-auto shadow-sm">
                    <img src={selectedQuestion.image_url} alt="Soal Gambar Tengah" className="max-w-full h-auto max-h-64 object-contain rounded-xl" />
                  </div>
                )}

                {/* 4. PERTANYAAN / SOAL CONTENT */}
                <div className="text-[15px] font-semibold text-[#191b24] leading-relaxed pt-2">
                  <MathText text={selectedQuestion.content} />
                </div>

                {/* 5. BOTTOM IMAGE */}
                {selectedQuestion.image_url && !['top', 'before', 'atas', 'middle', 'ditengah', 'tengah'].includes(selectedQuestion.image_position) && (
                  <div className="flex justify-center my-4 bg-slate-50 rounded-2xl p-3 border border-slate-200/60 max-w-xl mx-auto shadow-sm">
                    <img src={selectedQuestion.image_url} alt="Soal Gambar Bawah" className="max-w-full h-auto max-h-64 object-contain rounded-xl" />
                  </div>
                )}
              </div>

              {/* Lembar Jawaban Container */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <span className="w-1.5 h-4 rounded-full bg-[#0050cb]" />
                  <h4 className="text-[13px] font-bold text-slate-750 uppercase tracking-wider">Kunci & Pilihan Jawaban</h4>
                </div>

                {/* Pilihan Ganda / Benar Salah */}
                {selectedQuestion.question_type !== 'short_answer' && selectedQuestion.choices && selectedQuestion.choices.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedQuestion.choices.map((choice) => {
                      const isCorrect = choice.is_correct;
                      return (
                        <div
                          key={choice.id}
                          className={`p-4 rounded-2xl border-2 flex items-start gap-4 transition-all duration-200 ${
                            selectedQuestion.question_type === 'complex_mc_tf'
                              ? (isCorrect ? 'border-green-300 bg-green-50/20 shadow-sm' : 'border-red-200 bg-red-50/20')
                              : (isCorrect ? 'border-green-300 bg-green-50/30 shadow-sm shadow-green-100/50' : 'border-slate-100 bg-slate-50/30 hover:border-slate-200')
                          }`}
                        >
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold flex-shrink-0 border shadow-sm ${
                              selectedQuestion.question_type === 'complex_mc_tf'
                                ? (isCorrect ? 'bg-green-500 text-white border-green-600' : 'bg-red-500 text-white border-red-600')
                                : (isCorrect ? 'bg-green-500 text-white border-green-600' : 'bg-white text-[#424656] border-slate-200')
                            }`}
                          >
                            {choice.label}
                          </span>
                          <div className="flex-1 min-w-0 pt-1">
                            <div className={`text-[13.5px] leading-relaxed ${isCorrect ? 'text-green-900 font-bold' : 'text-slate-800 font-medium'}`}>
                              <MathText text={choice.content || ''} />
                            </div>
                            {selectedQuestion.question_type === 'complex_mc_tf' && (
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded mt-2.5 inline-block tracking-wider ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {isCorrect ? 'BENAR' : 'SALAH'}
                              </span>
                            )}
                            {choice.explanation && (
                              <div className="mt-3 text-[12px] text-slate-650 bg-slate-50/80 rounded-xl p-3 border border-slate-200/50">
                                <span className="font-extrabold block text-[9.5px] uppercase tracking-wide text-slate-400 mb-1">Penjelasan Opsi {choice.label}:</span>
                                <MathText text={choice.explanation} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Jawaban Singkat */}
                {selectedQuestion.question_type === 'short_answer' && selectedQuestion.choices && selectedQuestion.choices.length > 0 && (
                  <div className="bg-green-50/60 border border-green-200 rounded-2xl p-4 flex items-center gap-4 max-w-xl">
                    <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white border border-green-600 shadow-sm flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px]">vpn_key</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-green-700 uppercase tracking-wide">Kunci Jawaban Singkat</p>
                      <p className="text-[16px] font-extrabold text-green-900 mt-0.5">{selectedQuestion.choices[0]?.content}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* General Explanation (Pembahasan Umum) */}
              {(() => {
                const generalExplanation = selectedQuestion.choices?.find(c => c.is_correct)?.explanation;
                if (generalExplanation && selectedQuestion.question_type !== 'complex_mc_tf') {
                  return (
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-3xl p-6 space-y-3 shadow-sm">
                      <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-[14px] uppercase tracking-wider pb-2 border-b border-emerald-100/60">
                        <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                        Pembahasan Umum Soal
                      </div>
                      <div className="text-[13.5px] text-slate-800 font-medium leading-relaxed pt-1">
                        <MathText text={generalExplanation} />
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200/60 bg-slate-50/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[12px] font-bold text-[#727687]">
                <span className="material-symbols-outlined text-[16px] text-amber-500">lock</span>
                Ganti Status Soal:
              </div>
              <ActionButtons question={selectedQuestion} compact={false} />
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[1010] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-[fadeInScale_0.2s_ease-out]">
            <div className={`px-6 py-5 border-b border-slate-200/60 ${WORKFLOW_CONFIG[confirmModal.toStatus]?.bg}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${WORKFLOW_CONFIG[confirmModal.toStatus]?.border} ${WORKFLOW_CONFIG[confirmModal.toStatus]?.bg} shadow-sm`}>
                  <span className={`material-symbols-outlined text-[22px] ${WORKFLOW_CONFIG[confirmModal.toStatus]?.text}`}>{WORKFLOW_CONFIG[confirmModal.toStatus]?.icon}</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-slate-800 leading-snug">
                    {confirmModal.toStatus === 'under_review' ? 'Ajukan Soal ke QA' : confirmModal.toStatus === 'approved' ? 'Terbitkan / Approve Soal' : 'Kembalikan ke Revisi'}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Status: {WORKFLOW_CONFIG[confirmModal.question.workflow_status]?.label} → {WORKFLOW_CONFIG[confirmModal.toStatus]?.label}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 shadow-inner">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Tinjauan Soal:</p>
                <p className="text-[13px] text-slate-700 leading-relaxed line-clamp-3 font-medium">{confirmModal.question.content?.replace(/<[^>]*>/g, '') || '(Tidak ada konten)'}</p>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Catatan Revisi / Review <span className="font-normal text-slate-400 lowercase">(opsional)</span></label>
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  placeholder={confirmModal.toStatus === 'draft' ? 'Contoh: Perlu koreksi pilihan rumus matematika pada penjelasan opsi C...' : confirmModal.toStatus === 'approved' ? 'Contoh: Kunci jawaban dan pembahasan sudah benar...' : 'Contoh: Rumus matematika sudah diperbaiki, mohon direview...'}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-[13px] text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium resize-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, question: null, toStatus: '' })}
                disabled={updating}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-[13px] hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleStatusChange(confirmModal.question.id, confirmModal.toStatus)}
                disabled={updating}
                className={`flex-1 py-2.5 rounded-2xl font-bold text-[13px] text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md ${
                  confirmModal.toStatus === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-700' : confirmModal.toStatus === 'under_review' ? 'bg-amber-500 hover:bg-amber-600 border border-amber-600' : 'bg-slate-700 hover:bg-slate-850 border border-slate-850'
                }`}
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[16px] font-bold">{WORKFLOW_CONFIG[confirmModal.toStatus]?.icon}</span>
                )}
                {confirmModal.toStatus === 'approved' ? 'Ya, Approve' : confirmModal.toStatus === 'under_review' ? 'Ya, Kirim' : 'Ya, Kembalikan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
