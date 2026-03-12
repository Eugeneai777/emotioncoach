import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import UsAIHero from "@/components/us-ai/UsAIHero";
import UsAIToolCards from "@/components/us-ai/UsAIToolCards";
import UsAIAssessment from "@/components/us-ai/UsAIAssessment";
import UsAIDailyCard from "@/components/us-ai/UsAIDailyCard";
import UsAICalmButton from "@/components/us-ai/UsAICalmButton";
import UsAICTA from "@/components/us-ai/UsAICTA";
import UsAIUpgrade from "@/components/us-ai/UsAIUpgrade";

const UsAI = () => {
  const navigate = useNavigate();
  const toolsRef = useRef<HTMLDivElement>(null);

  const scrollToTools = () => toolsRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-usai-beige pb-20">
      <Helmet>
        <title>我们AI - 两个人，更懂彼此</title>
        <meta name="description" content="专为情侣和夫妻设计的AI关系助手，帮助两个人更好沟通、理解情绪、修复冲突。" />
      </Helmet>

      <UsAIHero
        onStart={() => navigate("/us-ai/tool?type=chat")}
        onLearnMore={scrollToTools}
      />

      <div ref={toolsRef} className="space-y-8">
        <UsAIToolCards />
        <UsAIAssessment onStart={() => navigate("/us-ai/tool?type=chat")} />
        <UsAIDailyCard />
        <UsAICalmButton />
        <UsAIUpgrade />
        <UsAICTA onStart={() => navigate("/us-ai/tool?type=chat")} />
      </div>
    </div>
  );
};

export default UsAI;
