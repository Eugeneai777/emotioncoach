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

// 微信access_token获取端点
app.post('/wechat/token', async (req, res) => {
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

    const { appid, secret } = req.body;

    if (!appid || !secret) {
      return res.status(400).json({ error: 'appid and secret are required' });
    }

    const targetUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    console.log(`[${new Date().toISOString()}] 获取微信access_token for appid: ${appid}`);

    const response = await fetch(targetUrl);
    const data = await response.json();

    console.log(`[${new Date().toISOString()}] 微信API响应: ${data.access_token ? '成功' : '失败 - ' + data.errmsg}`);

    res.status(response.status).json(data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Token获取失败:`, error.message);
    res.status(500).json({ 
      error: 'Token request failed', 
      message: error.message 
    });
  }
});

// 微信二维码创建端点
app.post('/wechat/qrcode/create', async (req, res) => {
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

    const { access_token, expire_seconds, action_name, action_info } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'access_token is required' });
    }

    const targetUrl = `https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${access_token}`;
    console.log(`[${new Date().toISOString()}] 创建微信二维码, action_name: ${action_name}`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expire_seconds, action_name, action_info }),
    });

    const data = await response.json();

    console.log(`[${new Date().toISOString()}] 二维码创建: ${data.ticket ? '成功' : '失败 - ' + data.errmsg}`);

    res.status(response.status).json(data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 二维码创建失败:`, error.message);
    res.status(500).json({ 
      error: 'QR code creation failed', 
      message: error.message 
    });
  }
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
