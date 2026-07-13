import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SeoHead from "../components/SeoHead";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isStaff, loading } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);

  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      if (isStaff) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, isStaff, loading, navigate]);

  const handleUpgradeClick = () => {
    if (user) {
      navigate("/dashboard#pricing-plans");
    } else {
      navigate("/login?redirect=/dashboard%23pricing-plans");
    }
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqData = [
    {
      q: "Apa itu stubia.id?",
      a: "Stubia.id adalah platform edutech interaktif khusus Indonesia yang berfokus pada simulasi try out UTBK-SNBT dan latihan soal Ujian Mandiri PTN (seperti SIMAK UI dan UTUL UGM). Berbeda dengan platform global seperti Stuvia yang berfokus pada transaksi jual beli catatan pelajaran atau dokumen ringkasan materi, Stubia.id menyediakan ekosistem belajar aktif dengan ribuan bank soal terupdate, sistem CBT mirip ujian asli, penilaian berbasis IRT modern, dan analisis kelemahan siswa secara detail."
    },
    {
      q: "Apa itu Try Out stubia.id?",
      a: "Try Out Stubia.id adalah program simulasi ujian masuk Perguruan Tinggi Negeri (PTN) yang dirancang menyerupai format UTBK-SNBT terbaru. Simulasi ini menguji subtes lengkap, mulai dari Tes Potensi Skolastik (TPS), Penalaran Matematika, hingga Literasi dalam Bahasa Indonesia dan Bahasa Inggris, untuk mengukur kesiapan riil kamu menghadapi seleksi PTN."
    },
    {
      q: "Apakah Try Out stubia.id gratis?",
      a: "Ya! Stubia.id menyediakan program Try Out Gratis (Free CBT) secara berkala agar seluruh pejuang PTN di Indonesia mendapatkan kesempatan belajar yang setara. Kamu hanya perlu melakukan pendaftaran akun gratis di platform kami untuk mulai mencoba latihan soal pertama kamu."
    },
    {
      q: "Apa perbedaan Try Out Gratis dan Try Out Premium?",
      a: "Try Out Gratis memberikan akses terbatas pada simulasi dasar secara berkala. Sedangkan Try Out Premium di Stubia.id membuka akses penuh ke paket soal prediksi standar nasional, pembahasan interaktif berbasis AI yang siap 24/7, analisis titik lemah per subtes, rasionalisasi kelulusan PTN, serta sistem pemeringkatan (ranking) nasional secara real-time."
    },
    {
      q: "Apa itu Kuota Premium?",
      a: "Kuota Premium adalah token akses digital di akun Stubia.id kamu yang digunakan untuk membuka bundel Try Out Premium, pembahasan soal tingkat lanjut, dan fitur analisis nilai kelulusan PTN. Kuota ini dapat diisi ulang dengan membeli paket belajar terjangkau."
    },
    {
      q: "Berapa harga Try Out Premium stubia.id?",
      a: "Harga paket belajar dan kuota Try Out Premium di Stubia.id sangat ramah di kantong siswa, mulai dari puluhan ribu rupiah. Kami berkomitmen memberikan fasilitas belajar bermutu tinggi dengan harga terjangkau tanpa sistem berlangganan yang mengikat."
    },
    {
      q: "Dimana kamu bisa mengerjakan atau mengakses Try Out stubia.id?",
      a: "Kamu bisa mengakses seluruh fitur latihan soal dan simulasi Try Out Stubia.id secara fleksibel di mana saja dan kapan saja. Website kami sangat mobile-friendly dan ringan untuk diakses melalui smartphone, tablet, laptop, maupun komputer tanpa perlu menginstal aplikasi tambahan."
    },
    {
      q: "Apakah pengerjaan Try Out stubia.id bisa dicicil/dijeda per subtesnya?",
      a: "Bisa! Untuk memudahkan fleksibilitas waktu belajar kamu, sistem tryout CBT di Stubia.id dapat dijeda dan dicicil pengerjaannya per subtes. Kamu bisa menghentikan ujian sementara waktu dan melanjutkannya kembali kapan pun kamu siap tanpa takut kehilangan progress jawaban sebelumnya."
    },
    {
      q: "Kapan hasil Try Out stubia.id keluar?",
      a: "Hasil Try Out Stubia.id keluar langsung saat itu juga sesaat setelah kamu menekan tombol selesai ujian. Kamu akan langsung disajikan skor nilai berbasis IRT (Item Response Theory), kunci jawaban, statistik analisis performa, pembahasan lengkap, serta posisi ranking kamu secara nasional."
    }
  ];

  const homepageSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.stubia.id/#website',
        url: 'https://www.stubia.id',
        name: 'Stubia.id',
        description: 'Platform tryout UTBK-SNBT dan Ujian Mandiri PTN terlengkap di Indonesia.',
        inLanguage: 'id-ID',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://www.stubia.id/blog?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'WebPage',
        '@id': 'https://www.stubia.id/#webpage',
        url: 'https://www.stubia.id',
        name: 'Platform UTBK Terbaik - Latihan Soal dan Tryout Berkualitas',
        isPartOf: { '@id': 'https://www.stubia.id/#website' },
        description:
          'Stubia.id adalah platform tryout UTBK-SNBT dan Ujian Mandiri PTN terlengkap di Indonesia. Latihan soal UTBK, tryout ujian mandiri, dan simulasi tes untuk persiapan masuk PTN impianmu.',
        inLanguage: 'id-ID',
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://www.stubia.id/#faq',
        mainEntity: faqData.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a
          }
        }))
      }
    ],
  };

  return (
    <>
      <SeoHead
        title="Platform UTBK Terbaik"
        description="Stubia.id adalah platform tryout UTBK-SNBT dan Ujian Mandiri PTN terlengkap di Indonesia. Latihan soal UTBK, tryout ujian mandiri, dan simulasi tes untuk persiapan masuk PTN impianmu. Daftar gratis di Stubia.id sekarang!"
        canonical="/"
        ogType="website"
        schema={homepageSchema}
      />
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <img
              src="/stubiabrandicon.png"
              alt="Stubia"
              className="h-10 sm:h-14"
              width="865"
              height="288"
            />
          </div>
          <div className="landing-nav-actions">
            <button className="btn-login" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="btn-join" onClick={() => navigate("/register")}>
              Daftar Gratis
            </button>
          </div>
        </div>
      </nav>
 
      <main style={{ paddingTop: 80 }}>
        {/* Hero */}
        <section className="relative overflow-hidden pt-[120px] pb-16 md:pt-[160px] md:pb-24 px-4 md:px-6 max-w-[1280px] mx-auto flex flex-col items-center gap-12">
          <div className="w-full flex flex-col items-center text-center space-y-8 z-10">
            <div className="mb-2">
              <img 
                alt="stubia.id logo" 
                className="h-16 w-auto mx-auto" 
                src="/stubiabrandicon.png"
              />
            </div>
            <h1 className="text-[28px] md:text-[48px] leading-[36px] md:leading-[56px] font-bold md:font-extrabold text-[#121c2a] max-w-3xl mx-auto tracking-tight md:tracking-[-0.02em]">
              Raih PTN Impianmu dengan Berlatih di <span className="brand-title"><span className="brand-stu">stu</span><span className="brand-bia">bia</span><span className="brand-id">.id</span></span>
            </h1>
            <p className="text-[18px] leading-[28px] text-[#434654] max-w-2xl mx-auto">
              Latihan UTBK dan Ujian Mandiri mirip aslinya: CBT, penilaian IRT, materi dan pembahasan lengkap, ranking jurusan, dan ranking nasional. Akses di mana saja.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center w-full sm:w-auto">
              <button
                className="bg-[#0055D4] text-white px-8 py-4 rounded-lg font-semibold text-[14px] tracking-[0.05em] inline-flex items-center justify-center hover:opacity-90 transition-all shadow-sm w-full sm:w-auto"
                onClick={() => navigate("/register")}
              >
                Mulai Belajar
              </button>
              <button
                className="border border-[#0055D4] text-[#0055D4] bg-white px-8 py-4 rounded-lg font-semibold text-[14px] tracking-[0.05em] inline-flex items-center justify-center hover:bg-[#e6eeff] transition-all w-full sm:w-auto"
                onClick={() => navigate("/login")}
              >
                Lihat Program
              </button>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="landing-trust">
          <p className="trust-label">
            DIPERCAYA OLEH RIBUAN SISWA DI SELURUH INDONESIA
          </p>
          <div className="trust-logos">
            <div>UI</div>
            <div>ITB</div>
            <div>UGM</div>
            <div>UNPAD</div>
            <div>ITS</div>
          </div>
        </section>

        {/* Features — Bento Grid Style */}
        <section id="features" className="landing-features">
          <div className="section-inner">
            <div className="section-header">
              <h2>Kenapa Pilih Stubia?</h2>
              <p>
                Platform belajar UTBK paling lengkap dengan fitur-fitur unggulan
                untuk memaksimalkan persiapanmu masuk PTN impian.
              </p>
            </div>

            {/* Bento Grid */}
            <div className="bento-grid">
              {/* Row 1: Skor IRT — full width */}
              <div className="bento-card bento-wide">
                <div className="bento-text">
                  <div className="bento-badge badge-blue">
                    <span className="material-symbols-outlined">analytics</span>
                    Penilaian IRT
                  </div>
                  <h3>Skor IRT Seperti UTBK Asli</h3>
                  <p>
                    Penilaian menggunakan sistem Item Response Theory (IRT) yang
                    sudah disesuaikan dengan UTBK, sehingga hasil skor yang kamu
                    dapatkan sangat mirip ketika mengikuti UTBK sebenarnya.
                  </p>
                </div>
                <div className="bento-image">
                  <img src="/hasiltryout.webp" alt="Skor IRT UTBK Stubia" loading="lazy" />
                </div>
              </div>

              {/* Row 2: AI Bia + Ujian Mandiri — paired */}
              <div className="bento-card bento-tall">
                <div className="bento-text">
                  <div className="bento-badge badge-green">
                    <span className="material-symbols-outlined">smart_toy</span>
                    Tutor AI
                  </div>
                  <h3>Pembahasan Soal dengan AI Bia</h3>
                  <p>
                    Masih bingung setelah baca pembahasan? Diskusikan langsung
                    dengan Bia, tutor AI yang siap 24/7 membantu kamu memahami
                    setiap soal lebih mendalam.
                  </p>
                </div>
                <div className="bento-image">
                  <img src="/biapembahasan.webp" alt="Pembahasan AI Bia Stubia" loading="lazy" />
                </div>
              </div>

              <div className="bento-card bento-tall">
                <div className="bento-text">
                  <div className="bento-badge badge-indigo">
                    <span className="material-symbols-outlined">school</span>
                    Ujian Mandiri
                  </div>
                  <h3>Skor Ujian Mandiri PTN</h3>
                  <p>
                    Latihan khusus untuk SIMAK UI, UTUL UGM, dan ujian mandiri
                    PTN lainnya. Lengkap dengan sistem penilaian dan analisis
                    performa per subtes.
                  </p>
                </div>
                <div className="bento-image">
                  <img src="/hasilskormandiri.webp" alt="Skor Ujian Mandiri Stubia" loading="lazy" />
                </div>
              </div>

              {/* Row 3: Pembahasan Teks — full width */}
              <div className="bento-card bento-wide">
                <div className="bento-text">
                  <div className="bento-badge badge-orange">
                    <span className="material-symbols-outlined">menu_book</span>
                    Pembahasan
                  </div>
                  <h3>Pembahasan Lengkap dengan Teks</h3>
                  <p>
                    Setiap soal dilengkapi pembahasan komprehensif berbasis
                    teks dengan analisis pedagogis, sehingga kamu bisa memahami
                    dan mereview setiap konsep secara mendalam.
                  </p>
                </div>
                <div className="bento-image">
                  <img src="/pembahasanteks.webp" alt="Pembahasan Teks Lengkap Stubia" loading="lazy" />
                </div>
              </div>

              {/* Row 4: Belajar Kapan Saja + Tryout Simulasi — paired */}
              <div className="bento-card bento-half">
                <div className="bento-text">
                  <div className="bento-badge badge-teal">
                    <span className="material-symbols-outlined">schedule</span>
                    Fleksibel
                  </div>
                  <h3>Belajar Kapan Saja</h3>
                  <p>
                    Akses ribuan soal dan materi kapan saja, di mana saja melalui
                    smartphone, tablet, atau laptop. Belajar sesuai tempo dan
                    jadwalmu sendiri tanpa batasan waktu.
                  </p>
                </div>
                <div className="bento-icon-display">
                  <div className="bento-floating-icons">
                    <div className="floating-icon fi-1"><span className="material-symbols-outlined">phone_iphone</span></div>
                    <div className="floating-icon fi-2"><span className="material-symbols-outlined">laptop_mac</span></div>
                    <div className="floating-icon fi-3"><span className="material-symbols-outlined">tablet_mac</span></div>
                  </div>
                </div>
              </div>

              <div className="bento-card bento-half">
                <div className="bento-text">
                  <div className="bento-badge badge-red">
                    <span className="material-symbols-outlined">verified</span>
                    Simulasi CBT
                  </div>
                  <h3>Tryout Simulasi Real</h3>
                  <p>
                    Simulasi UTBK dengan timer, antarmuka CBT mirip asli, serta
                    sistem pemeringkatan nasional secara real-time. Evaluasi
                    kesiapanmu dengan pengalaman ujian yang autentik.
                  </p>
                </div>
                <div className="bento-icon-display">
                  <div className="bento-floating-icons">
                    <div className="floating-icon fi-4"><span className="material-symbols-outlined">timer</span></div>
                    <div className="floating-icon fi-5"><span className="material-symbols-outlined">leaderboard</span></div>
                    <div className="floating-icon fi-6"><span className="material-symbols-outlined">monitoring</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Plans */}
        <section id="pricing" className="landing-pricing">
          <div className="section-inner">
            <div className="section-header">
              <h2>Pilih Paket Belajarmu</h2>
              <p>
                Mulai gratis, tingkatkan kapan saja. Semua paket bisa diupgrade
                atau downgrade sewaktu-waktu.
              </p>
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
                    <span className="material-symbols-outlined pricing-check check-blue">
                      verified
                    </span>
                    <span className="pricing-feat-bold">
                      Akses penuh latihan soal UTBK
                    </span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined pricing-check check-blue">
                      verified
                    </span>
                    <span>Akses penuh tryout UTBK</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined pricing-check check-blue">
                      verified
                    </span>
                    <span>Pembahasan lengkap AI</span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined pricing-check check-blue">
                      verified
                    </span>
                    <span>Analisis performa IRT</span>
                  </li>
                </ul>
                <button
                  className="pricing-btn pricing-btn-primary"
                  onClick={handleUpgradeClick}
                >
                  Upgrade Sekarang
                </button>
              </div>

              {/* PREMIUM UM */}
              <div className="pricing-card">
                <div
                  className="pricing-badge"
                  style={{ backgroundColor: "#0d9488" }}
                >
                  Paket Mandiri
                </div>
                <div className="pricing-card-header">
                  <h3 className="pricing-name" style={{ color: "#0d9488" }}>
                    Premium UM
                  </h3>
                  <p className="pricing-desc">Fokus persiapan Ujian Mandiri</p>
                </div>
                <div className="pricing-price">
                  <span className="pricing-amount">Rp30.000</span>
                  <span className="pricing-period">/2 bulan</span>
                </div>
                <hr
                  className="pricing-divider"
                  style={{ borderColor: "rgba(13, 148, 136, 0.2)" }}
                />
                <ul className="pricing-features">
                  <li>
                    <span
                      className="material-symbols-outlined pricing-check"
                      style={{ color: "#0d9488" }}
                    >
                      verified
                    </span>
                    <span className="pricing-feat-bold">
                      Akses semua latihan mandiri
                    </span>
                  </li>
                  <li>
                    <span
                      className="material-symbols-outlined pricing-check"
                      style={{ color: "#0d9488" }}
                    >
                      verified
                    </span>
                    <span>Akses semua tryout mandiri</span>
                  </li>
                  <li>
                    <span
                      className="material-symbols-outlined pricing-check"
                      style={{ color: "#0d9488" }}
                    >
                      verified
                    </span>
                    <span>Pembahasan lengkap & analisis</span>
                  </li>
                </ul>
                <button
                  className="pricing-btn"
                  style={{ backgroundColor: "#0d9488", color: "#fff" }}
                  onClick={handleUpgradeClick}
                >
                  Upgrade Sekarang
                </button>
              </div>

              {/* SULTAN */}
              <div className="pricing-card pricing-card-dark">
                <div className="pricing-card-header">
                  <div className="pricing-sultan-title">
                    <span className="material-symbols-outlined pricing-star">
                      star
                    </span>
                    <h3 className="pricing-name pricing-name-sultan">Sultan</h3>
                  </div>
                  <p className="pricing-desc pricing-desc-muted">
                    Persiapan UTBK terlengkap
                  </p>
                </div>
                <div className="pricing-price">
                  <span className="pricing-amount pricing-amount-light">
                    Rp160.000
                  </span>
                  <span className="pricing-period pricing-period-muted">
                    /tahun
                  </span>
                </div>
                <hr className="pricing-divider pricing-divider-dark" />
                <ul className="pricing-features">
                  <li>
                    <span className="material-symbols-outlined pricing-check check-gold">
                      diamond
                    </span>
                    <span className="pricing-feat-light">
                      Akses semua latihan soal
                    </span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined pricing-check check-gold">
                      diamond
                    </span>
                    <span className="pricing-feat-light">
                      Akses semua tryout
                    </span>
                  </li>
                  <li>
                    <span className="material-symbols-outlined pricing-check check-gold">
                      diamond
                    </span>
                    <span className="pricing-feat-light">
                      Akses pembahasan soal sepuasnya
                    </span>
                  </li>
                </ul>
                <button
                  className="pricing-btn pricing-btn-sultan"
                  onClick={handleUpgradeClick}
                >
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
                text="aku waktu itu agak kesusahan karena ga tau jenis soal yg muncul kayak gimana, aku cari terus di berbagai platform. awalnya aku ga nemu Stubia kalo aku gak nanya user x, aku baru tau platform belajar ini di h-2 sebelum aku ujian sema upnvj, aku nyesel kenapa gak dari awal nanya sama org itu, aku langsung latsol dan pas ujian soal nya mirip banget! harganya juga affordable. ada pembahasan nya, latsol banyak banget bikin ketagihan, TO nya juga banyak, dan tampilannya fresh aku suka ga bikin pusing, apalagi belneg tuh bacaan nya banyak, pokoknya sangat recommended, NYESEL BARU TAU, oya dan aku LOLOS SEMA UPNVJ AAA SENENG BANGET, makasih banget stubia karena udah membantu anak mandiri yg kehilangan arah ini, RECOMMENDED GUYSS! MUST TRY!"
                avatar="/rennetestimoni.webp"
                name="Renne"
                role="D3 Akuntansi UPN VETERAN JAKARTA"
                logo="/PTN/upnvj.jpg"
              />
              <TestimonialCard
                text="ternyata soalnya lumayan banyak yang mirip, materi materinya juga, top dehh…."
                avatar="/firhantestimoni.webp"
                name="Firhan"
                role="S1 Informatika UPN VETERAN JAKARTA"
                logo="/PTN/upnvj.jpg"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="landing-cta-section">
          <div className="landing-cta">
            <h2>Siap raih PTN impianmu?</h2>
            <p>
              Bergabung dengan 50.000+ siswa di seluruh Indonesia dan mulai
              persiapan UTBK-mu sekarang.
            </p>
            <button className="btn-cta" onClick={() => navigate("/register")}>
              Daftar Stubia Gratis
            </button>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="landing-faq-section">
          <div className="faq-container">
            <h2>Paling sering ditanyakan (FAQ)</h2>
            <div className="faq-list">
              {faqData.map((faq, index) => (
                <div 
                  key={index} 
                  className={`faq-item ${activeFaq === index ? 'active' : ''}`}
                >
                  <button 
                    className="faq-question" 
                    onClick={() => toggleFaq(index)}
                  >
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined faq-icon">
                      expand_more
                    </span>
                  </button>
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="landing-logo">
              <img
                src="/stubiabrandicon.png"
                alt="Stubia"
                className="h-10 sm:h-14"
                width="865"
                height="288"
                loading="lazy"
              />
            </div>
            <p>Platform persiapan UTBK terbaik untuk raih PTN impianmu.</p>
          </div>
          <div className="footer-links">
            <button
              onClick={() => navigate("/blog")}
              className="cursor-pointer hover:text-[#0050cb] transition"
            >
              Blog
            </button>
            <button
              onClick={() => navigate("/terms-and-conditions")}
              className="cursor-pointer hover:text-[#0050cb] transition"
            >
              Syarat & Ketentuan
            </button>
            <button
              onClick={() => navigate("/privacy-policy")}
              className="cursor-pointer hover:text-[#0050cb] transition"
            >
              Kebijakan Privasi
            </button>
            <button
              onClick={() => navigate("/contact-us")}
              className="cursor-pointer hover:text-[#0050cb] transition"
            >
              Hubungi Kami
            </button>
            <button
              onClick={() => navigate("/careers")}
              className="cursor-pointer hover:text-[#0050cb] transition"
            >
              Karir
            </button>
            <button
              onClick={() => navigate("/fellowship")}
              className="cursor-pointer hover:text-[#0050cb] transition"
            >
              Fellowship
            </button>
          </div>
          <div className="footer-copy">© 2026 Stubia. All rights reserved.</div>
        </div>
      </footer>
    </div>
    </>
  );
};

const TestimonialCard = ({ text, avatar, name, role, logo }) => (
  <div className="testimonial-card">
    <span className="material-symbols-outlined quote-icon">format_quote</span>
    <p className="testimonial-text">{text}</p>
    <div className="testimonial-author">
      <img src={avatar} alt={name} className="testimonial-avatar" width="40" height="40" loading="lazy" />
      <div className="author-info">
        <p className="author-name">{name}</p>
        <p className="author-role">{role}</p>
      </div>
      {logo && (
        <img src={logo} alt="Logo PTN" className="author-logo" width="32" height="32" loading="lazy" />
      )}
    </div>
  </div>
);

export default LandingPage;
