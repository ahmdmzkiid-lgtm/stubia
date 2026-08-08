import React from 'react';
import { getLocalDateString } from '../utils/streak';

export default function StreakModal({ isOpen, onClose, streak }) {
  if (!isOpen) return null;

  const count = streak?.count || 1;
  const todayStr = getLocalDateString();
  const activeDates = streak?.activeDates || [todayStr];

  // Helper to generate the last 7 days for weekly tracker
  const getWeeklyDays = () => {
    const days = [];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dayName = dayNames[d.getDay()];
      const isToday = dateStr === todayStr;
      const isActive = activeDates.includes(dateStr) || isToday;
      
      days.push({
        name: dayName,
        dateNum: d.getDate(),
        dateStr,
        isToday,
        isActive,
      });
    }
    return days;
  };

  const weeklyDays = getWeeklyDays();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl relative z-10 transform scale-100 transition-all border border-amber-100 font-sans text-center animate-scale-in">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Flame Badge Header */}
        <div className="relative w-20 h-20 bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30 animate-bounce-subtle">
          <span className="material-symbols-outlined text-white text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
          <span className="absolute -bottom-2 bg-amber-900 text-amber-100 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-amber-300/40">
            Streak
          </span>
        </div>

        <h3 className="text-2xl font-black text-[#191b24] tracking-tight">
          {count} Hari Berturut-turut!
        </h3>

        <p className="text-sm text-gray-600 font-medium mt-1.5 leading-relaxed px-2">
          {count > 1 
            ? `Luar biasa! Kamu sudah aktif belajar di Stubia selama ${count} hari tanpa terputus.` 
            : 'Streak belajarmu baru saja dimulai hari ini. Login dan latihan setiap hari untuk meningkatkan streak-mu!'}
        </p>

        {/* Weekly Tracker */}
        <div className="bg-[#fffbeb] border border-amber-200/80 rounded-2xl p-4 my-6">
          <p className="text-xs font-bold text-[#78350f] mb-3 uppercase tracking-wider">
            Aktivitas 7 Hari Terakhir
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {weeklyDays.map((d, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <span className={`text-[10px] font-bold ${d.isToday ? 'text-amber-700 font-extrabold' : 'text-gray-400'}`}>
                  {d.name}
                </span>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    d.isActive 
                      ? 'bg-amber-500 text-white shadow-sm scale-105' 
                      : 'bg-amber-100/60 text-amber-400 border border-amber-200/60'
                  }`}
                >
                  {d.isActive ? (
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                  ) : d.dateNum}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all cursor-pointer text-sm flex items-center justify-center gap-1.5"
        >
          <span>Pertahankan Streak</span>
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
        </button>

      </div>
    </div>
  );
}
