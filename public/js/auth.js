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
    const isAuthenticated = await checkAuthStatus();

    // 如果在需要認證的頁面但未登入,重新導向至首頁
    const protectedPages = ['/dashboard.html', '/analysis.html', '/results.html'];
    const currentPage = window.location.pathname;

    if (protectedPages.includes(currentPage) && !isAuthenticated) {
        window.location.href = '/?error=auth_required';
    }
});
