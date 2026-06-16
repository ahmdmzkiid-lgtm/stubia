import { useState, useCallback, useRef } from 'react';
import { tryoutService, soalService } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Hook untuk fetch dan manage 160 soal tryout sekaligus
 * 
 * Features:
 * - Single API fetch untuk 160 soal
 * - Filter by category (subtes) tanpa API call tambahan
 * - User answers tracking dengan localStorage backup
 * - Submit all answers dalam satu request
 * - Clear loading state
 */
export const useTryoutFetch = () => {
  // ===== STATE MANAGEMENT =====
  const [allQuestions, setAllQuestions] = useState([]); // Semua 160 soal
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // User answers: { questionId: { choiceId, flagged, timeSpent } }
  const [userAnswers, setUserAnswers] = useState({});
  
  // Active subtest/category
  const [activeCategory, setActiveCategory] = useState(null);
  
  // Metadata
  const [metadata, setMetadata] = useState({
    totalQuestions: 0,
    totalCategories: [],
    questionsPerCategory: {},
    sessionId: null,
    startTime: null,
  });

  const toastIdRef = useRef(null);

  // ===== LOCALSTORAGE OPERATIONS =====
  /**
   * Load user answers dari localStorage
   */
  const loadAnswersFromStorage = useCallback((sessionId) => {
    try {
      const storageKey = `tryout_answers_${sessionId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setUserAnswers(JSON.parse(saved));
        console.log('✅ Answers restored from localStorage');
      }
    } catch (err) {
      console.warn('⚠️ Failed to restore answers from localStorage:', err);
    }
  }, []);

  /**
   * Save user answers ke localStorage
   */
  const saveAnswersToStorage = useCallback((sessionId, answers) => {
    try {
      const storageKey = `tryout_answers_${sessionId}`;
      localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch (err) {
      console.warn('⚠️ Failed to save answers to localStorage:', err);
    }
  }, []);

  // ===== FETCH 160 SOAL SEKALIGUS =====
  /**
   * Fetch all 160 questions dengan single API call
   * Menggunakan tryout_package_id untuk ambil soal spesifik tryout
   */
  const fetchAllQuestions = useCallback(async (packageId) => {
    setLoading(true);
    setError(null);
    
    // Show loading toast
    toastIdRef.current = toast.loading('📚 Memuat 160 soal tryout... (ini mungkin butuh beberapa detik)');
    
    try {
      const startTime = performance.now();

      // Fetch dengan tryoutService
      const response = await soalService.list({
        tryout_package_id: packageId,
        limit: 200, // Lebih besar dari 160 untuk memastikan semua terambil
      });

      const questions = response.data?.data || [];
      const endTime = performance.now();
      const fetchTime = ((endTime - startTime) / 1000).toFixed(2);

      if (!questions || questions.length === 0) {
        throw new Error('Tidak ada soal ditemukan untuk tryout ini');
      }

      // Organize questions by category/subject
      const questionsByCategory = {};
      questions.forEach((q) => {
        const category = q.subject?.category || 'uncategorized';
        if (!questionsByCategory[category]) {
          questionsByCategory[category] = [];
        }
        questionsByCategory[category].push(q);
      });

      // Set state
      setAllQuestions(questions);
      setMetadata({
        totalQuestions: questions.length,
        totalCategories: Object.keys(questionsByCategory),
        questionsPerCategory: Object.fromEntries(
          Object.entries(questionsByCategory).map(([cat, qs]) => [cat, qs.length])
        ),
        sessionId: packageId,
        startTime: new Date(),
      });

      // Set default active category to first category
      if (Object.keys(questionsByCategory).length > 0) {
        setActiveCategory(Object.keys(questionsByCategory)[0]);
      }

      // Load answers dari localStorage
      loadAnswersFromStorage(packageId);

      // Update toast
      toast.dismiss(toastIdRef.current);
      toast.success(
        `✅ Berhasil load ${questions.length} soal (${fetchTime}s)`,
        { duration: 3 }
      );

      console.log(`📊 Loaded ${questions.length} questions in ${fetchTime}s`);
      console.log('📁 Categories:', Object.keys(questionsByCategory));

    } catch (err) {
      toast.dismiss(toastIdRef.current);
      const errorMsg = err.response?.data?.error || err.message || 'Gagal memuat soal';
      setError(errorMsg);
      toast.error(`❌ ${errorMsg}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [loadAnswersFromStorage]);

  // ===== FILTERING LOGIC =====
  /**
   * Get questions untuk category aktif (TANPA API call tambahan)
   */
  const getQuestionsByCategory = useCallback(
    (category) => {
      if (!category) return allQuestions;
      return allQuestions.filter((q) => {
        const qCategory = q.subject?.category || 'uncategorized';
        return qCategory === category;
      });
    },
    [allQuestions]
  );

  /**
   * Get current questions berdasarkan active category
   */
  const getCurrentQuestions = useCallback(() => {
    return getQuestionsByCategory(activeCategory);
  }, [activeCategory, getQuestionsByCategory]);

  // ===== USER ANSWERS MANAGEMENT =====
  /**
   * Save user's answer untuk sebuah soal
   */
  const saveAnswer = useCallback(
    (questionId, choiceId, metadata = {}) => {
      setUserAnswers((prev) => {
        const updated = {
          ...prev,
          [questionId]: {
            choiceId: choiceId !== undefined ? choiceId : prev[questionId]?.choiceId,
            answerText: metadata.answerText !== undefined ? metadata.answerText : prev[questionId]?.answerText,
            flagged: prev[questionId]?.flagged || false,
            timeSpent: prev[questionId]?.timeSpent || 0,
            answeredAt: new Date().toISOString(),
            ...metadata,
          },
        };
        // Backup to localStorage
        if (metadata.sessionId || metadata?.sessionId) {
          saveAnswersToStorage(metadata.sessionId, updated);
        }
        return updated;
      });
    },
    [saveAnswersToStorage]
  );

  /**
   * Toggle flag untuk soal
   */
  const toggleFlag = useCallback((questionId) => {
    setUserAnswers((prev) => {
      const current = prev[questionId] || {};
      const updated = {
        ...prev,
        [questionId]: {
          ...current,
          flagged: !current.flagged,
        },
      };
      // Backup to localStorage
      if (metadata.sessionId) {
        saveAnswersToStorage(metadata.sessionId, updated);
      }
      return updated;
    });
  }, [metadata.sessionId, saveAnswersToStorage]);

  /**
   * Update time spent untuk soal
   */
  const updateTimeSpent = useCallback((questionId, seconds) => {
    setUserAnswers((prev) => {
      const current = prev[questionId] || {};
      return {
        ...prev,
        [questionId]: {
          ...current,
          timeSpent: (current.timeSpent || 0) + seconds,
        },
      };
    });
  }, []);

  /**
   * Get stats tentang user answers
   */
  const getAnswerStats = useCallback(() => {
    const stats = {
      totalAnswered: Object.keys(userAnswers).filter((qId) => userAnswers[qId]?.choiceId || userAnswers[qId]?.answerText).length,
      totalFlagged: Object.keys(userAnswers).filter((qId) => userAnswers[qId]?.flagged).length,
      totalUnanswered: metadata.totalQuestions - Object.keys(userAnswers).filter((qId) => userAnswers[qId]?.choiceId || userAnswers[qId]?.answerText).length,
      answersByCategory: {},
    };

    // Stats per category
    metadata.totalCategories.forEach((cat) => {
      const catQuestions = getQuestionsByCategory(cat);
      const catAnswered = catQuestions.filter((q) => userAnswers[q.id]?.choiceId || userAnswers[q.id]?.answerText).length;
      stats.answersByCategory[cat] = {
        answered: catAnswered,
        total: catQuestions.length,
        percentage: Math.round((catAnswered / catQuestions.length) * 100),
      };
    });

    return stats;
  }, [userAnswers, metadata, getQuestionsByCategory]);

  // ===== SUBMIT HANDLER =====
  /**
   * Submit semua 160 jawaban dalam satu request POST
   * Format: { sessionId, answers: [{ questionId, choiceId, flagged, timeSpent }, ...] }
   */
  const handleSubmitAllAnswers = useCallback(
    async (sessionId, onSuccess) => {
      setSubmitting(true);
      const toastId = toast.loading('📤 Mengirim jawaban... (mohon tunggu)');

      try {
        // Prepare payload dengan format yang sesuai dengan backend
        const answersPayload = Object.entries(userAnswers).map(([questionId, answer]) => ({
          questionId,
          choiceId: answer.choiceId || null,
          answerText: answer.answerText || null,
          flagged: answer.flagged || false,
          timeSpent: answer.timeSpent || 0,
        }));

        const payload = {
          sessionId,
          answers: answersPayload,
          stats: getAnswerStats(),
          submittedAt: new Date().toISOString(),
        };

        // POST ke endpoint baru /submit-bulk menggunakan tryoutService
        const response = await tryoutService.submitBulk(payload);

        toast.dismiss(toastId);

        if (response.data?.success) {
          toast.success('✅ Jawaban berhasil disubmit! Menghitung skor...');
          
          // Clear localStorage setelah berhasil submit
          localStorage.removeItem(`tryout_answers_${sessionId}`);
          
          // Callback success
          if (onSuccess) onSuccess(response.data);
        } else {
          throw new Error(response.data?.error || 'Gagal submit jawaban');
        }
      } catch (err) {
        toast.dismiss(toastId);
        const errorMsg = err.response?.data?.error || err.message || 'Gagal mengirim jawaban';
        toast.error(`❌ ${errorMsg}`);
        console.error('Submit error:', err);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [userAnswers, getAnswerStats]
  );

  // ===== UTILITY FUNCTIONS =====
  /**
   * Clear semua answers (dengan konfirmasi)
   */
  const clearAllAnswers = useCallback(() => {
    if (confirm('⚠️ Apakah Anda yakin ingin menghapus semua jawaban?')) {
      setUserAnswers({});
      localStorage.removeItem(`tryout_answers_${metadata.sessionId}`);
      toast.success('✅ Semua jawaban dihapus');
    }
  }, [metadata.sessionId]);

  /**
   * Get single question by ID
   */
  const getQuestionById = useCallback(
    (questionId) => {
      return allQuestions.find((q) => q.id === questionId);
    },
    [allQuestions]
  );

  // ===== RETURN OBJECT =====
  return {
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
    getQuestionsByCategory,
    getCurrentQuestions,
    saveAnswer,
    toggleFlag,
    updateTimeSpent,
    getAnswerStats,
    handleSubmitAllAnswers,
    setActiveCategory,
    clearAllAnswers,
    getQuestionById,
    saveAnswersToStorage,
    loadAnswersFromStorage,
  };
};

export default useTryoutFetch;
