const express = require('express');
const router = express.Router();
const albumProcessorService = require('../services/albumProcessor');
const { asyncHandler, APIError } = require('../utils/errorHandler');
const { isValidAlbumId, isValidThreshold } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * 認證中介軟體
 */
const requireAuth = (req, res, next) => {
    if (!req.session.isAuthenticated || !req.session.accessToken) {
        return res.status(401).json({
            success: false,
            error: '未授權,請先登入'
        });
    }
    next();
};

/**
 * POST /api/analysis/start
 * 開始分析相簿
 */
router.post('/start', requireAuth, asyncHandler(async (req, res) => {
    const { albumId, photoThreshold, videoThreshold } = req.body;
    const accessToken = req.session.accessToken;

    // 驗證輸入
    if (!isValidAlbumId(albumId)) {
        throw new APIError('無效的相簿 ID', 400);
    }

    const photoScore = photoThreshold || 85;
    const videoScore = videoThreshold || 80;

    if (!isValidThreshold(photoScore) || !isValidThreshold(videoScore)) {
        throw new APIError('評分門檻必須在 0-100 之間', 400);
    }

    logger.info(`開始分析相簿: ${albumId}, 照片門檻: ${photoScore}, 影片門檻: ${videoScore}`);

    // 啟動非同步處理
    albumProcessorService.processAlbum(albumId, accessToken, {
        photoThreshold: photoScore,
        videoThreshold: videoScore
    }).catch(error => {
        logger.error('相簿處理失敗', error.message);
    });

    // 立即回傳任務 ID
    // 實際處理會在背景執行
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
        success: true,
        data: {
            jobId,
            message: '分析任務已啟動',
            estimatedTime: '視相簿大小而定,請稍候'
        }
    });
}));

/**
 * POST /api/analysis/start-scraped
 * 開始分析已解析的公開相簿 (無須登入)
 */
router.post('/start-scraped', asyncHandler(async (req, res) => {
    const { photos, photoThreshold, videoThreshold } = req.body;

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
        throw new APIError('請提供有效的照片列表', 400);
    }

    const photoScore = photoThreshold || 85;
    const videoScore = videoThreshold || 80;

    logger.info(`開始分析公開相簿: ${photos.length} 張照片, 照片門檻: ${photoScore}, 影片門檻: ${videoScore}`);

    // 啟動非同步處理並取得 jobId
    const result = await albumProcessorService.processScrapedPhotos(photos, {
        photoThreshold: photoScore,
        videoThreshold: videoScore
    });

    res.json({
        success: true,
        data: {
            jobId: result.jobId,
            message: '公開相簿分析任務已啟動',
            estimatedTime: '視照片數量而定,請稍候'
        }
    });
}));

/**
 * GET /api/analysis/status/:jobId
 * 查詢分析進度
 */
router.get('/status/:jobId', (req, res) => {
    const { jobId } = req.params;

    const status = albumProcessorService.getJobStatus(jobId);

    if (!status) {
        return res.status(404).json({
            success: false,
            error: '找不到該任務'
        });
    }

    res.json({
        success: true,
        data: status
    });
});

/**
 * GET /api/analysis/stream/:jobId
 * Server-Sent Events 即時進度推送
 */
router.get('/stream/:jobId', (req, res) => {
    const { jobId } = req.params;

    // 設定 SSE 標頭
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    logger.info(`SSE 連線建立: ${jobId}`);

    // 定期推送進度
    const interval = setInterval(() => {
        const status = albumProcessorService.getJobStatus(jobId);

        if (!status) {
            res.write(`data: ${JSON.stringify({ error: '找不到任務' })}\n\n`);
            clearInterval(interval);
            res.end();
            return;
        }

        res.write(`data: ${JSON.stringify(status)}\n\n`);

        // 如果任務完成或失敗,關閉連線
        if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval);
            res.end();
        }
    }, 1000); // 每秒更新一次

    // 客戶端關閉連線時清理
    req.on('close', () => {
        clearInterval(interval);
        logger.info(`SSE 連線關閉: ${jobId}`);
    });
});

module.exports = router;
