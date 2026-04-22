

## 核查结论：当前 `/promo/midlife-men-399` 缺失图片素材

### 现状

当前 `src/pages/PromoMidlifeMen399.tsx`（547 行）**不包含任何 `<img>` 标签**：
- 知乐胶囊：仅文案提及，用 `Pill` 图标替代
- 教练展示：仅文案提及，用 `Users` / `Bot` 图标替代
- 整页 0 张真实图片

### 你昨天的版本（参考 `SynergyPromoPage.tsx`）应包含

仓库中**已有全部素材**，且其他推广页都在用：

| 类型 | 素材 | 当前使用方 |
|---|---|---|
| 产品图 | `zhile-capsules.jpeg` / `zhile-product-new.jpg` / `zhile-capsule-detail-1/2.png` | SynergyPromoPage、ZhileHavrutaPromoPage、ZhilePromoHub 等 5 个页面 |
| 主教练 | `coach-daixi.jpg`（戴西）| SynergyPromoPage 主教练展示位 |
| 教练团 | `coach-xiaoyi.png` / `coach-amy.jpg` / `coach-mumian.jpg` / `coach-xiaojianxiong.jpg` / `coach-betty.jpg` | SynergyPromoPage 教练矩阵 |
| 企微二维码 | `wecom-coach-qr.jpg` | SynergyPromoPage 助教联系位 |

→ 当前版本应该是某次重构（可能是只改文案的一次提交）**意外丢失了图片块**，回退到了纯图标版。

### 恢复方案（建议二选一，等你确认）

**方案 A：从 `SynergyPromoPage.tsx` 移植图片模块（推荐）**
- 将 SynergyPromoPage 的 3 个图片区块（产品大图 + 主教练戴西卡 + 教练矩阵 6 人）按男士专区视觉适配后插入 midlife-men-399
- 保留当前 547 行的文案、定价、海沃塔承诺、CTA 不变
- 仅在以下位置插入图片：
  - **核心权益 02 知乐胶囊**（line 186 附近）→ 加 `zhile-capsules.jpeg` 大图
  - **核心权益 01 海沃塔小组**（line 181 附近）→ 加主教练戴西头像 + 名字 + 1 行身份
  - **新增第 X 屏「带场教练团」** → 6 人教练头像 grid（与 SynergyPromoPage 一致）

**方案 B：通过 History 找回昨天版本**
- 你打开右上角 🕐 历史记录（或 ⌘+K → "History"），找到昨天最后包含图片的版本，点 "Restore"
- 然后把后续仅文案的修改（如本次 "1v1" 移除）手动重新应用一次即可
- 优点：100% 还原你昨天的视觉；缺点：需要你手动定位时间点

### 建议

走 **方案 A**——更可控、不丢失后续文案修改、且能保证与 `SynergyPromoPage` 同款的成熟视觉表现。如果你确认要走 A，我会：

1. 在 `PromoMidlifeMen399.tsx` 顶部追加 8 个 `import` 语句（zhile-capsules + 6 教练 + 企微二维码）
2. 在「核心权益 02」处插入胶囊产品图
3. 在「核心权益 01」处插入戴西主教练卡
4. 在隐私承诺前新增一屏「带场教练团 · 6 位真人教练」头像矩阵

预计改动：1 个文件，约 +80 行 JSX，不动文案/定价/支付逻辑。

