

# 补充缺失的「每日学习流程」闭环总结卡片

## 问题

上一轮计划中承诺在流程图下方新增一段 indigo 渐变总结卡片，但实际代码未写入。当前 L742-745 流程图结束后直接关闭了 Section，缺少这段内容。

## 改动

### `src/pages/IdentityBloomPromoPage.tsx` L743-744

在 `</div>` (L743) 和 `</div>` (L744) 之间（流程图容器关闭后、Section 关闭前），插入总结卡片：

```tsx
{/* 闭环总结卡片 */}
<motion.div
  initial={{ opacity: 0, y: 12 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  className="max-w-lg mx-auto mt-6 rounded-2xl bg-gradient-to-br from-indigo-600/90 to-violet-600/90 p-5 text-white shadow-lg"
>
  <p className="text-sm leading-relaxed">
    搭配"课前音频预习 + 课中实战突破 + 课后鹅圈子打卡"完整成长闭环——把"接纳自我"融入晨起对话，把"勇敢表达"融入日常沟通，把"忠于本心"融入每一次选择。让幸福感浸润三餐四季，让成就感在点滴行动中不断积累。
  </p>
</motion.div>
```

一处插入，无其他文件涉及。

| 文件 | 操作 |
|------|------|
| `src/pages/IdentityBloomPromoPage.tsx` | L743 后插入闭环总结卡片 |

