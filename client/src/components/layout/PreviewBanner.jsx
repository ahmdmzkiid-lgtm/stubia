import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function PreviewBanner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isPreview = searchParams.get('preview') === 'true';

  if (!isPreview) return null;

  const handleBackToAdmin = () => {
    if (window.opener) {
      window.close();
    }
    // Fallback if window.close() doesn't work or isn't allowed by browser
    navigate('/admin');
  };

  return (
    <div 
      className="bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-3 text-center text-sm font-bold flex flex-wrap items-center justify-center gap-2 sticky top-0 z-[9999] shadow-sm select-none"
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-amber-700 animate-pulse">visibility</span>
        <span>Mode Preview Staf / QA: Hasil pengerjaan dan skor tidak akan disimpan ke database atau leaderboard.</span>
      </div>
      <button
        onClick={handleBackToAdmin}
        className="ml-2 px-3 py-1 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow active:scale-95 cursor-pointer border-none outline-none"
      >
        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
        Kembali ke Admin
      </button>
    </div>
  );
}
