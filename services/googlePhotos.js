const { google } = require('googleapis');
const axios = require('axios');
const { APIError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Google Photos API 服務
 */
class GooglePhotosService {
    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    /**
     * 產生 OAuth 授權 URL
     */
    getAuthUrl() {
        const scopes = [
            // ▼▼▼ 讀取權限 (讀取相簿清單必備) ▼▼▼
            'https://www.googleapis.com/auth/photoslibrary.readonly',

            // ▼▼▼ 寫入權限 (建立相簿、上傳照片必備 - 用來取代原本衝突的超級權限) ▼▼▼
            'https://www.googleapis.com/auth/photoslibrary.appendonly',

            // ▼▼▼ 分享權限 (如果需要分享功能) ▼▼▼
            'https://www.googleapis.com/auth/photoslibrary.sharing'

            // ❌ 已移除：'https://www.googleapis.com/auth/photoslibrary' 
            // 原因：混合使用這個「全開權限」與「唯讀權限」會導致 Google 安全機制鎖死 API。
        ];

        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent', // 強制顯示同意畫面，確保取得新權限
            include_granted_scopes: true
        });
    }

    /**
     * 交換授權碼取得 Token
     */
    async getTokenFromCode(code) {
        try {
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);
            logger.info('成功取得 Access Token');
            return tokens;
        } catch (error) {
            logger.error('取得 Token 失敗', error.message);
            throw new APIError('無法取得授權,請重新登入', 401);
        }
    }

    /**
     * 設定 Access Token
     */
    setAccessToken(accessToken) {
        this.oauth2Client.setCredentials({ access_token: accessToken });
    }

    /**
     * 取得使用者所有相簿
     */
    async listAlbums(accessToken) {
        try {
            // 使用 axios 直接呼叫 REST API 以確保最單純的讀取行為
            const response = await axios.get('https://photoslibrary.googleapis.com/v1/albums', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    pageSize: 50
                }
            });

            const albums = response.data.albums || [];
            logger.info(`成功取得 ${albums.length} 個相簿`);

            return albums;
        } catch (error) {
            // 詳細錯誤記錄
            const detailedErrorMessage = error.response?.data
                ? JSON.stringify(error.response.data)
                : error.message;

            logger.error('取得相簿清單失敗:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });

            throw new APIError(`無法取得相簿清單: ${detailedErrorMessage}`, error.response?.status || 500);
        }
    }

    /**
     * 取得相簿中的媒體項目 (支援分頁)
     */
    async getAlbumItems(albumId, accessToken) {
        try {
            this.setAccessToken(accessToken);

            const photosLibrary = google.photoslibrary({
                version: 'v1',
                auth: this.oauth2Client
            });

            let allItems = [];
            let pageToken = null;

            do {
                const response = await photosLibrary.mediaItems.search({
                    requestBody: {
                        albumId: albumId,
                        pageSize: 100,
                        pageToken: pageToken
                    }
                });

                if (response.data.mediaItems) {
                    allItems = allItems.concat(response.data.mediaItems);
                }

                pageToken = response.data.nextPageToken;
                // 減少 debug log 頻率，避免洗版
                if (allItems.length % 100 === 0) {
                    logger.debug(`已讀取 ${allItems.length} 個項目...`);
                }

            } while (pageToken);

            logger.info(`相簿 ${albumId} 讀取完成，共有 ${allItems.length} 個媒體項目`);

            // 分類照片與影片
            const photos = allItems.filter(item => item.mimeType?.startsWith('image/'));
            const videos = allItems.filter(item => item.mimeType?.startsWith('video/'));

            return {
                all: allItems,
                photos,
                videos,
                total: allItems.length,
                photoCount: photos.length,
                videoCount: videos.length
            };
        } catch (error) {
            logger.error('取得相簿內容失敗', error.message);
            throw new APIError('無法取得相簿內容', 500);
        }
    }

    /**
     * 建立新相簿
     */
    async createAlbum(title, accessToken) {
        try {
            this.setAccessToken(accessToken);

            const photosLibrary = google.photoslibrary({
                version: 'v1',
                auth: this.oauth2Client
            });

            const response = await photosLibrary.albums.create({
                requestBody: {
                    album: {
                        title: title
                    }
                }
            });

            logger.info(`成功建立相簿: ${title}`);
            return response.data;
        } catch (error) {
            logger.error('建立相簿失敗', error.message);
            throw new APIError('無法建立相簿', 500);
        }
    }

    /**
     * 批次新增媒體項目至相簿
     */
    async addItemsToAlbum(albumId, mediaItemIds, accessToken) {
        try {
            this.setAccessToken(accessToken);

            const photosLibrary = google.photoslibrary({
                version: 'v1',
                auth: this.oauth2Client
            });

            // Google Photos API 限制每次最多 50 個項目
            const BATCH_SIZE = 50;
            let addedCount = 0;

            for (let i = 0; i < mediaItemIds.length; i += BATCH_SIZE) {
                const batch = mediaItemIds.slice(i, i + BATCH_SIZE);

                await photosLibrary.albums.batchAddMediaItems({
                    albumId: albumId,
                    requestBody: {
                        mediaItemIds: batch
                    }
                });

                addedCount += batch.length;
                logger.debug(`已新增 ${addedCount}/${mediaItemIds.length} 個項目`);
            }

            logger.info(`成功新增 ${addedCount} 個項目至相簿`);
            return { addedCount };
        } catch (error) {
            logger.error('新增項目至相簿失敗', error.message);
            throw new APIError('無法新增項目至相簿', 500);
        }
    }

    /**
     * 取得相簿資訊
     */
    async getAlbum(albumId, accessToken) {
        try {
            this.setAccessToken(accessToken);

            const photosLibrary = google.photoslibrary({
                version: 'v1',
                auth: this.oauth2Client
            });

            const response = await photosLibrary.albums.get({
                albumId: albumId
            });

            return response.data;
        } catch (error) {
            logger.error('取得相簿資訊失敗', error.message);
            throw new APIError('無法取得相簿資訊', 500);
        }
    }
}

module.exports = new GooglePhotosService();