import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { activityService } from '../services/api';
import ChatWidget from '../components/ChatWidget';
import Footer from '../components/Footer';
import StudentNavbar from '../components/layout/StudentNavbar';

const Riwayat = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('latihan'); // 'latihan' | 'tryout' | 'um_latihan' | 'um_tryout'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        const res = await activityService.getRiwayat();
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch riwayat:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRiwayat();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const history = data?.history || [];

  // Calculate statistics dynamically for each tab
  const stats = useMemo(() => {
    const utbkLatihan = history.filter(h => h.type === 'latihan');
    const utbkTryout = history.filter(h => h.type === 'tryout');
    const umLatihan = history.filter(h => h.type === 'ujian_mandiri_latihan');
    const umTryout = history.filter(h => h.type === 'ujian_mandiri_tryout');

    const getAverageScore = (items) => {
      const scores = items.map(h => h.score).filter(s => s > 0);
      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    };

    const getAverageAccuracy = (items) => {
      const masteries = items.map(h => h.mastery).filter(m => typeof m === 'number');
      return masteries.length > 0 ? Math.round(masteries.reduce((a, b) => a + b, 0) / masteries.length) : 0;
    };

    const getHighestScore = (items) => {
      const scores = items.map(h => h.score).filter(s => s > 0);
      return scores.length > 0 ? Math.max(...scores) : 0;
    };

    const getLatestPercentile = (items) => {
      const itemWithPercentile = items.find(h => h.percentile > 0);
      return itemWithPercentile ? itemWithPercentile.percentile : 0;
    };

    return {
      latihan: {
        avgScore: getAverageScore(utbkLatihan),
        total: utbkLatihan.length,
        accuracy: getAverageAccuracy(utbkLatihan),
      },
      tryout: {
        avgScore: getAverageScore(utbkTryout),
        total: utbkTryout.length,
        percentile: getLatestPercentile(utbkTryout),
        highestScore: getHighestScore(utbkTryout)
      },
      umLatihan: {
        avgScore: getAverageScore(umLatihan),
        total: umLatihan.length,
        accuracy: getAverageAccuracy(umLatihan),
      },
      umTryout: {
        avgScore: getAverageScore(umTryout),
        total: umTryout.length,
        accuracy: getAverageAccuracy(umTryout),
        highestScore: getHighestScore(umTryout)
      }
    };
  }, [history]);

  // Compute active tab's card configurations
  const currentStats = useMemo(() => {
    if (activeTab === 'latihan') {
      return {
        card1: {
          title: 'Skor Rata-Rata',
          value: stats.latihan.avgScore,
          suffix: '',
          icon: 'insights',
          iconBg: 'bg-[#0052cc]/10',
          iconColor: 'text-[#003d9b]',
        },
        card2: {
          title: 'Total Latihan',
          value: stats.latihan.total,
          suffix: ' Sesi',
          icon: 'edit_note',
          iconBg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-700',
        },
        card3: {
          title: 'Rata-Rata Akurasi',
          value: stats.latihan.accuracy,
          suffix: '%',
          icon: 'task_alt',
          iconBg: 'bg-purple-500/10',
          iconColor: 'text-purple-700',
          subtext: stats.latihan.accuracy > 70 
            ? 'Akurasi luar biasa! Pertahankan konsistensimu.'
            : 'Fokus pada evaluasi pembahasan untuk meningkatkan akurasi.'
        }
      };
    } else if (activeTab === 'tryout') {
      return {
        card1: {
          title: 'Skor Rata-Rata IRT',
          value: stats.tryout.avgScore,
          suffix: '/1000',
          icon: 'insights',
          iconBg: 'bg-[#0052cc]/10',
          iconColor: 'text-[#003d9b]',
        },
        card2: {
          title: 'Total Tryout',
          value: stats.tryout.total,
          suffix: ' Paket',
          icon: 'assignment_turned_in',
          iconBg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-700',
        },
        card3: {
          title: 'Peringkat Persentil',
          value: stats.tryout.percentile > 0 ? stats.tryout.percentile : '-',
          suffix: stats.tryout.percentile > 0 ? '%' : '',
          icon: 'military_tech',
          iconBg: 'bg-amber-500/10',
          iconColor: 'text-amber-700',
          subtext: stats.tryout.percentile > 0 
            ? `Kamu berada di ${100 - stats.tryout.percentile}% teratas peserta nasional!`
            : 'Selesaikan tryout untuk melihat peringkat persentilmu.'
        }
      };
    } else if (activeTab === 'um_latihan') {
      return {
        card1: {
          title: 'Skor Rata-Rata',
          value: stats.umLatihan.avgScore,
          suffix: '',
          icon: 'insights',
          iconBg: 'bg-[#0052cc]/10',
          iconColor: 'text-[#003d9b]',
        },
        card2: {
          title: 'Total Latihan UM',
          value: stats.umLatihan.total,
          suffix: ' Sesi',
          icon: 'edit_note',
          iconBg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-700',
        },
        card3: {
          title: 'Rata-Rata Akurasi',
          value: stats.umLatihan.accuracy,
          suffix: '%',
          icon: 'task_alt',
          iconBg: 'bg-purple-500/10',
          iconColor: 'text-purple-700',
          subtext: stats.umLatihan.accuracy > 70 
            ? 'Konsep materi UM sudah sangat matang!'
            : 'Pelajari tipe soal spesifik ujian mandiri universitas tujuan.'
        }
      };
    } else { // um_tryout
      return {
        card1: {
          title: 'Skor Rata-Rata',
          value: stats.umTryout.avgScore,
          suffix: '',
          icon: 'insights',
          iconBg: 'bg-[#0052cc]/10',
          iconColor: 'text-[#003d9b]',
        },
        card2: {
          title: 'Total Tryout UM',
          value: stats.umTryout.total,
          suffix: ' Paket',
          icon: 'assignment_turned_in',
          iconBg: 'bg-emerald-500/10',
          iconColor: 'text-emerald-700',
        },
        card3: {
          title: 'Skor Tertinggi',
          value: stats.umTryout.highestScore,
          suffix: '',
          icon: 'emoji_events',
          iconBg: 'bg-amber-500/10',
          iconColor: 'text-amber-700',
          subtext: stats.umTryout.highestScore > 0 
            ? 'Skor tertinggi yang luar biasa! Teruskan perjuanganmu.'
            : 'Belum ada data skor tryout mandiri.'
        }
      };
    }
  }, [activeTab, stats]);

  // Filter history based on active tab and search query
  const filteredHistory = useMemo(() => {
    let items = history;
    
    if (activeTab === 'latihan') {
      items = history.filter(h => h.type === 'latihan');
    } else if (activeTab === 'tryout') {
      items = history.filter(h => h.type === 'tryout');
    } else if (activeTab === 'um_latihan') {
      items = history.filter(h => h.type === 'ujian_mandiri_latihan');
    } else if (activeTab === 'um_tryout') {
      items = history.filter(h => h.type === 'ujian_mandiri_tryout');
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(h => h.name.toLowerCase().includes(q));
    }

    return items;
  }, [history, activeTab, search]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bg-[#faf8ff] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-[#424656]">Memuat riwayat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8ff] text-[#191b24] min-h-screen flex flex-col font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        .premium-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(8px);
            border: 1px solid #E2E8F0;
            box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .premium-card:hover {
            transform: translateY(-4px);
            box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.08);
        }
        .stat-card {
            position: relative;
            border-radius: 20px;
            padding: 28px;
            overflow: hidden;
            transition: transform 0.35s cubic-bezier(.4,0,.2,1), box-shadow 0.35s cubic-bezier(.4,0,.2,1);
        }
        .stat-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 20px 50px -12px rgba(0,0,0,0.15);
        }
        .stat-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 20px;
            padding: 1px;
            background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05));
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            pointer-events: none;
        }
        .progress-ring-circle {
            transition: stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1);
            transform: rotate(-90deg);
            transform-origin: 50% 50%;
        }
        @keyframes countUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .stat-value { animation: countUp 0.5s ease-out forwards; }
      `}} />
      
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />
      
      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 mb-24 flex-grow w-full">
        {/* Header Section */}
        <section className="mb-12">
          <h1 className="text-[40px] font-extrabold leading-[52px] tracking-tight text-[#0050cb] mb-2">Riwayat Belajar</h1>
          <p className="text-base font-normal text-[#434654] opacity-80">Pantau progres dan performa akademismu secara mendalam.</p>
        </section>

        {/* Stats Overview — Premium Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16" key={activeTab}>
          {/* ── Card 1: Average Score ── */}
          {(() => {
            const themes = {
              latihan:    { bg: 'linear-gradient(135deg, #0050cb 0%, #00227a 100%)', accent: '#60a5fa', label: 'Skor Rata-Rata', icon: 'trending_up' },
              tryout:     { bg: 'linear-gradient(135deg, #0050cb 0%, #00227a 100%)', accent: '#60a5fa', label: 'Skor Rata-Rata IRT', icon: 'trending_up' },
              um_latihan: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)', accent: '#c084fc', label: 'Skor Rata-Rata', icon: 'trending_up' },
              um_tryout:  { bg: 'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)', accent: '#c084fc', label: 'Skor Rata-Rata', icon: 'trending_up' },
            };
            const t = themes[activeTab];
            const val = currentStats.card1.value;
            const suffix = currentStats.card1.suffix;
            // Progress bar width: for IRT /1000, for latihan arbitrary cap at 1000
            const maxScore = activeTab === 'tryout' ? 1000 : 500;
            const pct = Math.min(100, Math.round((val / maxScore) * 100));
            return (
              <div className="stat-card" style={{ background: t.bg }}>
                {/* Decorative orb */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: `radial-gradient(circle, ${t.accent}18, transparent 70%)` }} />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full" style={{ background: `radial-gradient(circle, ${t.accent}10, transparent 70%)` }} />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: t.accent }}>{t.label}</span>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${t.accent}20` }}>
                      <span className="material-symbols-outlined text-[18px]" style={{ color: t.accent }}>{t.icon}</span>
                    </div>
                  </div>
                  
                  <div className="stat-value flex items-baseline gap-2 mb-4">
                    <span className="text-[44px] font-extrabold leading-none tracking-tight text-white">{val}</span>
                    {suffix && <span className="text-[18px] font-semibold text-white/40">{suffix}</span>}
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full h-[6px] rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${t.accent}, ${t.accent}90)` }} />
                  </div>
                  <p className="text-[11px] font-medium text-white/35 mt-2">
                    {activeTab === 'tryout' ? 'dari skor maksimum 1000' : 'progres skor keseluruhan'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* ── Card 2: Total Count ── */}
          {(() => {
            const themes = {
              latihan:    { border: '#0050cb', accent: '#0050cb', accentBg: '#0050cb10', label: 'Total Latihan', suffix: 'Sesi', icon: 'edit_note', tip: 'latihan soal UTBK dikerjakan' },
              tryout:     { border: '#0050cb', accent: '#0050cb', accentBg: '#0050cb10', label: 'Total Tryout', suffix: 'Paket', icon: 'assignment', tip: 'paket tryout UTBK diselesaikan' },
              um_latihan: { border: '#8b5cf6', accent: '#8b5cf6', accentBg: '#8b5cf610', label: 'Total Latihan UM', suffix: 'Sesi', icon: 'edit_note', tip: 'latihan Ujian Mandiri dikerjakan' },
              um_tryout:  { border: '#8b5cf6', accent: '#8b5cf6', accentBg: '#8b5cf610', label: 'Total Tryout UM', suffix: 'Paket', icon: 'assignment', tip: 'paket tryout Ujian Mandiri diselesaikan' },
            };
            const t = themes[activeTab];
            const val = currentStats.card2.value;
            return (
              <div className="stat-card bg-white" style={{ border: `1px solid ${t.border}25`, boxShadow: `0 4px 24px ${t.border}08` }}>
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-28 h-28" style={{ background: `linear-gradient(135deg, ${t.accent}06, transparent)`, borderRadius: '0 20px 0 100%' }} />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: t.accent }}>{t.label}</span>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.accentBg }}>
                      <span className="material-symbols-outlined text-[18px]" style={{ color: t.accent }}>{t.icon}</span>
                    </div>
                  </div>
                  
                  <div className="stat-value flex items-baseline gap-2 mb-3">
                    <span className="text-[44px] font-extrabold leading-none tracking-tight text-[#111827]">{val}</span>
                    <span className="text-[16px] font-semibold text-[#9ca3af]">{t.suffix}</span>
                  </div>
                  
                  {/* Mini stat pills */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: t.accentBg }}>
                      <span className="material-symbols-outlined text-[14px]" style={{ color: t.accent }}>check_circle</span>
                      <span className="text-[11px] font-semibold" style={{ color: t.accent }}>{val} {t.tip}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Card 3: Metric with circular progress ── */}
          {(() => {
            const c3 = currentStats.card3;
            const numVal = typeof c3.value === 'number' ? c3.value : 0;
            const maxVal = (activeTab === 'tryout' && c3.title === 'Peringkat Persentil') ? 100
                         : (c3.suffix === '%') ? 100
                         : (activeTab === 'um_tryout') ? 1000
                         : 100;
            const pct = maxVal > 0 ? Math.min(100, Math.round((numVal / maxVal) * 100)) : 0;
            const circumference = 2 * Math.PI * 42;
            const strokeDash = circumference - (pct / 100) * circumference;

            const themes = {
              latihan:    { ring: '#0050cb', ringBg: '#0050cb15', cardBg: 'linear-gradient(145deg, #ffffff 0%, #f0f5ff 50%, #e0ebff30 100%)', textColor: '#00227a', subColor: '#0050cb' },
              tryout:     { ring: '#0050cb', ringBg: '#0050cb15', cardBg: 'linear-gradient(145deg, #ffffff 0%, #f0f5ff 50%, #e0ebff30 100%)', textColor: '#00227a', subColor: '#0050cb' },
              um_latihan: { ring: '#8b5cf6', ringBg: '#8b5cf615', cardBg: 'linear-gradient(145deg, #ffffff 0%, #f5f3ff 50%, #ede9fe30 100%)', textColor: '#4c1d95', subColor: '#8b5cf6' },
              um_tryout:  { ring: '#8b5cf6', ringBg: '#8b5cf615', cardBg: 'linear-gradient(145deg, #ffffff 0%, #f5f3ff 50%, #ede9fe30 100%)', textColor: '#4c1d95', subColor: '#8b5cf6' },
            };
            const t = themes[activeTab];

            return (
              <div className="stat-card" style={{ background: t.cardBg, border: `1px solid ${t.ring}18` }}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: t.subColor }}>{c3.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-5">
                    {/* Circular progress ring */}
                    <div className="relative shrink-0">
                      <svg width="96" height="96" viewBox="0 0 96 96">
                        <circle cx="48" cy="48" r="42" fill="none" stroke={t.ringBg} strokeWidth="7" />
                        <circle
                          cx="48" cy="48" r="42" fill="none"
                          stroke={t.ring}
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDash}
                          className="progress-ring-circle"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[22px] font-extrabold" style={{ color: t.textColor }}>
                          {c3.value}{c3.suffix === '%' ? <span className="text-[13px] font-bold" style={{ color: `${t.textColor}90` }}>%</span> : ''}
                        </span>
                      </div>
                    </div>
                    
                    {/* Context text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold leading-snug mb-1.5" style={{ color: t.textColor }}>
                        {c3.subtext || 'Belum ada data untuk ditampilkan.'}
                      </p>
                      {numVal > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]" style={{ color: t.ring }}>
                            {pct >= 50 ? 'thumb_up' : 'local_fire_department'}
                          </span>
                          <span className="text-[11px] font-semibold" style={{ color: t.subColor }}>
                            {pct >= 70 ? 'Performa luar biasa!' : pct >= 40 ? 'Terus tingkatkan!' : 'Yuk, lebih giat lagi!'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Detailed History List */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <h2 className="text-xl font-bold text-[#111c2d]">Riwayat Aktivitas</h2>
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#737685] text-lg">search</span>
              <input 
                className="pl-10 pr-4 py-2 w-full border border-[#c3c6d6] rounded-xl text-sm focus:border-[#003d9b] focus:ring-1 focus:ring-[#003d9b] transition-all bg-white" 
                placeholder="Cari aktivitas..." 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Tab Filter bar - Desktop/Tablet */}
          <div className="hidden sm:flex flex-wrap gap-1.5 p-1 bg-[#f0f1f7] rounded-xl mb-4">
            {[
              { id: 'latihan', label: 'Latihan Soal UTBK' },
              { id: 'tryout', label: 'Tryout UTBK' },
              { id: 'um_latihan', label: 'Latihan Ujian Mandiri' },
              { id: 'um_tryout', label: 'Tryout Ujian Mandiri' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 px-3 rounded-lg text-[12px] font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#0050cb] shadow-sm'
                    : 'text-[#727687] hover:text-[#424656]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Filter bar - Mobile Dropdown */}
          <div className="block sm:hidden relative mb-4" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full px-4 py-3 bg-white border-b-2 border-[#0050cb] text-[#0050cb] text-sm font-bold tracking-tight focus:outline-none"
            >
              <span>{
                {
                  latihan: 'Latihan Soal UTBK',
                  tryout: 'Tryout UTBK',
                  um_latihan: 'Latihan Ujian Mandiri',
                  um_tryout: 'Tryout Ujian Mandiri'
                }[activeTab]
              }</span>
              <span className="material-symbols-outlined transition-transform duration-200">
                {isDropdownOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 py-2">
                {[
                  { id: 'latihan', label: 'Latihan Soal UTBK' },
                  { id: 'tryout', label: 'Tryout UTBK' },
                  { id: 'um_latihan', label: 'Latihan Ujian Mandiri' },
                  { id: 'um_tryout', label: 'Tryout Ujian Mandiri' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3.5 text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#f0f5ff] text-[#0050cb] font-bold'
                        : 'text-[#4b5563] hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {filteredHistory.length > 0 ? (
            filteredHistory.map((h, i) => {
              const isTryout = h.type === 'tryout';
              const isUMTryout = h.type === 'ujian_mandiri_tryout';
              const isUMLatihan = h.type === 'ujian_mandiri_latihan';
              const isUTBKLatihan = h.type === 'latihan';
              
              let iconName = 'school';
              let indicatorColor = 'bg-[#003d9b]';
              
              if (isUTBKLatihan) {
                iconName = 'menu_book';
                indicatorColor = 'bg-[#3e444c]';
              } else if (isUMTryout || isUMLatihan) {
                iconName = 'account_balance';
                indicatorColor = 'bg-[#8b5cf6]';
              }
              
              let tags = [];
              if (isTryout) {
                tags.push(
                  <span key="tag1" className="px-2 py-1 rounded text-[10px] font-bold tracking-tight uppercase bg-[#003d9b] text-white leading-none inline-flex items-center">
                    Tryout UTBK
                  </span>
                );
                tags.push(
                  <span key="tag2" className="px-2 py-1 rounded text-[10px] font-bold tracking-tight uppercase bg-[#6bff8f] text-[#007432] inline-flex items-center leading-none">
                    FREE
                  </span>
                );
              } else if (isUMTryout) {
                tags.push(
                  <span key="tag1" className="px-2 py-1 rounded text-[10px] font-bold tracking-tight uppercase bg-[#8b5cf6] text-white leading-none inline-flex items-center">
                    Tryout UM
                  </span>
                );
              } else if (isUMLatihan) {
                tags.push(
                  <span key="tag1" className="px-2 py-1 rounded text-[10px] font-bold tracking-tight uppercase bg-[#a78bfa] text-white leading-none inline-flex items-center">
                    Latihan UM
                  </span>
                );
              } else {
                tags.push(
                  <span key="tag1" className="px-2 py-1 rounded text-[10px] font-bold tracking-tight uppercase bg-[#3e444c] text-white leading-none inline-flex items-center">
                    Latihan UTBK
                  </span>
                );
              }

              let description = '';
              if (isTryout) {
                description = `Selesaikan ${h.subtestCount || 0} subtes tryout nasional. Fokus pada materi ujian masuk perguruan tinggi negeri.`;
              } else if (isUMTryout) {
                description = `Ujian Mandiri masuk Perguruan Tinggi Negeri. Menguji materi akademik dengan total ${h.total || 0} soal.`;
              } else if (isUMLatihan) {
                description = `Latihan Mandiri untuk persiapan Ujian Mandiri Perguruan Tinggi Negeri. Menjawab ${h.correct || 0} dari ${h.total || 0} soal dengan benar.`;
              } else {
                description = `Latihan soal mandiri untuk mengasah pemahaman subtes ${h.name}. Menjawab ${h.correct || 0} dari ${h.total || 0} soal dengan benar.`;
              }

              const handleDetailClick = () => {
                if (isTryout) {
                  navigate(`/tryout/hasil/${h.id}`, {
                    state: h.sessionIds && h.sessionIds.length > 1 ? { allSessionIds: h.sessionIds, packageId: h.packageId } : { packageId: h.packageId }
                  });
                } else if (isUMTryout) {
                  navigate(`/ujian-mandiri/${h.ujianId}/tryout/${h.packageId}/hasil/${h.id}`);
                }
              };

              return (
                <div key={h.id || i} className="premium-card flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl md:pl-8">
                  {/* Indicator */}
                  <div className="flex items-center justify-center w-12 shrink-0">
                    <div className={`w-10 h-10 rounded-full ${isUTBKLatihan ? 'bg-[#3e444c]/10' : (isUMTryout || isUMLatihan) ? 'bg-[#8b5cf6]/10' : 'bg-[#003d9b]/10'} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined ${isTryout ? 'text-[#003d9b]' : (isUMTryout || isUMLatihan) ? 'text-[#8b5cf6]' : 'text-[#3e444c]'} text-xl`}>
                        {iconName}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-grow w-full">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags}
                    </div>
                    <h3 className="text-xl font-bold text-[#111c2d] mb-2">{h.name}</h3>
                    <p className="text-sm font-normal text-[#434654]">{description}</p>
                    <div className="flex items-center gap-4 mt-4 text-[#737685] text-xs font-semibold">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">calendar_today</span>
                        {formatDate(h.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">timer</span>
                        {formatTime(h.date)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Detail & Score */}
                  <div className="w-full md:w-auto flex md:flex-col items-center justify-between md:justify-center gap-4 md:pl-6 md:border-l border-[#c3c6d6]">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#737685] uppercase tracking-tighter">
                        {isUTBKLatihan ? 'Skor Latihan' : isUMLatihan ? 'Skor Latihan' : isUMTryout ? 'Skor UM' : 'Skor IRT'}
                      </p>
                      <p className="text-xl font-bold text-[#003d9b]">{h.score}</p>
                    </div>
                    {(isTryout || isUMTryout) ? (
                      <button 
                        onClick={handleDetailClick}
                        className="px-6 py-3 bg-[#003d9b] text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-2"
                      >
                        Detail Hasil
                      </button>
                    ) : (
                      <span className="px-4 py-2 bg-[#f0f3ff] text-[#434654] rounded-lg text-xs font-semibold shrink-0">
                        Latihan
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-[#737685] premium-card rounded-xl w-full">
              <span className="material-symbols-outlined text-[48px] text-[#c3c6d6] mb-2">history</span>
              <p className="text-sm">{search ? 'Tidak ditemukan aktivitas dengan nama tersebut.' : 'Belum ada riwayat aktivitas.'}</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Riwayat;
