import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BloomPartnerTerms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-muted rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">绽放合伙人服务条款</h1>
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
            <p>1.1 <strong>"绽放合伙人"</strong>：指通过购买绽放合伙人套餐，获得绽放产品推广权益和二级分销权益的个人或实体。</p>
            <p>1.2 <strong>"绽放产品"</strong>：指平台提供的深度成长类产品，包括但不限于情绪训练营、身份训练营、人生训练营等。</p>
            <p>1.3 <strong>"直推佣金"</strong>：指您直接推荐用户购买绽放产品所获得的佣金。</p>
            <p>1.4 <strong>"二级佣金"</strong>：指您推荐的合伙人（下级合伙人）的直推销售所产生的佣金分成。</p>
            <p>1.5 <strong>"下级合伙人"</strong>：指通过您的推广码注册成为绽放合伙人的用户。</p>
            <p>1.6 <strong>"永久佣金"</strong>：指只要用户持续购买平台产品，您将持续获得佣金分成的机制。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">二、合伙人资格与准入</h2>
            <p>2.1 申请成为绽放合伙人，您需满足以下条件：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>年满18周岁，具有完全民事行为能力</li>
              <li>提供真实、准确、完整的个人身份信息</li>
              <li>无违反本平台相关规则的不良记录</li>
              <li>认同绽放产品的价值理念和成长哲学</li>
              <li>购买绽放合伙人套餐（¥19,800）</li>
            </ul>
            <p>2.2 平台有权对合伙人申请进行审核，并保留拒绝任何申请的权利。</p>
            <p>2.3 购买成功后，即视为您已阅读、理解并同意本服务条款的全部内容。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">三、绽放合伙人专属权益</h2>
            <p>3.1 <strong>产品权益</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>免费获得3门核心训练营（情绪/身份/人生）的终身学习权限</li>
              <li>优先体验新产品和新功能</li>
              <li>专属VIP客服通道</li>
            </ul>
            <p>3.2 <strong>佣金权益</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>直推佣金：推荐用户购买绽放产品，获得<strong>30%</strong>佣金</li>
              <li>二级佣金：下级合伙人的直推销售，获得<strong>10%</strong>佣金</li>
              <li>永久佣金：用户后续购买任何产品，持续获得分成</li>
            </ul>
            <p>3.3 <strong>团队管理权益</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>发展和管理下级合伙人</li>
              <li>查看团队业绩和佣金数据</li>
              <li>参与团队培训和交流活动</li>
            </ul>
            <p>3.4 <strong>品牌授权</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>使用"绽放合伙人"官方认证标识</li>
              <li>获得官方推广素材和话术支持</li>
            </ul>
            <p>3.5 <strong>有劲产品推广权益</strong></p>
            <p>成为绽放合伙人后，您将自动获得有劲初级合伙人身份，享有以下额外权益：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>有劲全系列产品（11款）推广资格</li>
              <li>有劲产品一级佣金：<strong>18%</strong></li>
              <li>有劲体验包分发权限</li>
            </ul>
            <p className="text-muted-foreground">注：有劲产品佣金独立于绽放产品佣金计算，两者可同时获得。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">四、二级分销规则</h2>
            <p>4.1 <strong>分销层级说明</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>一级分销：您直接推荐的用户购买产品</li>
              <li>二级分销：您的下级合伙人推荐的用户购买产品</li>
              <li>本平台仅支持二级分销，不存在三级及以上层级</li>
            </ul>
            <p>4.2 <strong>合规声明</strong></p>
            <p>本分销模式严格遵守《禁止传销条例》等法律法规，佣金来源于实际产品销售而非发展人员。平台定期审查分销合规性。</p>
            <p>4.3 <strong>禁止行为</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>以发展下级合伙人数量作为主要收入来源的宣传</li>
              <li>承诺高额回报或保证收益</li>
              <li>要求下级合伙人缴纳入门费外的其他费用</li>
              <li>任何形式的团队计酬模式</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">五、团队管理与下级合伙人</h2>
            <p>5.1 <strong>下级合伙人发展</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>通过您的专属推广码注册的用户，成为您的下级合伙人</li>
              <li>下级关系一经确定，不可更改</li>
              <li>您有责任向下级合伙人提供必要的指导和支持</li>
            </ul>
            <p>5.2 <strong>团队管理职责</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>确保下级合伙人了解并遵守本条款</li>
              <li>及时传达平台政策和活动信息</li>
              <li>协助处理下级合伙人的咨询和问题</li>
            </ul>
            <p>5.3 <strong>责任划分</strong></p>
            <p>下级合伙人的违规行为由其本人承担主要责任，但如您明知或应知其违规行为而未采取措施的，可能影响您的合伙人权益。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">六、佣金计算与结算</h2>
            <p>6.1 <strong>佣金比例</strong></p>
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left">佣金类型</th>
                  <th className="border border-border p-2 text-left">比例</th>
                  <th className="border border-border p-2 text-left">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-2">直推佣金</td>
                  <td className="border border-border p-2">30%</td>
                  <td className="border border-border p-2">您直接推荐的用户购买产品</td>
                </tr>
                <tr>
                  <td className="border border-border p-2">二级佣金</td>
                  <td className="border border-border p-2">10%</td>
                  <td className="border border-border p-2">下级合伙人的直推销售</td>
                </tr>
              </tbody>
            </table>
            <p>6.2 <strong>计算规则</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>佣金 = 用户实际付款金额 × 佣金比例</li>
              <li>退款订单不计入佣金</li>
              <li>优惠券、平台补贴部分不计入佣金基数</li>
            </ul>
            <p>6.3 <strong>结算规则</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>按月结算，每月1日-5日为上月佣金结算期</li>
              <li>最低提现金额100元</li>
              <li>审核通过后7个工作日内到账</li>
              <li>需完成实名认证并绑定收款账户</li>
            </ul>
            <p>6.4 <strong>税务责任</strong></p>
            <p>您应依法履行纳税义务。平台可能根据法律规定代扣代缴相关税费。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">七、永久佣金机制</h2>
            <p>7.1 <strong>机制说明</strong></p>
            <p>用户通过您的推广码成为平台用户后，其后续在平台的所有消费，您都将按比例获得佣金，该权益长期有效。</p>
            <p>7.2 <strong>适用范围</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>适用于所有绽放产品线的付费产品</li>
              <li>包括训练营、咨询服务、课程等</li>
            </ul>
            <p>7.3 <strong>终止情形</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>您的合伙人资格被终止</li>
              <li>用户主动解除与您的推荐关系（需用户发起申请）</li>
              <li>平台业务终止</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">八、合伙人义务</h2>
            <p>8.1 <strong>信息真实义务</strong></p>
            <p>确保注册信息、收款信息等真实、准确、完整，如有变更应及时更新。</p>
            <p>8.2 <strong>合规推广义务</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>推广内容应真实客观，不得夸大产品效果</li>
              <li>不得使用虚假宣传、诱导消费等不正当手段</li>
              <li>不得冒充官方人员或发布未经授权的信息</li>
              <li>不得以任何形式承诺投资回报或收益</li>
            </ul>
            <p>8.3 <strong>团队管理义务</strong></p>
            <p>对下级合伙人进行必要的培训和指导，确保其合规推广。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">九、推广行为规范</h2>
            <p>9.1 <strong>禁止行为</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>发布虚假、误导性信息或夸大产品功效</li>
              <li>使用"保证收益""稳赚不赔""躺赚"等违规用语</li>
              <li>以发展下线人数作为收益宣传点</li>
              <li>利用非法手段获取用户信息或骚扰用户</li>
              <li>诋毁竞争对手或其他合伙人</li>
              <li>发布违反法律法规或公序良俗的内容</li>
            </ul>
            <p>9.2 <strong>推荐话术规范</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>应重点介绍产品价值，而非收益回报</li>
              <li>如实告知产品内容、服务周期等信息</li>
              <li>不得制造焦虑或施加不当压力</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十、知识产权与品牌授权</h2>
            <p>10.1 "绽放"及相关商标、标识、设计等知识产权归平台所有。</p>
            <p>10.2 <strong>授权使用范围</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>可使用"绽放合伙人"认证标识进行推广</li>
              <li>可使用官方提供的推广素材</li>
              <li>可在个人社交媒体标注合伙人身份</li>
            </ul>
            <p>10.3 <strong>禁止行为</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>修改、篡改官方素材内容</li>
              <li>将素材用于与平台推广无关的用途</li>
              <li>擅自创作可能引起混淆的类似素材</li>
              <li>注册与平台相似的商标或域名</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十一、保密义务</h2>
            <p>11.1 您应对以下信息承担保密义务：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>佣金比例、结算数据等商业信息</li>
              <li>平台提供的内部资料、培训内容</li>
              <li>用户个人信息及消费数据</li>
              <li>团队成员信息及业绩数据</li>
            </ul>
            <p>11.2 未经平台书面同意，不得向任何第三方披露上述信息。</p>
            <p>11.3 保密义务在合伙人资格终止后仍然有效。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十二、培训与支持服务</h2>
            <p>12.1 <strong>培训服务</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>新合伙人入门培训</li>
              <li>产品知识培训</li>
              <li>推广技巧培训</li>
              <li>定期线上分享会</li>
            </ul>
            <p>12.2 <strong>支持服务</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>专属合伙人客服通道</li>
              <li>推广素材定期更新</li>
              <li>常见问题解答手册</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十三、资格维持与升降级</h2>
            <p>13.1 <strong>资格维持</strong></p>
            <p>绽放合伙人资格为终身制，无需续费。但以下情况可能影响您的权益：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>违规行为导致的处罚</li>
              <li>连续12个月无推广活动可能被列为"休眠合伙人"</li>
            </ul>
            <p>13.2 <strong>休眠状态</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>休眠期间不影响已有用户的永久佣金</li>
              <li>恢复推广活动后自动解除休眠状态</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十四、违规处理</h2>
            <p>14.1 <strong>违规等级与处理措施</strong></p>
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-2 text-left">等级</th>
                  <th className="border border-border p-2 text-left">行为</th>
                  <th className="border border-border p-2 text-left">处理</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border p-2">轻微</td>
                  <td className="border border-border p-2">素材使用不当等</td>
                  <td className="border border-border p-2">警告并要求整改</td>
                </tr>
                <tr>
                  <td className="border border-border p-2">一般</td>
                  <td className="border border-border p-2">夸大宣传等</td>
                  <td className="border border-border p-2">暂停权益1-3个月</td>
                </tr>
                <tr>
                  <td className="border border-border p-2">严重</td>
                  <td className="border border-border p-2">虚假宣传、欺诈等</td>
                  <td className="border border-border p-2">终止资格并扣除佣金</td>
                </tr>
              </tbody>
            </table>
            <p>14.2 如因违规给平台造成损失，您应承担赔偿责任。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十五、资格终止与退出</h2>
            <p>15.1 <strong>主动退出</strong></p>
            <p>您可申请退出合伙人计划。套餐费用不予退还，已产生的佣金按正常周期结算。</p>
            <p>15.2 <strong>被动终止</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>严重违规行为</li>
              <li>涉及违法犯罪</li>
              <li>损害平台重大利益</li>
            </ul>
            <p>15.3 <strong>终止后处理</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>产品学习权益保留</li>
              <li>推广权益和佣金权益终止</li>
              <li>下级合伙人关系解除，由平台接管</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十六、合伙人关系声明</h2>
            <p>16.1 您与平台之间为合作推广关系，不构成劳动关系、雇佣关系、代理关系或合伙企业关系。</p>
            <p>16.2 您作为独立主体开展推广活动，应自行承担经营成本和风险。</p>
            <p>16.3 您不得以平台名义对外签订合同或做出任何承诺。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十七、免责声明</h2>
            <p>17.1 平台不对以下情况承担责任：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>因不可抗力导致的服务中断</li>
              <li>因您的违规行为导致的任何损失</li>
              <li>因第三方原因导致的结算延迟</li>
              <li>因您个人原因导致的推广效果不佳</li>
              <li>下级合伙人的违规行为</li>
            </ul>
            <p>17.2 平台不保证您能获得任何特定收益，您应自行评估风险。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十八、法律适用与争议解决</h2>
            <p>18.1 本条款适用中华人民共和国法律。</p>
            <p>18.2 因本条款产生的争议，双方应首先友好协商解决。</p>
            <p>18.3 协商不成的，任何一方可向平台所在地有管辖权的人民法院提起诉讼。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">十九、联系方式</h2>
            <p>如您对本条款有任何疑问，请通过以下方式联系我们：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>客服邮箱：bloom@youjin.ai</li>
              <li>客服微信：bloom-partner</li>
              <li>工作时间：周一至周五 9:00-18:00</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
