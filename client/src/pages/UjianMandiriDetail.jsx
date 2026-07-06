import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ujianMandiriService, tryoutService, subscriptionService } from '../services/api';
import { getStatusConfig } from '../data/ujianMandiriData';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import TryoutVerificationModal from '../components/tryout/TryoutVerificationModal';
import StudentNavbar from '../components/layout/StudentNavbar';
import StartConfirmationModal from '../components/StartConfirmationModal';

const PLAN_RANK = {
  gratis: 0,
  premium_um: 1, premium: 1,
  utbk_3m: 1, utbk_6m: 1, utbk_9m: 1, utbk_12m: 1,
  utbk_to_5x: 1, utbk_to_8x: 1, utbk_to_10x: 1,
  sultan: 2, um_to_all: 2, um_to_3x: 1,
};

const PLAN_BADGE = {
  gratis: {
    label: 'FREE',
    className: 'text-[#424656] bg-[#f6f3f4] border border-[#e5e2e3]',
  },
  premium: {
    label: 'PREMIUM',
    className: 'text-[#0050cb] bg-[#dae1ff] border border-[#c0c8f5]',
  },
  premium_um: {
    label: 'PREMIUM UM',
    className: 'text-teal-700 bg-teal-50 border border-teal-200',
  },
  sultan: {
    label: 'SULTAN',
    className: 'text-[#a33200] bg-[#ffdbd0] border border-[#f4b9a5]',
  },
  utbk_3m: { label: '3 BLN', className: 'text-[#0050cb] bg-[#dae1ff] border border-[#c0c8f5]' },
  utbk_6m: { label: '6 BLN', className: 'text-[#0050cb] bg-[#dae1ff] border border-[#c0c8f5]' },
  utbk_9m: { label: '9 BLN', className: 'text-[#0050cb] bg-[#dae1ff] border border-[#c0c8f5]' },
  utbk_12m: { label: '12 BLN', className: 'text-[#0050cb] bg-[#dae1ff] border border-[#c0c8f5]' },
  utbk_to_5x: { label: '5 TO', className: 'text-emerald-700 bg-emerald-50 border border-emerald-200' },
  utbk_to_8x: { label: '8 TO', className: 'text-emerald-700 bg-emerald-50 border border-emerald-200' },
  utbk_to_10x: { label: '10 TO', className: 'text-emerald-700 bg-emerald-50 border border-emerald-200' },
  um_to_all: { label: 'ALL UM', className: 'text-teal-700 bg-teal-50 border border-teal-200' },
  um_to_3x: { label: '3 TO UM', className: 'text-teal-700 bg-teal-50 border border-teal-200' },
};

const SUBTEST_ORDER = [
  'penalaran umum',
  'pengetahuan dan pemahaman umum',
  'pemahaman bacaan dan tulisan',
  'pengetahuan kuantitatif',
  'literasi bahasa indonesia',
  'literasi bahasa inggris',
  'penalaran matematika',
];

const SUBTEST_ICONS = {
  'penalaran umum': 'psychology',
  'pengetahuan dan pemahaman umum': 'public',
  'pemahaman bacaan dan tulisan': 'menu_book',
  'pengetahuan kuantitatif': 'bar_chart',
  'literasi bahasa indonesia': 'description',
  'literasi bahasa inggris': 'translate',
  'penalaran matematika': 'calculate',
};

const SUBTEST_COLORS = {
  'penalaran umum': { bg: '#EDE7F6', icon: '#5E35B1' },
  'pengetahuan dan pemahaman umum': { bg: '#E8F5E9', icon: '#2E7D32' },
  'pemahaman bacaan dan tulisan': { bg: '#FFF3E0', icon: '#E65100' },
  'pengetahuan kuantitatif': { bg: '#E3F2FD', icon: '#1565C0' },
  'literasi bahasa indonesia': { bg: '#FCE4EC', icon: '#AD1457' },
  'literasi bahasa inggris': { bg: '#E0F7FA', icon: '#00838F' },
  'penalaran matematika': { bg: '#F3E5F5', icon: '#7B1FA2' },
};

const getAttemptCounts = (attempt) => {
  if (!attempt) return null;
  let data = attempt.score_breakdown;
  try {
    data = typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    data = null;
  }
  if (!data) return null;
  const benar = data.benar ?? data.correct_count ?? data.correct ?? data.correctCount ?? null;
  const salah = data.salah ?? data.incorrect_count ?? data.incorrect ?? data.incorrectCount ?? null;
  const kosong = data.kosong ?? data.unanswered_count ?? data.unanswered ?? data.unansweredCount ?? null;
  if (benar === null && salah === null && kosong === null) return null;
  return {
    benar: benar ?? 0,
    salah: salah ?? 0,
    kosong: kosong ?? 0,
  };
};



const getTryoutConfirmedKey = (type, id) => `tryout_confirmed_${type}_${id}`;

/* ─── Main Page ─── */
export default function UjianMandiriDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const [ujian, setUjian] = useState(null);
  const [tryoutPackages, setTryoutPackages] = useState([]);
  const [latihanSoal, setLatihanSoal] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activePlans, setActivePlans] = useState([]);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [hasConfirmedStart, setHasConfirmedStart] = useState(false);
  const [packageCompletions, setPackageCompletions] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // 'tryout' | 'latihan'
  const [confirmData, setConfirmData] = useState(null); // item to start (pkg or lat)
  const [expandedSubtests, setExpandedSubtests] = useState({});
  const [activeTab, setActiveTab] = useState('tryout'); // 'tryout' | 'latihan'

  // Helper: check if user has a plan that satisfies the required plan name
  const hasPlanAccess = (requiredPlan) => {
    if (!requiredPlan || requiredPlan === 'gratis') return true;

    // Check if the user has Sultan (Sultan always has access to everything)
    const hasSultan = activePlans.some(p => {
      const name = p.name || p.plan_name;
      return name === 'sultan' || name === 'um_to_all';
    });
    if (hasSultan) return true;

    // Check if the user has a specific Ujian Mandiri plan (target_type === 'um')
    const hasUmPlan = activePlans.some(p => {
      const name = p.name || p.plan_name;
      return name !== 'gratis' && p.target_type === 'um';
    });
    if (hasUmPlan) return true;

    // Fall back to user.current_plan (e.g. if set in user profile directly)
    const userPlan = user?.current_plan || 'gratis';
    if (userPlan === 'sultan' || userPlan.startsWith('um_')) {
      const userRank = PLAN_RANK[userPlan] ?? 0;
      const reqRank = PLAN_RANK[requiredPlan] ?? 0;
      if (userRank >= reqRank) return true;
    }

    return false;
  };

  const fetchStatus = async () => {
    if (selectedPkg) {
      try {
        const regRes = await tryoutService.getRegistrationStatus('um', selectedPkg.id);
        setRegistrationStatus(regRes.data?.data);
      } catch (err) {
        console.error('Error fetching registration status:', err);
      }
    }
  };

  const userPlan = user?.current_plan || 'gratis';
  const userRank = PLAN_RANK[userPlan] ?? 0;

  const handleStartTryout = async (pkg) => {
    const reqPlan = pkg.required_plan || 'gratis';
    const reqRank = PLAN_RANK[reqPlan] ?? 0;
    if (pkg.is_active === false) {
      toast.error('Tryout sedang non-aktif.');
      return;
    }
    if (!hasPlanAccess(reqPlan)) {
      toast.error(`Tryout ini khusus paket ${reqPlan === 'sultan' ? 'Sultan' : 'Premium'}.`);
      return;
    }

    const hasUmAccess = hasUmAccessForFreeCheck();
    if (!hasUmAccess) {
      if (packageCompletions[pkg.id]) {
        toast.error('Akun gratis hanya dapat mengerjakan setiap paket tryout sebanyak 1 kali.');
        return;
      }
      setSelectedPkg(pkg);
      setCheckingRegistration(pkg.id);
      const confirmed = sessionStorage.getItem(getTryoutConfirmedKey('um', pkg.id)) === 'true';
      setHasConfirmedStart(confirmed);
      try {
        const regRes = await tryoutService.getRegistrationStatus('um', pkg.id);
        const status = regRes.data?.data;
        setRegistrationStatus(status);
        if (status?.completed) {
          setPackageCompletions(prev => ({ ...prev, [pkg.id]: true }));
          toast.error('Paket tryout ini sudah pernah diselesaikan.');
          return;
        }
        if (!status || status.status !== 'approved' || !confirmed) {
          setShowVerificationModal(true);
        } else {
          setConfirmType('tryout');
          setConfirmData(pkg);
          setConfirmOpen(true);
        }
      } catch (err) {
        toast.error('Gagal memeriksa status verifikasi');
      } finally {
        setCheckingRegistration(false);
      }
    } else {
      setConfirmType('tryout');
      setConfirmData(pkg);
      setConfirmOpen(true);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ujianRes, tryoutRes, latihanRes, activePlansRes] = await Promise.all([
          ujianMandiriService.getById(id),
          ujianMandiriService.getTryoutPackages(id),
          ujianMandiriService.getLatihan(id),
          subscriptionService.getActivePlans().catch(() => ({ data: { data: [] } })),
        ]);
        if (!ujianRes.data.data) {
          navigate('/ujian-mandiri');
          return;
        }
        setUjian(ujianRes.data.data);
        const pkgList = (tryoutRes.data.data || []).filter(p => p.is_active !== false);
        const sortedPkgs = [...pkgList].sort((a, b) => {
          const rankA = PLAN_RANK[a.required_plan || 'gratis'] ?? 0;
          const rankB = PLAN_RANK[b.required_plan || 'gratis'] ?? 0;
          return rankA - rankB;
        });
        const latList = (latihanRes.data.data || []).filter(l => l.is_active !== false);
        setTryoutPackages(sortedPkgs);
        setLatihanSoal(latList);
        setActivePlans(activePlansRes.data?.data || []);

        const completions = {};
        await Promise.all(
          pkgList.map(async (pkg) => {
            try {
              const regRes = await tryoutService.getRegistrationStatus('um', pkg.id);
              completions[pkg.id] = regRes.data?.data?.completed === true;
            } catch {
              completions[pkg.id] = false;
            }
          })
        );
        setPackageCompletions(completions);
      } catch (err) {
        console.error('Failed to fetch ujian mandiri detail:', err);
        navigate('/ujian-mandiri');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    const state = location.state;
    if (state?.showTryoutVerification && state?.tryoutId) {
      const pkg = tryoutPackages.find(p => p.id === state.tryoutId);
      if (pkg) {
        setSelectedPkg(pkg);
        setShowVerificationModal(true);
        tryoutService.getRegistrationStatus('um', pkg.id).then(res => {
          setRegistrationStatus(res.data?.data);
        }).catch(() => {});
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, tryoutPackages, location.pathname, navigate]);

  const hasUmAccessForFreeCheck = () => {
    // 1. Sultan always has unlimited access
    const hasSultan = activePlans.some(p => {
      const name = p.name || p.plan_name;
      return name === 'sultan' || name === 'um_to_all';
    });

    // 2. Any active plan that has target_type === 'um' with unlimited access
    const hasUmUnlimited = activePlans.some(p =>
      (p.name || p.plan_name) !== 'gratis' && p.target_type === 'um' && (p.plan_type === 'subscription' || p.plan_type === 'access')
    );

    // 3. Quota plans for Ujian Mandiri
    const hasUmQuota = activePlans.some(p =>
      p.target_type === 'um' && p.plan_type === 'quota' && (p.quota_remaining || 0) > 0
    );

    // 4. Fallback for user.current_plan directly on user object
    const userPlan = user?.current_plan || 'gratis';
    const hasUserAccess = userPlan === 'sultan' || userPlan.startsWith('um_');

    return hasSultan || hasUmUnlimited || hasUmQuota || hasUserAccess;
  };

  const getConfirmRules = () => {
    const defaultRules = [
      "Sesi pengerjaan akan dimulai langsung setelah Anda menekan tombol mulai.",
      "Koneksi internet yang stabil sangat disarankan selama pengerjaan.",
      "Jawaban Anda akan tersimpan otomatis setiap kali berpindah soal."
    ];

    if (confirmData) {
      const hasCompletedBefore = confirmData.user_history?.length > 0;
      if (hasCompletedBefore) {
        const hasUmUnlimited = activePlans.some(p =>
          (p.name || p.plan_name) !== 'gratis' && p.target_type === 'um' && (p.plan_type === 'subscription' || p.plan_type === 'access')
        );
        const hasUmQuota = activePlans.some(p =>
          p.target_type === 'um' && p.plan_type === 'quota' && (p.quota_remaining || 0) > 0
        );

        if (confirmType === 'tryout') {
          if (hasUmUnlimited) {
            return [
              "Sebagai pengguna Premium/Sultan, Anda dapat mengulang tryout ini kapan saja tanpa batas.",
              ...defaultRules.slice(1)
            ];
          } else if (hasUmQuota) {
            return [
              "Perhatian: Memulai kembali tryout ini akan mengurangi 1 kuota ujian mandiri Anda.",
              ...defaultRules.slice(1)
            ];
          }
        } else if (confirmType === 'latihan') {
          return [
            "Anda dapat mengulang latihan soal ini untuk meningkatkan pemahaman Anda.",
            ...defaultRules.slice(1)
          ];
        }
      }
    }
    return defaultRules;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading || !ujian) {
    return (
      <div className="min-h-screen bg-[#FAF8FF] flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-[48px] text-[#0050cb]">progress_activity</span>
      </div>
    );
  }

  const statusCfg = getStatusConfig(ujian.status);

  const getExercisePlan = (lat) => lat.required_plan || 'gratis';

  const matchesPlan = (plan, targetPlan) => {
    if (targetPlan === 'premium') {
      return plan === 'premium' || plan === 'premium_um';
    }
    return plan === targetPlan;
  };

  const buildSectionList = (targetPlan) => {
    const exercises = latihanSoal.filter(
      lat => lat.category !== 'package_placeholder' && matchesPlan(getExercisePlan(lat), targetPlan)
    );
    const pkgNames = new Set(exercises.map(lat => lat.package_name || 'Paket 1'));
    return latihanSoal.filter(lat =>
      lat.category === 'package_placeholder'
        ? pkgNames.has(lat.package_name || 'Paket 1')
        : matchesPlan(getExercisePlan(lat), targetPlan)
    );
  };

  const gratisLatihan = buildSectionList('gratis');
  const premiumLatihan = buildSectionList('premium');
  const sultanLatihan = buildSectionList('sultan');

  const renderLatihanCard = (lat) => {
    const reqPlan = getExercisePlan(lat);
    const badge = PLAN_BADGE[reqPlan] || PLAN_BADGE.gratis;
    const locked = !hasPlanAccess(reqPlan);
    const inactive = lat.is_active === false;
    const lastAttempt = lat.user_history?.[0];
    const lastScore = lastAttempt?.score;
    const lastCounts = getAttemptCounts(lastAttempt);

    const handleLatihanClick = () => {
      if (inactive) {
        toast.error('Latihan sedang non-aktif.');
        return;
      }
      if (locked) {
        toast.error(`Latihan ini khusus paket ${reqPlan === 'sultan' ? 'Sultan' : 'Premium'}.`);
        return;
      }
      setConfirmType('latihan');
      setConfirmData(lat);
      setConfirmOpen(true);
    };

    // Determine color palette based on category/subtest
    const catKey = (lat.category || '').toLowerCase();
    const subtestColor = SUBTEST_COLORS[catKey] || { bg: '#EEF2FF', icon: '#4338CA' };
    const subtestIcon = SUBTEST_ICONS[catKey] || lat.icon || 'neurology';

    // Cohesive blue brand accent gradient
    const accentGradient = 'from-blue-600 to-blue-400';

    return (
      <div
        key={lat.id}
        className={`relative bg-white rounded-xl flex flex-col overflow-hidden transition-all duration-300 group
          ${inactive ? 'opacity-60 grayscale-[30%]' : ''}
          border border-[#e2e8f0]/80
          hover:border-transparent
          shadow-[0_1px_2px_rgba(0,0,0,0.03)]
          hover:shadow-[0_8px_16px_-8px_rgba(0,51,153,0.1)]
          hover:-translate-y-0.5`}
      >
        {/* Top Accent Gradient Strip */}
        <div className={`h-0.5 w-full bg-gradient-to-r ${accentGradient} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

        <div className="p-3 flex flex-col gap-2 flex-1">
          {/* Header: Icon + Title */}
          <div className="flex items-start gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm bg-blue-50/50 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500"
            >
              <span
                className="material-symbols-outlined text-[16px] text-[#0050cb]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
              >
                {subtestIcon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-[8px] font-extrabold uppercase tracking-[0.12em] leading-none text-[#0050cb]"
                >
                  {lat.category || 'Latihan'}
                </span>
                <span className={`text-[7px] font-extrabold uppercase tracking-wider px-1 py-0.5 rounded-md ${badge.className}`}>
                  {badge.label}
                </span>
                {inactive && (
                  <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-md bg-slate-100 text-slate-400 border border-slate-200">Nonaktif</span>
                )}
                {!inactive && locked && (
                  <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-md bg-slate-100 text-slate-400 border border-slate-200">
                    <span className="material-symbols-outlined text-[7px] align-middle mr-0.5">lock</span>
                    {reqPlan === 'sultan' ? 'Sultan' : 'Premium'}
                  </span>
                )}
              </div>
              <h3 className="text-[12px] font-bold text-[#1e293b] leading-snug group-hover:text-[#0050cb] transition-colors duration-300 line-clamp-2 mt-0.5">{lat.title}</h3>
            </div>
          </div>

          {/* Description */}
          {lat.description && (
            <p className="text-[11px] text-[#64748b] leading-relaxed line-clamp-2">{lat.description}</p>
          )}

          {/* Stat Pills + Score compact */}
          <div className="flex items-center justify-between gap-2 mt-auto">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-100">
                <span className="material-symbols-outlined text-[12px] text-slate-400">quiz</span>
                {Number(lat.soal_count) || 0}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold bg-slate-50 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-100">
                <span className="text-slate-600 font-bold">+{lat.points_correct ?? 4}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-bold">{lat.points_incorrect ?? 0}</span>
              </span>
            </div>
            <div className={`text-[13px] font-extrabold leading-none ${lastScore != null ? 'text-[#0050cb]' : 'text-slate-300'}`}>
              {lastScore ?? '—'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleLatihanClick}
              disabled={inactive || locked}
              className={`py-1.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 transition-all duration-200 ${
                inactive || locked
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                  : 'bg-[#0050cb] hover:bg-[#003da6] text-white shadow-sm hover:shadow active:scale-95 cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">{locked ? 'lock' : 'play_arrow'}</span>
              {lastScore ? 'Ulangi' : 'Mulai'}
            </button>
            <button
              type="button"
              onClick={() => lastAttempt && navigate(`/ujian-mandiri/${id}/latihan/${lat.id}/hasil/${lastAttempt.id}`)}
              disabled={!lastAttempt}
              className={`py-1.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 border transition-all duration-200 ${
                lastAttempt
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97]'
                  : 'border-slate-100 text-slate-200 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">bar_chart</span>
              Hasil
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTryoutCard = (pkg) => {
    const reqPlan = pkg.required_plan || 'gratis';
    const badge = PLAN_BADGE[reqPlan] || PLAN_BADGE.gratis;
    const lastAttempt = pkg.user_history?.[0];
    const lastScore = lastAttempt?.score;
    const lastCounts = getAttemptCounts(lastAttempt);
    const isFreeCompleted = !hasUmAccessForFreeCheck() && packageCompletions[pkg.id];
    const inactive = pkg.is_active === false;
    const locked = !hasPlanAccess(reqPlan);

    const textAccentColor = (pkg.icon_color === '#FFE000' || pkg.icon_color === '#ffe000') ? '#b28900' : (pkg.icon_color || '#0050cb');

    return (
      <article
        key={pkg.id}
        className={`bg-white border border-slate-150 rounded-[2rem] overflow-hidden flex shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-w-[280px] md:min-w-0 flex-1 shrink-0 min-h-[175px] ${
          inactive ? 'opacity-60 grayscale-[30%]' : ''
        }`}
      >
        {/* Left Stripe */}
        <div 
          className="w-[30%] relative flex items-center justify-center overflow-hidden shrink-0" 
          style={{ backgroundColor: pkg.icon_color || '#FFE000' }}
        >
          {ujian.logo ? (
            <img src={ujian.logo} alt={`${ujian.universitas} Logo`} className="w-12 h-12 object-contain z-10" />
          ) : (
            <span className="material-symbols-outlined text-white text-[32px] z-10">school</span>
          )}
          {/* Decorative grid pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
        </div>

        {/* Right Content */}
        <div className="w-[70%] p-4 flex flex-col justify-between relative">
          {/* Top line with Category Badge */}
          <div className="flex justify-between items-start gap-2">
            <span 
              className="px-2 py-0.5 text-[8px] sm:text-[9px] font-black rounded-full uppercase" 
              style={{ 
                backgroundColor: `${pkg.icon_color || '#FFE000'}30`, 
                color: textAccentColor 
              }}
            >
              {badge.label}
            </span>
            {/* Lock / status badge */}
            {!inactive && locked && (
              <span className="text-[8px] text-slate-400 font-bold flex items-center gap-0.5 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded-md">
                <span className="material-symbols-outlined text-[10px]">lock</span>
                {reqPlan === 'sultan' ? 'Sultan' : 'Premium'}
              </span>
            )}
            {inactive && (
              <span className="text-[8px] text-slate-400 font-bold bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded-md">
                Nonaktif
              </span>
            )}
          </div>

          {/* Center Title & Description */}
          <div className="my-1.5">
            <h4 className="font-black text-sm text-[#191b24] line-clamp-1 leading-snug">{pkg.title}</h4>
            <p className="text-[10px] text-gray-500 font-semibold line-clamp-1 mt-0.5">{pkg.description}</p>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-2.5 text-[10px] text-gray-500 font-bold mb-1">
            <div className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px] text-slate-400">schedule</span>
              <span>{pkg.duration || 0}m</span>
            </div>
            <div className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px] text-slate-400">quiz</span>
              <span>{pkg.soal_count || 0} soal</span>
            </div>
            <div className="inline-flex items-center gap-1 text-[9px] font-semibold bg-slate-50 text-slate-500 px-2 py-0.5 rounded-lg border border-slate-100">
              <span className="text-slate-600 font-bold">+{pkg.points_correct ?? 4}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600 font-bold">{pkg.points_incorrect ?? -1}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 font-bold">{pkg.points_unanswered ?? 0}</span>
            </div>
          </div>

          {/* Score Container */}
          {lastAttempt && lastScore != null ? (
            <div className="flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-150/80 px-2 py-1 rounded-xl my-1">
              <div className="flex items-baseline gap-1">
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">Skor:</span>
                <span className="text-[13px] font-black text-[#0050cb]">{lastScore}</span>
              </div>
              <div className="inline-flex items-center gap-1 text-[9px] font-bold font-mono">
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
                  {lastCounts?.benar || 0}
                </span>
                <span className="text-rose-500 flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-rose-400 inline-block" />
                  {lastCounts?.salah || 0}
                </span>
                <span className="text-slate-400 flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                  {lastCounts?.kosong || 0}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-6 flex items-center text-[9px] text-slate-300 italic my-1">
              Belum dikerjakan
            </div>
          )}

          {/* Divider */}
          <hr className="border-gray-100 my-1" />

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStartTryout(pkg)}
              disabled={inactive || locked || checkingRegistration !== false}
              className={`flex-1 py-1.5 rounded-xl font-extrabold text-[10px] flex items-center justify-center gap-1 transition-all ${
                inactive || locked || checkingRegistration !== false
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                  : 'bg-[#0050cb] hover:bg-[#003da6] text-white shadow-sm hover:shadow active:scale-95 cursor-pointer'
              }`}
            >
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {checkingRegistration === pkg.id ? 'progress_activity' : locked ? 'lock' : 'play_arrow'}
              </span>
              {checkingRegistration === pkg.id ? 'Memeriksa...' : (lastScore ? 'Mulai Lagi' : 'Mulai')}
            </button>
            {lastAttempt && (
              <button
                type="button"
                onClick={() => navigate(`/ujian-mandiri/${ujian.id}/tryout/${pkg.id}/hasil/${lastAttempt.id}`)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-extrabold text-[10px] flex items-center justify-center gap-1 active:scale-[0.97] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[12px]">bar_chart</span>
                Hasil
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

  const renderPackageCards = (list) => {
    const packages = {};
    list.forEach(lat => {
      const pkg = lat.package_name || 'Paket 1';
      if (!packages[pkg]) packages[pkg] = [];
      packages[pkg].push(lat);
    });

    const packageNames = Object.keys(packages).sort();
    if (packageNames.length === 0) return null;

    return (
      <div className="space-y-4">
        {packageNames.map(pkgName => {
          const pkgItems = packages[pkgName];
          const placeholder = pkgItems.find(lat => lat.category === 'package_placeholder');
          const exercises = pkgItems.filter(lat => lat.category !== 'package_placeholder');
          
          if (exercises.length === 0 && !placeholder) return null;
          
          const isExpanded = expandedSubtests[pkgName] ?? false;
          const pkgDescription = placeholder?.description || 'Paket latihan soal mandiri.';
          const sectionPlan = getExercisePlan(exercises[0] || pkgItems.find(lat => lat.category !== 'package_placeholder') || {});
          const totalSoal = exercises.reduce((sum, lat) => sum + (Number(lat.soal_count) || 0), 0);

          // Plan-themed icon and gradient
          let iconName = 'folder_special';
          let iconGradient = 'from-blue-600 to-[#0050cb]';
          const accentColor = 'from-blue-500 to-[#0050cb]'; // Blue gradient only

          if (sectionPlan === 'premium' || sectionPlan === 'premium_um') {
            iconName = 'workspace_premium';
            iconGradient = 'from-indigo-600 via-blue-500 to-cyan-400';
          } else if (sectionPlan === 'sultan') {
            iconName = 'military_tech';
            iconGradient = 'from-amber-500 via-orange-500 to-yellow-400';
          }

          const badge = PLAN_BADGE[sectionPlan] || PLAN_BADGE.gratis;
          
          return (
            <div
              key={pkgName}
              className={`relative bg-white rounded-2xl overflow-hidden transition-all duration-500
                border border-[#e2e8f0]/80
                shadow-[0_1px_3px_rgba(0,0,0,0.04)]
                ${isExpanded 
                  ? 'shadow-[0_20px_40px_-12px_rgba(0,51,153,0.08)] border-[#e2e8f0]/40' 
                  : 'hover:shadow-[0_12px_24px_rgba(0,51,153,0.06)] hover:border-transparent'
                }`}
            >
              {/* Left Accent Bar - animated */}
              <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${accentColor} rounded-r-full transition-all duration-500 ${
                isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
              }`} />

              {/* Package Card Header — clickable to expand/collapse */}
              <button
                type="button"
                onClick={() => setExpandedSubtests(prev => ({ [pkgName]: !prev[pkgName] }))}
                className="w-full flex items-center gap-5 p-5 lg:p-6 text-left transition-colors duration-300 relative group"
              >
                {/* Premium Icon Container */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${iconGradient} text-white shadow-lg shadow-indigo-500/10 transform group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500`}
                >
                  <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>{iconName}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <h4 className="text-[16px] lg:text-[18px] font-bold text-[#1e293b] tracking-tight group-hover:text-[#0050cb] transition-colors duration-300">{pkgName}</h4>
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md ${badge.className} shadow-sm shrink-0`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#64748b] mt-1 line-clamp-1 font-medium">{pkgDescription}</p>
                  
                  {/* Elegant Stats Display */}
                  <div className="flex items-center gap-2.5 mt-2.5">
                    <div className="inline-flex items-center gap-1.5 text-[11px] bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-100">
                      <span className="material-symbols-outlined text-[14px] text-slate-400" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>quiz</span>
                      <span className="font-semibold">{totalSoal}</span> soal
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] bg-slate-50 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-100">
                      <span className="material-symbols-outlined text-[14px] text-slate-400" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>topic</span>
                      <span className="font-semibold">{exercises.length}</span> latihan
                    </div>
                  </div>
                </div>

                {/* Polished Expand/Collapse Button */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isExpanded 
                    ? 'bg-[#0050cb] text-white shadow-md shadow-blue-500/15 ring-4 ring-blue-500/5' 
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-[#0050cb]'
                }`}>
                  <span
                    className={`material-symbols-outlined text-[20px] transition-transform duration-400 ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    expand_more
                  </span>
                </div>
              </button>

              {/* Expanded Content: list of exercises inside */}
              {isExpanded && (
                <div className="border-t border-slate-100/80 p-5 lg:p-6 bg-gradient-to-b from-slate-50/40 to-white">
                  {exercises.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {exercises.map(lat => renderLatihanCard(lat))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-200">
                      <span className="material-symbols-outlined text-[40px] text-slate-300 mb-2" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>folder_open</span>
                      <p className="text-[#64748b] text-[13px] font-medium">Belum ada latihan soal tersedia dalam paket ini.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8FF]">
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={handleLogout} />

      <main className="max-w-[1280px] mx-auto px-6 lg:px-16 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8">
          <Link to="/ujian-mandiri" className="text-[12px] font-bold text-[#424656] uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity">
            Ujian Mandiri
          </Link>
          <span className="material-symbols-outlined text-[16px] text-[#727687]">chevron_right</span>
          <span className="text-[12px] font-bold text-[#424656] uppercase tracking-wider opacity-60">
            {ujian.nama_ujian}
          </span>
          <span className="material-symbols-outlined text-[16px] text-[#727687]">chevron_right</span>
          <span className="text-[12px] font-bold text-[#0050cb] uppercase tracking-wider">
            {activeTab === 'tryout' ? 'Simulasi Tryout' : 'Latihan Soal'}
          </span>
        </nav>

        {/* Hero Banner */}
        <section className="relative w-full aspect-[16/10] sm:aspect-[21/9] rounded-xl overflow-hidden mb-16 shadow-[0_24px_48px_-12px_rgba(0,51,153,0.12)] group">
          <img
            src={ujian.image || 'https://images.unsplash.com/photo-1562774053-701939374585?w=800'}
            alt={ujian.universitas}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0050cb]/90 to-transparent flex flex-col justify-center p-6 sm:px-8 lg:px-16 text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full w-fit mb-3 sm:mb-6">
              <span className={`w-2 h-2 rounded-full ${ujian.status === 'open' ? 'bg-[#FFC600] animate-pulse' : ujian.status === 'coming-soon' ? 'bg-[#765a00]' : 'bg-[#D90429]'}`}></span>
              <span className="text-[10px] sm:text-[12px] font-bold uppercase tracking-wider">{statusCfg.label}</span>
            </div>
            <h1 className="text-[20px] sm:text-[32px] lg:text-[64px] font-extrabold leading-[1.2] sm:leading-[1.1] tracking-tight max-w-2xl mb-2 sm:mb-4">
              Simulasi UJIAN MANDIRI<br />{ujian.nama_ujian} {new Date().getFullYear()}
            </h1>
            <p className="text-[12px] sm:text-[14px] lg:text-[16px] max-w-xl opacity-90 leading-relaxed line-clamp-2 sm:line-clamp-none">
              Persiapkan diri Anda menghadapi seleksi paling prestisius dengan bank soal terakurat dan sistem penilaian IRT standar nasional.
            </p>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1.5 bg-[#f0f1f7] rounded-2xl mb-10 max-w-md mx-auto sm:mx-0 shadow-sm border border-slate-100/50">
          <button
            onClick={() => setActiveTab('tryout')}
            className={`flex-1 py-3 px-4 rounded-xl text-[13px] font-extrabold transition-all flex items-center justify-center gap-2 border-none outline-none cursor-pointer ${
              activeTab === 'tryout'
                ? 'bg-white text-[#0050cb] shadow-sm'
                : 'text-[#727687] hover:text-[#424656] bg-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">emoji_events</span>
            Tryout Tersedia
          </button>
          <button
            onClick={() => setActiveTab('latihan')}
            className={`flex-1 py-3 px-4 rounded-xl text-[13px] font-extrabold transition-all flex items-center justify-center gap-2 border-none outline-none cursor-pointer ${
              activeTab === 'latihan'
                ? 'bg-white text-[#0050cb] shadow-sm'
                : 'text-[#727687] hover:text-[#424656] bg-transparent'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            Latihan Soal
          </button>
        </div>

        {/* Paket Tryout Tersedia */}
        {activeTab === 'tryout' && (
          <section className="mb-16">
            <div className="flex justify-between items-end mb-8">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-[#0050cb] flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>emoji_events</span>
                  </div>
                  <h2 className="text-[24px] lg:text-[32px] font-bold text-[#191b24] leading-tight tracking-tight">Tryout Tersedia</h2>
                </div>
                <p className="text-[13px] text-slate-500 font-medium ml-[42px]">Simulasi ujian lengkap dengan timer dan penilaian.</p>
              </div>
            </div>
            {tryoutPackages.length > 0 ? (
              <div className="space-y-10">
                {/* Ujian Serentak Gratis */}
                {tryoutPackages.filter(p => !p.required_plan || p.required_plan === 'gratis').length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-bold text-[#191b24] mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
                      <span className="tracking-tight">Ujian Serentak Gratis</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tryoutPackages
                        .filter(p => !p.required_plan || p.required_plan === 'gratis')
                        .map(pkg => renderTryoutCard(pkg))}
                    </div>
                  </div>
                )}

                {/* Tryout (Premium/Sultan) */}
                {tryoutPackages.filter(p => p.required_plan && p.required_plan !== 'gratis').length > 0 && (
                  <div>
                    <h3 className="text-[14px] font-bold text-[#191b24] mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
                      <span className="tracking-tight">Tryout</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tryoutPackages
                        .filter(p => p.required_plan && p.required_plan !== 'gratis')
                        .map(pkg => renderTryoutCard(pkg))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="col-span-full text-center py-16 bg-gradient-to-b from-slate-50/40 to-white rounded-2xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-[52px] text-slate-300 mb-3" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>emoji_events</span>
                <p className="text-slate-500 font-medium text-[14px]">Belum ada paket tryout tersedia untuk ujian ini.</p>
                <p className="text-slate-400 text-[12px] mt-1">Tryout akan segera tersedia, stay tuned!</p>
              </div>
            )}
          </section>
        )}

        {/* Latihan Soal Mandiri */}
        {activeTab === 'latihan' && (
          <section className="mb-16">
            <div className="flex justify-between items-end mb-8">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>menu_book</span>
                  </div>
                  <h2 className="text-[24px] lg:text-[32px] font-bold text-[#191b24] leading-tight tracking-tight">Latihan Soal Mandiri</h2>
                </div>
                <p className="text-[13px] text-slate-500 font-medium ml-[42px]">Latihan tanpa batas waktu untuk menguasai materi.</p>
              </div>
            </div>
            <div className="space-y-10">
              {latihanSoal.length > 0 ? (
                <>
                  {gratisLatihan.length > 0 && (
                    <div>
                      <h3 className="text-[14px] font-bold text-[#191b24] mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock_open</span>
                        <span className="tracking-tight">Gratis</span>
                      </h3>
                      {renderPackageCards(gratisLatihan)}
                    </div>
                  )}

                  {premiumLatihan.length > 0 && (
                    <div>
                      <h3 className="text-[14px] font-bold text-[#191b24] mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
                        <span className="tracking-tight">Premium</span>
                      </h3>
                      {renderPackageCards(premiumLatihan)}
                    </div>
                  )}

                  {sultanLatihan.length > 0 && (
                    <div>
                      <h3 className="text-[14px] font-bold text-[#191b24] mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500 text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
                        <span className="tracking-tight">Sultan</span>
                      </h3>
                      {renderPackageCards(sultanLatihan)}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-gradient-to-b from-slate-50/40 to-white rounded-2xl border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-[52px] text-slate-300 mb-3" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>menu_book</span>
                  <p className="text-slate-500 font-medium text-[14px]">Belum ada latihan soal tersedia untuk ujian ini.</p>
                  <p className="text-slate-400 text-[12px] mt-1">Latihan soal akan segera tersedia.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Back Button */}
        <div className="flex justify-center">
          <Link
            to="/ujian-mandiri"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#c2c6d8] rounded-xl text-[#424656] font-bold hover:bg-[#f2f3ff] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali ke Daftar Ujian Mandiri
          </Link>
        </div>
      </main>

      <Footer />

      {!activePlans.some(p =>
        (p.name || p.plan_name) !== 'gratis' && p.target_type === 'um' && (p.plan_type === 'subscription' || p.plan_type === 'access')
      ) && !activePlans.some(p =>
        p.target_type === 'um' && p.plan_type === 'quota' && (p.quota_remaining || 0) > 0
      ) && (
        <TryoutVerificationModal
          open={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          packageType="um"
          packageId={selectedPkg?.id}
          packageTitle={selectedPkg?.title || 'Paket Tryout Ujian Mandiri'}
          registrationStatus={registrationStatus}
          onSubmitSuccess={fetchStatus}
          onConfirmStart={() => {
            if (selectedPkg) {
              sessionStorage.setItem(getTryoutConfirmedKey('um', selectedPkg.id), 'true');
            }
            setHasConfirmedStart(true);
            setShowVerificationModal(false);
            if (selectedPkg) {
              setConfirmType('tryout');
              setConfirmData(selectedPkg);
              setConfirmOpen(true);
            }
          }}
        />
      )}

      <StartConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          if (confirmData) {
            if (confirmType === 'tryout') {
              navigate(`/ujian-mandiri/${id}/tryout/${confirmData.id}`);
            } else if (confirmType === 'latihan') {
              navigate(`/ujian-mandiri/${id}/latihan/${confirmData.id}`);
            }
          }
        }}
        title={confirmType === 'tryout' ? "Apakah Anda yakin ingin memulai tryout?" : "Apakah Anda yakin ingin memulai latihan?"}
        subtitle={confirmData?.title}
        details={[
          { label: 'Jumlah Soal', value: `${confirmData?.soal_count || 0} soal`, icon: 'description' },
          { label: 'Durasi', value: confirmType === 'tryout' ? `${confirmData?.duration || 0} menit` : 'Tanpa Batasan', icon: 'schedule' }
        ]}
        rules={getConfirmRules()}
      />
    </div>
  );
}
