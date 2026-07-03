import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { certificateService } from '../services/api';
import Footer from '../components/Footer';

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IconVerified = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 text-emerald-500 mx-auto" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const IconInvalid = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 text-red-500 mx-auto" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const IconBack = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

export default function CertificateVerify() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchCode, setSearchCode] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const verifyCert = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await certificateService.verify(id);
        setCert(res.data.data);
      } catch (err) {
        console.error(err);
        setError('Sertifikat tidak valid atau tidak ditemukan di sistem Stubia.id.');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      verifyCert();
    } else {
      setCert(null);
      setLoading(false);
      setError(null);
    }
  }, [id]);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      toast.error('Silakan masukkan kode sertifikat');
      return;
    }
    try {
      setSearchLoading(true);
      setError(null);
      const res = await certificateService.search(searchCode);
      if (res.data?.success && res.data.data) {
        toast.success('Sertifikat ditemukan!');
        navigate(`/careers/verify/${res.data.data.id}`);
      } else {
        setError('Sertifikat tidak ditemukan dengan kode tersebut.');
      }
    } catch (err) {
      console.error(err);
      setError('Kode sertifikat tidak ditemukan atau tidak valid.');
    } finally {
      setSearchLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#f4f6fd] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e2e5f0] h-[64px] flex items-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 w-auto" />
          </div>
          <button
            onClick={() => navigate('/careers')}
            className="flex items-center gap-2 text-[#434654] hover:text-[#0055D4] font-semibold text-[13px] px-3.5 py-2 rounded-lg hover:bg-[#eff4ff] transition-all"
          >
            <IconBack />
            Halaman Karir
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 pt-[100px] pb-16 px-4 md:px-8 flex items-center justify-center">
        {loading ? (
          <div className="max-w-md w-full bg-white border border-[#e2e5f0] rounded-3xl shadow-lg overflow-hidden">
            {/* Top Banner Accent */}
            <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />
            <div className="p-12 text-center space-y-4">
              <div className="w-10 h-10 border-[3px] border-[#0055D4] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-[13px] text-[#737685] font-semibold">Memverifikasi keaslian sertifikat...</p>
            </div>
          </div>
        ) : (!id && !cert) || error ? (
          <div className="max-w-md w-full bg-white border border-[#e2e5f0] rounded-3xl shadow-lg overflow-hidden">
            {/* Top Banner Accent */}
            <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <span className="material-symbols-outlined text-[48px] text-[#0055D4] block">verified_user</span>
                <h2 className="text-[20px] font-extrabold text-[#0f1729]">Verifikasi Sertifikat Stubia</h2>
                <p className="text-[13px] text-[#737685]">Masukkan kode sertifikat untuk memeriksa keabsahannya.</p>
              </div>

              {error && (
                <div className="text-[12.5px] text-red-600 font-medium leading-relaxed bg-red-50 border border-red-100 p-3.5 rounded-xl text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSearchSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#434654] mb-1.5 uppercase tracking-wide">Kode Sertifikat</label>
                  <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    placeholder="Contoh: STUBIA/VOL/2026/0001"
                    className="w-full px-4 py-3 rounded-xl bg-[#f8f9ff] border-2 border-[#e2e5f0] focus:border-[#0055D4] focus:bg-white focus:outline-none text-[13.5px] text-[#0f1729] transition-all font-mono"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="w-full py-3.5 rounded-xl bg-[#0055D4] hover:bg-[#003fa4] text-white font-bold text-[13px] transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {searchLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">search</span>
                      <span>Verifikasi Sertifikat</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : cert ? (
          <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-8 items-center lg:items-stretch justify-center">
            {/* Certificate (Left) */}
            <div 
              className="w-full lg:flex-1 max-w-[900px] overflow-x-auto rounded-3xl shadow-lg border border-[#e2e5f0] bg-white p-2 flex justify-start lg:justify-center items-center"
              style={{ containerType: 'inline-size' }}
            >
              <div
                style={{
                  width: '100%',
                  minWidth: '600px',
                  aspectRatio: '1.414 / 1',
                  background: 'linear-gradient(145deg, #FFFEF7 0%, #FFF9E6 50%, #FFFEF7 100%)',
                  border: '1.1cqw double #B8860B',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '4.8cqw 5.3cqw 4cqw',
                  boxSizing: 'border-box',
                  fontFamily: "'Inter', sans-serif",
                  color: '#1A1A2E',
                  userSelect: 'none',
                  flexShrink: 0,
                }}
              >
                {/* Watermark logo */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.04, pointerEvents: 'none', zIndex: 0, width: '31cqw' }}>
                  <img src="/stubiabrandicon.png" alt="" style={{ width: '100%', height: 'auto' }} />
                </div>
                {/* Corner ornaments */}
                <div style={{ position: 'absolute', top: '1.33cqw', left: '1.33cqw', width: '5.5cqw', height: '5.5cqw', borderTop: '0.27cqw solid #B8860B', borderLeft: '0.27cqw solid #B8860B' }} />
                <div style={{ position: 'absolute', top: '1.33cqw', right: '1.33cqw', width: '5.5cqw', height: '5.5cqw', borderTop: '0.27cqw solid #B8860B', borderRight: '0.27cqw solid #B8860B' }} />
                <div style={{ position: 'absolute', bottom: '1.33cqw', left: '1.33cqw', width: '5.5cqw', height: '5.5cqw', borderBottom: '0.27cqw solid #B8860B', borderLeft: '0.27cqw solid #B8860B' }} />
                <div style={{ position: 'absolute', bottom: '1.33cqw', right: '1.33cqw', width: '5.5cqw', height: '5.5cqw', borderBottom: '0.27cqw solid #B8860B', borderRight: '0.27cqw solid #B8860B' }} />

                {/* Main content column */}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.55cqw' }}>
                    <img src="/stubiabrandicon.png" alt="Stubia" style={{ height: '3.7cqw', width: 'auto', objectFit: 'contain' }} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1cqw', fontWeight: 700, color: '#8A7340', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Nomor Sertifikat</div>
                      <div style={{ fontSize: '1.33cqw', fontWeight: 800, color: '#1E40AF', fontFamily: 'monospace', marginTop: '0.22cqw', letterSpacing: '0.05em' }}>
                        {cert.certificate_code}
                      </div>
                    </div>
                  </div>

                  {/* Gold divider */}
                  <div style={{ height: '0.11cqw', background: 'linear-gradient(90deg, transparent 0%, #B8860B 30%, #E8C96B 50%, #B8860B 70%, transparent 100%)', marginBottom: '2cqw' }} />

                  {/* Title */}
                  <div style={{ textAlign: 'center', marginBottom: '2cqw' }}>
                    <p style={{ fontSize: '1cqw', fontWeight: 700, color: '#8A7340', letterSpacing: '0.28em', textTransform: 'uppercase', margin: '0 0 0.77cqw' }}>✦ &nbsp; Stubia.id &nbsp; ✦</p>
                    <h2 style={{ fontSize: '3.1cqw', fontWeight: 900, color: '#1A2E5A', fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif", letterSpacing: '0.06em', margin: '0 0 0.44cqw', lineHeight: 1.15 }}>
                      SERTIFIKAT PENGHARGAAN
                    </h2>
                    <p style={{ fontSize: '1.1cqw', fontWeight: 600, color: '#8A7340', letterSpacing: '0.22em', textTransform: 'uppercase', margin: '0.44cqw 0 1.1cqw' }}>
                      Certificate of Appreciation
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.88cqw' }}>
                      <div style={{ flex: 1, height: '0.11cqw', background: 'linear-gradient(90deg, transparent, #C9A84C)' }} />
                      <span style={{ fontSize: '1.55cqw', color: '#B8860B' }}>✦</span>
                      <div style={{ flex: 1, height: '0.11cqw', background: 'linear-gradient(90deg, #C9A84C, transparent)' }} />
                    </div>
                  </div>

                  {/* Recipient Block */}
                  <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.88cqw' }}>
                    <p style={{ fontSize: '1.27cqw', color: '#5A5A6E', margin: 0 }}>Dengan bangga diberikan kepada:</p>
                    <div>
                      <h1 style={{ fontSize: '3.77cqw', fontWeight: 900, color: '#1A2E5A', fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif", margin: '0.44cqw 0 1.77cqw', lineHeight: 1.3 }}>
                        {cert.recipient_name}
                      </h1>
                      <div style={{ width: '26.6cqw', height: '0.16cqw', background: 'linear-gradient(90deg, transparent, #B8860B, transparent)', margin: '0 auto 1.33cqw' }} />
                    </div>
                    <div style={{ margin: '0.44cqw 0' }}>
                      <h3 style={{ fontSize: '1.77cqw', fontWeight: 700, color: '#1A2E5A', margin: '0 0 0.44cqw', display: 'inline-block', whiteSpace: 'nowrap' }}>
                        {cert.program_type === 'internship' ? 'Internship' : cert.program_type === 'fellowship' ? 'Academic Fellow:' : 'Volunteer'} {cert.position}
                      </h3>
                      <div>
                        <p style={{ fontSize: '1.33cqw', color: '#8A7340', margin: 0, fontWeight: 500 }}>
                          Periode{' '}
                          <strong style={{ fontWeight: 700, color: '#8A7340', display: 'inline-block', whiteSpace: 'nowrap' }}>
                            {formatDate(cert.start_date)}
                          </strong>
                          {' '} - {' '}
                          <strong style={{ fontWeight: 700, color: '#8A7340', display: 'inline-block', whiteSpace: 'nowrap' }}>
                            {formatDate(cert.end_date)}
                          </strong>
                        </p>
                      </div>
                    </div>
                    <p style={{ fontSize: '1.38cqw', color: '#3A3A4E', maxWidth: '60cqw', margin: '0.44cqw auto 0', lineHeight: 1.7 }}>
                      Sebagai bentuk penghargaan atas dedikasi, komitmen, dan kontribusi berharga yang telah diberikan dalam menyukseskan program kerja serta pengembangan ekosistem Stubia.id.
                    </p>
                  </div>

                  {/* Footer row */}
                  <div>
                    <div style={{ height: '0.11cqw', background: 'linear-gradient(90deg, transparent 0%, #B8860B 30%, #E8C96B 50%, #B8860B 70%, transparent 100%)', margin: '1.55cqw 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>

                      {/* QR Code */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.1cqw' }}>
                        <div style={{ padding: '0.55cqw', border: '0.16cqw solid #C9A84C', borderRadius: '0.88cqw', background: '#fff' }}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`${window.location.origin}/careers/verify/${cert.id}`)}`}
                            alt="QR Verifikasi"
                            crossOrigin="anonymous"
                            style={{ width: '7.1cqw', height: '7.1cqw', display: 'block' }}
                          />
                        </div>
                        <div style={{ paddingBottom: '0.22cqw' }}>
                          <div style={{ fontSize: '0.88cqw', fontWeight: 700, color: '#8A7340', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.22cqw' }}>Scan untuk Verifikasi</div>
                          <div style={{ fontSize: '1cqw', fontWeight: 600, color: '#555', marginBottom: '0.11cqw' }}>Google Lens / QR Scanner</div>
                          <div style={{ fontSize: '0.83cqw', color: '#888', fontFamily: 'monospace' }}>stubia.id/careers/verify</div>
                        </div>
                      </div>

                      {/* Signature */}
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.05cqw', color: '#5A5A6E', marginBottom: '0.55cqw' }}>
                          Jakarta, {formatDate(cert.issue_date)}
                        </div>
                        <div style={{ height: '6.4cqw', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.44cqw' }}>
                          <img
                            src={cert.signature_url}
                            alt="Tanda Tangan"
                            crossOrigin="anonymous"
                            style={{ maxHeight: '100%', maxWidth: '14.4cqw', objectFit: 'contain' }}
                          />
                        </div>
                        <div style={{ width: '15.5cqw', height: '0.11cqw', background: '#888', marginBottom: '0.44cqw' }} />
                        <div style={{ fontSize: '1.22cqw', fontWeight: 700, color: '#1A1A2E' }}>{cert.signer_name}</div>
                        <div style={{ fontSize: '1.05cqw', color: '#5A5A6E', marginTop: '0.11cqw' }}>{cert.signer_role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Card (Right) */}
            <div className="w-full lg:max-w-md bg-white border border-[#e2e5f0] rounded-3xl shadow-lg overflow-hidden flex flex-col justify-between">
              <div>
                {/* Top Banner Accent */}
                <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />
                <div className="p-8 space-y-6">
                  <div className="text-center space-y-3">
                    <IconVerified />
                    <div>
                      <h2 className="text-[20px] font-extrabold text-[#0f1729]">Sertifikat Terverifikasi</h2>
                      <p className="text-[11.5px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full w-fit mx-auto font-bold uppercase tracking-wider mt-1.5">
                        OFFICIAL STUBIA.ID
                      </p>
                    </div>
                  </div>

                  {/* Certificate Details */}
                  <div className="border border-[#e2e5f0] rounded-2xl bg-[#f8f9ff] divide-y divide-[#e2e5f0]">
                    <div className="p-4">
                      <span className="text-[10px] font-bold text-[#9ba3bb] uppercase tracking-wider">Nama Penerima</span>
                      <p className="text-[14px] font-extrabold text-[#0f1729] mt-0.5">{cert.recipient_name}</p>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-[#9ba3bb] uppercase tracking-wider">Program</span>
                        <p className="text-[13px] font-bold text-[#0f1729] mt-0.5 capitalize">
                          {cert.program_type === 'internship' ? 'Magang (Internship)' : cert.program_type === 'fellowship' ? 'Academic Fellowship' : 'Relawan (Volunteer)'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#9ba3bb] uppercase tracking-wider">Posisi</span>
                        <p className="text-[13px] font-bold text-[#0f1729] mt-0.5">{cert.position}</p>
                      </div>
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] font-bold text-[#9ba3bb] uppercase tracking-wider">Periode Kontribusi</span>
                      <p className="text-[13px] font-bold text-[#434654] mt-0.5">
                        {formatDate(cert.start_date)} – {formatDate(cert.end_date)}
                      </p>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-[#9ba3bb] uppercase tracking-wider">Nomor Sertifikat</span>
                        <p className="text-[12px] font-extrabold text-[#0f1729] mt-0.5">{cert.certificate_code}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#9ba3bb] uppercase tracking-wider">Tanggal Terbit</span>
                        <p className="text-[12px] font-bold text-[#434654] mt-0.5">{formatDate(cert.issue_date)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Signer verification footer */}
                  <div className="text-center bg-[#eff4ff]/60 border border-[#eff4ff] p-4 rounded-2xl text-[12px] text-[#434654] leading-relaxed">
                    Ditandatangani secara elektronik oleh <strong className="text-[#0f1729]">{cert.signer_name}</strong> selaku <span className="italic text-[#737685]">{cert.signer_role}</span>.
                  </div>

                  <button
                    onClick={() => navigate('/careers')}
                    className="w-full py-3 rounded-xl bg-[#0055D4] text-white font-bold text-[13px] hover:bg-[#003fa4] transition-all shadow-md shadow-blue-100"
                  >
                    Lihat Info Lowongan Aktif
                  </button>
                </div>
              </div>
            </div>

          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
