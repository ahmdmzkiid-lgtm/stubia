import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function StudentNavbar({ user, isAdmin, onLogout, transparent = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [utbkDropdownOpen, setUtbkDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;

  useEffect(() => {
    const updateCartCount = () => {
      const storedCart = localStorage.getItem('stubia_cart');
      if (storedCart) {
        try {
          const parsed = JSON.parse(storedCart);
          setCartCount(Array.isArray(parsed) ? parsed.length : 0);
        } catch (e) {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();

    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cart-update', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cart-update', updateCartCount);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > (transparent ? 60 : 10));
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparent]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Determine active state for parent matching
  const isTryoutActive = activePath.startsWith('/tryout');
  const isUmActive = activePath.startsWith('/ujian-mandiri');

  // Desktop Main Nav Links
  const mainLinksBefore = [
    { to: '/dashboard', label: 'Dashboard', active: activePath === '/dashboard' },
  ];

  const utbkLinks = [
    { to: '/latihan', label: 'Latihan', active: activePath === '/latihan' },
    { to: '/tryout/packages', label: 'Tryout', active: isTryoutActive },
  ];

  const isUtbkActive = utbkLinks.some(l => l.active);

  const isSKDActive = activePath.startsWith('/skd');

  const mainLinksAfter = [
    { to: '/ujian-mandiri', label: 'Ujian Mandiri', active: isUmActive },
    { to: '/skd', label: 'SKD CPNS', active: isSKDActive },
    { to: '/paket-belajar', label: 'Paket Belajar', active: activePath === '/paket-belajar' },
  ];

  const dropdownLinks = [
    { to: '/battle', label: 'Battle', active: activePath === '/battle' },
    { to: '/riwayat', label: 'Riwayat', active: activePath === '/riwayat' },
    { to: '/prediksi-skor', label: 'Prediksi Skor', active: activePath === '/prediksi-skor' },
    { to: '/rasionalisasi', label: 'Rasionalisasi', active: activePath === '/rasionalisasi' },
    { to: '/profile', label: 'Profil Saya', active: activePath === '/profile' },
  ];

  const isDropdownActive = dropdownLinks.some(l => l.active);

  // Styling based on transparency and scroll state
  let navBg = 'bg-[#faf8ff] border-b border-transparent';
  let textPrimary = 'text-[#424656]';
  let textActive = 'text-[#0050cb]';

  if (transparent) {
    if (scrolled) {
      navBg = 'bg-[#f2f3ff]/90 shadow-sm backdrop-blur-md border-b border-[#c2c6d8]/20';
      textPrimary = 'text-[#424656]';
      textActive = 'text-[#0050cb]';
    } else {
      navBg = 'bg-transparent border-transparent';
      textPrimary = 'text-white/80';
      textActive = 'text-white font-bold';
    }
  } else {
    if (scrolled) {
      navBg = 'bg-[#faf8ff]/90 shadow-sm backdrop-blur-md border-b border-[#c2c6d8]/30';
    }
  }

  const profileBorder = user?.current_plan === 'sultan' 
    ? 'border-yellow-400' 
    : user?.current_plan === 'premium' 
    ? 'border-blue-400' 
    : user?.current_plan === 'premium_um' 
    ? 'border-teal-400' 
    : scrolled || !transparent 
    ? 'border-[#dae1ff]' 
    : 'border-white/20';

  const planBadgeClass = user?.current_plan === 'sultan'
    ? 'bg-yellow-400/20 text-yellow-700'
    : user?.current_plan === 'premium'
    ? 'bg-blue-500/20 text-blue-600'
    : user?.current_plan === 'premium_um'
    ? 'bg-teal-500/20 text-teal-600'
    : scrolled || !transparent
    ? 'bg-gray-200/60 text-gray-500'
    : 'bg-white/15 text-white/70';

  const planBadgeIcon = user?.current_plan === 'sultan' 
    ? 'star' 
    : user?.current_plan === 'premium' 
    ? 'diamond' 
    : user?.current_plan === 'premium_um' 
    ? 'target' 
    : 'person';

  return (
    <>
      <header className={`fixed top-0 z-[100] w-full transition-all duration-300 ${navBg}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-16 sm:h-20 flex items-center justify-between gap-2 min-w-0">
          
          {/* Logo & Navigation */}
          <div className="flex items-center gap-3 sm:gap-6 lg:gap-12 min-w-0 flex-1">
            <Link to="/dashboard" className="flex items-center shrink-0">
              <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 sm:h-10 md:h-12 w-auto" />
            </Link>
            
            <nav className="hidden lg:flex items-center gap-1">
              {mainLinksBefore.map(l => (
                <Link 
                  key={l.to} 
                  to={l.to} 
                  className={`px-4 py-2 text-[14px] font-medium transition-colors ${
                    l.active 
                      ? `${textActive} font-bold ${!transparent || scrolled ? 'border-b-2 border-[#0050cb] pb-1' : ''}` 
                      : `${textPrimary} hover:text-[#0050cb]`
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              {/* Dropdown Menu for UTBK */}
              <div 
                className="relative" 
                onMouseEnter={() => setUtbkDropdownOpen(true)} 
                onMouseLeave={() => setUtbkDropdownOpen(false)}
              >
                <button 
                  className={`px-4 py-2 text-[14px] font-medium transition-colors flex items-center gap-1 ${
                    isUtbkActive 
                      ? `${textActive} font-bold ${!transparent || scrolled ? 'border-b-2 border-[#0050cb] pb-1' : ''}` 
                      : `${textPrimary} hover:text-[#0050cb]`
                  }`}
                >
                  UTBK
                  <span 
                    className="material-symbols-outlined text-[16px] transition-transform duration-200" 
                    style={{ transform: utbkDropdownOpen ? 'rotate(180deg)' : 'none' }}
                  >
                    keyboard_arrow_down
                  </span>
                </button>
                
                {utbkDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-[#c2c6d8]/30 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                    {utbkLinks.map(l => (
                      <Link
                        key={l.to}
                        to={l.to}
                        className={`block px-5 py-3 text-[14px] font-medium hover:bg-[#f2f3ff] transition-colors ${
                          l.active ? 'text-[#0050cb] bg-[#dae1ff]/40 font-bold' : 'text-[#424656]'
                        }`}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {mainLinksAfter.map(l => (
                <Link 
                  key={l.to} 
                  to={l.to} 
                  className={`px-4 py-2 text-[14px] font-medium transition-colors ${
                    l.active 
                      ? `${textActive} font-bold ${!transparent || scrolled ? 'border-b-2 border-[#0050cb] pb-1' : ''}` 
                      : `${textPrimary} hover:text-[#0050cb]`
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              {/* Dropdown Menu for Fitur Lain */}
              <div 
                className="relative" 
                onMouseEnter={() => setDropdownOpen(true)} 
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button 
                  className={`px-4 py-2 text-[14px] font-medium transition-colors flex items-center gap-1 ${
                    isDropdownActive 
                      ? `${textActive} font-bold ${!transparent || scrolled ? 'border-b-2 border-[#0050cb] pb-1' : ''}` 
                      : `${textPrimary} hover:text-[#0050cb]`
                  }`}
                >
                  Fitur Lain
                  <span 
                    className="material-symbols-outlined text-[16px] transition-transform duration-200" 
                    style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}
                  >
                    keyboard_arrow_down
                  </span>
                </button>
                
                {dropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-[#c2c6d8]/30 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                    {dropdownLinks.map(l => (
                      <Link
                        key={l.to}
                        to={l.to}
                        className={`block px-5 py-3 text-[14px] font-medium hover:bg-[#f2f3ff] transition-colors ${
                          l.active ? 'text-[#0050cb] bg-[#dae1ff]/40 font-bold' : 'text-[#424656]'
                        }`}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {isAdmin && (
                <Link 
                  to="/admin" 
                  className={`px-4 py-2 text-[14px] font-medium ${
                    transparent && !scrolled ? 'text-[#ffb59d]' : 'text-[#a33200] hover:text-[#0050cb]'
                  }`}
                >
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>

          {/* Right Side Tools & Profile */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {location.pathname === '/paket-belajar' && (
              <Link
                to="/cart"
                className={`relative p-2 transition-colors flex items-center ${
                  transparent && !scrolled ? 'text-white/85 hover:text-white' : 'text-[#424656] hover:text-[#0050cb]'
                }`}
                title="Keranjang Belanja"
              >
                <span className="material-symbols-outlined text-[22px] sm:text-2xl">shopping_cart</span>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            <div className={`hidden sm:flex items-center gap-3 pl-4 border-l ${scrolled || !transparent ? 'border-[#c2c6d8]/30' : 'border-white/20'}`}>
              <div className="flex flex-col items-end justify-center">
                <p className={`text-[14px] font-medium ${scrolled || !transparent ? 'text-[#191b24]' : 'text-white'}`}>
                  {user?.name?.split(' ')[0]}
                </p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${planBadgeClass}`}>
                  <span className="material-symbols-outlined text-[10px]">{planBadgeIcon}</span>
                  {user?.current_plan === 'sultan' ? 'Sultan' : user?.current_plan === 'premium' ? 'Premium' : user?.current_plan === 'premium_um' ? 'Premium UM' : 'Gratis'}
                </span>
              </div>
              
              <div className={`relative w-10 h-10 rounded-full bg-[#0050cb] flex items-center justify-center text-white font-bold text-sm border-2 ${profileBorder}`}>
                {user?.name?.charAt(0)?.toUpperCase()}
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
            </div>

            {/* Logout Button */}
            <button 
              type="button" 
              onClick={onLogout} 
              className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-full transition-all hover:bg-red-500/10 hover:text-red-500 ${
                transparent && !scrolled ? 'text-white/80 hover:text-red-400' : 'text-[#424656]'
              }`}
              title="Logout"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>

            {/* Mobile hamburger menu */}
            <button 
              type="button" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className={`lg:hidden flex items-center justify-center w-10 h-10 rounded-full ${
                transparent && !scrolled ? 'text-white' : 'text-[#424656]'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>

        </div>
      </header>

      {!transparent && <div className="h-16 sm:h-20 shrink-0" aria-hidden="true" />}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div
            className="absolute top-16 left-0 right-0 bottom-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute top-16 left-0 right-0 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain bg-white border-b border-[#c2c6d8]/30 shadow-2xl rounded-b-[24px] animate-slide-down"
            onClick={e => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-1 p-4">
              {[...mainLinksBefore, ...utbkLinks, ...mainLinksAfter, ...dropdownLinks].map(l => (
                <Link 
                  key={l.to} 
                  to={l.to} 
                  onClick={() => setMobileMenuOpen(false)} 
                  className={`px-4 py-3.5 rounded-xl text-[15px] font-bold transition-colors ${
                    l.active 
                      ? 'bg-[#dae1ff] text-[#0050cb]' 
                      : 'text-[#424656] hover:bg-[#f2f3ff]'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              {isAdmin && (
                <Link 
                  to="/admin" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="px-4 py-3.5 rounded-xl text-[15px] font-bold text-[#a33200] hover:bg-[#f2f3ff]"
                >
                  Admin Panel
                </Link>
              )}
            </nav>

            <div className="border-t border-[#c2c6d8]/30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#0050cb] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#191b24] truncate">{user?.name?.split(' ')[0]}</p>
                    <span className="text-[11px] font-bold uppercase text-[#727687]">
                      {user?.current_plan === 'sultan' ? 'Sultan' : user?.current_plan === 'premium' ? 'Premium' : user?.current_plan === 'premium_um' ? 'Premium UM' : 'Gratis'}
                    </span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setMobileMenuOpen(false); onLogout(); }} 
                  className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-1.5 border border-red-100 shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
