import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Crown, Sparkles } from "lucide-react";
import { useCoachPriceTiers, type CoachPriceTier } from "@/hooks/useCoachPriceTiers";

export type ExperienceBucket = "lt3" | "3to5" | "5to10" | "gte10";

export interface ExperienceTierData {
  experienceBucket: ExperienceBucket | "";
  preferredTierId: string;
  preferredTierReason: string;
}

interface Props {
  data: ExperienceTierData;
  onChange: (d: ExperienceTierData) => void;
  onNext: () => void;
  onBack: () => void;
  hasCertifications: boolean;
}

const BUCKET_OPTIONS: { value: ExperienceBucket; label: string }[] = [
  { value: "lt3", label: "3年以下" },
  { value: "3to5", label: "3-5年" },
  { value: "5to10", label: "5-10年" },
  { value: "gte10", label: "10年以上" },
];

/** 根据经验+持证算推荐档位（按 tier_level 1=金 2=高 3=认证 4=新锐） */
export function suggestTierLevel(
  bucket: ExperienceBucket | "",
  hasCert: boolean,
): number {
  if (bucket === "gte10" && hasCert) return 1; // 金牌
  if (bucket === "5to10") return 2; // 高级
  if (bucket === "3to5") return 3; // 认证
  return 4; // 新锐
}

export function ExperienceTierStep({
  data,
  onChange,
  onNext,
  onBack,
  hasCertifications,
}: Props) {
  const { data: tiers = [] } = useCoachPriceTiers();
  const [showPreferred, setShowPreferred] = useState(!!data.preferredTierId);

  const suggestedLevel = data.experienceBucket
    ? suggestTierLevel(data.experienceBucket, hasCertifications)
    : null;
  const suggestedTier =
    suggestedLevel != null
      ? tiers.find((t) => t.tier_level === suggestedLevel)
      : undefined;

  const canNext = !!data.experienceBucket;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">经验与档位</h3>
        <p className="text-sm text-muted-foreground">
          填写从业年限，系统会根据资质给出推荐档位；如有偏好可在下方说明，最终由管理员确认。
        </p>
      </div>

      <div className="space-y-3">
        <Label>从业年限 *</Label>
        <RadioGroup
          value={data.experienceBucket}
          onValueChange={(v) =>
            onChange({ ...data, experienceBucket: v as ExperienceBucket })
          }
          className="grid grid-cols-2 gap-2"
        >
          {BUCKET_OPTIONS.map((o) => (
            <Label
              key={o.value}
              htmlFor={`bk-${o.value}`}
              className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition-colors ${
                data.experienceBucket === o.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value={o.value} id={`bk-${o.value}`} />
              <span className="text-sm">{o.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {suggestedTier && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm text-amber-700 mb-1">系统推荐档位</div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-900">
                  {suggestedTier.tier_name}
                </span>
                <span className="text-primary font-semibold">
                  ¥{suggestedTier.price}/60分钟
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                {suggestedTier.description}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                这是建议价，最终由管理员审核确认。如对该档位有异议可在下方说明。
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {!showPreferred ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreferred(true)}
            className="text-muted-foreground"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            我希望申请其他档位（可选）
          </Button>
        ) : (
          <>
            <Label>期望档位（可选）</Label>
            <RadioGroup
              value={data.preferredTierId}
              onValueChange={(v) => onChange({ ...data, preferredTierId: v })}
              className="space-y-2"
            >
              {tiers.map((t: CoachPriceTier) => (
                <Label
                  key={t.id}
                  htmlFor={`tier-${t.id}`}
                  className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer ${
                    data.preferredTierId === t.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <RadioGroupItem value={t.id} id={`tier-${t.id}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{t.tier_name}</span>
                      <span className="text-primary text-sm">¥{t.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.description}
                    </p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
            <Textarea
              value={data.preferredTierReason}
              onChange={(e) =>
                onChange({ ...data, preferredTierReason: e.target.value })
              }
              placeholder="一句话说明你希望该档位的理由（管理员审核会参考）"
              maxLength={200}
              className="min-h-[60px]"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowPreferred(false);
                onChange({
                  ...data,
                  preferredTierId: "",
                  preferredTierReason: "",
                });
              }}
              className="text-muted-foreground"
            >
              清除偏好
            </Button>
          </>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          上一步
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="flex-1"
        >
          下一步
        </Button>
      </div>
    </div>
  );
}
