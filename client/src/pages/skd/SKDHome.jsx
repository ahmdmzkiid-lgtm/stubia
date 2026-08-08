import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { skdService, subscriptionService } from '../../services/api';
import toast from 'react-hot-toast';
import StudentNavbar from '../../components/layout/StudentNavbar';
import ChatWidget from '../../components/ChatWidget';

const CPNS_PLAN_RANK = {
  gratis: 0,
  cpns_to_eceran: 1,
  cpns_to_all: 2,
  cpns_3m: 3,
  cpns_6m: 3,
};

const SUBJECT_COLOR = {
  TWK: { bg: '#fff3e0', icon: '#e65100', badge: 'bg-orange-100 text-orange-700', pill: 'bg-orange-50 border-orange-200', bar: '#e65100' },
  TIU: { bg: '#e3f2fd', icon: '#1565c0', badge: 'bg-blue-100 text-blue-700', pill: 'bg-blue-50 border-blue-200', bar: '#1565c0' },
  TKP: { bg: '#e8f5e9', icon: '#2e7d32', badge: 'bg-green-100 text-green-700', pill: 'bg-green-50 border-green-200', bar: '#2e7d32' },
};

export default function SKDHome() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('tryout');
  const [packages, setPackages] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activePlans, setActivePlans] = useState([]);
  const [registrationStatus, setRegistrationStatus] = useState({});
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('all'); // 'all', 'gratis', 'premium'

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [pkgRes, subRes, planRes] = await Promise.all([
        skdService.getPackages(),
        skdService.getSubjects(),
        subscriptionService.getActivePlans(),
      ]);
      setPackages(pkgRes.data?.data || []);
      setSubjects(subRes.data?.data || []);
      const plans = planRes.data?.data || [];
      setActivePlans(plans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const hasCpnsSubscription = useMemo(() => {
    return activePlans.some((p) => {
      const name = p.name || p.plan_name;
      if (p.target_type !== 'cpns') return false;
      if (p.plan_type === 'subscription' || p.plan_type === 'access') return true;
      if (p.plan_type === 'quota' && (p.quota_remaining || 0) > 0) return true;
      return false;
    });
  }, [activePlans]);

  const cpnsPlanRank = useMemo(() => {
    let rank = 0;
    for (const p of activePlans) {
      if (p.target_type !== 'cpns') continue;
      rank = Math.max(rank, CPNS_PLAN_RANK[p.name] ?? 0);
    }
    return rank;
  }, [activePlans]);

  const hasPlanAccess = (requiredPlan) => {
    if (!requiredPlan || requiredPlan === 'gratis') return true;
    return cpnsPlanRank >= (CPNS_PLAN_RANK[requiredPlan] ?? 0);
  };

  // Load registration & completion status for each package
  useEffect(() => {
    if (packages.length === 0) return;
    Promise.all(
      packages.map(async (pkg) => {
        try {
          const res = await skdService.getRegistrationStatus(pkg.id);
          return [pkg.id, res.data?.data];
        } catch {
          return [pkg.id, null];
        }
      })
    ).then((entries) => setRegistrationStatus(Object.fromEntries(entries)));
  }, [packages]);

  const handleStartTryout = async (pkg) => {
    const reqPlan = pkg.required_plan || 'gratis';
    if (!hasPlanAccess(reqPlan)) {
      toast.error('Upgrade paket CPNS untuk mengakses tryout ini.');
      navigate('/paket-belajar');
      return;
    }
    if (!pkg.is_active) {
      toast.error('Tryout sedang tidak aktif.');
      return;
    }

    const regStatus = registrationStatus[pkg.id];
    if (reqPlan === 'gratis' && !hasCpnsSubscription) {
      if (!regStatus?.registration || regStatus.registration.status !== 'approved') {
        navigate(`/skd/daftar/${pkg.id}`);
        return;
      }
      if (regStatus.completed) {
        toast.error('Kamu sudah mengerjakan tryout ini. Upgrade paket untuk mengerjakan lagi.');
        return;
      }
    }

    try {
      const res = await skdService.startTryout(pkg.id);
      const sessionId = res.data?.data?.sessionId;
      if (sessionId) navigate(`/skd/tryout/${sessionId}`);
    } catch (err) {
      if (err.response?.data?.needsRegistration) {
        navigate(`/skd/daftar/${pkg.id}`);
      }
    }
  };

  const activePackages = useMemo(() => {
    return packages.filter((p) => {
      if (p.is_active === false) return false;
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = (p.title || '').toLowerCase().includes(query);
        const matchDesc = (p.description || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }

      // Filter by plan type
      const reqPlan = p.required_plan || 'gratis';
      if (filterPlan === 'gratis' && reqPlan !== 'gratis') return false;
      if (filterPlan === 'premium' && reqPlan === 'gratis') return false;

      return true;
    });
  }, [packages, searchQuery, filterPlan]);

  const upcomingPackages = useMemo(() => {
    const now = new Date();
    return activePackages.filter((p) => p.scheduled_at && new Date(p.scheduled_at) > now)
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  }, [activePackages]);

  const availablePackages = useMemo(() => {
    return activePackages.filter((p) => !p.scheduled_at || new Date(p.scheduled_at) <= new Date());
  }, [activePackages]);

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b24] flex flex-col font-sans">
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-[#faf8ff] border-b border-[#c2c6d8]/20 py-10 lg:py-16">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#c2c6d8]/40 w-fit mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0050cb]"></span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#424656]">Simulasi CAT BKN 2026</span>
                </div>

                <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-black leading-[1.12] mb-4 tracking-tight text-[#191b24]">
                  Persiapan SKD CPNS<br />
                  <span className="text-[#0050cb]">yang Terukur</span>
                </h1>

                <p className="text-[14px] sm:text-[15px] text-[#727687] leading-relaxed max-w-md mb-7">
                  Tryout & latihan soal berbasis sistem CAT BKN dengan pembobotan TKP (1-5) dan tracking passing grade secara realtime.
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  <button
                    onClick={() => {
                      const element = document.getElementById('tryout-section') || document.querySelector('main');
                      if (element) element.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-3 rounded-xl text-[13px] font-bold bg-[#0050cb] text-white hover:bg-[#003fa4] transition-all shadow-sm flex items-center gap-2"
                  >
                    Mulai Belajar
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                  <button
                    onClick={() => navigate('/paket-belajar')}
                    className="px-6 py-3 rounded-xl text-[13px] font-bold bg-white text-[#424656] border border-[#c2c6d8]/50 hover:border-[#0050cb]/40 hover:text-[#0050cb] transition-all"
                  >
                    Lihat Paket
                  </button>
                </div>

                {/* Compact feature list */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-[#727687]">
                  {[
                    { icon: 'verified', text: 'Sesuai kisi-kisi PermenPAN-RB' },
                    { icon: 'speed', text: 'Passing grade tracker' },
                    { icon: 'query_stats', text: 'Pembahasan lengkap' },
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-[#0050cb]">{feat.icon}</span>
                      <span className="font-medium">{feat.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Compact Info Cards */}
              <div className="lg:col-span-5">
                <div className="space-y-3">
                  {/* Passing Grade Overview */}
                  <div className="bg-white rounded-2xl border border-[#c2c6d8]/30 p-5">
                    <div className="text-[11px] font-bold text-[#727687] uppercase tracking-wider mb-4">Ambang Batas SKD CPNS 2026</div>
                    <div className="space-y-3.5">
                      {[
                        { name: 'TWK', fullName: 'Wawasan Kebangsaan', pg: 65, max: 175, questions: 35, color: '#e65100', bg: '#fff3e0' },
                        { name: 'TIU', fullName: 'Intelejensia Umum', pg: 80, max: 175, questions: 35, color: '#1565c0', bg: '#e3f2fd' },
                        { name: 'TKP', fullName: 'Karakteristik Pribadi', pg: 166, max: 225, questions: 45, color: '#2e7d32', bg: '#e8f5e9' },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0"
                            style={{ backgroundColor: item.bg, color: item.color }}>
                            {item.name}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[12px] font-semibold text-[#424656] truncate">{item.fullName}</span>
                              <span className="text-[12px] font-bold shrink-0 ml-2" style={{ color: item.color }}>PG {item.pg}<span className="text-[#c2c6d8] font-normal">/{item.max}</span></span>
                            </div>
                            <div className="h-1.5 bg-[#f2f3ff] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${(item.pg / item.max) * 100}%`, backgroundColor: item.color }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#c2c6d8]/20 flex items-center justify-between">
                      <span className="text-[11px] text-[#727687]">Total Soal: <strong className="text-[#191b24]">110 soal</strong></span>
                      <span className="text-[11px] text-[#727687]">Skor Maks: <strong className="text-[#191b24]">550 poin</strong></span>
                    </div>
                  </div>

                  {/* Quick stats row */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { value: '110', label: 'Soal per sesi', icon: 'quiz' },
                      { value: '100\'', label: 'Durasi ujian', icon: 'timer' },
                      { value: 'CAT', label: 'Sistem BKN', icon: 'computer' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white rounded-xl border border-[#c2c6d8]/30 p-3 text-center">
                        <span className="material-symbols-outlined text-[16px] text-[#0050cb] mb-1 block">{stat.icon}</span>
                        <div className="text-[16px] font-black text-[#191b24] leading-tight">{stat.value}</div>
                        <div className="text-[10px] text-[#727687] font-medium mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>



        {/* Tabs & Search Filter Header */}
        <section id="tryout-section" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pb-4 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-[#c2c6d8]/40 shadow-xs">
            
            {/* Left: Tabs */}
            <div className="flex gap-1 bg-[#f2f3ff] p-1 rounded-xl w-fit">
              {[
                { id: 'tryout', label: 'Tryout SKD', icon: 'assignment' },
                { id: 'latihan', label: 'Latihan Soal', icon: 'auto_stories' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-[#0050cb] shadow-xs'
                      : 'text-[#424656] hover:text-[#0050cb]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right: Search & Plan Filter */}
            <div className="flex flex-wrap items-center gap-3">
              {activeTab === 'tryout' && (
                <div className="flex items-center gap-1.5 bg-[#f2f3ff] p-1 rounded-xl">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'gratis', label: 'Gratis' },
                    { id: 'premium', label: 'Premium' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterPlan(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterPlan === f.id
                          ? 'bg-[#0050cb] text-white shadow-xs'
                          : 'text-[#424656] hover:text-[#0050cb]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari paket / materi..."
                  className="w-full bg-[#f8f9ff] border border-[#c2c6d8]/40 rounded-xl pl-9 pr-8 py-2 text-xs text-[#191b24] placeholder-slate-400 focus:outline-none focus:border-[#0050cb] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* Content */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 pb-16">
          {/* ── TRYOUT TAB ── */}
          {activeTab === 'tryout' && (
            <div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[1, 2, 3].map((i) => <div key={i} className="h-44 bg-[#f2f3ff] animate-pulse rounded-2xl" />)}
                </div>
              ) : activePackages.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#c2c6d8]/40 p-8 space-y-3">
                  <span className="material-symbols-outlined text-[56px] text-[#c2c6d8]">assignment</span>
                  <h3 className="text-[17px] font-bold text-[#191b24]">Tidak ada paket tryout yang ditemukan</h3>
                  <p className="text-xs text-[#727687] max-w-sm mx-auto">
                    Coba sesuaikan kata kunci pencarian atau pilih filter akses lain.
                  </p>
                </div>
              ) : (
                <>
                  {availablePackages.length > 0 && (
                    <div className="mb-10">
                      <h2 className="text-[20px] font-extrabold text-[#191b24] mb-5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0050cb]">play_circle</span>
                        Tersedia Sekarang ({availablePackages.length})
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {availablePackages.map((pkg, idx) => (
                          <TryoutCard
                            key={pkg.id}
                            pkg={pkg}
                            idx={idx}
                            regStatus={registrationStatus[pkg.id]}
                            hasCpnsSubscription={hasCpnsSubscription}
                            hasPlanAccess={hasPlanAccess}
                            onStart={() => handleStartTryout(pkg)}
                            navigate={navigate}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {upcomingPackages.length > 0 && (
                    <div>
                      <h2 className="text-[20px] font-extrabold text-[#191b24] mb-5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#0050cb]">calendar_month</span>
                        Jadwal Mendatang ({upcomingPackages.length})
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {upcomingPackages.map((pkg, idx) => (
                          <TryoutCard
                            key={pkg.id}
                            pkg={pkg}
                            idx={idx}
                            regStatus={registrationStatus[pkg.id]}
                            hasCpnsSubscription={hasCpnsSubscription}
                            hasPlanAccess={hasPlanAccess}
                            onStart={() => handleStartTryout(pkg)}
                            navigate={navigate}
                            isUpcoming
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── LATIHAN TAB ── */}
          {activeTab === 'latihan' && (
            <div>
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-36 bg-[#f2f3ff] animate-pulse rounded-[16px]" />)}
                </div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#c2c6d8]/40">
                  <span className="material-symbols-outlined text-[56px] text-[#c2c6d8] block mb-3">auto_stories</span>
                  <p className="text-[17px] font-bold text-[#191b24]">Belum ada subtes latihan tersedia</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {subjects.map((subject) => (
                    <SubjectCard
                      key={subject.id}
                      subject={subject}
                      onClick={() => navigate(`/skd/latihan/${subject.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Info & Tips Section */}
        <section className="bg-[#f2f3ff]/60 border-t border-[#c2c6d8]/30 py-12">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-[#0050cb] bg-blue-100 px-3 py-1 rounded-full">
                Strategi Kelulusan
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#191b24] mt-2">
                Tips Lolos Passing Grade SKD CPNS 2026
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-[#c2c6d8]/30 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">flag</span>
                </div>
                <h3 className="font-bold text-[#191b24] text-sm">1. Prioritaskan TKP Dulu</h3>
                <p className="text-xs text-[#727687] leading-relaxed">
                  TKP memiliki bobot soal terbesar (45 soal) tanpa nilai 0. Setiap jawaban bernilai 1–5 poin. Selesaikan TKP dalam 35-40 menit pertama.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#c2c6d8]/30 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">calculate</span>
                </div>
                <h3 className="font-bold text-[#191b24] text-sm">2. Manfaatkan Eliminasi di TIU</h3>
                <p className="text-xs text-[#727687] leading-relaxed">
                  Soal TIU (35 soal) menguji berhitung cepat & silogisme. Gunakan metode eliminasi pilihan jawaban untuk menghemat waktu pengerjaan.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#c2c6d8]/30 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <h3 className="font-bold text-[#191b24] text-sm">3. Jaga Ambang Batas TWK</h3>
                <p className="text-xs text-[#727687] leading-relaxed">
                  TWK mensyaratkan Passing Grade minimal 65 (sekitar 13 soal benar). Pelajari pilar negara, UUD 1945, dan bahasa Indonesia dengan baik.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <ChatWidget />
    </div>
  );
}

// ── TryoutCard ──
function TryoutCard({ pkg, idx, regStatus, hasCpnsSubscription, hasPlanAccess, onStart, navigate, isUpcoming }) {
  const reqPlan = pkg.required_plan || 'gratis';
  const isLocked = !hasPlanAccess(reqPlan);
  const isCompleted = !hasCpnsSubscription && regStatus?.completed;
  let config = [];
  try { config = typeof pkg.subject_config === 'string' ? JSON.parse(pkg.subject_config) : (pkg.subject_config || []); } catch {}
  const totalSoal = config.reduce((acc, s) => acc + (s.questionCount || 0), 0);

  const schedDate = pkg.scheduled_at ? new Date(pkg.scheduled_at) : null;
  const isScheduledFuture = schedDate && schedDate > new Date();

  const regStatusLabel = () => {
    if (hasCpnsSubscription) return null;
    if (reqPlan !== 'gratis') return null;
    const reg = regStatus?.registration;
    if (!reg) return { text: 'Daftar Dulu', color: 'bg-amber-50 text-amber-700 border border-amber-200', icon: 'info' };
    if (reg.status === 'pending') return { text: 'Menunggu Verifikasi', color: 'bg-yellow-50 text-yellow-700 border border-yellow-200', icon: 'hourglass_empty' };
    if (reg.status === 'rejected') return { text: 'Ditolak — Daftar Ulang', color: 'bg-red-50 text-red-700 border border-red-200', icon: 'cancel' };
    if (reg.status === 'approved' && isCompleted) return { text: 'Sudah Dikerjakan', color: 'bg-gray-100 text-gray-600 border border-gray-200', icon: 'check_circle' };
    return null;
  };

  const statusBadge = regStatusLabel();

  return (
    <div className={`relative bg-white border rounded-2xl overflow-hidden transition-all group ${
      isLocked || isScheduledFuture
        ? 'border-[#c2c6d8]/40 opacity-75 cursor-not-allowed'
        : 'border-[#c2c6d8]/50 hover:shadow-lg hover:border-[#0050cb]/30 cursor-pointer'
    }`}
      onClick={() => { if (!isLocked && !isScheduledFuture && !isCompleted) onStart(); }}
    >
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        {/* Left accent */}
        <div className="flex sm:flex-col items-center sm:justify-center px-5 py-3 sm:p-0 sm:w-24 bg-gradient-to-b from-[#1565c0]/10 to-[#0050cb]/5 border-b sm:border-b-0 sm:border-r border-[#c2c6d8]/20">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-[#0050cb] flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-[20px] sm:text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isUpcoming ? 'event' : 'assignment'}
            </span>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 p-5 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#0050cb] text-white">CPNS SKD</span>
              {reqPlan !== 'gratis' && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Premium</span>
              )}
              {isUpcoming && <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Segera</span>}
            </div>

            <h3 className={`text-[16px] font-bold leading-snug ${isLocked ? 'text-gray-400' : 'text-[#191b24] group-hover:text-[#0050cb] transition-colors'}`}>
              {pkg.title}
            </h3>

            {statusBadge && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${statusBadge.color}`}>
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>{statusBadge.icon}</span>
                {statusBadge.text}
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-[11px] text-[#727687] font-medium pt-1">
              {totalSoal > 0 && <span>{totalSoal} soal total</span>}
              {config.length > 0 && <span>{config.length} subtes (TWK, TIU, TKP)</span>}
              {schedDate && <span>{schedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-[#c2c6d8]/20" onClick={(e) => e.stopPropagation()}>
            {isLocked ? (
              <button onClick={() => navigate('/paket-belajar')}
                className="px-4 py-2 text-[12px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1.5 border border-gray-200">
                <span className="material-symbols-outlined text-[15px]">lock</span> Upgrade Paket
              </button>
            ) : isScheduledFuture ? (
              <button disabled className="px-4 py-2 text-[12px] font-bold text-purple-600 bg-purple-50 rounded-xl flex items-center gap-1.5 border border-purple-200">
                <span className="material-symbols-outlined text-[15px]">schedule</span> Belum Dibuka
              </button>
            ) : isCompleted ? (
              <button onClick={() => navigate(`/skd`)} className="px-4 py-2 text-[12px] font-bold text-gray-500 bg-gray-100 rounded-xl border border-gray-200">
                Sudah Selesai
              </button>
            ) : (
              <button onClick={onStart}
                className="px-4 py-2 text-[12px] font-bold text-white bg-[#0050cb] hover:bg-[#003da1] rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10 transition-all">
                <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                Mulai Tryout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SubjectCard (UTBK-style topic card) ──
function SubjectCard({ subject, onClick }) {
  const color = SUBJECT_COLOR[subject.name] || (
    subject.name?.toUpperCase().includes('TWK') ? SUBJECT_COLOR.TWK :
    subject.name?.toUpperCase().includes('TKP') ? SUBJECT_COLOR.TKP :
    SUBJECT_COLOR.TIU
  );
  const topicCount = subject.topic_count || 0;
  const isMaterialIcon = subject.icon && !['TWK', 'TIU', 'TKP'].includes(subject.icon);

  return (
    <div
      onClick={onClick}
      className="relative bg-white border border-[#c2c6d8]/30 rounded-[16px] p-4 transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:shadow-lg hover:border-[#0050cb]/40"
    >
      <div>
        <div className="flex items-center gap-2 mb-3">
          {/* Subtest Icon/Badge matching prompt image */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-[13px] tracking-tight shadow-xs text-white shrink-0 transition-transform group-hover:scale-105"
            style={{ backgroundColor: color.icon }}
          >
            {isMaterialIcon ? (
              <span className="material-symbols-outlined text-[22px]">{subject.icon}</span>
            ) : (
              subject.name
            )}
          </div>
        </div>
        <h3 className="text-[14px] font-bold text-[#191b24] mb-1 leading-tight group-hover:text-[#0050cb] transition-colors">
          {subject.full_name || subject.name}
        </h3>
        <p className="text-[12px] text-[#424656] leading-relaxed line-clamp-2">
          {subject.description || `Latihan soal ${subject.name} sesuai kisi-kisi resmi BKN.`}
        </p>
        {topicCount > 0 && (
          <span className="inline-block mt-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: color.bg, color: color.icon }}>
            {topicCount} paket soal
          </span>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-[#c2c6d8]/20 flex items-center justify-between">
        <span className="text-[12px] font-bold text-[#0050cb]">Mulai</span>
        <span className="material-symbols-outlined text-[16px] text-[#0050cb] group-hover:translate-x-1 transition-transform">arrow_forward</span>
      </div>
    </div>
  );
}
