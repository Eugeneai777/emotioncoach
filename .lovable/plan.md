

## 移除画框中"1v1"文案

**问题定位**：`/promo/midlife-men-399` 第 5 屏「4 条不可妥协的隐私承诺」第 3 条目前文案为「**1v1 沟通仅你与教练可见**」，与同类页面（`SynergyPromoPage.tsx` 第 968 行）的「沟通仅你与教练可见」不一致。

**改动**：1 个文件 1 行

| 文件 | 行 | 改动前 | 改动后 |
|---|---|---|---|
| `src/pages/PromoMidlifeMen399.tsx` | 310 | `{ t: "1v1 沟通仅你与教练可见", d: "平台不留对话记录" }` | `{ t: "沟通仅你与教练可见", d: "平台不留对话记录" }` |

**影响面**：
- ✅ 仅纯文案修改，不动样式/布局/逻辑
- ✅ 与 `SynergyPromoPage` 同类承诺文案保持一致
- ✅ 不影响其它推广页 / 海报 / 分享卡

**附**：此类纯文案微调推荐使用 **Visual Edits**（直接在预览中点选元素改字，免费且更快），无需消耗 AI 额度。
<lov-actions>
  <lov-link url="https://docs.lovable.dev/features/visual-edit">了解 Visual Edits</lov-link>
</lov-actions>

