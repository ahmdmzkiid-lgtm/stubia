import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { tryoutService, subjectService, subscriptionService } from '../../services/api';
import toast from 'react-hot-toast';
import TryoutVerificationModal from '../../components/tryout/TryoutVerificationModal';
import StudentNavbar from '../../components/layout/StudentNavbar';
import StartConfirmationModal from '../../components/StartConfirmationModal';
import { PTN_DATA } from '../../data/ptnData';


const ICON_MAP = {
  'penalaran umum': 'psychology',
  'pengetahuan dan pemahaman umum': 'auto_stories',
  'pemahaman bacaan dan tulisan': 'edit_note',
  'pengetahuan kuantitatif': 'calculate',
  'literasi bahasa indonesia': 'translate',
  'literasi bahasa inggris': 'language',
  'penalaran matematika': 'functions',
};

const CATEGORY_MAP = {
  'penalaran umum': 'Kognitif',
  'pengetahuan dan pemahaman umum': 'Linguistik',
  'pemahaman bacaan dan tulisan': 'Literasi',
  'pengetahuan kuantitatif': 'Logika',
  'literasi bahasa indonesia': 'Bahasa',
  'literasi bahasa inggris': 'Global',
  'penalaran matematika': 'Analitik',
};

const getTryoutConfirmedKey = (type, id) => `tryout_confirmed_${type}_${id}`;

const TryoutSubtesSelect = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const [pkg, setPkg] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingSubtest, setStartingSubtest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [completedSubtests, setCompletedSubtests] = useState(new Set());

  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [packageCompleted, setPackageCompleted] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [subtestToStart, setSubtestToStart] = useState(null);
  const [hasConfirmedStart, setHasConfirmedStart] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedSubtest, setSelectedSubtest] = useState(null);
  const [activePlans, setActivePlans] = useState([]);

  // PTN/Major selection state
  const [showPtnModal, setShowPtnModal] = useState(false);
  const [ptnSearch, setPtnSearch] = useState('');
  const [selectedPtn, setSelectedPtn] = useState(null);
  const [majorSearch, setMajorSearch] = useState('');
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [ptnStep, setPtnStep] = useState(1); // 1 = select PTN, 2 = select major
  const [savedPtn, setSavedPtn] = useState(null);
  const [savedMajor, setSavedMajor] = useState(null);
  const [pendingSubtestName, setPendingSubtestName] = useState(null);

  // Check if user has any active UTBK plan (subscription, access, or quota with remaining)
  const hasActiveUtbkPlan = () => {
    return activePlans.some(p => {
      const name = p.name || p.plan_name;
      if (name === 'gratis' || !name) return false;
      // Subscription or access type with target UTBK
      if (p.target_type === 'utbk' && (p.plan_type === 'subscription' || p.plan_type === 'access')) return true;
      // Quota type with remaining tries
      if (p.target_type === 'utbk' && p.plan_type === 'quota' && (p.quota_remaining || 0) > 0) return true;
      return false;
    });
  };

  const fetchStatus = async () => {
    try {
      if (!hasActiveUtbkPlan()) {
        const regRes = await tryoutService.getRegistrationStatus('utbk', packageId);
        const status = regRes.data?.data;
        setRegistrationStatus(status);
        setPackageCompleted(status?.completed === true);
        // Load saved PTN/major from registration status
        if (status?.target_ptn) {
          setSavedPtn(status.target_ptn);
          setSavedMajor(status.target_major);
        }
      }
    } catch (err) {
      console.error('Error fetching registration status:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pkgRes, subjRes] = await Promise.all([
          tryoutService.listPackages(),
          subjectService.list()
        ]);
        const packages = pkgRes.data?.data || [];
        const found = packages.find(p => p.id === packageId);
        if (!found) {
          toast.error('Paket tryout tidak ditemukan');
          navigate('/tryout/packages');
          return;
        }
        setPkg(found);

        const config = Array.isArray(found.subject_config)
          ? found.subject_config
          : (typeof found.subject_config === 'string' ? JSON.parse(found.subject_config) : []);

        const dbSubjects = subjRes.data?.data || [];
        const enriched = config.map(cfg => {
          const db = dbSubjects.find(s => s.name?.toLowerCase() === (cfg.name || '').toLowerCase());
          return { ...cfg, subject_id: db?.id, icon: db?.icon };
        });
        setSubjects(enriched);

        // Check completed subtests from localStorage
        const key = `tryout_completed_${packageId}`;
        try {
          const saved = JSON.parse(localStorage.getItem(key) || '[]');
          setCompletedSubtests(new Set(saved));
        } catch {}

        // Fetch active subscriptions
        subscriptionService.getActivePlans()
          .then(res => setActivePlans(res.data?.data || []))
          .catch(() => {});

        // Fetch registration status if no active UTBK plan
        if (!hasActiveUtbkPlan()) {
          const regRes = await tryoutService.getRegistrationStatus('utbk', packageId);
          const status = regRes.data?.data;
          setRegistrationStatus(status);
          setPackageCompleted(status?.completed === true);
          setHasConfirmedStart(sessionStorage.getItem(getTryoutConfirmedKey('utbk', packageId)) === 'true');
          // Load saved PTN/major from registration status
          if (status?.target_ptn) {
            setSavedPtn(status.target_ptn);
            setSavedMajor(status.target_major);
          }
        } else {
          // For premium users, check if PTN/major has been saved already
          try {
            const regRes = await tryoutService.getRegistrationStatus('utbk', packageId);
            const status = regRes.data?.data;
            if (status?.target_ptn) {
              setSavedPtn(status.target_ptn);
              setSavedMajor(status.target_major);
            }
          } catch {}
        }
      } catch (err) {
        toast.error('Gagal memuat data paket');
        navigate('/tryout/packages');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [packageId, navigate, user?.current_plan]);

  // Filtered PTN list based on search
  const filteredPtnList = useMemo(() => {
    if (!ptnSearch.trim()) return PTN_DATA;
    const q = ptnSearch.toLowerCase();
    return PTN_DATA.filter(p =>
      p.nama.toLowerCase().includes(q) ||
      (p.singkatan || '').toLowerCase().includes(q) ||
      (p.lokasi || '').toLowerCase().includes(q)
    );
  }, [ptnSearch]);

  // Filtered major list for selected PTN
  const filteredMajorList = useMemo(() => {
    if (!selectedPtn) return [];
    const prodi = selectedPtn.prodi || [];
    if (!majorSearch.trim()) return prodi;
    const q = majorSearch.toLowerCase();
    return prodi.filter(m => m.nama.toLowerCase().includes(q));
  }, [selectedPtn, majorSearch]);

  const handlePtnConfirm = () => {
    if (!selectedPtn || !selectedMajor) return;
    const ptnName = `${selectedPtn.nama} (${selectedPtn.singkatan})`;
    const majorName = selectedMajor.nama;
    setSavedPtn(ptnName);
    setSavedMajor(majorName);
    setShowPtnModal(false);
    setPtnStep(1);
    setPtnSearch('');
    setMajorSearch('');

    // Continue to start confirmation
    if (pendingSubtestName) {
      const subObj = subjects.find(s => s.name === pendingSubtestName);
      setSelectedSubtest(subObj);
      setConfirmOpen(true);
    }
  };

  const startSubtestDirectly = async (subtestName) => {
    setStartingSubtest(subtestName);
    try {
      const opts = {};
      if (savedPtn) opts.target_ptn = savedPtn;
      if (savedMajor) opts.target_major = savedMajor;
      const res = await tryoutService.start(packageId, [subtestName], opts);
      const sessionId = res.data.data.session_id;

      // Mark which subtest is being worked on
      localStorage.setItem(`tryout_current_subtest_${sessionId}`, subtestName);
      localStorage.setItem(`tryout_return_package_${sessionId}`, packageId);

      navigate(`/tryout/${sessionId}`);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'NOT_VERIFIED') {
        setShowVerificationModal(true);
      } else if (code === 'FREE_LIMIT_REACHED') {
        setPackageCompleted(true);
        toast.error('Paket tryout ini sudah pernah diselesaikan.');
      } else {
        toast.error(err.response?.data?.error || 'Gagal memulai subtes');
      }
      setStartingSubtest(null);
    }
  };

  const handleStartSubtest = async (subtestName) => {
    if (!hasActiveUtbkPlan()) {
      if (packageCompleted) {
        toast.error('Akun gratis hanya dapat mengerjakan setiap paket tryout sebanyak 1 kali.');
        return;
      }
      setSubtestToStart(subtestName);
      const confirmed = sessionStorage.getItem(getTryoutConfirmedKey('utbk', packageId)) === 'true';
      setHasConfirmedStart(confirmed);
      if (!registrationStatus || registrationStatus.status !== 'approved' || !confirmed) {
        setShowVerificationModal(true);
        return;
      }
    }

    // Check if PTN/major has been set; if not, show PTN selection modal
    if (!savedPtn || !savedMajor) {
      setPendingSubtestName(subtestName);
      setShowPtnModal(true);
      return;
    }

    const subObj = subjects.find(s => s.name === subtestName);
    setSelectedSubtest(subObj);
    setConfirmOpen(true);
  };

  const handleSubmitTryout = async () => {
    if (completedSubtests.size === 0) {
      toast.error('Kerjakan minimal 1 subtes sebelum submit');
      return;
    }
    const sessionsKey = `tryout_sessions_${packageId}`;
    const sessions = JSON.parse(localStorage.getItem(sessionsKey) || '{}');
    const sessionIds = Object.values(sessions);

    if (sessionIds.length === 0) {
      toast.error('Data sesi tidak ditemukan');
      return;
    }

    setSubmitting(true);
    try {
      if (!hasActiveUtbkPlan()) {
        await tryoutService.completePackage('utbk', packageId);
        setPackageCompleted(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menandai paket selesai');
      setSubmitting(false);
      return;
    }

    localStorage.removeItem(`tryout_completed_${packageId}`);
    localStorage.removeItem(`tryout_sessions_${packageId}`);

    const lastSessionId = sessionIds[sessionIds.length - 1];
    toast.success('Tryout selesai! Melihat hasil...');
    navigate(`/tryout/hasil/${lastSessionId}`, {
      state: { allSessionIds: sessionIds, packageId }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf8ff', fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center">
          <span className="material-symbols-outlined animate-spin text-5xl text-[#0050cb]">progress_activity</span>
          <p className="mt-4 text-[#727687] font-medium">Memuat paket...</p>
        </div>
      </div>
    );
  }

  const totalSoal = subjects.reduce((sum, s) => sum + (s.questionCount || 0), 0);
  const totalSeconds = subjects.reduce((sum, s) => sum + (s.durationMin || 0) * 60 + (s.durationSec || 0), 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  const totalDurasi = remainingSeconds > 0 ? `${totalMinutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${totalMinutes}`;

  const getIcon = (name) => ICON_MAP[(name || '').toLowerCase()] || 'quiz';
  const getCategory = (name) => CATEGORY_MAP[(name || '').toLowerCase()] || 'Subtes';

  return (
    <div className="min-h-screen text-[#191b24]" style={{ backgroundColor: '#faf8ff', fontFamily: "'Inter', sans-serif" }}>
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />

      <main className="max-w-[1280px] mx-auto px-6 md:px-10 py-12 pb-32">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-8 text-[#424656]">
          <Link to="/dashboard" className="text-[14px] font-medium hover:text-[#0050cb] transition-colors">Stubia</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link to="/tryout/packages" className="text-[14px] font-medium hover:text-[#0050cb] transition-colors">Paket Tryout</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-[14px] font-bold text-[#0050cb]">Pilih Subtes</span>
        </nav>

        {packageCompleted && !hasActiveUtbkPlan() && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-[20px] shrink-0">lock</span>
            <p>Paket tryout ini sudah diselesaikan. Akun gratis hanya dapat mengerjakan setiap paket tryout sebanyak 1 kali.</p>
          </div>
        )}

        {/* Hero Section */}
        <div className="mb-10 sm:mb-16">
          <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold text-[#191b24] mb-4 tracking-tight leading-tight">Pilih Subtes</h1>
          <p className="text-base sm:text-[18px] text-[#424656] max-w-2xl leading-relaxed">
            Kerjakan subtes satu per satu. Klik kartu untuk mulai mengerjakan, lalu submit setelah selesai semua.
          </p>
          {savedPtn && savedMajor && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#e8eeff] border border-[#0050cb]/15 text-[#0050cb]">
              <span className="material-symbols-outlined text-[18px]">school</span>
              <span className="text-[13px] font-semibold">{savedPtn}</span>
              <span className="text-[#c2c6d8]">·</span>
              <span className="text-[13px] font-medium">{savedMajor}</span>
            </div>
          )}
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6 mb-12 bg-[#faf8ff] p-2 rounded-xl border border-[#c2c6d8]/30" style={{ boxShadow: '0 4px 12px rgba(0, 80, 203, 0.04)' }}>
          <div className="flex items-center gap-4 px-4 sm:px-6 py-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#dae1ff]/40 flex items-center justify-center text-[#0050cb]">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">list_alt</span>
            </div>
            <div>
              <p className="text-[10px] sm:text-[12px] font-semibold text-[#727687] uppercase tracking-wider">Progress</p>
              <p className="text-[18px] sm:text-[24px] font-semibold text-[#0050cb]">{completedSubtests.size} / {subjects.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-4 sm:px-6 py-4 sm:border-l border-[#c2c6d8]/30">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#c2e8ff]/30 flex items-center justify-center text-[#006688]">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">quiz</span>
            </div>
            <div>
              <p className="text-[10px] sm:text-[12px] font-semibold text-[#727687] uppercase tracking-wider">Total Soal</p>
              <p className="text-[18px] sm:text-[24px] font-semibold text-[#006688]">{totalSoal}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-4 sm:px-6 py-4 sm:border-l border-[#c2c6d8]/30">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#ffdbd0]/30 flex items-center justify-center text-[#a33200]">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">timer</span>
            </div>
            <div>
              <p className="text-[10px] sm:text-[12px] font-semibold text-[#727687] uppercase tracking-wider">Durasi</p>
              <p className="text-[18px] sm:text-[24px] font-semibold text-[#a33200]">{totalDurasi} menit</p>
            </div>
          </div>
        </div>

        {/* Subtes Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {subjects.map((sub, idx) => {
            const icon = getIcon(sub.name);
            const category = getCategory(sub.name);
            const isDone = completedSubtests.has(sub.name);
            const isStarting = startingSubtest === sub.name;

            return (
              <div
                key={idx}
                onClick={() => !isDone && !isStarting && handleStartSubtest(sub.name)}
                className={`group ${isDone ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className={`h-full border-2 rounded-xl p-8 transition-all ${
                  isDone
                    ? 'border-[#2e7d32]/30 bg-[#e8f5e9]/40'
                    : 'bg-[#faf8ff] border-[#c2c6d8]/20 hover:-translate-y-1 hover:border-[#0050cb]/40 active:scale-[0.98]'
                }`} style={{ boxShadow: '0 4px 12px rgba(0, 80, 203, 0.04)' }}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                      isDone ? 'bg-[#2e7d32] text-white' : 'bg-[#e6e7f4]'
                    }`}>
                      <span className={`material-symbols-outlined text-[28px] ${isDone ? 'text-white' : 'text-[#0050cb]'}`}>
                        {isDone ? 'check' : icon}
                      </span>
                    </div>
                    <span className="text-[12px] font-semibold bg-[#e6e7f4] px-3 py-1 rounded-full text-[#424656]">{category}</span>
                  </div>

                  <h3 className={`text-[20px] font-semibold mb-2 leading-tight ${
                    isDone ? 'text-[#2e7d32]' : 'text-[#191b24]'
                  }`}>{sub.name}</h3>

                  <div className="flex items-center gap-4 text-[#424656] mb-8">
                    <div className="flex items-center gap-1.5 text-[14px] font-medium">
                      <span className="material-symbols-outlined text-[18px]">description</span> {sub.questionCount || 0} soal
                    </div>
                     <div className="flex items-center gap-1.5 text-[14px] font-medium">
                      <span className="material-symbols-outlined text-[18px]">schedule</span> {sub.durationSec ? `${sub.durationMin || 0}:${sub.durationSec.toString().padStart(2, '0')}` : sub.durationMin || 0} menit
                    </div>
                  </div>

                  {isDone ? (
                    <div className="flex items-center gap-2 font-bold text-[14px] text-[#2e7d32]">
                      <span>Selesai</span>
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-bold text-[14px] text-[#0050cb]">
                      <span>{isStarting ? 'Memuat...' : 'Kerjakan'}</span>
                      {!isStarting && <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Action Bar */}
      <footer className="fixed bottom-0 w-full z-40 bg-white border-t border-[#c2c6d8] shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-10 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-6 text-[#424656]">
            <p className="text-[12px] font-medium hidden sm:block text-gray-400">© 2026 Stubia</p>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-[12px] sm:text-[14px] font-medium text-[#424656]">
              {completedSubtests.size} / {subjects.length} selesai
            </span>
            <button
              type="button"
              onClick={handleSubmitTryout}
              disabled={submitting || completedSubtests.size === 0}
              className={`px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-xl font-bold text-[13px] sm:text-[14px] transition-all flex items-center gap-2 ${
                completedSubtests.size > 0
                  ? 'bg-[#0050cb] text-white hover:bg-[#003fa4] active:scale-[0.98] shadow-lg'
                  : 'bg-[#c2c6d8] text-[#424656] cursor-not-allowed opacity-50'
              }`}
            >
              {submitting ? 'Memuat...' : 'Submit'}
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
      </footer>

      {!hasActiveUtbkPlan() && (
        <TryoutVerificationModal
          open={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          packageType="utbk"
          packageId={packageId}
          packageTitle={pkg?.title || 'Paket Tryout UTBK'}
          registrationStatus={registrationStatus}
          onSubmitSuccess={fetchStatus}
          onConfirmStart={() => {
            sessionStorage.setItem(getTryoutConfirmedKey('utbk', packageId), 'true');
            setHasConfirmedStart(true);
            setShowVerificationModal(false);
            if (subtestToStart) {
              // Check if PTN/major needs to be set first
              if (!savedPtn || !savedMajor) {
                setPendingSubtestName(subtestToStart);
                setShowPtnModal(true);
              } else {
                const subObj = subjects.find(s => s.name === subtestToStart);
                setSelectedSubtest(subObj);
                setConfirmOpen(true);
              }
            }
          }}
        />
      )}

      <StartConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          if (selectedSubtest) {
            startSubtestDirectly(selectedSubtest.name);
          }
        }}
        title="Apakah Anda yakin ingin memulai subtes?"
        subtitle={selectedSubtest?.name}
        details={[
          { label: 'Jumlah Soal', value: `${selectedSubtest?.questionCount || 0} soal`, icon: 'description' },
          { label: 'Durasi', value: `${selectedSubtest?.durationSec ? `${selectedSubtest?.durationMin || 0}:${selectedSubtest?.durationSec.toString().padStart(2, '0')}` : selectedSubtest?.durationMin || 0} menit`, icon: 'schedule' },
          ...(savedPtn ? [{ label: 'Target PTN', value: savedPtn, icon: 'school' }] : []),
          ...(savedMajor ? [{ label: 'Jurusan', value: savedMajor, icon: 'menu_book' }] : []),
        ]}
      />

      {/* PTN/Major Selection Modal */}
      {showPtnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => { setShowPtnModal(false); setPendingSubtestName(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 pb-4 border-b border-[#e6e7f4]">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-[20px] font-bold text-[#191b24]">
                  {ptnStep === 1 ? 'Pilih Universitas Tujuan' : 'Pilih Jurusan'}
                </h3>
                <button onClick={() => { setShowPtnModal(false); setPendingSubtestName(null); }} className="w-8 h-8 rounded-full hover:bg-[#f0f1f7] flex items-center justify-center text-[#727687] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <p className="text-[13px] text-[#727687]">
                {ptnStep === 1
                  ? 'Pilih PTN yang kamu targetkan untuk perbandingan leaderboard jurusan'
                  : `Program studi di ${selectedPtn?.singkatan || selectedPtn?.nama}`}
              </p>

              {/* Search */}
              <div className="relative mt-3">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#727687]">search</span>
                <input
                  type="text"
                  value={ptnStep === 1 ? ptnSearch : majorSearch}
                  onChange={e => ptnStep === 1 ? setPtnSearch(e.target.value) : setMajorSearch(e.target.value)}
                  placeholder={ptnStep === 1 ? 'Cari universitas...' : 'Cari jurusan...'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#c2c6d8]/40 bg-[#faf8ff] text-[14px] text-[#191b24] placeholder-[#a0a4b8] focus:outline-none focus:border-[#0050cb]/50 focus:ring-2 focus:ring-[#0050cb]/10 transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c2c6d8 transparent' }}>
              {ptnStep === 1 ? (
                filteredPtnList.length > 0 ? (
                  <div className="space-y-1.5">
                    {filteredPtnList.map(ptn => {
                      const isSelected = selectedPtn?.id === ptn.id;
                      return (
                        <button
                          key={ptn.id}
                          onClick={() => { setSelectedPtn(ptn); setSelectedMajor(null); setMajorSearch(''); setPtnStep(2); }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-[#0050cb]/10 border border-[#0050cb]/30'
                              : 'hover:bg-[#f5f5ff] border border-transparent'
                          }`}
                        >
                          <img src={ptn.logo} alt={ptn.singkatan} className="w-10 h-10 rounded-lg object-contain bg-white border border-[#e6e7f4] p-1 shrink-0" onError={e => { e.target.style.display='none'; }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-[#191b24] truncate">{ptn.nama}</p>
                            <p className="text-[12px] text-[#727687]">{ptn.singkatan} · {ptn.lokasi}</p>
                          </div>
                          <span className="text-[11px] font-medium text-[#727687] bg-[#f0f1f7] px-2 py-0.5 rounded-full shrink-0">{(ptn.prodi || []).length} prodi</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-[40px] text-[#c2c6d8] mb-2">search_off</span>
                    <p className="text-[13px] text-[#727687]">Universitas tidak ditemukan</p>
                  </div>
                )
              ) : (
                filteredMajorList.length > 0 ? (
                  <div className="space-y-1">
                    {filteredMajorList.map((major, idx) => {
                      const isSelected = selectedMajor?.nama === major.nama;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedMajor(major)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-[#0050cb]/10 border border-[#0050cb]/30'
                              : 'hover:bg-[#f5f5ff] border border-transparent'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium text-[#191b24]">{major.nama}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[11px] text-[#727687]">{major.jenjang}</span>
                              {major.skor && <span className="text-[11px] font-semibold text-[#0050cb]">Skor: {major.skor}</span>}
                              {major.daya_tampung && <span className="text-[11px] text-[#727687]">Daya Tampung: {major.daya_tampung}</span>}
                            </div>
                          </div>
                          {isSelected && <span className="material-symbols-outlined text-[20px] text-[#0050cb] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-[40px] text-[#c2c6d8] mb-2">search_off</span>
                    <p className="text-[13px] text-[#727687]">Jurusan tidak ditemukan</p>
                  </div>
                )
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[#e6e7f4] flex items-center gap-3">
              {ptnStep === 2 && (
                <button
                  onClick={() => { setPtnStep(1); setSelectedMajor(null); setMajorSearch(''); }}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[#424656] hover:bg-[#f0f1f7] transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Ganti PTN
                </button>
              )}
              <div className="flex-1" />
              {ptnStep === 2 && (
                <button
                  onClick={handlePtnConfirm}
                  disabled={!selectedMajor}
                  className={`px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-1.5 ${
                    selectedMajor
                      ? 'bg-[#0050cb] text-white hover:bg-[#003fa4] shadow-md'
                      : 'bg-[#c2c6d8] text-[#727687] cursor-not-allowed'
                  }`}
                >
                  Konfirmasi
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TryoutSubtesSelect;