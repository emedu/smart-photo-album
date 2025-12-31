/**
 * 認證相關功能
 */

// 檢查認證狀態
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/status');
        const data = await response.json();
        return data.isAuthenticated;
    } catch (error) {
        console.error('檢查認證狀態失敗:', error);
        return false;
    }
}

// 登出
async function logout() {
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST'
        });

        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('登出失敗:', error);
        alert('登出失敗,請重試');
    }
}

// 頁面載入時檢查認證
window.addEventListener('DOMContentLoaded', async () => {
    // 檢查是否為 Scraped Mode (路徑 B) - 如果是，則不需要後端驗證
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'scraped') {
        return; // 直接略過驗證
    }

    const isAuthenticated = await checkAuthStatus();

    // 如果在需要認證的頁面但未登入,重新導向至首頁
    const protectedPages = ['/dashboard.html', '/analysis.html', '/results.html'];
    const currentPage = window.location.pathname;

    if (protectedPages.includes(currentPage) && !isAuthenticated) {
        window.location.href = '/?error=auth_required';
    }
});
