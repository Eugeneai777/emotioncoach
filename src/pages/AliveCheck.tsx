import React from "react";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AliveCheck as AliveCheckComponent } from "@/components/tools/AliveCheck";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

const AliveCheck = () => {
  const navigate = useNavigate();
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50">
      <DynamicOGMeta pageKey="aliveCheck" />
      
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-pink-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-fuchsia-200/20 rounded-full blur-3xl" />
      </div>

      <PageHeader title="💗 死了吗" showBack rightActions={
        <Button variant="ghost" size="icon" onClick={() => navigate("/energy-studio-intro")}>
          <Info className="w-5 h-5" />
        </Button>
      } />

      {/* 主内容区 */}
      <div className="relative z-10 px-4 sm:px-6 pb-8">
        <AliveCheckComponent />
      </div>

    </div>
  );
};

export default AliveCheck;
