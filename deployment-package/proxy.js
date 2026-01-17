const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const PROXY_AUTH_TOKEN = process.env.PROXY_AUTH_TOKEN;

// 🔒 SECURITY: Mandatory authentication - server refuses to start without token
if (!PROXY_AUTH_TOKEN) {
  console.error('='.repeat(60));
  console.error('❌ SECURITY ERROR: PROXY_AUTH_TOKEN is required');
  console.error('='.repeat(60));
  console.error('The WeChat API proxy server cannot start without authentication.');
  console.error('');
  console.error('To fix this:');
  console.error('  1. Generate a secure token: openssl rand -hex 32');
  console.error('  2. Set environment variable: export PROXY_AUTH_TOKEN=<your-token>');
  console.error('  3. Or add to .env file: PROXY_AUTH_TOKEN=<your-token>');
  console.error('');
  console.error('See deployment-package/README.md for more details.');
  console.error('='.repeat(60));
  process.exit(1);
}

// 🔒 SECURITY: Validate token strength (minimum 32 characters)
if (PROXY_AUTH_TOKEN.length < 32) {
  console.error('='.repeat(60));
  console.error('❌ SECURITY ERROR: PROXY_AUTH_TOKEN is too weak');
  console.error('='.repeat(60));
  console.error('Token must be at least 32 characters for security.');
  console.error('');
  console.error('Generate a secure token: openssl rand -hex 32');
  console.error('='.repeat(60));
  process.exit(1);
}

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

// 🔒 Authentication middleware - always enforced (token is mandatory at startup)
const authenticateRequest = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== PROXY_AUTH_TOKEN) {
    console.error(`[${new Date().toISOString()}] Unauthorized access attempt from ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// 微信access_token获取端点
app.post('/wechat/token', authenticateRequest, async (req, res) => {
  try {
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
app.post('/wechat/qrcode/create', authenticateRequest, async (req, res) => {
  try {
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
app.post('/wechat-proxy', authenticateRequest, async (req, res) => {
  try {
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

// 微信支付回调转发端点（无需认证 - 微信服务器直接调用）
app.post('/wechat-pay-callback', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 📥 微信支付回调收到`);
  
  try {
    // 获取原始请求体
    const body = JSON.stringify(req.body);
    console.log(`[${timestamp}] 回调数据:`, body.substring(0, 200) + '...');
    
    // 转发到 Supabase Edge Function
    const targetUrl = 'https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/wechat-pay-callback';
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });
    
    const data = await response.json();
    console.log(`[${timestamp}] ✅ 回调转发结果:`, JSON.stringify(data));
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error(`[${timestamp}] ❌ 支付回调转发失败:`, error.message);
    res.status(500).json({ 
      code: 'FAIL', 
      message: error.message 
    });
  }
});

// 小程序登录端点（无需认证 - 小程序直接调用）
app.post('/miniprogram-login', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 📱 小程序登录请求`);
  
  try {
    const { code } = req.body;
    
    if (!code) {
      console.error(`[${timestamp}] ❌ 缺少 code 参数`);
      return res.status(400).json({ 
        success: false, 
        error: '缺少 code 参数' 
      });
    }
    
    console.log(`[${timestamp}] 小程序 code: ${code.substring(0, 10)}...`);
    
    // 从环境变量获取小程序配置
    const appId = process.env.WECHAT_MINI_PROGRAM_APP_ID;
    const appSecret = process.env.WECHAT_MINI_PROGRAM_APP_SECRET;
    
    if (!appId || !appSecret) {
      console.error(`[${timestamp}] ❌ 小程序配置不完整`);
      return res.status(500).json({ 
        success: false, 
        error: '小程序配置不完整' 
      });
    }
    
    // 调用微信 jscode2session API
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
    
    console.log(`[${timestamp}] 调用微信 jscode2session API...`);
    
    const wxResponse = await fetch(wxUrl);
    const wxResult = await wxResponse.json();
    
    console.log(`[${timestamp}] 微信响应:`, { 
      openid: wxResult.openid ? wxResult.openid.substring(0, 10) + '...' : null,
      errcode: wxResult.errcode,
      errmsg: wxResult.errmsg
    });
    
    if (wxResult.errcode) {
      console.error(`[${timestamp}] ❌ 微信接口错误: ${wxResult.errcode} - ${wxResult.errmsg}`);
      return res.status(400).json({ 
        success: false, 
        error: `微信接口错误: ${wxResult.errcode} - ${wxResult.errmsg}` 
      });
    }
    
    if (!wxResult.openid) {
      console.error(`[${timestamp}] ❌ 未获取到 openid`);
      return res.status(400).json({ 
        success: false, 
        error: '未获取到 openid' 
      });
    }
    
    console.log(`[${timestamp}] ✅ 小程序登录成功`);
    
    // 返回 openid（不返回 session_key，保证安全）
    res.json({
      success: true,
      openid: wxResult.openid,
      unionid: wxResult.unionid || null,
    });
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ 小程序登录失败:`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
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
  console.log('🔒 WeChat API Proxy Server (Secured)');
  console.log('='.repeat(60));
  console.log(`Status: Running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Proxy endpoint: http://localhost:${PORT}/wechat-proxy`);
  console.log(`Authentication: ENABLED ✅`);
  console.log(`Token length: ${PROXY_AUTH_TOKEN.length} characters`);
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
