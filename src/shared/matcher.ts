import { QuizItem, CurrentQuizState, MatchResult } from "./types";
import { normalizeText, computeSimilarityScore } from "./normalizer";

/**
 * Shared Matching Engine used by both Show Answer and Auto Click modes.
 * Supports Single Choice, Multiple Choice (MSQ), and Fill-In-The-Blank questions.
 */
export function matchQuestionAndAnswer(
  currentState: CurrentQuizState,
  database: QuizItem[]
): MatchResult {
  if (!database || database.length === 0) {
    return {
      matchedItem: null,
      matchedOptionIndex: -1,
      matchedOptionIndices: [],
      matchedOptionText: "",
      expectedAnswer: "",
      confidenceScore: 0,
      questionSimilarity: 0,
      answerSimilarity: 0,
      reason: "Local Quiz Database is empty.",
    };
  }

  const currentQNormalized = normalizeText(currentState.questionText);
  if (!currentQNormalized) {
    return {
      matchedItem: null,
      matchedOptionIndex: -1,
      matchedOptionIndices: [],
      matchedOptionText: "",
      expectedAnswer: "",
      confidenceScore: 0,
      questionSimilarity: 0,
      answerSimilarity: 0,
      reason: "Could not read question text from screen.",
    };
  }

  // 1. Find the best matching question in database
  let bestItem: QuizItem | null = null;
  let highestQSim = 0;

  for (const item of database) {
    const qSim = computeSimilarityScore(currentQNormalized, item.normalizedQuestion);
    if (qSim > highestQSim) {
      highestQSim = qSim;
      bestItem = item;
    }
    // Optimization: exact match early exit
    if (highestQSim === 100) break;
  }

  if (!bestItem || highestQSim < 45) {
    return {
      matchedItem: null,
      matchedOptionIndex: -1,
      matchedOptionIndices: [],
      matchedOptionText: "",
      expectedAnswer: "",
      confidenceScore: 0,
      questionSimilarity: highestQSim,
      answerSimilarity: 0,
      reason: `No matching question found in database (Best match was only ${highestQSim}%).`,
    };
  }

  // 2. Identify target answers (supports multiple correct answers like "a | b")
  let targetAnswers: string[] = [];
  if (bestItem.options && bestItem.options.length > 0) {
    targetAnswers = bestItem.options.map((s) => s.trim()).filter(Boolean);
  } else if (bestItem.answer && bestItem.answer.includes("|")) {
    targetAnswers = bestItem.answer.split("|").map((s) => s.trim()).filter(Boolean);
  } else if (bestItem.answer) {
    targetAnswers = [bestItem.answer.trim()];
  }

  const matchedOptionIndices: number[] = [];
  const matchedOptionTexts: string[] = [];
  let totalAnswerSim = 0;
  let matchesCount = 0;

  if (currentState.options && currentState.options.length > 0) {
    // For each target answer, find matching option index on screen
    for (const targetAns of targetAnswers) {
      const targetNorm = normalizeText(targetAns);
      let bestSim = 0;
      let bestIdx = -1;

      for (let i = 0; i < currentState.options.length; i++) {
        const opt = currentState.options[i];
        const optNorm = normalizeText(opt.text);
        const sim = computeSimilarityScore(optNorm, targetNorm);

        if (sim > bestSim) {
          bestSim = sim;
          bestIdx = i;
        }
      }

      // If matched with good similarity (>= 75%)
      if (bestIdx >= 0 && bestSim >= 75) {
        if (!matchedOptionIndices.includes(bestIdx)) {
          matchedOptionIndices.push(bestIdx);
          matchedOptionTexts.push(currentState.options[bestIdx].text);
          totalAnswerSim += bestSim;
          matchesCount++;
        }
      }
    }

    // Fallback: if no option passed 75%, pick best overall
    if (matchedOptionIndices.length === 0) {
      let highestSim = 0;
      let highestIdx = -1;
      for (let i = 0; i < currentState.options.length; i++) {
        const opt = currentState.options[i];
        const optNorm = normalizeText(opt.text);
        for (const targetAns of targetAnswers) {
          const sim = computeSimilarityScore(optNorm, normalizeText(targetAns));
          if (sim > highestSim) {
            highestSim = sim;
            highestIdx = i;
          }
        }
      }
      if (highestIdx >= 0) {
        matchedOptionIndices.push(highestIdx);
        matchedOptionTexts.push(currentState.options[highestIdx].text);
        totalAnswerSim = highestSim;
        matchesCount = 1;
      }
    }
  }

  const avgAnswerSim = matchesCount > 0 ? Math.round(totalAnswerSim / matchesCount) : 0;
  const isMultipleChoice = matchedOptionIndices.length > 1;

  // 3. Compute overall Confidence Score
  let overallConfidence = 0;
  if (currentState.options.length > 0) {
    overallConfidence = Math.round(highestQSim * 0.45 + avgAnswerSim * 0.55);
  } else {
    // For fill-in-the-blank or open-ended questions
    overallConfidence = highestQSim;
  }

  overallConfidence = Math.min(100, Math.max(0, overallConfidence));

  const firstOptionIdx = matchedOptionIndices.length > 0 ? matchedOptionIndices[0] : -1;
  const displayText = matchedOptionTexts.length > 0 ? matchedOptionTexts.join(" | ") : bestItem.answer;

  return {
    matchedItem: bestItem,
    matchedOptionIndex: firstOptionIdx,
    matchedOptionIndices,
    matchedOptionText: displayText,
    expectedAnswer: bestItem.answer,
    confidenceScore: overallConfidence,
    questionSimilarity: highestQSim,
    answerSimilarity: avgAnswerSim,
    isMultipleChoice,
    isFillInTheBlank: currentState.isFillInTheBlank,
    reason:
      overallConfidence >= 80
        ? isMultipleChoice
          ? `Khớp ${matchedOptionIndices.length} đáp án đúng.`
          : "Tìm thấy đáp án phù hợp."
        : "Độ tin cậy thấp, vui lòng kiểm tra lại.",
  };
}
