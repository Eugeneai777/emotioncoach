import { ReactNode } from "react";

interface AdminPageLayoutProps {
  title: React.ReactNode;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminPageLayout({ title, description, actions, children }: AdminPageLayoutProps) {
  return (
    <div className="space-y-6 w-full max-w-full min-w-0 overflow-hidden">
      <div className="flex items-start justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground break-words">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 break-words">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
