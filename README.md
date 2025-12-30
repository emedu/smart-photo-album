# 智慧相簿自動過濾與管理系統

AI 驅動的 Google Photos 照片與影片智慧篩選系統,使用 Gemini API 進行美學分析與品質評估。

## 🌟 功能特色

- 🤖 **AI 智慧分析**: 使用 Gemini 1.5 Flash/Pro 進行照片與影片評分
- 📸 **自動篩選**: 根據美學評分自動過濾低品質內容
- 🎬 **影片分析**: 辨識精彩瞬間、動態品質與音訊清晰度
- 📁 **自動歸檔**: 建立精選相簿並自動儲存
- 🔒 **安全認證**: OAuth 2.0 授權,保護使用者隱私

## 📋 系統需求

- Node.js v18.0.0 或更高版本
- npm v9.0.0 或更高版本
- Google Cloud 帳號 (用於 Google Photos API)
- Google AI Studio 帳號 (用於 Gemini API)

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 為 `.env`:

```bash
copy .env.example .env
```

然後編輯 `.env` 檔案,填入您的 API 金鑰。

詳細申請步驟請參考: [API金鑰申請完整指南.md](./專案文件_ProjectDocs/API金鑰申請完整指南.md)

### 3. 啟動開發伺服器

```bash
npm run dev
```

伺服器將在 `http://localhost:3001` 啟動。

## 📖 文檔

完整的專案文檔位於 `專案文件_ProjectDocs/` 資料夾:

- [01_執行計畫.md](./專案文件_ProjectDocs/01_執行計畫.md) - 專案目標與規劃
- [03_技術手冊.md](./專案文件_ProjectDocs/03_技術手冊.md) - 系統架構與 API 文件
- [04_開發問答與學習筆記.md](./專案文件_ProjectDocs/04_開發問答與學習筆記.md) - 常見問題 Q&A
- [API金鑰申請完整指南.md](./專案文件_ProjectDocs/API金鑰申請完整指南.md) - API 申請步驟

## 🏗️ 專案結構

```
智慧相簿自動過濾與管理系統/
├── server.js                 # Express 伺服器主程式
├── package.json              # 專案配置
├── .env                      # 環境變數 (不上傳 Git)
├── .env.example              # 環境變數範本
├── .gitignore                # Git 忽略清單
├── README.md                 # 本文件
│
├── public/                   # 前端靜態資源
│   ├── index.html           # 主頁面
│   ├── dashboard.html       # 相簿選擇頁面
│   ├── analysis.html        # 分析進度頁面
│   ├── results.html         # 結果展示頁面
│   ├── css/
│   │   └── styles.css       # 主樣式表
│   └── js/
│       ├── app.js           # 主應用邏輯
│       ├── auth.js          # 認證邏輯
│       └── analysis.js      # 分析邏輯
│
├── routes/                   # API 路由
│   ├── auth.js              # 認證路由
│   ├── albums.js            # 相簿操作路由
│   └── analysis.js          # AI 分析路由
│
├── services/                 # 業務邏輯層
│   ├── googlePhotos.js      # Google Photos 服務
│   ├── geminiAI.js          # Gemini AI 服務
│   └── albumProcessor.js    # 相簿處理邏輯
│
├── utils/                    # 工具函式
│   ├── errorHandler.js      # 錯誤處理
│   ├── validators.js        # 輸入驗證
│   └── logger.js            # 日誌記錄
│
└── 專案文件_ProjectDocs/     # 專案文檔
    ├── 01_執行計畫.md
    ├── 03_技術手冊.md
    ├── 04_開發問答與學習筆記.md
    └── API金鑰申請完整指南.md
```

## 🔧 使用方式

1. 開啟瀏覽器,前往 `http://localhost:3001`
2. 點擊「連接 Google Photos」進行授權
3. 選擇要分析的相簿
4. 設定評分門檻 (預設 85 分)
5. 開始分析,等待 AI 處理
6. 查看結果並前往新建立的精選相簿

## 📊 API 配額

### Google Photos API
- 每日請求數: 10,000 次 (免費方案)
- 單次查詢: 最多 100 個媒體項目

### Gemini API
- Gemini 1.5 Flash: 每分鐘 15 次請求
- Gemini 1.5 Pro: 每分鐘 2 次請求

## ⚠️ 注意事項

- 請勿將 `.env` 檔案上傳至 GitHub
- API 金鑰請妥善保管
- 建議單次處理不超過 500 個媒體項目
- 開發階段使用測試相簿

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request!

## 📄 授權

MIT License

## 👨‍💻 開發者

Antigravity AI Assistant

---

**版本**: 1.0.0  
**最後更新**: 2025-12-29
