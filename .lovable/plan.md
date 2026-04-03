

# 修复财富觉醒训练营打卡页显示情绪解压内容的问题

## 问题根因

财富觉醒训练营（`wealth_block_7`）有专属打卡页 `/wealth-camp-checkin`（`WealthCampCheckIn.tsx`），但多个入口错误地将用户导航到通用打卡页 `/camp-checkin/:campId`（`CampCheckIn.tsx`），后者只包含情绪解压/亲子营内容，没有财富营的冥想、教练对话等模块。

受影响的入口包括：
- `CampIntro.tsx` — "进入训练营"按钮
- `WealthSynergyPromoPage.tsx` — 已购用户进入按钮
- `CampList.tsx` — 训练营列表点击
- `CampDetailSheet.tsx` — 训练营详情弹窗
- `CampJoinSelector.tsx` — 加入训练营后跳转

## 方案

在 `CampCheckIn.tsx` 加载完训练营数据后，检测 `camp_type` 是否为 wealth 类型，如果是则自动重定向到 `/wealth-camp-checkin`。这是最安全的兜底方案，无论从哪个入口进入都能正确路由。

### 文件变更

| 文件 | 操作 |
|---|---|
| `src/pages/CampCheckIn.tsx` | 在 `loadCampData` 成功后增加 wealth 类型检测，自动 `navigate('/wealth-camp-checkin')` 重定向 |

### 实现细节

在 `CampCheckIn.tsx` 的 `loadCampData` 函数（约第286行）中，检测到 camp 的 `camp_type` 包含 `wealth` 时，执行重定向：

```typescript
if (data) {
  // 财富营有专属打卡页，重定向过去
  if (data.camp_type === 'wealth_block_7' || data.camp_type === 'wealth_block_21') {
    navigate('/wealth-camp-checkin', { replace: true });
    return;
  }
  setCamp(data as TrainingCamp);
  // ...
}
```

这样无论用户从哪个页面进入 `/camp-checkin/:campId`，只要是财富营都会被正确重定向到专属页面。

