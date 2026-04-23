
/**
 * SDN-FlexShield: Sentinel - Background Service Worker
 * Chịu trách nhiệm điều phối phân tích nguy cơ và ghi nhận sự kiện hệ thống.
 */

import { calculateRiskScore, RISK_LEVELS } from '../modules/risk-calculator.js';
import { logger } from '../modules/logger.js';

// 1. Lắng nghe sự kiện cài đặt/cập nhật extension
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        logger("IPZ LENS đã được cài đặt lần đầu.", "INFO");
    } else if (details.reason === "update") {
        logger("IPZ LENS đã được cập nhật lên phiên bản mới.", "INFO");
    }
    
    // Khởi tạo giá trị mặc định trong storage nếu cần
    chrome.storage.local.set({ last_scan: new Date().toISOString() });
});

// 2. Xử lý logic chính khi nhận tin nhắn từ Content Script hoặc Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    if (message.action === "get_score") {
        try {
            // Kiểm tra dữ liệu đầu vào để tránh lỗi crash
            const indicators = message.data?.indicators || [];
            const score = calculateRiskScore(indicators);
            
            // Phân loại mức độ rủi ro
            let level = RISK_LEVELS.LOW;
            let logType = "INFO";

            if (score >= 70) {
                level = RISK_LEVELS.HIGH;
                logType = "SECURITY_ALERT"; // Loại log đặc biệt cho nguy cơ cao
            } else if (score >= 40) {
                level = RISK_LEVELS.MEDIUM;
                logType = "WARNING";
            }

            // Ghi log sự kiện phân tích
            logger(`Phân tích hoàn tất: Score ${score} (${level}) cho URL: ${sender.tab?.url || 'Popup'}`, logType);

            // Phản hồi kết quả về nơi gửi
            sendResponse({ 
                success: true,
                score: score, 
                level: level,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            logger(`Lỗi trong quá trình tính toán điểm rủi ro: ${error.message}`, "ERROR");
            sendResponse({ success: false, error: error.message });
        }
    }

    // Trả về true để giữ kênh kết nối mở cho phản hồi bất đồng bộ (Asynchronous)
    return true; 
});

// 3. (Tùy chọn) Lắng nghe sự kiện thay đổi tab để chủ động giám sát
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Bạn có thể thêm logic quét tự động khi người dùng chuyển tab tại đây
    // logger(`Đang giám sát Tab ID: ${activeInfo.tabId}`);
});

