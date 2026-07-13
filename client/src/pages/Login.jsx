import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import './Register.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || null;

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

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      setLoading(true);
      const res = await loginWithGoogle(credentialResponse.credential);
      toast.success('Berhasil masuk dengan Google!');
      const userRole = res?.data?.user?.role;
      const isStaff = ['admin', 'question_writer', 'quality_assurance', 'article_writer'].includes(userRole);
      const dest = isStaff ? '/admin' : (redirectTo || '/dashboard');
      navigate(dest);
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal masuk dengan Google. Silakan coba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google Login Failed');
    setError('Gagal masuk dengan Google. Silakan coba lagi.');
    toast.error('Gagal masuk dengan Google');
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
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
              />
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

