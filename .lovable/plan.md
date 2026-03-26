

# 为用户 15338876055（黛汐）开通7天情绪解压营权限

## 查询结果

- **用户**: 黛汐，ID: `317ae32e-e47e-490f-9263-0d4b9412708f`
- **当前状态**: 无 emotion_stress_7 相关购买记录或训练营记录

## 操作内容

向 `user_camp_purchases` 表插入一条已完成的购买记录：

```sql
INSERT INTO user_camp_purchases (user_id, camp_type, camp_name, purchase_price, payment_method, payment_status)
VALUES (
  '317ae32e-e47e-490f-9263-0d4b9412708f',
  'emotion_stress_7',
  '7天情绪解压营',
  0,
  'manual',
  'completed'
);
```

插入后，用户访问 `/camp-intro/emotion_stress_7` 即可看到"开始训练"按钮，点击后自动创建训练营并开始打卡。

