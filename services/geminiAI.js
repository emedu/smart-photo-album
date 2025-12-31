const { GoogleGenerativeAI } = require('@google/generative-ai');
const { APIError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Gemini AI 服務
 */
class GeminiAIService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY 未設定');
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.flashModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.proModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    }

    /**
     * 分析照片美學品質
     * @param {Object} photo - 照片物件
     * @param {number} threshold - 評分門檻
     * @returns {Object} 分析結果
     */
    async analyzePhoto(photo, threshold = 85) {
        try {
            const prompt = `
請以「專業相簿管理員」的角度分析這張照片，目的是挑選出適合保留的回憶。

評分標準 (總分 100):
1. 構圖 (30%): 主體明確、畫面協調 (不要求完美的黃金比例，只要構圖舒適即可)
2. 曝光 (25%): 亮度正常、細節可見
3. 清晰度 (25%): 主體清晰 (些微背景模糊是可接受的)
4. 色彩 (20%): 色彩自然

評分指引:
- 優秀 (90-100): 構圖完美、光影絕佳的精選照片
- 良好 (80-89): 清晰、主體明確、適合保存的優質生活照
- 普通 (60-79): 稍微模糊或構圖普通，但仍具紀念價值
- 差 (0-59): 嚴重模糊、全黑/全白、無法辨識主體

請注意：對於清晰且主體明確的生活照，請給予 85 分以上的評價。不要使用過於嚴苛的專業攝影比賽標準。

請以 JSON 格式回傳:
{
  "score": 85,
  "composition": 28,
  "exposure": 22,
  "sharpness": 20,
  "color": 15,
  "recommendation": "keep",
  "reason": "簡短說明"
}

recommendation 只能是 "keep" 或 "discard"。
如果總分 >= ${threshold}, recommendation 應為 "keep", 否則為 "discard"。
`;

            const imagePart = {
                inlineData: {
                    data: await this.fetchImageAsBase64(photo.baseUrl),
                    mimeType: photo.mimeType
                }
            };

            const result = await this.flashModel.generateContent([prompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            // 解析 JSON 回應
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn('無法解析 Gemini 回應', text);
                return {
                    score: 50,
                    recommendation: 'discard',
                    reason: '分析失敗'
                };
            }

            const analysis = JSON.parse(jsonMatch[0]);

            logger.debug(`照片分析完成: ${photo.filename} - 評分 ${analysis.score}`);

            return {
                ...analysis,
                photoId: photo.id,
                filename: photo.filename
            };
        } catch (error) {
            logger.error('照片分析失敗', error.message);
            return {
                photoId: photo.id,
                filename: photo.filename,
                score: 0,
                recommendation: 'discard',
                reason: '分析錯誤'
            };
        }
    }

    /**
     * 批次分析照片
     */
    async analyzePhotos(photos, threshold = 85, onProgress = null) {
        const results = [];
        const total = photos.length;

        logger.info(`開始分析 ${total} 張照片`);

        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            const analysis = await this.analyzePhoto(photo, threshold);
            results.push(analysis);

            // 回報進度
            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total,
                    percentage: Math.round(((i + 1) / total) * 100)
                });
            }

            // 避免 Rate Limiting (每秒最多 15 次請求)
            if (i < photos.length - 1) {
                await this.sleep(100); // 等待 100ms
            }
        }

        const kept = results.filter(r => r.recommendation === 'keep');
        logger.info(`照片分析完成: ${kept.length}/${total} 張保留`);

        return results;
    }

    /**
     * 分析影片品質
     */
    async analyzeVideo(video, threshold = 80) {
        try {
            const prompt = `
請以「專業相簿管理員」的角度分析這段影片，目的是挑選出適合保留的回憶。

評分標準 (總分 100):
1. 動態品質 (40%): 畫面穩定度、動作流暢度 (生活隨拍的輕微晃動可接受)
2. 精彩程度 (35%): 是否包含有趣或重要的瞬間
3. 音訊品質 (25%): 語音清晰度、背景噪音

評分指引:
- 優秀 (90-100): 運鏡穩定、內容精彩的精選影片
- 良好 (80-89): 內容清晰、有紀念價值的優質生活影片
- 普通 (60-79): 稍微晃動或內容普通，但仍具紀念傳值
- 差 (0-59): 嚴重晃動、模糊、無意義內容

請注意：對於內容清晰且具紀念價值的影片，請給予 80 分以上的評價。

請以 JSON 格式回傳:
{
  "score": 85,
  "stability": 35,
  "excitement": 30,
  "audio": 20,
  "recommendation": "keep",
  "highlights": ["精彩片段描述"],
  "reason": "簡短說明"
}

recommendation 只能是 "keep" 或 "discard"。
如果總分 >= ${threshold}, recommendation 應為 "keep", 否則為 "discard"。
`;

            // 注意: Gemini API 對影片的支援可能有限制
            // 這裡使用縮圖作為替代方案
            const thumbnailPart = {
                inlineData: {
                    data: await this.fetchImageAsBase64(video.baseUrl + '=d'), // =d 取得縮圖
                    mimeType: 'image/jpeg'
                }
            };

            const result = await this.proModel.generateContent([prompt, thumbnailPart]);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return {
                    score: 50,
                    recommendation: 'discard',
                    reason: '分析失敗'
                };
            }

            const analysis = JSON.parse(jsonMatch[0]);

            return {
                ...analysis,
                videoId: video.id,
                filename: video.filename
            };
        } catch (error) {
            logger.error('影片分析失敗', error.message);
            return {
                videoId: video.id,
                filename: video.filename,
                score: 0,
                recommendation: 'discard',
                reason: '分析錯誤'
            };
        }
    }

    /**
     * 批次分析影片
     */
    async analyzeVideos(videos, threshold = 80, onProgress = null) {
        const results = [];
        const total = videos.length;

        logger.info(`開始分析 ${total} 個影片`);

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];
            const analysis = await this.analyzeVideo(video, threshold);
            results.push(analysis);

            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total,
                    percentage: Math.round(((i + 1) / total) * 100)
                });
            }

            // Pro 模型限制更嚴格 (每分鐘 2 次)
            if (i < videos.length - 1) {
                await this.sleep(30000); // 等待 30 秒
            }
        }

        const kept = results.filter(r => r.recommendation === 'keep');
        logger.info(`影片分析完成: ${kept.length}/${total} 個保留`);

        return results;
    }

    /**
     * 取得圖片的 Base64 編碼
     */
    async fetchImageAsBase64(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return buffer.toString('base64');
        } catch (error) {
            logger.error('取得圖片失敗', error.message);
            throw new APIError('無法取得圖片', 500);
        }
    }

    /**
     * 延遲函式
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new GeminiAIService();
