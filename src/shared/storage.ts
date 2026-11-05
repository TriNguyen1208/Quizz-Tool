import { ExtensionSettings, QuizItem, AppState } from "./types";

const STORAGE_KEYS = {
  SETTINGS: "quizizz_assistant_settings",
  QUIZ_DATABASE: "quizizz_assistant_quiz_db",
  APP_STATE: "quizizz_assistant_app_state",
};

export const DEFAULT_SETTINGS: ExtensionSettings = {
  language: "vi",
  autoNext: false,
};

export const DEFAULT_APP_STATE: AppState = {
  isRunning: false,
  status: "Ready",
  currentProgress: 0,
  totalQuestions: 0,
};

/**
 * Reliable check if extension runtime context is valid.
 * In Chrome, chrome.runtime.getManifest() throws synchronously if context is invalidated.
 */
export function isExtensionValid(): boolean {
  try {
    if (typeof chrome === "undefined" || !chrome.runtime) return false;
    chrome.runtime.getManifest();
    return true;
  } catch {
    return false;
  }
}

/**
 * Storage wrapper using async/await with 100% rejection safety
 */
export async function getSettings(): Promise<ExtensionSettings> {
  if (!isExtensionValid() || !chrome.storage?.local) {
    return DEFAULT_SETTINGS;
  }
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.SETTINGS]);
    const saved = (result?.[STORAGE_KEYS.SETTINGS] as Partial<ExtensionSettings>) || {};
    return { ...DEFAULT_SETTINGS, ...saved };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  if (!isExtensionValid() || !chrome.storage?.local) {
    return updated;
  }
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
  } catch {
    // Context invalidated or storage error
  }
  return updated;
}

export async function getQuizDatabase(): Promise<QuizItem[]> {
  if (!isExtensionValid() || !chrome.storage?.local) {
    return [];
  }
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.QUIZ_DATABASE]);
    const items = (result?.[STORAGE_KEYS.QUIZ_DATABASE] as QuizItem[]) || [];
    return items;
  } catch {
    return [];
  }
}

export async function saveQuizDatabase(items: QuizItem[]): Promise<void> {
  if (!isExtensionValid() || !chrome.storage?.local) {
    return;
  }
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.QUIZ_DATABASE]: items });
    await updateAppState({ totalQuestions: items.length });
  } catch {
    // Context invalidated
  }
}

export async function clearQuizDatabase(): Promise<void> {
  if (!isExtensionValid() || !chrome.storage?.local) {
    return;
  }
  try {
    await chrome.storage.local.remove([STORAGE_KEYS.QUIZ_DATABASE]);
    await updateAppState({ totalQuestions: 0, currentProgress: 0 });
  } catch {
    // Context invalidated
  }
}

export async function getAppState(): Promise<AppState> {
  if (!isExtensionValid() || !chrome.storage?.local) {
    return DEFAULT_APP_STATE;
  }
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.APP_STATE]);
    const saved = (result?.[STORAGE_KEYS.APP_STATE] as Partial<AppState>) || {};
    return { ...DEFAULT_APP_STATE, ...saved };
  } catch {
    return DEFAULT_APP_STATE;
  }
}

export async function updateAppState(partialState: Partial<AppState>): Promise<AppState> {
  const current = await getAppState();
  const updated = { ...current, ...partialState };
  if (!isExtensionValid() || !chrome.storage?.local) {
    return updated;
  }
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.APP_STATE]: updated });
  } catch {
    // Context invalidated
  }
  return updated;
}
