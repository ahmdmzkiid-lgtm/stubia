import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/api';
import toast from 'react-hot-toast';

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.get().then(r => {
      const d = r.data.data;
      setBannerUrl(d.banner_image_url || '');
      setBannerTitle(d.banner_title || '');
      setBannerSubtitle(d.banner_subtitle || '');

      setTryoutBannerUrl(d.tryout_banner_url || '');
      setTryoutTitle(d.tryout_title || '');
      setTryoutStartTime(d.tryout_start_time || '');
      setLatihanUtbkActive(d.latihan_utbk_active !== 'false');

      // Parse schedule from settings
      if (d.schedule_json) {
        try {
          const parsed = JSON.parse(d.schedule_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSchedule(parsed);
          }
        } catch {}
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

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
      toast.error('Gagal menyimpan pengaturan tryout. Silakan coba lagi.');
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
          <span className="text-primary font-bold">Pengaturan Banner</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Pengaturan Banner Dashboard</h2>
        <p className="text-on-surface-variant font-body-md mt-1">Ubah gambar dan teks hero banner yang tampil di halaman siswa.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm space-y-6">
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">URL Gambar Banner</label>
            <input
              value={bannerUrl}
              onChange={e => setBannerUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
            />
            <p className="text-label-sm text-on-surface-variant mt-1">Gunakan URL <strong>langsung ke file gambar</strong> (bukan halaman website). Contoh Unsplash: <code className="bg-gray-100 px-1 rounded text-[11px]">https://images.unsplash.com/photo-xxxxx?w=1920&q=80</code></p>
            {bannerUrl && bannerUrl.includes('unsplash.com') && !bannerUrl.includes('images.unsplash.com') && (
              <p className="text-[12px] text-red-500 font-bold mt-1">⚠️ URL ini adalah halaman Unsplash, bukan URL gambar langsung. Banner tidak akan tampil.</p>
            )}
          </div>
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Judul Banner</label>
            <input
              value={bannerTitle}
              onChange={e => setBannerTitle(e.target.value)}
              placeholder="Raih Skor UTBK Terbaikmu"
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">Subtitle Banner</label>
            <textarea
              value={bannerSubtitle}
              onChange={e => setBannerSubtitle(e.target.value)}
              rows={3}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2.5 px-4 font-label-md text-on-surface focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>
          <button
            onClick={handleSaveBanner}
            disabled={saving}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Menyimpan...</> : <><span className="material-symbols-outlined text-[20px]">save</span>Simpan Banner</>}
          </button>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Live Preview</p>
          <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
            <img src={bannerUrl || `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="800" viewBox="0 0 1920 800"><rect fill="%23191b24" width="1920" height="800"/><text fill="%23ffffff" font-family="sans-serif" font-size="48" x="50%" y="50%" text-anchor="middle" dy=".3em">No Image</text></svg>')}`} alt="Banner Preview" className="w-full h-full object-cover" onError={e => { e.target.onerror = null; e.target.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="800" viewBox="0 0 1920 800"><rect fill="%23191b24" width="1920" height="800"/><text fill="%23ff6b6b" font-family="sans-serif" font-size="48" x="50%" y="50%" text-anchor="middle" dy=".3em">Invalid URL</text></svg>')}`; }} />
            <div className="absolute inset-0 bg-gradient-to-r from-[#191b24]/90 via-[#191b24]/50 to-transparent" />
            <div className="absolute inset-0 flex items-center p-10">
              <div className="max-w-md">
                <span className="inline-block py-1 px-3 rounded-full bg-[#0050cb]/20 text-[#dae1ff] border border-[#0050cb]/30 text-xs font-bold uppercase tracking-widest mb-4">Stubia UTBK</span>
                <h2 className="text-3xl font-bold text-white mb-3 leading-tight">{bannerTitle || 'Judul Banner'}</h2>
                <p className="text-sm text-white/80 leading-relaxed line-clamp-3">{bannerSubtitle || 'Subtitle banner...'}</p>
              </div>
            </div>
          </div>
          <p className="text-label-sm text-on-surface-variant text-center">Tampilan preview — ini yang akan dilihat siswa di halaman dashboard.</p>
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
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 shadow-sm space-y-6">
          <h3 className="font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-4 mb-6">Pengaturan Pusat Tryout</h3>
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
          <button
            onClick={handleSaveTryout}
            disabled={saving}
            className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md text-label-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Menyimpan...</> : <><span className="material-symbols-outlined text-[20px]">save</span>Simpan Perubahan Tryout</>}
          </button>
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
    </div>
  );
};

export default AdminSettings;
