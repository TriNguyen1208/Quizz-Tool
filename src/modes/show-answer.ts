import { MatchResult, CurrentQuizState, Language } from "../shared/types";
import { getI18n } from "../shared/i18n";

/**
 * Show Answer Mode:
 * 1. Highlights ALL matched option buttons directly on Quizizz (handles single and multiple-choice).
 * 2. Automatically fills or highlights the input field for fill-in-the-blank questions.
 * 3. Displays a floating widget (HUD) with detailed answer text and confidence score.
 */

const HIGHLIGHT_CLASS = "qa-matched-option-highlight";
const HUD_ID = "qa-floating-hud";
const MINI_HUD_ID = "qa-mini-hud-toggle";

let isHudDismissed = false;

/**
 * Injects required CSS styles for the highlight and floating HUD
 */
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

/**
 * Removes all previous highlights from elements
 */
export function clearShowAnswerHighlights() {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_CLASS);
  });
}

/**
 * Removes or hides the floating HUD
 */
export function removeFloatingHUD() {
  const hud = document.getElementById(HUD_ID);
  if (hud) hud.remove();
  const mini = document.getElementById(MINI_HUD_ID);
  if (mini) mini.remove();
}

/**
 * Render or update the floating HUD on the page
 */
export function updateFloatingHUD(
  match: MatchResult,
  lang: Language = "vi"
) {
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
  let barColor = "#ef4444"; // red
  if (score >= 90) barColor = "#00e676"; // electric neon green
  else if (score >= 70) barColor = "#f59e0b"; // yellow

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
      <div class="hud-title">⚡ Quizizz Assistant ${modeBadge}</div>
      <div class="hud-header-actions">
        <span style="font-weight:700;color:${barColor};font-size:12px;">${score}%</span>
        <button id="qaHudCloseBtn" class="hud-close-btn" title="${i18n.hudCloseTitle}">✕</button>
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

  // Attach Close Event Listener
  const closeBtn = hud.querySelector("#qaHudCloseBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      isHudDismissed = true;
      hud?.remove();
      ensureMiniToggleCreated(match, lang);
    });
  }
}

/**
 * Creates mini floating button so user can restore HUD if closed
 */
function ensureMiniToggleCreated(
  match: MatchResult,
  lang: Language = "vi"
) {
  const i18n = getI18n(lang);
  let mini = document.getElementById(MINI_HUD_ID);
  if (!mini) {
    mini = document.createElement("button");
    mini.id = MINI_HUD_ID;
    mini.title = i18n.hudRestoreTitle;
    mini.innerHTML = "⚡";
    mini.addEventListener("click", () => {
      isHudDismissed = false;
      mini?.remove();
      updateFloatingHUD(match, lang);
    });
    document.body.appendChild(mini);
  }
}

/**
 * Primary presentation handler for SHOW ANSWER mode
 */
export function handleShowAnswer(
  match: MatchResult,
  currentState: CurrentQuizState,
  lang: Language = "vi"
): void {
  ensureStylesInjected();
  clearShowAnswerHighlights();

  // For Multiple Choice & Single Choice Options: Highlight ALL matched options!
  if (match.matchedOptionIndices && match.matchedOptionIndices.length > 0) {
    for (const idx of match.matchedOptionIndices) {
      const targetOption = currentState.options[idx];
      if (targetOption && targetOption.element) {
        targetOption.element.classList.add(HIGHLIGHT_CLASS);

        // Clear highlight immediately when clicked
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

  // Update Floating HUD (for fill-in questions, answer is displayed only on the HUD)
  updateFloatingHUD(match, lang);
}
