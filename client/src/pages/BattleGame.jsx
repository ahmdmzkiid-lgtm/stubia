import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { battleService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import MathText from '../components/MathText';
import ZoomableImage from '../components/ui/ZoomableImage';

const BattleGame = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { matchId, subjectName, questionCount = 5, questionIds = [] } = location.state || {};

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // This is now display index
  const [serverQuestionIndex, setServerQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [matchStatus, setMatchStatus] = useState('waiting');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answeredQuestions, setAnsweredQuestions] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [finalScores, setFinalScores] = useState(null);
  const [showCorrect, setShowCorrect] = useState(null);

  const pollRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const gameOverRef = useRef(false);
  const lastQuestionIndexRef = useRef(0);

  useEffect(() => {
    if (!matchId) {
      navigate('/battle');
      return;
    }
    fetchQuestions();
    startPolling();
    return () => clearInterval(pollRef.current);
  }, [matchId]);

  // Handle server advancing to next question
  useEffect(() => {
    if (serverQuestionIndex > currentQuestionIndex) {
      // If we answered the current question, wait 2.5s to show result before advancing
      if (answeredQuestions[currentQuestionIndex] !== undefined) {
        clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = setTimeout(() => {
          setCurrentQuestionIndex(serverQuestionIndex);
        }, 2500);
      } else {
        // If we didn't answer (e.g., time ran out), advance immediately
        setCurrentQuestionIndex(serverQuestionIndex);
      }
    }
  }, [serverQuestionIndex, currentQuestionIndex, answeredQuestions]);

  // Reset answer feedback when question changes
  useEffect(() => {
    if (currentQuestionIndex !== lastQuestionIndexRef.current) {
      setShowCorrect(null);
      lastQuestionIndexRef.current = currentQuestionIndex;
    }
  }, [currentQuestionIndex]);

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

  const fetchQuestions = async () => {
    try {
      if (!questionIds || questionIds.length === 0) {
        setLoading(false);
        return;
      }
      const res = await battleService.getQuestions(questionIds);
      const qs = Array.isArray(res.data?.data) ? res.data.data : [];
      setQuestions(qs);
    } catch (err) {
      toast.error('Gagal memuat soal');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    // Poll immediately, then every 1s
    pollMatch();
    pollRef.current = setInterval(pollMatch, 1000);
  };

  const pollMatch = async () => {
    if (gameOverRef.current) return;
    try {
      const res = await battleService.getMatchStatus(matchId);
      if (!res.data.success) return;
      const data = res.data.data;

      setParticipants(data.participants || []);
      setMatchStatus(data.status);

      if (data.time_per_question) {
        setTimePerQuestion(data.time_per_question);
      }

      if (data.status === 'active') {
        // Use server-calculated values
        setServerQuestionIndex(data.current_question_index ?? 0);
        setTimeLeft(data.time_remaining ?? 30);
      }

      if ((data.status === 'completed' || data.status === 'time_up') && !gameOverRef.current) {
        gameOverRef.current = true;
        handleGameComplete();
      }
    } catch (err) {
      // suppress poll errors
    }
  };

  const handleAnswerSelect = async (choiceId) => {
    if (submitting || gameOver || answeredQuestions[currentQuestionIndex] !== undefined) return;

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setSubmitting(true);
    setAnsweredQuestions(prev => ({ ...prev, [currentQuestionIndex]: choiceId }));

    try {
      const res = await battleService.submitAnswer({
        match_id: matchId,
        question_id: currentQuestion.id,
        choice_id: choiceId,
      });
      if (res.data.success) {
        setShowCorrect({ isCorrect: res.data.data.is_correct });
      }
    } catch (err) {
      // suppress
    } finally {
      setSubmitting(false);
    }
  };

  const handleGameComplete = async () => {
    setGameOver(true);
    clearInterval(pollRef.current);

    try {
      const res = await battleService.completeMatch({ match_id: matchId });
      if (res.data.success) {
        setFinalScores(res.data.data.participants);
      }
    } catch (err) {
      console.error('Complete match error:', err);
    }
  };
  const handleExit = async () => {
    try {
      if (matchId) {
        await battleService.leaveMatch({ match_id: matchId });
      }
    } catch (err) {
      // suppress leave errors so user can still exit
    } finally {
      clearInterval(pollRef.current);
      clearTimeout(transitionTimeoutRef.current);
      navigate('/battle');
    }
  };

  const me = participants.find(p => p.is_me);
  const opponent = participants.find(p => !p.is_me);
  const currentQuestion = questions[currentQuestionIndex];
  const selectedChoiceId = answeredQuestions[currentQuestionIndex];

  // Timer urgency colors
  const timerUrgent = timeLeft <= 10;
  const timerCritical = timeLeft <= 5;

  // --- LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-5 text-[#424656] font-medium text-[15px]">Memuat soal...</p>
        </div>
      </div>
    );
  }

  // --- GAME OVER ---
  if (gameOver && finalScores) {
    const myScore = finalScores.find(p => p.user_id === user?.id);
    const oppScore = finalScores.find(p => p.user_id !== user?.id);
    const iWon = myScore?.win;
    const isDraw = myScore?.draw;

    const resultIcon = iWon ? 'emoji_events' : isDraw ? 'handshake' : 'sentiment_dissatisfied';
    const resultColor = iWon ? '#0050cb' : isDraw ? '#e65c00' : '#ba1a1a';
    const resultTitle = iWon ? 'Kamu Menang! 🎉' : isDraw ? 'Seri! 🤝' : 'Kamu Kalah 😢';
    const resultPoints = iWon ? '+20 Poin' : isDraw ? '+10 Poin' : '+0 Poin';

    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-4">
        <div className="bg-white border border-[#e0e2f0] rounded-3xl p-10 max-w-md w-full text-center shadow-xl">
          <span className="material-symbols-outlined text-[72px] mb-2" style={{ color: resultColor, fontVariationSettings: "'FILL' 1" }}>
            {resultIcon}
          </span>
          <h2 className="text-[28px] font-bold text-[#191b24] mb-1">{resultTitle}</h2>
          <span className={`inline-block text-[14px] font-bold px-4 py-1 rounded-full mb-4 ${
            iWon ? 'bg-green-50 text-green-700' : isDraw ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {resultPoints}
          </span>
          <div className="flex items-center justify-center gap-8 mt-4 mb-8 py-4">
            <div className="text-center">
              <p className="text-[#727687] text-[13px] mb-1">{me?.username || 'Kamu'}</p>
              <p className="text-[36px] font-bold text-[#0050cb]">{myScore?.score || 0}</p>
            </div>
            <div className="text-[#c2c6d8] font-bold text-[20px]">VS</div>
            <div className="text-center">
              <p className="text-[#727687] text-[13px] mb-1">{opponent?.username || 'Lawan'}</p>
              <p className="text-[36px] font-bold text-[#a33200]">{oppScore?.score || 0}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/battle')}
              className="flex-1 py-3.5 bg-[#0050cb] text-white rounded-xl font-bold hover:bg-[#003da6] transition-colors"
            >
              Main Lagi
            </button>
            <Link
              to={`/battle/leaderboard/${location.state?.subjectId}`}
              state={{ subjectName }}
              className="flex-1 py-3.5 border-2 border-[#0050cb] text-[#0050cb] rounded-xl font-bold hover:bg-[#e8eeff] transition-colors text-center"
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- WAITING ---
  if (matchStatus === 'waiting') {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 border-4 border-[#0050cb] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-[28px] font-bold text-[#191b24] mb-3">Menunggu Lawan...</h2>
          <p className="text-[#727687] text-[15px] mb-8">Pertandingan dimulai saat lawan bergabung</p>
          <div className="bg-white border border-[#e0e2f0] rounded-2xl px-8 py-5 inline-block shadow-sm mb-6">
            <p className="text-[#727687] text-[12px] uppercase tracking-wider mb-1">Kode Pertandingan</p>
            <p className="text-[28px] font-bold text-[#0050cb] tracking-widest font-mono">{matchId?.split('-')[0].toUpperCase()}</p>
          </div>
          <p className="text-[#c2c6d8] text-[13px]">Share kode ini ke teman untuk mulai bermain</p>
          <button onClick={handleExit} className="mt-8 text-[#727687] hover:text-[#0050cb] text-[14px] font-medium transition-colors">
            ← Keluar
          </button>
        </div>
      </div>
    );
  }

  // --- ACTIVE GAME ---
  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      {/* Header: Players + Timer */}
      <div className="bg-white border-b border-[#e0e2f0] shadow-sm">
        <div className="max-w-[900px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Player 1 (Me) */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-full bg-[#0050cb] flex items-center justify-center text-white font-bold text-[16px] flex-shrink-0">
                {(me?.username || 'K')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[#191b24] font-bold text-[14px] truncate">{me?.username || 'Kamu'}</p>
                <p className="text-[#0050cb] font-extrabold text-[22px] leading-tight">{me?.score || 0}</p>
              </div>
            </div>

            {/* Center Timer */}
            <div className="flex flex-col items-center flex-shrink-0 mx-4">
              <div
                className={`w-[72px] h-[72px] rounded-full flex items-center justify-center border-[5px] transition-colors relative ${
                  timerCritical ? 'border-[#ba1a1a] animate-pulse' : timerUrgent ? 'border-[#e65c00]' : 'border-[#0050cb]'
                }`}
              >
                {/* SVG progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#e0e2f0" strokeWidth="5" />
                  <circle
                    cx="36" cy="36" r="30" fill="none"
                    stroke={timerCritical ? '#ba1a1a' : timerUrgent ? '#e65c00' : '#0050cb'}
                    strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 30}`}
                    strokeDashoffset={`${2 * Math.PI * 30 * (1 - timeLeft / timePerQuestion)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s linear' }}
                  />
                </svg>
                <span className={`font-extrabold text-[24px] relative z-10 ${
                  timerCritical ? 'text-[#ba1a1a]' : timerUrgent ? 'text-[#e65c00]' : 'text-[#0050cb]'
                }`}>
                  {timeLeft}
                </span>
              </div>
              <p className="text-[#727687] text-[11px] font-bold mt-1 uppercase tracking-wider">
                {currentQuestionIndex + 1} / {questionCount}
              </p>
            </div>

            {/* Player 2 (Opponent) */}
            <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
              <div className="text-right min-w-0">
                <p className="text-[#191b24] font-bold text-[14px] truncate">{opponent?.username || 'Lawan'}</p>
                <p className="text-[#a33200] font-extrabold text-[22px] leading-tight">{opponent?.score || 0}</p>
              </div>
              <div className="w-11 h-11 rounded-full bg-[#a33200] flex items-center justify-center text-white font-bold text-[16px] flex-shrink-0">
                {(opponent?.username || 'L')[0].toUpperCase()}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="h-1.5 bg-[#e0e2f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0050cb] rounded-full transition-all duration-500"
                style={{ width: `${((currentQuestionIndex + 1) / questionCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-[800px]">
          {currentQuestion ? (
            <>
              {/* Question Card */}
              <div className="bg-white border border-[#e0e2f0] rounded-2xl p-6 mb-5 shadow-sm">
                {/* Answer feedback */}
                {showCorrect !== null && (
                  <div className={`flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-[13px] font-bold ${
                    showCorrect.isCorrect
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <span className="material-symbols-outlined text-[18px]">{showCorrect.isCorrect ? 'check_circle' : 'cancel'}</span>
                    {showCorrect.isCorrect ? 'Benar! +200 poin jika lawan salah, +100 jika sama-sama benar' : 'Salah! 0 poin untuk soal ini'}
                  </div>
                )}
                {selectedChoiceId !== undefined && showCorrect === null && (
                  <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl text-[13px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Mengirim jawaban...
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <span className="w-9 h-9 rounded-xl bg-[#0050cb] text-white flex items-center justify-center font-bold text-[14px]">
                    {currentQuestionIndex + 1}
                  </span>
                  <span className={`text-[12px] font-bold uppercase px-2.5 py-1 rounded-md ${
                    currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    currentQuestion.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                    'bg-[#f2f3ff] text-[#0050cb]'
                  }`}>
                    {currentQuestion.difficulty === 'easy' ? 'Mudah' : currentQuestion.difficulty === 'hard' ? 'Sulit' : 'Sedang'}
                  </span>
                </div>
                {currentQuestion.image_url && currentQuestion.image_position === 'before' && (
                  <ZoomableImage className="w-full max-h-60 object-contain rounded-xl mb-4 border border-[#e0e2f0]" src={currentQuestion.image_url} alt="Soal" />
                )}
                <MathText className="text-[15px] text-[#191b24] leading-relaxed" text={currentQuestion.content || ''} />
                {currentQuestion.image_url && currentQuestion.image_position !== 'before' && (
                  <ZoomableImage className="w-full max-h-60 object-contain rounded-xl mt-4 border border-[#e0e2f0]" src={currentQuestion.image_url} alt="Soal" />
                )}
              </div>

              {/* Answer Choices */}
              <div className="flex flex-col gap-3">
                {(currentQuestion.choices || []).map((choice) => {
                  const isSelected = selectedChoiceId === choice.id;
                  return (
                    <button
                      key={choice.id}
                      onClick={() => handleAnswerSelect(choice.id)}
                      disabled={selectedChoiceId !== undefined || submitting}
                      className={`group flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-[#0050cb] bg-[#e8eeff] shadow-sm'
                          : 'border-[#e0e2f0] bg-white hover:border-[#a8b4d9] hover:shadow-sm'
                      } ${selectedChoiceId !== undefined ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#0050cb] text-white'
                          : 'bg-[#ecedfa] text-[#424656] group-hover:bg-[#dae1ff]'
                      }`}>
                        {choice.label}
                      </span>
                      <MathText className="text-[14px] leading-relaxed text-[#424656]" text={choice.content || ''} />
                    </button>
                  );
                })}
              </div>

              {!selectedChoiceId && (
                <p className="text-center text-[#c2c6d8] text-[13px] mt-5">
                  Pilih jawaban sebelum waktu habis — soal lanjut otomatis
                </p>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-[48px] text-[#c2c6d8] mb-2">hourglass_empty</span>
              <p className="text-[#727687]">Memuat soal...</p>
            </div>
          )}
        </div>
      </div>

      {/* Exit */}
      <div className="text-center pb-4">
        <button onClick={handleExit} className="text-[#c2c6d8] hover:text-[#727687] text-[12px] transition-colors">
          Keluar dari pertandingan
        </button>
      </div>
    </div>
  );
};

export default BattleGame;
