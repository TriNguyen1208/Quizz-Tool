import { CurrentQuizState } from "./types";
import { normalizeText } from "./normalizer";
import { isExtensionValid } from "./storage";

/**
 * QuizReader handles extracting the current question and available options
 * from Quizizz DOM across various game layouts.
 */

// Target selectors specifically aligned with Quizizz's current layout
const QUESTION_SELECTORS = [
  "#questionText p",
  "#questionText",
  '[data-testid="question-container-text"] p',
  '[data-testid="question-container-text"]',
  ".question-text-color p",
  ".question-text-color",
  '[data-testid="question-container"] p',
  '[data-testid="question-container"]',
  '[data-testid="query-text"]',
  ".resizeable-text",
  ".question-text",
  '[class*="question-text"]',
  '[class*="questionText"]',
  ".query-text",
];

const OPTION_CONTAINER_SELECTORS = [
  ".options-grid",
  '[role="listbox"][aria-label*="option" i]',
  '[data-testid="options-container"]',
  ".options-container",
  ".answers-list",
  '[class*="options-container"]',
];

const OPTION_ITEM_SELECTORS = [
  "button.option",
  ".options-grid button",
  '[role="listbox"] button[role="option"]',
  'button[role="option"]',
  '[data-testid="option"]',
  '[data-testid="answer-option"]',
  ".option-container",
  ".option-inner",
  'button[class*="option-"]',
];

/**
 * Extracts clean question text by stripping out any form controls,
 * typed responses, or counters that could be polluted by user input
 */
function extractCleanQuestionText(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      "input, textarea, select, [contenteditable], .typed-response-container, [data-cy*='typed'], [data-testid*='typed'], .pill, button, .gesture-ed"
    )
    .forEach((n) => n.remove());
  return clone.innerText.trim();
}

/**
 * Extracts stable Question ID from Quizizz DOM if available
 */
export function extractQuestionId(): string | undefined {
  const container = document.querySelector<HTMLElement>(
    "[data-quesid], [data-quesidandattemptcount], [data-testid='quiz-container'], .quiz-container"
  );
  if (container) {
    const qId = container.getAttribute("data-quesid") || (container as any).dataset?.quesid;
    if (qId && qId.trim().length > 0) return qId.trim();
    const qAttempt = container.getAttribute("data-quesidandattemptcount");
    if (qAttempt) {
      const idPart = qAttempt.split("-")[0];
      if (idPart && idPart.trim().length > 0) return idPart.trim();
    }
  }
  return undefined;
}

/**
 * Extracts question index/number from the Quizizz DOM if present
 */
export function extractQuestionNumber(): number | undefined {
  const curEl = document.querySelector<HTMLElement>(
    '[data-testid="current-question-number"], [data-cy="current-question-number"]'
  );
  if (curEl) {
    const num = parseInt(curEl.innerText.trim(), 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return undefined;
}

/**
 * Extracts pure option text without keyboard shortcut numbers or aria noise
 */
function extractCleanOptionText(buttonEl: HTMLElement): string {
  // 1. Direct text inside #optionText or .content-slot
  const textEl = buttonEl.querySelector<HTMLElement>(
    "#optionText p, #optionText, .content-slot p, .content-slot, [id*='optionText']"
  );
  if (textEl && textEl.innerText.trim()) {
    return textEl.innerText.trim();
  }

  // 2. Parse from aria-label (e.g., "Option 1, 4" -> "4", "Option 3, 2" -> "2")
  const aria = buttonEl.getAttribute("aria-label");
  if (aria && aria.includes(",")) {
    const parts = aria.split(",");
    const extracted = parts.slice(1).join(",").trim();
    if (extracted) return extracted;
  }

  // 3. Clone and strip shortcut badges (.gesture-ed, .contents, etc.)
  const clone = buttonEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".gesture-ed, .contents, .sr-only, button").forEach((n) => n.remove());
  return clone.innerText.trim();
}

/**
 * Read the current question and its selectable options from the Quizizz page
 */
export function readCurrentQuiz(): CurrentQuizState | null {
  // 1. Detect question text (using extractCleanQuestionText to never capture typed input)
  let rawQuestionText = "";
  for (const selector of QUESTION_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) {
      // Exclude question number pill if caught
      if (!el.closest(".pill")) {
        const text = extractCleanQuestionText(el);
        if (text.length > 0) {
          rawQuestionText = text;
          break;
        }
      }
    }
  }

  // Fallback: search within question-container
  if (!rawQuestionText) {
    const container = document.querySelector<HTMLElement>('[data-testid="question-container"], .quiz-container');
    if (container) {
      const p = container.querySelector<HTMLElement>("#questionText, p");
      if (p) {
        const text = extractCleanQuestionText(p);
        if (text.length > 2) {
          rawQuestionText = text;
        }
      }
    }
  }

  if (!rawQuestionText) {
    return null;
  }

  // 2. Detect options
  let optionElements: HTMLElement[] = [];

  for (const selector of OPTION_ITEM_SELECTORS) {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const validNodes = nodes.filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (validNodes.length >= 2) {
      optionElements = validNodes;
      break;
    }
  }

  // Fallback: search inside option container
  if (optionElements.length === 0) {
    for (const containerSel of OPTION_CONTAINER_SELECTORS) {
      const container = document.querySelector<HTMLElement>(containerSel);
      if (container) {
        const buttons = Array.from(container.querySelectorAll<HTMLElement>("button"));
        if (buttons.length >= 2) {
          optionElements = buttons;
          break;
        }
      }
    }
  }

  // Build options array with clean text
  const options = optionElements.map((el, idx) => {
    const text = extractCleanOptionText(el);
    return {
      index: idx,
      text,
      normalizedText: normalizeText(text),
      element: el,
    };
  });

  // 3. Detect Fill-in-the-blank input field if present
  let fillInInput: HTMLElement | null = null;
  const inputSelectors = [
    'input[data-testid="fill-in-the-blank-input"]',
    'input[data-cy="typed-option-input"]',
    'input.typed-response-input',
    'input[class*="typed-response"]',
    'input[class*="fill-in"]',
    'input[placeholder*="Type your answer" i]',
    'input[placeholder*="Nhập câu trả lời" i]',
    '.typed-response-container input',
    '[data-testid="typed-response"] input',
    '.quiz-container input[type="text"]',
    '.quiz-container textarea',
    'input[type="text"]',
    'textarea',
    'div[contenteditable="true"]',
    '[role="textbox"]',
  ];

  for (const sel of inputSelectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && !el.closest("header, nav, #qa-floating-hud")) {
        fillInInput = el;
        break;
      }
    }
  }

  const qId = extractQuestionId();
  const qNum = extractQuestionNumber();

  return {
    questionId: qId,
    questionNumber: qNum,
    questionText: rawQuestionText,
    options,
    isFillInTheBlank: !!fillInInput,
    inputElement: fillInInput,
  };
}

/**
 * Read question counter (e.g. 1 / 2) if present in Quizizz DOM
 */
export function readQuestionCounter(): { current: number; total: number } | null {
  const curEl = document.querySelector<HTMLElement>('[data-testid="current-question-number"], [data-cy="current-question-number"]');
  const totEl = document.querySelector<HTMLElement>('[data-testid="total-question-number"], [data-cy="total-question-number"]');

  if (curEl && totEl) {
    const current = parseInt(curEl.innerText.trim(), 10);
    const total = parseInt(totEl.innerText.trim(), 10);
    if (!isNaN(current) && !isNaN(total)) {
      return { current, total };
    }
  }
  return null;
}

/**
 * Watch for question changes in the Quizizz DOM
 */
export function observeQuizChanges(
  onQuestionChange: (state: CurrentQuizState) => void,
  onQuizEnd?: () => void
): () => void {
  let lastQuestionId = "";
  let lastQuestionNumber: number | null = null;
  let lastQuestionText = "";
  let isInitial = true;

  const check = () => {
    // Check if extension context is still valid (stops running if extension was reloaded)
    if (!isExtensionValid()) {
      observer.disconnect();
      clearInterval(interval);
      return;
    }

    const state = readCurrentQuiz();
    if (!state || !state.questionText) return;

    // Detect if user is currently typing inside an input or textarea
    const activeEl = document.activeElement;
    const isUserTyping =
      activeEl &&
      (activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        (activeEl as HTMLElement).isContentEditable);

    let hasChanged = false;

    if (isInitial) {
      hasChanged = true;
      isInitial = false;
    } else if (state.questionId && lastQuestionId) {
      // Compare by stable Quizizz Question ID if available
      if (state.questionId !== lastQuestionId) {
        hasChanged = true;
      }
    } else if (state.questionNumber != null && lastQuestionNumber != null) {
      // Compare by question counter if available
      if (state.questionNumber !== lastQuestionNumber) {
        hasChanged = true;
      }
    } else {
      // Fallback compare question text
      if (state.questionText !== lastQuestionText) {
        hasChanged = true;
      }
    }

    // CRITICAL: If the user is actively typing in an input field, NEVER trigger a question change
    // unless the question ID or question number has genuinely changed!
    if (isUserTyping && !hasChanged) {
      return;
    }

    if (hasChanged) {
      lastQuestionId = state.questionId || "";
      lastQuestionNumber = state.questionNumber ?? null;
      lastQuestionText = state.questionText;
      onQuestionChange(state);
    }
  };

  // Run initial check
  check();

  const observer = new MutationObserver(() => {
    check();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // Polling fallback every 600ms
  const interval = setInterval(check, 600);

  return () => {
    observer.disconnect();
    clearInterval(interval);
  };
}
