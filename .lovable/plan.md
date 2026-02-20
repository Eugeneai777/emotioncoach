
# 修復：生成按鈕無反應 + 白屏卡住的真正根因

## 問題定位

上一次修復雖然加了 `onGenerate` 回調，但發現了一個致命的代碼邏輯錯誤：

```
share-dialog-base.tsx 第 156-172 行：

const handleGenerateImage = useCallback(async () => {
  if (onGenerate) {
    await onGenerate();    ← 直接 return，以下代碼跳過
    return;
  }

  // ... （以下代碼在 onGenerate 存在時永遠不執行）

  setIsGenerating(true);  ← 第 172 行，已被 return 跳過！
  const isiOS = ...       ← iOS 關閉 Dialog 的邏輯，也被跳過
```

### 症狀對應關係

| 症狀 | 根因 |
|------|------|
| 點擊按鈕沒反應 | `setIsGenerating(true)` 未執行，按鈕沒有 loading 狀態，生成過程沒有視覺反饋 |
| Dialog 不關閉（iOS 白屏） | iOS `onOpenChange(false)` 在 `setIsGenerating` 之後，被 `return` 跳過 |
| scroll-lock 不清理 | `finally` 塊也因 `return` 而繞過 |
| 服務端生成拋錯無反饋 | `handleServerGenerate` 拋出的錯誤不被 `try/catch` 捕獲，無 toast 提示 |

## 修復方案

### 修復 1：`share-dialog-base.tsx` — 重構 `handleGenerateImage`

將 `setIsGenerating(true)`、iOS 路徑、`try/catch/finally` 移到最外層，讓它對 `onGenerate` 也生效：

```typescript
const handleGenerateImage = useCallback(async () => {
  setIsGenerating(true);                    // ← 移到最外層

  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let loadingToastId: string | number | undefined;

  // iOS：如果用服務端生成，不需要提前關閉 Dialog（速度快）
  // 只有 html2canvas 路徑才需要提前關閉
  if (isiOS && !onGenerate) {
    onOpenChange(false);
    loadingToastId = toast.loading('正在生成圖片...');
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }

  try {
    if (onGenerate) {
      await onGenerate();                   // ← 服務端路徑
      return;
    }
    // ... 原有 html2canvas 路徑
  } catch (error) {
    if (loadingToastId) toast.dismiss(loadingToastId);
    toast.error('生成圖片失敗，請重試');
  } finally {
    setIsGenerating(false);
    document.body.removeAttribute('data-scroll-locked');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}, [...]);
```

### 修復 2：`WealthInviteCardDialog.tsx` — 讓 `handleServerGenerate` 自己關閉 Dialog

服務端生成成功後，需要手動關閉 Dialog 並展示 `ShareImagePreview`，而不是用自製的 `div` 覆蓋層（粗糙且缺乏長按保存支持）。

改為使用已有的 `ShareImagePreview` 組件（與 `XiaohongshuShareDialog` 相同的方案）：

```typescript
const handleServerGenerate = useCallback(async () => {
  if (!assessmentData) return;
  
  const isAndroidWeChat = /micromessenger/i.test(navigator.userAgent) && /android/i.test(navigator.userAgent);
  
  // Android WeChat 需要 base64（blob URL 無法長按保存）
  if (isAndroidWeChat) {
    const dataUrl = await generateServerShareCardDataUrl({ ... });
    if (!dataUrl) throw new Error('Server generation failed');
    setOpen(false);
    setServerPreviewUrl(dataUrl);
    setShowServerPreview(true);
  } else {
    const blob = await generateServerShareCard({ ... });
    if (!blob) throw new Error('Server generation failed');
    setOpen(false);
    const url = URL.createObjectURL(blob);
    setServerPreviewUrl(url);
    setShowServerPreview(true);
  }
}, [assessmentData, userInfo, partnerInfo, setOpen]);
```

同時把自製的 `div` 覆蓋層替換成 `<ShareImagePreview>` 組件（已有完整長按保存邏輯、scroll-lock 清理、iOS 兼容）。

### 修復 3：兩個文件的導入更新

`WealthInviteCardDialog.tsx` 補充導入 `generateServerShareCardDataUrl`（Android WeChat 需要 base64）。

## 修改文件清單

| 文件 | 修改內容 |
|------|---------|
| `src/components/ui/share-dialog-base.tsx` | 將 `setIsGenerating(true)` 移到函數最頂部，iOS 提前關閉邏輯只對 html2canvas 路徑生效 |
| `src/components/wealth-camp/WealthInviteCardDialog.tsx` | 修復 `handleServerGenerate`：區分 Android WeChat/其他環境，替換自製覆蓋層為 `ShareImagePreview` |

## 預期效果

| 問題 | 修復後 |
|------|-------|
| 點擊沒反應 | 按鈕立即顯示 loading 旋轉動畫 |
| iOS 白屏卡住 | 服務端生成期間 Dialog 保持打開（因速度快，約 1-2 秒），完成後顯示圖片預覽 |
| Android WeChat 長按無法保存 | 使用 base64 data URL，長按可直接保存 |
| 生成失敗無提示 | try/catch 統一捕獲，顯示 toast 錯誤提示 |
