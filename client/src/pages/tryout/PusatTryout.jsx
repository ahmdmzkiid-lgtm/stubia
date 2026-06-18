import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { settingsService, subjectService, tryoutService, activityService, subscriptionService } from '../../services/api';
import toast from 'react-hot-toast';
import ChatWidget from '../../components/ChatWidget';
import Footer from '../../components/Footer';
import StudentNavbar from '../../components/layout/StudentNavbar';

const PLAN_RANK = { gratis: 0, premium_um: 0, premium: 1, sultan: 2, utbk_3m: 1, utbk_6m: 1, utbk_9m: 1, utbk_12m: 1, utbk_to_5x: 1, utbk_to_8x: 1, utbk_to_10x: 1 };



const PusatTryout = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riwayatData, setRiwayatData] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [bannerConfig, setBannerConfig] = useState({
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80',
    title: 'Tryout Nasional Akbar\nUTBK-SNBT 2026',
    startTime: '04 : 12 : 55 : 20'
  });

  useEffect(() => {
    // Load Banner Settings
    settingsService.get().then(res => {
      const data = res.data.data;
      if (data) {
        setBannerConfig(prev => ({
          image: data.tryout_banner_url || prev.image,
          title: data.tryout_title || prev.title,
          startTime: data.tryout_start_time || prev.startTime
        }));
      }
    }).catch(() => {});

    // Load Subjects
    subjectService.list().then(res => {
      setSubjects(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));

    // Load Tryout Packages dari database
    tryoutService.listPackages().then(res => {
      setPackages(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoadingPackages(false));

    // Load active subscriptions
    subscriptionService.getActivePlans().then(res => {
      setActivePlans(res.data?.data || []);
    }).catch(() => {});

    // Load Riwayat
    activityService.getRiwayat().then(res => {
      if (res.data?.success) setRiwayatData(res.data.data);
    }).catch(() => {});
  }, []);

  const hasPlanAccess = (requiredPlan) => {
    if (!requiredPlan || requiredPlan === 'gratis') return true;
    for (const plan of activePlans) {
      const pName = plan.name || plan.plan_name;
      const pRank = PLAN_RANK[pName] ?? 0;
      const reqRank = PLAN_RANK[requiredPlan] ?? 0;
      if (pRank >= reqRank) return true;
    }
    const userPlan = user?.current_plan || 'gratis';
    const userRank = PLAN_RANK[userPlan] ?? 0;
    const reqRank = PLAN_RANK[requiredPlan] ?? 0;
    return userRank >= reqRank;
  };

  const handleStartTryout = (pkg) => {
    const reqPlan = pkg.required_plan || 'gratis';
    if (!hasPlanAccess(reqPlan)) {
      toast.error(`Tryout ini khusus paket ${reqPlan === 'sultan' ? 'Sultan' : 'Premium'}.`);
      return;
    }
    if (pkg.is_active === false) {
      toast.error('Tryout sedang non-aktif.');
      return;
    }
    navigate(`/tryout/select/${pkg.id}`);
  };

  const userPlan = user?.current_plan || 'gratis';
  const userRank = PLAN_RANK[userPlan] ?? 0;

  const filteredPackages = useMemo(() => {
    const filtered = packages
      .filter(p => p.is_active !== false)
      .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return filtered.sort((a, b) => {
      const planA = PLAN_RANK[a.required_plan || 'gratis'] ?? 0;
      const planB = PLAN_RANK[b.required_plan || 'gratis'] ?? 0;
      return planA - planB;
    });
  }, [packages, searchQuery]);

  // Extract Riwayat Data
  const history = (riwayatData?.history || []).filter(h => h.type === 'tryout');
  const scoreTrend = (riwayatData?.scoreTrend || []).filter(t => t.type === 'tryout');
  const highestScore = scoreTrend.length > 0 ? Math.max(...scoreTrend.map(t => t.score)) : 0;
  const scoreChange = riwayatData?.summary?.scoreChange || 0;
  const recentHistory = history.slice(0, 3);
  const chartData = [...scoreTrend].slice(-6);
  const maxChartScore = chartData.length > 0 ? Math.max(...chartData.map(d => d.score), 1000) : 1000;

  const upcomingSchedules = useMemo(() => {
    const now = new Date();
    return packages
      .filter(p => p.scheduled_at && new Date(p.scheduled_at) > now)
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
      .slice(0, 3);
  }, [packages]);

  return (
    <div className="bg-[#faf8ff] text-[#191b24] min-h-screen flex flex-col font-sans">
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />
      
      <main className="flex-grow pt-16 sm:pt-20 px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto w-full pb-12">
        {/* Header Section */}
        <header className="mb-8 sm:mb-12 mt-6 sm:mt-8">
          <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold text-[#0050cb] mb-2 leading-tight">Pusat Tryout</h1>
          <p className="text-[16px] sm:text-[18px] text-[#424656] max-w-2xl">Asah kemampuanmu dengan simulasi ujian berstandar nasional. Pantau perkembangan skor dan siap hadapi seleksi impian.</p>
        </header>



        {/* ── PAKET TRYOUT DARI DATABASE ── */}
        <section className="mb-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-[32px] font-bold text-[#191b24]">Paket Tryout Tersedia</h2>
              <p className="text-[16px] text-[#424656] mt-1">
                {loadingPackages ? 'Memuat...' : `${filteredPackages.length} paket tersedia`}
              </p>
            </div>
          </div>

          {loadingPackages ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-36 bg-[#f2f3ff] animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-16 bg-[#f2f3ff] rounded-2xl border border-[#c2c6d8]/50">
              <span className="material-symbols-outlined text-[64px] text-[#727687]">assignment</span>
              <p className="text-[18px] font-semibold text-[#424656] mt-4">
                {searchQuery ? `Tidak ada tryout untuk "${searchQuery}"` : 'Belum ada paket tryout'}
              </p>
              {!searchQuery && isAdmin && (
                <p className="text-[14px] text-[#727687] mt-2">
                  Buat paket tryout di <Link to="/admin/tryout" className="text-[#0050cb] hover:underline">Admin Panel → Kelola Tryout</Link>
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPackages.map((pkg, idx) => {
                const config = Array.isArray(pkg.subject_config)
                  ? pkg.subject_config
                  : (typeof pkg.subject_config === 'string' ? JSON.parse(pkg.subject_config) : []);
                const totalSoal = config.reduce((acc, s) => acc + (s.questionCount || 0), 0);
                const reqPlan = pkg.required_plan || 'gratis';
                const reqRank = PLAN_RANK[reqPlan] ?? 0;
                const isLocked = reqRank > userRank;
                const packageNumber = filteredPackages.length - idx;

                const planLabel = reqPlan === 'sultan' ? 'Sultan' : reqPlan === 'premium' ? 'Premium' : 'Gratis';
                const planBadgeBg = 'bg-[#0050cb]';
                const planBadgeText = 'text-white';

                const pkgHistory = history.find(h => h.packageId === pkg.id);
                const lastScore = pkgHistory ? pkgHistory.score : null;

                return (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      if (isLocked) {
                        toast.error(`Tryout ini khusus paket ${planLabel}. Upgrade paketmu untuk akses.`);
                      } else {
                        handleStartTryout(pkg);
                      }
                    }}
                    className={`relative bg-white border rounded-2xl overflow-hidden transition-all ${
                      isLocked
                        ? 'border-[#c2c6d8]/40 opacity-60 cursor-not-allowed'
                        : 'border-[#c2c6d8]/50 hover:shadow-lg hover:border-[#0050cb]/30 cursor-pointer group'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-stretch h-full">
                      {/* Left: Number + Badge */}
                      <div className={`relative flex sm:flex-col items-center sm:justify-center justify-between px-5 py-3 sm:p-0 sm:w-28 shrink-0 border-b sm:border-b-0 sm:border-r border-[#c2c6d8]/30 ${
                        isLocked ? 'bg-gray-100' : 'bg-[#f2f3ff]'
                      }`}>
                        <span className={`static sm:absolute sm:top-3 sm:left-3 px-2.5 py-0.5 text-[10px] font-bold rounded-md ${planBadgeBg} ${planBadgeText}`}>
                          UTBK
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="sm:hidden text-[12px] font-bold text-[#727687] uppercase tracking-wider">Paket</span>
                          <span className={`text-[28px] sm:text-[56px] font-black leading-none ${
                            isLocked ? 'text-gray-300' : 'text-[#191b24] group-hover:text-[#0050cb] transition-colors'
                          }`}>
                            {packageNumber}
                          </span>
                        </div>
                      </div>

                      {/* Right: Info + Score */}
                      <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between min-h-[130px] gap-4">
                        {/* Info */}
                        <div className="flex flex-col justify-center flex-1">
                          <span className={`text-[12px] font-semibold mb-1.5 ${
                            reqPlan === 'sultan' ? 'text-yellow-700' : reqPlan === 'premium' ? 'text-[#0050cb]' : 'text-[#2e7d32]'
                          }`}>
                            {reqPlan === 'gratis' ? 'Gratis' : reqPlan === 'premium' ? 'Premium' : 'Sultan'}
                          </span>

                          <h3 className={`text-[16px] sm:text-[18px] font-bold leading-snug mb-3 ${
                            isLocked ? 'text-gray-400' : 'text-[#191b24] group-hover:text-[#0050cb] transition-colors'
                          }`}>
                            {pkg.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {isLocked ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-500 text-[12px] font-semibold rounded-full">
                                <span className="material-symbols-outlined text-[14px]">lock</span>
                                Terkunci
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-semibold rounded-full ${
                                reqPlan === 'sultan' ? 'bg-yellow-50 text-yellow-700' :
                                reqPlan === 'premium' ? 'bg-blue-50 text-[#0050cb]' :
                                'bg-[#e8f5e9] text-[#2e7d32]'
                              }`}>
                                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                                {reqPlan === 'gratis' ? 'Gratis' : 'Mulai Tryout'}
                              </span>
                            )}
                            {totalSoal > 0 && (
                              <span className="text-[12px] text-[#727687]">{totalSoal} soal • {config.length} subtes</span>
                            )}
                          </div>
                        </div>

                        {/* Score History & Arrow */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-[#c2c6d8]/30 pt-3 sm:pt-0 mt-2 sm:mt-0">
                          {lastScore !== null && (
                            <div className="flex flex-col sm:items-end justify-center">
                              <span className="text-[10px] sm:text-[11px] text-[#727687] font-semibold uppercase tracking-wider mb-1">Skor Terakhir</span>
                              <span className="text-[20px] sm:text-[24px] font-black text-[#0050cb] leading-none">{lastScore}</span>
                            </div>
                          )}
                          
                          {/* Arrow indicator */}
                          {!isLocked && (
                            <div className="flex items-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="material-symbols-outlined text-[#0050cb] text-[20px] sm:text-[24px]">chevron_right</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Schedule & History (Bento Style) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Schedule Section */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-8 border border-[#c2c6d8]/50 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-[#0050cb]">calendar_month</span>
              <h2 className="text-[24px] font-bold text-[#191b24]">Jadwal Mendatang</h2>
            </div>
            <div className="space-y-4">
              {upcomingSchedules.length > 0 ? upcomingSchedules.map((schedule) => {
                const dateObj = new Date(schedule.scheduled_at);
                const month = dateObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
                const date = dateObj.getDate();
                const time = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                
                return (
                  <div key={schedule.id} className="flex items-center gap-6 p-4 rounded-xl hover:bg-[#f2f3ff] transition-colors border border-transparent hover:border-[#dae1ff] group">
                    <div className="flex flex-col items-center justify-center bg-[#e1e2ee] group-hover:bg-[#dae1ff] w-16 h-16 rounded-xl transition-colors shrink-0">
                      <span className="text-[12px] font-bold text-[#424656] group-hover:text-[#0050cb]">{month}</span>
                      <span className="text-[24px] font-bold text-[#0050cb]">{date}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[16px] text-[#191b24] group-hover:text-[#0050cb] transition-colors">{schedule.title}</h4>
                      <p className="text-[12px] text-[#727687] mt-1">{time} • Online</p>
                    </div>
                    <button type="button" className="text-[#0050cb] font-semibold text-[12px] px-4 py-2 border border-[#0050cb]/20 rounded-lg hover:bg-[#0050cb] hover:text-white transition-all shrink-0">
                      Ingatkan Saya
                    </button>
                  </div>
                );
              }) : (
                <div className="p-8 text-center bg-[#f2f3ff] rounded-xl border border-[#c2c6d8]/50">
                  <span className="material-symbols-outlined text-[32px] text-[#c2c6d8] mb-2 block">event_busy</span>
                  <p className="text-[14px] text-[#727687]">Belum ada jadwal tryout mendatang.</p>
                </div>
              )}
            </div>
          </div>

          {/* History & Stats Section — Redesigned */}
          <div className="lg:col-span-5 bg-white border border-[#e8e8e8] rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0px_10px_30px_rgba(0,102,255,0.05)] transition-shadow flex flex-col gap-8">
            {/* Header Row */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 flex items-center justify-center text-[#006e2f]">
                  <span className="material-symbols-outlined text-[28px]">insights</span>
                </div>
                <div>
                  <h2 className="text-[24px] font-semibold text-[#1a1c1c] leading-tight">Riwayat Skor</h2>
                  <p className="text-[14px] text-[#565e74] tracking-wide">Academic Performance Tracking</p>
                </div>
              </div>
              <div className="bg-[#f3f3f4] px-4 py-2 rounded-lg border border-[#e8e8e8] hidden sm:block">
                <span className="text-[12px] font-bold text-[#3d4a3d] uppercase tracking-wider leading-none">
                  LAST UPDATED: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Highlight Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="flex flex-col justify-center gap-2">
                <span className="text-[12px] font-bold text-[#565e74] uppercase tracking-wider">Skor Tertinggi Anda</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-[64px] font-bold text-[#0050cc] leading-none tracking-tight">{highestScore || '-'}</span>
                  {scoreChange !== 0 && (
                    <span className={`text-[14px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      scoreChange > 0
                        ? 'bg-[#22c55e]/20 text-[#006e2f]'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <span className="material-symbols-outlined text-sm">
                        {scoreChange > 0 ? 'trending_up' : 'trending_down'}
                      </span>
                      {scoreChange > 0 ? '+' : ''}{scoreChange}%
                    </span>
                  )}
                </div>
              </div>
              {/* Minimalist Micro-Chart bars */}
              <div className="flex items-end justify-start md:justify-end gap-1.5 pb-4">
                {chartData.length > 0 ? (
                  chartData.map((d, i) => {
                    const heightPct = Math.max(15, (d.score / maxChartScore) * 100);
                    const isLast = i === chartData.length - 1;
                    return (
                      <div
                        key={i}
                        className={`w-3 rounded-full transition-all duration-500 relative group ${
                          isLast
                            ? 'bg-[#006e2f]'
                            : i >= chartData.length - 3
                              ? 'bg-[#006e2f]/60'
                              : i >= chartData.length - 4
                                ? 'bg-[#006e2f]/40'
                                : 'bg-[#e8e8e8]'
                        }`}
                        style={{ height: `${heightPct * 1.28}px`, minHeight: '12px', maxHeight: '128px' }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1a1c1c] text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {d.score}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="w-3 bg-[#e8e8e8] h-12 rounded-full"></div>
                    <div className="w-3 bg-[#e8e8e8] h-16 rounded-full"></div>
                    <div className="w-3 bg-[#e8e8e8] h-10 rounded-full"></div>
                    <div className="w-3 bg-[#e8e8e8] h-20 rounded-full"></div>
                    <div className="w-3 bg-[#e8e8e8] h-14 rounded-full"></div>
                  </>
                )}
              </div>
            </div>

            {/* Premium Progress Line */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[14px] text-[#1a1c1c] font-semibold">
                  {recentHistory.length > 0 ? recentHistory[0].name : 'Tryout Free STUBIA'}
                </span>
                <span className="text-[14px] text-[#0050cc] font-bold">
                  {recentHistory.length > 0 ? recentHistory[0].score : highestScore || 0} / 1000
                </span>
              </div>
              {/* Progress Bar */}
              <div className="relative w-full h-3 bg-[#22c55e]/10 rounded-full overflow-hidden">
                {/* Subtle Grid Markers */}
                <div className="absolute inset-0 flex justify-between px-1 opacity-20 pointer-events-none">
                  <div className="w-0.5 h-full bg-[#1a1c1c]"></div>
                  <div className="w-0.5 h-full bg-[#1a1c1c]"></div>
                  <div className="w-0.5 h-full bg-[#1a1c1c]"></div>
                  <div className="w-0.5 h-full bg-[#1a1c1c]"></div>
                </div>
                {/* Active Progress */}
                <div
                  className="h-full bg-[#006e2f] rounded-full shadow-[0_0_12px_rgba(0,110,47,0.3)] transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, Math.max(2, ((recentHistory.length > 0 ? recentHistory[0].score : highestScore || 0) / 1000) * 100))}%` }}
                ></div>
              </div>
              {/* Tooltip-style Marker */}
              {highestScore > 0 && (
                <div className="flex justify-end -mt-1" style={{ paddingRight: `${Math.max(2, 100 - ((highestScore / 1000) * 100))}%` }}>
                  <div className="bg-[#1a1c1c] text-white px-2 py-1 rounded text-[10px] font-bold relative">
                    TOP {Math.max(1, Math.round(100 - (highestScore / 1000) * 100))}%
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#1a1c1c]"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
};

export default PusatTryout;
