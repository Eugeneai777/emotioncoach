## 修改

在 `src/pages/LaogeAI.tsx` 第 278 行,把"情绪健康"卡片的角标文案从 `限时 ¥9.9` 改为 `限时免费`。

```tsx
<span className="text-[9px] font-bold text-[hsl(var(--laoge-accent))]">限时免费</span>
```

其余卡片(财富卡点 / 觉醒力 / 男性活力)及业务逻辑不变。

是否一并将该卡片的跳转目标从 `/emotion-health` 改为免费版 `/emotion-health-lite`(与 MiniAppEntry 中保持一致)?如不需要请告诉我,我只改文案。