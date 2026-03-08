

## 内容优化：对齐参考站点 leadai.life/living-lab

对比参考站点和当前实现，当前页面缺少大量内容区块。参考站点结构丰富得多：

```text
参考站点结构                     当前实现
─────────────                  ─────────
Hero 语音卡片                   ✅ 有
四入口图标                      ✅ 有
"还想探索更多？" 折叠             ✅ 有（但内容不同）
  → 四路径详细卡片(2x2带描述)     ❌ 缺少（现在只有5个服务小图标）
使用场景区块(4个场景卡片)          ❌ 缺少
用户故事/证言区块(3条真实反馈)     ❌ 缺少
底部CTA(再次引导对话)             ❌ 缺少
```

### 改动计划

#### 1. 重写折叠区内容 — 四路径详细卡片
替换 `QuickNavFooter` 在折叠区的位置，新增 `PathDetailCards` 组件：
- 2x2 网格布局，每张卡片包含：图标、标题、副标题、一段描述文字
- 四条路径与 SuperEntry 的四入口对应：不太舒服/记录觉察/看清自己/真正改变
- 点击跳转到对应路由
- 暖色毛玻璃风格，与现有温暖有机主题一致

#### 2. 新增使用场景区块 `UseCasesSection`
- 标题："什么时候可以找有劲AI？"，副标题："任何时刻，任何情绪，它都在"
- 4个场景卡片：深夜焦虑时、职场迷茫时、关系困扰时、想要成长时
- 每个卡片有标题+描述段落
- 竖向排列，暖色调卡片样式

#### 3. 新增用户故事区块 `TestimonialsSection`
- 标题："他们的真实体验"
- 3条用户证言卡片，每条包含：引用文字、头像(首字母)、昵称、身份描述
- 横向滚动或竖向排列

#### 4. 新增底部CTA区块
- "开始和你的AI生活教练对话"
- 引导点击语音按钮或跳转

#### 5. 调整 `LivingLab.tsx` 页面结构
- 折叠区内容改为：PathDetailCards + UseCasesSection + TestimonialsSection + QuickNavFooter(更多服务保留在最底部) + 底部CTA
- 保持折叠交互不变

### 改动文件
- `src/components/living-lab/PathDetailCards.tsx` — 新建
- `src/components/living-lab/UseCasesSection.tsx` — 新建
- `src/components/living-lab/TestimonialsSection.tsx` — 新建
- `src/components/living-lab/BottomCTA.tsx` — 新建
- `src/pages/LivingLab.tsx` — 集成新区块到折叠内容区

