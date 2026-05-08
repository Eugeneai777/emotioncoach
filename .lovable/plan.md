## 继续执行：完成 150 条小红书文案 + Excel + PDF 交付

### 现状
- 脚本 `/tmp/build_xhs_deliverables.py` 已带断点续跑（`/tmp/xhs_ckpt.json`）
- NotoSansSC 中文字体已就绪
- 上轮因单次 600s 超时中断，已生成部分批次

### 本轮动作（按顺序，全部 code--exec）
1. **查看断点**：读取 `/tmp/xhs_ckpt.json`，确认已完成批次数 / 剩余条数
2. **分段续跑**：每次 code--exec 跑 ≤4 个批次（约 24 条，~3 分钟），多次调用直到 150 条齐全，避免再次超时
   - 每批 6 条，gemini-3-flash-preview，1.2s 延迟
   - 写入 `/tmp/xhs_posts.jsonl`
3. **渲染 Excel** `/mnt/documents/xhs_30day_plan.xlsx`：4 个 Sheet（内容日历150行 / 数据回收 / AB看板 / 胜出钩子库），openpyxl wrap_text + 列宽
4. **公式重算 + 错误扫描**：`recalculate_formulas.py`，零错误才放行
5. **渲染 PDF** `/mnt/documents/xhs_30day_strategy.pdf`：7 章可落地策略，reportlab + NotoSansSC
6. **QA**：
   - `pdftoppm` 转图，逐页核查截断/溢出/字体方块
   - 抽样 10 条文案核对完整性、CTA ref 参数、合规词
7. **交付**：用 `<lov-artifact>` 输出两个文件

### 不做
- 不动代码 / 数据库 / 产品页 / SKU
- 不引入新依赖

### 预计耗时
续跑 6-10 分钟 + 渲染 QA 3 分钟
