import { calculateRiskScore } from '../modules/risk-calculator.js';
import { resolveDNS } from '../modules/dns-resolver.js'; // Import module mới

document.addEventListener('DOMContentLoaded', () => {
  analyzeTab();

  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.addEventListener('click', () => {
    const icon = refreshBtn.querySelector('svg');
    icon.classList.add('spinning');

    document.getElementById('score-text').textContent = "0";
    document.getElementById('risk-label').textContent = "RE-SCANNING";
    document.getElementById('progress-circle').style.strokeDashoffset = 377;
    document.getElementById('risk-list').innerHTML = "";
    document.getElementById('ip').textContent = "Refreshing...";
    
    analyzeTab().then(() => {
        setTimeout(() => icon.classList.remove('spinning'), 800);
    });
  });
});

async function analyzeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.url.startsWith('http')) {
    updateUI([], 0, "SYSTEM PAGE");
    document.getElementById('domain').textContent = "System Page";
    return;
  }

  const url = new URL(tab.url);
  const domain = url.hostname;
  document.getElementById('domain').textContent = domain.length > 22 ? domain.substring(0, 20) + '...' : domain;

  let triggeredIndicators = [];

  // --- 1. PHÂN TÍCH NHANH ---
  const statusBadge = document.getElementById('status-badge');
  if (url.protocol !== 'https:') {
    triggeredIndicators.push({ message: "Unencrypted HTTP protocol", weight: 40 });
    statusBadge.className = "status-badge bg-danger";
    statusBadge.innerHTML = `<span class="main-text">⚠ INSECURE</span><span class="sub-text">(Kết nối không mã hóa)</span>`;
  } else {
    statusBadge.className = "status-badge bg-safe";
    statusBadge.innerHTML = `<span class="main-text">✓ SECURE</span><span class="sub-text">(Kết nối an toàn)</span>`;
  }

  if (domain.match(/\d+\.\d+\.\d+\.\d+/)) {
    triggeredIndicators.push({ message: "Direct IP Access", weight: 30 });
  }
  if (url.href.includes("@")) {
    triggeredIndicators.push({ message: "URL Obfuscation (@)", weight: 20 });
  }

  // --- 2. PHÂN TÍCH BẤT ĐỒNG BỘ (CHẠY SONG SONG) ---
  
  // Sử dụng module dns-resolver thay vì viết fetch trực tiếp ở đây
  const fetchDNS = resolveDNS(domain); 

  const fetchContentAnalysis = new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, { action: "analyze_content" }, (response) => {
      if (!chrome.runtime.lastError && response?.results) {
        resolve(response.results);
      } else {
        resolve([]);
      }
    });
  });

  const [ipResult, contentResults] = await Promise.all([fetchDNS, fetchContentAnalysis]);

  document.getElementById('ip').textContent = ipResult;

  contentResults.forEach(res => {
    if (res !== "No anomaly detected") {
      triggeredIndicators.push({ message: res, weight: 15 });
    }
  });

  // --- 3. CẬP NHẬT GIAO DIỆN ---
  const score = calculateRiskScore(triggeredIndicators);
  const messagesOnly = triggeredIndicators.map(item => item.message);
  
  updateUI(messagesOnly, score);
}

function updateUI(indicators, score, statusOverride = null) {
  // ... (Phần logic render UI giữ nguyên không thay đổi) ...
  const scoreText = document.getElementById('score-text');
  const riskLabel = document.getElementById('risk-label');
  const circle = document.getElementById('progress-circle');
  const list = document.getElementById('risk-list');
  const countDisplay = document.getElementById('indicator-count');

  let colorVar = '#10b981';
  let label = "SAFE";
  
  if (score >= 60) { colorVar = '#ef4444'; label = "HIGH RISK"; }
  else if (score >= 30) { colorVar = '#f59e0b'; label = "MEDIUM RISK"; }

  if (statusOverride) label = statusOverride;

  const circumference = 377; 
  const offset = circumference - ((score / 100) * circumference);
  circle.style.stroke = colorVar;
  circle.style.strokeDashoffset = offset;
  
  scoreText.textContent = score;
  scoreText.style.color = colorVar;
  riskLabel.textContent = label;
  riskLabel.style.color = colorVar;

  list.innerHTML = "";
  if (indicators.length === 0) {
    list.innerHTML = `<div class="clean-env"><div style="font-weight:700">✓ SYSTEM CLEAN</div></div>`;
  } else {
    indicators.forEach(text => {
      const item = document.createElement('div');
      item.className = 'risk-item';
      item.innerHTML = `• ${text}`;
      list.appendChild(item);
    });
  }
  countDisplay.textContent = `${indicators.length}/7`;
}