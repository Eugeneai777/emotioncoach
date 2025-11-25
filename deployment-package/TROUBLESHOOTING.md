# 故障排查指南

遇到问题？这份指南会帮助您快速定位和解决常见问题。

## 📋 目录

1. [快速诊断](#快速诊断)
2. [安装阶段问题](#安装阶段问题)
3. [部署阶段问题](#部署阶段问题)
4. [运行时问题](#运行时问题)
5. [网络连接问题](#网络连接问题)
6. [性能问题](#性能问题)
7. [日志分析](#日志分析)

## 快速诊断

运行自动诊断脚本：

```bash
cd /opt/deployment-package
./scripts/test-proxy.sh
```

## 安装阶段问题

### 问题1：Node.js 安装失败

**症状：**
```
E: Unable to locate package nodejs
```

**解决方案：**

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get update
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 问题2：权限不足

**症状：**
```
Permission denied
```

**解决方案：**

```bash
# 使用 sudo 运行安装脚本
sudo ./scripts/setup.sh

# 或者切换到 root 用户
sudo su -
cd /opt/deployment-package
./scripts/setup.sh
```

### 问题3：端口被占用

**症状：**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案：**

```bash
# 查看占用端口 3000 的进程
sudo netstat -tulpn | grep 3000
# 或
sudo lsof -i :3000

# 杀死占用进程（假设 PID 是 12345）
sudo kill -9 12345

# 或者修改端口（编辑 .env）
nano .env
# 将 PORT=3000 改为 PORT=3001
```

### 问题4：npm 安装依赖失败

**症状：**
```
npm ERR! network timeout
```

**解决方案：**

```bash
# 使用国内镜像源
npm config set registry https://registry.npmmirror.com

# 清除缓存重试
npm cache clean --force
npm install

# 增加超时时间
npm install --timeout=60000
```

## 部署阶段问题

### 问题5：PM2 启动失败

**症状：**
```
[PM2][ERROR] Process failed to start
```

**解决方案：**

```bash
# 1. 查看错误日志
pm2 logs wechat-proxy --err --lines 50

# 2. 手动测试运行
node proxy.js

# 3. 检查环境变量
cat .env
source .env
echo $PROXY_AUTH_TOKEN

# 4. 检查文件权限
ls -la proxy.js
chmod +x proxy.js

# 5. 重新安装依赖
rm -rf node_modules
npm install
```

### 问题6：开机自启配置失败

**症状：**
```
[PM2][ERROR] startup script generation failed
```

**解决方案：**

```bash
# 1. 手动配置启动脚本
pm2 startup

# 2. 复制输出的命令并执行（类似下面）
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# 3. 保存 PM2 进程列表
pm2 save

# 4. 验证服务
sudo systemctl status pm2-root

# 5. 测试重启
sudo reboot
# 重启后检查
pm2 status
```

### 问题7：环境变量未加载

**症状：**
```
Authentication: DISABLED (⚠️  Not secure!)
```

**解决方案：**

```bash
# 1. 检查 .env 文件
cat .env

# 2. 确认令牌已设置
grep PROXY_AUTH_TOKEN .env

# 3. 重新生成令牌
./scripts/generate-token.sh

# 4. 更新 ecosystem.config.js
nano ecosystem.config.js
# 确保 env_file: '.env' 或在 env 中直接设置

# 5. 重新部署
pm2 delete wechat-proxy
./scripts/deploy.sh
```

## 运行时问题

### 问题8：服务频繁重启

**症状：**
```
restart: 15 (too many restarts)
```

**解决方案：**

```bash
# 1. 查看错误日志
pm2 logs wechat-proxy --err

# 2. 常见原因：内存不足
pm2 show wechat-proxy
# 查看 memory 字段

# 3. 增加内存限制（编辑 ecosystem.config.js）
nano ecosystem.config.js
# 修改 max_memory_restart: '500M'

# 4. 重新加载配置
pm2 reload ecosystem.config.js

# 5. 检查系统资源
free -h
df -h
```

### 问题9：内存泄漏

**症状：**
```
memory usage keeps increasing
```

**解决方案：**

```bash
# 1. 监控内存使用
pm2 monit

# 2. 定期重启服务（添加到 crontab）
(crontab -l; echo "0 3 * * * pm2 restart wechat-proxy") | crontab -

# 3. 查看内存使用趋势
pm2 show wechat-proxy

# 4. 降低内存限制触发重启
# 编辑 ecosystem.config.js
max_memory_restart: '200M'
```

### 问题10：日志文件过大

**症状：**
```
disk space full
```

**解决方案：**

```bash
# 1. 检查磁盘空间
df -h

# 2. 查看日志大小
du -sh /opt/deployment-package/logs/

# 3. 清空日志
pm2 flush

# 4. 安装日志轮转
pm2 install pm2-logrotate

# 5. 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# 6. 手动删除旧日志
find /opt/deployment-package/logs/ -name "*.log" -mtime +7 -delete
```

## 网络连接问题

### 问题11：外网无法访问

**症状：**
```
curl: (7) Failed to connect to SERVER_IP port 3000: Connection refused
```

**解决方案：**

```bash
# 1. 检查服务是否运行
pm2 status

# 2. 检查服务监听地址
sudo netstat -tulpn | grep 3000
# 确认是 0.0.0.0:3000 而不是 127.0.0.1:3000

# 3. 检查服务器防火墙
# Ubuntu
sudo ufw status
sudo ufw allow 3000/tcp

# CentOS
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# 4. 检查云服务商安全组
# 登录阿里云控制台
# 进入：服务器 → 安全组 → 入方向规则
# 确认端口 3000 已开放

# 5. 测试本地连接
curl http://localhost:3000/health

# 6. 从本地测试外网连接
curl http://YOUR_SERVER_IP:3000/health
```

### 问题12：微信API调用失败

**症状：**
```
{"errcode":40164,"errmsg":"invalid ip xxx.xxx.xxx.xxx"}
```

**解决方案：**

```bash
# 1. 获取服务器公网IP
./scripts/get-ip.sh

# 2. 验证IP地址
curl ifconfig.me

# 3. 登录微信公众平台
# https://mp.weixin.qq.com/
# 进入：设置与开发 → 基本配置 → IP白名单

# 4. 确认IP已添加到白名单
# 白名单格式：123.456.789.012

# 5. 等待1-2分钟让配置生效

# 6. 测试微信API
curl "https://api.weixin.qq.com/cgi-bin/getcallbackip?access_token=YOUR_TOKEN"
```

### 问题13：代理认证失败

**症状：**
```
{"error":"Unauthorized"}
```

**解决方案：**

```bash
# 1. 检查令牌配置
cat .env | grep PROXY_AUTH_TOKEN

# 2. 查看代理日志
pm2 logs wechat-proxy | grep "Unauthorized"

# 3. 验证应用中的令牌配置
# 确认应用设置中的令牌与服务器 .env 中的一致

# 4. 重新生成令牌
./scripts/generate-token.sh

# 5. 重新部署
./scripts/deploy.sh

# 6. 更新应用配置
# 将新令牌填入应用设置
```

### 问题14：请求超时

**症状：**
```
{"error":"Proxy request failed","message":"network timeout"}
```

**解决方案：**

```bash
# 1. 检查服务器网络
ping api.weixin.qq.com

# 2. 测试微信API连通性
curl -v https://api.weixin.qq.com/

# 3. 增加超时时间（编辑 proxy.js）
nano proxy.js
# 在 fetch 中添加 timeout 选项

# 4. 检查服务器出站规则
# 确保可以访问外网

# 5. 查看详细日志
pm2 logs wechat-proxy --lines 100
```

## 性能问题

### 问题15：响应缓慢

**症状：**
```
Response time > 5 seconds
```

**解决方案：**

```bash
# 1. 检查系统资源
top
htop  # 需要安装: sudo apt install htop

# 2. 检查 PM2 状态
pm2 monit

# 3. 查看网络延迟
ping api.weixin.qq.com

# 4. 优化 PM2 配置
# 编辑 ecosystem.config.js
instances: 'max',      # 使用所有CPU核心
exec_mode: 'cluster'   # 启用集群模式

# 5. 重新加载配置
pm2 reload ecosystem.config.js

# 6. 升级服务器配置
# 如果资源不足，考虑升级到 2核2GB
```

### 问题16：高并发处理

**症状：**
```
Too many requests, server overloaded
```

**解决方案：**

```bash
# 1. 启用集群模式
# 编辑 ecosystem.config.js
instances: 2,          # 或 'max'
exec_mode: 'cluster'

# 2. 增加内存限制
max_memory_restart: '500M'

# 3. 配置负载均衡（如果有多台服务器）
# 使用 Nginx 做负载均衡

# 4. 添加请求限流（编辑 proxy.js）
# 安装 express-rate-limit
npm install express-rate-limit

# 5. 监控性能指标
pm2 install pm2-server-monit
```

## 日志分析

### 查看日志

```bash
# 实时日志
pm2 logs wechat-proxy

# 最近100行
pm2 logs wechat-proxy --lines 100

# 只看错误日志
pm2 logs wechat-proxy --err

# 日志文件位置
ls -lh /opt/deployment-package/logs/

# 搜索特定内容
pm2 logs wechat-proxy | grep "error"
pm2 logs wechat-proxy | grep "Proxying"
```

### 常见日志信息

**正常日志：**
```
[2024-01-01 00:00:00] GET /health
[2024-01-01 00:00:01] Proxying GET https://api.weixin.qq.com/...
[2024-01-01 00:00:02] Response status: 200
```

**错误日志：**
```
[2024-01-01 00:00:00] Unauthorized access attempt
[2024-01-01 00:00:01] Proxy error: network timeout
[2024-01-01 00:00:02] Error: ECONNREFUSED
```

### 日志分析技巧

```bash
# 统计错误数量
pm2 logs wechat-proxy --nostream | grep -c "error"

# 查看最常见的错误
pm2 logs wechat-proxy --nostream | grep "error" | sort | uniq -c | sort -rn

# 查看特定时间段的日志
grep "2024-01-01 14:" /opt/deployment-package/logs/out.log

# 监控实时流量
watch -n 1 'pm2 logs wechat-proxy --lines 10 --nostream | tail -10'
```

## 系统级故障排查

### 检查系统资源

```bash
# CPU 使用率
top -bn1 | grep "Cpu(s)"

# 内存使用
free -h

# 磁盘空间
df -h

# 网络连接
netstat -an | grep 3000

# 查看端口监听
sudo lsof -i :3000
```

### 重置服务

如果所有方法都失败，尝试完全重置：

```bash
# 1. 停止并删除服务
pm2 stop wechat-proxy
pm2 delete wechat-proxy
pm2 save --force

# 2. 清理缓存
pm2 kill
npm cache clean --force

# 3. 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 4. 重新部署
./scripts/deploy.sh

# 5. 验证
./scripts/test-proxy.sh
```

## 获取帮助

如果以上方法都无法解决问题：

1. **收集诊断信息：**
   ```bash
   # 创建诊断报告
   cat > diagnostic-report.txt << EOF
   Date: $(date)
   OS: $(cat /etc/os-release | grep PRETTY_NAME)
   Node: $(node --version)
   PM2: $(pm2 --version)
   
   PM2 Status:
   $(pm2 status)
   
   Recent Logs:
   $(pm2 logs wechat-proxy --lines 50 --nostream)
   
   System Resources:
   $(free -h)
   $(df -h)
   
   Network:
   $(netstat -tulpn | grep 3000)
   EOF
   
   cat diagnostic-report.txt
   ```

2. **查看文档：**
   - [README.md](README.md)
   - [DEPLOYMENT.md](DEPLOYMENT.md)
   - [docs/aliyun-guide.md](docs/aliyun-guide.md)

3. **检查日志：**
   ```bash
   pm2 logs wechat-proxy
   tail -f /var/log/wechat-proxy-monitor.log
   ```

## 预防性维护

定期执行以下检查：

```bash
# 每周检查清单
./scripts/test-proxy.sh          # 测试功能
pm2 status                        # 检查状态
df -h                             # 检查磁盘
free -h                           # 检查内存
pm2 logs wechat-proxy --err      # 检查错误日志
```

添加到定时任务：

```bash
# 每周日凌晨3点自动检查
(crontab -l; echo "0 3 * * 0 /opt/deployment-package/scripts/test-proxy.sh >> /var/log/weekly-check.log 2>&1") | crontab -
```

## 🎉 问题解决了？

太好了！别忘了：

1. 记录解决方法以备后用
2. 定期备份配置文件
3. 设置监控告警
4. 保持系统和依赖更新

**祝运行顺利！** 🚀
