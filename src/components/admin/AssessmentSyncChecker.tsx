import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Plus, EyeOff, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const IGNORED_KEYS_STORAGE = "sync-ignored-keys";

function getIgnoredKeys(): string[] {
  try {
    return JSON.parse(localStorage.getItem(IGNORED_KEYS_STORAGE) || "[]");
  } catch {
    return [];
  }
}

function setIgnoredKeys(keys: string[]) {
  localStorage.setItem(IGNORED_KEYS_STORAGE, JSON.stringify(keys));
}

interface Props {
  onSynced?: () => void;
}

export function AssessmentSyncChecker({ onSynced }: Props) {
  const queryClient = useQueryClient();
  const [ignoredKeys, setIgnoredKeysState] = useState<string[]>(getIgnoredKeys);

  // 1. Active assessment templates
  const { data: templates } = useQuery({
    queryKey: ["sync-check-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_assessment_templates" as any)
        .select("assessment_key, title, emoji")
        .eq("is_active", true);
      if (error) throw error;
      return (data || []) as { assessment_key: string; title: string; emoji: string }[];
    },
    staleTime: 30_000,
  });

  // 2. Existing experience items
  const { data: experienceItems } = useQuery({
    queryKey: ["sync-check-experience"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_experience_items" as any)
        .select("package_key");
      if (error) throw error;
      return (data || []) as { package_key: string }[];
    },
    staleTime: 30_000,
  });

  // 3. Existing energy studio tools
  const { data: studioTools } = useQuery({
    queryKey: ["sync-check-studio-tools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("energy_studio_tools" as any)
        .select("tool_id");
      if (error) throw error;
      return (data || []) as { tool_id: string }[];
    },
    staleTime: 30_000,
  });

  // Compare
  const { missingExperience, missingStudio } = useMemo(() => {
    if (!templates) return { missingExperience: [], missingStudio: [] };

    const expKeys = new Set(experienceItems?.map((e) => e.package_key) || []);
    const studioKeys = new Set(studioTools?.map((t) => t.tool_id) || []);

    const missingExp = templates.filter(
      (t) => !expKeys.has(t.assessment_key) && !ignoredKeys.includes(`exp:${t.assessment_key}`)
    );
    const missingStd = templates.filter(
      (t) => !studioKeys.has(t.assessment_key) && !ignoredKeys.includes(`studio:${t.assessment_key}`)
    );

    return { missingExperience: missingExp, missingStudio: missingStd };
  }, [templates, experienceItems, studioTools, ignoredKeys]);

  // Add to partner_experience_items
  const addExperienceMutation = useMutation({
    mutationFn: async (t: { assessment_key: string; title: string; emoji: string }) => {
      const { error } = await supabase
        .from("partner_experience_items" as any)
        .insert({
          item_key: t.assessment_key,
          package_key: t.assessment_key,
          name: t.title,
          value: "",
          icon: t.emoji,
          description: t.title,
          features: [],
          color_theme: "blue",
          category: "assessment",
          display_order: 99,
          is_active: true,
        } as any);
      if (error) throw error;
    },
    onSuccess: (_, t) => {
      toast.success(`已添加「${t.title}」到产品中心`);
      queryClient.invalidateQueries({ queryKey: ["sync-check-experience"] });
      queryClient.invalidateQueries({ queryKey: ["admin-experience-items"] });
      queryClient.invalidateQueries({ queryKey: ["experience-package-items"] });
      onSynced?.();
    },
    onError: (err: any) => toast.error(err.message || "添加失败"),
  });

  // Add to energy_studio_tools
  const addStudioMutation = useMutation({
    mutationFn: async (t: { assessment_key: string; title: string; emoji: string }) => {
      const { error } = await supabase
        .from("energy_studio_tools" as any)
        .insert({
          tool_id: t.assessment_key,
          title: t.title,
          description: t.title,
          icon: t.emoji,
          gradient: "from-primary/20 to-primary/5",
          category: "exploration",
          is_active: true,
          display_order: 99,
        } as any);
      if (error) throw error;
    },
    onSuccess: (_, t) => {
      toast.success(`已添加「${t.title}」到生活馆`);
      queryClient.invalidateQueries({ queryKey: ["sync-check-studio-tools"] });
      onSynced?.();
    },
    onError: (err: any) => toast.error(err.message || "添加失败"),
  });

  const handleIgnore = (prefix: string, key: string) => {
    const newKeys = [...ignoredKeys, `${prefix}:${key}`];
    setIgnoredKeys(newKeys);
    setIgnoredKeysState(newKeys);
  };

  const handleResetIgnored = () => {
    setIgnoredKeys([]);
    setIgnoredKeysState([]);
    toast.success("已重置忽略列表");
  };

  const totalMissing = missingExperience.length + missingStudio.length;

  if (!templates) return null;

  if (totalMissing === 0) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">所有测评已同步</AlertTitle>
        <AlertDescription className="text-green-700 flex items-center justify-between">
          <span>{templates.length} 个活跃测评均已注册到产品中心和生活馆</span>
          {ignoredKeys.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleResetIgnored} className="text-green-700">
              <RotateCcw className="w-3 h-3 mr-1" />
              重置忽略 ({ignoredKeys.length})
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 flex items-center justify-between">
        <span>发现 {totalMissing} 个未同步测评</span>
        {ignoredKeys.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleResetIgnored} className="text-amber-700">
            <RotateCcw className="w-3 h-3 mr-1" />
            重置忽略 ({ignoredKeys.length})
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-3 space-y-3">
        {/* Missing from experience items */}
        {missingExperience.length > 0 && (
          <div>
            <p className="text-sm font-medium text-amber-800 mb-2">缺少产品中心注册：</p>
            <div className="space-y-2">
              {missingExperience.map((t) => (
                <div
                  key={`exp-${t.assessment_key}`}
                  className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{t.emoji}</span>
                    <span className="font-medium text-sm">{t.title}</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {t.assessment_key}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => addExperienceMutation.mutate(t)}
                      disabled={addExperienceMutation.isPending}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      添加到产品中心
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => handleIgnore("exp", t.assessment_key)}
                    >
                      <EyeOff className="w-3 h-3 mr-1" />
                      跳过
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing from studio tools */}
        {missingStudio.length > 0 && (
          <div>
            <p className="text-sm font-medium text-amber-800 mb-2">缺少生活馆注册：</p>
            <div className="space-y-2">
              {missingStudio.map((t) => (
                <div
                  key={`studio-${t.assessment_key}`}
                  className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{t.emoji}</span>
                    <span className="font-medium text-sm">{t.title}</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {t.assessment_key}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => addStudioMutation.mutate(t)}
                      disabled={addStudioMutation.isPending}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      添加到生活馆
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => handleIgnore("studio", t.assessment_key)}
                    >
                      <EyeOff className="w-3 h-3 mr-1" />
                      跳过
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
