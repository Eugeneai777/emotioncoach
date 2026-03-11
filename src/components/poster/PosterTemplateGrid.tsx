import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface SceneVariant {
  tagline: string;
  sellingPoints: string[];
  tone: string;
}

interface PosterTemplate {
  key: string;
  name: string;
  emoji: string;
  tagline: string;
  gradient: string;
  sellingPoints: string[];
  sceneVariants: {
    moments: SceneVariant;
    xiaohongshu: SceneVariant;
    wechat_group: SceneVariant;
  };
}

type TemplateCategory = 'recommended' | 'coach' | 'camp' | 'membership';

const CATEGORY_CONFIG: Record<TemplateCategory, { label: string; shortLabel: string; emoji: string }> = {
  recommended: { label: '推荐', shortLabel: '推荐', emoji: '🔥' },
  coach: { label: '教练', shortLabel: '教练', emoji: '🎯' },
  camp: { label: '训练营', shortLabel: '营', emoji: '🏕️' },
  membership: { label: '会员 & 合伙人', shortLabel: '会员', emoji: '👑' },
};

const TEMPLATE_CATEGORIES: Record<string, TemplateCategory> = {
  experience_pack: 'recommended',
  wealth_block: 'recommended',
  scl90: 'recommended',
  emotion_health: 'recommended',
  alive_check: 'recommended',
  emotion_coach: 'coach',
  parent_coach: 'coach',
  communication_coach: 'coach',
  story_coach: 'coach',
  vibrant_life: 'coach',
  emotion_button: 'coach',
  emotion_journal_21: 'camp',
  parent_emotion_21: 'camp',
  awakening: 'camp',
  parent_teen: 'camp',
  '365_member': 'membership',
  partner_recruit: 'membership',
};

const posterTemplates: PosterTemplate[] = [
  // ===== 推荐 =====
  {
    key: 'experience_pack',
    name: '9.9体验包',
    emoji: '🎁',
    tagline: '9.9元解锁7项专业服务，开启你的心理健康之旅',
    gradient: 'from-orange-400 to-amber-500',
    sellingPoints: [
      '尝鲜会员 50点AI教练额度',
      '3项专业测评（情绪健康+SCL-90+财富卡点）',
      '3项日常工具（情绪SOS+觉察日记+打卡）',
      '一杯奶茶钱，7项服务全解锁'
    ],
    sceneVariants: {
      moments: {
        tagline: '花了9.9元体验了7项服务，才发现自己一直在忽略情绪信号...',
        sellingPoints: ['一杯奶茶钱换7项专业服务', '测评+工具+AI额度全覆盖', '早发现早调整，别等崩溃才后悔'],
        tone: '个人觉醒+超值体验'
      },
      xiaohongshu: {
        tagline: '9.9元薅羊毛｜7项心理服务+50次AI对话，不买亏大了',
        sellingPoints: ['3项测评+3项日常工具+AI额度', '情绪SOS+觉察日记+打卡全解锁', '原价超100元，限时体验仅9.9'],
        tone: '超值种草+限时紧迫'
      },
      wechat_group: {
        tagline: '群友福利！9.9元体验包，7项服务全部解锁',
        sellingPoints: ['一杯奶茶钱体验全套服务', '测评+工具+AI额度一站搞定', '名额有限，先到先得'],
        tone: '群友福利+限量感'
      }
    }
  },
  {
    key: 'wealth_block',
    name: '财富卡点测评',
    emoji: '💰',
    tagline: '为什么努力赚钱，却总觉得不够？答案藏在你的潜意识里',
    gradient: 'from-amber-500 to-orange-600',
    sellingPoints: ['3分钟定位你的"财富天花板"在哪', 'AI解码你和钱之间的隐藏模式', '90%的人测完才发现：不是赚得少，是留不住'],
    sceneVariants: {
      moments: {
        tagline: '测完这个我才知道，原来我潜意识里一直在"推开"钱……',
        sellingPoints: ['3分钟出结果，准到后背发凉', '终于明白为什么钱总是"过路财"', '改变从看见开始，看见从测评开始'],
        tone: '个人顿悟+情绪共鸣'
      },
      xiaohongshu: {
        tagline: '震惊！你的消费习惯正在暴露你的"财富人格"｜免费AI测评',
        sellingPoints: ['心理学×行为经济学双模型深度扫描', 'AI一对一解读你的财富卡点报告', '附赠专属"财富解锁"行动方案'],
        tone: '悬念种草+专业背书'
      },
      wechat_group: {
        tagline: '@ 所有觉得"赚得不少但存不下来"的人，3分钟找到原因',
        sellingPoints: ['完全免费，扫码就能测', '已有5000+人测完直呼太准', '不改变认知，换多少工作都一样'],
        tone: '群友痛点+紧迫感'
      }
    }
  },
  {
    key: 'scl90',
    name: 'SCL-90心理测评',
    emoji: '🧠',
    tagline: '90题专业量表，10大心理因子全面扫描，AI个性化解读',
    gradient: 'from-violet-500 to-indigo-600',
    sellingPoints: ['全球权威心理健康自评量表', '10大因子：抑郁/焦虑/强迫/人际等', 'AI智能解读+个性化建议'],
    sceneVariants: {
      moments: {
        tagline: '做完这个SCL-90测评才知道，原来我的焦虑已经超出正常范围了...',
        sellingPoints: ['90题全面扫描10大心理因子', '比网上随便测的准多了', '还有AI帮你分析和建议'],
        tone: '个人觉察+专业信赖'
      },
      xiaohongshu: {
        tagline: 'SCL-90专业心理测评｜医院同款量表，在家就能自测',
        sellingPoints: ['全球广泛使用的心理健康筛查工具', '10大因子精准评估心理状态', 'AI个性化解读报告'],
        tone: '专业背书+种草测评'
      },
      wechat_group: {
        tagline: '推荐一个专业心理测评，90题全面了解自己的心理状态',
        sellingPoints: ['医院级别专业量表', '免费就能测', '测完有AI帮你详细分析'],
        tone: '群友推荐+专业信赖'
      }
    }
  },
  {
    key: 'emotion_health',
    name: '情绪健康测评',
    emoji: '❤️‍🩹',
    tagline: '32题三层诊断，找到你的情绪卡点，AI教练陪你修复',
    gradient: 'from-purple-500 to-pink-500',
    sellingPoints: ['三层诊断：状态/模式/阻滞点', '对标PHQ-9/GAD-7权威量表', 'AI教练个性化陪伴修复'],
    sceneVariants: {
      moments: {
        tagline: '原来我一直以为是性格问题，测完才发现是情绪卡点在作祟...',
        sellingPoints: ['32题就能精准定位问题根源', '三层深挖：不只看表面症状', '还有AI教练帮你一步步修复'],
        tone: '个人顿悟+深层发现'
      },
      xiaohongshu: {
        tagline: '情绪总是反复？32题三层诊断找到你的情绪卡点',
        sellingPoints: ['对标国际权威量表PHQ-9/GAD-7', '三层诊断模型精准到位', 'AI教练定制修复方案'],
        tone: '痛点切入+专业方案'
      },
      wechat_group: {
        tagline: '群友们试试这个情绪健康测评，32题就能找到情绪问题根源',
        sellingPoints: ['比一般测评深入三层', '测完有AI教练帮你分析', '好几个群友测完都说准'],
        tone: '群友验证+真诚推荐'
      }
    }
  },
  {
    key: 'alive_check',
     name: '每日平安打卡',
     emoji: '💗',
     tagline: '每日一键确认平安，让关心你的人安心',
     gradient: 'from-pink-400 to-rose-500',
     sellingPoints: ['每日一键平安确认', '超时自动通知紧急联系人', '最多5位联系人，默默守护'],
     sceneVariants: {
       moments: {
         tagline: '有了这个平安打卡功能，妈妈终于不用每天打电话确认我有没有事了',
         sellingPoints: ['一键打卡，家人自动收到平安通知', '忘打卡会自动提醒联系人', '独居/异地/老人都适用'],
         tone: '温暖故事+家人关怀'
       },
       xiaohongshu: {
         tagline: '独居女生必备｜平安打卡功能，超时自动通知紧急联系人',
         sellingPoints: ['每天点一下确认平安', '超时未打卡自动通知家人', '最多设置5位紧急联系人'],
         tone: '安全种草+独居必备'
       },
       wechat_group: {
         tagline: '群里独居的朋友看过来，这个平安打卡功能真的能救命',
         sellingPoints: ['每天一键打卡确认平安', '忘了打卡会自动通知你设定的联系人', '免费使用，设置很简单'],
         tone: '群友关怀+安全感'
       }
    }
  },
  // ===== 教练 =====
  {
    key: 'emotion_button',
    name: '情绪按钮',
    emoji: '🆘',
    tagline: '情绪炸了？30秒按一下，从崩溃边缘拉回来',
    gradient: 'from-teal-400 to-cyan-500',
    sellingPoints: ['288条神经科学认知提醒', '覆盖焦虑/恐慌/崩溃等9种情绪', '4阶段设计，从95分降到50分'],
    sceneVariants: {
      moments: {
        tagline: '昨晚又焦虑到凌晨3点，直到我按下了这个按钮...',
        sellingPoints: ['比闭眼深呼吸管用10倍', '不用打字，点一下就有人陪', '30秒找回理智'],
        tone: '个人故事+情感共鸣'
      },
      xiaohongshu: {
        tagline: '焦虑星人必备｜这个APP让我从95分降到50分',
        sellingPoints: ['神经科学验证的288条提醒', '覆盖9种常见情绪场景', '哈佛心理学原理设计'],
        tone: '数据种草+标签引流'
      },
      wechat_group: {
        tagline: '群里谁情绪容易上头？这个工具救了我无数次',
        sellingPoints: ['免费试用10次', '按一下30秒就见效', '群友都在用的情绪急救工具'],
        tone: '群友推荐+信任背书'
      }
    }
  },
  {
    key: 'emotion_coach',
    name: '情绪教练',
    emoji: '💚',
    tagline: '不只是撑过去，而是真正学会和情绪相处',
    gradient: 'from-green-400 to-emerald-500',
    sellingPoints: ['AI深度陪伴：觉察→理解→转化', '每次对话生成专属情绪简报', '按钮救急，教练治根'],
    sceneVariants: {
      moments: {
        tagline: '以前情绪来了只会硬撑，现在我学会和它对话了',
        sellingPoints: ['像有个24小时陪你的闺蜜', '帮我理清情绪背后真正想要的', '越聊越懂自己'],
        tone: '个人成长故事'
      },
      xiaohongshu: {
        tagline: 'AI情绪教练测评｜比心理咨询便宜100倍的深度梳理',
        sellingPoints: ['情绪四部曲科学模型', '每次自动生成成长简报', 'CBT认知行为疗法支持'],
        tone: '测评种草+性价比'
      },
      wechat_group: {
        tagline: '推荐大家试试这个AI情绪教练，比自己硬扛强多了',
        sellingPoints: ['新人50次免费对话', '24小时随时可聊', '聊完有简报能回看'],
        tone: '群友真诚推荐'
      }
    }
  },
  {
    key: 'parent_coach',
    name: '亲子教练',
    emoji: '👪',
    tagline: '父母先稳，孩子才愿意走向你',
    gradient: 'from-purple-400 to-violet-500',
    sellingPoints: ['看懂孩子情绪背后的需求', '化解「说什么都不听」的僵局', '从对抗变成同一边'],
    sceneVariants: {
      moments: {
        tagline: '曾经和孩子说什么都是错，直到我学会了这个方法',
        sellingPoints: ['不是孩子叛逆，是我不会沟通', '学会倾听后孩子主动找我聊了', '亲子关系真的能修复'],
        tone: '亲子故事+情感共鸣'
      },
      xiaohongshu: {
        tagline: '青春期孩子不说话？这个AI亲子教练帮我破冰了',
        sellingPoints: ['父母「稳、懂、通」三力模型', '科学应对叛逆/沉迷手机/厌学', '21天看见改变'],
        tone: '痛点切入+方法论'
      },
      wechat_group: {
        tagline: '家有青春期孩子的爸妈看过来，这个真的有用',
        sellingPoints: ['群里好几个妈妈都在用', '免费体验10次', '不吼不叫也能把话说进去'],
        tone: '群友背书+低门槛'
      }
    }
  },
  {
    key: 'communication_coach',
    name: '沟通教练',
    emoji: '💬',
    tagline: '轻松说出想说的话，让对方愿意听',
    gradient: 'from-blue-400 to-indigo-500',
    sellingPoints: ['不再被误解，不再忍到爆', '建立健康边界不伤关系', '冲突变成理解的开始'],
    sceneVariants: {
      moments: {
        tagline: '以前吵完架只会冷战，现在我学会了好好说话',
        sellingPoints: ['不委屈自己也不伤害对方', '建立边界后关系反而更近了', '会说话真的能改变命运'],
        tone: '个人成长蜕变'
      },
      xiaohongshu: {
        tagline: '社恐必看｜这个AI教练让我学会了非暴力沟通',
        sellingPoints: ['职场/亲密关系/家庭通用', '非暴力沟通四步法', '高情商不是天生的'],
        tone: '技能种草+场景覆盖'
      },
      wechat_group: {
        tagline: '群里有没有不会拒绝别人的？这个工具帮了我大忙',
        sellingPoints: ['学会说不也不得罪人', '免费体验沟通四部曲', '老好人必备'],
        tone: '群友共鸣+痛点'
      }
    }
  },
  {
    key: 'story_coach',
    name: '故事教练',
    emoji: '🌟',
    tagline: '那些没打倒你的，会变成你最有力量的故事',
    gradient: 'from-orange-400 to-amber-500',
    sellingPoints: ['英雄之旅：问题→转折→成长→领悟', 'AI帮你提炼人生闪光时刻', '分享故事，疗愈自己也启发他人'],
    sceneVariants: {
      moments: {
        tagline: '曾经觉得自己的经历很丧，现在我发现那是最珍贵的礼物',
        sellingPoints: ['每个人都有值得讲的故事', 'AI帮我把痛苦变成力量', '写下来的那一刻，我原谅了自己'],
        tone: '疗愈故事+情感价值'
      },
      xiaohongshu: {
        tagline: '英雄之旅写作法｜把你的人生经历变成爆款故事',
        sellingPoints: ['问题→转折→成长→领悟四步法', '好莱坞编剧都在用的框架', 'AI即时生成专属故事'],
        tone: '方法论种草+创作技巧'
      },
      wechat_group: {
        tagline: '想把自己的故事讲给更多人听？这个工具能帮你',
        sellingPoints: ['零基础也能写出好故事', '3分钟生成完整故事稿', '群友故事分享会用它'],
        tone: '群内共创+低门槛'
      }
    }
  },
  {
    key: 'vibrant_life',
    name: 'AI生活教练',
    emoji: '🌈',
    tagline: '5大生活场景智能适配，24小时温暖陪伴你的每一天',
    gradient: 'from-indigo-400 to-purple-500',
    sellingPoints: ['情绪/睡眠/压力/关系/目标全覆盖', '每次对话自动生成洞察报告', '24小时随时在线的私人教练'],
    sceneVariants: {
      moments: {
        tagline: '自从有了这个AI生活教练，感觉生活每个角落都被照顾到了',
        sellingPoints: ['睡不着、压力大、关系僵都能聊', '不只是陪聊，每次还给你洞察报告', '比朋友更懂你，比咨询更便宜'],
        tone: '生活陪伴+全方位关怀'
      },
      xiaohongshu: {
        tagline: 'AI生活教练体验｜5大场景全覆盖，私人教练24小时在线',
        sellingPoints: ['情绪/睡眠/压力/关系/目标5大领域', '每次对话生成专属洞察报告', '月均不到一杯咖啡的钱'],
        tone: '全面种草+性价比'
      },
      wechat_group: {
        tagline: '安利一个AI生活教练，情绪、睡眠、压力什么都能聊',
        sellingPoints: ['5个生活场景随便选', '24小时在线不用预约', '群友都说比想象中好用'],
        tone: '群友安利+场景丰富'
      }
    }
  },
  // ===== 训练营 =====
  {
    key: 'emotion_journal_21',
    name: '21天情绪日记营',
    emoji: '📝',
    tagline: '每天10分钟，让情绪从敌人变成朋友',
    gradient: 'from-purple-400 to-pink-500',
    sellingPoints: ['21天系统训练，建立新回路', '科学证实：焦虑下降31%', '每日复盘，看见自己的成长轨迹'],
    sceneVariants: {
      moments: {
        tagline: '坚持写情绪日记21天后，我的焦虑真的变少了',
        sellingPoints: ['每天只要10分钟', '比吃药便宜比冥想简单', '21天后像换了个人'],
        tone: '亲身经历+结果导向'
      },
      xiaohongshu: {
        tagline: '情绪日记21天挑战｜焦虑星人自救指南',
        sellingPoints: ['科学研究证实焦虑下降31%', '21天重塑大脑情绪回路', '每日打卡+群友互相监督'],
        tone: '挑战赛+科学背书'
      },
      wechat_group: {
        tagline: '群里有没有想一起参加21天情绪日记训练的？',
        sellingPoints: ['群友组团更容易坚持', '免费参与还有礼物', '每天10分钟一起成长'],
        tone: '组团邀约+社群感'
      }
    }
  },
  {
    key: 'parent_emotion_21',
    name: '21天青少年困境突破营',
    emoji: '👨‍👩‍👧',
    tagline: '孩子叛逆、沉迷手机、不愿沟通？21天找回连接',
    gradient: 'from-emerald-400 to-teal-500',
    sellingPoints: ['破解青春期最常见的7大困境', '父母「稳、懂、通」三力模型', '让孩子从对抗变成愿意靠近'],
    sceneVariants: {
      moments: {
        tagline: '用了这个方法21天，孩子终于愿意和我说心里话了',
        sellingPoints: ['不是孩子难管，是方法没找对', '从吼叫变成拥抱只用了3周', '真希望早点知道这个'],
        tone: '家长故事+希望传递'
      },
      xiaohongshu: {
        tagline: '青春期父母必看｜21天突破亲子困境的方法',
        sellingPoints: ['7大青春期困境逐个破解', '父母三力模型科学框架', '21天亲子关系肉眼可见改善'],
        tone: '干货方法+可量化结果'
      },
      wechat_group: {
        tagline: '家有10-18岁孩子的爸妈，一起参加这个训练营吧',
        sellingPoints: ['群友孩子年龄相近互相取经', '导师+群友双重支持', '21天不满意全额退'],
        tone: '群友抱团+安全感'
      }
    }
  },
  {
    key: 'awakening',
    name: '觉察系统',
    emoji: '🔮',
    tagline: '6维深度觉察训练，情绪/感恩/行动/决策/关系/方向全覆盖',
    gradient: 'from-violet-500 to-purple-600',
    sellingPoints: ['6大觉察维度系统训练', 'AI引导式自我探索', '游戏化成长记录与可视化'],
    sceneVariants: {
      moments: {
        tagline: '用了这个觉察系统后，才发现以前活得有多"自动驾驶"',
        sellingPoints: ['6个维度帮我看清自己的盲点', '每天花几分钟就能深度觉察', '像给人生装了一面镜子'],
        tone: '觉醒感悟+深度思考'
      },
      xiaohongshu: {
        tagline: '自我觉察神器｜6维训练系统，像给人生装了高清镜头',
        sellingPoints: ['情绪/感恩/行动/决策/关系/方向', 'AI引导不会尴尬不用约人', '游戏化成长可视化超有成就感'],
        tone: '神器种草+系统化'
      },
      wechat_group: {
        tagline: '想更了解自己的群友可以试试这个觉察系统',
        sellingPoints: ['6个维度全面了解自己', 'AI引导很温和不强迫', '群友一起练效果更好'],
        tone: '群友推荐+温和邀约'
      }
    }
  },
  {
    key: 'parent_teen',
    name: '亲子双轨模式',
    emoji: '👨‍👩‍👧‍👦',
    tagline: '父母与孩子各有独立空间，保护隐私的智能情绪陪伴',
    gradient: 'from-fuchsia-400 to-purple-500',
    sellingPoints: ['父母和孩子各有专属空间', '保护隐私的情绪陪伴', '智能匹配成长建议'],
    sceneVariants: {
      moments: {
        tagline: '孩子终于愿意倾诉了，因为这个空间只属于TA自己',
        sellingPoints: ['孩子有自己的私密空间更愿意说', '父母也有专属支持不再孤军奋战', '隐私保护让信任重建成为可能'],
        tone: '信任重建+隐私关怀'
      },
      xiaohongshu: {
        tagline: '亲子沟通新方式｜父母孩子各有AI空间，隐私保护超安心',
        sellingPoints: ['双轨设计：父母端+孩子端', '孩子的秘密不会被看到', 'AI智能匹配亲子成长建议'],
        tone: '创新模式+隐私安全'
      },
      wechat_group: {
        tagline: '家有青春期孩子的看过来，这个双轨模式孩子更愿意用',
        sellingPoints: ['孩子有自己的空间才肯说心里话', '父母也有专属教练支持', '比强迫沟通效果好100倍'],
        tone: '群友验证+破冰方案'
      }
    }
  },
  // ===== 会员 & 合伙人 =====
  {
    key: '365_member',
    name: '365会员',
    emoji: '👑',
    tagline: '一整年的情绪自由，每天不到1块钱',
    gradient: 'from-amber-400 to-yellow-500',
    sellingPoints: ['1000点AI额度，畅聊无忧', '解锁全部4大教练+所有训练营', '你的私人情绪健康管家'],
    sceneVariants: {
      moments: {
        tagline: '买了这个365会员后，感觉情绪有了私人管家',
        sellingPoints: ['一天不到1块钱', '想聊就聊不限次数', '值回票价的最好决定'],
        tone: '真实使用感受'
      },
      xiaohongshu: {
        tagline: '情绪管理APP年度会员测评｜365块用一年值不值？',
        sellingPoints: ['1000点AI额度=1000次深度对话', '4大教练+全部训练营解锁', '对比同类APP性价比最高'],
        tone: '测评对比+性价比'
      },
      wechat_group: {
        tagline: '经常用这个APP的群友可以考虑开个年卡，真的划算',
        sellingPoints: ['群友专属优惠链接', '一年1000次对话够用了', '开了后不心疼点数了'],
        tone: '群友推荐+专属感'
      }
    }
  },
  {
    key: 'partner_recruit',
    name: '有劲合伙人',
    emoji: '🤝',
    tagline: 'AI时代，用你的影响力帮更多人走出情绪困境',
    gradient: 'from-rose-400 to-pink-500',
    sellingPoints: ['分享就能赚取18%-50%佣金', '帮助他人疗愈，自己也有收入', '零囤货零压力，链接就是资产'],
    sceneVariants: {
      moments: {
        tagline: '这个月靠分享这个APP又多了几千块收入',
        sellingPoints: ['帮朋友解决情绪问题还能赚钱', '被动收入越来越多', '比微商体面比打工自由'],
        tone: '个人收益故事'
      },
      xiaohongshu: {
        tagline: 'AI时代副业推荐｜心理健康赛道合伙人计划',
        sellingPoints: ['18%-50%高额佣金', '三级分销团队裂变', '万亿心理健康市场红利'],
        tone: '副业种草+赛道机会'
      },
      wechat_group: {
        tagline: '想做副业的群友看这里，有个不用囤货的项目',
        sellingPoints: ['零成本零风险', '群友都在用的产品更好推', '有团队带新人不用自己摸索'],
        tone: '副业分享+群友信任'
      }
    }
  }
];

export type SceneType = 'default' | 'moments' | 'xiaohongshu' | 'wechat_group';

interface PosterTemplateGridProps {
  onSelect: (templateKey: string) => void;
}

export function PosterTemplateGrid({ onSelect }: PosterTemplateGridProps) {
  const getTemplatesByCategory = (category: TemplateCategory) =>
    posterTemplates.filter(t => TEMPLATE_CATEGORIES[t.key] === category);

  const renderTemplateCard = (template: PosterTemplate, isRecommended = false) => (
    <Card 
      key={template.key}
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden group"
      onClick={() => onSelect(template.key)}
    >
      <div className={`h-2 bg-gradient-to-r ${template.gradient}`} />
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{template.emoji}</span>
          <span className="font-medium text-sm">{template.name}</span>
          {isRecommended && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-600 border-orange-200">
              热门
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{template.tagline}</p>
        <div className="space-y-1">
          {template.sellingPoints.slice(0, 2).map((point, idx) => (
            <div key={idx} className="text-xs text-muted-foreground/80 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
              <span className="line-clamp-1">{point}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderCategorySection = (category: TemplateCategory) => {
    const templates = getTemplatesByCategory(category);
    const config = CATEGORY_CONFIG[category];
    if (templates.length === 0) return null;

    return (
      <div key={category}>
        <div className="flex items-center gap-2 mb-3">
          <span>{config.emoji}</span>
          <h3 className="font-medium text-sm text-foreground">{config.label}</h3>
          <span className="text-xs text-muted-foreground">({templates.length})</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {templates.map(t => renderTemplateCard(t, category === 'recommended'))}
        </div>
      </div>
    );
  };

  const categories: TemplateCategory[] = ['recommended', 'coach', 'camp', 'membership'];

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="w-full mb-4 flex-wrap h-auto gap-1 p-1">
        <TabsTrigger value="all" className="text-xs">
          全部
        </TabsTrigger>
        {categories.map(cat => (
          <TabsTrigger key={cat} value={cat} className="text-xs">
            <span className="hidden sm:inline">{CATEGORY_CONFIG[cat].emoji} {CATEGORY_CONFIG[cat].label}</span>
            <span className="inline sm:hidden">{CATEGORY_CONFIG[cat].emoji} {CATEGORY_CONFIG[cat].shortLabel}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="all" className="space-y-6">
        {categories.map(cat => renderCategorySection(cat))}
      </TabsContent>

      {categories.map(cat => (
        <TabsContent key={cat} value={cat}>
          {renderCategorySection(cat)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export { posterTemplates };
export type { PosterTemplate, SceneVariant };
