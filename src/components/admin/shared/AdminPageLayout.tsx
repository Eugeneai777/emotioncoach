import { ReactNode } from "react";

interface AdminPageLayoutProps {
  title: React.ReactNode;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminPageLayout({ title, description, actions, children }: AdminPageLayoutProps) {
  return (
    <div className="w-full max-w-full min-w-0 shrink overflow-hidden space-y-6">
      <div className="flex w-full min-w-0 items-start justify-between gap-4 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-hidden">
          <h1 className="text-xl font-bold text-foreground break-words">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 break-words">{description}</p>
          )}
        </div>
        {actions && <div className="flex min-w-0 shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
