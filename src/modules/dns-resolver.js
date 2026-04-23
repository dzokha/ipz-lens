// src/modules/dns-resolver.js

/**
 * Phân giải tên miền thành địa chỉ IP thông qua Google DNS qua HTTPS (DoH)
 * @param {string} domain - Tên miền cần phân giải (VD: google.com)
 * @returns {Promise<string>} - Địa chỉ IP hoặc thông báo lỗi
 */
export async function resolveDNS(domain) {
    try {
        const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
        const data = await response.json();
        
        if (data.Answer && data.Answer.length > 0) {
            return data.Answer[0].data; // Trả về IP đầu tiên
        } else {
            return 'No Record';
        }
    } catch (error) {
        console.error("DNS Resolution Error:", error);
        return 'Error';
    }
}