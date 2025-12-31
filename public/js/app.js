/**
 * 主應用邏輯 - API 呼叫
 */

const API_BASE = '';

/**
 * 取得相簿清單
 */
async function fetchAlbums() {
    try {
        const response = await fetch(`${API_BASE}/api/albums`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('無法取得相簿清單');
        }

        const data = await response.json();
        return data.data.albums;
    } catch (error) {
        console.error('取得相簿失敗:', error);
        throw error;
    }
}

/**
 * 開始分析
 */
async function startAnalysis(albumId, photoThreshold, videoThreshold) {
    try {
        const response = await fetch(`${API_BASE}/api/analysis/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                albumId,
                photoThreshold: parseInt(photoThreshold),
                videoThreshold: parseInt(videoThreshold)
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '啟動分析失敗');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('啟動分析失敗:', error);
        throw error;
    }
}

/**
 * 開始分析 (公開相簿模式)
 */
async function startScrapedAnalysis(photos, photoThreshold, videoThreshold) {
    try {
        const response = await fetch(`${API_BASE}/api/analysis/start-scraped`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // 不需要 credentials: 'include' 因為這個 endpoint 不驗證 session
            body: JSON.stringify({
                photos,
                photoThreshold: parseInt(photoThreshold),
                videoThreshold: parseInt(videoThreshold)
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '啟動分析失敗');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('啟動分析失敗:', error);
        throw error;
    }
}

/**
 * 取得分析結果
 */
async function getAnalysisResult(jobId) {
    try {
        const response = await fetch(`${API_BASE}/api/analysis/status/${jobId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('無法取得分析結果');
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('取得結果失敗:', error);
        throw error;
    }
}

/**
 * 格式化時間
 */
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds} 秒`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} 分 ${seconds % 60} 秒`;
}

/**
 * 格式化數字
 */
function formatNumber(num) {
    return num.toLocaleString('zh-TW');
}
