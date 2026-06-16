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
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email, password });
      toast.success('Selamat datang kembali!');
      const dest = res?.data?.user?.role === 'admin' ? '/admin' : (redirectTo || '/dashboard');
      navigate(dest);
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const res = await loginWithGoogle(credentialResponse.credential);
      toast.success('Berhasil masuk dengan Google!');
      const dest = res?.data?.user?.role === 'admin' ? '/admin' : (redirectTo || '/dashboard');
      navigate(dest);
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google Login Failed');
    toast.error('Gagal masuk dengan Google');
  };

  return (
    <div className="register-page">
      {/* Desktop Left Panel */}
      <div className="register-left">
        <div className="auth-side-nav">
          <Link to="/" className="register-logo"><img src="/eduzet-brand-light.svg" alt="Eduzet" /></Link>
        </div>
        <div className="register-left-content">
          <h1>Lanjutkan perjalanan <span>UTBK</span>-mu</h1>
          <p>Masuk ke akunmu untuk melanjutkan latihan soal, tryout simulasi, dan pantau perkembangan skormu.</p>
          <div className="register-hero-img">
            <img
              src="/landingpage-hero.svg"
              alt="Students collaborating"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="register-right">
        <div className="register-form-card">
          <Link to="/" className="register-mobile-logo"><img src="/eduzet-brand-light.svg" alt="Eduzet" className="h-8" /></Link>

          <div className="register-form-header">
            <h2>Masuk</h2>
            <p>Masuk ke akun Eduzet-mu.</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <span className="material-symbols-outlined input-icon">mail</span>
                <input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
