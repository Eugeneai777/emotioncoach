## 一、背景

`/assessment/male_midlife_vitality` 为免费入口，结果页两处优化：

1. **「保存完整报告」按钮**改为「截图 + 加企微 + 报领取码」换 PDF —— 沉淀私域、制造稀缺
2. **「看看身份绽放训练营」（¥3980）**直接移除，与免费入口客单价错位

女性版（`women_competitiveness`）本次**不动**。

---

## 二、商业架构（核心闭环）

```text
用户测评完成 / 进入历史记录详情
   ↓
结果页底部出现【你的专属凭证】品牌海报卡：
   ┌──────────────────────────────────────┐
   │  深色渐变背景 + 顶部品牌色光晕         │
   │  ─────────────────────────────────   │
   │  [头像] 用户昵称                      │
   │         男人有劲状态测评 · 已完成      │
   │                                      │
   │  ⚡ 状态指数  78%   状态：可调整       │
   │                                      │
   │  ━━━━━━━━ 你的领取码 ━━━━━━━━        │
   │            M 7 K 9 P 2                │
   │       （超大字号 · 字间距明显）        │
   │  限时免费领 · 1 个工作日内送达         │
   │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━        │
   │                                      │
   │       [企微二维码 · 已上传]            │
   │      长按识别添加运营企微              │
   │                                      │
   │  发完截图把领取码报给运营即可          │
   └──────────────────────────────────────┘

   操作引导：
   ① 截图本卡片  ② 长按二维码加运营企微
   ③ 把"截图 + 领取码"发给运营 → 1 个工作日收到完整 PDF
   ↓
运营在管理台「男人有劲数据洞察 → 测评者名单」：
   - 输入领取码 M7K9P2 → 精准定位记录
   - 「导出 PDF」→ 复用 MaleVitalityReportCard 渲染下载
   - 「复制话术」→ "@昵称 你好，这是你的【男人有劲状态】完整报告..."
```

**领取码设计**：
- 6 位字符集 `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`（去 0/O/1/I/L），≈ 10 亿组合
- 数据库唯一约束 + 触发器自动生成
- 永久有效，文案标"限时免费领"制造紧迫感

---

## 三、数据库（含历史数据兼容）

`partner_assessment_results` 新增：
- `claim_code TEXT UNIQUE`
- 触发器：插入 NULL 时自动生成（冲突重试）
- **历史数据回填（关键）**：迁移内一次性 `UPDATE` 所有 `male_midlife_vitality` 模板下 `claim_code IS NULL` 的旧记录，给每条都生成唯一码
- 后续在该表查询时无论是新测的还是历史的，每条记录都已有 `claim_code`
- RLS：用户本人可读自己的码；admin / partner_admin 可按码查询

**对老用户的体验**：
- 之前测过但还没拿到 PDF 的用户，进入「历史记录」点开任一条 → 看到的也是新的"加企微凭证卡"，码已就位
- 把任意一次旧测评的码报给运营，管理台都能精准定位到那条具体记录（而不是最新一次）

---

## 四、用户端改动 `DynamicAssessmentResult.tsx`

### 1. 移除身份绽放卡（lines 934-949）
`isMaleMidlifeVitality` 分支只保留「7天有劲训练营」¥399 卡。

### 2. 替换「保存完整报告」按钮（lines 1093-1110）
拆分原 `(isMaleMidlifeVitality || isWomenCompetitiveness)`：
- 女性版保持原按钮不动
- 男性版替换为 **「📩 加运营企微 · 免费领完整 PDF 报告」**，点击 → 打开 `<MaleVitalityPdfClaimSheet />`

### 3. 历史记录入口同步生效
`useDynamicAssessmentHistory` 拉取的每条记录都自带 `claim_code`，点击进入详情 → 复用同一个结果页 → 自动看到对应那次测评的专属码

### 4. 新增组件
- `MaleVitalityPdfClaimCard.tsx` —— 海报凭证卡（深色渐变 + 大领取码 + 企微码 + 用户信息），固定 750px 宽便于截图
- `MaleVitalityPdfClaimSheet.tsx` —— 底部 Sheet：三步操作引导 + 凭证卡渲染区 + "保存到相册" + "复制领取码"
- 企微图：`src/assets/qiwei-operation-qr.jpg`（已就位）

### 5. 埋点
`behaviorTracker` 新增：`pdf_claim_sheet_opened` / `pdf_claim_code_copied` / `pdf_claim_card_saved`

---

## 五、管理台改动

### `AssessmentRespondentDrawer.tsx` & `AssessmentInsightsDetail.tsx`
- 仅 `male_midlife_vitality` 模板出现「按领取码搜索」输入框
- 名单每行新增 `claim_code` 标签列
- 新增两个行操作：
  - **导出 PDF**：复用现有 `MaleVitalityReportCard` + `exportNodeToPdf`，隐藏 DOM 渲染该用户数据后下载
  - **复制话术**：自动复制带昵称的回复模板

---

## 六、文件改动清单

```text
src/
├── components/
│   ├── dynamic-assessment/
│   │   ├── DynamicAssessmentResult.tsx           [改]
│   │   ├── MaleVitalityPdfClaimCard.tsx          [新]
│   │   └── MaleVitalityPdfClaimSheet.tsx         [新]
│   └── admin/
│       ├── AssessmentRespondentDrawer.tsx        [改]
│       └── AssessmentInsightsDetail.tsx          [改]
├── utils/
│   └── claimCodeUtils.ts                          [新]
└── assets/
    └── qiwei-operation-qr.jpg                    [已就位]

supabase/migrations/[ts]_add_claim_code_to_assessment.sql  [新]
   - ALTER TABLE 加 claim_code
   - CREATE UNIQUE INDEX
   - 触发器自动生成
   - 一次性 UPDATE 回填所有 male_midlife_vitality 历史记录
```

**遵循的项目规范**：海报先本地渲染再异步上传 · SDK CRUD `.select()` + length 检查 · 导航优先于关闭 Sheet（防 WebView 重入）

---

## 七、文案要点

- 主按钮：**📩 加运营企微 · 免费领完整 PDF 报告**
- 卡片标题：**【你的专属凭证】**
- 副标语：**限时免费领 · 1 个工作日内送达**
- 领取码上方：**报这串码给运营 ↓**
- 底部小字：**仅供本人使用，请勿外传**

---

## 八、验收

1. 男性版结果页不再出现「身份绽放训练营」卡
2. AI 洞察生成后，原「保存完整报告」位置变成「📩 加运营企微 · 免费领完整 PDF」
3. 点击 → 弹出底部 Sheet，凭证卡含昵称头像、状态指数、6 位领取码、企微二维码
4. 「保存到相册」生成 PNG；「复制领取码」一键复制
5. **历史记录里的旧测评进入后也能看到领取码**（迁移已回填）
6. 管理台「测评者名单」可按码精准搜索；「导出 PDF」生成完整报告下载；「复制话术」可用
7. 女性版完全无变化
