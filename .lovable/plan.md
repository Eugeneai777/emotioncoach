## 完成最终交付

150 条文案已生成（`/tmp/xhs_posts.jsonl`）。本轮收尾：

1. **渲染 Excel** `/mnt/documents/xhs_30day_plan.xlsx`
   - Sheet1「内容日历」150 行 × 14 列，wrap_text，列宽优化
   - Sheet2「数据回收模板」预填日期/受众/AB/URL + ROI 公式
   - Sheet3「AB对比看板」按周聚合公式 + 阈值标红
   - Sheet4「胜出钩子库」表头预设
2. **公式重算**：`recalculate_formulas.py` 验证零错误
3. **渲染 PDF** `/mnt/documents/xhs_30day_strategy.pdf`：7 章可落地策略，reportlab + NotoSansSC，含具体数字/SOP/红线词表
4. **QA**：pdftoppm 转图逐页核查（无截断/无方块/无溢出）；Excel 抽样 10 条核对完整性 + ref 参数
5. **交付**：`<lov-artifact>` 输出 xlsx + pdf
