import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { subscriptionService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function PaketBelajar() {
  const { user } = useContext(AuthContext);
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('utbk_sub'); // 'utbk_sub', 'utbk_quota', 'um'
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  // Load plans & subscriptions
  const loadData = useCallback(async () => {
    try {
      const [plansRes, subRes] = await Promise.all([
        subscriptionService.getPlans(),
        user ? subscriptionService.getMySubscription() : Promise.resolve({ data: { data: null } }),
      ]);
      // Filter out 'gratis' plan from commercial list
      const allPlans = plansRes.data.data || [];
      const commercialPlans = allPlans.filter(p => p.name !== 'gratis');
      setPlans(commercialPlans);
      setCurrentSub(subRes.data.data);
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load cart from localStorage
  useEffect(() => {
    loadData();
    const storedCart = localStorage.getItem('stubia_cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        setCart([]);
      }
    }
  }, [loadData]);

  // Add/remove item helper
  const toggleCart = (plan) => {
    let updatedCart = [...cart];
    const exists = cart.some(item => item.id === plan.id);

    if (exists) {
      updatedCart = updatedCart.filter(item => item.id !== plan.id);
      toast.success(`${plan.display_name} dihapus dari keranjang`);
    } else {
      updatedCart.push(plan);
      toast.success(`${plan.display_name} ditambahkan ke keranjang`);
    }

    setCart(updatedCart);
    localStorage.setItem('stubia_cart', JSON.stringify(updatedCart));
  };

  const isInCart = (planId) => {
    return cart.some(item => item.id === planId);
  };

  // Filter plans based on active tab
  const getFilteredPlans = () => {
    if (activeTab === 'utbk_sub') {
      return plans.filter(p => p.target_type === 'utbk' && p.plan_type === 'subscription');
    } else if (activeTab === 'utbk_quota') {
      return plans.filter(p => p.target_type === 'utbk' && p.plan_type === 'quota');
    } else if (activeTab === 'um') {
      return plans.filter(p => p.target_type === 'um');
    }
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0050cb]"></div>
      </div>
    );
  }

  const filteredPlans = getFilteredPlans();

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-24 text-[#191b24] font-sans">
      {/* Header Navigation */}
      <nav className="bg-white border-b border-[#c2c6d8]/30 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center">
            <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 sm:h-10 md:h-12" />
          </Link>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/cart')} 
              className="relative p-2 text-[#424656] hover:text-[#0050cb] transition-colors flex items-center"
            >
              <span className="material-symbols-outlined text-2xl">shopping_cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              )}
            </button>
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="text-sm font-semibold text-[#424656] hover:text-[#0050cb] transition-colors">
                ← Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="text-sm font-semibold bg-[#0050cb] text-white px-4 py-2 rounded-lg hover:bg-[#003fa4] transition-all shadow-md">
                Masuk
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Banner */}
      <div className="text-center pt-12 pb-8 px-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#191b24] mb-3 tracking-tight">Paket Belajar Stubia</h1>
        <p className="text-[#424656] text-base md:text-lg max-w-xl mx-auto">
          Pilih paket belajar terbaik sesuai kebutuhan persiapan ujianmu. Bisa berlangganan bulanan atau beli kuota tryout eceran.
        </p>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 mb-8">
        <div className="flex overflow-x-auto md:justify-center border-b border-[#c2c6d8]/30 no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('utbk_sub')}
            className={`flex-shrink-0 py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'utbk_sub'
                ? 'border-[#0050cb] text-[#0050cb]'
                : 'border-transparent text-[#424656] hover:text-[#0050cb]'
            }`}
          >
            <span className="material-symbols-outlined text-base sm:text-lg">calendar_month</span>
            UTBK Langganan
          </button>
          <button
            onClick={() => setActiveTab('utbk_quota')}
            className={`flex-shrink-0 py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'utbk_quota'
                ? 'border-[#0050cb] text-[#0050cb]'
                : 'border-transparent text-[#424656] hover:text-[#0050cb]'
            }`}
          >
            <span className="material-symbols-outlined text-base sm:text-lg">local_activity</span>
            UTBK Eceran (Kuota)
          </button>
          <button
            onClick={() => setActiveTab('um')}
            className={`flex-shrink-0 py-3 px-4 sm:px-6 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 ${
              activeTab === 'um'
                ? 'border-[#0050cb] text-[#0050cb]'
                : 'border-transparent text-[#424656] hover:text-[#0050cb]'
            }`}
          >
            <span className="material-symbols-outlined text-base sm:text-lg">account_balance</span>
            Ujian Mandiri (UM)
          </button>
        </div>
      </div>

      {/* Plans Display */}
      <div className="max-w-5xl mx-auto px-4">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#c2c6d8]/30 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-[#c2c6d8] mb-2">info</span>
            <p className="text-[#727687]">Belum ada paket tersedia di kategori ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              const inCart = isInCart(plan.id);
              const isCurrent = currentSub?.plan_id === plan.id;
              
              // Parse features safely
              const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;

              // Theme coloring aligned with system-wide palette
              let themeBtn = inCart 
                ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm'
                : 'bg-[#0050cb] hover:bg-[#003fa4] text-white shadow-lg shadow-[#0050cb]/10';
              let themeHeader = 'text-[#0050cb]';
              let checkColor = 'text-[#0050cb]';
              let bgAccent = plan.is_popular ? 'border-[#0050cb] ring-2 ring-[#dae1ff]' : 'border-[#c2c6d8]/30';
              let badgeColor = 'bg-[#0050cb] text-white';

              return (
                <div
                  key={plan.id}
                  className={`bg-white relative rounded-2xl p-7 flex flex-col border ${bgAccent} transition-all duration-200 hover:shadow-xl`}
                >
                  {/* Popular / Active Badge */}
                  {plan.is_popular && (
                    <span className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
                      Terpopuler
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white">
                      Aktif Saat Ini
                    </span>
                  )}

                  {/* Title */}
                  <h3 className={`text-xl font-bold mb-1 ${themeHeader}`}>
                    {plan.display_name}
                  </h3>
                  <p className="text-sm text-[#727687] mb-5 min-h-[40px]">
                    {plan.description}
                  </p>

                  {/* Pricing */}
                  <div className="mb-6 flex items-baseline">
                    <span className="text-4xl font-extrabold text-[#191b24]">
                      Rp{plan.price.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[#727687] text-xs ml-1.5">
                      {plan.plan_type === 'subscription' || plan.plan_type === 'access' ? `/${Math.round(plan.duration_days / 30)} bulan` : `/${plan.quota_limit || 1} TO`}
                    </span>
                  </div>

                  <hr className="border-[#c2c6d8]/20 mb-5" />

                  {/* Features list */}
                  <ul className="flex-1 space-y-3 mb-7">
                    {features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className={`material-symbols-outlined text-lg mt-0.5 ${checkColor}`}>
                          check_circle
                        </span>
                        <span className="text-sm text-[#424656] leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Add to Cart button */}
                  <button
                    onClick={() => toggleCart(plan)}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${themeBtn}`}
                  >
                    {inCart ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Hapus dari Keranjang
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-lg">shopping_cart</span>
                        Tambah ke Keranjang
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-[92%] sm:w-full max-w-md bg-[#191b24] text-white rounded-2xl shadow-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 border border-[#c2c6d8]/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="material-symbols-outlined text-yellow-400 text-2xl">shopping_cart_checkout</span>
            <div>
              <p className="font-bold text-xs sm:text-sm">{cart.length} paket dipilih</p>
              <p className="text-[10px] sm:text-xs text-[#727687]">Total: Rp{cart.reduce((sum, item) => sum + item.price, 0).toLocaleString('id-ID')}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/cart')} 
            className="bg-[#0050cb] hover:bg-[#003fa4] text-white text-[11px] sm:text-xs font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-md shadow-[#0050cb]/20"
          >
            Lihat Keranjang
          </button>
        </div>
      )}
    </div>
  );
}
