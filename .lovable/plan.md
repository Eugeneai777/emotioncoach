
用户要把刚才的「海沃塔团队研讨」海报做成 1–2 分钟、带配音的短视频。社群投放，中年男性向。

## 时长 & 节奏

90 秒（2700 帧 @ 30fps），9 个场景，每段 ~10 秒。节奏沉稳不浮夸。

## 配音方案

用 Volcengine 豆包 TTS（项目标准 mem://technical/api/tts-configuration-standard-zh），男声沉稳款。
- 通过现有 edge function `volcengine-tts` 生成 9 段 mp3，存入 `remotion/public/audio/havruta-*.mp3`
- 复用 `remotion/scripts/generate-test-voiceover.mjs` 的模式写新脚本 `generate-havruta-voiceover.mjs`
- Remotion 端用 `<Audio src={staticFile(...)}>` 按 `<Sequence from={...}>` 排时间轴
- 渲染时移除 `muted: true`，改为带音频导出 H264 + AAC

## 文案脚本（90 秒 / 9 段）

| # | 时长 | 旁白 | 画面要点 |
|---|---|---|---|
| 1 | 10s | "凌晨两点，你又一次睁眼到天亮。脑子里翻来覆去那点事，没人聊，也聊不清。" | 黑底，单行衬线大字"一个人想，永远绕不出那个圈"渐显 |
| 2 | 10s | "中年人的难，从来不是没答案，是没人陪你把问题问透。" | 主标题「海沃塔 · 团队研讨」分行入场 |
| 3 | 10s | "海沃塔，源自犹太人 2000 年的学习传统。一种提问式的深度对话。" | 副标 + 琥珀色细线展开 |
| 4 | 8s | "不灌输，不评判。只用追问，把彼此真实的想法逼出来。" | 三行金句堆叠 |
| 5 | 10s | "第一步，倾听。不打断，不预判。" | 大字「倾听」+ 序号 01 |
| 6 | 10s | "第二步，追问。用『为什么』『然后呢』代替建议。" | 大字「追问」+ 序号 02 |
| 7 | 10s | "第三步，挑战。善意地戳破回避。" | 大字「挑战」+ 序号 03 |
| 8 | 10s | "第四步，共识。不必赢，只求看见。" | 大字「共识」+ 序号 04 |
| 9 | 12s | "7 天有劲训练营，每晚 21 点，4 到 6 人一组，戴西老师领读。这一次，不再一个人扛。" | 收束页：训练营信息 + eugeneai.me |

## 视觉延续

完全复用海报体系（深墨蓝 #0F2942 / 暖琥珀 #C8923D / 米白 #F4EFE6 / Noto Serif SC + Noto Sans SC）。动效：
- 入场默认：spring damping 25 + Y 位移 + 模糊到清晰
- 强调：琥珀细线左右展开
- 转场：`@remotion/transitions` 的 fade，30 帧
- 持续层：极淡纸纹 + 缓慢漂移几何点

## 技术执行

**新文件**：
- `remotion/scripts/generate-havruta-voiceover.mjs`（生成 9 段 mp3）
- `remotion/src/HavrutaIntroVideo.tsx`（主合成）
- `remotion/src/scenes/Havruta01_Hook.tsx` ~ `Havruta09_CTA.tsx`（9 个场景）
- `remotion/src/scenes/HavrutaBackground.tsx`（持续背景层）
- `remotion/public/audio/havruta-01.mp3` ~ `havruta-09.mp3`

**修改**：
- `remotion/src/Root.tsx`：注册 `havruta-intro`（1080×1920，30fps，2700 帧）
- `remotion/scripts/render-remotion.mjs`：加入 extraVideoIds，**去掉 muted: true** 以保留音频，输出 `havruta_intro.mp4`

**渲染流程**：
1. `node scripts/generate-havruta-voiceover.mjs` 生成 9 段配音（豆包 TTS）
2. `node scripts/render-remotion.mjs havruta-intro` 渲染带音 MP4 到 `/mnt/documents/havruta_intro.mp4`
3. 抽 5 个关键帧目检（0/600/1200/1800/2400），通过后用 `<lov-artifact>` 交付

## 不做的事
- 不放真人/卡通插画
- 不加背景音乐（中年男性向，安静更稳；如要加可后续单独迭代）
- 不超过 90 秒
- 不破坏现有 remotion compositions
