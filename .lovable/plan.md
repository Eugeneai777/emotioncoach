

## 方案：双轴滚动条改造（类似 Excel/Google Sheets 风格）

参考截图可以看出，你希望表格区域像电子表格一样，**水平滚动条在底部始终可见，垂直滚动条在右侧始终可见**，两者独立且同时存在。

### 当前问题
现在 `ZhileOrdersDashboard.tsx` 用单个 `div`（`overflow-x: scroll; overflow-y: auto; max-height: 52vh`）同时承载两个方向的滚动。由于 `max-height: 52vh` 在很多屏幕上偏高，水平滚动条被推到容器内部底部，必须先垂直滚到最后一行才能看到。

### 修改方案

**仅改动文件**：`src/components/partner/ZhileOrdersDashboard.tsx`

将单容器改为**双层容器**，分别承载水平和垂直滚动：

```text
┌─ 外层 div（overflow-x: scroll）─────────────────┐
│  ┌─ 内层 div（overflow-y: auto, max-h: 60vh）─┐  │
│  │  <table min-w: 1900px>                      │  │
│  │    thead (sticky top-0)                     │  │
│  │    tbody                                    │  │
│  │  </table>                                   │  │
│  │  ↕ 垂直滚动条（右侧始终可见）                  │  │
│  └─────────────────────────────────────────────┘  │
│  ↔ 水平滚动条（底部始终可见，紧跟表格区域）          │
└──────────────────────────────────────────────────┘
```

具体改动：
1. **外层 div**：`ref={scrollRef}`，`overflow-x: scroll`，无高度限制 — 水平滚动条在此容器底部，始终在视口内
2. **内层 div**：`overflow-y: auto; max-height: 60vh` — 垂直滚动条在内层右侧
3. **自定义 CSS** 同时对外层（水平条 12px）和内层（垂直条 10px）设置可见样式
4. 滚动按钮 `scrollRef` 绑定到外层容器（水平滚动）
5. 保留 `min-width: 1900px` 和 `sticky thead`

