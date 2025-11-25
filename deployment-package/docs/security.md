# 安全最佳实践

保护您的微信API代理服务器安全。

## 📋 目录

1. [基础安全配置](#基础安全配置)
2. [认证与授权](#认证与授权)
3. [网络安全](#网络安全)
4. [数据安全](#数据安全)
5. [监控与审计](#监控与审计)
6. [应急响应](#应急响应)

## 基础安全配置

### 1. 强制使用认证令牌

**❌ 不安全的配置：**
```bash
# .env
PROXY_AUTH_TOKEN=
```

**✅ 安全的配置：**
```bash
# .env
PROXY_AUTH_TOKEN=a8f3d9e2c7b1a6e5f4d3c2b1a9e8d7c6b5a4e3d2c1b9a8e7
```

**生成强密码令牌：**
```bash
# 使用 32 字节随机数
openssl rand -base64 32

# 或使用提供的脚本
./scripts/generate-token.sh
```

### 2. 定期更换令牌

**建议频率：** 每 3 个月

**更换步骤：**
```bash
# 1. 生成新令牌
./scripts/generate-token.sh

# 2. 记录新令牌
cat .env | grep PROXY_AUTH_TOKEN

# 3. 重新部署
./scripts/deploy.sh

# 4. 更新应用配置
# 在应用设置中填入新令牌

# 5. 测试
./scripts/test-proxy.sh
```

### 3. 限制文件权限

```bash
# 保护敏感文件
chmod 600 /opt/deployment-package/.env
chmod 600 /opt/deployment-package/ecosystem.config.js

# 限制目录访问
chmod 700 /opt/deployment-package

# 设置所有者
chown -R root:root /opt/deployment-package
```

### 4. 禁用 root 直接登录（可选）

**创建普通用户：**
```bash
# 创建新用户
adduser deploy
usermod -aG sudo deploy

# 切换到新用户
su - deploy

# 配置 SSH 密钥
mkdir -p ~/.ssh
chmod 700 ~/.ssh
# 将公钥添加到 ~/.ssh/authorized_keys
```

**禁用 root SSH 登录：**
```bash
sudo nano /etc/ssh/sshd_config

# 修改以下配置
PermitRootLogin no
PasswordAuthentication no  # 强制使用密钥

# 重启 SSH 服务
sudo systemctl restart sshd
```

⚠️ **警告：** 在禁用 root 登录前，确保：
- 已创建普通用户
- 已配置 SSH 密钥
- 普通用户有 sudo 权限
- 已测试新用户可以登录

## 认证与授权

### 1. 实施请求速率限制

**安装依赖：**
```bash
cd /opt/deployment-package
npm install express-rate-limit
```

**修改 proxy.js：**
```javascript
const rateLimit = require('express-rate-limit');

// 创建限流器
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: {
    error: 'Too many requests, please try again later'
  }
});

// 应用到所有路由
app.use(limiter);

// 或仅应用到代理端点
app.post('/wechat-proxy', limiter, async (req, res) => {
  // ... 现有代码
});
```

### 2. IP 白名单（可选）

**仅允许特定IP访问：**

```javascript
// 在 proxy.js 中添加
const ALLOWED_IPS = process.env.ALLOWED_IPS?.split(',') || [];

app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (ALLOWED_IPS.length > 0 && !ALLOWED_IPS.includes(clientIP)) {
    console.log(`[${new Date().toISOString()}] Blocked IP: ${clientIP}`);
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
});
```

**配置 .env：**
```bash
# 允许的客户端IP（用逗号分隔）
ALLOWED_IPS=1.2.3.4,5.6.7.8
```

### 3. 令牌过期机制（高级）

**实施JWT令牌：**

```bash
npm install jsonwebtoken
```

```javascript
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 生成令牌（在管理端执行）
function generateToken() {
  return jwt.sign(
    { service: 'wechat-proxy' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// 验证令牌
app.post('/wechat-proxy', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    jwt.verify(token, JWT_SECRET);
    // 继续处理...
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});
```

## 网络安全

### 1. 启用 HTTPS

**安装 Nginx 和 Certbot：**

```bash
# Ubuntu
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# CentOS
sudo yum install nginx certbot python3-certbot-nginx
```

**配置 Nginx：**

```bash
sudo nano /etc/nginx/sites-available/wechat-proxy
```

```nginx
server {
    listen 80;
    server_name proxy.yourdomain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name proxy.yourdomain.com;
    
    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/proxy.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/proxy.yourdomain.com/privkey.pem;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**启用配置：**

```bash
sudo ln -s /etc/nginx/sites-available/wechat-proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**获取 SSL 证书：**

```bash
sudo certbot --nginx -d proxy.yourdomain.com
```

**自动续期：**

```bash
# 测试续期
sudo certbot renew --dry-run

# Certbot 会自动设置定时任务
# 验证
sudo systemctl status certbot.timer
```

### 2. 配置防火墙

**仅开放必要端口：**

```bash
# Ubuntu
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP（用于 HTTPS 重定向）
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 如果使用 HTTPS，可以关闭 3000 端口的外部访问
# 仅允许 Nginx (localhost) 访问
```

**CentOS：**

```bash
sudo firewall-cmd --permanent --remove-port=3000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### 3. 防御 DDoS

**Nginx 限流配置：**

```nginx
http {
    # 限制请求速率
    limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
    
    # 限制连接数
    limit_conn_zone $binary_remote_addr zone=addr:10m;
    
    server {
        # ... 其他配置
        
        location / {
            limit_req zone=one burst=20 nodelay;
            limit_conn addr 10;
            # ... 其他配置
        }
    }
}
```

**使用 Cloudflare（推荐）：**

1. 将域名 DNS 托管到 Cloudflare
2. 启用代理（橙色云图标）
3. 自动获得 DDoS 防护

## 数据安全

### 1. 敏感数据加密

**环境变量加密（可选）：**

```bash
# 安装加密工具
npm install dotenv-safe

# 使用 Ansible Vault 或类似工具加密 .env
ansible-vault encrypt .env

# 部署时解密
ansible-vault decrypt .env
```

### 2. 日志脱敏

**避免记录敏感信息：**

```javascript
// 在 proxy.js 中
console.log(`Proxying ${method} ${target_url}`);
// ❌ 不要记录完整的 URL（可能包含 access_token）

// ✅ 记录脱敏后的 URL
const logUrl = target_url.replace(/access_token=[^&]+/, 'access_token=***');
console.log(`Proxying ${method} ${logUrl}`);
```

### 3. 定期备份

**自动备份脚本：**

```bash
cat > /opt/deployment-package/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份配置文件（排除日志）
tar -czf $BACKUP_DIR/wechat-proxy-$DATE.tar.gz \
  --exclude='/opt/deployment-package/logs' \
  --exclude='/opt/deployment-package/node_modules' \
  /opt/deployment-package

# 只保留最近7天的备份
find $BACKUP_DIR -name "wechat-proxy-*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/wechat-proxy-$DATE.tar.gz"
EOF

chmod +x /opt/deployment-package/scripts/backup.sh

# 每天凌晨2点自动备份
(crontab -l; echo "0 2 * * * /opt/deployment-package/scripts/backup.sh") | crontab -
```

## 监控与审计

### 1. 访问日志

**启用详细日志：**

```javascript
// 在 proxy.js 中添加
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  console.log(`[${timestamp}] ${clientIP} - ${req.method} ${req.path} - ${userAgent}`);
  next();
});
```

### 2. 异常检测

**创建监控脚本：**

```bash
cat > /opt/deployment-package/scripts/detect-anomaly.sh << 'EOF'
#!/bin/bash
LOG_FILE="/opt/deployment-package/logs/out.log"
ALERT_FILE="/var/log/security-alerts.log"

# 检测异常高频请求
HIGH_FREQ=$(tail -1000 $LOG_FILE | grep "Proxying" | cut -d' ' -f1 | sort | uniq -c | sort -rn | head -1 | awk '{print $1}')

if [ $HIGH_FREQ -gt 50 ]; then
  echo "[$(date)] High frequency detected: $HIGH_FREQ requests" >> $ALERT_FILE
fi

# 检测认证失败
AUTH_FAILURES=$(tail -1000 $LOG_FILE | grep -c "Unauthorized")

if [ $AUTH_FAILURES -gt 10 ]; then
  echo "[$(date)] Multiple auth failures: $AUTH_FAILURES attempts" >> $ALERT_FILE
fi
EOF

chmod +x /opt/deployment-package/scripts/detect-anomaly.sh

# 每10分钟检查一次
(crontab -l; echo "*/10 * * * * /opt/deployment-package/scripts/detect-anomaly.sh") | crontab -
```

### 3. 日志集中管理（可选）

使用 **ELK Stack** 或 **Grafana Loki** 集中管理日志。

**简单方案：使用 rsyslog 转发日志**

```bash
# 配置 PM2 日志转发
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 应急响应

### 1. 发现异常的应对流程

**立即行动：**

```bash
# 1. 停止服务
pm2 stop wechat-proxy

# 2. 更换认证令牌
./scripts/generate-token.sh

# 3. 检查日志
pm2 logs wechat-proxy --lines 1000 > /tmp/incident-log.txt

# 4. 检查系统安全
# 查看登录记录
last
lastb  # 失败的登录尝试

# 查看进程
ps aux | grep -v grep | grep -E 'node|pm2'

# 5. 重新部署
./scripts/deploy.sh
```

### 2. 安全事件分类

**等级1：信息（Info）**
- 正常的访问请求
- 预期内的错误

**等级2：警告（Warning）**
- 单次认证失败
- 请求频率略高

**等级3：错误（Error）**
- 多次认证失败
- 服务异常重启

**等级4：严重（Critical）**
- 疑似攻击行为
- 未授权访问成功
- 数据泄露

### 3. 安全检查清单

**每周检查：**
- [ ] 查看服务状态：`pm2 status`
- [ ] 检查错误日志：`pm2 logs wechat-proxy --err`
- [ ] 查看磁盘空间：`df -h`
- [ ] 检查防火墙规则：`sudo ufw status`

**每月检查：**
- [ ] 更新系统包：`sudo apt update && sudo apt upgrade`
- [ ] 更新 Node.js 依赖：`npm outdated && npm update`
- [ ] 检查 SSL 证书有效期：`sudo certbot certificates`
- [ ] 审查访问日志异常
- [ ] 测试备份恢复

**每季度检查：**
- [ ] 更换认证令牌
- [ ] 审查安全策略
- [ ] 进行安全测试
- [ ] 更新文档

## 合规建议

### 1. 数据保护

- **最小权限原则**：只授予必要的访问权限
- **数据加密**：传输中加密（HTTPS），存储加密（可选）
- **日志保留**：根据需要保留30-90天日志

### 2. 隐私保护

- **不记录敏感信息**：如用户OpenID、access_token
- **数据匿名化**：日志中的IP地址可考虑匿名化
- **定期清理**：删除不再需要的日志和备份

## 安全资源

**推荐阅读：**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

**安全工具：**
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - 依赖漏洞扫描
- [Snyk](https://snyk.io/) - 安全漏洞检测
- [fail2ban](https://www.fail2ban.org/) - 自动封禁攻击IP

---

**安全是一个持续的过程，而非一次性的任务。定期审查和更新安全措施是保护系统的关键。** 🔒
