import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PageWrapper from './PageWrapper';
import { settingsService } from '../../services/api';

// Prevents logged-in users from accessing login/register
export const PublicRoute = () => {
  const { isAuthenticated, isStaff, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to={isStaff ? "/admin" : "/dashboard"} replace />;
  return <Outlet />;
};

// Copy protection component to prevent questions from being copied/saved
const CopyProtection = ({ children }) => {
  useEffect(() => {
    const preventCopy = (e) => {
      e.preventDefault();
    };
    const preventContextMenu = (e) => {
      e.preventDefault();
    };
    
    // Prevent keyboard shortcuts Ctrl+C, Ctrl+X, Ctrl+U, Ctrl+S, F12
    const preventKeys = (e) => {
      if (
        (e.ctrlKey && ['C', 'X', 'U', 'S', 'A'].includes(e.key.toUpperCase())) ||
        (e.metaKey && ['C', 'X', 'U', 'S', 'A'].includes(e.key.toUpperCase())) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeys);

    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeys);
    };
  }, []);

  return (
    <div className="select-none" style={{
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none'
    }}>
      {children}
    </div>
  );
};

// Student routes — no wrapper, each page handles its own layout/navbar
export const StudentRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? (
    <CopyProtection>
      <Outlet />
    </CopyProtection>
  ) : (
    <Navigate to="/login" replace />
  )
};

// Student routes that need PageWrapper (pages without their own navbar)
export const StudentRouteWrapped = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? (
    <CopyProtection>
      <PageWrapper><Outlet /></PageWrapper>
    </CopyProtection>
  ) : (
    <Navigate to="/login" replace />
  );
};

// Dark-theme protected routes (uses PageWrapper)
export const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? (
    <PageWrapper><Outlet /></PageWrapper>
  ) : (
    <Navigate to="/login" replace />
  );
};

// Admin-only routes
export const AdminRoute = () => {
  const { isAuthenticated, isStaff, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated && isStaff ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

// SKD-specific routes with maintenance mode (Feature Update) check
export const SKDRoute = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    settingsService.get().then((res) => {
      setSettings(res.data?.data || {});
    }).catch(() => {
      setSettings({});
    }).finally(() => {
      setSettingsLoading(false);
    });
  }, []);

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0050cb]/20 border-t-[#0050cb] rounded-full animate-spin mb-4" />
        <p className="text-[14px] text-[#727687] font-semibold">Memverifikasi status sistem...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if Feature Update is active
  const isFeatureUpdate = settings?.skd_feature_update === 'true' || settings?.skd_feature_update === true;

  if (isFeatureUpdate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f2f3ff] via-[#faf8ff] to-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Blur Orbs */}
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] bg-purple-600/5 rounded-full blur-[90px] pointer-events-none animate-pulse" />

        <div className="bg-white/80 backdrop-blur-xl border border-[#c2c6d8]/30 max-w-lg w-full rounded-[32px] p-8 sm:p-10 shadow-2xl text-center relative z-10 animate-scale-in">
          {/* Animated Gear/Progress Indicator */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* Pulsing circle background */}
            <div className="absolute inset-0 bg-[#0050cb]/10 rounded-full animate-ping scale-75" />
            <div className="absolute inset-2 bg-[#0050cb]/5 rounded-full" />
            
            {/* Outer spinning gear */}
            <div className="absolute inset-0 flex items-center justify-center text-[#0050cb] animate-spin" style={{ animationDuration: '8s' }}>
              <span className="material-symbols-outlined text-[64px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}>settings</span>
            </div>
            {/* Inner reverse spinning gear */}
            <div className="absolute inset-0 flex items-center justify-center text-purple-600 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
              <span className="material-symbols-outlined text-[36px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>construction</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            Feature Update Active
          </div>

          <h1 className="text-[24px] sm:text-[28px] font-black text-[#191b24] mb-4 leading-tight">
            Fitur SKD Sedang Diperbarui
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#727687] leading-relaxed mb-8">
            Saat ini tim pengembang kami sedang melakukan pembaruan berkala dan optimalisasi sistem pada modul SKD CPNS. Layanan ini akan segera kembali aktif setelah pembaruan selesai. Terima kasih atas kesabaran Anda.
          </p>

          <div className="pt-6 border-t border-[#c2c6d8]/20 flex flex-col gap-3">
            <a 
              href="/dashboard"
              className="w-full bg-[#0050cb] text-white py-4 rounded-2xl font-bold text-[14px] hover:bg-[#003fa4] transition-all shadow-md shadow-[#0050cb]/15 hover:shadow-lg active:scale-[0.98] inline-block"
            >
              Kembali ke Dashboard Utama
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CopyProtection>
      <Outlet />
    </CopyProtection>
  );
};

// Admin SKD routes with maintenance mode (Feature Update) check
export const AdminSKDRoute = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService.get().then((res) => {
      setSettings(res.data?.data || {});
    }).catch(() => {
      setSettings({});
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 w-full">
        <div className="w-10 h-10 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isFeatureUpdate = settings?.skd_feature_update === 'true' || settings?.skd_feature_update === true;

  if (isFeatureUpdate) {
    return (
      <div className="w-full flex items-center justify-center p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 sm:p-10 text-center max-w-xl shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-amber-600 mb-4 animate-pulse">construction</span>
          <h3 className="text-xl font-bold text-[#191b24] mb-2">Manajemen SKD CPNS Dinonaktifkan</h3>
          <p className="text-sm text-[#727687] leading-relaxed">
            Seluruh manajemen SKD CPNS (Latihan & Tryout) saat ini dinonaktifkan karena sistem sedang dalam mode <strong>Feature Update</strong>. Anda dapat mengaktifkannya kembali di halaman utama CMS Dashboard.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
