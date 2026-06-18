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

  const activeList = activeTab === 'utbk' ? duplicates.utbk : duplicates.um;

  return (
    <div className="space-y-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div>
        <h2 className="text-[32px] font-bold text-[#191b24] mb-2 leading-tight">Scanner Soal Duplikat</h2>
        <p className="text-[#424656] text-[15px]">Temukan, bandingkan, dan bersihkan soal-soal duplikat di dalam database UTBK maupun Ujian Mandiri.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-[#f2f3ff] rounded-2xl w-fit border border-[#c2c6d8]/20">
        <button
          onClick={() => { setActiveTab('utbk'); setExpandedHash(null); }}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'utbk'
              ? 'bg-[#0050cb] text-white shadow-md shadow-blue-500/10'
              : 'text-[#424656] hover:bg-[#e6e7f4]/60'
          }`}
        >
          UTBK (Tryout & Latihan)
        </button>
        <button
          onClick={() => { setActiveTab('um'); setExpandedHash(null); }}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'um'
              ? 'bg-[#0050cb] text-white shadow-md shadow-blue-500/10'
              : 'text-[#424656] hover:bg-[#e6e7f4]/60'
          }`}
        >
          Ujian Mandiri (Tryout & Latihan)
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-[#c2c6d8]/30 shadow-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-semibold text-[#424656]">Memindai database soal duplikat...</p>
        </div>
      ) : activeList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#c2c6d8]/30 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <h3 className="text-xl font-bold text-[#191b24] mb-1">Database Bersih!</h3>
          <p className="text-sm text-[#424656]">Tidak ada soal duplikat terdeteksi pada kategori ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#e8eeff] border border-[#0050cb]/20 rounded-2xl p-5 flex items-center gap-3.5 text-[#0050cb]">
            <span className="material-symbols-outlined text-[24px]">info</span>
            <div>
              <p className="text-sm font-bold">Ditemukan {activeList.length} kelompok soal duplikat</p>
              <p className="text-xs mt-0.5 opacity-90">Bandingkan isinya dan gunakan tombol "Sisakan 1 Soal" untuk menghapus duplikat lainnya secara otomatis.</p>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-[#c2c6d8]/30 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f2f3ff]/50 border-b border-[#c2c6d8]/20">
                    <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest w-16">Pindai</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">Konten Soal</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest w-36 text-center">Jumlah Duplikat</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest w-64">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c2c6d8]/10">
                  {activeList.map((item, idx) => {
                    const isExpanded = expandedHash === item.content_hash;
                    return (
                      <React.Fragment key={item.content_hash}>
                        <tr className="hover:bg-[#f2f3ff]/20 transition-colors">
                          <td className="px-6 py-5">
                            <button
                              onClick={() => setExpandedHash(isExpanded ? null : item.content_hash)}
                              className={`w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            >
                              <span className="material-symbols-outlined">expand_more</span>
                            </button>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-[14px] font-medium text-[#191b24] line-clamp-2 leading-relaxed">
                              {item.questions_list[0]?.content || '(Tanpa Teks)'}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400 mt-1">Hash: {item.content_hash.substring(0, 16)}...</p>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-50 text-red-600 font-extrabold text-[13px] border border-red-100 shadow-sm">
                              {item.duplicate_count}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setExpandedHash(isExpanded ? null : item.content_hash)}
                                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                              >
                                Detail
                              </button>
                              <button
                                onClick={() => handleKeepOnlyOne(item, activeTab === 'um')}
                                disabled={deletingId === 'bulk'}
                                className="px-3.5 py-1.5 rounded-lg bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition flex items-center gap-1 shadow-sm disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[14px]">auto_delete</span>
                                Sisakan 1 Soal
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-[#faf8ff]/80">
                            <td colSpan="4" className="px-8 py-5 border-b border-[#c2c6d8]/10">
                              <div className="space-y-4">
                                <h5 className="text-xs font-extrabold text-[#0050cb] uppercase tracking-wider">Lokasi & Rincian Kelompok Duplikat</h5>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                  {item.questions_list.map((q, qIdx) => (
                                    <div key={q.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                                      <div>
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">ID: {q.id.substring(0, 8)}...</span>
                                          {qIdx === 0 && (
                                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md">Master (Disisakan)</span>
                                          )}
                                        </div>
                                        <p className="text-xs text-[#424656] leading-relaxed mb-3 line-clamp-3">"{q.content}"</p>
                                        <div className="space-y-1 text-[11px] text-slate-500 font-medium">
                                          {activeTab === 'utbk' ? (
                                            <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-slate-400">subject</span> Subtes: {q.subject_name || '-'}</p>
                                          ) : (
                                            <>
                                              {q.package_title && <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-slate-400">assignment</span> Tryout: {q.package_title}</p>}
                                              {q.latihan_title && <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-slate-400">menu_book</span> Latihan: {q.latihan_title}</p>}
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      {qIdx > 0 && (
                                        <button
                                          onClick={() => handleDelete(q.id, activeTab === 'um', item.content_hash)}
                                          disabled={deletingId === q.id}
                                          className="mt-3.5 text-xs text-red-600 hover:text-red-800 font-bold flex items-center gap-0.5 self-end"
                                        >
                                          <span className="material-symbols-outlined text-[14px]">delete</span>
                                          {deletingId === q.id ? 'Menghapus...' : 'Hapus Soal Ini'}
                                        </button>
                                      )}
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
