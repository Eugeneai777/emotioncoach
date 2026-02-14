

## AI 定制落地页输入改为下拉菜单 + 支持自定义输入

### 改动范围

仅修改 `src/components/partner/AILandingPageWizard.tsx` 的 Step 0（输入人群信息）。

### 交互设计

每个字段都采用 **下拉选择 + 自定义输入** 的混合模式：选项列表底部始终有一个"自定义输入"选项，选中后切换为文本框让用户自由填写。

```text
目标人群：   [下拉] 35+女性 / 青少年&家长 / 中年男性 / 📝 自定义...
关注点：     [下拉，级联] 根据人群动态显示 / 📝 自定义...
痛点话题：   [多选下拉，级联] 根据人群+关注点显示，可勾选多个 / 📝 自定义...
投放渠道：   [下拉] 微信公众号 / 朋友圈 / 抖音 / 小红书 / 线下 / 📝 自定义...
预计投放量： [下拉] 1000以下 / 1000-5000 / 5000-10000 / 10000+ / 📝 自定义...
```

### 级联数据（来自附件截图）

**35+女性：**
- 职场压力：工作家庭两头烧 / 35+隐形歧视 / 能力陷阱突破天花板
- 自我成长：内耗太多 / 活成别人期待的样子 / 想改变又迈不出第一步
- 睡眠问题：失眠焦虑 / 半夜醒来 / 安眠药依赖
- 亲子沟通：孩子不愿说话 / 吼完孩子后悔 / 青春期叛逆

**青少年 & 家长：**
- 学习问题：一写作业就磨蹭 / 考试焦虑 / 厌学情绪
- 情绪管理：孩子情绪失控 / 动不动就哭 / 社交退缩
- 睡眠科普：晚上不肯睡 / 睡眠不足影响发育 / 噩梦频繁
- 亲子关系：说什么都不听 / 手机依赖 / 二胎矛盾

**中年男性：**
- 亲子关系：不知道怎么跟孩子聊天 / 孩子只找妈妈 / 爸爸角色缺失
- 夫妻关系：无话可说 / 争吵冷战 / 中年危机
- 经济相关：收入焦虑 / 职业转型 / 投资失利后心态崩塌

### 技术方案

1. 在组件顶部新增 `AUDIENCE_DATA` 常量存放完整级联数据
2. 新增 `CHANNEL_OPTIONS` 和 `VOLUME_OPTIONS` 常量
3. 为每个字段实现"Select + 自定义"模式：
   - Select 值为 `"__custom__"` 时显示 Input 文本框
   - 否则直接用选中的预设值
4. 痛点话题使用 Popover + Checkbox 列表实现多选，底部额外提供自定义 Input
5. 级联逻辑：切换人群时重置关注点和痛点；切换关注点时重置痛点
6. 最终提交时将自定义输入值与预设选中值合并

### 状态变更

```typescript
// 新增状态
const [isCustomAudience, setIsCustomAudience] = useState(false);
const [isCustomChannel, setIsCustomChannel] = useState(false);
const [isCustomVolume, setIsCustomVolume] = useState(false);
const [selectedFocus, setSelectedFocus] = useState("");       // 关注点（新增字段）
const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([]); // 多选痛点
const [customPainPoint, setCustomPainPoint] = useState("");   // 自定义痛点输入
```

当用户从下拉选择预设项时直接赋值；选择"自定义"时切换为文本输入框，用户可自由填写。两种模式的值统一写入现有的 `targetAudience`、`painPoints`、`channel`、`volume` 状态，后续逻辑无需改动。

