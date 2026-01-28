import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BasicInfoTab } from "./BasicInfoTab";
import { PricingTab } from "./PricingTab";
import { BenefitsEditor } from "./BenefitsEditor";
import { StagesEditor } from "./StagesEditor";
import type { Database, Json } from "@/integrations/supabase/types";

type CampTemplateRow = Database["public"]["Tables"]["camp_templates"]["Row"];

export interface CampStageData {
  stage: number;
  title: string;
  lessons: string[];
}

interface CampEditDialogProps {
  camp: CampTemplateRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export interface CampFormData {
  camp_name: string;
  camp_subtitle: string;
  description: string;
  icon: string;
  duration_days: number;
  category: string;
  is_active: boolean;
  price: number;
  original_price: number;
  price_note: string;
  benefits: string[];
  stages: CampStageData[];
  display_order: number;
}

function parseStages(stages: Json | null): CampStageData[] {
  if (!stages || !Array.isArray(stages)) return [];
  return stages.map((s: any) => ({
    stage: s.stage || 0,
    title: s.title || "",
    lessons: Array.isArray(s.lessons) ? s.lessons : [],
  }));
}

function parseBenefits(benefits: Json | null): string[] {
  if (!benefits || !Array.isArray(benefits)) return [];
  return benefits.filter((b): b is string => typeof b === "string");
}

export function CampEditDialog({
  camp,
  open,
  onOpenChange,
  onClose,
}: CampEditDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState<CampFormData>({
    camp_name: "",
    camp_subtitle: "",
    description: "",
    icon: "🏕️",
    duration_days: 21,
    category: "youjin",
    is_active: true,
    price: 0,
    original_price: 0,
    price_note: "",
    benefits: [],
    stages: [],
    display_order: 0,
  });

  useEffect(() => {
    if (camp) {
      setFormData({
        camp_name: camp.camp_name || "",
        camp_subtitle: camp.camp_subtitle || "",
        description: camp.description || "",
        icon: camp.icon || "🏕️",
        duration_days: camp.duration_days || 21,
        category: camp.category || "youjin",
        is_active: camp.is_active ?? true,
        price: camp.price || 0,
        original_price: camp.original_price || 0,
        price_note: camp.price_note || "",
        benefits: parseBenefits(camp.benefits),
        stages: parseStages(camp.stages),
        display_order: camp.display_order || 0,
      });
    }
  }, [camp]);

  const updateMutation = useMutation({
    mutationFn: async (data: CampFormData) => {
      if (!camp) return;

      const { error } = await supabase
        .from("camp_templates")
        .update({
          camp_name: data.camp_name,
          camp_subtitle: data.camp_subtitle,
          description: data.description,
          icon: data.icon,
          duration_days: data.duration_days,
          category: data.category,
          is_active: data.is_active,
          price: data.price,
          original_price: data.original_price,
          price_note: data.price_note,
          benefits: data.benefits as unknown as Json,
          stages: data.stages as unknown as Json,
          display_order: data.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", camp.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camp-templates"] });
      toast.success("训练营已更新");
      onClose();
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("更新失败");
    },
  });

  const handleSave = () => {
    if (!formData.camp_name.trim()) {
      toast.error("请填写训练营名称");
      return;
    }
    updateMutation.mutate(formData);
  };

  const updateFormData = (updates: Partial<CampFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            编辑训练营: {camp?.camp_name || "新训练营"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">基础信息</TabsTrigger>
            <TabsTrigger value="pricing">价格设置</TabsTrigger>
            <TabsTrigger value="benefits">权益配置</TabsTrigger>
            <TabsTrigger value="stages">阶段课程</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            <BasicInfoTab formData={formData} updateFormData={updateFormData} />
          </TabsContent>

          <TabsContent value="pricing" className="mt-4">
            <PricingTab formData={formData} updateFormData={updateFormData} />
          </TabsContent>

          <TabsContent value="benefits" className="mt-4">
            <BenefitsEditor
              benefits={formData.benefits}
              onChange={(benefits) => updateFormData({ benefits })}
            />
          </TabsContent>

          <TabsContent value="stages" className="mt-4">
            <StagesEditor
              stages={formData.stages}
              onChange={(stages) => updateFormData({ stages })}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
