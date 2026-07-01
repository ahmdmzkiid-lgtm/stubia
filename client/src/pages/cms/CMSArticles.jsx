import React, { useState, useEffect } from 'react';
import { articleService } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';
import toast from 'react-hot-toast';

export default function CMSArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, published, draft
  
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null); // null means adding new
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    cover_image: '',
    author_name: 'Admin Stubia',
    is_published: false,
    category: 'Umum',
    is_pinned: false,
    detail_image: ''
  });
  const [editorTab, setEditorTab] = useState('edit'); // edit, preview
  const [showGuide, setShowGuide] = useState(false);

  const insertMarkdown = (syntaxBefore, syntaxAfter = '') => {
    const textarea = document.getElementById('article-content-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = syntaxBefore + selected + syntaxAfter;

    setFormData(prev => ({
      ...prev,
      content: text.substring(0, start) + replacement + text.substring(end)
    }));

    // Refocus and place cursor back
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + syntaxBefore.length + selected.length + syntaxAfter.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await articleService.listAll();
      setArticles(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil daftar artikel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleOpenModal = (article = null) => {
    if (article) {
      setCurrentId(article.id);
      setFormData({
        title: article.title,
        content: article.content || '',
        excerpt: article.excerpt || '',
        cover_image: article.cover_image || '',
        author_name: article.author_name || 'Admin Stubia',
        is_published: article.is_published,
        category: article.category || 'Umum',
        is_pinned: article.is_pinned || false,
        detail_image: article.detail_image || ''
      });
    } else {
      setCurrentId(null);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        cover_image: '',
        author_name: 'Admin Stubia',
        is_published: false,
        category: 'Umum',
        is_pinned: false,
        detail_image: ''
      });
    }
    setEditorTab('edit');
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCoverImageChange = (url) => {
    setFormData(prev => ({
      ...prev,
      cover_image: url
    }));
  };

  const handleDetailImageChange = (url) => {
    setFormData(prev => ({
      ...prev,
      detail_image: url
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Judul dan Konten harus diisi!');
      return;
    }

    try {
      const payload = {
        ...formData,
        excerpt: formData.excerpt.trim() || formData.content.substring(0, 150) + '...'
      };

      if (currentId) {
        await articleService.update(currentId, payload);
        toast.success('Artikel berhasil diperbarui');
      } else {
        await articleService.create(payload);
        toast.success('Artikel berhasil dibuat');
      }
      handleCloseModal();
      fetchArticles();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan artikel');
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus artikel "${title}"?`)) {
      try {
        await articleService.delete(id);
        toast.success('Artikel berhasil dihapus');
        fetchArticles();
      } catch (err) {
        console.error(err);
        toast.error('Gagal menghapus artikel');
      }
    }
  };

  const handleTogglePublish = async (article) => {
    try {
      await articleService.update(article.id, {
        is_published: !article.is_published
      });
      toast.success(article.is_published ? 'Artikel diubah menjadi Draft' : 'Artikel berhasil Diterbitkan');
      fetchArticles();
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengubah status publikasi');
    }
  };

  // Basic markdown compiler for Preview tab
  const renderMarkdown = (md) => {
    if (!md) return '';
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-md font-bold text-gray-900 mt-4 mb-2">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-gray-900 mt-6 mb-3">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-4">$1</h2>');
    
    // Bold & Italic
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-[#0050cb] underline hover:text-[#0050cb]/80" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Bullet lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="list-disc ml-5 mb-1 text-gray-700">$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li class="list-disc ml-5 mb-1 text-gray-700">$1</li>');
    
    // Paragraphs
    html = html.split('\n\n').map(p => {
      if (p.trim().startsWith('<h') || p.trim().startsWith('<li') || p.trim().startsWith('<ul')) {
        return p;
      }
      return `<p class="mb-4 text-gray-700 leading-relaxed">${p.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return { __html: html };
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase()) || 
                          (article.excerpt && article.excerpt.toLowerCase().includes(search.toLowerCase()));
    
    if (statusFilter === 'published') {
      return matchesSearch && article.is_published;
    }
    if (statusFilter === 'draft') {
      return matchesSearch && !article.is_published;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#191b24]">Artikel & Blog</h1>
          <p className="text-[#424656] text-sm">Kelola postingan, panduan, dan pengumuman untuk siswa.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0050cb] hover:bg-[#0050cb]/95 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Tulis Artikel</span>
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white rounded-3xl border border-[#c2c6d8]/40 p-4 flex flex-col md:flex-row gap-4 items-center">
        
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#727687] text-[20px]">search</span>
          <input
            type="text"
            placeholder="Cari berdasarkan judul atau cuplikan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24] placeholder-slate-400 transition-colors"
          />
        </div>

        {/* Tabs for Filter */}
        <div className="flex gap-1.5 p-1 bg-[#f2f3ff] border border-[#c2c6d8]/30 rounded-xl w-full md:w-auto">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'published', label: 'Diterbitkan' },
            { id: 'draft', label: 'Draft' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === tab.id 
                  ? 'bg-white text-[#0050cb] border border-[#c2c6d8]/20 shadow-sm' 
                  : 'text-[#424656] hover:text-[#0050cb]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="w-8 h-8 border-3 border-[#0050cb] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white border border-[#c2c6d8]/40 rounded-3xl py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-slate-400 mb-3">auto_stories</span>
          <h3 className="text-[#191b24] font-bold text-lg">Belum Ada Artikel</h3>
          <p className="text-[#727687] text-sm max-w-sm mx-auto mt-1">Tidak ditemukan artikel yang cocok dengan filter atau kata kunci Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map(article => (
            <div 
              key={article.id} 
              className="bg-white border border-[#c2c6d8]/40 rounded-3xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
            >
              <div>
                {/* Cover Image */}
                <div className="aspect-video bg-gray-50 relative overflow-hidden">
                  {article.cover_image ? (
                    <img 
                      src={article.cover_image} 
                      alt={article.title} 
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-slate-400">
                      <span className="material-symbols-outlined text-[40px]">image</span>
                    </div>
                  )}
                  
                  {/* Publish Status Badge */}
                  <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                    article.is_published 
                      ? 'bg-green-50 text-green-700 border-green-200/50' 
                      : 'bg-amber-50 text-amber-700 border-amber-200/50'
                  }`}>
                    {article.is_published ? 'Diterbitkan' : 'Draft'}
                  </span>
                </div>

                {/* Article Info */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-[#727687] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      {article.author_name}
                    </span>
                    {article.category && (
                      <span className="px-2 py-0.5 rounded-md bg-[#f2f3ff] text-[#0050cb] text-[10px] font-bold border border-[#c2c6d8]/20">
                        {article.category}
                      </span>
                    )}
                    {article.is_pinned && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200/50 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">push_pin</span>
                        Pinned
                      </span>
                    )}
                  </div>
                  <h3 className="text-[16px] font-bold text-[#191b24] leading-snug line-clamp-2 group-hover:text-[#0050cb] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-[#424656] text-[13px] leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 pb-5 pt-3 border-t border-[#c2c6d8]/20 flex items-center justify-between">
                <button
                  onClick={() => handleTogglePublish(article)}
                  className={`text-[12px] font-bold flex items-center gap-1.5 transition-colors ${
                    article.is_published ? 'text-amber-600 hover:text-amber-500' : 'text-green-600 hover:text-green-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {article.is_published ? 'unpublished' : 'publish'}
                  </span>
                  <span>{article.is_published ? 'Jadikan Draft' : 'Terbitkan'}</span>
                </button>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenModal(article)}
                    className="w-8 h-8 rounded-lg bg-[#f2f3ff] hover:bg-[#0050cb] text-[#0050cb] hover:text-white flex items-center justify-center transition-colors"
                    title="Edit Artikel"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(article.id, article.title)}
                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-[#ba1a1a] text-[#ba1a1a] hover:text-white flex items-center justify-center transition-colors"
                    title="Hapus Artikel"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Form Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal}></div>
          
          <div className="bg-white border border-[#c2c6d8] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-zoomIn shadow-2xl">
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-[#c2c6d8]/40 flex justify-between items-center bg-[#f2f3ff]/40">
              <h2 className="text-[17px] font-bold text-[#191b24]">
                {currentId ? 'Edit Artikel' : 'Tulis Artikel Baru'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f2f3ff] text-[#424656] hover:text-[#0050cb] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
              
              <div className="p-4 sm:p-6 space-y-6 flex-1">
                
                {/* Image & Title grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left Column - Image Upload */}
                  <div className="md:col-span-1 space-y-4">
                    <div>
                      <ImageUpload
                        value={formData.cover_image}
                        onChange={handleCoverImageChange}
                        folder="articles"
                        label="Gambar Sampul List"
                        aspectRatio="aspect-video"
                      />
                      <p className="text-[11px] text-[#727687] mt-1 leading-normal">
                        Rasio 16:9 / Landscape (disarankan 800x450px) untuk kartu daftar artikel (Blog List).
                      </p>
                    </div>

                    <div>
                      <ImageUpload
                        value={formData.detail_image}
                        onChange={handleDetailImageChange}
                        folder="articles"
                        label="Gambar Sampul Detail"
                        aspectRatio="aspect-[21/9]"
                      />
                      <p className="text-[11px] text-[#727687] mt-1 leading-normal">
                        Rasio Lebar Banner (disarankan 1200x500px) untuk header baca artikel (Blog Detail).
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Title & Metadata */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Judul Artikel</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Contoh: Tips Lulus SNBT 2026 dengan Mudah!"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24] placeholder-slate-400"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Penulis</label>
                        <input
                          type="text"
                          name="author_name"
                          value={formData.author_name}
                          onChange={handleChange}
                          placeholder="Nama penulis"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24] placeholder-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Kategori</label>
                        <input
                          type="text"
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          placeholder="Contoh: Tips UTBK, Pengumuman, Panduan"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[14px] text-[#191b24] placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 pl-1 pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="is_published"
                          checked={formData.is_published}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-[#c2c6d8] bg-white text-[#0050cb] focus:ring-0"
                        />
                        <span className="text-[13px] font-semibold text-[#424656]">Terbitkan langsung</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="is_pinned"
                          checked={formData.is_pinned}
                          onChange={handleChange}
                          className="w-4 h-4 rounded border-[#c2c6d8] bg-white text-amber-600 focus:ring-0"
                        />
                        <span className="text-[13px] font-semibold text-[#424656] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-amber-600">push_pin</span>
                          Pin artikel ini
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-[#727687] mb-1.5">Ringkasan / Excerpt</label>
                      <textarea
                        name="excerpt"
                        value={formData.excerpt}
                        onChange={handleChange}
                        placeholder="Cuplikan singkat artikel..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13px] text-[#191b24] placeholder-slate-400 resize-none"
                      />
                    </div>
                  </div>

                </div>

                {/* Editor Content Section */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#c2c6d8]/40 pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-[13px] font-bold text-[#727687]">Isi Konten (Format Markdown)</label>
                      <button
                        type="button"
                        onClick={() => setShowGuide(!showGuide)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f2f3ff] hover:bg-[#0050cb] text-[#0050cb] hover:text-white text-xs font-bold transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">help</span>
                        <span>{showGuide ? 'Tutup Panduan' : 'Lihat Panduan'}</span>
                      </button>
                    </div>
                    
                    {/* Tabs for Editor vs Preview */}
                    <div className="flex gap-1 p-0.5 bg-[#f2f3ff] border border-[#c2c6d8]/20 rounded-lg self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setEditorTab('edit')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${editorTab === 'edit' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-[#424656]'}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorTab('preview')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${editorTab === 'preview' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-[#424656]'}`}
                      >
                        Pratinjau
                      </button>
                    </div>
                  </div>

                  {/* Formatting Cheat Sheet Guide */}
                  {showGuide && (
                    <div className="bg-[#f2f3ff]/40 border border-[#c2c6d8]/40 rounded-2xl p-4 text-[12.5px] text-[#424656] space-y-3 animate-fadeIn">
                      <h4 className="font-bold text-[#191b24] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-[#0050cb]">info</span>
                        Panduan Cepat Menulis Artikel
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-white border border-[#c2c6d8]/20 p-2.5 rounded-xl">
                          <p className="font-bold text-[#191b24] mb-1">Judul Utama / Heading 2</p>
                          <code className="text-[#0050cb] bg-[#f2f3ff] px-1.5 py-0.5 rounded">## Judul Anda</code>
                          <p className="text-slate-450 text-[11px] mt-1">Gunakan ## di awal baris untuk sub-judul.</p>
                        </div>
                        <div className="bg-white border border-[#c2c6d8]/20 p-2.5 rounded-xl">
                          <p className="font-bold text-[#191b24] mb-1">Sub-judul / Heading 3</p>
                          <code className="text-[#0050cb] bg-[#f2f3ff] px-1.5 py-0.5 rounded">### Sub-judul Anda</code>
                          <p className="text-slate-450 text-[11px] mt-1">Gunakan ### untuk sub-judul tingkat kedua.</p>
                        </div>
                        <div className="bg-white border border-[#c2c6d8]/20 p-2.5 rounded-xl">
                          <p className="font-bold text-[#191b24] mb-1">Format Teks</p>
                          <code className="text-[#0050cb] bg-[#f2f3ff] px-1.5 py-0.5 rounded">**Tebal**</code> atau <code className="text-[#0050cb] bg-[#f2f3ff] px-1.5 py-0.5 rounded">*Miring*</code>
                          <p className="text-slate-450 text-[11px] mt-1">Bungkus kata dengan ** untuk tebal, atau * untuk miring.</p>
                        </div>
                        <div className="bg-white border border-[#c2c6d8]/20 p-2.5 rounded-xl">
                          <p className="font-bold text-[#191b24] mb-1">Daftar Poin (List)</p>
                          <code className="text-[#0050cb] bg-[#f2f3ff] px-1.5 py-0.5 rounded">- Item daftar</code>
                          <p className="text-slate-450 text-[11px] mt-1">Gunakan tanda minus (-) diikuti spasi di awal baris.</p>
                        </div>
                        <div className="bg-white border border-[#c2c6d8]/20 p-2.5 rounded-xl">
                          <p className="font-bold text-[#191b24] mb-1">Membuat Link (Tautan)</p>
                          <code className="text-[#0050cb] bg-[#f2f3ff] px-1.5 py-0.5 rounded">[Nama Link](https://...)</code>
                          <p className="text-slate-450 text-[11px] mt-1">Bungkus nama tautan dalam [ ] dan alamat web dalam ( ).</p>
                        </div>
                        <div className="bg-white border border-[#c2c6d8]/20 p-2.5 rounded-xl">
                          <p className="font-bold text-[#191b24] mb-1">Menyisipkan Gambar</p>
                          <code className="text-[#0050cb] bg-[#f2f3ff] px-1.5 py-0.5 rounded">![Nama](https://...)</code>
                          <p className="text-slate-450 text-[11px] mt-1">Mirip link, tapi diawali tanda seru (!).</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Formatting Toolbar */}
                  {editorTab === 'edit' && (
                    <div className="flex flex-wrap gap-1 p-1.5 bg-[#f2f3ff]/60 border border-[#c2c6d8]/30 rounded-xl">
                      <button
                        type="button"
                        onClick={() => insertMarkdown('## ')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#c2c6d8]/40 hover:bg-[#f2f3ff] hover:text-[#0050cb] text-xs font-bold transition-all"
                        title="Tambah Sub-judul Utama"
                      >
                        H2 (Judul)
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('### ')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#c2c6d8]/40 hover:bg-[#f2f3ff] hover:text-[#0050cb] text-xs font-bold transition-all"
                        title="Tambah Sub-judul Kecil"
                      >
                        H3 (Sub-judul)
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('**', '**')}
                        className="w-8 h-8 rounded-lg bg-white border border-[#c2c6d8]/40 hover:bg-[#f2f3ff] hover:text-[#0050cb] flex items-center justify-center font-bold text-sm transition-all"
                        title="Tebal (Bold)"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('*', '*')}
                        className="w-8 h-8 rounded-lg bg-white border border-[#c2c6d8]/40 hover:bg-[#f2f3ff] hover:text-[#0050cb] flex items-center justify-center italic font-semibold text-sm transition-all"
                        title="Miring (Italic)"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('- ')}
                        className="w-8 h-8 rounded-lg bg-white border border-[#c2c6d8]/40 hover:bg-[#f2f3ff] hover:text-[#0050cb] flex items-center justify-center transition-all"
                        title="Daftar List"
                      >
                        <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('[', '](https://)')}
                        className="w-8 h-8 rounded-lg bg-white border border-[#c2c6d8]/40 hover:bg-[#f2f3ff] hover:text-[#0050cb] flex items-center justify-center transition-all"
                        title="Tambah Link"
                      >
                        <span className="material-symbols-outlined text-[18px]">link</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('![Deskripsi Gambar](', ')')}
                        className="w-8 h-8 rounded-lg bg-white border border-[#c2c6d8]/40 hover:bg-[#f2f3ff] hover:text-[#0050cb] flex items-center justify-center transition-all"
                        title="Tambah Gambar"
                      >
                        <span className="material-symbols-outlined text-[18px]">image</span>
                      </button>
                    </div>
                  )}

                  {editorTab === 'edit' ? (
                    <textarea
                      id="article-content-editor"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="Tulis artikel Anda menggunakan sintaks Markdown di sini..."
                      rows={10}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#c2c6d8] focus:border-[#0050cb] focus:outline-none text-[13.5px] font-mono text-[#191b24] placeholder-slate-400 resize-y min-h-[220px]"
                      required
                    />
                  ) : (
                    <div 
                      className="w-full p-5 rounded-xl border border-[#c2c6d8] bg-gray-50 overflow-y-auto min-h-[220px] max-h-[300px]"
                      dangerouslySetInnerHTML={renderMarkdown(formData.content)}
                    />
                  )}
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="px-4 sm:px-6 py-4 border-t border-[#c2c6d8]/40 bg-[#f2f3ff]/40 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-xl bg-white border border-[#c2c6d8] hover:bg-gray-50 text-[#424656] font-semibold text-sm transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0050cb] hover:bg-[#0050cb]/95 text-white font-semibold text-sm shadow-sm transition-all"
                >
                  Simpan Artikel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
