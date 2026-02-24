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
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50" style={{ WebkitOverflowScrolling: 'touch' as any }}>
      <DynamicOGMeta pageKey="aliveCheck" />
      
      {/* 装饰性背景元素已移除以优化手机性能 */}

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
