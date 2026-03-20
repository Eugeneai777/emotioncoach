import React from "react";
import { Helmet } from "react-helmet";
import { MarriageNav } from "@/components/marriage/MarriageNav";
import { MarriageHero } from "@/components/marriage/MarriageHero";
import { MarriagePainPoints } from "@/components/marriage/MarriagePainPoints";
import { MarriageAssessmentCards } from "@/components/marriage/MarriageAssessmentCards";
import { MarriageAIToolCards } from "@/components/marriage/MarriageAIToolCards";
import { MarriageWhyUs } from "@/components/marriage/MarriageWhyUs";
import { MarriageMission } from "@/components/marriage/MarriageMission";
import { MarriageTeam } from "@/components/marriage/MarriageTeam";
import { MarriageNews } from "@/components/marriage/MarriageNews";
import { MarriageSteps } from "@/components/marriage/MarriageSteps";
import { MarriageCTA } from "@/components/marriage/MarriageCTA";
import { MarriageFooter } from "@/components/marriage/MarriageFooter";

const MarriageHome: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>婚因有道 - 婚姻全生命周期服务生态平台</title>
        <meta name="description" content="婚因有道深耕婚姻家庭服务20年，结合AI+大数据技术，让每一对夫妻享受婚姻之旅，助力幸福中国。" />
      </Helmet>
      <div className="min-h-screen bg-white">
        <MarriageHero />
        <MarriagePainPoints />
        <MarriageAssessmentCards />
        <MarriageAIToolCards />
        <MarriageWhyUs />
        <MarriageMission />
        <MarriageTeam />
        <MarriageNews />
        <MarriageSteps />
        <MarriageCTA />
        <MarriageFooter />
        <MarriageNav />
      </div>
    </>
  );
};

export default MarriageHome;
