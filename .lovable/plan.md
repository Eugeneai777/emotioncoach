

## 绽放合伙人权益矩阵表格设计

### 需求分析

参考有劲合伙人的表格样式，为"绽放合伙人"设计类似的权益矩阵展示。由于绽放合伙人只有一个等级（L0），与有劲合伙人的三级结构（L1/L2/L3）不同，需要调整展示策略。

**设计策略**：采用单列权益列表 + 可分成产品矩阵的混合布局

---

### 现有数据

**绽放产品线（可分成产品）**：

| 产品名称 | 价格 | 佣金（30%/10%） |
|:---------|:-----|:----------------|
| 身份绽放训练营 | ¥2,980 | ¥894 / ¥298 |
| 情感绽放训练营 | ¥3,980 | ¥1,194 / ¥398 |
| 生命绽放特训营 | ¥12,800 | ¥3,840 / ¥1,280 |
| 绽放教练认证 | ¥16,800 | ¥5,040 / ¥1,680 |
| 绽放合伙人套餐 | ¥19,800 | ¥5,940 / ¥1,980 |

**绽放合伙人基础权益**：
- 一级佣金：30%
- 二级佣金：10%
- 专属推广码
- 合伙人专属社群
- 定期培训课程
- 包含身份+情感训练营

---

### 实施方案

#### 文件修改：`src/components/ProductComparisonTable.tsx`

**修改范围**：第969-1024行的 `bloom-partner` 分支

#### 新设计结构

1. **价值主张区**（渐变背景卡片）
   - 图标 + 标题 + 副标题
   - 价格显示
   - 核心权益标签（直推30%、二级10%、专属培训）

2. **基础信息表格**（参考有劲合伙人）
   - 价格：¥19,800
   - 包含产品：身份绽放 + 情感绽放
   - 一级佣金：30%
   - 二级佣金：10%

3. **可分成产品矩阵**（核心新增）
   - 表头：产品名称 | 产品价格 | 一级佣金 | 二级佣金
   - 5款绽放产品列表
   - 每行显示：产品名 | ¥价格 | ✓ ¥金额 | ✓ ¥金额

4. **专属权益列表**
   - 专属推广二维码
   - 合伙人专属社群
   - 定期培训课程
   - VIP客服支持

5. **购买按钮区**

---

### 代码实现

```tsx
// 绽放合伙人 - 权益矩阵展示
if (category === 'bloom-partner') {
  // 绽放产品列表（用于可分成产品矩阵）
  const bloomProducts = [
    { name: '身份绽放训练营', price: identityCampPrice, icon: '🦋' },
    { name: '情感绽放训练营', price: emotionCampPrice, icon: '💚' },
    { name: '生命绽放特训营', price: bloomLifeCampPrice, icon: '🔥' },
    { name: '绽放教练认证', price: bloomCoachCertPrice, icon: '📜' },
    { name: '绽放合伙人', price: bloomPartnerPrice, icon: '👑' },
  ];

  // 基础权益
  const basicInfo = [
    { name: '价格', value: `¥${bloomPartnerPrice.toLocaleString()}` },
    { name: '包含产品', value: '身份绽放 + 情感绽放' },
    { name: '一级佣金', value: '30%' },
    { name: '二级佣金', value: '10%' },
  ];

  // 专属权益
  const exclusiveRights = [
    '专属推广二维码',
    '合伙人专属社群',
    '定期培训课程',
    'VIP客服支持',
  ];

  return (
    <div className="space-y-4">
      {/* 价值主张区 */}
      <MobileCard className="...">
        价格 + 核心权益标签
      </MobileCard>

      {/* 权益矩阵表格 */}
      <Card>
        <table>
          <thead>
            <tr>
              <th>权益项目</th>
              <th>绽放合伙人</th>
            </tr>
          </thead>
          <tbody>
            {/* 基础信息 */}
            {/* 佣金权益 */}
            {/* 可分成产品（带具体金额） */}
            {/* 专属权益（打勾） */}
          </tbody>
        </table>
      </Card>

      {/* 购买按钮 */}
    </div>
  );
}
```

---

### 移动端与桌面端适配

**移动端**（当前实现）：
- 保持卡片堆叠布局
- 使用垂直列表展示可分成产品
- 每个产品显示：图标 + 名称 + 价格 + 佣金

**桌面端**（新增）：
- 使用与有劲合伙人相同的表格布局
- 单列表格（因为只有一个等级）
- 分类行展示：基础信息、佣金权益、可分成产品、专属权益

---

### 配置文件更新

#### 新增：`src/config/productComparison.ts`

添加绽放合伙人权益配置：

```typescript
export interface BloomPartnerFeature extends ComparisonFeature {
  category: '基础信息' | '佣金权益' | '可分成产品' | '专属权益';
  value: boolean | string;
}

export const bloomPartnerFeatures: BloomPartnerFeature[] = [
  // 基础信息
  { name: "价格", category: "基础信息", value: "¥19,800" },
  { name: "包含产品", category: "基础信息", value: "身份绽放 + 情感绽放" },
  
  // 佣金权益
  { name: "一级佣金", category: "佣金权益", value: "30%" },
  { name: "二级佣金", category: "佣金权益", value: "10%" },
  
  // 可分成产品
  { name: "身份绽放训练营 ¥2,980", category: "可分成产品", value: true },
  { name: "情感绽放训练营 ¥3,980", category: "可分成产品", value: true },
  { name: "生命绽放特训营 ¥12,800", category: "可分成产品", value: true },
  { name: "绽放教练认证 ¥16,800", category: "可分成产品", value: true },
  { name: "绽放合伙人 ¥19,800", category: "可分成产品", value: true },
  
  // 专属权益
  { name: "专属推广二维码", category: "专属权益", value: true },
  { name: "合伙人专属社群", category: "专属权益", value: true },
  { name: "定期培训课程", category: "专属权益", value: true },
  { name: "VIP客服支持", category: "专属权益", value: true },
];
```

---

### 涉及文件

| 文件 | 修改内容 |
|:-----|:---------|
| `src/config/productComparison.ts` | 新增 `BloomPartnerFeature` 接口和 `bloomPartnerFeatures` 数据 |
| `src/components/ProductComparisonTable.tsx` | 重写 `bloom-partner` 分支，实现矩阵表格展示 |

---

### 预期效果

**视觉效果**：
- 与有劲合伙人表格风格统一
- 分类清晰：基础信息、佣金权益、可分成产品、专属权益
- 紫粉渐变主题色（区别于有劲的橙色）

**信息展示**：
- 可分成产品列表完整展示5款绽放产品
- 每个产品显示价格和佣金比例
- 一目了然的收益预期

**交互**：
- 移动端：紧凑卡片布局
- 桌面端：完整表格布局
- 保留"立即购买"和"了解详情"按钮

