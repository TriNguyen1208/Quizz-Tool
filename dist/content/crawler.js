"use strict";
(() => {
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

  // src/shared/storage.ts
  var STORAGE_KEYS = {
    SETTINGS: "quizizz_assistant_settings",
    QUIZ_DATABASE: "quizizz_assistant_quiz_db",
    APP_STATE: "quizizz_assistant_app_state"
  };
  var DEFAULT_APP_STATE = {
    isRunning: false,
    status: "Ready",
    currentProgress: 0,
    totalQuestions: 0
  };
  function isExtensionValid() {
    try {
      if (typeof chrome === "undefined" || !chrome.runtime) return false;
      chrome.runtime.getManifest();
      return true;
    } catch {
      return false;
    }
  }
  async function saveQuizDatabase(items) {
    if (!isExtensionValid() || !chrome.storage?.local) {
      return;
    }
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.QUIZ_DATABASE]: items });
      await updateAppState({ totalQuestions: items.length });
    } catch {
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

  // src/content/crawler.ts
  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason?.message?.includes("Extension context invalidated") || String(event.reason).includes("Extension context invalidated")) {
      event.preventDefault();
    }
  });
  function extractQuizItemsFromDOM() {
    const items = [];
    const questionBoxes = Array.from(
      document.querySelectorAll(
        ".question-box, div[class*='question-box'], [data-reveal] .question-box"
      )
    );
    console.log(`[CheatNetwork Crawler] Found ${questionBoxes.length} .question-box elements.`);
    if (questionBoxes.length > 0) {
      for (let idx = 0; idx < questionBoxes.length; idx++) {
        const box = questionBoxes[idx];
        const qElement = box.querySelector("p.font-semibold, p, [class*='text-gray-200']");
        const rawQuestion = qElement?.innerText?.trim() || "";
        if (!rawQuestion || rawQuestion.length < 2) continue;
        const liElements = Array.from(box.querySelectorAll("ul li, li"));
        const rawAnswers = [];
        const cleanAnswers = [];
        for (const li of liElements) {
          const span = li.querySelector("span");
          const txt = (span?.innerText || li.innerText || "").trim();
          if (txt) {
            rawAnswers.push(txt);
            cleanAnswers.push(stripOptionPrefix(txt));
          }
        }
        let mainAnswer = cleanAnswers.join(" | ");
        if (!mainAnswer) {
          const ul = box.querySelector("ul");
          if (ul && ul.innerText.trim()) {
            const txt = ul.innerText.trim();
            rawAnswers.push(txt);
            mainAnswer = stripOptionPrefix(txt);
            cleanAnswers.push(mainAnswer);
          }
        }
        if (rawQuestion && mainAnswer) {
          items.push({
            id: `item_${idx + 1}`,
            question: rawQuestion,
            normalizedQuestion: normalizeText(rawQuestion, false),
            answer: mainAnswer,
            normalizedAnswer: normalizeText(mainAnswer, true),
            options: cleanAnswers,
            rawQuestion,
            rawAnswer: rawAnswers.join(" | "),
            crawledAt: Date.now()
          });
        }
      }
    }
    if (items.length === 0) {
      console.warn("[CheatNetwork Crawler] .question-box selector returned 0 items, using fallback heuristic.");
      const candidateCards = Array.from(
        document.querySelectorAll(
          "div[data-reveal], div[class*='rounded-2xl'], div[class*='card']"
        )
      );
      for (let idx = 0; idx < candidateCards.length; idx++) {
        const card = candidateCards[idx];
        const p = card.querySelector("p");
        const ul = card.querySelector("ul");
        if (p && ul) {
          const rawQuestion = p.innerText.trim();
          const liList = Array.from(ul.querySelectorAll("li")).map((l) => l.innerText.trim()).filter(Boolean);
          const mainAnswer = liList.map(stripOptionPrefix).join(" | ");
          if (rawQuestion.length > 2 && mainAnswer.length > 0) {
            items.push({
              id: `item_${idx + 1}`,
              question: rawQuestion,
              normalizedQuestion: normalizeText(rawQuestion, false),
              answer: mainAnswer,
              normalizedAnswer: normalizeText(mainAnswer, true),
              options: liList.map(stripOptionPrefix),
              rawQuestion,
              rawAnswer: liList.join(" | "),
              crawledAt: Date.now()
            });
          }
        }
      }
    }
    const uniqueItems = [];
    const seen = /* @__PURE__ */ new Set();
    for (const it of items) {
      if (!seen.has(it.normalizedQuestion)) {
        seen.add(it.normalizedQuestion);
        uniqueItems.push(it);
      }
    }
    return uniqueItems;
  }
  async function executeCrawl() {
    try {
      const items = extractQuizItemsFromDOM();
      if (items.length === 0) {
        return {
          success: false,
          count: 0,
          error: "Kh\xF4ng t\xECm th\u1EA5y c\xE2u h\u1ECFi n\xE0o. H\xE3y ch\u1EAFc ch\u1EAFn b\u1EA1n \u0111\xE3 v\xE0o cheatnetwork.eu/services/quizizz v\xE0 trang \u0111\xE3 hi\u1EC3n th\u1ECB danh s\xE1ch c\xE2u h\u1ECFi."
        };
      }
      await saveQuizDatabase(items);
      await updateAppState({
        status: "Completed",
        totalQuestions: items.length,
        currentProgress: 0
      });
      console.log(`[CheatNetwork Crawler] Successfully crawled ${items.length} questions into Local Database.`);
      return { success: true, count: items.length };
    } catch (err) {
      console.error("[CheatNetwork Crawler] Crawl error:", err);
      return {
        success: false,
        count: 0,
        error: err?.message || "L\u1ED7i khi tr\xEDch xu\u1EA5t d\u1EEF li\u1EC7u t\u1EEB CheatNetwork."
      };
    }
  }
  if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "TRIGGER_CRAWL") {
        executeCrawl().then((result) => {
          sendResponse(result);
        });
        return true;
      }
    });
  }
})();
//# sourceMappingURL=crawler.js.map
