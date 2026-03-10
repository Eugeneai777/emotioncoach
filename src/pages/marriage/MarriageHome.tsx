import React from "react";
import { Helmet } from "react-helmet";
import { MarriageNav } from "@/components/marriage/MarriageNav";
import { MarriageHero } from "@/components/marriage/MarriageHero";
import { MarriagePainPoints } from "@/components/marriage/MarriagePainPoints";
import { MarriageAssessmentCards } from "@/components/marriage/MarriageAssessmentCards";
import { MarriageAIToolCards } from "@/components/marriage/MarriageAIToolCards";
import { MarriageWhyUs } from "@/components/marriage/MarriageWhyUs";
import { MarriageSteps } from "@/components/marriage/MarriageSteps";
import { MarriageCTA } from "@/components/marriage/MarriageCTA";
import { MarriageFooter } from "@/components/marriage/MarriageFooter";

const MarriageHome: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>婚因有道 - AI婚姻关系测评与修复</title>
        <meta name="description" content="婚因有道深耕婚姻家庭服务20年，结合AI测评与专业咨询，帮助夫妻更早发现问题、更有效修复关系。" />
      </Helmet>
      <div className="min-h-screen bg-white">
        <MarriageHero />
        <MarriagePainPoints />
        <MarriageAssessmentCards />
        <MarriageAIToolCards />
        <MarriageWhyUs />
        <MarriageSteps />
        <MarriageCTA />
        <MarriageFooter />
        <MarriageNav />
      </div>
    </>
  );
};

export default MarriageHome;
