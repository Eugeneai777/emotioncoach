
-- 1. customer_tickets 扩字段
ALTER TABLE public.customer_tickets
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS unread_user_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unread_admin_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_to uuid;

CREATE INDEX IF NOT EXISTS idx_customer_tickets_user_unread
  ON public.customer_tickets(user_id) WHERE unread_user_count > 0;

-- 2. support_conversations 扩字段
ALTER TABLE public.support_conversations
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS last_user_message text,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz DEFAULT now();

-- 3. 工单消息流表
CREATE TABLE IF NOT EXISTS public.customer_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.customer_tickets(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('user','admin','system')),
  sender_id uuid,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  read_by_user boolean NOT NULL DEFAULT false,
  read_by_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON public.customer_ticket_messages(ticket_id, created_at);

ALTER TABLE public.customer_ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用户查看自己工单的消息" ON public.customer_ticket_messages;
CREATE POLICY "用户查看自己工单的消息"
ON public.customer_ticket_messages FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.customer_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "用户发送消息到自己工单" ON public.customer_ticket_messages;
CREATE POLICY "用户发送消息到自己工单"
ON public.customer_ticket_messages FOR INSERT
WITH CHECK (
  sender_type = 'user'
  AND sender_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.customer_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);

DROP POLICY IF EXISTS "管理员管理所有工单消息" ON public.customer_ticket_messages;
CREATE POLICY "管理员管理所有工单消息"
ON public.customer_ticket_messages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "用户更新自己工单消息已读" ON public.customer_ticket_messages;
CREATE POLICY "用户更新自己工单消息已读"
ON public.customer_ticket_messages FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.customer_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);

-- 4. 触发器：插入消息后同步工单未读数与最后消息时间
CREATE OR REPLACE FUNCTION public.sync_ticket_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.sender_type = 'admin' THEN
    UPDATE public.customer_tickets
    SET last_message_at = NEW.created_at,
        unread_user_count = unread_user_count + 1,
        updated_at = now()
    WHERE id = NEW.ticket_id;
  ELSIF NEW.sender_type = 'user' THEN
    UPDATE public.customer_tickets
    SET last_message_at = NEW.created_at,
        unread_admin_count = unread_admin_count + 1,
        updated_at = now()
    WHERE id = NEW.ticket_id;
  ELSE
    UPDATE public.customer_tickets
    SET last_message_at = NEW.created_at,
        updated_at = now()
    WHERE id = NEW.ticket_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_ticket_on_message ON public.customer_ticket_messages;
CREATE TRIGGER trg_sync_ticket_on_message
AFTER INSERT ON public.customer_ticket_messages
FOR EACH ROW EXECUTE FUNCTION public.sync_ticket_on_message();

-- 5. 启用 realtime
ALTER TABLE public.customer_ticket_messages REPLICA IDENTITY FULL;
ALTER TABLE public.customer_tickets REPLICA IDENTITY FULL;
