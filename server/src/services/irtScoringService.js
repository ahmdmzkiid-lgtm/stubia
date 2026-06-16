/**
 * Item Response Theory (IRT) Scoring Service for UTBK
 * Implements 3-Parameter Logistic (3PL) Model
 *
 * Formula: P(θ) = c + (1-c) / (1 + e^(-a(θ-b)))
 *
 * Where:
 * - θ (theta) = ability parameter
 * - a = item discrimination (how well question differentiates)
 * - b = item difficulty
 * - c = guessing parameter (pseudo-chance)
 *
 * For UTBK context:
 * - a (discrimination): typically 0.5 - 2.5, default 1.0
 * - b (difficulty): scaled from -3 to +3, mapped from easy/medium/hard
 * - c (guessing): typically 0.2 for 4-choice, 0.25 for 5-choice
 */

const DIFFICULTY_MAP = {
  easy: -1.5,      // Easier than average
  medium: 0,        // Average difficulty
  hard: 1.5,        // Harder than average
  hots: 2.0        // High Order Thinking Skills (hardest)
};

// Default IRT parameters per difficulty
// c (guessing) kept low so even partial correctness yields meaningful theta
const DEFAULT_IRT_PARAMS = {
  easy: { a: 0.8, b: -1.5, c: 0.10 },
  medium: { a: 1.0, b: 0, c: 0.10 },
  hard: { a: 1.2, b: 1.5, c: 0.10 },
  hots: { a: 1.5, b: 2.0, c: 0.10 }
};

// UTBK Reference: ~140 questions total for full test
// TPS: 40 questions (Penalaran Umum, Pengetahuan Kuantitatif, Literasi Bahasa, Penalaran Matematika)
// TKA: 100 questions (varies by program)
const FULL_TEST_QUESTIONS = 140;

/**
 * Calculate probability of correct response using 3PL model
 * @param {number} theta - Ability parameter
 * @param {object} itemParams - IRT parameters {a, b, c}
 * @returns {number} Probability of correct response (0-1)
 */
function probability3PL(theta, itemParams) {
  const { a = 1.0, b = 0, c = 0.25 } = itemParams;
  const exponent = -a * (theta - b);
  return c + (1 - c) / (1 + Math.exp(exponent));
}

/**
 * Calculate log-likelihood for a single response
 * @param {boolean} isCorrect - Whether the response was correct
 * @param {number} theta - Ability parameter
 * @param {object} itemParams - IRT parameters
 * @returns {number} Log-likelihood
 */
function logLikelihood(isCorrect, theta, itemParams) {
  const p = probability3PL(theta, itemParams);
  if (isCorrect) {
    return Math.log(Math.max(p, 1e-10));
  } else {
    return Math.log(Math.max(1 - p, 1e-10));
  }
}

/**
 * Calculate total log-likelihood for all responses at a given theta
 * @param {Array} responses - Array of {isCorrect, difficulty, irtParams}
 * @param {number} theta - Ability parameter
 * @returns {number} Total log-likelihood
 */
function totalLogLikelihood(responses, theta) {
  return responses.reduce((sum, resp) => {
    return sum + logLikelihood(resp.isCorrect, theta, resp.irtParams);
  }, 0);
}

/**
 * Estimate ability using Maximum Likelihood Estimation (MLE)
 * @param {Array} responses - Array of response objects
 * @param {object} options - Options for estimation
 * @returns {number} Estimated ability (theta)
 */
function estimateAbility(responses, options = {}) {
  const {
    lowerBound = -4,
    upperBound = 4,
    tolerance = 0.001,
    maxIterations = 100
  } = options;

  if (responses.length === 0) return -4;
  if (responses.length === 1) {
    // With only one response, estimate based on that
    return responses[0].isCorrect ? 1 : -1;
  }

  // Initial estimate using classical test theory
  const correctCount = responses.filter(r => r.isCorrect).length;
  const initialTheta = ((correctCount / responses.length) - 0.5) * 6;

  // Grid search for maximum log-likelihood
  let bestTheta = initialTheta;
  let bestLL = totalLogLikelihood(responses, initialTheta);

  // Step size for grid search
  const step = 0.1;
  for (let theta = lowerBound; theta <= upperBound; theta += step) {
    const ll = totalLogLikelihood(responses, theta);
    if (ll > bestLL) {
      bestLL = ll;
      bestTheta = theta;
    }
  }

  return Math.max(lowerBound, Math.min(upperBound, bestTheta));
}

/**
 * Convert theta (ability) + mastery to UTBK scale score (0-1000)
 * Blends IRT theta with raw correctness so users always get credit for correct answers
 * @param {number} theta - Ability parameter (-4 to 4)
 * @param {number} correct - Number of correct answers (optional)
 * @param {number} total - Total answered questions (optional)
 * @returns {number} UTBK score (0-1000)
 */
function thetaToScore(theta, correct = null, total = null) {
  const minScore = 0;
  const maxScore = 1000;

  // IRT component: map theta [-4, 4] to [0, 1]
  const irtNormalized = Math.max(0, Math.min(1, (theta + 4) / 8));

  // If we don't have mastery data, use pure IRT
  if (correct === null || total === null || total === 0) {
    return Math.max(minScore, Math.min(maxScore, Math.round(irtNormalized * maxScore)));
  }

  // Mastery component: raw percentage correct
  const masteryNormalized = correct / total;

  // Blend 50% IRT (difficulty-aware) + 50% mastery (intuitive)
  // This guarantees that any correct answers contribute to the score
  const blended = 0.5 * irtNormalized + 0.5 * masteryNormalized;

  const finalScore = Math.round(blended * (maxScore - minScore) + minScore);
  return Math.max(minScore, Math.min(maxScore, finalScore));
}

/**
 * Calculate IRT-based score for a tryout session
 * @param {Array} answers - Array of answer objects with difficulty info
 * @returns {object} Detailed IRT scoring results
 */
function calculateIRTScore(answers) {
  const totalQuestions = answers.length;

  if (totalQuestions === 0) {
    return {
      theta: -4,
      rawScore: 0,
      totalScore: 0,
      benar: 0,
      salah: 0,
      kosong: totalQuestions,
      mastery: 0,
      percentile: 1,
      subjectScores: {},
      itemAnalysis: [],
      totalQuestionsAnswered: 0
    };
  }

  // Count basic stats
  let benar = 0;
  let salah = 0;
  let kosong = 0;

  // Build response history for IRT
  const responses = answers.map(ans => {
    const difficulty = ans.difficulty || 'medium';
    const irtParams = ans.irtParams || DEFAULT_IRT_PARAMS[difficulty] || DEFAULT_IRT_PARAMS.medium;

    if (!ans.chosen_choice_id) {
      kosong++;
    } else if (ans.is_correct) {
      benar++;
    } else {
      salah++;
    }

    return {
      isCorrect: ans.chosen_choice_id ? ans.is_correct : false,
      difficulty,
      irtParams,
      questionId: ans.question_id,
      chosenChoiceId: ans.chosen_choice_id
    };
  });

  // Estimate ability using IRT
  const theta = estimateAbility(responses);

  // Calculate raw score (weighted by difficulty)
  let rawScore = 0;
  const WEIGHTS = { easy: 2, medium: 3, hard: 4, hots: 5 };

  answers.forEach(ans => {
    const difficulty = ans.difficulty || 'medium';
    const weight = WEIGHTS[difficulty] || 3;

    if (ans.chosen_choice_id) {
      if (ans.is_correct) {
        rawScore += weight * 4;
      } else {
        rawScore -= weight * 1;
      }
    }
  });

  // Calculate percentage of correct answers
  const masteryPercent = Math.round((benar / totalQuestions) * 100);

  // Estimate percentile based on mastery
  const percentile = Math.max(1, Math.min(99, Math.round(masteryPercent * 0.9)));

  // Analyze each item
  const itemAnalysis = responses.map((resp, idx) => {
    const pCorrect = probability3PL(theta, resp.irtParams);
    const info = (resp.irtParams.a * resp.irtParams.a * (pCorrect - resp.irtParams.c) * (1 - pCorrect)) /
                 Math.pow(1 - resp.irtParams.c, 2);

    return {
      questionIndex: idx + 1,
      questionId: resp.questionId,
      difficulty: resp.difficulty,
      isCorrect: resp.isCorrect,
      chosenChoiceId: resp.chosenChoiceId || null,
      probabilityCorrect: Math.round(pCorrect * 100),
      informationValue: Math.round(info * 100) / 100,
      status: resp.isCorrect ? 'correct' : 'incorrect'
    };
  });

  // Group scores by subject if available
  const subjectScores = {};
  if (answers[0]?.subject_name) {
    answers.forEach(ans => {
      const subject = ans.subject_name || 'Unknown';
      if (!subjectScores[subject]) {
        subjectScores[subject] = {
          benar: 0,
          salah: 0,
          kosong: 0,
          total: 0,
          theta: 0,
          rawScore: 0
        };
      }

      subjectScores[subject].total++;
      if (ans.chosen_choice_id) {
        if (ans.is_correct) {
          subjectScores[subject].benar++;
        } else {
          subjectScores[subject].salah++;
        }
      } else {
        subjectScores[subject].kosong++;
      }
    });

    // Calculate subject-specific theta and scores
    Object.keys(subjectScores).forEach(subject => {
      const subData = subjectScores[subject];
      const subResponses = responses.filter((_, idx) =>
        answers[idx].subject_name === subject
      );

      if (subResponses.length > 0) {
        subData.theta = estimateAbility(subResponses);
        subData.mastery = Math.round((subData.benar / subData.total) * 100);

        // Calculate per-subject score (0-1000) blending theta + mastery
        subData.percentage = subData.mastery;
        subData.score = thetaToScore(subData.theta, subData.benar, subData.total);

        // Provide status
        if (subData.mastery >= 85) {
          subData.status = 'Sangat Baik';
          subData.statusColor = 'primary';
          subData.description = 'Penguasaan konsep sangat baik. Pertahankan dan fokus pada soal HOTS.';
        } else if (subData.mastery >= 70) {
          subData.status = 'Baik';
          subData.statusColor = 'secondary';
          subData.description = 'Pemahaman dasar baik. Perlu latihan lebih untuk meningkatkan akurasi.';
        } else if (subData.mastery >= 50) {
          subData.status = 'Perlu Fokus';
          subData.statusColor = 'tertiary';
          subData.description = 'Perlu perhatian lebih. Fokus untuk memahami konsep dasar terlebih dahulu.';
        } else {
          subData.status = 'Perlu Perbaikan';
          subData.statusColor = 'tertiary';
          subData.description = 'Perlu perbaikan signifikan. Disarankan untuk review materi dari awal.';
        }
      }
    });
  }

  // Calculate total score = average of all subtest scores (each 0-1000)
  // If no subtests, fall back to global theta score
  const subjectKeys = Object.keys(subjectScores);
  let totalScore;
  if (subjectKeys.length > 0) {
    const sumSubjectScores = subjectKeys.reduce((sum, key) => sum + (subjectScores[key].score || 0), 0);
    totalScore = Math.round(sumSubjectScores / subjectKeys.length);
  } else {
    totalScore = thetaToScore(theta, benar, totalQuestions);
  }

  return {
    theta: Math.round(theta * 100) / 100,
    rawScore,
    totalScore,
    benar,
    salah,
    kosong,
    total: totalQuestions,
    mastery: masteryPercent,
    percentile,
    subjectScores,
    itemAnalysis,
    scoringMethod: 'IRT-3PL',
    metadata: {
      model: '3-Parameter Logistic Model',
      abilityRange: [-4, 4],
      scoreRange: [0, 1000],
      weights: WEIGHTS,
      totalQuestionsAnswered: totalQuestions,
      referenceQuestions: FULL_TEST_QUESTIONS
    }
  };
}

/**
 * Simplified scoring for real-time results (without full IRT estimation)
 * Used during tryout for quick feedback
 * @param {Array} answers - Current answers
 * @returns {object} Simplified scoring results
 */
function calculateQuickScore(answers) {
  let benar = 0;
  let salah = 0;
  let kosong = 0;
  const WEIGHTS = { easy: 2, medium: 3, hard: 4, hots: 5 };

  answers.forEach(ans => {
    if (!ans.chosen_choice_id) {
      kosong++;
    } else if (ans.is_correct) {
      benar++;
    } else {
      salah++;
    }
  });

  // Simple weighted score
  const rawScore = answers.reduce((score, ans) => {
    if (!ans.chosen_choice_id) return score;
    const weight = WEIGHTS[ans.difficulty] || 3;
    return score + (ans.is_correct ? weight * 4 : -weight * 1);
  }, 0);

  // Quick theta estimation
  const totalQuestions = answers.length;
  const pCorrect = totalQuestions > 0 ? benar / totalQuestions : 0;
  const theta = (pCorrect - 0.5) * 4;
  const totalScore = thetaToScore(theta, benar, totalQuestions);

  return {
    theta: Math.round(theta * 100) / 100,
    rawScore,
    totalScore,
    benar,
    salah,
    kosong,
    total: totalQuestions,
    mastery: Math.round(pCorrect * 100),
    scoringMethod: 'Quick-IRT'
  };
}

/**
 * Get difficulty-based description for a subject
 * @param {number} masteryPercent - Mastery percentage
 * @param {number} avgSpeed - Average time per question in seconds
 * @returns {object} Status info
 */
function getStatusFromMastery(masteryPercent, avgSpeed = 60) {
  if (masteryPercent >= 85) {
    return {
      status: 'Sangat Baik',
      statusColor: 'primary',
      description: 'Penguasaan konsep sangat baik. Pertahankan dan fokus pada soal HOTS.',
      icon: 'check_circle'
    };
  } else if (masteryPercent >= 70) {
    return {
      status: 'Baik',
      statusColor: 'secondary',
      description: 'Pemahaman dasar baik. Perlu latihan lebih untuk meningkatkan akurasi.',
      icon: 'check_circle'
    };
  } else if (masteryPercent >= 50) {
    return {
      status: 'Perlu Fokus',
      statusColor: 'tertiary',
      description: 'Perlu perhatian lebih. Fokus untuk memahami konsep dasar terlebih dahulu.',
      icon: 'circle'
    };
  } else {
    return {
      status: 'Perlu Perbaikan',
      statusColor: 'tertiary',
      description: 'Perlu perbaikan signifikan. Disarankan untuk review materi dari awal.',
      icon: 'circle'
    };
  }
}

module.exports = {
  calculateIRTScore,
  calculateQuickScore,
  probability3PL,
  estimateAbility,
  thetaToScore,
  getStatusFromMastery,
  DEFAULT_IRT_PARAMS,
  DIFFICULTY_MAP,
  FULL_TEST_QUESTIONS
};
