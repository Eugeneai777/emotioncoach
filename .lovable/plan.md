
# 绽放合伙人页面 - 登录回跳 + 退出登录

## 修改内容

### 文件：`src/pages/BloomPartnerIntro.tsx`

#### 1. 登录后回跳到本页
- `handleLogin` 跳转路径改为 `/auth?mode=phone_only&redirect=%2Fbloom-partner-intro`
- Auth.tsx 已有逻辑会自动处理 redirect 参数，登录成功后跳回本页

#### 2. 已登录状态显示退出登录按钮
- 从 `useAuth` 解构 `signOut`
- 导入 `LogOut` 图标
- 已登录绿色状态栏改为 flex 布局：左侧提示文字，右侧"退出登录"按钮
- 点击调用 `signOut()`

### 技术细节

**handleLogin 修改：**
```
navigate("/auth?mode=phone_only&redirect=%2Fbloom-partner-intro")
```

**已登录区域改为：**
```
<div className="flex items-center justify-between">
  <span>已登录，点击下方卡片即可进入</span>
  <button onClick={signOut}>退出登录</button>
</div>
```

仅修改一个文件，改动量极小。
