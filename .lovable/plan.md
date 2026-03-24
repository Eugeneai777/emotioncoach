

# 修复：/mini-app 导航内容重复与「学习」按钮跳转问题

## 现存问题

1. **「学习」按钮** 跳转 `/camps` 展示全部训练营商品列表，已购用户看不到"我的训练营"
2. **「我的」页面** 仍显示完整的订单列表（最多20笔），内容过多
3. **/mini-app 首页** 已购用户快捷面板仍有「我的订单」「我的测评」「我的训练营」三个按钮，与底部导航「学习」和「我的」形成重复

## 修改方案

### 文件1：`src/components/awakening/AwakeningBottomNav.tsx`

- 「学习」按钮跳转改为 `/camps?filter=my`，让已购用户直接看到"我的训练营"列表
- `/camps` 页面已支持 `?filter=my` 参数，会展示用户已购/进行中/已完成的训练营

### 文件2：`src/pages/MiniAppEntry.tsx`

- 移除 `paidShortcuts` 数组及其渲染的「我的订单」「我的测评」「我的训练营」快捷面板
- 移除相关 import（ShoppingCart、ClipboardList、Tent）和 `hasPaidOrder` 状态逻辑
- 这些功能已通过底部导航「我的」和「学习」覆盖

### 文件3：`src/pages/MyPage.tsx`

- 订单区块简化：从完整列表改为仅显示一行「查看全部订单 →」入口
- 点击跳转 `/my-page-orders`（新建）或保留在页面内折叠显示
- **建议**：保留订单列表但默认只显示最近2笔（当前逻辑已如此），不做大改，保持稳定

## 不影响的功能

- `/camps` 页面本身功能不变，用户仍可手动切换查看全部训练营
- 订单数据查询逻辑不变
- 各人群页面的独立入口不受影响

## 技术细节

```text
改动量：
- AwakeningBottomNav.tsx: 1行改动（路由参数）
- MiniAppEntry.tsx: 移除 ~25行代码（快捷面板 + hasPaidOrder 逻辑）
- MyPage.tsx: 不改动（保持当前默认展示2笔订单的行为）
```

