/**
 * 分析進度監控
 */

/**
 * 使用 Server-Sent Events 監控進度
 */
function monitorProgress(jobId, onUpdate) {
    const eventSource = new EventSource(`/api/analysis/stream/${jobId}`);

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            if (data.error) {
                console.error('SSE 錯誤:', data.error);
                eventSource.close();
                return;
            }

            // 回調更新
            if (onUpdate) {
                onUpdate(data);
            }

            // 如果完成或失敗,關閉連線
            if (data.status === 'completed' || data.status === 'failed') {
                eventSource.close();
            }
        } catch (error) {
            console.error('解析 SSE 資料失敗:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE 連線錯誤:', error);
        eventSource.close();

        // 降級為輪詢
        console.log('切換至輪詢模式');
        pollProgress(jobId, onUpdate);
    };

    return eventSource;
}

/**
 * 輪詢方式監控進度 (SSE 失敗時的備用方案)
 */
async function pollProgress(jobId, onUpdate, interval = 2000) {
    const poll = async () => {
        try {
            const response = await fetch(`/api/analysis/status/${jobId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('無法取得進度');
            }

            const data = await response.json();
            const status = data.data;

            if (onUpdate) {
                onUpdate(status);
            }

            // 如果未完成,繼續輪詢
            if (status.status !== 'completed' && status.status !== 'failed') {
                setTimeout(poll, interval);
            }
        } catch (error) {
            console.error('輪詢失敗:', error);
            setTimeout(poll, interval * 2); // 延長間隔後重試
        }
    };

    poll();
}

/**
 * 計算預估剩餘時間
 */
function estimateRemainingTime(progress, elapsedTime) {
    if (progress === 0) return null;

    const totalEstimated = (elapsedTime / progress) * 100;
    const remaining = totalEstimated - elapsedTime;

    return Math.max(0, Math.round(remaining / 1000)); // 轉換為秒
}

/**
 * 格式化剩餘時間
 */
function formatRemainingTime(seconds) {
    if (seconds < 60) return `約 ${seconds} 秒`;
    const minutes = Math.floor(seconds / 60);
    return `約 ${minutes} 分鐘`;
}
