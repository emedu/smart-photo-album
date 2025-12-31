const axios = require('axios');
const cheerio = require('cheerio');
const { APIError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Google Photos Scraping Service (Path B)
 * 用於解析公開的 Google 相簿連結，繞過官方 API 的限制
 */
class GooglePhotosService {
    constructor() {
        // 不需要初始化 OAuth Client
    }

    /**
     * 解析公開相簿連結
     * @param {string} url - Google Photos 分享連結 (e.g., https://photos.app.goo.gl/...)
     */
    async parseSharedAlbum(url) {
        try {
            logger.info(`開始解析相簿連結: ${url}`);

            // 1. 取得網頁內容 (會自動處理轉址)
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const html = response.data;
            const $ = cheerio.load(html);

            // 2. 尋找包含數據的 Script
            // Google Photos 的數據通常藏在一個 AF_initDataCallback 的函式呼叫中
            // 我們需要用 Regex 把它挖出來

            // 尋找包含 key: 'ds:0' 或類似結構的 script
            // 這是一種 heuristic (啟發式) 方法，Google 可能會改，但目前穩定
            const scriptContent = $('script').map((i, el) => $(el).html()).get().join(' ');

            // 嘗試匹配圖片 URL
            // Google 圖片 URL 通常以 https://lh3.googleusercontent.com/ 開頭
            // 且通常跟在一個數值寬高後面
            const regex = /"(https:\/\/lh3\.googleusercontent\.com\/[^"]+)",\s*(\d+),\s*(\d+)/g;

            const photos = [];
            let match;
            const uniqueUrls = new Set();

            while ((match = regex.exec(scriptContent)) !== null) {
                const imageUrl = match[1];
                const width = parseInt(match[2]);
                const height = parseInt(match[3]);

                // 過濾掉太小的圖片 (可能是大頭貼或圖示)
                if (width > 100 && height > 100) {
                    if (!uniqueUrls.has(imageUrl)) {
                        uniqueUrls.add(imageUrl);
                        photos.push({
                            id: `scraped_${photos.length + 1}`,
                            baseUrl: imageUrl, // Scraping 出來的 URL 本身就是可用於顯示的
                            mimeType: 'image/jpeg', // 假設
                            width,
                            height,
                            filename: `photo_${photos.length + 1}.jpg`
                        });
                    }
                }
            }

            if (photos.length === 0) {
                logger.warn('未能在頁面中找到圖片，可能是 Google 結構變更或連結無效');
            }

            logger.info(`解析完成，共找到 ${photos.length} 張圖片`);
            return photos;

        } catch (error) {
            logger.error('解析相簿失敗:', error.message);
            throw new APIError('無法解析相簿連結，請確認連結是否公開有效', 500);
        }
    }
}

module.exports = new GooglePhotosService();
