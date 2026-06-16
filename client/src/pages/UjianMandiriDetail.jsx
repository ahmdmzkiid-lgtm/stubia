import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ujianMandiriService, tryoutService } from '../services/api';
import { getStatusConfig } from '../data/ujianMandiriData';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import TryoutVerificationModal from '../components/tryout/TryoutVerificationModal';
import NotificationDropdown from '../components/NotificationDropdown';
import StartConfirmationModal from '../components/StartConfirmationModal';

const PLAN_RANK = {
  gratis: 0,
  premium_um: 1,
  premium: 1,
  sultan: 2,
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

/* ─── Navbar (same pattern as all other pages) ─── */
const TopNavbar = ({ user, isAdmin, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const links = [
    { to: '/dashboard',      label: 'Dashboard' },
    { to: '/latihan',        label: 'Latihan' },
    { to: '/tryout/packages',label: 'Tryout' },
    { to: '/battle',         label: 'Battle' },
    { to: '/riwayat',        label: 'Riwayat' },
    { to: '/prediksi-skor',  label: 'Prediksi Skor' },
    { to: '/ujian-mandiri',  label: 'Ujian Mandiri', active: true },
  ];

  return (
    <>
      <header className={`fixed top-0 z-[100] w-full backdrop-blur-md transition-all duration-300 ${scrolled ? 'bg-[#faf8ff]/90 shadow-sm border-b border-[#c2c6d8]/30' : 'bg-[#faf8ff] border-b border-transparent'}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-6 lg:gap-12">
            <Link to="/dashboard" className="flex items-center"><img src="/eduzet-brand-light.svg" alt="Eduzet" className="h-8 sm:h-10 md:h-12" /></Link>
            <nav className="hidden lg:flex items-center space-x-8 text-[14px] font-medium">
              {links.map(l => (
                <Link key={l.to} to={l.to} className={l.active ? 'text-[#0050cb] border-b-2 border-[#0050cb] pb-1 transition-colors' : 'text-[#424656] hover:text-[#0050cb] transition-colors'}>{l.label}</Link>
              ))}
              {isAdmin && <Link to="/admin" className="text-[#a33200] hover:text-[#0050cb] transition-colors">Admin Panel</Link>}
            </nav>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-[14px] font-medium text-[#191b24]">{user?.name?.split(' ')[0]}</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  user?.current_plan === 'sultan' ? 'bg-yellow-100 text-yellow-700' :
                  user?.current_plan === 'premium' ? 'bg-blue-100 text-blue-600' :
                  user?.current_plan === 'premium_um' ? 'bg-teal-100 text-teal-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  <span className="material-symbols-outlined text-[10px]">
                    {user?.current_plan === 'sultan' ? 'star' : user?.current_plan === 'premium' ? 'diamond' : user?.current_plan === 'premium_um' ? 'target' : 'person'}
                  </span>
                  {user?.current_plan === 'sultan' ? 'Sultan' : user?.current_plan === 'premium' ? 'Premium' : user?.current_plan === 'premium_um' ? 'Premium UM' : 'Gratis'}
                </span>
              </div>
              <div className={`relative w-10 h-10 rounded-full bg-[#0050cb] flex items-center justify-center text-white font-bold text-sm border-2 ${
                user?.current_plan === 'sultan' ? 'border-yellow-400' : user?.current_plan === 'premium' ? 'border-blue-400' : user?.current_plan === 'premium_um' ? 'border-teal-400' : 'border-transparent'
              }`}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                {(user?.current_plan === 'premium' || user?.current_plan === 'premium_um' || user?.current_plan === 'sultan') && (
                  <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                    user?.current_plan === 'sultan' ? 'bg-yellow-400 text-yellow-900' : user?.current_plan === 'premium_um' ? 'bg-teal-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {user?.current_plan === 'sultan' ? 'star' : user?.current_plan === 'premium_um' ? 'target' : 'diamond'}
                    </span>
                  </span>
                )}
              </div>
              <NotificationDropdown />
            </div>
            <button type="button" onClick={onLogout} className="hidden sm:flex text-[#424656] hover:text-[#ba1a1a] transition-colors items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full text-[#424656]">
              <span className="material-symbols-outlined text-[24px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[99] bg-black/50 lg:hidden animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 right-0 bg-white rounded-b-[32px] shadow-2xl p-6 pt-20 animate-slide-down" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <Link to="/dashboard" className="flex items-center"><img src="/eduzet-brand-light.svg" alt="Eduzet" className="h-8" /></Link>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {links.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileMenuOpen(false)} className={`px-5 py-4 rounded-2xl text-[16px] font-bold transition-colors ${l.active ? 'bg-[#dae1ff] text-[#0050cb]' : 'text-[#424656] hover:bg-[#f2f3ff]'}`}>{l.label}</Link>
              ))}
              {isAdmin && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-5 py-4 rounded-2xl text-[16px] font-bold text-[#a33200] hover:bg-[#f2f3ff]">Admin Panel</Link>}
            </nav>
            <hr className="my-6 border-[#c2c6d8]/30" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0050cb] flex items-center justify-center text-white font-bold text-lg">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#191b24]">{user?.name?.split(' ')[0]}</p>
                  <span className="text-[12px] font-bold uppercase text-[#727687]">
                    {user?.current_plan === 'premium_um' ? 'Premium UM' : (user?.current_plan || 'Gratis')}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => { setMobileMenuOpen(false); onLogout(); }} className="px-6 py-3 rounded-xl text-[14px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 border border-red-100">
                <span className="material-symbols-outlined text-[18px]">logout</span> Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ─── Main Page ─── */
export default function UjianMandiriDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [ujian, setUjian] = useState(null);
  const [tryoutPackages, setTryoutPackages] = useState([]);
  const [latihanSoal, setLatihanSoal] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPkg, setSelectedPkg] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [hasConfirmedStart, setHasConfirmedStart] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // 'tryout' | 'latihan'
  const [confirmData, setConfirmData] = useState(null); // item to start (pkg or lat)

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
    if (reqRank > userRank) {
      toast.error(`Tryout ini khusus paket ${reqPlan === 'sultan' ? 'Sultan' : 'Premium'}.`);
      return;
    }

    if (userPlan === 'gratis') {
      setSelectedPkg(pkg);
      setCheckingRegistration(pkg.id);
      try {
        const regRes = await tryoutService.getRegistrationStatus('um', pkg.id);
        const status = regRes.data?.data;
        setRegistrationStatus(status);
        if (!status || status.status !== 'approved' || !hasConfirmedStart) {
          setShowVerificationModal(true);
        } else {
          // If approved and confirmed, open confirmation modal
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
        const [ujianRes, tryoutRes, latihanRes] = await Promise.all([
          ujianMandiriService.getById(id),
          ujianMandiriService.getTryoutPackages(id),
          ujianMandiriService.getLatihan(id),
        ]);
        if (!ujianRes.data.data) {
          navigate('/ujian-mandiri');
          return;
        }
        setUjian(ujianRes.data.data);
        const pkgList = (tryoutRes.data.data || []).filter(p => p.is_active !== false);
        const latList = (latihanRes.data.data || []).filter(l => l.is_active !== false);
        setTryoutPackages(pkgList);
        setLatihanSoal(latList);
      } catch (err) {
        console.error('Failed to fetch ujian mandiri detail:', err);
        navigate('/ujian-mandiri');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

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

  const renderLatihanCard = (lat) => {
    const reqPlan = lat.required_plan || 'gratis';
    const badge = PLAN_BADGE[reqPlan] || PLAN_BADGE.gratis;
    const reqRank = PLAN_RANK[reqPlan] ?? 0;
    const locked = reqRank > userRank;
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

    return (
      <div
        key={lat.id}
        className="bg-white border border-[#e5e2e3] rounded-xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.08)] flex flex-col p-4 gap-3 hover:border-[#0050cb]/40 transition-all"
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] block text-[#0050cb] mb-1">{lat.category || 'Latihan Mandiri'}</span>
            <h3 className="text-[15px] font-semibold text-[#191b24] whitespace-normal">{lat.title}</h3>
            <p className="text-[12px] text-[#424656] line-clamp-2">{lat.description}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {inactive && (
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-1 rounded bg-[#f5f3f4] text-[#727687] border border-[#e5e2e3]">Non-aktif</span>
            )}
            {!inactive && locked && (
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-1 rounded bg-[#f5f3f4] text-[#727687] border border-[#e5e2e3]">
                {reqPlan === 'sultan' ? 'Khusus Sultan' : 'Khusus Premium'}
              </span>
            )}
            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 rounded ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#727687]">
          <span>{lat.soal_count || 0} Soal</span>
          <span>•</span>
          <span className="font-mono bg-[#f6f3f4] px-2 py-1 rounded border border-[#e5e2e3] text-[10px]">
            +{lat.points_correct ?? 1} | {lat.points_incorrect ?? 0} | {lat.points_unanswered ?? 0}
          </span>
        </div>

        <div className="py-2 border-y border-[#e5e2e3] flex justify-between items-center">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-[#727687]">Terakhir</span>
            <div className="text-[18px] font-bold text-[#0050cb] leading-tight">{lastScore ?? 'Belum ada'}</div>
          </div>
          <div className="text-right text-[10px] font-mono text-[#424656] leading-tight">
            {lastCounts ? (
              <div className="bg-[#f6f3f4] px-2 py-1 rounded border border-[#e5e2e3] inline-flex items-center gap-2">
                <span className="text-green-700">B:{lastCounts.benar}</span>
                <span className="text-[#ba1a1a]">S:{lastCounts.salah}</span>
                <span className="text-[#727687]">K:{lastCounts.kosong}</span>
              </div>
            ) : (
              <span className="text-[#727687]">Belum ada detail</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            type="button"
            onClick={handleLatihanClick}
            disabled={inactive || locked}
            className={`py-2.5 rounded-md font-bold text-[12px] flex items-center justify-center gap-2 transition-all ${
              inactive || locked
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[#0050cb] text-white hover:bg-[#003fa4]'
            }`}
          >
            {lastScore ? 'Mulai Lagi' : 'Mulai'}
          </button>
          <button
            type="button"
            onClick={() => lastAttempt && navigate(`/ujian-mandiri/${id}/latihan/${lat.id}/hasil/${lastAttempt.id}`)}
            disabled={!lastAttempt}
            className={`py-2.5 rounded-md font-bold text-[12px] border transition-all flex items-center justify-center gap-2 ${
              lastAttempt
                ? 'border-[#c2c6d8] text-[#424656] hover:bg-[#f2f3ff]'
                : 'border-[#e5e2e3] text-gray-400 cursor-not-allowed'
            }`}
          >
            Hasil
          </button>
        </div>
      </div>
    );
  };

  // Helper to group latihan by package_name
  const groupByPackage = (list) => {
    const groups = {};
    list.forEach(lat => {
      const pkg = lat.package_name || 'Paket 1';
      if (!groups[pkg]) groups[pkg] = [];
      groups[pkg].push(lat);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  const gratisLatihan = latihanSoal.filter(lat => (lat.required_plan || 'gratis') === 'gratis');
  const premiumLatihan = latihanSoal.filter(lat => (lat.required_plan || 'gratis') === 'premium');
  const sultanLatihan = latihanSoal.filter(lat => (lat.required_plan || 'gratis') === 'sultan');

  const renderPackageGroups = (list) => {
    const packages = groupByPackage(list);
    if (packages.length <= 1) {
      // Only one package or no package — render flat grid without header
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {list.map(renderLatihanCard)}
        </div>
      );
    }
    return (
      <div className="space-y-8">
        {packages.map(([pkgName, items]) => (
          <div key={pkgName}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px] text-[#0050cb]">inventory_2</span>
              <h4 className="text-[16px] font-bold text-[#191b24]">{pkgName}</h4>
              <span className="text-[11px] text-[#727687] bg-[#f2f3ff] px-2 py-0.5 rounded-full">{items.length} soal</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {items.map(renderLatihanCard)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8FF]">
      <TopNavbar user={user} isAdmin={isAdmin} onLogout={handleLogout} />

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
            Simulasi Tryout
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

        {/* Paket Tryout Tersedia */}
        <section className="mb-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-[24px] lg:text-[32px] font-bold text-[#191b24] leading-tight">Tryout Tersedia</h2>
            <span className="text-[14px] lg:text-[16px] text-[#0050cb] font-semibold cursor-pointer hover:underline">Lihat Semua</span>
          </div>
          <div className="space-y-6">
            {tryoutPackages.length > 0 ? (
              tryoutPackages.map((pkg) => {
                const reqPlan = pkg.required_plan || 'gratis';
                const badge = PLAN_BADGE[reqPlan] || PLAN_BADGE.gratis;
                const lastAttempt = pkg.user_history?.[0];
                const lastScore = lastAttempt?.score;
                const lastCounts = getAttemptCounts(lastAttempt);
                const inactive = pkg.is_active === false;
                const locked = (PLAN_RANK[reqPlan] ?? 0) > userRank;

                return (
                  <article
                    key={pkg.id}
                    className="bg-white border border-[#e5e2e3] rounded-xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.08)] p-5 lg:p-6 flex flex-col gap-4 hover:border-[#0050cb]/40 transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="text-[16px] lg:text-[18px] font-semibold text-[#191b24] whitespace-normal">{pkg.title}</h3>
                        <p className="text-[12px] lg:text-[13px] text-[#424656] line-clamp-2">{pkg.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {inactive && (
                          <span className="text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-1 rounded bg-[#f5f3f4] text-[#727687] border border-[#e5e2e3]">Non-aktif</span>
                        )}
                        {!inactive && locked && (
                          <span className="text-[9px] font-bold uppercase tracking-[0.16em] px-2 py-1 rounded bg-[#f5f3f4] text-[#727687] border border-[#e5e2e3]">
                            {reqPlan === 'sultan' ? 'Khusus Sultan' : 'Khusus Premium'}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 rounded ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#727687]">
                      <span>{pkg.duration || 0}m</span>
                      <span>•</span>
                      <span>{pkg.soal_count || 0} Soal</span>
                    </div>

                    <div className="py-3 border-y border-[#e5e2e3] flex justify-between items-center">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#727687]">Terakhir</span>
                        <div className="text-[20px] font-bold text-[#0050cb] leading-tight">{lastScore ?? 'Belum ada'}</div>
                      </div>
                      <div className="text-right text-[10px] font-mono text-[#424656] leading-tight">
                        {lastCounts ? (
                          <div className="bg-[#f6f3f4] px-2 py-1 rounded border border-[#e5e2e3] inline-flex items-center gap-2">
                            <span className="text-green-700">B:{lastCounts.benar}</span>
                            <span className="text-[#ba1a1a]">S:{lastCounts.salah}</span>
                            <span className="text-[#727687]">K:{lastCounts.kosong}</span>
                          </div>
                        ) : (
                          <span className="text-[#727687]">Belum ada detail</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartTryout(pkg)}
                        disabled={inactive || locked || checkingRegistration !== false}
                        className={`py-2.5 rounded-md font-bold text-[12px] flex items-center justify-center gap-2 transition-all ${
                          inactive || locked || checkingRegistration !== false
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-[#0050cb] text-white hover:bg-[#003fa4]'
                        }`}
                      >
                        {checkingRegistration === pkg.id ? 'Memeriksa...' : (lastScore ? 'Mulai Lagi' : 'Mulai')}
                      </button>
                      <button
                        type="button"
                        onClick={() => lastAttempt && navigate(`/ujian-mandiri/${ujian.id}/tryout/${pkg.id}/hasil/${lastAttempt.id}`)}
                        disabled={!lastAttempt}
                        className={`py-2.5 rounded-md font-bold text-[12px] border transition-all flex items-center justify-center gap-2 ${
                          lastAttempt
                            ? 'border-[#c2c6d8] text-[#424656] hover:bg-[#f2f3ff]'
                            : 'border-[#e5e2e3] text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Hasil
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-[#e5e2e3]">
                <span className="material-symbols-outlined text-[48px] text-[#c2c6d8] mb-2">quiz</span>
                <p className="text-[#727687]">Belum ada paket tryout tersedia untuk ujian ini.</p>
              </div>
            )}
          </div>
        </section>

        {/* Latihan Soal Mandiri */}
        <section className="mb-16">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-[24px] lg:text-[32px] font-bold text-[#191b24] leading-tight">Latihan Soal Mandiri</h2>
          </div>
          <div className="space-y-10">
            {latihanSoal.length > 0 ? (
              <>
                {gratisLatihan.length > 0 && (
                  <div>
                    <h3 className="text-[20px] font-bold text-[#191b24] mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#0050cb]">lock_open</span>
                      Gratis
                    </h3>
                    {renderPackageGroups(gratisLatihan)}
                  </div>
                )}

                {premiumLatihan.length > 0 && (
                  <div>
                    <h3 className="text-[20px] font-bold text-[#191b24] mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600">diamond</span>
                      Premium
                    </h3>
                    {renderPackageGroups(premiumLatihan)}
                  </div>
                )}

                {sultanLatihan.length > 0 && (
                  <div>
                    <h3 className="text-[20px] font-bold text-[#191b24] mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-yellow-600">star</span>
                      Sultan
                    </h3>
                    {renderPackageGroups(sultanLatihan)}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-[#e5e2e3]">
                <span className="material-symbols-outlined text-[48px] text-[#c2c6d8] mb-2">menu_book</span>
                <p className="text-[#727687]">Belum ada latihan soal tersedia untuk ujian ini.</p>
              </div>
            )}
          </div>
        </section>

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

      {user?.current_plan === 'gratis' && (
        <TryoutVerificationModal
          open={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          packageType="um"
          packageId={selectedPkg?.id}
          packageTitle={selectedPkg?.title || 'Paket Tryout Ujian Mandiri'}
          registrationStatus={registrationStatus}
          onSubmitSuccess={fetchStatus}
          onConfirmStart={() => {
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
      />
    </div>
  );
}
