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
  var DEFAULT_SETTINGS;
  var init_storage = __esm({
    "src/shared/storage.ts"() {
      "use strict";
      DEFAULT_SETTINGS = {
        language: "vi",
        autoNext: false
      };
    }
  });

  // src/background/service-worker.ts
  var require_service_worker = __commonJS({
    "src/background/service-worker.ts"() {
      init_storage();
      chrome.runtime.onInstalled.addListener(async () => {
        console.log("[Quizizz Assistant] Extension installed.");
        chrome.storage.local.set({ quizizz_assistant_settings: DEFAULT_SETTINGS });
      });
    }
  });
  require_service_worker();
})();
//# sourceMappingURL=service-worker.js.map
