

## 需求

将官网 hunyinyoudao.com 的品牌内容同步到 `/marriage` 页面，使其更专业、更完整。

## 官网抓取到的关键内容

1. **品牌定位**：婚姻全生命周期生态平台，愿景"让每一对夫妻享受婚姻之旅"
2. **使命愿景**：使命（让每一对夫妻享受婚姻之旅，助力幸福中国）、愿景（最值得信赖的婚姻服务平台）、五年目标（让100万个家庭婚姻更幸福）、价值观（成长与爱）
3. **四大优势**：专业深耕20年、科技驱动（AI+大数据）、政企合作（政府认证供应商）、覆盖全国
4. **核心团队**：高牵牛（首席专家）、何华（执行院长）
5. **联系方式**：联系人有有、电话17722451217、地址深圳南山海岸城东座A区1503
6. **知识产权**：多项作品登记证、软著登记证、商标注册证

## 修改计划

### 1. MarriageHero — 更新品牌标语

- 副标题 badge 改为："婚姻全生命周期服务生态平台"
- 描述文案增加愿景感："让每一对夫妻享受婚姻之旅"
- Trust badges 更新为官网四大优势的精简版：专业深耕20年、AI+大数据驱动、政府认证供应商

### 2. MarriageWhyUs — 用官网优势替换

将现有4个优势项更新为官网的四大优势：
- 专业深耕：婚姻情感领域专业深耕20年
- 科技驱动：大数据及人工智能技术支撑
- 政企合作：政府认证的专业供应商，知名企业战略合作伙伴
- 覆盖全国：遍及全国的咨询师队伍

### 3. 新增 MarriageMission 组件

在 WhyUs 下方新增使命愿景板块，展示：
- 使命：让每一对夫妻享受婚姻之旅，助力幸福中国
- 愿景：最值得信赖的婚姻服务平台
- 五年目标：让100万个家庭婚姻更幸福
- 价值观：成长与爱

采用紫色主题卡片网格布局。

### 4. 新增 MarriageTeam 组件

在 Mission 下方展示核心团队：
- 高牵牛 — 婚因有道学苑首席专家
- 何华 — 婚因有道学苑执行院长

使用头像占位 + 名字 + 头衔的简洁卡片样式。

### 5. MarriageFooter — 补充联系信息

- 增加联系人、电话、地址
- 增加"婚姻全生命周期服务生态平台"定位语

### 6. MarriageHome — 组装新组件

在页面中插入新组件，顺序：
Hero → PainPoints → AssessmentCards → AIToolCards → WhyUs → **Mission** → **Team** → Steps → CTA → Footer → Nav

## 改动文件清单

| 文件 | 操作 |
|------|------|
| `src/components/marriage/MarriageHero.tsx` | 更新文案 |
| `src/components/marriage/MarriageWhyUs.tsx` | 更新优势内容 |
| `src/components/marriage/MarriageMission.tsx` | 新建 |
| `src/components/marriage/MarriageTeam.tsx` | 新建 |
| `src/components/marriage/MarriageFooter.tsx` | 补充联系信息 |
| `src/pages/marriage/MarriageHome.tsx` | 引入新组件 |

不涉及数据库、Edge Function 或业务逻辑变更。

