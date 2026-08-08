import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { detectInAppBrowser, getOpenInBrowserLink } from '../utils/inAppBrowserDetect';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registerMethod, setRegisterMethod] = useState('select'); // 'select' | 'email'
  const { register } = useAuth();
  const navigate = useNavigate();

  const inAppInfo = detectInAppBrowser();

  const handleGoogleRedirect = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'redirect',
    redirect_uri: `${window.location.origin}/auth/google/callback`,
  });

  const triggerGoogleLogin = () => {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });
      toast.success('Akun berhasil dibuat!');
      const userRole = res?.data?.user?.role;
      const isStaff = ['admin', 'question_writer', 'quality_assurance', 'article_writer'].includes(userRole);
      navigate(isStaff ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal membuat akun. Silakan coba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page register-page-bg">
      <div className="auth-card-container">
        <div className="register-form-card">
          {/* Brand Icon Logo */}
          <div className="auth-brand-wrapper centered-brand">
            <Link to="/" className="auth-brand-logo">
              <img src="/stubiabrandicon.png" alt="Stubia" />
            </Link>
          </div>

          {/* In-App Browser Warning Banner */}
          {inAppInfo.isInAppBrowser && (
            <div className="in-app-warning">
              <div className="in-app-warning-header">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#faad14' }}>warning</span>
                <span>Terdeteksi Browser {inAppInfo.appName}</span>
              </div>
              <p>
                Google Register tidak didukung di dalam browser {inAppInfo.appName}. Buka link ini di aplikasi <strong>Chrome</strong> atau <strong>Safari</strong> utama untuk daftar dengan lancar.
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
                className="btn-in-app"
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

          {registerMethod === 'select' ? (
            /* STEP 1: SELECT REGISTER METHOD */
            <div className="auth-step-container animate-fade-in">
              <div className="register-form-header text-center">
                <h2>Buat Akun Stubia</h2>
                <p>Belum punya akun? Silakan daftar akun baru</p>
              </div>

              <div className="auth-method-list">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={triggerGoogleLogin}
                  className="btn-pill-option btn-pill-google"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.41-1.57-5.13-3.72L.93 13.04C2.45 16.06 5.51 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.87 10.8c-.18-.53-.28-1.1-.28-1.8s.1-1.27.28-1.8L.93 4.96C.33 6.16 0 7.53 0 9s.33 2.84.93 4.04l2.94-2.24z"/>
                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.51 0 2.45 1.94.93 4.96l2.94 2.24c.72-2.15 2.75-3.62 5.13-3.62z"/>
                  </svg>
                  <span>Daftar dengan Akun Google</span>
                </button>

                {/* Divider */}
                <div className="divider-or">
                  <div className="divider-line"></div>
                  <span>atau</span>
                  <div className="divider-line"></div>
                </div>

                {/* Email Button */}
                <button
                  type="button"
                  onClick={() => setRegisterMethod('email')}
                  className="btn-pill-option btn-pill-email"
                >
                  <span className="material-symbols-outlined option-icon">alternate_email</span>
                  <span>Daftar dengan Email</span>
                </button>
              </div>

              <p className="register-login-link">
                Sudah punya akun? <Link to="/login">Masuk</Link>
              </p>
            </div>
          ) : (
            /* STEP 2: EMAIL FORM */
            <div className="auth-step-container animate-fade-in">
              <button
                type="button"
                className="btn-back"
                onClick={() => { setRegisterMethod('select'); setError(''); }}
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span>Kembali</span>
              </button>

              <div className="register-form-header">
                <h2>Buat Akun dengan Email</h2>
                <p>Mulai persiapan UTBK-mu sekarang.</p>
              </div>

              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                  <label htmlFor="name">Nama Lengkap</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">person</span>
                    <input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">mail</span>
                    <input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">lock</span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
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

                <div className="form-group">
                  <label htmlFor="confirmPassword">Konfirmasi Password</label>
                  <div className="input-wrapper">
                    <span className="material-symbols-outlined input-icon">lock</span>
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-register" disabled={loading}>
                  {loading ? 'Membuat akun...' : 'Buat Akun'}
                </button>
              </form>

              <p className="register-login-link">
                Sudah punya akun? <Link to="/login">Masuk</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
