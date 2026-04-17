
查询数据库回答用户问题。

1. 新用户默认点数：从 `handle_new_user_account()` 触发器看，是 **50 点**（`total_quota = 50`）。但 voice-coaching memory 提到"新用户注册自动赠送 150 点"，需要核实哪个是真。
2. 用户 15608091603 的 200 点来源：需要查 user_accounts、orders、quota_transactions。
