import { ExtensionSettings, QuizItem, CurrentQuizState, MatchResult } from "../shared/types";
import { getSettings, getQuizDatabase, getAppState, updateAppState, isExtensionValid } from "../shared/storage";
import { readCurrentQuiz, observeQuizChanges, readQuestionCounter } from "../shared/quiz-reader";
import { matchQuestionAndAnswer } from "../shared/matcher";
import { handleShowAnswer, clearShowAnswerHighlights, removeFloatingHUD } from "../modes/show-answer";

// Gracefully handle extension reload / context invalidation
window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason?.message?.includes("Extension context invalidated") ||
    String(event.reason).includes("Extension context invalidated")
  ) {
    event.preventDefault();
  }
});
window.addEventListener("error", (event) => {
  if (event.message?.includes("Extension context invalidated")) {
    event.preventDefault();
  }
});

// Clean up any previously injected instance of the assistant on this page
if ((window as any).__QUIZIZZ_ASSISTANT_CLEANUP__) {
  try {
    (window as any).__QUIZIZZ_ASSISTANT_CLEANUP__();
  } catch {}
}

let isRunning = false;
let currentSettings: ExtensionSettings | null = null;
let cachedQuizDB: QuizItem[] = [];
let stopObserverCallback: (() => void) | null = null;
let currentProgress = 0;
let lastMatch: MatchResult | null = null;
let lastState: CurrentQuizState | null = null;
let currentLockedQuesId: string | null = null;
let currentLockedQuesNum: number | null = null;
let currentLockedQuesText: string | null = null;

(window as any).__QUIZIZZ_ASSISTANT_CLEANUP__ = () => {
  stopSession();
};

/**
 * Main cycle triggered whenever the question on screen changes
 */
async function processCurrentQuestion(state: CurrentQuizState) {
  if (!isRunning || !isExtensionValid()) return;

  // Question ID & Number Lock:
  // If we already matched and displayed answers for this exact question,
  // do NOT re-match or re-trigger HUD updates while the user is typing their answer!
  if (state.questionId && state.questionId === currentLockedQuesId) {
    return;
  }
  if (!state.questionId && state.questionNumber != null && state.questionNumber === currentLockedQuesNum) {
    return;
  }
  if (!state.questionId && state.questionNumber == null && state.questionText === currentLockedQuesText) {
    return;
  }

  currentLockedQuesId = state.questionId || null;
  currentLockedQuesNum = state.questionNumber ?? null;
  currentLockedQuesText = state.questionText;

  // Refresh DB cache if needed
  if (cachedQuizDB.length === 0) {
    cachedQuizDB = await getQuizDatabase();
  }

  if (!isExtensionValid()) return;

  if (!currentSettings) {
    currentSettings = await getSettings();
  }

  // Update progress if question counter is found on Quizizz
  const counter = readQuestionCounter();
  if (counter && isExtensionValid()) {
    currentProgress = counter.current;
    await updateAppState({ currentProgress: counter.current });
    try {
      if (isExtensionValid()) {
        const lang = currentSettings?.language || "vi";
        chrome.runtime.sendMessage({
          type: "QUIZ_STATE_UPDATE",
          progress: counter.current,
          total: counter.total || cachedQuizDB.length,
          statusText: lang === "en"
            ? `Question ${counter.current} / ${counter.total}`
            : `Câu ${counter.current} / ${counter.total}`,
        }).catch(() => {});
      }
    } catch {}
  }

  console.log("[Quizizz Assistant] Processing Question:", state.questionText.slice(0, 50) + "...");

  const match = matchQuestionAndAnswer(state, cachedQuizDB);
  console.log("[Quizizz Assistant] Match result:", match);

  lastMatch = match;
  lastState = state;

  // Directly show answer (Auto Click feature has been removed)
  handleShowAnswer(match, state, currentSettings?.language || "vi");
}

/**
 * Start the assistant session
 */
async function startSession() {
  isRunning = true;
  currentSettings = await getSettings();
  cachedQuizDB = await getQuizDatabase();
  const state = await getAppState();
  currentProgress = state.currentProgress || 0;

  await updateAppState({ isRunning: true, status: "Running" });

  // Clean previous
  if (stopObserverCallback) {
    stopObserverCallback();
    stopObserverCallback = null;
  }

  // Check immediately
  const initial = readCurrentQuiz();
  if (initial) {
    processCurrentQuestion(initial);
  }

  // Start observing DOM changes
  stopObserverCallback = observeQuizChanges((newState) => {
    processCurrentQuestion(newState);
  });

  console.log("[Quizizz Assistant] Show Answer mode started.");
}

/**
 * Stop the assistant session
 */
async function stopSession() {
  isRunning = false;
  clearShowAnswerHighlights();
  removeFloatingHUD();

  if (stopObserverCallback) {
    stopObserverCallback();
    stopObserverCallback = null;
  }

  await updateAppState({ isRunning: false, status: "Stopped" });
  console.log("[Quizizz Assistant] Session stopped.");
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "START_SESSION") {
    startSession().then(() => sendResponse({ success: true }));
    return true;
  } else if (message.type === "STOP_SESSION") {
    stopSession().then(() => sendResponse({ success: true }));
    return true;
  } else if (message.type === "SAVE_SETTINGS") {
    getSettings().then((s) => {
      currentSettings = s;
      if (isRunning) {
        const current = readCurrentQuiz();
        if (current) {
          processCurrentQuestion(current);
        } else if (lastMatch && lastState) {
          handleShowAnswer(lastMatch, lastState, currentSettings?.language || "vi");
        }
      }
      sendResponse({ success: true });
    });
    return true;
  }
});
