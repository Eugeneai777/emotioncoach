# 微信公众号 AI 助手 - 阿里云 1Panel 完整部署指南

## 📋 目录

1. [🚀 一键部署（推荐）](#一键部署推荐)
2. [方案概述](#方案概述)
3. [准备工作](#准备工作)
4. [手动部署步骤](#手动部署步骤)
5. [代码文件](#代码文件)
6. [常见问题](#常见问题)
7. [测试验证](#测试验证)

---

## 🚀 一键部署（推荐）

### 适用场景

如果您是新手或希望快速部署，强烈推荐使用一键部署脚本。该脚本将自动完成：

- ✅ 自动检测操作系统并安装 Python3
- ✅ 自动创建项目目录和虚拟环境
- ✅ 自动安装所有 Python 依赖
- ✅ 自动配置防火墙规则
- ✅ 自动创建 systemd 服务（开机自启）
- ✅ 自动启动服务并验证状态

### 快速开始（5分钟部署）

#### 步骤 1：下载并运行部署脚本

```bash
# 下载脚本
curl -O https://你的域名/wechat-bot-oneclick.sh

# 或者直接创建脚本文件
cat > wechat-bot-oneclick.sh << 'EOF'
# 在这里粘贴完整的脚本内容...
# 见下方"完整脚本内容"
EOF

# 添加执行权限
chmod +x wechat-bot-oneclick.sh

# 运行部署脚本
sudo ./wechat-bot-oneclick.sh
```

#### 步骤 2：配置微信公众号信息

脚本执行完成后，编辑配置文件：

```bash
sudo nano /opt/wechat-bot/.env
```

修改以下内容：

```env
# 微信公众号配置
WECHAT_TOKEN=你的微信Token
WECHAT_APPID=你的AppID  
WECHAT_APPSECRET=你的AppSecret

# 服务端口（默认3000）
PORT=3000
```

按 `Ctrl+X`，然后按 `Y`，最后按 `Enter` 保存。

#### 步骤 3：重启服务

```bash
sudo systemctl restart wechat-bot
```

#### 步骤 4：验证服务状态

```bash
# 查看服务状态
sudo systemctl status wechat-bot

# 查看服务日志
sudo tail -f /var/log/wechat-bot.log

# 测试健康检查
curl http://localhost:3000/health
```

#### 步骤 5：配置微信公众平台

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入"设置与开发" → "基本配置"
3. 填写服务器配置：
   - **URL**：`http://你的服务器IP:3000/wechat-callback`
   - **Token**：与 `.env` 中的 `WECHAT_TOKEN` 一致
   - **EncodingAESKey**：点击"随机生成"
   - **消息加解密方式**：明文模式
4. 点击"提交"，等待验证通过

### 常用服务管理命令

```bash
# 启动服务
sudo systemctl start wechat-bot

# 停止服务
sudo systemctl stop wechat-bot

# 重启服务
sudo systemctl restart wechat-bot

# 查看服务状态
sudo systemctl status wechat-bot

# 查看实时日志
sudo journalctl -u wechat-bot -f

# 查看历史日志
sudo tail -100 /var/log/wechat-bot.log
```

### 完整脚本内容

如果无法通过 URL 下载，可以手动创建脚本文件并粘贴以下内容：

> **提示**：完整脚本见项目中的 `deployment-package/scripts/wechat-bot-oneclick.sh` 文件

### 故障排查

**服务启动失败？**

```bash
# 查看详细错误日志
sudo journalctl -u wechat-bot -n 50 --no-pager

# 检查 Python 虚拟环境
source /opt/wechat-bot/venv/bin/activate
python --version
pip list

# 手动测试运行
cd /opt/wechat-bot
source venv/bin/activate
python wechat_bot.py
```

**防火墙问题？**

```bash
# 检查防火墙状态
sudo ufw status
# 或
sudo firewall-cmd --list-ports

# 手动开放端口
sudo ufw allow 3000/tcp
# 或
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

**微信验证失败？**

```bash
# 测试服务是否可访问
curl http://localhost:3000/health

# 测试微信回调端点
curl http://localhost:3000/wechat-callback

# 确认配置文件
cat /opt/wechat-bot/.env
```

### 架构说明

```
微信用户 → 微信服务器 → 阿里云 1Panel Python 服务 → Lovable AI → 微信用户
```

**技术栈**：
- **前端**：Lovable 平台（React + Vite + TypeScript）
- **AI 服务**：Lovable AI Gateway（Google Gemini 2.5 Flash）
- **微信服务**：阿里云服务器 + 1Panel + Python Flask
- **数据库**：Lovable Cloud（Supabase）

### 功能特性

✅ 微信用户发送消息 → AI 智能回复  
✅ 支持多轮对话（5分钟内保持上下文）  
✅ 新用户关注自动欢迎  
✅ 完整的错误处理和日志  
✅ **无需配置 API Key**（简化部署）

---

## 方案概述

### 1. 服务器要求

- **云服务商**：阿里云、腾讯云、AWS 等
- **配置**：1核2G 即可（小规模使用）
- **系统**：Ubuntu 20.04 / CentOS 7+ / Debian 10+
- **带宽**：1Mbps 起步
- **费用**：约 50-100 元/月

### 2. 微信公众号要求

- 已认证的微信**服务号**或**订阅号**（需开通开发权限）
- 获取以下信息：
  - AppID（应用ID）
  - AppSecret（应用密钥）
  - Token（自定义令牌）
  - EncodingAESKey（消息加密密钥）

### 3. Lovable Edge Function URL

你的 Lovable 项目已创建 `wechat-chat` Edge Function：

```
https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/wechat-chat
```

---

## 准备工作

### 1. 服务器要求

- **云服务商**：阿里云、腾讯云、AWS 等
- **配置**：1核2G 即可（小规模使用）
- **系统**：Ubuntu 20.04 / CentOS 7+ / Debian 10+
- **带宽**：1Mbps 起步
- **费用**：约 50-100 元/月

### 2. 微信公众号要求

- 已认证的微信**服务号**或**订阅号**（需开通开发权限）
- 获取以下信息：
  - AppID（应用ID）
  - AppSecret（应用密钥）
  - Token（自定义令牌）
  - EncodingAESKey（消息加密密钥）

### 3. Lovable Edge Function URL

你的 Lovable 项目已创建 `wechat-chat` Edge Function：

```
https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/wechat-chat
```

---

## 手动部署步骤

> **提示**：如果您已使用一键部署脚本，可以跳过本章节。

### 步骤 1：登录服务器

使用 SSH 连接到阿里云服务器：

```bash
ssh root@你的服务器IP
```

### 步骤 2：安装 1Panel（如未安装）

```bash
# 执行官方一键安装脚本
curl -sSL https://resource.fit2cloud.com/1panel/package/quick_start.sh -o quick_start.sh && bash quick_start.sh

# 安装完成后访问
# http://你的服务器IP:端口（默认端口在安装时显示）
```

### 步骤 3：创建项目目录

```bash
# 创建项目目录
mkdir -p /opt/wechat-bot
cd /opt/wechat-bot

# 创建日志目录
mkdir -p logs
```

### 步骤 4：创建 Python 服务文件

#### 4.1 创建主服务文件

```bash
cat > wechat_bot.py << 'EOF'
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, request
from flask_cors import CORS
import requests
import hashlib
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
import logging

app = Flask(__name__)
CORS(app)

# ================== 配置区域 ==================

# 微信公众号配置（需要修改）
WECHAT_TOKEN = "你的微信Token"  # 在微信公众平台设置的 Token
WECHAT_APPID = "你的AppID"
WECHAT_APPSECRET = "你的AppSecret"

# Lovable AI 端点（无需 API Key）
LOVABLE_WECHAT_API = "https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/wechat-chat"

# 对话历史缓存（内存存储，5分钟有效期）
conversation_cache = {}
CACHE_EXPIRE_MINUTES = 5

# ================== 日志配置 ==================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('logs/wechat_bot.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# ================== 工具函数 ==================

def verify_signature(signature, timestamp, nonce):
    """验证微信服务器签名"""
    tmp_list = [WECHAT_TOKEN, timestamp, nonce]
    tmp_list.sort()
    tmp_str = ''.join(tmp_list)
    tmp_sha1 = hashlib.sha1(tmp_str.encode('utf-8')).hexdigest()
    return tmp_sha1 == signature

def parse_xml(xml_data):
    """解析微信 XML 消息"""
    try:
        root = ET.fromstring(xml_data)
        msg = {}
        for child in root:
            msg[child.tag] = child.text
        return msg
    except Exception as e:
        logging.error(f"XML 解析失败: {e}")
        return None

def create_text_response(to_user, from_user, content):
    """创建文本消息 XML 响应"""
    return f"""<xml>
<ToUserName><![CDATA[{to_user}]]></ToUserName>
<FromUserName><![CDATA[{from_user}]]></FromUserName>
<CreateTime>{int(time.time())}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[{content}]]></Content>
</xml>"""

def get_conversation_history(openid):
    """获取用户对话历史"""
    now = datetime.now()
    if openid in conversation_cache:
        history, last_time = conversation_cache[openid]
        # 检查是否过期
        if now - last_time < timedelta(minutes=CACHE_EXPIRE_MINUTES):
            return history
        else:
            # 过期则清空
            del conversation_cache[openid]
    return []

def save_conversation_history(openid, history):
    """保存用户对话历史"""
    conversation_cache[openid] = (history, datetime.now())
    # 清理过期缓存
    now = datetime.now()
    expired_keys = [
        k for k, (_, last_time) in conversation_cache.items()
        if now - last_time >= timedelta(minutes=CACHE_EXPIRE_MINUTES)
    ]
    for k in expired_keys:
        del conversation_cache[k]

def get_ai_response(user_message, openid):
    """调用 Lovable AI 获取回复（无需 API Key）"""
    try:
        # 获取对话历史
        history = get_conversation_history(openid)
        
        # 调用 Lovable AI
        response = requests.post(
            LOVABLE_WECHAT_API,
            json={
                "message": user_message,
                "openid": openid,
                "history": history
            },
            headers={'Content-Type': 'application/json'},
            timeout=25
        )
        
        if response.status_code == 200:
            data = response.json()
            reply = data.get('reply', '抱歉，我没有理解您的问题 😅')
            
            # 更新对话历史（最多保留最近 10 轮）
            history.append({"role": "user", "content": user_message})
            history.append({"role": "assistant", "content": reply})
            if len(history) > 20:  # 10 轮对话 = 20 条消息
                history = history[-20:]
            save_conversation_history(openid, history)
            
            return reply
        else:
            logging.error(f"AI 调用失败: {response.status_code} - {response.text}")
            return "抱歉，服务暂时不可用，请稍后再试 🙏"
            
    except requests.exceptions.Timeout:
        logging.error("AI 调用超时")
        return "思考时间有点长，请稍后再试 🤔"
    except Exception as e:
        logging.error(f"AI 调用异常: {e}")
        return "抱歉，出现了一些问题，请稍后再试 😅"

# ================== 路由处理 ==================

@app.route('/wechat', methods=['GET', 'POST'])
def wechat():
    """微信服务器接入点"""
    
    # GET 请求 - 服务器验证
    if request.method == 'GET':
        signature = request.args.get('signature', '')
        timestamp = request.args.get('timestamp', '')
        nonce = request.args.get('nonce', '')
        echostr = request.args.get('echostr', '')
        
        if verify_signature(signature, timestamp, nonce):
            logging.info("✅ 微信服务器验证成功")
            return echostr
        else:
            logging.warning("❌ 微信服务器验证失败")
            return 'Invalid signature', 403
    
    # POST 请求 - 消息处理
    elif request.method == 'POST':
        xml_data = request.data
        msg = parse_xml(xml_data)
        
        if not msg:
            return 'Invalid XML', 400
        
        msg_type = msg.get('MsgType', '')
        from_user = msg.get('FromUserName', '')
        to_user = msg.get('ToUserName', '')
        
        logging.info(f"收到消息 [{msg_type}] 来自用户: {from_user}")
        
        # 处理文本消息
        if msg_type == 'text':
            user_message = msg.get('Content', '').strip()
            logging.info(f"用户消息: {user_message}")
            
            # 调用 AI 获取回复
            ai_reply = get_ai_response(user_message, from_user)
            logging.info(f"AI 回复: {ai_reply}")
            
            return create_text_response(from_user, to_user, ai_reply)
        
        # 处理关注事件
        elif msg_type == 'event':
            event = msg.get('Event', '')
            if event == 'subscribe':
                welcome_msg = """欢迎关注！👋

我是您的 AI 助手，有任何问题都可以问我哦！

试试问我：
• 今天天气怎么样？
• 给我讲个笑话
• 如何学习 Python？

期待与您的对话！😊"""
                logging.info(f"新用户关注: {from_user}")
                return create_text_response(from_user, to_user, welcome_msg)
        
        # 其他消息类型暂不处理
        return 'success'

@app.route('/health', methods=['GET'])
def health():
    """健康检查端点"""
    return {
        'status': 'ok',
        'service': 'wechat-bot',
        'timestamp': datetime.now().isoformat(),
        'conversations_cached': len(conversation_cache)
    }

@app.route('/', methods=['GET'])
def index():
    """首页"""
    return """
    <h1>微信公众号 AI 助手</h1>
    <p>服务运行中...</p>
    <p>对话缓存数量: {}</p>
    <p><a href="/health">健康检查</a></p>
    """.format(len(conversation_cache))

# ================== 启动服务 ==================

if __name__ == '__main__':
    logging.info("=" * 50)
    logging.info("🚀 微信公众号 AI 助手启动中...")
    logging.info("=" * 50)
    app.run(host='0.0.0.0', port=3000, debug=False)
EOF
```

#### 4.2 创建依赖文件

```bash
cat > requirements.txt << 'EOF'
Flask==3.0.0
flask-cors==4.0.0
requests==2.31.0
gunicorn==21.2.0
EOF
```

#### 4.3 创建启动脚本

```bash
cat > start.sh << 'EOF'
#!/bin/bash

echo "🔧 安装 Python 依赖..."
pip3 install -r requirements.txt

echo "🚀 启动微信 Bot 服务..."
nohup gunicorn -w 4 -b 0.0.0.0:3000 --timeout 120 wechat_bot:app > logs/gunicorn.log 2>&1 &
echo $! > wechat_bot.pid

sleep 2

if [ -f wechat_bot.pid ]; then
    PID=$(cat wechat_bot.pid)
    if ps -p $PID > /dev/null; then
        echo "✅ 服务启动成功！PID: $PID"
        PUBLIC_IP=$(curl -s ifconfig.me || echo "无法获取")
        echo "📍 服务器地址: http://$PUBLIC_IP:3000"
        echo "🔗 微信回调 URL: http://$PUBLIC_IP:3000/wechat"
    else
        echo "❌ 服务启动失败，请查看日志"
        cat logs/gunicorn.log
    fi
else
    echo "❌ 无法创建 PID 文件"
fi
EOF

chmod +x start.sh
```

### 步骤 5：修改配置

编辑 `wechat_bot.py`，修改以下配置：

```bash
nano wechat_bot.py
```

修改这三行：

```python
WECHAT_TOKEN = "你的微信Token"        # 改成你的 Token
WECHAT_APPID = "你的AppID"           # 改成你的 AppID
WECHAT_APPSECRET = "你的AppSecret"   # 改成你的 AppSecret
```

按 `Ctrl + X`，然后按 `Y`，最后按 `Enter` 保存。

### 步骤 6：安装依赖并启动

```bash
# 安装 Python 3 和 pip（如未安装）
sudo apt update
sudo apt install python3 python3-pip -y

# 启动服务
./start.sh
```

### 步骤 7：配置防火墙

```bash
# Ubuntu/Debian (使用 ufw)
sudo ufw allow 3000/tcp
sudo ufw reload

# CentOS (使用 firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

**阿里云安全组**：
1. 登录阿里云控制台
2. 找到你的服务器实例
3. 点击"安全组配置"
4. 添加规则：
   - 端口范围：3000/3000
   - 授权对象：0.0.0.0/0
   - 协议类型：TCP

### 步骤 8：配置微信公众号

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入"设置与开发" → "基本配置"
3. 填写服务器配置：
   - **URL**：`http://你的服务器IP:3000/wechat`
   - **Token**：与 `wechat_bot.py` 中的 `WECHAT_TOKEN` 一致
   - **EncodingAESKey**：点击"随机生成"
   - **消息加解密方式**：明文模式（简单测试）或安全模式
4. 点击"提交"，等待验证通过

---

## 代码文件

### 完整文件列表

```
/opt/wechat-bot/
├── wechat_bot.py         # 主服务文件
├── requirements.txt      # Python 依赖
├── start.sh             # 启动脚本
├── logs/                # 日志目录
│   ├── wechat_bot.log
│   └── gunicorn.log
└── wechat_bot.pid       # 进程 ID 文件
```

### 管理命令

```bash
# 查看服务状态
ps aux | grep wechat_bot

# 查看日志
tail -f logs/wechat_bot.log
tail -f logs/gunicorn.log

# 停止服务
kill $(cat wechat_bot.pid)

# 重启服务
kill $(cat wechat_bot.pid) && ./start.sh
```

---

## 常见问题

### 1. 微信验证失败

**问题**：配置服务器 URL 时提示"token 验证失败"

**解决**：
- 检查 `WECHAT_TOKEN` 是否与微信公众号后台一致
- 确认服务器端口 3000 已开放
- 查看日志：`tail -f logs/wechat_bot.log`
- 测试服务：`curl http://localhost:3000/health`

### 2. AI 回复超时

**问题**：用户发送消息后长时间无回复

**解决**：
- Lovable AI 有调用限制，检查是否触发 429 错误
- 检查网络连接：`curl -I https://vlsuzskvykddwrxbmcbu.supabase.co`
- 增加 gunicorn 超时时间：`--timeout 180`

### 3. 服务意外停止

**问题**：服务运行一段时间后自动停止

**解决**：
- 检查服务器内存：`free -m`
- 减少 gunicorn worker 数量：`-w 2`
- 使用 systemd 管理服务（见下方）

### 4. 使用 systemd 管理服务（推荐）

```bash
# 创建 systemd 服务文件
sudo cat > /etc/systemd/system/wechat-bot.service << 'EOF'
[Unit]
Description=WeChat AI Bot Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/wechat-bot
ExecStart=/usr/bin/gunicorn -w 4 -b 0.0.0.0:3000 --timeout 120 wechat_bot:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable wechat-bot
sudo systemctl start wechat-bot

# 查看服务状态
sudo systemctl status wechat-bot

# 查看日志
sudo journalctl -u wechat-bot -f
```

---

## 测试验证

### 1. 本地测试

```bash
# 测试健康检查
curl http://localhost:3000/health

# 测试首页
curl http://localhost:3000/

# 测试 AI 调用（模拟请求）
curl -X POST http://localhost:3000/test-ai \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "openid": "test_user"}'
```

### 2. 微信测试

1. 关注你的微信公众号
2. 发送消息"你好"
3. 应该收到 AI 的智能回复
4. 继续对话，测试上下文记忆（5分钟内有效）

### 3. 日志监控

```bash
# 实时查看应用日志
tail -f logs/wechat_bot.log

# 实时查看 Gunicorn 日志
tail -f logs/gunicorn.log

# 搜索错误日志
grep ERROR logs/wechat_bot.log
```

---

## 性能优化建议

### 1. 使用 Redis 缓存对话历史

当前实现使用内存缓存，服务重启后对话历史会丢失。生产环境建议使用 Redis：

```bash
# 安装 Redis
sudo apt install redis-server -y

# 修改 wechat_bot.py，使用 redis-py
pip3 install redis
```

### 2. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 启用 HTTPS

```bash
# 使用 Let's Encrypt 免费证书
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

---

## 总结

✅ **已完成的功能**：
- 微信用户发送消息 → AI 智能回复
- 支持多轮对话（5分钟上下文记忆）
- 新用户关注自动欢迎
- 完整的错误处理和日志
- **无需配置 API Key**（极简部署）

🚀 **下一步优化**：
- 使用 Redis 持久化对话历史
- 配置 HTTPS 提升安全性
- 添加更多消息类型支持（图片、语音等）
- 集成数据库记录用户行为分析

📞 **需要帮助？**
- 查看日志：`tail -f logs/wechat_bot.log`
- 测试健康：`curl http://localhost:3000/health`
- Lovable AI 文档：https://docs.lovable.dev/
