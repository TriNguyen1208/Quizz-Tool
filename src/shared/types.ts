export type Language = "vi" | "en";

export interface ExtensionSettings {
  language?: Language;
  autoNext?: boolean;
}

export interface QuizItem {
  id: string;
  question: string;
  normalizedQuestion: string;
  answer: string;
  normalizedAnswer: string;
  options?: string[];
  rawQuestion?: string;
  rawAnswer?: string;
  crawledAt?: number;
}

export interface CurrentQuizState {
  questionText: string;
  options: {
    index: number;
    text: string;
    normalizedText: string;
    element?: HTMLElement;
  }[];
  isFillInTheBlank?: boolean;
  inputElement?: HTMLInputElement | HTMLTextAreaElement | HTMLElement | null;
}

export interface MatchResult {
  matchedItem: QuizItem | null;
  matchedOptionIndex: number; // first matched index or -1
  matchedOptionIndices: number[]; // ALL matched option indices (for multiple-choice)
  matchedOptionText: string;
  expectedAnswer: string;
  confidenceScore: number; // 0 - 100
  questionSimilarity: number; // 0 - 100
  answerSimilarity: number; // 0 - 100
  isMultipleChoice?: boolean;
  isFillInTheBlank?: boolean;
  reason?: string;
}

export interface AppState {
  isRunning: boolean;
  status: "Ready" | "Running" | "Paused" | "Stopped" | "Completed" | "Error";
  currentProgress: number;
  totalQuestions: number;
  quizCode?: string;
  lastError?: string;
}

export type ExtensionMessage =
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; settings: Partial<ExtensionSettings> }
  | { type: "GET_STATE" }
  | { type: "START_SESSION" }
  | { type: "STOP_SESSION" }
  | { type: "TRIGGER_CRAWL"; quizCode?: string }
  | { type: "CRAWL_SUCCESS"; count: number }
  | { type: "CRAWL_ERROR"; error: string }
  | { type: "QUIZ_STATE_UPDATE"; progress: number; total: number; statusText: string };
