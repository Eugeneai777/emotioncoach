## 目标
将这 3 张海报上 QR 卡片里的「扫码免费测评」改成「扫码测评」，并去掉下方「限时免费 长按识别」中的"免费"字样，其它内容（标题、卖点、二维码链接、底部 slogan、配色）全部保持不变。

## 涉及海报
1. 财富卡点测评（橙→紫渐变）
2. 35+女性竞争力测评（粉→橙渐变）
3. 中年觉醒测评（紫→粉渐变）

## 执行步骤
1. 复用之前的 `/tmp/make_posters.py`，仅修改这 3 张海报 QR 卡片的两处文案：
   - 主标题：`扫码免费测评` → `扫码测评`
   - 副提示：`限时免费 长按识别` → `长按识别`
2. 保持二维码 URL 不变：
   - 财富卡点 → `https://wechat.eugenewe.net/wealth-block`
   - 35+女性 → `https://wechat.eugenewe.net/assessment/women_competitiveness`
   - 中年觉醒 → `https://wechat.eugenewe.net/midlife-awakening`
3. 输出 1080×1920 PNG 到 `/mnt/documents/`，文件名带 `_v2` 后缀，避免覆盖之前版本。
4. 用 QA 截图逐张检查文案、二维码清晰度，再以 `<presentation-artifact>` 交付。

## 不变项
- 上次已生成的「情绪健康测评」「男人有劲状态测评」两张不动。
- 不修改任何项目源码。