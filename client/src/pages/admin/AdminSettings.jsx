import React, { useState, useEffect } from 'react';
import { settingsService, tryoutService, ujianMandiriService } from '../../services/api';
import toast from 'react-hot-toast';
import UniversityLogo from '../../components/UniversityLogo';
import ImageUpload from '../../components/ImageUpload';

const DEFAULT_SCHEDULE = [
  { day: 'SEN', date: '12', title: 'Tryout Penalaran Umum', time: '09:00 - 11:30', active: true },
  { day: 'SEL', date: '13', title: 'Latihan Pengetahuan Kuantitatif', time: '14:00 - 15:30', active: false },
  { day: 'RAB', date: '14', title: 'Review Literasi Bahasa Indonesia', time: '10:00 - 11:00', active: false },
];

const AdminSettings = () => {
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');

  // Schedule State
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);

  // Tryout Banner State
  const [tryoutBannerUrl, setTryoutBannerUrl] = useState('');
  const [tryoutTitle, setTryoutTitle] = useState('');
  const [tryoutStartTime, setTryoutStartTime] = useState('');
  const [latihanUtbkActive, setLatihanUtbkActive] = useState(true);
  const [adminPin, setAdminPin] = useState('');

  // Banners Carousel
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null); // index or 'new'
  const [bannerForm, setBannerForm] = useState({
    type: 'image',
    bg_color: '#7a1a10',
    title: '',
    brand_name: '',
    image_url: '',
    ig_handle: '',
    tiktok_handle: '',
    yt_handle: '',
    web_handle: '',
    link_url: ''
  });

  // Ujian Terbuka Serentak
  const [ujianSerentak, setUjianSerentak] = useState([]);
  const [editingUjian, setEditingUjian] = useState(null); // index or 'new'
  const [ujianForm, setUjianForm] = useState({
    title: '',
    subtitle: '',
    category: 'UJIAN MANDIRI',
    bg_color: '#FFE000',
    badge_index: '1',
    university: 'UI',
    logo_type: 'ui',
    custom_logo_url: '',
    link_type: 'um', // 'um', 'utbk', 'custom'
    ujian_id: '',
    package_id: '',
    custom_link_path: ''
  });

  // UTBK Countdown Target Date
  const [utbkCountdownDate, setUtbkCountdownDate] = useState('2027-04-18');

  // Database lists
  const [utbkPackages, setUtbkPackages] = useState([]);
  const [umUniversities, setUmUniversities] = useState([]);
  const [umPackagesMap, setUmPackagesMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.getAdmin().then(async r => {
      const d = r.data.data;
      setBannerUrl(d.banner_image_url || '');
      setBannerTitle(d.banner_title || '');
      setBannerSubtitle(d.banner_subtitle || '');

      setTryoutBannerUrl(d.tryout_banner_url || '');
      setTryoutTitle(d.tryout_title || '');
      setTryoutStartTime(d.tryout_start_time || '');
      setLatihanUtbkActive(d.latihan_utbk_active !== 'false');
      setAdminPin(d.admin_pin || '');
      setUtbkCountdownDate(d.utbk_countdown_date || '2027-04-18');

      // Parse schedule from settings
      if (d.schedule_json) {
        try {
          const parsed = JSON.parse(d.schedule_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSchedule(parsed);
          }
        } catch {}
      }

      // Parse banners carousel
      if (d.banners_carousel) {
        try {
          setBanners(JSON.parse(d.banners_carousel));
        } catch (e) {
          console.error("Failed to parse banners_carousel", e);
        }
      } else {
        // Fallback default banner
        setBanners([
          {
            id: 'default-1',
            type: 'template',
            bg_color: '#7a1a10',
            title: 'Taklukkan UTBK dan Ujian Mandiri bersama',
            brand_name: 'RAFACADEMYC',
            image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80',
            ig_handle: 'rafacademyc',
            tiktok_handle: 'rafacademyc',
            yt_handle: 'rafacademyc',
            web_handle: 'rafacademyc.com',
            link_url: '/tryout/packages'
          },
          {
            id: 'default-2',
            type: 'template',
            bg_color: '#0050cb',
            title: 'Latihan soal terlengkap, tryout simulasi CBT, dan penilaian IRT modern.',
            brand_name: 'STUBIA CBT',
            image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80',
            ig_handle: 'rafacademyc',
            tiktok_handle: 'rafacademyc',
            yt_handle: 'rafacademyc',
            web_handle: 'rafacademyc.com',
            link_url: '/tryout/packages'
          }
        ]);
      }

      // Parse ujian serentak
      if (d.ujian_serentak) {
        try {
          setUjianSerentak(JSON.parse(d.ujian_serentak));
        } catch (e) {
          console.error("Failed to parse ujian_serentak", e);
        }
      }
    }).catch(e => console.error("Error loading settings", e)).finally(() => setLoading(false));

    // Fetch database resources
    tryoutService.listPackages().then(r => {
      setUtbkPackages(r.data?.data || []);
    }).catch(e => console.error("Error loading UTBK packages", e));

    ujianMandiriService.list().then(async r => {
      const unis = r.data?.data || [];
      setUmUniversities(unis);
      
      const packageMap = {};
      for (const uni of unis) {
        try {
          const pkgRes = await ujianMandiriService.getTryoutPackages(uni.id);
          packageMap[uni.id] = pkgRes.data?.data || [];
        } catch (err) {
          console.error(`Failed to load tryouts for uni ${uni.id}`, err);
        }
      }
      setUmPackagesMap(packageMap);
    }).catch(e => console.error("Error loading Ujian Mandiri universities", e));
  }, []);

  const handleSaveBannersCarousel = async (updatedBanners = banners) => {
    setSaving(true);
    try {
      await settingsService.update({
        banners_carousel: JSON.stringify(updatedBanners),
      });
      setBanners(updatedBanners);
      toast.success('Pengaturan banner carousel berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal menyimpan banner carousel.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUjianSerentak = async (updatedUjian = ujianSerentak) => {
    setSaving(true);
    try {
      await settingsService.update({
        ujian_serentak: JSON.stringify(updatedUjian),
      });
      setUjianSerentak(updatedUjian);
      toast.success('Pengaturan Ujian Terbuka Serentak berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal menyimpan Ujian Terbuka Serentak.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCountdownDate = async () => {
    if (!utbkCountdownDate) {
      toast.error('Tanggal target UTBK harus diisi!');
      return;
    }
    setSaving(true);
    try {
      await settingsService.update({
        utbk_countdown_date: utbkCountdownDate,
      });
      toast.success('Tanggal target UTBK berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal menyimpan tanggal target UTBK.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Banner Carousel Actions
  const handleAddBanner = () => {
    setEditingBanner('new');
    setBannerForm({
      type: 'image',
      bg_color: '#7a1a10',
      title: '',
      brand_name: '',
      image_url: '',
      ig_handle: '',
      tiktok_handle: '',
      yt_handle: '',
      web_handle: '',
      link_url: ''
    });
  };

  const handleEditBanner = (index) => {
    setEditingBanner(index);
    setBannerForm({ 
      ...banners[index],
      type: 'image'
    });
  };

  const handleDeleteBanner = (index) => {
    const updated = banners.filter((_, i) => i !== index);
    handleSaveBannersCarousel(updated);
  };

  const handleMoveBanner = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === banners.length - 1) return;
    
    const updated = [...banners];
    const temp = updated[index];
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    updated[index] = updated[swapWith];
    updated[swapWith] = temp;
    
    handleSaveBannersCarousel(updated);
  };

  const handleSaveBannerForm = () => {
    if (!bannerForm.image_url) {
      toast.error('Gambar banner harus diupload!');
      return;
    }

    const updated = [...banners];
    const bannerItem = { 
      ...bannerForm, 
      type: 'image',
      id: bannerForm.id || `banner-${Date.now()}` 
    };

    if (editingBanner === 'new') {
      updated.push(bannerItem);
    } else {
      updated[editingBanner] = bannerItem;
    }

    handleSaveBannersCarousel(updated);
    setEditingBanner(null);
  };

  // Ujian Serentak Actions
  const handleAddUjian = () => {
    setEditingUjian('new');
    setUjianForm({
      title: '',
      subtitle: '',
      category: 'UJIAN MANDIRI',
      bg_color: '#FFE000',
      badge_index: '1',
      university: 'UI',
      logo_type: 'ui',
      custom_logo_url: '',
      link_type: 'um',
      ujian_id: '',
      package_id: '',
      custom_link_path: ''
    });
  };

  const handleEditUjian = (index) => {
    setEditingUjian(index);
    setUjianForm({ ...ujianSerentak[index] });
  };

  const handleDeleteUjian = (index) => {
    const updated = ujianSerentak.filter((_, i) => i !== index);
    handleSaveUjianSerentak(updated);
  };

  const handleMoveUjian = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === ujianSerentak.length - 1) return;
    
    const updated = [...ujianSerentak];
    const temp = updated[index];
    const swapWith = direction === 'up' ? index - 1 : index + 1;
    updated[index] = updated[swapWith];
    updated[swapWith] = temp;
    
    handleSaveUjianSerentak(updated);
  };

  const handleSaveUjianForm = () => {
    if (!ujianForm.title || !ujianForm.subtitle) {
      toast.error('Judul dan Subjudul harus diisi!');
      return;
    }

    // Resolve pre-computed link path
    let linkPath = '';
    if (ujianForm.link_type === 'um') {
      if (ujianForm.package_id) {
        linkPath = `/ujian-mandiri/${ujianForm.ujian_id}/tryout/${ujianForm.package_id}`;
      } else {
        linkPath = `/ujian-mandiri/${ujianForm.ujian_id}`;
      }
    } else if (ujianForm.link_type === 'utbk') {
      linkPath = `/tryout/select/${ujianForm.package_id}`;
    } else {
      linkPath = ujianForm.custom_link_path || '/dashboard';
    }

    const updated = [...ujianSerentak];
    const ujianItem = {
      ...ujianForm,
      id: ujianForm.id || `ujian-${Date.now()}`,
      link_path: linkPath
    };

    if (editingUjian === 'new') {
      updated.push(ujianItem);
    } else {
      updated[editingUjian] = ujianItem;
    }

    handleSaveUjianSerentak(updated);
    setEditingUjian(null);
  };

  const handleSaveBanner = async () => {
    if (!bannerUrl && !bannerTitle && !bannerSubtitle) {
      toast.error('Form banner tidak boleh kosong!');
      return;
    }
    setSaving(true);
    try {
      await settingsService.update({
        banner_image_url: bannerUrl,
        banner_title: bannerTitle,
        banner_subtitle: bannerSubtitle,
      });
      toast.success('Pengaturan banner berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal menyimpan banner. Silakan coba lagi.');
      console.error(err);
    }
    finally { setSaving(false); }
  };

  const handleSaveSchedule = async () => {
    const hasEmptyField = schedule.some(item => !item.day || !item.date || !item.title || !item.time);
    if (hasEmptyField) {
      toast.error('Semua field jadwal harus diisi!');
      return;
    }
    setSaving(true);
    try {
      await settingsService.update({
        schedule_json: JSON.stringify(schedule),
      });
      toast.success('Jadwal berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal menyimpan jadwal. Silakan coba lagi.');
      console.error(err);
    }
    finally { setSaving(false); }
  };

  const handleSaveTryout = async () => {
    setSaving(true);
    try {
      await settingsService.update({
        tryout_banner_url: tryoutBannerUrl,
        tryout_title: tryoutTitle,
        tryout_start_time: tryoutStartTime
      });
      toast.success('Pengaturan tryout berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal menyimpan tryout. Silakan coba lagi.');
      console.error(err);
    }
    finally { setSaving(false); }
  };

  const handleSaveAdminPin = async () => {
    if (!adminPin.trim()) {
      toast.error('PIN Admin tidak boleh kosong!');
      return;
    }
    setSaving(true);
    try {
      await settingsService.update({
        admin_pin: adminPin.trim()
      });
      toast.success('PIN Admin berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal menyimpan PIN Admin. Silakan coba lagi.');
      console.error(err);
    }
    finally { setSaving(false); }
  };

  const handleSaveLatihanUtbkActive = async (newValue) => {
    setSaving(true);
    try {
      await settingsService.update({
        latihan_utbk_active: String(newValue),
      });
      setLatihanUtbkActive(newValue);
      toast.success(`Latihan Soal UTBK berhasil ${newValue ? 'diaktifkan' : 'dinonaktifkan'}!`);
    } catch (err) {
      toast.error('Gagal memperbarui status Latihan Soal UTBK.');
      console.error(err);
    }
    finally { setSaving(false); }
  };

  const updateScheduleItem = (index, field, value) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    setSchedule(updated);
  };

  const toggleScheduleActive = (index) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], active: !updated[index].active };
    setSchedule(updated);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;

  return (
    <div className="animate-fade-in text-on-surface">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm mb-2">
          <span>Dashboard</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-bold">Pengaturan Dashboard</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Pengaturan Konten Dashboard</h2>
        <p className="text-on-surface-variant font-body-md mt-1">Kelola slide banner hero, daftar ujian terbuka serentak, dan parameter dashboard lainnya.</p>
      </div>

      {/* ── BANNER CAROUSEL CONFIGURATOR ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm mb-12">
        <div className="mb-6">
          <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-4 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary">view_carousel</span>
            Pengaturan Banner Carousel
          </h3>
        </div>

        {editingBanner === null ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <p className="text-on-surface-variant font-body-md">Kelola slide banner yang bergerak bergantian di hero section dashboard siswa.</p>
              <button 
                onClick={handleAddBanner}
                className="bg-primary text-on-primary py-2.5 px-5 rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-1.5 text-sm shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">add</span> Tambah Slide
              </button>
            </div>
            
            {banners.length === 0 ? (
              <div className="p-12 text-center bg-surface-container-low border border-dashed border-outline-variant rounded-xl text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">view_carousel</span>
                <p className="text-sm">Belum ada slide banner dikonfigurasi. Klik "Tambah Slide" di atas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* List of banners */}
                <div className="lg:col-span-6 space-y-3 max-h-[480px] overflow-y-auto pr-2">
                  {banners.map((b, idx) => (
                    <div key={b.id || idx} className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-bold overflow-hidden shrink-0 border border-outline-variant">
                          {b.type === 'image' ? (
                            <img src={b.image_url} className="w-full h-full object-cover" alt="slide" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase" style={{ backgroundColor: b.bg_color || '#7a1a10', color: '#fff' }}>
                              Slide
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-on-surface truncate">
                            {b.type === 'image' ? 'Slide Gambar Penuh' : (b.brand_name || 'Slide Template')}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">{b.title || 'Tanpa judul'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleMoveBanner(idx, 'up')} disabled={idx === 0} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30">
                          <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                        </button>
                        <button onClick={() => handleMoveBanner(idx, 'down')} disabled={idx === banners.length - 1} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30">
                          <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                        </button>
                        <button onClick={() => handleEditBanner(idx)} className="p-1.5 text-blue-600 rounded hover:bg-blue-50">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleDeleteBanner(idx)} className="p-1.5 text-red-600 rounded hover:bg-red-50">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Live Preview of first/active banner */}
                <div className="lg:col-span-6 bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col gap-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Live Preview (Slide Pertama)</p>
                  {banners[0] ? (
                    <div className="w-full relative rounded-2xl overflow-hidden aspect-[2.2/1] shadow-lg border border-outline-variant" style={{ backgroundColor: banners[0].type === 'template' ? banners[0].bg_color : undefined }}>
                      {banners[0].type === 'image' ? (
                        <img src={banners[0].image_url} className="w-full h-full object-cover" alt="preview" />
                      ) : (
                        <div className="w-full h-full p-5 flex items-center justify-between relative overflow-hidden" style={{ backgroundColor: banners[0].bg_color || '#7a1a10' }}>
                          <div className="max-w-[65%] text-white z-10">
                            <p className="text-[9px] sm:text-[11px] font-medium opacity-90 line-clamp-2 leading-tight">{banners[0].title}</p>
                            <h2 className="text-sm sm:text-2xl font-black mt-1.5 uppercase tracking-tight">{banners[0].brand_name}</h2>
                            <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-[7px] sm:text-[9px] opacity-80">
                              {banners[0].ig_handle && <div className="flex items-center gap-0.5"><span className="text-[9px]">📸</span> {banners[0].ig_handle}</div>}
                              {banners[0].tiktok_handle && <div className="flex items-center gap-0.5"><span className="text-[9px]">🎵</span> {banners[0].tiktok_handle}</div>}
                              {banners[0].yt_handle && <div className="flex items-center gap-0.5"><span className="text-[9px]">▶️</span> {banners[0].yt_handle}</div>}
                              {banners[0].web_handle && <div className="flex items-center gap-0.5"><span className="text-[9px]">🌐</span> {banners[0].web_handle}</div>}
                            </div>
                          </div>
                          {banners[0].image_url && (
                            <img src={banners[0].image_url} className="w-[32%] h-[90%] object-contain z-10" alt="illustration" />
                          )}
                          {/* Decorative pattern overlay */}
                          <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-white/5 rounded-l-full transform translate-x-12 scale-125 pointer-events-none" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-[2.2/1] border border-dashed border-outline-variant rounded-xl flex items-center justify-center text-gray-400 text-sm">
                      Tidak ada slide untuk dipreview
                    </div>
                  )}
                  <p className="text-[11px] text-on-surface-variant text-center">Preview ini merupakan representasi dari tampilan banner di halaman dashboard siswa.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Form to Add/Edit Banner */
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-6">
            <h4 className="font-bold text-base text-on-surface border-b border-outline-variant pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">edit_square</span>
              {editingBanner === 'new' ? 'Tambah Slide Banner Baru' : `Edit Slide Banner #${editingBanner + 1}`}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <ImageUpload
                  value={bannerForm.image_url}
                  onChange={url => setBannerForm({ ...bannerForm, image_url: url })}
                  folder="banners"
                  label="Gambar Banner Penuh"
                  placeholder="Upload banner penuh atau masukkan URL"
                  aspectRatio="aspect-[2.4/1]"
                />
              </div>
              
              <div className="space-y-4">
                {/* Banner Guide Box */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="material-symbols-outlined text-[20px]">info</span>
                    Panduan Ukuran & Format Gambar
                  </div>
                  <ul className="text-xs space-y-2 text-on-surface-variant list-disc pl-4 leading-relaxed">
                    <li>Rekomendasi Dimensi: <strong>1200 x 500 piksel</strong> (Rasio Aspek <strong>2.4:1</strong>).</li>
                    <li>Gunakan format gambar landscape/mendatar agar responsif di seluruh perangkat (Desktop & Mobile).</li>
                    <li>Format File: <strong>PNG, JPG, JPEG, atau WebP</strong>.</li>
                    <li>Ukuran File Maksimum: <strong>2 MB</strong> (disarankan di bawah 500 KB untuk loading cepat).</li>
                  </ul>
                </div>

                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Link Saat Diklik (Opsional)</label>
                  <input
                    value={bannerForm.link_url || ''}
                    onChange={e => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                    placeholder="/tryout/packages"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  />
                  <p className="text-[11px] text-on-surface-variant mt-1">Gunakan path relatif internal (contoh: `/tryout/packages` atau `/ujian-mandiri`).</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end pt-4 border-t border-outline-variant">
              <button
                onClick={() => setEditingBanner(null)}
                className="py-2 px-5 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container-lowest transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveBannerForm}
                className="py-2 px-5 bg-primary text-on-primary rounded-lg text-sm font-bold hover:shadow-lg transition-all"
              >
                Simpan Slide
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── UJIAN TERBUKA SERENTAK CONFIGURATOR ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm mb-12">
        <div className="mb-6">
          <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-4 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary">language</span>
            Pengaturan Ujian Terbuka Serentak
          </h3>
        </div>
        
        {editingUjian === null ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <p className="text-on-surface-variant font-body-md">Kelola daftar ujian serentak berskala nasional yang tampil di dashboard siswa (mendukung UTBK & Ujian Mandiri).</p>
              <button 
                onClick={handleAddUjian}
                className="bg-primary text-on-primary py-2.5 px-5 rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-1.5 text-sm shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">add</span> Tambah Ujian
              </button>
            </div>
            
            {ujianSerentak.length === 0 ? (
              <div className="p-12 text-center bg-surface-container-low border border-dashed border-outline-variant rounded-xl text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">assignment</span>
                <p className="text-sm">Belum ada ujian serentak dikonfigurasi. Klik "Tambah Ujian" di atas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {ujianSerentak.map((u, idx) => (
                  <div key={u.id || idx} className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Color Stripe & Logo */}
                      <div className="w-12 h-16 rounded border border-outline-variant flex items-center justify-center bg-white shrink-0 shadow-sm" style={{ borderLeft: `6px solid ${u.bg_color || '#FFE000'}` }}>
                        <UniversityLogo name={u.logo_type} customUrl={u.custom_logo_url} className="w-8 h-8" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-gray-200 text-[#191b24] text-[10px] font-black rounded uppercase">
                            {u.category || 'UJIAN MANDIRI'}
                          </span>
                          <span className="w-5 h-5 bg-[#0050cb] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                            {u.badge_index || '1'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-on-surface mt-1 truncate">{u.title}</h4>
                        <p className="text-xs text-on-surface-variant truncate">{u.subtitle} &bull; <code className="bg-gray-50 px-1 rounded text-[10px] text-primary">{u.link_path}</code></p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 self-end md:self-auto shrink-0 border-t md:border-t-0 pt-2 md:pt-0 w-full md:w-auto justify-end">
                      <button onClick={() => handleMoveUjian(idx, 'up')} disabled={idx === 0} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30">
                        <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                      </button>
                      <button onClick={() => handleMoveUjian(idx, 'down')} disabled={idx === ujianSerentak.length - 1} className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30">
                        <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                      </button>
                      <button onClick={() => handleEditUjian(idx)} className="p-1.5 text-blue-600 rounded hover:bg-blue-50">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => handleDeleteUjian(idx)} className="p-1.5 text-red-600 rounded hover:bg-red-50">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Form to Add/Edit Ujian */
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 space-y-6">
            <h4 className="font-bold text-base text-on-surface border-b border-outline-variant pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">assignment_add</span>
              {editingUjian === 'new' ? 'Tambah Ujian Serentak Baru' : `Edit Ujian Serentak #${editingUjian + 1}`}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Kategori Ujian</label>
                  <select
                    value={ujianForm.category}
                    onChange={e => setUjianForm({ ...ujianForm, category: e.target.value, link_type: e.target.value === 'UTBK' ? 'utbk' : 'um', ujian_id: '', package_id: '' })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="UJIAN MANDIRI">UJIAN MANDIRI</option>
                    <option value="UTBK">UTBK / SNBT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Judul Card Ujian</label>
                  <input
                    value={ujianForm.title}
                    onChange={e => setUjianForm({ ...ujianForm, title: e.target.value })}
                    placeholder="e.g. SIMAK UI Part 1"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Subjudul Card Ujian</label>
                  <input
                    value={ujianForm.subtitle}
                    onChange={e => setUjianForm({ ...ujianForm, subtitle: e.target.value })}
                    placeholder="e.g. Seleksi Mandiri UI 2026"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Stripe Warna Kiri (Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={ujianForm.bg_color.startsWith('#') && ujianForm.bg_color.length === 7 ? ujianForm.bg_color : '#FFE000'}
                      onChange={e => setUjianForm({ ...ujianForm, bg_color: e.target.value })}
                      className="w-12 h-10 border border-outline-variant rounded-lg cursor-pointer bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      value={ujianForm.bg_color}
                      onChange={e => setUjianForm({ ...ujianForm, bg_color: e.target.value })}
                      placeholder="#FFE000"
                      className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Nomor Badge Indeks (Kanan Atas)</label>
                  <input
                    type="number"
                    value={ujianForm.badge_index}
                    onChange={e => setUjianForm({ ...ujianForm, badge_index: e.target.value })}
                    placeholder="1"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <ImageUpload
                    value={ujianForm.custom_logo_url}
                    onChange={url => setUjianForm({ ...ujianForm, custom_logo_url: url, logo_type: 'custom' })}
                    folder="logos"
                    label="Logo Ujian / Universitas"
                    placeholder="Upload logo universitas atau instansi"
                    aspectRatio="aspect-square"
                  />
                  <p className="text-[10px] text-[#727687] mt-1">Panduan ukuran: Gunakan logo berlatar transparan (PNG/WebP). Dimensi ideal 200x200 piksel (Rasio 1:1).</p>
                </div>
                
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Sumber / Tipe Link Pengerjaan</label>
                  <select
                    value={ujianForm.link_type}
                    onChange={e => setUjianForm({ ...ujianForm, link_type: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  >
                    {ujianForm.category === 'UJIAN MANDIRI' ? (
                      <>
                        <option value="um">Database Ujian Mandiri</option>
                        <option value="custom">Link Kustom</option>
                      </>
                    ) : (
                      <>
                        <option value="utbk">Database UTBK Tryout</option>
                        <option value="custom">Link Kustom</option>
                      </>
                    )}
                  </select>
                </div>
                
                {ujianForm.link_type === 'um' && (
                  <>
                    <div>
                      <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Pilih Universitas</label>
                      <select
                        value={ujianForm.ujian_id}
                        onChange={e => setUjianForm({ ...ujianForm, ujian_id: e.target.value, package_id: '' })}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                      >
                        <option value="">-- Pilih Universitas --</option>
                        {umUniversities.map(u => (
                          <option key={u.id} value={u.id}>{u.universitas} ({u.nama_ujian})</option>
                        ))}
                      </select>
                    </div>
                    {ujianForm.ujian_id && (
                      <div>
                        <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Pilih Paket Tryout (Opsional, Default Detail Kampus)</label>
                        <select
                          value={ujianForm.package_id}
                          onChange={e => setUjianForm({ ...ujianForm, package_id: e.target.value })}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="">Detail Kampus Saja</option>
                          {(umPackagesMap[ujianForm.ujian_id] || []).map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
                
                {ujianForm.link_type === 'utbk' && (
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Pilih Paket UTBK Tryout</label>
                    <select
                      value={ujianForm.package_id}
                      onChange={e => setUjianForm({ ...ujianForm, package_id: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="">-- Pilih Paket UTBK --</option>
                      {utbkPackages.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {ujianForm.link_type === 'custom' && (
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Path Link Kustom</label>
                    <input
                      value={ujianForm.custom_link_path}
                      onChange={e => setUjianForm({ ...ujianForm, custom_link_path: e.target.value })}
                      placeholder="/tryout/packages"
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 justify-end pt-4 border-t border-outline-variant">
              <button
                onClick={() => setEditingUjian(null)}
                className="py-2 px-5 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container-lowest transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveUjianForm}
                className="py-2 px-5 bg-primary text-on-primary rounded-lg text-sm font-bold hover:shadow-lg transition-all"
              >
                Simpan Ujian
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── COUNTDOWN TARGET DATE CONFIGURATOR ── */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-sm mb-12 max-w-xl">
        <div className="mb-6">
          <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-4 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary">calendar_today</span>
            Hitung Mundur UTBK
          </h3>
        </div>
        <p className="text-on-surface-variant font-body-md mb-6">
          Tentukan tanggal pelaksanaan UTBK untuk menghitung sisa hari ("H - X UTBK") secara dinamis di halaman siswa.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Tanggal Target UTBK</label>
            <input
              type="date"
              value={utbkCountdownDate}
              onChange={e => setUtbkCountdownDate(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <button
            onClick={handleSaveCountdownDate}
            disabled={saving}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
            Simpan Tanggal Target
          </button>
        </div>
      </div>

      {/* ── SCHEDULE EDITOR ── */}
      <div className="mt-12">
        <div className="mb-6">
          <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-4 mb-6">Pengaturan Jadwal Dashboard</h3>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm">
          <p className="text-on-surface-variant font-body-md mb-6">Edit jadwal yang tampil di sidebar halaman dashboard siswa.</p>
          <div className="space-y-6">
            {schedule.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start bg-surface-container-low p-4 rounded-xl">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Hari</label>
                  <input
                    value={item.day}
                    onChange={e => updateScheduleItem(index, 'day', e.target.value.toUpperCase())}
                    placeholder="SEN"
                    maxLength={3}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Tanggal</label>
                  <input
                    value={item.date}
                    onChange={e => updateScheduleItem(index, 'date', e.target.value)}
                    placeholder="12"
                    maxLength={2}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-label-sm text-label-sm text-on-surface-variant">Judul</label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.active}
                        onChange={() => toggleScheduleActive(index)}
                        className="w-4 h-4 rounded accent-primary"
                      />
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Aktif</span>
                    </label>
                  </div>
                  <input
                    value={item.title}
                    onChange={e => updateScheduleItem(index, 'title', e.target.value)}
                    placeholder="Tryout Penalaran Umum"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                  />
                  <input
                    value={item.time}
                    onChange={e => updateScheduleItem(index, 'time', e.target.value)}
                    placeholder="09:00 - 11:30"
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none mt-2"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveSchedule}
            disabled={saving}
            className="mt-6 w-full bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Menyimpan...</> : <><span className="material-symbols-outlined text-[20px]">save</span>Simpan Jadwal</>}
          </button>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tryout Form */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-4 mb-6">Pengaturan Pusat Tryout</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">URL Gambar Tryout</label>
                <input
                  value={tryoutBannerUrl}
                  onChange={e => setTryoutBannerUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... (opsional)"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Judul Utama Tryout</label>
                <textarea
                  value={tryoutTitle}
                  onChange={e => setTryoutTitle(e.target.value)}
                  placeholder="Tryout Nasional Akbar&#10;UTBK-SNBT 2026"
                  rows={2}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none resize-none"
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Waktu Mulai (Countdown / Teks Bebas)</label>
                <input
                  value={tryoutStartTime}
                  onChange={e => setTryoutStartTime(e.target.value)}
                  placeholder="04 : 12 : 55 : 20"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-outline-variant/50">
            <button
              onClick={handleSaveTryout}
              disabled={saving}
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Menyimpan...</> : <><span className="material-symbols-outlined text-[20px]">save</span>Simpan Perubahan Tryout</>}
            </button>
          </div>
        </div>

        {/* Latihan UTBK Form */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-4 mb-6">Pengaturan Latihan Soal UTBK</h3>
            <p className="text-on-surface-variant font-body-md mb-6">
              Mengontrol status aktif/non-aktif fitur Latihan Soal UTBK untuk siswa. Jika dinonaktifkan, siswa tidak dapat mengakses latihan soal.
            </p>
            
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 flex items-center justify-between">
              <div>
                <p className="font-label-lg text-label-lg text-on-surface font-bold">Status Fitur Latihan UTBK</p>
                <p className="text-[12px] text-on-surface-variant mt-1">
                  Saat ini: <strong className={latihanUtbkActive ? 'text-green-600' : 'text-red-500'}>{latihanUtbkActive ? 'AKTIF' : 'NON-AKTIF'}</strong>
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={latihanUtbkActive}
                  onChange={e => handleSaveLatihanUtbkActive(e.target.checked)}
                  disabled={saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
          <div className="text-on-surface-variant font-body-sm text-xs pt-4 border-t border-outline-variant/50">
            * Perubahan status akan langsung berdampak pada seluruh siswa yang sedang membuka halaman Latihan Soal UTBK.
          </div>
        </div>
      </div>

      {/* ── PENGATURAN PIN CMS ADMIN ── */}
      <div className="mt-12">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 sm:p-8 shadow-sm w-full sm:max-w-xl">
          <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-4 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary">lock_open</span>
            Pengaturan PIN CMS Admin
          </h3>
          <p className="text-on-surface-variant font-body-md mb-6">
            PIN ini digunakan untuk memverifikasi keamanan sebelum masuk ke portal CMS dari halaman dashboard.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">PIN Keamanan Admin</label>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={6}
                value={adminPin}
                onChange={e => setAdminPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Masukkan 4-6 digit angka (contoh: 1234)"
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <button
              onClick={handleSaveAdminPin}
              disabled={saving}
              className="w-full bg-[#0050cb] text-white py-3 rounded-lg font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
              Simpan PIN Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
