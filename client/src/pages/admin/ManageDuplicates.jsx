import React, { useState, useEffect } from 'react';
import { adminService, soalService, ujianMandiriService } from '../../services/api';
import toast from 'react-hot-toast';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export default function ManageDuplicates() {
  const [duplicates, setDuplicates] = useState({ utbk: [], um: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('utbk'); // 'utbk' | 'um'
  const [expandedHash, setExpandedHash] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      // We'll call the custom duplicates API directly using fetch or axios config
      // Let's call /api/admin/questions/duplicates
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/questions/duplicates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const res = await response.json();
      if (res.success) {
        setDuplicates(res.data);
      } else {
        toast.error(res.error || 'Gagal memuat data duplikat');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleDelete = async (id, isUM, hash) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    setDeletingId(id);
    try {
      if (isUM) {
        // UM questions endpoint: DELETE /api/ujian-mandiri/questions/:id
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/ujian-mandiri/questions/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const res = await response.json();
        if (res.success) {
          toast.success('Soal berhasil dihapus');
        } else {
          toast.error(res.error || 'Gagal menghapus soal');
        }
      } else {
        // UTBK questions endpoint: DELETE /api/soal/:id
        await soalService.delete(id);
        toast.success('Soal berhasil dihapus');
      }
      
      // Update local state to remove the deleted question
      setDuplicates(prev => {
        const key = isUM ? 'um' : 'utbk';
        const updatedList = prev[key].map(item => {
          if (item.content_hash === hash) {
            return {
              ...item,
              duplicate_count: parseInt(item.duplicate_count) - 1,
              questions_list: item.questions_list.filter(q => q.id !== id)
            };
          }
          return item;
        }).filter(item => item.duplicate_count > 1);

        return {
          ...prev,
          [key]: updatedList
        };
      });

    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus soal');
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeepOnlyOne = async (item, isUM) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${item.questions_list.length - 1} soal duplikat dan menyisakan hanya 1 soal?`)) return;
    
    // Keep the first one, delete the rest
    const [keep, ...toDelete] = item.questions_list;
    setDeletingId('bulk');

    let successCount = 0;
    let failCount = 0;

    for (const q of toDelete) {
      try {
        if (isUM) {
          const token = localStorage.getItem('token');
          await fetch(`${API_BASE}/api/ujian-mandiri/questions/${q.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } else {
          await soalService.delete(q.id);
        }
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} soal duplikat dibersihkan.`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} soal gagal dibersihkan.`);
    }

    fetchDuplicates();
    setDeletingId(null);
  };

  const handleCopyLink = (qId) => {
    const link = `${window.location.origin}/admin/question-review?q=${qId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link langsung ke soal berhasil disalin!');
  };

  const handleCopyId = (qId) => {
    navigator.clipboard.writeText(qId);
    toast.success('ID Soal berhasil disalin!');
  };

  const getEditorUrl = (q, isUM) => {
    if (isUM) {
      if (q.tryout_package_id) return `/admin/ujian-mandiri?package_id=${q.tryout_package_id}&question_id=${q.id}`;
      if (q.latihan_id) return `/admin/ujian-mandiri?latihan_id=${q.latihan_id}&question_id=${q.id}`;
      return `/admin/ujian-mandiri`;
    }
    if (q.tryout_package_id) return `/admin/tryout?package_id=${q.tryout_package_id}&question_id=${q.id}`;
    if (q.subject_id) return `/admin/latihan?subject_id=${q.subject_id}&question_id=${q.id}`;
    return `/admin/question-review?q=${q.id}`;
  };

  const activeList = activeTab === 'utbk' ? duplicates.utbk : duplicates.um;

  return (
    <div className="space-y-6 sm:space-y-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div>
        <h2 className="text-[24px] sm:text-[32px] font-bold text-[#191b24] mb-2 leading-tight">Scanner Soal Duplikat</h2>
        <p className="text-[#424656] text-[13px] sm:text-[15px]">Temukan, bandingkan, dan bersihkan soal-soal duplikat di dalam database UTBK maupun Ujian Mandiri.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-[#f2f3ff] rounded-2xl w-full sm:w-fit overflow-x-auto border border-[#c2c6d8]/20">
        <button
          onClick={() => { setActiveTab('utbk'); setExpandedHash(null); }}
          className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'utbk'
              ? 'bg-[#0050cb] text-white shadow-md shadow-blue-500/10'
              : 'text-[#424656] hover:bg-[#e6e7f4]/60'
          }`}
        >
          UTBK (Tryout & Latihan)
        </button>
        <button
          onClick={() => { setActiveTab('um'); setExpandedHash(null); }}
          className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'um'
              ? 'bg-[#0050cb] text-white shadow-md shadow-blue-500/10'
              : 'text-[#424656] hover:bg-[#e6e7f4]/60'
          }`}
        >
          Ujian Mandiri (Tryout & Latihan)
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#c2c6d8]/30 shadow-sm flex flex-col items-center justify-center">
          <div className="w-10 sm:w-12 h-10 sm:h-12 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xs sm:text-sm font-semibold text-[#424656]">Memindai database soal duplikat...</p>
        </div>
      ) : activeList.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#c2c6d8]/30 shadow-sm text-center">
          <div className="w-14 sm:w-16 h-14 sm:h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[28px] sm:text-[32px]">check_circle</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#191b24] mb-1">Database Bersih!</h3>
          <p className="text-xs sm:text-sm text-[#424656]">Tidak ada soal duplikat terdeteksi pada kategori ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#e8eeff] border border-[#0050cb]/20 rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-3.5 text-[#0050cb]">
            <span className="material-symbols-outlined text-[20px] sm:text-[24px] shrink-0">info</span>
            <div>
              <p className="text-xs sm:text-sm font-bold">Ditemukan {activeList.length} kelompok soal duplikat</p>
              <p className="text-[11px] sm:text-xs mt-0.5 opacity-90">Bandingkan isinya dan gunakan tombol "Sisakan 1 Soal" untuk menghapus duplikat lainnya secara otomatis.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-[32px] border border-[#c2c6d8]/30 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f2f3ff]/50 border-b border-[#c2c6d8]/20">
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-[12px] font-bold text-[#424656] uppercase tracking-widest w-12 sm:w-16">Pindai</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-[12px] font-bold text-[#424656] uppercase tracking-widest min-w-[200px]">Konten Soal</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-[12px] font-bold text-[#424656] uppercase tracking-widest w-28 sm:w-36 text-center">Jumlah Duplikat</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-[12px] font-bold text-[#424656] uppercase tracking-widest w-44 sm:w-64">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c2c6d8]/10">
                  {activeList.map((item, idx) => {
                    const isExpanded = expandedHash === item.content_hash;
                    return (
                      <React.Fragment key={item.content_hash}>
                        <tr className="hover:bg-[#f2f3ff]/20 transition-colors">
                          <td className="px-3 sm:px-6 py-3.5 sm:py-5">
                            <button
                              onClick={() => setExpandedHash(isExpanded ? null : item.content_hash)}
                              className={`w-7 sm:w-8 h-7 sm:h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            >
                              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">expand_more</span>
                            </button>
                          </td>
                          <td className="px-3 sm:px-6 py-3.5 sm:py-5">
                            <p className="text-[13px] sm:text-[14px] font-medium text-[#191b24] line-clamp-2 leading-relaxed">
                              {item.questions_list[0]?.content || '(Tanpa Teks)'}
                            </p>
                            <p className="text-[10px] sm:text-[11px] font-mono text-slate-400 mt-1">Hash: {item.content_hash.substring(0, 16)}...</p>
                          </td>
                          <td className="px-3 sm:px-6 py-3.5 sm:py-5 text-center">
                            <span className="inline-flex items-center justify-center w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-red-50 text-red-600 font-extrabold text-[12px] sm:text-[13px] border border-red-100 shadow-sm">
                              {item.duplicate_count}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3.5 sm:py-5">
                            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2">
                              <button
                                onClick={() => setExpandedHash(isExpanded ? null : item.content_hash)}
                                className="px-2.5 sm:px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                              >
                                Detail
                              </button>
                              <button
                                onClick={() => handleKeepOnlyOne(item, activeTab === 'um')}
                                disabled={deletingId === 'bulk'}
                                className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition flex items-center gap-1 shadow-sm disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[14px]">auto_delete</span>
                                <span className="hidden xs:inline">Sisakan 1 Soal</span>
                                <span className="xs:hidden">Sisakan 1</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-[#faf8ff]/80">
                            <td colSpan="4" className="px-4 sm:px-8 py-4 sm:py-5 border-b border-[#c2c6d8]/10">
                              <div className="space-y-4">
                                <h5 className="text-xs font-extrabold text-[#0050cb] uppercase tracking-wider">Lokasi & Rincian Kelompok Duplikat</h5>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                  {item.questions_list.map((q, qIdx) => (
                                    <div key={q.id} className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all">
                                      <div>
                                        {/* Card Header */}
                                        <div className="flex justify-between items-center gap-2 mb-2.5 pb-2 border-b border-slate-100">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[11px] font-mono font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                              ID: {q.id.substring(0, 8)}...
                                            </span>
                                            <button
                                              onClick={() => handleCopyId(q.id)}
                                              title="Salin ID Soal"
                                              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                                            >
                                              <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                            </button>
                                          </div>
                                          {qIdx === 0 ? (
                                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                                              Master (Disisakan)
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                                              Duplikat #{qIdx}
                                            </span>
                                          )}
                                        </div>

                                        {/* Question Snippet */}
                                        <p className="text-xs text-[#191b24] leading-relaxed mb-3 font-normal line-clamp-3 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                          "{q.content}"
                                        </p>

                                        {/* Location Info */}
                                        <div className="space-y-1.5 text-[11px] text-slate-600 font-medium mb-3">
                                          {activeTab === 'utbk' ? (
                                            <>
                                              {q.subject_name && (
                                                <p className="flex items-center gap-1.5 text-slate-700 font-semibold">
                                                  <span className="material-symbols-outlined text-[14px] text-blue-600">subject</span>
                                                  <span>Subtes:</span> <span className="text-slate-900 font-bold">{q.subject_name}</span>
                                                </p>
                                              )}
                                              {q.package_title && (
                                                <p className="flex items-center gap-1.5 text-slate-600">
                                                  <span className="material-symbols-outlined text-[14px] text-amber-600">assignment</span>
                                                  <span>Tryout:</span> <span className="text-slate-800 font-semibold">{q.package_title}</span>
                                                </p>
                                              )}
                                              {q.topic_title && (
                                                <p className="flex items-center gap-1.5 text-slate-600">
                                                  <span className="material-symbols-outlined text-[14px] text-purple-600">topic</span>
                                                  <span>Topik:</span> <span className="text-slate-800 font-semibold">{q.topic_title}</span>
                                                </p>
                                              )}
                                            </>
                                          ) : (
                                            <>
                                              {q.package_title && (
                                                <p className="flex items-center gap-1.5 text-slate-700 font-semibold">
                                                  <span className="material-symbols-outlined text-[14px] text-amber-600">assignment</span>
                                                  <span>Tryout:</span> <span className="text-slate-900 font-bold">{q.package_title}</span>
                                                </p>
                                              )}
                                              {q.latihan_title && (
                                                <p className="flex items-center gap-1.5 text-slate-600">
                                                  <span className="material-symbols-outlined text-[14px] text-emerald-600">menu_book</span>
                                                  <span>Latihan:</span> <span className="text-slate-800 font-semibold">{q.latihan_title}</span>
                                                </p>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Card Action Footer */}
                                      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <a
                                            href={`/admin/question-review?q=${q.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 px-2.5 py-1.5 bg-[#f0f4ff] hover:bg-[#e0ebff] text-[#0050cb] text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 border border-blue-100 shadow-2xs"
                                          >
                                            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                                            Buka Review
                                          </a>
                                          <a
                                            href={getEditorUrl(q, activeTab === 'um')}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 border border-slate-200/80"
                                          >
                                            <span className="material-symbols-outlined text-[15px]">edit_note</span>
                                            Buka Editor
                                          </a>
                                          <button
                                            onClick={() => handleCopyLink(q.id)}
                                            title="Salin Link Langsung Ke Soal"
                                            className="w-8 h-8 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition border border-slate-200/80 flex items-center justify-center shrink-0"
                                          >
                                            <span className="material-symbols-outlined text-[15px]">link</span>
                                          </button>
                                        </div>

                                        {qIdx === 0 ? (
                                          <div className="w-full px-3 py-1.5 bg-emerald-50/70 border border-emerald-200/60 text-emerald-700 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5">
                                            <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
                                            Master (Tetap Disimpan)
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => handleDelete(q.id, activeTab === 'um', item.content_hash)}
                                            disabled={deletingId === q.id}
                                            className="w-full px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                                          >
                                            <span className="material-symbols-outlined text-[15px]">delete</span>
                                            {deletingId === q.id ? 'Menghapus...' : 'Hapus Soal Duplikat Ini'}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
