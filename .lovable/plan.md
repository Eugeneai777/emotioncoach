

## 优化方案 v2：小劲/大劲 AI 接入全站统一点数体系（按用户策略修订）

### 用户策略澄清（本次定调）

| 角色 | 行为 |
|---|---|
| 未登录游客 | 保留本地 100 点试用（拉新抓手） |
| 训练营购买者 | **不放行**，正常扣点（与全站一致） |
| 尝鲜 / 标准（¥49）/ 畅享（¥99）/ 365 会员 | **不限时**，但仍按 **8 点/分钟** 扣 `user_accounts.remaining_quota` |
| 普通登录用户（无套餐）| 按 8 点/分钟扣点，余额不足走 4 档充值横幅 |

→ **不需要任何"训练营/会员白名单跳过"逻辑**，所有登录用户走同一条计费链路，由 `get_voice_max_duration` RPC 决定时长上限，由 `deduct_user_quota` RPC 统一扣点。

### 现状问题（小劲/大劲两条孤立支线）

1. `useXiaojinQuota` / `useDajinQuota` 用 `localStorage` 存 100 点，**已登录会员被本地点数限制**，与商业策略冲突
2. 跨设备清缓存可重置 → 风控漏洞
3. `XiaojinVoice` 用 `skipBilling={true}` + 前端 `setInterval` 自扣本地点 → **不进 `user_accounts`，不留账**
4. 充值入口硬编码 `defaultPackage="member365"` → 仅 1 档，与全站 4 档不一致

### 实施方案：登录态分流 + 完全接入全站计费

#### 1. 新建 `src/hooks/useUnifiedQuota.ts`（核心）

```ts
export function useUnifiedQuota(scope: 'xiaojin' | 'dajin') {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState<number>(0);

  // 登录用户：从 user_accounts.remaining_quota 读
  // 游客：沿用 localStorage（保持现有逻辑）
  
  const canAfford = async (cost: number) => {
    if (!user) return getStoredQuota(scope) >= cost;
    const { data } = await supabase
      .from('user_accounts').select('remaining_quota')
      .eq('user_id', user.id).single();
    return (data?.remaining_quota ?? 0) >= cost;
  };

  const deduct = async (cost: number) => {
    if (!user) return deductLocal(scope, cost);
    const { error } = await supabase.rpc('deduct_user_quota', {
      p_user_id: user.id, p_amount: cost
    });
    return !error;
  };

  return { remaining, canAfford, deduct, refresh, isGuest: !user };
}
```

**关键**：登录用户**没有任何白名单**，所有人走 `deduct_user_quota`。365 会员靠"充值多/不限时长"享受权益，而非"跳过扣点"。

#### 2. `useXiaojinQuota.ts` / `useDajinQuota.ts` 改为薄封装

```ts
export function useXiaojinQuota() {
  return useUnifiedQuota('xiaojin'); // API 完全兼容
}
```

→ **7 个调用方零改动**（XiaojinHome / Mood / Talent / Future / Challenge / ElderGreetingPage / ElderMoodPage）。

#### 3. `src/pages/xiaojin/XiaojinVoice.tsx` 改造

- **登录用户**：移除前端 `setInterval` 自扣 + 移除 `skipBilling={true}`，改为 `skipBilling={!user}`
  → `CoachVoiceChat` 内置 `useVoiceBilling` 接管，自动按 8 点/分钟扣 `user_accounts`
  → 余额不足自动弹 4 档横幅（上轮已上线）
  → 不限时长由 `get_voice_max_duration` RPC 根据套餐返回 NULL 控制
- **游客**：保留现有 `skipBilling={true}` + 本地 quota（100 点试用）
- **入口前**：`canAfford(8)` 异步检查 → 不足则进页面显示横幅（与全站统一）

#### 4. 充值弹窗 4 档化

- 移除 `XiaojinVoice` 里 `PurchaseOnboardingDialog` 的 `defaultPackage="member365"` 硬编码
- 或直接替换为 `QuotaRechargeDialog`（与 5 大教练一致）

#### 5. `MarriageAITools.tsx` 评估

- 当前 `skipBilling={true}` 写死 → 与"我们AI"策略冲突，建议同步改为 `skipBilling={!user}`，纳入统一计费（待用户二次确认是否一并改造）

### 行为对照表（修订后）

| 场景 | 改造前 | 改造后 |
|---|---|---|
| 游客点小劲语音 | 本地 100 点试用 | **不变** |
| 游客本地点用尽 | 弹 1 档 365 会员 | 弹 4 档套餐（含 ¥9.9 引流款） |
| 365 会员点小劲语音 | ❌ 仍受本地 100 点 | ✅ 不限时，但按 8 点/分钟扣 `user_accounts` |
| ¥49 标准会员点小劲 | ❌ 受本地 100 点 | ✅ 不限时，按 8 点/分钟扣 |
| 训练营用户点小劲 | ❌ 受本地 100 点 | ✅ **不放行**，按 8 点/分钟扣（与策略一致）|
| 普通登录用户余额不足 | 弹 365 单档 | 横幅 + 4 档充值，支付后自动开播 |
| 5 大成人 AI 教练 | 4 档充值 | **不变** |
| 财富语音教练（测评跳转） | 免费 | **不变**（`skipBilling=true` 保留） |

### 影响面（确认安全）

- ✅ 7 个文字交互调用点零改动（hook 内部分流）
- ✅ 5 大成人 AI 教练 / 财富测评跳转 / 训练营打卡 完全不受影响
- ✅ 数据全部进 `user_accounts` + `quota_transactions`，可做留存/客单价分析
- ✅ 跨设备同步，杜绝清缓存风控漏洞
- ✅ 游客 100 点试用心智完整保留
- ✅ 不需要任何 RPC / DB 改动，全部复用现有 `deduct_user_quota` / `get_voice_max_duration`

### 改动文件清单

| 类型 | 路径 | 改动 |
|---|---|---|
| 新建 | `src/hooks/useUnifiedQuota.ts` | 双轨分流核心 hook |
| 修改 | `src/hooks/useXiaojinQuota.ts` | 委托给 useUnifiedQuota('xiaojin') |
| 修改 | `src/hooks/useDajinQuota.ts` | 委托给 useUnifiedQuota('dajin') |
| 修改 | `src/pages/xiaojin/XiaojinVoice.tsx` | `skipBilling={!user}` + 移除前端自扣 + 4档充值 |
| 修改（可选）| `src/pages/marriage/MarriageAITools.tsx` | 同步改为 `skipBilling={!user}`（待确认）|
| 后端 | 无 | 复用现有 RPC |

### 工时
0.5 天（hook 重构 + 8 处入口回归 + 游客/会员/训练营/普通用户 四态测试）

