const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const PROXY_AUTH_TOKEN = process.env.PROXY_AUTH_TOKEN;

// 启用CORS和JSON解析
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'WeChat API Proxy',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// 微信API代理端点
app.post('/wechat-proxy', async (req, res) => {
  try {
    // 验证认证令牌
    if (PROXY_AUTH_TOKEN) {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (token !== PROXY_AUTH_TOKEN) {
        console.error(`[${new Date().toISOString()}] Unauthorized access attempt`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const { target_url, method = 'GET', headers = {}, body } = req.body;

    if (!target_url) {
      return res.status(400).json({ error: 'target_url is required' });
    }

    console.log(`[${new Date().toISOString()}] Proxying ${method} ${target_url}`);

    // 准备请求选项
    const fetchOptions = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // 添加请求体（如果有）
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // 转发请求到微信API
    const response = await fetch(target_url, fetchOptions);
    const data = await response.json();

    console.log(`[${new Date().toISOString()}] Response status: ${response.status}`);

    // 返回微信API的响应
    res.status(response.status).json(data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Proxy error:`, error.message);
    res.status(500).json({ 
      error: 'Proxy request failed', 
      message: error.message 
    });
  }
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('WeChat API Proxy Server');
  console.log('='.repeat(60));
  console.log(`Status: Running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Proxy endpoint: http://localhost:${PORT}/wechat-proxy`);
  console.log(`Authentication: ${PROXY_AUTH_TOKEN ? 'ENABLED' : 'DISABLED (⚠️  Not secure!)'}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});
