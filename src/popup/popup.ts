import { ExtensionSettings, AppState, Language } from "../shared/types";
import { getSettings, saveSettings, getAppState, updateAppState, getQuizDatabase, clearQuizDatabase } from "../shared/storage";
import { getI18n, translations } from "../shared/i18n";

// DOM Elements
const btnLangVi = document.getElementById("btnLangVi") as HTMLButtonElement;
const btnLangEn = document.getElementById("btnLangEn") as HTMLButtonElement;
const btnClosePopup = document.getElementById("btnClosePopup") as HTMLButtonElement;

const btnCrawl = document.getElementById("btnCrawl") as HTMLButtonElement;
const btnResetDb = document.getElementById("btnResetDb") as HTMLButtonElement;
const txtBtnCrawl = document.getElementById("txtBtnCrawl") as HTMLElement;
const txtBtnReset = document.getElementById("txtBtnReset") as HTMLElement;
const lblCrawlStatus = document.getElementById("lblCrawlStatus") as HTMLElement;
const crawlStatusEl = document.getElementById("crawlStatus") as HTMLElement;
const lblQuestions = document.getElementById("lblQuestions") as HTMLElement;
const questionCountEl = document.getElementById("questionCount") as HTMLElement;

const lblControlsTitle = document.getElementById("lblControlsTitle") as HTMLElement;
const btnStart = document.getElementById("btnStart") as HTMLButtonElement;
const btnStop = document.getElementById("btnStop") as HTMLButtonElement;
const lblSessionStatus = document.getElementById("lblSessionStatus") as HTMLElement;
const sessionStatusEl = document.getElementById("sessionStatus") as HTMLElement;
const lblProgress = document.getElementById("lblProgress") as HTMLElement;
const progressTextEl = document.getElementById("progressText") as HTMLElement;
const alertBox = document.getElementById("alertBox") as HTMLElement;

let currentSettings: ExtensionSettings;
let currentAppState: AppState;
let currentCrawlStatus: "Ready" | "Crawling" | "Completed" | "Failed" | "Error" = "Ready";

function showAlert(message: string, isError: boolean = false) {
  alertBox.className = `alert ${isError ? "alert-error" : "alert-success"}`;
  alertBox.textContent = message;
  alertBox.classList.remove("hidden");
  setTimeout(() => {
    alertBox.classList.add("hidden");
  }, 4500);
}

function getLocalizedStatusText(status: string, lang: Language): string {
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

function applyLanguage(lang: Language) {
  const i18n = getI18n(lang);
  document.documentElement.lang = lang;

  // Toggle active class on language buttons
  if (btnLangVi && btnLangEn) {
    btnLangVi.classList.toggle("active", lang === "vi");
    btnLangEn.classList.toggle("active", lang === "en");
  }

  // Update text elements
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

  // Update current status displays
  crawlStatusEl.textContent = getLocalizedStatusText(currentCrawlStatus, lang);
  if (currentAppState) {
    updateSessionUI(currentAppState);
  }
}

function updateSessionUI(appState: AppState) {
  const lang = currentSettings?.language || "vi";
  sessionStatusEl.textContent = getLocalizedStatusText(appState.status, lang);
  sessionStatusEl.className = `meta-value status-${appState.status.toLowerCase()}`;
  progressTextEl.textContent = `${appState.currentProgress} / ${appState.totalQuestions}`;
}

function isQuizizzUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes("quizizz.com") || url.includes("wayground.com");
}

function isCheatNetworkUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes("cheatnetwork.eu");
}

/**
 * Ensures script is dynamically injected if tab was open before extension reload
 */
async function ensureScriptInjected(tabId: number, scriptFile: string): Promise<boolean> {
  try {
    if (typeof chrome.scripting !== "undefined" && chrome.scripting.executeScript) {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [scriptFile],
      });
      return true;
    }
  } catch (e) {
    console.log("Script inject note:", e);
  }
  return false;
}

async function findQuizizzTabs(): Promise<chrome.tabs.Tab[]> {
  const allTabs = await chrome.tabs.query({});
  return allTabs.filter((t) => t.id && isQuizizzUrl(t.url));
}

async function findCheatNetworkTabs(): Promise<chrome.tabs.Tab[]> {
  const allTabs = await chrome.tabs.query({});
  return allTabs.filter((t) => t.id && isCheatNetworkUrl(t.url));
}

async function notifyActiveQuizizzTab(message: any) {
  try {
    const quizizzTabs = await findQuizizzTabs();
    for (const tab of quizizzTabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message, () => {
          if (chrome.runtime.lastError) { /* ignore */ }
        });
      }
    }
  } catch {
    // Ignore error
  }
}

async function initUI() {
  currentSettings = await getSettings();
  currentAppState = await getAppState();
  const db = await getQuizDatabase();

  const lang: Language = currentSettings.language || "vi";
  currentCrawlStatus = db.length > 0 ? "Completed" : "Ready";

  questionCountEl.textContent = db.length.toString();
  crawlStatusEl.className = db.length > 0 ? "meta-value status-completed" : "meta-value status-idle";

  currentAppState.totalQuestions = db.length;
  applyLanguage(lang);

  // Language Switch buttons
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

  // Close Popup button
  if (btnClosePopup) {
    btnClosePopup.addEventListener("click", () => {
      window.close();
    });
  }

  // Reset Database button
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

  // Crawl Button
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
        chrome.tabs.sendMessage(targetTab.id!, { type: "TRIGGER_CRAWL" }, async (response) => {
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
    } catch (err: any) {
      btnCrawl.disabled = false;
      currentCrawlStatus = "Error";
      crawlStatusEl.textContent = getLocalizedStatusText("Error", activeLang);
      showAlert(err?.message || i18n.crawlUnknownError, true);
    }
  });

  // START Button
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

      // Send START to all Quizizz tabs, ensuring content script is injected first
      for (const tab of quizizzTabs) {
        if (tab.id) {
          await ensureScriptInjected(tab.id, "content/quizizz.js");
          chrome.tabs.sendMessage(tab.id, { type: "START_SESSION" }, () => {
            if (chrome.runtime.lastError) { /* ignore */ }
          });
        }
      }

      showAlert(i18n.startSuccess);
    } catch (err: any) {
      showAlert(err?.message || i18n.startError, true);
    }
  });

  // STOP Button
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
          if (chrome.runtime.lastError) { /* ignore */ }
        });
      }
    }

    showAlert(i18n.stopSuccess, false);
  });
}

// Listen for updates from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "QUIZ_STATE_UPDATE") {
    currentAppState.currentProgress = message.progress;
    currentAppState.totalQuestions = message.total;
    updateSessionUI(currentAppState);
  }
});

// Run init
document.addEventListener("DOMContentLoaded", initUI);
