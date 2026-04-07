import React, { useState, useRef } from 'react';
import { generateCardBlob } from '@/utils/shareCardConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Loader2, Share2, ImageIcon, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import TeenInviteShareCard, { CARD_THEMES, CardTheme } from './TeenInviteShareCard';
import ShareImagePreview from '@/components/ui/share-image-preview';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { handleShareWithFallback } from '@/utils/shareUtils';

interface TeenInviteShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper: Detect if running in WeChat or iOS environment
const isWeChatOrIOS = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  const isWeChat = ua.includes('micromessenger');
  const isIOS = /iphone|ipad|ipod/.test(ua);
  return isWeChat || isIOS;
};

const TeenInviteShareDialog: React.FC<TeenInviteShareDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [teenNickname, setTeenNickname] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('purple');
  const [personalMessage, setPersonalMessage] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleCopyLink = async () => {
    if (!parentUserId) return;
    try {
      const url = `${getPromotionDomain()}/xiaojin?from=parent_${parentUserId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "链接已复制" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "复制失败", variant: "destructive" });
    }
  };

  // Get current user ID for link generation
  const { data: parentUserId } = useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    },
    enabled: open,
  });

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
  const { data: accessToken, isLoading: isLoadingToken } = useQuery({
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
    
    setIsGenerating(true);
    try {
      const blob = await generateCardBlob(exportRef, { isWeChat: isWeChatOrIOS(), explicitWidth: 380 });
      
      if (!blob) {
        throw new Error('生成图片失败');
      }

      const result = await handleShareWithFallback(blob, '青少年私密空间-邀请卡.png', {
        title: '有劲AI · 懂你版',
        text: '这是一份给你的私密空间，有心事可以来这里聊聊',
        onShowPreview: (payload) => {
          setPreviewImageUrl(payload.url);
          setShowImagePreview(true);
        },
        onDownload: () => {
          toast({
            title: "图片已生成",
            description: "邀请卡片已保存，发给孩子即可使用",
          });
        },
      });

      if (result.method === 'webshare' && result.success) {
        toast({ title: "分享成功", description: "邀请卡片已分享" });
      } else if (result.cancelled) {
        // User cancelled, no toast needed
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      toast({
        title: "生成失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle closing image preview
  const handleCloseImagePreview = () => {
    setShowImagePreview(false);
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
      setPreviewImageUrl(null);
    }
  };

  // 预设留言选项
  const messagePresets = [
    '爸妈永远爱你，有心事可以和AI聊聊',
    '无论发生什么，我们都在你身边',
    '希望你能找到倾诉的出口，放松心情',
  ];

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
            孩子昵称（可选）
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

        {/* Theme selection */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            选择主题色
          </Label>
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(CARD_THEMES) as CardTheme[]).map((themeKey) => {
              const theme = CARD_THEMES[themeKey];
              const isSelected = selectedTheme === themeKey;
              return (
                <button
                  key={themeKey}
                  onClick={() => setSelectedTheme(themeKey)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${isSelected 
                      ? 'ring-2 ring-offset-2 ring-violet-500 scale-105' 
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }
                  `}
                  style={{
                    background: theme.background,
                    color: theme.primary,
                  }}
                >
                  {theme.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Personal message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm text-muted-foreground">
            个性化留言（可选）
          </Label>
          <Textarea
            id="message"
            placeholder="写一句想对孩子说的话..."
            value={personalMessage}
            onChange={(e) => setPersonalMessage(e.target.value.slice(0, 50))}
            className="border-violet-200 focus:border-violet-400 resize-none h-20"
            maxLength={50}
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {messagePresets.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => setPersonalMessage(msg)}
                  className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors"
                >
                  {msg.slice(0, 8)}...
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{personalMessage.length}/50</span>
          </div>
        </div>

        {/* Preview */}
        {isLoadingToken ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : accessToken ? (
        <div className="flex justify-center overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-pink-50" style={{ height: personalMessage ? '380px' : '360px' }}>
            <div className="transform scale-[0.42] origin-top">
              <TeenInviteShareCard 
                accessToken={accessToken} 
                teenNickname={teenNickname}
                theme={selectedTheme}
                personalMessage={personalMessage}
              />
            </div>
          </div>
        ) : null}

        {/* Hidden export card */}
        <div style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none', minWidth: '380px' }}>
          {accessToken && (
            <TeenInviteShareCard 
              ref={exportRef} 
              accessToken={accessToken}
              teenNickname={teenNickname}
              theme={selectedTheme}
              personalMessage={personalMessage}
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

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateImage}
            disabled={isGenerating || isLoadingToken || !accessToken}
            className="flex-1 h-12 bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 text-white gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : isWeChatOrIOS() ? (
              <>
                <ImageIcon className="w-5 h-5" />
                生成图片
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                生成邀请卡片
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            disabled={!parentUserId}
            className="h-12 px-4"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {isWeChatOrIOS() 
            ? '生成图片后长按保存，或复制链接发给孩子'
            : '生成图片发给孩子，或复制链接分享'
          }
        </p>
      </DialogContent>
      
      {/* Full-screen image preview for WeChat/iOS */}
      <ShareImagePreview
        open={showImagePreview}
        onClose={handleCloseImagePreview}
        imageUrl={previewImageUrl}
        onRegenerate={handleGenerateImage}
        isRegenerating={isGenerating}
      />
    </Dialog>
  );
};

export default TeenInviteShareDialog;
