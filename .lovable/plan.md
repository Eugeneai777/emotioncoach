

# 修复安卓微信分享失败和画面卡死

## 问题确认

从截图可以看到：这是在**安卓微信浏览器**中，图片直接显示在页面上（没有进入全屏预览组件），底部显示"保存图片到手机失败"，页面无法返回。

## 根因

`src/utils/shareUtils.ts` 第 50-53 行的 `shouldUseImagePreview()` 函数决定是否使用全屏图片预览组件：

```
return isWeChat || isMiniProgram || isIOS;
```

虽然包含了 `isWeChat`，但实际调用链中，`share-dialog-base.tsx` 在安卓微信环境下走了 `handleShareWithFallback` 路径，该路径尝试用 `<a>` 标签下载，被微信拦截导致失败，且未清理滚动锁导致页面卡死。

## 修复方案

修改 `src/utils/shareUtils.ts`，在 `shouldUseImagePreview` 中加入 `isAndroid`：

```
const { isMiniProgram, isWeChat, isIOS, isAndroid } = getShareEnvironment();
return isWeChat || isMiniProgram || isIOS || isAndroid;
```

这样安卓用户（包括安卓微信）点"生成分享图片"后，会直接进入已修复好的全屏 `ShareImagePreview` 组件，显示"长按上方图片保存"提示，而非尝试不可靠的下载方式。

## 修改范围

- 仅改 `src/utils/shareUtils.ts` 一个文件中的两行代码
- `share-dialog-base.tsx` 通过调用该函数自动生效
- `share-image-preview.tsx` 已在上次修复中支持安卓

