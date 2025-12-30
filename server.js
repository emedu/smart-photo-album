require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

// 引入路由
const authRoutes = require('./routes/auth');
const albumsRoutes = require('./routes/albums');
const analysisRoutes = require('./routes/analysis');

// 引入錯誤處理
const { errorHandler } = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體設定
app.use(cors({
  origin: `http://localhost:${PORT}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session 設定
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 小時
  }
}));

// 靜態檔案服務
app.use(express.static(path.join(__dirname, 'public')));

// API 路由
app.use('/auth', authRoutes);
app.use('/api/albums', albumsRoutes);
app.use('/api/analysis', analysisRoutes);

// Debug 路由 (僅開發環境)
if (process.env.NODE_ENV !== 'production') {
  const debugRoutes = require('./routes/debug');
  app.use('/debug', debugRoutes);
}

// 根路徑
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '找不到請求的資源'
  });
});

// 錯誤處理中介軟體
app.use(errorHandler);

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎨 智慧相簿自動過濾與管理系統                            ║
║   Smart Photo Album Filter System                        ║
║                                                           ║
║   🚀 伺服器已啟動                                          ║
║   📍 http://localhost:${PORT}                              ║
║   🌍 環境: ${process.env.NODE_ENV || 'development'}                                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  console.log('✅ 可用的端點:');
  console.log(`   - GET  /                    主頁面`);
  console.log(`   - GET  /health              健康檢查`);
  console.log(`   - GET  /auth/login          Google 登入`);
  console.log(`   - GET  /auth/callback       OAuth 回調`);
  console.log(`   - GET  /api/albums          取得相簿清單`);
  console.log(`   - POST /api/analysis/start  開始分析`);
  console.log('');
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('⚠️  收到 SIGTERM 信號,正在關閉伺服器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  收到 SIGINT 信號,正在關閉伺服器...');
  process.exit(0);
});
