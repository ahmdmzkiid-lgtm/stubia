import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationDropdown({ iconClassName = "text-[#424656] hover:bg-[#f2f3ff]" }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${iconClassName}`}
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-[#e5e2e3] overflow-hidden z-[9999] animate-fade-in">
          <div className="flex justify-between items-center p-4 border-b border-[#e5e2e3] bg-[#faf8ff]">
            <h3 className="font-bold text-[#191b24] text-[15px]">Notifikasi</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                className="text-[12px] font-bold text-[#0050cb] hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => {
                      if (!notif.is_read) markRead(notif.id);
                    }}
                    className={`p-4 border-b border-[#e5e2e3] cursor-pointer transition-colors hover:bg-gray-50 flex gap-3 ${!notif.is_read ? 'bg-[#f2f3ff]/50' : 'bg-white'}`}
                  >
                    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-[#0050cb]/10 text-[#0050cb]">
                      <span className="material-symbols-outlined text-[20px]">campaign</span>
                    </div>
                    <div>
                      <h4 className={`text-[14px] ${!notif.is_read ? 'font-bold text-[#191b24]' : 'font-semibold text-[#424656]'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-[12px] text-[#727687] mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-[#a0a4b8] mt-2 block font-medium">
                        {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center text-[#727687]">
                <span className="material-symbols-outlined text-[48px] text-[#c2c6d8] mb-2">notifications_off</span>
                <p className="text-[14px] font-medium">Belum ada notifikasi</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
