import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { settingsService, subscriptionService, activityService, articleService } from '../services/api';
import toast from 'react-hot-toast';
import ChatWidget from '../components/ChatWidget';
import Footer from '../components/Footer';
import StudentNavbar from '../components/layout/StudentNavbar';
import UniversityLogo from '../components/UniversityLogo';

const DEFAULT_SCHEDULE = [
  { day: 'SEN', date: '12', title: 'Tryout Penalaran Umum', time: '09:00 - 11:30', active: true },
  { day: 'SEL', date: '13', title: 'Latihan Pengetahuan Kuantitatif', time: '14:00 - 15:30' },
  { day: 'RAB', date: '14', title: 'Review Literasi Bahasa Indonesia', time: '10:00 - 11:00' },
];

const SUBJECTS = [
  { name: 'Penalaran Umum', progress: 72, icon: 'psychology', sub: 'Penalaran Logis & Analitis' },
  { name: 'Pengetahuan Kuantitatif', progress: 55, icon: 'calculate', sub: 'Matematika Dasar' },
];

const Dashboard = () => {
  const { user, isAdmin, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [banner, setBanner] = useState({
    banner_image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80',
    banner_title: 'Raih Skor UTBK Terbaikmu',
    banner_subtitle: 'Bergabung dengan 50.000+ pelajar yang telah mempersiapkan UTBK bersama Stubia.',
  });
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [plans, setPlans] = useState([]);
  const [paying, setPaying] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [checkingTx, setCheckingTx] = useState(null);
  const [riwayatData, setRiwayatData] = useState(null);
  const [loadingRiwayat, setLoadingRiwayat] = useState(true);
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  // New States for Carousel & Open Exams Config
  const [banners, setBanners] = useState([]);
  const [ujianSerentak, setUjianSerentak] = useState([]);
  const [utbkCountdownDate, setUtbkCountdownDate] = useState('2027-04-18');
  const [activeSlide, setActiveSlide] = useState(0);
  const [showUtbkModal, setShowUtbkModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadTransactions = () => {
    subscriptionService.getTransactions().then(r => {
      setTransactions(r.data?.data || []);
    }).catch(() => {});
  };

  // Carousel auto play
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners]);

  useEffect(() => {
    settingsService.get().then(r => {
      const d = r.data.data;
      setBanner(prev => ({ ...prev, ...d }));
      
      if (d.utbk_countdown_date) {
        setUtbkCountdownDate(d.utbk_countdown_date);
      }

      // Load banners list or use old settings as fallback
      if (d.banners_carousel) {
        try {
          const parsed = JSON.parse(d.banners_carousel);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBanners(parsed);
          } else {
            // fallback
            setBanners([
              {
                id: 'fallback-1',
                type: 'template',
                bg_color: '#7a1a10',
                title: d.banner_subtitle || 'Bergabung dengan 50.000+ pelajar yang telah mempersiapkan UTBK bersama Stubia.',
                brand_name: d.banner_title || 'RAFACADEMYC',
                image_url: d.banner_image_url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80',
                ig_handle: 'rafacademyc',
                tiktok_handle: 'rafacademyc',
                yt_handle: 'rafacademyc',
                web_handle: 'rafacademyc.com',
                link_url: '/tryout/packages'
              },
              {
                id: 'fallback-2',
                type: 'template',
                bg_color: '#0050cb',
                title: 'Latihan soal terlengkap, tryout simulasi CBT, dan penilaian IRT modern.',
                brand_name: 'STUBIA CBT',
                image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80',
                ig_handle: 'rafacademyc',
                tiktok_handle: 'rafacademyc',
                yt_handle: 'rafacademyc',
                web_handle: 'rafacademyc.com',
                link_url: '/tryout/packages'
              }
            ]);
          }
        } catch {
          // fallback
        }
      } else {
        // Fallback default
        setBanners([
          {
            id: 'fallback-1',
            type: 'template',
            bg_color: '#7a1a10',
            title: d.banner_subtitle || 'Bergabung dengan 50.000+ pelajar yang telah mempersiapkan UTBK bersama Stubia.',
            brand_name: d.banner_title || 'RAFACADEMYC',
            image_url: d.banner_image_url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80',
            ig_handle: 'rafacademyc',
            tiktok_handle: 'rafacademyc',
            yt_handle: 'rafacademyc',
            web_handle: 'rafacademyc.com',
            link_url: '/tryout/packages'
          },
          {
            id: 'fallback-2',
            type: 'template',
            bg_color: '#0050cb',
            title: 'Latihan soal terlengkap, tryout simulasi CBT, dan penilaian IRT modern.',
            brand_name: 'STUBIA CBT',
            image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80',
            ig_handle: 'rafacademyc',
            tiktok_handle: 'rafacademyc',
            yt_handle: 'rafacademyc',
            web_handle: 'rafacademyc.com',
            link_url: '/tryout/packages'
          }
        ]);
      }

      // Load open exams list
      if (d.ujian_serentak) {
        try {
          const parsed = JSON.parse(d.ujian_serentak);
          if (Array.isArray(parsed)) {
            setUjianSerentak(parsed);
          }
        } catch {}
      }

      if (d.schedule_json) {
        try {
          const parsed = JSON.parse(d.schedule_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSchedule(parsed);
          }
        } catch {}
      }
    }).catch(() => {});

    subscriptionService.getPlans().then(r => {
      setPlans(r.data?.data || []);
    }).catch(() => {});

    loadTransactions();

    activityService.getRiwayat().then(res => {
      if (res.data?.success) {
        setRiwayatData(res.data.data);
      }
    }).catch(err => {
      console.error('Failed to fetch riwayat in dashboard:', err);
    }).finally(() => {
      setLoadingRiwayat(false);
    });

    articleService.list().then(res => {
      if (res.data?.success) {
        setArticles(res.data.data || []);
      }
    }).catch(err => {
      console.error('Failed to load articles for dashboard:', err);
    }).finally(() => {
      setLoadingArticles(false);
    });
  }, []);

  // Scroll to hash anchor (e.g. #pricing-plans) after page loads
  useEffect(() => {
    if (location.hash) {
      const timer = setTimeout(() => {
        const el = document.querySelector(location.hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  const handleLogout = () => { logout(); navigate('/'); };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const loadSnapScript = () => {
    return new Promise((resolve, reject) => {
      if (window.snap) return resolve();
      const script = document.createElement('script');
      const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
      script.src = isProduction
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const handleUpgrade = (planName) => {
    const plan = plans.find(p => p.name === planName);
    if (!plan) {
      toast.error('Paket tidak ditemukan');
      return;
    }
    if (plan.name === 'gratis') {
      toast('Kamu sudah menggunakan paket Gratis', { icon: 'ℹ️' });
      return;
    }

    let currentCart = [];
    const storedCart = localStorage.getItem('stubia_cart');
    if (storedCart) {
      try {
        currentCart = JSON.parse(storedCart);
      } catch (e) {
        currentCart = [];
      }
    }

    const exists = currentCart.some(item => item.id === plan.id);
    if (!exists) {
      currentCart.push(plan);
      localStorage.setItem('stubia_cart', JSON.stringify(currentCart));
    }

    toast.success(`${plan.display_name} ditambahkan ke keranjang`);
    navigate('/cart');
  };

  const handleConfirmPending = async (orderId) => {
    setCheckingTx(orderId);
    try {
      const res = await subscriptionService.confirmPayment(orderId);
      if (res.data?.success) {
        toast.success('Status pembayaran berhasil diperbarui!');
        await refreshUser();
        loadTransactions();
      } else {
        toast.error(res.data?.error || 'Gagal memverifikasi pembayaran');
      }
    } catch (err) {
      console.error(err);
      await refreshUser();
      loadTransactions();
    } finally {
      setCheckingTx(null);
    }
  };

  const getPlanBadge = (planName) => {
    const name = (planName || 'gratis').toLowerCase();
    if (name === 'sultan') {
      return {
        label: 'Sultan Member',
        icon: 'diamond',
        style: 'bg-purple-600 text-white font-semibold shadow-sm'
      };
    } else if (name === 'premium' || name === 'premium_um') {
      return {
        label: name === 'premium' ? 'Premium Member' : 'Premium UM Member',
        icon: 'workspace_premium',
        style: 'bg-teal-600 text-white font-semibold shadow-sm'
      };
    }
    return {
      label: 'Basic Member',
      icon: 'person',
      style: 'bg-[#f3b62f] text-white font-semibold shadow-sm'
    };
  };

  const calculateCountdown = () => {
    if (!utbkCountdownDate) return '290';
    const target = new Date(utbkCountdownDate);
    const today = new Date();
    target.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const quickActions = [
    { label: 'UTBK', icon: 'school', bgIcon: 'bg-[#eff6ff] text-[#2563eb]', action: () => setShowUtbkModal(true) },
    { label: 'Ujian Mandiri', icon: 'domain', bgIcon: 'bg-[#fffbeb] text-[#d97706]', path: '/ujian-mandiri' },
    { label: 'Paket Belajar', icon: 'card_membership', bgIcon: 'bg-[#fdf2f8] text-[#db2777]', path: '/paket-belajar' },
    { label: 'Prediksi Skor', icon: 'analytics', bgIcon: 'bg-[#faf5ff] text-[#7c3aed]', path: '/prediksi-skor' },
    { label: 'Konsultasi dengan Bia', icon: 'forum', bgIcon: 'bg-[#fff1f2] text-[#e11d48]', path: '/konsultasi' },
    { label: 'Riwayat', icon: 'history', bgIcon: 'bg-[#f0fdf4] text-[#16a34a]', path: '/riwayat' },
  ];

  const pendingTxs = transactions.filter(t => t.status === 'pending');

  return (
    <div className="min-h-screen text-[#191b24] font-sans bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── MOBILE STATUS HEADER ── */}
      <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center gap-1.5 bg-[#fef3c7] border border-[#fde68a] px-3 py-1 rounded-full shadow-sm">
          <span className="text-amber-500 text-[14px]">🔥</span>
          <span className="text-xs font-black text-[#78350f]">1</span>
        </div>
        <div className="flex items-center justify-center">
          <img src="/stubiabrandicon.png" alt="Stubia Logo" className="h-6 w-auto object-contain" />
        </div>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-50 border border-gray-150 text-gray-700 active:scale-95 transition-all cursor-pointer hover:bg-gray-100 outline-none"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
      </div>

      {/* ── DESKTOP NAVBAR ── */}
      <div className="hidden md:block">
        <StudentNavbar user={user} isAdmin={isAdmin} onLogout={handleLogout} transparent={false} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 bg-white">

        {/* ── BANNER CAROUSEL ── */}
        <section className="w-full max-w-5xl mx-auto mb-6 relative rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 aspect-[2.3/1] sm:aspect-[2.4/1] bg-[#191b24]">
          {banners.map((slide, index) => {
            const isActive = index === activeSlide;
            const slideLink = slide.link_url || '';
            
            const handleSlideClick = () => {
              if (slideLink) {
                if (slideLink.startsWith('http')) {
                  window.open(slideLink, '_blank');
                } else {
                  navigate(slideLink);
                }
              }
            };

            if (slide.type === 'image') {
              return (
                <div 
                  key={slide.id || index}
                  onClick={handleSlideClick}
                  className={`absolute inset-0 transition-all duration-500 ease-in-out cursor-pointer ${isActive ? 'opacity-100 z-10 scale-100 visible' : 'opacity-0 z-0 scale-95 invisible pointer-events-none'}`}
                >
                  <img src={slide.image_url} alt="Banner" className="w-full h-full object-cover" />
                </div>
              );
            }

            // Template slide matching the screenshot!
            return (
              <div 
                key={slide.id || index}
                onClick={handleSlideClick}
                className={`absolute inset-0 transition-all duration-500 ease-in-out p-5 sm:p-10 flex items-center justify-between overflow-hidden cursor-pointer ${isActive ? 'opacity-100 z-10 scale-100 visible font-sans' : 'opacity-0 z-0 scale-95 invisible pointer-events-none font-sans'}`}
                style={{ backgroundColor: slide.bg_color || '#7a1a10' }}
              >
                <div className="max-w-[70%] text-white z-10">
                  <p className="text-[10px] sm:text-lg font-medium opacity-90 leading-tight">
                    {slide.title}
                  </p>
                  <h2 className="text-lg sm:text-5xl font-black mt-2 uppercase tracking-tight drop-shadow-sm font-sans">
                    {slide.brand_name}
                  </h2>
                  
                  {/* Social media handles */}
                  <div className="mt-3 sm:mt-6 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[8px] sm:text-sm font-semibold opacity-85">
                    {slide.ig_handle && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px] sm:text-[18px]">photo_camera</span>
                        <span>{slide.ig_handle}</span>
                      </div>
                    )}
                    {slide.tiktok_handle && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px] sm:text-[18px]">music_note</span>
                        <span>{slide.tiktok_handle}</span>
                      </div>
                    )}
                    {slide.yt_handle && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px] sm:text-[18px]">play_circle</span>
                        <span>{slide.yt_handle}</span>
                      </div>
                    )}
                    {slide.web_handle && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[12px] sm:text-[18px]">language</span>
                        <span>{slide.web_handle}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {slide.image_url && (
                  <img 
                    src={slide.image_url} 
                    className="w-[28%] max-w-[280px] h-[95%] object-contain z-10 transform translate-y-3 sm:translate-y-6" 
                    alt="Illustration" 
                  />
                )}
                
                {/* Decorative pattern overlay */}
                <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-white/5 rounded-l-full transform translate-x-12 scale-125 pointer-events-none" />
              </div>
            );
          })}
 
          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setActiveSlide(i); }}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${activeSlide === i ? 'bg-white scale-125' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── SLEEK WELCOME HEADER ── */}
        <section className="w-full max-w-5xl mx-auto mb-8 px-2 font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Elegant avatar circle with subtle green gradient */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#34a853] to-[#2ecc71] text-white flex items-center justify-center font-bold text-lg shadow-[0_4px_10px_rgba(52,168,83,0.15)] shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-[#191b24] tracking-tight leading-none">
                  Halo, {user?.name || 'Peserta'}!
                </h2>
                <span className="inline-block animate-[wave_1.5s_infinite] text-base leading-none">👋</span>
                
                {/* Sleek, miniature membership badge */}
                {(() => {
                  const badge = getPlanBadge(user?.current_plan);
                  const isSultan = user?.current_plan?.toLowerCase() === 'sultan';
                  const isPremium = user?.current_plan?.toLowerCase() === 'premium' || user?.current_plan?.toLowerCase() === 'premium_um';
                  
                  let bgClass = "bg-amber-50 text-amber-700 border border-amber-200";
                  if (isSultan) {
                    bgClass = "bg-purple-50 text-purple-700 border border-purple-200";
                  } else if (isPremium) {
                    bgClass = "bg-teal-50 text-teal-700 border border-teal-200";
                  }
                  
                  return (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${bgClass} leading-none`}>
                      {badge.label.replace(' Member', '')}
                    </span>
                  );
                })()}
              </div>
              <p className="text-[11px] sm:text-xs text-gray-400 font-semibold mt-1.5 leading-none">{user?.email || 'email@example.com'}</p>
            </div>
          </div>
        </section>

        {/* ── UTBK COUNTDOWN ── */}
        <div className="flex justify-center my-6">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-150 rounded-full shadow-sm text-[#191b24] font-extrabold text-[13px]">
            <span className="material-symbols-outlined text-[16px] text-gray-700">calendar_month</span>
            <span>H - {calculateCountdown()} UTBK</span>
          </div>
        </div>

        {/* ── QUICK NAVIGATION ICONS ── */}
        <section className="w-full max-w-5xl mx-auto mb-10 px-1">
          {/* Responsive grid showing all 6 icons: 2 rows of 3 columns on mobile, 1 row of 6 columns on desktop */}
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
            {quickActions.map((action, idx) => {
              const cardContent = (
                <>
                  <div className={`w-12 h-12 rounded-2xl ${action.bgIcon} flex items-center justify-center mb-3 shadow-inner`}>
                    <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 0" }}>
                      {action.icon}
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-[#191b24] leading-tight font-sans">
                    {action.label}
                  </span>
                </>
              );

              const btnClass = "bg-white border border-gray-150 rounded-3xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 w-full cursor-pointer outline-none";

              if (action.action) {
                return (
                  <button 
                    key={idx}
                    onClick={action.action}
                    className={btnClass}
                  >
                    {cardContent}
                  </button>
                );
              }

              return (
                <Link 
                  key={idx}
                  to={action.path}
                  className={btnClass}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── UJIAN TERBUKA SERENTAK ── */}
        {ujianSerentak.length > 0 && (
          <section className="w-full max-w-5xl mx-auto mb-12">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#0050cb] text-[20px] font-sans">🌐</span>
              <h3 className="text-lg font-black text-[#191b24] font-sans">Ujian Terbuka Serentak</h3>
            </div>
            <p className="text-xs text-gray-500 font-medium mb-6">Ikuti ujian serentak berskala nasional tanpa biaya.</p>
            
            {/* Scrollable on mobile, Grid on desktop */}
            <div className="flex overflow-x-auto gap-5 py-2 px-1 scrollbar-none md:grid md:grid-cols-3 md:overflow-x-visible">
              {ujianSerentak.map((u, idx) => (
                <div 
                  key={u.id || idx}
                  className="bg-white border border-gray-150 rounded-[2rem] overflow-hidden flex shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-w-[280px] md:min-w-0 flex-1 shrink-0 h-40"
                >
                  {/* Left Stripe */}
                  <div className="w-[30%] relative flex items-center justify-center overflow-hidden shrink-0" style={{ backgroundColor: u.bg_color || '#FFE000' }}>
                    <UniversityLogo name={u.logo_type} customUrl={u.custom_logo_url} className="w-12 h-12 z-10" />
                    {/* Decorative grid pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
                  </div>
                  
                  {/* Right Content */}
                  <div className="w-[70%] p-4 flex flex-col justify-between relative">
                    {/* Top line with Category Badge & Index Badge */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2 py-0.5 text-[8px] sm:text-[9px] font-black rounded-full uppercase" style={{ backgroundColor: `${u.bg_color}30` || '#FFE00030', color: u.bg_color || '#191b24' }}>
                        {u.category || 'UJIAN MANDIRI'}
                      </span>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0" style={{ backgroundColor: u.bg_color || '#0050cb' }}>
                        {u.badge_index || '1'}
                      </span>
                    </div>
                    
                    {/* Center details */}
                    <div className="my-1.5">
                      <h4 className="font-black text-sm text-[#191b24] line-clamp-1 leading-snug">{u.title}</h4>
                      <p className="text-[10px] text-gray-500 font-semibold line-clamp-1 mt-0.5">{u.subtitle}</p>
                    </div>
                    
                    {/* Divider */}
                    <hr className="border-gray-100 my-0.5" />
                    
                    {/* Bottom action row */}
                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <div className="flex items-center gap-1 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[12px]">work</span>
                        <span>{u.category === 'UTBK' ? 'Paket UTBK' : 'Paket Mandiri'}</span>
                      </div>
                      
                      <button 
                        onClick={() => u.link_path && navigate(u.link_path)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-sm active:scale-90 transition-all shrink-0"
                        style={{ backgroundColor: u.bg_color || '#0050cb' }}
                      >
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── MAIN CONTENT (REMAINING SECTIONS) ── */}

        {/* Pending Transactions Alert */}
        {pendingTxs.length > 0 && (
          <div className="mb-8 space-y-3">
            {pendingTxs.map(tx => (
              <div key={tx.id} className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm shadow-sm max-w-5xl mx-auto">
                <div className="flex items-center gap-3 text-amber-800">
                  <span className="material-symbols-outlined text-amber-600 shrink-0">hourglass_empty</span>
                  <span>
                    Pembayaran untuk paket <strong className="capitalize">{tx.plan_name}</strong> sebesar <strong>Rp{tx.amount.toLocaleString('id-ID')}</strong> masih tertunda. 
                    Jika Anda sudah membayar, silakan klik tombol verifikasi di samping.
                  </span>
                </div>
                <button
                  onClick={() => handleConfirmPending(tx.order_id)}
                  disabled={checkingTx === tx.order_id}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all text-center shrink-0 disabled:opacity-50 text-xs"
                >
                  {checkingTx === tx.order_id ? 'Memproses...' : 'Cek Status Pembayaran'}
                </button>
              </div>
            ))}
          </div>
        )}



                <section id="pricing-plans" className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-[24px] sm:text-[32px] font-bold text-[#191b24] mb-2">Pilih Paket Belajarmu</h3>
            <p className="text-[14px] sm:text-base text-[#424656]">Pilih paket yang sesuai dengan kebutuhan dan targetmu.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
 
            {/* ── PREMIUM ── */}
            <div className="relative bg-white border-2 border-[#0050cb] p-8 rounded-xl flex flex-col shadow-lg transition-all hover:-translate-y-2 duration-300 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0050cb] text-white px-6 py-1 rounded-full text-[12px] font-semibold">
                Paling Populer
              </div>
              <div className="mb-4">
                <h3 className="text-[20px] sm:text-[24px] leading-8 font-semibold text-[#0050cb] mb-2">Premium</h3>
                <p className="text-[#424656] text-[14px] leading-5 font-medium">Tingkatkan persiapan UTBK-mu</p>
              </div>
              <div className="my-4 flex items-baseline">
                <span className="text-[32px] sm:text-[48px] leading-[40px] sm:leading-[56px] tracking-[-0.02em] font-bold text-[#191b24]">Rp70.000</span>
                <span className="text-[#424656] text-[14px] sm:text-[16px] leading-6 ml-1">/6 bulan</span>
              </div>
              <hr className="border-[#0066ff]/20 my-4" />
              <ul className="flex-grow space-y-4 mb-10">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0050cb]" style={{ fontVariationSettings: "'FILL' 0" }}>verified</span>
                  <span className="text-[16px] leading-6 text-[#191b24] font-semibold">Akses penuh latihan soal UTBK</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0050cb]" style={{ fontVariationSettings: "'FILL' 0" }}>verified</span>
                  <span className="text-[16px] leading-6 text-[#191b24]">Akses penuh tryout UTBK</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0050cb]" style={{ fontVariationSettings: "'FILL' 0" }}>verified</span>
                  <span className="text-[16px] leading-6 text-[#191b24]">Pembahasan lengkap AI</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#0050cb]" style={{ fontVariationSettings: "'FILL' 0" }}>verified</span>
                  <span className="text-[16px] leading-6 text-[#191b24]">Analisis performa IRT</span>
                </li>
              </ul>
              <button
                onClick={() => handleUpgrade('premium')}
                disabled={paying === 'premium'}
                className="w-full py-4 bg-[#0050cb] text-white text-[14px] font-medium rounded-lg shadow-md hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait"
              >
                {paying === 'premium' ? 'Memproses...' : 'Upgrade Sekarang'}
              </button>
            </div>
 
            {/* ── PREMIUM UM ── */}
            <div className="bg-white border-2 border-teal-500 p-8 rounded-xl flex flex-col shadow-lg transition-all hover:-translate-y-2 duration-300 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-600 text-white px-6 py-1 rounded-full text-[12px] font-semibold">
                Paket Mandiri
              </div>
              <div className="mb-4">
                <h3 className="text-[20px] sm:text-[24px] leading-8 font-semibold text-teal-600 mb-2">Premium UM</h3>
                <p className="text-[#424656] text-[14px] leading-5 font-medium">Fokus persiapan Ujian Mandiri</p>
              </div>
              <div className="my-4 flex items-baseline">
                <span className="text-[32px] sm:text-[48px] leading-[40px] sm:leading-[56px] tracking-[-0.02em] font-bold text-[#191b24]">Rp30.000</span>
                <span className="text-[#424656] text-[14px] sm:text-[16px] leading-6 ml-1">/2 bulan</span>
              </div>
              <hr className="border-teal-500/20 my-4" />
              <ul className="flex-grow space-y-4 mb-10">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-teal-600" style={{ fontVariationSettings: "'FILL' 0" }}>verified</span>
                  <span className="text-[16px] leading-6 text-[#191b24] font-semibold">Akses semua latihan mandiri</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-teal-600" style={{ fontVariationSettings: "'FILL' 0" }}>verified</span>
                  <span className="text-[16px] leading-6 text-[#191b24]">Akses semua tryout mandiri</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-teal-600" style={{ fontVariationSettings: "'FILL' 0" }}>verified</span>
                  <span className="text-[16px] leading-6 text-[#191b24]">Pembahasan lengkap & analisis</span>
                </li>
              </ul>
              <button
                onClick={() => handleUpgrade('premium_um')}
                disabled={paying === 'premium_um'}
                className="w-full py-4 bg-teal-600 text-white text-[14px] font-medium rounded-lg shadow-md hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait"
              >
                {paying === 'premium_um' ? 'Memproses...' : 'Upgrade Sekarang'}
              </button>
            </div>
 
            {/* ── SULTAN ── */}
            <div className="bg-gradient-to-br from-[#191b24] to-[#2e303a] p-8 rounded-xl flex flex-col text-white transition-all hover:-translate-y-2 duration-300 shadow-lg">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#ffdbd0]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <h3 className="text-[20px] sm:text-[24px] leading-8 font-semibold text-[#ffdbd0]">Sultan</h3>
                </div>
                <p className="text-[#c2c6d8] text-[14px] leading-5 font-medium">Persiapan UTBK terlengkap</p>
              </div>
              <div className="my-4 flex items-baseline">
                <span className="text-[32px] sm:text-[48px] leading-[40px] sm:leading-[56px] tracking-[-0.02em] font-bold text-[#faf8ff]">Rp160.000</span>
                <span className="text-[#c2c6d8] text-[14px] sm:text-[16px] leading-6 ml-1">/tahun</span>
              </div>
              <hr className="border-[#424656]/30 my-4" />
              <ul className="flex-grow space-y-4 mb-10">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#ffdbd0]" style={{ fontVariationSettings: "'FILL' 0" }}>diamond</span>
                  <span className="text-[16px] leading-6 text-[#f2f3ff]">Akses semua latihan soal</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#ffdbd0]" style={{ fontVariationSettings: "'FILL' 0" }}>diamond</span>
                  <span className="text-[16px] leading-6 text-[#f2f3ff]">Akses semua tryout</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#ffdbd0]" style={{ fontVariationSettings: "'FILL' 0" }}>diamond</span>
                  <span className="text-[16px] leading-6 text-[#f2f3ff]">Akses pembahasan soal sepuasnya</span>
                </li>   
              </ul>
              <button
                onClick={() => handleUpgrade('sultan')}
                disabled={paying === 'sultan'}
                className="w-full py-4 bg-[#faf8ff] text-[#191b24] text-[14px] font-medium rounded-lg hover:bg-[#ffdbd0] transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-wait"
              >
                {paying === 'sultan' ? 'Memproses...' : 'Go Sultan'}
              </button>
            </div>
 
          </div>
        </section>

        <span className="block h-px bg-gradient-to-r from-transparent via-[#c2c6d8] to-transparent opacity-20 my-12"></span>

        {/* Latest Articles Section */}
        <section className="w-full max-w-5xl mx-auto mb-20 px-4 sm:px-6">
          <header className="flex justify-between items-baseline mb-8 border-b border-gray-200/50 pb-4">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-[#0050cb] bg-[#0050cb]/10 px-3 py-1 rounded-full">Blog Stubia</span>
              <h2 className="text-[24px] sm:text-[32px] font-bold text-[#191b24] mt-2 leading-tight">Artikel Terkini</h2>
            </div>
            <Link to="/blog" className="text-[#0050cb] text-sm font-bold tracking-wider uppercase hover:underline flex items-center gap-1">
              Semua Artikel
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </header>

          {loadingArticles ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 animate-pulse">
                  <div className="aspect-video w-full bg-gray-200 rounded-xl"></div>
                  <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                  <div className="h-6 w-full bg-gray-200 rounded"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.slice(0, 3).map((article) => {
                const formattedDate = new Date(article.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                return (
                  <Link
                    key={article.id}
                    to={`/blog/${article.slug}`}
                    className="bg-white border border-[#c2c6d8]/20 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                  >
                    {/* Cover Image */}
                    <div className="bg-gray-50 relative aspect-video overflow-hidden">
                      {article.cover_image ? (
                        <img
                          src={article.cover_image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <span className="material-symbols-outlined text-[48px]">image</span>
                        </div>
                      )}
                      {article.category && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-white/90 backdrop-blur-sm text-[#0050cb] text-[10px] font-bold shadow-sm">
                          {article.category}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1 justify-between">
                      <div className="space-y-2">
                        <span className="text-[11px] text-[#727687]">{formattedDate}</span>
                        <h3 className="font-bold text-[#191b24] text-[16px] leading-snug group-hover:text-[#0050cb] transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-[#424656] text-[13px] leading-relaxed line-clamp-3">
                          {article.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#c2c6d8]/10 text-xs">
                        <span className="text-[#727687] flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          {article.author_name}
                        </span>
                        <span className="text-[#0050cb] font-bold flex items-center gap-0.5 group-hover:gap-1 transition-all">
                          Baca <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-[#c2c6d8]/30">
              <span className="material-symbols-outlined text-[40px] text-[#c2c6d8] mb-2">article</span>
              <p className="text-[#727687] text-sm">Belum ada artikel terkini yang tersedia.</p>
            </div>
          )}
        </section>

        <span className="block h-px bg-gradient-to-r from-transparent via-[#c2c6d8] to-transparent opacity-20 my-12"></span>

        {/* Asymmetrical Layout: Progress + Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start mb-20">
          
          {/* LEFT COLUMN: RECENT ACTIVITIES (7 COLUMNS) */}
          <section className="lg:col-span-7">
            <header className="flex justify-between items-baseline mb-12 border-b border-gray-200 pb-6">
              <h2 className="text-[28px] sm:text-[40px] md:text-[60px] leading-tight tracking-tight text-[#001849] uppercase font-bold">Aktivitas<br/>Terakhir</h2>
              <Link to="/riwayat" className="text-[#0050cb] text-sm font-semibold tracking-wider uppercase hover:text-[#001849] transition-colors">Lihat Semua —</Link>
            </header>
            <div className="space-y-6">
              {loadingRiwayat ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400 text-sm">Memuat aktivitas...</p>
                </div>
              ) : riwayatData && riwayatData.history && riwayatData.history.length > 0 ? (
                riwayatData.history.slice(0, 3).map((h, i) => {
                  const isTryout = h.type === 'tryout';
                  const isUM = h.type === 'ujian_mandiri_tryout';
                  
                  let iconName = 'school';
                  let tagBg = 'bg-[#003d9b]/10 text-[#003d9b]';
                  let tagLabel = 'UTBK';
                  
                  if (h.type === 'latihan') {
                    iconName = 'menu_book';
                    tagBg = 'bg-gray-100 text-gray-700';
                    tagLabel = 'LATIHAN';
                  } else if (isUM) {
                    iconName = 'account_balance';
                    tagBg = 'bg-purple-100 text-purple-700';
                    tagLabel = 'UM';
                  }

                  let description = '';
                  if (isTryout) {
                    description = `Tryout Nasional Simulasi UTBK.`;
                  } else if (isUM) {
                    description = `Ujian Mandiri Perguruan Tinggi Negeri.`;
                  } else {
                    description = `Latihan Soal Mandiri.`;
                  }

                  const handleDetailClick = () => {
                    if (isTryout) {
                      navigate(`/tryout/hasil/${h.id}`, {
                        state: h.sessionIds && h.sessionIds.length > 1 ? { allSessionIds: h.sessionIds, packageId: h.packageId } : { packageId: h.packageId }
                      });
                    } else if (isUM) {
                      navigate(`/ujian-mandiri/${h.ujianId}/tryout/${h.packageId}/hasil/${h.id}`);
                    }
                  };

                  return (
                    <div key={h.id || i} className="bg-white/80 backdrop-blur-md border border-[#e2e8f0] p-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${h.type === 'latihan' ? 'bg-gray-100 text-gray-600' : isUM ? 'bg-purple-100 text-purple-600' : 'bg-[#0050cb]/10 text-[#0050cb]'}`}>
                          <span className="material-symbols-outlined text-xl">{iconName}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tagBg}`}>
                              {tagLabel}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-xs">calendar_today</span>
                              {formatDate(h.date)}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-[#001849] line-clamp-1">{h.name}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Skor</p>
                          <p className="text-lg font-extrabold text-[#0050cb]">{h.score}</p>
                        </div>
                        {isTryout || isUM ? (
                          <button 
                            onClick={handleDetailClick}
                            className="p-2.5 bg-[#0050cb] text-white rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center"
                            title="Detail Hasil"
                          >
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                          </button>
                        ) : (
                          <span className="p-2.5 bg-gray-100 text-gray-400 rounded-lg flex items-center justify-center cursor-not-allowed">
                            <span className="material-symbols-outlined text-lg">done_all</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white/50 border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">history_toggle_off</span>
                  <p className="text-sm">Belum ada riwayat aktivitas.</p>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT COLUMN: SCHEDULE (5 COLUMNS / STICKY) */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white/80 backdrop-blur-md border border-[#e2e8f0] rounded-2xl shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#e2e8f0]">
                <h2 className="text-[24px] tracking-tight uppercase font-bold text-[#001849]">Agenda Belajar</h2>
                <span className="px-3 py-1 bg-[#f2f3ff] text-[#0050cb] text-[10px] font-bold uppercase tracking-wider rounded-full">Minggu Ini</span>
              </div>
              
              <div className="space-y-4">
                {schedule.map((item, i) => (
                  <div key={i} className={`relative flex items-start gap-4 p-4 rounded-xl transition-all duration-300 group ${item.active ? 'bg-[#f2f3ff]/50 border border-[#0050cb]/20' : 'hover:bg-gray-50 border border-transparent hover:border-gray-100'}`}>
                    {item.active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-[#0050cb] rounded-r-md"></div>
                    )}
                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0 ${item.active ? 'bg-[#0050cb] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                      <span className="text-[10px] font-bold tracking-widest uppercase mb-0.5">{item.day}</span>
                      <span className="text-[20px] font-extrabold leading-none">{item.date}</span>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <h4 className={`text-[15px] font-bold mb-1.5 leading-snug line-clamp-2 ${item.active ? 'text-[#001849]' : 'text-gray-700'} group-hover:text-[#0050cb] transition-colors`}>{item.title}</h4>
                      <div className={`flex items-center gap-1.5 text-[12px] font-semibold ${item.active ? 'text-[#0050cb]' : 'text-gray-400'}`}>
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span>{item.time || 'Waktu fleksibel'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* CTA within Schedule */}
              <button className="mt-8 w-full py-4 bg-[#f2f3ff] text-[#0050cb] border border-[#0050cb]/20 rounded-xl text-[13px] font-bold uppercase tracking-widest hover:bg-[#0050cb] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 active:scale-95">
                <span>Buka Kalender Penuh</span>
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* ── UTBK OPTIONS MODAL ── */}
      {showUtbkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowUtbkModal(false)}
          />
          
          {/* Modal Container */}
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl relative z-10 transform scale-100 transition-all duration-300 border border-gray-100 font-sans animate-[scaleIn_0.2s_ease-out]">
            <button 
              onClick={() => setShowUtbkModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#eff6ff] text-[#2563eb] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <span className="material-symbols-outlined text-[24px]">school</span>
              </div>
              <h3 className="text-lg font-black text-[#191b24]">Ujian Tulis Berbasis Komputer (UTBK)</h3>
              <p className="text-xs text-gray-500 font-semibold mt-1">Pilih metode belajar untuk persiapan UTBK kamu.</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => { setShowUtbkModal(false); navigate('/latihan'); }}
                className="w-full bg-white border border-gray-150 rounded-2xl p-4 flex items-center gap-4 text-left hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <span className="material-symbols-outlined text-[22px]">menu_book</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#191b24]">Latihan Soal</h4>
                  <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Asah pemahaman materi UTBK bab demi bab.</p>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-[#2563eb] ml-auto transition-colors text-[18px]">arrow_forward</span>
              </button>

              <button 
                onClick={() => { setShowUtbkModal(false); navigate('/tryout/packages'); }}
                className="w-full bg-white border border-gray-150 rounded-2xl p-4 flex items-center gap-4 text-left hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#fdf2f8] text-[#db2777] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <span className="material-symbols-outlined text-[22px]">timer</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#191b24]">Tryout Simulasi</h4>
                  <p className="text-[11px] text-gray-500 font-semibold mt-0.5">Uji kemampuan dengan sistem CBT dan skor IRT.</p>
                </div>
                <span className="material-symbols-outlined text-gray-400 group-hover:text-[#db2777] ml-auto transition-colors text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE MENU DRAWER ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[120] md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-2xl flex flex-col p-6 z-10 animate-[slideInRight_0.25s_ease-out] font-sans">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 w-auto object-contain" />
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto">
              {[
                { to: '/dashboard', label: 'Dashboard', active: true },
                { to: '/latihan', label: 'Latihan', active: false },
                { to: '/tryout/packages', label: 'Tryout', active: false },
                { to: '/ujian-mandiri', label: 'Ujian Mandiri', active: false },
                { to: '/paket-belajar', label: 'Paket Belajar', active: false },
                { to: '/battle', label: 'Battle', active: false },
                { to: '/riwayat', label: 'Riwayat', active: false },
                { to: '/prediksi-skor', label: 'Prediksi Skor', active: false },
                { to: '/rasionalisasi', label: 'Rasionalisasi', active: false },
                { to: '/profile', label: 'Profil Saya', active: false },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-2xl text-[14px] font-bold tracking-tight transition-all ${
                    item.active 
                      ? 'bg-[#eff6ff] text-[#2563eb]' 
                      : 'text-[#374151] hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Footer with Logout */}
            <div className="pt-6 border-t border-gray-100">
              <button 
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.5; }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(12deg); }
        }
      `}</style>

      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Dashboard;
