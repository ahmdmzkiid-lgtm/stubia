import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated, isStaff } = useAuth();

  const handleBackHome = () => {
    if (isAuthenticated) {
      if (isStaff) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b24] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Brand Icon Header */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 cursor-pointer z-20" onClick={handleBackHome}>
        <img src="/stubiabrandicon.png" alt="Stubia Logo" className="h-10 w-auto object-contain" />
      </div>

      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#0050cb]/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#dae1ff]/30 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full text-center z-10 space-y-8">
        {/* Animated 404 text with gradient */}
        <div className="relative inline-block">
          <h1 className="text-[120px] sm:text-[150px] font-black leading-none bg-clip-text text-transparent bg-gradient-to-r from-[#0050cb] to-[#003fa4] select-none" style={{ animation: 'bounce 2.5s infinite' }}>
            404
          </h1>
          <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-4 py-1.5 bg-[#f2f3ff] border border-[#c2c6d8]/40 rounded-full text-xs font-bold uppercase tracking-widest text-[#0050cb] shadow-sm">
            Halaman Tidak Ditemukan
          </span>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#191b24]">Ups! Halaman Tidak Tersedia</h2>
          <p className="text-[#424656] text-sm sm:text-base leading-relaxed">
            Halaman yang kamu cari tidak dapat ditemukan atau telah dipindahkan. Mari kembali ke jalur belajar yang benar!
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <button
            onClick={handleBackHome}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#0050cb] hover:bg-[#003fa4] text-white rounded-xl font-bold text-sm shadow-md shadow-[#0050cb]/15 hover:shadow-lg hover:shadow-[#0050cb]/25 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
            Kembali ke Beranda
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-gray-50 border border-[#c2c6d8]/40 text-[#424656] hover:text-[#191b24] rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
          >
            Kembali Sebelumnya
          </button>
        </div>
      </div>
      
      {/* Decorative corner grid */}
      <div className="absolute top-0 left-0 w-40 h-40 border-l border-t border-[#c2c6d8]/20 rounded-tl-[40px] pointer-events-none transform translate-x-10 translate-y-10"></div>
      <div className="absolute bottom-0 right-0 w-40 h-40 border-r border-b border-[#c2c6d8]/20 rounded-br-[40px] pointer-events-none transform -translate-x-10 -translate-y-10"></div>
    </div>
  );
}
