import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { subscriptionService, authService } from '../services/api';
import { PTN_DATA, getPtnLogo } from '../data/ptnData';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [name, setName] = useState('');
  const [targetPtn, setTargetPtn] = useState('');
  const [targetMajor, setTargetMajor] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Search Select States
  const [ptnSearch, setPtnSearch] = useState('');
  const [showPtnDropdown, setShowPtnDropdown] = useState(false);
  const [majorSearch, setMajorSearch] = useState('');
  const [showMajorDropdown, setShowMajorDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setTargetPtn(user.target_ptn || '');
      setTargetMajor(user.target_major || '');
      setPtnSearch(user.target_ptn || '');
      setMajorSearch(user.target_major || '');
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    subscriptionService.getActivePlans()
      .then(res => setActivePlans(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const selectedPtnObj = useMemo(() => {
    if (!targetPtn) return null;
    return PTN_DATA.find(p => targetPtn.includes(p.singkatan) || targetPtn.includes(p.nama));
  }, [targetPtn]);

  // Filter PTNs
  const filteredPtn = useMemo(() => {
    if (!ptnSearch.trim()) return PTN_DATA;
    const q = ptnSearch.toLowerCase();
    return PTN_DATA.filter(p => p.nama.toLowerCase().includes(q) || p.singkatan.toLowerCase().includes(q));
  }, [ptnSearch]);

  // Filter Majors
  const filteredMajors = useMemo(() => {
    if (!selectedPtnObj) return [];
    const prodi = selectedPtnObj.prodi || [];
    if (!majorSearch.trim()) return prodi;
    const q = majorSearch.toLowerCase();
    return prodi.filter(m => m.nama.toLowerCase().includes(q));
  }, [selectedPtnObj, majorSearch]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong.');
      return;
    }
    setIsSubmittingProfile(true);
    try {
      const res = await authService.updateProfile({ 
        name, 
        target_ptn: targetPtn, 
        target_major: targetMajor 
      });
      if (res.data.success) {
        toast.success('Profil berhasil diperbarui!');
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui profil.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field password harus diisi.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password baru tidak cocok.');
      return;
    }
    setIsSubmittingPassword(true);
    try {
      const res = await authService.updatePassword({ oldPassword, newPassword });
      if (res.data.success) {
        toast.success('Password berhasil diperbarui!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const daysRemaining = (expiresAt) => {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const subscriptionPlans = activePlans.filter(p =>
    p.plan_type === 'subscription' || p.plan_type === 'access'
  );
  const quotaPlans = activePlans.filter(p => p.plan_type === 'quota');
  const hasActivePlan = activePlans.some(p => p.name !== 'gratis');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0050cb]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#faf8ff] via-[#f3f4fc] to-[#edf0fa] text-[#191b24] font-sans">
      {/* Glassmorphic Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#c2c6d8]/20 sticky top-0 z-30 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
        <div className="max-w-4xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center hover:opacity-90 transition-opacity">
            <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 sm:h-10 md:h-12" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs sm:text-sm font-bold text-[#424656] hover:text-[#0050cb] transition-colors flex items-center gap-1 bg-white border border-[#c2c6d8]/30 px-3.5 py-2 rounded-xl shadow-sm hover:shadow"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">
        
        {/* ── Premium Profile Hero Card ── */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_12px_40px_rgba(0,80,203,0.04)] backdrop-blur-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-36 h-36 bg-[#0050cb]/[0.02] rounded-full blur-2xl -mr-6 -mt-6" />
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar with gradient rotating-like border */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#0050cb] to-[#6d28d9] rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#0050cb] to-[#003fa4] flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0">
                {initials}
              </div>
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#191b24]">{user?.name || 'User'}</h1>
              <p className="text-sm font-medium text-[#727687] mt-1">{user?.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#dae1ff]/70 text-[#0050cb] border border-[#0050cb]/10">
                  <span className="material-symbols-outlined text-[15px]">person</span>
                  {user?.role === 'admin' ? 'Admin' : 'Siswa'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-white text-[#424656] border border-[#c2c6d8]/30 shadow-sm">
                  <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                  Bergabung {user?.created_at ? formatDate(user.created_at) : '-'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm text-red-500 hover:text-red-700 font-bold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors shrink-0 mt-2 sm:mt-0"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Keluar
            </button>
          </div>
        </section>

        {/* ── Active Plans ── */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_12px_40px_rgba(0,80,203,0.03)]">
          <h2 className="text-lg font-bold text-[#191b24] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0050cb] text-[22px]">workspace_premium</span>
            Paket Aktif
          </h2>

          {!hasActivePlan ? (
            <div className="text-center py-10 bg-[#faf8ff] border border-dashed border-[#c2c6d8]/50 rounded-2xl p-6">
              <span className="material-symbols-outlined text-5xl text-[#c2c6d8] mb-3">workspace_premium</span>
              <p className="text-[#727687] text-sm font-medium mb-5">Kamu belum memiliki paket aktif. Upgrade sekarang untuk mendapatkan akses belajar penuh!</p>
              <Link
                to="/paket-belajar"
                className="inline-flex bg-[#0050cb] hover:bg-[#003fa4] text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(0,80,203,0.2)] hover:shadow-[0_6px_20px_rgba(0,80,203,0.3)] active:scale-[0.98]"
              >
                Lihat Paket Belajar
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subscription Plans */}
              {subscriptionPlans.map((plan) => {
                const days = daysRemaining(plan.expires_at);
                const isExpiringSoon = days <= 7 && days > 0;
                return (
                  <div
                    key={plan.id}
                    className="bg-gradient-to-br from-[#0050cb]/[0.02] to-[#6d28d9]/[0.02] rounded-2xl p-5 border border-[#0050cb]/10 flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#0050cb]/10 text-[#0050cb] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">
                        {plan.plan_type === 'access' ? 'all_inclusive' : 'subscriptions'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#191b24] truncate">{plan.display_name}</h4>
                      <p className="text-xs text-[#727687] font-semibold mt-0.5">
                        {plan.target_type === 'um' ? 'Ujian Mandiri' : 'UTBK/SNBT'}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isExpiringSoon
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : days > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {days > 0 ? `${days} Hari Lagi` : 'Kedaluwarsa'}
                        </span>
                        <span className="text-[11px] font-medium text-[#727687]">
                          {plan.expires_at ? `s/d ${formatDate(plan.expires_at)}` : 'Akses Selamanya'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Quota Plans */}
              {quotaPlans.map((plan) => {
                const remaining = plan.quota_remaining ?? 0;
                const total = plan.quota_limit ?? 0;
                const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
                return (
                  <div
                    key={plan.id}
                    className="bg-gradient-to-br from-emerald-500/[0.02] to-teal-500/[0.02] rounded-2xl p-5 border border-emerald-500/10 flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">local_activity</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#191b24] truncate">{plan.display_name}</h4>
                      <p className="text-xs text-[#727687] font-semibold mt-0.5">Kuota Ujian</p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-[#727687] mb-1.5 font-bold">
                          <span>Sisa {remaining} / {total} tryout</span>
                          <span className="text-emerald-700">{pct}%</span>
                        </div>
                        <div className="w-full bg-[#e6e7f4] h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Account Info ── */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_12px_40px_rgba(0,80,203,0.03)]">
          <h2 className="text-lg font-bold text-[#191b24] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0050cb] text-[22px]">info</span>
            Informasi Akun
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Nama Lengkap', value: user?.name, icon: 'person' },
              { label: 'Alamat Email', value: user?.email, icon: 'mail' },
              { label: 'Universitas Target', value: user?.target_ptn, icon: 'school' },
              { label: 'Program Studi Target', value: user?.target_major, icon: 'menu_book' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#faf8ff] border border-[#c2c6d8]/15">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#c2c6d8]/20 text-[#0050cb] flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-[#727687]">{item.label}</p>
                  <p className="text-[14px] font-bold text-[#191b24] truncate mt-0.5">{item.value || '-'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Premium Edit Profile Section ── */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_12px_40px_rgba(0,80,203,0.03)]">
          <h2 className="text-lg font-bold text-[#191b24] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0050cb] text-[22px]">manage_accounts</span>
            Ubah Informasi Profil
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label htmlFor="name-input" className="block text-[11px] font-bold text-[#424656] uppercase tracking-wider mb-2">
                Nama Lengkap / Username
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727687] text-[20px]">badge</span>
                <input
                  id="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#c2c6d8]/50 text-sm focus:outline-none focus:border-[#0050cb] focus:ring-4 focus:ring-[#0050cb]/10 transition-all bg-white text-[#191b24] font-semibold shadow-sm"
                  placeholder="Masukkan nama lengkap Anda"
                />
              </div>
            </div>

            {/* Custom Autocomplete Universitas Target */}
            <div className="relative">
              <label htmlFor="ptn-select" className="block text-[11px] font-bold text-[#424656] uppercase tracking-wider mb-2">
                Universitas Target
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727687] text-[20px]">school</span>
                <input
                  id="ptn-select"
                  type="text"
                  placeholder="Ketik nama universitas target..."
                  value={ptnSearch}
                  onChange={(e) => {
                    setPtnSearch(e.target.value);
                    setShowPtnDropdown(true);
                  }}
                  onFocus={() => setShowPtnDropdown(true)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-[#c2c6d8]/50 text-sm focus:outline-none focus:border-[#0050cb] focus:ring-4 focus:ring-[#0050cb]/10 transition-all bg-white text-[#191b24] font-semibold shadow-sm"
                />
                {targetPtn && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white bg-[#0050cb] px-2 py-0.5 rounded shadow-sm">
                    {selectedPtnObj?.singkatan || 'OK'}
                  </span>
                )}
              </div>

              {showPtnDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPtnDropdown(false)} />
                  <div className="absolute left-0 right-0 mt-2 max-h-[240px] overflow-y-auto bg-white border border-[#c2c6d8]/30 rounded-2xl shadow-xl z-50 p-1.5 space-y-1" style={{ scrollbarWidth: 'thin' }}>
                    {filteredPtn.map(ptn => (
                      <button
                        key={ptn.id}
                        type="button"
                        onClick={() => {
                          setTargetPtn(`${ptn.nama} (${ptn.singkatan})`);
                          setPtnSearch(`${ptn.nama} (${ptn.singkatan})`);
                          setTargetMajor('');
                          setMajorSearch('');
                          setShowPtnDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left hover:bg-[#f5f5ff] transition-all group"
                      >
                        <img 
                          src={getPtnLogo(ptn.id, ptn.logo)} 
                          alt={ptn.singkatan} 
                          className="w-8 h-8 object-contain rounded-lg bg-white border border-[#c2c6d8]/20 p-1 shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#191b24] truncate group-hover:text-[#0050cb] transition-colors">{ptn.nama}</p>
                          <p className="text-[10px] text-[#727687]">{ptn.lokasi}</p>
                        </div>
                      </button>
                    ))}
                    {filteredPtn.length === 0 && (
                      <p className="text-center py-6 text-xs text-[#727687] font-semibold">Tidak ada universitas yang cocok</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Custom Autocomplete Program Studi Target */}
            <div className="relative">
              <label htmlFor="major-select" className="block text-[11px] font-bold text-[#424656] uppercase tracking-wider mb-2">
                Program Studi Target
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727687] text-[20px]">menu_book</span>
                <input
                  id="major-select"
                  type="text"
                  placeholder={selectedPtnObj ? "Ketik nama program studi..." : "Pilih Universitas Target terlebih dahulu"}
                  value={majorSearch}
                  disabled={!selectedPtnObj}
                  onChange={(e) => {
                    setMajorSearch(e.target.value);
                    setShowMajorDropdown(true);
                  }}
                  onFocus={() => setShowMajorDropdown(true)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#c2c6d8]/50 text-sm focus:outline-none focus:border-[#0050cb] focus:ring-4 focus:ring-[#0050cb]/10 transition-all bg-white text-[#191b24] font-semibold shadow-sm disabled:bg-[#f3f4f8] disabled:cursor-not-allowed disabled:border-[#c2c6d8]/20"
                />
              </div>

              {showMajorDropdown && selectedPtnObj && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMajorDropdown(false)} />
                  <div className="absolute left-0 right-0 mt-2 max-h-[240px] overflow-y-auto bg-white border border-[#c2c6d8]/30 rounded-2xl shadow-xl z-50 p-1.5 space-y-1" style={{ scrollbarWidth: 'thin' }}>
                    {filteredMajors.map((major, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTargetMajor(major.nama);
                          setMajorSearch(major.nama);
                          setShowMajorDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left hover:bg-[#f5f5ff] transition-all group"
                      >
                        <span className="text-[13px] font-bold text-[#191b24] truncate group-hover:text-[#0050cb] transition-colors">{major.nama}</span>
                        <span className="text-[11px] font-extrabold text-[#0050cb] bg-[#0050cb]/10 px-2.5 py-0.5 rounded-full shrink-0 border border-[#0050cb]/10">
                          Skor Target: {major.skor}
                        </span>
                      </button>
                    ))}
                    {filteredMajors.length === 0 && (
                      <p className="text-center py-6 text-xs text-[#727687] font-semibold">Tidak ada program studi yang cocok</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="bg-[#0050cb] hover:bg-[#003fa4] disabled:bg-[#0050cb]/50 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(0,80,203,0.2)] hover:shadow-[0_6px_20px_rgba(0,80,203,0.3)] active:scale-[0.98] flex items-center gap-2"
              >
                {isSubmittingProfile ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ── Ganti Kata Sandi ── */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_12px_40px_rgba(0,80,203,0.03)]">
          <h2 className="text-lg font-bold text-[#191b24] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0050cb] text-[22px]">lock_reset</span>
            Ganti Kata Sandi
          </h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="old-password-input" className="block text-[11px] font-bold text-[#424656] uppercase tracking-wider mb-2">
                Kata Sandi Sekarang
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727687] text-[20px]">lock</span>
                <input
                  id="old-password-input"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#c2c6d8]/50 text-sm focus:outline-none focus:border-[#0050cb] focus:ring-4 focus:ring-[#0050cb]/10 transition-all bg-white text-[#191b24] font-semibold shadow-sm"
                  placeholder="Masukkan kata sandi saat ini"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="new-password-input" className="block text-[11px] font-bold text-[#424656] uppercase tracking-wider mb-2">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727687] text-[20px]">vpn_key</span>
                  <input
                    id="new-password-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#c2c6d8]/50 text-sm focus:outline-none focus:border-[#0050cb] focus:ring-4 focus:ring-[#0050cb]/10 transition-all bg-white text-[#191b24] font-semibold shadow-sm"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password-input" className="block text-[11px] font-bold text-[#424656] uppercase tracking-wider mb-2">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#727687] text-[20px]">gpp_maybe</span>
                  <input
                    id="confirm-password-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#c2c6d8]/50 text-sm focus:outline-none focus:border-[#0050cb] focus:ring-4 focus:ring-[#0050cb]/10 transition-all bg-white text-[#191b24] font-semibold shadow-sm"
                    placeholder="Ulangi kata sandi baru"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="bg-[#0050cb] hover:bg-[#003fa4] disabled:bg-[#0050cb]/50 text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(0,80,203,0.2)] hover:shadow-[0_6px_20px_rgba(0,80,203,0.3)] active:scale-[0.98] flex items-center gap-2"
              >
                {isSubmittingPassword ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memperbarui...
                  </>
                ) : (
                  'Perbarui Kata Sandi'
                )}
              </button>
            </div>
          </form>
        </section>

        {/* ── Quick Links ── */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_12px_40px_rgba(0,80,203,0.03)]">
          <h2 className="text-lg font-bold text-[#191b24] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0050cb]">link</span>
            Tautan Cepat
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
              { to: '/paket-belajar', label: 'Paket Belajar', icon: 'card_membership' },
              { to: '/tryout/packages', label: 'Tryout', icon: 'quiz' },
              { to: '/latihan', label: 'Latihan Soal', icon: 'edit_note' },
              { to: '/ujian-mandiri', label: 'Ujian Mandiri', icon: 'account_balance' },
              { to: '/riwayat', label: 'Riwayat', icon: 'history' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl bg-[#faf8ff] border border-[#c2c6d8]/15 hover:bg-[#0050cb]/[0.04] text-[#424656] hover:text-[#0050cb] transition-all text-center group shadow-sm hover:shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#c2c6d8]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-lg">{link.icon}</span>
                </div>
                <span className="text-xs font-bold">{link.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
