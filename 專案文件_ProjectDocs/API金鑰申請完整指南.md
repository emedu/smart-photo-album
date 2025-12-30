# Google Photos API 與 Gemini API 申請完整指南

**建立日期**: 2025-12-29  
**預計完成時間**: 30-40 分鐘  
**難度**: ⭐⭐☆☆☆ (中等)

---

## 📋 前置準備

在開始之前,請確認您已準備:

- ✅ Google 帳號 (Gmail)
- ✅ 信用卡 (用於驗證身份,不會收費)
- ✅ 穩定的網路連線
- ✅ 瀏覽器 (建議使用 Chrome)

---

## 第一部分: Google Photos API 設定

### 步驟 1: 前往 Google Cloud Console

1. 開啟瀏覽器,前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 使用您的 Google 帳號登入

### 步驟 2: 建立新專案

1. 點擊頂部導覽列的 **「選擇專案」** 下拉選單
2. 點擊 **「新增專案」** (NEW PROJECT)
3. 填寫專案資訊:
   - **專案名稱**: `Smart Photo Album` (或您喜歡的名稱)
   - **組織**: 保持預設 (No organization)
4. 點擊 **「建立」** (CREATE)
5. 等待 10-30 秒,專案建立完成

### 步驟 3: 啟用 Google Photos Library API

1. 在左側選單中,點擊 **「API 和服務」** → **「程式庫」** (Library)
2. 在搜尋框中輸入: `Photos Library API`
3. 點擊 **「Photos Library API」**
4. 點擊 **「啟用」** (ENABLE)
5. 等待啟用完成 (約 5-10 秒)

### 步驟 4: 設定 OAuth 同意畫面

> [!IMPORTANT]
> 這個步驟很重要,如果跳過會導致後續無法建立憑證!

1. 在左側選單中,點擊 **「OAuth 同意畫面」** (OAuth consent screen)
2. 選擇 **「外部」** (External) 使用者類型
3. 點擊 **「建立」** (CREATE)

#### 填寫應用程式資訊:

**第 1 頁: OAuth 同意畫面**
- **應用程式名稱**: `Smart Photo Album`
- **使用者支援電子郵件**: 選擇您的 Gmail
- **應用程式標誌**: (可選,跳過)
- **應用程式首頁**: `http://localhost:3001` (開發階段)
- **授權網域**: (暫時跳過)
- **開發人員聯絡資訊**: 填入您的 Gmail

點擊 **「儲存並繼續」**

**第 2 頁: 範圍 (Scopes)**
1. 點擊 **「新增或移除範圍」**
2. 在篩選框中搜尋: `photoslibrary`
3. 勾選以下範圍:
   - ✅ `https://www.googleapis.com/auth/photoslibrary.readonly` (讀取照片)
   - ✅ `https://www.googleapis.com/auth/photoslibrary.appendonly` (新增照片)
4. 點擊 **「更新」**
5. 點擊 **「儲存並繼續」**

**第 3 頁: 測試使用者**
1. 點擊 **「+ ADD USERS」**
2. 輸入您的 Gmail 地址
3. 點擊 **「新增」**
4. 點擊 **「儲存並繼續」**

**第 4 頁: 摘要**
- 檢查資訊無誤後,點擊 **「返回資訊主頁」**

### 步驟 5: 建立 OAuth 2.0 憑證

1. 在左側選單中,點擊 **「憑證」** (Credentials)
2. 點擊頂部的 **「+ 建立憑證」** → **「OAuth 用戶端 ID」**
3. 選擇應用程式類型: **「網頁應用程式」** (Web application)
4. 填寫資訊:
   - **名稱**: `Smart Photo Album Web Client`
   - **已授權的 JavaScript 來源**: 
     - 點擊 **「+ 新增 URI」**
     - 輸入: `http://localhost:3001`
   - **已授權的重新導向 URI**:
     - 點擊 **「+ 新增 URI」**
     - 輸入: `http://localhost:3001/auth/callback`
5. 點擊 **「建立」**

### 步驟 6: 下載憑證

1. 建立完成後,會彈出視窗顯示:
   - **您的用戶端 ID** (Client ID)
   - **您的用戶端密碼** (Client Secret)
2. **重要**: 複製這兩個值並儲存到安全的地方!

**範例格式**:
```
Client ID: 123456789-abcdefghijklmnop.apps.googleusercontent.com
Client Secret: GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

> [!CAUTION]
> **絕對不要**將這些金鑰上傳到 GitHub 或公開分享!

---

## 第二部分: Gemini API 設定

### 步驟 1: 前往 Google AI Studio

1. 開啟瀏覽器,前往 [Google AI Studio](https://aistudio.google.com/)
2. 使用您的 Google 帳號登入
3. 如果是第一次使用,需要同意服務條款

### 步驟 2: 建立 API 金鑰

1. 點擊左側選單的 **「Get API key」** 或 **「取得 API 金鑰」**
2. 點擊 **「Create API key」** (建立 API 金鑰)
3. 選擇專案:
   - 如果您剛才已建立 Google Cloud 專案,選擇 **「Smart Photo Album」**
   - 如果沒有,選擇 **「Create API key in new project」**
4. 點擊 **「Create API key」**

### 步驟 3: 複製 API 金鑰

1. API 金鑰建立完成後,會顯示一串金鑰
2. 點擊 **「Copy」** 複製金鑰
3. 儲存到安全的地方

**範例格式**:
```
API Key: AIzaSyAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQq
```

### 步驟 4: 設定配額 (可選)

1. 點擊左側選單的 **「Quota」** 或 **「配額」**
2. 查看您的免費配額:
   - **Gemini 1.5 Flash**: 每分鐘 15 次請求
   - **Gemini 1.5 Pro**: 每分鐘 2 次請求
3. 如需更高配額,可升級為付費方案

---

## 第三部分: 設定環境變數

### 步驟 1: 建立 .env 檔案

1. 在專案根目錄 (`d:\projects\智慧相簿自動過濾與管理系統\`) 建立檔案: `.env`
2. 使用文字編輯器開啟 (例如: VS Code, Notepad++)

### 步驟 2: 填入 API 金鑰

複製以下內容,並替換成您的實際金鑰:

```env
# Google Photos API (OAuth 2.0)
GOOGLE_CLIENT_ID=您的_Client_ID
GOOGLE_CLIENT_SECRET=您的_Client_Secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/callback

# Gemini API
GEMINI_API_KEY=您的_Gemini_API_金鑰

# 伺服器設定
PORT=3000
NODE_ENV=development
```

**實際範例** (請替換成您的金鑰):
```env
# Google Photos API (OAuth 2.0)
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-aBcDeFgHiJkLmNoPqRsTuVwXyZ
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Gemini API
GEMINI_API_KEY=AIzaSyAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQq

# 伺服器設定
PORT=3000
NODE_ENV=development
```

### 步驟 3: 儲存並保護檔案

1. 儲存 `.env` 檔案
2. 確認 `.gitignore` 包含 `.env` (防止上傳到 Git)

---

## 第四部分: 驗證設定

### 測試 Google Photos API

稍後我們會建立測試程式,現在先確認:

✅ Client ID 已複製  
✅ Client Secret 已複製  
✅ 已設定重新導向 URI: `http://localhost:3001/auth/callback`  
✅ 已啟用 Photos Library API  
✅ OAuth 同意畫面已設定

### 測試 Gemini API

您可以在 Google AI Studio 中測試:

1. 前往 [Google AI Studio](https://aistudio.google.com/)
2. 點擊 **「Create new prompt」**
3. 輸入測試 Prompt:
   ```
   請評分這張照片的美學品質 (0-100分)
   ```
4. 上傳一張測試照片
5. 點擊 **「Run」**
6. 如果有回應,表示 API 運作正常!

---

## 常見問題排除

### Q1: 找不到 Photos Library API?

**解決方案**:
- 確認您在正確的專案中
- 嘗試搜尋 `Google Photos` 或 `photoslibrary`
- 清除瀏覽器快取後重試

### Q2: OAuth 同意畫面顯示「需要驗證」?

**解決方案**:
- 開發階段使用「測試模式」即可
- 只需將您的 Gmail 加入「測試使用者」清單
- 正式上線前才需要 Google 審核

### Q3: Gemini API 回傳 403 錯誤?

**解決方案**:
- 確認 API 金鑰正確複製 (無多餘空格)
- 檢查是否已啟用 Generative Language API
- 確認配額未超限

### Q4: 重新導向 URI 不符?

**解決方案**:
- 確認 `.env` 中的 `GOOGLE_REDIRECT_URI` 與 Google Cloud Console 設定一致
- 注意大小寫與結尾斜線 (建議不加斜線)
- 本地開發使用 `http://localhost:3001/auth/callback`

---

## 安全性檢查清單

在繼續開發前,請確認:

- [ ] `.env` 檔案已加入 `.gitignore`
- [ ] 沒有在程式碼中硬編碼 API 金鑰
- [ ] API 金鑰儲存在安全的地方 (密碼管理器)
- [ ] 測試使用者清單只包含您信任的帳號
- [ ] 已了解 API 配額限制

---

## 下一步

✅ API 金鑰申請完成!

現在可以開始:
1. 初始化 Node.js 專案
2. 安裝必要套件
3. 建立 Express 伺服器
4. 實作 OAuth 認證流程

---

## 參考資源

- [Google Photos API 官方文件](https://developers.google.com/photos)
- [OAuth 2.0 設定指南](https://developers.google.com/identity/protocols/oauth2)
- [Gemini API 文件](https://ai.google.dev/docs)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google AI Studio](https://aistudio.google.com/)

---

**文件版本**: 1.0  
**最後更新**: 2025-12-29  
**預估閱讀時間**: 15 分鐘  
**預估操作時間**: 30-40 分鐘
