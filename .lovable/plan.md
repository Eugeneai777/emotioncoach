

## 恢复「中场觉醒力测评」原价 ¥9.9

### 操作
执行一条 SQL：
```sql
UPDATE packages SET price = 9.9 WHERE package_key = 'midlife_awakening_assessment';
```

### 影响
- 前端 `MidlifeAwakeningPage.tsx` 走 `usePackages` 动态读价，无需改代码
- 与 mem://product/pricing/assessment-standard-pricing-zh 的 ¥9.9 标准基线对齐
- 微信小程序 WebView 有最长 5 分钟 React Query 缓存，用户侧需退出小程序重进或等待缓存过期才能看到 ¥9.9

