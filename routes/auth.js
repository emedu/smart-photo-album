const express = require('express');
const router = express.Router();
const googlePhotosService = require('../services/googlePhotos');
const { asyncHandler } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * GET /auth/login
 * 啟動 OAuth 認證流程
 */
router.get('/login', (req, res) => {
    try {
        const authUrl = googlePhotosService.getAuthUrl();
        logger.info('產生 OAuth 授權 URL');

        // --- 除錯：印出產生的 URL 以確認 scope 參數 ---
        console.log('\n[Auth] 正在重導向至 Google 登入...');
        console.log('[Auth] 若此處 URL 沒有包含 .readonly，請檢查 services/googlePhotos.js');
        // ------------------------------------------

        res.redirect(authUrl);
    } catch (error) {
        logger.error('產生授權 URL 失敗', error.message);
        res.status(500).send('授權失敗,請稍後再試');
    }
});

/**
 * GET /auth/callback
 * OAuth 回調處理
 */
router.get('/callback', asyncHandler(async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        logger.warn('使用者拒絕授權', error);
        return res.redirect('/?error=access_denied');
    }

    if (!code) {
        logger.warn('缺少授權碼');
        return res.redirect('/?error=missing_code');
    }

    try {
        // 1. 交換授權碼取得 Token
        const tokens = await googlePhotosService.getTokenFromCode(code);

        // =================================================================
        // ▼▼▼ 新增：權限範圍 (Scope) 真相檢查 ▼▼▼
        // 這段程式碼會檢查 Google 實際發給你的權限，而不是你以為你申請的權限
        try {
            const tokenInfo = await googlePhotosService.oauth2Client.getTokenInfo(tokens.access_token);
            const scopes = tokenInfo.scopes || [];

            console.log("\n================ [Google 權限檢查報告] ================");
            console.log("Token 有效性: ✅ 有效");
            console.log("實際擁有的權限 (Scopes):");
            scopes.forEach(s => console.log(` - ${s}`));
            console.log("-----------------------------------------------------");

            const hasReadonly = scopes.some(s => s.includes('photoslibrary.readonly') || s.includes('photoslibrary'));

            if (hasReadonly) {
                console.log("✅ 檢測結果: 成功！Token 包含讀取相簿權限。");
            } else {
                console.error("❌ 檢測結果: 失敗！Token 缺少讀取權限。");
                console.error("   原因可能是：");
                console.error("   1. 登入畫面的權限勾選框沒有打勾");
                console.error("   2. Google 帳號記住了舊的設定 (請至 Google 帳號設定移除應用程式存取權)");
            }
            console.log("=====================================================\n");
        } catch (debugError) {
            console.error("[Auth] 權限檢查發生錯誤 (不影響登入，但無法確認權限):", debugError.message);
        }
        // ▲▲▲ 檢查結束 ▲▲▲
        // =================================================================

        // 儲存 Token 到 Session
        req.session.accessToken = tokens.access_token;
        req.session.refreshToken = tokens.refresh_token;
        req.session.isAuthenticated = true;

        logger.info('使用者授權成功');

        // 重新導向至相簿選擇頁面
        res.redirect('/dashboard.html');
    } catch (error) {
        // --- 詳細錯誤報告 ---
        console.error("\n========== Google OAuth 錯誤詳細報告 ==========");
        if (error.response) {
            console.error("狀態碼 (Status):", error.response.status);
            console.error("錯誤詳細內容 (Data):", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("錯誤訊息 (Message):", error.message);
        }
        console.error("============================================\n");

        logger.error('處理 OAuth 回調失敗', error.message);
        res.redirect('/?error=auth_failed');
    }
}));

/**
 * POST /auth/logout
 * 登出
 */
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logger.error('登出失敗', err.message);
            return res.status(500).json({
                success: false,
                error: '登出失敗'
            });
        }

        logger.info('使用者登出');
        res.json({
            success: true,
            message: '已成功登出'
        });
    });
});

/**
 * GET /auth/status
 * 檢查認證狀態
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        isAuthenticated: !!req.session.isAuthenticated,
        hasAccessToken: !!req.session.accessToken
    });
});

module.exports = router;