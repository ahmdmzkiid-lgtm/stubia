import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function CMSLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { path: '/cms', icon: 'dashboard', label: 'Overview' },
    { path: '/cms/articles', icon: 'article', label: 'Artikel & Blog' },
    { path: '/cms/careers', icon: 'work', label: 'Lowongan Kerja' },
    { path: '/cms/activity', icon: 'history', label: 'Aktivitas Admin' },
  ];

  const filteredLinks = navLinks.filter(link => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'article_writer') {
      return link.path === '/cms/articles';
    }
    return false; // other roles don't have CMS access
  });

  const isAllowedPath = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return filteredLinks.some(link => currentPath === link.path || currentPath.startsWith(link.path + '/'));
  };

  const showBackToAdmin = user?.role === 'admin';

  return (
    <div className="bg-[#faf8ff] text-[#191b24] antialiased min-h-screen flex font-sans">
      
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/25 backdrop-blur-sm z-[110] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <nav 
        className={`h-screen w-64 fixed left-0 top-0 z-[120] border-r border-[#c2c6d8]/60 bg-white flex flex-col py-6 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="px-6 mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-[#0050cb] leading-[28px] tracking-tight">Stubia CMS</h1>
            <p className="text-[11px] font-semibold text-[#727687] leading-[14px]">Corporate & HR Hub</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f3ff] transition-all text-[#424656]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          {filteredLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-bold transition-all duration-200 group group-hover:text-[#0050cb] ${
                  isActive 
                    ? 'bg-[#f2f3ff] text-[#0050cb]' 
                    : 'text-[#424656] hover:bg-[#f2f3ff]/50 hover:text-[#0050cb]'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] transition-colors ${isActive ? 'text-[#0050cb]' : 'text-[#727687] group-hover:text-[#0050cb]'}`}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer / User info */}
        <div className="px-4 mt-auto pt-6 border-t border-[#c2c6d8]/30">
          <div className="bg-[#f2f3ff]/60 rounded-xl p-3.5 mb-3 border border-[#c2c6d8]/20">
            <p className="text-[13px] font-bold text-[#191b24] truncate">{user?.name || 'Administrator'}</p>
            <p className="text-[11px] text-[#727687] truncate capitalize">{user?.role?.replace('_', ' ') || 'admin@stubia.id'}</p>
          </div>

          {showBackToAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13px] font-bold text-[#424656] hover:bg-[#f2f3ff]/50 hover:text-[#0050cb] mb-2 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Kembali ke Admin</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13px] font-bold text-[#ba1a1a] hover:bg-red-50 hover:text-[#ba1a1a]/80 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Keluar</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#c2c6d8]/40 bg-white/80 backdrop-blur-md sticky top-0 z-[100] px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#f2f3ff] text-[#424656] transition-all"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-[16px] font-bold text-[#191b24]">
              {navLinks.find(link => link.path === currentPath)?.label || 'Overview'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Admin Mode
            </span>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-6 md:p-8 max-w-[1440px] w-full mx-auto">
          {!isAllowedPath() ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#c2c6d8]/30 text-center min-h-[50vh] shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-[#ba1a1a] mb-6">
                <span className="material-symbols-outlined text-[32px]">block</span>
              </div>
              <h3 className="text-[20px] font-bold text-[#191b24] mb-2">Akses Dibatasi</h3>
              <p className="text-[14px] text-[#727687] max-w-md">
                Akun Anda ({user?.role?.replace('_', ' ').toUpperCase()}) tidak memiliki wewenang untuk mengakses halaman ini.
              </p>
              <button
                onClick={() => navigate(filteredLinks[0]?.path || '/dashboard')}
                className="mt-6 px-6 py-3 bg-[#0050cb] hover:bg-[#003da6] text-white font-bold rounded-xl transition-all shadow-md text-[14px]"
              >
                Kembali ke Halaman Utama
              </button>
            </div>
          ) : (
            <React.Suspense fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-2 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
              </div>
            }>
              <Outlet />
            </React.Suspense>
          )}
        </main>
      </div>

    </div>
  );
}
