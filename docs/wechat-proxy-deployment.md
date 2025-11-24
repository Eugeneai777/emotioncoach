# 微信API代理服务器部署指南

本指南将帮助您部署一个具有固定IP的代理服务器，用于解决微信公众平台API调用的IP白名单限制问题。

## 🎯 方案概述

**问题**：Lovable Cloud的Edge Functions使用动态IP，无法直接添加到微信公众平台的IP白名单。

**解决方案**：部署一个具有固定公网IP的代理服务器，所有对微信API的调用都通过这个代理转发。

## 📋 准备工作

### 1. 选择云服务提供商

推荐方案（按性价比排序）：
- ✅ **阿里云轻量应用服务器** - 性价比最高，配置简单
- ✅ **腾讯云轻量应用服务器** - 国内访问快，价格实惠
- ✅ **AWS EC2** - 国际化方案，稳定性好
- ✅ **Vultr/DigitalOcean** - 海外方案，价格便宜

### 2. 服务器配置要求

**最低配置**：
- CPU: 1核
- 内存: 1GB
- 带宽: 1Mbps
- 系统: Ubuntu 20.04 / CentOS 7+

**预计费用**：
- 阿里云/腾讯云轻量服务器：¥24-60/月
- AWS EC2 t2.micro：$5-10/月
- Vultr/DigitalOcean：$5/月

## 🚀 部署方案

### 方案A：Node.js 代理服务器（推荐）

#### 1. 创建项目

```bash
# 登录服务器
ssh root@your-server-ip

# 创建项目目录
mkdir -p /opt/wechat-proxy
cd /opt/wechat-proxy

# 初始化Node.js项目
npm init -y
npm install express cors
```

#### 2. 创建代理服务代码

创建 `proxy.js` 文件：

```javascript
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const PROXY_AUTH_TOKEN = process.env.PROXY_AUTH_TOKEN; // 可选的认证令牌

// 启用CORS
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'WeChat API Proxy'
  });
});

// 微信API代理端点
app.post('/wechat-proxy', async (req, res) => {
  try {
    // 可选：验证认证令牌
    if (PROXY_AUTH_TOKEN) {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (token !== PROXY_AUTH_TOKEN) {
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

    // 如果有请求体，添加到选项中
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
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy request failed', 
      message: error.message 
    });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`WeChat API Proxy Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Proxy endpoint: http://localhost:${PORT}/wechat-proxy`);
  if (PROXY_AUTH_TOKEN) {
    console.log('Authentication: ENABLED');
  } else {
    console.log('Authentication: DISABLED (set PROXY_AUTH_TOKEN to enable)');
  }
});
```

#### 3. 配置环境变量

创建 `.env` 文件（可选，用于认证）：

```bash
PORT=3000
PROXY_AUTH_TOKEN=your-secure-random-token-here
```

#### 4. 配置 PM2 守护进程

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start proxy.js --name wechat-proxy

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs wechat-proxy

# 查看状态
pm2 status
```

---

### 方案B：Python Flask 代理服务器

#### 1. 安装依赖

```bash
# 安装Python和pip
sudo apt update
sudo apt install python3 python3-pip -y

# 创建项目目录
mkdir -p /opt/wechat-proxy
cd /opt/wechat-proxy

# 安装Flask和requests
pip3 install flask flask-cors requests gunicorn
```

#### 2. 创建代理服务代码

创建 `proxy.py` 文件：

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get('PORT', 5000))
PROXY_AUTH_TOKEN = os.environ.get('PROXY_AUTH_TOKEN')  # 可选的认证令牌

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'server': 'WeChat API Proxy'
    })

@app.route('/wechat-proxy', methods=['POST'])
def wechat_proxy():
    try:
        # 可选：验证认证令牌
        if PROXY_AUTH_TOKEN:
            auth_header = request.headers.get('Authorization', '')
            token = auth_header.replace('Bearer ', '')
            
            if token != PROXY_AUTH_TOKEN:
                return jsonify({'error': 'Unauthorized'}), 401

        data = request.get_json()
        target_url = data.get('target_url')
        method = data.get('method', 'GET')
        headers = data.get('headers', {})
        body = data.get('body')

        if not target_url:
            return jsonify({'error': 'target_url is required'}), 400

        print(f"[{datetime.now().isoformat()}] Proxying {method} {target_url}")

        # 准备请求
        headers['Content-Type'] = 'application/json'
        
        # 转发请求到微信API
        if method == 'GET':
            response = requests.get(target_url, headers=headers)
        elif method == 'POST':
            response = requests.post(target_url, headers=headers, json=body)
        elif method == 'PUT':
            response = requests.put(target_url, headers=headers, json=body)
        elif method == 'DELETE':
            response = requests.delete(target_url, headers=headers)
        else:
            return jsonify({'error': f'Unsupported method: {method}'}), 400

        print(f"[{datetime.now().isoformat()}] Response status: {response.status_code}")

        # 返回微信API的响应
        return jsonify(response.json()), response.status_code

    except Exception as e:
        print(f"Proxy error: {str(e)}")
        return jsonify({
            'error': 'Proxy request failed',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print(f"WeChat API Proxy Server running on port {PORT}")
    print(f"Health check: http://localhost:{PORT}/health")
    print(f"Proxy endpoint: http://localhost:{PORT}/wechat-proxy")
    if PROXY_AUTH_TOKEN:
        print("Authentication: ENABLED")
    else:
        print("Authentication: DISABLED (set PROXY_AUTH_TOKEN to enable)")
    
    app.run(host='0.0.0.0', port=PORT)
```

#### 3. 使用 Gunicorn 部署

创建 `start.sh` 脚本：

```bash
#!/bin/bash
export PORT=5000
export PROXY_AUTH_TOKEN="your-secure-random-token-here"

gunicorn -w 4 -b 0.0.0.0:5000 proxy:app
```

```bash
# 使脚本可执行
chmod +x start.sh

# 运行
./start.sh
```

#### 4. 配置 Systemd 服务（开机自启）

创建 `/etc/systemd/system/wechat-proxy.service`：

```ini
[Unit]
Description=WeChat API Proxy
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/wechat-proxy
Environment="PORT=5000"
Environment="PROXY_AUTH_TOKEN=your-secure-random-token-here"
ExecStart=/usr/local/bin/gunicorn -w 4 -b 0.0.0.0:5000 proxy:app
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable wechat-proxy
sudo systemctl start wechat-proxy
sudo systemctl status wechat-proxy
```

---

## 🔐 配置防火墙和安全组

### 1. 开放端口

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 3000/tcp  # 或 5000 for Python
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 2. 云服务商安全组

在云服务商控制台配置安全组规则：
- **入站规则**：允许 TCP 3000（或5000）端口
- **出站规则**：允许所有流量（用于访问微信API）

---

## 🔍 测试代理服务器

### 1. 健康检查

```bash
curl http://your-server-ip:3000/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "server": "WeChat API Proxy"
}
```

### 2. 测试代理转发

```bash
curl -X POST http://your-server-ip:3000/wechat-proxy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token-here" \
  -d '{
    "target_url": "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=YOUR_APPID&secret=YOUR_SECRET",
    "method": "GET"
  }'
```

---

## 📝 在微信公众平台配置IP白名单

### 1. 获取服务器公网IP

```bash
curl ifconfig.me
# 或
curl icanhazip.com
```

### 2. 在微信公众平台添加IP

1. 登录微信公众平台（mp.weixin.qq.com）
2. 进入 **设置与开发 → 基本配置**
3. 找到 **IP白名单** 部分
4. 点击 **修改**
5. 添加您的服务器公网IP地址
6. 点击 **确认**

**注意**：
- 最多可以添加 **20个IP地址**
- 支持使用 **IP段**（如 1.1.1.1/24）
- IP地址之间用换行分隔
- 修改后立即生效

---

## 🎨 在应用中配置代理

1. 打开您的应用设置页面
2. 找到 **微信公众号模板消息** 部分
3. 启用 **启用代理服务器**
4. 填入配置：
   - **代理服务器地址**：`http://your-server-ip:3000` 或 `https://your-domain.com`（如已配置SSL）
   - **代理认证令牌**：`your-secure-random-token-here`（如果设置了认证）
5. 点击 **保存设置**
6. 点击 **测试推送** 验证配置

---

## 🔒 安全建议

### 1. 启用认证

**强烈建议**在生产环境启用认证令牌：

```bash
# 生成强随机令牌
openssl rand -base64 32
```

### 2. 配置 HTTPS（推荐）

使用 Let's Encrypt 免费SSL证书：

```bash
# 安装 Certbot
sudo apt install certbot

# 获取证书（需要域名）
sudo certbot certonly --standalone -d your-domain.com

# 配置Nginx反向代理
sudo apt install nginx
```

Nginx 配置示例 (`/etc/nginx/sites-available/wechat-proxy`)：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/wechat-proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. 配置日志轮转

防止日志文件过大：

```bash
# 对于PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🐛 故障排查

### 问题1：端口被占用

```bash
# 查看端口占用
sudo netstat -tulpn | grep 3000

# 杀死占用进程
sudo kill -9 <PID>
```

### 问题2：防火墙阻止

```bash
# 检查防火墙状态
sudo ufw status
sudo firewall-cmd --list-all

# 临时关闭防火墙测试
sudo ufw disable
```

### 问题3：微信API返回错误

检查代理服务器日志：

```bash
# PM2
pm2 logs wechat-proxy

# Systemd
sudo journalctl -u wechat-proxy -f
```

### 问题4：IP白名单未生效

- 等待5-10分钟，微信平台可能有缓存
- 确认IP地址正确（使用 `curl ifconfig.me` 再次确认）
- 检查是否配置了多个IP，确保正确的IP在白名单中

---

## 📊 监控和维护

### 1. 设置监控脚本

创建 `monitor.sh`：

```bash
#!/bin/bash
URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -ne 200 ]; then
    echo "Proxy server is down! Status: $RESPONSE"
    # 发送告警（可选）
    # pm2 restart wechat-proxy
fi
```

添加到 crontab（每5分钟检查一次）：

```bash
crontab -e
# 添加：
*/5 * * * * /opt/wechat-proxy/monitor.sh
```

### 2. 查看统计信息

```bash
# PM2
pm2 monit
pm2 show wechat-proxy

# 系统资源
htop
```

---

## 💰 成本估算

| 方案 | 月费用 | 适用场景 |
|------|--------|----------|
| 阿里云轻量1C1G | ¥24-40 | 个人/小型应用 |
| 腾讯云轻量1C2G | ¥50-80 | 中小型应用 |
| AWS EC2 t2.micro | $5-10 | 国际化需求 |
| Vultr/DO | $5 | 预算有限 |

---

## 📚 相关链接

- [微信公众平台技术文档](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [阿里云轻量应用服务器](https://www.aliyun.com/product/swas)
- [腾讯云轻量应用服务器](https://cloud.tencent.com/product/lighthouse)
- [PM2 文档](https://pm2.keymetrics.io/)
- [Gunicorn 文档](https://gunicorn.org/)

---

## ✅ 完成检查清单

- [ ] 服务器已购买并获得固定公网IP
- [ ] 代理服务器代码已部署
- [ ] 服务运行正常（健康检查通过）
- [ ] 防火墙和安全组已配置
- [ ] IP已添加到微信公众平台白名单
- [ ] 应用中已配置代理地址和令牌
- [ ] 测试推送成功
- [ ] （可选）已配置HTTPS
- [ ] （可选）已设置监控和告警

---

**恭喜！**您已成功部署微信API代理服务器 🎉

如有问题，请查看故障排查部分或联系技术支持。
