#!/bin/bash

# 获取服务器公网IP

echo "========================================"
echo "  获取服务器公网IP"
echo "========================================"
echo ""

# 尝试多个服务获取IP
echo "🔍 正在获取公网IP..."
IP1=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null)
IP2=$(curl -s --connect-timeout 5 icanhazip.com 2>/dev/null)
IP3=$(curl -s --connect-timeout 5 ipinfo.io/ip 2>/dev/null)

# 使用第一个成功的结果
PUBLIC_IP=${IP1:-${IP2:-$IP3}}

if [ -z "$PUBLIC_IP" ]; then
    echo "❌ 无法获取公网IP"
    echo ""
    echo "请手动检查:"
    echo "  1. 登录阿里云控制台"
    echo "  2. 查看服务器详情页面"
    echo "  3. 复制公网IP地址"
    exit 1
fi

echo "✅ 服务器公网IP:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   $PUBLIC_IP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 使用此IP配置:"
echo ""
echo "1️⃣  微信公众平台 IP 白名单:"
echo "   - 登录: https://mp.weixin.qq.com/"
echo "   - 进入: 设置与开发 → 基本配置"
echo "   - 找到: IP白名单"
echo "   - 添加: $PUBLIC_IP"
echo ""
echo "2️⃣  应用代理服务器配置:"
echo "   - 代理地址: http://$PUBLIC_IP:3000"
echo "   - 认证令牌: (见 .env 文件)"
echo ""

# 测试端口连通性
echo "🔍 测试端口 3000 连通性..."
if curl -s --connect-timeout 5 http://$PUBLIC_IP:3000/health > /dev/null 2>&1; then
    echo "✅ 端口 3000 可访问"
else
    echo "⚠️  端口 3000 无法访问"
    echo ""
    echo "请检查:"
    echo "  - 阿里云安全组是否开放端口 3000"
    echo "  - 服务器防火墙是否允许端口 3000"
    echo "  - 代理服务是否正在运行 (pm2 status)"
fi
echo ""
