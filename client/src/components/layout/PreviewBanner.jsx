import React from 'react';
import { useSearchParams } from 'react-router-dom';

export default function PreviewBanner() {
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  if (!isPreview) return null;

  return (
    <div 
      className="bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-3 text-center text-sm font-bold flex items-center justify-center gap-2 sticky top-0 z-[9999] shadow-sm select-none"
    >
      <span className="material-symbols-outlined text-[20px] text-amber-700 animate-pulse">visibility</span>
      <span>Mode Preview Staf / QA: Hasil pengerjaan dan skor tidak akan disimpan ke database atau leaderboard.</span>
    </div>
  );
}
