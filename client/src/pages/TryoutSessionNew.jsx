import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTryoutFetch } from '../hooks/useTryoutFetch';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import MathText from '../components/MathText';
import ZoomableImage from '../components/ui/ZoomableImage';
import PreviewBanner from '../components/layout/PreviewBanner';

/**
 * TryoutSession - Menggunakan useTryoutFetch Hook
 * Produksi ready component untuk tryout dengan 160 soal
 */
const TryoutSessionNew = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const {
    // State
    allQuestions,
    userAnswers,
    loading,
    submitting,
    error,
    activeCategory,
    metadata,

    // Methods
    fetchAllQuestions,
    getCurrentQuestions,
    saveAnswer,
    toggleFlag,
    getAnswerStats,
    handleSubmitAllAnswers,
    setActiveCategory,
  } = useTryoutFetch(sessionId);

  // Fetch soal saat component mount
  useEffect(() => {
    if (sessionId) {
      fetchAllQuestions(sessionId);
    }
  }, [sessionId, fetchAllQuestions]);

  // Block copy/select-all keyboard shortcuts on exam page
  useEffect(() => {
    const blockCopy = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'a', 'x', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', blockCopy);
    return () => document.removeEventListener('keydown', blockCopy);
  }, []);

  // Handle submit dengan konfirmasi
  const handleSubmit = async () => {
    const stats = getAnswerStats();

    if (stats.totalUnanswered > 0) {
      const confirmed = confirm(
        `⚠️ Masih ada ${stats.totalUnanswered} soal yang belum dijawab.\n\nYakin ingin submit?`
      );
      if (!confirmed) return;
    }

    try {
      await handleSubmitAllAnswers(sessionId, (response) => {
        toast.success('🎉 Hasil sedang diproses...');
        setTimeout(() => {
          navigate(`/hasil-tryout/${sessionId}`, { state: response });
        }, 1000);
      });
    } catch (err) {
      console.error('Submit failed:', err);
    }
  };

  // ===== RENDER: LOADING =====
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Spinner />
        <h2 className="text-2xl font-bold text-gray-800 mt-4">
          Memuat Soal Tryout...
        </h2>
        <p className="text-gray-600 mt-2">
          📤 Mengambil 160 soal dari server (5-10 detik)
        </p>
        <div className="mt-4 text-sm text-gray-500 space-y-1">
          <p>💡 Pastikan koneksi internet stabil</p>
          <p>⏳ Jangan refresh halaman selama loading</p>
        </div>
      </div>
    );
  }

  // ===== RENDER: ERROR =====
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            ❌ Gagal Memuat Soal
          </h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Button
            onClick={() => fetchAllQuestions(sessionId)}
            className="bg-red-600 hover:bg-red-700"
          >
            🔄 Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // ===== CALCULATE STATS =====
  const stats = getAnswerStats();
  const currentQuestions = getCurrentQuestions();

  // ===== RENDER: MAIN =====
  return (
    <div className="min-h-screen bg-gray-50">
      <PreviewBanner />
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white shadow-md border-b-4 border-indigo-600">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Info Row */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                📝 Tryout UTBK
              </h1>
              <p className="text-sm text-gray-600">
                Total: <strong>{metadata.totalQuestions} soal</strong> | 
                Dijawab: <strong>{stats.totalAnswered}</strong> | 
                Ditandai: <strong>{stats.totalFlagged}</strong>
              </p>
            </div>
            <Button
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              {submitting ? '📤 Mengirim...' : '✅ Submit Jawaban'}
            </Button>
          </div>

          {/* CATEGORY TABS */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {metadata.totalCategories.map((category) => {
              const categoryStats = stats.answersByCategory[category];
              const isActive = activeCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`
                    px-4 py-2 rounded-lg font-semibold whitespace-nowrap
                    transition-all duration-200 flex items-center gap-2 text-sm
                    ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }
                  `}
                >
                  <span className="truncate">{category}</span>
                  <Badge
                    variant={isActive ? 'light' : 'default'}
                    className="text-xs"
                  >
                    {categoryStats?.answered}/{categoryStats?.total}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* QUESTIONS SECTION */}
          <div className="lg:col-span-2 space-y-6">
            {currentQuestions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
                <p className="text-lg">Tidak ada soal untuk kategori ini</p>
              </div>
            ) : (
              currentQuestions.map((question, index) => {
                const userAnswer = userAnswers[question.id];
                const isFlagged = userAnswer?.flagged;

                return (
                  <div
                    key={question.id}
                    className={`
                      bg-white rounded-lg shadow-md p-6 border-l-4 transition-all
                      ${isFlagged ? 'border-l-yellow-500 bg-yellow-50' : 'border-l-indigo-500'}
                    `}
                  >
                    {/* TOP IMAGE */}
                    {question.image_url && ['top', 'before', 'atas'].includes(question.image_position) && (
                      <ZoomableImage
                        src={question.image_url}
                        alt="Question"
                        className="mb-4 max-w-full rounded-lg max-h-64 object-contain"
                      />
                    )}

                    {/* STIMULUS */}
                    {question.stimulus && (
                      <div className="mb-4 text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                        <MathText text={question.stimulus} />
                      </div>
                    )}

                    {/* MIDDLE IMAGE */}
                    {question.image_url && ['middle', 'ditengah', 'tengah'].includes(question.image_position) && (
                      <ZoomableImage
                        src={question.image_url}
                        alt="Question"
                        className="mb-4 max-w-full rounded-lg max-h-64 object-contain"
                      />
                    )}

                    {/* QUESTION HEADER */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gray-900 mb-2 flex items-start gap-1">
                          <span>{index + 1}. </span>
                          <MathText text={question.content || ''} />
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFlag(question.id)}
                        className={`
                          text-2xl transition-transform hover:scale-110 ml-2 flex-shrink-0
                          ${isFlagged ? 'text-yellow-500' : 'text-gray-300'}
                        `}
                        title="Tandai soal penting"
                      >
                        🚩
                      </button>
                    </div>

                    {/* BOTTOM IMAGE */}
                    {question.image_url && !['top', 'before', 'atas', 'middle', 'ditengah', 'tengah'].includes(question.image_position) && (
                      <ZoomableImage
                        src={question.image_url}
                        alt="Question"
                        className="mb-4 max-w-full rounded-lg max-h-64 object-contain"
                      />
                    )}

                    {/* ANSWER CHOICES OR INPUT */}
                    <div className="space-y-3">
                      {question.question_type === 'complex_mc_tf' ? (
                        /* Complex MC True/False */
                        <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[13px] font-semibold text-gray-500">Tentukan Benar atau Salah untuk setiap pernyataan:</span>
                          </div>
                          <div className="space-y-2">
                            {(question.choices || []).map((choice) => {
                              let studentAnswer = null;
                              try {
                                const parsed = userAnswer?.answerText ? (typeof userAnswer.answerText === 'string' ? JSON.parse(userAnswer.answerText) : userAnswer.answerText) : {};
                                studentAnswer = parsed[choice.label];
                              } catch(e) {}
                              return (
                                <div key={choice.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                                  <div className="flex-1 text-[14px] text-gray-900 min-w-0">
                                    <MathText text={choice.content || ''} />
                                  </div>
                                  <div className="flex gap-2 self-end sm:self-center flex-shrink-0">
                                    <button
                                      onClick={() => {
                                        const current = userAnswer?.answerText ? (typeof userAnswer.answerText === 'string' ? JSON.parse(userAnswer.answerText) : userAnswer.answerText) : {};
                                        const updated = { ...current, [choice.label]: true };
                                        saveAnswer(question.id, undefined, {
                                          sessionId,
                                          answerText: JSON.stringify(updated),
                                        });
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${studentAnswer === true ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'}`}
                                    >
                                      Benar
                                    </button>
                                    <button
                                      onClick={() => {
                                        const current = userAnswer?.answerText ? (typeof userAnswer.answerText === 'string' ? JSON.parse(userAnswer.answerText) : userAnswer.answerText) : {};
                                        const updated = { ...current, [choice.label]: false };
                                        saveAnswer(question.id, undefined, {
                                          sessionId,
                                          answerText: JSON.stringify(updated),
                                        });
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${studentAnswer === false ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-red-50'}`}
                                    >
                                      Salah
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : question.question_type === 'short_answer' ? (
                        /* Short Answer Input */
                        <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-600/20 transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[13px] font-semibold text-gray-500">Tulis jawaban singkat di bawah ini:</span>
                          </div>
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 outline-none text-[15px] text-gray-900 placeholder:text-gray-400 bg-white"
                            placeholder="Ketik jawaban Anda..."
                            value={userAnswer?.answerText || ''}
                            onChange={(e) => {
                              saveAnswer(question.id, undefined, {
                                sessionId,
                                answerText: e.target.value,
                              });
                            }}
                          />
                        </div>
                      ) : (
                        question.choices?.map((choice) => {
                          const isSelected = userAnswer?.choiceId === choice.id;

                          return (
                            <label
                              key={choice.id}
                              className={`
                                flex items-start gap-3 p-3 rounded-lg cursor-pointer
                                transition-all border-2
                                ${
                                  isSelected
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                }
                              `}
                            >
                              <input
                                type="radio"
                                name={`question_${question.id}`}
                                value={choice.id}
                                checked={isSelected}
                                onChange={() => {
                                  saveAnswer(question.id, choice.id, {
                                    sessionId,
                                  });
                                }}
                                className="mt-1 cursor-pointer"
                              />
                              <span className="flex-1 flex items-start gap-1.5">
                                <strong className="text-lg">{choice.label}.</strong>
                                <MathText text={choice.content || ''} />
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>

                    {/* EXPLANATION - Collapsible */}
                    {question.choices?.[0]?.explanation && (
                      <details className="mt-4 pt-4 border-t border-gray-200 group">
                        <summary className="cursor-pointer text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                          📖 Lihat Pembahasan
                        </summary>
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg text-gray-700 text-sm">
                          <MathText text={question.choices[0].explanation || ''} />
                        </div>
                      </details>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* SIDEBAR: STATISTICS */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-4 text-gray-900">
                📊 Statistik
              </h3>

              {/* MAIN STATS */}
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="font-semibold">✅ Dijawab</span>
                  <strong className="text-xl text-green-600">
                    {stats.totalAnswered}
                  </strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <span className="font-semibold">🚩 Ditandai</span>
                  <strong className="text-xl text-yellow-600">
                    {stats.totalFlagged}
                  </strong>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="font-semibold">❓ Belum</span>
                  <strong className="text-xl text-red-600">
                    {stats.totalUnanswered}
                  </strong>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="border-t border-gray-200 my-6" />

              {/* PROGRESS PER CATEGORY */}
              <h4 className="font-bold mb-4 text-gray-900">Per Subtes</h4>
              <div className="space-y-4">
                {Object.entries(stats.answersByCategory).map(
                  ([cat, catStats]) => (
                    <div key={cat} className="text-xs">
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-700 truncate">
                          {cat}
                        </span>
                        <span className="text-indigo-600 font-bold ml-2 flex-shrink-0">
                          {catStats.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${catStats.percentage}%` }}
                        />
                      </div>
                      <div className="text-gray-500 mt-1">
                        {catStats.answered}/{catStats.total} soal
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* DIVIDER */}
              <div className="border-t border-gray-200 my-6" />

              {/* SUBMIT BUTTON */}
              <Button
                onClick={() => setShowConfirmModal(true)}
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
              >
                {submitting ? '📤 Mengirim...' : '✅ Submit Sekarang'}
              </Button>

              {stats.totalUnanswered > 0 && (
                <p className="text-xs text-orange-600 mt-3 text-center font-semibold">
                  ⚠️ Masih ada {stats.totalUnanswered} soal yang belum dijawab
                </p>
              )}

              {/* INFO CARD */}
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-900 mt-6 border border-blue-200">
                <h4 className="font-bold mb-2">💡 Tips:</h4>
                <ul className="space-y-1 text-xs">
                  <li>✅ Jawaban disimpan otomatis</li>
                  <li>🚩 Tandai soal untuk direview</li>
                  <li>📱 Responsive di semua device</li>
                  <li>🔄 Refresh halaman aman</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* CONFIRM MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ✅ Konfirmasi Submit
            </h3>
            <p className="text-gray-700 mb-4">
              Apakah Anda yakin ingin submit jawaban tryout?
            </p>

            {stats.totalUnanswered > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Masih ada <strong>{stats.totalUnanswered} soal</strong> yang
                  belum dijawab
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400"
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSubmit();
                }}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? 'Mengirim...' : 'Ya, Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TryoutSessionNew;
