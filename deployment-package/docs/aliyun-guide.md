# 阿里云配置指南

详细的阿里云服务器配置说明。

## 📋 目录

1. [购买服务器](#购买服务器)
2. [配置安全组](#配置安全组)
3. [SSH 连接](#ssh-连接)
4. [防火墙配置](#防火墙配置)
5. [域名配置（可选）](#域名配置)

## 购买服务器

### 轻量应用服务器（推荐）

**适用场景：**
- 小型应用
- 个人项目
- 开发测试

**购买步骤：**

1. **登录阿里云**
   - 访问：https://www.aliyun.com/
   - 登录您的阿里云账号

2. **进入轻量应用服务器控制台**
   - 产品与服务 → 轻量应用服务器
   - 或直接访问：https://swas.console.aliyun.com/

3. **创建实例**
   - 点击 "创建服务器"

4. **选择配置**

   **地域：**
   - 推荐：华东1（杭州）或 华北2（北京）
   - 原因：距离近，延迟低

   **镜像类型：**
   - 选择 "系统镜像"
   - 操作系统：Ubuntu → Ubuntu 20.04

   **套餐配置：**
   - 基础版：1核CPU + 1GB内存 + 25GB SSD + 1Mbps带宽
   - 价格：约 ¥24/月
   - 流量：1000GB/月（足够使用）

   **购买时长：**
   - 按需选择（月付/年付）
   - 年付有折扣

5. **完成购买**
   - 勾选服务协议
   - 点击 "立即购买"
   - 确认订单并支付

### ECS 云服务器

**适用场景：**
- 大型应用
- 高并发场景
- 需要更多定制

**购买步骤：**

1. **进入 ECS 控制台**
   - https://ecs.console.aliyun.com/

2. **创建实例**
   - 选择 "包年包月" 或 "按量付费"

3. **基础配置**
   - 地域：华东1（杭州）
   - 可用区：随机分配
   - 实例规格：
     - 入门型：ecs.t6-c1m1.large（1核1GB）
     - 推荐型：ecs.t6-c1m2.large（1核2GB）

4. **镜像选择**
   - 公共镜像 → Ubuntu → 20.04 64位

5. **存储配置**
   - 系统盘：高效云盘 40GB
   - 数据盘：按需添加

6. **网络配置**
   - 专有网络VPC（自动创建）
   - 公网IP：分配（带宽选择 1-5Mbps）

7. **安全组配置**
   - 选择或创建安全组
   - 后续需要添加端口规则

## 配置安全组

安全组是阿里云的虚拟防火墙，控制服务器的网络访问。

### 轻量应用服务器防火墙

1. **进入服务器管理页**
   - 轻量应用服务器控制台
   - 点击您的服务器

2. **配置防火墙**
   - 点击 "防火墙" 标签
   - 点击 "添加规则"

3. **添加规则**
   ```
   应用类型：自定义TCP
   端口：3000
   策略：允许
   优先级：1
   ```

4. **预设规则**
   - 确保以下规则已启用：
     - SSH (22/TCP)
     - HTTP (80/TCP) - 如果需要 HTTPS
     - HTTPS (443/TCP) - 如果需要 HTTPS

### ECS 安全组配置

1. **进入安全组管理**
   - ECS 控制台 → 网络与安全 → 安全组

2. **选择安全组**
   - 点击您服务器使用的安全组
   - 进入 "配置规则" → "入方向"

3. **添加规则**
   ```
   授权策略：允许
   优先级：1
   协议类型：自定义TCP
   端口范围：3000/3000
   授权对象：0.0.0.0/0
   描述：微信API代理服务器
   ```

4. **保存规则**
   - 点击 "保存" 或 "确定"
   - 规则立即生效

### 安全组规则说明

**常用端口：**
- **22** - SSH（必须保留）
- **80** - HTTP（可选）
- **443** - HTTPS（可选）
- **3000** - 代理服务器（必须）

**安全建议：**
- 只开放必要的端口
- 生产环境建议限制 SSH 来源IP
- 考虑使用堡垒机

## SSH 连接

### 获取服务器信息

1. **获取公网IP**
   - 轻量应用服务器：服务器详情页直接显示
   - ECS：实例列表中的 "IP地址" 列

2. **重置密码**
   - 轻量：服务器详情页 → "远程连接" → "重置密码"
   - ECS：实例列表 → "更多" → "密码/密钥" → "重置实例密码"

### Windows 连接

**方法1：使用 PuTTY**

1. 下载 PuTTY：https://www.putty.org/

2. 打开 PuTTY

3. 配置连接：
   ```
   Host Name: 您的服务器公网IP
   Port: 22
   Connection type: SSH
   ```

4. 点击 "Open"

5. 输入用户名：`root`

6. 输入密码（您重置的密码）

**方法2：使用 Windows Terminal**

```powershell
ssh root@your-server-ip
# 输入密码
```

### Mac/Linux 连接

```bash
# 基本连接
ssh root@your-server-ip

# 指定密钥文件（如果使用密钥对）
ssh -i /path/to/key.pem root@your-server-ip

# 首次连接会提示保存指纹
# 输入 yes 并回车
# 然后输入密码
```

### 使用密钥对（推荐）

**生成密钥对：**

```bash
# Mac/Linux
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# 保存位置：~/.ssh/id_rsa

# 上传公钥到服务器
ssh-copy-id root@your-server-ip
```

**阿里云创建密钥对：**

1. ECS 控制台 → 网络与安全 → 密钥对
2. 创建密钥对
3. 下载私钥文件（.pem）
4. 绑定到实例

**使用密钥连接：**

```bash
# 修改权限
chmod 400 /path/to/key.pem

# 连接
ssh -i /path/to/key.pem root@your-server-ip
```

## 防火墙配置

### Ubuntu 防火墙（UFW）

```bash
# 检查状态
sudo ufw status

# 启用防火墙
sudo ufw enable

# 允许 SSH（防止自己被锁在外面！）
sudo ufw allow 22/tcp

# 允许代理服务器端口
sudo ufw allow 3000/tcp

# 允许 HTTP/HTTPS（可选）
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看规则
sudo ufw status numbered

# 删除规则（如果需要）
sudo ufw delete 规则编号
```

### CentOS 防火墙（firewalld）

```bash
# 检查状态
sudo firewall-cmd --state

# 启动防火墙
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 允许端口
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp

# 重新加载规则
sudo firewall-cmd --reload

# 查看规则
sudo firewall-cmd --list-all

# 删除规则（如果需要）
sudo firewall-cmd --permanent --remove-port=3000/tcp
sudo firewall-cmd --reload
```

## 域名配置（可选）

如果您想使用域名访问代理服务器（如 `proxy.yourdomain.com`）：

### 1. 购买域名

- 阿里云域名注册：https://wanwang.aliyun.com/
- 或使用其他域名注册商

### 2. 添加域名解析

**阿里云 DNS 配置：**

1. 进入云解析 DNS 控制台
2. 选择您的域名
3. 添加记录：
   ```
   记录类型：A
   主机记录：proxy（或您想要的子域名）
   记录值：您的服务器公网IP
   TTL：10分钟
   ```

4. 等待 DNS 生效（通常几分钟）

### 3. 验证解析

```bash
# 查询 DNS 记录
nslookup proxy.yourdomain.com

# 或使用 dig
dig proxy.yourdomain.com

# Ping 测试
ping proxy.yourdomain.com
```

### 4. 配置 SSL 证书（推荐）

参见 [DEPLOYMENT.md](../DEPLOYMENT.md) 的 "启用 HTTPS" 部分。

## 监控和告警

### 阿里云监控

1. **进入云监控控制台**
   - https://cloudmonitor.console.aliyun.com/

2. **配置主机监控**
   - 自动监控 CPU、内存、磁盘、网络

3. **设置告警规则**
   - 主机监控 → 告警规则 → 创建规则
   - 例如：
     - CPU 使用率 > 80%
     - 内存使用率 > 90%
     - 磁盘使用率 > 85%

4. **配置通知方式**
   - 短信、邮件、钉钉等

## 备份策略

### 快照备份

1. **创建自定义镜像**
   - ECS 控制台 → 实例列表
   - 选择实例 → 创建自定义镜像

2. **定期快照**
   - 存储与快照 → 快照 → 自动快照策略
   - 设置备份频率和保留时间

### 手动备份

```bash
# 备份关键文件
tar -czf backup-$(date +%Y%m%d).tar.gz \
  /opt/deployment-package/.env \
  /opt/deployment-package/ecosystem.config.js \
  /opt/deployment-package/logs/

# 下载到本地
scp root@your-server-ip:/root/backup-*.tar.gz ./
```

## 成本优化

### 节省建议

1. **选择合适的地域**
   - 距离用户近的地域
   - 避免跨地域流量费用

2. **按需调整配置**
   - 监控资源使用情况
   - 如果资源过剩，降级配置
   - 如果资源不足，升级配置

3. **使用流量包**
   - 轻量应用服务器自带流量包
   - ECS 可购买流量包节省费用

4. **长期使用选择包年**
   - 年付有折扣（通常8.5折）

### 费用监控

1. **设置费用告警**
   - 用户中心 → 费用中心 → 费用账单
   - 设置预算告警

2. **定期查看账单**
   - 检查是否有异常消费

## 常见问题

### Q1：服务器到期了怎么办？

**A:** 
- 续费：费用中心 → 续费管理
- 提前设置自动续费避免服务中断

### Q2：忘记 root 密码？

**A:** 
- 控制台重置密码
- 轻量：服务器详情 → 重置密码
- ECS：实例列表 → 重置实例密码

### Q3：公网IP 会变化吗？

**A:**
- 轻量应用服务器：固定公网IP，不会变化
- ECS 按量付费：可能变化，建议绑定弹性公网IP
- ECS 包年包月：固定IP，不会变化

### Q4：如何升级配置？

**A:**
- 轻量：控制台 → 升级配置
- ECS：控制台 → 变配 → 升降配置

### Q5：需要ICP备案吗？

**A:**
- 使用IP访问：不需要备案
- 使用域名访问：中国大陆服务器需要备案
- 备案流程：阿里云备案系统（约7-20天）

## 技术支持

**阿里云帮助中心：**
- https://help.aliyun.com/

**工单系统：**
- 控制台右上角 → "工单" → 提交工单

**客服电话：**
- 95187

## 相关文档

- [阿里云轻量应用服务器文档](https://help.aliyun.com/product/59978.html)
- [阿里云ECS文档](https://help.aliyun.com/product/25365.html)
- [阿里云安全组配置](https://help.aliyun.com/document_detail/25471.html)

---

**准备好了？** 返回 [README.md](../README.md) 继续部署！
