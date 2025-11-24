import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MySQLUser {
  id: string;
  uuid: string;
  remainder: number;
  timeout: string | null;
  creation_time: Date;
}

interface MySQLOrder {
  id: string;
  uuid: string;
  combo_id: string;
  description: string;
  amount: number;
  trade_state: string;
  creation_time: Date;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 开始 MySQL → Supabase 同步...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const mysqlClient = await new Client().connect({
      hostname: "47.94.221.131",
      port: 3306,
      username: "root",
      password: "12345678",
      db: "youjinai",
    });

    const mysqlUsers = await mysqlClient.query(
      "SELECT id, uuid, remainder, timeout, creation_time FROM users"
    ) as MySQLUser[];

    console.log(`📊 从 MySQL 读取到 ${mysqlUsers.length} 个用户`);

    const comboMap = new Map();
    const combos = await mysqlClient.query(
      "SELECT id, title, number, timeout FROM sys_combo"
    );
    combos.forEach((combo: any) => {
      comboMap.set(combo.id, combo);
    });

    let syncedCount = 0;
    let errorCount = 0;

    for (const mysqlUser of mysqlUsers) {
      try {
        let supabaseUserId: string | null = null;

        const { data: wecomMapping } = await supabase
          .from('wecom_user_mappings')
          .select('system_user_id')
          .eq('wecom_user_id', mysqlUser.uuid)
          .maybeSingle();

        if (wecomMapping) {
          supabaseUserId = wecomMapping.system_user_id;
          console.log(`✅ 找到企微映射: ${mysqlUser.uuid} → ${supabaseUserId}`);
        } else {
          const { data: existingAccount } = await supabase
            .from('user_accounts')
            .select('user_id')
            .eq('mysql_uuid', mysqlUser.uuid)
            .maybeSingle();

          if (existingAccount) {
            supabaseUserId = existingAccount.user_id;
            console.log(`✅ 找到已存在账户: ${mysqlUser.uuid}`);
          } else {
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
              email: `mysql_${mysqlUser.id}@temp.youjinai.com`,
              email_confirm: true,
              user_metadata: {
                source: 'mysql_sync',
                mysql_id: mysqlUser.id,
                mysql_uuid: mysqlUser.uuid,
              }
            });

            if (createError) throw createError;
            supabaseUserId = newUser.user.id;
            console.log(`🆕 创建新用户: ${mysqlUser.uuid} → ${supabaseUserId}`);
          }
        }

        const expiresAt = mysqlUser.timeout 
          ? new Date(mysqlUser.timeout)
          : null;

        await supabase.from('user_accounts').upsert({
          user_id: supabaseUserId,
          mysql_user_id: mysqlUser.id,
          mysql_uuid: mysqlUser.uuid,
          total_quota: mysqlUser.remainder,
          used_quota: 0,
          quota_expires_at: expiresAt?.toISOString(),
          last_sync_at: new Date().toISOString(),
          sync_source: 'mysql',
        }, {
          onConflict: 'user_id',
        });

        const userOrders = await mysqlClient.query(
          `SELECT * FROM user_orders 
           WHERE uuid = ? 
           AND trade_state = 'SUCCESS'
           ORDER BY creation_time DESC 
           LIMIT 1`,
          [mysqlUser.uuid]
        ) as MySQLOrder[];

        if (userOrders.length > 0) {
          const latestOrder = userOrders[0];
          const combo = comboMap.get(latestOrder.combo_id);

          let subscriptionType = 'custom';
          if (combo?.title?.includes('365')) {
            subscriptionType = 'youjin365';
          }

          const startDate = new Date(latestOrder.creation_time);
          const endDate = combo?.timeout 
            ? new Date(startDate.getTime() + combo.timeout * 24 * 60 * 60 * 1000)
            : null;

          await supabase.from('subscriptions').upsert({
            user_id: supabaseUserId,
            mysql_order_id: latestOrder.id,
            mysql_combo_id: latestOrder.combo_id,
            subscription_type: subscriptionType,
            status: endDate && endDate > new Date() ? 'active' : 'expired',
            combo_name: latestOrder.description,
            combo_amount: latestOrder.amount,
            total_quota: combo?.number,
            start_date: startDate.toISOString(),
            end_date: endDate?.toISOString(),
          }, {
            onConflict: 'user_id',
          });
        } else {
          await supabase.from('subscriptions').upsert({
            user_id: supabaseUserId,
            subscription_type: 'free',
            status: 'active',
            combo_name: '免费体验',
            total_quota: 50,
          }, {
            onConflict: 'user_id',
          });
        }

        syncedCount++;
      } catch (error) {
        console.error(`❌ 同步用户 ${mysqlUser.id} 失败:`, error);
        errorCount++;
      }
    }

    await mysqlClient.close();

    console.log(`✅ 同步完成: ${syncedCount} 成功, ${errorCount} 失败`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedCount,
        errors: errorCount,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ 同步失败:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
