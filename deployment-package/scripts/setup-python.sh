#!/bin/bash

# 微信API代理服务器 (Python版) - 环境设置脚本

set -e

echo "========================================"
echo "  微信API代理服务器 (Python版) - 环境设置"
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

# 安装 Python 3
echo "📦 安装 Python 3..."
if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv
elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
    sudo yum install -y python3 python3-pip
else
    echo "⚠️  未识别的操作系统，请手动安装 Python 3"
fi

echo "✅ Python 版本: $(python3 --version)"
echo ""

# 安装项目依赖
echo "📦 安装项目依赖..."
pip3 install -r requirements.txt
echo "✅ 依赖安装完成"
echo ""

# 创建日志目录
echo "📁 创建日志目录..."
mkdir -p logs
echo "✅ 日志目录创建完成"
echo ""

# 配置防火墙
echo "🔧 配置防火墙..."
PORT=${PORT:-3000}

if command -v ufw &> /dev/null; then
    echo "检测到 UFW 防火墙"
    sudo ufw allow $PORT/tcp
    echo "✅ 已开放端口 $PORT"
elif command -v firewall-cmd &> /dev/null; then
    echo "检测到 firewalld 防火墙"
    sudo firewall-cmd --permanent --add-port=$PORT/tcp
    sudo firewall-cmd --reload
    echo "✅ 已开放端口 $PORT"
else
    echo "⚠️  未检测到防火墙，请手动配置开放端口 $PORT"
fi
echo ""

# 配置环境变量
echo "🔧 配置环境变量..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
    echo "⚠️  请编辑 .env 文件并设置必要的环境变量"
    echo ""
    echo "必需配置："
    echo "  - PROXY_AUTH_TOKEN: 运行 ./scripts/generate-token.sh 生成"
    echo "  - EDGE_FUNCTION_URL: https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/wechat-callback"
    echo ""
else
    echo "✅ .env 文件已存在"
fi

echo "========================================"
echo "  ✅ 环境设置完成！"
echo "========================================"
echo ""
echo "📋 下一步："
echo "  1. 编辑 .env 文件配置环境变量"
echo "  2. 生成认证令牌: ./scripts/generate-token.sh"
echo "  3. 部署服务: ./scripts/deploy-python.sh"
echo ""
