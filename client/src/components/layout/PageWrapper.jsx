import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import Footer from '../Footer';

// Shared light-theme navbar for pages that need PageWrapper (e.g. Bookmark)
const LightNavbar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/latihan', label: 'Latihan' },
    { to: '/tryout/packages', label: 'Tryout' },
    { to: '/riwayat', label: 'Riwayat' },
  ];
  return (
    <header className="sticky top-0 z-[100] w-full bg-[#faf8ff]/90 border-b border-[#c2c6d8]/40 backdrop-blur-md shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-6 lg:gap-10">
          <Link to="/dashboard" className="text-[20px] sm:text-[24px] font-bold text-[#0050cb] leading-none">Eduzet</Link>
          <nav className="hidden lg:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.to} to={l.to} className="px-4 py-2 text-[14px] font-medium text-[#424656] hover:text-[#0050cb] transition-colors rounded-lg hover:bg-[#f0f3ff]">
                {l.label}
              </Link>
            ))}
            {isAdmin && <Link to="/admin" className="px-4 py-2 text-[14px] font-medium text-[#a33200] hover:text-[#cc4204] transition-colors">Admin</Link>}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-[14px] font-medium text-[#191b24]">{user?.name?.split(' ')[0]}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#727687]">Pelajar</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#0050cb] flex items-center justify-center text-white font-bold text-sm border-2 border-[#dae1ff]">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <button onClick={handleLogout} className="flex items-center justify-center w-10 h-10 rounded-full text-[#727687] hover:text-red-500 hover:bg-red-50 transition-all" title="Logout">
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full text-[#424656]">
            <span className="material-symbols-outlined text-[24px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[101] bg-black/50 lg:hidden animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-0 left-0 right-0 bg-white rounded-b-[32px] shadow-2xl p-6 pt-20 animate-slide-down" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <Link to="/dashboard" className="text-[20px] font-bold text-[#0050cb]">Eduzet</Link>
              <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#424656]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {links.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileMenuOpen(false)} className="px-5 py-4 rounded-2xl text-[16px] font-bold text-[#424656] hover:bg-[#f2f3ff] transition-colors">{l.label}</Link>
              ))}
              {isAdmin && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-5 py-4 rounded-2xl text-[16px] font-bold text-[#a33200] hover:bg-[#f2f3ff] transition-colors">Admin</Link>}
            </nav>
            <hr className="my-6 border-[#c2c6d8]/20" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0050cb] flex items-center justify-center text-white font-bold text-lg">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#191b24]">{user?.name?.split(' ')[0]}</p>
                  <p className="text-[12px] font-bold uppercase text-[#727687]">Pelajar</p>
                </div>
              </div>
              <button onClick={handleLogout} className="px-6 py-3 rounded-xl text-[14px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 border border-red-100">
                <span className="material-symbols-outlined text-[18px]">logout</span> Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const PageWrapper = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#faf8ff', fontFamily: "'Inter', sans-serif" }}>
      <LightNavbar />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#fff', color: '#191b24', border: '1px solid #c2c6d8' },
          success: { iconTheme: { primary: '#0050cb', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
};

export default PageWrapper;
