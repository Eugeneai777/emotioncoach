

## 优化方案：余额不足横幅改用「点数充值」弹窗

### 现状

5 个 AI 语音教练（女性 / 职场 / 大劲 / 小劲 / 我们 AI）共用 `CoachVoiceChat.tsx`。通话中余额不足时，顶部出现蓝色横幅"余额不足，继续请前往充值"，点击「前往充值」当前调用 `navigate('/packages')` 整页跳走，用户被带离通话页，必须重新建立连接。

### 优化目标

点击「前往充值」改为**就地弹出 `QuotaRechargeDialog`**（与「我的页面 → 充值」按钮完全一致的弹窗），保持通话页面在后面，支付成功后自动刷新额度横幅消失，用户可继续通话或随时挂断。

### 实施

**只改 1 个文件：`src/components/coach/CoachVoiceChat.tsx`**

1. 引入：
   - `import { QuotaRechargeDialog } from '@/components/QuotaRechargeDialog';`
2. 新增本地状态 `const [showRecharge, setShowRecharge] = useState(false);`
3. 横幅按钮 onClick 由 `navigate('/packages')` 改为 `setShowRecharge(true)`
4. 在组件 JSX 末尾挂载弹窗：
   ```tsx
   <QuotaRechargeDialog
     open={showRecharge}
     onOpenChange={setShowRecharge}
     onSuccess={() => {
       setShowRecharge(false);
       setInsufficientDuringCall(false); // 关闭横幅
       // 触发 useVoiceBilling / 额度查询的刷新（已有 invalidateQueries 钩子可调用）
     }}
   />
   ```
5. 在 `onSuccess` 内调用现有额度刷新逻辑（沿用 `useVoiceBilling` 已暴露的 refetch 或 react-query 的 invalidate `['user-quota']`），让顶部点数即时更新。

### 行为对比

| 场景 | 改造前 | 改造后 |
|---|---|---|
| 点击「前往充值」 | 整页跳到 /packages，通话被中断 | 弹出充值卡片浮层，通话页面保留 |
| 充值成功 | 用户需手动返回，重新拨打 | 横幅自动消失，可立即继续语音 |
| 关闭弹窗（不充值） | — | 回到通话页面，横幅仍在，可挂断或再次充值 |
| 我的页面 → 充值 | 不变 | 不变（共用同一弹窗） |

### 影响面（确认安全）

- ✅ 5 个 AI 教练共享同一 `CoachVoiceChat`，一次改动全部生效
- ✅ `QuotaRechargeDialog` 已是线上稳定组件，内部接 `UnifiedPayDialog` 自动路由微信/支付宝/扫码支付，覆盖公众号/小程序/H5/PC
- ✅ 不动计费 RPC、不动 `useVoiceBilling`、不动 `insufficientDuringCall` 触发逻辑，仅替换"跳转动作"
- ✅ 不影响 `XiaojinVoice` 的本地 quota 流程（它走 `PurchaseOnboardingDialog`，本次不动）
- ✅ 失败/取消时横幅原样保留，行为可回退

### 工时

0.2 天（替换 + 5 路教练入口回归测试）

