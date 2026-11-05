import { matchQuestionAndAnswer } from "../src/shared/matcher";
import { normalizeText } from "../src/shared/normalizer";
import { QuizItem, CurrentQuizState } from "../src/shared/types";

// Database from CheatNetwork
const db: QuizItem[] = [
  {
    id: "q1",
    question: "Hãy cho tôi biết 1 + 1 bằng mấy",
    normalizedQuestion: normalizeText("Hãy cho tôi biết 1 + 1 bằng mấy", false),
    answer: "2",
    normalizedAnswer: normalizeText("2", true),
    options: ["2"],
  },
];

// Quizizz options extracted with the new clean reader:
// Button 1: "4" (aria: "Option 1, 4")
// Button 2: "5" (aria: "Option 2, 5")
// Button 3: "2" (aria: "Option 3, 2")
// Button 4: "3" (aria: "Option 4, 3")
const state: CurrentQuizState = {
  questionText: "Hãy cho tôi biết 1 + 1 bằng mấy",
  options: [
    { index: 0, text: "4", normalizedText: normalizeText("4") },
    { index: 1, text: "5", normalizedText: normalizeText("5") },
    { index: 2, text: "2", normalizedText: normalizeText("2") },
    { index: 3, text: "3", normalizedText: normalizeText("3") },
  ],
};

const match = matchQuestionAndAnswer(state, db);
console.log("=== QUIZIZZ REAL DOM MATCH TEST ===");
console.log("Matched Option Index:", match.matchedOptionIndex, "(Button 3 -> Index 2)");
console.log("Matched Option Text:", match.matchedOptionText);
console.log("Expected Answer:", match.expectedAnswer);
console.log("Confidence Score:", match.confidenceScore + "%");

if (match.matchedOptionIndex === 2 && match.confidenceScore === 100) {
  console.log("-> TEST PASSED PERFECTLY!");
} else {
  console.error("-> TEST FAILED!");
  process.exit(1);
}
