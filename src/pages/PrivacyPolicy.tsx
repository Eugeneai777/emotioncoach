import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
          <h1 className="text-lg font-semibold">隐私政策</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-sm">最后更新日期：2025年1月1日</p>

          <h2 className="text-lg font-semibold mt-6">一、信息收集</h2>
          <p>
            为了向您提供更好的服务，我们可能会收集以下类型的信息：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>账户信息：</strong>您在注册时提供的邮箱地址、用户名等</li>
            <li><strong>对话内容：</strong>您与AI教练的对话记录，用于提供个性化的情绪辅导服务</li>
            <li><strong>情绪数据：</strong>您记录的情绪状态、情绪标签等，用于生成情绪报告和洞察</li>
            <li><strong>使用数据：</strong>您使用本服务的时间、频率、功能使用情况等</li>
            <li><strong>设备信息：</strong>设备型号、操作系统版本、浏览器类型等</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">二、信息使用</h2>
          <p>
            我们收集的信息将用于以下目的：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>提供、维护和改进本服务</li>
            <li>为您提供个性化的情绪辅导建议</li>
            <li>生成情绪分析报告和成长洞察</li>
            <li>发送服务相关的通知和提醒</li>
            <li>分析服务使用情况，改进用户体验</li>
            <li>保障服务安全，防止欺诈行为</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">三、信息保护</h2>
          <p>
            我们高度重视您的信息安全，采取以下措施保护您的个人信息：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>使用行业标准的加密技术保护数据传输和存储</li>
            <li>实施严格的访问控制，仅授权人员可访问用户数据</li>
            <li>定期进行安全审计和漏洞扫描</li>
            <li>对员工进行隐私保护培训</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">四、信息共享</h2>
          <p>
            我们不会出售、出租或以其他方式向第三方披露您的个人信息，除非：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>获得您的明确同意</li>
            <li>法律法规要求或政府机关依法要求</li>
            <li>为保护我们的合法权益（如防止欺诈）</li>
            <li>与我们的服务提供商共享（他们仅能使用信息为我们提供服务）</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">五、第三方AI服务数据传输</h2>
          <p>
            为向您提供AI情绪辅导功能，我们需要将您的部分数据传输至第三方人工智能服务提供商进行处理。您理解并同意：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>传输范围：</strong>您与AI教练的对话文本、语音转录内容将传输至第三方AI模型进行处理，以生成回复</li>
            <li><strong>数据处理方式：</strong>第三方AI服务提供商将按照其数据处理协议处理您的数据，我们已与其签署数据处理协议（DPA），要求其不得将您的数据用于与提供服务无关的目的</li>
            <li><strong>安全措施：</strong>数据传输过程中采用TLS加密协议，确保传输安全</li>
            <li><strong>免责声明：</strong>尽管我们已采取商业上合理的措施保护您的数据安全，但对于第三方AI服务提供商在其系统内对数据的处理行为，我们不承担直接责任。如您不同意数据传输至第三方AI服务，请停止使用AI对话功能</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">六、数据跨境传输</h2>
          <p>
            为向您提供AI服务，您的部分数据可能需要跨境传输至境外服务器进行处理。我们将依据《中华人民共和国个人信息保护法》及相关法规的要求：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>仅在提供服务所必需的范围内进行跨境传输</li>
            <li>与境外数据接收方签订数据处理协议，约定数据保护义务</li>
            <li>采取必要的技术和管理措施，确保数据处理活动达到本法规定的保护标准</li>
            <li>对传输的数据进行脱敏处理，减少可识别个人信息的暴露</li>
            <li>如相关法规要求进行个人信息保护影响评估或安全评估，我们将依法完成</li>
          </ul>
          <p className="text-amber-600 dark:text-amber-400 font-medium">
            如您不同意数据跨境传输，您可以选择停止使用涉及AI功能的服务。停止使用不影响您使用本服务的其他功能。
          </p>

          <h2 className="text-lg font-semibold mt-6">七、数据保留</h2>
          <p>
            我们会在提供服务所需的期限内保留您的信息。当您删除账户时，我们会在合理时间内删除您的个人信息，除非法律要求我们保留更长时间。
          </p>

          <h2 className="text-lg font-semibold mt-6">八、数据安全事件通知</h2>
          <p>
            如发生个人信息泄露、篡改、丢失等安全事件，我们将：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>立即响应：</strong>启动应急预案，采取补救措施以降低影响</li>
            <li><strong>及时通知：</strong>在确认安全事件发生后72小时内，通过应用内通知、短信或邮件等方式告知受影响的用户</li>
            <li><strong>通知内容：</strong>包括安全事件的基本情况、可能造成的影响、我们已采取的处置措施、用户可自主采取的防护和降低风险的建议，以及相关责任人的联系方式</li>
            <li><strong>监管报告：</strong>依法向有关主管部门报告安全事件情况</li>
            <li><strong>免责情形：</strong>如安全事件系因不可抗力、第三方恶意攻击且我们已采取合理安全措施的情况下发生，我们将依法减轻或免除相应责任</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">九、AI模型训练与数据使用</h2>
          <p>
            为持续改进AI服务质量，我们可能使用经脱敏处理的对话数据用于模型优化。关于此项数据使用：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>脱敏处理：</strong>所有用于模型训练的数据将经过严格的脱敏和匿名化处理，确保无法识别到具体个人</li>
            <li><strong>退出机制：</strong>您有权选择退出数据用于AI训练的用途。退出后，您的新对话数据将不再被用于模型优化，但不影响您正常使用服务</li>
            <li><strong>如何退出：</strong>请通过设置页面中的「隐私设置」关闭"允许数据用于服务改进"选项，或发送邮件至 privacy@emotioncoach.cn 提出退出申请</li>
            <li><strong>已处理数据：</strong>对于已完成脱敏处理并纳入训练集的历史数据，由于已无法关联至个人，将不受退出请求的影响</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">十、您的权利</h2>
          <p>
            根据适用法律，您可能享有以下权利：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>访问权：</strong>您有权了解我们收集了您的哪些个人信息</li>
            <li><strong>更正权：</strong>您有权更正不准确的个人信息</li>
            <li><strong>删除权：</strong>您有权要求删除您的个人信息</li>
            <li><strong>导出权：</strong>您有权获取您的数据副本</li>
            <li><strong>撤回同意：</strong>您有权随时撤回之前给予的同意</li>
            <li><strong>限制处理：</strong>您有权要求限制对您个人信息的处理</li>
            <li><strong>投诉权：</strong>如您认为我们的数据处理活动侵犯了您的合法权益，您有权向有关监管部门投诉</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">十一、Cookie使用</h2>
          <p>
            我们使用Cookie和类似技术来改善您的使用体验、分析服务使用情况。您可以通过浏览器设置管理Cookie偏好。
          </p>

          <h2 className="text-lg font-semibold mt-6">十二、未成年人保护</h2>
          <p>
            我们非常重视未成年人的隐私保护，并依据《中华人民共和国未成年人保护法》及《儿童个人信息网络保护规定》制定以下特别条款：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>监护人同意：</strong>不满14周岁的未成年人使用本服务，须事先取得其监护人的明示同意。14周岁以上不满18周岁的未成年人，建议在监护人指导下使用</li>
            <li><strong>青少年模式：</strong>本服务提供专门的青少年模式，该模式下：
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>对话内容经过额外的安全过滤</li>
                <li>不收集超出服务必要范围的个人信息</li>
                <li>对话数据默认不用于AI模型训练</li>
                <li>监护人可通过家长端查看使用概况，但无法查看具体对话内容，以保护未成年人隐私</li>
              </ul>
            </li>
            <li><strong>最小必要原则：</strong>对未成年用户，我们仅收集提供服务所必需的最少信息</li>
            <li><strong>信息删除：</strong>监护人有权随时要求我们删除其未成年子女的个人信息，我们将在15个工作日内处理</li>
            <li><strong>特别保护：</strong>我们不会向未成年用户推送商业营销信息，不会利用未成年人信息进行商业推广</li>
            <li><strong>投诉渠道：</strong>如监护人认为我们不当收集或使用了未成年人信息，请联系 privacy@emotioncoach.cn，我们将优先处理</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">十三、政策更新</h2>
          <p>
            我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，重大变更时我们会通过应用内通知的方式告知您。
          </p>

          <h2 className="text-lg font-semibold mt-6">十四、联系我们</h2>
          <p>
            如您对本隐私政策有任何疑问或建议，或希望行使您的数据权利，请通过以下方式联系我们：
          </p>
          <p className="text-muted-foreground">
            隐私专员邮箱：privacy@emotioncoach.cn
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;