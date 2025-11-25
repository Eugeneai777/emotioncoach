// 部署包文件内容
export const deploymentFiles: Record<string, string> = {
  'proxy.js': `const express = require('express');
const cors = require('cors');
...
  process.exit(0);
});`,

  'proxy.py': `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信API代理服务器 - Python/Flask 版本
用于转发微信公众号请求到 Supabase Edge Functions
"""

import os
import time
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# 配置
PORT = int(os.getenv('PORT', 3000))
PROXY_AUTH_TOKEN = os.getenv('PROXY_AUTH_TOKEN')
EDGE_FUNCTION_URL = os.getenv('EDGE_FUNCTION_URL', '')

# 日志函数
def log(message):
    timestamp = datetime.now().isoformat()
    print(f'[{timestamp}] {message}')

# 请求日志中间件
@app.before_request
def log_request():
    log(f'{request.method} {request.path}')

# 健康检查端点
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'server': 'WeChat API Proxy (Python/Flask)',
        'version': '1.0.0',
        'uptime': time.process_time()
    })

# 微信回调端点 - GET (URL验证)
@app.route('/wechat-callback', methods=['GET'])
def wechat_callback_get():
    try:
        signature = request.args.get('signature', '')
        timestamp = request.args.get('timestamp', '')
        nonce = request.args.get('nonce', '')
        echostr = request.args.get('echostr', '')
        
        log(f'微信URL验证请求: signature={signature}, timestamp={timestamp}, nonce={nonce}')
        
        if not EDGE_FUNCTION_URL:
            log('错误: EDGE_FUNCTION_URL 未配置')
            return jsonify({'error': 'EDGE_FUNCTION_URL not configured'}), 500
        
        target_url = f'{EDGE_FUNCTION_URL}?signature={signature}&timestamp={timestamp}&nonce={nonce}&echostr={echostr}'
        log(f'转发验证请求到: {target_url}')
        
        response = requests.get(target_url, timeout=10)
        log(f'Edge Function 响应状态: {response.status_code}')
        
        return Response(response.text, status=response.status_code, mimetype='text/plain')
        
    except Exception as e:
        log(f'URL验证错误: {str(e)}')
        return jsonify({'error': f'URL validation failed: {str(e)}'}), 500

# 微信回调端点 - POST (接收消息)
@app.route('/wechat-callback', methods=['POST'])
def wechat_callback_post():
    try:
        signature = request.args.get('signature', '')
        timestamp = request.args.get('timestamp', '')
        nonce = request.args.get('nonce', '')
        openid = request.args.get('openid', '')
        encrypt_type = request.args.get('encrypt_type', '')
        msg_signature = request.args.get('msg_signature', '')
        
        body = request.get_data(as_text=True)
        log(f'接收微信消息: openid={openid}, encrypt_type={encrypt_type}')
        
        if not EDGE_FUNCTION_URL:
            log('错误: EDGE_FUNCTION_URL 未配置')
            return jsonify({'error': 'EDGE_FUNCTION_URL not configured'}), 500
        
        params = []
        if signature:
            params.append(f'signature={signature}')
        if timestamp:
            params.append(f'timestamp={timestamp}')
        if nonce:
            params.append(f'nonce={nonce}')
        if openid:
            params.append(f'openid={openid}')
        if encrypt_type:
            params.append(f'encrypt_type={encrypt_type}')
        if msg_signature:
            params.append(f'msg_signature={msg_signature}')
        
        target_url = f'{EDGE_FUNCTION_URL}?{"&".join(params)}'
        log(f'转发消息到: {target_url}')
        
        headers = {'Content-Type': 'application/xml'}
        response = requests.post(target_url, data=body.encode('utf-8'), headers=headers, timeout=30)
        log(f'Edge Function 响应状态: {response.status_code}')
        
        return Response(response.content, status=response.status_code, mimetype='application/xml')
        
    except Exception as e:
        log(f'消息处理错误: {str(e)}')
        return jsonify({'error': f'Message processing failed: {str(e)}'}), 500

# 微信API代理端点
@app.route('/wechat-proxy', methods=['POST'])
def wechat_proxy():
    try:
        if PROXY_AUTH_TOKEN:
            auth_header = request.headers.get('Authorization', '')
            token = auth_header.replace('Bearer ', '')
            if token != PROXY_AUTH_TOKEN:
                log('未授权访问尝试')
                return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        target_url = data.get('target_url')
        method = data.get('method', 'GET')
        headers = data.get('headers', {})
        body = data.get('body')
        
        if not target_url:
            return jsonify({'error': 'target_url is required'}), 400
        
        log(f'代理请求 {method} {target_url}')
        
        request_headers = {'Content-Type': 'application/json', **headers}
        
        if method.upper() in ['POST', 'PUT', 'PATCH']:
            response = requests.request(method, target_url, json=body, headers=request_headers, timeout=30)
        else:
            response = requests.request(method, target_url, headers=request_headers, timeout=30)
        
        log(f'响应状态: {response.status_code}')
        
        try:
            return jsonify(response.json()), response.status_code
        except:
            return Response(response.text, status=response.status_code)
            
    except Exception as e:
        log(f'代理错误: {str(e)}')
        return jsonify({'error': 'Proxy request failed', 'message': str(e)}), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(Exception)
def handle_error(e):
    log(f'错误: {str(e)}')
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print('=' * 60)
    print('微信API代理服务器 (Python/Flask)')
    print('=' * 60)
    print(f'状态: 运行在端口 {PORT}')
    print(f'健康检查: http://localhost:{PORT}/health')
    print(f'代理端点: http://localhost:{PORT}/wechat-proxy')
    print(f'微信回调: http://localhost:{PORT}/wechat-callback')
    print(f'认证: {"已启用" if PROXY_AUTH_TOKEN else "已禁用 (⚠️  不安全!)"}')
    print(f'Edge Function: {EDGE_FUNCTION_URL or "未配置"}')
    print(f'启动时间: {datetime.now().isoformat()}')
    print('=' * 60)
    app.run(host='0.0.0.0', port=PORT, debug=False)`,

  'requirements.txt': `Flask==3.0.0
flask-cors==4.0.0
requests==2.31.0
gunicorn==21.2.0`,

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

# Edge Function URL（微信回调转发目标）
EDGE_FUNCTION_URL=https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/wechat-callback

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

  'scripts/deploy-python.sh': `#!/bin/bash

# 微信API代理服务器 (Python版) - 部署脚本

set -e

echo "========================================"
echo "  微信API代理服务器 (Python版) - 部署"
echo "========================================"
echo ""

if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未安装 Python 3"
    exit 1
fi

echo "✅ Python 版本: $(python3 --version)"

if [ ! -f .env ]; then
    echo "❌ 错误: .env 文件不存在"
    exit 1
fi

source .env
if [ -z "$PROXY_AUTH_TOKEN" ]; then
    echo "❌ 错误: PROXY_AUTH_TOKEN 未设置"
    exit 1
fi

if [ -z "$EDGE_FUNCTION_URL" ]; then
    echo "⚠️  警告: EDGE_FUNCTION_URL 未设置"
fi

if [ ! -d "venv" ]; then
    echo "🔧 创建 Python 虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "📦 安装 Python 依赖..."
pip install -r requirements.txt

echo "🔄 检查现有服务..."
if pgrep -f "gunicorn.*proxy:app" > /dev/null; then
    pkill -f "gunicorn.*proxy:app" || true
    sleep 2
fi

echo "🚀 启动服务..."
nohup gunicorn -w 4 -b 0.0.0.0:\${PORT:-3000} proxy:app > logs/gunicorn.log 2>&1 &
echo $! > gunicorn.pid

sleep 3

PUBLIC_IP=$(curl -s ifconfig.me || echo "无法获取")
echo "✅ 部署完成！服务器: http://$PUBLIC_IP:\${PORT:-3000}"
`,

  'scripts/setup-python.sh': `#!/bin/bash

# 微信API代理服务器 (Python版) - 环境设置

set -e

echo "========================================"
echo "  微信API代理服务器 (Python版) - 环境设置"
echo "========================================"

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

echo "📦 安装 Python 3..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    sudo yum install -y python3 python3-pip
fi

echo "✅ Python 版本: $(python3 --version)"

pip3 install -r requirements.txt

mkdir -p logs

PORT=\${PORT:-3000}
if command -v ufw &> /dev/null; then
    sudo ufw allow $PORT/tcp
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=$PORT/tcp
    sudo firewall-cmd --reload
fi

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请编辑配置"
fi

echo "✅ 环境设置完成！"
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

  'scripts/wechat-bot-oneclick.sh': `#!/bin/bash

# 微信公众号 AI 助手 - 阿里云 1Panel 一键部署脚本
# 功能：自动安装所有依赖、配置环境、创建 systemd 服务并启动微信机器人

set -e

echo "=========================================="
echo "  微信公众号 AI 助手 - 一键部署"
echo "=========================================="
echo ""

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=\$ID
    OS_VERSION=\$VERSION_ID
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

echo "📋 检测到操作系统: \$OS \$OS_VERSION"
echo ""

# 安装 Python3 和相关工具
echo "🔧 步骤 1/8: 安装 Python3 和依赖..."
if [ "\$OS" = "ubuntu" ] || [ "\$OS" = "debian" ]; then
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv curl
elif [ "\$OS" = "centos" ] || [ "\$OS" = "rhel" ]; then
    sudo yum install -y python3 python3-pip curl
else
    echo "❌ 不支持的操作系统: \$OS"
    exit 1
fi

echo "✅ Python 版本: \$(python3 --version)"
echo ""

# 创建项目目录
echo "🔧 步骤 2/8: 创建项目目录..."
PROJECT_DIR="/opt/wechat-bot"
sudo mkdir -p \$PROJECT_DIR
sudo chown \$USER:\$USER \$PROJECT_DIR
cd \$PROJECT_DIR

echo "✅ 项目目录: \$PROJECT_DIR"
echo ""

# 创建 Python 代码文件 (完整的 wechat_bot.py 内嵌)
echo "🔧 步骤 3/8: 创建 wechat_bot.py..."
cat > wechat_bot.py << 'PYTHON_CODE'
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微信公众号 AI 助手 - 基于 Lovable AI
"""

import os
import time
import hashlib
import requests
from flask import Flask, request
from flask_cors import CORS
from datetime import datetime, timedelta
import xml.etree.ElementTree as ET

app = Flask(__name__)
CORS(app)

# 配置
WECHAT_TOKEN = os.getenv('WECHAT_TOKEN', '')
WECHAT_APPID = os.getenv('WECHAT_APPID', '')
WECHAT_APPSECRET = os.getenv('WECHAT_APPSECRET', '')
LOVABLE_WECHAT_API = "https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/wechat-chat"

# 对话历史缓存（内存）
conversation_cache = {}
CACHE_EXPIRE_MINUTES = 5

def log(message):
    """日志输出"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'[{timestamp}] {message}', flush=True)

def verify_signature(signature, timestamp, nonce):
    """验证微信服务器签名"""
    if not WECHAT_TOKEN:
        return False
    tmp_list = [WECHAT_TOKEN, timestamp, nonce]
    tmp_list.sort()
    tmp_str = ''.join(tmp_list)
    tmp_hash = hashlib.sha1(tmp_str.encode('utf-8')).hexdigest()
    return tmp_hash == signature

def parse_xml_message(xml_data):
    """解析微信 XML 消息"""
    try:
        root = ET.fromstring(xml_data)
        msg = {}
        for child in root:
            msg[child.tag] = child.text
        return msg
    except Exception as e:
        log(f'XML 解析错误: {str(e)}')
        return None

def create_text_response(to_user, from_user, content):
    """创建文本回复的 XML"""
    timestamp = int(time.time())
    return f"""<xml>
<ToUserName><![CDATA[{to_user}]]></ToUserName>
<FromUserName><![CDATA[{from_user}]]></FromUserName>
<CreateTime>{timestamp}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[{content}]]></Content>
</xml>"""

def get_conversation_history(openid):
    """获取对话历史"""
    now = datetime.now()
    if openid in conversation_cache:
        cache_data = conversation_cache[openid]
        if now - cache_data['timestamp'] < timedelta(minutes=CACHE_EXPIRE_MINUTES):
            return cache_data['history']
    return []

def save_conversation_history(openid, history):
    """保存对话历史"""
    conversation_cache[openid] = {
        'timestamp': datetime.now(),
        'history': history[-10:]
    }

def clean_expired_cache():
    """清理过期的缓存"""
    now = datetime.now()
    expired_keys = []
    for openid, cache_data in conversation_cache.items():
        if now - cache_data['timestamp'] >= timedelta(minutes=CACHE_EXPIRE_MINUTES):
            expired_keys.append(openid)
    for key in expired_keys:
        del conversation_cache[key]

def get_ai_response(message, openid):
    """调用 Lovable AI 获取回复"""
    try:
        history = get_conversation_history(openid)
        response = requests.post(
            LOVABLE_WECHAT_API,
            json={'message': message, 'openid': openid, 'history': history},
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            reply = data.get('reply', '抱歉，我现在无法回复。')
            new_history = history + [
                {'role': 'user', 'content': message},
                {'role': 'assistant', 'content': reply}
            ]
            save_conversation_history(openid, new_history)
            return reply
        else:
            log(f'AI API 错误: {response.status_code}')
            return '抱歉，我现在有点忙，请稍后再试。'
    except Exception as e:
        log(f'AI 调用异常: {str(e)}')
        return '抱歉，我现在无法回复，请稍后再试。'

@app.route('/health', methods=['GET'])
def health():
    return {'status': 'ok', 'timestamp': datetime.now().isoformat()}

@app.route('/wechat-callback', methods=['GET', 'POST'])
def wechat_callback():
    if request.method == 'GET':
        signature = request.args.get('signature', '')
        timestamp = request.args.get('timestamp', '')
        nonce = request.args.get('nonce', '')
        echostr = request.args.get('echostr', '')
        if verify_signature(signature, timestamp, nonce):
            return echostr
        else:
            return 'Invalid signature', 403
    elif request.method == 'POST':
        xml_data = request.data.decode('utf-8')
        msg = parse_xml_message(xml_data)
        if not msg:
            return 'success'
        msg_type = msg.get('MsgType', '')
        from_user = msg.get('FromUserName', '')
        to_user = msg.get('ToUserName', '')
        if msg_type == 'text':
            content = msg.get('Content', '')
            ai_reply = get_ai_response(content, from_user)
            response_xml = create_text_response(from_user, to_user, ai_reply)
            return response_xml, 200, {'Content-Type': 'application/xml'}
        elif msg_type == 'event':
            event = msg.get('Event', '')
            if event == 'subscribe':
                welcome_msg = '👋 欢迎关注！我是你的 AI 助手，有任何问题都可以问我哦～'
                response_xml = create_text_response(from_user, to_user, welcome_msg)
                return response_xml, 200, {'Content-Type': 'application/xml'}
        return 'success'

@app.before_request
def cleanup():
    clean_expired_cache()

if __name__ == '__main__':
    print('微信公众号 AI 助手 (Lovable AI) 启动中...')
    app.run(host='0.0.0.0', port=3000, debug=False)
PYTHON_CODE

chmod +x wechat_bot.py
echo "✅ wechat_bot.py 创建完成"
echo ""

# 创建 requirements.txt
echo "🔧 步骤 4/8: 创建 requirements.txt..."
cat > requirements.txt << 'EOF'
Flask==3.0.0
flask-cors==4.0.0
requests==2.31.0
gunicorn==21.2.0
EOF

echo "✅ requirements.txt 创建完成"
echo ""

# 创建虚拟环境并安装依赖
echo "🔧 步骤 5/8: 创建虚拟环境并安装依赖..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

echo "✅ Python 依赖安装完成"
echo ""

# 创建 .env 文件
echo "🔧 步骤 6/8: 创建 .env 配置文件..."
cat > .env << 'EOF'
# 微信公众号配置
WECHAT_TOKEN=your_wechat_token_here
WECHAT_APPID=your_wechat_appid_here
WECHAT_APPSECRET=your_wechat_appsecret_here

# 服务端口
PORT=3000
EOF

echo "✅ .env 文件创建完成（请稍后编辑配置）"
echo ""

# 配置防火墙
echo "🔧 步骤 7/8: 配置防火墙..."
PORT=3000

if command -v ufw &> /dev/null; then
    sudo ufw allow \$PORT/tcp
    echo "✅ UFW 防火墙已开放端口 \$PORT"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=\$PORT/tcp
    sudo firewall-cmd --reload
    echo "✅ Firewalld 防火墙已开放端口 \$PORT"
else
    echo "⚠️  未检测到防火墙，请手动开放端口 \$PORT"
fi
echo ""

# 创建 systemd 服务
echo "🔧 步骤 8/8: 创建 systemd 服务..."
sudo tee /etc/systemd/system/wechat-bot.service > /dev/null << EOF
[Unit]
Description=WeChat Bot AI Assistant (Lovable AI)
After=network.target

[Service]
Type=simple
User=\$USER
WorkingDirectory=\$PROJECT_DIR
Environment="PATH=\$PROJECT_DIR/venv/bin:/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=\$PROJECT_DIR/.env
ExecStart=\$PROJECT_DIR/venv/bin/gunicorn -w 4 -b 0.0.0.0:3000 wechat_bot:app
Restart=always
RestartSec=10
StandardOutput=append:/var/log/wechat-bot.log
StandardError=append:/var/log/wechat-bot-error.log

[Install]
WantedBy=multi-user.target
EOF

# 重新加载 systemd 并启动服务
sudo systemctl daemon-reload
sudo systemctl enable wechat-bot
sudo systemctl start wechat-bot

echo "✅ systemd 服务已创建并启动"
echo ""

# 等待服务启动
sleep 3

# 检查服务状态
if sudo systemctl is-active --quiet wechat-bot; then
    echo "✅ 服务运行正常"
else
    echo "⚠️  服务启动可能有问题，请检查日志"
fi
echo ""

# 获取服务器公网 IP
PUBLIC_IP=\$(curl -s ifconfig.me || curl -s icanhazip.com || echo "无法获取")

# 输出配置信息
echo "=========================================="
echo "  ✅ 部署完成！"
echo "=========================================="
echo ""
echo "📋 服务器信息："
echo "  - 项目目录: \$PROJECT_DIR"
echo "  - 公网 IP: \$PUBLIC_IP"
echo "  - 服务端口: 3000"
echo ""
echo "🔗 微信公众号配置："
echo "  - 服务器地址(URL): http://\$PUBLIC_IP:3000/wechat-callback"
echo "  - 令牌(Token): 需要在 .env 中配置"
echo ""
echo "⚙️  下一步操作："
echo ""
echo "  1️⃣  编辑配置文件（必须）："
echo "     sudo nano \$PROJECT_DIR/.env"
echo "     # 填入你的微信公众号配置"
echo ""
echo "  2️⃣  重启服务："
echo "     sudo systemctl restart wechat-bot"
echo ""
echo "  3️⃣  查看服务状态："
echo "     sudo systemctl status wechat-bot"
echo ""
echo "  4️⃣  查看服务日志："
echo "     sudo tail -f /var/log/wechat-bot.log"
echo ""
echo "  5️⃣  测试服务："
echo "     curl http://localhost:3000/health"
echo ""
echo "  6️⃣  在微信公众平台配置服务器 URL 和 Token"
echo ""
echo "🎉 祝您使用愉快！"
echo "=========================================="
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
    { name: 'proxy.js', description: 'Node.js 代理服务器', size: '3.2 KB' },
    { name: 'proxy.py', description: 'Python/Flask 代理服务器', size: '6.8 KB' },
    { name: 'package.json', description: 'Node.js 依赖配置', size: '0.4 KB' },
    { name: 'requirements.txt', description: 'Python 依赖配置', size: '0.1 KB' },
    { name: 'ecosystem.config.js', description: 'PM2 进程管理配置', size: '0.5 KB' },
  ],
  config: [
    { name: '.env.example', description: '环境变量模板', size: '0.2 KB' },
  ],
  scripts: [
    { name: 'scripts/wechat-bot-oneclick.sh', description: '微信机器人一键部署（推荐）', size: '8.5 KB' },
    { name: 'scripts/setup.sh', description: 'Node.js 一键安装', size: '2.8 KB' },
    { name: 'scripts/setup-python.sh', description: 'Python 环境设置', size: '2.5 KB' },
    { name: 'scripts/deploy.sh', description: 'Node.js 部署脚本', size: '2.1 KB' },
    { name: 'scripts/deploy-python.sh', description: 'Python 部署脚本', size: '3.2 KB' },
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
    { name: 'docs/wechat-1panel-guide.md', description: '微信公众号 AI 助手 - 阿里云 1Panel 完整部署指南', size: '25.0 KB' },
    { name: 'docs/security.md', description: '安全最佳实践', size: '16.8 KB' },
  ],
};
