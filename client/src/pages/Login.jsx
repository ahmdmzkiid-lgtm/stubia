import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { detectInAppBrowser, getOpenInBrowserLink } from '../utils/inAppBrowserDetect';
import './Register.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || null;

  const inAppInfo = detectInAppBrowser();

  const handleGoogleRedirect = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'redirect',
    redirect_uri: `${window.location.origin}/auth/google/callback`,
  });

  const triggerGoogleLogin = () => {
    if (redirectTo) {
      localStorage.setItem('oauth_redirect_after_login', redirectTo);
    }
    if (inAppInfo.isInAppBrowser) {
      const linkInfo = getOpenInBrowserLink();
      if (linkInfo.method === 'intent') {
        window.location.href = linkInfo.url;
        return;
      } else {
        navigator.clipboard?.writeText(window.location.href);
        toast.success('Link disalin! Buka aplikasi Chrome atau Safari lalu tempelkan link ini.');
        return;
      }
    }
    handleGoogleRedirect();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ email, password });
      toast.success('Selamat datang kembali!');
      const userRole = res?.data?.user?.role;
      const isStaff = ['admin', 'question_writer', 'quality_assurance', 'article_writer'].includes(userRole);
      const dest = isStaff ? '/admin' : (redirectTo || '/dashboard');
      navigate(dest);
    } catch (err) {
      const hint = err.response?.data?.hint;
      const serverMsg = err.response?.data?.error;
      if (hint === 'google_account') {
        setError(serverMsg || 'Akun ini terdaftar via Google. Gunakan tombol "Masuk dengan Google".');
      } else {
        setError(serverMsg || 'Email atau password salah. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Desktop Left Panel */}
      <div className="register-left">
        <div className="auth-side-nav">
          <Link to="/" className="register-logo"><img src="/stubiabrandicon.png" alt="Stubia" /></Link>
        </div>
        <div className="register-left-content">
          <h1>Lanjutkan perjalanan <span>UTBK</span>-mu</h1>
          <p>Masuk ke akunmu untuk melanjutkan latihan soal, tryout simulasi, dan pantau perkembangan skormu.</p>
          <div className="register-hero-img">
            <img
              src="/landingpage-hero.webp"
              alt="Students collaborating"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="register-right">
        <div className="register-form-card">
          <Link to="/" className="register-mobile-logo"><img src="/stubiabrandicon.png" alt="Stubia" className="h-8" /></Link>

          <div className="register-form-header">
            <h2>Masuk</h2>
            <p>Masuk ke akun Stubia-mu.</p>
          </div>

          {/* In-App Browser Warning Banner */}
          {inAppInfo.isInAppBrowser && (
            <div style={{
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#856404',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#faad14' }}>warning</span>
                <span>Terdeteksi Browser {inAppInfo.appName}</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.4' }}>
                Google Login tidak didukung di dalam browser {inAppInfo.appName}. Buka link ini di aplikasi <strong>Chrome</strong> atau <strong>Safari</strong> utama untuk login dengan lancar.
              </p>
              <button
                type="button"
                onClick={() => {
                  const linkInfo = getOpenInBrowserLink();
                  if (linkInfo.method === 'intent') {
                    window.location.href = linkInfo.url;
                  } else {
                    navigator.clipboard?.writeText(window.location.href);
                    toast.success('Link disalin! Tempelkan di Chrome/Safari.');
                  }
                }}
                style={{
                  alignSelf: 'flex-start',
                  background: '#faad14',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_browser</span>
                Buka di Browser Utama
              </button>
            </div>
          )}

          {/* Inline error banner */}
          {error && (
            <div className="login-error-banner" role="alert">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className={`input-wrapper${error ? ' input-error' : ''}`}>
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className={`input-wrapper${error ? ' input-error' : ''}`}>
                <span className="material-symbols-outlined input-icon">lock</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button type="submit" className="btn-register" disabled={loading}>
              {loading ? 'Masuk...' : 'Masuk'}
            </button>

            <div className="divider-or">
              <div className="divider-line"></div>
              <span>atau masuk dengan</span>
              <div className="divider-line"></div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={triggerGoogleLogin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '10px 16px',
                  backgroundColor: '#ffffff',
                  color: '#3c4043',
                  border: '1px solid #dadce0',
                  borderRadius: '24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'Roboto, sans-serif',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s, box-shadow 0.2s',
                  boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.41-1.57-5.13-3.72L.93 13.04C2.45 16.06 5.51 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.87 10.8c-.18-.53-.28-1.1-.28-1.8s.1-1.27.28-1.8L.93 4.96C.33 6.16 0 7.53 0 9s.33 2.84.93 4.04l2.94-2.24z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.51 0 2.45 1.94.93 4.96l2.94 2.24c.72-2.15 2.75-3.62 5.13-3.62z"/>
                </svg>
                <span>Masuk dengan Google</span>
              </button>
            </div>
          </form>

          <p className="register-login-link">
            Belum punya akun? <Link to="/register">Daftar</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

