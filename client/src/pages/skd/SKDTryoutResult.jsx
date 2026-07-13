import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { skdService } from '../../services/api';
import toast from 'react-hot-toast';
import StudentNavbar from '../../components/layout/StudentNavbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../hooks/useAuth';

const SUBJECT_COLOR = {
  TWK: { primary: '#e65100', light: '#fff3e0', badge: 'bg-orange-100 text-orange-700', ring: 'ring-orange-200' },
  TIU: { primary: '#1565c0', light: '#e3f2fd', badge: 'bg-blue-100 text-blue-700', ring: 'ring-blue-200' },
  TKP: { primary: '#2e7d32', light: '#e8f5e9', badge: 'bg-green-100 text-green-700', ring: 'ring-green-200' },
};

export default function SKDTryoutResult() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState(null); // subtes name for review
  const [reviewPage, setReviewPage] = useState(0);

  useEffect(() => {
    loadResult();
  }, [sessionId]);

  async function loadResult() {
    try {
      const res = await skdService.getTryoutResult(sessionId);
      setData(res.data?.data);
    } catch {
      toast.error('Gagal memuat hasil tryout');
      navigate('/skd');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0050cb]/20 border-t-[#0050cb] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#424656]">Memuat hasil tryout...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { session, answers, subjects } = data;
  const isPassed = session.is_passed;
  const scoreBreakdown = session.score_breakdown || {};

  // Group answers by subtes
  const bySubtes = {};
  (answers || []).forEach((a) => {
    const name = a.subject_name;
    if (!bySubtes[name]) bySubtes[name] = [];
    bySubtes[name].push(a);
  });

  const passingGrades = {};
  (subjects || []).forEach((s) => { passingGrades[s.name] = s.passing_grade; });

  const subtesStats = Object.entries(bySubtes).map(([name, qs]) => {
    const totalAnswered = qs.filter((q) => q.chosen_choice_id).length;
    const totalScore = qs.reduce((acc, q) => acc + (q.points_earned || 0), 0);
    const pg = passingGrades[name] || scoreBreakdown[name]?.passing_grade || 0;
    const passed = totalScore >= pg;
    return { name, qs, totalAnswered, totalScore, pg, passed };
  });

  const reviewAnswers = activeReview ? bySubtes[activeReview] || [] : [];
  const REVIEW_PER_PAGE = 5;
  const reviewSlice = reviewAnswers.slice(reviewPage * REVIEW_PER_PAGE, (reviewPage + 1) * REVIEW_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />

      <main className="flex-grow max-w-[1000px] mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-5 shadow-lg ${
            isPassed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <span className={`material-symbols-outlined text-[40px] ${isPassed ? 'text-green-600' : 'text-red-500'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPassed ? 'emoji_events' : 'replay'}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-[13px] font-bold uppercase tracking-wider text-[#727687]">Hasil Tryout SKD CPNS</span>
          </div>
          <h1 className="text-[32px] sm:text-[40px] font-black text-[#191b24] mb-2">
            {session.package_title || 'Tryout SKD'}
          </h1>
          <p className={`text-[16px] font-bold ${isPassed ? 'text-green-600' : 'text-red-500'}`}>
            {isPassed ? '🎉 Selamat! Kamu Lulus SKD' : '📚 Belum Lulus — Terus Berlatih!'}
          </p>
        </div>

        {/* Total Score */}
        <div className="bg-gradient-to-br from-[#0d47a1] to-[#1565c0] rounded-3xl p-8 text-white text-center mb-8 shadow-xl">
          <div className="text-[13px] font-bold uppercase tracking-wider opacity-70 mb-2">Total Skor SKD</div>
          <div className="text-[72px] sm:text-[88px] font-black leading-none mb-3">
            {session.total_score || 0}
          </div>
          <div className="text-[14px] opacity-80">TWK + TIU + TKP</div>
        </div>

        {/* Subtes Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {subtesStats.map(({ name, totalAnswered, totalScore, pg, passed, qs }) => {
            const c = SUBJECT_COLOR[name] || SUBJECT_COLOR.TWK;
            const maxScore = name === 'TKP' ? 225 : 175;
            const pct = Math.min(100, (totalScore / maxScore) * 100);
            return (
              <div key={name} className={`bg-white rounded-2xl p-6 border-2 shadow-sm transition-all ${
                passed ? 'border-green-200' : 'border-red-200'
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black"
                      style={{ backgroundColor: c.light, color: c.primary }}>
                      {name}
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-[#191b24]">{name}</div>
                      <div className="text-[10px] text-[#727687]">PG: {pg}</div>
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
                    <span className={`material-symbols-outlined text-[16px] ${passed ? 'text-green-600' : 'text-red-500'}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                      {passed ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-[40px] font-black leading-none mb-1" style={{ color: c.primary }}>
                  {totalScore}
                </div>
                <div className="text-[12px] text-[#727687] mb-3">dari {maxScore} poin</div>

                {/* Progress */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: c.primary }} />
                </div>

                {/* PG marker */}
                <div className="flex justify-between text-[11px] text-[#727687] mb-4">
                  <span>0</span>
                  <span className={passed ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                    PG: {pg}
                  </span>
                  <span>{maxScore}</span>
                </div>

                <button
                  onClick={() => { setActiveReview(activeReview === name ? null : name); setReviewPage(0); }}
                  className="w-full py-2 rounded-xl text-[12px] font-bold border border-[#c2c6d8]/40 text-[#0050cb] hover:bg-[#f2f3ff] transition-all"
                >
                  {activeReview === name ? 'Tutup Review' : `Review ${qs.length} Soal`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Review Section */}
        {activeReview && (
          <div className="bg-white rounded-3xl border border-[#c2c6d8]/40 shadow-sm overflow-hidden mb-10">
            <div className="p-6 border-b border-[#c2c6d8]/20 flex items-center justify-between">
              <h2 className="text-[18px] font-bold text-[#191b24] flex items-center gap-2">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black`}
                  style={{ backgroundColor: SUBJECT_COLOR[activeReview]?.light, color: SUBJECT_COLOR[activeReview]?.primary }}>
                  {activeReview}
                </span>
                Review Soal — {activeReview}
              </h2>
              <div className="text-[13px] text-[#727687]">
                {reviewPage * REVIEW_PER_PAGE + 1}–{Math.min((reviewPage + 1) * REVIEW_PER_PAGE, reviewAnswers.length)} dari {reviewAnswers.length}
              </div>
            </div>

            <div className="divide-y divide-[#c2c6d8]/20">
              {reviewSlice.map((ans, i) => {
                const isTkp = ans.subject_name === 'TKP';
                const isCorrect = isTkp ? (ans.points_earned >= 4) : ans.chosen_is_correct;
                const isUnanswered = !ans.chosen_choice_id;

                return (
                  <div key={ans.question_id} className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isUnanswered ? 'bg-gray-200' : isCorrect ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className={`material-symbols-outlined text-[14px] ${
                          isUnanswered ? 'text-gray-500' : isCorrect ? 'text-green-600' : 'text-red-500'
                        }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {isUnanswered ? 'remove' : isCorrect ? 'check' : 'close'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[12px] font-bold text-[#727687]">
                            Soal {reviewPage * REVIEW_PER_PAGE + i + 1}
                          </span>
                          {isTkp && !isUnanswered && (
                            <span className="text-[11px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                              +{ans.points_earned} poin
                            </span>
                          )}
                        </div>
                        <div className="text-[14px] text-[#191b24] leading-relaxed mb-3"
                          dangerouslySetInnerHTML={{ __html: ans.question_content }} />

                        {/* Chosen answer */}
                        {ans.chosen_choice_id ? (
                          <div className={`flex items-start gap-2 p-3 rounded-xl border mb-2 ${
                            isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}>
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 ${
                              isCorrect ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
                            }`}>{ans.chosen_label}</span>
                            <div className="flex-1">
                              <div className={`text-[12px] font-bold mb-0.5 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                                Jawaban kamu {isCorrect ? '(Benar)' : '(Salah)'}
                              </div>
                              <div className="text-[13px] text-[#424656]"
                                dangerouslySetInnerHTML={{ __html: ans.chosen_content }} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 mb-2">
                            <span className="material-symbols-outlined text-[16px] text-gray-400">remove_circle</span>
                            <span className="text-[13px] text-gray-500 font-medium">Tidak dijawab</span>
                          </div>
                        )}

                        {/* Correct answer (for TWK/TIU) */}
                        {!isTkp && !isCorrect && ans.allChoices && (
                          <div className="flex items-start gap-2 p-3 rounded-xl bg-green-50 border border-green-200 mb-2">
                            {(() => {
                              const correctChoice = ans.allChoices.find((c) => c.is_correct);
                              return correctChoice ? (
                                <>
                                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black bg-green-600 text-white shrink-0">
                                    {correctChoice.label}
                                  </span>
                                  <div className="flex-1">
                                    <div className="text-[12px] font-bold text-green-700 mb-0.5">Jawaban Benar</div>
                                    <div className="text-[13px] text-[#424656]"
                                      dangerouslySetInnerHTML={{ __html: correctChoice.content }} />
                                  </div>
                                </>
                              ) : null;
                            })()}
                          </div>
                        )}

                        {/* Explanation */}
                        {ans.explanation && (
                          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                            <div className="text-[11px] font-bold text-[#0050cb] mb-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">lightbulb</span> Pembahasan
                            </div>
                            <div className="text-[13px] text-[#424656] leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: ans.explanation }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {reviewAnswers.length > REVIEW_PER_PAGE && (
              <div className="flex items-center justify-center gap-3 p-5 border-t border-[#c2c6d8]/20">
                <button
                  onClick={() => setReviewPage(Math.max(0, reviewPage - 1))}
                  disabled={reviewPage === 0}
                  className="px-4 py-2 rounded-xl text-[13px] font-bold border border-[#c2c6d8]/40 disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Sebelumnya
                </button>
                <span className="text-[13px] text-[#727687]">
                  Halaman {reviewPage + 1} / {Math.ceil(reviewAnswers.length / REVIEW_PER_PAGE)}
                </span>
                <button
                  onClick={() => setReviewPage(Math.min(Math.ceil(reviewAnswers.length / REVIEW_PER_PAGE) - 1, reviewPage + 1))}
                  disabled={(reviewPage + 1) * REVIEW_PER_PAGE >= reviewAnswers.length}
                  className="px-4 py-2 rounded-xl text-[13px] font-bold border border-[#c2c6d8]/40 disabled:opacity-40 hover:bg-gray-50"
                >
                  Berikutnya →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        {!isPassed && (
          <div className="bg-gradient-to-r from-[#e3f2fd] to-[#e8f5e9] rounded-2xl p-6 mb-8 border border-[#c2c6d8]/30">
            <h3 className="text-[16px] font-bold text-[#191b24] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0050cb]">tips_and_updates</span>
              Tips Agar Lulus SKD
            </h3>
            <ul className="space-y-2 text-[13px] text-[#424656]">
              {subtesStats.filter((s) => !s.passed).map((s) => (
                <li key={s.name} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: SUBJECT_COLOR[s.name]?.primary || '#000' }} />
                  <span><strong>{s.name}</strong>: Butuh tambahan <strong>{s.pg - s.totalScore} poin</strong> lagi untuk mencapai passing grade.</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/skd"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-[15px] font-bold bg-[#0050cb] text-white hover:bg-[#003da1] transition-all shadow-lg shadow-blue-500/20">
            <span className="material-symbols-outlined text-[20px]">home</span>
            Kembali ke SKD
          </Link>
          <Link to={`/skd`}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-[15px] font-bold bg-white text-[#0050cb] border-2 border-[#0050cb]/30 hover:bg-[#f2f3ff] transition-all">
            <span className="material-symbols-outlined text-[20px]">auto_stories</span>
            Latihan Soal SKD
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
