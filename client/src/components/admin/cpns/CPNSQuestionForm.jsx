import React, { useState, useEffect } from 'react';
import MathText from '../../MathText';
import toast from 'react-hot-toast';

export default function CPNSQuestionForm({ initialData = null, onSave, onCancel, categories = ['TWK', 'TIU', 'TKP'] }) {
  const [formData, setFormData] = useState({
    category: 'TWK',
    topic: '',
    difficulty: 'medium',
    stimulus: '',
    content: '',
    image_url: '',
    image_position: 'middle', // 'top' (atas), 'middle' (tengah), 'bottom' (bawah)
    choices: [
      { label: 'A', content: '', is_correct: true, tkp_point: 5, explanation: '' },
      { label: 'B', content: '', is_correct: false, tkp_point: 4, explanation: '' },
      { label: 'C', content: '', is_correct: false, tkp_point: 3, explanation: '' },
      { label: 'D', content: '', is_correct: false, tkp_point: 2, explanation: '' },
      { label: 'E', content: '', is_correct: false, tkp_point: 1, explanation: '' },
    ],
    explanation: '',
    explanation_image_url: '',
  });

  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [activeTargetField, setActiveTargetField] = useState('content'); // for formatting helpers

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category || initialData.subject_name || 'TWK',
        topic: initialData.topic || initialData.topic_name || '',
        difficulty: initialData.difficulty || 'medium',
        stimulus: initialData.stimulus || '',
        content: initialData.content || initialData.question_text || '',
        image_url: initialData.image_url || '',
        image_position: initialData.image_position || 'middle',
        choices: initialData.choices && initialData.choices.length === 5 
          ? initialData.choices.map((c, i) => ({
              label: c.label || String.fromCharCode(65 + i),
              content: c.content || c.choice_text || '',
              is_correct: !!c.is_correct,
              tkp_point: c.tkp_point !== undefined ? Number(c.tkp_point) : (5 - i),
              explanation: c.explanation || '',
            }))
          : [
              { label: 'A', content: '', is_correct: true, tkp_point: 5, explanation: '' },
              { label: 'B', content: '', is_correct: false, tkp_point: 4, explanation: '' },
              { label: 'C', content: '', is_correct: false, tkp_point: 3, explanation: '' },
              { label: 'D', content: '', is_correct: false, tkp_point: 2, explanation: '' },
              { label: 'E', content: '', is_correct: false, tkp_point: 1, explanation: '' },
            ],
        explanation: initialData.explanation || '',
        explanation_image_url: initialData.explanation_image_url || '',
      });
    }
  }, [initialData]);

  // Handle choice content change
  const handleChoiceChange = (index, field, value) => {
    const updatedChoices = [...formData.choices];
    updatedChoices[index] = {
      ...updatedChoices[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, choices: updatedChoices }));
  };

  // Handle TWK/TIU correct choice selection (1 choice correct)
  const handleCorrectChoiceSelect = (index) => {
    const updatedChoices = formData.choices.map((c, i) => ({
      ...c,
      is_correct: i === index,
      // For TWK/TIU: correct gets 5, others get 0
      tkp_point: i === index ? 5 : 0
    }));
    setFormData(prev => ({ ...prev, choices: updatedChoices }));
  };

  // Quick preset for TKP scores (5, 4, 3, 2, 1)
  const handleApplyTKPDefaultScores = () => {
    const defaultScores = [5, 4, 3, 2, 1];
    const updatedChoices = formData.choices.map((c, i) => ({
      ...c,
      tkp_point: defaultScores[i] || 1,
      is_correct: defaultScores[i] === 5
    }));
    setFormData(prev => ({ ...prev, choices: updatedChoices }));
    toast.success('Bobot skor default TKP (5, 4, 3, 2, 1) telah diterapkan');
  };

  // Helper text insertion (Bold, Italic, Math, List)
  const insertFormatting = (tagStart, tagEnd = '') => {
    const field = activeTargetField;
    const currentVal = formData[field] || '';
    const newVal = currentVal + `${tagStart}${tagEnd}`;
    setFormData(prev => ({ ...prev, [field]: newVal }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      toast.error('Teks Soal tidak boleh kosong!');
      return;
    }

    // Validate choices
    const emptyChoices = formData.choices.filter(c => !c.content.trim());
    if (emptyChoices.length > 0) {
      toast.error('Semua opsi jawaban (A, B, C, D, E) wajib diisi!');
      return;
    }

    // Validation based on category
    if (formData.category === 'TKP') {
      const invalidScores = formData.choices.some(c => c.tkp_point < 1 || c.tkp_point > 5);
      if (invalidScores) {
        toast.error('Skor TKP harus bernilai antara 1 sampai 5 untuk setiap opsi!');
        return;
      }
    } else {
      // TWK / TIU: check 1 correct key selected
      const hasCorrect = formData.choices.some(c => c.is_correct);
      if (!hasCorrect) {
        toast.error('Pilih 1 kunci jawaban yang benar untuk kategori ' + formData.category);
        return;
      }
    }

    onSave && onSave(formData);
  };

  return (
    <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-5xl mx-auto my-4 transition-all">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
              {initialData ? 'Edit Soal' : 'Form Input Soal CPNS'}
            </span>
            <span className="bg-amber-400 text-slate-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
              SKD CPNS
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1 text-white">
            {initialData ? 'Perbarui Soal Tryout CPNS' : 'Buat Soal Tryout CPNS Baru'}
          </h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Mendukung Kategori TWK, TIU, TKP, Posisi Gambar UTBK-style, serta Format Kunci Jawaban & Bobot.
          </p>
        </div>

        {/* Tab Selector (Editor vs Live Preview) */}
        <div className="flex bg-white/15 p-1 rounded-xl backdrop-blur-md border border-white/20">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
            Form Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">visibility</span>
            Live Preview Soal
          </button>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Kategori & Meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Kategori Subtes <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  setFormData(prev => {
                    const isTKP = newCat === 'TKP';
                    const updatedChoices = prev.choices.map((c, i) => ({
                      ...c,
                      is_correct: isTKP ? false : (i === 0),
                      tkp_point: isTKP ? (5 - i) : (i === 0 ? 5 : 0)
                    }));
                    return {
                      ...prev,
                      category: newCat,
                      choices: updatedChoices
                    };
                  });
                }}
                className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} - {cat === 'TWK' ? 'Tes Wawasan Kebangsaan' : cat === 'TIU' ? 'Tes Inteligensia Umum' : 'Tes Karakteristik Pribadi'}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Materi / Topik Soal
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="Contoh: Pancasila, Silogisme, Integritas"
                className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Tingkat Kesulitan
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="easy">Mudah (Easy)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="hard">HOTS / Sulit (Hard)</option>
              </select>
            </div>
          </div>

          {/* Quick Toolbar for Formatting */}
          <div className="flex flex-wrap items-center justify-between bg-blue-50 dark:bg-slate-800 p-2.5 rounded-xl border border-blue-100 dark:border-slate-700 gap-2">
            <div className="flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300 font-semibold">
              <span className="material-symbols-outlined text-sm">construction</span>
              Toolbar Format Teks:
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-600 text-xs font-bold rounded shadow-xs"
                title="Teks Tebal"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-600 text-xs italic font-serif rounded shadow-xs"
                title="Teks Miring"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('__u__', '__u__')}
                className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-600 text-xs underline rounded shadow-xs"
                title="Garis Bawah"
              >
                U
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('$', '$')}
                className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-mono font-bold rounded shadow-xs"
                title="Formula Matematika (KaTeX)"
              >
                $Formula$
              </button>
            </div>
          </div>

          {/* Section 2: Stimulus & Soal */}
          <div className="space-y-4">
            {/* Stimulus / Bacaan */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Stimulus / Wacana / Bacaan (Opsional)
              </label>
              <textarea
                rows={2}
                value={formData.stimulus}
                onFocus={() => setActiveTargetField('stimulus')}
                onChange={(e) => setFormData(prev => ({ ...prev, stimulus: e.target.value }))}
                placeholder="Teks wacana, cerita, paragraf stimulus atau tabel konteks..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Main Question Content */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Teks Soal / Pertanyaan Utama <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.content}
                onFocus={() => setActiveTargetField('content')}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Tuliskan pertanyaan atau isi soal di sini... (Mendukung rumus $x^2$ & format bold **teks**)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
              />
            </div>
          </div>

          {/* Section 3: Gambar & Posisi Gambar (UTBK/CPNS Style) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-blue-600">image</span>
                Media Gambar & Posisi Layout
              </span>
              <span className="text-xs text-slate-500">Mendukung format PNG, JPG, WebP, SVG</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  URL Gambar Soal
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="https://domain.com/gambar-soal.png"
                  className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Posisi Gambar Buttons: Atas, Tengah, Bawah */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Posisi Gambar Pada Layar Ujian
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image_position: 'top' }))}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center transition-all ${
                      formData.image_position === 'top'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold">Atas</span>
                    <span className="text-[9px] opacity-80">(Di atas Stimulus)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image_position: 'middle' }))}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center transition-all ${
                      formData.image_position === 'middle'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold">Tengah</span>
                    <span className="text-[9px] opacity-80">(Antara Stimulus & Soal)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image_position: 'bottom' }))}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center transition-all ${
                      formData.image_position === 'bottom'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold">Bawah</span>
                    <span className="text-[9px] opacity-80">(Di bawah Soal)</span>
                  </button>
                </div>
              </div>
            </div>

            {formData.image_url && (
              <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <img
                  src={formData.image_url}
                  alt="Preview Soal"
                  className="max-h-20 max-w-xs object-contain rounded border border-slate-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    toast.error('Gagal memuat URL gambar');
                  }}
                />
                <div className="text-xs text-slate-500">
                  Preview Gambar (Posisi: <strong className="uppercase">{formData.image_position}</strong>)
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Input Pilihan Jawaban A, B, C, D, E & Logika Kunci */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-lg">format_list_bulleted</span>
                  Pilihan Jawaban (5 Opsi A - E)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formData.category === 'TKP'
                    ? 'Mode TKP: Masukkan bobot skor (1-5) untuk masing-masing opsi pilihan A, B, C, D, E.'
                    : `Mode ${formData.category}: Pilih 1 opsi sebagai kunci jawaban benar (Skor 5).`}
                </p>
              </div>

              {formData.category === 'TKP' && (
                <button
                  type="button"
                  onClick={handleApplyTKPDefaultScores}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                  Set Default TKP (5, 4, 3, 2, 1)
                </button>
              )}
            </div>

            <div className="space-y-3">
              {formData.choices.map((choice, index) => (
                <div
                  key={choice.label}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center gap-3 ${
                    formData.category !== 'TKP' && choice.is_correct
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-600 ring-1 ring-emerald-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {/* Option Label & Key Radio / Point Input */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-sm flex items-center justify-center border border-slate-300 dark:border-slate-700">
                      {choice.label}
                    </span>

                    {/* Radio Button for TWK/TIU */}
                    {formData.category !== 'TKP' ? (
                      <label className="flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <input
                          type="radio"
                          name="correct_choice"
                          checked={choice.is_correct}
                          onChange={() => handleCorrectChoiceSelect(index)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className={`text-xs font-bold ${choice.is_correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                          {choice.is_correct ? 'Kunci Benar (Skor 5)' : 'Salah (Skor 0)'}
                        </span>
                      </label>
                    ) : (
                      /* Number Score Input for TKP (1-5) */
                      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-200 dark:border-amber-900/60">
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Skor TKP:</span>
                        <select
                          value={choice.tkp_point}
                          onChange={(e) => handleChoiceChange(index, 'tkp_point', parseInt(e.target.value, 10))}
                          className="px-2 py-1 bg-white dark:bg-slate-900 text-xs font-bold border border-amber-300 dark:border-amber-700 rounded text-amber-900 dark:text-amber-100"
                        >
                          <option value={5}>5 Poin</option>
                          <option value={4}>4 Poin</option>
                          <option value={3}>3 Poin</option>
                          <option value={2}>2 Poin</option>
                          <option value={1}>1 Poin</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Choice Text Content Input */}
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      value={choice.content}
                      onChange={(e) => handleChoiceChange(index, 'content', e.target.value)}
                      placeholder={`Isi pilihan jawaban ${choice.label}...`}
                      className="w-full px-3.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Pembahasan Soal */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-purple-600">lightbulb</span>
              Pembahasan Soal & Kunci Solusi
            </label>
            <textarea
              rows={3}
              value={formData.explanation}
              onFocus={() => setActiveTargetField('explanation')}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Jelaskan langkah penyelesaian, konsep teori, atau penjelasan bobot nilai..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">save</span>
              Simpan Soal CPNS
            </button>
          </div>
        </form>
      ) : (
        /* Live Preview Component Tab */
        <div className="p-6 space-y-6 bg-slate-100 dark:bg-slate-950">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
                  {formData.category}
                </span>
                {formData.topic && (
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium">
                    {formData.topic}
                  </span>
                )}
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Tingkat: {formData.difficulty}
                </span>
              </div>
              <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded font-mono">
                Posisi Gambar: {formData.image_position.toUpperCase()}
              </span>
            </div>

            {/* Stimulus & Image Placement Preview */}
            <div className="space-y-4">
              {/* TOP Image Position */}
              {formData.image_url && formData.image_position === 'top' && (
                <div className="flex justify-center p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                  <img src={formData.image_url} alt="Gambar Soal (Atas)" className="max-h-64 object-contain rounded" />
                </div>
              )}

              {/* Stimulus */}
              {formData.stimulus && (
                <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl text-slate-800 dark:text-slate-200 text-sm">
                  <span className="font-bold text-amber-900 dark:text-amber-400 block text-xs mb-1">STIMULUS / BACAAN:</span>
                  <MathText text={formData.stimulus} />
                </div>
              )}

              {/* MIDDLE Image Position */}
              {formData.image_url && formData.image_position === 'middle' && (
                <div className="flex justify-center p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                  <img src={formData.image_url} alt="Gambar Soal (Tengah)" className="max-h-64 object-contain rounded" />
                </div>
              )}

              {/* Question Content */}
              <div className="text-slate-900 dark:text-slate-100 font-medium text-base leading-relaxed">
                <MathText text={formData.content || 'Teks soal belum diisi...'} />
              </div>

              {/* BOTTOM Image Position */}
              {formData.image_url && formData.image_position === 'bottom' && (
                <div className="flex justify-center p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                  <img src={formData.image_url} alt="Gambar Soal (Bawah)" className="max-h-64 object-contain rounded" />
                </div>
              )}
            </div>

            {/* Options Preview */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pilihan Jawaban:</span>
              {formData.choices.map((choice) => (
                <div
                  key={choice.label}
                  className={`p-3 rounded-xl border flex items-center justify-between text-sm transition-all ${
                    formData.category !== 'TKP' && choice.is_correct
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 font-semibold text-emerald-900 dark:text-emerald-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center border border-slate-300 dark:border-slate-600">
                      {choice.label}
                    </span>
                    <MathText text={choice.content || `[Pilihan ${choice.label} belum diisi]`} />
                  </div>

                  {/* Score Tag */}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    formData.category === 'TKP'
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                      : choice.is_correct
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {formData.category === 'TKP' ? `Skor: ${choice.tkp_point}` : choice.is_correct ? 'Kunci (Skor 5)' : 'Skor 0'}
                  </span>
                </div>
              ))}
            </div>

            {/* Explanation Preview */}
            {formData.explanation && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl space-y-1 text-sm">
                <div className="font-bold text-purple-800 dark:text-purple-300 text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">lightbulb</span>
                  PEMBAHASAN SOAL:
                </div>
                <MathText text={formData.explanation} className="text-slate-700 dark:text-slate-300" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
