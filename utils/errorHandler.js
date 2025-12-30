/**
 * 自訂錯誤類別
 */
class APIError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * 錯誤處理中介軟體
 */
const errorHandler = (err, req, res, next) => {
    // 記錄錯誤
    console.error('❌ 錯誤發生:', {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // 處理 APIError
    if (err instanceof APIError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
            timestamp: err.timestamp
        });
    }

    // 處理 Google API 錯誤
    if (err.code && err.errors) {
        return res.status(err.code).json({
            success: false,
            error: 'Google API 錯誤',
            details: err.message,
            timestamp: new Date().toISOString()
        });
    }

    // 處理 JSON 解析錯誤
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: '無效的 JSON 格式',
            timestamp: new Date().toISOString()
        });
    }

    // 預設錯誤處理
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? '伺服器發生錯誤,請稍後再試'
        : err.message;

    res.status(statusCode).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    });
};

/**
 * 非同步路由處理包裝器
 * 自動捕捉 async/await 錯誤
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    APIError,
    errorHandler,
    asyncHandler
};
