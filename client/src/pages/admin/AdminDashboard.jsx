import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { adminService, settingsService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const currentPath = location.pathname;
  const isOverview = currentPath === '/admin' && user?.role === 'admin';

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  const handleVerifyPin = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      toast.error('Masukkan PIN Admin!');
      return;
    }
    setVerifyingPin(true);
    try {
      await settingsService.verifyPin(pin.trim());
      toast.success('PIN Terverifikasi! Membuka CMS...');
      setShowPinModal(false);
      setPin('');
      navigate('/cms');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        toast.error('PIN Admin salah! Akses ditolak.');
      } else {
        toast.error('Gagal memverifikasi PIN Admin.');
      }
    } finally {
      setVerifyingPin(false);
    }
  };

  useEffect(() => {
    if (isOverview) {
      setLoading(true);
      adminService.getStats()
        .then(res => setStats(res.data.data))
        .catch(() => toast.error('Gagal memuat statistik'))
        .finally(() => setLoading(false));
    }
  }, [isOverview]);

  useEffect(() => {
    if (user) {
      if (user.role === 'article_writer') {
        navigate('/cms/articles', { replace: true });
      } else if (user.role === 'question_writer' || user.role === 'quality_assurance') {
        if (location.pathname === '/admin') {
          navigate('/admin/latihan', { replace: true });
        }
      }
    }
  }, [user, navigate, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { path: '/admin', icon: 'dashboard', label: 'Dashboard' },
    { path: '/admin/tryout-dashboard', icon: 'analytics', label: 'Dashboard Tryout' },
    { path: '/admin/question-review', icon: 'rate_review', label: 'Review Soal' },
    { path: '/admin/duplicates', icon: 'content_paste_off', label: 'Scanner Duplikat' },
    { path: '/admin/vouchers', icon: 'confirmation_number', label: 'Voucher Diskon' },
    { path: '/admin/latihan', icon: 'assignment', label: 'Manage Latihan' },
    { path: '/admin/tryout', icon: 'quiz', label: 'Manage Tryout' },
    { path: '/admin/battle', icon: 'swords', label: 'Manage Battle 1vs1' },
    { path: '/admin/ujian-mandiri', icon: 'school', label: 'Manage Ujian Mandiri' },
    { path: '/admin/skd-latihan', icon: 'assignment', label: 'Manage Latihan SKD' },
    { path: '/admin/skd-tryout', icon: 'quiz', label: 'Manage Tryout SKD' },
    { path: '/admin/tryout-registrations', icon: 'verified', label: 'Verifikasi Tryout' },
    { path: '/admin/social-verifications', icon: 'favorite', label: 'Verifikasi Latihan' },
    { path: '/admin/users', icon: 'group', label: 'Users' },
    { path: '/admin/settings', icon: 'ad_units', label: 'Banner' },
    { path: '/admin/activity', icon: 'monitoring', label: 'Activity' },
  ];

  const filteredNavLinks = navLinks.filter((link) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'question_writer') {
      return [
        '/admin/tryout-dashboard',
        '/admin/question-review',
        '/admin/duplicates',
        '/admin/latihan',
        '/admin/tryout',
        '/admin/battle',
        '/admin/ujian-mandiri',
        '/admin/skd-latihan',
        '/admin/skd-tryout',
      ].includes(link.path);
    }
    if (user.role === 'quality_assurance') {
      return [
        '/admin/tryout-dashboard',
        '/admin/question-review',
        '/admin/duplicates',
        '/admin/latihan',
        '/admin/tryout',
        '/admin/ujian-mandiri',
        '/admin/skd-latihan',
        '/admin/skd-tryout',
      ].includes(link.path);
    }
    return false;
  });

  const isAllowedPath = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (location.pathname === '/admin') return true;
    return filteredNavLinks.some(
      (link) =>
        location.pathname === link.path ||
        location.pathname.startsWith(link.path + '/')
    );
  };

  return (
    <div className="light bg-[#faf8ff] text-[#191b24] antialiased min-h-screen flex">
      
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* SideNavBar */}
      <nav 
        className={`h-screen w-64 fixed left-0 top-0 z-[120] border-r border-[#c2c6d8] bg-white flex flex-col py-6 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="px-6 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-semibold text-[#0050cb] leading-[32px]">Stubia Admin</h1>
            <p className="text-[12px] font-semibold text-[#727687] leading-[16px] capitalize">{user?.role?.replace('_', ' ') || 'Super Admin'}</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f2f3ff] transition-all text-[#424656]"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          {filteredNavLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-lg mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all ${
                  isActive
                    ? 'bg-[#0066ff] text-white'
                    : 'text-[#424656] hover:bg-[#e6e7f4]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                <span className="text-[14px] font-medium leading-[20px] tracking-[0.01em]">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-64">
        
        {/* Top Bar */}
        <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-[#c2c6d8]/30 px-4 sm:px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-[#f2f3ff] transition-all text-[#424656] lg:hidden"
            >
              <span className="material-symbols-outlined text-[28px]">
                {isSidebarOpen ? 'close' : 'menu'}
              </span>
            </button>
            <div className="hidden sm:block">
              <h2 className="text-[20px] font-bold text-[#191b24]">
                {navLinks.find(l => l.path === currentPath)?.label || 'Overview'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button 
              onClick={() => setShowPinModal(true)}
              className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-full bg-[#f2f3ff] hover:bg-[#0050cb] text-[#0050cb] hover:text-white font-bold text-xs border border-[#c2c6d8]/30 transition-all cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">lock_open</span>
              <span className="hidden sm:inline">Login CMS</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[14px] font-bold text-[#191b24]">{user?.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#0050cb] font-bold">Super Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0050cb] flex items-center justify-center text-white font-bold shadow-lg shadow-[#0050cb]/20">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ffdad6] text-[#727687] hover:text-[#ba1a1a] transition-all"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
          <div className="max-w-[1440px] mx-auto">
            {!isAllowedPath() ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#c2c6d8]/30 text-center min-h-[50vh] shadow-sm animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-[#ba1a1a] mb-6">
                  <span className="material-symbols-outlined text-[32px]">block</span>
                </div>
                <h3 className="text-[20px] font-bold text-[#191b24] mb-2">Akses Dibatasi</h3>
                <p className="text-[14px] text-[#727687] max-w-md">
                  Akun Anda ({user?.role?.replace('_', ' ').toUpperCase()}) tidak memiliki wewenang untuk mengakses halaman ini.
                </p>
                <button
                  onClick={() => navigate(filteredNavLinks[0]?.path || '/dashboard')}
                  className="mt-6 px-6 py-3 bg-[#0050cb] hover:bg-[#003da6] text-white font-bold rounded-xl transition-all shadow-md text-[14px]"
                >
                  Kembali ke Halaman Utama
                </button>
              </div>
            ) : isOverview ? (
              <div className="space-y-8 sm:space-y-12">
                <section>
                  <h2 className="text-[28px] sm:text-[40px] font-bold text-[#191b24] mb-2 leading-tight">Platform at a Glance</h2>
                  <p className="text-[#424656] text-[15px] sm:text-[16px]">Monitor real-time performance of your learning ecosystem.</p>
                </section>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[
                    { label: 'Total Pengguna', value: stats?.users?.total, icon: 'group', color: '#0050cb', bg: '#dae1ff' },
                    { label: 'Total Soal', value: stats?.questions?.total, icon: 'assignment', color: '#006688', bg: '#c2e8ff' },
                    { label: 'Sesi Tryout', value: stats?.sessions?.total, icon: 'analytics', color: '#a33200', bg: '#ffdbd0' },
                    { label: 'Mata Pelajaran', value: stats?.subjectStats?.length, icon: 'school', color: '#006a6a', bg: '#80f2f2' },
                  ].map((card, i) => (
                    <div key={i} className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-[#c2c6d8]/30 shadow-sm hover:shadow-xl transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: card.bg, color: card.color }}>
                          <span className="material-symbols-outlined">{card.icon}</span>
                        </div>
                        <span className="text-[12px] font-bold text-[#00c1fd] bg-[#00c1fd]/10 px-3 py-1 rounded-full">+12%</span>
                      </div>
                      <p className="text-[14px] font-bold text-[#424656] mb-1">{card.label}</p>
                      <h3 className="text-[28px] sm:text-[32px] font-bold text-[#191b24]">{loading ? '...' : card.value?.toLocaleString('id-ID')}</h3>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  {/* Table */}
                  <div className="lg:col-span-2 bg-white rounded-[24px] sm:rounded-[32px] border border-[#c2c6d8]/30 shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-8 border-b border-[#c2c6d8]/20 flex justify-between items-center">
                      <h4 className="text-[18px] sm:text-[20px] font-bold">Recent User Activity</h4>
                      <button className="text-[13px] sm:text-[14px] font-bold text-[#0050cb] hover:underline">View All Users</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[500px]">
                        <thead>
                          <tr className="bg-[#f2f3ff]/50">
                            <th className="px-6 sm:px-8 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">User</th>
                            <th className="px-6 sm:px-8 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">Role</th>
                            <th className="px-6 sm:px-8 py-4 text-[12px] font-bold text-[#424656] uppercase tracking-widest">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#c2c6d8]/10">
                          {stats?.recentUsers?.slice(0, 5).map((u) => (
                            <tr key={u.id} className="hover:bg-[#f2f3ff]/30 transition-colors">
                              <td className="px-6 sm:px-8 py-4 sm:py-6 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#0050cb] flex items-center justify-center text-white font-bold shrink-0">
                                  {u.name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-[15px]">{u.name}</p>
                                  <p className="text-[12px] text-[#424656] break-all">{u.email}</p>
                                </div>
                              </td>
                              <td className="px-6 sm:px-8 py-4 sm:py-6">
                                <span className={`px-3 py-1 rounded-full text-[12px] font-bold capitalize ${u.role === 'admin' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#dae1ff] text-[#0050cb]'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-6 sm:px-8 py-4 sm:py-6 text-[14px] text-[#424656]">
                                {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top Subjects */}
                  <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-[#c2c6d8]/30 shadow-sm p-6 sm:p-8">
                    <h4 className="text-[18px] sm:text-[20px] font-bold mb-6 sm:mb-8">Popular Subjects</h4>
                    <div className="space-y-8">
                      {stats?.subjectStats?.slice(0, 5).map((s, i) => {
                        const maxCount = stats.subjectStats[0]?.question_count || 1;
                        const pct = Math.round((s.question_count / maxCount) * 100);
                        return (
                          <div key={i} className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-[15px]">{s.name}</span>
                              <span className="text-[12px] font-bold text-[#0050cb]">{s.question_count} soal</span>
                            </div>
                            <div className="w-full h-2.5 bg-[#f2f3ff] rounded-full overflow-hidden">
                              <div className="h-full bg-[#0050cb] rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>

      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowPinModal(false); setPin(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 sm:p-8 relative animate-[fadeInScale_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => { setShowPinModal(false); setPin(''); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-[#f2f3ff] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[28px] text-[#0050cb]">shield_lock</span>
              </div>
              <h3 className="text-xl font-bold text-[#191b24]">Masuk ke CMS Portal</h3>
              <p className="text-sm text-[#727687] mt-1">Masukkan PIN Admin untuk melanjutkan</p>
            </div>

            <form onSubmit={handleVerifyPin}>
              <div className="mb-4">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Masukkan PIN Admin"
                  autoFocus
                  className="w-full text-center text-2xl tracking-[0.5em] font-bold bg-[#f2f3ff] border border-[#c2c6d8]/50 rounded-xl py-4 px-4 text-[#191b24] placeholder:text-[#727687] placeholder:text-sm placeholder:tracking-normal placeholder:font-normal focus:ring-2 focus:ring-[#0050cb] focus:border-[#0050cb] outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={verifyingPin || !pin.trim()}
                className="w-full bg-[#0050cb] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#003d9e] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#0050cb]/20"
              >
                {verifyingPin ? (
                  <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Memverifikasi...</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">login</span> Masuk CMS</>
                )}
              </button>
            </form>

            <p className="text-xs text-[#727687] text-center mt-4">
              PIN dapat diubah di halaman <strong>Pengaturan</strong>
            </p>
          </div>
        </div>
      )}

          </div>
  );
};

export default AdminDashboard;
