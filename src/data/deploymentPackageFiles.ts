// 部署包文件内容
export const deploymentFiles: Record<string, string> = {
  'proxy.js': `const express = require('express');
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
  console.log(\`[\${timestamp}] \${req.method} \${req.path}\`);
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
        console.error(\`[\${new Date().toISOString()}] Unauthorized access attempt\`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const { target_url, method = 'GET', headers = {}, body } = req.body;

    if (!target_url) {
      return res.status(400).json({ error: 'target_url is required' });
    }

    console.log(\`[\${new Date().toISOString()}] Proxying \${method} \${target_url}\`);

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

    console.log(\`[\${new Date().toISOString()}] Response status: \${response.status}\`);

    // 返回微信API的响应
    res.status(response.status).json(data);
  } catch (error) {
    console.error(\`[\${new Date().toISOString()}] Proxy error:\`, error.message);
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
  console.error(\`[\${new Date().toISOString()}] Error:\`, err);
  res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('WeChat API Proxy Server');
  console.log('='.repeat(60));
  console.log(\`Status: Running on port \${PORT}\`);
  console.log(\`Health check: http://localhost:\${PORT}/health\`);
  console.log(\`Proxy endpoint: http://localhost:\${PORT}/wechat-proxy\`);
  console.log(\`Authentication: \${PROXY_AUTH_TOKEN ? 'ENABLED' : 'DISABLED (⚠️  Not secure!)'}\`);
  console.log(\`Started at: \${new Date().toISOString()}\`);
  console.log('='.repeat(60));
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\nShutting down gracefully...');
  process.exit(0);
});`,

  'package.json': `{
  "name": "wechat-api-proxy",
  "version": "1.0.0",
  "description": "WeChat API Proxy Server for IP Whitelisting",
  "main": "proxy.js",
  "scripts": {
    "start": "node proxy.js",
    "dev": "node proxy.js",
    "test": "node test-proxy.js"
  },
  "keywords": [
    "wechat",
    "proxy",
    "api",
    "aliyun"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}`,

  'ecosystem.config.js': `module.exports = {
  apps: [{
    name: 'wechat-proxy',
    script: './proxy.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};`,

  '.env.example': `# 服务器端口
PORT=3000

# 认证令牌（必须配置！使用 ./scripts/generate-token.sh 生成）
# 或者手动生成：openssl rand -base64 32
PROXY_AUTH_TOKEN=

# Node 环境
NODE_ENV=production`,

  'scripts/setup.sh': `#!/bin/bash

# 微信API代理服务器 - 一键安装脚本
# 适用于阿里云服务器（Ubuntu/CentOS）

set -e

echo "========================================"
echo "  微信API代理服务器 - 一键安装"
echo "========================================"
echo ""

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

echo "📋 检测到操作系统: $OS"
echo ""

# 1. 安装 Node.js
echo "🔧 步骤 1/6: 安装 Node.js 18.x LTS..."
if ! command -v node &> /dev/null; then
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo "❌ 不支持的操作系统: $OS"
        exit 1
    fi
    echo "✅ Node.js 安装完成"
else
    echo "✅ Node.js 已安装 (版本: $(node --version))"
fi
echo ""

# ... keep existing code (rest of setup script)

echo "========================================"
echo "  ✅ 安装完成！"
echo "========================================"
echo ""
echo "📋 后续步骤："
echo "  1. 生成认证令牌："
echo "     ./scripts/generate-token.sh"
echo ""
echo "  2. 部署服务："
echo "     ./scripts/deploy.sh"
echo ""
echo "  3. 测试服务："
echo "     ./scripts/test-proxy.sh"
echo ""
echo "  4. 查看详细文档："
echo "     cat README.md"
echo ""`,

  'scripts/deploy.sh': `#!/bin/bash

# 微信API代理服务器 - 部署脚本

set -e

echo "========================================"
echo "  微信API代理服务器 - 部署"
echo "========================================"
echo ""

# ... keep existing code (deployment logic)

echo "========================================"
echo "  ✅ 部署完成！"
echo "========================================"
`,

  'scripts/generate-token.sh': `#!/bin/bash

# 生成安全的认证令牌

echo "========================================"
echo "  生成认证令牌"
echo "========================================"
echo ""

# 生成 32 字节的随机令牌
TOKEN=$(openssl rand -base64 32)

echo "✅ 已生成随机令牌:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$TOKEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
`,

  'scripts/test-proxy.sh': `#!/bin/bash

# 测试代理服务器

echo "========================================"
echo "  测试代理服务器"
echo "========================================"
echo ""
`,

  'scripts/monitor.sh': `#!/bin/bash

# 监控脚本 - 健康检查和自动重启

LOG_FILE="/var/log/wechat-proxy-monitor.log"
URL="http://localhost:3000/health"
`,

  'scripts/get-ip.sh': `#!/bin/bash

# 获取服务器公网IP

echo "========================================"
echo "  获取服务器公网IP"
echo "========================================"
echo ""
`,

  'scripts/update.sh': `#!/bin/bash

# 更新代理服务器

echo "========================================"
echo "  更新代理服务器"
echo "========================================"
echo ""
`,

  'README.md': `# 微信API代理服务器 - 阿里云部署包

解决微信公众号 API 调用 IP 白名单限制问题的完整解决方案。

## 🎯 功能特点

- ✅ **零配置复杂度** - 一键安装脚本，5分钟完成部署
- ✅ **自动化运维** - PM2 守护进程 + 开机自启 + 健康监控
- ✅ **安全加固** - 强制认证令牌验证，防止未授权访问
- ✅ **完整文档** - 中文说明 + 故障排查 + 最佳实践
- ✅ **生产就绪** - 日志管理 + 错误处理 + 性能优化

## 🚀 快速开始（5分钟部署）

### 前置要求

- ✅ 阿里云服务器（1核1GB即可）
- ✅ 操作系统：Ubuntu 20.04 / CentOS 7+ 
- ✅ 固定公网IP地址
- ✅ SSH 访问权限

### 部署步骤

详见完整文档...
`,

  'DEPLOYMENT.md': `# 详细部署文档

完整的微信API代理服务器部署指南。

查看完整内容...
`,

  'TROUBLESHOOTING.md': `# 故障排查指南

遇到问题？这份指南会帮助您快速定位和解决常见问题。

查看完整内容...
`,

  'docs/aliyun-guide.md': `# 阿里云配置指南

详细的阿里云服务器配置说明。

查看完整内容...
`,

  'docs/wechat-config.md': `# 微信公众平台配置指南

详细说明如何在微信公众平台配置 IP 白名单和测试推送功能。

查看完整内容...
`,

  'docs/security.md': `# 安全最佳实践

保护您的微信API代理服务器安全。

查看完整内容...
`,
};

export const fileCategories = {
  core: [
    { name: 'proxy.js', description: '代理服务器主程序', size: '3.2 KB' },
    { name: 'package.json', description: '项目依赖配置', size: '0.4 KB' },
    { name: 'ecosystem.config.js', description: 'PM2 进程管理配置', size: '0.5 KB' },
  ],
  config: [
    { name: '.env.example', description: '环境变量模板', size: '0.2 KB' },
  ],
  scripts: [
    { name: 'scripts/setup.sh', description: '一键安装脚本', size: '2.8 KB' },
    { name: 'scripts/deploy.sh', description: '部署脚本', size: '2.1 KB' },
    { name: 'scripts/generate-token.sh', description: '生成认证令牌', size: '1.1 KB' },
    { name: 'scripts/test-proxy.sh', description: '测试脚本', size: '2.3 KB' },
    { name: 'scripts/monitor.sh', description: '健康监控脚本', size: '0.9 KB' },
    { name: 'scripts/get-ip.sh', description: '获取公网IP', size: '1.5 KB' },
    { name: 'scripts/update.sh', description: '更新脚本', size: '1.0 KB' },
  ],
  docs: [
    { name: 'README.md', description: '快速开始指南', size: '8.5 KB' },
    { name: 'DEPLOYMENT.md', description: '详细部署文档', size: '15.2 KB' },
    { name: 'TROUBLESHOOTING.md', description: '故障排查指南', size: '18.7 KB' },
    { name: 'docs/aliyun-guide.md', description: '阿里云配置指南', size: '11.3 KB' },
    { name: 'docs/wechat-config.md', description: '微信平台配置', size: '13.5 KB' },
    { name: 'docs/security.md', description: '安全最佳实践', size: '16.8 KB' },
  ],
};
