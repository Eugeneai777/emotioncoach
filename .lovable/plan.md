
## 功能：记住登录名和密码

### 目标
在登录页面添加「记住账号」功能，用户勾选后，下次打开登录页时自动填充手机号（区号）和密码，无需重复输入。

---

### 方案设计

**存储策略**
- 使用 `localStorage` 存储已记住的账号信息（key: `remembered_login`）
- 密码需要进行简单的 Base64 编码存储（不是加密，但可防止直接明文暴露在 Storage 面板）
- 仅在用户明确勾选「记住账号」时才保存
- 用户取消勾选并登录后，清除已保存的记录

**UI 变更**
在密码输入框下方、提交按钮上方，新增一个「记住账号」勾选框，和现有「同意条款」的勾选框风格保持一致。

---

### 技术细节（仅修改 `src/pages/Auth.tsx`）

**1. 新增状态变量**
```typescript
const [rememberMe, setRememberMe] = useState(false);
```

**2. 页面加载时自动读取并填充（在 useEffect 中）**
```typescript
// 读取已记住的账号
const remembered = localStorage.getItem('remembered_login');
if (remembered) {
  try {
    const { phone: savedPhone, countryCode: savedCode, password: savedPwd } = JSON.parse(atob(remembered));
    setPhone(savedPhone || '');
    setCountryCode(savedCode || '+86');
    setPassword(atob(savedPwd || ''));
    setRememberMe(true);
  } catch {}
}
```

**3. 登录成功时根据勾选状态决定是否保存**

在 `handleAuth` 的登录成功逻辑之后（`toast` 之前）：
```typescript
if (rememberMe) {
  const data = { phone, countryCode, password: btoa(password) };
  localStorage.setItem('remembered_login', btoa(JSON.stringify(data)));
} else {
  localStorage.removeItem('remembered_login');
}
```

**4. 新增 UI 勾选框**

在密码输入框与提交按钮之间插入：
```tsx
{isLogin && authMode === 'phone' && (
  <div className="flex items-center gap-2">
    <Checkbox
      id="rememberMe"
      checked={rememberMe}
      onCheckedChange={(checked) => setRememberMe(checked === true)}
    />
    <label htmlFor="rememberMe" className="text-xs text-muted-foreground cursor-pointer">
      记住账号
    </label>
  </div>
)}
```

---

### 安全说明
- 「记住账号」仅在手机号登录模式（`authMode === 'phone'`）且处于登录状态（`isLogin`）时显示，注册时不显示
- 密码使用 Base64 编码存储，防止在 localStorage 中直接明文可见（注意：这不是加密，仅作为基础混淆）
- 仅在登录成功后才写入/更新记忆数据，防止错误密码被保存

---

### 影响范围
- 仅修改 `src/pages/Auth.tsx` 一个文件
- 不影响注册流程、微信登录、邮箱登录
