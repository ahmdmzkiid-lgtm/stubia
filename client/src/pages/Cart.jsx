import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { subscriptionService, voucherService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Cart() {
  const { user, refreshUser } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null); // { code, discount, discountType, discountValue }
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  // Load cart from localStorage
  useEffect(() => {
    const storedCart = localStorage.getItem('stubia_cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        setCart([]);
      }
    }
  }, []);

  const removeFromCart = (planId) => {
    const updatedCart = cart.filter(item => item.id !== planId);
    setCart(updatedCart);
    localStorage.setItem('stubia_cart', JSON.stringify(updatedCart));
    toast.success('Paket dihapus dari keranjang');
    // Reset voucher if cart changes
    setAppliedVoucher(null);
    setVoucherCode('');
  };

  // Calculate prices
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const discount = appliedVoucher ? appliedVoucher.discount : 0;
  const total = subtotal - discount;

  // Validate voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Masukkan kode voucher');
      return;
    }
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    setValidatingVoucher(true);
    try {
      const planIds = cart.map(item => item.id);
      const res = await voucherService.validate(voucherCode, planIds);
      if (res.data.success) {
        setAppliedVoucher(res.data.data);
        toast.success(`Voucher ${res.data.data.code} berhasil diterapkan!`);
      }
    } catch (err) {
      // Axios interceptor will show error toast
      setAppliedVoucher(null);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    toast.success('Voucher dihapus');
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

  // Checkout process
  const handleCheckout = async () => {
    if (!user) {
      toast.error('Anda harus masuk terlebih dahulu');
      navigate('/login');
      return;
    }
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    setCheckingOut(true);
    const planIds = cart.map(item => item.id);

    try {
      const res = await subscriptionService.checkout(planIds, appliedVoucher?.code || null);
      
      // Case A: Free checkout activation
      if (res.data.data.status === 'settlement') {
        localStorage.removeItem('stubia_cart');
        setCart([]);
        toast.success('Paket Anda berhasil diaktifkan!');
        await refreshUser();
        navigate('/dashboard');
        return;
      }

      // Case B: Paid checkout with Snap
      const { token, order_id } = res.data.data;
      await loadSnapScript();

      // Lock body scroll during modal
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
          localStorage.removeItem('stubia_cart');
          setCart([]);
          toast.success('Pembayaran berhasil! Paket akan segera diaktifkan.');
          // Confirm payment with server (suppress any toast from interceptor)
          try {
            await api.post('/subscription/confirm', { order_id });
          } catch (e) { /* webhook will process it if this fails */ }
          try { await refreshUser(); } catch (e) {}
          navigate('/dashboard');
        },
        onPending: () => {
          restoreScroll();
          localStorage.removeItem('stubia_cart');
          setCart([]);
          toast('Pembayaran tertunda. Cek status di riwayat belanja.', { icon: '⏳' });
          navigate('/dashboard');
        },
        onError: () => {
          restoreScroll();
          toast.error('Pembayaran gagal');
          setCheckingOut(false);
        },
        onClose: () => {
          restoreScroll();
          setCheckingOut(false);
        }
      });
    } catch (err) {
      console.error('Checkout failed:', err);
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] pb-24 text-[#191b24] font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-[#c2c6d8]/30 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center">
            <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 sm:h-10 md:h-12" />
          </Link>
          <span className="font-bold text-[#191b24] text-lg hidden sm:block">Keranjang Belanja</span>
          <button onClick={() => navigate('/paket-belajar')} className="text-sm font-semibold text-[#0050cb] flex items-center gap-1 hover:text-[#003fa4] transition-colors">
            <span className="material-symbols-outlined text-[20px] font-bold">arrow_back</span>
            Paket Belajar
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 pt-12">
        {cart.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#c2c6d8]/30 shadow-sm">
            <span className="material-symbols-outlined text-6xl text-[#c2c6d8] mb-4">shopping_cart</span>
            <h2 className="text-xl font-bold text-[#191b24] mb-2">Keranjang Belanja Kosong</h2>
            <p className="text-[#424656] mb-6">Anda belum menambahkan paket belajar ke keranjang.</p>
            <button
              onClick={() => navigate('/paket-belajar')}
              className="bg-[#0050cb] hover:bg-[#003fa4] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md"
            >
              Lihat Paket Belajar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-[#c2c6d8]/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#c2c6d8]/60"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="p-2.5 sm:p-3 bg-[#dae1ff]/30 text-[#0050cb] rounded-xl flex-shrink-0">
                      <span className="material-symbols-outlined text-xl sm:text-2xl">
                        {item.plan_type === 'quota' ? 'local_activity' : 'school'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#191b24] text-sm sm:text-base">{item.display_name}</h4>
                      <p className="text-xs text-[#727687] mt-0.5">{item.description}</p>
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ecedfa] text-[#424656] capitalize">
                        {item.target_type === 'um' ? 'Ujian Mandiri' : 'UTBK/SNBT'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#c2c6d8]/10">
                    <span className="font-extrabold text-[#191b24] text-sm sm:text-base">
                      Rp{item.price.toLocaleString('id-ID')}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Checkout Summary & Vouchers */}
            <div className="bg-white rounded-2xl p-6 border border-[#c2c6d8]/30 shadow-sm space-y-6">
              <h3 className="font-bold text-[#191b24] text-base">Ringkasan Harga</h3>
              
              {/* Voucher Input */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-[#727687]">Punya Voucher Diskon?</label>
                {appliedVoucher ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs">
                      <span className="material-symbols-outlined text-emerald-600">confirmation_number</span>
                      <span>Voucher <strong>{appliedVoucher.code}</strong> aktif</span>
                    </div>
                    <button 
                      onClick={handleRemoveVoucher} 
                      className="text-xs text-red-600 hover:text-red-800 font-bold"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="KODE VOUCHER"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="w-full min-w-0 px-3 py-2.5 text-xs border border-[#c2c6d8]/40 rounded-xl focus:outline-none focus:border-[#0050cb] text-[#191b24] uppercase"
                    />
                    <button
                      onClick={handleApplyVoucher}
                      disabled={validatingVoucher}
                      className="flex-shrink-0 bg-[#191b24] hover:bg-black text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                      {validatingVoucher ? 'Cek...' : 'Terapkan'}
                    </button>
                  </div>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-3 pt-2 text-sm border-t border-[#c2c6d8]/20">
                <div className="flex justify-between text-[#424656]">
                  <span>Subtotal</span>
                  <span>Rp{subtotal.toLocaleString('id-ID')}</span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Diskon</span>
                    <span>-Rp{discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-[#191b24] text-base pt-3 border-t border-[#c2c6d8]/20">
                  <span>Total Bayar</span>
                  <span className="text-[#0050cb]">Rp{total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full bg-[#0050cb] hover:bg-[#003fa4] disabled:bg-gray-200 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-[#0050cb]/10 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkingOut ? (
                  'Memproses Transaksi...'
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">payment</span>
                    Bayar Sekarang
                  </>
                )}
              </button>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
