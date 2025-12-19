import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, X, ArrowLeft, Clock, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Service {
  serviceName: string;
  description: string;
  durationMinutes: number;
  price: number;
}

interface ServicesStepProps {
  data: Service[];
  onChange: (data: Service[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

export function ServicesStep({ data, onChange, onNext, onBack }: ServicesStepProps) {
  const addService = () => {
    onChange([
      ...data,
      {
        serviceName: "",
        description: "",
        durationMinutes: 60,
        price: 0, // Will be set by admin
      },
    ]);
  };

  const removeService = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateService = (index: number, updates: Partial<Service>) => {
    onChange(data.map((service, i) => (i === index ? { ...service, ...updates } : service)));
  };

  const isValid =
    data.length > 0 &&
    data.every((service) => service.serviceName.trim() !== "");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">服务项目</h2>
        <p className="text-sm text-muted-foreground mt-1">
          设置您提供的咨询服务项目
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          服务价格将由平台审核后根据您的资质和经验统一设定，分为4个档次：¥2000、¥1200、¥600、¥300
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {data.map((service, index) => (
          <Card key={index} className="p-4 space-y-4 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => removeService(index)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="space-y-2">
              <Label>服务名称 *</Label>
              <Input
                placeholder="如：一对一情绪疏导、亲子关系咨询"
                value={service.serviceName}
                onChange={(e) =>
                  updateService(index, { serviceName: e.target.value })
                }
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label>服务描述</Label>
              <Textarea
                placeholder="描述服务内容、适用人群、预期效果..."
                value={service.description}
                onChange={(e) =>
                  updateService(index, { description: e.target.value })
                }
                className="min-h-[80px]"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                时长（分钟）
              </Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={service.durationMinutes}
                onChange={(e) =>
                  updateService(index, {
                    durationMinutes: parseInt(e.target.value),
                  })
                }
              >
                {DURATION_OPTIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {duration} 分钟
                  </option>
                ))}
              </select>
            </div>
          </Card>
        ))}

        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={addService}
        >
          <Plus className="h-4 w-4 mr-2" />
          添加服务项目
        </Button>
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>请添加至少一个服务项目</p>
          <p className="text-sm">设置您提供的咨询服务</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="h-4 w-4 mr-2" />
          上一步
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="flex-1">
          下一步：确认提交
        </Button>
      </div>
    </div>
  );
}
