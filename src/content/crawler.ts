import { QuizItem } from "../shared/types";
import { normalizeText, stripOptionPrefix } from "../shared/normalizer";
import { saveQuizDatabase, updateAppState, isExtensionValid } from "../shared/storage";

window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason?.message?.includes("Extension context invalidated") ||
    String(event.reason).includes("Extension context invalidated")
  ) {
    event.preventDefault();
  }
});

/**
 * Crawler script running on cheatnetwork.eu/services/quizizz
 * Specifically optimized for CheatNetwork's DOM structure (.question-box)
 */

export function extractQuizItemsFromDOM(): QuizItem[] {
  const items: QuizItem[] = [];

  // Primary Strategy: CheatNetwork specific selector (.question-box)
  const questionBoxes = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".question-box, div[class*='question-box'], [data-reveal] .question-box"
    )
  );

  console.log(`[CheatNetwork Crawler] Found ${questionBoxes.length} .question-box elements.`);

  if (questionBoxes.length > 0) {
    for (let idx = 0; idx < questionBoxes.length; idx++) {
      const box = questionBoxes[idx];

      // 1. Extract Question Text
      const qElement = box.querySelector<HTMLElement>("p.font-semibold, p, [class*='text-gray-200']");
      const rawQuestion = qElement?.innerText?.trim() || "";
      if (!rawQuestion || rawQuestion.length < 2) continue;

      // 2. Extract Answer Text(s) from ul li
      const liElements = Array.from(box.querySelectorAll<HTMLElement>("ul li, li"));
      const rawAnswers: string[] = [];
      const cleanAnswers: string[] = [];

      for (const li of liElements) {
        // Look for span or direct text inside li
        const span = li.querySelector("span");
        const txt = (span?.innerText || li.innerText || "").trim();
        if (txt) {
          rawAnswers.push(txt);
          cleanAnswers.push(stripOptionPrefix(txt));
        }
      }

      // If no li found, fallback to ul text or sibling of p
      let mainAnswer = cleanAnswers.join(" | ");
      if (!mainAnswer) {
        const ul = box.querySelector<HTMLElement>("ul");
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
          crawledAt: Date.now(),
        });
      }
    }
  }

  // Fallback Strategy: If CheatNetwork changed classes or rendered differently
  if (items.length === 0) {
    console.warn("[CheatNetwork Crawler] .question-box selector returned 0 items, using fallback heuristic.");
    const candidateCards = Array.from(
      document.querySelectorAll<HTMLElement>(
        "div[data-reveal], div[class*='rounded-2xl'], div[class*='card']"
      )
    );

    for (let idx = 0; idx < candidateCards.length; idx++) {
      const card = candidateCards[idx];
      const p = card.querySelector<HTMLElement>("p");
      const ul = card.querySelector<HTMLElement>("ul");

      if (p && ul) {
        const rawQuestion = p.innerText.trim();
        const liList = Array.from(ul.querySelectorAll<HTMLElement>("li")).map((l) => l.innerText.trim()).filter(Boolean);
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
            crawledAt: Date.now(),
          });
        }
      }
    }
  }

  // Deduplicate items based on normalized question
  const uniqueItems: QuizItem[] = [];
  const seen = new Set<string>();

  for (const it of items) {
    if (!seen.has(it.normalizedQuestion)) {
      seen.add(it.normalizedQuestion);
      uniqueItems.push(it);
    }
  }

  return uniqueItems;
}

/**
 * Execute full crawl and persist results
 */
export async function executeCrawl(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const items = extractQuizItemsFromDOM();

    if (items.length === 0) {
      return {
        success: false,
        count: 0,
        error: "Không tìm thấy câu hỏi nào. Hãy chắc chắn bạn đã vào cheatnetwork.eu/services/quizizz và trang đã hiển thị danh sách câu hỏi.",
      };
    }

    await saveQuizDatabase(items);
    await updateAppState({
      status: "Completed",
      totalQuestions: items.length,
      currentProgress: 0,
    });

    console.log(`[CheatNetwork Crawler] Successfully crawled ${items.length} questions into Local Database.`);
    return { success: true, count: items.length };
  } catch (err: any) {
    console.error("[CheatNetwork Crawler] Crawl error:", err);
    return {
      success: false,
      count: 0,
      error: err?.message || "Lỗi khi trích xuất dữ liệu từ CheatNetwork.",
    };
  }
}

// Listen for crawl request messages from popup
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "TRIGGER_CRAWL") {
      executeCrawl().then((result) => {
        sendResponse(result);
      });
      return true; // Keep message port open for async response
    }
  });
}
