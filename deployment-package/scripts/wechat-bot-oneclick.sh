#!/bin/bash

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
    OS=$ID
    OS_VERSION=$VERSION_ID
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

echo "📋 检测到操作系统: $OS $OS_VERSION"
echo ""

# 安装 Python3 和相关工具
echo "🔧 步骤 1/8: 安装 Python3 和依赖..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv curl
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    sudo yum install -y python3 python3-pip curl
else
    echo "❌ 不支持的操作系统: $OS"
    exit 1
fi

echo "✅ Python 版本: $(python3 --version)"
echo ""

# 创建项目目录
echo "🔧 步骤 2/8: 创建项目目录..."
PROJECT_DIR="/opt/wechat-bot"
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR
cd $PROJECT_DIR

echo "✅ 项目目录: $PROJECT_DIR"
echo ""

# 创建 Python 代码文件
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
        'history': history[-10:]  # 只保留最近10轮对话
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
        # 获取对话历史
        history = get_conversation_history(openid)
        
        # 调用 Lovable wechat-chat API
        response = requests.post(
            LOVABLE_WECHAT_API,
            json={
                'message': message,
                'openid': openid,
                'history': history
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            reply = data.get('reply', '抱歉，我现在无法回复。')
            
            # 更新对话历史
            new_history = history + [
                {'role': 'user', 'content': message},
                {'role': 'assistant', 'content': reply}
            ]
            save_conversation_history(openid, new_history)
            
            return reply
        else:
            log(f'AI API 错误: {response.status_code} - {response.text}')
            return '抱歉，我现在有点忙，请稍后再试。'
            
    except Exception as e:
        log(f'AI 调用异常: {str(e)}')
        return '抱歉，我现在无法回复，请稍后再试。'

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return {
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'server': 'WeChat Bot (Lovable AI)',
        'version': '1.0.0'
    }

@app.route('/wechat-callback', methods=['GET', 'POST'])
def wechat_callback():
    """微信服务器回调"""
    
    # GET 请求：微信服务器验证
    if request.method == 'GET':
        signature = request.args.get('signature', '')
        timestamp = request.args.get('timestamp', '')
        nonce = request.args.get('nonce', '')
        echostr = request.args.get('echostr', '')
        
        log(f'[验证] signature={signature}, timestamp={timestamp}, nonce={nonce}')
        
        if verify_signature(signature, timestamp, nonce):
            log('[验证] ✅ 签名验证成功')
            return echostr
        else:
            log('[验证] ❌ 签名验证失败')
            return 'Invalid signature', 403
    
    # POST 请求：处理用户消息
    elif request.method == 'POST':
        signature = request.args.get('signature', '')
        timestamp = request.args.get('timestamp', '')
        nonce = request.args.get('nonce', '')
        
        # 验证签名
        if not verify_signature(signature, timestamp, nonce):
            log('[消息] ❌ 签名验证失败')
            return 'Invalid signature', 403
        
        # 解析 XML 消息
        xml_data = request.data.decode('utf-8')
        msg = parse_xml_message(xml_data)
        
        if not msg:
            return 'success'
        
        msg_type = msg.get('MsgType', '')
        from_user = msg.get('FromUserName', '')
        to_user = msg.get('ToUserName', '')
        
        log(f'[消息] 类型={msg_type}, FromUser={from_user}')
        
        # 处理文本消息
        if msg_type == 'text':
            content = msg.get('Content', '')
            log(f'[消息] 内容: {content}')
            
            # 调用 AI 获取回复
            ai_reply = get_ai_response(content, from_user)
            log(f'[AI 回复] {ai_reply[:50]}...')
            
            # 返回 XML 响应
            response_xml = create_text_response(from_user, to_user, ai_reply)
            return response_xml, 200, {'Content-Type': 'application/xml'}
        
        # 处理关注事件
        elif msg_type == 'event':
            event = msg.get('Event', '')
            if event == 'subscribe':
                welcome_msg = '👋 欢迎关注！我是你的 AI 助手，有任何问题都可以问我哦～'
                response_xml = create_text_response(from_user, to_user, welcome_msg)
                return response_xml, 200, {'Content-Type': 'application/xml'}
        
        return 'success'

@app.before_request
def cleanup():
    """请求前清理过期缓存"""
    clean_expired_cache()

if __name__ == '__main__':
    print('=' * 60)
    print('微信公众号 AI 助手 (Lovable AI)')
    print('=' * 60)
    print(f'微信 Token: {"已配置" if WECHAT_TOKEN else "未配置 ⚠️"}')
    print(f'微信 AppID: {"已配置" if WECHAT_APPID else "未配置"}')
    print(f'微信 AppSecret: {"已配置" if WECHAT_APPSECRET else "未配置"}')
    print(f'Lovable AI API: {LOVABLE_WECHAT_API}')
    print(f'启动时间: {datetime.now().isoformat()}')
    print('=' * 60)
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
    sudo ufw allow $PORT/tcp
    echo "✅ UFW 防火墙已开放端口 $PORT"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=$PORT/tcp
    sudo firewall-cmd --reload
    echo "✅ Firewalld 防火墙已开放端口 $PORT"
else
    echo "⚠️  未检测到防火墙，请手动开放端口 $PORT"
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
User=$USER
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$PROJECT_DIR/venv/bin:/usr/local/bin:/usr/bin:/bin"
EnvironmentFile=$PROJECT_DIR/.env
ExecStart=$PROJECT_DIR/venv/bin/gunicorn -w 4 -b 0.0.0.0:3000 wechat_bot:app
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
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "无法获取")

# 输出配置信息
echo "=========================================="
echo "  ✅ 部署完成！"
echo "=========================================="
echo ""
echo "📋 服务器信息："
echo "  - 项目目录: $PROJECT_DIR"
echo "  - 公网 IP: $PUBLIC_IP"
echo "  - 服务端口: 3000"
echo ""
echo "🔗 微信公众号配置："
echo "  - 服务器地址(URL): http://$PUBLIC_IP:3000/wechat-callback"
echo "  - 令牌(Token): 需要在 .env 中配置"
echo ""
echo "⚙️  下一步操作："
echo ""
echo "  1️⃣  编辑配置文件（必须）："
echo "     sudo nano $PROJECT_DIR/.env"
echo "     # 填入你的微信公众号配置："
echo "     # WECHAT_TOKEN=你的Token"
echo "     # WECHAT_APPID=你的AppID"
echo "     # WECHAT_APPSECRET=你的AppSecret"
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
echo "  6️⃣  在微信公众平台配置："
echo "     - 登录微信公众平台"
echo "     - 基本配置 → 服务器配置"
echo "     - 填入上述 URL 和 Token"
echo "     - 点击提交验证"
echo ""
echo "📚 常用命令："
echo "  - 启动服务: sudo systemctl start wechat-bot"
echo "  - 停止服务: sudo systemctl stop wechat-bot"
echo "  - 重启服务: sudo systemctl restart wechat-bot"
echo "  - 查看状态: sudo systemctl status wechat-bot"
echo "  - 查看日志: sudo journalctl -u wechat-bot -f"
echo ""
echo "🎉 祝您使用愉快！"
echo "=========================================="
