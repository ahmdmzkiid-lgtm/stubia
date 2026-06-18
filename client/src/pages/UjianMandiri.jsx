import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { ujianMandiriService } from '../services/api';
import { getStatusConfig } from '../data/ujianMandiriData';
import StudentNavbar from '../components/layout/StudentNavbar';

/* ─── Main Page ─── */
export default function UjianMandiri() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [banner, setBanner] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [umRes, bannerRes] = await Promise.all([
        ujianMandiriService.list(),
        ujianMandiriService.getBanner(),
      ]);
      setItems(umRes.data.data || []);
      setBanner(bannerRes.data.data || {});
    } catch (err) {
      console.error('Failed to fetch ujian mandiri:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const STATUS_ORDER = { open: 0, 'coming-soon': 1, closed: 2 };

  const filtered = useMemo(() => {
    let result = items;
    if (statusFilter !== 'all') result = result.filter(i => i.status === statusFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(i =>
        (i.universitas || '').toLowerCase().includes(s) ||
        (i.nama_ujian || '').toLowerCase().includes(s) ||
        (i.lokasi || '').toLowerCase().includes(s)
      );
    }
    result = [...result].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
    return result;
  }, [items, search, statusFilter]);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="bg-[#faf8ff] text-[#191b24] min-h-screen font-sans">
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={handleLogout} />

      <main className="px-4 sm:px-6 lg:px-10 max-w-[1280px] mx-auto pb-16">
        {/* ── Hero Section ── */}
        <section className="py-12 lg:py-20 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7">
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-[#0050cb]/10 text-[#0050cb] px-3 py-1 rounded text-[12px] font-bold uppercase tracking-widest">
                {banner.badge}
              </span>
              <div className="h-px flex-1 bg-[#c2c6d8]/40" />
            </div>
            <h1 className="text-[40px] lg:text-[56px] font-extrabold mb-6 leading-tight tracking-tight text-[#0050cb]">
              {banner.title}
            </h1>
            <p className="text-[16px] lg:text-[18px] text-[#424656] mb-8 leading-relaxed max-w-2xl">
              {banner.description}
            </p>
            <div className="flex flex-wrap gap-3">
              {banner.primaryButtonText && (
                <a
                  href={banner.primaryButtonLink || '#'}
                  target={banner.primaryButtonLink ? '_blank' : undefined}
                  rel="noreferrer"
                  className="bg-[#0050cb] text-white px-8 py-4 rounded-lg font-bold text-[14px] hover:bg-[#003fa4] transition-all active:scale-95 shadow-lg shadow-[#0050cb]/20"
                >
                  {banner.primaryButtonText}
                </a>
              )}
            </div>
          </div>
          <div className="md:col-span-5 relative">
            <div className="aspect-[4/5] rounded-xl overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,51,153,0.12)]">
              <img src={banner.image} alt="Campus" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-2 sm:-left-6 bg-white p-4 sm:p-6 rounded-lg shadow-[0_24px_48px_-12px_rgba(0,51,153,0.12)] flex items-center gap-4 border-l-4 border-[#0050cb]">
              <div className="w-12 h-12 rounded-full bg-[#fdc400] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#6c5200]">verified_user</span>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#424656]">{banner.verifiedLabel}</div>
                <div className="text-[18px] sm:text-[20px] font-bold text-[#191b24] leading-tight">{banner.verifiedText}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Search & Filter ── */}
        <section className="mt-12 mb-10 flex flex-col md:flex-row justify-between md:items-end border-b border-[#c2c6d8]/40 pb-6 gap-4">
          <div>
            <h2 className="text-[28px] lg:text-[32px] font-bold text-[#191b24]">Portal Institusi</h2>
            <p className="text-[14px] text-[#424656] mt-1">Menampilkan jalur mandiri universitas terbaik di Indonesia.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727687]">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari universitas..."
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-[#c2c6d8]/40 focus:border-[#0050cb] focus:ring-1 focus:ring-[#0050cb] outline-none bg-white text-[14px]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-[#c2c6d8]/40 rounded-lg bg-white text-[14px] focus:border-[#0050cb] focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="open">Pendaftaran Dibuka</option>
              <option value="coming-soon">Segera Hadir</option>
              <option value="closed">Pendaftaran Ditutup</option>
            </select>
          </div>
        </section>

        {/* ── University Grid ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {filtered.map(item => {
            const statusCfg = getStatusConfig(item.status);
            const isClosed = item.status === 'closed';
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,51,153,0.12)] group hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="h-40 bg-[#f0edee] overflow-hidden">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.universitas}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="p-6 relative">
                  <div className="absolute -top-8 left-6 w-16 h-16 bg-white rounded-lg shadow-[0_24px_48px_-12px_rgba(0,51,153,0.12)] p-2 flex items-center justify-center">
                    {item.logo ? (
                      <img src={item.logo} alt={`${item.universitas} Logo`} className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-[#0050cb] text-[32px]">school</span>
                    )}
                  </div>
                  <div className="mt-6 flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-[18px] lg:text-[20px] font-bold text-[#191b24] leading-tight">{item.universitas}</h3>
                    <div className="flex items-center text-[#0050cb] border-l-2 border-[#0050cb] pl-2 bg-[#0050cb]/5 px-2 py-1 shrink-0">
                      <span className="text-[12px] font-bold whitespace-nowrap">{item.nama_ujian}</span>
                    </div>
                  </div>
                  <div className={`inline-flex items-center px-2 py-1 border-l-2 text-[12px] font-bold mb-4 ${statusCfg.color}`}>
                    {statusCfg.label}
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-[#424656]">
                      <span className="material-symbols-outlined text-[16px]">{isClosed ? 'event_busy' : 'calendar_today'}</span>
                      <span className="text-[13px]">{item.deadline}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#424656]">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      <span className="text-[13px]">{item.lokasi}</span>
                    </div>
                  </div>
                  {isClosed ? (
                    <button disabled className="w-full py-3 bg-white border border-[#c2c6d8] text-[#727687] font-bold rounded-lg cursor-not-allowed text-[14px]">
                      Pendaftaran Ditutup
                    </button>
                  ) : (
                    <Link
                      to={`/ujian-mandiri/${item.id}`}
                      className="block text-center w-full py-3 bg-white border border-[#0050cb] text-[#0050cb] font-bold rounded-lg hover:bg-[#0050cb] hover:text-white transition-all text-[14px]"
                    >
                      Mulai
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-[#727687]">
              <span className="material-symbols-outlined text-[48px] mb-2">search_off</span>
              <p className="text-[16px]">Tidak ada ujian mandiri yang cocok dengan pencarian</p>
            </div>
          )}
        </section>

        {/* ── CTA ── */}
        <section className="bg-[#0066ff] text-white rounded-2xl p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_24px_48px_-12px_rgba(0,51,153,0.12)]">
          <div className="max-w-xl">
            <h2 className="text-[24px] lg:text-[28px] font-bold mb-3">Siap Hadapi Ujian Mandiri?</h2>
            <p className="text-[14px] lg:text-[15px] text-white/80">
              Tingkatkan peluang kelolosanmu dengan mencoba berbagai simulasi Tryout dan latihan soal interaktif yang dirancang khusus untuk ujian mandiri universitas impianmu.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="bg-white text-[#0050cb] px-6 py-3 rounded-lg font-bold hover:bg-[#f6f3f4] transition-colors text-[14px] whitespace-nowrap"
          >
            Kembali ke Dashboard
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
