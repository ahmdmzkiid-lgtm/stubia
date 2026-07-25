import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { skdService, subscriptionService } from '../../services/api';
import toast from 'react-hot-toast';
import StudentNavbar from '../../components/layout/StudentNavbar';
import Footer from '../../components/Footer';
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
        {/* Premium Light Mesh Hero Section matching website branding */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#f2f3ff] via-[#faf8ff] to-white text-[#191b24] py-12 lg:py-20 border-b border-[#c2c6d8]/20">
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(-10px) rotate(1deg); }
            }
            @keyframes float-slow {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(-15px) rotate(-1deg); }
            }
            @keyframes pulse-slow {
              0%, 100% { opacity: 0.15; transform: scale(1); }
              50% { opacity: 0.25; transform: scale(1.1); }
            }
            .animate-float { animation: float 6s ease-in-out infinite; }
            .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
            .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
            .mesh-bg-light {
              background: radial-gradient(circle at 10% 20%, rgba(0, 80, 203, 0.08) 0%, transparent 40%),
                          radial-gradient(circle at 90% 80%, rgba(140, 20, 252, 0.06) 0%, transparent 45%),
                          radial-gradient(circle at 50% 50%, rgba(0, 80, 203, 0.04) 0%, transparent 50%);
            }
          `}</style>

          {/* Background patterns */}
          <div className="absolute inset-0 mesh-bg-light pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #0050cb 1px, transparent 1px), radial-gradient(circle at 80% 20%, #0050cb 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          {/* Blur Orbs */}
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
          <div className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] bg-purple-600/5 rounded-full blur-[90px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

          <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Left Column: Context & CTA */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#f2f3ff] border border-[#c2c6d8]/40 backdrop-blur-md w-fit mb-6 shadow-xs">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0050cb] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0050cb]"></span>
                  </span>
                  <span className="text-[12px] font-bold uppercase tracking-widest text-[#0050cb]">CAT BKN SIMULATOR 2026</span>
                </div>

                <h1 className="text-[38px] sm:text-[48px] lg:text-[56px] font-black leading-[1.1] mb-5 tracking-tight text-[#191b24]">
                  Taklukkan Ujian <br />
                  <span className="bg-gradient-to-r from-[#0050cb] via-blue-600 to-[#8c14fc] bg-clip-text text-transparent">
                    SKD CPNS 2026
                  </span>
                </h1>

                <p className="text-[15px] sm:text-[17px] text-[#424656] leading-relaxed max-w-xl mb-8">
                  Akses modul tryout & latihan soal berbasis Computer Assisted Test (CAT) BKN terlengkap. 
                  Dilengkapi dengan pembobotan nilai TKP dinamis (1-5) serta analisis ambang batas (Passing Grade) secara instan.
                </p>

                {/* Micro-features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8 max-w-lg">
                  {[
                    { icon: 'verified', text: 'Sesuai Kisi-Kisi PermenPAN-RB' },
                    { icon: 'speed', text: 'Realtime Passing Grade Tracker' },
                    { icon: 'query_stats', text: 'Pembahasan Komprehensif' },
                    { icon: 'psychology', text: 'Analisis Kemampuan Personalisasi' }
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#0050cb]/10 flex items-center justify-center border border-[#0050cb]/25 shrink-0">
                        <span className="material-symbols-outlined text-[14px] text-[#0050cb]">{feat.icon}</span>
                      </div>
                      <span className="text-[13px] text-[#424656] font-semibold">{feat.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => {
                      const element = document.getElementById('tryout-section') || document.querySelector('main');
                      if (element) element.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-7 py-3.5 rounded-2xl text-[14px] font-extrabold bg-[#0050cb] hover:bg-[#003da1] text-white transition-all transform hover:-translate-y-0.5 shadow-lg shadow-blue-500/25 flex items-center gap-2"
                  >
                    Mulai Belajar Sekarang
                    <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
                  </button>
                  <button
                    onClick={() => navigate('/paket-belajar')}
                    className="px-6 py-3.5 rounded-2xl text-[14px] font-extrabold bg-white hover:bg-gray-50 text-[#0050cb] border border-[#c2c6d8]/60 shadow-xs transition-all flex items-center gap-2"
                  >
                    Lihat Paket Premium
                  </button>
                </div>
              </div>

              {/* Right Column: Premium Mockup Graphic */}
              <div className="lg:col-span-5 relative flex justify-center items-center">
                <div className="absolute w-[350px] h-[350px] bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full opacity-30 blur-3xl pointer-events-none" />

                {/* Floating main mockup card */}
                <div className="relative w-full max-w-[390px] bg-white/90 border border-[#c2c6d8]/40 backdrop-blur-xl rounded-[28px] p-6 shadow-2xl animate-float">
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-[#c2c6d8]/20 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
                      <div className="w-3.5 h-3.5 rounded-full bg-yellow-400" />
                      <div className="w-3.5 h-3.5 rounded-full bg-green-500" />
                    </div>
                    <span className="text-[11px] font-bold text-[#0050cb] tracking-wider uppercase bg-[#f2f3ff] px-2.5 py-1 rounded-md border border-[#c2c6d8]/30">CAT MODE ACTIVE</span>
                  </div>

                  {/* Mock Score Overview */}
                  <div className="space-y-4">
                    <div className="bg-[#f8f9ff] border border-[#c2c6d8]/30 rounded-2xl p-4">
                      <span className="text-[11px] font-bold text-[#727687] uppercase tracking-wide">ESTIMASI TOTAL SKOR</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-[42px] font-black text-[#191b24] leading-none tracking-tight">410</span>
                        <span className="text-[14px] font-bold text-emerald-600">/ 550 Max</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-[12px] text-emerald-600 font-bold">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Lolos Ambang Batas SKD 2026
                      </div>
                    </div>

                    {/* Progress bars for subjects */}
                    <div className="space-y-3">
                      {[
                        { name: 'TWK', score: 115, pg: 65, color: 'from-orange-500 to-amber-500', colorText: 'text-orange-600' },
                        { name: 'TIU', score: 135, pg: 80, color: 'from-blue-500 to-cyan-500', colorText: 'text-blue-600' },
                        { name: 'TKP', score: 160, pg: 166, color: 'from-emerald-500 to-green-500', colorText: 'text-emerald-600' },
                      ].map((item, idx) => (
                        <div key={idx} className="border border-[#c2c6d8]/20 rounded-xl p-3">
                          <div className="flex justify-between items-center text-[12px] font-bold mb-1.5">
                            <span className="text-[#191b24]">{item.name}</span>
                            <span className={item.colorText}>{item.score} <span className="text-[#727687] font-medium">/ PG {item.pg}</span></span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${item.color} rounded-full`} style={{ width: `${(item.score / 175) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decorative badge */}
                  <div className="absolute -bottom-6 -left-6 bg-white border border-[#c2c6d8]/40 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-float-slow">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200 shrink-0">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">military_tech</span>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#727687] font-bold">AKURASI PREDIKSI</div>
                      <div className="text-[13px] font-black text-[#191b24]">94.8% (Tinggi)</div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Passing Grade Reference Cards */}
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: 'TWK', fullName: 'Tes Wawasan Kebangsaan', pg: 65, maxScore: 175, questions: 35, color: SUBJECT_COLOR.TWK },
              { label: 'TIU', fullName: 'Tes Intelejensia Umum', pg: 80, maxScore: 175, questions: 35, color: SUBJECT_COLOR.TIU },
              { label: 'TKP', fullName: 'Tes Karakteristik Pribadi', pg: 166, maxScore: 225, questions: 45, color: SUBJECT_COLOR.TKP },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-[#c2c6d8]/40 shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center gap-3.5 mb-3.5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shadow-xs"
                    style={{ backgroundColor: s.color.bg, color: s.color.icon }}>
                    {s.label}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-[#191b24]">{s.fullName}</div>
                    <div className="text-[11px] text-[#727687]">{s.questions} Soal • Maks {s.maxScore} Poin</div>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[12px] font-medium text-[#424656]">Passing Grade BKN</span>
                  <span className="text-[15px] font-black" style={{ color: s.color.icon }}>{s.pg}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(s.pg / s.maxScore) * 100}%`, backgroundColor: s.color.bar }} />
                </div>
              </div>
            ))}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => <div key={i} className="h-52 bg-[#f2f3ff] animate-pulse rounded-2xl" />)}
                </div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#c2c6d8]/40">
                  <span className="material-symbols-outlined text-[56px] text-[#c2c6d8] block mb-3">auto_stories</span>
                  <p className="text-[17px] font-bold text-[#191b24]">Belum ada subtes latihan tersedia</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <Footer />
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

// ── SubjectCard ──
function SubjectCard({ subject, onClick }) {
  const color = SUBJECT_COLOR[subject.name] || SUBJECT_COLOR.TWK;
  const isTkp = subject.is_tkp;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#c2c6d8]/40 rounded-2xl p-6 cursor-pointer hover:shadow-xl hover:border-[#0050cb]/30 transition-all group flex flex-col justify-between"
    >
      <div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-13 h-13 rounded-2xl flex items-center justify-center text-[18px] font-black shadow-xs transition-transform group-hover:scale-110"
            style={{ backgroundColor: color.bg, color: color.icon }}>
            {subject.name}
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-[#191b24] group-hover:text-[#0050cb] transition-colors">
              {subject.full_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${color.badge}`}>{subject.name}</span>
              {isTkp && <span className="text-[11px] font-semibold text-emerald-700">Skor 1–5</span>}
            </div>
          </div>
        </div>

        {/* Passing Grade */}
        <div className="mb-4 p-3 rounded-xl border" style={{ backgroundColor: color.bg + '80', borderColor: color.icon + '30' }}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[12px] font-semibold text-[#424656]">Passing Grade BKN</span>
            <span className="text-[14px] font-black" style={{ color: color.icon }}>{subject.passing_grade}</span>
          </div>
          <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{
              width: `${Math.min(100, (subject.passing_grade / (isTkp ? 225 : 175)) * 100)}%`,
              backgroundColor: color.icon
            }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-[#f2f3ff] rounded-xl">
            <div className="text-[17px] font-black text-[#0050cb]">{subject.question_count}</div>
            <div className="text-[10px] font-bold text-[#727687] uppercase">Soal/Paket</div>
          </div>
          <div className="text-center p-2 bg-[#f2f3ff] rounded-xl">
            <div className="text-[17px] font-black text-[#0050cb]">{subject.duration_minutes}'</div>
            <div className="text-[10px] font-bold text-[#727687] uppercase">Durasi</div>
          </div>
        </div>

        <p className="text-[12px] text-[#424656] leading-relaxed mb-4 line-clamp-2">
          {subject.description || 'Latihan soal sesuai kisi-kisi resmi BKN.'}
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#c2c6d8]/20">
        <span className="text-[13px] font-bold text-[#0050cb]">Mulai Latihan</span>
        <span className="material-symbols-outlined text-[#0050cb] group-hover:translate-x-1 transition-transform">arrow_forward</span>
      </div>
    </div>
  );
}
