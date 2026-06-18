import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUpgradeClick = () => {
    if (user) {
      navigate('/dashboard#pricing-plans');
    } else {
      navigate('/login?redirect=/dashboard%23pricing-plans');
    }
  };

  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <img src="/stubiabrandicon.png" alt="Stubia" className="h-10 sm:h-14" />
          </div>
          <div className="landing-nav-actions">
            <button className="btn-login" onClick={() => navigate('/login')}>Login</button>
            <button className="btn-join" onClick={() => navigate('/register')}>Daftar Gratis</button>
          </div>
        </div>
      </nav>

      <main style={{ paddingTop: 80 }}>
        {/* Hero */}
        <section className="landing-hero">

          <div className="hero-content">
            <div className="hero-text">
              <h1>Persiapkan <span className="text-blue">UTBK</span> dengan Latihan Soal Terbaik</h1>
              <p>Raih skor UTBK impianmu dengan ribuan soal latihan, tryout simulasi, dan pembahasan lengkap dari mentor berpengalaman.</p>
              <div className="hero-buttons">
                <button className="btn-primary-lg" onClick={() => navigate('/register')}>Mulai Belajar</button>
                <button className="btn-outline-lg" onClick={() => navigate('/login')}>Lihat Program</button>
              </div>
            </div>
            <div className="hero-image">
              <img src="/landingpage-hero.webp" alt="Students collaborating" />
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="landing-trust">
          <p className="trust-label">DIPERCAYA OLEH RIBUAN SISWA DI SELURUH INDONESIA</p>
          <div className="trust-logos">
            <div>UI</div><div>ITB</div><div>UGM</div><div>UNPAD</div><div>ITS</div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="landing-features">
          <div className="section-inner">
            <div className="section-header">
              <h2>Kenapa Pilih Stubia?</h2>
              <p>Platform belajar UTBK paling efektif dengan fitur lengkap untuk memaksimalkan persiapanmu.</p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon icon-blue">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <h3>Belajar Kapan Saja</h3>
                <p>Akses ribuan soal dan materi kapan saja, di mana saja. Belajar sesuai tempo dan jadwalmu sendiri.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon icon-teal">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <h3>Mentor Berpengalaman</h3>
                <p>Belajar langsung dari tutor alumni PTN top yang paham pola soal UTBK dan strategi menjawab.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon icon-orange">
                  <span className="material-symbols-outlined">verified</span>
                </div>
                <h3>Tryout Simulasi Realistis</h3>
                <p>Simulasi UTBK dengan timer, skor IRT, dan analisis performa detail untuk evaluasi kesiapanmu.</p>
              </div>
            </div>
          </div>
        </section>


        {/* Pricing Plans */}
        <section id="pricing" className="landing-pricing">
          <div className="section-inner">
            <div className="section-header">
              <h2>Pilih Paket Belajarmu</h2>
              <p>Mulai gratis, tingkatkan kapan saja. Semua paket bisa diupgrade atau downgrade sewaktu-waktu.</p>
            </div>
            <div className="pricing-grid">



              {/* PREMIUM */}
              <div className="pricing-card pricing-card-featured">
                <div className="pricing-badge">Paling Populer</div>
                <div className="pricing-card-header">
                  <h3 className="pricing-name pricing-name-blue">Premium</h3>
                  <p className="pricing-desc">Tingkatkan persiapan UTBK-mu</p>
                </div>
                <div className="pricing-price">
                  <span className="pricing-amount">Rp70.000</span>
                  <span className="pricing-period">/6 bulan</span>
                </div>
                <hr className="pricing-divider pricing-divider-blue" />
                <ul className="pricing-features">
                  <li>
                    <span className="material-symbols-outlined pricing-check check-blue">verified</span>
                    <span className="pricing-feat-bold">Akses penuh latihan soal UTBK</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined pricing-check check-blue">verified</span>
                    <span>Akses penuh tryout UTBK</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined pricing-check check-blue">verified</span>
                    <span>Pembahasan lengkap AI</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined pricing-check check-blue">verified</span>
                    <span>Analisis performa IRT</span>
                  </li>
                </ul>
                <button className="pricing-btn pricing-btn-primary" onClick={handleUpgradeClick}>
                  Upgrade Sekarang
                </button>
              </div>

              {/* PREMIUM UM */}
              <div className="pricing-card">
                <div className="pricing-badge" style={{ backgroundColor: '#0d9488' }}>Paket Mandiri</div>
                <div className="pricing-card-header">
                  <h3 className="pricing-name" style={{ color: '#0d9488' }}>Premium UM</h3>
                  <p className="pricing-desc">Fokus persiapan Ujian Mandiri</p>
                </div>
                <div className="pricing-price">
                  <span className="pricing-amount">Rp15.000</span>
                  <span className="pricing-period">/2 bulan</span>
                </div>
                <hr className="pricing-divider" style={{ borderColor: 'rgba(13, 148, 136, 0.2)' }} />
                <ul className="pricing-features">
                  <li>
                    <span className="material-symbols-outlined pricing-check" style={{ color: '#0d9488' }}>verified</span>
                    <span className="pricing-feat-bold">Akses semua latihan mandiri</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined pricing-check" style={{ color: '#0d9488' }}>verified</span>
                    <span>Akses semua tryout mandiri</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined pricing-check" style={{ color: '#0d9488' }}>verified</span>
                    <span>Pembahasan lengkap & analisis</span>
                  </li>
                </ul>
                <button className="pricing-btn" style={{ backgroundColor: '#0d9488', color: '#fff' }} onClick={handleUpgradeClick}>
                  Upgrade Sekarang
                </button>
              </div>

              {/* SULTAN */}
              <div className="pricing-card pricing-card-dark">
                <div className="pricing-card-header">
                  <div className="pricing-sultan-title">
                    <span className="material-symbols-outlined pricing-star">star</span>
                    <h3 className="pricing-name pricing-name-sultan">Sultan</h3>
                  </div>
                  <p className="pricing-desc pricing-desc-muted">Persiapan UTBK terlengkap</p>
                </div>
                <div className="pricing-price">
                  <span className="pricing-amount pricing-amount-light">Rp60.000</span>
                  <span className="pricing-period pricing-period-muted">/tahun</span>
                </div>
                <hr className="pricing-divider pricing-divider-dark" />
                <ul className="pricing-features">
                  <li>
                    <span className="material-symbols-outlined pricing-check check-gold">diamond</span>
                    <span className="pricing-feat-light">Akses semua latihan soal</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined pricing-check check-gold">diamond</span>
                    <span className="pricing-feat-light">Akses semua tryout</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined pricing-check check-gold">diamond</span>
                    <span className="pricing-feat-light">Akses pembahasan soal sepuasnya</span>
                  </li>
                </ul>
                <button className="pricing-btn pricing-btn-sultan" onClick={handleUpgradeClick}>
                  Go Sultan
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="landing-testimonials">
          <div className="section-inner">
            <h2 className="text-center">Cerita Sukses</h2>
            <div className="testimonials-grid">
              <TestimonialCard
                text="Stubia benar-benar mengubah cara belajar saya. Soal-soalnya mirip banget sama UTBK asli, dan pembahasannya lengkap. Alhamdulillah lolos FKUI!"
                avatar="https://ui-avatars.com/api/?name=Muhammad+Rayyan+Daffa&background=0050cb&color=fff"
                name="Muhammad Rayyan Daffa" role="Mahasiswa FK UI"
              />
              <TestimonialCard
                text="Tryout simulasinya realistis banget. Timer, scoring IRT, dan analisis performanya bikin saya tahu kelemahan di mana. Sangat recommended!"
                avatar="https://ui-avatars.com/api/?name=Anwar+Rizal+Fadhillah&background=006688&color=fff"
                name="Anwar Rizal Fadhillah" role="Mahasiswa Teknik ITB"
              />
              <TestimonialCard
                text="Platform terbaik untuk persiapan UTBK. Fitur Tanya Stu dan riwayat bikin review soal jadi gampang. Worth it banget! Terima kasih Stubia sudah bantu aku sampai lolos ke jurusan impian!"
                avatar="https://ui-avatars.com/api/?name=Alya+Nurul+Khairunnisa&background=a33200&color=fff"
                name="Alya Nurul Khairunnisa" role="Mahasiswa FEB UGM"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="landing-cta-section">
          <div className="landing-cta">
            <h2>Siap raih PTN impianmu?</h2>
            <p>Bergabung dengan 50.000+ siswa di seluruh Indonesia dan mulai persiapan UTBK-mu sekarang.</p>
            <button className="btn-cta" onClick={() => navigate('/register')}>Daftar Stubia Gratis</button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="landing-logo">
              <img src="/stubiabrandicon.png" alt="Stubia" className="h-10 sm:h-14" />
            </div>
            <p>Platform persiapan UTBK terbaik untuk raih PTN impianmu.</p>
          </div>
          <div className="footer-links">
            <button onClick={() => navigate('/terms-and-conditions')} className="cursor-pointer hover:text-[#0050cb] transition">Syarat & Ketentuan</button>
            <button onClick={() => navigate('/privacy-policy')} className="cursor-pointer hover:text-[#0050cb] transition">Kebijakan Privasi</button>
            <button onClick={() => navigate('/contact-us')} className="cursor-pointer hover:text-[#0050cb] transition">Hubungi Kami</button>
            <button onClick={() => navigate('/careers')} className="cursor-pointer hover:text-[#0050cb] transition">Karir</button>
          </div>
          <div className="footer-copy">© 2026 Stubia. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};


const TestimonialCard = ({ text, avatar, name, role }) => (
  <div className="testimonial-card">
    <span className="material-symbols-outlined quote-icon">format_quote</span>
    <p className="testimonial-text">{text}</p>
    <div className="testimonial-author">
      <img src={avatar} alt={name} />
      <div>
        <p className="author-name">{name}</p>
        <p className="author-role">{role}</p>
      </div>
    </div>
  </div>
);

export default LandingPage;
