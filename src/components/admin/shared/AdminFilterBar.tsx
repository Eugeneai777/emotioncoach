import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface AdminFilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  totalCount?: number;
  children?: ReactNode;
}

export function AdminFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "搜索…",
  totalCount,
  children,
}: AdminFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onSearchChange !== undefined && (
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      )}
      {children}
      {totalCount !== undefined && (
        <span className="text-xs text-muted-foreground ml-auto">
          共 {totalCount} 条
        </span>
      )}
    </div>
  );
}
