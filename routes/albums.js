const express = require('express');
const router = express.Router();
const googlePhotosService = require('../services/googlePhotos');
const logger = require('../utils/logger');
const { APIError } = require('../utils/errorHandler');

/**
 * 取得相簿清單 (已棄用 - 改用解析網址)
 * 為了不讓前端舊程式碼報錯，我們保留這個路由但回傳空陣列或錯誤提示
 */
router.get('/', (req, res) => {
    res.status(400).json({
        error: 'Please use the Parse functionality with a shared link instead of listing albums.',
        deprecated: true
    });
});

/**
 * 解析公開相簿連結 (核心功能)
 * POST /api/albums/parse
 */
router.post('/parse', async (req, res, next) => {
    try {
        const { url } = req.body;

        if (!url) {
            throw new APIError('請提供 Google 相簿連結', 400);
        }

        logger.info(`收到解析請求: ${url}`);
        const photos = await googlePhotosService.parseSharedAlbum(url);

        res.json({
            success: true,
            count: photos.length,
            photos: photos // 回傳相片陣列
        });
    } catch (error) {
        next(error);
    }
});

/**
 * 取得相簿內容 (暫時保留路由結構)
 */
router.get('/:id/items', async (req, res, next) => {
    // 暫時保留，若未來有需要針對已解析的相簿做分頁讀取可再實作
    res.status(501).json({ message: 'Not implemented in scraping mode' });
});

module.exports = router;
