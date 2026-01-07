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

          <h2 className="text-lg font-semibold mt-6">一、服务说明</h2>
          <p>
            欢迎使用"情绪梳理教练"服务（以下简称"本服务"）。本服务是一款基于人工智能技术的情绪辅导工具，旨在帮助用户进行情绪梳理、自我觉察和心理健康管理。
          </p>
          <p>
            本服务仅提供情绪辅导和自我成长支持，不构成专业的心理咨询、心理治疗或医疗服务。如您正在经历严重的心理健康问题，请及时寻求专业医疗机构的帮助。
          </p>

          <h2 className="text-lg font-semibold mt-6">二、用户资格</h2>
          <p>
            使用本服务，您需要满足以下条件：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>年满18周岁，具有完全民事行为能力</li>
            <li>如您未满18周岁，应在监护人的陪同和指导下使用本服务</li>
            <li>同意并遵守本服务条款的所有规定</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">三、账户安全</h2>
          <p>
            您有责任妥善保管您的账户信息，包括但不限于用户名、密码等。因您个人原因导致的账户信息泄露，由您自行承担责任。
          </p>

          <h2 className="text-lg font-semibold mt-6">四、用户行为规范</h2>
          <p>
            在使用本服务时，您同意不会：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>发布任何违法、有害、威胁性、辱骂性、骚扰性、诽谤性、淫秽或其他令人反感的内容</li>
            <li>侵犯他人的知识产权、隐私权或其他合法权益</li>
            <li>试图未经授权访问本服务的系统或网络</li>
            <li>以任何方式干扰或破坏本服务的正常运行</li>
            <li>将本服务用于任何商业目的，除非获得我们的书面授权</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6">五、知识产权</h2>
          <p>
            本服务中的所有内容，包括但不限于文字、图片、音频、视频、软件、程序代码等，均受知识产权法律保护。未经我们书面许可，您不得复制、修改、传播或以其他方式使用这些内容。
          </p>

          <h2 className="text-lg font-semibold mt-6">六、免责声明</h2>
          <p>
            本服务基于人工智能技术提供情绪辅导建议，这些建议仅供参考，不能替代专业的心理咨询或医疗服务。我们不对您因依赖本服务提供的建议而产生的任何后果承担责任。
          </p>
          <p>
            我们将尽力确保本服务的持续性和稳定性，但不保证服务不会中断或出现错误。因不可抗力、系统维护等原因导致的服务中断，我们不承担责任。
          </p>

          <h2 className="text-lg font-semibold mt-6">七、服务变更与终止</h2>
          <p>
            我们保留随时修改、暂停或终止本服务的权利，且无需事先通知。对于服务的变更或终止，我们不对您或任何第三方承担责任。
          </p>

          <h2 className="text-lg font-semibold mt-6">八、条款修改</h2>
          <p>
            我们保留随时修改本服务条款的权利。修改后的条款将在本页面发布，继续使用本服务即表示您接受修改后的条款。
          </p>

          <h2 className="text-lg font-semibold mt-6">九、法律适用与争议解决</h2>
          <p>
            本服务条款的解释和适用以中华人民共和国法律为准。因本服务条款引起的或与本服务条款有关的任何争议，双方应首先协商解决；协商不成的，任何一方均可向有管辖权的人民法院提起诉讼。
          </p>

          <h2 className="text-lg font-semibold mt-6">十、联系方式</h2>
          <p>
            如您对本服务条款有任何疑问，请通过以下方式与我们联系：
          </p>
          <p className="text-muted-foreground">
            客服邮箱：support@emotioncoach.cn
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
