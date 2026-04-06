

# 中年觉醒视频升级 — 加入中年男人素材 + 语音旁白

## 问题
当前视频使用的 Pexels 素材（overtime.mp4、sunrise.mp4、relax.mp4）没有中年男性出镜的画面，且全片无声。

## 升级方案

### 1. 替换/新增含中年男人的 Pexels 素材
从 Pexels 下载包含中年亚洲男性的免费视频素材，替换现有通用素材：

| 场景 | 当前素材 | 替换为 |
|------|---------|--------|
| 痛点 | overtime.mp4（通用办公） | 中年男人深夜疲惫/揉眼/独坐办公室 |
| 转折 | sunrise.mp4（风景） | 中年男人晨跑/冥想/微笑 |
| CTA | relax.mp4（通用放松） | 中年男人与家人/放松/自信表情 |

搜索关键词：`middle aged asian man tired`、`asian man meditation`、`asian man family smile` 等。

### 2. 生成语音旁白（火山引擎 TTS）
使用已有的 `volcengine-tts` Edge Function 生成3段中文男声旁白：

| 段落 | 旁白文案 | 文件名 |
|------|---------|--------|
| 痛点 | "兄弟，我跟你说个真事。上个月我加班到凌晨三点，回家路上突然胸口一阵发紧..." | `midlife_pain.mp3` |
| 转折 | "后来一个朋友推荐我试了个东西。每天就花十五分钟，跟着一个AI教练做情绪训练..." | `midlife_turning.mp3` |
| CTA | "现在回头看，那七天真的改变了我。兄弟，如果你也到了这个坎儿，试试有劲AI的七天训练营..." | `midlife_cta.mp3` |

### 3. 在 Remotion 组件中加入 `<Audio>` 轨道
每个场景组件中添加 `<Audio src={staticFile("audio/midlife_xxx.mp3")} />` 播放旁白。

### 4. 渲染带声音的最终视频
渲染脚本中去掉 `muted: true`，输出带旁白的完整视频。

## 修改文件清单

| 文件 | 操作 |
|------|------|
| `remotion/public/stock/overtime.mp4` | 替换 — 含中年男人的素材 |
| `remotion/public/stock/sunrise.mp4` | 替换 — 含中年男人的素材 |
| `remotion/public/stock/relax.mp4` | 替换 — 含中年男人的素材 |
| `remotion/public/audio/midlife_pain.mp3` | 新建 — TTS 旁白 |
| `remotion/public/audio/midlife_turning.mp3` | 新建 — TTS 旁白 |
| `remotion/public/audio/midlife_cta.mp3` | 新建 — TTS 旁白 |
| `remotion/src/scenes/MidlifeOpening.tsx` | 修改 — 加 Audio 组件 |
| `remotion/src/scenes/MidlifeTurning.tsx` | 修改 — 加 Audio 组件 |
| `remotion/src/scenes/MidlifeCTA.tsx` | 修改 — 加 Audio 组件 |
| `remotion/scripts/render-remotion.mjs` | 修改 — 去掉 muted |

