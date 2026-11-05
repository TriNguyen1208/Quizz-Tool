import { matchQuestionAndAnswer } from "../src/shared/matcher";
import { normalizeText } from "../src/shared/normalizer";
import { QuizItem, CurrentQuizState } from "../src/shared/types";

console.log("=== RUNNING MSQ AND FILL-IN-THE-BLANK TESTS ===");

const db: QuizItem[] = [
  {
    id: "msq1",
    question: "Chọn các số nguyên tố nhỏ hơn 10",
    normalizedQuestion: normalizeText("Chọn các số nguyên tố nhỏ hơn 10", false),
    answer: "2 | 3 | 5 | 7",
    normalizedAnswer: normalizeText("2 | 3 | 5 | 7", true),
    options: ["2", "3", "5", "7"],
  },
  {
    id: "fill1",
    question: "Thủ đô của Việt Nam là gì?",
    normalizedQuestion: normalizeText("Thủ đô của Việt Nam là gì?", false),
    answer: "Hà Nội",
    normalizedAnswer: normalizeText("Hà Nội", true),
  },
];

// Test 1: Multiple Select Question (MSQ)
const msqState: CurrentQuizState = {
  questionText: "Chọn các số nguyên tố nhỏ hơn 10",
  options: [
    { index: 0, text: "4", normalizedText: normalizeText("4") },
    { index: 1, text: "2", normalizedText: normalizeText("2") },
    { index: 2, text: "6", normalizedText: normalizeText("6") },
    { index: 3, text: "3", normalizedText: normalizeText("3") },
    { index: 4, text: "8", normalizedText: normalizeText("8") },
    { index: 5, text: "5", normalizedText: normalizeText("5") },
  ],
};

const msqResult = matchQuestionAndAnswer(msqState, db);
console.log("\n[Test 1: MSQ]");
console.log("- Matched Indices:", msqResult.matchedOptionIndices, "(Expected: [1, 3, 5])");
console.log("- Is Multiple Choice:", msqResult.isMultipleChoice, "(Expected: true)");
console.log("- Matched Text:", msqResult.matchedOptionText);
console.log("- Confidence Score:", msqResult.confidenceScore + "%");

if (
  msqResult.isMultipleChoice &&
  msqResult.matchedOptionIndices.includes(1) &&
  msqResult.matchedOptionIndices.includes(3) &&
  msqResult.matchedOptionIndices.includes(5)
) {
  console.log("-> TEST 1 PASSED!");
} else {
  console.error("-> TEST 1 FAILED!");
  process.exit(1);
}

// Test 2: Fill-In-The-Blank Question
const fillState: CurrentQuizState = {
  questionText: "Thủ đô của Việt Nam là gì?",
  options: [],
  isFillInTheBlank: true,
};

const fillResult = matchQuestionAndAnswer(fillState, db);
console.log("\n[Test 2: Fill-In-The-Blank]");
console.log("- Expected Answer:", fillResult.expectedAnswer, "(Expected: Hà Nội)");
console.log("- Confidence Score:", fillResult.confidenceScore + "%");
console.log("- Is Fill In The Blank:", fillResult.isFillInTheBlank);

if (fillResult.expectedAnswer === "Hà Nội" && fillResult.confidenceScore === 100 && fillResult.isFillInTheBlank) {
  console.log("-> TEST 2 PASSED!");
} else {
  console.error("-> TEST 2 FAILED!");
  process.exit(1);
}

console.log("\nALL NEW TESTS PASSED WITH 100% SUCCESS!");
