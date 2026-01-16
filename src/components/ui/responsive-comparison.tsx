import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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
  mobileCardClassName,
}: ResponsiveComparisonProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* 桌面端：表格布局 */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "py-2 px-3 text-center font-medium",
                    idx === 0 && "text-left",
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
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b last:border-0">
                <td className="py-2 px-3 font-medium text-foreground whitespace-nowrap">
                  {row.label}
                </td>
                {row.values.map((val, colIdx) => (
                  <td
                    key={colIdx}
                    className={cn(
                      "py-2 px-3 text-center text-muted-foreground",
                      columns[colIdx + 1]?.highlight && "bg-primary/5"
                    )}
                  >
                    {renderCellValue(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 移动端：堆叠卡片布局 */}
      <div className="sm:hidden space-y-3">
        {rows.map((row, rowIdx) => (
          <Card
            key={rowIdx}
            className={cn(
              "border border-border/50 shadow-sm",
              mobileCardClassName
            )}
          >
            <CardContent className="p-3 space-y-2">
              {/* 行标签 */}
              <div className="text-sm font-semibold text-foreground border-b pb-2">
                {row.label}
              </div>
              {/* 各列值 */}
              <div className="grid gap-1.5">
                {row.values.map((val, colIdx) => {
                  const column = columns[colIdx + 1]; // +1 因为第一列是标签列
                  return (
                    <div
                      key={colIdx}
                      className={cn(
                        "flex items-center justify-between py-1.5 px-2 rounded-md",
                        column?.highlight
                          ? "bg-primary/10"
                          : "bg-muted/30"
                      )}
                    >
                      <span className="text-xs text-muted-foreground">
                        {column?.header}
                      </span>
                      <div className="font-medium">
                        {renderCellValue(val)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
