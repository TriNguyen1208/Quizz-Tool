import { matchQuestionAndAnswer } from "../src/shared/matcher";
import { normalizeText, stripOptionPrefix } from "../src/shared/normalizer";
import { QuizItem, CurrentQuizState } from "../src/shared/types";

// Mock Database from the user's screenshot
const mockDB: QuizItem[] = [
  {
    id: "q1",
    question: "Lịch sử Đảng Cộng sản Việt Nam nghiên cứu nội dung chủ yếu nào sau đây?",
    normalizedQuestion: normalizeText("Lịch sử Đảng Cộng sản Việt Nam nghiên cứu nội dung chủ yếu nào sau đây?", false),
    answer: "Sự ra đời và hoạt động lãnh đạo của Đảng qua các thời kỳ lịch sử",
    normalizedAnswer: normalizeText("Sự ra đời và hoạt động lãnh đạo của Đảng qua các thời kỳ lịch sử", true),
  },
  {
    id: "q2",
    question: "Hai phương pháp nghiên cứu cơ bản được sử dụng trong khoa học Lịch sử Đảng là:",
    normalizedQuestion: normalizeText("Hai phương pháp nghiên cứu cơ bản được sử dụng trong khoa học Lịch sử Đảng là:", false),
    answer: stripOptionPrefix("A. Phương pháp lịch sử và phương pháp logic"),
    normalizedAnswer: normalizeText(stripOptionPrefix("A. Phương pháp lịch sử và phương pháp logic"), true),
  },
];

console.log("=== RUNNING MATCHER TESTS ===");

// Test 1: Exact question on Quizizz with shuffled options
const quizState1: CurrentQuizState = {
  questionText: "Lịch sử Đảng Cộng sản Việt Nam nghiên cứu nội dung chủ yếu nào sau đây?",
  options: [
    { index: 0, text: "Quá trình hình thành giai cấp công nhân", normalizedText: normalizeText("Quá trình hình thành giai cấp công nhân") },
    { index: 1, text: "Sự ra đời và hoạt động lãnh đạo của Đảng qua các thời kỳ lịch sử", normalizedText: normalizeText("Sự ra đời và hoạt động lãnh đạo của Đảng qua các thời kỳ lịch sử") },
    { index: 2, text: "Lịch sử phong trào công nhân quốc tế", normalizedText: normalizeText("Lịch sử phong trào công nhân quốc tế") },
    { index: 3, text: "Các cuộc kháng chiến bảo vệ Tổ quốc thời phong kiến", normalizedText: normalizeText("Các cuộc kháng chiến bảo vệ Tổ quốc thời phong kiến") },
  ],
};

const result1 = matchQuestionAndAnswer(quizState1, mockDB);
console.log("\nTest 1 Result:");
console.log("- Matched Option Index:", result1.matchedOptionIndex, "(Expected: 1)");
console.log("- Confidence Score:", result1.confidenceScore + "%");
console.log("- Expected Answer:", result1.expectedAnswer);
if (result1.matchedOptionIndex === 1 && result1.confidenceScore >= 95) {
  console.log("-> TEST 1 PASSED!");
} else {
  console.error("-> TEST 1 FAILED!");
  process.exit(1);
}

// Test 2: Question with "A. " stripped from cheatnetwork vs option without prefix on Quizizz
const quizState2: CurrentQuizState = {
  questionText: "Hai phương pháp nghiên cứu cơ bản được sử dụng trong khoa học Lịch sử Đảng là:",
  options: [
    { index: 0, text: "Phương pháp lịch sử và phương pháp so sánh", normalizedText: normalizeText("Phương pháp lịch sử và phương pháp so sánh") },
    { index: 1, text: "Phương pháp thống kê và phương pháp điều tra xã hội học", normalizedText: normalizeText("Phương pháp thống kê và phương pháp điều tra xã hội học") },
    { index: 2, text: "Phương pháp lịch sử và phương pháp logic", normalizedText: normalizeText("Phương pháp lịch sử và phương pháp logic") },
  ],
};

const result2 = matchQuestionAndAnswer(quizState2, mockDB);
console.log("\nTest 2 Result:");
console.log("- Matched Option Index:", result2.matchedOptionIndex, "(Expected: 2)");
console.log("- Confidence Score:", result2.confidenceScore + "%");
console.log("- Expected Answer:", result2.expectedAnswer);
if (result2.matchedOptionIndex === 2 && result2.confidenceScore >= 95) {
  console.log("-> TEST 2 PASSED!");
} else {
  console.error("-> TEST 2 FAILED!");
  process.exit(1);
}

// Test 3: Math question from CheatNetwork DOM ("1 + 1 bằng mấy" -> "2")
const mathItem: QuizItem = {
  id: "q3",
  question: "Hãy cho tôi biết 1 + 1 bằng mấy",
  normalizedQuestion: normalizeText("Hãy cho tôi biết 1 + 1 bằng mấy", false),
  answer: "2",
  normalizedAnswer: normalizeText("2", true),
  options: ["2"],
};
mockDB.push(mathItem);

const quizState3: CurrentQuizState = {
  questionText: "Hãy cho tôi biết 1 + 1 bằng mấy",
  options: [
    { index: 0, text: "1", normalizedText: normalizeText("1") },
    { index: 1, text: "3", normalizedText: normalizeText("3") },
    { index: 2, text: "2", normalizedText: normalizeText("2") },
    { index: 3, text: "4", normalizedText: normalizeText("4") },
  ],
};

const result3 = matchQuestionAndAnswer(quizState3, mockDB);
console.log("\nTest 3 Result:");
console.log("- Matched Option Index:", result3.matchedOptionIndex, "(Expected: 2)");
console.log("- Confidence Score:", result3.confidenceScore + "%");
console.log("- Expected Answer:", result3.expectedAnswer);
if (result3.matchedOptionIndex === 2 && result3.confidenceScore === 100) {
  console.log("-> TEST 3 PASSED!");
} else {
  console.error("-> TEST 3 FAILED!");
  process.exit(1);
}

console.log("\nALL TESTS PASSED WITH FLYING COLORS!");
