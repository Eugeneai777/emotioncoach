import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, X, Plus } from "lucide-react";

interface CoachEditDialogProps {
  coachId: string;
  onClose: () => void;
}

export function CoachEditDialog({ coachId, onClose }: CoachEditDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    bio: "",
    experience_years: 0,
    specialties: [] as string[],
    phone: ""
  });
  const [newSpecialty, setNewSpecialty] = useState("");

  const { data: coach, isLoading } = useQuery({
    queryKey: ["human-coach-edit", coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("human_coaches")
        .select("*")
        .eq("id", coachId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (coach) {
      setFormData({
        name: coach.name || "",
        title: coach.title || "",
        bio: coach.bio || "",
        experience_years: coach.experience_years || 0,
        specialties: coach.specialties || [],
        phone: (coach as any).phone || ""
      });
    }
  }, [coach]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("human_coaches")
        .update({
          name: formData.name,
          title: formData.title,
          bio: formData.bio,
          experience_years: formData.experience_years,
          specialties: formData.specialties,
          phone: formData.phone,
          updated_at: new Date().toISOString()
        })
        .eq("id", coachId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["human-coaches"] });
      queryClient.invalidateQueries({ queryKey: ["human-coach-edit", coachId] });
      toast.success("教练信息已更新");
      onClose();
    },
    onError: (error) => {
      toast.error("更新失败: " + error.message);
    }
  });

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty)
    }));
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑教练信息</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>从业年限</Label>
              <Input
                type="number"
                min={0}
                value={formData.experience_years}
                onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>头衔</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="如：国家二级心理咨询师"
            />
          </div>

          <div className="space-y-2">
            <Label>联系电话</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>擅长领域</Label>
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="输入领域名称"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
              />
              <Button type="button" variant="outline" onClick={addSpecialty}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {specialty}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(specialty)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>个人简介</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            保存更改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
