import React, { useState, useEffect } from 'react';
import { subjectService, soalService } from '../../services/api';
import toast from 'react-hot-toast';

// ─── Toggle Switch Component ─────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`w-12 h-6 rounded-full relative transition-colors duration-200 flex-shrink-0 ${
      checked ? 'bg-primary' : 'bg-outline-variant'
    }`}
  >
    <span
      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
        checked ? 'right-1' : 'left-1'
      }`}
    />
  </button>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const InputSoal = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [formData, setFormData] = useState({
    subject_id: '',
    content: '',
    explanation: '',
    question_type: 'multiple_choice',
    correct_answer_text: '',
    choices: [
      { label: 'A', content: '', is_correct: true },
      { label: 'B', content: '', is_correct: false },
      { label: 'C', content: '', is_correct: false },
      { label: 'D', content: '', is_correct: false },
      { label: 'E', content: '', is_correct: false },
    ]
  });

  useEffect(() => {
    subjectService.list().then(res => setSubjects(res.data.data)).catch(() => {});
  }, []);

  const handleChoiceChange = (index, value) => {
    const updated = [...formData.choices];
    updated[index].content = value;
    setFormData({ ...formData, choices: updated });
  };

  const handleCorrectChange = (index) => {
    if (formData.question_type === 'complex_mc_tf') {
      const updated = [...formData.choices];
      updated[index].is_correct = !updated[index].is_correct;
      setFormData({ ...formData, choices: updated });
    } else {
      const updated = formData.choices.map((c, i) => ({ ...c, is_correct: i === index }));
      setFormData({ ...formData, choices: updated });
    }
  };

  const addOption = () => {
    if (formData.choices.length >= 5) return;
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const next = labels[formData.choices.length];
    setFormData({ ...formData, choices: [...formData.choices, { label: next, content: '', is_correct: false }] });
  };

  const removeOption = (index) => {
    if (formData.choices.length <= 2) return;
    const updated = formData.choices.filter((_, i) => i !== index)
      .map((c, i) => ({ ...c, label: ['A','B','C','D','E'][i] }));
    // Make sure at least one is correct
    if (!updated.some(c => c.is_correct)) updated[0].is_correct = true;
    setFormData({ ...formData, choices: updated });
  };

  const handlePublish = async () => {
    if (!formData.subject_id) { toast.error('Pilih mata pelajaran terlebih dahulu'); return; }
    if (!formData.content.trim()) { toast.error('Teks pertanyaan tidak boleh kosong'); return; }

    if (formData.question_type === 'short_answer') {
      if (!formData.correct_answer_text.trim()) { toast.error('Jawaban benar tidak boleh kosong'); return; }
    } else {
      if (formData.choices.some(c => !c.content.trim())) { toast.error('Semua pilihan harus diisi'); return; }
    }

    setLoading(true);
    try {
      const res = await soalService.create({
        subject_id: formData.subject_id,
        difficulty,
        content: formData.content,
        question_type: formData.question_type,
        correct_answer_text: formData.question_type === 'short_answer' ? formData.correct_answer_text : null,
        choices: formData.question_type === 'short_answer' ? [] : formData.choices.map(c => ({
          ...c,
          explanation: c.is_correct ? formData.explanation : null
        }))
      });
      if (res.data?.duplicateWarning) {
        toast(res.data.duplicateWarning, { icon: '⚠️', duration: 8000 });
      } else {
        toast.success('Soal berhasil dipublikasikan!');
      }
      setFormData(prev => ({
        ...prev,
        content: '',
        explanation: '',
        correct_answer_text: '',
        choices: prev.choices.map(c => ({ ...c, content: '' }))
      }));
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleDraft = () => {
    toast('Disimpan sebagai draft', { icon: '💾' });
  };

  const correctChoice = formData.choices.find(c => c.is_correct);

  return (
    <div className="animate-fade-in text-on-surface">
      {/* Page Header */}
      <section className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex gap-2 text-label-sm font-label-sm text-on-surface-variant mb-2">
            <span className="hover:text-primary cursor-pointer">Bank Soal</span>
            <span>/</span>
            <span className="text-primary">Buat Soal Baru</span>
          </nav>
          <h2 className="text-[32px] font-bold leading-tight text-on-surface">Manual Question Creator</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-2">
            Buat soal UTBK yang presisi untuk peserta didik Anda. Gunakan rich text untuk menambahkan konteks dan tandai jawaban benar dengan satu klik.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleDraft}
            className="px-6 py-3 border border-outline text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container-high transition-all"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={loading}
            className="px-6 py-3 bg-primary text-on-primary font-label-md text-label-md rounded-lg hover:shadow-lg transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : 'Publish Question'}
          </button>
        </div>
      </section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column (Question + Answers) ── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Question Text Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="mb-4 flex justify-between items-center">
              <label className="font-label-md text-label-md text-on-surface-variant">Question Text</label>
              <div className="flex gap-1">
                <button type="button" className="p-2 hover:bg-surface-container text-on-surface-variant rounded transition-colors">
                  <span className="material-symbols-outlined text-[20px]">format_bold</span>
                </button>
                <button type="button" className="p-2 hover:bg-surface-container text-on-surface-variant rounded transition-colors">
                  <span className="material-symbols-outlined text-[20px]">format_italic</span>
                </button>
                <button type="button" className="p-2 hover:bg-surface-container text-on-surface-variant rounded transition-colors">
                  <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                </button>
                <button type="button" className="p-2 hover:bg-surface-container text-on-surface-variant rounded transition-colors">
                  <span className="material-symbols-outlined text-[20px]">image</span>
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              className="w-full bg-surface-container-low border-none rounded-lg p-4 font-body-md text-body-md focus:ring-2 focus:ring-primary outline-none placeholder:text-outline-variant resize-none text-on-surface"
              placeholder="Ketik teks pertanyaan di sini... Anda dapat menggunakan formatting untuk menonjolkan konsep kunci."
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          {/* Answer Options Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            {formData.question_type === 'short_answer' ? (
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Correct Answer (Isian Singkat)</h3>
                <div className="bg-surface-container-low border-2 border-outline-variant rounded-xl p-4 transition-all focus-within:border-primary">
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Jawaban Benar</label>
                  <input
                    type="text"
                    className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant"
                    placeholder="Masukkan teks jawaban benar..."
                    value={formData.correct_answer_text}
                    onChange={e => setFormData({ ...formData, correct_answer_text: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-headline-md text-headline-md text-on-surface">Answer Options</h3>
                  <button
                    type="button"
                    onClick={addOption}
                    disabled={formData.choices.length >= 5}
                    className="flex items-center gap-2 text-primary font-label-md text-label-md hover:bg-[#dae1ff]/30 px-3 py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    <span>Add Option</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.choices.map((choice, index) => (
                    <div
                      key={index}
                      className={`group flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                        choice.is_correct
                          ? 'border-primary bg-[#dae1ff]/20'
                          : 'border-outline-variant hover:border-outline bg-surface-container-low'
                      }`}
                    >
                      {/* Letter Badge */}
                      <div className="mt-1 flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          choice.is_correct
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface-variant text-on-surface-variant'
                        }`}>
                          {choice.label}
                        </div>
                      </div>

                      {/* Text Input */}
                      <div className="flex-grow">
                        <textarea
                          rows={2}
                          className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none font-body-md text-body-md text-on-surface placeholder:text-outline-variant resize-none"
                          placeholder={`Masukkan teks pilihan ${choice.label}...`}
                          value={choice.content}
                          onChange={e => handleChoiceChange(index, e.target.value)}
                        />
                      </div>

                      {/* Toggle + Delete */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className={`font-label-sm text-label-sm ${choice.is_correct ? 'text-primary' : 'text-on-surface-variant'}`}>
                            {formData.question_type === 'complex_mc_tf' ? (choice.is_correct ? 'Benar' : 'Salah') : 'Correct'}
                          </span>
                          <Toggle checked={choice.is_correct} onChange={() => handleCorrectChange(index)} />
                        </label>
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className={`p-1 text-outline hover:text-error transition-colors ${
                            formData.choices.length <= 2 ? 'opacity-20 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100'
                          }`}
                          disabled={formData.choices.length <= 2}
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Explanation */}
            <div className="mt-6 pt-6 border-t border-outline-variant/30">
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase tracking-wider">
                Penjelasan Jawaban (Opsional)
              </label>
              <textarea
                rows={3}
                className="w-full bg-surface-container-low border-none rounded-lg p-4 font-body-md text-body-md focus:ring-2 focus:ring-primary outline-none placeholder:text-outline-variant resize-none text-on-surface"
                placeholder="Jelaskan mengapa jawaban tersebut benar..."
                value={formData.explanation}
                onChange={e => setFormData({ ...formData, explanation: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* ── Right Column (Sidebar) ── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Properties Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="font-label-md text-label-md text-on-surface mb-6 uppercase tracking-wider">Properties</h3>
            <div className="space-y-6">

              {/* Mata Pelajaran */}
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Mata Pelajaran</label>
                <select
                  required
                  className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg py-2.5 px-3 text-label-md font-label-md text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  value={formData.subject_id}
                  onChange={e => setFormData({ ...formData, subject_id: e.target.value })}
                >
                  <option value="">Pilih Mata Pelajaran...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Question Type */}
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Question Type</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, question_type: 'multiple_choice' })}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                      formData.question_type === 'multiple_choice'
                        ? 'border-primary bg-[#dae1ff]/10 text-primary font-label-md text-label-md'
                        : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant font-label-md text-label-md'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {formData.question_type === 'multiple_choice' ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    Multiple Choice (Pilihan Ganda)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, question_type: 'short_answer' })}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                      formData.question_type === 'short_answer'
                        ? 'border-primary bg-[#dae1ff]/10 text-primary font-label-md text-label-md'
                        : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant font-label-md text-label-md'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {formData.question_type === 'short_answer' ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    Short Answer (Isian Singkat)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, question_type: 'complex_mc_tf' })}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                      formData.question_type === 'complex_mc_tf'
                        ? 'border-primary bg-[#dae1ff]/10 text-primary font-label-md text-label-md'
                        : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant font-label-md text-label-md'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {formData.question_type === 'complex_mc_tf' ? 'radio_button_checked' : 'radio_button_unchecked'}
                    </span>
                    Pernyataan Benar/Salah (PG Kompleks)
                  </button>
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-3">Difficulty Level</label>
                <div className="flex items-center gap-1 w-full bg-surface-container-low p-1 rounded-lg">
                  {['easy', 'medium', 'hard'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`flex-1 py-2 text-label-sm font-label-sm rounded-md transition-all capitalize ${
                        difficulty === lvl
                          ? 'bg-surface text-on-surface shadow-sm border border-outline-variant/20'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {lvl === 'easy' ? 'Easy' : lvl === 'medium' ? 'Medium' : 'Hard'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Tags */}
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">Topic Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-[#c2e8ff] text-[#001e2b] rounded-full text-label-sm font-label-sm">UTBK</span>
                  <span className="px-3 py-1 bg-[#c2e8ff] text-[#001e2b] rounded-full text-label-sm font-label-sm">
                    {difficulty === 'easy' ? 'Mudah' : difficulty === 'medium' ? 'Sedang' : 'Sulit'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full bg-surface-container-low border-none rounded-lg py-2 pl-3 pr-10 text-label-md outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Add tag..."
                  />
                  <span className="material-symbols-outlined absolute right-3 top-2 text-on-surface-variant text-[20px]">add</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-primary text-on-primary rounded-xl overflow-hidden shadow-xl relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                <circle cx="170" cy="30" r="80" fill="white" />
                <circle cx="30" cy="170" r="100" fill="white" />
              </svg>
            </div>
            <div className="p-6 relative z-10">
              <h4 className="font-headline-md text-headline-md mb-2">Live Preview</h4>
              <p className="font-label-md text-label-md opacity-90 mb-4">
                {formData.content
                  ? formData.content.substring(0, 80) + (formData.content.length > 80 ? '...' : '')
                  : 'Pertanyaan Anda akan muncul di sini saat siswa mengerjakan soal.'}
              </p>
              {formData.question_type === 'short_answer' ? (
                formData.correct_answer_text && (
                  <div className="bg-white/10 rounded-lg p-3 mb-4 border border-white/20">
                    <p className="text-label-sm font-label-sm opacity-70 mb-1 uppercase tracking-wider">Jawaban Benar</p>
                    <p className="text-label-md font-label-md">{formData.correct_answer_text}</p>
                  </div>
                )
              ) : (
                correctChoice?.content && (
                  <div className="bg-white/10 rounded-lg p-3 mb-4 border border-white/20">
                    <p className="text-label-sm font-label-sm opacity-70 mb-1 uppercase tracking-wider">Jawaban Benar</p>
                    <p className="text-label-md font-label-md">
                      {correctChoice.label}. {correctChoice.content.substring(0, 60)}{correctChoice.content.length > 60 ? '...' : ''}
                    </p>
                  </div>
                )
              )}
              <button
                type="button"
                className="w-full py-3 bg-white text-primary font-bold rounded-lg hover:bg-[#dae1ff] transition-colors font-label-md text-label-md"
              >
                Preview as Student
              </button>
            </div>
          </div>

          {/* Meta Info */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-4">
            <div className="flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">info</span>
              <p className="font-label-sm text-label-sm">
                {loading ? 'Menyimpan...' : 'Siap dipublikasikan • Belum disimpan'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-outline-variant/30 text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60">
          © 2026 Stubia UTBK Platform. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default InputSoal;
