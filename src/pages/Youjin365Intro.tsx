import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";

export default function Youjin365Intro() {
  const navigate = useNavigate();

  return (
    <>
      <DynamicOGMeta pageKey="packages" />
      <div className="h-screen overflow-y-auto bg-background">
        <PageHeader title="有劲AI 365会员 · 详细介绍" />

        <article className="container max-w-2xl mx-auto px-4 py-5 space-y-6 text-sm leading-relaxed text-foreground/90">

          <header className="rounded-xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-orange-50/40 p-4">
            <h1 className="text-xl font-bold text-orange-700">有劲AI 365会员</h1>
            <p className="mt-1 text-muted-foreground">¥365/年 · 1000 AI点数 · 365天有效 · 全家可用</p>
          </header>

          <section>
            <h2 className="text-base font-semibold text-orange-700 mb-2">一、它是什么</h2>
            <p>
              有劲AI 是面向<strong>所有需要"加点劲"人群</strong>的能量加油站——
              青少年、年轻职场人、宝妈、中年男女、银发父母都能找到对应的 AI 教练与训练营。
              把 AI 测评、AI 教练对话、AI 训练营、每日守护工具整合在一起，
              帮你把"扛不住的情绪、说不清的关系、看不清的财务、提不起劲的状态"一点点理顺。
              <strong>365 会员</strong>是有劲AI 的<strong>主推年卡</strong>，一次开通，全年所有 AI 能力按点数畅用。
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-orange-700 mb-2">二、365会员 权益一览</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>价格：¥365 / 年</strong>（折合 ¥1/天）</li>
              <li><strong>赠送 1000 AI 点数</strong>，有效期 365 天</li>
              <li>不限次解锁<strong>全部 AI 测评工具</strong></li>
              <li>不限次进入<strong>全部 AI 教练语音对话</strong></li>
              <li>畅打卡<strong>全部 7 天 / 21 天 AI 训练营</strong></li>
              <li>每日守护：早安能量卡、深夜陪伴、情绪急救按钮</li>
              <li>点数余额不清零，可续费叠加</li>
              <li>会员到期前可享续费折扣</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-orange-700 mb-2">三、包含哪些 AI 工具</h2>

            <h3 className="font-semibold mt-3 mb-1">🧰 AI 测评工具（不限次使用）</h3>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>SCL-90 心理健康自评</li>
              <li>SBTI 人格全景测评</li>
              <li>情绪健康测评</li>
              <li>压力源诊断</li>
              <li>财富心智测评</li>
              <li>关系沟通测评</li>
              <li>亲子教养能力测评</li>
              <li>女性竞争力测评</li>
              <li>中年觉醒测评 等 20+ 项</li>
            </ul>

            <h3 className="font-semibold mt-3 mb-1">🎙️ AI 教练（语音 + 文字）</h3>
            <ul className="list-disc pl-5 space-y-0.5">
              <li><strong>情绪教练</strong>：随时倾诉，疏导卡点</li>
              <li><strong>财富教练</strong>：理清财务焦虑与目标</li>
              <li><strong>亲子教练</strong>：沟通、教养、青春期问题</li>
              <li><strong>有劲生活教练</strong>：日常状态与时间管理</li>
              <li><strong>小金 / 妈妈 / 大金</strong> 等专属角色教练</li>
            </ul>

            <h3 className="font-semibold mt-3 mb-1">🔥 AI 训练营（畅打卡）</h3>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>7天情绪压力释放营</li>
              <li>7天财富觉醒营</li>
              <li>21天关系修复营</li>
              <li>身份绽放营 / 情绪绽放营</li>
              <li>女性竞争力营、亲子沟通营 等</li>
            </ul>

            <h3 className="font-semibold mt-3 mb-1">🛡️ 每日守护</h3>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>早安能量卡 / 晚安陪伴语音</li>
              <li>情绪急救按钮（一键 AI 接住）</li>
              <li>每日打卡、感恩日记、财富日记</li>
              <li>频率疗愈音、个性化背景音</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-orange-700 mb-2">四、点数怎么用</h2>
            <p>不同功能按点数计费，1000 点足够大多数人一年使用：</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>AI 测评一次：约 5–10 点</li>
              <li>AI 文字对话：每条约 1 点</li>
              <li>AI 语音教练：每分钟约 2–3 点</li>
              <li>训练营每日打卡：约 3–5 点</li>
              <li>点数不够可随时充值叠加</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-orange-700 mb-2">五、对比尝鲜会员</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-orange-100 rounded">
                <thead className="bg-orange-100/60">
                  <tr>
                    <th className="text-left p-2">项目</th>
                    <th className="p-2">尝鲜会员</th>
                    <th className="p-2 text-orange-700">365会员（推荐）</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                  <tr><td className="p-2">价格</td><td className="text-center p-2">¥9.9</td><td className="text-center p-2 font-semibold">¥365</td></tr>
                  <tr><td className="p-2">点数</td><td className="text-center p-2">50 点</td><td className="text-center p-2 font-semibold">1000 点</td></tr>
                  <tr><td className="p-2">购买限制</td><td className="text-center p-2 text-amber-600">限购 1 次</td><td className="text-center p-2">不限，可叠加</td></tr>
                  <tr><td className="p-2">有效期</td><td className="text-center p-2">365 天</td><td className="text-center p-2">365 天</td></tr>
                  <tr><td className="p-2">语音教练</td><td className="text-center p-2">体验</td><td className="text-center p-2">畅用</td></tr>
                  <tr><td className="p-2">训练营</td><td className="text-center p-2">单营单买</td><td className="text-center p-2">全部畅打卡</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-orange-700 mb-2">六、适合谁</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>长期被情绪、压力、关系内耗困扰，需要"随时能聊"的 AI 教练</li>
              <li>想系统使用全部测评和训练营，而不是单次购买</li>
              <li>把每天的状态管理当作长期投资，希望一年内随时可用</li>
              <li>一个账号给全家用（自己 + 配偶 + 父母 + 孩子）</li>
            </ul>
          </section>

          <section className="bg-orange-50/60 rounded-lg p-4 border border-orange-100">
            <h2 className="text-base font-semibold text-orange-700 mb-2">七、常见问题</h2>
            <p><strong>Q：到期会清零吗？</strong>会员到期后未使用的点数失效，建议到期前续费叠加。</p>
            <p className="mt-2"><strong>Q：可以退款吗？</strong>开通后即时生效，不支持退款，建议先购买 ¥9.9 尝鲜会员体验。</p>
            <p className="mt-2"><strong>Q：和单项工具购买相比？</strong>365 会员相当于全年免费使用所有工具，单买 3 个测评 + 1 个训练营即超过 ¥365。</p>
            <p className="mt-2"><strong>Q：可以多人共用一个账号吗？</strong>支持家人共用，建议绑定同一微信账号方便管理。</p>
          </section>

          <div className="sticky bottom-0 pb-4 pt-2 bg-gradient-to-t from-background via-background to-transparent">
            <Button
              size="lg"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => navigate('/packages')}
            >
              返回开通 365 会员 →
            </Button>
          </div>
        </article>
      </div>
    </>
  );
}
