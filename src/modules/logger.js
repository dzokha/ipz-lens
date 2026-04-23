/**
 * SDN-FlexShield Logger Module
 * Hỗ trợ ghi log có cấu trúc và lưu trữ tạm thời cho mục đích giám sát.
 */

export const LOG_LEVELS = {
    INFO: "INFO",
    WARN: "WARNING",
    ERROR: "ERROR",
    SECURITY: "SECURITY_ALERT"
};

/**
 * Hàm logger chính
 * @param {string} message - Nội dung thông báo
 * @param {string} level - Mức độ log (mặc định là INFO)
 */
export const logger = (message, level = LOG_LEVELS.INFO) => {
    const timestamp = new Date().toLocaleString();
    const logEntry = {
        timestamp,
        level,
        message,
        source: "Sentinel-Core"
    };

    // 1. Hiển thị ra Console của Extension (để debug)
    const logString = `[${timestamp}] [${level}] IPZ LENS: ${message}`;
    
    switch (level) {
        case LOG_LEVELS.ERROR:
            console.error(logString);
            break;
        case LOG_LEVELS.WARN:
            console.warn(logString);
            break;
        default:
            console.log(logString);
    }

    // 2. Lưu vào chrome.storage (Tùy chọn) 
    // Giúp Popup có thể hiển thị lịch sử log nếu cần
    saveLogToStorage(logEntry);
};

/**
 * Lưu log vào bộ nhớ cục bộ (giới hạn 50 log gần nhất để tránh đầy bộ nhớ)
 */
function saveLogToStorage(logEntry) {
    if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.get({ logs: [] }, (result) => {
            let logs = result.logs;
            logs.push(logEntry);
            
            // Giữ lại tối đa 50 dòng log mới nhất
            if (logs.length > 50) {
                logs.shift();
            }
            
            chrome.storage.local.set({ logs });
        });
    }
}