import { ReactNode } from "react";

interface AdminTableContainerProps {
  minWidth?: number;
  children: ReactNode;
}

export function AdminTableContainer({ minWidth = 800, children }: AdminTableContainerProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${minWidth}px` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
