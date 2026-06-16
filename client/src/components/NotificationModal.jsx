import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationModal() {
  const { unshownModals, markModalShown } = useNotifications();
  
  if (!unshownModals || unshownModals.length === 0) return null;
  
  // Show the oldest unshown notification
  const notification = unshownModals[0];

  const handleClose = () => {
    markModalShown(notification.id);
  };

  const renderMessage = (text) => {
    if (!text) return null;
    let parts = text.split(/(\[IG\]|\[X\])/g);
    
    return parts.map((part, i) => {
      if (part === '[IG]') {
        return (
          <a key={i} href="https://www.instagram.com/eduzet.my.id?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-[13px] mx-1 hover:scale-105 transition-transform mt-2">
            <span className="material-symbols-outlined text-[16px]">photo_camera</span>
            Instagram
          </a>
        );
      }
      if (part === '[X]') {
        return (
          <a key={i} href="https://x.com/eduzet?s=20" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black text-white font-bold text-[13px] mx-1 hover:scale-105 transition-transform mt-2">
            <span className="material-symbols-outlined text-[16px]">close</span>
            X (Twitter)
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slide-up transform transition-all relative">
        {notification.image_url && (
          <div className="w-full aspect-video bg-gray-100 overflow-hidden relative">
            <img 
              src={notification.image_url} 
              alt="Notification Banner" 
              className="w-full h-full object-cover"
            />
            <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 backdrop-blur-sm transition-all z-10">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
        
        <div className="p-6 sm:p-8">
          {!notification.image_url && (
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-[20px] sm:text-[24px] font-bold text-[#191b24] leading-tight">
                {notification.title}
              </h3>
              <button onClick={handleClose} className="w-8 h-8 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}
          
          {notification.image_url && (
            <h3 className="text-[20px] sm:text-[24px] font-bold text-[#191b24] leading-tight mb-4">
              {notification.title}
            </h3>
          )}

          <div className="text-[#424656] text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap mb-8">
            {renderMessage(notification.message)}
          </div>
          
          <button
            onClick={handleClose}
            className="w-full bg-[#0050cb] text-white py-3.5 rounded-xl font-bold text-[15px] hover:bg-[#003fa4] transition-all active:scale-[0.98]"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
