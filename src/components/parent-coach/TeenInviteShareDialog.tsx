import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2, Share2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import TeenInviteShareCard from './TeenInviteShareCard';

interface TeenInviteShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeenInviteShareDialog: React.FC<TeenInviteShareDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [teenNickname, setTeenNickname] = useState('');
  const exportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate random token
  const generateToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 8; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  // Fetch existing token or create new one
  const { data: accessToken, isLoading: isLoadingToken, refetch } = useQuery({
    queryKey: ['teen-access-token'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      // Check for existing active token
      const { data: existing } = await supabase
        .from('teen_access_tokens')
        .select('access_token, teen_nickname')
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existing) {
        if (existing.teen_nickname) {
          setTeenNickname(existing.teen_nickname);
        }
        return existing.access_token;
      }

      // Create new token
      const newToken = generateToken();
      const { error } = await supabase
        .from('teen_access_tokens')
        .insert({
          parent_user_id: user.id,
          access_token: newToken,
          teen_nickname: teenNickname || null
        });

      if (error) throw error;
      return newToken;
    },
    enabled: open
  });

  // Update nickname mutation
  const updateNickname = useMutation({
    mutationFn: async (nickname: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { error } = await supabase
        .from('teen_access_tokens')
        .update({ teen_nickname: nickname || null })
        .eq('parent_user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
    }
  });

  // Save nickname on blur
  const handleNicknameBlur = () => {
    if (accessToken) {
      updateNickname.mutate(teenNickname);
    }
  };

  const handleGenerateImage = async () => {
    if (!exportRef.current || !accessToken) return;

    const container = exportRef.current.parentElement;
    
    setIsGenerating(true);
    try {
      // Make element visible temporarily
      if (container) {
        container.style.position = 'fixed';
        container.style.left = '16px';
        container.style.top = '16px';
        container.style.zIndex = '9999';
        container.style.opacity = '1';
        container.style.visibility = 'visible';
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: exportRef.current.scrollWidth,
        height: exportRef.current.scrollHeight,
        windowWidth: exportRef.current.scrollWidth + 100,
        windowHeight: exportRef.current.scrollHeight + 100,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
      });

      // Try system share
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], '青少年私密空间-邀请卡.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: '有劲AI · 懂你版',
              text: '这是一份给你的私密空间，有心事可以来这里聊聊'
            });
            toast({
              title: "分享成功",
              description: "邀请卡片已分享",
            });
            return;
          } catch (e) {
            // User cancelled or share failed
          }
        }
      }

      // Fallback to download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '青少年私密空间-邀请卡.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "图片已生成",
        description: "邀请卡片已保存，发给孩子即可使用",
      });
    } catch (error) {
      console.error('Image generation failed:', error);
      toast({
        title: "生成失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      
      // Hide element
      if (container) {
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.opacity = '0';
        container.style.visibility = 'hidden';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-violet-600" />
            生成邀请卡片
          </DialogTitle>
        </DialogHeader>

        {/* Nickname input */}
        <div className="space-y-2">
          <Label htmlFor="nickname" className="text-sm text-muted-foreground">
            孩子昵称（可选，让卡片更有温度）
          </Label>
          <Input
            id="nickname"
            placeholder="例如：小明、宝贝"
            value={teenNickname}
            onChange={(e) => setTeenNickname(e.target.value)}
            onBlur={handleNicknameBlur}
            className="border-violet-200 focus:border-violet-400"
          />
        </div>

        {/* Preview */}
        {isLoadingToken ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : accessToken ? (
          <div className="flex justify-center overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-pink-50">
            <div className="transform scale-[0.45] origin-top" style={{ marginBottom: '-55%' }}>
              <TeenInviteShareCard 
                accessToken={accessToken} 
                teenNickname={teenNickname}
              />
            </div>
          </div>
        ) : null}

        {/* Hidden export card */}
        <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none">
          {accessToken && (
            <TeenInviteShareCard 
              ref={exportRef} 
              accessToken={accessToken}
              teenNickname={teenNickname}
            />
          )}
        </div>

        {/* Privacy note */}
        <div className="bg-violet-50 p-3 rounded-lg text-sm text-violet-700 space-y-1">
          <p className="font-medium">🔒 隐私保护承诺</p>
          <p className="text-xs text-violet-600">
            孩子的对话内容完全保密，你只能看到使用频率，无法看到任何对话内容
          </p>
        </div>

        {/* Action button */}
        <Button
          onClick={handleGenerateImage}
          disabled={isGenerating || isLoadingToken || !accessToken}
          className="w-full h-12 bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 text-white gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              生成邀请卡片
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          生成图片发给孩子，扫码即可开始私密对话
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default TeenInviteShareDialog;
