import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const handledRef = useRef(false);

  useEffect(() => {
    // Ensure callback code is only handled once (prevent double processing in StrictMode)
    if (handledRef.current) return;
    handledRef.current = true;

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Google OAuth redirect error:', error);
      setErrorMsg('Login Google dibatalkan atau terjadi kesalahan.');
      toast.error('Gagal masuk dengan Google.');
      setTimeout(() => navigate('/login', { replace: true }), 2500);
      return;
    }

    if (!code) {
      setErrorMsg('Kode otentikasi Google tidak ditemukan.');
      toast.error('Kode otentikasi tidak ditemukan.');
      setTimeout(() => navigate('/login', { replace: true }), 2500);
      return;
    }

    const redirectUri = window.location.origin + '/auth/google/callback';

    const processLogin = async () => {
      try {
        const res = await handleGoogleCallback(code, redirectUri);
        toast.success('Berhasil masuk dengan Google!');
        const userRole = res?.data?.user?.role;
        const isStaff = ['admin', 'question_writer', 'quality_assurance', 'article_writer'].includes(userRole);
        
        // Restore saved redirect target if any
        const savedRedirect = localStorage.getItem('oauth_redirect_after_login');
        localStorage.removeItem('oauth_redirect_after_login');
        
        const dest = isStaff ? '/admin' : (savedRedirect || '/dashboard');
        navigate(dest, { replace: true });
      } catch (err) {
        console.error('Google callback exchange failed:', err);
        const msg = err.response?.data?.error || 'Gagal memproses login Google. Silakan coba lagi.';
        setErrorMsg(msg);
        toast.error(msg);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    processLogin();
  }, [searchParams, handleGoogleCallback, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#faf8ff',
      fontFamily: 'Inter, sans-serif',
      padding: '20px',
      textAlign: 'center'
    }}>
      {!errorMsg ? (
        <>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #0050cb',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h2 style={{ color: '#1a1c23', fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
            Memproses Login Google...
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Mohon tunggu sebentar, kami sedang mengamankan akunmu.
          </p>
        </>
      ) : (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#ef4444', marginBottom: '8px' }}>
            error
          </span>
          <h3 style={{ color: '#991b1b', fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
            Gagal Masuk
          </h3>
          <p style={{ color: '#b91c1c', fontSize: '14px', margin: '0 0 16px 0' }}>
            {errorMsg}
          </p>
          <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
            Mengalihkan kembali ke halaman login...
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleCallback;
