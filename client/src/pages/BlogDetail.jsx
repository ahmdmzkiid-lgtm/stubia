import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageWrapper from '../components/layout/PageWrapper';
import Footer from '../components/Footer';
import { articleService } from '../services/api';
import toast from 'react-hot-toast';

export default function BlogDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentArticles, setRecentArticles] = useState([]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const res = await articleService.getBySlug(slug);
        setArticle(res.data.data);
      } catch (err) {
        console.error(err);
        toast.error('Gagal memuat detail artikel');
        navigate('/blog');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, navigate]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await articleService.list();
        const all = res.data.data || [];
        setRecentArticles(all.filter(a => a.slug !== slug).slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };
    fetchRecent();
  }, [slug]);

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateStr).toLocaleDateString('id-ID', options);
  };

  // Simple markdown compiler for public display
  const renderMarkdown = (md) => {
    if (!md) return '';
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-md font-bold text-[#191b24] mt-6 mb-2">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-[#191b24] mt-8 mb-3 border-b border-[#c2c6d8]/20 pb-2">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-2xl font-extrabold text-[#191b24] mt-10 mb-4">$1</h2>');
    
    // Bold & Italic
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-[#0050cb] underline hover:text-[#0050cb]/80" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Bullet lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="list-disc ml-6 mb-1.5 text-[#424656]">$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li class="list-disc ml-6 mb-1.5 text-[#424656]">$1</li>');
    
    // Paragraphs
    html = html.split('\n\n').map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<li') || p.trim().startsWith('<ul')) {
        return p;
      }
      return `<p class="mb-5 text-[#424656] leading-relaxed text-[15px]">${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return { __html: html };
  };

  const renderNavbar = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#c2c6d8]/30 h-[70px] flex items-center">
      <div className="flex justify-between items-center px-6 max-w-[1440px] mx-auto w-full">
        <div className="landing-logo cursor-pointer" onClick={() => navigate('/')}>
          <img
            src="/stubiabrandicon.png"
            alt="Stubia"
            className="h-10 w-auto"
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="text-[#424656] hover:text-[#0050cb] font-bold text-sm px-4 py-2 transition-colors" 
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button 
            className="bg-[#0050cb] hover:bg-[#003fa4] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-[#0050cb]/10" 
            onClick={() => navigate('/register')}
          >
            Daftar Gratis
          </button>
        </div>
      </div>
    </nav>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8ff]">
        <div className="w-10 h-10 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!article) return null;

  const mainContent = (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Article Content */}
      <article className="lg:col-span-8 space-y-8 bg-white border border-[#c2c6d8]/30 rounded-3xl p-6 md:p-10 shadow-sm">
        {/* Cover Image */}
        {(article.detail_image || article.cover_image) && (
          <div className={`${article.detail_image ? 'aspect-[4/3] sm:aspect-[2.4/1]' : 'aspect-video'} w-full rounded-2xl overflow-hidden shadow-sm bg-gray-50 border border-[#c2c6d8]/30`}>
            <img 
              src={article.detail_image || article.cover_image} 
              alt={article.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#191b24] leading-tight">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#727687] border-b border-[#c2c6d8]/20 pb-5">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span className="font-bold text-[#424656]">{article.author_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              <span>{formatDate(article.created_at)}</span>
            </div>
            {article.category && (
              <Link to="/blog" className="px-2.5 py-0.5 rounded-md bg-[#f2f3ff] text-[#0050cb] text-[10px] font-bold border border-[#0050cb]/10 hover:bg-[#0050cb] hover:text-white transition-colors">
                {article.category}
              </Link>
            )}
            {!article.is_published && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded text-[10px] font-bold">
                Draft Mode
              </span>
            )}
          </div>
        </div>

        {/* Excerpt */}
        {article.excerpt && (
          <p className="text-[#424656] text-[16px] leading-relaxed italic border-l-4 border-[#0050cb] pl-4">
            {article.excerpt}
          </p>
        )}

        {/* Main Content Rendered */}
        <div 
          className="prose max-w-none text-[#191b24]"
          dangerouslySetInnerHTML={renderMarkdown(article.content)}
        />

        {/* Back button */}
        <div className="pt-8 border-t border-[#c2c6d8]/20 mt-12 flex justify-between items-center">
          <Link 
            to="/blog" 
            className="text-[#0050cb] hover:text-[#0050cb]/80 font-bold text-sm flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Kembali ke Blog</span>
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/cms/articles"
              className="px-4 py-2 bg-[#f2f3ff] hover:bg-[#0050cb] text-[#0050cb] hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Edit Artikel (CMS)</span>
            </Link>
          )}
        </div>
      </article>

      {/* Right Column: Sidebar */}
      <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-[90px]">
        {/* Stubia CTA Banner */}
        <div className="bg-gradient-to-br from-[#0050cb] to-[#0050cb]/80 text-white rounded-3xl p-6 shadow-sm shadow-[#0050cb]/15 space-y-5">
          <h3 className="text-lg font-extrabold leading-snug">Siap Hadapi UTBK & Ujian Mandiri 2026?</h3>
          <p className="text-white/90 text-[11.5px] leading-relaxed">
            Dapatkan ribuan latihan soal premium, simulasi try out terupdate, dan bimbingan terstruktur bersama tutor terbaik Stubia!
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="w-full bg-white hover:bg-gray-100 text-[#0050cb] font-extrabold py-3 rounded-xl text-xs transition-all shadow-md"
          >
            Daftar Sekarang (Gratis)
          </button>
        </div>

        {/* Recent Articles Card */}
        {recentArticles.length > 0 && (
          <div className="bg-white border border-[#c2c6d8]/30 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-extrabold text-[#191b24] border-b border-[#c2c6d8]/20 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#0050cb]">rss_feed</span>
              Artikel Terbaru
            </h3>
            <div className="space-y-4">
              {recentArticles.map(art => (
                <Link key={art.id} to={`/blog/${art.slug}`} className="flex gap-3 group">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-[#c2c6d8]/20">
                    {art.cover_image ? (
                      <img src={art.cover_image} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-gray-100">
                        <span className="material-symbols-outlined text-[16px]">image</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-[12px] font-bold text-[#191b24] group-hover:text-[#0050cb] transition-colors line-clamp-2 leading-tight">
                      {art.title}
                    </h4>
                    <p className="text-[10px] text-[#727687]">{formatDate(art.created_at).split(' pukul')[0]}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      {user ? (
        <PageWrapper>
          <div className="max-w-[1280px] mx-auto w-full py-4 sm:py-6 animate-fade-in">
            {mainContent}
          </div>
        </PageWrapper>
      ) : (
        <div className="flex-1 flex flex-col">
          {renderNavbar()}
          
          {/* Main Content */}
          <div className="max-w-[1280px] mx-auto px-6 pt-[120px] pb-16 flex-1 w-full animate-fade-in">
            {mainContent}
          </div>

          <Footer />
        </div>
      )}
    </div>
  );
}
