const express = require('express');
const router = express.Router();
const googlePhotosService = require('../services/googlePhotos');
const { asyncHandler, APIError } = require('../utils/errorHandler');
const { isValidAlbumId } = require('../utils/validators');
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
 * GET /api/albums
 * 取得使用者所有相簿
 */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
    const accessToken = req.session.accessToken;

    logger.info('取得相簿清單');
    const albums = await googlePhotosService.listAlbums(accessToken);

    res.json({
        success: true,
        data: {
            albums: albums.map(album => ({
                id: album.id,
                title: album.title,
                productUrl: album.productUrl,
                mediaItemsCount: album.mediaItemsCount,
                coverPhotoBaseUrl: album.coverPhotoBaseUrl
            })),
            count: albums.length
        }
    });
}));

/**
 * GET /api/albums/:id
 * 取得特定相簿資訊
 */
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const accessToken = req.session.accessToken;

    if (!isValidAlbumId(id)) {
        throw new APIError('無效的相簿 ID', 400);
    }

    logger.info(`取得相簿資訊: ${id}`);
    const album = await googlePhotosService.getAlbum(id, accessToken);

    res.json({
        success: true,
        data: album
    });
}));

/**
 * GET /api/albums/:id/items
 * 取得相簿中的媒體項目
 */
router.get('/:id/items', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const accessToken = req.session.accessToken;

    if (!isValidAlbumId(id)) {
        throw new APIError('無效的相簿 ID', 400);
    }

    logger.info(`取得相簿內容: ${id}`);
    const items = await googlePhotosService.getAlbumItems(id, accessToken);

    res.json({
        success: true,
        data: items
    });
}));

/**
 * POST /api/albums/create
 * 建立新相簿
 */
router.post('/create', requireAuth, asyncHandler(async (req, res) => {
    const { title } = req.body;
    const accessToken = req.session.accessToken;

    if (!title || title.trim().length === 0) {
        throw new APIError('相簿名稱不能為空', 400);
    }

    logger.info(`建立新相簿: ${title}`);
    const album = await googlePhotosService.createAlbum(title, accessToken);

    res.json({
        success: true,
        data: album
    });
}));

module.exports = router;
