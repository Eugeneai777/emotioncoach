import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, X, Minus } from "lucide-react";

export interface ComparisonColumn {
  header: string;
  headerClassName?: string;
  highlight?: boolean;
}

export interface ComparisonRow {
  label: string;
  values: (string | boolean | React.ReactNode)[];
}

interface ResponsiveComparisonProps {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  className?: string;
  mobileCardClassName?: string;
}

// 渲染单元格值
const renderCellValue = (value: string | boolean | React.ReactNode) => {
  if (value === true) {
    return <Check className="w-4 h-4 text-green-500 mx-auto" />;
  }
  if (value === false) {
    return <X className="w-4 h-4 text-red-400 mx-auto" />;
  }
  if (value === "half" || value === "半") {
    return <Minus className="w-4 h-4 text-yellow-500 mx-auto" />;
  }
  if (React.isValidElement(value)) {
    return value;
  }
  return <span className="text-xs">{String(value)}</span>;
};

export function ResponsiveComparison({
  columns,
  rows,
  className,
}: ResponsiveComparisonProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* 统一使用横向可滚动表格，移动端固定首列 */}
      <div className="overflow-x-auto -mx-3 px-0">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="border-b border-border/60">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "py-2 px-2 sm:px-3 text-center font-medium text-xs sm:text-sm whitespace-nowrap",
                    idx === 0 && "text-left sticky left-0 bg-card z-10 min-w-[72px] sm:min-w-[100px]",
                    col.highlight && "bg-primary/5 text-primary",
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              // Check if this is a section separator row (all values empty)
              const isSeparator = row.values.every(v => v === "" || v === null || v === undefined);
              
              return (
                <tr
                  key={rowIdx}
                  className={cn(
                    "border-b border-border/30 last:border-0",
                    isSeparator && "bg-muted/20"
                  )}
                >
                  <td
                    className={cn(
                      "py-2 px-2 sm:px-3 font-medium text-foreground text-xs sm:text-sm sticky left-0 bg-card z-10",
                      isSeparator && "bg-muted/20 text-center text-muted-foreground text-[11px] sm:text-xs"
                    )}
                    colSpan={isSeparator ? columns.length : 1}
                  >
                    {row.label}
                  </td>
                  {!isSeparator && row.values.map((val, colIdx) => (
                    <td
                      key={colIdx}
                      className={cn(
                        "py-2 px-2 sm:px-3 text-center text-muted-foreground",
                        columns[colIdx + 1]?.highlight && "bg-primary/5"
                      )}
                    >
                      {renderCellValue(val)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
