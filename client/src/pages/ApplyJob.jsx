import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Footer from '../components/Footer';
import { careerService, uploadService } from '../services/api';
import toast from 'react-hot-toast';

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const IconGraduate = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 2.2 2.7 4 6 4s6-1.8 6-4v-5"/><line x1="22" y1="10" x2="22" y2="16"/>
  </svg>
);
const IconBriefcase = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
);
const IconDocs = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
  </svg>
);
const IconSend = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconTag = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IconList = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconGift = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
    <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);
const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
  </svg>
);
const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.8">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconLink = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconSpin = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
  </svg>
);

// ── Dept color helper ──────────────────────────────────────────────────────
const getDeptStyle = (dept) => {
  const d = (dept || '').toLowerCase();
  if (d.includes('engineering') || d.includes('tech') || d.includes('dev'))
    return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' };
  if (d.includes('design') || d.includes('creative'))
    return { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' };
  if (d.includes('marketing') || d.includes('sales'))
    return { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' };
  if (d.includes('content') || d.includes('curriculum') || d.includes('writer'))
    return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' };
  return { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' };
};

// ── Step config ────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: 'Pribadi',    short: 'Data Diri',      Icon: IconUser,      desc: 'Informasi dasar diri kamu' },
  { num: 2, label: 'Pendidikan', short: 'Edu',            Icon: IconGraduate,  desc: 'Riwayat pendidikan terakhir' },
  { num: 3, label: 'Pengalaman', short: 'Exp',            Icon: IconBriefcase, desc: 'Pengalaman & motivasi' },
  { num: 4, label: 'Dokumen',    short: 'Docs',           Icon: IconDocs,      desc: 'Upload berkas pendukung' },
  { num: 5, label: 'Submit',     short: 'Kirim',          Icon: IconSend,      desc: 'Tinjau & kirim lamaran' },
];

// ── Upload Row Component ───────────────────────────────────────────────────
function UploadRow({ id, label, sublabel, accept, value, loading, onChange, onClear, isImage }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
      value ? 'border-emerald-300 bg-emerald-50/40' : 'border-[#e2e5f0] bg-[#f8f9ff] hover:border-[#0055D4]/40 hover:bg-[#eff4ff]/60'
    }`}>
      {/* Icon / Thumbnail */}
      <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden ${
        value ? 'bg-emerald-100' : 'bg-white border border-[#e2e5f0]'
      }`}>
        {loading ? (
          <span className="text-[#0055D4]"><IconSpin /></span>
        ) : value && isImage ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : value ? (
          <span className="text-emerald-600"><IconFile /></span>
        ) : isImage ? (
          <span className="text-[#9ba3bb]"><IconCamera /></span>
        ) : (
          <span className="text-[#9ba3bb]"><IconFile /></span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-bold ${value ? 'text-emerald-700' : 'text-[#434654]'}`}>
          {value ? `${label} berhasil diupload` : label}
        </p>
        <p className="text-[11px] text-[#9ba3bb] mt-0.5 truncate">{sublabel}</p>
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#0055D4] underline mt-0.5 block truncate"
            onClick={e => e.stopPropagation()}
          >
            Lihat file yang diupload →
          </a>
        )}
      </div>

      {/* Action */}
      <div className="flex-shrink-0">
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#e2e5f0] text-[#ba1a1a] text-[11px] font-bold hover:bg-red-50 hover:border-red-200 transition-all"
          >
            Hapus
          </button>
        ) : (
          <label
            htmlFor={id}
            className="px-3 py-1.5 rounded-lg bg-[#0055D4] text-white text-[11px] font-bold cursor-pointer hover:bg-[#003fa4] transition-all flex items-center gap-1.5"
          >
            <IconUpload />
            Pilih File
          </label>
        )}
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ApplyJob() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);

  // Form States
  const [applyName, setApplyName] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyPhone, setApplyPhone] = useState('');
  const [applyAddress, setApplyAddress] = useState('');
  const [applyBirthPlaceDate, setApplyBirthPlaceDate] = useState('');
  const [applyEducation, setApplyEducation] = useState('S1');
  const [applyInstitutionName, setApplyInstitutionName] = useState('');
  const [applyExperienceDuration, setApplyExperienceDuration] = useState('Freshgraduate/Newbie');
  const [applyDesc, setApplyDesc] = useState('');
  const [applyMotivation, setApplyMotivation] = useState('');
  const [applyKtp, setApplyKtp] = useState('');
  const [applyCv, setApplyCv] = useState('');
  const [applyPhoto, setApplyPhoto] = useState('');
  const [applyPortfolio, setApplyPortfolio] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);

  // Upload states
  const [ktpUploading, setKtpUploading] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [submittingApply, setSubmittingApply] = useState(false);

  useEffect(() => {
    if (user) {
      setApplyName(user.name || '');
      setApplyEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const res = await careerService.getById(jobId);
        setJob(res.data.data);
      } catch (err) {
        console.error(err);
        toast.error('Gagal mengambil detail lowongan pekerjaan');
        navigate('/careers');
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchJobDetails();
  }, [jobId]);

  // Upload handlers
  const makeUploadHandler = (allowed, maxMB, uploadFn, setUrl, setUploading, label) => async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) { toast.error(`Format file tidak didukung untuk ${label}.`); return; }
    if (file.size > maxMB * 1024 * 1024) { toast.error(`Maksimal ukuran ${label} ${maxMB}MB.`); return; }
    setUploading(true);
    try {
      const res = await uploadFn(file);
      if (res.data?.success) { setUrl(res.data.data.url); toast.success(`${label} berhasil diupload`); }
    } catch { toast.error(`Gagal mengupload ${label}`); }
    finally { setUploading(false); }
  };

  const handleKtpChange = makeUploadHandler(
    ['.pdf', '.jpg', '.jpeg', '.png', '.webp'], 10,
    f => uploadService.uploadPublicDocument(f, 'ktps'),
    setApplyKtp, setKtpUploading, 'KTP'
  );
  const handleCvChange = makeUploadHandler(
    ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'], 10,
    f => uploadService.uploadPublicDocument(f, 'cvs'),
    setApplyCv, setCvUploading, 'CV'
  );
  const handlePhotoChange = makeUploadHandler(
    ['.jpg', '.jpeg', '.png', '.webp'], 5,
    f => uploadService.uploadPublicImage(f, 'photos'),
    setApplyPhoto, setPhotoUploading, 'Foto'
  );

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!termsChecked) { toast.error('Anda harus menyetujui syarat dan ketentuan!'); return; }
    const payload = {
      name: applyName.trim(), email: applyEmail.trim(), phone: applyPhone.trim(),
      address: applyAddress.trim(), birth_place_date: applyBirthPlaceDate.trim(),
      last_education: applyEducation.trim(), institution_name: applyInstitutionName.trim(),
      experience_duration: applyExperienceDuration, description: applyDesc.trim(),
      motivation: applyMotivation.trim(), ktp_url: applyKtp, cv_url: applyCv,
      photo_url: applyPhoto, portfolio_url: applyPortfolio.trim(),
      start_date: 'ASAP', ready_for_training: true
    };
    setSubmittingApply(true);
    try {
      await careerService.apply(jobId, payload);
      toast.success('Lamaran Anda berhasil dikirim! Terima kasih.');
      navigate('/careers');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal mengirim lamaran.');
    } finally { setSubmittingApply(false); }
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!applyName.trim()) { toast.error('Nama Lengkap wajib diisi!'); return false; }
      if (!applyEmail.trim()) { toast.error('Email wajib diisi!'); return false; }
      if (!applyPhone.trim()) { toast.error('Nomor WhatsApp wajib diisi!'); return false; }
      if (!applyAddress.trim()) { toast.error('Alamat Lengkap wajib diisi!'); return false; }
      if (!applyBirthPlaceDate.trim()) { toast.error('Tempat Tanggal Lahir wajib diisi!'); return false; }
    }
    if (step === 2) {
      if (!applyEducation.trim()) { toast.error('Pendidikan Terakhir wajib diisi!'); return false; }
      if (!applyInstitutionName.trim()) { toast.error('Nama Institusi / Sekolah wajib diisi!'); return false; }
    }
    if (step === 3) {
      if (!applyExperienceDuration.trim()) { toast.error('Lama Pengalaman wajib dipilih!'); return false; }
      if (!applyDesc.trim()) { toast.error('Deskripsi Pengalaman wajib diisi!'); return false; }
      if (!applyMotivation.trim()) { toast.error('Motivasi wajib diisi!'); return false; }
    }
    if (step === 4) {
      if (!applyKtp) { toast.error('Dokumen KTP wajib diunggah!'); return false; }
      if (!applyCv) { toast.error('Dokumen CV wajib diunggah!'); return false; }
      if (!applyPhoto) { toast.error('Foto wajib diunggah!'); return false; }
    }
    return true;
  };

  const nextStep = () => { if (validateStep(activeStep)) setActiveStep(p => Math.min(p + 1, 5)); };
  const prevStep = () => setActiveStep(p => Math.max(p - 1, 1));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6fd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-[#0055D4] border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-[#737685] font-medium">Memuat informasi lowongan...</p>
        </div>
      </div>
    );
  }

  const deptStyle = getDeptStyle(job?.department);
  const currentStep = STEPS[activeStep - 1];
  const StepIcon = currentStep.Icon;

  // Parse bullet list from newline-separated string
  const parseBullets = (str) => (str || '').split('\n').map(s => s.replace(/^[-•]\s*/, '').trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f4f6fd] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#e2e5f0] h-[64px] flex items-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center px-4 md:px-8 max-w-[1280px] mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="cursor-pointer" onClick={() => navigate('/careers')}>
              <img src="/stubiabrandicon.png" alt="Stubia" className="h-8 w-auto" />
            </div>
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#9ba3bb]">
              <span className="text-[#9ba3bb]"><IconChevronRight /></span>
              <span
                className="cursor-pointer hover:text-[#0055D4] transition-colors font-medium"
                onClick={() => navigate('/careers')}
              >
                Karir
              </span>
              {job?.title && (
                <>
                  <span className="text-[#9ba3bb]"><IconChevronRight /></span>
                  <span className="text-[#434654] font-semibold truncate max-w-[180px]">{job.title}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/careers')}
            className="flex items-center gap-2 text-[#434654] hover:text-[#0055D4] font-semibold text-[13px] px-3 py-2 rounded-lg hover:bg-[#eff4ff] transition-all"
          >
            <IconArrowLeft />
            <span className="hidden sm:block">Kembali ke Karir</span>
          </button>
        </div>
      </nav>

      {/* ── Main Layout ── */}
      <main className="flex-1 pt-[80px] pb-16 px-4 md:px-6 max-w-[1280px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start mt-6">

          {/* ── LEFT: Job Detail Card ── on mobile shown AFTER form */}
          <div className="lg:col-span-5 space-y-4 order-2 lg:order-1">

            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-[#e2e5f0] overflow-hidden shadow-sm">
              {/* Accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-[#0055D4] via-[#4d8ef5] to-[#0055D4]" />

              <div className="p-6">
                {/* Type + Dept Badge */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${deptStyle.bg} ${deptStyle.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${deptStyle.dot}`} />
                    {job?.department}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#f3f0ff] text-[#6d28d9]">
                    <IconTag />
                    {job?.type}
                  </span>
                </div>

                <h1 className="text-[26px] font-extrabold text-[#0f1729] tracking-tight leading-[1.2] mb-3">
                  {job?.title}
                </h1>

                {/* Meta chips */}
                {job?.location && (
                  <div className="flex items-center gap-1.5 text-[12px] text-[#737685] font-medium mb-4">
                    <IconMapPin />
                    <span>{job.location}</span>
                  </div>
                )}

                {job?.description && (
                  <p className="text-[13.5px] text-[#4b5573] leading-[22px]">
                    {job.description}
                  </p>
                )}
              </div>
            </div>

            {/* Responsibilities */}
            {job?.responsibilities && (
              <div className="bg-white rounded-2xl border border-[#e2e5f0] p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#0f1729] uppercase tracking-wider mb-4">
                  <span className="w-6 h-6 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#0055D4]">
                    <IconList />
                  </span>
                  Tugas & Tanggung Jawab
                </h3>
                <ul className="space-y-2.5">
                  {parseBullets(job.responsibilities).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[13px] text-[#4b5573] leading-[20px]">
                      <span className="w-5 h-5 rounded-full bg-[#0055D4] text-white text-[10px] font-bold flex-shrink-0 flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {job?.requirements && (
              <div className="bg-white rounded-2xl border border-[#e2e5f0] p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#0f1729] uppercase tracking-wider mb-4">
                  <span className="w-6 h-6 rounded-lg bg-[#fef3f2] flex items-center justify-center text-[#b54708]">
                    <IconStar />
                  </span>
                  Kualifikasi
                </h3>
                <ul className="space-y-2.5">
                  {parseBullets(job.requirements).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-[13px] text-[#4b5573] leading-[20px]">
                      <span className="text-[#0055D4] mt-0.5 flex-shrink-0"><IconCheck /></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job?.benefits && (
              <div className="bg-white rounded-2xl border border-[#e2e5f0] p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-[13px] font-bold text-[#0f1729] uppercase tracking-wider mb-4">
                  <span className="w-6 h-6 rounded-lg bg-[#ecfdf5] flex items-center justify-center text-[#059669]">
                    <IconGift />
                  </span>
                  Benefit & Fasilitas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {parseBullets(job.benefits).map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ecfdf5] text-[#059669] text-[12px] font-semibold border border-[#a7f3d0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Application Form — shown FIRST on mobile ── */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-[#e2e5f0] shadow-sm overflow-hidden">

              {/* Form top accent */}
              <div className="bg-gradient-to-r from-[#0055D4] to-[#2563eb] px-6 py-5">
                <h2 className="text-white text-[20px] font-bold">Formulir Lamaran</h2>
                <p className="text-blue-200 text-[13px] mt-0.5">Isi setiap tahap dengan teliti dan jujur.</p>
              </div>

              {/* ── Stepper ── */}
              <div className="px-3 sm:px-6 pt-5 pb-4 border-b border-[#f0f2f9]">
                <div className="flex items-center">
                  {STEPS.map((s, idx) => {
                    const done = activeStep > s.num;
                    const active = activeStep === s.num;
                    const Icon = s.Icon;
                    return (
                      <div key={s.num} className="flex items-center flex-1 last:flex-none">
                        {/* Circle */}
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                            done ? 'bg-[#0055D4] text-white shadow-md shadow-blue-200'
                            : active ? 'bg-[#0055D4] text-white ring-4 ring-[#0055D4]/20 shadow-md shadow-blue-200'
                            : 'bg-[#f0f2f9] text-[#9ba3bb]'
                          }`}>
                            {done ? <IconCheck /> : <Icon />}
                          </div>
                          <span className={`text-[9px] sm:text-[10px] font-bold hidden xs:block sm:block leading-none ${
                            active ? 'text-[#0055D4]' : done ? 'text-[#0055D4]/70' : 'text-[#9ba3bb]'
                          }`}>
                            {s.label}
                          </span>
                        </div>
                        {/* Connector line */}
                        {idx < STEPS.length - 1 && (
                          <div className={`flex-1 h-[2px] mx-0.5 sm:mx-2 transition-all duration-500 rounded-full ${
                            activeStep > s.num ? 'bg-[#0055D4]' : 'bg-[#e2e5f0]'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Step Header ── */}
              <div className="px-6 pt-5 pb-3 flex items-center gap-3 border-b border-[#f0f2f9]">
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#0055D4] flex-shrink-0">
                  <StepIcon />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#9ba3bb] uppercase tracking-wider">
                    Langkah {activeStep} dari 5
                  </p>
                  <h3 className="text-[16px] font-bold text-[#0f1729] leading-tight">{currentStep.desc}</h3>
                </div>
              </div>

              {/* ── Form Body ── */}
              <form onSubmit={handleApplySubmit} className="p-6 space-y-5">

                {/* STEP 1 */}
                {activeStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[12px] font-bold text-[#434654] mb-1.5 uppercase tracking-wide">Nama Lengkap *</label>
                      <input
                        type="text" value={applyName} onChange={e => setApplyName(e.target.value)}
                        placeholder="Masukkan nama lengkap sesuai KTP"
                        className="w-full px-4 py-3 rounded-xl bg-[#f8f9ff] border-2 border-[#e2e5f0] focus:border-[#0055D4] focus:bg-white focus:outline-none text-[14px] text-[#0f1729] transition-all"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-bold text-[#434654] mb-1.5 uppercase tracking-wide">Email *</label>
                        <input
                          type="email" value={applyEmail} onChange={e => setApplyEmail(e.target.value)}
                          placeholder="contoh@email.com"
                          className="w-full px-4 py-3 rounded-xl bg-[#f8f9ff] border-2 border-[#e2e5f0] focus:border-[#0055D4] focus:bg-white focus:outline-none text-[14px] text-[#0f1729] transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-[#434654] mb-1.5 uppercase tracking-wide">Nomor WhatsApp *</label>
                        <input
                          type="tel" value={applyPhone} onChange={e => setApplyPhone(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className="w-full px-4 py-3 rounded-xl bg-[#f8f9ff] border-2 border-[#e2e5f0] focus:border-[#0055D4] focus:bg-white focus:outline-none text-[14px] text-[#0f1729] transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#434654] mb-1.5 uppercase tracking-wide">Tempat, Tanggal Lahir *</label>
                      <input
                        type="text" value={applyBirthPlaceDate} onChange={e => setApplyBirthPlaceDate(e.target.value)}
                        placeholder="Contoh: Depok, 12 November 2000"
                        className="w-full px-4 py-3 rounded-xl bg-[#f8f9ff] border-2 border-[#e2e5f0] focus:border-[#0055D4] focus:bg-white focus:outline-none text-[14px] text-[#0f1729] transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#434654] mb-1.5 uppercase tracking-wide">Alamat Domisili Lengkap *</label>
                      <textarea
                        value={applyAddress} onChange={e => setApplyAddress(e.target.value)}
                        placeholder="Jl. Contoh No. 1, Kel. Contoh, Kec. Contoh, Kota/Kab. Contoh, Provinsi"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-[#f8f9ff] border-2 border-[#e2e5f0] focus:border-[#0055D4] focus:bg-white focus:outline-none text-[13.5px] text-[#0f1729] resize-none transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {activeStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[12px] font-bold text-[#434654] mb-1.5 uppercase tracking-wide">Pendidikan Terakhir *</label>
                      <select
                        value={applyEducation} onChange={e => setApplyEducation(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-[#f8f9ff] border-2 border-[#e2e5f0] focus:border-[#0055D4] focus:bg-white focus:outline-none text-[14px] text-[#0f1729] transition-all"
                        required
                      >
                        <option value="SMA/SMK">SMA / SMK</option>
                        <option value="D3">D3 (Diploma)</option>
                        <option value="S1">S1 (Sarjana)</option>
                        <option value="S2">S2 (Magister)</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#434654] mb-1.5 uppercase tracking-wide">Nama Universitas / Sekolah *</label>
                      <input
                        type="text" value={applyInstitutionName} onChange={e => setApplyInstitutionName(e.target.value)}
                        placeholder="Contoh: Universitas Indonesia"
                        className="w-full px-4 py-3 rounded-xl bg-[#f8f9ff] border-2 border-[#e2e5f0] focus:border-[#0055D4] focus:bg-white focus:outline-none text-[14px] text-[#0f1729] transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {activeStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[12px] font-bold text-[#434654] mb-1.5 uppercase tracking-wide">Lama Pengalaman di Bidang Ini *</label>
                      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                        {[
                          { val: 'Freshgraduate/Newbie', label: '🎓 Fresh Graduate / Newbie' },
                          { val: '1 tahun-5 tahun', label: '💼 1 – 5 Tahun Pengalaman' },
                        ].map(({ val, label: optLabel }) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setApplyExperienceDuration(val)}
                            className={`px-4 py-3 rounded-xl border-2 text-[13px] font-semibold transition-all text-left leading-snug ${
                              applyExperienceDuration === val
                                ? 'border-[#0055D4] bg-[#eff4ff] text-[#0055D4]'
                                : 'border-[#e2e5f0] bg-[#f8f9ff] text-[#737685] hover:border-[#0055D4]/40'
                            }`}
                          >
                            {optLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#434654] mb-1.5 uppercase tracking-wide">Ceritakan Pengalamanmu *</label>
                      <textarea
                        value={applyDesc} onChange={e => setApplyDesc(e.target.value)}
                        placeholder="Gambarkan riwayat pengalaman kerja, kepanitiaan, proyek, atau keahlian relevan yang kamu miliki..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-[#f8f9ff] border-2 border-[#e2e5f0] focus:border-[#0055D4] focus:bg-white focus:outline-none text-[13.5px] text-[#0f1729] resize-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#434654] mb-1.5 uppercase tracking-wide">Motivasi Melamar *</label>
                      <textarea
                        value={applyMotivation} onChange={e => setApplyMotivation(e.target.value)}
                        placeholder="Apa yang memotivasimu untuk bergabung bersama Stubia? Apa yang ingin kamu kontribusikan?"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-[#f8f9ff] border-2 border-[#e2e5f0] focus:border-[#0055D4] focus:bg-white focus:outline-none text-[13.5px] text-[#0f1729] resize-none transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4 */}
                {activeStep === 4 && (
                  <div className="space-y-3">
                    <p className="text-[12px] text-[#9ba3bb] font-medium pb-1">Pastikan semua dokumen valid dan terbaca dengan jelas.</p>

                    <UploadRow
                      id="ktp-upload"
                      label="KTP / Kartu Identitas"
                      sublabel={applyKtp ? 'File terupload ✓' : 'Format: PDF, JPG, PNG, WEBP · Maks 10MB'}
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      value={applyKtp}
                      loading={ktpUploading}
                      onChange={handleKtpChange}
                      onClear={() => setApplyKtp('')}
                      isImage={false}
                    />
                    <UploadRow
                      id="cv-upload"
                      label="CV / Resume"
                      sublabel={applyCv ? 'File terupload ✓' : 'Format: PDF, Word, JPG, PNG · Maks 10MB'}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      value={applyCv}
                      loading={cvUploading}
                      onChange={handleCvChange}
                      onClear={() => setApplyCv('')}
                      isImage={false}
                    />
                    <UploadRow
                      id="photo-upload"
                      label="Foto Bebas"
                      sublabel={applyPhoto ? 'Foto terupload ✓' : 'Format: JPG, PNG, WEBP · Maks 5MB'}
                      accept=".jpg,.jpeg,.png,.webp"
                      value={applyPhoto}
                      loading={photoUploading}
                      onChange={handlePhotoChange}
                      onClear={() => setApplyPhoto('')}
                      isImage={true}
                    />

                    <div className="pt-2">
                      <label className="flex items-center gap-2 text-[12px] font-bold text-[#434654] mb-1.5 uppercase tracking-wide">
                        <IconLink />
                        Link Portofolio <span className="text-[#9ba3bb] font-normal normal-case tracking-normal">(opsional)</span>
                      </label>
                      <input
                        type="url" value={applyPortfolio} onChange={e => setApplyPortfolio(e.target.value)}
                        placeholder="https://behance.net/username atau link Google Drive"
                        className="w-full px-4 py-3 rounded-xl bg-[#f8f9ff] border-2 border-[#e2e5f0] focus:border-[#0055D4] focus:bg-white focus:outline-none text-[14px] text-[#0f1729] transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 5 */}
                {activeStep === 5 && (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="rounded-2xl border border-[#e2e5f0] overflow-hidden">
                      <div className="bg-[#f8f9ff] px-5 py-3 border-b border-[#e2e5f0]">
                        <p className="text-[12px] font-bold text-[#434654] uppercase tracking-wider">Ringkasan Lamaran</p>
                      </div>
                      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {[
                          { label: 'Nama Lengkap', value: applyName },
                          { label: 'Email', value: applyEmail },
                          { label: 'WhatsApp', value: applyPhone },
                          { label: 'Tempat, Tgl Lahir', value: applyBirthPlaceDate },
                          { label: 'Pendidikan Terakhir', value: `${applyEducation} — ${applyInstitutionName}`, full: true },
                          { label: 'Alamat Domisili', value: applyAddress, full: true },
                          { label: 'Lama Pengalaman', value: applyExperienceDuration },
                        ].map(({ label, value, full }) => (
                          <div key={label} className={full ? 'sm:col-span-2' : ''}>
                            <p className="text-[10px] font-bold text-[#9ba3bb] uppercase tracking-wider mb-0.5">{label}</p>
                            <p className="text-[13px] font-semibold text-[#0f1729] leading-snug">{value || '—'}</p>
                          </div>
                        ))}
                        {/* Docs status */}
                        <div className="sm:col-span-2 pt-2 border-t border-[#f0f2f9]">
                          <p className="text-[10px] font-bold text-[#9ba3bb] uppercase tracking-wider mb-2">Status Dokumen</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'KTP', ok: !!applyKtp },
                              { label: 'CV', ok: !!applyCv },
                              { label: 'Foto', ok: !!applyPhoto },
                              { label: 'Portofolio', ok: !!applyPortfolio, optional: true },
                            ].map(({ label, ok, optional }) => (
                              <span key={label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : optional ? 'bg-[#f0f2f9] text-[#9ba3bb] border border-[#e2e5f0]'
                                : 'bg-red-50 text-red-600 border border-red-200'
                              }`}>
                                {ok ? <IconCheck /> : <span>—</span>}
                                {label}
                                {optional && !ok && <span className="opacity-60">(opsional)</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                        {applyPortfolio && (
                          <div className="sm:col-span-2">
                            <p className="text-[10px] font-bold text-[#9ba3bb] uppercase tracking-wider mb-0.5">Link Portofolio</p>
                            <a href={applyPortfolio} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-[#0055D4] hover:underline break-all">
                              {applyPortfolio}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Terms */}
                    <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-[#e2e5f0] hover:border-[#0055D4]/40 cursor-pointer transition-all select-none group">
                      <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 mt-0.5 transition-all ${
                        termsChecked ? 'bg-[#0055D4] border-[#0055D4] text-white' : 'border-[#c3c6d6] bg-white group-hover:border-[#0055D4]/60'
                      }`}>
                        {termsChecked && <IconCheck />}
                      </div>
                      <input
                        type="checkbox" checked={termsChecked}
                        onChange={e => setTermsChecked(e.target.checked)}
                        className="hidden" required
                      />
                      <span className="text-[13px] text-[#4b5573] leading-[20px]">
                        Saya menyatakan bahwa seluruh data yang saya isi adalah <strong className="text-[#0f1729]">benar dan valid</strong>, dan saya menyetujui syarat & ketentuan pendaftaran Stubia.id.
                      </span>
                    </label>
                  </div>
                )}

                {/* ── Navigation Buttons ── */}
                <div className="pt-4 border-t border-[#f0f2f9] flex justify-between items-center">
                  {activeStep > 1 ? (
                    <button
                      type="button" onClick={prevStep}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-[#e2e5f0] hover:border-[#0055D4]/50 hover:bg-[#f8f9ff] text-[#434654] font-bold text-[13px] transition-all"
                    >
                      <IconArrowLeft /> Kembali
                    </button>
                  ) : (
                    <button
                      type="button" onClick={() => navigate('/careers')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-[#e2e5f0] hover:border-[#e2e5f0] text-[#9ba3bb] font-bold text-[13px] transition-all"
                    >
                      <IconArrowLeft /> Batal
                    </button>
                  )}

                  {activeStep < 5 ? (
                    <button
                      type="button" onClick={nextStep}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0055D4] hover:bg-[#003fa4] text-white font-bold text-[13px] shadow-md shadow-blue-200 transition-all"
                    >
                      Selanjutnya <IconArrowRight />
                    </button>
                  ) : (
                    <button
                      type="submit" disabled={submittingApply}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0055D4] hover:bg-[#003fa4] text-white font-bold text-[13px] shadow-md shadow-blue-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submittingApply ? <><IconSpin /> Mengirim...</> : <><IconSend /> Kirim Lamaran</>}
                    </button>
                  )}
                </div>

              </form>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
