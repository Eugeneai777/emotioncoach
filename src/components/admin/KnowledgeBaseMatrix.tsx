import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Plus, Eye, Edit } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  doc_type: string;
  coach_key: string | null;
  camp_type: string | null;
  keywords: string[];
  is_active: boolean;
}

interface CoachColumn {
  key: string;
  name: string;
  emoji: string;
  type: 'coach' | 'tool' | 'camp';
}

interface DocTypeRow {
  type: string;
  label: string;
  description: string;
}

interface KnowledgeBaseMatrixProps {
  items: KnowledgeItem[];
  coaches: CoachColumn[];
  docTypes: DocTypeRow[];
  onCellClick: (docType: string, coachKey: string | null, campType: string | null, existingItem?: KnowledgeItem) => void;
  onViewItem: (item: KnowledgeItem) => void;
}

const KnowledgeBaseMatrix = ({ 
  items, 
  coaches, 
  docTypes, 
  onCellClick,
  onViewItem 
}: KnowledgeBaseMatrixProps) => {
  
  // Find item for a specific cell
  const findItem = (docType: string, column: CoachColumn): KnowledgeItem | undefined => {
    return items.find(item => {
      if (item.doc_type !== docType) return false;
      
      if (column.type === 'coach' || column.type === 'tool') {
        return item.coach_key === column.key;
      } else if (column.type === 'camp') {
        return item.camp_type === column.key;
      }
      return false;
    });
  };

  // Get content length for display
  const getContentLength = (content: string): string => {
    const length = content?.length || 0;
    if (length === 0) return '';
    if (length < 100) return `${length}字`;
    if (length < 1000) return `${Math.round(length / 100) * 100}+字`;
    return `${(length / 1000).toFixed(1)}k字`;
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 知识库覆盖矩阵
            <Badge variant="secondary" className="ml-2">
              {items.length} 条文档
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left border-b border-border bg-muted/50 sticky left-0 z-10 min-w-[120px]">
                    文档类型
                  </th>
                  {coaches.map((coach) => (
                    <th 
                      key={coach.key} 
                      className="p-2 text-center border-b border-border bg-muted/50 min-w-[100px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg">{coach.emoji}</span>
                        <span className="text-xs font-medium truncate max-w-[90px]">
                          {coach.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1">
                          {coach.type === 'coach' ? '教练' : coach.type === 'tool' ? '工具' : '训练营'}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docTypes.map((docType) => (
                  <tr key={docType.type} className="hover:bg-muted/30">
                    <td className="p-2 border-b border-border bg-background sticky left-0 z-10">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col">
                            <span className="font-medium">{docType.label}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[110px]">
                              {docType.type}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="max-w-[200px]">{docType.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {coaches.map((coach) => {
                      const item = findItem(docType.type, coach);
                      const hasContent = !!item;
                      
                      return (
                        <td 
                          key={`${docType.type}-${coach.key}`} 
                          className="p-1 border-b border-border text-center"
                        >
                          {hasContent ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className="inline-flex flex-col items-center gap-0.5 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors group"
                                  onClick={() => onCellClick(docType.type, coach.type === 'camp' ? null : coach.key, coach.type === 'camp' ? coach.key : null, item)}
                                >
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span className="text-[10px] text-green-700 dark:text-green-400">
                                    {getContentLength(item.content)}
                                  </span>
                                  <div className="hidden group-hover:flex gap-1 mt-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onViewItem(item);
                                      }}
                                    >
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onCellClick(docType.type, coach.type === 'camp' ? null : coach.key, coach.type === 'camp' ? coach.key : null, item);
                                      }}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[300px]">
                                <p className="font-medium mb-1">{item.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-3">
                                  {item.content?.substring(0, 150)}...
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="inline-flex items-center justify-center p-2 rounded-lg bg-muted/30 border border-dashed border-muted-foreground/30 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors group"
                                  onClick={() => onCellClick(docType.type, coach.type === 'camp' ? null : coach.key, coach.type === 'camp' ? coach.key : null)}
                                >
                                  <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>点击添加 {coach.name} 的 {docType.label}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-green-50 border border-green-200 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span>有内容</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-muted/30 border border-dashed border-muted-foreground/30 flex items-center justify-center">
                <Plus className="w-3 h-3 text-muted-foreground" />
              </div>
              <span>待添加</span>
            </div>
            <div className="flex items-center gap-2">
              <span>点击单元格可查看/编辑内容</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default KnowledgeBaseMatrix;
