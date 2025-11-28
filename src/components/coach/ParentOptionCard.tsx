import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ParentOptionCardProps {
  number: number;
  content: string;
  selected?: boolean;
  onClick: () => void;
}

export const ParentOptionCard = ({ number, content, selected, onClick }: ParentOptionCardProps) => {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-md",
        selected ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {number}
        </div>
        <p className="text-sm leading-relaxed flex-1">{content}</p>
      </div>
    </Card>
  );
};