/**
 * 簡易日誌記錄工具
 */

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

/**
 * 格式化時間戳記
 */
const getTimestamp = () => {
    return new Date().toISOString();
};

/**
 * 記錄訊息
 */
const log = (level, message, data = null) => {
    const timestamp = getTimestamp();
    const logEntry = {
        timestamp,
        level,
        message
    };

    if (data) {
        logEntry.data = data;
    }

    // 根據等級使用不同的 console 方法
    switch (level) {
        case LOG_LEVELS.ERROR:
            console.error(`[${timestamp}] ❌ ${level}:`, message, data || '');
            break;
        case LOG_LEVELS.WARN:
            console.warn(`[${timestamp}] ⚠️  ${level}:`, message, data || '');
            break;
        case LOG_LEVELS.INFO:
            console.log(`[${timestamp}] ℹ️  ${level}:`, message, data || '');
            break;
        case LOG_LEVELS.DEBUG:
            if (process.env.NODE_ENV === 'development') {
                console.log(`[${timestamp}] 🐛 ${level}:`, message, data || '');
            }
            break;
        default:
            console.log(`[${timestamp}] ${level}:`, message, data || '');
    }
};

/**
 * 便捷方法
 */
const logger = {
    error: (message, data) => log(LOG_LEVELS.ERROR, message, data),
    warn: (message, data) => log(LOG_LEVELS.WARN, message, data),
    info: (message, data) => log(LOG_LEVELS.INFO, message, data),
    debug: (message, data) => log(LOG_LEVELS.DEBUG, message, data)
};

module.exports = logger;
