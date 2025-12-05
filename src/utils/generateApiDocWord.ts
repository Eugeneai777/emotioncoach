import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

const createTableRow = (cells: string[], isHeader = false) => {
  return new TableRow({
    children: cells.map(text => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, bold: isHeader, size: 20 })]
      })],
      width: { size: 100 / cells.length, type: WidthType.PERCENTAGE }
    }))
  });
};

export const generateApiDocWord = async () => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // 标题
        new Paragraph({
          text: '劲老师应用 API 接口文档',
          heading: HeadingLevel.TITLE,
          spacing: { after: 400 }
        }),
        
        // 基础信息
        new Paragraph({ text: '一、基础信息', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: 'Base URL: ', bold: true }), new TextRun('https://vlsuzskvykddwrxbmcbu.supabase.co')] }),
        new Paragraph({ children: [new TextRun({ text: 'REST API: ', bold: true }), new TextRun('https://vlsuzskvykddwrxbmcbu.supabase.co/rest/v1')] }),
        new Paragraph({ children: [new TextRun({ text: 'Edge Functions: ', bold: true }), new TextRun('https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1')] }),
        new Paragraph({ children: [new TextRun({ text: 'Anon Key: ', bold: true }), new TextRun('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsc3V6c2t2eWtkZHdyeGJtY2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Mzg2NjQsImV4cCI6MjA3ODQxNDY2NH0.pYilMaNu2_EQvn4HrfIpAGxomkQCQCdPPLMq5NPv3pk')], spacing: { after: 200 } }),
        
        // 请求头
        new Paragraph({ text: '二、请求头配置', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['Header', '值', '说明'], true),
            createTableRow(['apikey', '{ANON_KEY}', '必需，API密钥']),
            createTableRow(['Authorization', 'Bearer {JWT_TOKEN}', '用户认证token']),
            createTableRow(['Content-Type', 'application/json', '请求体格式'])
          ]
        }),
        
        // 数据库REST API
        new Paragraph({ text: '三、数据库 REST API', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
        
        // 用户相关
        new Paragraph({ text: '3.1 用户相关', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['表名', '端点', '说明'], true),
            createTableRow(['profiles', '/rest/v1/profiles', '用户资料']),
            createTableRow(['user_accounts', '/rest/v1/user_accounts', '用户账户信息']),
            createTableRow(['user_roles', '/rest/v1/user_roles', '用户角色']),
            createTableRow(['subscriptions', '/rest/v1/subscriptions', '用户订阅'])
          ]
        }),
        
        // 对话与简报
        new Paragraph({ text: '3.2 对话与简报', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['表名', '端点', '说明'], true),
            createTableRow(['conversations', '/rest/v1/conversations', '对话记录']),
            createTableRow(['messages', '/rest/v1/messages', '消息内容']),
            createTableRow(['briefings', '/rest/v1/briefings', '情绪简报']),
            createTableRow(['communication_briefings', '/rest/v1/communication_briefings', '沟通简报']),
            createTableRow(['parent_coaching_sessions', '/rest/v1/parent_coaching_sessions', '亲子教练会话']),
            createTableRow(['vibrant_life_sage_briefings', '/rest/v1/vibrant_life_sage_briefings', '有劲生活简报'])
          ]
        }),
        
        // 标签系统
        new Paragraph({ text: '3.3 标签系统', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['表名', '端点', '说明'], true),
            createTableRow(['tags', '/rest/v1/tags', '情绪标签']),
            createTableRow(['briefing_tags', '/rest/v1/briefing_tags', '简报标签关联']),
            createTableRow(['communication_tags', '/rest/v1/communication_tags', '沟通标签']),
            createTableRow(['parent_tags', '/rest/v1/parent_tags', '亲子标签'])
          ]
        }),
        
        // 训练营
        new Paragraph({ text: '3.4 训练营', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['表名', '端点', '说明'], true),
            createTableRow(['camp_templates', '/rest/v1/camp_templates', '训练营模板']),
            createTableRow(['training_camps', '/rest/v1/training_camps', '用户训练营']),
            createTableRow(['camp_daily_progress', '/rest/v1/camp_daily_progress', '每日进度']),
            createTableRow(['camp_daily_tasks', '/rest/v1/camp_daily_tasks', '每日任务']),
            createTableRow(['camp_video_tasks', '/rest/v1/camp_video_tasks', '视频任务']),
            createTableRow(['user_camp_purchases', '/rest/v1/user_camp_purchases', '训练营购买'])
          ]
        }),
        
        // 社区
        new Paragraph({ text: '3.5 社区', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['表名', '端点', '说明'], true),
            createTableRow(['community_posts', '/rest/v1/community_posts', '社区帖子']),
            createTableRow(['post_comments', '/rest/v1/post_comments', '帖子评论']),
            createTableRow(['post_likes', '/rest/v1/post_likes', '帖子点赞']),
            createTableRow(['post_reports', '/rest/v1/post_reports', '帖子举报'])
          ]
        }),
        
        // 合伙人
        new Paragraph({ text: '3.6 合伙人系统', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['表名', '端点', '说明'], true),
            createTableRow(['partners', '/rest/v1/partners', '合伙人信息']),
            createTableRow(['partner_referrals', '/rest/v1/partner_referrals', '推荐关系']),
            createTableRow(['partner_commissions', '/rest/v1/partner_commissions', '佣金记录']),
            createTableRow(['partner_withdrawals', '/rest/v1/partner_withdrawals', '提现记录']),
            createTableRow(['redemption_codes', '/rest/v1/redemption_codes', '兑换码'])
          ]
        }),
        
        // 订单支付
        new Paragraph({ text: '3.7 订单与支付', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['表名', '端点', '说明'], true),
            createTableRow(['packages', '/rest/v1/packages', '套餐包']),
            createTableRow(['orders', '/rest/v1/orders', '订单记录']),
            createTableRow(['usage_records', '/rest/v1/usage_records', '使用记录'])
          ]
        }),
        
        // 工具记录
        new Paragraph({ text: '3.8 工具与记录', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['表名', '端点', '说明'], true),
            createTableRow(['panic_sessions', '/rest/v1/panic_sessions', '情绪急救会话']),
            createTableRow(['user_voice_recordings', '/rest/v1/user_voice_recordings', '语音录制']),
            createTableRow(['meditation_sessions', '/rest/v1/meditation_sessions', '冥想记录']),
            createTableRow(['breathing_sessions', '/rest/v1/breathing_sessions', '呼吸练习']),
            createTableRow(['emotion_quick_logs', '/rest/v1/emotion_quick_logs', '快速情绪记录']),
            createTableRow(['emotion_goals', '/rest/v1/emotion_goals', '情绪目标']),
            createTableRow(['user_achievements', '/rest/v1/user_achievements', '用户成就'])
          ]
        }),
        
        // Edge Functions
        new Paragraph({ text: '四、Edge Functions API', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
        
        // AI教练
        new Paragraph({ text: '4.1 AI教练对话', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['函数名', '方法', '需JWT', '说明'], true),
            createTableRow(['emotion-coach', 'POST', '是', '情绪教练对话']),
            createTableRow(['carnegie-coach', 'POST', '是', '沟通教练对话']),
            createTableRow(['parent-emotion-coach', 'POST', '是', '亲子教练对话']),
            createTableRow(['vibrant-life-sage-coach', 'POST', '是', '有劲生活教练']),
            createTableRow(['life-coach', 'POST', '是', '生活教练']),
            createTableRow(['generate-story-coach', 'POST', '是', '故事教练生成']),
            createTableRow(['chat', 'POST', '是', '通用对话'])
          ]
        }),
        
        // AI分析
        new Paragraph({ text: '4.2 AI分析', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['函数名', '方法', '需JWT', '说明'], true),
            createTableRow(['analyze-emotion-patterns', 'POST', '是', '情绪模式分析']),
            createTableRow(['analyze-communication-patterns', 'POST', '是', '沟通模式分析']),
            createTableRow(['analyze-parent-emotion-patterns', 'POST', '是', '亲子情绪分析']),
            createTableRow(['analyze-tag-associations', 'POST', '是', '标签关联分析']),
            createTableRow(['analyze-tag-trends', 'POST', '是', '标签趋势分析']),
            createTableRow(['analyze-user-behavior', 'POST', '是', '用户行为分析'])
          ]
        }),
        
        // AI生成
        new Paragraph({ text: '4.3 AI生成', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['函数名', '方法', '需JWT', '说明'], true),
            createTableRow(['generate-emotion-review', 'POST', '是', '情绪报告生成']),
            createTableRow(['generate-communication-review', 'POST', '是', '沟通报告生成']),
            createTableRow(['generate-tag-report', 'POST', '是', '标签报告']),
            createTableRow(['generate-smart-notification', 'POST', '是', '智能通知']),
            createTableRow(['generate-coach-template', 'POST', '是', '教练模板']),
            createTableRow(['generate-checkin-image', 'POST', '是', '打卡图片']),
            createTableRow(['generate-all-reminders', 'POST', '是', '生成所有提醒语音'])
          ]
        }),
        
        // 课程推荐
        new Paragraph({ text: '4.4 课程推荐', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['函数名', '方法', '需JWT', '说明'], true),
            createTableRow(['recommend-courses', 'POST', '是', '课程推荐']),
            createTableRow(['recommend-communication-courses', 'POST', '是', '沟通课程推荐']),
            createTableRow(['recommend-music', 'POST', '是', '音乐推荐']),
            createTableRow(['recommend-posts', 'POST', '是', '帖子推荐'])
          ]
        }),
        
        // 目标成就
        new Paragraph({ text: '4.5 目标与成就', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['函数名', '方法', '需JWT', '说明'], true),
            createTableRow(['suggest-goals', 'POST', '是', '目标建议']),
            createTableRow(['suggest-smart-goals', 'POST', '是', '智能目标建议']),
            createTableRow(['goal-completion-feedback', 'POST', '是', '目标完成反馈']),
            createTableRow(['check-streak-achievements', 'POST', '是', '连续成就检查']),
            createTableRow(['tag-goal-coach', 'POST', '是', '标签目标教练'])
          ]
        }),
        
        // 配额管理
        new Paragraph({ text: '4.6 配额管理', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['函数名', '方法', '需JWT', '说明'], true),
            createTableRow(['check-quota', 'POST', '是', '检查配额']),
            createTableRow(['deduct-quota', 'POST', '是', '扣除配额']),
            createTableRow(['admin-recharge', 'POST', '是', '管理员充值'])
          ]
        }),
        
        // 微信集成
        new Paragraph({ text: '4.7 微信集成', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['函数名', '方法', '需JWT', '说明'], true),
            createTableRow(['wechat-callback', 'GET/POST', '否', '微信回调验证']),
            createTableRow(['wechat-chat', 'POST', '否', '微信对话处理']),
            createTableRow(['wechat-oauth-callback', 'GET', '否', 'OAuth回调']),
            createTableRow(['wechat-oauth-process', 'POST', '否', 'OAuth处理']),
            createTableRow(['get-wechat-config', 'POST', '是', '获取JS-SDK配置']),
            createTableRow(['get-wechat-access-token', 'POST', '是', '获取access_token']),
            createTableRow(['send-wechat-template-message', 'POST', '是', '发送模板消息'])
          ]
        }),
        
        // 微信支付
        new Paragraph({ text: '4.8 微信支付', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['函数名', '方法', '需JWT', '说明'], true),
            createTableRow(['create-wechat-order', 'POST', '是', '创建支付订单']),
            createTableRow(['check-order-status', 'POST', '是', '检查订单状态']),
            createTableRow(['wechat-pay-callback', 'POST', '否', '支付回调'])
          ]
        }),
        
        // 企业微信
        new Paragraph({ text: '4.9 企业微信', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['函数名', '方法', '需JWT', '说明'], true),
            createTableRow(['wecom-callback', 'GET/POST', '否', '企微回调']),
            createTableRow(['get-wecom-access-token', 'POST', '是', '获取企微token']),
            createTableRow(['send-wecom-notification', 'POST', '是', '发送企微通知'])
          ]
        }),
        
        // 合伙人系统
        new Paragraph({ text: '4.10 合伙人系统', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['函数名', '方法', '需JWT', '说明'], true),
            createTableRow(['process-referral', 'POST', '是', '处理推荐']),
            createTableRow(['calculate-commission', 'POST', '是', '计算佣金']),
            createTableRow(['confirm-commissions', 'POST', '是', '确认佣金']),
            createTableRow(['partner-withdrawal', 'POST', '是', '合伙人提现']),
            createTableRow(['generate-redemption-codes', 'POST', '是', '生成兑换码']),
            createTableRow(['redeem-code', 'POST', '是', '兑换码使用'])
          ]
        }),
        
        // 其他
        new Paragraph({ text: '4.11 其他功能', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            createTableRow(['函数名', '方法', '需JWT', '说明'], true),
            createTableRow(['text-to-speech', 'POST', '是', '文字转语音']),
            createTableRow(['create-voice-clone', 'POST', '是', '创建语音克隆']),
            createTableRow(['compare-emotions', 'POST', '是', '情绪对比']),
            createTableRow(['compare-communications', 'POST', '是', '沟通对比']),
            createTableRow(['classify-tag-sentiment', 'POST', '是', '标签情感分类']),
            createTableRow(['emotion-alert-suggestions', 'POST', '是', '情绪警报建议']),
            createTableRow(['trigger-notifications', 'POST', '是', '触发通知']),
            createTableRow(['push-weekly-courses', 'POST', '是', '推送周课程']),
            createTableRow(['import-video-courses', 'POST', '是', '导入视频课程']),
            createTableRow(['mysql-sync', 'POST', '是', 'MySQL同步'])
          ]
        }),
        
        // 查询示例
        new Paragraph({ text: '五、REST API 查询示例', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
        
        new Paragraph({ text: '5.1 获取用户简报列表', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: 'GET /rest/v1/briefings?select=*&order=created_at.desc&limit=10', font: 'Courier New', size: 18 })] }),
        
        new Paragraph({ text: '5.2 获取训练营详情', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: 'GET /rest/v1/training_camps?select=*,camp_templates(*)&eq(user_id,{user_id})', font: 'Courier New', size: 18 })] }),
        
        new Paragraph({ text: '5.3 创建社区帖子', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: 'POST /rest/v1/community_posts', font: 'Courier New', size: 18 })] }),
        new Paragraph({ children: [new TextRun({ text: 'Body: { "user_id": "xxx", "content": "内容", "post_type": "story" }', font: 'Courier New', size: 18 })] }),
        
        new Paragraph({ text: '5.4 更新用户资料', heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: 'PATCH /rest/v1/profiles?id=eq.{user_id}', font: 'Courier New', size: 18 })] }),
        new Paragraph({ children: [new TextRun({ text: 'Body: { "display_name": "新名称" }', font: 'Courier New', size: 18 })] }),
        
        // 文档信息
        new Paragraph({ text: '', spacing: { before: 600 } }),
        new Paragraph({ 
          children: [new TextRun({ text: `文档生成时间: ${new Date().toLocaleString('zh-CN')}`, italics: true, color: '666666' })]
        })
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, '劲老师应用API接口文档.docx');
};
