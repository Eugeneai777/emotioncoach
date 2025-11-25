#!/bin/bash

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

# 更新 .env 文件
if [ -f .env ]; then
    # 检查是否已有 PROXY_AUTH_TOKEN
    if grep -q "^PROXY_AUTH_TOKEN=" .env; then
        # 替换现有的
        sed -i "s|^PROXY_AUTH_TOKEN=.*|PROXY_AUTH_TOKEN=$TOKEN|" .env
        echo "✅ 已更新 .env 文件中的 PROXY_AUTH_TOKEN"
    else
        # 添加新的
        echo "PROXY_AUTH_TOKEN=$TOKEN" >> .env
        echo "✅ 已添加 PROXY_AUTH_TOKEN 到 .env 文件"
    fi
else
    # 创建新的 .env 文件
    cp .env.example .env
    sed -i "s|^PROXY_AUTH_TOKEN=.*|PROXY_AUTH_TOKEN=$TOKEN|" .env
    echo "✅ 已创建 .env 文件并设置 PROXY_AUTH_TOKEN"
fi

echo ""
echo "⚠️  重要提示："
echo "   1. 请妥善保管此令牌，不要泄露给他人"
echo "   2. 在应用设置中配置此令牌"
echo "   3. 如果服务已启动，请重新部署以生效："
echo "      ./scripts/deploy.sh"
echo ""
