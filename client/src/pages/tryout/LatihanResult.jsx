import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DiscussQuestionModal from '../../components/DiscussQuestionModal';
import MathText from '../../components/MathText';
import { tryoutService, activityService } from '../../services/api';
import NationalLeaderboardCard from '../../components/NationalLeaderboardCard';
import StudentNavbar from '../../components/layout/StudentNavbar';

const LatihanResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useParams();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [filter, setFilter] = useState('all'); // 'all' | 'wrong'
  const [loading, setLoading] = useState(false);

  // Discussion State
  const [isDiscussOpen, setIsDiscussOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);


  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Local state for API data
  const [apiData, setApiData] = useState(null);

  // Data passed from LatihanPraktik via navigation state
  const stateData = location.state || {};
  const { questions = [], answers = {}, subjectName = 'Latihan', subjectId = '', topicId = '', irtData = null } = apiData || stateData;

  useEffect(() => {
    if (subjectId) {
      setLeaderboardLoading(true);
      tryoutService.getLatihanLeaderboard(subjectId, topicId, 10)
        .then((res) => {
          if (res.data?.success) {
            setLeaderboard(res.data.data);
          }
        })
        .catch((err) => console.error('Error fetching latihan leaderboard:', err))
        .finally(() => setLeaderboardLoading(false));
    }
  }, [subjectId, topicId]);

  // Fetch from API when state is lost but sessionId is available
  useEffect(() => {
    if (!location.state && sessionId) {
      setLoading(true);
      activityService.getLatihanResult(sessionId)
        .then((res) => {
          if (res.data?.success && res.data.data?.questions?.length > 0) {
            setApiData(res.data.data);
          } else {
            setApiData(null);
          }
        })
        .catch((err) => {
          console.error('Error fetching latihan result:', err);
          setApiData(null);
        })
        .finally(() => setLoading(false));
    }
  }, [sessionId, location.state]);

  const openDiscussion = (question) => {
    setSelectedQuestion(question);
    setIsDiscussOpen(true);
  };

  // Calculate results
  const totalQuestions = questions.length;
  let correctCount = 0;
  const questionResults = questions.map((q, idx) => {
    // If data came from API, use pre-computed analysis
    if (apiData) {
      const isAnswered = q.isAnswered !== undefined 
        ? q.isAnswered 
        : ((q.question_type === 'short_answer' || q.question_type === 'complex_mc_tf') ? !!q.answerText : !!q.chosenChoiceId);
      const isCorrect = q.isCorrect === true;
      if (isCorrect) correctCount++;
      return { ...q, idx, chosenId: q.chosenChoiceId, chosenChoice: q.chosenChoice, correctChoice: q.correctChoice, isCorrect, isAnswered };
    }
     // Otherwise compute from state answers map
    const chosenId = answers[idx];
    const isShortAnswer = q.question_type === 'short_answer';
    const isComplexMcTf = q.question_type === 'complex_mc_tf';
    const correctChoice = q.choices?.find(c => c.is_correct) || null;
    let isCorrect = false;
    let chosenChoice = null;

    if (isShortAnswer) {
      isCorrect = !!(correctChoice && chosenId && correctChoice.content.trim().toLowerCase() === chosenId.trim().toLowerCase());
    } else if (isComplexMcTf) {
      try {
        const studentAnswers = chosenId ? (typeof chosenId === 'string' ? JSON.parse(chosenId) : chosenId) : {};
        isCorrect = (q.choices || []).every(c => {
          const studentAns = studentAnswers[c.label];
          return studentAns === c.is_correct;
        });
      } catch (e) {
        isCorrect = false;
      }
    } else {
      chosenChoice = q.choices?.find(c => c.id === chosenId) || null;
      isCorrect = chosenChoice?.is_correct === true;
    }

    if (isCorrect) correctCount++;
    return { ...q, idx, chosenId, chosenChoice, correctChoice, isCorrect, isAnswered: !!chosenId };
  });
  const unansweredCount = questionResults.filter(r => !r.isAnswered).length;
  const incorrectCount = totalQuestions - correctCount - unansweredCount;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // IRT Score from backend (0-1000 scale)
  const breakdown = apiData?.score_breakdown || {};
  const irtScore = irtData?.irtScore || breakdown.totalScore || 0;
  const theta = irtData?.theta || breakdown.theta || 0;
  const percentile = irtData?.percentile || breakdown.percentile || 0;

  const filteredResults = filter === 'wrong'
    ? questionResults.filter(r => !r.isCorrect)
    : questionResults;

  // Loading state
  if (loading || (!location.state && sessionId && !apiData)) {
    return (
      <div className="bg-[#faf8ff] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#424656]">Memuat hasil latihan...</p>
        </div>
      </div>
    );
  }

  // Redirect if no data
  if ((!location.state && !sessionId) || questions.length === 0) {
    return (
      <div className="bg-[#faf8ff] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[64px] text-[#c2c6d8] mb-4">info</span>
          <h2 className="text-[24px] font-bold text-[#191b24] mb-2">Tidak ada data hasil</h2>
          <p className="text-[#424656] mb-6">Silakan selesaikan latihan terlebih dahulu.</p>
          <button onClick={() => navigate('/latihan')} className="px-8 py-3 bg-[#0050cb] text-white font-bold rounded-xl hover:shadow-lg transition-all">
            Ke Halaman Latihan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8ff] text-[#191b24] min-h-screen flex flex-col font-sans">
      {/* TopAppBar */}
      <StudentNavbar user={user} isAdmin={isAdmin} onLogout={() => { logout(); navigate('/'); }} />

      <main className="flex-grow">
        {/* Back Button */}
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-4 pb-2">
          <button 
            onClick={() => navigate(`/latihan/${subjectId || ''}`)} 
            className="flex items-center gap-2 text-[#0050cb] hover:text-[#003fb2] font-semibold text-[14px] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span>Kembali ke Topik</span>
          </button>
        </div>

        {/* Hero Section: Celebratory Result */}
        <section className="py-6 sm:py-10 md:py-20 px-4 md:px-10 max-w-[1440px] mx-auto">
          <div className="relative overflow-hidden bg-[#0066ff] rounded-[16px] sm:rounded-[24px] p-5 sm:p-8 md:p-12 lg:p-16 text-white flex flex-col items-center text-center shadow-lg">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-32 sm:w-64 h-32 sm:h-64 bg-[#00c1fd] opacity-10 rounded-full blur-2xl"></div>
            <div className="z-10 flex flex-col items-center">
              <div className="mb-4 sm:mb-6 inline-flex items-center justify-center p-2.5 sm:p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <span className="material-symbols-outlined text-[32px] sm:text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {score >= 70 ? 'workspace_premium' : score >= 40 ? 'emoji_events' : 'school'}
                </span>
              </div>
              <h1 className="text-[22px] sm:text-[32px] md:text-[48px] font-bold mb-2 sm:mb-4 leading-tight">
                {score >= 80 ? 'Excellent!' : score >= 60 ? 'Bagus Sekali!' : score >= 40 ? 'Terus Berlatih!' : 'Jangan Menyerah!'}
              </h1>
              <p className="text-[13px] sm:text-[15px] md:text-[18px] text-white/80 max-w-2xl mb-6 sm:mb-10 md:mb-12 leading-relaxed">
                Kamu telah menyelesaikan latihan <strong>{subjectName}</strong>. 
                {score >= 70 ? ' Kemampuan analitismu menunjukkan progres yang bagus.' : ' Review pembahasan di bawah untuk memahami konsep lebih baik.'}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 md:gap-5 w-full max-w-3xl">
                {/* IRT Score */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-2.5 sm:p-4 md:p-6 flex flex-col items-center justify-center">
                  <span className="text-[20px] sm:text-[28px] md:text-[40px] font-bold">{irtScore}</span>
                  <span className="text-[8px] sm:text-[10px] md:text-[12px] text-white/60 uppercase tracking-wider font-semibold">Skor IRT</span>
                  <span className="text-[8px] sm:text-[10px] text-white/40 mt-0.5">/1000</span>
                </div>
                {/* Percentile */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-2.5 sm:p-4 md:p-6 flex flex-col items-center justify-center">
                  <span className="text-[18px] sm:text-[24px] md:text-[36px] font-bold">{percentile}<span className="text-[12px] sm:text-[16px]">%</span></span>
                  <span className="text-[8px] sm:text-[10px] md:text-[12px] text-white/60 uppercase tracking-wider font-semibold">Persentil</span>
                </div>
                {/* Correct */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-2.5 sm:p-4 md:p-6 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                    <span className="material-symbols-outlined text-[#00c1fd] text-[16px] sm:text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <span className="text-[16px] sm:text-[20px] md:text-[24px] font-semibold">{correctCount}</span>
                  </div>
                  <span className="text-[8px] sm:text-[10px] md:text-[12px] text-white/60 uppercase tracking-wider font-semibold">Benar</span>
                </div>
                {/* Incorrect */}
                <div className="hidden sm:flex bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-2.5 sm:p-4 md:p-6 flex-col items-center justify-center">
                  <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                    <span className="material-symbols-outlined text-[#ffdad6] text-[16px] sm:text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    <span className="text-[16px] sm:text-[20px] md:text-[24px] font-semibold">{incorrectCount}</span>
                  </div>
                  <span className="text-[8px] sm:text-[10px] md:text-[12px] text-white/60 uppercase tracking-wider font-semibold">Salah</span>
                </div>
                {/* Total */}
                <div className="hidden sm:flex bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-2.5 sm:p-4 md:p-6 flex-col items-center justify-center">
                  <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                    <span className="material-symbols-outlined text-white/80 text-[16px] sm:text-[22px]">quiz</span>
                    <span className="text-[16px] sm:text-[20px] md:text-[24px] font-semibold">{totalQuestions}</span>
                  </div>
                  <span className="text-[8px] sm:text-[10px] md:text-[12px] text-white/60 uppercase tracking-wider font-semibold">Total Soal</span>
                  {typeof unansweredCount === 'number' && (
                    <span className="text-[9px] sm:text-[10px] text-white/80 mt-1">
                      Kosong: <strong>{unansweredCount}</strong>
                    </span>
                  )}
                </div>
              </div>
              {/* Mobile-only: Salah + Total row */}
              <div className="flex sm:hidden gap-2 mt-2 w-full">
                <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2.5 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="material-symbols-outlined text-[#ffdad6] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                    <span className="text-[16px] font-semibold">{incorrectCount}</span>
                  </div>
                  <span className="text-[8px] text-white/60 uppercase tracking-wider font-semibold">Salah</span>
                </div>
                <div className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2.5 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="material-symbols-outlined text-white/80 text-[16px]">quiz</span>
                    <span className="text-[16px] font-semibold">{totalQuestions}</span>
                  </div>
                  <span className="text-[8px] text-white/60 uppercase tracking-wider font-semibold">Total</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 pb-8 sm:pb-12 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
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

            {/* Questions List */}
            <div className="space-y-4">
              {filteredResults.map((qr) => (
                <article key={qr.id} className="bg-white rounded-[16px] border border-[#c2c6d8]/30 shadow-sm overflow-hidden">
                  <div className="p-4 md:p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-[#e1e2ee] text-[#424656] w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[14px]">
                          {String(qr.idx + 1).padStart(2, '0')}
                        </span>
                        <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-lg ${
                          qr.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          qr.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                          'bg-[#c2e8ff] text-[#004d67]'
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

                    {/* Question Content */}
                    {/* TOP IMAGE */}
                    {qr.image_url && ['top', 'before', 'atas'].includes(qr.image_position) && (
                      <div className="mb-4">
                        <img className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={qr.image_url} alt="Soal" />
                      </div>
                    )}
                    {/* STIMULUS */}
                    {qr.stimulus && (
                      <div className="mb-4 text-[15px] text-[#191b24] leading-relaxed whitespace-pre-wrap">
                        <MathText text={qr.stimulus} />
                      </div>
                    )}
                    {/* MIDDLE IMAGE */}
                    {qr.image_url && ['middle', 'ditengah', 'tengah'].includes(qr.image_position) && (
                      <div className="mb-4">
                        <img className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={qr.image_url} alt="Soal" />
                      </div>
                    )}
                    <MathText className="text-[14px] md:text-[15px] font-semibold mb-4 leading-relaxed" text={qr.content || ''} />
                    {/* BOTTOM IMAGE */}
                    {qr.image_url && !['top', 'before', 'atas', 'middle', 'ditengah', 'tengah'].includes(qr.image_position) && (
                      <div className="mb-4">
                        <img className="w-full h-auto max-h-72 object-contain rounded-xl border border-[#e0e2f0]" src={qr.image_url} alt="Soal" />
                      </div>
                    )}

                    {/* Answer Choices */}
                    <div className="space-y-2 mb-4">
                      {qr.question_type === 'complex_mc_tf' ? (
                        <div className="space-y-2.5">
                          {(qr.choices || []).map((choice) => {
                            let studentAnswers = {};
                            try {
                              studentAnswers = qr.chosenId ? (typeof qr.chosenId === 'string' ? JSON.parse(qr.chosenId) : qr.chosenId) : {};
                            } catch(e) {}
                            const studentAns = studentAnswers[choice.label];
                            const isCorrectAnswer = choice.is_correct;
                            const studentGotIt = studentAns === isCorrectAnswer;
                            return (
                              <div key={choice.id} className={`relative flex items-start p-4 rounded-xl border-2 ${
                                studentGotIt ? 'border-[#006688] bg-[#c2e8ff]/10' : 'border-[#ba1a1a] bg-[#ffdad6]/10'
                              }`}>
                                <div className="flex-1 min-w-0">
                                  <MathText className="text-[13px] text-[#191b24]" text={choice.content || ''} />
                                  <div className="flex flex-wrap items-center gap-3 mt-2">
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${isCorrectAnswer ? 'bg-[#c2e8ff] text-[#006688]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
                                      Kunci: {isCorrectAnswer ? 'BENAR' : 'SALAH'}
                                    </span>
                                    {studentAns !== undefined ? (
                                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${studentAns ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                        Jawabanmu: {studentAns ? 'BENAR' : 'SALAH'}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                                        Jawabanmu: KOSONG
                                      </span>
                                    )}
                                    <span className="flex-shrink-0">
                                      <span className="material-symbols-outlined text-[18px] align-middle" style={{ fontVariationSettings: "'FILL' 1", color: studentGotIt ? '#006688' : '#ba1a1a' }}>
                                        {studentGotIt ? 'check_circle' : 'cancel'}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : qr.question_type === 'short_answer' ? (
                        <div className="space-y-2">
                          <div className={`relative flex items-center p-3 rounded-xl border-2 ${
                            qr.isCorrect
                              ? 'border-[#006688] bg-[#c2e8ff]/20'
                              : 'border-2 border-[#ba1a1a] bg-[#ffdad6]/20'
                          }`}>
                            <span className="text-[13px] font-bold text-gray-700 mr-2">Jawabanmu:</span>
                            <span className="text-[13px] text-gray-900 font-medium flex-1">{qr.chosenId || '(Tidak dijawab)'}</span>
                            <span className="flex-shrink-0 ml-2">
                              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1", color: qr.isCorrect ? '#006688' : '#ba1a1a' }}>
                                {qr.isCorrect ? 'check_circle' : 'cancel'}
                              </span>
                            </span>
                          </div>
                          {!qr.isCorrect && qr.correctChoice && (
                            <div className="relative flex items-center p-3 rounded-xl border border-[#006688] bg-[#c2e8ff]/10">
                              <span className="text-[13px] font-bold text-[#006688] mr-2">Jawaban Benar:</span>
                              <span className="text-[13px] text-[#006688] font-medium">{qr.correctChoice.content}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        (qr.choices || []).map((choice) => {
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

                          if (isChosen && isCorrectChoice) {
                            tag = null; // no tag needed, the green border is enough
                          }

                          return (
                            <div key={choice.id} className={`relative flex items-center p-3 rounded-xl ${borderClass}`}>
                              {tag}
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 text-[12px] font-bold flex-shrink-0 ${labelClass}`}>
                                {choice.label}
                              </span>
                              <MathText className={`text-[13px] flex-1 ${textClass}`} text={choice.content || ''} />
                              {icon && <span className="flex-shrink-0 ml-2">{icon}</span>}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Pembahasan / Explanation */}
                    {qr.correctChoice?.explanation && (
                      <div className="flex flex-col md:flex-row gap-4 mt-2">
                        <div className="flex-1 bg-[#f2f3ff] rounded-xl p-4 md:p-5 border-l-4 border-[#006688]">
                          <div className="flex items-center gap-2 mb-2 text-[#006688]">
                            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                            <span className="text-[11px] uppercase tracking-wider font-bold">Penjelasan</span>
                          </div>
                          <MathText className="text-[13px] text-[#424656] leading-relaxed" text={qr.correctChoice.explanation || ''} />
                        </div>

                        {/* Elegant Chat Button */}
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

            {/* Discuss Modal */}
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
              type="utbk-latihan"
              id={subjectId}
              topicId={topicId}
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
                  onClick={() => navigate(`/latihan/${subjectId}`)}
                  className="bg-[#0050cb] text-white px-8 py-3 rounded-xl font-bold text-[14px] hover:shadow-lg transition-all"
                >
                  Kembali ke Topik
                </button>
                <button 
                  onClick={() => navigate(`/latihan/praktik/${subjectId}`, { replace: true })}
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
                onClick={() => navigate(score >= 70 ? '/tryout/packages' : '/latihan')}
                className="w-full py-3 border-2 border-[#0050cb] text-[#0050cb] rounded-xl font-bold text-[14px] hover:bg-[#0050cb] hover:text-white transition-colors"
              >
                {score >= 70 ? 'Mulai Tryout' : 'Pilih Topik Lain'}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LatihanResult;
