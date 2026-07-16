import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ujianMandiriService } from '../services/api';
import DiscussQuestionModal from '../components/DiscussQuestionModal';
import MathText from '../components/MathText';
import ZoomableImage from '../components/ui/ZoomableImage';
import NationalLeaderboardCard from '../components/NationalLeaderboardCard';
import StudentNavbar from '../components/layout/StudentNavbar';

const LatihanSoalUMResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ujianId: routeUjianId, latihanId: routeLatihanId, sessionId } = useParams();
  const { user, isAdmin, logout } = useAuth();
  const [filter, setFilter] = useState('all');
  const [isDiscussOpen, setIsDiscussOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const openDiscussion = (question) => {
    setSelectedQuestion(question);
    setIsDiscussOpen(true);
  };

  const stateData = location.state || {};
  const haveStateQuestions = Array.isArray(stateData.questions) && stateData.questions.length > 0;

  useEffect(() => {
    const fetchResult = async () => {
      if (!sessionId || haveStateQuestions) return;
      setLoading(true);
      try {
        const res = await ujianMandiriService.getLatihanResult(sessionId);
        setResultData(res.data?.data || null);
      } catch (err) {
        console.error('Failed to fetch UM latihan result:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [sessionId, haveStateQuestions]);

  const haveApiResult = !!resultData;

  const effectiveQuestions = haveStateQuestions
    ? (stateData.questions || [])
    : (resultData?.questions || []);

  const effectiveAnswers = haveStateQuestions ? (stateData.answers || {}) : {};

  const latihanName = haveStateQuestions
    ? (stateData.latihanName || 'Latihan')
    : (resultData?.latihanName || 'Latihan');

  const ujianName = haveStateQuestions
    ? (stateData.ujianName || '')
    : (resultData?.ujianName || '');

  const ujianId = haveStateQuestions
    ? (stateData.ujianId || routeUjianId || '')
    : (resultData?.ujianId || routeUjianId || '');

  const latihanId = haveStateQuestions
    ? (stateData.latihanId || routeLatihanId || '')
    : (resultData?.latihanId || routeLatihanId || '');

  useEffect(() => {
    if (latihanId) {
      setLeaderboardLoading(true);
      ujianMandiriService.getLatihanLeaderboard(latihanId, 10)
        .then((res) => {
          if (res.data?.success) {
            setLeaderboard(res.data.data);
          }
        })
        .catch((err) => console.error('Error fetching UM latihan leaderboard:', err))
        .finally(() => setLeaderboardLoading(false));
    }
  }, [latihanId]);

  const irtData = haveStateQuestions
    ? (stateData.irtData || null)
    : (resultData
        ? {
            irtScore: resultData.irtScore,
            ...(resultData.scoreBreakdown || {}),
          }
        : null);

  const totalQuestions = effectiveQuestions.length;
  let correctCount = 0;
  let questionResults = [];

  if (haveStateQuestions) {
    questionResults = effectiveQuestions.map((q, idx) => {
      const chosenId = effectiveAnswers[idx];
      const chosenChoice = q.choices?.find(c => c.id === chosenId) || null;
      const correctChoice = q.choices?.find(c => c.is_correct) || null;
      const isCorrect = chosenChoice?.is_correct === true;
      if (isCorrect) correctCount++;
      return { ...q, idx, chosenId, chosenChoice, correctChoice, isCorrect, isAnswered: !!chosenId };
    });
  } else {
    questionResults = effectiveQuestions.map((q, idx) => {
      const choices = q.choices || [];
      const correctChoice = choices.find(c => c.is_correct) || null;
      const chosenChoice = q.chosenChoiceId ? choices.find(c => c.id === q.chosenChoiceId) || null : null;
      const isCorrect = q.isCorrect === true;
      if (isCorrect) correctCount++;
      return {
        ...q,
        idx: q.position ? q.position - 1 : idx,
        chosenId: chosenChoice?.id || null,
        chosenChoice,
        correctChoice,
        isCorrect,
        isAnswered: !!q.chosenChoiceId,
      };
    });
  }

  // For history mode (no state questions), trust backend aggregate for correctCount
  if (!haveStateQuestions && resultData) {
    if (typeof resultData.correctCount === 'number') {
      correctCount = resultData.correctCount;
    } else if (typeof resultData.scoreBreakdown?.benar === 'number') {
      correctCount = resultData.scoreBreakdown.benar;
    }
  }

  const unansweredCount = haveStateQuestions
    ? (typeof irtData?.unanswered === 'number'
        ? irtData.unanswered
        : questionResults.filter(r => !r.isAnswered).length)
    : (typeof resultData?.unansweredCount === 'number'
        ? resultData.unansweredCount
        : (resultData?.scoreBreakdown?.kosong ?? 0));

  const incorrectCount = haveStateQuestions
    ? (typeof irtData?.incorrect === 'number'
        ? irtData.incorrect
        : questionResults.filter(r => r.isAnswered && !r.isCorrect).length)
    : (typeof resultData?.incorrectCount === 'number'
        ? resultData.incorrectCount
        : (resultData?.scoreBreakdown?.salah ?? Math.max(0, totalQuestions - correctCount - unansweredCount)));

  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const filteredResults = filter === 'wrong'
    ? questionResults.filter(r => (haveStateQuestions ? (r.isAnswered && !r.isCorrect) : !r.isCorrect))
    : questionResults;

  if (!haveStateQuestions && !haveApiResult) {
    if (sessionId && loading) {
      return (
        <div className="bg-[#faf8ff] min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-5 text-[#424656] font-medium text-[15px]">Memuat hasil latihan...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-[#faf8ff] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">info</span>
          <h2 className="text-[24px] font-bold text-[#191b24] mb-2">Tidak ada data hasil</h2>
          <p className="text-[#424656] mb-6">Silakan selesaikan latihan terlebih dahulu.</p>
          <button onClick={() => navigate('/ujian-mandiri')} className="px-8 py-3 bg-[#0050cb] text-white font-bold rounded-xl hover:shadow-lg transition-all">
            Ke Halaman Ujian Mandiri
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8ff] text-[#191b24] min-h-screen flex flex-col font-sans">
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />

      <main className="flex-grow">
        {/* Back Button */}
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-4 pb-2">
          <button 
            onClick={() => navigate(`/ujian-mandiri/${ujianId}`)} 
            className="flex items-center gap-2 text-[#0050cb] hover:text-[#003fb2] font-semibold text-[14px] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Kembali ke {ujianName || 'Ujian'}</span>
          </button>
        </div>

        <section className="py-12 md:py-20 px-4 md:px-10 max-w-[1440px] mx-auto">
          <div className="relative overflow-hidden bg-[#0066ff] rounded-[24px] p-8 md:p-16 text-white flex flex-col items-center text-center shadow-lg">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-[#00c1fd] opacity-10 rounded-full blur-2xl"></div>
            <div className="z-10 flex flex-col items-center">
              <div className="mb-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">school</span>
                {ujianName}
              </div>
              <div className="mb-6 inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {score >= 70 ? 'workspace_premium' : score >= 40 ? 'emoji_events' : 'school'}
                </span>
              </div>
              <h1 className="text-[28px] sm:text-[36px] md:text-[48px] font-bold mb-4 leading-tight">
                {score >= 80 ? 'Excellent!' : score >= 60 ? 'Bagus Sekali!' : score >= 40 ? 'Terus Berlatih!' : 'Jangan Menyerah!'}
              </h1>
              <p className="text-[16px] md:text-[18px] text-white/80 max-w-2xl mb-6 leading-relaxed">
                Kamu telah menyelesaikan latihan <strong>{latihanName}</strong>. 
                {score >= 70 ? ' Kemampuan analitismu menunjukkan progres yang bagus.' : ' Review pembahasan di bawah untuk memahami konsep lebih baik.'}
              </p>
              {irtData?.scoringMethod && (
                <div className="mb-8 text-xs text-white/90 bg-white/15 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-1.5 w-fit">
                  <span className="material-symbols-outlined text-[16px]">sports_score</span>
                  <span>Sistem Penilaian: <strong>{irtData.scoringMethod}</strong></span>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 w-full max-w-2xl">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center">
                  <span className="text-[32px] md:text-[40px] font-bold">{irtData?.irtScore ?? score}</span>
                  <span className="text-[10px] md:text-[12px] text-white/60 uppercase tracking-wider font-semibold">Skor</span>
                  <span className="text-[10px] text-white/40 mt-0.5">{irtData?.scoringMethod ? 'Poin' : '/100'}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[#00c1fd]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-[20px] md:text-[24px] font-semibold">{correctCount}</span>
                  </div>
                  <span className="text-[10px] md:text-[12px] text-white/60 uppercase tracking-wider font-semibold">Benar</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[#ffdad6]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    <span className="text-[20px] md:text-[24px] font-semibold">{incorrectCount}</span>
                  </div>
                  <span className="text-[10px] md:text-[12px] text-white/60 uppercase tracking-wider font-semibold">Salah</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-white/80">quiz</span>
                    <span className="text-[20px] md:text-[24px] font-semibold">{totalQuestions}</span>
                  </div>
                  <span className="text-[10px] md:text-[12px] text-white/60 uppercase tracking-wider font-semibold">Total Soal</span>
                  {typeof unansweredCount === 'number' && (
                    <span className="text-[10px] text-white/80 mt-1">
                      Kosong: <strong>{unansweredCount}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Pembahasan */}
          <section className="lg:col-span-8 order-2 lg:order-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
            <div>
              <h2 className="text-[22px] font-bold text-[#191b24]">Pembahasan Soal</h2>
              <p className="text-[13px] text-[#424656]">Review setiap soal dan pahami penjelasan jawaban yang benar.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 font-medium text-[14px] rounded-lg flex items-center gap-2 transition-colors ${
                  filter === 'all' ? 'bg-[#0050cb] text-white' : 'bg-[#ecedfa] text-[#424656] hover:bg-[#e1e2ee]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                Semua Soal
              </button>
              <button 
                onClick={() => setFilter('wrong')}
                className={`px-4 py-2 font-medium text-[14px] rounded-lg flex items-center gap-2 transition-colors ${
                  filter === 'wrong' ? 'bg-[#ba1a1a] text-white' : 'bg-[#ecedfa] text-[#424656] hover:bg-[#e1e2ee]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">error</span>
                Salah Saja ({incorrectCount})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredResults.map((qr) => (
              <article key={qr.id} className="bg-white rounded-[16px] border border-[#c2c6d8]/30 shadow-sm overflow-hidden">
                <div className="p-4 md:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-[#e1e2ee] text-[#424656] w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[14px]">
                        {String(qr.idx + 1).padStart(2, '0')}
                      </span>
                      <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg ${
                        qr.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        qr.difficulty === 'hard' ? 'bg-red-100 text-red-700' : 'bg-[#c2e8ff] text-[#004d67]'
                      }`}>
                        {qr.difficulty === 'easy' ? 'Mudah' : qr.difficulty === 'hard' ? 'Sulit' : 'Sedang'}
                      </span>
                    </div>
                     <span className={`flex items-center gap-1 font-medium text-[12px] ${
                        qr.isCorrect
                          ? 'text-[#006688]'
                          : !qr.isAnswered
                          ? 'text-[#727687]'
                          : 'text-[#ba1a1a]'
                      }`}>
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {qr.isCorrect ? 'check_circle' : !qr.isAnswered ? 'remove_circle' : 'cancel'}
                        </span>
                        {qr.isCorrect ? 'Benar' : !qr.isAnswered ? 'Kosong' : 'Salah'}
                      </span>
                  </div>

                  {qr.image_url && qr.image_position === 'before' && (
                    <div className="mb-4">
                      <ZoomableImage src={qr.image_url} alt="Soal" className="max-w-full max-h-64 object-contain rounded-xl border border-[#e0e2f0]" />
                    </div>
                  )}
                  {qr.stimulus && (
                    <div className="mb-3 text-[14px] text-gray-600 bg-gray-50 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                      <MathText text={qr.stimulus} />
                    </div>
                  )}
                  <MathText className="text-[14px] md:text-[15px] font-normal mb-4 leading-relaxed" text={qr.content || ''} />
                  {qr.image_url && qr.image_position !== 'before' && (
                    <div className="mb-4">
                      <ZoomableImage src={qr.image_url} alt="Soal" className="max-w-full max-h-64 object-contain rounded-xl border border-[#e0e2f0]" />
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    {(qr.choices || []).map((choice) => {
                      const isChosen = choice.id === qr.chosenId;
                      const isCorrectChoice = choice.is_correct;
                      
                      let borderClass = 'border border-[#c2c6d8]/50 bg-[#faf8ff]';
                      let labelClass = 'border border-[#c2c6d8] text-[#424656]';
                      let textClass = 'text-[#424656]';
                      let icon = null;
                      let tag = null;

                      if (isCorrectChoice) {
                        borderClass = 'border-2 border-[#006688] bg-[#c2e8ff]/20';
                        labelClass = isChosen ? 'bg-[#006688] text-white' : 'border-2 border-[#006688] text-[#006688]';
                        textClass = 'text-[#191b24] font-medium';
                        icon = <span className="material-symbols-outlined text-[#006688]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>;
                        if (!isChosen) tag = <div className="absolute -top-3 left-4 px-2 py-0.5 bg-[#006688] text-white text-[10px] rounded font-bold uppercase">Jawaban Benar</div>;
                      }

                      if (isChosen && !isCorrectChoice) {
                        borderClass = 'border-2 border-[#ba1a1a] bg-[#ffdad6]/20';
                        labelClass = 'bg-[#ba1a1a] text-white';
                        textClass = 'text-[#191b24] font-medium';
                        icon = <span className="material-symbols-outlined text-[#ba1a1a]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>;
                        tag = <div className="absolute -top-3 left-4 px-2 py-0.5 bg-[#ba1a1a] text-white text-[10px] rounded font-bold uppercase">Jawabanmu</div>;
                      }

                      if (isChosen && isCorrectChoice) tag = null;

                      return (
                        <div key={choice.id} className={`relative flex items-center p-3 rounded-xl ${borderClass}`}>
                          {tag}
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 text-[12px] font-bold flex-shrink-0 ${labelClass}`}>{choice.label}</span>
                          <MathText className={`text-[13px] flex-1 ${textClass}`} text={choice.content || ''} />
                          {icon && <span className="flex-shrink-0 ml-2">{icon}</span>}
                        </div>
                      );
                    })}
                  </div>

                  {qr.correctChoice?.explanation && (
                    <div className="flex flex-col md:flex-row gap-4 mt-2">
                      <div className="flex-1 bg-[#f2f3ff] rounded-xl p-4 md:p-5 border-l-4 border-[#006688]">
                        <div className="flex items-center gap-2 mb-2 text-[#006688]">
                          <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                          <span className="text-[11px] uppercase tracking-wider font-bold">Penjelasan</span>
                        </div>
                        <MathText className="text-[13px] text-[#424656] leading-relaxed" text={qr.correctChoice.explanation || ''} />
                      </div>
                      <div className="md:w-60 flex-shrink-0">
                        <button 
                          onClick={() => openDiscussion(qr)}
                          className="w-full h-full min-h-[90px] bg-[#faf8ff] border-2 border-dashed border-[#006688]/20 rounded-xl p-4 flex flex-col items-center justify-center text-center group hover:border-[#006688] hover:bg-[#006688]/5 transition-all duration-300"
                        >
                          <div className="w-9 h-9 bg-[#006688] rounded-full flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform shadow-sm">
                            <span className="material-symbols-outlined text-[18px]">psychology</span>
                          </div>
                          <span className="text-[11px] font-bold text-[#006688] mb-1">Butuh Bantuan?</span>
                          <span className="text-[10px] text-[#424656] font-medium leading-tight">Chat dengan Bia</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

            {selectedQuestion && (
              <DiscussQuestionModal 
                isOpen={isDiscussOpen} 
                onClose={() => setIsDiscussOpen(false)} 
                question={selectedQuestion} 
              />
            )}
          </section>

          {/* Right Column: Leaderboard */}
          <aside className="lg:col-span-4 lg:self-start lg:sticky lg:top-24 order-1 lg:order-2">
            <NationalLeaderboardCard
              leaderboard={leaderboard}
              loading={leaderboardLoading}
              currentUserId={user?.id}
              typeText="latihan ini"
              type="um-latihan"
              id={latihanId}
            />
          </aside>
        </div>

        {/* Bottom Section: CTA */}
        <section className="pb-20 px-4 md:px-10 max-w-[1440px] mx-auto">
          {/* Bottom CTA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-[#f2f3ff] p-8 rounded-[20px] flex flex-col justify-between">
              <div>
                <h4 className="text-[24px] font-bold text-[#191b24] mb-2">Lanjutkan Belajar</h4>
                <p className="text-[16px] text-[#424656] mb-6">
                  {score >= 70 
                    ? 'Hasil yang bagus! Coba tingkatkan dengan latihan topik lain.' 
                    : `Berdasarkan hasilmu, kami sarankan untuk review kembali soal-soal yang salah dan pelajari pembahasannya.`}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => navigate(`/ujian-mandiri/${ujianId}`)}
                  className="bg-[#0050cb] text-white px-8 py-3 rounded-xl font-bold text-[14px] hover:shadow-lg transition-all"
                >
                  Kembali ke {ujianName}
                </button>
                <button 
                  onClick={() => navigate(`/ujian-mandiri/${ujianId}/latihan/${latihanId}`, { replace: true })}
                  className="border-2 border-[#0050cb] text-[#0050cb] px-8 py-3 rounded-xl font-bold text-[14px] hover:bg-[#0050cb] hover:text-white transition-all"
                >
                  Ulangi Latihan
                </button>
              </div>
            </div>
            <div className="bg-[#e1e2ee] p-8 rounded-[20px] flex flex-col items-center justify-center text-center">
              <div className={`w-20 h-20 rounded-full mb-4 flex items-center justify-center ${
                score >= 70 ? 'bg-green-100' : score >= 40 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <span className={`material-symbols-outlined text-[40px] ${
                  score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'
                }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {score >= 70 ? 'emoji_events' : score >= 40 ? 'trending_up' : 'psychology'}
                </span>
              </div>
              <h4 className="text-[20px] font-bold text-[#191b24] mb-2">
                {score >= 70 ? 'Siap Tryout?' : 'Terus Berlatih!'}
              </h4>
              <p className="text-[14px] text-[#424656] mb-6">
                {score >= 70 ? 'Coba simulasi tryout lengkap.' : 'Perkuat pemahaman konsep dulu.'}
              </p>
              <button 
                onClick={() => navigate(`/ujian-mandiri/${ujianId}`)}
                className="w-full py-3 border-2 border-[#0050cb] text-[#0050cb] rounded-xl font-bold text-[14px] hover:bg-[#0050cb] hover:text-white transition-colors"
              >
                {score >= 70 ? 'Lihat Tryout' : 'Pilih Latihan Lain'}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LatihanSoalUMResult;
