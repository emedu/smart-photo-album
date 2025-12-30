# ✅ Port 變更完成通知

**變更日期**: 2025-12-29  
**變更內容**: Port 3000 → 3001

---

## 📝 變更摘要

由於 Port 3000 已被其他服務使用,已將整個專案的 Port 設定從 **3000** 改為 **3001**。

---

## ✅ 已更新的檔案

### 配置檔案
- ✅ `.env.example` - 預設 PORT 和 REDIRECT_URI

### 程式碼檔案
- ✅ `server.js` - CORS origin 設定 (已使用動態 PORT 變數)

### 文檔檔案
- ✅ `README.md` - 所有 localhost:3000 參考
- ✅ `快速開始指南.md` - 所有 localhost:3000 參考
- ✅ `啟動檢查清單.md` - 所有 localhost:3000 參考
- ✅ `專案文件_ProjectDocs/01_執行計畫.md` - (無需更新,使用變數)
- ✅ `專案文件_ProjectDocs/02_執行報告.md` - 伺服器啟動測試
- ✅ `專案文件_ProjectDocs/03_技術手冊.md` - 所有 localhost:3000 參考
- ✅ `專案文件_ProjectDocs/API金鑰申請完整指南.md` - 所有 localhost:3000 參考

**總計**: 8 個檔案已更新

---

## 🔧 新的設定

### 環境變數 (.env)

```env
PORT=3001
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/callback
```

### 伺服器啟動

```bash
npm start
```

伺服器將在 **http://localhost:3001** 啟動

### Google Cloud Console 設定

在申請 Google Photos API 時,請設定:

**已授權的 JavaScript 來源**:
- `http://localhost:3001`

**已授權的重新導向 URI**:
- `http://localhost:3001/auth/callback`

---

## 📋 測試檢查清單

- [ ] 建立 `.env` 檔案 (複製 `.env.example`)
- [ ] 設定 PORT=3001
- [ ] 執行 `npm start`
- [ ] 確認伺服器在 http://localhost:3001 啟動
- [ ] 開啟瀏覽器測試 http://localhost:3001
- [ ] 測試健康檢查 http://localhost:3001/health

---

## ⚠️ 重要提醒

### 申請 Google Photos API 時

請確保在 Google Cloud Console 中設定的重新導向 URI 為:

```
http://localhost:3001/auth/callback
```

**不是** `http://localhost:3000/auth/callback`

### 如果已申請過 API

如果您之前已經申請過 Google Photos API 並設定為 port 3000,請:

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇您的專案
3. 前往「憑證」頁面
4. 編輯 OAuth 2.0 用戶端 ID
5. 更新「已授權的重新導向 URI」為 `http://localhost:3001/auth/callback`
6. 儲存變更

---

## 🎯 下一步

現在可以:

1. **建立 .env 檔案**
   ```bash
   copy .env.example .env
   ```

2. **啟動伺服器**
   ```bash
   npm start
   ```

3. **開啟瀏覽器**
   ```
   http://localhost:3001
   ```

---

**變更完成!** ✅

所有文檔和程式碼已更新為使用 Port 3001。
