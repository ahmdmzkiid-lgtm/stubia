import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { subscriptionService } from '../services/api';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = () => {
    logout();
    navigate('/');
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

  // Group plans by type
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
    <div className="min-h-screen bg-[#faf8ff] text-[#191b24] font-sans">
      {/* Header */}
      <nav className="bg-white border-b border-[#c2c6d8]/30 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center">
            <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 sm:h-10 md:h-12" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm font-semibold text-[#424656] hover:text-[#0050cb] transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* ── Profile Card ── */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#c2c6d8]/30 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0050cb] to-[#003fa4] flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
              {initials}
            </div>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-[#191b24]">{user?.name || 'User'}</h1>
              <p className="text-sm text-[#727687] mt-0.5">{user?.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#dae1ff] text-[#0050cb]">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  {user?.role === 'admin' ? 'Admin' : 'Student'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ecedfa] text-[#424656]">
                  <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                  Bergabung {user?.created_at ? formatDate(user.created_at) : '-'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Keluar
            </button>
          </div>
        </section>

        {/* ── Active Plans ── */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#c2c6d8]/30 shadow-sm">
          <h2 className="text-lg font-bold text-[#191b24] mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0050cb]">workspace_premium</span>
            Paket Aktif
          </h2>

          {!hasActivePlan ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-5xl text-[#c2c6d8] mb-3">workspace_premium</span>
              <p className="text-[#727687] text-sm mb-4">Kamu belum memiliki paket aktif. Upgrade sekarang untuk akses penuh!</p>
              <Link
                to="/paket-belajar"
                className="inline-block bg-[#0050cb] hover:bg-[#003fa4] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md"
              >
                Lihat Paket Belajar
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subscription Plans */}
              {subscriptionPlans.map((plan) => {
                const days = daysRemaining(plan.expires_at);
                const isExpiringSoon = days <= 7 && days > 0;
                return (
                  <div
                    key={plan.id}
                    className="bg-gradient-to-r from-[#f0f4ff] to-white rounded-xl p-5 border border-[#c2c6d8]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#0050cb]/10 text-[#0050cb] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">
                          {plan.plan_type === 'access' ? 'all_inclusive' : 'subscriptions'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-[#191b24]">{plan.display_name}</h4>
                        <p className="text-xs text-[#727687] mt-0.5">
                          {plan.target_type === 'um' ? 'Ujian Mandiri' : 'UTBK/SNBT'}
                          {' · '}
                          {plan.plan_type === 'access' ? 'Akses Tak Terbatas' : 'Langganan'}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isExpiringSoon
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : days > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {days > 0 ? `${days} hari lagi` : 'Kedaluwarsa'}
                          </span>
                          <span className="text-xs text-[#727687]">
                            {plan.expires_at ? `s/d ${formatDate(plan.expires_at)}` : 'Selamanya'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Quota Plans */}
              {quotaPlans.map((plan) => {
                const days = daysRemaining(plan.expires_at);
                const remaining = plan.quota_remaining ?? 0;
                const total = plan.quota_limit ?? 0;
                const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
                return (
                  <div
                    key={plan.id}
                    className="bg-gradient-to-r from-emerald-50 to-white rounded-xl p-5 border border-[#c2c6d8]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">local_activity</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-[#191b24]">{plan.display_name}</h4>
                        <p className="text-xs text-[#727687] mt-0.5">
                          {plan.target_type === 'um' ? 'Ujian Mandiri' : 'UTBK/SNBT'}
                          {' · '}Kuota Tryout
                        </p>
                        {/* Progress bar */}
                        <div className="mt-3 max-w-xs">
                          <div className="flex items-center justify-between text-xs text-[#727687] mb-1">
                            <span>Sisa: <strong>{remaining}</strong> dari {total} tryout</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full h-2 bg-[#ecedfa] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-[#727687] mt-2">
                          {days > 0 ? `Masa aktif: s/d ${formatDate(plan.expires_at)} (${days} hari)` : 'Kedaluwarsa'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Account Info ── */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#c2c6d8]/30 shadow-sm">
          <h2 className="text-lg font-bold text-[#191b24] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0050cb]">info</span>
            Informasi Akun
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-[#c2c6d8]/10 gap-1 sm:gap-4">
              <span className="text-[#727687] shrink-0">Nama</span>
              <span className="font-semibold text-[#191b24] text-left sm:text-right break-all">{user?.name || '-'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-[#c2c6d8]/10 gap-1 sm:gap-4">
              <span className="text-[#727687] shrink-0">Email</span>
              <span className="font-semibold text-[#191b24] text-left sm:text-right break-all">{user?.email || '-'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-[#c2c6d8]/10 gap-1 sm:gap-4">
              <span className="text-[#727687] shrink-0">Role</span>
              <span className="font-semibold capitalize text-[#191b24] text-left sm:text-right">{user?.role || '-'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1 sm:gap-4">
              <span className="text-[#727687] shrink-0">Bergabung sejak</span>
              <span className="font-semibold text-[#191b24] text-left sm:text-right">{user?.created_at ? formatDate(user.created_at) : '-'}</span>
            </div>
          </div>
        </section>

        {/* ── Quick Links ── */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-[#c2c6d8]/30 shadow-sm">
          <h2 className="text-lg font-bold text-[#191b24] mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0050cb]">link</span>
            Tautan Cepat
          </h2>
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 gap-3">
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
                className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl bg-[#faf8ff] hover:bg-[#dae1ff]/30 text-[#424656] hover:text-[#0050cb] transition-all text-xs sm:text-sm font-medium"
              >
                <span className="material-symbols-outlined text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
