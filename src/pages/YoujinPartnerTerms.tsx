import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function YoujinPartnerTerms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">有劲合伙人服务条款</h1>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="prose prose-sm max-w-none">
          <p className="text-muted-foreground text-sm mb-6">
            更新日期：2025年1月7日 | 生效日期：2025年1月7日
          </p>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">一、定义与解释</h2>
            <p>1.1 <strong>"有劲合伙人"</strong>：指通过购买体验包套餐，获得体验包分发权益，并按规则获取佣金的个人或实体。</p>
            <p>1.2 <strong>"体验包"</strong>：指用户可免费体验有劲AI核心功能的权益包，由合伙人购买后分发给潜在用户。</p>
            <p>1.3 <strong>"佣金"</strong>：指合伙人通过其分发的体验包用户后续付费消费，按约定比例获得的收益。</p>
            <p>1.4 <strong>"结算"</strong>：指平台按规定周期将合伙人应得佣金支付至其指定账户的过程。</p>
            <p>1.5 <strong>"推广码"</strong>：指用于追踪合伙人推广效果的唯一标识符，包括兑换码和推广二维码。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">二、合伙人资格与准入</h2>
            <p>2.1 申请成为有劲合伙人，您需满足以下条件：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>年满18周岁，具有完全民事行为能力</li>
              <li>提供真实、准确、完整的个人身份信息</li>
              <li>无违反本平台相关规则的不良记录</li>
              <li>认同有劲AI的产品理念和服务价值</li>
            </ul>
            <p>2.2 平台有权对合伙人申请进行审核，并保留拒绝任何申请的权利，无需说明理由。</p>
            <p>2.3 您购买的合伙人套餐一经支付成功，即视为您已阅读、理解并同意本服务条款的全部内容。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">三、合伙人权益</h2>
            <p>3.1 <strong>体验包分发权益</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>根据购买的套餐等级，获得相应数量的体验包</li>
              <li>可自主分发体验包给潜在用户</li>
              <li>可通过推广码追踪用户激活和使用情况</li>
            </ul>
            <p>3.2 <strong>佣金收益权益</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>用户通过您的体验包成为正式用户后，其后续付费消费您可获得佣金分成</li>
              <li>佣金比例根据您的合伙人等级确定（L1: 20%, L2: 35%, L3: 50%）</li>
              <li>佣金为永久制，只要用户持续付费，您将持续获得分成</li>
            </ul>
            <p>3.3 <strong>其他权益</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>免费使用有劲AI的相关产品和服务</li>
              <li>获得官方推广素材和培训支持</li>
              <li>参与合伙人专属活动</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">四、体验包分发规则</h2>
            <p>4.1 体验包的分发方式包括但不限于：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>生成专属兑换码，用户输入兑换码激活</li>
              <li>生成推广二维码，用户扫码直接激活</li>
              <li>通过固定推广链接分享</li>
            </ul>
            <p>4.2 每个体验包仅可被一名用户激活使用，激活后不可转让或退回。</p>
            <p>4.3 体验包自购买之日起12个月内有效，过期未分发的体验包将自动失效，不予退款或补偿。</p>
            <p>4.4 禁止以下分发行为：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>将体验包低价转卖或变相出售</li>
              <li>通过虚假账号自行激活体验包套取佣金</li>
              <li>使用任何技术手段批量注册或刷量</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">五、佣金计算与结算</h2>
            <p>5.1 <strong>佣金计算规则</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>佣金 = 用户实际付款金额 × 佣金比例</li>
              <li>用户退款或发生争议的订单不计入佣金</li>
              <li>优惠券、红包等平台补贴部分不计入佣金基数</li>
            </ul>
            <p>5.2 <strong>结算周期</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>佣金按月结算，每月1日-5日为上月佣金结算期</li>
              <li>佣金需满100元方可申请提现</li>
              <li>提现申请审核通过后，7个工作日内到账</li>
            </ul>
            <p>5.3 <strong>提现方式</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>支持微信零钱、银行卡转账</li>
              <li>需完成实名认证并绑定收款账户</li>
            </ul>
            <p>5.4 <strong>税务责任</strong></p>
            <p>您应依法履行纳税义务。平台可能会根据法律法规要求代扣代缴相关税费，具体以实际结算为准。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">六、合伙人义务</h2>
            <p>6.1 <strong>信息真实义务</strong></p>
            <p>您应确保注册信息、收款信息等真实、准确、完整，如有变更应及时更新。</p>
            <p>6.2 <strong>合规推广义务</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>推广内容应真实客观，不得夸大产品效果</li>
              <li>不得使用虚假宣传、诱导消费等不正当手段</li>
              <li>不得冒充官方人员或发布未经授权的信息</li>
            </ul>
            <p>6.3 <strong>用户服务义务</strong></p>
            <p>您应积极响应通过您激活的用户的合理咨询，提供必要的使用指导。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">七、推广行为规范</h2>
            <p>7.1 <strong>禁止行为</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>发布虚假、误导性信息或夸大产品功效</li>
              <li>使用"保证收益""稳赚不赔"等违规宣传用语</li>
              <li>利用非法手段获取用户信息或骚扰用户</li>
              <li>诋毁竞争对手或其他合伙人</li>
              <li>发布违反法律法规或公序良俗的内容</li>
              <li>以任何方式损害平台声誉或利益</li>
            </ul>
            <p>7.2 <strong>内容规范</strong></p>
            <p>推广内容需遵守《广告法》《消费者权益保护法》等相关法律法规，不得含有法律禁止的内容。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">八、知识产权与品牌使用</h2>
            <p>8.1 "有劲AI"及相关商标、标识、设计等知识产权归平台所有。</p>
            <p>8.2 合伙人可在推广活动中合理使用平台提供的官方素材，但不得：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>修改、篡改官方素材内容</li>
              <li>将素材用于与平台推广无关的用途</li>
              <li>擅自创作可能引起混淆的类似素材</li>
            </ul>
            <p>8.3 合伙人资格终止后，应立即停止使用平台相关知识产权。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">九、保密义务</h2>
            <p>9.1 您应对以下信息承担保密义务：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>合伙人佣金比例、结算数据等商业信息</li>
              <li>平台提供的内部资料、培训内容</li>
              <li>用户个人信息及消费数据</li>
            </ul>
            <p>9.2 未经平台书面同意，不得向任何第三方披露上述信息。</p>
            <p>9.3 保密义务在合伙人资格终止后仍然有效。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十、合伙人关系声明</h2>
            <p>10.1 您与平台之间为合作推广关系，不构成劳动关系、雇佣关系、代理关系或合伙企业关系。</p>
            <p>10.2 您作为独立主体开展推广活动，应自行承担经营成本和风险。</p>
            <p>10.3 您不得以平台名义对外签订合同或做出任何承诺。</p>
            <p>10.4 您应自行处理与您推广活动相关的税务、社保等事宜。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十一、违规处理</h2>
            <p>11.1 如您违反本条款约定，平台有权采取以下措施：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>警告并要求限期整改</li>
              <li>暂停或限制部分合伙人权益</li>
              <li>扣除违规所得佣金</li>
              <li>终止合伙人资格</li>
              <li>追究法律责任</li>
            </ul>
            <p>11.2 如因您的违规行为给平台造成损失，您应承担赔偿责任。</p>
            <p>11.3 平台对违规行为的认定和处理决定为最终决定。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十二、资格终止与退出</h2>
            <p>12.1 <strong>主动退出</strong></p>
            <p>您可随时申请退出合伙人计划，退出后将无法继续享受合伙人权益，已分发的体验包权益不受影响。</p>
            <p>12.2 <strong>被动终止</strong></p>
            <p>平台有权在以下情况下终止您的合伙人资格：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>严重违反本条款约定</li>
              <li>连续6个月无推广活动</li>
              <li>平台业务调整或终止</li>
            </ul>
            <p>12.3 <strong>退出后处理</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>未分发的体验包不予退款</li>
              <li>已产生的佣金按正常周期结算</li>
              <li>退出后不再产生新的佣金收益</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十三、免责声明</h2>
            <p>13.1 平台不对以下情况承担责任：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>因不可抗力导致的服务中断或数据丢失</li>
              <li>因您的违规行为导致的任何损失</li>
              <li>因第三方原因导致的结算延迟</li>
              <li>因您个人原因导致的推广效果不佳</li>
            </ul>
            <p>13.2 平台不保证您通过合伙人计划能够获得任何特定收益。</p>
            <p>13.3 您应自行评估成为合伙人的风险，平台不对您的投入做任何收益承诺。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十四、条款修改</h2>
            <p>14.1 平台有权根据业务发展需要修改本条款。</p>
            <p>14.2 条款修改后，平台将通过应用内通知、短信等方式告知您。</p>
            <p>14.3 如您继续使用合伙人服务，即视为接受修改后的条款。</p>
            <p>14.4 如您不同意修改后的条款，可申请退出合伙人计划。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十五、法律适用与争议解决</h2>
            <p>15.1 本条款的订立、效力、解释、履行及争议解决均适用中华人民共和国法律。</p>
            <p>15.2 因本条款产生的任何争议，双方应首先友好协商解决。</p>
            <p>15.3 协商不成的，任何一方可向平台所在地有管辖权的人民法院提起诉讼。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十六、联系方式</h2>
            <p>如您对本条款有任何疑问，请通过以下方式联系我们：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>客服邮箱：partner@youjin.ai</li>
              <li>客服微信：youjin-partner</li>
              <li>工作时间：周一至周五 9:00-18:00</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
