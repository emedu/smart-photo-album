const googlePhotosService = require('./googlePhotos');
const geminiAIService = require('./geminiAI');
const logger = require('../utils/logger');
const { APIError } = require('../utils/errorHandler');

/**
 * 相簿處理服務
 * 協調 Google Photos 與 Gemini AI 服務
 */
class AlbumProcessorService {
    constructor() {
        this.jobs = new Map(); // 儲存處理任務狀態
    }

    /**
     * 開始處理相簿
     */
    async processAlbum(albumId, accessToken, options = {}) {
        const {
            photoThreshold = 85,
            videoThreshold = 80,
            onProgress = null
        } = options;

        const jobId = this.generateJobId();

        // 初始化任務狀態
        this.jobs.set(jobId, {
            status: 'processing',
            progress: 0,
            stage: 'fetching',
            startTime: Date.now()
        });

        try {
            // 1. 取得相簿資訊
            logger.info(`[${jobId}] 開始處理相簿: ${albumId}`);
            const album = await googlePhotosService.getAlbum(albumId, accessToken);
            const albumName = album.title || 'My_Album';

            this.updateJobStatus(jobId, {
                stage: 'fetching',
                progress: 10,
                albumName
            });

            // 2. 取得相簿內容
            const mediaItems = await googlePhotosService.getAlbumItems(albumId, accessToken);

            logger.info(`[${jobId}] 相簿包含 ${mediaItems.photoCount} 張照片, ${mediaItems.videoCount} 個影片`);

            this.updateJobStatus(jobId, {
                stage: 'analyzing',
                progress: 20,
                totalPhotos: mediaItems.photoCount,
                totalVideos: mediaItems.videoCount
            });

            // 3. 分析照片
            let photoResults = [];
            if (mediaItems.photos.length > 0) {
                photoResults = await geminiAIService.analyzePhotos(
                    mediaItems.photos,
                    photoThreshold,
                    (progress) => {
                        this.updateJobStatus(jobId, {
                            stage: 'analyzing_photos',
                            progress: 20 + (progress.percentage * 0.4), // 20-60%
                            currentPhoto: progress.current,
                            totalPhotos: progress.total
                        });

                        if (onProgress) onProgress(this.jobs.get(jobId));
                    }
                );
            }

            // 4. 分析影片
            let videoResults = [];
            if (mediaItems.videos.length > 0) {
                videoResults = await geminiAIService.analyzeVideos(
                    mediaItems.videos,
                    videoThreshold,
                    (progress) => {
                        this.updateJobStatus(jobId, {
                            stage: 'analyzing_videos',
                            progress: 60 + (progress.percentage * 0.2), // 60-80%
                            currentVideo: progress.current,
                            totalVideos: progress.total
                        });

                        if (onProgress) onProgress(this.jobs.get(jobId));
                    }
                );
            }

            // 5. 篩選保留的項目
            const selectedPhotos = photoResults.filter(r => r.recommendation === 'keep');
            const selectedVideos = videoResults.filter(r => r.recommendation === 'keep');

            logger.info(`[${jobId}] 篩選結果: ${selectedPhotos.length}/${mediaItems.photoCount} 張照片, ${selectedVideos.length}/${mediaItems.videoCount} 個影片`);

            this.updateJobStatus(jobId, {
                stage: 'creating_albums',
                progress: 85
            });

            // 6. 建立新相簿並儲存
            const newAlbums = [];

            if (selectedPhotos.length > 0) {
                const photoAlbumName = `Selected_Photos_from_${albumName}`;
                const photoAlbum = await googlePhotosService.createAlbum(photoAlbumName, accessToken);

                const photoIds = selectedPhotos.map(p => p.photoId);
                await googlePhotosService.addItemsToAlbum(photoAlbum.id, photoIds, accessToken);

                newAlbums.push({
                    type: 'photos',
                    name: photoAlbumName,
                    id: photoAlbum.id,
                    productUrl: photoAlbum.productUrl,
                    itemCount: selectedPhotos.length
                });
            }

            if (selectedVideos.length > 0) {
                const videoAlbumName = `Selected_Videos_from_${albumName}`;
                const videoAlbum = await googlePhotosService.createAlbum(videoAlbumName, accessToken);

                const videoIds = selectedVideos.map(v => v.videoId);
                await googlePhotosService.addItemsToAlbum(videoAlbum.id, videoIds, accessToken);

                newAlbums.push({
                    type: 'videos',
                    name: videoAlbumName,
                    id: videoAlbum.id,
                    productUrl: videoAlbum.productUrl,
                    itemCount: selectedVideos.length
                });
            }

            // 7. 完成
            const result = {
                jobId,
                status: 'completed',
                progress: 100,
                originalAlbum: {
                    id: albumId,
                    name: albumName,
                    photoCount: mediaItems.photoCount,
                    videoCount: mediaItems.videoCount
                },
                analysis: {
                    photos: {
                        total: mediaItems.photoCount,
                        analyzed: photoResults.length,
                        selected: selectedPhotos.length,
                        averageScore: this.calculateAverageScore(photoResults)
                    },
                    videos: {
                        total: mediaItems.videoCount,
                        analyzed: videoResults.length,
                        selected: selectedVideos.length,
                        averageScore: this.calculateAverageScore(videoResults)
                    }
                },
                newAlbums,
                processingTime: Date.now() - this.jobs.get(jobId).startTime
            };

            this.jobs.set(jobId, result);
            logger.info(`[${jobId}] 處理完成`);

            return result;

        } catch (error) {
            logger.error(`[${jobId}] 處理失敗`, error.message);

            this.jobs.set(jobId, {
                jobId,
                status: 'failed',
                error: error.message,
                progress: 0
            });

            throw error;
        }
    }

    /**
     * 取得任務狀態
     */
    getJobStatus(jobId) {
        return this.jobs.get(jobId) || null;
    }

    /**
     * 更新任務狀態
     */
    updateJobStatus(jobId, updates) {
        const current = this.jobs.get(jobId) || {};
        this.jobs.set(jobId, { ...current, ...updates });
    }

    /**
     * 產生任務 ID
     */
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 計算平均分數
     */
    calculateAverageScore(results) {
        if (results.length === 0) return 0;
        const sum = results.reduce((acc, r) => acc + (r.score || 0), 0);
        return Math.round(sum / results.length);
    }

    /**
     * 處理已解析的公開相簿照片 (Path B)
     */
    async processScrapedPhotos(photos, options = {}) {
        const {
            photoThreshold = 85,
            videoThreshold = 80,
            onProgress = null
        } = options;

        const jobId = this.generateJobId();

        // 初始化任務狀態
        this.jobs.set(jobId, {
            status: 'processing',
            progress: 0,
            stage: 'analyzing', // 直接進入分析階段
            startTime: Date.now()
        });

        try {
            logger.info(`[${jobId}] 開始處理公開相簿照片，共 ${photos.length} 張`);

            // 立即返回 jobId，讓調用者可以追蹤進度
            // 使用 setImmediate 讓處理在背景執行
            setImmediate(async () => {
                try {
                    await this._processScrapedPhotosInternal(jobId, photos, photoThreshold, videoThreshold, onProgress);
                } catch (error) {
                    logger.error(`[${jobId}] 背景處理失敗`, error.message);
                    this.jobs.set(jobId, {
                        jobId,
                        status: 'failed',
                        error: error.message,
                        progress: 0
                    });
                }
            });

            return { jobId }; // 立即返回，不等待處理完成

        } catch (error) {
            logger.error(`[${jobId}] 初始化失敗`, error.message);
            this.jobs.set(jobId, {
                jobId,
                status: 'failed',
                error: error.message,
                progress: 0
            });
            throw error;
        }
    }

    /**
     * 內部方法：實際執行 scraped photos 的處理邏輯
     */
    async _processScrapedPhotosInternal(jobId, photos, photoThreshold, videoThreshold, onProgress) {
        try {

            this.updateJobStatus(jobId, {
                stage: 'analyzing',
                progress: 10,
                totalPhotos: photos.length,
                totalVideos: 0,
                albumName: '已匯入的相簿'
            });

            // 3. 分析照片 (僅支援照片，因為 scraping 很難拿到影片串流)
            let photoResults = [];
            if (photos.length > 0) {
                // 轉換格式以符合 Gemini 服務預期 (如果有需要)
                const photoItems = photos.map(p => ({
                    id: p.id,
                    baseUrl: p.baseUrl,
                    mimeType: 'image/jpeg'
                }));

                photoResults = await geminiAIService.analyzePhotos(
                    photoItems,
                    photoThreshold,
                    (progress) => {
                        this.updateJobStatus(jobId, {
                            stage: 'analyzing_photos',
                            progress: 10 + (progress.percentage * 0.8), // 10-90%
                            currentPhoto: progress.current,
                            totalPhotos: progress.total
                        });

                        if (onProgress) onProgress(this.jobs.get(jobId));
                    }
                );
            }

            // 5. 篩選保留的項目
            const selectedPhotos = photoResults.filter(r => r.recommendation === 'keep');

            logger.info(`[${jobId}] 篩選結果: ${selectedPhotos.length}/${photos.length} 張照片`);

            this.updateJobStatus(jobId, {
                stage: 'completed',
                progress: 100
            });

            // 7. 完成 (不建立相簿，直接回傳結果)
            const result = {
                jobId,
                status: 'completed',
                progress: 100,
                originalAlbum: {
                    id: 'scraped_album',
                    name: '匯入的分享相簿',
                    photoCount: photos.length,
                    videoCount: 0
                },
                analysis: {
                    photos: {
                        total: photos.length,
                        analyzed: photoResults.length,
                        selected: selectedPhotos.length,
                        averageScore: this.calculateAverageScore(photoResults)
                    },
                    videos: {
                        total: 0,
                        analyzed: 0,
                        selected: 0,
                        averageScore: 0
                    }
                },
                newAlbums: [], // Scraping 模式不自動建立相簿
                processingTime: Date.now() - this.jobs.get(jobId).startTime,
                // 額外欄位：將結果詳細資料回傳給前端展示
                details: {
                    photos: photoResults
                }
            };

            this.jobs.set(jobId, result);
            logger.info(`[${jobId}] 處理完成`);

            return result;

        } catch (error) {
            logger.error(`[${jobId}] 處理失敗`, error.message);

            this.jobs.set(jobId, {
                jobId,
                status: 'failed',
                error: error.message,
                progress: 0
            });

            throw error;
        }
    }

    /**
     * 清理舊任務 (超過 1 小時)
     */
    cleanupOldJobs() {
        const ONE_HOUR = 60 * 60 * 1000;
        const now = Date.now();

        for (const [jobId, job] of this.jobs.entries()) {
            if (job.startTime && (now - job.startTime > ONE_HOUR)) {
                this.jobs.delete(jobId);
                logger.debug(`清理舊任務: ${jobId}`);
            }
        }
    }
}

module.exports = new AlbumProcessorService();

// 每小時清理一次舊任務
setInterval(() => {
    module.exports.cleanupOldJobs();
}, 60 * 60 * 1000);
