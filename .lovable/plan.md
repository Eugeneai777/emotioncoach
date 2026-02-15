
## 修复语音连接 + 优化测评结果页

### 问题 1：语音连接失败

**根因**：`wealth-assessment-realtime-token` 函数在 `config.toml` 中配置了 `verify_jwt = true`，而项目采用 signing-keys 认证体系，需要设置为 `verify_jwt = false`（与其他所有函数一致），由代码层面手动验证 JWT。

**修复方案**：
- 修改 `supabase/config.toml` 中 `wealth-assessment-realtime-token` 的 `verify_jwt` 为 `false`
- 重新部署该边缘函数

### 问题 2：结果页优化

当前结果页包含大量模块导致页面冗长，优化方案：

1. **语音教练按钮上移并固定**：将 `AssessmentVoiceCoach` 按钮改为吸底固定（`fixed bottom`），确保用户随时可见，无需滚动寻找
2. **默认折叠深度分析**：三层深度分析（行为层/情绪层/信念层）已默认折叠，保持现状即可
3. **AI 分析摘要化**：将 AI 深度分析卡片改为默认显示精简摘要（核心卡点 + 镜像陈述），点击展开查看完整分析
4. **移除冗余间距**：减少各卡片间的装饰性分隔符和空白

### 涉及文件

| 文件 | 变更 |
|------|------|
| `supabase/config.toml` | `verify_jwt = true` 改为 `false` |
| `src/components/wealth-block/AssessmentVoiceCoach.tsx` | 改为吸底固定布局 |
| `src/components/wealth-block/WealthBlockResult.tsx` | 优化布局间距，移除冗余装饰 |

### 技术细节

**吸底语音按钮**：
```text
+-----------------------------+
|  健康仪表盘                  |
|  觉醒旅程预览               |
|  财富反应模式（简化）         |
|  三层分析（折叠）            |
|  ...                        |
+-----------------------------+
| [固定底部] 和 AI 教练聊测评  |
+-----------------------------+
```

按钮使用 `fixed bottom-0` 定位 + `safe-area-inset-bottom` 适配，并调整页面底部 padding 避免内容遮挡。
