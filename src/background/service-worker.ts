import { getSettings, DEFAULT_SETTINGS } from "../shared/storage";

chrome.runtime.onInstalled.addListener(async () => {
  console.log("[Quizizz Assistant] Extension installed.");
  chrome.storage.local.set({ quizizz_assistant_settings: DEFAULT_SETTINGS });
});
