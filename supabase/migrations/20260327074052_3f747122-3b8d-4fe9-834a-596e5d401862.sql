
DELETE FROM user_camp_purchases 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, camp_type, payment_status) id 
  FROM user_camp_purchases 
  ORDER BY user_id, camp_type, payment_status, purchased_at ASC
);

ALTER TABLE user_camp_purchases 
ADD CONSTRAINT unique_user_camp_purchase UNIQUE (user_id, camp_type, payment_status);
