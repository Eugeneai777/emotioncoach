import React from "react";
import { cn } from "@/lib/utils";
import { AwakeningDimension, InputMode } from "@/config/awakeningConfig";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface AwakeningInputFormProps {
  dimension: AwakeningDimension;
  inputMode: InputMode;
  value1: string;
  value2: string;
  detailedValue: string;
  onChange1: (value: string) => void;
  onChange2: (value: string) => void;
  onDetailedChange: (value: string) => void;
}

const AwakeningInputForm: React.FC<AwakeningInputFormProps> = ({
  dimension,
  inputMode,
  value1,
  value2,
  detailedValue,
  onChange1,
  onChange2,
  onDetailedChange
}) => {
  const { templateParts } = dimension;

  if (inputMode === 'detailed') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          详细描述你此刻的状态和想法...
        </p>
        <Textarea
          value={detailedValue}
          onChange={(e) => onDetailedChange(e.target.value)}
          placeholder={`例如：${dimension.template.replace(/___/g, '...')}`}
          className="min-h-[120px] resize-none"
          autoFocus
        />
      </div>
    );
  }

  // Template mode (60秒)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-base">
        <span className="text-foreground">{templateParts.prefix}</span>
        <Input
          value={value1}
          onChange={(e) => onChange1(e.target.value)}
          placeholder={templateParts.placeholder1}
          className="w-auto min-w-[120px] max-w-[200px] inline-block text-center"
          autoFocus
        />
        {templateParts.middle && (
          <>
            <span className="text-foreground">{templateParts.middle}</span>
            <Input
              value={value2}
              onChange={(e) => onChange2(e.target.value)}
              placeholder={templateParts.placeholder2}
              className="w-auto min-w-[120px] max-w-[200px] inline-block text-center"
            />
          </>
        )}
        {templateParts.suffix && (
          <span className="text-foreground">{templateParts.suffix}</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        可以只填前半句，或写得更详细
      </p>
    </div>
  );
};

export default AwakeningInputForm;
