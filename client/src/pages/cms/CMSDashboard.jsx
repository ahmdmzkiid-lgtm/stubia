import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articleService, careerService } from '../../services/api';
import toast from 'react-hot-toast';

export default function CMSDashboard() {
  const [stats, setStats] = useState({
    articles: 0,
    publishedArticles: 0,
    careers: 0,
    activeCareers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch each independently so one failure doesn't break everything
        let articles = [];
        let careers = [];

        try {
          const articlesRes = await articleService.listAll();
          articles = articlesRes.data.data || [];
        } catch (err) {
          console.warn('Failed to fetch articles stats:', err);
        }

        try {
          const careersRes = await careerService.listAll();
          careers = careersRes.data.data || [];
        } catch (err) {
          console.warn('Failed to fetch careers stats:', err);
        }

        setStats({
          articles: articles.length,
          publishedArticles: articles.filter(a => a.is_published).length,
          careers: careers.length,
          activeCareers: careers.filter(c => c.is_active).length,
        });
      } catch (error) {
        console.error('Failed to fetch CMS stats:', error);
        toast.error('Gagal memuat statistik portal');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Artikel & Blog',
      description: 'Tulis dan publikasikan artikel, panduan, atau berita seputar UTBK.',
      path: '/cms/articles',
      count: stats.articles,
      subCountText: `${stats.publishedArticles} Diterbitkan`,
      icon: 'article',
      color: 'from-[#0050cb] to-[#00c1fd]',
      bgColor: 'bg-blue-50 text-[#0050cb]',
    },
    {
      title: 'Lowongan Kerja',
      description: 'Kelola informasi karir dan lowongan pekerjaan aktif di Stubia.',
      path: '/cms/careers',
      count: stats.careers,
      subCountText: `${stats.activeCareers} Aktif`,
      icon: 'work',
      color: 'from-[#8b5cf6] to-[#ec4899]',
      bgColor: 'bg-purple-50 text-[#8b5cf6]',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0050cb] to-[#0050cb]/80 p-8 text-white border border-[#0050cb]/10 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Portal Korporasi & HR
          </h1>
          <p className="text-white/80 text-[15px] leading-relaxed">
            Selamat datang di hub pengelolaan konten eksternal Stubia. Di sini Anda dapat memperbarui info karir, mempublikasikan artikel blog, dan mengelola konten publik lainnya.
          </p>
        </div>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div 
            key={card.path} 
            className="group bg-white rounded-3xl border border-[#c2c6d8]/40 p-6 flex flex-col justify-between hover:border-[#0050cb]/40 transition-all duration-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${card.bgColor} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-[24px]">{card.icon}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-[#191b24]">{card.count}</div>
                  <div className="text-[11px] text-[#727687] font-bold uppercase tracking-wider">{card.subCountText}</div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-[#191b24] group-hover:text-[#0050cb] transition-colors mb-2">{card.title}</h3>
              <p className="text-[#424656] text-sm leading-relaxed mb-6">{card.description}</p>
            </div>
            
            <Link 
              to={card.path}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#f2f3ff] hover:bg-[#0050cb] text-[13px] font-bold text-[#0050cb] hover:text-white transition-all"
            >
              <span>Buka Pengelola</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </Link>
          </div>
        ))}
      </div>

      {/* Info/Guide Section */}
      <div className="bg-white rounded-3xl border border-[#c2c6d8]/40 p-6">
        <h3 className="text-[16px] font-bold text-[#191b24] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#0050cb]">info</span>
          Panduan Penggunaan
        </h3>
        <ul className="space-y-3.5 text-[13.5px] text-[#424656] leading-relaxed">
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0050cb] mt-2 shrink-0"></span>
            <span>Semua data yang Anda buat atau edit di sini akan langsung direfleksikan ke halaman publik, seperti halaman <strong>Karir (/careers)</strong> dan halaman <strong>Blog</strong>.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0050cb] mt-2 shrink-0"></span>
            <span>Di bagian Lowongan Kerja, Anda dapat menambahkan posisi baru, mengaktifkan/nonaktifkan lowongan, serta melihat lamaran yang masuk dari calon pelamar.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0050cb] mt-2 shrink-0"></span>
            <span>Di bagian Artikel, simpan sebagai <strong>Draft (tidak diterbitkan)</strong> jika Anda masih ingin melakukan pratinjau sebelum mempublikasikannya secara resmi ke siswa.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
