import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-[#c2c6d8]/30 mt-16">
      {/* Footer Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 px-6 lg:px-10 py-16 lg:py-24 max-w-[1440px] mx-auto">
        <div className="space-y-6">
          <div className="text-[24px] font-bold text-[#0050cb]">Stubia</div>
          <p className="text-[16px] font-light text-[#424656] max-w-xs leading-relaxed">Platform belajar digital premium yang memberdayakan pembelajar di seluruh Indonesia untuk meraih PTN impian.</p>
          <div className="flex gap-4 pt-2">
            <div className="w-10 h-10 rounded-full border border-[#c2c6d8] flex items-center justify-center text-[#424656] hover:bg-[#0050cb] hover:text-white hover:border-[#0050cb] transition-all cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12">
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-[#191b24] uppercase tracking-widest text-[12px]">Platform</h4>
            <nav className="flex flex-col gap-3 font-normal text-[#424656] text-[16px]">
              <Link to="/latihan" className="hover:text-[#0050cb] transition-colors">Latihan Soal</Link>
              <Link to="/tryout/packages" className="hover:text-[#0050cb] transition-colors">Tryout</Link>
              <Link to="/pricing" className="hover:text-[#0050cb] transition-colors">Harga</Link>
            </nav>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-[#191b24] uppercase tracking-widest text-[12px]">Legal</h4>
            <nav className="flex flex-col gap-3 font-normal text-[#424656] text-[16px]">
              <Link to="/privacy-policy" className="hover:text-[#0050cb] transition-colors">Privasi</Link>
              <Link to="/terms-and-conditions" className="hover:text-[#0050cb] transition-colors">Ketentuan</Link>
            </nav>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-[#191b24] uppercase tracking-widest text-[12px]">Bantuan</h4>
            <nav className="flex flex-col gap-3 font-normal text-[#424656] text-[16px]">
              <Link to="/contact-us" className="hover:text-[#0050cb] transition-colors">Pusat Bantuan</Link>
              <Link to="/contact-us" className="hover:text-[#0050cb] transition-colors">Kontak</Link>
            </nav>
          </div>
        </div>
      </div>
      <div className="px-6 lg:px-10 max-w-[1440px] mx-auto py-8 border-t border-[#c2c6d8]/20">
        <p className="text-[12px] text-[#424656] font-medium text-center md:text-left">© 2026 Stubia. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
