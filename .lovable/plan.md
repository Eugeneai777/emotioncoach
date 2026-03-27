

# 教练团队数据更新 + 排版重构（手机/电脑端兼容）

## 改动内容

### 1. 数据更新（第116-122行）

将 `coachTeam` 数组重写为完整结构：

```typescript
const coachTeam = [
  {
    name: "晓一", role: "教练",
    title: "绽放者联盟生命教练",
    certifications: ["特教音乐疗愈师", "青少年足球教练", "德国TJ发型设计深圳总监"],
    specialties: ["婚姻家庭", "个人成长", "情绪管理", "人际沟通"],
    motto: "人不是被教导的，而是被启示的",
    image: coachXiaoyi,
  },
  {
    name: "肖剑雄", role: "教练",
    title: "绽放者联盟发展运营合伙人",
    certifications: ["心理教练"],
    specialties: ["婚姻关系", "亲子关系", "职业焦虑", "生命成长"],
    motto: "倾听、陪伴、觉察，升维",
    image: coachXiaojianxiong,
  },
  {
    name: "Amy", role: "教练",
    title: "绽放联盟教练 · 中国社科院经济学研究生",
    certifications: ["生命绽放教练", "心理咨询师", "家庭教育指导师"],
    specialties: ["情感困惑", "亲子关系", "身心疗愈"],
    motto: "全情陪伴，滋养生命",
    image: coachAmy,
  },
  {
    name: "木棉", role: "教练",
    title: "企业人力资源管理顾问",
    certifications: ["心理咨询师", "格森自然疗法教练", "补水自然疗法教练", "芳香治疗师"],
    specialties: ["身心互动整体疗愈", "身心灵排毒", "细胞激活"],
    motto: "流水不争先，争的是滔滔不绝",
    image: coachMumian,
  },
  {
    name: "贝蒂", role: "教练",
    title: "绽放者联盟教练",
    certifications: ["国家二级教师", "心理咨询师", "天赋测评&分析师"],
    specialties: ["个人生命重建", "亲密关系", "亲子关系"],
    motto: "陪伴你，看见自己的美好",
    image: coachBetty,
  },
];
```

### 2. 排版重构（第794-821行）— 单列完整卡片

从 `grid-cols-2` 改为**单列布局**，每张卡片采用左头像 + 右信息区的横排设计：

- **移动端**：单列全宽，头像 56px，信息区紧凑排列
- **桌面端**：单列全宽（max-w-lg 居中），头像 64px，信息区宽松

每张卡片内容层级：
1. 姓名 + "教练"标签（同行）
2. 身份 title（灰色小字）
3. 认证标签（flex-wrap，浅灰底圆角 tag）
4. 擅长问题（flex-wrap，橙色调标签）
5. 座右铭（斜体）

响应式要点：
- 卡片使用 `flex` 横排（非 grid），移动端 `gap-3`，桌面端 `gap-4`
- 标签使用 `flex-wrap` 自然换行，不会溢出
- 整体外层 `max-w-lg mx-auto` 居中，桌面端不会过宽

### 3. 黛汐总教练卡片（第773-792行）

同步增加 `title: "绽放者联盟创始人&总教练"` 和 `specialties` 展示行，与团队卡片风格一致但更大更突出。

## 改动文件

仅 `src/pages/SynergyPromoPage.tsx`

