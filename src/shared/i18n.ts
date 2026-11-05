export type Language = "vi" | "en";

export interface I18nDictionary {
  // Popup Header & Controls
  title: string;
  closePopup: string;
  crawlBtn: string;
  crawlBtnTitle: string;
  resetBtn: string;
  resetBtnTitle: string;
  statusLabel: string;
  questionsLabel: string;
  controlsTitle: string;
  startBtn: string;
  stopBtn: string;
  progressLabel: string;

  // Status values
  statusReady: string;
  statusCrawling: string;
  statusCompleted: string;
  statusFailed: string;
  statusError: string;
  statusRunning: string;
  statusStopped: string;

  // Popup Alerts
  dbResetSuccess: string;
  openCheatNetworkFirst: string;
  cannotConnectCheatNetwork: string;
  refreshCheatNetwork: string;
  crawlSuccess: (count: number) => string;
  crawlFailed: string;
  crawlUnknownError: string;
  openQuizizzFirst: string;
  startSuccess: string;
  startError: string;
  stopSuccess: string;

  // In-Page HUD
  hudBadge: string;
  hudCloseTitle: string;
  hudRestoreTitle: string;
  hudRecognizedAnswer: string;
  hudNotFound: string;
  hudConfidence: string;
  hudStatus: string;
  hudManualClick: string;
  hudManualType: string;
  hudAutoFilled: string;
  hudNotMatched: string;
  hudFillIn: string;
  hudMatchedCount: (count: number) => string;
  hudOptionNum: (num: number) => string;
}

export const translations: Record<Language, I18nDictionary> = {
  vi: {
    title: "QUIZIZZ ASSISTANT",
    closePopup: "Đóng Popup",
    crawlBtn: "⚡ CRAWL",
    crawlBtnTitle: "Cào toàn bộ đáp án từ tab CheatNetwork hiện tại",
    resetBtn: "🗑 RESET",
    resetBtnTitle: "Xóa toàn bộ database câu hỏi",
    statusLabel: "Trạng thái:",
    questionsLabel: "Số câu hỏi:",
    controlsTitle: "ĐIỀU KHIỂN HIỂN THỊ ĐÁP ÁN",
    startBtn: "START",
    stopBtn: "STOP",
    progressLabel: "Tiến độ:",

    statusReady: "Sẵn sàng",
    statusCrawling: "Đang cào...",
    statusCompleted: "Hoàn tất",
    statusFailed: "Thất bại",
    statusError: "Lỗi",
    statusRunning: "Đang chạy",
    statusStopped: "Đã dừng",

    dbResetSuccess: "Đã xóa sạch toàn bộ Database câu hỏi!",
    openCheatNetworkFirst: "Vui lòng mở tab trang web cheatnetwork.eu/services/quizizz trước khi nhấn CRAWL.",
    cannotConnectCheatNetwork: "Không thể kết nối với tab CheatNetwork.",
    refreshCheatNetwork: "Không thể gửi yêu cầu đến CheatNetwork. Hãy F5 lại tab CheatNetwork.",
    crawlSuccess: (count: number) => `Đã trích xuất thành công ${count} câu hỏi vào Database!`,
    crawlFailed: "Không thể lấy đáp án từ trang CheatNetwork.",
    crawlUnknownError: "Lỗi không xác định khi crawl.",
    openQuizizzFirst: "Vui lòng mở một bài Quizizz trên trình duyệt trước khi Start.",
    startSuccess: "Đã khởi động chế độ SHOW ANSWER trên Quizizz!",
    startError: "Lỗi khi kích hoạt Quizizz.",
    stopSuccess: "Đã dừng tiến trình.",

    hudBadge: "SHOW ANSWER",
    hudCloseTitle: "Tắt / Ẩn HUD",
    hudRestoreTitle: "Mở lại bảng đáp án Quizizz Assistant",
    hudRecognizedAnswer: "Đáp án nhận diện:",
    hudNotFound: "(Không tìm thấy trong DB)",
    hudConfidence: "Độ tin cậy (Confidence)",
    hudStatus: "Trạng thái:",
    hudManualClick: "Người dùng tự click chọn",
    hudManualType: "Người dùng tự nhập đáp án",
    hudAutoFilled: "✓ Đã tự động điền vào ô",
    hudNotMatched: "Chưa khớp nút",
    hudFillIn: "Câu điền từ",
    hudMatchedCount: (count: number) => `Khớp ${count} đáp án đúng`,
    hudOptionNum: (num: number) => `Lựa chọn #${num}`,
  },
  en: {
    title: "QUIZIZZ ASSISTANT",
    closePopup: "Close Popup",
    crawlBtn: "⚡ CRAWL",
    crawlBtnTitle: "Extract all answers from current CheatNetwork tab",
    resetBtn: "🗑 RESET",
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
    crawlSuccess: (count: number) => `Successfully extracted ${count} questions into Database!`,
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
    hudAutoFilled: "✓ Auto-filled into input",
    hudNotMatched: "No button matched",
    hudFillIn: "Fill-in-the-blank",
    hudMatchedCount: (count: number) => `Matched ${count} correct answers`,
    hudOptionNum: (num: number) => `Option #${num}`,
  },
};

export function getI18n(lang?: Language): I18nDictionary {
  return lang === "en" ? translations.en : translations.vi;
}
