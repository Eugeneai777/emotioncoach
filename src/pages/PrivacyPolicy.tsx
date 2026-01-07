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

          <h2 className="text-lg font-semibold mt-6">五、数据保留</h2>
          <p>
            我们会在提供服务所需的期限内保留您的信息。当您删除账户时，我们会在合理时间内删除您的个人信息，除非法律要求我们保留更长时间。
          </p>

          <h2 className="text-lg font-semibold mt-6">六、您的权利</h2>
          <p>
            根据适用法律，您可能享有以下权利：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>访问权：</strong>您有权了解我们收集了您的哪些个人信息</li>
            <li><strong>更正权：</strong>您有权更正不准确的个人信息</li>
            <li><strong>删除权：</strong>您有权要求删除您的个人信息</li>
            <li><strong>导出权：</strong>您有权获取您的数据副本</li>
            <li><strong>撤回同意：</strong>您有权随时撤回之前给予的同意</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">七、Cookie使用</h2>
          <p>
            我们使用Cookie和类似技术来改善您的使用体验、分析服务使用情况。您可以通过浏览器设置管理Cookie偏好。
          </p>

          <h2 className="text-lg font-semibold mt-6">八、未成年人保护</h2>
          <p>
            我们非常重视未成年人的隐私保护。如果您是未成年人，请在监护人的陪同下阅读本隐私政策，并在监护人的同意下使用本服务。
          </p>

          <h2 className="text-lg font-semibold mt-6">九、政策更新</h2>
          <p>
            我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，重大变更时我们会通过应用内通知的方式告知您。
          </p>

          <h2 className="text-lg font-semibold mt-6">十、联系我们</h2>
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
