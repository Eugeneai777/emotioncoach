# 修复 35+女性竞争力测评 海报扫码 404

## 现象
扫描海报二维码 → 跳到 `/assessment/women-competitiveness` → 页面提示"测评不存在或已下线"。

## 根因
项目里同一个测评有两种拼写：
- 数据库/动态测评模板 key：`women_competitiveness`（下划线，唯一真源）
- App.tsx 路由：`/women-competitiveness` → 重定向到 `/assessment/women_competitiveness` ✅
- **海报分享卡** `AssessmentPromoShareCard.tsx` L57 `sharePath: '/assessment/women-competitiveness'` ❌（短横线）
- 管理后台 `DramaScriptGenerator.tsx` L92 也写成短横线 ❌

`DynamicAssessmentPage` 用 `useParams().assessmentKey` 直接去 DB 查 `assessment_templates.assessment_key`，短横线版本查不到 → 显示"测评不存在或已下线"。

## 修复方案

### 1. 修正海报二维码链接（核心问题）
- `src/components/dynamic-assessment/AssessmentPromoShareCard.tsx` L57
  `sharePath: '/assessment/women-competitiveness'` → `'/assessment/women_competitiveness'`

### 2. 后台脚本生成器同步修正
- `src/components/admin/DramaScriptGenerator.tsx` L92
  `route` 与 `url` 中的 `women-competitiveness` → `women_competitiveness`

### 3. 加一道安全网（兜底已经流出去的旧海报）
在 `src/App.tsx` 增加一条别名重定向：
```tsx
<Route path="/assessment/women-competitiveness" 
       element={<Navigate to="/assessment/women_competitiveness" replace />} />
```
这样以前已经分享出去的海报二维码也不会再 404。

## 不在本次修改范围
- 不动 DB 模板的 assessment_key（保持下划线唯一标准）
- 不动其它测评（emotion_health / midlife_awakening 等）
- 不动权益、登录等业务逻辑
