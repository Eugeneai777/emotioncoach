#!/bin/bash

# 微信API代理服务器 - 部署脚本

set -e

echo "========================================"
echo "  微信API代理服务器 - 部署"
echo "========================================"
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

# 停止旧的服务（如果存在）
echo "🔄 检查现有服务..."
if pm2 list | grep -q "wechat-proxy"; then
    echo "⏹️  停止现有服务..."
    pm2 stop wechat-proxy
    pm2 delete wechat-proxy
fi
echo ""

# 启动服务
echo "🚀 启动服务..."
pm2 start ecosystem.config.js --env production --update-env
echo "✅ 服务启动成功"
echo ""

# 配置开机自启
echo "🔧 配置开机自启..."
pm2 startup | grep "sudo" | bash || true
pm2 save
echo "✅ 开机自启配置完成"
echo ""

# 显示服务状态
echo "📊 服务状态:"
pm2 status
echo ""

# 显示日志（最近10行）
echo "📝 最近日志:"
pm2 logs wechat-proxy --lines 10 --nostream
echo ""

# 获取服务器公网IP
echo "🌐 服务器信息:"
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "无法获取")
echo "   公网IP: $PUBLIC_IP"
echo "   代理地址: http://$PUBLIC_IP:3000"
echo "   健康检查: http://$PUBLIC_IP:3000/health"
echo ""

echo "========================================"
echo "  ✅ 部署完成！"
echo "========================================"
echo ""
echo "📋 后续步骤："
echo "  1. 测试服务："
echo "     ./scripts/test-proxy.sh"
echo ""
echo "  2. 配置微信公众平台 IP 白名单："
echo "     将 $PUBLIC_IP 添加到微信公众平台"
echo ""
echo "  3. 配置应用："
echo "     代理地址: http://$PUBLIC_IP:3000"
echo "     认证令牌: (见 .env 文件中的 PROXY_AUTH_TOKEN)"
echo ""
echo "  4. 查看实时日志："
echo "     pm2 logs wechat-proxy"
echo ""
