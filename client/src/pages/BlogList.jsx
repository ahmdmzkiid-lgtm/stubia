import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';
import Footer from '../components/Footer';
import { articleService } from '../services/api';
import toast from 'react-hot-toast';

const ARTICLES_PER_PAGE = 6;

export default function BlogList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [articlesRes, categoriesRes] = await Promise.all([
          articleService.list(),
          articleService.categories()
        ]);
        setArticles(articlesRes.data.data || []);
        setCategories(categoriesRes.data.data || []);
      } catch (err) {
        console.error(err);
        toast.error('Gagal memuat artikel blog');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('id-ID', options);
  };

  // Separate pinned articles
  const pinnedArticles = articles.filter(a => a.is_pinned);

  // Filter non-pinned articles by category
  const filteredArticles = articles
    .filter(a => !a.is_pinned)
    .filter(a => activeCategory === 'Semua' || a.category === activeCategory);

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  const renderNavbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#c2c6d8]/30 h-[70px] flex items-center">
      <div className="flex justify-between items-center px-6 max-w-[1440px] mx-auto w-full">
        <div className="landing-logo cursor-pointer" onClick={() => navigate('/')}>
          <img src="/stubiabrandicon.png" alt="Stubia" className="h-10 w-auto" />
        </div>
        <div className="flex items-center gap-3">
          <button className="text-[#424656] hover:text-[#0050cb] font-bold text-sm px-4 py-2 transition-colors" onClick={() => navigate('/login')}>Login</button>
          <button className="bg-[#0050cb] hover:bg-[#003fa4] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-[#0050cb]/10" onClick={() => navigate('/register')}>Daftar Gratis</button>
        </div>
      </div>
    </nav>
  );

  const renderArticleCard = (article, variant = 'default') => {
    const isLarge = variant === 'large';
    
    return (
      <Link
        to={`/blog/${article.slug}`}
        key={article.id}
        className={`bg-white border border-[#c2c6d8]/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex group ${isLarge ? 'flex-col md:flex-row' : 'flex-col'}`}
      >
        {/* Cover Image */}
        <div className={`bg-gray-50 relative overflow-hidden ${isLarge ? 'md:w-1/2 aspect-[4/3] md:aspect-auto min-h-[220px]' : 'aspect-video'}`}>
          {article.cover_image ? (
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <span className="material-symbols-outlined text-[48px]">image</span>
            </div>
          )}
          {article.is_pinned && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
              <span className="material-symbols-outlined text-[13px]">push_pin</span>
              Pinned
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className={`p-5 flex flex-col justify-between flex-1 ${isLarge ? 'md:p-7' : ''}`}>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              {article.category && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#f2f3ff] text-[#0050cb] text-[10px] font-bold border border-[#0050cb]/10">
                  {article.category}
                </span>
              )}
              <span className="text-[11px] text-[#727687]">{formatDate(article.created_at)}</span>
            </div>
            <h3 className={`font-bold text-[#191b24] leading-snug group-hover:text-[#0050cb] transition-colors ${isLarge ? 'text-xl md:text-2xl line-clamp-3' : 'text-[15px] line-clamp-2'}`}>
              {article.title}
            </h3>
            <p className={`text-[#424656] leading-relaxed ${isLarge ? 'text-sm line-clamp-4' : 'text-[13px] line-clamp-3'}`}>
              {article.excerpt}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#c2c6d8]/20">
            <span className="text-[11px] font-semibold text-[#424656] flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#727687]">person</span>
              {article.author_name}
            </span>
            <span className="text-[#0050cb] text-xs font-bold flex items-center gap-0.5 group-hover:gap-1 transition-all">
              Baca <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </span>
          </div>
        </div>
      </Link>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-1.5 mt-12">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#424656] hover:bg-[#f2f3ff] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {start > 1 && (
          <>
            <button onClick={() => setCurrentPage(1)} className="w-9 h-9 rounded-lg text-sm font-semibold text-[#424656] hover:bg-[#f2f3ff] transition-colors">1</button>
            {start > 2 && <span className="text-[#727687] text-sm px-1">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
              currentPage === page
                ? 'bg-[#0050cb] text-white shadow-sm shadow-[#0050cb]/20'
                : 'text-[#424656] hover:bg-[#f2f3ff]'
            }`}
          >
            {page}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="text-[#727687] text-sm px-1">...</span>}
            <button onClick={() => setCurrentPage(totalPages)} className="w-9 h-9 rounded-lg text-sm font-semibold text-[#424656] hover:bg-[#f2f3ff] transition-colors">{totalPages}</button>
          </>
        )}

        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#424656] hover:bg-[#f2f3ff] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    );
  };

  const mainContent = (
    <div className="space-y-10">

      {/* ── Pinned Articles Section ── */}
      {!loading && pinnedArticles.length > 0 && (
        <section className="space-y-5">
          {pinnedArticles.map(article =>
            renderArticleCard(article, 'large')
          )}
        </section>
      )}

      {/* ── Category Tabs ── */}
      <section>
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {['Semua', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                activeCategory === cat
                  ? 'bg-[#0050cb] text-white border-[#0050cb] shadow-sm shadow-[#0050cb]/15'
                  : 'bg-white text-[#424656] border-[#c2c6d8]/50 hover:border-[#0050cb]/30 hover:text-[#0050cb]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ── Article List ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : paginatedArticles.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-[#c2c6d8]/35 shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-[#c2c6d8] mb-3">auto_stories</span>
          <h3 className="text-[#191b24] font-bold text-lg">Belum ada artikel</h3>
          <p className="text-[#727687] text-sm mt-1 max-w-xs mx-auto">
            {activeCategory !== 'Semua'
              ? `Tidak ada artikel dalam kategori "${activeCategory}" saat ini.`
              : 'Belum ada artikel yang dipublikasikan.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedArticles.map(article => renderArticleCard(article))}
          </div>

          {/* Pagination */}
          {renderPagination()}
        </>
      )}

      {/* Back button */}
      <div className="pt-6 border-t border-[#c2c6d8]/30">
        <Link
          to={user ? "/dashboard" : "/"}
          className="text-[#0050cb] hover:text-[#0050cb]/80 font-bold text-sm flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>{user ? "Kembali ke Dashboard" : "Kembali ke Beranda"}</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      {user ? (
        <PageWrapper>
          <div className="max-w-[1280px] mx-auto w-full py-4 sm:py-6 animate-fade-in">
            <h1 className="text-3xl font-extrabold text-[#191b24] mb-2">Blog Stubia</h1>
            <p className="text-[#424656] text-sm mb-8">Artikel, panduan UTBK, dan pengumuman terbaru seputar seleksi PTN</p>
            {mainContent}
          </div>
        </PageWrapper>
      ) : (
        <div className="flex-1 flex flex-col">
          {renderNavbar()}

          {/* Header Title Section */}
          <div className="bg-gradient-to-b from-[#f2f3ff] to-[#faf8ff] pt-[120px] pb-12 border-b border-[#c2c6d8]/20 px-6">
            <div className="max-w-[1280px] mx-auto w-full">
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#191b24] mb-4">
                Blog & Informasi Stubia
              </h1>
              <p className="text-[#424656] text-base md:text-lg max-w-2xl leading-relaxed">
                Dapatkan artikel, panduan UTBK, dan pengumuman terbaru seputar seleksi PTN
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-[1280px] mx-auto px-6 py-12 flex-1 w-full animate-fade-in">
            {mainContent}
          </div>

          <Footer />
        </div>
      )}
    </div>
  );
}
