

## 思考

用户反馈：SBTI 测评有些题目（如"喝多了之后…"）的选项不能覆盖所有人的真实场景，比如不喝酒的人没得选。需要我作为商业架构师审视整个题库，给覆盖不全的题目补"自嘲式 / 社交化 / 强娱乐"选项。

先读题库了解现状。
<lov-tool-use id="toolu_vrtx_01TzCHwaYQkSQyj6PPgYi1mQ" name="code--search_files" integration-id="code" data="{\"query\": \"sbti\", \"include_patterns\": \"*.ts,*.tsx\", \"case_sensitive\": false}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_012kjAsdKpubvtc2GhrTwWmn" name="code--search_files" integration-id="code" data="{\"query\": \"喝多了\", \"include_patterns\": \"*.ts,*.tsx,*.json\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_0118Q8og5sVFj9vAWQ1m7tYx" name="code--search_files" integration-id="code" data="{\"query\": \"sbti\", \"case_sensitive\": false, \"include_patterns\": \"*.ts,*.tsx\"}">
</lov-tool-use>
The题目和选项很可能在数据库（dynamic assessment templates）。让我查一下。
<lov-tool-use id="toolu_vrtx_01UXpweyexuqxxeYg81KtPir" name="code--exec" integration-id="code" data="{\"command\": \"psql -c \\\"select id, assessment_key, name from assessment_templates where assessment_key='sbti_personality';\\\"\", \"user_facing_description\": \"查询 SBTI 测评模板\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01BnU4syBxVcuNdJBcJdUxJ3" name="code--exec" integration-id="code" data="{\"command\": \"psql -c \\\"\\\\dt public.*\\\" | grep -i -E \\\"assess|sbti|template|question\\\"\", \"user_facing_description\": \"查询测评相关表\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01VxsdtMKth5yqnv2Y3LJZUR" name="code--exec" integration-id="code" data="{\"command\": \"psql -c \\\"select id, assessment_key, name from partner_assessment_templates where assessment_key like '%sbti%';\\\"\", \"user_facing_description\": \"查询 SBTI 模板\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01U6CJK14XEWH2aAwJepqWnY" name="code--exec" integration-id="code" data="{\"command\": \"psql -c \\\"\\\\d partner_assessment_templates\\\"\", \"user_facing_description\": \"查询模板表结构\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_012h5nMGUkr3dguxxP2cCUXx" name="code--exec" integration-id="code" data="{\"command\": \"psql -t -c \\\"select id, title, question_count from partner_assessment_templates where assessment_key='sbti_personality';\\\"\", \"user_facing_description\": \"查询 SBTI 模板\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_018na1WoVrXqXecakndHr61Q" name="code--exec" integration-id="code" data="{\"command\": \"psql -t -c \\\"select questions from partner_assessment_templates where assessment_key='sbti_personality';\\\" > /tmp/sbti_q.json && python3 -c \\\"\\nimport json\\nwith open('/tmp/sbti_q.json') as f:\\n    raw = f.read().strip()\\nqs = json.loads(raw)\\nprint(f'Total questions: {len(qs)}')\\nfor i, q in enumerate(qs):\\n    print(f'\\\\n--- Q{i+1} (id={q.get(\\\\\\\"id\\\\\\\")}) dim={q.get(\\\\\\\"dimension\\\\\\\")} ---')\\n    print(f'  题: {q.get(\\\\\\\"text\\\\\\\") or q.get(\\\\\\\"question\\\\\\\")}')\\n    for opt in q.get('options', []):\\n        print(f'    [{opt.get(\\\\\\\"value\\\\\\\",opt.get(\\\\\\\"score\\\\\\\",\\\\\\\"?\\\\\\\"))}] {opt.get(\\\\\\\"label\\\\\\\",opt.get(\\\\\\\"text\\\\\\\",\\\\\\\"\\\\\\\"))}')\\n\\\"\\n\", \"user_facing_description\": \"导出并打印所有 SBTI 题目与选项\"}">
</lov-tool-use>
已看到大部分。让我看完剩下的题目（Q30-Q62）以及那道酒题（Q31）。
<lov-tool-use id="toolu_vrtx_01Bp65vYpVgXEYNgMvkuWAPw" name="code--exec" integration-id="code" data="{\"command\": \"python3 -c \\\"\\nimport json\\nwith open('/tmp/sbti_q.json') as f:\\n    raw = f.read().strip()\\nqs = json.loads(raw)\\nfor i, q in enumerate(qs[29:], start=30):\\n    print(f'\\\\n--- Q{i} dim={q.get(\\\\\\\"dimension\\\\\\\")} ---')\\n    print(f'  题: {q.get(\\\\\\\"text\\\\\\\") or q.get(\\\\\\\"question\\\\\\\")}')\\n    for opt in q.get('options', []):\\n        print(f'    [{opt.get(\\\\\\\"value\\\\\\\",opt.get(\\\\\\\"score\\\\\\\",\\\\\\\"?\\\\\\\"))}] {opt.get(\\\\\\\"label\\\\\\\",opt.get(\\\\\\\"text\\\\\\\",\\\\\\\"\\\\\\\"))}')\\n\\\"\\n\", \"user_facing_description\": \"查看剩余题目\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_015gxaJ3ispE7Vq9sw3FvM73" name="code--exec" integration-id="code" data="{\"command\": \"python3 -c \\\"\\nimport json\\nwith open('/tmp/sbti_q.json') as f: qs=json.load(open('/tmp/sbti_q.json'))\\nq=qs[61]\\nprint(json.dumps(q, ensure_ascii=False, indent=2))\\n\\\"\", \"user_facing_description\": \"查看彩蛋题完整结构\"}">
</lov-tool-use>
充分了解全貌。现在制定计划。

<lov-plan>
## 现状诊断

我把数据库中 SBTI 全部 62 题逐题过了一遍。题干设计基本是「一个真实生活场景 + 4 档反应」，但确实存在系统性的**「场景排他性」问题**——当用户没经历过、不喜欢、或场景不适用时，4 个选项一个都选不到，被迫乱选影响人格分数，还会产生「这测评不懂我」的劝退感（用户截图就是真实流失案例：「我不喝酒啊」）。

## 问题分类（按严重度）

**🔴 高危场景排他题（用户可能"完全不适用"）—— 12 题**

| Q | 题干关键词 | 排他原因 |
|---|---|---|
| Q1 | 学习 APP 打卡 | 没下载过 |
| Q5 | 养盆栽 | 不养植物 |
| Q6 | 凌晨刷前任 | 没前任 / 已婚 / 不在意 |
| Q8 | 朋友分手问"值不值得被爱" | 朋友圈无人分手 |
| Q13/Q14/Q46/Q54/Q57/Q61 | 另一半 / 约会 / 暗恋 | **单身 / 已婚 / 无暗恋对象** |
| Q15 | 合租室友 | 独居 / 已购房 |
| Q21 | 鼓起勇气表白 | 从没表白过 |
| Q34/Q38/Q49/Q59 | 减肥 / 学新技能 / 攀岩陶艺 | 没兴趣 / 没尝试过 |
| Q55 | 公司年会表演 | 自由职业 / 公司没年会 |
| **Q62（彩蛋）** | **喝酒** | **不喝酒党** ←用户截图 |

**🟡 中度排他题 —— 6 题**

Q2 亲戚催婚催生（已婚已育/无亲戚联系）、Q4 公司新领导（自由职业）、Q11 同学聚会问月薪（不参加聚会）、Q23 朋友拉创业、Q26 朋友圈晒（不刷朋友圈）、Q39 公司裁员（自由职业/老板）。

## 解决方案：增加第 5 个「自嘲式逃逸选项」

**核心设计原则**

1. **每题保留原 4 档（H/M/L 计分 3/2/1/0 不变）**，新增 1 个「不适用 / 不喜欢」选项
2. 该选项**不参与维度计分**（score 设为 `null` 或加 `skip: true`，由 sbti-scoring 引擎按"维度内有效题平均分"补齐，已是 SBTI 标准做法）
3. **文案带强自嘲 + 社交传播 DNA**——和原选项语气统一，让用户看到忍不住截图发群

**新增选项文案样例（节选 12 高危题，最终覆盖全部 18 题）**

| Q | 新增第 5 选项 |
|---|---|
| Q1 学习APP | 「学习APP？我手机里只有外卖APP和短视频，谢谢」 |
| Q5 盆栽 | 「我连仙人掌都能养死，早就放弃这条赛道了」 |
| Q6 前任 | 「前任？那是上辈子的剧情，我连主演是谁都忘了」 |
| Q8 朋友分手 | 「我朋友圈一片祥和，没人分手轮得到我安慰」 |
| Q13 冷战 | 「单身狗一只，冷战的对象是我和我的Wi-Fi」 |
| Q14 视频通话 | 「连对象都没有，视频通话的是我妈和我爸」 |
| Q15 合租室友 | 「独居人士，唯一的室友是冰箱里过期的酸奶」 |
| Q21 表白 | 「表白？这种高难度动作我没解锁过」 |
| Q34 学新技能 | 「我的新技能是躺平，已经满级了」 |
| Q38 减肥火锅 | 「减肥从来不在我的to-do list里，火锅才是」 |
| Q46 约会玩手机 | 「连约会都没有，玩手机的只有我自己」 |
| Q49 攀岩陶艺 | 「这种烧钱爱好我连边都不敢沾」 |
| Q54 哭 | 「我朋友都比我坚强，没见过谁在我面前哭」 |
| Q55 年会 | 「年会？我们公司只有我一个人，自己给自己鼓掌」 |
| Q57 心仪表白 | 「我心仪的只有床，它从不拒绝我」 |
| Q59 运动 | 「下班后我连呼吸都觉得是运动」 |
| Q61 暗恋 | 「暗恋这种青春病，我早就免疫了」 |
| **Q62 喝酒** ⭐ | **「我不喝酒，水才是我的快乐源泉 🥤」** |

中度排他题（Q2/Q4/Q11/Q23/Q26/Q39）同样补一条同风格逃逸选项。

## 技术改动

仅一条 SQL 数据迁移，不动前端代码：

1. **数据库 migration**：`UPDATE partner_assessment_templates SET questions = $1 WHERE assessment_key='sbti_personality'`，把 18 题的 `options` 各追加一项 `{ label: "...", score: null, skip: true }`
2. **校验 sbti-scoring**：先 view `src/lib/sbti-scoring.ts`，确认遇到 `score: null / skip` 时是否能跳过累计；如不能，加一行过滤（`options.filter(o => o.score != null)` 或在打分函数入口跳过 skip 答案），并让维度按"该维度有效作答数"取均值，缺失维度 fallback 到中性 M(=1.5)
3. **前端无需改动**：`DynamicAssessmentPage` 渲染 options 数组，自动多出一个按钮
4. **彩蛋题特殊处理**：Q62 (`DRUNK_TRIGGER`) 本就是触发逻辑题不进维度分，`skip` 同样 OK

## 不做的事

- 不改原有 4 档选项的文案与分值（不破坏已发布的人格归类）
- 不改测评题数（仍 31 主题 + 31 干扰/共 62 条结构）
- 不在 UI 加额外说明文字（让逃逸选项自己说话即可，更自然）

## 交付

- 1 条 SQL migration
- `src/lib/sbti-scoring.ts` 跳过 `skip:true` 选项的小补丁（如需要）
- 自检：在 `/assessment/sbti_personality` 跑一遍，确认全部 18 道补充选项可点、可提交、人格结果合理
