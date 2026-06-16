// Data Ujian Mandiri dengan localStorage persistence
const STORAGE_KEY = 'eduzet_ujian_mandiri';
const BANNER_KEY = 'eduzet_ujian_mandiri_banner';
const TRYOUT_KEY = 'eduzet_ujian_mandiri_tryout';
const LATIHAN_KEY = 'eduzet_ujian_mandiri_latihan';

export const DEFAULT_BANNER = {
  badge: 'AKADEMIK 2026',
  title: 'Eksplorasi Ujian Mandiri 2026',
  description:
    'Temukan peluang pendidikan terbaik di institusi pendidikan tinggi terkemuka Indonesia. Portal EduZET menyediakan informasi komprehensif, jadwal krusial, dan panduan pendaftaran terpusat untuk membantu ambisi akademik Anda mencapai puncak prestasinya.',
  primaryButtonText: 'Mulai Registrasi',
  primaryButtonLink: '',
  secondaryButtonText: 'Unduh Panduan (PDF)',
  secondaryButtonLink: '',
  image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
  verifiedLabel: 'TERVERIFIKASI',
  verifiedText: '6 Institusi Utama',
};

export const STATUS_OPTIONS = [
  { value: 'open', label: 'Pendaftaran Dibuka', color: 'bg-[#0050cb]/10 text-[#0050cb] border-[#0050cb]' },
  { value: 'coming-soon', label: 'Segera Hadir', color: 'bg-[#765a00]/10 text-[#765a00] border-[#765a00]' },
  { value: 'closed', label: 'Pendaftaran Ditutup', color: 'bg-[#D90429]/10 text-[#D90429] border-[#D90429]' },
];

export const DEFAULT_UJIAN_MANDIRI = [
  {
    id: 'simak-ui',
    universitas: 'Universitas Indonesia',
    namaUjian: 'SIMAK UI',
    status: 'open',
    deadline: '15 Juli 2026',
    lokasi: 'Depok, Jawa Barat',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800',
    logo: 'https://res.cloudinary.com/dcnkhhxz8/image/upload/v1780037007/eduzet/ptn/wzentledpuv6d7gj5rns.png',
    detailLink: 'https://simak.ui.ac.id',
  },
  {
    id: 'sm-itb',
    universitas: 'ITB',
    namaUjian: 'SM-ITB',
    status: 'coming-soon',
    deadline: 'Estimasi: Agustus 2026',
    lokasi: 'Bandung, Jawa Barat',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
    logo: 'https://res.cloudinary.com/dcnkhhxz8/image/upload/v1780036916/eduzet/ptn/b0gk1iazymxyjfy0omz9.png',
    detailLink: 'https://usm.itb.ac.id',
  },
  {
    id: 'um-ugm',
    universitas: 'UGM',
    namaUjian: 'UM-UGM',
    status: 'open',
    deadline: '20 Juni 2026',
    lokasi: 'Sleman, Yogyakarta',
    image: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=800',
    logo: 'https://res.cloudinary.com/dcnkhhxz8/image/upload/v1780037006/eduzet/ptn/m0cbjil4dxxztzdkl2fx.jpg',
    detailLink: 'https://um.ugm.ac.id',
  },
  {
    id: 'sm-ipb',
    universitas: 'IPB University',
    namaUjian: 'SM-IPB',
    status: 'open',
    deadline: '30 Juni 2026',
    lokasi: 'Bogor, Jawa Barat',
    image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800',
    logo: 'https://res.cloudinary.com/dcnkhhxz8/image/upload/v1780036915/eduzet/ptn/j2lelceiiyuhfgbkavt0.png',
    detailLink: 'https://admisi.ipb.ac.id',
  },
  {
    id: 'smits',
    universitas: 'ITS Surabaya',
    namaUjian: 'SMITS',
    status: 'open',
    deadline: '10 Juli 2026',
    lokasi: 'Surabaya, Jawa Timur',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800',
    logo: 'https://res.cloudinary.com/dcnkhhxz8/image/upload/v1780036919/eduzet/ptn/jejuqr21bhwlde4oc1jm.png',
    detailLink: 'https://smits.its.ac.id',
  },
  {
    id: 'mandiri-unair',
    universitas: 'Universitas Airlangga',
    namaUjian: 'MANDIRI',
    status: 'closed',
    deadline: 'Selesai: Mei 2026',
    lokasi: 'Surabaya, Jawa Timur',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
    logo: '',
    detailLink: 'https://ppmb.unair.ac.id',
  },
];

export function loadUjianMandiri() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load ujian mandiri', e);
  }
  return DEFAULT_UJIAN_MANDIRI;
}

export function saveUjianMandiri(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save ujian mandiri', e);
    return false;
  }
}

export function loadBanner() {
  try {
    const stored = localStorage.getItem(BANNER_KEY);
    if (stored) return { ...DEFAULT_BANNER, ...JSON.parse(stored) };
  } catch (e) {
    console.error('Failed to load banner', e);
  }
  return DEFAULT_BANNER;
}

export function saveBanner(data) {
  try {
    localStorage.setItem(BANNER_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save banner', e);
    return false;
  }
}

export function getStatusConfig(status) {
  return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
}

// Default Tryout Packages per Ujian Mandiri
export const DEFAULT_TRYOUT_PACKAGES = {
  'simak-ui': [
    {
      id: 'simak-ui-pkg-1',
      title: 'SIMAK UI Package 1: Kemampuan Dasar',
      description: 'Fokus pada Matematika Dasar, Bahasa Indonesia, dan Bahasa Inggris.',
      icon: 'auto_stories',
      iconColor: '#0050cb',
      soalCount: 120,
      duration: 180,
      peserta: 12402,
    },
    {
      id: 'simak-ui-pkg-2',
      title: 'SIMAK UI Package 2: Kemampuan IPA',
      description: 'Matematika IPA, Biologi, Fisika, dan Kimia tingkat lanjut.',
      icon: 'science',
      iconColor: '#765a00',
      soalCount: 80,
      duration: 120,
      peserta: 8912,
    },
    {
      id: 'simak-ui-pkg-3',
      title: 'SIMAK UI Package 3: Kemampuan IPS',
      description: 'Ekonomi, Geografi, Sejarah, dan Sosiologi terintegrasi.',
      icon: 'public',
      iconColor: '#1B4332',
      soalCount: 80,
      duration: 120,
      peserta: 15203,
    },
  ],
  'sm-itb': [
    {
      id: 'sm-itb-pkg-1',
      title: 'SM-ITB Package 1: Kemampuan Dasar',
      description: 'Matematika Dasar, Bahasa Indonesia, dan Bahasa Inggris.',
      icon: 'auto_stories',
      iconColor: '#0050cb',
      soalCount: 100,
      duration: 150,
      peserta: 9500,
    },
    {
      id: 'sm-itb-pkg-2',
      title: 'SM-ITB Package 2: Kemampuan IPA',
      description: 'Matematika IPA, Fisika, dan Kimia untuk jalur Saintek.',
      icon: 'science',
      iconColor: '#765a00',
      soalCount: 60,
      duration: 90,
      peserta: 7200,
    },
  ],
  'um-ugm': [
    {
      id: 'um-ugm-pkg-1',
      title: 'UM-UGM Package 1: Kemampuan Dasar',
      description: 'Tes Potensi Akademik dan Kemampuan Dasar.',
      icon: 'auto_stories',
      iconColor: '#0050cb',
      soalCount: 90,
      duration: 120,
      peserta: 11000,
    },
    {
      id: 'um-ugm-pkg-2',
      title: 'UM-UGM Package 2: Saintek',
      description: 'Matematika IPA, Fisika, Kimia, dan Biologi.',
      icon: 'science',
      iconColor: '#765a00',
      soalCount: 75,
      duration: 100,
      peserta: 8500,
    },
    {
      id: 'um-ugm-pkg-3',
      title: 'UM-UGM Package 3: Soshum',
      description: 'Ekonomi, Sejarah, Geografi, dan Sosiologi.',
      icon: 'public',
      iconColor: '#1B4332',
      soalCount: 75,
      duration: 100,
      peserta: 9200,
    },
  ],
};

// Default Latihan Soal per Ujian Mandiri
export const DEFAULT_LATIHAN_SOAL = {
  'simak-ui': [
    {
      id: 'simak-ui-lat-1',
      title: 'Kemampuan Dasar',
      category: 'CORE MODULE',
      description: 'Matematika Dasar, Bahasa Indonesia, & Bahasa Inggris foundation.',
      icon: 'auto_stories',
      iconBgColor: '#0050cb',
      categoryColor: '#0050cb',
      buttonStyle: 'filled',
    },
    {
      id: 'simak-ui-lat-2',
      title: 'Kemampuan IPA',
      category: 'SAINTEK',
      description: 'Matematika IPA, Biologi, Fisika, & Kimia conceptual mastery.',
      icon: 'science',
      iconBgColor: '#1B4332',
      categoryColor: '#1B4332',
      buttonStyle: 'outline',
    },
    {
      id: 'simak-ui-lat-3',
      title: 'Kemampuan IPS',
      category: 'SOSHUM',
      description: 'Ekonomi, Sejarah, Geografi, & Sosiologi analytical studies.',
      icon: 'public',
      iconBgColor: '#765a00',
      categoryColor: '#765a00',
      buttonStyle: 'outline',
    },
    {
      id: 'simak-ui-lat-4',
      title: 'Esai Deskriptif',
      category: 'WRITING ASSESSMENT',
      description: 'Critical thinking and articulation practice for SIMAK UI.',
      icon: 'edit_note',
      iconBgColor: '#a33200',
      categoryColor: '#a33200',
      buttonStyle: 'filled',
    },
  ],
  'sm-itb': [
    {
      id: 'sm-itb-lat-1',
      title: 'Kemampuan Dasar',
      category: 'CORE MODULE',
      description: 'Matematika Dasar dan Bahasa Inggris.',
      icon: 'auto_stories',
      iconBgColor: '#0050cb',
      categoryColor: '#0050cb',
      buttonStyle: 'filled',
    },
    {
      id: 'sm-itb-lat-2',
      title: 'Kemampuan IPA',
      category: 'SAINTEK',
      description: 'Matematika IPA, Fisika, dan Kimia.',
      icon: 'science',
      iconBgColor: '#1B4332',
      categoryColor: '#1B4332',
      buttonStyle: 'outline',
    },
  ],
  'um-ugm': [
    {
      id: 'um-ugm-lat-1',
      title: 'Tes Potensi Akademik',
      category: 'TPA',
      description: 'Verbal, Numerik, dan Penalaran.',
      icon: 'psychology',
      iconBgColor: '#0050cb',
      categoryColor: '#0050cb',
      buttonStyle: 'filled',
    },
    {
      id: 'um-ugm-lat-2',
      title: 'Kemampuan Saintek',
      category: 'SAINTEK',
      description: 'Matematika IPA, Fisika, Kimia, Biologi.',
      icon: 'science',
      iconBgColor: '#1B4332',
      categoryColor: '#1B4332',
      buttonStyle: 'outline',
    },
    {
      id: 'um-ugm-lat-3',
      title: 'Kemampuan Soshum',
      category: 'SOSHUM',
      description: 'Ekonomi, Sejarah, Geografi, Sosiologi.',
      icon: 'public',
      iconBgColor: '#765a00',
      categoryColor: '#765a00',
      buttonStyle: 'outline',
    },
  ],
};

// Load/Save Tryout Packages
export function loadTryoutPackages() {
  try {
    const stored = localStorage.getItem(TRYOUT_KEY);
    if (stored) return { ...DEFAULT_TRYOUT_PACKAGES, ...JSON.parse(stored) };
  } catch (e) {
    console.error('Failed to load tryout packages', e);
  }
  return DEFAULT_TRYOUT_PACKAGES;
}

export function saveTryoutPackages(data) {
  try {
    localStorage.setItem(TRYOUT_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save tryout packages', e);
    return false;
  }
}

// Load/Save Latihan Soal
export function loadLatihanSoal() {
  try {
    const stored = localStorage.getItem(LATIHAN_KEY);
    if (stored) return { ...DEFAULT_LATIHAN_SOAL, ...JSON.parse(stored) };
  } catch (e) {
    console.error('Failed to load latihan soal', e);
  }
  return DEFAULT_LATIHAN_SOAL;
}

export function saveLatihanSoal(data) {
  try {
    localStorage.setItem(LATIHAN_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save latihan soal', e);
    return false;
  }
}

// Get tryout packages for specific ujian mandiri
export function getTryoutPackagesById(ujianId) {
  const all = loadTryoutPackages();
  return all[ujianId] || [];
}

// Get latihan soal for specific ujian mandiri
export function getLatihanSoalById(ujianId) {
  const all = loadLatihanSoal();
  return all[ujianId] || [];
}

// Get ujian mandiri by ID
export function getUjianMandiriById(id) {
  const items = loadUjianMandiri();
  return items.find(item => item.id === id) || null;
}
