import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { settingsService, subscriptionService, activityService } from '../services/api';
import toast from 'react-hot-toast';
import ChatWidget from '../components/ChatWidget';
import Footer from '../components/Footer';
import StudentNavbar from '../components/layout/StudentNavbar';

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

  const loadTransactions = () => {
    subscriptionService.getTransactions().then(r => {
      setTransactions(r.data?.data || []);
    }).catch(() => {});
  };

  useEffect(() => {
    settingsService.get().then(r => {
      const d = r.data.data;
      setBanner(prev => ({ ...prev, ...d }));
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

  const handleUpgrade = async (planName) => {
    const plan = plans.find(p => p.name === planName);
    if (!plan) { toast.error('Paket tidak ditemukan'); return; }
    if (plan.name === 'gratis') { toast('Kamu sudah menggunakan paket Gratis', { icon: 'ℹ️' }); return; }
    setPaying(planName);
    try {
      const res = await subscriptionService.subscribe(plan.id);
      const { token, order_id } = res.data.data;
      await loadSnapScript();
      // Preserve scroll position when Snap popup opens
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      window.snap.pay(token, {
        onSuccess: async () => {
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          window.scrollTo(0, scrollY);
          toast.success('Pembayaran berhasil! Mengaktifkan paket...');
          try {
            await subscriptionService.confirmPayment(order_id);
          } catch (e) { console.warn('Confirm fallback:', e); }
          await refreshUser();
          setPaying(null);
        },
        onPending: () => {
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          window.scrollTo(0, scrollY);
          toast('Menunggu pembayaran...', { icon: '⏳' });
          setPaying(null);
        },
        onError: () => {
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          window.scrollTo(0, scrollY);
          toast.error('Pembayaran gagal');
          setPaying(null);
        },
        onClose: () => {
          document.body.style.position = '';
          document.body.style.top = '';
          document.body.style.width = '';
          window.scrollTo(0, scrollY);
          setPaying(null);
        },
      });
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses pembayaran');
      setPaying(null);
    }
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

  const pendingTxs = transactions.filter(t => t.status === 'pending');

  return (
    <div className="min-h-screen text-[#191b24]" style={{ fontFamily: "'Inter', sans-serif", backgroundColor: '#faf8ff' }}>
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={handleLogout} transparent={true} />

      {/* ── HERO BANNER (full-screen) ── */}
      <section className="relative h-screen w-full flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={banner.banner_image_url} alt="Banner" className="w-full h-full object-cover" onError={e => { e.target.onerror = null; e.target.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="800" viewBox="0 0 1920 800"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0050cb"/><stop offset="100%" stop-color="#191b24"/></linearGradient></defs><rect fill="url(#g)" width="1920" height="800"/></svg>')}`; }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#191b24]/90 via-[#191b24]/50 to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 w-full">
          <div className="max-w-3xl pt-32">
            <h1 className="text-[28px] sm:text-[40px] lg:text-[56px] leading-[1.15] font-bold text-white mb-6 drop-shadow-sm">
              {banner.banner_title.includes(' ') ? (
                <>{banner.banner_title.split(' ').slice(0, -1).join(' ')} <span className="text-[#00c1fd]">{banner.banner_title.split(' ').pop()}</span></>
              ) : banner.banner_title}
            </h1>
            <p className="text-base sm:text-xl text-white/80 mb-10 leading-relaxed max-w-xl">{banner.banner_subtitle}</p>
            <div className="mt-8 sm:mt-16 flex items-center gap-4 sm:gap-8 border-l-2 border-[#0050cb]/50 pl-4 sm:pl-8">
              <div><p className="text-white text-lg sm:text-2xl font-bold">100+</p><p className="text-white/60 text-xs sm:text-sm uppercase">Soal Latihan</p></div>
              <div><p className="text-white text-lg sm:text-2xl font-bold">5k+</p><p className="text-white/60 text-xs sm:text-sm uppercase">Siswa Aktif</p></div>
              <div><p className="text-white text-lg sm:text-2xl font-bold">98%</p><p className="text-white/60 text-xs sm:text-sm uppercase">Tingkat Kepuasan</p></div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 animate-bounce">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold">Scroll ke Dashboard</p>
          <span className="material-symbols-outlined">expand_more</span>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10" style={{ backgroundImage: 'radial-gradient(at 0% 0%, hsla(220,100%,95%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(190,100%,95%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(250,100%,95%,1) 0, transparent 50%)' }}>

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

        {/* Active Learning (Replaces Welcome/Stats) */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Card 1: Ikut Tryout */}
            <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,102,255,0.04)] border border-[#c2c6d8] flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-[#0066ff]/10 text-[#0050cb] px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">quiz</span>
                  <span className="text-[12px] font-semibold leading-4">Tryout</span>
                </div>
                <span className="material-symbols-outlined text-[#727687]">more_vert</span>
              </div>
              <h3 className="text-[24px] font-semibold leading-8 mb-2 text-[#191b24]">Ikut Tryout</h3>
              <p className="text-[16px] leading-6 text-[#424656] mb-4">Uji kemampuanmu dengan tryout lengkap simulasi UTBK terbaru.</p>
              <ul className="text-[14px] text-[#727687] mb-6 space-y-2">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#0050cb]">check_circle</span> Soal FR UTBK</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#0050cb]">check_circle</span> Soal HOTS</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#0050cb]">check_circle</span> Kalkulator PM</li>
              </ul>
              <div className="mt-auto">
                <Link to="/tryout/packages" className="w-full bg-[#0066ff] text-white text-[14px] font-medium py-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
                  Mulai Tryout
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Card 2: Mulai Latihan Soal */}
            <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,102,255,0.04)] border border-[#c2c6d8] flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-[#cc4204]/10 text-[#a33200] px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  <span className="text-[12px] font-semibold leading-4">Latihan</span>
                </div>
                <span className="material-symbols-outlined text-[#727687]">more_vert</span>
              </div>
              <h3 className="text-[24px] font-semibold leading-8 mb-2 text-[#191b24]">Mulai Latihan Soal</h3>
              <p className="text-[16px] leading-6 text-[#424656] mb-4">Latihan soal per bab untuk mengasah pemahamanmu.</p>
              <ul className="text-[14px] text-[#727687] mb-6 space-y-2">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#a33200]">check_circle</span> Soal FR UTBK 2023-2026</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#a33200]">check_circle</span> Easy, Medium hingga HOTS</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#a33200]">check_circle</span> LBI/LBE SAINTEK SOSHUM</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#a33200]">check_circle</span> Kalkulator PM</li>
              </ul>
              <div className="mt-auto">
                <Link to="/latihan" className="w-full bg-[#a33200] text-white text-[14px] font-medium py-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
                  Mulai Latihan
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Card 3: Konsultasi Bia */}
            <div className="bg-gradient-to-br from-[#f0f4ff] to-[#e8eeff] rounded-xl p-6 shadow-[0_4px_20px_rgba(0,102,255,0.04)] border border-[#c2c6d8] flex flex-col hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-[#0050cb]/10 text-[#0050cb] flex items-center justify-center rounded-xl">
                  <span className="material-symbols-outlined text-[32px]">smart_toy</span>
                </div>
                <div className="text-right">
                  <div className="text-[12px] leading-4 font-semibold text-[#424656] uppercase tracking-wider">AI Chatbot</div>
                </div>
              </div>
              <h3 className="text-[24px] font-semibold leading-8 mb-2 text-[#191b24]">Konsultasi dengan Bia</h3>
              <p className="text-[16px] leading-6 text-[#424656] mb-4">Dapatkan rekomendasi belajar dan informasi Perguruan Tinggi Negeri dari AI tutor.</p>
              <ul className="text-[14px] text-[#727687] mb-6 space-y-2">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#0050cb]">check_circle</span> Rekomendasi strategi belajar</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#0050cb]">check_circle</span> Info PTN & jurusan</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#0050cb]">check_circle</span> Tips persiapan UTBK</li>
              </ul>
              <div className="mt-auto">
                <Link to="/konsultasi" className="w-full bg-[#0050cb] text-white text-[14px] font-medium py-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
                  Mulai Konsultasi
                  <span className="material-symbols-outlined">chat</span>
                </Link>
              </div>
            </div>

          </div>
        </section>

        <span className="block h-px bg-gradient-to-r from-transparent via-[#c2c6d8] to-transparent opacity-20 my-12"></span>

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

      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Dashboard;
