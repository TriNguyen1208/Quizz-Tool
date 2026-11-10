"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // src/shared/storage.ts
  function isExtensionValid() {
    try {
      if (typeof chrome === "undefined" || !chrome.runtime) return false;
      chrome.runtime.getManifest();
      return true;
    } catch {
      return false;
    }
  }
  async function getSettings() {
    if (!isExtensionValid() || !chrome.storage?.local) {
      return DEFAULT_SETTINGS;
    }
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.SETTINGS]);
      const saved = result?.[STORAGE_KEYS.SETTINGS] || {};
      return { ...DEFAULT_SETTINGS, ...saved };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  async function getQuizDatabase() {
    if (!isExtensionValid() || !chrome.storage?.local) {
      return [];
    }
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.QUIZ_DATABASE]);
      const items = result?.[STORAGE_KEYS.QUIZ_DATABASE] || [];
      return items;
    } catch {
      return [];
    }
  }
  async function getAppState() {
    if (!isExtensionValid() || !chrome.storage?.local) {
      return DEFAULT_APP_STATE;
    }
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.APP_STATE]);
      const saved = result?.[STORAGE_KEYS.APP_STATE] || {};
      return { ...DEFAULT_APP_STATE, ...saved };
    } catch {
      return DEFAULT_APP_STATE;
    }
  }
  async function updateAppState(partialState) {
    const current = await getAppState();
    const updated = { ...current, ...partialState };
    if (!isExtensionValid() || !chrome.storage?.local) {
      return updated;
    }
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.APP_STATE]: updated });
    } catch {
    }
    return updated;
  }
  var STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_APP_STATE;
  var init_storage = __esm({
    "src/shared/storage.ts"() {
      "use strict";
      STORAGE_KEYS = {
        SETTINGS: "quizizz_assistant_settings",
        QUIZ_DATABASE: "quizizz_assistant_quiz_db",
        APP_STATE: "quizizz_assistant_app_state"
      };
      DEFAULT_SETTINGS = {
        language: "vi",
        autoNext: false
      };
      DEFAULT_APP_STATE = {
        isRunning: false,
        status: "Ready",
        currentProgress: 0,
        totalQuestions: 0
      };
    }
  });

  // src/shared/normalizer.ts
  function stripHtml(input) {
    if (!input) return "";
    return input.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#x2F;/gi, "/").replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
  }
  function stripOptionPrefix(input) {
    if (!input) return "";
    return input.replace(/^[\s\-_•*]*([A-Za-z][\.\)\:\-]|[0-9]+[\)\:\-]|[0-9]+\.)\s+/i, "").replace(/^(câu|cau|question)\s*\d+[\:\.\-]?\s*/i, "").trim();
  }
  function cleanLatex(input) {
    if (!input) return "";
    return input.replace(/\\\((.*?)\\\)/g, "$1").replace(/\$\$(.*?)\$\$/g, "$1").replace(/\$(.*?)\$/g, "$1").replace(/\\times/g, "x").replace(/\\cdot/g, "x").replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2");
  }
  function normalizeText(input, stripPrefix = true) {
    if (!input) return "";
    let text = stripHtml(input);
    text = cleanLatex(text);
    if (stripPrefix) {
      text = stripOptionPrefix(text);
    }
    return text.toLowerCase().normalize("NFC").replace(/[\r\n\t]+/g, " ").replace(/[“”"']/g, '"').replace(/[‘’]/g, "'").replace(/[.,;:?!]/g, " ").replace(/\s+/g, " ").trim();
  }
  function removeAccents(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
  }
  function calculateNgramSimilarity(s1, s2, n = 2) {
    if (s1 === s2) return 1;
    if (!s1 || !s2) return 0;
    if (s1.length < n || s2.length < n) {
      return s1.includes(s2) || s2.includes(s1) ? 0.8 : 0;
    }
    const getGrams = (text) => {
      const grams = /* @__PURE__ */ new Set();
      for (let i = 0; i <= text.length - n; i++) {
        grams.add(text.substring(i, i + n));
      }
      return grams;
    };
    const grams1 = getGrams(s1);
    const grams2 = getGrams(s2);
    let intersection = 0;
    for (const gram of grams1) {
      if (grams2.has(gram)) {
        intersection++;
      }
    }
    const union = grams1.size + grams2.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }
  function calculateTokenSimilarity(s1, s2) {
    if (s1 === s2) return 1;
    const words1 = new Set(s1.split(" ").filter((w) => w.length > 0));
    const words2 = new Set(s2.split(" ").filter((w) => w.length > 0));
    if (words1.size === 0 || words2.size === 0) return 0;
    let common = 0;
    for (const w of words1) {
      if (words2.has(w)) common++;
    }
    const total = words1.size + words2.size - common;
    return total === 0 ? 0 : common / total;
  }
  function computeSimilarityScore(str1, str2) {
    const norm1 = normalizeText(str1);
    const norm2 = normalizeText(str2);
    if (norm1 === norm2) return 100;
    if (!norm1 || !norm2) return 0;
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      const minLen = Math.min(norm1.length, norm2.length);
      const maxLen = Math.max(norm1.length, norm2.length);
      const ratio = minLen / maxLen;
      if (ratio > 0.8) return Math.round(92 + ratio * 8);
    }
    const tokenSim = calculateTokenSimilarity(norm1, norm2);
    const ngramSim = calculateNgramSimilarity(norm1, norm2, 2);
    const blended = tokenSim * 0.5 + ngramSim * 0.5;
    const accentFree1 = removeAccents(norm1);
    const accentFree2 = removeAccents(norm2);
    let accentBonus = 0;
    if (accentFree1 === accentFree2) {
      accentBonus = 0.95;
    }
    const finalScore = Math.max(blended, accentBonus);
    return Math.round(Math.min(100, Math.max(0, finalScore * 100)));
  }
  var init_normalizer = __esm({
    "src/shared/normalizer.ts"() {
      "use strict";
    }
  });

  // src/shared/quiz-reader.ts
  function extractCleanQuestionText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll(
      "input, textarea, select, [contenteditable], .typed-response-container, [data-cy*='typed'], [data-testid*='typed'], .pill, button, .gesture-ed"
    ).forEach((n) => n.remove());
    return clone.innerText.trim();
  }
  function extractQuestionId() {
    const container = document.querySelector(
      "[data-quesid], [data-quesidandattemptcount], [data-testid='quiz-container'], .quiz-container"
    );
    if (container) {
      const qId = container.getAttribute("data-quesid") || container.dataset?.quesid;
      if (qId && qId.trim().length > 0) return qId.trim();
      const qAttempt = container.getAttribute("data-quesidandattemptcount");
      if (qAttempt) {
        const idPart = qAttempt.split("-")[0];
        if (idPart && idPart.trim().length > 0) return idPart.trim();
      }
    }
    return void 0;
  }
  function extractQuestionNumber() {
    const curEl = document.querySelector(
      '[data-testid="current-question-number"], [data-cy="current-question-number"]'
    );
    if (curEl) {
      const num = parseInt(curEl.innerText.trim(), 10);
      if (!isNaN(num) && num > 0) return num;
    }
    return void 0;
  }
  function extractCleanOptionText(buttonEl) {
    const textEl = buttonEl.querySelector(
      "#optionText p, #optionText, .content-slot p, .content-slot, [id*='optionText']"
    );
    if (textEl && textEl.innerText.trim()) {
      return textEl.innerText.trim();
    }
    const aria = buttonEl.getAttribute("aria-label");
    if (aria && aria.includes(",")) {
      const parts = aria.split(",");
      const extracted = parts.slice(1).join(",").trim();
      if (extracted) return extracted;
    }
    const clone = buttonEl.cloneNode(true);
    clone.querySelectorAll(".gesture-ed, .contents, .sr-only, button").forEach((n) => n.remove());
    return clone.innerText.trim();
  }
  function readCurrentQuiz() {
    let rawQuestionText = "";
    for (const selector of QUESTION_SELECTORS) {
      const el = document.querySelector(selector);
      if (el) {
        if (!el.closest(".pill")) {
          const text = extractCleanQuestionText(el);
          if (text.length > 0) {
            rawQuestionText = text;
            break;
          }
        }
      }
    }
    if (!rawQuestionText) {
      const container = document.querySelector('[data-testid="question-container"], .quiz-container');
      if (container) {
        const p = container.querySelector("#questionText, p");
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
    let optionElements = [];
    for (const selector of OPTION_ITEM_SELECTORS) {
      const nodes = Array.from(document.querySelectorAll(selector));
      const validNodes = nodes.filter((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (validNodes.length >= 2) {
        optionElements = validNodes;
        break;
      }
    }
    if (optionElements.length === 0) {
      for (const containerSel of OPTION_CONTAINER_SELECTORS) {
        const container = document.querySelector(containerSel);
        if (container) {
          const buttons = Array.from(container.querySelectorAll("button"));
          if (buttons.length >= 2) {
            optionElements = buttons;
            break;
          }
        }
      }
    }
    const options = optionElements.map((el, idx) => {
      const text = extractCleanOptionText(el);
      return {
        index: idx,
        text,
        normalizedText: normalizeText(text),
        element: el
      };
    });
    let fillInInput = null;
    const inputSelectors = [
      'input[data-testid="fill-in-the-blank-input"]',
      'input[data-cy="typed-option-input"]',
      "input.typed-response-input",
      'input[class*="typed-response"]',
      'input[class*="fill-in"]',
      'input[placeholder*="Type your answer" i]',
      'input[placeholder*="Nh\u1EADp c\xE2u tr\u1EA3 l\u1EDDi" i]',
      ".typed-response-container input",
      '[data-testid="typed-response"] input',
      '.quiz-container input[type="text"]',
      ".quiz-container textarea",
      'input[type="text"]',
      "textarea",
      'div[contenteditable="true"]',
      '[role="textbox"]'
    ];
    for (const sel of inputSelectors) {
      const el = document.querySelector(sel);
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
      inputElement: fillInInput
    };
  }
  function readQuestionCounter() {
    const curEl = document.querySelector('[data-testid="current-question-number"], [data-cy="current-question-number"]');
    const totEl = document.querySelector('[data-testid="total-question-number"], [data-cy="total-question-number"]');
    if (curEl && totEl) {
      const current = parseInt(curEl.innerText.trim(), 10);
      const total = parseInt(totEl.innerText.trim(), 10);
      if (!isNaN(current) && !isNaN(total)) {
        return { current, total };
      }
    }
    return null;
  }
  function observeQuizChanges(onQuestionChange, onQuizEnd) {
    let lastQuestionId = "";
    let lastQuestionNumber = null;
    let lastQuestionText = "";
    let isInitial = true;
    const check = () => {
      if (!isExtensionValid()) {
        observer.disconnect();
        clearInterval(interval);
        return;
      }
      const state = readCurrentQuiz();
      if (!state || !state.questionText) return;
      const activeEl = document.activeElement;
      const isUserTyping = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable);
      let hasChanged = false;
      if (isInitial) {
        hasChanged = true;
        isInitial = false;
      } else if (state.questionId && lastQuestionId) {
        if (state.questionId !== lastQuestionId) {
          hasChanged = true;
        }
      } else if (state.questionNumber != null && lastQuestionNumber != null) {
        if (state.questionNumber !== lastQuestionNumber) {
          hasChanged = true;
        }
      } else {
        if (state.questionText !== lastQuestionText) {
          hasChanged = true;
        }
      }
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
    check();
    const observer = new MutationObserver(() => {
      check();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    const interval = setInterval(check, 600);
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }
  var QUESTION_SELECTORS, OPTION_CONTAINER_SELECTORS, OPTION_ITEM_SELECTORS;
  var init_quiz_reader = __esm({
    "src/shared/quiz-reader.ts"() {
      "use strict";
      init_normalizer();
      init_storage();
      QUESTION_SELECTORS = [
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
        ".query-text"
      ];
      OPTION_CONTAINER_SELECTORS = [
        ".options-grid",
        '[role="listbox"][aria-label*="option" i]',
        '[data-testid="options-container"]',
        ".options-container",
        ".answers-list",
        '[class*="options-container"]'
      ];
      OPTION_ITEM_SELECTORS = [
        "button.option",
        ".options-grid button",
        '[role="listbox"] button[role="option"]',
        'button[role="option"]',
        '[data-testid="option"]',
        '[data-testid="answer-option"]',
        ".option-container",
        ".option-inner",
        'button[class*="option-"]'
      ];
    }
  });

  // src/shared/matcher.ts
  function matchQuestionAndAnswer(currentState, database) {
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
        reason: "Local Quiz Database is empty."
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
        reason: "Could not read question text from screen."
      };
    }
    let bestItem = null;
    let highestQSim = 0;
    for (const item of database) {
      const qSim = computeSimilarityScore(currentQNormalized, item.normalizedQuestion);
      if (qSim > highestQSim) {
        highestQSim = qSim;
        bestItem = item;
      }
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
        reason: `No matching question found in database (Best match was only ${highestQSim}%).`
      };
    }
    let targetAnswers = [];
    if (bestItem.options && bestItem.options.length > 0) {
      targetAnswers = bestItem.options.map((s) => s.trim()).filter(Boolean);
    } else if (bestItem.answer && bestItem.answer.includes("|")) {
      targetAnswers = bestItem.answer.split("|").map((s) => s.trim()).filter(Boolean);
    } else if (bestItem.answer) {
      targetAnswers = [bestItem.answer.trim()];
    }
    const matchedOptionIndices = [];
    const matchedOptionTexts = [];
    let totalAnswerSim = 0;
    let matchesCount = 0;
    if (currentState.options && currentState.options.length > 0) {
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
        if (bestIdx >= 0 && bestSim >= 75) {
          if (!matchedOptionIndices.includes(bestIdx)) {
            matchedOptionIndices.push(bestIdx);
            matchedOptionTexts.push(currentState.options[bestIdx].text);
            totalAnswerSim += bestSim;
            matchesCount++;
          }
        }
      }
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
    let overallConfidence = 0;
    if (currentState.options.length > 0) {
      overallConfidence = Math.round(highestQSim * 0.45 + avgAnswerSim * 0.55);
    } else {
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
      reason: overallConfidence >= 80 ? isMultipleChoice ? `Kh\u1EDBp ${matchedOptionIndices.length} \u0111\xE1p \xE1n \u0111\xFAng.` : "T\xECm th\u1EA5y \u0111\xE1p \xE1n ph\xF9 h\u1EE3p." : "\u0110\u1ED9 tin c\u1EADy th\u1EA5p, vui l\xF2ng ki\u1EC3m tra l\u1EA1i."
    };
  }
  var init_matcher = __esm({
    "src/shared/matcher.ts"() {
      "use strict";
      init_normalizer();
    }
  });

  // src/shared/i18n.ts
  function getI18n(lang) {
    return lang === "en" ? translations.en : translations.vi;
  }
  var translations;
  var init_i18n = __esm({
    "src/shared/i18n.ts"() {
      "use strict";
      translations = {
        vi: {
          title: "QUIZIZZ ASSISTANT",
          closePopup: "\u0110\xF3ng Popup",
          crawlBtn: "\u26A1 CRAWL",
          crawlBtnTitle: "C\xE0o to\xE0n b\u1ED9 \u0111\xE1p \xE1n t\u1EEB tab CheatNetwork hi\u1EC7n t\u1EA1i",
          resetBtn: "\u{1F5D1} RESET",
          resetBtnTitle: "X\xF3a to\xE0n b\u1ED9 database c\xE2u h\u1ECFi",
          statusLabel: "Tr\u1EA1ng th\xE1i:",
          questionsLabel: "S\u1ED1 c\xE2u h\u1ECFi:",
          controlsTitle: "\u0110I\u1EC0U KHI\u1EC2N HI\u1EC2N TH\u1ECA \u0110\xC1P \xC1N",
          startBtn: "START",
          stopBtn: "STOP",
          progressLabel: "Ti\u1EBFn \u0111\u1ED9:",
          statusReady: "S\u1EB5n s\xE0ng",
          statusCrawling: "\u0110ang c\xE0o...",
          statusCompleted: "Ho\xE0n t\u1EA5t",
          statusFailed: "Th\u1EA5t b\u1EA1i",
          statusError: "L\u1ED7i",
          statusRunning: "\u0110ang ch\u1EA1y",
          statusStopped: "\u0110\xE3 d\u1EEBng",
          dbResetSuccess: "\u0110\xE3 x\xF3a s\u1EA1ch to\xE0n b\u1ED9 Database c\xE2u h\u1ECFi!",
          openCheatNetworkFirst: "Vui l\xF2ng m\u1EDF tab trang web cheatnetwork.eu/services/quizizz tr\u01B0\u1EDBc khi nh\u1EA5n CRAWL.",
          cannotConnectCheatNetwork: "Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i v\u1EDBi tab CheatNetwork.",
          refreshCheatNetwork: "Kh\xF4ng th\u1EC3 g\u1EEDi y\xEAu c\u1EA7u \u0111\u1EBFn CheatNetwork. H\xE3y F5 l\u1EA1i tab CheatNetwork.",
          crawlSuccess: (count) => `\u0110\xE3 tr\xEDch xu\u1EA5t th\xE0nh c\xF4ng ${count} c\xE2u h\u1ECFi v\xE0o Database!`,
          crawlFailed: "Kh\xF4ng th\u1EC3 l\u1EA5y \u0111\xE1p \xE1n t\u1EEB trang CheatNetwork.",
          crawlUnknownError: "L\u1ED7i kh\xF4ng x\xE1c \u0111\u1ECBnh khi crawl.",
          openQuizizzFirst: "Vui l\xF2ng m\u1EDF m\u1ED9t b\xE0i Quizizz tr\xEAn tr\xECnh duy\u1EC7t tr\u01B0\u1EDBc khi Start.",
          startSuccess: "\u0110\xE3 kh\u1EDFi \u0111\u1ED9ng ch\u1EBF \u0111\u1ED9 SHOW ANSWER tr\xEAn Quizizz!",
          startError: "L\u1ED7i khi k\xEDch ho\u1EA1t Quizizz.",
          stopSuccess: "\u0110\xE3 d\u1EEBng ti\u1EBFn tr\xECnh.",
          hudBadge: "SHOW ANSWER",
          hudCloseTitle: "T\u1EAFt / \u1EA8n HUD",
          hudRestoreTitle: "M\u1EDF l\u1EA1i b\u1EA3ng \u0111\xE1p \xE1n Quizizz Assistant",
          hudRecognizedAnswer: "\u0110\xE1p \xE1n nh\u1EADn di\u1EC7n:",
          hudNotFound: "(Kh\xF4ng t\xECm th\u1EA5y trong DB)",
          hudConfidence: "\u0110\u1ED9 tin c\u1EADy (Confidence)",
          hudStatus: "Tr\u1EA1ng th\xE1i:",
          hudManualClick: "Ng\u01B0\u1EDDi d\xF9ng t\u1EF1 click ch\u1ECDn",
          hudManualType: "Ng\u01B0\u1EDDi d\xF9ng t\u1EF1 nh\u1EADp \u0111\xE1p \xE1n",
          hudAutoFilled: "\u2713 \u0110\xE3 t\u1EF1 \u0111\u1ED9ng \u0111i\u1EC1n v\xE0o \xF4",
          hudNotMatched: "Ch\u01B0a kh\u1EDBp n\xFAt",
          hudFillIn: "C\xE2u \u0111i\u1EC1n t\u1EEB",
          hudMatchedCount: (count) => `Kh\u1EDBp ${count} \u0111\xE1p \xE1n \u0111\xFAng`,
          hudOptionNum: (num) => `L\u1EF1a ch\u1ECDn #${num}`
        },
        en: {
          title: "QUIZIZZ ASSISTANT",
          closePopup: "Close Popup",
          crawlBtn: "\u26A1 CRAWL",
          crawlBtnTitle: "Extract all answers from current CheatNetwork tab",
          resetBtn: "\u{1F5D1} RESET",
          resetBtnTitle: "Clear entire question database",
          statusLabel: "Status:",
          questionsLabel: "Questions:",
          controlsTitle: "SHOW ANSWER CONTROLS",
          startBtn: "START",
          stopBtn: "STOP",
          progressLabel: "Progress:",
          statusReady: "Ready",
          statusCrawling: "Crawling...",
          statusCompleted: "Completed",
          statusFailed: "Failed",
          statusError: "Error",
          statusRunning: "Running",
          statusStopped: "Stopped",
          dbResetSuccess: "All question database cleared successfully!",
          openCheatNetworkFirst: "Please open the cheatnetwork.eu/services/quizizz tab before clicking CRAWL.",
          cannotConnectCheatNetwork: "Cannot connect to CheatNetwork tab.",
          refreshCheatNetwork: "Could not send request to CheatNetwork. Please refresh the CheatNetwork tab.",
          crawlSuccess: (count) => `Successfully extracted ${count} questions into Database!`,
          crawlFailed: "Could not extract answers from CheatNetwork page.",
          crawlUnknownError: "Unknown error occurred while crawling.",
          openQuizizzFirst: "Please open an active Quizizz test tab before clicking Start.",
          startSuccess: "SHOW ANSWER mode activated on Quizizz!",
          startError: "Error activating Quizizz.",
          stopSuccess: "Process stopped.",
          hudBadge: "SHOW ANSWER",
          hudCloseTitle: "Hide / Close HUD",
          hudRestoreTitle: "Restore Quizizz Assistant HUD",
          hudRecognizedAnswer: "Recognized Answer:",
          hudNotFound: "(Not found in DB)",
          hudConfidence: "Confidence Score",
          hudStatus: "Status:",
          hudManualClick: "Click answer manually",
          hudManualType: "Type answer manually",
          hudAutoFilled: "\u2713 Auto-filled into input",
          hudNotMatched: "No button matched",
          hudFillIn: "Fill-in-the-blank",
          hudMatchedCount: (count) => `Matched ${count} correct answers`,
          hudOptionNum: (num) => `Option #${num}`
        }
      };
    }
  });

  // src/modes/show-answer.ts
  function ensureStylesInjected() {
    if (document.getElementById("qa-custom-styles")) return;
    const style = document.createElement("style");
    style.id = "qa-custom-styles";
    style.textContent = `
    .${HIGHLIGHT_CLASS} {
      position: relative !important;
      border: 3.5px solid #00e676 !important;
      outline: 3px solid #00e676 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 25px rgba(0, 230, 118, 0.85), inset 0 0 15px rgba(0, 230, 118, 0.25) !important;
      background-color: rgba(0, 230, 118, 0.16) !important;
      transition: all 0.25s ease-in-out !important;
      transform: scale(1.015) !important;
      z-index: 10 !important;
      animation: qaPulseNeonGreen 1.5s infinite alternate ease-in-out !important;
    }

    @keyframes qaPulseNeonGreen {
      0% {
        outline-color: #00e676;
        box-shadow: 0 0 15px rgba(0, 230, 118, 0.65), inset 0 0 10px rgba(0, 230, 118, 0.2);
      }
      100% {
        outline-color: #00ff88;
        box-shadow: 0 0 32px rgba(0, 255, 136, 0.95), inset 0 0 22px rgba(0, 255, 136, 0.35);
      }
    }
    #${HUD_ID} {
      position: fixed;
      top: 16px;
      right: 16px;
      width: 340px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 14px 16px;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      z-index: 999999;
      line-height: 1.4;
      font-size: 13px;
      user-select: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    #${HUD_ID} .hud-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 6px;
    }
    #${HUD_ID} .hud-title {
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.5px;
      color: #38bdf8;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #${HUD_ID} .hud-header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #${HUD_ID} .hud-close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      line-height: 1;
      transition: all 0.2s ease;
    }
    #${HUD_ID} .hud-close-btn:hover {
      background: rgba(239, 68, 68, 0.25);
      color: #ef4444;
    }
    #${HUD_ID} .hud-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    #${HUD_ID} .hud-label {
      color: #94a3b8;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 600;
    }
    #${HUD_ID} .hud-answer {
      color: #f1f5f9;
      font-weight: 600;
      font-size: 14px;
      background: #1e293b;
      padding: 8px 10px;
      border-radius: 6px;
      border-left: 3px solid #00e676;
      word-break: break-word;
    }
    #${HUD_ID} .confidence-bar-container {
      width: 100%;
      height: 6px;
      background: #334155;
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 4px;
    }
    #${HUD_ID} .confidence-bar-fill {
      height: 100%;
      transition: width 0.3s ease, background-color 0.3s ease;
    }
    #${HUD_ID} .hud-footer {
      margin-top: 8px;
      font-size: 11px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #${MINI_HUD_ID} {
      position: fixed;
      top: 16px;
      right: 16px;
      width: 36px;
      height: 36px;
      background: #0f172a;
      border: 1px solid #38bdf8;
      border-radius: 50%;
      color: #38bdf8;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      z-index: 999999;
      transition: all 0.2s ease;
    }
    #${MINI_HUD_ID}:hover {
      transform: scale(1.1);
      background: #1e293b;
    }
  `;
    document.head.appendChild(style);
  }
  function clearShowAnswerHighlights() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
      el.classList.remove(HIGHLIGHT_CLASS);
    });
  }
  function removeFloatingHUD() {
    const hud = document.getElementById(HUD_ID);
    if (hud) hud.remove();
    const mini = document.getElementById(MINI_HUD_ID);
    if (mini) mini.remove();
  }
  function updateFloatingHUD(match, lang = "vi") {
    ensureStylesInjected();
    const i18n = getI18n(lang);
    if (isHudDismissed) {
      ensureMiniToggleCreated(match, lang);
      return;
    }
    const mini = document.getElementById(MINI_HUD_ID);
    if (mini) mini.remove();
    let hud = document.getElementById(HUD_ID);
    if (!hud) {
      hud = document.createElement("div");
      hud.id = HUD_ID;
      document.body.appendChild(hud);
    }
    const score = match.confidenceScore;
    let barColor = "#ef4444";
    if (score >= 90) barColor = "#00e676";
    else if (score >= 70) barColor = "#f59e0b";
    const modeBadge = `<span style="background:#0284c7;color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;">${i18n.hudBadge}</span>`;
    let footerNotice = i18n.hudManualClick;
    if (match.isFillInTheBlank) {
      footerNotice = i18n.hudManualType;
    }
    let matchLabel = i18n.hudNotMatched;
    if (match.isFillInTheBlank) {
      matchLabel = i18n.hudFillIn;
    } else if (match.matchedOptionIndices && match.matchedOptionIndices.length > 1) {
      matchLabel = i18n.hudMatchedCount(match.matchedOptionIndices.length);
    } else if (match.matchedOptionIndex >= 0) {
      matchLabel = i18n.hudOptionNum(match.matchedOptionIndex + 1);
    }
    hud.innerHTML = `
    <div class="hud-header">
      <div class="hud-title">\u26A1 Quizizz Assistant ${modeBadge}</div>
      <div class="hud-header-actions">
        <span style="font-weight:700;color:${barColor};font-size:12px;">${score}%</span>
        <button id="qaHudCloseBtn" class="hud-close-btn" title="${i18n.hudCloseTitle}">\u2715</button>
      </div>
    </div>
    <div class="hud-body">
      <div class="hud-label">${i18n.hudRecognizedAnswer}</div>
      <div class="hud-answer">${match.expectedAnswer || i18n.hudNotFound}</div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;margin-top:2px;">
          <span>${i18n.hudConfidence}</span>
          <span>${score}%</span>
        </div>
        <div class="confidence-bar-container">
          <div class="confidence-bar-fill" style="width:${score}%;background-color:${barColor};"></div>
        </div>
      </div>
    </div>
    <div class="hud-footer">
      <span>${i18n.hudStatus} ${footerNotice}</span>
      <span>${matchLabel}</span>
    </div>
  `;
    const closeBtn = hud.querySelector("#qaHudCloseBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        isHudDismissed = true;
        hud?.remove();
        ensureMiniToggleCreated(match, lang);
      });
    }
  }
  function ensureMiniToggleCreated(match, lang = "vi") {
    const i18n = getI18n(lang);
    let mini = document.getElementById(MINI_HUD_ID);
    if (!mini) {
      mini = document.createElement("button");
      mini.id = MINI_HUD_ID;
      mini.title = i18n.hudRestoreTitle;
      mini.innerHTML = "\u26A1";
      mini.addEventListener("click", () => {
        isHudDismissed = false;
        mini?.remove();
        updateFloatingHUD(match, lang);
      });
      document.body.appendChild(mini);
    }
  }
  function handleShowAnswer(match, currentState, lang = "vi") {
    ensureStylesInjected();
    clearShowAnswerHighlights();
    if (match.matchedOptionIndices && match.matchedOptionIndices.length > 0) {
      for (const idx of match.matchedOptionIndices) {
        const targetOption = currentState.options[idx];
        if (targetOption && targetOption.element) {
          targetOption.element.classList.add(HIGHLIGHT_CLASS);
          targetOption.element.addEventListener(
            "click",
            () => {
              targetOption.element?.classList.remove(HIGHLIGHT_CLASS);
            },
            { once: true }
          );
        }
      }
    }
    updateFloatingHUD(match, lang);
  }
  var HIGHLIGHT_CLASS, HUD_ID, MINI_HUD_ID, isHudDismissed;
  var init_show_answer = __esm({
    "src/modes/show-answer.ts"() {
      "use strict";
      init_i18n();
      HIGHLIGHT_CLASS = "qa-matched-option-highlight";
      HUD_ID = "qa-floating-hud";
      MINI_HUD_ID = "qa-mini-hud-toggle";
      isHudDismissed = false;
    }
  });

  // src/content/quizizz.ts
  var require_quizizz = __commonJS({
    "src/content/quizizz.ts"() {
      init_storage();
      init_quiz_reader();
      init_matcher();
      init_show_answer();
      window.addEventListener("unhandledrejection", (event) => {
        if (event.reason?.message?.includes("Extension context invalidated") || String(event.reason).includes("Extension context invalidated")) {
          event.preventDefault();
        }
      });
      window.addEventListener("error", (event) => {
        if (event.message?.includes("Extension context invalidated")) {
          event.preventDefault();
        }
      });
      if (window.__QUIZIZZ_ASSISTANT_CLEANUP__) {
        try {
          window.__QUIZIZZ_ASSISTANT_CLEANUP__();
        } catch {
        }
      }
      var isRunning = false;
      var currentSettings = null;
      var cachedQuizDB = [];
      var stopObserverCallback = null;
      var currentProgress = 0;
      var lastMatch = null;
      var lastState = null;
      var currentLockedQuesId = null;
      var currentLockedQuesNum = null;
      var currentLockedQuesText = null;
      window.__QUIZIZZ_ASSISTANT_CLEANUP__ = () => {
        stopSession();
      };
      async function processCurrentQuestion(state) {
        if (!isRunning || !isExtensionValid()) return;
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
        if (cachedQuizDB.length === 0) {
          cachedQuizDB = await getQuizDatabase();
        }
        if (!isExtensionValid()) return;
        if (!currentSettings) {
          currentSettings = await getSettings();
        }
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
                statusText: lang === "en" ? `Question ${counter.current} / ${counter.total}` : `C\xE2u ${counter.current} / ${counter.total}`
              }).catch(() => {
              });
            }
          } catch {
          }
        }
        console.log("[Quizizz Assistant] Processing Question:", state.questionText.slice(0, 50) + "...");
        const match = matchQuestionAndAnswer(state, cachedQuizDB);
        console.log("[Quizizz Assistant] Match result:", match);
        lastMatch = match;
        lastState = state;
        handleShowAnswer(match, state, currentSettings?.language || "vi");
      }
      async function startSession() {
        isRunning = true;
        currentSettings = await getSettings();
        cachedQuizDB = await getQuizDatabase();
        const state = await getAppState();
        currentProgress = state.currentProgress || 0;
        await updateAppState({ isRunning: true, status: "Running" });
        if (stopObserverCallback) {
          stopObserverCallback();
          stopObserverCallback = null;
        }
        const initial = readCurrentQuiz();
        if (initial) {
          processCurrentQuestion(initial);
        }
        stopObserverCallback = observeQuizChanges((newState) => {
          processCurrentQuestion(newState);
        });
        console.log("[Quizizz Assistant] Show Answer mode started.");
      }
      async function stopSession() {
        isRunning = false;
        currentLockedQuesId = null;
        currentLockedQuesNum = null;
        currentLockedQuesText = null;
        clearShowAnswerHighlights();
        removeFloatingHUD();
        if (stopObserverCallback) {
          stopObserverCallback();
          stopObserverCallback = null;
        }
        await updateAppState({ isRunning: false, status: "Stopped" });
        console.log("[Quizizz Assistant] Session stopped.");
      }
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
    }
  });
  require_quizizz();
})();
//# sourceMappingURL=quizizz.js.map
