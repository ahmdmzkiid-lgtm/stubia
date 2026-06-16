import React, { useState, useRef } from 'react';
import { uploadService } from '../services/api';
import toast from 'react-hot-toast';

export default function ImageUpload({ 
  value, 
  onChange, 
  folder = 'general',
  label = 'Gambar',
  placeholder = 'Upload gambar atau masukkan URL',
  aspectRatio = 'aspect-video',
  className = '',
}) {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState(value?.startsWith('http') ? 'url' : 'upload');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadService.uploadImage(file, folder);
      if (res.data?.success) {
        onChange(res.data.data.url);
        toast.success('Gambar berhasil diupload');
      }
    } catch (err) {
      toast.error('Gagal upload gambar');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (e) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-[13px] font-semibold text-[#424656]">{label}</label>
        <div className="flex gap-1 bg-[#f2f3ff] rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${mode === 'upload' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-[#424656]'}`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${mode === 'url' ? 'bg-white text-[#0050cb] shadow-sm' : 'text-[#424656]'}`}
          >
            URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors ${
            value ? 'border-green-400 bg-green-50/30' : 'border-[#c2c6d8] hover:border-[#0050cb] bg-[#f2f3ff]/30'
          } ${aspectRatio}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {value ? (
            <div className="absolute inset-0">
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="bg-white text-[#0050cb] px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  Ganti
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleClear(); }}
                  className="bg-white text-[#ba1a1a] px-3 py-2 rounded-lg text-[12px] font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Hapus
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              {uploading ? (
                <>
                  <span className="material-symbols-outlined text-[32px] text-[#0050cb] animate-spin">progress_activity</span>
                  <p className="text-[13px] font-medium text-[#424656] mt-2">Mengupload...</p>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[32px] text-[#727687]">cloud_upload</span>
                  <p className="text-[13px] font-bold text-[#424656] mt-2">Klik untuk upload</p>
                  <p className="text-[11px] text-[#727687]">PNG, JPG, WEBP (max 10MB)</p>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="url"
            value={value || ''}
            onChange={handleUrlChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl border border-[#c2c6d8]/40 focus:border-[#0050cb] focus:outline-none text-[14px]"
          />
          {value && (
            <div className={`relative rounded-xl overflow-hidden border border-[#c2c6d8]/30 ${aspectRatio}`}>
              <img 
                src={value} 
                alt="Preview" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 bg-white/90 text-[#ba1a1a] w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
