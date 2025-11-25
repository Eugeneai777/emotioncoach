#!/bin/bash

# 微信API代理服务器 (Python版) - 部署脚本

set -e

echo "========================================"
echo "  微信API代理服务器 (Python版) - 部署"
echo "========================================"
echo ""

# 检查 Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未安装 Python 3"
    echo "请先安装 Python 3.8 或更高版本"
    exit 1
fi

echo "✅ Python 版本: $(python3 --version)"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "请先复制 .env.example 为 .env 并配置"
    exit 1
fi

# 检查 PROXY_AUTH_TOKEN
source .env
if [ -z "$PROXY_AUTH_TOKEN" ]; then
    echo "❌ 错误: PROXY_AUTH_TOKEN 未设置"
    echo "请运行: ./scripts/generate-token.sh"
    exit 1
fi

if [ -z "$EDGE_FUNCTION_URL" ]; then
    echo "⚠️  警告: EDGE_FUNCTION_URL 未设置"
    echo "微信回调功能将无法使用"
fi

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "🔧 创建 Python 虚拟环境..."
    python3 -m venv venv
    echo "✅ 虚拟环境创建成功"
fi

# 激活虚拟环境
echo "🔄 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📦 安装 Python 依赖..."
pip install -r requirements.txt
echo "✅ 依赖安装完成"
echo ""

# 停止旧服务
echo "🔄 检查现有服务..."
if pgrep -f "gunicorn.*proxy:app" > /dev/null; then
    echo "⏹️  停止现有服务..."
    pkill -f "gunicorn.*proxy:app" || true
    sleep 2
fi

# 启动服务
echo "🚀 启动服务..."
nohup gunicorn -w 4 -b 0.0.0.0:${PORT:-3000} proxy:app > logs/gunicorn.log 2>&1 &
echo $! > gunicorn.pid
echo "✅ 服务启动成功 (PID: $(cat gunicorn.pid))"
echo ""

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 测试健康检查
echo "🔍 测试服务..."
if curl -s http://localhost:${PORT:-3000}/health > /dev/null; then
    echo "✅ 服务运行正常"
else
    echo "❌ 服务启动失败"
    echo "请查看日志: tail -f logs/gunicorn.log"
    exit 1
fi
echo ""

# 获取服务器公网IP
echo "🌐 服务器信息:"
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "无法获取")
echo "   公网IP: $PUBLIC_IP"
echo "   代理地址: http://$PUBLIC_IP:${PORT:-3000}"
echo "   健康检查: http://$PUBLIC_IP:${PORT:-3000}/health"
echo "   微信回调: http://$PUBLIC_IP:${PORT:-3000}/wechat-callback"
echo ""

echo "========================================"
echo "  ✅ 部署完成！"
echo "========================================"
echo ""
echo "📋 后续步骤："
echo "  1. 测试服务："
echo "     curl http://localhost:${PORT:-3000}/health"
echo ""
echo "  2. 配置微信公众平台："
echo "     URL: http://$PUBLIC_IP:${PORT:-3000}/wechat-callback"
echo "     Token: 在 Lovable 应用中设置"
echo "     EncodingAESKey: 在 Lovable 应用中设置"
echo ""
echo "  3. 查看日志："
echo "     tail -f logs/gunicorn.log"
echo ""
echo "  4. 停止服务："
echo "     kill \$(cat gunicorn.pid)"
echo ""
