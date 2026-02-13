import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface AdminStatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: string;
  loading?: boolean;
  href?: string;
  subtitle?: string;
}

export function AdminStatCard({ label, value, icon: Icon, accent, loading, href, subtitle }: AdminStatCardProps) {
  const content = (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accent || "bg-primary/10 text-primary"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {loading ? (
          <Skeleton className="h-6 w-12 mt-0.5" />
        ) : (
          <>
            <p className="text-xl font-bold text-foreground">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
