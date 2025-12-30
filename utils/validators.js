/**
 * 驗證 Google Photos 分享連結格式
 */
const isValidGooglePhotosUrl = (url) => {
    if (!url || typeof url !== 'string') return false;

    // Google Photos 分享連結格式
    const pattern = /^https:\/\/photos\.app\.goo\.gl\/[a-zA-Z0-9]+$/;
    return pattern.test(url);
};

/**
 * 驗證相簿 ID 格式
 */
const isValidAlbumId = (albumId) => {
    if (!albumId || typeof albumId !== 'string') return false;

    // 基本格式檢查
    return albumId.length > 0 && albumId.length < 200;
};

/**
 * 驗證評分門檻
 */
const isValidThreshold = (threshold) => {
    const num = Number(threshold);
    return !isNaN(num) && num >= 0 && num <= 100;
};

/**
 * 清理使用者輸入
 */
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    // 移除潛在的 XSS 攻擊字元
    return input
        .trim()
        .replace(/[<>]/g, '')
        .substring(0, 1000); // 限制長度
};

/**
 * 驗證 Email 格式
 */
const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;

    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
};

module.exports = {
    isValidGooglePhotosUrl,
    isValidAlbumId,
    isValidThreshold,
    sanitizeInput,
    isValidEmail
};
