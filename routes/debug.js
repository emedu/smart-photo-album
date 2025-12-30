const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const logger = require('../utils/logger');

/**
 * GET /debug/token-info
 * 診斷端點 - 檢查 access token 的範圍
 */
router.get('/token-info', async (req, res) => {
    try {
        const accessToken = req.session.accessToken;

        if (!accessToken) {
            return res.json({
                error: '沒有 access token',
                isAuthenticated: req.session.isAuthenticated,
                hasToken: false
            });
        }

        // 使用 Google OAuth2 API 檢查 token 資訊
        const oauth2 = google.oauth2('v2');
        const tokenInfo = await oauth2.tokeninfo({ access_token: accessToken });

        res.json({
            success: true,
            tokenInfo: tokenInfo.data,
            sessionInfo: {
                isAuthenticated: req.session.isAuthenticated,
                hasAccessToken: !!req.session.accessToken,
                hasRefreshToken: !!req.session.refreshToken
            }
        });
    } catch (error) {
        logger.error('檢查 token 失敗', error.message);
        res.json({
            error: error.message,
            details: error.response?.data
        });
    }
});

/**
 * GET /debug/test-api
 * 測試 Photos Library API 呼叫
 */
router.get('/test-api', async (req, res) => {
    try {
        const accessToken = req.session.accessToken;

        if (!accessToken) {
            return res.json({ error: '沒有 access token' });
        }

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const photosLibrary = google.photoslibrary({
            version: 'v1',
            auth: oauth2Client
        });

        const response = await photosLibrary.albums.list({
            pageSize: 10
        });

        res.json({
            success: true,
            albumCount: response.data.albums?.length || 0,
            albums: response.data.albums
        });
    } catch (error) {
        logger.error('測試 API 失敗', error.message);
        res.json({
            error: error.message,
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
    }
});

module.exports = router;
