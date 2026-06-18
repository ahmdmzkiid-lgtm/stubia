import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { tryoutService, subjectService, subscriptionService } from '../../services/api';
import toast from 'react-hot-toast';
import TryoutVerificationModal from '../../components/tryout/TryoutVerificationModal';
import StudentNavbar from '../../components/layout/StudentNavbar';
import StartConfirmationModal from '../../components/StartConfirmationModal';


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
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [subtestToStart, setSubtestToStart] = useState(null);
  const [hasConfirmedStart, setHasConfirmedStart] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedSubtest, setSelectedSubtest] = useState(null);
  const [activePlans, setActivePlans] = useState([]);

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
        setRegistrationStatus(regRes.data?.data);
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
          setRegistrationStatus(regRes.data?.data);
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

  const startSubtestDirectly = async (subtestName) => {
    setStartingSubtest(subtestName);
    try {
      const res = await tryoutService.start(packageId, [subtestName]);
      const sessionId = res.data.data.session_id;

      // Mark which subtest is being worked on
      localStorage.setItem(`tryout_current_subtest_${sessionId}`, subtestName);
      localStorage.setItem(`tryout_return_package_${sessionId}`, packageId);

      navigate(`/tryout/${sessionId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memulai subtes');
      setStartingSubtest(null);
    }
  };

  const handleStartSubtest = async (subtestName) => {
    if (!hasActiveUtbkPlan()) {
      setSubtestToStart(subtestName);
      if (!registrationStatus || registrationStatus.status !== 'approved' || !hasConfirmedStart) {
        setShowVerificationModal(true);
        return;
      }
    }

    const subObj = subjects.find(s => s.name === subtestName);
    setSelectedSubtest(subObj);
    setConfirmOpen(true);
  };

  const handleSubmitTryout = () => {
    if (completedSubtests.size === 0) {
      toast.error('Kerjakan minimal 1 subtes sebelum submit');
      return;
    }
    // Get stored session IDs for completed subtests
    const sessionsKey = `tryout_sessions_${packageId}`;
    const sessions = JSON.parse(localStorage.getItem(sessionsKey) || '{}');
    const sessionIds = Object.values(sessions);

    if (sessionIds.length === 0) {
      toast.error('Data sesi tidak ditemukan');
      return;
    }

    // Navigate to result page with the last session (or first)
    // Clean up localStorage
    localStorage.removeItem(`tryout_completed_${packageId}`);
    localStorage.removeItem(`tryout_sessions_${packageId}`);

    // If only one session, go to its result directly
    // If multiple sessions, go to the first one (most comprehensive) or last
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
  const totalDurasi = subjects.reduce((sum, s) => sum + (s.durationMin || 0), 0);

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

        {/* Hero Section */}
        <div className="mb-10 sm:mb-16">
          <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-bold text-[#191b24] mb-4 tracking-tight leading-tight">Pilih Subtes</h1>
          <p className="text-base sm:text-[18px] text-[#424656] max-w-2xl leading-relaxed">
            Kerjakan subtes satu per satu. Klik kartu untuk mulai mengerjakan, lalu submit setelah selesai semua.
          </p>
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
                      <span className="material-symbols-outlined text-[18px]">schedule</span> {sub.durationMin || 0} menit
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
            setHasConfirmedStart(true);
            setShowVerificationModal(false);
            if (subtestToStart) {
              const subObj = subjects.find(s => s.name === subtestToStart);
              setSelectedSubtest(subObj);
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
          if (selectedSubtest) {
            startSubtestDirectly(selectedSubtest.name);
          }
        }}
        title="Apakah Anda yakin ingin memulai subtes?"
        subtitle={selectedSubtest?.name}
        details={[
          { label: 'Jumlah Soal', value: `${selectedSubtest?.questionCount || 0} soal`, icon: 'description' },
          { label: 'Durasi', value: `${selectedSubtest?.durationMin || 0} menit`, icon: 'schedule' }
        ]}
      />
    </div>
  );
};

export default TryoutSubtesSelect;