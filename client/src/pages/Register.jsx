import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
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
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      toast.success('Akun berhasil dibuat!');
      navigate(res?.data?.user?.role === 'admin' ? '/admin' : '/dashboard');
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
      toast.success('Berhasil daftar dengan Google!');
      navigate(res?.data?.user?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google Login Failed');
    toast.error('Gagal daftar dengan Google');
  };

  return (
    <div className="register-page">
      {/* Desktop Left Panel - hidden on mobile */}
      <div className="register-left">
        <div className="auth-side-nav">
          <Link to="/" className="register-logo"><img src="/stubiabrandicon.png" alt="Stubia" /></Link>
        </div>
        <div className="register-left-content">
          <h1>Persiapkan UTBK bersama <span>Stubia</span></h1>
          <p>Bergabung dengan 50.000+ siswa di seluruh Indonesia dan mulai persiapan UTBK-mu dengan soal latihan, tryout simulasi, dan pembahasan lengkap.</p>
          <div className="register-hero-img">
            <img
              src="/landingpage-hero.webp"
              alt="Students collaborating"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Form (always visible) */}
      <div className="register-right">
        <div className="register-form-card">
          {/* Mobile logo */}
          <Link to="/" className="register-mobile-logo"><img src="/stubiabrandicon.png" alt="Stubia" className="h-8" /></Link>

          <div className="register-form-header">
            <h2>Buat Akun</h2>
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

            <div className="divider-or">
              <div className="divider-line"></div>
              <span>atau daftar dengan</span>
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
            Sudah punya akun? <Link to="/login">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
