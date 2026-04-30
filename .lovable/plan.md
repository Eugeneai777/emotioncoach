## 评估结论：✅ 完全可以实现，且成本很低

需求本质是：在手机 H5（特别是微信内）分享 `/assessment/male_midlife_vitality` 时，对方收到的不是裸链接，而是**带标题、描述、封面图的卡片**（小鹅通/公众号文章那种样式）。

项目已经具备完整能力，只是这个页面**还没接入**。

---

## 当前现状

- ✅ 已有 `DynamicOGMeta` 组件（`src/components/common/DynamicOGMeta.tsx`）：自动注入 OG meta 标签 + 调用微信 JSSDK `updateAppMessageShareData` / `updateTimelineShareData`，可同时覆盖**微信内分享**和**外部平台（小鹅通/朋友圈链接预览/iMessage/飞书等）**。
- ✅ 已有 `usePageOG` hook：从数据库读取每个页面的 OG 配置，支持后台实时改文案/换封面。
- ✅ 已有微信 JS-SDK 签名缓存与 `wx.ready` 时序处理。
- ❌ `/assessment/:assessmentKey` 这条动态路由对应的页面**没有挂 `DynamicOGMeta`**，所以现在分享出去只能拿到 `index.html` 的默认标题和默认 OG 图。

## 各端表现说明

| 场景 | 现状 | 接入后 |
|---|---|---|
| 微信内分享给好友/群 | 标题=网站默认；无封面 | 显示"男人有劲状态测评"标题、定制描述、封面图（标准卡片） |
| 微信朋友圈分享 | 同上，无封面 | 标题+封面图 |
| 复制链接到小鹅通/公众号编辑器/飞书/钉钉/iMessage | 抓取 OG meta，命中默认 | 抓到测评专属 OG 标题/描述/封面 |
| PC 浏览器 | 不影响 | 不影响（仅 OG meta，无副作用） |
| 小程序 webview 内 | wx.share 不可用属正常 | OG meta 仍生效，分享走小程序自身 onShareAppMessage（已有逻辑） |

## 实施步骤

1. **在 OG 配置后台/`og_configurations` 表新增 `pageKey`**：`maleMidlifeVitalityAssessment`
   - 标题（30 字内）：建议 `"男人有劲状态测评｜6 维评估，3 分钟看见自己"`
   - 描述（80 字内）：建议 `"精力·睡眠·情绪·关系·价值感·性活力，一次看清中年男人的能量底盘，并获得 AI 个性化建议。"`
   - 封面图：1200×630（1.91:1），可复用现有 `MaleMidlifeVitalityShareCard` 设计风格出一张静态横版 OG 图
   - URL：`https://wechat.eugenewe.net/assessment/male_midlife_vitality`

2. **在动态测评页（`DynamicAssessmentIntro` 或承载 `/assessment/:key` 的页面组件）顶部加上**：
   ```tsx
   {template.assessment_key === 'male_midlife_vitality' && (
     <DynamicOGMeta pageKey="maleMidlifeVitalityAssessment" />
   )}
   ```
   - 用 `overrides` 也可以做"已完成测评后封面切换为用户得分卡"这一进阶玩法（可选，二期）。

3. **在测评结果页（`DynamicAssessmentResult`）同样挂一份**，并通过 `overrides.description` 把结果摘要带进去——分享出去的链接会显示"我得了 XX 分，主导模式：XXX"，转化更强（可选，建议做）。

4. **验收**：
   - 微信"开发者工具→公众号网页调试"或真机长按链接 → 看卡片
   - 用 https://opengraph.dev/ 抓 `wechat.eugenewe.net/assessment/male_midlife_vitality` 验证 OG
   - 复制链接粘到飞书/钉钉/iMessage 验证预览

## 预计工作量
~15 分钟代码 + OG 封面图 1 张（可现取 `MaleMidlifeVitalityShareCard` 截图改尺寸）。

## 限制 / 注意事项

- **微信卡片样式不可深度自定义**：微信只允许 `title / desc / imgUrl / link` 四个字段，做不到小鹅通课程详情那种"价格+按钮"复合卡片。这是微信平台限制，不是技术问题。
- **必须在已配置 JS 安全域名的域名下打开**才会生效（`wechat.eugenewe.net` 已配置）。预览域 `lovable.app` 下不会出现微信自定义卡片。
- **首次分享有 1~2 秒签名等待**，已有缓存逻辑兜底，第二次起即时。

是否按此方案推进？批准后我将：① 新增/写入 OG 配置；② 在测评 intro 与 result 两处挂 `DynamicOGMeta`；③ 提供建议封面图规格让你上传，或直接用现有素材合成一张。
