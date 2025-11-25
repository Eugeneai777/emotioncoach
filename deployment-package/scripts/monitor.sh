#!/bin/bash

# 监控脚本 - 健康检查和自动重启

LOG_FILE="/var/log/wechat-proxy-monitor.log"
URL="http://localhost:3000/health"

# 检查健康状态
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -ne 200 ]; then
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$TIMESTAMP] ❌ Proxy server is down! HTTP Status: $RESPONSE" >> $LOG_FILE
    
    # 尝试重启服务
    echo "[$TIMESTAMP] 🔄 Attempting to restart service..." >> $LOG_FILE
    pm2 restart wechat-proxy
    
    # 等待2秒后再次检查
    sleep 2
    RESPONSE_AFTER=$(curl -s -o /dev/null -w "%{http_code}" $URL)
    
    if [ $RESPONSE_AFTER -eq 200 ]; then
        echo "[$TIMESTAMP] ✅ Service restarted successfully" >> $LOG_FILE
    else
        echo "[$TIMESTAMP] ❌ Service restart failed" >> $LOG_FILE
    fi
else
    # 每小时记录一次正常状态
    MINUTE=$(date '+%M')
    if [ "$MINUTE" = "00" ]; then
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
        echo "[$TIMESTAMP] ✅ Service is healthy" >> $LOG_FILE
    fi
fi
