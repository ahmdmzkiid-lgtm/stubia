import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { skdService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import StudentNavbar from '../../components/layout/StudentNavbar';
import Footer from '../../components/Footer';

const SUBJECT_COLOR = {
  TWK: { primary: '#e65100', light: '#fff3e0', badge: 'bg-orange-100 text-orange-700' },
  TIU: { primary: '#1565c0', light: '#e3f2fd', badge: 'bg-blue-100 text-blue-700' },
  TKP: { primary: '#2e7d32', light: '#e8f5e9', badge: 'bg-green-100 text-green-700' },
};

export default function SKDLatihanResult() {
  const { subjectId, sessionId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const [filterMode, setFilterMode] = useState('all'); // all, correct, incorrect, unanswered

  useEffect(() => {
    loadResult();
  }, [sessionId]);

  async function loadResult() {
    try {
      const res = await skdService.getLatihanResult(sessionId);
      setData(res.data?.data);
    } catch {
      toast.error('Gagal memuat hasil latihan');
      navigate(`/skd/latihan/${subjectId}`);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0050cb]/20 border-t-[#0050cb] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { session, answers } = data;
  const subjectName = session.subject_name_detail || session.subject_name || 'SKD';
  const color = SUBJECT_COLOR[subjectName] || SUBJECT_COLOR.TWK;
  const isTkp = session.is_tkp;

  const totalQ = session.total_questions || 0;
  const correct = session.correct_count || 0;
  const incorrect = session.incorrect_count || 0;
  const unanswered = session.unanswered_count || 0;
  const totalScore = session.total_score || 0;
  const pg = session.passing_grade || 0;
  const maxScore = subjectName === 'TKP' ? totalQ * 5 : totalQ * 5;
  const scorePct = maxScore > 0 ? Math.min(100, (totalScore / maxScore) * 100) : 0;

  const filteredAnswers = (answers || []).filter((a) => {
    if (filterMode === 'correct') return a.is_correct;
    if (filterMode === 'incorrect') return !a.is_correct && a.chosen_choice_id;
    if (filterMode === 'unanswered') return !a.chosen_choice_id;
    return true;
  });

  function toggleExpand(id) {
    setExpandedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />

      <main className="flex-grow max-w-[900px] mx-auto w-full px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-[#727687] mb-6">
          <Link to="/skd" className="hover:text-[#0050cb]">SKD CPNS</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <Link to={`/skd/latihan/${subjectId}`} className="hover:text-[#0050cb]">Latihan {subjectName}</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-[#191b24] font-medium">Hasil</span>
        </div>

        {/* Score Summary */}
        <div className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-xl"
          style={{ background: `linear-gradient(135deg, ${color.primary} 0%, ${color.primary}cc 100%)` }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="relative text-center">
            <div className="text-[13px] font-bold uppercase tracking-wider opacity-70 mb-2">Hasil Latihan {subjectName}</div>
            {session.topic_title && (
              <div className="text-[14px] opacity-80 mb-2">Topik: {session.topic_title}</div>
            )}
            <div className="text-[72px] font-black leading-none mb-2">{totalScore}</div>
            <div className="text-[14px] opacity-70 mb-6">dari ~{maxScore} poin maks.</div>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                <div className="text-[28px] font-black">{correct}</div>
                <div className="text-[11px] opacity-70">Benar</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                <div className="text-[28px] font-black">{incorrect}</div>
                <div className="text-[11px] opacity-70">Salah</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                <div className="text-[28px] font-black">{unanswered}</div>
                <div className="text-[11px] opacity-70">Kosong</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-[#c2c6d8]/40 shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[14px] font-bold text-[#191b24]">Akurasi</span>
            <span className="text-[14px] font-black" style={{ color: color.primary }}>
              {totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className="h-full rounded-full transition-all" style={{
              width: `${totalQ > 0 ? (correct / totalQ) * 100 : 0}%`,
              backgroundColor: color.primary
            }} />
          </div>
          {pg > 0 && (
            <div className={`text-[13px] font-semibold flex items-center gap-2 ${totalScore >= pg ? 'text-green-600' : 'text-amber-600'}`}>
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {totalScore >= pg ? 'check_circle' : 'info'}
              </span>
              {totalScore >= pg
                ? `Skor melampaui passing grade (${pg})`
                : `Butuh ${pg - totalScore} poin lagi untuk mencapai passing grade (${pg})`}
            </div>
          )}
        </div>

        {/* Review Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-bold text-[#191b24]">Review Jawaban</h2>
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap mb-5">
            {[
              { id: 'all', label: `Semua (${totalQ})` },
              { id: 'correct', label: `Benar (${correct})` },
              { id: 'incorrect', label: `Salah (${incorrect})` },
              { id: 'unanswered', label: `Kosong (${unanswered})` },
            ].map((f) => (
              <button key={f.id} onClick={() => setFilterMode(f.id)}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold border transition-all ${
                  filterMode === f.id ? 'text-white border-transparent' : 'bg-white text-[#424656] border-[#c2c6d8]/40 hover:border-[#0050cb]/30'
                }`}
                style={filterMode === f.id ? { backgroundColor: color.primary, borderColor: color.primary } : {}}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredAnswers.map((ans, i) => {
              const isExpanded = expandedAnswers[ans.question_id];
              const isCorrect = ans.is_correct;
              const isUnanswered = !ans.chosen_choice_id;

              return (
                <div key={ans.question_id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  isUnanswered ? 'border-gray-200' : isCorrect ? 'border-green-200' : 'border-red-200'
                }`}>
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      {/* Status icon */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isUnanswered ? 'bg-gray-100' : isCorrect ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <span className={`material-symbols-outlined text-[14px] ${
                          isUnanswered ? 'text-gray-400' : isCorrect ? 'text-green-600' : 'text-red-500'
                        }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {isUnanswered ? 'remove' : isCorrect ? 'check' : 'close'}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-[12px] font-bold text-[#727687]">Soal {ans.position + 1}</span>
                          {!isUnanswered && isTkp && (
                            <span className="text-[11px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                              +{ans.points_earned} poin
                            </span>
                          )}
                        </div>
                        <div className="text-[14px] text-[#191b24] leading-relaxed line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: ans.question_content }} />

                        {/* Chosen answer summary */}
                        {ans.chosen_choice_id ? (
                          <div className={`mt-2 text-[12px] font-semibold flex items-center gap-1.5 ${
                            isCorrect ? 'text-green-600' : 'text-red-500'
                          }`}>
                            <span>Pilihan {ans.chosen_label}: </span>
                            <span className="font-normal text-[#424656]" dangerouslySetInnerHTML={{ __html: (ans.chosen_content || '').substring(0, 60) + '...' }} />
                          </div>
                        ) : (
                          <div className="mt-2 text-[12px] font-semibold text-gray-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">remove_circle</span>
                            Tidak dijawab
                          </div>
                        )}
                      </div>

                      <button onClick={() => toggleExpand(ans.question_id)}
                        className="shrink-0 w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-all">
                        <span className="material-symbols-outlined text-[20px] text-[#727687]"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          expand_more
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-[#c2c6d8]/20 p-5 bg-[#fafbff]">
                      {/* All choices */}
                      <div className="space-y-2 mb-4">
                        {(ans.allChoices || []).map((choice) => {
                          const isChosen = choice.id === ans.chosen_choice_id;
                          const isCorrectChoice = !isTkp ? choice.is_correct : false;
                          return (
                            <div key={choice.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
                              isCorrectChoice ? 'bg-green-50 border-green-200'
                                : isChosen && !isCorrectChoice ? 'bg-red-50 border-red-200'
                                : 'bg-white border-[#c2c6d8]/30'
                            }`}>
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                                isCorrectChoice ? 'bg-green-600 text-white'
                                  : isChosen ? 'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>{choice.label}</div>
                              <div className="flex-1">
                                <div className="text-[13px] text-[#191b24]" dangerouslySetInnerHTML={{ __html: choice.content }} />
                                {isTkp && <span className="text-[11px] font-bold text-green-600 mt-0.5 block">+{choice.tkp_point} poin</span>}
                              </div>
                              {isChosen && <span className="material-symbols-outlined text-[14px] shrink-0 text-[#727687]">arrow_left</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {ans.explanation && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                          <div className="text-[11px] font-bold text-[#0050cb] mb-1.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">lightbulb</span> Pembahasan
                          </div>
                          <div className="text-[13px] text-[#424656] leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: ans.explanation }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button onClick={() => navigate(`/skd/latihan/${subjectId}`)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-[15px] font-bold text-white transition-all shadow-lg"
            style={{ backgroundColor: color.primary }}>
            <span className="material-symbols-outlined text-[20px]">replay</span>
            Latihan Lagi
          </button>
          <Link to="/skd"
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-[15px] font-bold bg-white text-[#0050cb] border-2 border-[#0050cb]/30 hover:bg-[#f2f3ff] transition-all">
            <span className="material-symbols-outlined text-[20px]">home</span>
            Ke Halaman SKD
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
