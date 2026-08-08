import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Clock, FileText, Check, ChevronRight, ChevronDown, ChevronUp, Info, ArrowLeft, Gem, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { tryoutService, subjectService, subscriptionService } from '../../services/api';
import toast from 'react-hot-toast';
import TryoutVerificationModal from '../../components/tryout/TryoutVerificationModal';
import TryoutAccessModal from '../../components/tryout/TryoutAccessModal';
import StudentNavbar from '../../components/layout/StudentNavbar';
import StartConfirmationModal from '../../components/StartConfirmationModal';
import TryoutQuotaConfirmModal from '../../components/tryout/TryoutQuotaConfirmModal';
import { PTN_DATA, getPtnLogo } from '../../data/ptnData';

const getSubtestCategoryGroup = (name) => {
  const n = (name || '').toLowerCase();
  if (
    n.includes('penalaran umum') ||
    n.includes('pemahaman umum') ||
    n.includes('bacaan') ||
    n.includes('tulisan') ||
    n.includes('kuantitatif') ||
    n.includes('tps') ||
    n.includes('skolastik')
  ) {
    return 'Tes Potensi Skolastik';
  }
  if (
    n.includes('literasi dalam bahasa indonesia') ||
    n.includes('literasi dalam bahasa inggris') ||
    n.includes('literasi bahasa') ||
    n.includes('literasi')
  ) {
    return 'Tes Literasi Bahasa';
  }
  if (n.includes('penalaran matematika') || n.includes('matematika')) {
    return 'Tes Penalaran Matematika';
  }
  return 'Subtes Utama';
};

const CATEGORY_ORDER = [
  'Tes Potensi Skolastik',
  'Tes Literasi Bahasa',
  'Tes Penalaran Matematika',
  'Subtes Utama'
];

const getTryoutConfirmedKey = (type, id) => `tryout_confirmed_${type}_${id}`;

const TryoutSubtesSelect = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, logout, refreshUser } = useAuth();

  const [pkg, setPkg] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingSubtest, setStartingSubtest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [completedSubtests, setCompletedSubtests] = useState(new Set());
  const [answeredCounts, setAnsweredCounts] = useState({});

  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [packageCompleted, setPackageCompleted] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [subtestToStart, setSubtestToStart] = useState(null);
  const [hasConfirmedStart, setHasConfirmedStart] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [quotaAlreadyDeducted, setQuotaAlreadyDeducted] = useState(() =>
    localStorage.getItem(`tryout_quota_deducted_${packageId}`) === 'true'
  );
  const [selectedSubtest, setSelectedSubtest] = useState(null);
  const [activePlans, setActivePlans] = useState([]);
  const [accessError, setAccessError] = useState(null);
  const [accessModal, setAccessModal] = useState({ open: false, type: 'not_started' });

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

  const hasActiveUtbkPlan = useCallback(() => {
    const hasActiveSub = activePlans.some(p => {
      const name = p.name || p.plan_name;
      if (name === 'gratis' || !name) return false;
      if (name === 'sultan') return true;
      // Subscription or access type with target UTBK
      if (p.target_type === 'utbk' && (p.plan_type === 'subscription' || p.plan_type === 'access')) return true;
      // Quota type with remaining tries
      if (p.target_type === 'utbk' && p.plan_type === 'quota' && (p.quota_remaining === null || p.quota_remaining > 0)) return true;
      return false;
    });
    if (hasActiveSub) return true;

    const userPlan = user?.current_plan;
    if (userPlan && userPlan !== 'gratis') {
      const isUtbkPlan = userPlan.startsWith('utbk') || userPlan === 'premium' || userPlan === 'sultan';
      if (isUtbkPlan) return true;
    }
    return false;
  }, [activePlans, user?.current_plan]);

  const quotaPlan = useMemo(() => {
    return activePlans.find(p =>
      p.target_type === 'utbk' &&
      p.plan_type === 'quota' &&
      (p.quota_remaining === null || p.quota_remaining > 0)
    );
  }, [activePlans]);

  const hasUnlimitedUtbk = useMemo(() => {
    const hasSub = activePlans.some(p => {
      const name = p.name || p.plan_name;
      if (name === 'sultan') return true;
      if (p.target_type === 'utbk' && (p.plan_type === 'subscription' || p.plan_type === 'access')) return true;
      return false;
    });
    if (hasSub) return true;
    const userPlan = user?.current_plan;
    if (userPlan && userPlan !== 'gratis' && !userPlan.includes('quota')) {
      if (userPlan.startsWith('utbk') || userPlan === 'premium' || userPlan === 'sultan') return true;
    }
    return false;
  }, [activePlans, user?.current_plan]);

  const isUsingQuota = !hasUnlimitedUtbk && !!quotaPlan;

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

        // Check answered counts from localStorage
        const ansKey = `tryout_answered_${packageId}`;
        try {
          const ansStats = JSON.parse(localStorage.getItem(ansKey) || '{}');
          setAnsweredCounts(ansStats);
        } catch {}

        // Fetch active subscriptions
        let currentActivePlans = [];
        try {
          const planRes = await subscriptionService.getActivePlans();
          currentActivePlans = planRes.data?.data || [];
          setActivePlans(currentActivePlans);
        } catch {}

        const userHasPlan = currentActivePlans.some(p => {
          const name = p.name || p.plan_name;
          if (name === 'gratis' || !name) return false;
          if (name === 'sultan') return true;
          if (p.target_type === 'utbk' && (p.plan_type === 'subscription' || p.plan_type === 'access')) return true;
          if (p.target_type === 'utbk' && p.plan_type === 'quota' && (p.quota_remaining || 0) > 0) return true;
          return false;
        });

        // Fetch registration status if no active UTBK plan
        if (!userHasPlan) {
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

  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (category) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const groupedSubjects = useMemo(() => {
    const groups = {};
    subjects.forEach((sub) => {
      const cat = getSubtestCategoryGroup(sub.name);
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(sub);
    });

    return CATEGORY_ORDER
      .filter(cat => groups[cat] && groups[cat].length > 0)
      .map(cat => {
        const items = groups[cat];
        const completedCount = items.filter(s => completedSubtests.has(s.name)).length;
        return {
          category: cat,
          items,
          completedCount,
          totalCount: items.length
        };
      });
  }, [subjects, completedSubtests]);

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

      // Check if quota has already been deducted for this attempt
      const quotaDeductedKey = `tryout_quota_deducted_${packageId}`;
      const hasDeducted = localStorage.getItem(quotaDeductedKey) === 'true';
      const isFirst = !hasDeducted || completedSubtests.size === 0;
      opts.is_first_subtest = isFirst;

      const res = await tryoutService.start(packageId, [subtestName], opts);
      const data = res.data?.data || {};
      const sessionId = data.session_id;

      if (data.quota_deducted) {
        localStorage.setItem(quotaDeductedKey, 'true');
        setQuotaAlreadyDeducted(true);
        // Update local activePlans quota remaining immediately
        const newQuota = data.quota_remaining !== undefined ? data.quota_remaining : Math.max(0, (quotaPlan?.quota_remaining || 1) - 1);
        setActivePlans(prev => prev.map(p => {
          if (p.target_type === 'utbk' && p.plan_type === 'quota') {
            return { ...p, quota_remaining: newQuota };
          }
          return p;
        }));
        if (typeof refreshUser === 'function') {
          refreshUser();
        }
      }

      // Mark which subtest is being worked on
      localStorage.setItem(`tryout_current_subtest_${sessionId}`, subtestName);
      localStorage.setItem(`tryout_return_package_${sessionId}`, packageId);

      navigate(`/tryout/${sessionId}`);
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'NOT_VERIFIED') {
        setShowVerificationModal(true);
      } else if (code === 'NOT_STARTED') {
        setAccessModal({ open: true, type: 'not_started', startDate: parseLocalDate(pkg?.scheduled_at), endDate: parseLocalDate(pkg?.end_date) });
      } else if (code === 'EXPIRED') {
        setPackageCompleted(true);
        setAccessModal({ open: true, type: 'expired', startDate: parseLocalDate(pkg?.scheduled_at), endDate: parseLocalDate(pkg?.end_date) });
      } else if (code === 'FREE_LIMIT_REACHED') {
        setPackageCompleted(true);
        setAccessModal({ open: true, type: 'limit_reached' });
      } else {
        toast.error(err.response?.data?.error || 'Gagal memulai subtes');
      }
      setStartingSubtest(null);
    }
  };

  const parseLocalDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal instanceof Date) return dateVal;
    let str = String(dateVal).trim();
    if (str.includes('T')) {
      str = str.split('.')[0].replace('Z', '');
    }
    str = str.replace(' ', 'T');
    const parts = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (parts) {
      return new Date(
        parseInt(parts[1], 10),
        parseInt(parts[2], 10) - 1,
        parseInt(parts[3], 10),
        parseInt(parts[4] || '0', 10),
        parseInt(parts[5] || '0', 10),
        parseInt(parts[6] || '0', 10)
      );
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  };

  const handleStartSubtest = async (subtestName) => {
    const isPremiumUser = hasActiveUtbkPlan();
    const now = new Date();
    const startDate = parseLocalDate(pkg?.scheduled_at);
    const endDate = parseLocalDate(pkg?.end_date);

    if (isUsingQuota && packageCompleted) {
      setPackageCompleted(false);
      setCompletedSubtests(new Set());
      setAnsweredCounts({});
      // Reset all localStorage for clean new attempt
      localStorage.removeItem(`tryout_quota_deducted_${packageId}`);
      localStorage.removeItem(`tryout_sessions_${packageId}`);
      localStorage.removeItem(`tryout_completed_${packageId}`);
      localStorage.removeItem(`tryout_answered_${packageId}`);
      localStorage.removeItem(`tryout_result_sessions_${packageId}`);
      setQuotaAlreadyDeducted(false);
    }

    if (!isPremiumUser) {
      if (startDate && startDate > now) {
        setAccessModal({ open: true, type: 'not_started', startDate, endDate });
        return;
      }
      if (endDate && endDate < now) {
        setAccessModal({ open: true, type: 'expired', startDate, endDate });
        return;
      }
      if (packageCompleted) {
        setAccessModal({ open: true, type: 'limit_reached' });
        return;
      }

      // If registration is not approved, show lock warning modal and allow quick registration
      if (!registrationStatus || registrationStatus.status !== 'approved') {
        setAccessModal({ 
          open: true, 
          type: 'not_verified',
          onAction: () => setShowVerificationModal(true)
        });
        return;
      }

      setSubtestToStart(subtestName);
      const confirmed = sessionStorage.getItem(getTryoutConfirmedKey('utbk', packageId)) === 'true';
      setHasConfirmedStart(confirmed);
      if (!confirmed) {
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

  const handleSubmitTryout = useCallback(async () => {
    const sessionsKey = `tryout_sessions_${packageId}`;
    const sessions = JSON.parse(localStorage.getItem(sessionsKey) || '{}');
    const sessionIds = Object.values(sessions);

    if (sessionIds.length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      if (!hasActiveUtbkPlan()) {
        await tryoutService.completePackage('utbk', packageId);
        setPackageCompleted(true);
      }
    } catch (err) {
      console.error('Auto-submit error:', err);
      setSubmitting(false);
      return;
    }

    // Save session IDs for result page refresh support (persists after navigation)
    localStorage.setItem(`tryout_result_sessions_${packageId}`, JSON.stringify(sessionIds));

    localStorage.removeItem(`tryout_completed_${packageId}`);
    localStorage.removeItem(`tryout_sessions_${packageId}`);
    localStorage.removeItem(`tryout_answered_${packageId}`);
    localStorage.removeItem(`tryout_quota_deducted_${packageId}`);

    const lastSessionId = sessionIds[sessionIds.length - 1];
    toast.success('Semua subtes selesai! Membuka hasil tryout...');
    navigate(`/tryout/hasil/${lastSessionId}`, {
      state: { allSessionIds: sessionIds, packageId }
    });
  }, [packageId, navigate, hasActiveUtbkPlan]);

  useEffect(() => {
    if (!loading && subjects.length > 0 && completedSubtests.size === subjects.length && !submitting && !packageCompleted) {
      handleSubmitTryout();
    }
  }, [loading, subjects.length, completedSubtests.size, submitting, packageCompleted, handleSubmitTryout]);

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

  const formatSubtestDurationText = (min = 0, sec = 0) => {
    const m = Number(min) || 0;
    const s = Number(sec) || 0;
    if (m > 0 && s > 0) return `${m} menit ${s} detik`;
    if (m > 0) return `${m} menit`;
    if (s > 0) return `${s} detik`;
    return '0 menit';
  };

  const totalSoal = subjects.reduce((sum, s) => sum + (s.questionCount || 0), 0);
  const totalSeconds = subjects.reduce((sum, s) => sum + (s.durationMin || 0) * 60 + (s.durationSec || 0), 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  const totalDurasiText = formatSubtestDurationText(totalMinutes, remainingSeconds);

  const totalAnswered = subjects.reduce((sum, s) => {
    const isDone = completedSubtests.has(s.name);
    const ans = answeredCounts[s.name];
    if (ans !== undefined) return sum + ans;
    if (isDone) return sum + (s.questionCount || 0);
    return sum;
  }, 0);
  const progressPercent = totalSoal > 0 ? Math.round((totalAnswered / totalSoal) * 100) : 0;

  const formatSchedule = (p) => {
    if (p?.schedule_text) return p.schedule_text;

    const formatDateVal = (val) => {
      if (!val) return '';
      try {
        if (typeof val === 'string' && val.length >= 10) {
          const cleaned = val.replace(' ', 'T');
          const parts = cleaned.split('T');
          if (parts.length >= 2) {
            const [y, m, d] = parts[0].split('-').map(Number);
            const timeParts = parts[1].split(':');
            const hh = Number(timeParts[0] || 0);
            const mm = Number(timeParts[1] || 0);
            if (y && m && d) {
              const dateObj = new Date(y, m - 1, d, hh, mm);
              const formattedDate = dateObj.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });
              const hoursStr = String(hh).padStart(2, '0');
              const minsStr = String(mm).padStart(2, '0');
              return `${formattedDate}, ${hoursStr}:${minsStr} WIB`;
            }
          }
        }
        const d = new Date(val);
        if (isNaN(d.getTime())) return '';
        const formattedDate = d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        const hoursStr = String(d.getHours()).padStart(2, '0');
        const minsStr = String(d.getMinutes()).padStart(2, '0');
        return `${formattedDate}, ${hoursStr}:${minsStr} WIB`;
      } catch (e) {
        return '';
      }
    };

    const startVal = p?.scheduled_at || p?.start_date;
    const endVal = p?.end_date;

    const startStr = formatDateVal(startVal);
    const endStr = formatDateVal(endVal);

    if (startStr && endStr) {
      return `${startStr} - ${endStr}`;
    }
    if (startStr) {
      return startStr;
    }
    return '';
  };

  const now = new Date();
  const startDate = parseLocalDate(pkg?.scheduled_at);
  const endDate = parseLocalDate(pkg?.end_date);
  const isWithinFreeWindow = startDate && endDate ? (now >= startDate && now <= endDate) : false;
  const isFreeAccess = pkg?.is_free || pkg?.access_type === 'free' || isWithinFreeWindow || (!hasActiveUtbkPlan() && pkg?.price === 0);
  const badgeText = isFreeAccess ? 'free' : (pkg?.required_plan === 'sultan' ? 'sultan' : 'premium');

  return (
    <div className="min-h-screen text-[#191b24] bg-[#faf8ff]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />

      {/* Main Content Area */}
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 md:px-10 pt-8 pb-28">
        {/* Top Back Navigation */}
        <button 
          onClick={() => navigate('/tryout/packages')}
          className="flex items-center gap-2.5 text-[#191b24] font-bold text-[18px] sm:text-[20px] mb-6 hover:text-[#0050cb] transition-colors"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
          <span>Detail Tryout</span>
        </button>

        {/* Central Floating Detail Card */}
        <div className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,80,203,0.05)] border border-[#c2c6d8]/30 mb-6 overflow-hidden">
          {/* Top-Right Badge (free/premium) */}
          <div className="absolute top-0 right-0 bg-[#dae1ff] text-[#0050cb] font-extrabold text-[12px] px-5 py-1.5 rounded-bl-2xl rounded-tr-2xl uppercase tracking-wider">
            {badgeText}
          </div>

          {/* Title & Schedule */}
          <div className="text-center mb-5 pt-2">
            <h1 className="text-[20px] sm:text-[22px] font-extrabold text-[#191b24] mb-1 leading-snug">
              {pkg?.title || 'TRYOUT UTBK'}
            </h1>
            {formatSchedule(pkg) ? (
              <p className="text-[13px] sm:text-[14px] text-[#727687] font-medium">
                {formatSchedule(pkg)}
              </p>
            ) : null}
            {savedPtn && savedMajor && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f2f3ff] border border-[#0050cb]/15 text-[#0050cb]">
                <span className="text-[13px] font-semibold">{savedPtn}</span>
                <span className="text-[#c2c6d8]">·</span>
                <span className="text-[13px] font-medium">{savedMajor}</span>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="w-full bg-[#f2f3ff] text-[#0050cb] font-bold text-[14px] py-2.5 rounded-xl text-center mb-6 border border-[#dae1ff]">
            {completedSubtests.size > 0 ? 'Sedang dikerjakan' : 'Belum dikerjakan'}
          </div>

          {/* Info & Progress Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Left Metrics */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2 text-[#424656] font-semibold">
                  <Clock size={18} className="text-[#0050cb]" />
                  <span>Total Waktu</span>
                </div>
                <span className="font-bold text-[#0050cb] text-[15px]">{totalDurasiText}</span>
              </div>

              <div className="flex items-center justify-between text-[14px]">
                <div className="flex items-center gap-2 text-[#424656] font-semibold">
                  <FileText size={18} className="text-[#0050cb]" />
                  <span>Total Soal</span>
                </div>
                <span className="font-bold text-[#0050cb] text-[15px]">{totalSoal} Soal</span>
              </div>
            </div>

            {/* Right Progress Tracker */}
            <div className="bg-[#faf8ff] p-4 rounded-xl border border-[#c2c6d8]/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-[#727687]">Progress</span>
                <span className="bg-[#dae1ff] text-[#0050cb] font-bold text-[12px] px-3 py-0.5 rounded-full">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#e6e7f4] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent === 0 ? 'bg-transparent' : progressPercent <= 30 ? 'bg-red-500' : progressPercent <= 75 ? 'bg-amber-500' : 'bg-[#0050cb]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Access Error Banner */}
        {accessError && (
          <div className="bg-red-50 rounded-xl p-4 flex items-start gap-3 text-red-700 text-[14px] font-semibold mb-4 border border-red-200 animate-in slide-in-from-top-2 duration-300">
            <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{accessError}</span>
              {!hasActiveUtbkPlan() && (
                <button
                  onClick={() => navigate('/paket-belajar')}
                  className="ml-2 text-[#0050cb] hover:underline font-bold text-[13px]"
                >
                  Upgrade →
                </button>
              )}
            </div>
            <button onClick={() => setAccessError(null)} className="text-red-400 hover:text-red-600 shrink-0 ml-2 mt-0.5 font-bold text-[16px] leading-none">✕</button>
          </div>
        )}

        {/* Info Alert Box */}
        {!hasActiveUtbkPlan() && (!registrationStatus || registrationStatus.status !== 'approved') ? (
          <div className="bg-[#f2f3ff] rounded-xl p-4 flex items-center gap-3 text-[#424656] text-[14px] font-semibold mb-8 border border-[#dae1ff]">
            <Info size={20} className="text-[#0050cb] shrink-0" />
            <span>Yuk, daftar tryout ini! Klik <strong>Daftar Sekarang</strong> di bawah.</span>
          </div>
        ) : (
          <div className="bg-[#f2f3ff] rounded-xl p-4 flex items-center gap-3 text-[#424656] text-[14px] font-semibold mb-8 border border-[#dae1ff]/60">
            <Info size={20} className="text-[#0050cb] shrink-0" />
            <span>Pilih yang mau kamu kerjakan dulu, bebas urutannya!</span>
          </div>
        )}

        {/* Subtes Cards Grouped Layout */}
        <div className="space-y-8 mb-12">
          {groupedSubjects.map((group, groupIdx) => {
            const isCollapsed = collapsedGroups[group.category];

            return (
              <div key={groupIdx} className="w-full">
                {/* Group Header */}
                <div 
                  onClick={() => toggleGroup(group.category)}
                  className="flex items-center justify-between mb-4 cursor-pointer select-none group/hdr"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] sm:text-[18px] font-bold text-[#191b24] tracking-tight">
                      {group.category}
                    </h2>
                    <span className="text-[14px] font-semibold text-[#0050cb] ml-1">
                      {group.completedCount}/{group.totalCount}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#0050cb] group-hover/hdr:bg-[#f2f3ff] transition-colors">
                    {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                  </div>
                </div>

                {/* Subtests Cards Grid */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {group.items.map((sub, idx) => {
                      const isDone = completedSubtests.has(sub.name);
                      const isStarting = startingSubtest === sub.name;
                      const isLocked = !hasActiveUtbkPlan() && (!registrationStatus || registrationStatus.status !== 'approved') && !isDone;

                      return (
                        <div
                          key={idx}
                          onClick={() => !isDone && !isStarting && handleStartSubtest(sub.name)}
                          className={`bg-white rounded-2xl p-5 border transition-all ${
                            isDone 
                              ? 'border-[#c2c6d8]/30 cursor-default' 
                              : isLocked
                              ? 'border-[#c2c6d8]/40 hover:border-[#0050cb]/50 cursor-pointer bg-white'
                              : 'border-[#c2c6d8]/30 hover:shadow-md hover:border-[#0050cb]/40 active:scale-[0.99] cursor-pointer'
                          }`}
                        >
                          {/* Title */}
                          <h3 className="text-[15px] sm:text-[16px] font-bold text-[#191b24] mb-4 leading-snug">
                            {sub.name}
                          </h3>

                          {/* Details Row */}
                          <div className="flex items-center justify-between text-[13px] text-[#424656] font-medium mb-3">
                            {/* Left: Duration */}
                            <div className="flex items-center gap-1.5">
                              <Clock size={16} className="text-[#0050cb]" />
                              <span>
                                {isDone 
                                  ? `${formatSubtestDurationText(sub.durationMin, sub.durationSec)} / ${formatSubtestDurationText(sub.durationMin, sub.durationSec)}` 
                                  : formatSubtestDurationText(sub.durationMin, sub.durationSec)}
                              </span>
                            </div>

                            {/* Right: Questions & Arrow/Check/Lock Badge */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <FileText size={16} className="text-[#0050cb]" />
                                <span>
                                  {isDone 
                                    ? `${answeredCounts[sub.name] !== undefined ? answeredCounts[sub.name] : (sub.questionCount || 0)} / ${sub.questionCount || 0} soal` 
                                    : `${sub.questionCount || 0} soal`}
                                </span>
                              </div>

                              {/* Status Badge Icon */}
                              {isDone ? (
                                <div className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center text-white shrink-0 ml-1 shadow-sm">
                                  <Check size={13} strokeWidth={3} />
                                </div>
                              ) : isLocked ? (
                                <div className="w-6 h-6 rounded-full bg-[#dae1ff] flex items-center justify-center text-[#0050cb] shrink-0 ml-1">
                                  <Lock size={14} strokeWidth={2.5} />
                                </div>
                              ) : (
                                <ChevronRight size={18} className="text-[#0050cb] shrink-0 ml-1" />
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {(() => {
                            const subPercent = isDone ? (answeredCounts[sub.name] !== undefined ? Math.round((answeredCounts[sub.name] / (sub.questionCount || 1)) * 100) : 100) : 0;
                            const subColor = subPercent === 0 ? 'bg-transparent' : subPercent <= 30 ? 'bg-red-500' : subPercent <= 75 ? 'bg-amber-500' : 'bg-[#0050cb]';
                            return (
                              <div className="w-full h-4 rounded-full mb-2.5 bg-[#e6e7f4]">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 flex items-center justify-end ${subPercent >= 15 ? 'pr-2' : ''} ${subColor}`}
                                  style={{ width: `${subPercent}%` }}
                                >
                                  {subPercent >= 15 && (
                                    <span className="text-[10px] font-bold text-white leading-none">
                                      {subPercent}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Status Text */}
                          {isDone ? (
                            <p className="text-[13px] font-bold text-[#10b981]">
                              Selesai dikerjakan
                            </p>
                          ) : isStarting ? (
                            <p className="text-[13px] font-bold text-[#0050cb] animate-pulse">
                              Memuat...
                            </p>
                          ) : isLocked ? (
                            <p className="text-[13px] font-semibold text-[#0050cb] flex items-center gap-1">
                              <span>Terkunci (Perlu Pendaftaran)</span>
                            </p>
                          ) : (
                            <p className="text-[13px] font-semibold text-[#727687]">
                              Belum dikerjakan
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </main>

      {/* Floating Action Bar ("Daftar Sekarang" button for unapproved free users) */}
      {!hasActiveUtbkPlan() && (!registrationStatus || registrationStatus.status !== 'approved') && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-md flex justify-center pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
          <button
            id="daftar-sekarang-btn"
            onClick={() => {
              const now = new Date();
              const startDate = parseLocalDate(pkg?.scheduled_at);
              const endDate = parseLocalDate(pkg?.end_date);
              if (startDate && startDate > now) {
                setAccessModal({ open: true, type: 'not_started', startDate, endDate });
                return;
              }
              if (endDate && endDate < now) {
                setAccessModal({ open: true, type: 'expired', startDate, endDate });
                return;
              }
              setShowVerificationModal(true);
            }}
            className="w-full py-3.5 sm:py-4 px-8 text-white font-extrabold text-[15px] sm:text-[17px] rounded-full shadow-[0_10px_30px_rgba(0,80,203,0.35)] hover:shadow-[0_12px_36px_rgba(0,80,203,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 backdrop-blur-md border border-white/20"
            style={{ background: 'linear-gradient(135deg, #0050cb 0%, #3b82f6 100%)' }}
          >
            <span>
              {registrationStatus?.status === 'pending'
                ? 'Cek Status Pendaftaran'
                : registrationStatus?.status === 'rejected'
                ? 'Daftar Ulang Tryout'
                : 'Daftar Sekarang'}
            </span>
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
      )}



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

      {isUsingQuota && !quotaAlreadyDeducted ? (
        <TryoutQuotaConfirmModal
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            if (selectedSubtest) {
              startSubtestDirectly(selectedSubtest.name);
            }
          }}
          packageTitle={pkg?.title || 'Paket Tryout UTBK-SNBT'}
          subtestName={selectedSubtest?.name}
          questionCount={selectedSubtest?.questionCount || 0}
          durationText={formatSubtestDurationText(selectedSubtest?.durationMin, selectedSubtest?.durationSec)}
          quotaRemaining={quotaPlan?.quota_remaining ?? 1}
          targetPtn={savedPtn}
          targetMajor={savedMajor}
        />
      ) : (
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
            { label: 'Durasi', value: formatSubtestDurationText(selectedSubtest?.durationMin, selectedSubtest?.durationSec), icon: 'schedule' },
            ...(savedPtn ? [{ label: 'Target PTN', value: savedPtn, icon: 'school' }] : []),
            ...(savedMajor ? [{ label: 'Jurusan', value: savedMajor, icon: 'menu_book' }] : []),
          ]}
        />
      )}

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
                          <img src={getPtnLogo(ptn.id, ptn.logo)} alt={ptn.singkatan} className="w-10 h-10 rounded-lg object-contain bg-white border border-[#e6e7f4] p-1 shrink-0" onError={e => { e.target.style.display='none'; }} />
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

      {/* Professional Access & Restriction Notice Modal */}
      <TryoutAccessModal
        open={accessModal.open}
        type={accessModal.type}
        startDate={accessModal.startDate}
        endDate={accessModal.endDate}
        requiredPlan={accessModal.requiredPlan}
        onAction={accessModal.onAction}
        onClose={() => setAccessModal(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default TryoutSubtesSelect;