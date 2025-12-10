import * as React from "react";
import { TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ResponsiveTabsTriggerProps 
  extends React.ComponentPropsWithoutRef<typeof TabsTrigger> {
  /** 桌面端显示的完整文字 */
  label: string;
  /** 移动端显示的短文字（可选，默认取 label 前2个字符）*/
  shortLabel?: string;
  /** 图标（可选）*/
  icon?: React.ReactNode;
}

const ResponsiveTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsTrigger>,
  ResponsiveTabsTriggerProps
>(({ label, shortLabel, icon, className, ...props }, ref) => {
  // 自动生成短文字：取前2个字符，或使用自定义短文字
  const mobileLabel = shortLabel || label.slice(0, 2);
  
  return (
    <TabsTrigger
      ref={ref}
      className={cn("text-xs md:text-sm", className)}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      <span className="hidden sm:inline">{label}</span>
      <span className="inline sm:hidden">{mobileLabel}</span>
    </TabsTrigger>
  );
});

ResponsiveTabsTrigger.displayName = "ResponsiveTabsTrigger";

export { ResponsiveTabsTrigger };
