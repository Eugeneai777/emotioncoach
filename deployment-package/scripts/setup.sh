#!/bin/bash

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

# 2. 安装 PM2
echo "🔧 步骤 2/6: 安装 PM2 进程管理器..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo "✅ PM2 安装完成"
else
    echo "✅ PM2 已安装 (版本: $(pm2 --version))"
fi
echo ""

# 3. 安装项目依赖
echo "🔧 步骤 3/6: 安装项目依赖..."
npm install
echo "✅ 依赖安装完成"
echo ""

# 4. 创建必要的目录
echo "🔧 步骤 4/6: 创建日志目录..."
mkdir -p logs
echo "✅ 目录创建完成"
echo ""

# 5. 配置防火墙
echo "🔧 步骤 5/6: 配置防火墙（开放端口 3000）..."
if command -v ufw &> /dev/null; then
    # Ubuntu/Debian
    sudo ufw allow 3000/tcp
    sudo ufw --force enable
    echo "✅ UFW 防火墙配置完成"
elif command -v firewall-cmd &> /dev/null; then
    # CentOS/RHEL
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --reload
    echo "✅ firewalld 防火墙配置完成"
else
    echo "⚠️  未检测到防火墙，请手动开放端口 3000"
fi
echo ""

# 6. 创建环境变量文件
echo "🔧 步骤 6/6: 配置环境变量..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ 已创建 .env 文件（请编辑并设置 PROXY_AUTH_TOKEN）"
    echo ""
    echo "📝 请运行以下命令生成认证令牌："
    echo "   ./scripts/generate-token.sh"
else
    echo "✅ .env 文件已存在"
fi
echo ""

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
echo ""
