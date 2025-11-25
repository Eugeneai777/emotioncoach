#!/bin/bash

# 测试代理服务器

echo "========================================"
echo "  测试代理服务器"
echo "========================================"
echo ""

# 加载环境变量
if [ -f .env ]; then
    source .env
fi

# 1. 测试本地健康检查
echo "📝 测试 1/4: 本地健康检查..."
RESPONSE=$(curl -s http://localhost:3000/health)
if [ $? -eq 0 ]; then
    echo "✅ 本地健康检查通过"
    echo "   响应: $RESPONSE"
else
    echo "❌ 本地健康检查失败"
    exit 1
fi
echo ""

# 2. 获取公网IP
echo "📝 测试 2/4: 获取服务器公网IP..."
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com)
if [ -z "$PUBLIC_IP" ]; then
    echo "❌ 无法获取公网IP"
    exit 1
fi
echo "✅ 服务器公网IP: $PUBLIC_IP"
echo ""

# 3. 测试外网健康检查
echo "📝 测试 3/4: 外网健康检查..."
RESPONSE=$(curl -s http://$PUBLIC_IP:3000/health)
if [ $? -eq 0 ]; then
    echo "✅ 外网健康检查通过"
    echo "   响应: $RESPONSE"
else
    echo "❌ 外网健康检查失败"
    echo "   请检查:"
    echo "   - 云服务商安全组是否开放端口 3000"
    echo "   - 服务器防火墙是否允许端口 3000"
    exit 1
fi
echo ""

# 4. 测试代理功能（需要认证令牌）
echo "📝 测试 4/4: 测试代理转发功能..."
if [ -z "$PROXY_AUTH_TOKEN" ]; then
    echo "⚠️  跳过（未设置 PROXY_AUTH_TOKEN）"
else
    # 测试代理转发（使用微信 API 的示例 URL）
    RESPONSE=$(curl -s -X POST http://localhost:3000/wechat-proxy \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PROXY_AUTH_TOKEN" \
        -d '{
            "target_url": "https://api.weixin.qq.com/cgi-bin/getcallbackip?access_token=INVALID_TOKEN",
            "method": "GET"
        }')
    
    if [ $? -eq 0 ]; then
        echo "✅ 代理转发功能正常"
        echo "   响应: $RESPONSE"
    else
        echo "❌ 代理转发功能异常"
        exit 1
    fi
fi
echo ""

echo "========================================"
echo "  ✅ 所有测试通过！"
echo "========================================"
echo ""
echo "📋 服务信息："
echo "   公网IP: $PUBLIC_IP"
echo "   代理地址: http://$PUBLIC_IP:3000"
echo "   健康检查: http://$PUBLIC_IP:3000/health"
echo ""
echo "📋 下一步："
echo "   1. 将 $PUBLIC_IP 添加到微信公众平台 IP 白名单"
echo "   2. 在应用中配置代理地址和认证令牌"
echo "   3. 测试应用的推送功能"
echo ""
