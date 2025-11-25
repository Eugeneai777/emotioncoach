# 微信API代理服务器 - 阿里云部署包

解决微信公众号 API 调用 IP 白名单限制问题的完整解决方案。

## 🎯 功能特点

- ✅ **零配置复杂度** - 一键安装脚本，5分钟完成部署
- ✅ **自动化运维** - PM2 守护进程 + 开机自启 + 健康监控
- ✅ **安全加固** - 强制认证令牌验证，防止未授权访问
- ✅ **完整文档** - 中文说明 + 故障排查 + 最佳实践
- ✅ **生产就绪** - 日志管理 + 错误处理 + 性能优化

## 📦 部署包结构

```
deployment-package/
├── README.md                    # 本文件
├── DEPLOYMENT.md                # 详细部署文档
├── TROUBLESHOOTING.md          # 故障排查指南
├── proxy.js                     # 代理服务器主程序
├── package.json                 # 项目依赖配置
├── ecosystem.config.js          # PM2 进程管理配置
├── .env.example                 # 环境变量模板
├── scripts/
│   ├── setup.sh                # 一键安装脚本
│   ├── deploy.sh               # 部署脚本
│   ├── update.sh               # 更新脚本
│   ├── generate-token.sh       # 生成认证令牌
│   ├── test-proxy.sh           # 测试脚本
│   ├── monitor.sh              # 健康监控脚本
│   └── get-ip.sh               # 获取公网IP
├── docs/
│   ├── aliyun-guide.md         # 阿里云配置指南
│   ├── wechat-config.md        # 微信平台配置
│   └── security.md             # 安全最佳实践
└── logs/                        # 日志目录（自动创建）
```

## 🚀 快速开始（5分钟部署）

### 前置要求

- ✅ 阿里云服务器（1核1GB即可）
- ✅ 操作系统：Ubuntu 20.04 / CentOS 7+ 
- ✅ 固定公网IP地址
- ✅ SSH 访问权限

### 步骤 1：上传部署包到服务器

```bash
# 方法1：使用 scp 上传
scp -r deployment-package root@your-server-ip:/opt/

# 方法2：使用 SFTP 工具（如 FileZilla）
# 上传整个 deployment-package 目录到 /opt/
```

### 步骤 2：SSH 登录服务器

```bash
ssh root@your-server-ip
```

### 步骤 3：进入部署目录

```bash
cd /opt/deployment-package
```

### 步骤 4：赋予脚本执行权限

```bash
chmod +x scripts/*.sh
```

### 步骤 5：运行一键安装

```bash
sudo ./scripts/setup.sh
```

这个脚本会自动完成：
- ✅ 安装 Node.js 18.x LTS
- ✅ 安装 PM2 进程管理器
- ✅ 安装项目依赖（express, cors）
- ✅ 配置防火墙（开放端口 3000）
- ✅ 创建必要的目录和文件

### 步骤 6：生成认证令牌

```bash
./scripts/generate-token.sh
```

这会生成一个安全的随机令牌并自动保存到 `.env` 文件。**请妥善保管输出的令牌！**

### 步骤 7：部署服务

```bash
./scripts/deploy.sh
```

这个脚本会：
- ✅ 使用 PM2 启动服务
- ✅ 配置开机自启
- ✅ 显示服务状态和公网IP
- ✅ 显示运行日志

### 步骤 8：测试服务

```bash
./scripts/test-proxy.sh
```

验证所有功能是否正常。

### 步骤 9：获取服务器IP

```bash
./scripts/get-ip.sh
```

记录输出的公网IP地址，稍后需要添加到微信公众平台。

## 📝 配置微信公众平台

### 1. 添加 IP 白名单

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **设置与开发** → **基本配置**
3. 找到 **IP白名单** 部分
4. 点击 **修改**，添加服务器公网IP
5. 点击 **确定**

### 2. 配置应用设置

1. 打开您的应用，进入 **设置** 页面
2. 找到 **微信公众号模板消息** 部分
3. 启用 **使用代理服务器** 开关
4. 填写配置：
   - **代理服务器地址**：`http://YOUR_SERVER_IP:3000`
   - **代理认证令牌**：（粘贴之前生成的令牌）
5. 点击 **保存设置**
6. 点击 **测试推送** 验证配置

## 🔧 常用命令

### PM2 管理命令

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs wechat-proxy

# 查看最近50行日志
pm2 logs wechat-proxy --lines 50

# 重启服务
pm2 restart wechat-proxy

# 停止服务
pm2 stop wechat-proxy

# 监控性能
pm2 monit
```

### 维护脚本

```bash
# 重新生成认证令牌
./scripts/generate-token.sh

# 重新部署服务
./scripts/deploy.sh

# 测试服务
./scripts/test-proxy.sh

# 获取公网IP
./scripts/get-ip.sh

# 更新服务
./scripts/update.sh
```

## 📊 健康监控

### 手动健康检查

```bash
# 本地检查
curl http://localhost:3000/health

# 外网检查（替换为实际IP）
curl http://YOUR_SERVER_IP:3000/health
```

### 自动监控（可选）

设置定时任务，每5分钟检查服务健康状态：

```bash
# 添加到 crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/deployment-package/scripts/monitor.sh") | crontab -

# 查看监控日志
tail -f /var/log/wechat-proxy-monitor.log
```

## 🔒 安全建议

1. **必须设置认证令牌** - 不要在生产环境中使用空令牌
2. **定期更换令牌** - 建议每3个月更换一次
3. **限制访问源** - 在云服务商安全组中限制来源IP
4. **启用 HTTPS** - 生产环境建议配置 Nginx + SSL
5. **监控日志** - 定期检查 `/var/log/wechat-proxy-monitor.log`

详见：[docs/security.md](docs/security.md)

## 🐛 故障排查

### 常见问题

**问题1：外网无法访问服务器**
```bash
# 检查服务状态
pm2 status

# 检查防火墙
sudo ufw status  # Ubuntu
sudo firewall-cmd --list-all  # CentOS

# 检查云服务商安全组
# 登录阿里云控制台 → 安全组 → 确认端口 3000 已开放
```

**问题2：服务启动失败**
```bash
# 查看错误日志
pm2 logs wechat-proxy --err

# 检查 Node.js 版本
node --version  # 需要 >= 18.0.0

# 手动测试运行
node proxy.js
```

**问题3：微信API调用失败**
```bash
# 检查IP是否在白名单
./scripts/get-ip.sh

# 查看代理日志
pm2 logs wechat-proxy | grep "Proxying"
```

更多故障排查方法，查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 📚 更多文档

- [DEPLOYMENT.md](DEPLOYMENT.md) - 详细部署说明
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - 完整故障排查指南
- [docs/aliyun-guide.md](docs/aliyun-guide.md) - 阿里云特定配置
- [docs/wechat-config.md](docs/wechat-config.md) - 微信平台配置详解
- [docs/security.md](docs/security.md) - 安全最佳实践

## 💰 成本估算

| 云服务商 | 配置 | 月费用 | 备注 |
|---------|------|--------|------|
| 阿里云 | 轻量1C1G | ¥24-40 | 性价比最高 ⭐推荐 |
| 阿里云 | 轻量1C2G | ¥50-80 | 更高配置 |
| 腾讯云 | 轻量1C2G | ¥50-80 | 同等配置 |

**推荐**：阿里云轻量应用服务器 1核1GB（¥24/月起）

## 🆘 获取帮助

如果遇到问题：

1. 查看 [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. 检查服务日志：`pm2 logs wechat-proxy`
3. 运行测试脚本：`./scripts/test-proxy.sh`
4. 查看监控日志：`tail -f /var/log/wechat-proxy-monitor.log`

## 📄 许可证

MIT License

## 🎉 完成！

恭喜！您的微信API代理服务器已成功部署。现在可以：

✅ 在应用中配置代理服务器
✅ 发送微信模板消息
✅ 不再受 IP 白名单限制

**祝使用愉快！** 🎊
