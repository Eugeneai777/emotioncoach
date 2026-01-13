import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeenVoiceCallCTA } from '@/components/teen/TeenVoiceCallCTA';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TeenVoiceChat from '@/components/teen/TeenVoiceChat';
import TeenPersonalization from '@/components/teen/TeenPersonalization';
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";

interface PersonalizationData {
  nickname: string;
  avatar: string;
  greeting: string;
}

export default function TeenChat() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [personalization, setPersonalization] = useState<PersonalizationData | null>(null);

  // Check localStorage for saved personalization
  useEffect(() => {
    if (token) {
      const saved = localStorage.getItem(`teen_personalization_${token}`);
      if (saved) {
        setPersonalization(JSON.parse(saved));
      }
    }
  }, [token]);

  // Validate token and get parent info
  const { data: accessInfo, isLoading, error } = useQuery({
    queryKey: ['teen-access-validate', token],
    queryFn: async () => {
      if (!token) throw new Error('无效的访问链接');

      const { data, error } = await supabase
        .from('teen_access_tokens')
        .select('parent_user_id, teen_nickname, usage_count')
        .eq('access_token', token)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('链接已失效或不存在');

      return data;
    },
    retry: false
  });

  // Update usage count on mount
  useEffect(() => {
    if (accessInfo && token) {
      supabase
        .from('teen_access_tokens')
        .update({ 
          usage_count: (accessInfo.usage_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('access_token', token)
        .then(() => {
          console.log('Usage count updated');
        });
    }
  }, [accessInfo, token]);

  // Handle personalization complete
  const handlePersonalizationComplete = (data: PersonalizationData) => {
    setPersonalization(data);
    setShowPersonalization(false);
    // Save to localStorage
    if (token) {
      localStorage.setItem(`teen_personalization_${token}`, JSON.stringify(data));
    }
  };

  // Get avatar emoji from ID
  const getAvatarEmoji = (avatarId: string) => {
    const avatars: Record<string, string> = {
      star: '⭐', moon: '🌙', cat: '🐱', rabbit: '🐰',
      bear: '🐻', flower: '🌸', cloud: '☁️', rainbow: '🌈'
    };
    return avatars[avatarId] || '⭐';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !accessInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center px-6">
        <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center max-w-sm shadow-lg">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">链接无效</h2>
          <p className="text-muted-foreground text-sm mb-6">
            这个链接可能已过期或不存在，请让爸妈重新生成邀请卡片
          </p>
          <Button
            variant="outline"
            onClick={() => window.close()}
            className="border-violet-200"
          >
            关闭页面
          </Button>
        </div>
      </div>
    );
  }

  // Show personalization flow for first-time users
  if (showPersonalization) {
    return (
      <TeenPersonalization
        initialNickname={accessInfo.teen_nickname || undefined}
        onComplete={handlePersonalizationComplete}
      />
    );
  }

  if (showVoiceChat) {
    return (
      <TeenVoiceChat
        accessToken={token!}
        parentUserId={accessInfo.parent_user_id}
        teenNickname={personalization?.nickname || accessInfo.teen_nickname || undefined}
        customGreeting={personalization?.greeting}
        avatarEmoji={personalization?.avatar ? getAvatarEmoji(personalization.avatar) : undefined}
        onClose={() => setShowVoiceChat(false)}
      />
    );
  }

  const displayName = personalization?.nickname || accessInfo.teen_nickname;
  const avatarEmoji = personalization?.avatar ? getAvatarEmoji(personalization.avatar) : '✨';

  return (
    <>
      <DynamicOGMeta pageKey="teenCoach" />
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="text-center pt-10 px-6">
        <div className="text-4xl mb-3">{avatarEmoji}</div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
          {displayName ? `Hey ${displayName}` : '有劲AI · 懂你版'}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {personalization?.greeting || '这里是你的私密空间，说什么都可以'}
        </p>
      </div>

      {/* Voice CTA */}
      <TeenVoiceCallCTA
        teenNickname={displayName || undefined}
        onVoiceChatClick={() => setShowVoiceChat(true)}
      />

      {/* Personalization button for first-time or edit */}
      <div className="px-6 mt-4">
        {!personalization ? (
          <button
            onClick={() => setShowPersonalization(true)}
            className="w-full py-3 bg-white/60 backdrop-blur rounded-2xl text-sm text-violet-600 hover:bg-white/80 transition-colors"
          >
            ✨ 个性化设置（头像、昵称、问候语）
          </button>
        ) : (
          <div className="bg-white/60 backdrop-blur rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{avatarEmoji}</span>
                <div>
                  <p className="font-medium text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{personalization.greeting}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPersonalization(true)}
                className="text-xs text-violet-500 hover:text-violet-600"
              >
                修改
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feature hints */}
      <div className="px-6 mt-4">
        <div className="bg-white/60 backdrop-blur rounded-2xl p-4 space-y-3">
          {[
            { emoji: '💭', text: '学业压力、人际困扰、情绪低落...' },
            { emoji: '🎙️', text: '语音聊天，像朋友一样倾诉' },
            { emoji: '🌙', text: '24小时在线，随时陪伴' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="text-lg">{item.emoji}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy footer */}
      <div className="fixed bottom-0 left-0 right-0 pb-8 pt-4 bg-gradient-to-t from-violet-50/80 to-transparent">
        <p className="text-xs text-center text-muted-foreground">
          🔒 对话内容绝对保密，父母看不到
        </p>
      </div>
    </div>
    </>
  );
}
