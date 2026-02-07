

## 修复有劲合伙人佣金比例不一致

### 问题

多个文件中硬编码的佣金比例与数据库 `partner_level_rules` 表定义不一致。数据库中的正确值为：
- L1 初级：一级 18%，二级 0%
- L2 高级：一级 30%，二级 5%
- L3 钻石：一级 50%，二级 12%

### 修改清单

#### 1. `src/components/admin/AddPartnerDialog.tsx`（第 19-23 行）

将 `LEVEL_CONFIG` 中的硬编码佣金比例修正为：

| 等级 | 修改前 | 修改后 |
|------|--------|--------|
| L1 | l1Rate: 20, l2Rate: 0 | l1Rate: 18, l2Rate: 0 |
| L2 | l1Rate: 35, l2Rate: 0 | l1Rate: 30, l2Rate: 5 |
| L3 | l1Rate: 50, l2Rate: 10 | l1Rate: 50, l2Rate: 12 |

#### 2. `src/pages/YoujinPartnerTerms.tsx`（第 59 行）

将佣金说明文字从 `L1: 20%, L2: 35%, L3: 50%` 改为 `L1: 18%, L2: 30%, L3: 50%`

#### 3. `src/pages/PartnerTypeSelector.tsx`（第 88 行、第 155 行）

- 第 88 行：`"预购体验包，根据数量获得20%-50%佣金"` 改为 `"预购体验包，根据数量获得18%-50%佣金"`
- 第 155 行：`"佣金比例20%-50%，取决于预购数量"` 改为 `"佣金比例18%-50%，取决于预购数量"`

#### 4. `src/components/poster/PosterTemplateGrid.tsx`（第 230 行、第 239 行）

- 第 230 行：`'分享就能赚取20%-50%佣金'` 改为 `'分享就能赚取18%-50%佣金'`
- 第 239 行：`'20%-50%高额佣金'` 改为 `'18%-50%高额佣金'`

### 已确认一致的文件（无需修改）

以下文件已使用正确的 18%-50% 比例：
- `src/pages/Partner.tsx`（18%-50%）
- `src/pages/PlatformIntro.tsx`（18%-50%）
- `src/components/partner/PartnerPlanShareCard.tsx`（18%-50%）
- `src/config/partnerLevels.ts`（18%/30%/50% + 0%/5%/12%）

### 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/admin/AddPartnerDialog.tsx` | 修改 | L1: 18%/0%, L2: 30%/5%, L3: 50%/12% |
| `src/pages/YoujinPartnerTerms.tsx` | 修改 | L1: 18%, L2: 30% |
| `src/pages/PartnerTypeSelector.tsx` | 修改 | 20%-50% 改为 18%-50%（两处） |
| `src/components/poster/PosterTemplateGrid.tsx` | 修改 | 20%-50% 改为 18%-50%（两处） |

无需数据库变更，仅前端文案和配置修正。
