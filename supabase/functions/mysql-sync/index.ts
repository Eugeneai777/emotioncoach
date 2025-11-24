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

    // 使用环境变量配置 MySQL 连接
    const mysqlConfig = {
      hostname: Deno.env.get('MYSQL_HOST'),
      port: parseInt(Deno.env.get('MYSQL_PORT') || '3306'),
      username: Deno.env.get('MYSQL_USER'),
      password: Deno.env.get('MYSQL_PASSWORD'),
      db: Deno.env.get('MYSQL_DATABASE'),
    };

    // 验证必要的环境变量
    if (!mysqlConfig.hostname || !mysqlConfig.username || !mysqlConfig.password || !mysqlConfig.db) {
      throw new Error('缺少必要的 MySQL 环境变量配置');
    }

    console.log(`🔗 连接 MySQL: ${mysqlConfig.hostname}:${mysqlConfig.port}/${mysqlConfig.db}`);
    
    const mysqlClient = await new Client().connect(mysqlConfig);
    console.log('✅ MySQL 连接成功');
    
    // 测试查询
    const testResult = await mysqlClient.query("SELECT 1 as test");
    if (testResult.length === 0) {
      throw new Error('MySQL 连接测试失败');
    }
    console.log('✅ MySQL 查询测试通过');

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
    let newUserCount = 0;
    let updatedUserCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    for (const mysqlUser of mysqlUsers) {
      try {
        // 验证必要字段
        if (!mysqlUser.uuid || !mysqlUser.id) {
          console.warn(`⚠️ 用户数据不完整，跳过: id=${mysqlUser.id}, uuid=${mysqlUser.uuid}`);
          errorCount++;
          errors.push({ 
            userId: mysqlUser.id || 'unknown', 
            error: '用户数据不完整' 
          });
          continue;
        }
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
            updatedUserCount++;
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
            newUserCount++;
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
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`❌ 同步用户 ${mysqlUser.id} 失败:`, errorMsg);
        errors.push({ 
          userId: mysqlUser.id, 
          error: errorMsg 
        });
        errorCount++;
      }
    }

    await mysqlClient.close();
    console.log('✅ MySQL 连接已关闭');

    const syncResult = {
      success: true,
      total: mysqlUsers.length,
      synced: syncedCount,
      new_users: newUserCount,
      updated_users: updatedUserCount,
      errors: errorCount,
      error_details: errors.slice(0, 10), // 只返回前 10 个错误详情
      timestamp: new Date().toISOString(),
    };

    console.log(`✅ 同步完成:`, syncResult);

    return new Response(
      JSON.stringify(syncResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ 同步失败:', errorMsg);
    if (stack) {
      console.error('Stack trace:', stack);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
