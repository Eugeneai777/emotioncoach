#!/bin/bash

# 更新代理服务器

echo "========================================"
echo "  更新代理服务器"
echo "========================================"
echo ""

# 备份当前版本
echo "📦 备份当前配置..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ 配置已备份"
echo ""

# 拉取最新代码（如果使用 git）
if [ -d .git ]; then
    echo "🔄 拉取最新代码..."
    git pull
    echo "✅ 代码更新完成"
    echo ""
fi

# 更新依赖
echo "📦 更新依赖..."
npm install
echo "✅ 依赖更新完成"
echo ""

# 重启服务
echo "🔄 重启服务..."
pm2 restart wechat-proxy
echo "✅ 服务重启完成"
echo ""

# 显示状态
echo "📊 当前状态:"
pm2 status
echo ""

echo "========================================"
echo "  ✅ 更新完成！"
echo "========================================"
