import { useState, useEffect, useContext, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { subscriptionService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PLAN_STYLES = {
  gratis: {
    bg: 'bg-white',
    border: 'border-gray-200',
    badge: null,
    btnClass: 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50',
    btnLabel: 'Paket Saat Ini',
    icon: '📚',
    headerText: 'text-gray-900',
    priceText: 'text-gray-900',
    featureIcon: 'text-blue-500',
  },
  premium: {
    bg: 'bg-white',
    border: 'border-blue-500 ring-2 ring-blue-100',
    badge: 'Populer',
    btnClass: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200',
    btnLabel: 'Upgrade Sekarang',
    icon: '🚀',
    headerText: 'text-blue-600',
    priceText: 'text-gray-900',
    featureIcon: 'text-blue-500',
  },
  premium_um: {
    bg: 'bg-white',
    border: 'border-teal-500 ring-2 ring-teal-100',
    badge: 'Ujian Mandiri',
    btnClass: 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-200',
    btnLabel: 'Upgrade Sekarang',
    icon: '🎯',
    headerText: 'text-teal-600',
    priceText: 'text-gray-900',
    featureIcon: 'text-teal-500',
  },
  sultan: {
    bg: 'bg-gray-900',
    border: 'border-gray-700',
    badge: '⭐',
    btnClass: 'bg-white text-gray-900 hover:bg-gray-100',
    btnLabel: 'Go Sultan',
    icon: '👑',
    headerText: 'text-white',
    priceText: 'text-white',
    featureIcon: 'text-yellow-400',
  },
};

export default function PricingPage() {
  const { user, refreshUser } = useContext(AuthContext);
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [checkingTx, setCheckingTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const [plansRes, subRes, txRes] = await Promise.all([
        subscriptionService.getPlans(),
        user ? subscriptionService.getMySubscription() : Promise.resolve({ data: { data: null } }),
        user ? subscriptionService.getTransactions() : Promise.resolve({ data: { data: [] } }),
      ]);
      setPlans(plansRes.data.data || []);
      setCurrentSub(subRes.data.data);
      setTransactions(txRes.data.data || []);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle payment callback from Midtrans redirect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Pembayaran berhasil! Paket kamu sudah aktif.');
      loadData();
    } else if (paymentStatus === 'pending') {
      toast('Pembayaran sedang diproses...', { icon: '⏳' });
    } else if (paymentStatus === 'error') {
      toast.error('Pembayaran gagal. Silakan coba lagi.');
    }
  }, [searchParams, loadData]);

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

  const handleSubscribe = async (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (plan.name === 'gratis') {
      toast('Kamu sudah menggunakan paket Gratis', { icon: 'ℹ️' });
      return;
    }

    setPaying(plan.id);

    try {
      const res = await subscriptionService.subscribe(plan.id);
      const { token, order_id } = res.data.data;

      await loadSnapScript();

      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      const restoreScroll = () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };

      window.snap.pay(token, {
        onSuccess: async () => {
          restoreScroll();
          toast.success('Pembayaran berhasil! Mengaktifkan paket...');
          try {
            await subscriptionService.confirmPayment(order_id);
          } catch (e) { console.warn('Confirm fallback:', e); }
          await refreshUser();
          loadData();
          setPaying(null);
        },
        onPending: () => {
          restoreScroll();
          toast('Menunggu pembayaran...', { icon: '⏳' });
          loadData();
          setPaying(null);
        },
        onError: () => {
          restoreScroll();
          toast.error('Pembayaran gagal');
          setPaying(null);
        },
        onClose: () => {
          restoreScroll();
          loadData();
          setPaying(null);
        },
      });
    } catch (err) {
      console.error(err);
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
        await loadData();
      } else {
        toast.error(res.data?.error || 'Gagal memverifikasi pembayaran');
      }
    } catch (err) {
      console.error(err);
      await refreshUser();
      await loadData();
    } finally {
      setCheckingTx(null);
    }
  };

  const currentPlanName = currentSub?.plan_name || user?.current_plan || 'gratis';
  const pendingTxs = transactions.filter(t => t.status === 'pending');

  const getPeriodLabel = (durationDays) => {
    if (!durationDays) return '';
    if (durationDays >= 365) return '/tahun';
    if (durationDays === 180) return '/6 bulan';
    if (durationDays === 60) return '/2 bulan';
    const months = Math.round(durationDays / 30);
    return `/${months} bulan`;
  };

  const formatPrice = (price, durationDays) => {
    if (price === 0) return { amount: 'Rp0', period: '' };
    return {
      amount: `Rp${price.toLocaleString('id-ID')}`,
      period: getPeriodLabel(durationDays),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(user ? '/dashboard' : '/')} className="text-xl font-bold text-blue-600">
            Stubia
          </button>
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-600 hover:text-blue-600">
              ← Dashboard
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Masuk
            </button>
          )}
        </div>
      </nav>

      {/* Header */}
      <div className="text-center pt-16 pb-8 px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Pilih Paket Belajarmu</h1>
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto">
          Tingkatkan persiapan UTBK-mu dengan fitur premium. Bisa upgrade atau downgrade kapan saja.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-24">
        {/* Pending Transactions Alert */}
        {pendingTxs.length > 0 && (
          <div className="mb-8 space-y-3">
            {pendingTxs.map(tx => (
              <div key={tx.id} className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm shadow-sm">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const style = PLAN_STYLES[plan.name] || PLAN_STYLES.gratis;
            const isCurrent = currentPlanName === plan.name;
            const { amount, period } = formatPrice(plan.price, plan.duration_days);
            const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
            const isDark = plan.name === 'sultan';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-7 flex flex-col border ${style.bg} ${style.border} transition-all duration-200 hover:shadow-xl`}
              >
                {/* Badge */}
                {style.badge && (
                  <span className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-semibold ${
                    isDark ? 'bg-yellow-400 text-gray-900' : 'bg-blue-600 text-white'
                  }`}>
                    {style.badge}
                  </span>
                )}

                {/* Plan Name */}
                <h3 className={`text-xl font-bold mb-1 ${style.headerText}`}>
                  {plan.display_name}
                </h3>
                <p className={`text-sm mb-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className={`text-4xl font-extrabold ${style.priceText}`}>{amount}</span>
                  {period && (
                    <span className={`text-base ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{period}</span>
                  )}
                </div>

                {/* Divider */}
                <hr className={`mb-5 ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />

                {/* Features */}
                <ul className="flex-1 space-y-3 mb-7">
                  {features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className={`material-symbols-outlined text-lg mt-0.5 ${isDark ? 'text-yellow-400' : 'text-blue-500'}`}>
                        check_circle
                      </span>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{feat}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  onClick={() => !isCurrent && handleSubscribe(plan)}
                  disabled={isCurrent || paying === plan.id}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-default'
                      : paying === plan.id
                      ? 'bg-gray-200 text-gray-400 cursor-wait'
                      : style.btnClass
                  }`}
                >
                  {paying === plan.id
                    ? 'Memproses...'
                    : isCurrent
                    ? 'Paket Saat Ini'
                    : plan.price === 0
                    ? 'Paket Gratis'
                    : style.btnLabel}
                </button>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="text-center mt-12 text-gray-400 text-sm space-y-1">
          <p>Pembayaran aman melalui Midtrans. Mendukung GoPay, OVO, BCA, Mandiri, dan lainnya.</p>
          <p>Butuh bantuan? Hubungi tim support kami.</p>
        </div>
      </div>
    </div>
  );
}
