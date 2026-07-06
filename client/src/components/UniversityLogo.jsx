import React from 'react';

export default function UniversityLogo({ name, customUrl, className = "w-12 h-12" }) {
  const normalizedName = (name || '').toLowerCase();

  // If a custom URL is provided, try using that first (unless it's just 'custom' or empty)
  if (customUrl && customUrl.trim() !== '') {
    return (
      <img 
        src={customUrl} 
        alt="Logo Universitas" 
        className={`${className} object-contain`}
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
        }}
      />
    );
  }

  // Render SVG based on university type
  switch (normalizedName) {
    case 'ui':
      // Universitas Indonesia - Yellow Makara
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#FFE000" />
          {/* Stylized UI Makara */}
          <path d="M50 20C40 20 35 32 35 45C35 60 48 75 50 80C52 75 65 60 65 45C65 32 60 20 50 20ZM50 68C43 58 40 48 40 45C40 37 44 26 50 26C56 26 60 37 60 45C60 48 57 58 50 68Z" fill="#191B24" />
          <circle cx="50" cy="45" r="5" fill="#191B24" />
          <path d="M45 42C43 45 43 52 47 52C51 52 51 45 49 42" stroke="#191B24" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'ugm':
      // Universitas Gadjah Mada - Brownish Mandala
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#8D7550" />
          {/* UGM Mandala Star / Sun rays */}
          <path d="M50 15 L53 35 L70 30 L58 43 L78 50 L58 57 L70 70 L53 65 L50 85 L47 65 L30 70 L42 57 L22 50 L42 43 L30 30 L47 35 Z" fill="#FFEAA7" />
          <circle cx="50" cy="50" r="18" fill="#8D7550" />
          <circle cx="50" cy="50" r="12" fill="#FFEAA7" />
          <circle cx="50" cy="50" r="6" fill="#8D7550" />
        </svg>
      );
    case 'itb':
      // Institut Teknologi Bandung - Blue Shield & Elephant
      return (
        <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 10 C65 10 80 15 80 35 C80 60 65 80 50 90 C35 80 20 60 20 35 C20 15 35 10 50 10 Z" fill="#0050CB" />
          {/* Inner details / stylized elephant/Ganesha */}
          <path d="M50 25 C40 25 35 30 35 40 C35 55 42 65 50 75 C58 65 65 55 65 40 C65 30 60 25 50 25 Z" fill="#FFFFFF" />
          <path d="M50 35 C45 35 42 38 42 43 C42 48 50 60 50 60 C50 60 58 48 58 43 C58 38 55 35 50 35 Z" fill="#0050CB" />
          <rect x="46" y="28" width="8" height="4" rx="2" fill="#0050CB" />
        </svg>
      );
    default:
      // Fallback school cap icon
      return (
        <div className={`${className} bg-primary/10 text-primary rounded-full flex items-center justify-center`}>
          <span className="material-symbols-outlined text-[28px]">school</span>
        </div>
      );
  }
}
