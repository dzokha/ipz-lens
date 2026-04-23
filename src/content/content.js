// // content.js - Phân tích dấu hiệu trên trang
// function scanPage() {
//   const signs = [];
  
//   // (4) Phân tích Form
//   const forms = document.querySelectorAll('form');
//   forms.forEach(f => {
//     const action = f.getAttribute('action');
//     if (window.location.protocol === 'http:') signs.push("Form trên giao thức không an toàn");
//     if (action && !action.includes(window.location.hostname)) signs.push("Dữ liệu gửi về domain lạ");
//   });

//   // (5) Phân tích Content (Hotlinking)
//   const images = document.querySelectorAll('img');
//   let externalResources = 0;
//   images.forEach(img => {
//     if (img.src && !img.src.includes(window.location.hostname)) externalResources++;
//   });
//   if (externalResources > 5) signs.push("Nhiều tài nguyên tải từ nguồn ngoài (Nghi vấn Hotlinking)");

//   // (7) Phân tích Ngôn ngữ
//   const sensitiveKeywords = ["đăng nhập", "mật khẩu", "xác thực", "khóa tài khoản", "khẩn cấp"];
//   const bodyText = document.body.innerText.toLowerCase();
//   const foundKeywords = sensitiveKeywords.filter(kw => bodyText.includes(kw));
//   if (foundKeywords.length > 2) signs.push(`Chứa từ khóa nhạy cảm: ${foundKeywords.join(", ")}`);

//   return signs;
// }

// // Gửi kết quả về cho Popup khi được yêu cầu
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "analyze_content") {
//     sendResponse({ results: scanPage() });
//   }
// });

// src/content/content.js

// Lắng nghe yêu cầu từ Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyze_content") {
        const analysisResults = performDOMAnalysis();
        sendResponse({ results: analysisResults });
    }
    return true; // Giữ kênh giao tiếp mở cho bất đồng bộ
});

function performDOMAnalysis() {
    let risks = [];

    // Mẫu 1: Phát hiện forms không có HTTPS nhưng đòi password
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs.length > 0 && window.location.protocol !== 'https:') {
        risks.push("Insecure Password Form");
    }

    // Mẫu 2: Phát hiện các script từ nguồn lạ (Heuristic cơ bản)
    const scripts = document.querySelectorAll('script[src]');
    let suspiciousScripts = 0;
    scripts.forEach(script => {
        if (script.src.includes('ngrok.io') || script.src.includes('bit.ly')) {
            suspiciousScripts++;
        }
    });
    
    if (suspiciousScripts > 0) {
        risks.push(`Found ${suspiciousScripts} suspicious external scripts`);
    }

    // Mẫu 3: Inline frames ẩn
    const hiddenIframes = document.querySelectorAll('iframe[width="0"][height="0"], iframe[style*="display: none"]');
    if (hiddenIframes.length > 0) {
         risks.push("Hidden Iframes Detected (Potential Clickjacking)");
    }

    if (risks.length === 0) {
        risks.push("No anomaly detected");
    }

    return risks;
}