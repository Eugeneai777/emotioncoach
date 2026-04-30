## 结论

可以实现，但要分清两个平台的机制：

1. 手机 H5 / 微信内网页：卡片式分享主要依赖微信 JS-SDK 的 `title / desc / link / imgUrl`，不能只靠页面内动态 OG 标签。
2. 手机小程序端：卡片由小程序壳层的 `onShareAppMessage` 生成，H5 页面需要通过 `wx.miniProgram.postMessage` 把分享配置传给小程序；否则小程序可能用默认卡片或默认跳转路径，所以会出现“能生成卡片，但点进去不是原页面”。

当前问题的核心不是封面和文案本身，而是“分享配置没有同时稳定同步给 H5 微信 JS-SDK 和小程序外壳，并且分享落地链接/路径没有做统一规范”。

## 修复目标

- 在手机 H5 微信内分享 `/assessment/male_midlife_vitality` 时，显示类似你截图中“小鹅通/小程序卡片”的标题、简介、封面图。
- 在小程序 web-view 内分享时，也生成同款卡片。
- 用户点击分享卡片后，必须回到原始页面：`/assessment/male_midlife_vitality`，而不是小程序首页或其它默认页面。
- 兼容手机 H5、小程序 web-view、PC，不破坏现有测评、历史记录、结果页流程。

## 实施方案

### 1. 统一分享链接生成规则

为“男人有劲状态测评”固定生成标准分享 URL：

```text
https://wechat.eugenewe.net/assessment/male_midlife_vitality?ref=share
```

处理原则：

- 分享出去的链接保留业务必要参数 `ref=share`。
- 去掉不稳定参数，例如 `_cb`、临时缓存参数、结果页内部状态参数。
- 对微信 JS-SDK 使用这个稳定链接，避免微信缓存多个不同 URL 导致卡片不稳定。
- 对小程序端也使用同一个 H5 落地地址。

### 2. 强化 H5 微信分享配置

调整 `DynamicOGMeta` / `useWechatShare` 的调用逻辑：

- 微信内使用专属标题：`男人有劲状态测评｜6维评估，3分钟看见自己`
- 描述使用商业转化文案：`精力、睡眠、压力、关键时刻信心、关系温度、行动恢复力，一次看清你的能量底盘。`
- 封面图使用已配置的横版 OG 图。
- `link` 改为稳定分享 URL，而不是当前带 `_cb` 的浏览 URL。

这样 H5 微信分享给好友/群时，会尽量走微信 JS-SDK 卡片，而不是裸链接。

### 3. 新增小程序分享桥接

新增一个前端 hook，例如 `useMiniProgramShareBridge`，在小程序 web-view 环境中执行：

```text
wx.miniProgram.postMessage({
  data: {
    type: 'SET_SHARE_CONFIG',
    title,
    desc,
    imageUrl,
    h5Url,
    path
  }
})
```

其中：

- `h5Url`：`https://wechat.eugenewe.net/assessment/male_midlife_vitality?ref=share`
- `path`：给小程序壳层使用的落地路径，建议是 web-view 页面路径并携带 encoded H5 URL，例如：

```text
/pages/webview/webview?url=encodeURIComponent(h5Url)
```

如果你的小程序壳层已有固定 web-view 页面路径，需要与实际路径保持一致；如果壳层目前只支持默认首页，需要同步改小程序端的 `onShareAppMessage` 读取该消息。

### 4. 在测评页全流程挂载分享配置

在 `/assessment/:assessmentKey` 页面中，对 `male_midlife_vitality` 的这些阶段都同步分享配置：

- intro 首页
- history 历史记录页
- result 结果页

这样用户不管停留在哪个阶段点击右上角分享，都不会回退到默认卡片或默认跳转页。

### 5. 修复“小程序点击进去不是原页面”

这部分需要同时覆盖 H5 与小程序壳层协议：

- H5 端：postMessage 明确传 `h5Url` 和 `path`。
- 小程序端：`onShareAppMessage` 必须优先使用最近一次 H5 传来的分享配置。
- 小程序端 path 不能写死成首页，必须把 H5 URL encode 后带回 web-view 页面。

小程序端伪代码应类似：

```js
onMessage(e) {
  const msg = e.detail.data?.[e.detail.data.length - 1]
  if (msg?.type === 'SET_SHARE_CONFIG') {
    this.setData({ shareConfig: msg })
  }
},

onShareAppMessage() {
  const share = this.data.shareConfig
  return {
    title: share.title,
    imageUrl: share.imageUrl,
    path: share.path
  }
}
```

如果当前仓库不包含小程序壳层源码，我会先完成 H5 端桥接，并给你一段小程序端需要同步粘贴的代码；如果仓库内能找到小程序壳层源码，则一起修。

## 技术细节

- 不会修改自动生成的 `src/integrations/supabase/client.ts` 和类型文件。
- 继续使用现有 `og_configurations` 中的 `maleMidlifeVitalityAssessment` 配置。
- 优先使用现有 `wechat.eugenewe.net` 域名，避免微信安全域名与缓存问题。
- `useWechatShare` 当前会排除小程序环境，这是合理的；小程序端会走新增 bridge，而不是强行调用 H5 JS-SDK 分享接口。
- PC 端只保留 meta 标签，无额外弹窗或交互影响。

## 验收方式

1. 手机微信 H5 打开：
   `https://wechat.eugenewe.net/assessment/male_midlife_vitality?ref=share`
   分享给好友，检查是否出现标题、简介、封面图卡片。

2. 小程序内打开同一测评页，点右上角分享：
   - 分享卡片显示定制标题与封面。
   - 接收者点击卡片后回到 `/assessment/male_midlife_vitality`，不是首页。

3. 在历史记录页和结果页重复测试分享：
   - 卡片内容一致。
   - 点击落地稳定。

4. PC 浏览器打开测评页：
   - 页面正常加载。
   - 无 JS 报错。

## 需要你确认的一点

如果小程序壳层源码不在当前项目里，我只能先完成 H5 页面向小程序发送分享配置的部分；小程序端还需要你或小程序开发者把 `onMessage + onShareAppMessage` 读取逻辑补上。批准后我会先在当前项目中查找是否有小程序壳层源码，并按可控范围完成修复。