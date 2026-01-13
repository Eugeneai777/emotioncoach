import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProductLineCategory } from "./OGCategoryManager";

interface OGCardCategorySelectorProps {
  currentCategoryId: string | null;
  autoCategoryId: string | null;
  categories: ProductLineCategory[];
  onSelect: (categoryId: string | null) => void;
  disabled?: boolean;
}

export function OGCardCategorySelector({
  currentCategoryId,
  autoCategoryId,
  categories,
  onSelect,
  disabled = false,
}: OGCardCategorySelectorProps) {
  const [open, setOpen] = useState(false);
  
  // 确定显示的分类
  const displayCategoryId = currentCategoryId || autoCategoryId;
  const displayCategory = categories.find(c => c.id === displayCategoryId);
  const isManual = !!currentCategoryId;
  
  const handleSelect = (categoryId: string) => {
    onSelect(categoryId);
    setOpen(false);
  };
  
  const handleClear = () => {
    onSelect(null);
    setOpen(false);
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 px-2 gap-1 text-xs font-normal",
            isManual 
              ? "bg-primary/10 text-primary hover:bg-primary/20" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {displayCategory ? (
            <>
              <span>{displayCategory.emoji}</span>
              <span className="max-w-[80px] truncate">{displayCategory.label}</span>
              {isManual && <Check className="h-3 w-3 ml-0.5" />}
            </>
          ) : (
            <span className="text-muted-foreground">未分类</span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            onClick={() => handleSelect(category.id)}
            className="flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </span>
            {displayCategoryId === category.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        {isManual && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleClear}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              清除手动分类
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
