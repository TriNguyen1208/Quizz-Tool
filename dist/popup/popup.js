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
  async function saveSettings(settings) {
    const current = await getSettings();
    const updated = { ...current, ...settings };
    if (!isExtensionValid() || !chrome.storage?.local) {
      return updated;
    }
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
    } catch {
    }
    return updated;
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
  async function clearQuizDatabase() {
    if (!isExtensionValid() || !chrome.storage?.local) {
      return;
    }
    try {
      await chrome.storage.local.remove([STORAGE_KEYS.QUIZ_DATABASE]);
      await updateAppState({ totalQuestions: 0, currentProgress: 0 });
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

  // src/popup/popup.ts
  var require_popup = __commonJS({
    "src/popup/popup.ts"() {
      init_storage();
      init_i18n();
      var btnLangVi = document.getElementById("btnLangVi");
      var btnLangEn = document.getElementById("btnLangEn");
      var btnClosePopup = document.getElementById("btnClosePopup");
      var btnCrawl = document.getElementById("btnCrawl");
      var btnResetDb = document.getElementById("btnResetDb");
      var txtBtnCrawl = document.getElementById("txtBtnCrawl");
      var txtBtnReset = document.getElementById("txtBtnReset");
      var lblCrawlStatus = document.getElementById("lblCrawlStatus");
      var crawlStatusEl = document.getElementById("crawlStatus");
      var lblQuestions = document.getElementById("lblQuestions");
      var questionCountEl = document.getElementById("questionCount");
      var lblControlsTitle = document.getElementById("lblControlsTitle");
      var btnStart = document.getElementById("btnStart");
      var btnStop = document.getElementById("btnStop");
      var lblSessionStatus = document.getElementById("lblSessionStatus");
      var sessionStatusEl = document.getElementById("sessionStatus");
      var lblProgress = document.getElementById("lblProgress");
      var progressTextEl = document.getElementById("progressText");
      var alertBox = document.getElementById("alertBox");
      var currentSettings;
      var currentAppState;
      var currentCrawlStatus = "Ready";
      function showAlert(message, isError = false) {
        alertBox.className = `alert ${isError ? "alert-error" : "alert-success"}`;
        alertBox.textContent = message;
        alertBox.classList.remove("hidden");
        setTimeout(() => {
          alertBox.classList.add("hidden");
        }, 4500);
      }
      function getLocalizedStatusText(status, lang) {
        const i18n = getI18n(lang);
        switch (status) {
          case "Ready":
            return i18n.statusReady;
          case "Crawling":
            return i18n.statusCrawling;
          case "Completed":
            return i18n.statusCompleted;
          case "Failed":
            return i18n.statusFailed;
          case "Error":
            return i18n.statusError;
          case "Running":
            return i18n.statusRunning;
          case "Stopped":
            return i18n.statusStopped;
          default:
            return status;
        }
      }
      function applyLanguage(lang) {
        const i18n = getI18n(lang);
        document.documentElement.lang = lang;
        if (btnLangVi && btnLangEn) {
          btnLangVi.classList.toggle("active", lang === "vi");
          btnLangEn.classList.toggle("active", lang === "en");
        }
        if (lblCrawlStatus) lblCrawlStatus.textContent = i18n.statusLabel;
        if (lblQuestions) lblQuestions.textContent = i18n.questionsLabel;
        if (lblControlsTitle) lblControlsTitle.textContent = i18n.controlsTitle;
        if (lblSessionStatus) lblSessionStatus.textContent = i18n.statusLabel;
        if (lblProgress) lblProgress.textContent = i18n.progressLabel;
        if (btnClosePopup) btnClosePopup.title = i18n.closePopup;
        if (btnCrawl) btnCrawl.title = i18n.crawlBtnTitle;
        if (btnResetDb) btnResetDb.title = i18n.resetBtnTitle;
        if (txtBtnCrawl) txtBtnCrawl.textContent = "CRAWL";
        if (txtBtnReset) txtBtnReset.textContent = "RESET";
        if (btnStart) btnStart.textContent = i18n.startBtn;
        if (btnStop) btnStop.textContent = i18n.stopBtn;
        crawlStatusEl.textContent = getLocalizedStatusText(currentCrawlStatus, lang);
        if (currentAppState) {
          updateSessionUI(currentAppState);
        }
      }
      function updateSessionUI(appState) {
        const lang = currentSettings?.language || "vi";
        sessionStatusEl.textContent = getLocalizedStatusText(appState.status, lang);
        sessionStatusEl.className = `meta-value status-${appState.status.toLowerCase()}`;
        progressTextEl.textContent = `${appState.currentProgress} / ${appState.totalQuestions}`;
      }
      function isQuizizzUrl(url) {
        if (!url) return false;
        return url.includes("quizizz.com") || url.includes("wayground.com");
      }
      function isCheatNetworkUrl(url) {
        if (!url) return false;
        return url.includes("cheatnetwork.eu");
      }
      async function ensureScriptInjected(tabId, scriptFile) {
        try {
          if (typeof chrome.scripting !== "undefined" && chrome.scripting.executeScript) {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: [scriptFile]
            });
            return true;
          }
        } catch (e) {
          console.log("Script inject note:", e);
        }
        return false;
      }
      async function findQuizizzTabs() {
        const allTabs = await chrome.tabs.query({});
        return allTabs.filter((t) => t.id && isQuizizzUrl(t.url));
      }
      async function findCheatNetworkTabs() {
        const allTabs = await chrome.tabs.query({});
        return allTabs.filter((t) => t.id && isCheatNetworkUrl(t.url));
      }
      async function notifyActiveQuizizzTab(message) {
        try {
          const quizizzTabs = await findQuizizzTabs();
          for (const tab of quizizzTabs) {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, message, () => {
                if (chrome.runtime.lastError) {
                }
              });
            }
          }
        } catch {
        }
      }
      async function initUI() {
        currentSettings = await getSettings();
        currentAppState = await getAppState();
        const db = await getQuizDatabase();
        const lang = currentSettings.language || "vi";
        currentCrawlStatus = db.length > 0 ? "Completed" : "Ready";
        questionCountEl.textContent = db.length.toString();
        crawlStatusEl.className = db.length > 0 ? "meta-value status-completed" : "meta-value status-idle";
        currentAppState.totalQuestions = db.length;
        applyLanguage(lang);
        if (btnLangVi) {
          btnLangVi.addEventListener("click", async () => {
            if (currentSettings.language === "vi") return;
            currentSettings.language = "vi";
            await saveSettings({ language: "vi" });
            applyLanguage("vi");
            await notifyActiveQuizizzTab({ type: "SAVE_SETTINGS" });
          });
        }
        if (btnLangEn) {
          btnLangEn.addEventListener("click", async () => {
            if (currentSettings.language === "en") return;
            currentSettings.language = "en";
            await saveSettings({ language: "en" });
            applyLanguage("en");
            await notifyActiveQuizizzTab({ type: "SAVE_SETTINGS" });
          });
        }
        if (btnClosePopup) {
          btnClosePopup.addEventListener("click", () => {
            window.close();
          });
        }
        if (btnResetDb) {
          btnResetDb.addEventListener("click", async () => {
            const activeLang = currentSettings.language || "vi";
            const i18n = getI18n(activeLang);
            await clearQuizDatabase();
            questionCountEl.textContent = "0";
            currentCrawlStatus = "Ready";
            crawlStatusEl.textContent = getLocalizedStatusText("Ready", activeLang);
            crawlStatusEl.className = "meta-value status-idle";
            currentAppState.totalQuestions = 0;
            currentAppState.currentProgress = 0;
            currentAppState.status = "Ready";
            await updateAppState({ totalQuestions: 0, currentProgress: 0, status: "Ready" });
            updateSessionUI(currentAppState);
            showAlert(i18n.dbResetSuccess);
          });
        }
        btnCrawl.addEventListener("click", async () => {
          const activeLang = currentSettings.language || "vi";
          const i18n = getI18n(activeLang);
          btnCrawl.disabled = true;
          currentCrawlStatus = "Crawling";
          crawlStatusEl.textContent = getLocalizedStatusText("Crawling", activeLang);
          crawlStatusEl.className = "meta-value";
          try {
            const cheatTabs = await findCheatNetworkTabs();
            if (cheatTabs.length === 0) {
              throw new Error(i18n.openCheatNetworkFirst);
            }
            const currentActive = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
            const targetTab = currentActive && isCheatNetworkUrl(currentActive.url) ? currentActive : cheatTabs[0];
            if (!targetTab.id) {
              throw new Error(i18n.cannotConnectCheatNetwork);
            }
            await ensureScriptInjected(targetTab.id, "content/crawler.js");
            setTimeout(() => {
              chrome.tabs.sendMessage(targetTab.id, { type: "TRIGGER_CRAWL" }, async (response) => {
                btnCrawl.disabled = false;
                if (chrome.runtime.lastError) {
                  console.warn("Crawl messaging error:", chrome.runtime.lastError);
                  currentCrawlStatus = "Error";
                  crawlStatusEl.textContent = getLocalizedStatusText("Error", activeLang);
                  showAlert(i18n.refreshCheatNetwork, true);
                  return;
                }
                if (response && response.success) {
                  currentCrawlStatus = "Completed";
                  crawlStatusEl.textContent = getLocalizedStatusText("Completed", activeLang);
                  crawlStatusEl.className = "meta-value status-completed";
                  questionCountEl.textContent = response.count.toString();
                  currentAppState.totalQuestions = response.count;
                  currentAppState.currentProgress = 0;
                  await updateAppState({ totalQuestions: response.count, currentProgress: 0, status: "Ready" });
                  updateSessionUI(currentAppState);
                  showAlert(i18n.crawlSuccess(response.count));
                } else {
                  currentCrawlStatus = "Failed";
                  crawlStatusEl.textContent = getLocalizedStatusText("Failed", activeLang);
                  showAlert(response?.error || i18n.crawlFailed, true);
                }
              });
            }, 100);
          } catch (err) {
            btnCrawl.disabled = false;
            currentCrawlStatus = "Error";
            crawlStatusEl.textContent = getLocalizedStatusText("Error", activeLang);
            showAlert(err?.message || i18n.crawlUnknownError, true);
          }
        });
        btnStart.addEventListener("click", async () => {
          const activeLang = currentSettings.language || "vi";
          const i18n = getI18n(activeLang);
          try {
            const quizizzTabs = await findQuizizzTabs();
            if (quizizzTabs.length === 0) {
              showAlert(i18n.openQuizizzFirst, true);
              return;
            }
            currentAppState.status = "Running";
            currentAppState.isRunning = true;
            await updateAppState({ isRunning: true, status: "Running" });
            updateSessionUI(currentAppState);
            for (const tab of quizizzTabs) {
              if (tab.id) {
                await ensureScriptInjected(tab.id, "content/quizizz.js");
                chrome.tabs.sendMessage(tab.id, { type: "START_SESSION" }, () => {
                  if (chrome.runtime.lastError) {
                  }
                });
              }
            }
            showAlert(i18n.startSuccess);
          } catch (err) {
            showAlert(err?.message || i18n.startError, true);
          }
        });
        btnStop.addEventListener("click", async () => {
          const activeLang = currentSettings.language || "vi";
          const i18n = getI18n(activeLang);
          currentAppState.status = "Stopped";
          currentAppState.isRunning = false;
          await updateAppState({ isRunning: false, status: "Stopped" });
          updateSessionUI(currentAppState);
          const quizizzTabs = await findQuizizzTabs();
          for (const tab of quizizzTabs) {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { type: "STOP_SESSION" }, () => {
                if (chrome.runtime.lastError) {
                }
              });
            }
          }
          showAlert(i18n.stopSuccess, false);
        });
      }
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "QUIZ_STATE_UPDATE") {
          currentAppState.currentProgress = message.progress;
          currentAppState.totalQuestions = message.total;
          updateSessionUI(currentAppState);
        }
      });
      document.addEventListener("DOMContentLoaded", initUI);
    }
  });
  require_popup();
})();
//# sourceMappingURL=popup.js.map
