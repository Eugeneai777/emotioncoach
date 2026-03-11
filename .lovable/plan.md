

## 将「我活得很好」替换为「今天很好」

把所有出现"我活得很好"的地方统一替换为更温暖简短的「今天很好」风格文案。

### 变更清单

| 文件 | 原文案 | 新文案 |
|------|--------|--------|
| `src/components/tools/AliveCheck.tsx` | 按钮「我活得很好 ✓」 | 「今天很好 ✓」 |
| `src/components/tools/AliveCheck.tsx` | 提示"每天打卡表示'我活得很好'" | "每天打卡表示'今天很好'" |
| `src/components/tools/AliveCheck.tsx` | 说明"每天简单打卡表示'我活得很好'" | "每天简单打卡表示'今天很好'" |
| `src/pages/AliveCheckIntro.tsx` | "一键打卡表示「我活得很好」" | "一键打卡表示「今天很好」" |
| `src/pages/AliveCheckIntro.tsx` | 步骤"点击「我活得很好」按钮" | "点击「今天很好」按钮" |
| `supabase/functions/send-alive-check-welcome/index.ts` | 邮件中"证明'我活得很好'" | "确认'今天很好'" |

共 3 个文件，6 处替换，纯文案变更。

