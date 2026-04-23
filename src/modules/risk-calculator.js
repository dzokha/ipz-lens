// src/modules/risk-calculator.js

// export function calculateRiskScore(indicators) {
//     const baseScore = indicators.length * 15;
//     return Math.min(baseScore, 100);
// }

// export const RISK_LEVELS = {
//     LOW: "LOW RISK",
//     MEDIUM: "MEDIUM RISK",
//     HIGH: "HIGH RISK"
// };

// src/modules/risk-calculator.js

export function calculateRiskScore(indicators) {
    // Cộng tổng các thuộc tính 'weight' trong mảng indicators
    const totalScore = indicators.reduce((sum, item) => sum + item.weight, 0);
    // Đảm bảo điểm không vượt quá 100
    return Math.min(totalScore, 100);
}

export const RISK_LEVELS = {
    LOW: "LOW RISK",
    MEDIUM: "MEDIUM RISK",
    HIGH: "HIGH RISK"
};