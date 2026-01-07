import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">服务条款</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-sm">最后更新日期：2025年1月1日</p>
          <p className="text-muted-foreground text-sm">生效日期：2025年1月1日</p>

          <h2 className="text-lg font-semibold mt-6">一、定义与解释</h2>
          <p>在本服务条款中，除非上下文另有要求，以下术语具有如下含义：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>"本服务"</strong>：指"情绪梳理教练"应用程序及其提供的所有功能和服务</li>
            <li><strong>"用户"或"您"</strong>：指注册、登录或使用本服务的个人</li>
            <li><strong>"我们"或"平台"</strong>：指本服务的运营方</li>
            <li><strong>"内容"</strong>：指通过本服务发布、上传、传输或存储的任何文字、图片、音频、视频等信息</li>
            <li><strong>"账户"</strong>：指用户在本服务中注册的个人账户</li>
            <li><strong>"AI教练"</strong>：指本服务中基于人工智能技术提供的情绪辅导功能</li>
            <li><strong>"训练营"</strong>：指本服务提供的系统性情绪管理学习课程</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">二、服务说明</h2>
          <p>
            欢迎使用"情绪梳理教练"服务。本服务是一款基于人工智能技术的情绪辅导工具，旨在帮助用户进行情绪梳理、自我觉察和心理健康管理。
          </p>
          <p>本服务主要提供以下功能：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI情绪对话：与AI教练进行一对一的情绪梳理对话</li>
            <li>情绪记录：记录和追踪您的情绪变化</li>
            <li>训练营课程：系统性的情绪管理学习课程</li>
            <li>社区互动：与其他用户分享成长经历</li>
            <li>呼吸练习：引导式呼吸放松训练</li>
            <li>专业咨询预约：预约真人心理咨询师服务</li>
          </ul>
          <p className="text-amber-600 dark:text-amber-400 font-medium mt-4">
            重要声明：本服务仅提供情绪辅导和自我成长支持，不构成专业的心理咨询、心理治疗或医疗服务。如您正在经历严重的心理健康问题，请及时寻求专业医疗机构的帮助。
          </p>

          <h2 className="text-lg font-semibold mt-6">三、用户资格</h2>
          <p>使用本服务，您需要满足以下条件：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>年满18周岁，具有完全民事行为能力</li>
            <li>如您未满18周岁，应在监护人的陪同和指导下使用本服务，且监护人应阅读并同意本条款</li>
            <li>同意并遵守本服务条款的所有规定</li>
            <li>提供真实、准确、完整的注册信息</li>
            <li>不存在被本服务永久封禁的记录</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">四、用户注册与账户管理</h2>
          <h3 className="text-base font-medium mt-4">4.1 账户注册</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>您可以通过手机号码、电子邮箱或第三方账号注册本服务账户</li>
            <li>您应当提供真实、准确、完整的注册信息，并及时更新</li>
            <li>每位用户仅可注册一个账户，不得注册多个账户或冒用他人信息注册</li>
          </ul>
          <h3 className="text-base font-medium mt-4">4.2 账户安全</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>您有责任妥善保管您的账户信息，包括但不限于用户名、密码等</li>
            <li>您应当设置高强度密码，并定期更换</li>
            <li>因您个人原因导致的账户信息泄露，由您自行承担责任</li>
            <li>如发现账户被盗用或存在安全风险，请立即联系我们</li>
          </ul>
          <h3 className="text-base font-medium mt-4">4.3 账户注销</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>您可以随时申请注销账户，我们将在核实身份后处理您的注销请求</li>
            <li>账户注销后，您的个人数据将按照隐私政策进行处理</li>
            <li>账户注销后，您将无法恢复账户内的数据和权益</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">五、用户行为规范</h2>
          <p>在使用本服务时，您同意不会：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>发布任何违法、有害、威胁性、辱骂性、骚扰性、诽谤性、淫秽或其他令人反感的内容</li>
            <li>侵犯他人的知识产权、隐私权或其他合法权益</li>
            <li>试图未经授权访问本服务的系统或网络</li>
            <li>以任何方式干扰或破坏本服务的正常运行</li>
            <li>将本服务用于任何商业目的，除非获得我们的书面授权</li>
            <li>利用本服务传播虚假信息或进行欺诈行为</li>
            <li>进行任何可能损害其他用户利益的行为</li>
            <li>使用任何自动化工具或程序访问本服务</li>
            <li>规避、禁用或以其他方式干扰本服务的安全功能</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">六、用户生成内容</h2>
          <h3 className="text-base font-medium mt-4">6.1 内容责任</h3>
          <p>您对自己在本服务中发布的所有内容承担完全责任，包括但不限于：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>情绪记录和对话内容</li>
            <li>社区分享的帖子和评论</li>
            <li>上传的图片和其他媒体文件</li>
          </ul>
          <h3 className="text-base font-medium mt-4">6.2 内容授权</h3>
          <p>
            您在本服务中发布内容时，即授予我们非独占、免版税、可转授权的许可，允许我们为提供和改进服务的目的使用、复制、修改、分发该等内容。此授权仅用于：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>向您和其他用户展示内容</li>
            <li>改进AI模型和服务质量</li>
            <li>进行数据分析和研究（数据将进行脱敏处理）</li>
          </ul>
          <h3 className="text-base font-medium mt-4">6.3 禁止内容</h3>
          <p>您不得发布以下类型的内容：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>违反法律法规的内容</li>
            <li>侵犯他人权益的内容</li>
            <li>虚假或误导性信息</li>
            <li>暴力、血腥或令人不适的内容</li>
            <li>商业广告或垃圾信息</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">七、AI服务特别条款</h2>
          <h3 className="text-base font-medium mt-4">7.1 AI服务性质</h3>
          <p>您理解并同意：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI教练的回复由人工智能算法生成，不代表专业心理咨询意见</li>
            <li>AI生成的内容可能存在不准确或不完整的情况</li>
            <li>AI教练不具备诊断或治疗任何心理疾病的能力</li>
          </ul>
          <h3 className="text-base font-medium mt-4">7.2 使用限制</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI服务不能替代专业的心理咨询或医疗服务</li>
            <li>如遇紧急情况或危机状况，请立即联系专业急救服务或心理危机干预热线</li>
            <li>我们对AI生成内容的准确性、完整性不作任何保证</li>
          </ul>
          <h3 className="text-base font-medium mt-4">7.3 数据使用</h3>
          <p>
            为了持续改进AI服务质量，您与AI教练的对话内容可能被用于模型训练。我们将对此类数据进行严格的脱敏和匿名化处理，确保无法识别到个人。
          </p>

          <h2 className="text-lg font-semibold mt-6">八、付费服务条款</h2>
          <h3 className="text-base font-medium mt-4">8.1 服务订阅</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>部分功能需要付费订阅或单次购买</li>
            <li>订阅服务将按照选择的周期自动续费，除非您在续费日期前取消</li>
            <li>付费内容的具体权益以购买时的说明为准</li>
          </ul>
          <h3 className="text-base font-medium mt-4">8.2 付款与退款</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>我们支持多种支付方式，具体以应用内显示为准</li>
            <li>订阅类服务在订阅期内不支持退款</li>
            <li>单次购买的虚拟商品一经购买不支持退款</li>
            <li>因服务质量问题导致的退款请求，请联系客服处理</li>
          </ul>
          <h3 className="text-base font-medium mt-4">8.3 价格变更</h3>
          <p>
            我们保留调整服务价格的权利。价格变更将提前通知，不影响已购买服务的权益。
          </p>

          <h2 className="text-lg font-semibold mt-6">九、知识产权</h2>
          <p>
            本服务中的所有内容，包括但不限于文字、图片、音频、视频、软件、程序代码、用户界面设计、商标标识等，均受知识产权法律保护。未经我们书面许可，您不得：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>复制、修改、传播或以其他方式使用这些内容</li>
            <li>对本服务进行反向工程、反编译或反汇编</li>
            <li>删除或修改本服务中的任何版权声明或商标标识</li>
            <li>使用任何数据挖掘、爬虫或类似工具收集本服务的内容</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">十、第三方服务与链接</h2>
          <p>
            本服务可能包含第三方服务的链接或集成。我们对第三方服务的内容、隐私政策或做法不承担任何责任。您使用第三方服务时，应当遵守该等服务的相关条款。
          </p>

          <h2 className="text-lg font-semibold mt-6">十一、免责声明</h2>
          <h3 className="text-base font-medium mt-4">11.1 服务提供</h3>
          <p>
            本服务按"现状"提供，我们不对服务的持续性、及时性、安全性、准确性作出任何明示或暗示的保证。
          </p>
          <h3 className="text-base font-medium mt-4">11.2 AI建议</h3>
          <p>
            本服务基于人工智能技术提供情绪辅导建议，这些建议仅供参考，不能替代专业的心理咨询或医疗服务。我们不对您因依赖本服务提供的建议而产生的任何后果承担责任。
          </p>
          <h3 className="text-base font-medium mt-4">11.3 服务中断</h3>
          <p>
            我们将尽力确保本服务的持续性和稳定性，但不保证服务不会中断或出现错误。因不可抗力、系统维护等原因导致的服务中断，我们不承担责任。
          </p>

          <h2 className="text-lg font-semibold mt-6">十二、赔偿与责任限制</h2>
          <h3 className="text-base font-medium mt-4">12.1 用户赔偿</h3>
          <p>
            如因您违反本条款或适用法律法规，导致我们或第三方遭受损失的，您同意赔偿由此产生的全部费用，包括但不限于律师费、诉讼费等。
          </p>
          <h3 className="text-base font-medium mt-4">12.2 责任上限</h3>
          <p>
            在法律允许的最大范围内，我们对您使用本服务所产生的任何直接、间接、附带、特殊或后果性损害不承担责任，包括但不限于利润损失、数据丢失、商誉损失等。
          </p>
          <p>
            如我们需要承担责任，责任上限为您在过去12个月内向我们支付的服务费用总额。
          </p>

          <h2 className="text-lg font-semibold mt-6">十三、违规处理</h2>
          <h3 className="text-base font-medium mt-4">13.1 违规认定</h3>
          <p>
            如我们发现或收到举报，认为您存在违反本条款的行为，我们有权独立判断并采取相应措施。
          </p>
          <h3 className="text-base font-medium mt-4">13.2 处理措施</h3>
          <p>根据违规严重程度，我们可能采取以下一种或多种措施：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>发出警告通知</li>
            <li>删除违规内容</li>
            <li>暂时限制账户功能</li>
            <li>暂停账户使用</li>
            <li>永久封禁账户</li>
            <li>向有关部门报告</li>
          </ul>
          <h3 className="text-base font-medium mt-4">13.3 申诉渠道</h3>
          <p>
            如您对违规处理决定有异议，可以通过客服邮箱进行申诉。我们将在收到申诉后的7个工作日内进行复核并回复。
          </p>

          <h2 className="text-lg font-semibold mt-6">十四、服务变更与终止</h2>
          <p>
            我们保留随时修改、暂停或终止本服务的权利，且无需事先通知。对于服务的变更或终止，我们不对您或任何第三方承担责任。如服务终止，我们将提供合理的时间让您导出个人数据。
          </p>

          <h2 className="text-lg font-semibold mt-6">十五、条款修改</h2>
          <p>
            我们保留随时修改本服务条款的权利。修改后的条款将在本页面发布，重大变更将通过应用内通知或其他方式告知您。继续使用本服务即表示您接受修改后的条款。如您不同意修改后的条款，应当停止使用本服务。
          </p>

          <h2 className="text-lg font-semibold mt-6">十六、法律适用与争议解决</h2>
          <p>
            本服务条款的解释和适用以中华人民共和国法律为准（不包括其冲突法规则）。因本服务条款引起的或与本服务条款有关的任何争议，双方应首先协商解决；协商不成的，任何一方均可向我们主要经营地有管辖权的人民法院提起诉讼。
          </p>

          <h2 className="text-lg font-semibold mt-6">十七、可分割性</h2>
          <p>
            如本条款的任何条款被认定为无效或不可执行，该条款的其余部分以及本条款的其他条款仍将完全有效。
          </p>

          <h2 className="text-lg font-semibold mt-6">十八、联系方式</h2>
          <p>如您对本服务条款有任何疑问或建议，请通过以下方式与我们联系：</p>
          <ul className="list-none space-y-1 text-muted-foreground">
            <li>客服邮箱：support@emotioncoach.cn</li>
            <li>工作时间：周一至周五 9:00-18:00</li>
          </ul>

          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              感谢您阅读本服务条款。使用本服务即表示您已阅读、理解并同意受本条款的约束。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
